import { ENV } from '../config/env.js';
import { projectPointOnRoute } from '../utils/geoUtils.js';

const etaCache = new Map();

/**
 * Calculates accurate approximate ETA in minutes from current bus location to pickup point
 */
export const calculateETA = (busProgressKm, pickupProgressKm, totalDistanceKm, totalDurationMinutes) => {
  if (pickupProgressKm <= busProgressKm) {
    return { etaMinutes: 0, remainingDistanceKm: 0, status: 'ARRIVED' };
  }

  const remainingDistanceKm = +(pickupProgressKm - busProgressKm).toFixed(2);

  // Average speed calculation from confirmed route duration
  let avgSpeedKmh = 35; // Default urban/suburban bus speed in km/h
  if (totalDistanceKm > 0 && totalDurationMinutes > 0) {
    avgSpeedKmh = (totalDistanceKm / totalDurationMinutes) * 60;
    // Bound speed to realistic road bounds (20 km/h - 60 km/h for public buses)
    avgSpeedKmh = Math.max(20, Math.min(60, avgSpeedKmh));
  }

  const etaMinutes = Math.max(1, Math.round((remainingDistanceKm / avgSpeedKmh) * 60));

  return {
    etaMinutes,
    remainingDistanceKm,
    status: 'APPROACHING',
  };
};

/**
 * Get or compute cached ETA for a trip towards a pickup point
 */
export const getCachedTripETA = (tripId, busProgressKm, pickupProgressKm, route) => {
  const cacheKey = `eta_${tripId}_${busProgressKm.toFixed(2)}_${pickupProgressKm.toFixed(2)}`;
  const now = Date.now();

  if (etaCache.has(cacheKey)) {
    const cached = etaCache.get(cacheKey);
    if (now - cached.timestamp < ENV.ETA_REFRESH_INTERVAL_MS) {
      return cached.data;
    }
  }

  const eta = calculateETA(
    busProgressKm,
    pickupProgressKm,
    route.totalDistanceKm,
    route.estimatedDurationMinutes
  );

  etaCache.set(cacheKey, { timestamp: now, data: eta });
  return eta;
};
