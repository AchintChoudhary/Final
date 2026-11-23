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

      // Step 5: Exclude Passed Buses
      // If the bus has already reached or passed the passenger's pickup location:
      if (busProgressKm >= pickupProgressKm) {
        continue;
      }

      // Step 6: Check Pickup Policy (FIXED, FLEXIBLE, BOTH)
      const policy = trip.pickupPolicy || route.pickupPolicy || 'BOTH';
      let pickupType = 'FLEXIBLE';

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
      }

      // Step 7: Calculate accurate ETA and remaining distance
      const etaInfo = getCachedTripETA(trip._id, busProgressKm, pickupProgressKm, route);

      matchingBuses.push({
        tripId: trip._id,
        busId: bus._id,
        busName: bus.busName,
        plateNumber: bus.plateNumber,
        routeName: route.name,
        originName: route.origin?.name,
        destinationName: route.destination?.name,
        pickupPoint: {
          coordinates: pickupCoords,
          snappedCoordinates: pickupProjection.snappedCoordinates,
          type: pickupType,
        },
        currentLocation: trip.currentLocation?.coordinates || null,
        busProgressKm: +busProgressKm.toFixed(2),
        pickupProgressKm: +pickupProgressKm.toFixed(2),
        destinationProgressKm: +destinationProgressKm.toFixed(2),
        trackingStatus: trackingStatus,
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
