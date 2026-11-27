import * as turf from '@turf/turf';

/**
 * Calculates total road distance along ordered GeoJSON LineString coordinates in kilometers
 */
export const calculateTotalDistance = (coordinates) => {
  if (!coordinates || coordinates.length < 2) return 0;
  const line = turf.lineString(coordinates);
  return turf.length(line, { units: 'kilometers' });
};

/**
 * Projects a point onto a LineString and returns:
 * - nearest point coordinates
 * - distance in meters from route
 * - distance along the route (progress from start) in kilometers
 */
export const projectPointOnRoute = (pointCoords, routeCoordinates) => {
  if (
    !Array.isArray(pointCoords) ||
    pointCoords.length !== 2 ||
    !pointCoords.every((value) => typeof value === 'number' && Number.isFinite(value)) ||
    !Array.isArray(routeCoordinates) ||
    routeCoordinates.length < 2 ||
    routeCoordinates.some(
      (coords) =>
        !Array.isArray(coords) ||
        coords.length !== 2 ||
        !coords.every((value) => typeof value === 'number' && Number.isFinite(value))
    )
  ) {
    return null;
  }
  const pt = turf.point(pointCoords); // [lng, lat]
  const line = turf.lineString(routeCoordinates);

  // Find nearest point on line
  const snapped = turf.nearestPointOnLine(line, pt);
  const distanceKm = turf.pointToLineDistance(pt, line, { units: 'kilometers' });
  const distanceMeters = distanceKm * 1000;

  // Snapped location distance from start of line
  const progressKm = snapped.properties.location; // distance along line in kilometers

  return {
    snappedCoordinates: snapped.geometry.coordinates,
    distanceFromRouteMeters: distanceMeters,
    progressKm: progressKm,
  };
};

/**
 * Checks whether a given point is within tolerance meters of the route line
 */
export const isPointNearRoute = (pointCoords, routeCoordinates, toleranceMeters = 500) => {
  const projection = projectPointOnRoute(pointCoords, routeCoordinates);
  if (!projection) return false;
  return projection.distanceFromRouteMeters <= toleranceMeters;
};

/**
 * Calculates remaining road distance along route between two progress points
 */
export const calculateRemainingDistanceKm = (currentProgressKm, targetProgressKm) => {
  if (targetProgressKm < currentProgressKm) return 0;
  return targetProgressKm - currentProgressKm;
};
