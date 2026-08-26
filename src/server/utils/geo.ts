/**
 * REDGRID Geographical & Haversine Distance Calculations
 * 
 * Implements geographic distance calculation using the Haversine formula
 * to compute spherical distances between donor and emergency coordinates.
 */

/**
 * Calculates the great-circle distance between two geographic coordinates using the Haversine formula.
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers, rounded to 2 decimal places
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    throw new Error('Invalid coordinates provided to calculateHaversineDistanceKm');
  }

  const R = 6371; // Earth's mean radius in kilometers
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Formats a distance in kilometers into a human-readable display string.
 * e.g. 2.43 -> "2.4 km", 0.6 -> "0.6 km"
 */
export function formatDistanceDisplay(distanceKm: number): string {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm)) {
    return 'Distance unavailable';
  }
  if (distanceKm < 0.1) {
    return '< 0.1 km';
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Validates whether latitude and longitude are valid numeric coordinates.
 */
export function isValidCoordinatePair(
  lat: any,
  lon: any
): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  return true;
}

/**
 * Maps geographic coordinates (lat/lng) onto a 0-100% 2D radar canvas relative to a regional center.
 */
export function projectCoordinatesToRadar(
  lat: number,
  lng: number,
  centerLat = 37.7749,
  centerLng = -122.4194,
  radiusKm = 10
): { x: number; y: number } {
  // Approximate scale: 1 degree latitude ~ 111 km, longitude ~ 111 * cos(lat) km
  const latKm = (lat - centerLat) * 111;
  const lngKm = (lng - centerLng) * 111 * Math.cos((centerLat * Math.PI) / 180);

  // Normalize into 0..100% canvas (50% is center)
  // Distance from center mapped to canvas radius
  const maxSpanKm = radiusKm * 1.4;
  const xPercent = 50 + (lngKm / maxSpanKm) * 42;
  const yPercent = 50 - (latKm / maxSpanKm) * 42; // Note: SVG / screen Y is inverted

  // Clamp within 5..95% to stay inside radar display
  const clampedX = Math.max(5, Math.min(95, Math.round(xPercent * 10) / 10));
  const clampedY = Math.max(5, Math.min(95, Math.round(yPercent * 10) / 10));

  return { x: clampedX, y: clampedY };
}
