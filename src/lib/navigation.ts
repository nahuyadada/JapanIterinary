import type { Day } from "@/lib/itinerary";
import type { StayRecommendation } from "@/lib/lodging";
import { haversineKm } from "@/lib/lodging";

export type TransportMode = "transit" | "walking" | "driving";

export type NavPoint = { name: string; lat: number; lng: number };

/**
 * A place we only know by name — a hotel the traveler typed in. Google Maps geocodes
 * `query` on its side; we never guess coordinates for it, so anything that needs a
 * distance (and therefore a time estimate) has to treat it as unknown.
 */
export type TextPoint = { name: string; query: string };

/** Somewhere a route can start: known coordinates, or text for Google to resolve. */
export type NavOrigin = NavPoint | TextPoint;

/** Whether an origin carries real coordinates, so distance math is possible. */
export function hasCoords(point: NavOrigin): point is NavPoint {
  return "lat" in point;
}

export type Leg = {
  from: NavPoint;
  to: NavPoint;
  /** Approximate as-the-crow-flies distance in km (NOT the real route length). */
  straightLineKm: number;
};

export type DayRoute = { dayIndex: number; legs: Leg[] };

/** The `origin`/`destination` value Google Maps expects for a point. */
function mapsQuery(point: NavOrigin): string {
  return hasCoords(point) ? `${point.lat},${point.lng}` : point.query;
}

/**
 * Google Maps directions deep link. Opening it shows the real route, travel time,
/**
 * Google Maps directions deep link. Opening it shows the real route, travel time,
 * and fare on Google's side — this app does not compute or fabricate those.
 *
 * `from` may be a typed hotel with no coordinates. If `from` is null or undefined,
 * Google Maps defaults the origin to the user's current location ("Your location").
 */
export function directionsUrl(
  from: NavOrigin | null | undefined,
  to: NavPoint,
  mode: TransportMode = "transit"
): string {
  const originPart = from ? `&origin=${encodeURIComponent(mapsQuery(from))}` : "";
  return (
    "https://www.google.com/maps/dir/?api=1" +
    originPart +
    `&destination=${encodeURIComponent(mapsQuery(to))}` +
    `&travelmode=${mode}`
  );
}


/**
 * Build a per-day travel route. Because the traveler returns to the same base each
 * night, every day starts from that stay's top recommended lodging area, then chains
 * through the day's destinations in itinerary order. Days with no accommodation area
 * start from the first destination. Places without coordinates are skipped.
 */
export function buildDayRoutes(
  days: Day[],
  stayRecommendations: StayRecommendation[]
): DayRoute[] {
  const accommodationByDay = new Map<number, NavPoint>();
  for (const rec of stayRecommendations) {
    const top = rec.areas[0];
    if (!top) continue;
    for (const di of rec.stay.dayIndexes) {
      accommodationByDay.set(di, { name: top.name, lat: top.lat, lng: top.lng });
    }
  }

  return days.map((day) => {
    const points: NavPoint[] = day.places
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .map((p) => ({ name: p.name, lat: p.lat, lng: p.lng }));

    const accommodation = accommodationByDay.get(day.dayIndex);
    const sequence = accommodation ? [accommodation, ...points] : points;

    const legs: Leg[] = [];
    for (let i = 0; i < sequence.length - 1; i++) {
      const from = sequence[i];
      const to = sequence[i + 1];
      legs.push({
        from,
        to,
        straightLineKm: haversineKm(from.lat, from.lng, to.lat, to.lng),
      });
    }
    return { dayIndex: day.dayIndex, legs };
  });
}
