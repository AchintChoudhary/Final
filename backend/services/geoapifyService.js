import axios from 'axios';
import { ENV } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

// Simple in-memory cache to reduce Geoapify API calls and preserve quota
const routeCache = new Map();
const geocodeCache = new Map();
const CACHE_MAX_ENTRIES = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const getCached = (cache, key) => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
};

const setCached = (cache, key, value) => {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { value, cachedAt: Date.now() });
};

/**
 * Autocomplete place names using Geoapify
 */
export const autocompletePlace = async (text) => {
  if (!text || text.trim().length < 2) return [];

  const cacheKey = `auto_${text.toLowerCase().trim()}`;
  const cachedAutocomplete = getCached(geocodeCache, cacheKey);
  if (cachedAutocomplete !== undefined) return cachedAutocomplete;

  if (!ENV.GEOAPIFY_API_KEY) {
    throw new ApiError(503, 'Geoapify API key is not configured');
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&format=json&apiKey=${ENV.GEOAPIFY_API_KEY}`;
    const response = await axios.get(url, { timeout: 8000 });







    if (response.data && response.data.results) {
      const results = response.data.results.map((item) => ({
        formatted: item.formatted,
        name: item.name || item.formatted,
        lat: item.lat,
        lon: item.lon,
        city: item.city || item.county || item.state,
        country: item.country,
      }));
      setCached(geocodeCache, cacheKey, results);
      return results;
    }
    return [];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('[Geoapify Autocomplete Error]', error.response?.data || error.message);
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new ApiError(502, 'Geoapify rejected the configured API key');
    }
    if (error.response?.status === 429) {
      throw new ApiError(429, 'Geoapify API quota exceeded');
    }
    throw new ApiError(502, 'Geoapify autocomplete service is unavailable');
  }
};

/**
 * Geocode a place name into latitude and longitude
 */
export const geocodeLocation = async (placeName) => {
  if (!placeName || placeName.trim().length < 2) {
    throw new ApiError(400, 'Place name is required for geocoding');
  }

  const cacheKey = `geo_${placeName.toLowerCase().trim()}`;
  const cachedLocation = getCached(geocodeCache, cacheKey);
  if (cachedLocation !== undefined) return cachedLocation;

  if (!ENV.GEOAPIFY_API_KEY) {
    throw new ApiError(
      503,
      'Geoapify API key is not configured. Please set GEOAPIFY_API_KEY in backend/.env'
    );
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(placeName)}&format=json&apiKey=${ENV.GEOAPIFY_API_KEY}`;
    const response = await axios.get(url, { timeout: 8000 });

    if (response.data && response.data.results && response.data.results.length > 0) {
      const best = response.data.results[0];
      const result = {
        name: best.formatted || best.name || placeName,
        lat: best.lat,
        lon: best.lon,
      };
      setCached(geocodeCache, cacheKey, result);
      return result;
    }
    throw new ApiError(404, `Could not find coordinates for "${placeName}"`);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('[Geoapify Geocoding Error]', error.response?.data || error.message);
    throw new ApiError(502, `Geocoding failed: ${error.message}`);
  }
};

/**
 * Calculate actual road route using Geoapify Routing API
 * Coordinates: [lat, lon]
 */
export const fetchRoadRoute = async (origin, destination) => {
  const originLat = origin.lat;
  const originLon = origin.lon || origin.lng;
  const destLat = destination.lat;
  const destLon = destination.lon || destination.lng;

  const cacheKey = `route_${originLat.toFixed(4)},${originLon.toFixed(4)}_${destLat.toFixed(4)},${destLon.toFixed(4)}`;
  const cachedRoute = getCached(routeCache, cacheKey);
  if (cachedRoute !== undefined) return cachedRoute;

  if (!ENV.GEOAPIFY_API_KEY) {
    throw new ApiError(
      503,
      'Geoapify API key is not configured. Please set GEOAPIFY_API_KEY in backend/.env to calculate road routes.'
    );
  }

  try {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${originLat},${originLon}|${destLat},${destLon}&mode=drive&apiKey=${ENV.GEOAPIFY_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });

    const feature = response.data?.features?.[0];
    if (!feature || !feature.geometry) {
      throw new ApiError(404, 'No road route found between the specified locations');
    }

    // Geoapify routing returns MultiLineString or LineString with [lon, lat] coordinates
    let coordinates = [];
    if (feature.geometry.type === 'MultiLineString') {
      // Flatten legs into a continuous single ordered array of [lon, lat] pairs
      coordinates = feature.geometry.coordinates.flat(1);
    } else if (feature.geometry.type === 'LineString') {
      coordinates = feature.geometry.coordinates;
    }

    if (!coordinates || coordinates.length < 2) {
      throw new ApiError(404, 'Invalid or empty road route geometry returned by routing provider');
    }

    const distanceMeters = feature.properties?.distance || 0;
    const timeSeconds = feature.properties?.time || 0;

    const routeData = {
      type: 'LineString',
      coordinates: coordinates,
      totalDistanceKm: +(distanceMeters / 1000).toFixed(2),
      estimatedDurationMinutes: Math.round(timeSeconds / 60),
    };

    setCached(routeCache, cacheKey, routeData);
    return routeData;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('[Geoapify Routing Error]', error.response?.data || error.message);
    throw new ApiError(502, `Geoapify route calculation failed: ${error.message}`);
  }
};
