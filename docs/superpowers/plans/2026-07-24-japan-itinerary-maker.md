# Japan Itinerary Maker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Version control note:** This user handles git themselves. Do NOT run `git add`/`git commit`. Where a task says "Checkpoint", verify the build/tests instead of committing.

**Goal:** Turn the DatePlanner app into a no-login, client-side Japan itinerary maker: browse a curated catalog of Japan places, select some, pick a date range, and get an editable day-by-day itinerary with a map.

**Architecture:** Single client-side wizard (`select → dates → itinerary`) holding all state in React + `localStorage`. A pure, unit-tested `buildItinerary` function distributes selected places across trip days by region. Leaflet renders the itinerary map. All auth/DB/API code is deleted.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, Leaflet / react-leaflet, Vitest.

> **Repo caveat (`AGENTS.md`):** This Next.js version has breaking changes. Before writing Next-specific code (dynamic import for the map, metadata, client components), check `node_modules/next/dist/docs/`.

---

## File Structure

**Create:**
- `src/data/places.ts` — static Japan places catalog + `Place` type + region/category constants.
- `src/lib/itinerary.ts` — pure `buildItinerary` + `Day` type + date helpers.
- `src/lib/itinerary.test.ts` — Vitest unit tests.
- `src/components/PlaceCard.tsx` — selectable place tile.
- `src/components/CatalogFilters.tsx` — region + category filters.
- `src/components/DateRangePicker.tsx` — start/end inputs + validation + length readout.
- `src/components/ItineraryDay.tsx` — one day with its places + move/remove controls.
- `src/components/ItineraryMap.tsx` — Leaflet map, numbered markers colored per day (adapted from `PlanMap`).
- `src/components/Wizard.tsx` — client component owning wizard state + localStorage + step rendering.

**Modify:**
- `src/app/page.tsx` — render `<Wizard />` (server component wrapper).
- `src/app/layout.tsx` — remove `AppNav`, update metadata/title.
- `package.json` — drop auth/DB deps.
- `README.md` — describe the new app.

**Delete:** `prisma/`, `src/lib/{auth,prisma,access,access.test,budget,budget.test,planAccess}.ts`, `src/app/api/`, `src/app/{login,register,plans,shared}/`, `src/types/next-auth.d.ts`, `src/proxy.ts` (verify unused first), and unused components (`AddStopPanel`, `AppNav`, `BudgetBar`, `NewPlanForm`, `PlanView`, `PrintButton`, `StopCard`, `WeatherStrip`, `PlanMap`).

---

## Task 1: Delete obsolete auth/DB/plan code

**Files:** deletions listed above.

- [ ] **Step 1: Confirm `proxy.ts` is unused**

Run: `grep -rn "proxy" src --include=*.ts --include=*.tsx` (ignore `src/proxy.ts` itself). If nothing references it, it's safe to delete.

- [ ] **Step 2: Delete the files/dirs**

Remove: `prisma/`; `src/app/api/`; `src/app/login/`, `src/app/register/`, `src/app/plans/`, `src/app/shared/`; `src/lib/auth.ts`, `src/lib/prisma.ts`, `src/lib/access.ts`, `src/lib/access.test.ts`, `src/lib/budget.ts`, `src/lib/budget.test.ts`, `src/lib/planAccess.ts`; `src/types/next-auth.d.ts`; `src/proxy.ts`; `src/components/{AddStopPanel,AppNav,BudgetBar,NewPlanForm,PlanView,PrintButton,StopCard,WeatherStrip,PlanMap}.tsx`.

- [ ] **Step 3: Checkpoint** — the app won't build yet (page.tsx/layout.tsx still reference deleted code); that's expected. Continue.

---

## Task 2: Places catalog data

**Files:** Create `src/data/places.ts`.

- [ ] **Step 1: Define types + constants + data**

```ts
export const REGIONS = [
  "Tokyo",
  "Kyoto",
  "Osaka",
  "Nara",
  "Hakone / Fuji",
  "Hiroshima",
  "Sapporo / Hokkaido",
] as const;
export type Region = (typeof REGIONS)[number];

export const CATEGORIES = [
  "temple-shrine",
  "scenic",
  "food",
  "nightlife",
  "activity",
  "shopping",
  "nature",
  "landmark",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Place = {
  id: string;
  name: string;
  city: string;
  region: Region;
  category: Category;
  description: string;
  lat: number;
  lng: number;
};

export const PLACES: Place[] = [
  // ~40 curated entries, ~5-7 per region. Example shape:
  { id: "tokyo-sensoji", name: "Sensō-ji Temple", city: "Asakusa, Tokyo", region: "Tokyo", category: "temple-shrine", description: "Tokyo's oldest temple, framed by the Kaminarimon gate and Nakamise shopping street.", lat: 35.7148, lng: 139.7967 },
  // ...fill remaining places with real coordinates...
];
```

