import { Trip } from '../models/Trip.js';
import { Route } from '../models/Route.js';
import { TripService } from '../services/tripService.js';
import { RouteMatchingService } from '../services/routeMatchingService.js';
import { geocodeLocation } from '../services/geoapifyService.js';
import { calculateETA } from '../services/etaService.js';
import { ApiError } from '../utils/apiError.js';
import { isValidCoordinates } from '../utils/validators.js';

// Start a new trip (Driver)
export const startTrip = async (req, res, next) => {
  try {
    const { busId, routeId, pickupPolicy, initialCoords } = req.body;

    if (!busId || !routeId) {
      throw new ApiError(400, 'Bus ID and Route ID are required to start a trip');
    }

    const trip = await TripService.startTrip({
      driverId: req.user._id,
      busId,
      routeId,
      pickupPolicy,
      initialCoords,
    });

    res.status(201).json({
      success: true,
      message: 'Trip started successfully. Live GPS tracking is active.',
      trip,
    });
  } catch (error) {
    next(error);
  }
};

// Stop trip (Driver)
export const stopTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trip = await TripService.stopTrip(id, req.user._id);

    // Notify any socket listeners via global io if available
    if (req.app.get('io')) {
      req.app.get('io').to(`trip:${id}`).emit('trip:ended', {
        tripId: id,
        endedAt: trip.endedAt,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Trip stopped and marked as completed.',
      trip,
    });
  } catch (error) {
    next(error);
  }
};

// Get current driver's active trip
export const getMyActiveTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ driverId: req.user._id, status: 'ACTIVE' })
      .populate('busId')
      .populate('routeId')
      .populate('driverId', 'name mobile');

    res.status(200).json({
      success: true,
      trip: trip || null,
    });
  } catch (error) {
    next(error);
  }
};

// Passenger search for active buses along a road route
export const searchBuses = async (req, res, next) => {
  try {
    let { pickup, destination, pickupLat, pickupLng, destLat, destLng } = req.query;

    let pickupCoords = null;
    let destCoords = null;

    // Check if coordinates were directly provided
    if (pickupLat && pickupLng) {
      const lat = parseFloat(pickupLat);
      const lng = parseFloat(pickupLng);
      if (isValidCoordinates(lng, lat)) {
        pickupCoords = [lng, lat];
      }
    }

    if (destLat && destLng) {
      const lat = parseFloat(destLat);
      const lng = parseFloat(destLng);
      if (isValidCoordinates(lng, lat)) {
        destCoords = [lng, lat];
      }
    }

    // If coordinates were not directly provided, geocode location names
    if (!pickupCoords && pickup) {
      const geo = await geocodeLocation(pickup);
      pickupCoords = [geo.lon, geo.lat];
    }

    if (!destCoords && destination) {
      const geo = await geocodeLocation(destination);
      destCoords = [geo.lon, geo.lat];
    }

    if (!pickupCoords || !destCoords) {
      throw new ApiError(400, 'Valid pickup and destination locations/coordinates are required');
    }

    // Run RouteMatchingService: excludes passed buses, wrong routes, reverse directions
    const eligibleBuses = await RouteMatchingService.findBusesForPassenger(
      pickupCoords,
      destCoords
    );

    res.status(200).json({
      success: true,
      count: eligibleBuses.length,
      buses: eligibleBuses,
    });
  } catch (error) {
    next(error);
  }
};

// Get single trip live tracking details
export const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('busId')
      .populate('routeId')
      .populate('driverId', 'name mobile');

    if (!trip) {
      throw new ApiError(404, 'Trip not found');
    }

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    next(error);
  }
};

// Get real-time ETA for trip
export const getTripEta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pickupLng, pickupLat } = req.query;

    const trip = await Trip.findById(id).populate('routeId');
    if (!trip || !trip.routeId) {
      throw new ApiError(404, 'Active trip or route not found');
    }

    let pickupProgressKm = trip.routeId.totalDistanceKm;
    if (pickupLng && pickupLat) {
      const { projectPointOnRoute } = await import('../utils/geoUtils.js');
      const proj = projectPointOnRoute(
        [parseFloat(pickupLng), parseFloat(pickupLat)],
        trip.routeId.geometry.coordinates
      );
      if (proj) {
        pickupProgressKm = proj.progressKm;
      }
    }

    const eta = calculateETA(
      trip.routeProgressKm,
      pickupProgressKm,
      trip.routeId.totalDistanceKm,
      trip.routeId.estimatedDurationMinutes
    );

    res.status(200).json({
      success: true,
      eta,
      trackingStatus: trip.trackingStatus,
      lastLocationUpdatedAt: trip.lastLocationUpdatedAt,
    });
  } catch (error) {
    next(error);
  }
};

// Trip history
export const getTripHistory = async (req, res, next) => {
  try {
    const filter = { status: { $in: ['COMPLETED', 'CANCELLED'] } };
    if (req.user.role === 'DRIVER') {
      filter.driverId = req.user._id;
    }

    const trips = await Trip.find(filter)
      .populate('busId')
      .populate('routeId')
      .populate('driverId', 'name mobile')
      .sort({ endedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      trips,
    });
  } catch (error) {
    next(error);
  }
};
