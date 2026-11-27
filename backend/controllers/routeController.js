import { Route } from '../models/Route.js';
import { ApiError } from '../utils/apiError.js';
import { geocodeLocation, fetchRoadRoute, autocompletePlace } from '../services/geoapifyService.js';
import { projectPointOnRoute } from '../utils/geoUtils.js';
import { isValidCoordinates } from '../utils/validators.js';
import { ENV } from '../config/env.js';

// Autocomplete place suggestions
export const autocomplete = async (req, res, next) => {
  try {
    const { text } = req.query;
    const results = await autocompletePlace(text);
    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    next(error);
  }
};

// Preview a road route between two locations using Geoapify
export const previewRoute = async (req, res, next) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      throw new ApiError(400, 'Both origin and destination locations are required');
    }

    // Geocode both locations if string names are provided
    const originGeo = await geocodeLocation(origin);
    const destGeo = await geocodeLocation(destination);

    // Call Geoapify Routing API to obtain actual road geometry
    const roadRoute = await fetchRoadRoute(originGeo, destGeo);

    res.status(200).json({
      success: true,
      preview: {
        origin: { name: originGeo.name, coordinates: [originGeo.lon, originGeo.lat] },
        destination: { name: destGeo.name, coordinates: [destGeo.lon, destGeo.lat] },
        geometry: roadRoute,
        totalDistanceKm: roadRoute.totalDistanceKm,
        estimatedDurationMinutes: roadRoute.estimatedDurationMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Save a confirmed route to MongoDB
export const createRoute = async (req, res, next) => {
  try {
    const {
      name,
      origin,
      destination,
      geometry,
      totalDistanceKm,
      estimatedDurationMinutes,
      stops,
      pickupPolicy,
    } = req.body;

    if (!name || !origin || !destination || !geometry || !geometry.coordinates) {
      throw new ApiError(400, 'Complete route information including geometry is required');
    }
    if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
      throw new ApiError(400, 'A valid confirmed LineString geometry is required');
    }
    if (
      !Array.isArray(origin.coordinates) ||
      origin.coordinates.length !== 2 ||
      !Array.isArray(destination.coordinates) ||
      destination.coordinates.length !== 2
    ) {
      throw new ApiError(400, 'Valid route origin and destination coordinates are required');
    }
    if (
      !isValidCoordinates(origin.coordinates[0], origin.coordinates[1]) ||
      !isValidCoordinates(destination.coordinates[0], destination.coordinates[1])
    ) {
      throw new ApiError(400, 'Route origin and destination coordinates are out of range');
    }
    for (const coordinate of geometry.coordinates) {
      if (!Array.isArray(coordinate) || coordinate.length !== 2 ||
        !isValidCoordinates(coordinate[0], coordinate[1])) {
        throw new ApiError(400, 'Route geometry contains invalid coordinates');
      }
    }
    if (!['FIXED', 'FLEXIBLE', 'BOTH'].includes(pickupPolicy || 'BOTH')) {
      throw new ApiError(400, 'Invalid pickup policy');
    }

    // Process and sort stops with route progress
    let processedStops = [];
    if (stops && Array.isArray(stops)) {
      processedStops = stops.map((stop, index) => {
        let progress = 0;
        if (stop.coordinates && geometry.coordinates) {
          if (
            !Array.isArray(stop.coordinates) ||
            stop.coordinates.length !== 2 ||
            !isValidCoordinates(stop.coordinates[0], stop.coordinates[1])
          ) {
            throw new ApiError(400, 'A stop contains invalid coordinates');
          }
          const proj = projectPointOnRoute(stop.coordinates, geometry.coordinates);
          if (proj) progress = proj.progressKm;
          if (!proj || proj.distanceFromRouteMeters > ENV.ROUTE_MATCH_TOLERANCE_METERS) {
            throw new ApiError(400, `Stop "${stop.name || index + 1}" is too far from the confirmed route`);
          }
        }
        return {
          stopId: stop.stopId || `stop_${index + 1}`,
          name: stop.name,
          coordinates: stop.coordinates,
          progressKm: progress,
          pickupAllowed: stop.pickupAllowed !== false,
          dropOffAllowed: stop.dropOffAllowed !== false,
          order: stop.order !== undefined ? stop.order : index,
        };
      });
      // Sort stops by order
      processedStops.sort((a, b) => a.progressKm - b.progressKm);
    }

    const route = await Route.create({
      name: name.trim(),
      origin,
      destination,
      geometry,
      totalDistanceKm,
      estimatedDurationMinutes,
      stops: processedStops,
      pickupPolicy: pickupPolicy || 'BOTH',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Route created and confirmed successfully',
      route,
    });
  } catch (error) {
    next(error);
  }
};

// Get single route by ID
export const getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      throw new ApiError(404, 'Route not found');
    }
    if (
      req.user &&
      req.user.role === 'DRIVER' &&
      route.createdBy &&
      route.createdBy.toString() !== req.user._id.toString()
    ) {
      throw new ApiError(403, 'Unauthorized: You can only view routes you created');
    }
    res.status(200).json({
      success: true,
      route,
    });
  } catch (error) {
    next(error);
  }
};

// Get all routes
export const getAllRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      routes,
    });
  } catch (error) {
    next(error);
  }
};
