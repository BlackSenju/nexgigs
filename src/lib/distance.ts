/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in miles.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display.
 * < 0.1 mi -> "Nearby"
 * < 1 mi -> "0.X mi"
 * < 10 mi -> "X.X mi"
 * >= 10 mi -> "X mi"
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) return "Nearby";
  if (miles < 1) return `${miles.toFixed(1)} mi`;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
