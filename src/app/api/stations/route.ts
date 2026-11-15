import { GEOCODE_CACHE_TTL_MS, createTtlCache, geocoderUserAgent } from "@/lib/geocode";
import {
  parsePhotonStation,
  parseStationPoints,
  photonStationUrl,
  pointKey,
  type LatLng,
  type Station,
} from "@/lib/stations";

export const dynamic = "force-dynamic";

const UPSTREAM_TIMEOUT_MS = 5_000;

/** Stations do not move, so a point looked up once is not looked up again this hour. */
const cache = createTtlCache<{ station: Station | null }>(GEOCODE_CACHE_TTL_MS);

/**
 * Nearest station to one point. A failed lookup is null and is not cached: the simulation
 * falls back to a plain estimate, and the next request gets another try.
 */
async function nearestStation(point: LatLng): Promise<Station | null> {
  const key = pointKey(point);
  const hit = cache.get(key);
  if (hit) return hit.station;

  try {
    const response = await fetch(photonStationUrl(point), {
      headers: { "User-Agent": geocoderUserAgent(process.env.GEOCODER_CONTACT) },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const station = parsePhotonStation(await response.json());
    cache.set(key, { station });
    return station;
  } catch (cause) {
    console.error("Station lookup failed", cause);
    return null;
  }
}

/**
 * Nearest train station for each of a day's points, in the order given.
 *
 * `pts` is the only caller-controlled value. It is parsed into bounded numbers before
 * anything is sent upstream, and the upstream host is hard-coded.
 */
export async function GET(request: Request): Promise<Response> {
  const points = parseStationPoints(new URL(request.url).searchParams.get("pts"));
  if (!points) {
    return Response.json({ error: "Expected pts=lat,lng;lat,lng" }, { status: 400 });
  }
  const stations = await Promise.all(points.map(nearestStation));
  return Response.json({ stations });
}
