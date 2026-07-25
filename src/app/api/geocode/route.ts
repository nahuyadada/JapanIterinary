import {
  GEOCODE_CACHE_TTL_MS,
  createTtlCache,
  geocoderUserAgent,
  nominatimSearchUrl,
  normalizeQuery,
  parseNominatimResults,
  type GeocodeResult,
} from "@/lib/geocode";

// Every request depends on the caller's `q`, so there is nothing to prerender or cache at
// the framework level. The in-process cache below is what keeps upstream traffic down.
export const dynamic = "force-dynamic";

/**
 * Bound the upstream call. Nominatim's public instance is usually fast but occasionally
 * stalls, and the traveler always has the map fallback — making them wait is the worse
 * outcome.
 */
const UPSTREAM_TIMEOUT_MS = 5_000;

/**
 * Shared across requests to this server instance, which is the point: Nominatim's usage
 * policy asks that results be cached. It is per-instance and in-memory, so a horizontally
 * scaled deployment caches per instance — acceptable, because the cache is an optimisation
 * and not a correctness requirement.
 */
const cache = createTtlCache<GeocodeResult[]>(GEOCODE_CACHE_TTL_MS);

function fail(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Resolve an accommodation name to coordinates, proxying OpenStreetMap Nominatim.
 *
 * The proxy is not optional. A browser cannot set the identifying `User-Agent` Nominatim's
 * usage policy requires, and going through our own origin also sidesteps CORS. Keeping it
 * server-side puts policy compliance — User-Agent, request rate, caching — in one place.
 *
 * `q` is the only caller-controlled value and it is URL-encoded into a query parameter of a
 * hard-coded host, so there is no SSRF surface.
 */
export async function GET(request: Request): Promise<Response> {
  const query = normalizeQuery(new URL(request.url).searchParams.get("q"));
  if (!query) {
    return fail("Type at least three characters of the place's name.", 400);
  }

  const hit = cache.get(query);
  if (hit) return Response.json({ results: hit });

  let upstream: Response;
  try {
    upstream = await fetch(nominatimSearchUrl(query), {
      headers: {
        "User-Agent": geocoderUserAgent(process.env.GEOCODER_CONTACT),
        // Latin-script names are more useful than local script in a mixed-language UI.
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (cause) {
    // Covers both the timeout and a hard network failure. The message stays generic: the
    // caller can do nothing with the upstream's internals, and the map fallback is there.
    console.error("Geocoder request failed", cause);
    return fail(
      "Could not reach the place lookup service. Set the location on the map instead.",
      504
    );
  }

  if (!upstream.ok) {
    console.error(`Geocoder responded ${upstream.status}`);
    return fail(
      "The place lookup service is unavailable. Set the location on the map instead.",
      502
    );
  }

  let body: unknown;
  try {
    body = await upstream.json();
  } catch (cause) {
    console.error("Geocoder returned an unreadable body", cause);
    return fail("Could not read the lookup result. Set the location on the map instead.", 502);
  }

  const results = parseNominatimResults(body);
  // An empty list is cached too: a name OSM does not know will not start knowing it within
  // the hour, and re-asking every time is exactly what the usage policy discourages.
  cache.set(query, results);
  return Response.json({ results });
}
