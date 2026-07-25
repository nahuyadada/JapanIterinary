import { PLACES, type Place } from "@/data/places";
import { buildItinerary, type Day } from "@/lib/itinerary";
import type { TransportMode } from "@/lib/navigation";

/**
 * The serializable form of a trip — the inputs the wizard collected, not the rendered
 * itinerary. The shared page rebuilds days with the same pure functions the wizard
 * uses, so a shared link picks up later routing improvements instead of freezing a
 * stale schedule.
 */
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
  /** Where the traveler is staying, keyed by stay key (`${region}-${firstDayIndex}`). */
  stayOrigins: Record<string, string>;
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

/** Keep only entries whose value is a non-empty string, trimmed and length-capped. */
function stringMap(v: unknown): Record<string, string> {
  if (!isRecord(v)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(v)) {
    if (typeof value === "string" && value.trim()) out[key] = value.trim().slice(0, 120);
  }
  return out;
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
  stayOrigins: Record<string, string>;
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
  };
}

/**
 * Validate untrusted JSON into a TripPayload, or null when it isn't usable.
 *
 * This is the trust boundary: the input comes from the database, which was written by
 * an unauthenticated request. Anything unrecognised is dropped rather than believed —
 * notably place ids, which are checked against the catalog so a stale or forged id
 * can't reach the itinerary builder.
 */
export function parsePayload(raw: unknown): TripPayload | null {
  if (!isRecord(raw)) return null;
  if (raw.v !== 1) return null;

  const { start, end } = raw;
  if (typeof start !== "string" || !ISO_DATE.test(start)) return null;
  if (typeof end !== "string" || !ISO_DATE.test(end)) return null;
  if (end < start) return null;

  const known = new Set(PLACES.map((p) => p.id));
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
    stayOrigins: stringMap(raw.stayOrigins),
  };
}

/** The trip's selected places, in catalog order. */
export function payloadPlaces(payload: TripPayload): Place[] {
  return PLACES.filter((p) => payload.selectedIds.includes(p.id));
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

/** Encode a TripPayload into a compact URL-safe base64 string. */
export function encodePayload(payload: TripPayload): string {
  const clean: Record<string, unknown> = {
    v: payload.v,
    selectedIds: payload.selectedIds,
    start: payload.start,
    end: payload.end,
    adults: payload.adults,
    transportMode: payload.transportMode,
  };
  if (payload.startCity) clean.startCity = payload.startCity;
  if (payload.endCity) clean.endCity = payload.endCity;
  if (Object.keys(payload.manualMoves).length > 0) clean.manualMoves = payload.manualMoves;
  if (Object.keys(payload.dayAllocations).length > 0) clean.dayAllocations = payload.dayAllocations;
  if (Object.keys(payload.stayOrigins).length > 0) clean.stayOrigins = payload.stayOrigins;

  const json = JSON.stringify(clean);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json).toString("base64url");
  }
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decode a URL-safe base64 string back into a TripPayload, or null if invalid. */
export function decodePayload(raw: string): TripPayload | null {
  if (!raw || typeof raw !== "string") return null;
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

