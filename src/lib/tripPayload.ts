import { PLACES, type Place } from "@/data/places";
import { buildItinerary, type Day } from "@/lib/itinerary";
import type { TransportMode } from "@/lib/navigation";

/**
 * The serializable form of a trip — the inputs the wizard collected, not the rendered
 * itinerary. The shared page rebuilds days with the same pure functions the wizard
 * uses, so a shared link picks up later routing improvements instead of freezing a
 * stale schedule.
 */
/**
 * Where the traveler is actually staying for one stay.
 *
 * Coordinates are optional because the two ways of getting them — geocoding and a dropped
 * pin — can both be unavailable, and because a payload written by the earlier free-text
 * version carries a name and nothing else. Name-only degrades to text-origin behavior
 * rather than failing.
 */
export type StayLodging = {
  /** What the traveler typed, or the name the geocoder returned. */
  name: string;
  /** Present once resolved by geocoding or a dropped pin; absent means name-only. */
  lat?: number;
  lng?: number;
  /** Geocoder address line, kept to disambiguate similar names. */
  address?: string;
  /** How the coordinates were obtained, surfaced so the traveler knows what to trust. */
  source?: "geocoded" | "pinned";
};

export type TripPayload = {
  /** Schema version, so an older stored payload is recognised rather than guessed at. */
  v: 1;
  selectedIds: string[];
  /** Local ISO dates, "YYYY-MM-DD". */
  start: string;
  end: string;
  startCity?: string;
  endCity?: string;
  manualMoves: Record<string, number>;
  dayAllocations: Record<string, number>;
  adults: number;
  transportMode: TransportMode;
  /**
   * Where the traveler is staying, keyed by stay key (`${region}-${firstDayIndex}`). The
   * field name and key format are unchanged from the free-text version, so existing shared
   * links and stored localStorage state keep resolving.
   */
  stayOrigins: Record<string, StayLodging>;
  /** Custom user-added locations */
  customPlaces?: Place[];
};

const TRANSPORT_MODES: TransportMode[] = ["transit", "walking", "driving"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SELECTED = 200;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Keep only entries whose value is a finite number, coerced to a whole number. */
function numberMap(v: unknown): Record<string, number> {
  if (!isRecord(v)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(v)) {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = Math.floor(value);
  }
  return out;
}

const MAX_LODGING_NAME = 120;
const MAX_LODGING_ADDRESS = 200;
/** Matches the other defensive caps: no realistic trip has this many stays. */
const MAX_STAYS = 40;
const LODGING_SOURCES: StayLodging["source"][] = ["geocoded", "pinned"];

/** A coordinate that is a real number inside its range, or undefined. */
function coordinate(value: unknown, limit: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < -limit || value > limit) return undefined;
  return value;
}

/**
 * Normalize one stay's accommodation from untrusted input, or null when there is nothing
 * usable. Accepts a bare string, which is what the earlier free-text version wrote and
 * what every already-shared link still contains.
 *
 * Half a coordinate pair is never kept: a lone latitude would put the traveler's hotel on
 * the Greenwich meridian, which is worse than admitting we have no coordinates.
 */
function parseLodging(value: unknown): StayLodging | null {
  if (typeof value === "string") {
    const name = value.trim().slice(0, MAX_LODGING_NAME);
    return name ? { name } : null;
  }
  if (!isRecord(value)) return null;

  const name =
    typeof value.name === "string" ? value.name.trim().slice(0, MAX_LODGING_NAME) : "";
  if (!name) return null;

  const lodging: StayLodging = { name };

  const lat = coordinate(value.lat, 90);
  const lng = coordinate(value.lng, 180);
  if (lat !== undefined && lng !== undefined) {
    lodging.lat = lat;
    lodging.lng = lng;
  }

  if (typeof value.address === "string" && value.address.trim()) {
    lodging.address = value.address.trim().slice(0, MAX_LODGING_ADDRESS);
  }

  // Coordinates are what `source` describes, so it is meaningless without them.
  if (lodging.lat !== undefined) {
    const source = LODGING_SOURCES.find((s) => s === value.source);
    if (source) lodging.source = source;
  }

  return lodging;
}

/**
 * Keep only stays whose value normalizes to a usable accommodation.
 *
 * Exported because `localStorage` is a second trust boundary with the same problem: state
 * saved by the earlier free-text version holds plain strings, and the wizard must migrate
 * those on hydration rather than hand `Record<string, string>` to code expecting objects.
 */
