/**
 * Turning a typed accommodation name into coordinates, via OpenStreetMap Nominatim.
 *
 * Everything here is pure and network-free so it can be unit-tested; the route handler at
 * `src/app/api/geocode/route.ts` supplies the one `fetch` and stays thin. Swapping
 * geocoder later means changing this file and nothing else.
 */

/** Upstream host, hard-coded. The user's query only ever becomes a query parameter. */
const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

/** Nominatim's usage policy asks for a small result count; five is what the UI shows. */
export const GEOCODE_MAX_RESULTS = 5;

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 120;
/** Matches `StayLodging.name`'s cap in tripPayload, so a pick always round-trips. */
const MAX_NAME_LENGTH = 120;
/** Matches `StayLodging.address`'s cap in tripPayload. */
const MAX_ADDRESS_LENGTH = 200;

/** A candidate the traveler can pick, already normalized into our own shape. */
export type GeocodeResult = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Collapse runs of whitespace to single spaces and trim the ends. */
function squash(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * The searchable form of what the traveler typed, or null when there is nothing worth
 * sending upstream. Too-short queries are rejected rather than searched because they
 * match half of Japan and waste a request against a rate-limited public service; an
 * over-long one is capped instead, since the leading words are the useful part.
 */
export function normalizeQuery(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const squashed = squash(raw);
  if (squashed.length < MIN_QUERY_LENGTH) return null;
  return squashed.slice(0, MAX_QUERY_LENGTH);
}

/** The upstream URL for a query. */
export function nominatimSearchUrl(query: string): string {
  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "jp");
  url.searchParams.set("limit", String(GEOCODE_MAX_RESULTS));
  url.searchParams.set("addressdetails", "1");
  return url.toString();
}

/**
 * The identifying User-Agent Nominatim's usage policy requires. The contact comes from
 * `GEOCODER_CONTACT` so it is never committed; without it we still identify the app.
 *
 * CR/LF are stripped because this value lands in an outgoing header, and a stray newline
 * in an environment variable is a header-injection primitive.
 */
export function geocoderUserAgent(contact: string | undefined): string {
  const cleaned = contact?.replace(/[\r\n]/g, "").trim();
  const identity = cleaned || "+https://github.com/nahuyadada/JapanIterinary";
  return `japan-itinerary-maker/0.1 (${identity})`;
}

/** Read a coordinate that jsonv2 sends as a string, tolerating a real number too. */
function coord(value: unknown, limit: number): number | null {
  // Number("") is 0, which would silently place a pin in the Gulf of Guinea.
  if (typeof value === "string" && value.trim() === "") return null;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < -limit || n > limit) return null;
  return n;
}

/**
 * Normalize a parsed Nominatim body into candidates. The upstream shape is not a contract
 * we control, so anything missing a name or a usable coordinate pair is dropped rather
 * than shown as a half-result the traveler might pick.
 */
export function parseNominatimResults(raw: unknown): GeocodeResult[] {
  if (!Array.isArray(raw)) return [];

  const out: GeocodeResult[] = [];
  for (const item of raw) {
    if (out.length >= GEOCODE_MAX_RESULTS) break;
    if (!isRecord(item)) continue;

    const display = typeof item.display_name === "string" ? squash(item.display_name) : "";
    const named = typeof item.name === "string" ? squash(item.name) : "";
    // A blank `name` is common for plain addresses; the leading segment of display_name is
    // the same thing Nominatim would have put there.
    const name = named || display.split(",")[0]?.trim() || "";
    if (!name) continue;

    const lat = coord(item.lat, 90);
    const lng = coord(item.lon, 180);
    if (lat === null || lng === null) continue;

    out.push({
      name: name.slice(0, MAX_NAME_LENGTH),
      address: (display || name).slice(0, MAX_ADDRESS_LENGTH),
      lat,
      lng,
    });
  }
  return out;
}

export type TtlCache<T> = {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
};

/** Default in-process cache lifetime. A hotel's coordinates do not move within an hour. */
export const GEOCODE_CACHE_TTL_MS = 60 * 60 * 1000;
/** Bounded so a scripted caller cannot grow the process's memory without limit. */
export const GEOCODE_CACHE_MAX_ENTRIES = 500;

/**
 * A tiny TTL cache, so repeating a lookup costs nothing upstream — one of the three things
 * Nominatim's usage policy asks for. Keys are folded to lower case with whitespace
 * collapsed, so "Hotel  Okura" and "hotel okura" share an entry.
 *
 * The clock is injected so expiry is testable without waiting or faking timers. Insertion
 * order is Map order, which makes the eviction victim the oldest key.
 */
export function createTtlCache<T>(
  ttlMs: number,
  now: () => number = Date.now,
  maxEntries: number = GEOCODE_CACHE_MAX_ENTRIES
): TtlCache<T> {
  const entries = new Map<string, { value: T; storedAt: number }>();
  const keyOf = (key: string) => squash(key).toLowerCase();

  return {
    get(key) {
      const k = keyOf(key);
      const hit = entries.get(k);
      if (!hit) return undefined;
      if (now() - hit.storedAt > ttlMs) {
        entries.delete(k);
        return undefined;
      }
      return hit.value;
    },
    set(key, value) {
      const k = keyOf(key);
      entries.delete(k);
      if (entries.size >= maxEntries) {
        const oldest = entries.keys().next();
        if (!oldest.done) entries.delete(oldest.value);
      }
      entries.set(k, { value, storedAt: now() });
    },
  };
}
