import { Trip } from '../models/Trip.js';
import { Route } from '../models/Route.js';
import { Bus } from '../models/Bus.js';
import { projectPointOnRoute } from '../utils/geoUtils.js';
import { getCachedTripETA } from './etaService.js';
import { ENV } from '../config/env.js';

/**
 * Core Route Matching Service: Middle-of-Route Bus Discovery
 * Implements Section 12 of the Master Backend Specification
 */
export class RouteMatchingService {
  /**
   * Discovers active buses that will pass the passenger's pickup location
   * and travel towards the passenger's destination.
   *
   * @param {Array<number>} pickupCoords [lng, lat]
   * @param {Array<number>} destCoords [lng, lat]
   * @param {Object} options Options like toleranceMeters
   * @returns {Promise<Array>} List of eligible active buses
   */
  static async findBusesForPassenger(pickupCoords, destCoords, options = {}) {
    const toleranceMeters = options.toleranceMeters || ENV.ROUTE_MATCH_TOLERANCE_METERS;

    // Step 1: Find all ACTIVE trips with populated Bus and Route
    const activeTrips = await Trip.find({ status: 'ACTIVE' })
      .populate('busId')
      .populate('routeId')
      .populate('driverId', 'name mobile');

    if (!activeTrips || activeTrips.length === 0) {
      return [];
    }

    const matchingBuses = [];
    const now = Date.now();

    for (const trip of activeTrips) {
      const route = trip.routeId;
      const bus = trip.busId;

      if (!route || !route.geometry || !route.geometry.coordinates || route.geometry.coordinates.length < 2) {
        continue;
      }
      if (!bus || !bus._id) continue;

      // Check GPS freshness: stale or unavailable warning
      let trackingStatus = trip.trackingStatus || 'ONLINE';
      if (trip.lastLocationUpdatedAt) {
        const timeSinceLastGps = now - new Date(trip.lastLocationUpdatedAt).getTime();
        if (timeSinceLastGps > ENV.GPS_UNAVAILABLE_MS) {
          trackingStatus = 'UNAVAILABLE';
        } else if (timeSinceLastGps > ENV.GPS_STALE_WARNING_MS) {
          trackingStatus = 'STALE';
        }
      }
      if (!trip.lastLocationUpdatedAt || trackingStatus !== 'ONLINE') continue;

      const routeCoordinates = route.geometry.coordinates; // [[lng, lat], ...]

      // Step 2: Match Passenger Pickup Point onto Route
      const pickupProjection = projectPointOnRoute(pickupCoords, routeCoordinates);
      if (!pickupProjection) continue;

      if (pickupProjection.distanceFromRouteMeters > toleranceMeters) {
        // Passenger is not near this route
        continue;
      }

      // Step 3: Match Passenger Destination Point onto Route
      const destProjection = projectPointOnRoute(destCoords, routeCoordinates);
      if (!destProjection) continue;

      if (destProjection.distanceFromRouteMeters > toleranceMeters) {
        // Destination is not served by this route
        continue;
      }

      // Step 4: Calculate Route Progress for bus, pickup, and destination
      const busProgressKm = trip.routeProgressKm || 0;
      const pickupProgressKm = pickupProjection.progressKm;
      const destinationProgressKm = destProjection.progressKm;

      // Validate ordered direction: pickup must be before destination
      if (pickupProgressKm >= destinationProgressKm) {
        // Destination is behind the pickup point on this route (reverse direction)
        continue;
      }

      const busCoords = trip.currentLocation?.coordinates;
      const busProjection = Array.isArray(busCoords)
        ? projectPointOnRoute(busCoords, routeCoordinates)
        : null;
      if (
        !busProjection ||
        busProjection.distanceFromRouteMeters > toleranceMeters * 2
      ) {
        continue;
      }

      const arrivalToleranceKm = Math.max(toleranceMeters, 500) / 1000;
      const progressDifferenceKm = pickupProgressKm - busProgressKm;
      let pickupStatus = 'APPROACHING';
      const pickupCoordsForArrival = pickupProjection.snappedCoordinates;
      const [busLng, busLat] = busCoords;
      const [pickupLng, pickupLat] = pickupCoordsForArrival;
      const toRadians = (degrees) => (degrees * Math.PI) / 180;
      const dLat = toRadians(pickupLat - busLat);
      const dLng = toRadians(pickupLng - busLng);
      const haversine =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(busLat)) * Math.cos(toRadians(pickupLat)) * Math.sin(dLng / 2) ** 2;
      const physicalDistanceMeters =
        6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
      if (
        Math.abs(progressDifferenceKm) <= arrivalToleranceKm &&
        physicalDistanceMeters <= Math.min(toleranceMeters, 500)
      ) {
        pickupStatus = 'ARRIVED';
      } else if (progressDifferenceKm < 0) {
        continue;
      }

      // Step 6: Check Pickup Policy (FIXED, FLEXIBLE, BOTH)
      const policy = trip.pickupPolicy || route.pickupPolicy || 'BOTH';
      let pickupType = 'FLEXIBLE';
      let approvedPickupCoordinates = pickupProjection.snappedCoordinates;
      let approvedPickupProgressKm = pickupProgressKm;

      if (policy === 'FIXED') {
        // Check if there is a fixed stop near the passenger's pickup location
        const nearStop = route.stops?.find((stop) => {
          if (!stop.pickupAllowed) return false;
          const stopProjection = projectPointOnRoute(stop.coordinates, routeCoordinates);
          return (
            stopProjection &&
            Math.abs(stopProjection.progressKm - pickupProgressKm) * 1000 <= toleranceMeters
          );
        });

        if (!nearStop) {
          // Bus operates fixed stops only, but no approved stop near pickup
          continue;
        }
        pickupType = 'FIXED_STOP';
        approvedPickupCoordinates = nearStop.coordinates;
        const approvedPickupProjection = projectPointOnRoute(
          nearStop.coordinates,
          routeCoordinates
        );
        if (approvedPickupProjection) {
          approvedPickupProgressKm = approvedPickupProjection.progressKm;
        }
      }

      const destinationStopsNearPoint = (route.stops || []).filter((stop) => {
        if (!stop.dropOffAllowed || !Array.isArray(stop.coordinates)) return false;
        const stopProjection = projectPointOnRoute(stop.coordinates, routeCoordinates);
        return (
          stopProjection &&
          Math.abs(stopProjection.progressKm - destinationProgressKm) * 1000 <= toleranceMeters
        );
      });
      if (policy === 'FIXED' && destinationStopsNearPoint.length === 0) {
        continue;
      }

      // Step 7: Calculate accurate ETA and remaining distance
      const etaInfo = getCachedTripETA(
        trip._id,
        busProgressKm,
        approvedPickupProgressKm,
        route
      );

      matchingBuses.push({
        tripId: trip._id,
        busId: bus._id,
        busName: bus.busName,
        plateNumber: bus.plateNumber,
        routeName: route.name,
        originName: route.origin?.name,
        destinationName: route.destination?.name,
        pickupPoint: {
          coordinates: approvedPickupCoordinates,
          snappedCoordinates: pickupProjection.snappedCoordinates,
          type: pickupType,
        },
        currentLocation: trip.currentLocation?.coordinates || null,
        busProgressKm: +busProgressKm.toFixed(2),
        pickupProgressKm: +approvedPickupProgressKm.toFixed(2),
        destinationProgressKm: +destinationProgressKm.toFixed(2),
        trackingStatus: trackingStatus,
        pickupStatus,
        lastLocationUpdatedAt: trip.lastLocationUpdatedAt,
        etaMinutes: etaInfo.etaMinutes,
        remainingDistanceKm: etaInfo.remainingDistanceKm,
      });
    }

    // Sort matching results by estimated arrival time (shortest ETA first)
    matchingBuses.sort((a, b) => a.etaMinutes - b.etaMinutes);

    return matchingBuses;
  }
}
