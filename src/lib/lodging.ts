import type { Place, Region } from "@/data/places";
import type { Day } from "@/lib/itinerary";
import { LODGING_AREAS, type LodgingArea } from "@/data/lodging";

const EARTH_RADIUS_KM = 6371;
const MS_PER_DAY = 86_400_000;

/** Great-circle distance in kilometers between two lat/lng points. */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Local-time YYYY-MM-DD (no UTC conversion, so no off-by-one across time zones). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type Stay = {
  region: Region;
  /** Contiguous day indexes belonging to this stay. */
  dayIndexes: number[];
  /** Nights booked = whole days between checkIn and checkOut (min 1). */
  nights: number;
  /** Date of the first day of the stay. */
  checkIn: Date;
  /** Departure date: the day after the stay's last day. */
  checkOut: Date;
  /** All attractions planned across the stay's days. */
  places: Place[];
};

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(ms / MS_PER_DAY));
}

/**
 * Collapse a built itinerary into stays: each maximal run of consecutive days
 * that share a region. Days with no places are absorbed into the current run
 * rather than breaking it. checkOut is the day after the run's last day.
 */
export function groupStays(days: Day[]): Stay[] {
  const withPlaces = days.filter((d) => d.places.length > 0);
  if (withPlaces.length === 0) return [];

  type Run = { region: Region; days: Day[] };
  const runs: Run[] = [];
  for (const d of days) {
    const region = d.places[0]?.region;
    if (region == null) {
      // Empty day: attach to the current run if one exists; otherwise skip.
      if (runs.length > 0) runs[runs.length - 1].days.push(d);
      continue;
    }
    const current = runs[runs.length - 1];
    if (current && current.region === region) {
      current.days.push(d);
    } else {
      runs.push({ region, days: [d] });
    }
  }

  return runs.map((run) => {
    const dayIndexes = run.days.map((d) => d.dayIndex);
    const checkIn = new Date(run.days[0].date);
    const lastDate = run.days[run.days.length - 1].date;
    const checkOut = new Date(lastDate.getTime() + MS_PER_DAY);
    return {
      region: run.region,
      dayIndexes,
      nights: nightsBetween(checkIn, checkOut),
      checkIn,
      checkOut,
      places: run.days.flatMap((d) => d.places),
    };
  });
}

export type StayRecommendation = {
  stay: Stay;
  /** Best-first, up to `limit` areas. */
  areas: LodgingArea[];
};

/** Mean great-circle distance (km) from an area to all of the stay's attractions. */
function meanDistanceToPlaces(area: LodgingArea, places: Place[]): number {
  const coords = places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (coords.length === 0) return Number.POSITIVE_INFINITY;
  const total = coords.reduce(
    (sum, p) => sum + haversineKm(area.lat, area.lng, p.lat, p.lng),
    0
  );
  return total / coords.length;
}

/**
 * Rank the stay's region lodging areas by mean distance to the stay's attractions
 * (closest first). Ties break by id for determinism. With no usable attraction
 * coordinates, returns the region's areas in declared order.
 */
export function recommendForStay(stay: Stay, limit = 3): LodgingArea[] {
  const regionAreas = LODGING_AREAS.filter((a) => a.region === stay.region);
  const hasCoords = stay.places.some(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
  );
  if (!hasCoords) return regionAreas.slice(0, limit);

  return [...regionAreas]
    .sort((a, b) => {
      const da = meanDistanceToPlaces(a, stay.places);
      const db = meanDistanceToPlaces(b, stay.places);
      return da - db || a.id.localeCompare(b.id);
    })
    .slice(0, limit);
}

export function recommendStays(days: Day[], limit = 3): StayRecommendation[] {
  return groupStays(days).map((stay) => ({
    stay,
    areas: recommendForStay(stay, limit),
  }));
}

export type BookingLink = {
  provider: "booking" | "airbnb";
  label: string;
  url: string;
};

/**
 * Build real, date-filtered deep links to booking providers for an area.
 * Bookings happen on the provider's site; nothing here fabricates listings.
 */
export function bookingLinksForArea(
  area: LodgingArea,
  checkIn: Date,
  checkOut: Date,
  adults: number
): BookingLink[] {
  const query = area.searchTerm ?? `${area.name}, Japan`;
  const inDate = toISODate(checkIn);
  const outDate = toISODate(checkOut);
  const guests = Math.max(1, Math.floor(adults));

  const bookingUrl =
    "https://www.booking.com/searchresults.html?" +
    `ss=${encodeURIComponent(query)}` +
    `&checkin=${inDate}&checkout=${outDate}` +
    `&group_adults=${guests}`;

  const airbnbUrl =
    `https://www.airbnb.com/s/${encodeURIComponent(query)}/homes?` +
    `checkin=${inDate}&checkout=${outDate}&adults=${guests}`;

  return [
    { provider: "booking", label: "Book hotels", url: bookingUrl },
    { provider: "airbnb", label: "Book on Airbnb", url: airbnbUrl },
  ];
}
