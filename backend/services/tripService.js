import { Trip } from '../models/Trip.js';
import { Bus } from '../models/Bus.js';
import { Route } from '../models/Route.js';
import { ApiError } from '../utils/apiError.js';
import { projectPointOnRoute, calculateRemainingDistanceKm } from '../utils/geoUtils.js';
import { ENV } from '../config/env.js';

export class TripService {
  /**
   * Start a new trip for a driver
   */
  static async startTrip({ driverId, busId, routeId, pickupPolicy, initialCoords }) {
    // 1. Verify bus exists and belongs to or is assigned to driver
    const bus = await Bus.findById(busId);
    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }
    if (bus.driverId.toString() !== driverId.toString() && bus.assignedDriver?.toString() !== driverId.toString()) {
      throw new ApiError(403, 'You are not authorized to operate this bus');
    }

    // 2. Verify route exists
    const route = await Route.findById(routeId);
    if (!route || !route.geometry || !route.geometry.coordinates) {
      throw new ApiError(404, 'Route or route road geometry not found');
    }

    // 3. Atomically check if driver already has an active trip
    const existingDriverTrip = await Trip.findOne({ driverId, status: 'ACTIVE' });
    if (existingDriverTrip) {
      throw new ApiError(409, 'Driver already has an active trip. Stop the current trip first.');
    }

    // 4. Atomically check if bus is already in an active trip
    const existingBusTrip = await Trip.findOne({ busId, status: 'ACTIVE' });
    if (existingBusTrip) {
      throw new ApiError(409, 'This bus is already in an active trip with another driver.');
    }

    // 5. Initial coordinates and route progress
    // Require valid real GPS coordinates from device; do not fallback to route origin
    if (
      !initialCoords ||
      !Array.isArray(initialCoords) ||
      initialCoords.length !== 2 ||
      typeof initialCoords[0] !== 'number' ||
      typeof initialCoords[1] !== 'number' ||
      isNaN(initialCoords[0]) ||
      isNaN(initialCoords[1])
    ) {
      throw new ApiError(
        400,
        'Valid device GPS coordinates [longitude, latitude] are required to start a trip'
      );
    }

    const [lng, lat] = initialCoords;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new ApiError(400, 'GPS coordinates are out of valid range [-90 to 90 lat, -180 to 180 lng]');
    }

    const startLocation = {
      type: 'Point',
      coordinates: [lng, lat],
    };

    let initialProgress = 0;
    const proj = projectPointOnRoute([lng, lat], route.geometry.coordinates);
    if (proj) {
      initialProgress = proj.progressKm;
    }

    const trip = await Trip.create({
      driverId,
      busId,
      routeId,
      status: 'ACTIVE',
      pickupPolicy: pickupPolicy || route.pickupPolicy || 'BOTH',
      startedAt: new Date(),
      currentLocation: startLocation,
      lastLocationUpdatedAt: new Date(),
      routeProgressKm: initialProgress,
      trackingStatus: 'ONLINE',
      lastSequenceNumber: 1,
    });

    return await Trip.findById(trip._id)
      .populate('busId')
      .populate('routeId')
      .populate('driverId', 'name mobile');
  }

  /**
   * Stop an active trip
   */
  static async stopTrip(tripId, driverId) {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new ApiError(404, 'Trip not found');
    }

    if (trip.driverId.toString() !== driverId.toString()) {
      throw new ApiError(403, 'Unauthorized: you can only stop your own trip');
    }

    if (trip.status !== 'ACTIVE') {
      throw new ApiError(400, `Cannot stop trip with status: ${trip.status}`);
    }

    trip.status = 'COMPLETED';
    trip.endedAt = new Date();
    trip.trackingStatus = 'UNAVAILABLE';
    await trip.save();

    return trip;
  }

  /**
   * Process a real-time GPS update from driver
   */
  static async updateGpsLocation({ tripId, driverId, latitude, longitude, accuracy, sequence }) {
    const trip = await Trip.findById(tripId).populate('routeId');
    if (!trip) {
      throw new ApiError(404, 'Active trip not found');
    }

    if (trip.driverId.toString() !== driverId.toString()) {
      throw new ApiError(403, 'Unauthorized: Driver mismatch');
    }

    if (trip.status !== 'ACTIVE') {
      throw new ApiError(400, 'Trip is not active');
    }

    // Reject out-of-order sequence
    if (sequence && sequence <= trip.lastSequenceNumber) {
      return { skipped: true, reason: 'Duplicate or older sequence' };
    }

    // Validate GPS accuracy
    if (accuracy && accuracy > ENV.GPS_MAX_ACCURACY_METERS) {
      return { skipped: true, reason: 'GPS accuracy too low' };
    }

    const coords = [longitude, latitude]; // [lng, lat]
    const route = trip.routeId;

    let newProgress = trip.routeProgressKm;
    let trackingStatus = 'ONLINE';

    if (route && route.geometry && route.geometry.coordinates) {
      const proj = projectPointOnRoute(coords, route.geometry.coordinates);
      if (proj) {
        // If driver is too far from route, mark status warning
        if (proj.distanceFromRouteMeters > ENV.ROUTE_MATCH_TOLERANCE_METERS * 2) {
          trackingStatus = 'STALE';
        }
        // Plausibility check: progress should not jump backwards drastically
        if (proj.progressKm >= trip.routeProgressKm - 0.5) {
          newProgress = Math.max(trip.routeProgressKm, proj.progressKm);
        }
      }
    }

    trip.currentLocation = {
      type: 'Point',
      coordinates: coords,
    };
    trip.lastLocationUpdatedAt = new Date();
    trip.routeProgressKm = newProgress;
    trip.trackingStatus = trackingStatus;
    trip.lastGpsAccuracyMeters = accuracy;
    if (sequence) trip.lastSequenceNumber = sequence;

    await trip.save();

    return {
      tripId: trip._id,
      coordinates: coords,
      routeProgressKm: newProgress,
      trackingStatus,
      lastLocationUpdatedAt: trip.lastLocationUpdatedAt,
    };
  }
}
