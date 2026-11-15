/**
 * Finding the train station nearest a point, via Photon's reverse lookup over
 * OpenStreetMap. Pure and network-free like geocode.ts; the route handler at
 * `src/app/api/stations/route.ts` supplies the fetch.
 */

const PHOTON_REVERSE = "https://photon.komoot.io/reverse";
/** Further than this and "walk to the station" stops being a fair description. */
const STATION_RADIUS_KM = 1.5;

/** A day rarely has more than a handful of stops; the cap bounds upstream traffic. */
export const STATION_MAX_POINTS = 12;

export type Station = { name: string; lat: number; lng: number };
export type LatLng = { lat: number; lng: number };

/** Cache and lookup key. Three decimals is about 100 m, well inside one station's reach. */
export function pointKey(point: LatLng): string {
  return `${point.lat.toFixed(3)},${point.lng.toFixed(3)}`;
}

/** Parse "lat,lng;lat,lng" from a query string, or null when any part is unusable. */
export function parseStationPoints(raw: unknown): LatLng[] | null {
  if (typeof raw !== "string" || raw === "") return null;
  const parts = raw.split(";");
  if (parts.length > STATION_MAX_POINTS) return null;

  const points: LatLng[] = [];
  for (const part of parts) {
    const fields = part.split(",");
    if (fields.length !== 2 || fields.some((f) => f.trim() === "")) return null;
    const lat = Number(fields[0]);
    const lng = Number(fields[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    points.push({ lat, lng });
  }
  return points;
}

export function photonStationUrl(point: LatLng): string {
  const url = new URL(PHOTON_REVERSE);
  url.searchParams.set("lat", String(point.lat));
  url.searchParams.set("lon", String(point.lng));
  url.searchParams.set("osm_tag", "railway:station");
  url.searchParams.set("radius", String(STATION_RADIUS_KM));
  url.searchParams.set("limit", "1");
  url.searchParams.set("lang", "en");
  return url.toString();
}

/** The closest station in a Photon reverse response, or null when there is none nearby. */
export function parsePhotonStation(raw: unknown): Station | null {
  if (typeof raw !== "object" || raw === null) return null;
  const features = (raw as { features?: unknown }).features;
  if (!Array.isArray(features)) return null;

  for (const feature of features) {
    if (typeof feature !== "object" || feature === null) continue;
    const { properties, geometry } = feature as {
      properties?: { name?: unknown };
      geometry?: { coordinates?: unknown };
    };
    const name = typeof properties?.name === "string" ? properties.name.trim() : "";
    const coords = geometry?.coordinates;
    if (!name || !Array.isArray(coords)) continue;
    const [lng, lat] = coords;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    return { name: name.slice(0, 80), lat, lng };
  }
  return null;
}