export function parseStayLodgings(v: unknown): Record<string, StayLodging> {
  if (!isRecord(v)) return {};
  const out: Record<string, StayLodging> = {};
  for (const [key, value] of Object.entries(v)) {
    if (Object.keys(out).length >= MAX_STAYS) break;
    const lodging = parseLodging(value);
    if (lodging) out[key] = lodging;
  }
  return out;
}

function parseCustomPlaces(raw: unknown): Place[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const valid: Place[] = [];
  for (const item of raw) {
    if (isRecord(item) && typeof item.id === "string" && typeof item.name === "string" && typeof item.region === "string") {
      valid.push({
        id: item.id.slice(0, 64),
        name: item.name.slice(0, 100),
        city: typeof item.city === "string" ? item.city.slice(0, 100) : item.region,
        region: item.region as any,
        category: typeof item.category === "string" ? (item.category as any) : "food",
        description: typeof item.description === "string" ? item.description.slice(0, 300) : "",
        lat: typeof item.lat === "number" && Number.isFinite(item.lat) ? item.lat : NaN,
        lng: typeof item.lng === "number" && Number.isFinite(item.lng) ? item.lng : NaN,
        durationHours: typeof item.durationHours === "number" && Number.isFinite(item.durationHours) ? item.durationHours : 1,
        customTime: typeof item.customTime === "string" ? item.customTime.slice(0, 20) : undefined,
        isCustom: true,
        activities: Array.isArray(item.activities) ? item.activities.filter((a): a is string => typeof a === "string").slice(0, 5) : [],
      });
    }
  }
  return valid.length > 0 ? valid : undefined;
}

/** Build the payload for sharing from the wizard's current state. */
export function buildPayload(input: {
  selectedIds: string[];
  start: string;
  end: string;
  startCity?: string;
  endCity?: string;
  manualMoves: Record<string, number>;
  dayAllocations: Record<string, number>;
  adults: number;
  transportMode: TransportMode;
  stayOrigins: Record<string, StayLodging>;
  customPlaces?: Place[];
}): TripPayload {
  return {
    v: 1,
    selectedIds: input.selectedIds,
    start: input.start,
    end: input.end,
    ...(input.startCity ? { startCity: input.startCity } : {}),
    ...(input.endCity ? { endCity: input.endCity } : {}),
    manualMoves: input.manualMoves,
    dayAllocations: input.dayAllocations,
    adults: input.adults,
    transportMode: input.transportMode,
    stayOrigins: input.stayOrigins,
    ...(input.customPlaces && input.customPlaces.length > 0 ? { customPlaces: input.customPlaces } : {}),
  };
}

/**
 * Validate untrusted JSON into a TripPayload, or null when it isn't usable.
 */
export function parsePayload(raw: unknown): TripPayload | null {
  if (!isRecord(raw)) return null;
  if (raw.v !== 1) return null;

  const { start, end } = raw;
  if (typeof start !== "string" || !ISO_DATE.test(start)) return null;
  if (typeof end !== "string" || !ISO_DATE.test(end)) return null;
  if (end < start) return null;

  const customPlaces = parseCustomPlaces(raw.customPlaces);
  const known = new Set([
    ...PLACES.map((p) => p.id),
    ...(customPlaces ? customPlaces.map((p) => p.id) : []),
  ]);

  const selectedIds = Array.isArray(raw.selectedIds)
    ? [
        ...new Set(
          raw.selectedIds.filter((id): id is string => typeof id === "string" && known.has(id))
        ),
      ].slice(0, MAX_SELECTED)
    : [];
  if (selectedIds.length === 0) return null;

  const mode = TRANSPORT_MODES.find((m) => m === raw.transportMode) ?? "transit";
  const adults =
    typeof raw.adults === "number" && Number.isFinite(raw.adults)
      ? Math.min(8, Math.max(1, Math.floor(raw.adults)))
      : 2;

  return {
    v: 1,
    selectedIds,
    start,
    end,
    ...(typeof raw.startCity === "string" && raw.startCity ? { startCity: raw.startCity } : {}),
    ...(typeof raw.endCity === "string" && raw.endCity ? { endCity: raw.endCity } : {}),
    manualMoves: numberMap(raw.manualMoves),
    dayAllocations: numberMap(raw.dayAllocations),
    adults,
    transportMode: mode,
    stayOrigins: parseStayLodgings(raw.stayOrigins),
    ...(customPlaces ? { customPlaces } : {}),
  };
}

/** The trip's selected places, in catalog order followed by custom places. */
export function payloadPlaces(payload: TripPayload): Place[] {
  const catalogPlaces = PLACES.filter((p) => payload.selectedIds.includes(p.id));
  const customPlaces = (payload.customPlaces ?? []).filter((p) => payload.selectedIds.includes(p.id));
  return [...catalogPlaces, ...customPlaces];
}