Populate ~40 real places with accurate `lat`/`lng` across all seven regions (e.g., Tokyo: Sensō-ji, Meiji Shrine, Shibuya Crossing, teamLab Planets, Tsukiji Outer Market, Ueno Park; Kyoto: Fushimi Inari, Kinkaku-ji, Arashiyama Bamboo Grove, Gion, Kiyomizu-dera; Osaka: Osaka Castle, Dōtonbori, Universal Studios Japan, Kuromon Market; Nara: Nara Park, Tōdai-ji; Hakone/Fuji: Lake Ashi, Hakone Open-Air Museum, Chureito Pagoda; Hiroshima: Peace Memorial Park, Miyajima/Itsukushima; Sapporo/Hokkaido: Odori Park, Otaru Canal, Niseko).

- [ ] **Step 2: Checkpoint** — `npx tsc --noEmit` has no errors in this file.

---

## Task 3: `buildItinerary` — failing tests first

**Files:** Create `src/lib/itinerary.test.ts`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { buildItinerary, tripDays } from "./itinerary";
import type { Place } from "@/data/places";

const p = (id: string, region: Place["region"]): Place => ({
  id, name: id, city: "", region, category: "landmark", description: "", lat: 0, lng: 0,
});

describe("tripDays", () => {
  it("is inclusive of both endpoints", () => {
    expect(tripDays(new Date("2026-04-01"), new Date("2026-04-03"))).toBe(3);
  });
  it("is 1 for a single-day trip", () => {
    expect(tripDays(new Date("2026-04-01"), new Date("2026-04-01"))).toBe(1);
  });
});

