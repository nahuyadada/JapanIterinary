# Itinerary-based accommodation recommendations — design

**Date:** 2026-07-25
**Status:** Approved (pending spec review)

## Problem

Given a user's built itinerary, recommend where to stay so travel time and
commuting cost are minimized. Instead of listing every place to stay, analyze
each day's planned attractions, group the trip into location-based "stays," and
suggest lodging **districts** central to each stay's attractions.

Example: four days in Osaka → recommend Namba / Umeda; itinerary moves to Kyoto →
recommend Kyoto Station / Gion; on to Tokyo → Shinjuku / Ueno, depending on the
attractions actually planned.

## Constraints & context

- The app is fully static/offline: attractions live in `src/data/places.ts` as a
  typed array (`Place` with `lat`, `lng`, `region`, `city`). No backend, no APIs.
- Itinerary logic in `src/lib/itinerary.ts` is pure and unit-tested (vitest). It
  already starts a new day when the region changes, so the itinerary naturally
  forms contiguous per-region runs.
- The itinerary step (`src/components/Wizard.tsx`) renders a Leaflet map
  (`ItineraryMap`) plus per-day cards (`ItineraryDay`).
- `AGENTS.md`: this Next.js version has breaking changes — read the relevant guide
  in `node_modules/next/dist/docs/` before writing component code.

## Decisions

- **Recommend districts/areas** as the core "minimize travel" intelligence — a
  curated set of lodging neighborhoods per region, ranked by proximity to the stay's
  attractions.
- **Real listings & real bookings via deep links.** For each recommended area we
  generate links to real booking providers (Booking.com for hotels, Airbnb for
  homes), pre-filtered to the area **and the stay's check-in/check-out dates and
  traveler count**. The listings shown and bookings made are real and live on the
  provider's site. Nothing is fabricated — we never invent property names, prices,
  or ratings.
- **Presentation:** a dedicated "Where to stay" section in the itinerary step, plus
  distinct lodging markers on the existing map.
- **Up to 3 ranked areas per stay.**
- No in-app live prices/availability (would require a backend + paid API and would go
  stale). No cross-stay station-proximity math (YAGNI); station convenience is static
  copy where relevant.

## Data model — `src/data/lodging.ts`

```ts
export type LodgingArea = {
  id: string;
  name: string;        // "Namba", "Shinjuku", "Gion"
  region: Region;      // reuses the existing Region union from places.ts
  lat: number;
  lng: number;
  blurb: string;       // one line on the neighborhood's character
  goodFor: string;     // e.g. "Nightlife & food, excellent transit"
  searchTerm?: string; // optional override for the booking-search query;
                       // defaults to `${name}, ${region-ish city}, Japan`
};

export const LODGING_AREAS: LodgingArea[];
```

Author **2–4 areas for every `Region`** that appears in `places.ts`, so any possible
stay yields a recommendation. Coordinates are the district center. These are real,
well-known lodging neighborhoods — used both for the proximity ranking and as the
search term handed to the booking providers.

## Recommendation logic — `src/lib/lodging.ts` (pure, tested)

Types:

```ts
export type Stay = {
  region: Region;
  dayIndexes: number[];   // contiguous day indexes in this stay
  nights: number;         // nights booked = daysBetween(checkIn, checkOut)
  checkIn: Date;          // date of the first day of the stay
  checkOut: Date;         // date the trip leaves this region (last stay day + 1)
  places: Place[];        // all attractions across those days
};

export type BookingLink = {
  provider: "booking" | "airbnb";
  label: string;          // "Book hotels" / "Book on Airbnb"
  url: string;
};

export type StayRecommendation = {
  stay: Stay;
  areas: LodgingArea[];   // top-N (<=3) ranked best-first
};
```

Functions:

