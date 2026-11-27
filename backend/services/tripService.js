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
  static async startTrip({
    driverId,
    busId,
    routeId,
    pickupPolicy,
    initialCoords,
    initialAccuracy,
    initialTimestamp,
  }) {
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
    if (route.createdBy && route.createdBy.toString() !== driverId.toString()) {
      throw new ApiError(403, 'You are not authorized to start a trip on this route');
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

    if (
      typeof initialAccuracy !== 'number' ||
      !Number.isFinite(initialAccuracy) ||
      initialAccuracy < 0 ||
      initialAccuracy > ENV.GPS_MAX_ACCURACY_METERS
    ) {
      throw new ApiError(
        400,
        `GPS accuracy must be provided and at most ${ENV.GPS_MAX_ACCURACY_METERS} metres`
      );
    }
    if (!initialTimestamp) throw new ApiError(400, 'GPS measurement timestamp is required');
    const measuredAt = new Date(initialTimestamp);
    if (
      Number.isNaN(measuredAt.getTime()) ||
      Date.now() - measuredAt.getTime() > ENV.GPS_UNAVAILABLE_MS ||
      measuredAt.getTime() - Date.now() > 30000
    ) {
      throw new ApiError(400, 'GPS measurement is stale or invalid');
    }

    let initialProgress = 0;
    const proj = projectPointOnRoute([lng, lat], route.geometry.coordinates);
    if (!proj) throw new ApiError(400, 'GPS coordinates could not be matched to the route');
    if (proj.distanceFromRouteMeters > ENV.ROUTE_MATCH_TOLERANCE_METERS) {
      throw new ApiError(
        400,
        `Driver GPS is ${Math.round(proj.distanceFromRouteMeters)} metres from the confirmed route`
      );
    }
    initialProgress = proj.progressKm;

    const trip = await Trip.create({
      driverId,
      busId,
      routeId,
      status: 'ACTIVE',
      pickupPolicy: pickupPolicy || route.pickupPolicy || 'BOTH',
      startedAt: new Date(),
      currentLocation: startLocation,
      lastLocationUpdatedAt: new Date(),
      lastGpsMeasuredAt: measuredAt,
      lastGpsAccuracyMeters: initialAccuracy,
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
    const trip = await Trip.findById(tripId).populate('routeId');
    if (!trip) {
      throw new ApiError(404, 'Trip not found');
    }

    if (trip.driverId.toString() !== driverId.toString()) {
      throw new ApiError(403, 'Unauthorized: you can only stop your own trip');
    }

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      return trip;
    }
    if (trip.status !== 'ACTIVE') {
      throw new ApiError(400, `Cannot stop trip with status: ${trip.status}`);
    }

    const endedAt = new Date();
    let finalStatus = 'CANCELLED';
    if (trip.routeId?.geometry?.coordinates && trip.currentLocation?.coordinates) {
      const routeCoordinates = trip.routeId.geometry.coordinates;
      const destination = trip.routeId.destination?.coordinates;
      const destinationProjection = destination
        ? projectPointOnRoute(destination, routeCoordinates)
        : null;
      const currentProjection = projectPointOnRoute(
        trip.currentLocation.coordinates,
        routeCoordinates
      );
      if (
        destinationProjection &&
        currentProjection &&
        currentProjection.progressKm >= destinationProjection.progressKm - 0.05 &&
        destinationProjection.distanceFromRouteMeters <= ENV.ROUTE_MATCH_TOLERANCE_METERS &&
        currentProjection.distanceFromRouteMeters <= ENV.ROUTE_MATCH_TOLERANCE_METERS
      ) {
        finalStatus = 'COMPLETED';
      }
    }
    const endedTrip = await Trip.findOneAndUpdate(
      { _id: tripId, driverId, status: 'ACTIVE' },
      {
        $set: {
          status: finalStatus,
          endedAt,
          trackingStatus: 'UNAVAILABLE',
        },
      },
      { new: true }
    );
    if (!endedTrip) {
      const latest = await Trip.findById(tripId);
      if (latest && latest.status !== 'ACTIVE') return latest;
      throw new ApiError(409, 'Trip status changed before it could be stopped');
    }
    return endedTrip;
  }

  /**
   * Process a real-time GPS update from driver
   */
  static async updateGpsLocation({
    tripId,
    driverId,
    latitude,
    longitude,
    accuracy,
    sequence,
    timestamp,
  }) {
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

    if (typeof sequence !== 'number' || !Number.isFinite(sequence)) {
      throw new ApiError(400, 'GPS sequence number is required');
    }
    if (typeof accuracy !== 'number' || !Number.isFinite(accuracy) || accuracy < 0) {
      throw new ApiError(400, 'GPS accuracy is required');
    }
    if (!timestamp) throw new ApiError(400, 'GPS measurement timestamp is required');
    const measuredAt = new Date(timestamp);
    if (Number.isNaN(measuredAt.getTime())) {
      throw new ApiError(400, 'Invalid GPS measurement timestamp');
    }
    const ageMs = Date.now() - measuredAt.getTime();
    if (ageMs > ENV.GPS_UNAVAILABLE_MS) {
      return { skipped: true, reason: 'Stale GPS measurement' };
    }
    if (ageMs < -30000) throw new ApiError(400, 'GPS measurement timestamp is in the future');
    if (sequence <= trip.lastSequenceNumber) {
      return { skipped: true, reason: 'Duplicate or older sequence' };
    }
    if (accuracy > ENV.GPS_MAX_ACCURACY_METERS) {
      return { skipped: true, reason: 'GPS accuracy too low' };
    }

    const coords = [longitude, latitude]; // [lng, lat]
    const route = trip.routeId;

    let newProgress = trip.routeProgressKm;
    let trackingStatus = 'ONLINE';

    if (route && route.geometry && route.geometry.coordinates) {
      const proj = projectPointOnRoute(coords, route.geometry.coordinates);
      if (proj) {
        if (proj.distanceFromRouteMeters > ENV.ROUTE_MATCH_TOLERANCE_METERS * 2) {
          return { skipped: true, reason: 'GPS update is outside the confirmed route' };
        }
        // Plausibility check: progress should not jump backwards drastically
        if (proj.progressKm >= trip.routeProgressKm - 0.5) {
          newProgress = Math.max(trip.routeProgressKm, proj.progressKm);
        }
      }
    }

    const receivedAt = new Date();
    const updatedTrip = await Trip.findOneAndUpdate(
      {
        _id: tripId,
        driverId,
        status: 'ACTIVE',
        lastSequenceNumber: { $lt: sequence },
      },
      {
        $set: {
          currentLocation: { type: 'Point', coordinates: coords },
          lastLocationUpdatedAt: receivedAt,
          lastGpsMeasuredAt: measuredAt,
          trackingStatus,
          lastGpsAccuracyMeters: accuracy,
          lastSequenceNumber: sequence,
        },
        $max: { routeProgressKm: newProgress },
      },
      { new: true }
    );
    if (!updatedTrip) {
      return { skipped: true, reason: 'Duplicate, stale, or trip ended' };
    }

    return {
      tripId: updatedTrip._id,
      coordinates: coords,
      routeProgressKm: updatedTrip.routeProgressKm,
      trackingStatus,
      lastLocationUpdatedAt: receivedAt,
    };
  }
}