describe("buildItinerary", () => {
  it("creates one Day per date in the inclusive range", () => {
    const days = buildItinerary([p("a", "Tokyo")], new Date("2026-04-01"), new Date("2026-04-03"));
    expect(days).toHaveLength(3);
    expect(days.map((d) => d.dayIndex)).toEqual([0, 1, 2]);
  });

  it("keeps places from the same region contiguous", () => {
    const places = [p("t1", "Tokyo"), p("k1", "Kyoto"), p("t2", "Tokyo"), p("k2", "Kyoto")];
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-02"));
    expect(days.flatMap((d) => d.places).map((x) => x.id)).toEqual(["t1", "t2", "k1", "k2"]);
  });

  it("caps a day at 4 places and overflows to the last day when out of days", () => {
    const places = Array.from({ length: 6 }, (_, i) => p(`x${i}`, "Tokyo"));
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-01"));
    expect(days).toHaveLength(1);
    expect(days[0].places).toHaveLength(6);
  });

  it("leaves days empty when there are fewer places than days", () => {
    const days = buildItinerary([p("a", "Tokyo")], new Date("2026-04-01"), new Date("2026-04-03"));
    const nonEmpty = days.filter((d) => d.places.length > 0);
    expect(nonEmpty).toHaveLength(1);
  });

  it("assigns every selected place exactly once", () => {
    const places = [p("t1", "Tokyo"), p("k1", "Kyoto"), p("o1", "Osaka")];
    const days = buildItinerary(places, new Date("2026-04-01"), new Date("2026-04-03"));
    expect(days.flatMap((d) => d.places)).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm test`
Expected: FAIL — `buildItinerary`/`tripDays` not defined.

---

## Task 4: `buildItinerary` — implementation

**Files:** Create `src/lib/itinerary.ts`.

- [ ] **Step 1: Implement**

```ts
import type { Place, Region } from "@/data/places";
import { REGIONS } from "@/data/places";

export type Day = { date: Date; dayIndex: number; places: Place[] };

export const MAX_PER_DAY = 4;
const MS_PER_DAY = 86_400_000;

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Inclusive count of calendar days between start and end. */
export function tripDays(start: Date, end: Date): number {
  const a = atMidnight(start).getTime();
  const b = atMidnight(end).getTime();
  return Math.max(1, Math.round((b - a) / MS_PER_DAY) + 1);
}

export function buildItinerary(selected: Place[], start: Date, end: Date): Day[] {
  const count = tripDays(start, end);
  const s = atMidnight(start);
  const days: Day[] = Array.from({ length: count }, (_, i) => ({
    date: new Date(s.getTime() + i * MS_PER_DAY),
    dayIndex: i,
    places: [],
  }));

  // Order selected places by region (using REGIONS order) so same-region places are contiguous.
  const byRegion = new Map<Region, Place[]>();
  for (const place of selected) {
    const list = byRegion.get(place.region) ?? [];
    list.push(place);
    byRegion.set(place.region, list);
  }
  const ordered: Place[] = REGIONS.flatMap((r) => byRegion.get(r) ?? []);

  if (days.length === 0 || ordered.length === 0) return days;

  // Distribute: walk days, filling up to MAX_PER_DAY. If we run out of days before
  // places, overflow the remainder onto the last day so nothing is dropped.
  let dayPtr = 0;
  for (const place of ordered) {
    if (dayPtr < days.length - 1 && days[dayPtr].places.length >= MAX_PER_DAY) {
      dayPtr++;
    }
    days[dayPtr].places.push(place);
  }
  return days;
}
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: PASS (all itinerary tests).

- [ ] **Step 3: Checkpoint** — tests green.

---

## Task 5: Presentational components

**Files:** Create `PlaceCard.tsx`, `CatalogFilters.tsx`, `DateRangePicker.tsx`.

- [ ] **Step 1: `PlaceCard.tsx`** — `"use client"`. Props `{ place: Place; selected: boolean; onToggle: (id: string) => void }`. Render a card/button showing name, city, a category badge, description; highlight when `selected` (e.g. rose ring/background).

- [ ] **Step 2: `CatalogFilters.tsx`** — `"use client"`. Props `{ region: Region | "all"; category: Category | "all"; onRegion: (r: Region | "all") => void; onCategory: (c: Category | "all") => void }`. Two `<select>`s populated from `REGIONS`/`CATEGORIES` plus an "All" option.

- [ ] **Step 3: `DateRangePicker.tsx`** — `"use client"`. Props `{ start: string; end: string; onStart: (v: string) => void; onEnd: (v: string) => void }` using `<input type="date">` (ISO `yyyy-mm-dd`). Show trip length via `tripDays(new Date(start), new Date(end))` when both set; show an inline error when `end < start`.

- [ ] **Step 4: Checkpoint** — `npx tsc --noEmit` clean for these files (import types from `@/data/places`, `tripDays` from `@/lib/itinerary`).

---

## Task 6: Itinerary map

**Files:** Create `src/components/ItineraryMap.tsx` (adapt deleted `PlanMap`).

- [ ] **Step 1: Implement** — `"use client"`. Props `{ days: Day[] }`. For each day, render its located places (`lat`/`lng` present) as numbered `L.divIcon` markers colored by `dayIndex` (cycle a palette, e.g. `["#e11d48","#2563eb","#16a34a","#d97706","#7c3aed","#0891b2"]`). Center on the mean of all located coordinates; default to Japan center `[36.2048, 138.2529]` zoom 5 when none. Use `MapContainer`/`TileLayer`/`Marker`/`Popup` from `react-leaflet` and `import "leaflet/dist/leaflet.css"`. Popup shows place name + day number. Marker number = its index within the whole trip order.

- [ ] **Step 2: Checkpoint** — file compiles.

---

## Task 7: ItineraryDay component

**Files:** Create `src/components/ItineraryDay.tsx`.

- [ ] **Step 1: Implement** — `"use client"`. Props `{ day: Day; dayCount: number; onRemove: (placeId: string) => void; onMove: (placeId: string, toDayIndex: number) => void }`. Render date + "Day N", the list of places (name, city, category), and per place a remove button and a "Move to day" `<select>` listing `1..dayCount`. Empty-state text when no places.

- [ ] **Step 2: Checkpoint** — compiles.

---

## Task 8: Wizard (state, localStorage, steps)

**Files:** Create `src/components/Wizard.tsx`; the map must be loaded client-only.

- [ ] **Step 1: Implement state** — `"use client"`. State: `step: "select" | "dates" | "itinerary"`, `selectedIds: string[]`, `start: string`, `end: string`, catalog filters, and `manualMoves: Record<string, number>` — placeId → dayIndex overrides applied after `buildItinerary`. Persist `{ step, selectedIds, start, end, manualMoves }` to `localStorage` under key `japan-itinerary-v1`; rehydrate in a `useEffect` on mount (only touch `localStorage` inside effects/handlers to stay SSR-safe).

- [ ] **Step 2: Derive itinerary** — `useMemo`: `const base = buildItinerary(selectedPlaces, new Date(start), new Date(end))`, then apply `manualMoves` (remove each moved place from its computed day and push onto the target day; clamp target to valid range). `onRemove` deletes the id from `selectedIds` (and its `manualMoves` entry). `onMove` sets `manualMoves[id] = toDayIndex`.

- [ ] **Step 3: Load the map without SSR** — the Leaflet map must not render on the server. Check `node_modules/next/dist/docs/` for the current dynamic-import API, then load `ItineraryMap` client-only (`next/dynamic` with `ssr: false`, or the equivalent supported pattern).

- [ ] **Step 4: Render steps** —
  - Progress header showing the 3 steps with the current one active.
  - **select:** `<CatalogFilters>` + filtered grid of `<PlaceCard>` grouped by region heading; footer with selected count and "Next" (disabled when 0 selected).
  - **dates:** `<DateRangePicker>` + Back/Next (Next disabled when invalid: missing dates or `end < start`).
  - **itinerary:** `<ItineraryMap days>` + a `<ItineraryDay>` per day + Back + "Start over" (clears state and localStorage).

- [ ] **Step 5: Checkpoint** — compiles; manual smoke test deferred to Task 10.

---

## Task 9: Wire up app shell

**Files:** Modify `src/app/page.tsx`, `src/app/layout.tsx`, `README.md`, `package.json`.

- [ ] **Step 1: `page.tsx`** — replace entire contents:

```tsx
import Wizard from "@/components/Wizard";

export default function Home() {
  return <Wizard />;
}
```

- [ ] **Step 2: `layout.tsx`** — remove the `import AppNav` line and `<AppNav />`; update `metadata` to `{ title: "Japan Itinerary Maker", description: "Pick places across Japan and build a day-by-day trip plan." }`. Keep fonts and the body wrapper; body becomes just `<main className="flex-1">{children}</main>` inside the existing shell (drop the flex-col nav layout if no longer needed, or keep the wrapper — either is fine as long as `<AppNav>` is gone).

- [ ] **Step 3: `package.json`** — remove dependencies `@prisma/client`, `prisma`, `next-auth`, `bcryptjs` and devDep `@types/bcryptjs`. Keep `leaflet`, `react-leaflet`, `@types/leaflet`. Run `npm install` to refresh the lockfile.

- [ ] **Step 4: `README.md`** — replace with a short description of the Japan Itinerary Maker, how to run (`npm run dev`), and how to test (`npm test`).

- [ ] **Step 5: Checkpoint** — `npx tsc --noEmit` and `npm run lint` clean.

---

## Task 10: Full verification

- [ ] **Step 1:** `npm test` — all Vitest tests pass.
- [ ] **Step 2:** `npm run build` — production build succeeds with no auth/DB references.
- [ ] **Step 3:** `npm run dev` and drive the flow in the browser: select places across ≥2 regions → pick a 3-day range → confirm the itinerary distributes by region, the map shows colored numbered markers, move/remove work, refresh preserves state, and "Start over" clears it. Use the `verify` skill / browser tools.
- [ ] **Step 4:** Report results to the user (version control left to them).

---

## Self-Review Notes

- **Spec coverage:** catalog by region w/ rich detail (Task 2), 3-step wizard (Task 8), auto-distribute by region (Tasks 3-4), editable move/remove (Tasks 7-8), map (Task 6), localStorage persistence (Task 8), deletions + dep cleanup (Tasks 1, 9), tests (Tasks 3-4, 10). All covered.
- **Type consistency:** `Place`, `Region`, `Category` from `src/data/places.ts`; `Day`, `buildItinerary`, `tripDays`, `MAX_PER_DAY` from `src/lib/itinerary.ts` — used consistently across tasks.
- **No placeholders** except the intentional "populate ~40 real places" content in Task 2, which specifies exact regions and example places.