/**
 * Rebuild the itinerary days from a payload, applying manual day moves exactly as the
 * wizard does so a shared link shows the same schedule the author saw.
 */
export function payloadToItinerary(payload: TripPayload): Day[] {
  const places = payloadPlaces(payload);
  const base = buildItinerary(places, new Date(payload.start), new Date(payload.end), {
    startCity: payload.startCity,
    endCity: payload.endCity,
    dayAllocations: payload.dayAllocations,
  });

  const moves = Object.entries(payload.manualMoves).filter(([id]) =>
    places.some((p) => p.id === id)
  );
  if (moves.length === 0) return base;

  const maxIndex = base.length - 1;
  const moved = new Set(moves.map(([id]) => id));
  const cleaned = base.map((d) => ({ ...d, places: d.places.filter((p) => !moved.has(p.id)) }));
  for (const [placeId, rawTarget] of moves) {
    const place = places.find((p) => p.id === placeId);
    if (!place) continue;
    cleaned[Math.min(Math.max(rawTarget, 0), maxIndex)].places.push(place);
  }
  return cleaned;
}

const PLACE_INDEX_MAP = new Map(PLACES.map((p, i) => [p.id, i]));

function resolvePlaceId(token: string): string {
  const num = parseInt(token, 10);
  if (!isNaN(num) && num >= 0 && num < PLACES.length) {
    return PLACES[num].id;
  }
  return token;
}

function resolvePlaceToken(id: string): string {
  const idx = PLACE_INDEX_MAP.get(id);
  return idx !== undefined ? String(idx) : id;
}

/**
 * The compact stay format: `key:lat:lng:src:name`, entries joined by `|`.
 *
 * A stay used to be written as `key:name`, which silently dropped everything but the name
 * once accommodations grew coordinates — and this format is the *only* share path when
 * there is no database, so that loss would not have been cosmetic. Coordinates come before
 * the name so the shape can be told apart from a legacy entry positionally.
 *
 * The address is deliberately not carried; it is display-only disambiguation, and up to
 * 200 characters per stay is a poor trade in a format whose entire purpose is URL length.
 * A `?p=` link therefore shows the hotel's name and its pin, without the address line.
 */
const SOURCE_TO_TOKEN: Record<NonNullable<StayLodging["source"]>, string> = {
  geocoded: "g",
  pinned: "p",
};
const TOKEN_TO_SOURCE: Record<string, StayLodging["source"]> = { g: "geocoded", p: "pinned" };
const COMPACT_NUMBER = /^-?\d+(\.\d+)?$/;

/**
 * Percent-encode a name so it cannot contain the `:`, `|`, or `~` that delimit this format.
 * `encodeURIComponent` leaves `~` alone, so it is escaped by hand — a hotel name containing
 * a tilde used to corrupt the whole compact string, not just its own entry.
 */
function encodeStayName(name: string): string {
  return encodeURIComponent(name).replace(/~/g, "%7E");
}

function decodeStayName(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    // A hand-edited link can hold a malformed escape; the raw text is still better than
    // dropping the stay, and parsePayload has the final say either way.
    return raw;
  }
}

function encodeStay([key, lodging]: [string, StayLodging]): string {
  const hasCoords = lodging.lat !== undefined && lodging.lng !== undefined;
  const lat = hasCoords ? String(lodging.lat) : "";
  const lng = hasCoords ? String(lodging.lng) : "";
  const src = lodging.source ? SOURCE_TO_TOKEN[lodging.source] : "";
  return `${key}:${lat}:${lng}:${src}:${encodeStayName(lodging.name)}`;
}

/** True when a compact field is a number or the empty string standing in for "absent". */
function isNumberOrBlank(field: string): boolean {
  return field === "" || COMPACT_NUMBER.test(field);
}

/**
 * Read one compact stay entry, in either the current or the legacy shape. Returns the raw
 * object for `parsePayload` to validate — no trust decisions are made here.
 */
