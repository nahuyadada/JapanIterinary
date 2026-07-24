# Japan Itinerary Maker — Design

**Date:** 2026-07-24
**Status:** Approved

## Summary

Convert the existing "DatePlanner" collaborative trip app into a simple, no-login
**Japan itinerary maker**. The user browses a curated, built-in catalog of places
in Japan, selects the ones they want to visit, picks a trip date range, and the app
auto-generates an editable day-by-day itinerary with a map.

No accounts, no database, no backend APIs. All state lives in the browser
(persisted to `localStorage` so a refresh doesn't lose the trip).

## Goals

- Browse a curated list of Japan places, grouped by region.
- Select/deselect places to visit.
- Pick a trip date range.
- Auto-distribute selected places into a day-by-day itinerary, keeping places in the
  same region on the same/adjacent days.
- Let the user tweak the result (move a place to another day, remove a place).

## Non-Goals (YAGNI)

- User accounts / authentication.
- Persistence beyond the local browser.
- Collaboration / sharing links.
- Budget tracking, weather, live places-search APIs.
- Manual free-form stop entry.

## Architecture

Client-side single-page wizard built on the existing Next.js 16 + React 19 + Tailwind
stack. One client component owns the wizard state; itinerary generation is a pure,
unit-tested function. Leaflet (already a dependency) renders the itinerary map.

### Data — `src/data/places.ts`

A static array of ~40 curated places grouped by region:
Tokyo, Kyoto, Osaka, Hiroshima, Hakone/Fuji, Sapporo/Hokkaido, Nara.

Each place:

```ts
type Place = {
  id: string;
  name: string;
  city: string;
  region: string;
  category:
    | "temple-shrine"
    | "scenic"
    | "food"
    | "nightlife"
    | "activity"
    | "shopping"
    | "nature"
    | "landmark";
  description: string; // short, 1-2 sentences
  lat: number;
  lng: number;
};
```

### Flow — `src/app/page.tsx` (client component)

A `step` state machine: `select → dates → itinerary`, with a progress header.

1. **Select places** — catalog grouped by region; filter by region and/or category;
   each place is a toggle card; running count of selected places. "Next" requires ≥1
   selection.
2. **Pick dates** — start + end date inputs; shows computed trip length in days;
   validates `end >= start`. "Next" requires valid dates.
3. **Itinerary** — auto-generated day-by-day plan plus a map. Editable: move a place
   to another day (dropdown/buttons) or remove it. "Start over" resets all state.

Wizard state (selected place ids, start/end date, current step, and any manual
itinerary edits) is persisted to `localStorage` and rehydrated on load.

### Itinerary logic — `src/lib/itinerary.ts`

Pure function:

```ts
buildItinerary(selectedPlaces: Place[], startDate: Date, endDate: Date): Day[]
// Day = { date: Date; dayIndex: number; places: Place[] }
```

Algorithm:
- Compute the list of days from the (inclusive) date range.
- Group selected places by region.
- Allocate each region a contiguous block of days, sized proportional to how many
  places it contains, so places from one region stay together.
- Within a region's block, fill days up to a max of **4** places per day.

Edge cases:
- More places than day-slots (days × 4): overflow onto later days rather than dropping.
- Fewer places than days: some days are left empty.
- Single-day trip: all places land on day 1.

This function is pure (no I/O, no Date.now) and covered by Vitest unit tests.

### Components

- `PlaceCard` — a selectable place tile (name, city, category, description, selected state).
- `RegionFilter` — region + category filter controls for the catalog.
- `DateRangePicker` — start/end date inputs with validation + trip-length readout.
- `ItineraryDay` — one day column/section listing its places, with move/remove controls.
- `ItineraryMap` — adapted from the existing `PlanMap`; numbered markers colored per day.

## Cleanup / Deletions

Remove everything tied to auth, DB, and the old plan model:

- `prisma/` (schema + migrations)
- `src/lib/auth.ts`, `src/lib/prisma.ts`, `src/lib/access.ts` (+ test),
  `src/lib/budget.ts` (+ test), `src/lib/planAccess.ts`
- `src/app/api/*` (auth, places/search, plans, register, weather)
- `src/app/login`, `src/app/register`, `src/app/plans`, `src/app/shared`
- `src/types/next-auth.d.ts`, `src/proxy.ts` (verify before deleting)
- Old components no longer used: `AddStopPanel`, `AppNav`, `BudgetBar`, `NewPlanForm`,
  `PlanView`, `PrintButton`, `StopCard`, `WeatherStrip` (keep/adapt `PlanMap` → `ItineraryMap`)
- Drop deps from `package.json`: `@prisma/client`, `prisma`, `next-auth`, `bcryptjs`
  (and their `@types`). Keep `next`, `react`, `react-dom`, `leaflet`, `react-leaflet`,
  `tailwindcss`, `vitest`.
- Update `README.md` to describe the Japan itinerary maker.

## Testing

- Vitest unit tests for `buildItinerary`: region grouping, contiguous day blocks,
  max-per-day fill, overflow, empty days, single-day trip, and inclusive date math.
- Manual verification of the wizard flow end-to-end in the browser.

## Notes

- Per the repo's `AGENTS.md`, this Next.js version has breaking changes; check
  `node_modules/next/dist/docs/` before writing Next-specific code.
- Version control is handled by the user; do not run git add/commit.