- `groupStays(days: Day[]): Stay[]` — collapse the itinerary into stays: each
  maximal run of consecutive days sharing one `region`. Days with no places are
  attached to the current run (they do not break or start a stay). A multi-day
  single-place block (e.g. USJ) stays within its region run. `checkIn` = first day's
  date; `checkOut` = the day after the stay's last day (i.e. the next region's start,
  or the trip's end date + 1 for the final stay); `nights` = whole days between them
  (min 1).
- `haversineKm(aLat, aLng, bLat, bLng): number` — great-circle distance helper.
- `recommendForStay(stay: Stay, limit = 3): LodgingArea[]` — of the lodging areas
  in the stay's region, score each by the **mean haversine distance to all the
  stay's attractions** (the base minimizing average commuting) and return the top
  `limit`, ascending. Deterministic tie-break by `id`. If the stay has no attraction
  coordinates, fall back to the region's areas in declared order. Returns `[]` only
  if the region has no lodging areas.
- `recommendStays(days: Day[], limit = 3): StayRecommendation[]` — orchestrates the
  above for the UI.
- `toISODate(d: Date): string` — local-time `YYYY-MM-DD` (no UTC shift).
- `bookingLinksForArea(area: LodgingArea, checkIn: Date, checkOut: Date, adults: number): BookingLink[]`
  — build real, date-filtered provider URLs. All params `encodeURIComponent`-escaped;
  no personal data in the query string.
  - Booking.com:
    `https://www.booking.com/searchresults.html?ss=<query>&checkin=<in>&checkout=<out>&group_adults=<adults>`
  - Airbnb:
    `https://www.airbnb.com/s/<query>/homes?checkin=<in>&checkout=<out>&adults=<adults>`
  - `<query>` = `area.searchTerm ?? "${area.name}, Japan"`.

Mean-distance (not centroid-nearest) directly models "minimize travel time" and
makes the choice attraction-dependent — e.g. Shinjuku vs Ueno depends on which
Tokyo attractions were planned.

## UI

- **`src/components/WhereToStay.tsx`** — rendered in the itinerary step. One card per
  stay: header like "Nights 1–4 · Osaka · Jul 25 → Jul 29", then up to 3 areas with
  the top pick highlighted, each showing `name`, `blurb`, `goodFor`, and its
  **Booking.com** and **Airbnb** buttons (`bookingLinksForArea`). Links open in a new
  tab with `target="_blank" rel="noopener noreferrer"`. Styling matches the existing
  Tailwind card look (`ItineraryDay`), including dark-mode classes.
- **`ItineraryMap`** — also plot the **top recommended area per stay** with a visually
  distinct marker (house/bed glyph, different color) vs the numbered attraction pins,
  and a popup naming the area and its stay. Attraction markers are unchanged.
- **`Wizard.tsx`** — compute `recommendStays(days)` (memoized) and render
  `WhereToStay`; pass stay recommendations into `ItineraryMap`. Add a small
  **travelers** count input (adults, default 2, range 1–8) to the dates step; it is
  persisted with the rest of the wizard state and feeds the booking links.
- **Travelers state:** extend `PersistedState` in `Wizard.tsx` with `adults: number`
  (default 2) so booking links reflect party size and survive reloads.

## Testing (vitest, matching `itinerary.test.ts` style)

- `groupStays`: contiguous per-region grouping; empty-place days absorbed; multi-day
  place stays in one stay; single-day trip; empty itinerary; correct `checkIn` /
  `checkOut` / `nights` (including the final stay's checkout = end + 1).
- `recommendForStay`: picks the nearest area by mean distance; ranking changes with
  different attraction sets; respects `limit`; deterministic tie-break; empty-region
  and no-coordinate fallbacks.
- `haversineKm`: sanity check on a known distance.
- `toISODate`: local-time formatting with no UTC off-by-one.
- `bookingLinksForArea`: correct provider hosts, `checkin`/`checkout`/`adults` params,
  and URL-encoding of the search term.

## Out of scope

In-app live prices/availability, ratings, per-night pricing, filtering by
budget/type, and optimizing hotel location for inter-city transfer (next-leg station
proximity). Actual booking happens on the provider's site via the deep links.
```