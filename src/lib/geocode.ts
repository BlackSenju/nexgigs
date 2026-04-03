/**
 * Geocode an address or zip code to lat/lng using Mapbox Geocoding API.
 */
export async function geocodeAddress(query: string): Promise<{
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  neighborhood?: string;
} | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&country=US&types=address,postcode,place,neighborhood&limit=1`
    );

    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const [longitude, latitude] = feature.center;

    // Extract context fields
    let city: string | undefined;
    let state: string | undefined;
    let neighborhood: string | undefined;

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith("place.")) city = ctx.text;
        if (ctx.id.startsWith("region.")) state = ctx.short_code?.replace("US-", "");
        if (ctx.id.startsWith("neighborhood.")) neighborhood = ctx.text;
      }
    }

    // If the feature itself is a place, use it as city
    if (feature.place_type?.includes("place")) {
      city = feature.text;
    }

    return { latitude, longitude, city, state, neighborhood };
  } catch {
    return null;
  }
}

/**
 * Reverse geocode lat/lng to an address.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ address: string; city: string; state: string; neighborhood?: string } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=address,place,neighborhood&limit=1`
    );

    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    let city = "";
    let state = "";
    let neighborhood: string | undefined;

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith("place.")) city = ctx.text;
        if (ctx.id.startsWith("region.")) state = ctx.short_code?.replace("US-", "") ?? "";
        if (ctx.id.startsWith("neighborhood.")) neighborhood = ctx.text;
      }
    }

    return {
      address: feature.place_name ?? "",
      city,
      state,
      neighborhood,
    };
  } catch {
    return null;
  }
}