function decodeStay(item: string): [string, unknown] | null {
  const fields = item.split(":");
  const key = fields[0];
  if (!key || fields.length < 2) return null;

  const isCurrentShape =
    fields.length >= 5 &&
    isNumberOrBlank(fields[1]) &&
    isNumberOrBlank(fields[2]) &&
    (fields[3] === "" || fields[3] === "g" || fields[3] === "p");

  if (!isCurrentShape) {
    // Legacy `key:name` — everything after the first colon is the typed name.
    const name = item.slice(item.indexOf(":") + 1);
    return name ? [key, name] : null;
  }

  const name = decodeStayName(fields.slice(4).join(":"));
  if (!name) return null;

  const lodging: Record<string, unknown> = { name };
  if (fields[1] !== "" && fields[2] !== "") {
    lodging.lat = Number(fields[1]);
    lodging.lng = Number(fields[2]);
    const source = TOKEN_TO_SOURCE[fields[3]];
    if (source) lodging.source = source;
  }
  return [key, lodging];
}

/** Encode a TripPayload into a super compact URL-safe string. */
export function encodePayload(payload: TripPayload): string {
  const placeTokens = payload.selectedIds ? payload.selectedIds.map(resolvePlaceToken).join(",") : "";

  const parts: string[] = [
    payload.start,
    payload.end,
    String(payload.adults),
    payload.transportMode,
    placeTokens,
  ];

  const hasCities = Boolean(payload.startCity || payload.endCity);
  const hasMoves = Object.keys(payload.manualMoves).length > 0;
  const hasAllocs = Object.keys(payload.dayAllocations).length > 0;
  const hasStays = Object.keys(payload.stayOrigins).length > 0;

  if (hasCities || hasMoves || hasAllocs || hasStays) {
    parts.push(`${payload.startCity ?? ""}:${payload.endCity ?? ""}`);
  }
  if (hasMoves || hasAllocs || hasStays) {
    const moves = Object.entries(payload.manualMoves)
      .map(([id, day]) => `${resolvePlaceToken(id)}:${day}`)
      .join(",");
    parts.push(moves);
  }
  if (hasAllocs || hasStays) {
    const allocs = Object.entries(payload.dayAllocations)
      .map(([id, count]) => `${resolvePlaceToken(id)}:${count}`)
      .join(",");
    parts.push(allocs);
  }
  if (hasStays) {
    const stays = Object.entries(payload.stayOrigins).map(encodeStay).join("|");
    parts.push(stays);
  }

  return parts.join("~");
}

/** Decode a compact string or base64url string back into a TripPayload, or null if invalid. */
export function decodePayload(raw: string): TripPayload | null {
  if (!raw || typeof raw !== "string") return null;

  // 1. Try compact string format (e.g. 2026-08-01~2026-08-11~2~transit~0,1,2,3)
  if (raw.includes("~")) {
    try {
      const parts = raw.split("~");
      if (parts.length >= 5) {
        const [start, end, adultsStr, modeStr, placesStr, citiesStr, movesStr, allocsStr, staysStr] = parts;
        const selectedIds = placesStr ? placesStr.split(",").map(resolvePlaceId) : [];
        
        let startCity: string | undefined;
        let endCity: string | undefined;
        if (citiesStr) {
          const [sc, ec] = citiesStr.split(":");
          if (sc) startCity = sc;
          if (ec) endCity = ec;
        }

        const manualMoves: Record<string, number> = {};
        if (movesStr) {
          for (const item of movesStr.split(",")) {
            const [pToken, dayStr] = item.split(":");
            if (pToken && dayStr) {
              const pId = resolvePlaceId(pToken);
              const day = parseInt(dayStr, 10);
              if (!isNaN(day)) manualMoves[pId] = day;
            }
          }
        }

        const dayAllocations: Record<string, number> = {};
        if (allocsStr) {
          for (const item of allocsStr.split(",")) {
            const [pToken, countStr] = item.split(":");
            if (pToken && countStr) {
              const pId = resolvePlaceId(pToken);
              const count = parseInt(countStr, 10);
              if (!isNaN(count)) dayAllocations[pId] = count;
            }
          }
        }

        const stayOrigins: Record<string, unknown> = {};
        if (staysStr) {
          for (const item of staysStr.split("|")) {
            const entry = decodeStay(item);
            if (entry) stayOrigins[entry[0]] = entry[1];
          }
        }

        return parsePayload({
          v: 1,
          selectedIds,
          start,
          end,
          adults: parseInt(adultsStr, 10),
          transportMode: modeStr,
          startCity,
          endCity,
          manualMoves,
          dayAllocations,
          stayOrigins,
        });
      }
    } catch {
      // Fallback
    }
  }

  // 2. Fallback to base64url JSON decoding
  try {
    let json: string;
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(raw, "base64url").toString("utf-8");
    } else {
      const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      json = new TextDecoder().decode(bytes);
    }
    const parsed = JSON.parse(json);
    return parsePayload(parsed);
  } catch {
    return null;
  }
}


