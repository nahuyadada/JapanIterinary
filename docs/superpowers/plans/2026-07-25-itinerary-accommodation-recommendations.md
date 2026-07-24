# Itinerary Accommodation Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **PROJECT RULE — NO GIT:** The project owner handles all commits/pushes. Do NOT run `git commit`, `git push`, or `git add`. Each task ends when its tests pass; pause there for review.
>
> **Next.js note (`AGENTS.md`):** This Next.js version has breaking changes. New UI here follows the existing client-component patterns (`"use client"`, `ItineraryDay.tsx`, `ItineraryMap.tsx`) — no new Next.js APIs are introduced. If you deviate, consult `node_modules/next/dist/docs/`.

**Goal:** Recommend where to stay for each leg of a built itinerary — ranking real lodging districts by proximity to that leg's attractions and linking to real, date-filtered bookings on Booking.com and Airbnb.

**Architecture:** A curated `LodgingArea` dataset (`src/data/lodging.ts`) plus a pure, unit-tested logic module (`src/lib/lodging.ts`) that groups the `Day[]` itinerary into contiguous per-region "stays," ranks each region's lodging areas by mean haversine distance to the stay's attractions, and builds provider deep links. A `WhereToStay` component renders per-stay cards; `ItineraryMap` gains distinct lodging markers; `Wizard` wires it in and adds a travelers count.

**Tech Stack:** TypeScript, React 19, Next.js 16 (client components), react-leaflet, Tailwind CSS v4, Vitest.

---

## File Structure

- **Create** `src/data/lodging.ts` — `LodgingArea` type + `LODGING_AREAS` (real districts, 2–4 per region).
- **Create** `src/lib/lodging.ts` — types (`Stay`, `BookingLink`, `StayRecommendation`) + functions (`haversineKm`, `toISODate`, `groupStays`, `recommendForStay`, `recommendStays`, `bookingLinksForArea`).
- **Create** `src/lib/lodging.test.ts` — Vitest tests for the logic module + a data-integrity guard.
- **Create** `src/components/WhereToStay.tsx` — per-stay recommendation cards with booking buttons.
- **Modify** `src/components/ItineraryMap.tsx` — add lodging markers (distinct style).
- **Modify** `src/components/Wizard.tsx` — travelers input + `adults` persisted state; render `WhereToStay`; pass stays to the map.

Run all tests with: `npm test` (alias for `vitest run`). Run a single file with `npx vitest run src/lib/lodging.test.ts`.

---

## Task 1: Lodging area dataset

**Files:**
- Create: `src/data/lodging.ts`
- Test: `src/lib/lodging.test.ts` (data-integrity guard added here; grows in later tasks)

- [ ] **Step 1: Create the dataset**

Create `src/data/lodging.ts`:

```ts
import type { Region } from "@/data/places";

export type LodgingArea = {
  id: string;
  name: string;
  region: Region;
  lat: number;
  lng: number;
  /** One line on the neighborhood's character. */
  blurb: string;
  /** Who/what it suits, e.g. "Nightlife & food, excellent transit". */
  goodFor: string;
  /** Optional override for the booking-search query; defaults to `${name}, Japan`. */
  searchTerm?: string;
};

export const LODGING_AREAS: LodgingArea[] = [
  // Tokyo
  { id: "tokyo-shinjuku", name: "Shinjuku", region: "Tokyo", lat: 35.6938, lng: 139.7036, blurb: "Neon-lit hub of hotels, dining, and nightlife around Tokyo's busiest station.", goodFor: "First-timers, nightlife, unbeatable transit", searchTerm: "Shinjuku, Tokyo, Japan" },
  { id: "tokyo-ueno-asakusa", name: "Ueno / Asakusa", region: "Tokyo", lat: 35.7138, lng: 139.7770, blurb: "Old-Tokyo temples, museums, and value stays on the northeast side.", goodFor: "Sightseeing, budget, families", searchTerm: "Asakusa, Tokyo, Japan" },
  { id: "tokyo-ginza-station", name: "Ginza / Tokyo Station", region: "Tokyo", lat: 35.6812, lng: 139.7671, blurb: "Upscale central district with easy Shinkansen access.", goodFor: "Shopping, Shinkansen access, comfort", searchTerm: "Ginza, Tokyo, Japan" },
  { id: "tokyo-shibuya", name: "Shibuya", region: "Tokyo", lat: 35.6595, lng: 139.7005, blurb: "Youthful, fashionable, and central to west-side sights.", goodFor: "Trendy dining, west Tokyo sights", searchTerm: "Shibuya, Tokyo, Japan" },

  // Kyoto
  { id: "kyoto-station", name: "Kyoto Station", region: "Kyoto", lat: 34.9858, lng: 135.7588, blurb: "Transit heart of Kyoto with hotels of every budget.", goodFor: "Day trips, Shinkansen access", searchTerm: "Kyoto Station, Kyoto, Japan" },
  { id: "kyoto-gion", name: "Gion / Higashiyama", region: "Kyoto", lat: 35.0037, lng: 135.7752, blurb: "Historic geisha quarter near the eastern temples.", goodFor: "Atmosphere, temples on foot", searchTerm: "Gion, Kyoto, Japan" },
  { id: "kyoto-downtown", name: "Downtown Kawaramachi", region: "Kyoto", lat: 35.0037, lng: 135.7681, blurb: "Central shopping and dining by the Nishiki Market.", goodFor: "Food, shopping, central base", searchTerm: "Kawaramachi, Kyoto, Japan" },

  // Osaka
  { id: "osaka-namba", name: "Namba / Dotonbori", region: "Osaka", lat: 34.6659, lng: 135.5012, blurb: "Osaka's neon food-and-nightlife core in the south (Minami).", goodFor: "Nightlife, street food, first-timers", searchTerm: "Namba, Osaka, Japan" },
  { id: "osaka-umeda", name: "Umeda / Kita", region: "Osaka", lat: 34.7025, lng: 135.4959, blurb: "Northern business and shopping hub around Osaka/Umeda Station.", goodFor: "Transit, shopping, day trips", searchTerm: "Umeda, Osaka, Japan" },
  { id: "osaka-tennoji", name: "Tennoji / Shinsekai", region: "Osaka", lat: 34.6465, lng: 135.5136, blurb: "Retro southern district with value hotels near the park.", goodFor: "Budget, USJ/airport access", searchTerm: "Tennoji, Osaka, Japan" },

  // Nara
  { id: "nara-center", name: "Nara City Center", region: "Nara", lat: 34.6789, lng: 135.8296, blurb: "Between the JR and Kintetsu stations, walkable to the park.", goodFor: "Transit, walkable sightseeing", searchTerm: "Nara City, Nara, Japan" },
  { id: "nara-park", name: "Nara Park Area", region: "Nara", lat: 34.6851, lng: 135.8430, blurb: "Quiet ryokan and inns beside the deer park and temples.", goodFor: "Atmosphere, early temple access", searchTerm: "Nara Park, Nara, Japan" },

  // Hakone / Fuji
  { id: "hakone-yumoto", name: "Hakone-Yumoto", region: "Hakone / Fuji", lat: 35.2325, lng: 139.1069, blurb: "Onsen gateway town at the foot of the Hakone loop.", goodFor: "Onsen ryokan, transit hub", searchTerm: "Hakone-Yumoto, Hakone, Japan" },
  { id: "hakone-gora", name: "Gora", region: "Hakone / Fuji", lat: 35.2469, lng: 139.0503, blurb: "Upper-mountain hot-spring village near the Open-Air Museum.", goodFor: "Ryokan, art museum, views", searchTerm: "Gora, Hakone, Japan" },
  { id: "fuji-kawaguchiko", name: "Kawaguchiko", region: "Hakone / Fuji", lat: 35.5000, lng: 138.7500, blurb: "Lakeside base with classic Mount Fuji views.", goodFor: "Fuji views, Fuji-Q, lake resorts", searchTerm: "Kawaguchiko, Fujikawaguchiko, Japan" },

  // Hiroshima
  { id: "hiroshima-station", name: "Hiroshima Station", region: "Hiroshima", lat: 34.3975, lng: 132.4753, blurb: "Transit hub with business hotels and tram links.", goodFor: "Transit, day trips to Miyajima", searchTerm: "Hiroshima Station, Hiroshima, Japan" },
  { id: "hiroshima-peace", name: "Peace Park / Kamiya-cho", region: "Hiroshima", lat: 34.3955, lng: 132.4553, blurb: "Downtown core beside the Peace Memorial Park.", goodFor: "Walkable sights, dining", searchTerm: "Kamiyacho, Hiroshima, Japan" },
  { id: "hiroshima-miyajima", name: "Miyajima", region: "Hiroshima", lat: 34.2969, lng: 132.3197, blurb: "Island ryokan by the floating torii — magical after day-trippers leave.", goodFor: "Atmosphere, sunset/sunrise torii", searchTerm: "Miyajima, Hatsukaichi, Japan" },

  // Sapporo / Hokkaido
  { id: "sapporo-susukino", name: "Susukino", region: "Sapporo / Hokkaido", lat: 43.0554, lng: 141.3530, blurb: "Sapporo's dining and nightlife district.", goodFor: "Nightlife, ramen, central", searchTerm: "Susukino, Sapporo, Japan" },
  { id: "sapporo-station", name: "Sapporo Station", region: "Sapporo / Hokkaido", lat: 43.0686, lng: 141.3508, blurb: "Northern transit hub with hotels above the shops.", goodFor: "Transit, shopping, day trips", searchTerm: "Sapporo Station, Sapporo, Japan" },
  { id: "hokkaido-otaru", name: "Otaru", region: "Sapporo / Hokkaido", lat: 43.1907, lng: 140.9947, blurb: "Historic canal port a short train ride from Sapporo.", goodFor: "Scenery, seafood, quiet stays", searchTerm: "Otaru, Hokkaido, Japan" },

  // Kobe / Himeji
  { id: "kobe-sannomiya", name: "Sannomiya", region: "Kobe / Himeji", lat: 34.6946, lng: 135.1955, blurb: "Kobe's central station district for dining and transit.", goodFor: "Central base, Kobe beef, transit", searchTerm: "Sannomiya, Kobe, Japan" },
  { id: "kobe-harborland", name: "Harborland", region: "Kobe / Himeji", lat: 34.6810, lng: 135.1780, blurb: "Waterfront hotels with harbor and tower views.", goodFor: "Views, romantic, families", searchTerm: "Kobe Harborland, Kobe, Japan" },
  { id: "himeji-station", name: "Himeji Station", region: "Kobe / Himeji", lat: 34.8276, lng: 134.6903, blurb: "Walkable to the castle with easy Shinkansen access.", goodFor: "Castle access, Shinkansen", searchTerm: "Himeji Station, Himeji, Japan" },

  // Chubu (Nagoya / Kanazawa / Takayama)
  { id: "chubu-nagoya", name: "Nagoya Station", region: "Chubu (Nagoya / Kanazawa / Takayama)", lat: 35.1706, lng: 136.8816, blurb: "Major Shinkansen hub with hotels above the towers.", goodFor: "Transit, regional day trips", searchTerm: "Nagoya Station, Nagoya, Japan" },
  { id: "chubu-kanazawa", name: "Kanazawa Station", region: "Chubu (Nagoya / Kanazawa / Takayama)", lat: 36.5780, lng: 136.6480, blurb: "Walkable base for Kenroku-en and the old districts.", goodFor: "Gardens, geisha districts, transit", searchTerm: "Kanazawa Station, Kanazawa, Japan" },
  { id: "chubu-takayama", name: "Takayama Old Town", region: "Chubu (Nagoya / Kanazawa / Takayama)", lat: 36.1408, lng: 137.2519, blurb: "Edo-era streets and ryokan in the mountains.", goodFor: "Atmosphere, ryokan, morning markets", searchTerm: "Takayama, Gifu, Japan" },

  // Kyushu (Fukuoka / Beppu / Nagasaki)
  { id: "kyushu-hakata", name: "Hakata", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", lat: 33.5902, lng: 130.4207, blurb: "Fukuoka's Shinkansen gateway and ramen heartland.", goodFor: "Transit, ramen, first-timers", searchTerm: "Hakata, Fukuoka, Japan" },
  { id: "kyushu-tenjin", name: "Tenjin", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", lat: 33.5914, lng: 130.3990, blurb: "Fukuoka's downtown shopping and nightlife hub.", goodFor: "Shopping, nightlife, central", searchTerm: "Tenjin, Fukuoka, Japan" },
  { id: "kyushu-beppu", name: "Beppu Onsen", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", lat: 33.2846, lng: 131.4911, blurb: "Steamy hot-spring resort town on the east coast.", goodFor: "Onsen ryokan, relaxation", searchTerm: "Beppu, Oita, Japan" },
  { id: "kyushu-nagasaki", name: "Nagasaki City", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", lat: 32.7448, lng: 129.8737, blurb: "Harbor city with hillside views and history.", goodFor: "History, harbor views", searchTerm: "Nagasaki City, Nagasaki, Japan" },

  // Shikoku
  { id: "shikoku-takamatsu", name: "Takamatsu", region: "Shikoku", lat: 34.3497, lng: 134.0466, blurb: "Gateway port for Naoshima and Ritsurin Garden.", goodFor: "Art islands, gardens, ferries", searchTerm: "Takamatsu, Kagawa, Japan" },
  { id: "shikoku-matsuyama", name: "Matsuyama / Dogo", region: "Shikoku", lat: 33.8416, lng: 132.7657, blurb: "Castle city beside the historic Dogo Onsen.", goodFor: "Onsen, castle, relaxed base", searchTerm: "Dogo Onsen, Matsuyama, Japan" },

  // Okinawa
  { id: "okinawa-naha", name: "Naha / Kokusai-dori", region: "Okinawa", lat: 26.2141, lng: 127.6880, blurb: "Okinawa's capital and main shopping street.", goodFor: "First-timers, transit, dining", searchTerm: "Kokusai Dori, Naha, Japan" },
  { id: "okinawa-onna", name: "Onna Coast", region: "Okinawa", lat: 26.4979, lng: 127.8530, blurb: "Beach-resort strip on the central west coast.", goodFor: "Beach resorts, aquarium access", searchTerm: "Onna, Okinawa, Japan" },

  // Tohoku
  { id: "tohoku-sendai", name: "Sendai", region: "Tohoku", lat: 38.2601, lng: 140.8825, blurb: "Tohoku's largest city and Shinkansen hub.", goodFor: "Transit, dining, day trips", searchTerm: "Sendai Station, Sendai, Japan" },
  { id: "tohoku-matsushima", name: "Matsushima", region: "Tohoku", lat: 38.3700, lng: 141.0600, blurb: "Scenic bay town of pine-clad islets.", goodFor: "Views, seafood, quiet stays", searchTerm: "Matsushima, Miyagi, Japan" },
  { id: "tohoku-ginzan", name: "Ginzan Onsen", region: "Tohoku", lat: 38.5730, lng: 140.5382, blurb: "Gaslit hot-spring street of wooden ryokan.", goodFor: "Ryokan, winter scenery", searchTerm: "Ginzan Onsen, Obanazawa, Japan" },

  // Chugoku (Okayama / Tottori)
  { id: "chugoku-okayama", name: "Okayama Station", region: "Chugoku (Okayama / Tottori)", lat: 34.6657, lng: 133.9184, blurb: "Shinkansen hub central to the region's sights.", goodFor: "Transit, day trips", searchTerm: "Okayama Station, Okayama, Japan" },
  { id: "chugoku-kurashiki", name: "Kurashiki Bikan", region: "Chugoku (Okayama / Tottori)", lat: 34.5980, lng: 133.7716, blurb: "Canal district of white-walled merchant inns.", goodFor: "Atmosphere, walkable old town", searchTerm: "Kurashiki Bikan, Kurashiki, Japan" },
  { id: "chugoku-tottori", name: "Tottori City", region: "Chugoku (Okayama / Tottori)", lat: 35.4900, lng: 134.2350, blurb: "Base for the famous sand dunes.", goodFor: "Dunes access, quiet base", searchTerm: "Tottori City, Tottori, Japan" },
];
```

- [ ] **Step 2: Write the data-integrity guard test**

Create `src/lib/lodging.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { LODGING_AREAS } from "@/data/lodging";
import { PLACES } from "@/data/places";

describe("LODGING_AREAS data integrity", () => {
  it("has unique ids", () => {
    const ids = LODGING_AREAS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every region that has attractions", () => {
    const attractionRegions = new Set(PLACES.map((p) => p.region));
    const lodgingRegions = new Set(LODGING_AREAS.map((a) => a.region));
    for (const region of attractionRegions) {
      expect(lodgingRegions.has(region)).toBe(true);
    }
  });

  it("has valid coordinates for every area", () => {
    for (const a of LODGING_AREAS) {
      expect(Number.isFinite(a.lat)).toBe(true);
      expect(Number.isFinite(a.lng)).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run the guard test — expect PASS**

Run: `npx vitest run src/lib/lodging.test.ts`
Expected: 3 tests PASS. (Import of `@/lib/lodging` is not needed yet.)

- [ ] **Step 4: Pause for review** (no commit — see project rule).

---

## Task 2: Distance & date helpers

**Files:**
- Create: `src/lib/lodging.ts`
- Test: `src/lib/lodging.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/lib/lodging.test.ts`:

```ts
import { haversineKm, toISODate } from "@/lib/lodging";

describe("haversineKm", () => {
  it("returns ~0 for identical points", () => {
    expect(haversineKm(35, 139, 35, 139)).toBeCloseTo(0, 5);
  });

  it("approximates a known distance (Tokyo Station -> Osaka Station ~= 400km)", () => {
    const km = haversineKm(35.681, 139.767, 34.702, 135.495);
    expect(km).toBeGreaterThan(380);
    expect(km).toBeLessThan(420);
  });
});

describe("toISODate", () => {
  it("formats local Y-M-D with zero padding and no UTC shift", () => {
    expect(toISODate(new Date(2026, 6, 5))).toBe("2026-07-05");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/lodging.test.ts`
Expected: FAIL — cannot import `haversineKm` / `toISODate` from `@/lib/lodging`.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/lodging.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/lodging.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Pause for review** (no commit).

---

## Task 3: Group the itinerary into stays

**Files:**
- Modify: `src/lib/lodging.ts`
- Test: `src/lib/lodging.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/lib/lodging.test.ts`:

```ts
import { groupStays } from "@/lib/lodging";
import type { Day } from "@/lib/itinerary";
import type { Place } from "@/data/places";

const place = (id: string, region: Place["region"], lat = 0, lng = 0): Place => ({
  id, name: id, city: "", region, category: "landmark", description: "",
  lat, lng, activities: [],
});

const day = (dayIndex: number, dateStr: string, places: Place[]): Day => ({
  dayIndex, date: new Date(dateStr), places,
});

describe("groupStays", () => {
  it("returns [] for an empty itinerary", () => {
    expect(groupStays([])).toEqual([]);
  });

  it("makes one stay for a single region", () => {
    const days = [
      day(0, "2026-07-25", [place("a", "Osaka")]),
      day(1, "2026-07-26", [place("b", "Osaka")]),
    ];
    const stays = groupStays(days);
    expect(stays).toHaveLength(1);
    expect(stays[0].region).toBe("Osaka");
    expect(stays[0].dayIndexes).toEqual([0, 1]);
    expect(stays[0].places.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("splits stays when the region changes and sets nights/checkIn/checkOut", () => {
    const days = [
      day(0, "2026-07-25", [place("o1", "Osaka")]),
      day(1, "2026-07-26", [place("o2", "Osaka")]),
      day(2, "2026-07-27", [place("k1", "Kyoto")]),
    ];
    const stays = groupStays(days);
    expect(stays).toHaveLength(2);

    expect(stays[0].region).toBe("Osaka");
    expect(stays[0].nights).toBe(2);
    expect(toISODateLocal(stays[0].checkIn)).toBe("2026-07-25");
    expect(toISODateLocal(stays[0].checkOut)).toBe("2026-07-27"); // next region's start

    expect(stays[1].region).toBe("Kyoto");
    expect(stays[1].nights).toBe(1);
    expect(toISODateLocal(stays[1].checkIn)).toBe("2026-07-27");
    expect(toISODateLocal(stays[1].checkOut)).toBe("2026-07-28"); // final stay: last day + 1
  });

  it("absorbs empty-place days into the current stay", () => {
    const days = [
      day(0, "2026-07-25", [place("o1", "Osaka")]),
      day(1, "2026-07-26", []),
      day(2, "2026-07-27", [place("o2", "Osaka")]),
    ];
    const stays = groupStays(days);
    expect(stays).toHaveLength(1);
    expect(stays[0].dayIndexes).toEqual([0, 1, 2]);
  });

  it("keeps a repeated multi-day place in one stay", () => {
    const usj = place("usj", "Osaka");
    const days = [day(0, "2026-07-25", [usj]), day(1, "2026-07-26", [usj])];
    const stays = groupStays(days);
    expect(stays).toHaveLength(1);
    expect(stays[0].nights).toBe(2);
  });
});

// local helper mirroring toISODate for readable assertions
function toISODateLocal(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/lodging.test.ts`
Expected: FAIL — `groupStays` is not exported.

- [ ] **Step 3: Implement `groupStays` and the `Stay` type**

Add to `src/lib/lodging.ts` (after the helpers):

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/lodging.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Pause for review** (no commit).

---

## Task 4: Rank lodging areas per stay

**Files:**
- Modify: `src/lib/lodging.ts`
- Test: `src/lib/lodging.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/lib/lodging.test.ts`:

```ts
import { recommendForStay, recommendStays } from "@/lib/lodging";

// Osaka areas from the dataset: Namba (34.6659,135.5012), Umeda (34.7025,135.4959),
// Tennoji (34.6465,135.5136).
describe("recommendForStay", () => {
  it("ranks the nearest area first by mean distance to attractions", () => {
    // Attraction near Umeda (north Osaka).
    const stay = {
      region: "Osaka" as const,
      dayIndexes: [0], nights: 1,
      checkIn: new Date(2026, 6, 25), checkOut: new Date(2026, 6, 26),
      places: [place("north", "Osaka", 34.705, 135.496)],
    };
    const areas = recommendForStay(stay, 3);
    expect(areas[0].id).toBe("osaka-umeda");
    expect(areas).toHaveLength(3);
  });

  it("changes the top pick when attractions move south", () => {
    const stay = {
      region: "Osaka" as const,
      dayIndexes: [0], nights: 1,
      checkIn: new Date(2026, 6, 25), checkOut: new Date(2026, 6, 26),
      places: [place("south", "Osaka", 34.647, 135.513)], // near Tennoji
    };
    expect(recommendForStay(stay, 1)[0].id).toBe("osaka-tennoji");
  });

  it("respects the limit", () => {
    const stay = {
      region: "Osaka" as const,
      dayIndexes: [0], nights: 1,
      checkIn: new Date(2026, 6, 25), checkOut: new Date(2026, 6, 26),
      places: [place("x", "Osaka", 34.67, 135.50)],
    };
    expect(recommendForStay(stay, 2)).toHaveLength(2);
  });

  it("falls back to declared order when no attraction has coordinates", () => {
    const stay = {
      region: "Osaka" as const,
      dayIndexes: [0], nights: 1,
      checkIn: new Date(2026, 6, 25), checkOut: new Date(2026, 6, 26),
      places: [], // no places -> no coords
    };
    const areas = recommendForStay(stay, 3);
    expect(areas.map((a) => a.id)).toEqual(["osaka-namba", "osaka-umeda", "osaka-tennoji"]);
  });
});

describe("recommendStays", () => {
  it("produces one recommendation per stay", () => {
    const days = [
      day(0, "2026-07-25", [place("o1", "Osaka", 34.67, 135.50)]),
      day(1, "2026-07-26", [place("k1", "Kyoto", 34.99, 135.76)]),
    ];
    const recs = recommendStays(days, 3);
    expect(recs).toHaveLength(2);
    expect(recs[0].stay.region).toBe("Osaka");
    expect(recs[0].areas.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/lodging.test.ts`
Expected: FAIL — `recommendForStay` / `recommendStays` not exported.

- [ ] **Step 3: Implement ranking**

Add to `src/lib/lodging.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/lodging.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Pause for review** (no commit).

---

## Task 5: Build real booking deep links

**Files:**
- Modify: `src/lib/lodging.ts`
- Test: `src/lib/lodging.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/lib/lodging.test.ts`:

```ts
import { bookingLinksForArea } from "@/lib/lodging";

describe("bookingLinksForArea", () => {
  const namba = LODGING_AREAS.find((a) => a.id === "osaka-namba")!;
  const checkIn = new Date(2026, 6, 25); // 2026-07-25
  const checkOut = new Date(2026, 6, 29); // 2026-07-29

  it("returns Booking.com and Airbnb links", () => {
    const links = bookingLinksForArea(namba, checkIn, checkOut, 2);
    expect(links.map((l) => l.provider).sort()).toEqual(["airbnb", "booking"]);
  });

  it("Booking.com link carries dates, adults, and the encoded search term", () => {
    const booking = bookingLinksForArea(namba, checkIn, checkOut, 3).find(
      (l) => l.provider === "booking"
    )!;
    expect(booking.url).toContain("https://www.booking.com/searchresults.html?");
    expect(booking.url).toContain("checkin=2026-07-25");
    expect(booking.url).toContain("checkout=2026-07-29");
    expect(booking.url).toContain("group_adults=3");
    expect(booking.url).toContain(encodeURIComponent("Namba, Osaka, Japan"));
  });

  it("Airbnb link carries dates, adults, and encoded location in the path", () => {
    const airbnb = bookingLinksForArea(namba, checkIn, checkOut, 2).find(
      (l) => l.provider === "airbnb"
    )!;
    expect(airbnb.url).toContain("https://www.airbnb.com/s/");
    expect(airbnb.url).toContain("/homes?");
    expect(airbnb.url).toContain("checkin=2026-07-25");
    expect(airbnb.url).toContain("checkout=2026-07-29");
    expect(airbnb.url).toContain("adults=2");
    expect(airbnb.url).toContain(encodeURIComponent("Namba, Osaka, Japan"));
  });

  it("falls back to `${name}, Japan` when searchTerm is absent", () => {
    const area = { ...namba, searchTerm: undefined };
    const booking = bookingLinksForArea(area, checkIn, checkOut, 1).find(
      (l) => l.provider === "booking"
    )!;
    expect(booking.url).toContain(encodeURIComponent("Namba, Japan"));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/lodging.test.ts`
Expected: FAIL — `bookingLinksForArea` not exported.

- [ ] **Step 3: Implement link builder**

Add to `src/lib/lodging.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/lodging.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: existing `itinerary.test.ts` and all new `lodging.test.ts` tests PASS.

- [ ] **Step 6: Pause for review** (no commit).

---

## Task 6: `WhereToStay` component

**Files:**
- Create: `src/components/WhereToStay.tsx`

No unit test (presentational). Verified in the browser in Task 9.

- [ ] **Step 1: Implement the component**

Create `src/components/WhereToStay.tsx`:

```tsx
"use client";
import { bookingLinksForArea, type StayRecommendation } from "@/lib/lodging";

const DAY_COLORS = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

function fmt(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function WhereToStay({
  recommendations,
  adults,
}: {
  recommendations: StayRecommendation[];
  adults: number;
}) {
  const withAreas = recommendations.filter((r) => r.areas.length > 0);
  if (withAreas.length === 0) return null;

  return (
    <section className="grid gap-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Where to stay</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Suggested base areas that keep each leg&apos;s attractions close. Booking links open real,
          date-filtered results on the provider&apos;s site.
        </p>
      </div>

      {withAreas.map((rec) => {
        const { stay, areas } = rec;
        const firstDay = stay.dayIndexes[0] + 1;
        const lastDay = stay.dayIndexes[stay.dayIndexes.length - 1] + 1;
        const dayLabel = firstDay === lastDay ? `Day ${firstDay}` : `Days ${firstDay}–${lastDay}`;
        const color = DAY_COLORS[stay.dayIndexes[0] % DAY_COLORS.length];

        return (
          <article
            key={`${stay.region}-${stay.dayIndexes[0]}`}
            className="border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden"
          >
            <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
              <span className="w-2.5 h-10 rounded-full" style={{ background: color }} aria-hidden />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {dayLabel} · {stay.region}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stay.nights} night{stay.nights === 1 ? "" : "s"} · {fmt(stay.checkIn)} → {fmt(stay.checkOut)}
                </p>
              </div>
            </header>

            <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
              {areas.map((area, i) => {
                const links = bookingLinksForArea(area, stay.checkIn, stay.checkOut, adults);
                return (
                  <li key={area.id} className="px-4 py-3 grid gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {area.name}
                          {i === 0 && (
                            <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                              Top pick
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{area.blurb}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{area.goodFor}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {links.map((link) => (
                        <a
                          key={link.provider}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          {link.label} ↗
                        </a>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Pause for review** (no commit).

---

## Task 7: Lodging markers on the map

**Files:**
- Modify: `src/components/ItineraryMap.tsx`

- [ ] **Step 1: Update the map to accept and plot stays**

Replace the contents of `src/components/ItineraryMap.tsx` with:

```tsx
"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Day } from "@/lib/itinerary";
import type { StayRecommendation } from "@/lib/lodging";

const DAY_COLORS = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

const numberIcon = (n: number, color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const lodgingIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:#fff;color:${color};border-radius:8px 8px 8px 0;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid ${color};box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(-45deg)"><span style="transform:rotate(45deg)">🛏️</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });

export default function ItineraryMap({
  days,
  stayRecommendations = [],
}: {
  days: Day[];
  stayRecommendations?: StayRecommendation[];
}) {
  const markers = days.flatMap((day) =>
    day.places
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({ place: p, dayIndex: day.dayIndex }))
  );

  const lodgingMarkers = stayRecommendations
    .filter((r) => r.areas.length > 0)
    .map((r) => ({
      area: r.areas[0],
      dayIndex: r.stay.dayIndexes[0],
      region: r.stay.region,
    }));

  const center: [number, number] = markers.length
    ? [
        markers.reduce((a, m) => a + m.place.lat, 0) / markers.length,
        markers.reduce((a, m) => a + m.place.lng, 0) / markers.length,
      ]
    : [36.2048, 138.2529]; // Japan

  return (
    <MapContainer center={center} zoom={markers.length ? 6 : 5} className="h-72 sm:h-96 w-full rounded-xl z-0">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {markers.map(({ place, dayIndex }) => (
        <Marker
          key={`${place.id}-${dayIndex}`}
          position={[place.lat, place.lng]}
          icon={numberIcon(dayIndex + 1, DAY_COLORS[dayIndex % DAY_COLORS.length])}
        >
          <Popup>
            <span className="font-semibold">{place.name}</span>
            <br />
            Day {dayIndex + 1}
          </Popup>
        </Marker>
      ))}
      {lodgingMarkers.map(({ area, dayIndex, region }) => (
        <Marker
          key={`lodging-${area.id}-${dayIndex}`}
          position={[area.lat, area.lng]}
          icon={lodgingIcon(DAY_COLORS[dayIndex % DAY_COLORS.length])}
        >
          <Popup>
            <span className="font-semibold">Stay: {area.name}</span>
            <br />
            {region}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (the new `stayRecommendations` prop is optional, so existing callers still compile).

- [ ] **Step 3: Pause for review** (no commit).

---

## Task 8: Wire into the Wizard (travelers input + render)

**Files:**
- Modify: `src/components/Wizard.tsx`

- [ ] **Step 1: Import the new pieces**

In `src/components/Wizard.tsx`, add these imports near the other component/lib imports (top of file):

```tsx
import { recommendStays } from "@/lib/lodging";
import WhereToStay from "@/components/WhereToStay";
```

- [ ] **Step 2: Add `adults` to persisted state type**

In the `PersistedState` type, add the field:

```tsx
type PersistedState = {
  step: Step;
  selectedIds: string[];
  start: string;
  end: string;
  manualMoves: Record<string, number>;
  startCity: string;
  endCity: string;
  dayAllocations: Record<string, number>;
  adults: number;
};
```

- [ ] **Step 3: Add `adults` state and restore/persist it**

After the `dayAllocations` state declaration (`const [dayAllocations, setDayAllocations] = useState...`), add:

```tsx
  const [adults, setAdults] = useState(2);
```

In the restore effect, alongside the other `if (...) setX(...)` lines, add:

```tsx
        if (typeof s.adults === "number" && s.adults >= 1) setAdults(s.adults);
```

In the persist effect's `payload`, add `adults` to the object, and add `adults` to that effect's dependency array:

```tsx
    const payload: PersistedState = {
      step, selectedIds, start, end, manualMoves, startCity, endCity, dayAllocations, adults,
    };
```
```tsx
  }, [hydrated, step, selectedIds, start, end, manualMoves, startCity, endCity, dayAllocations, adults]);
```

In `startOver()`, reset it:

```tsx
    setAdults(2);
```

- [ ] **Step 4: Compute recommendations (memoized)**

After the `days` `useMemo` block, add:

```tsx
  const stayRecommendations = useMemo(() => recommendStays(days, 3), [days]);
```

- [ ] **Step 5: Add the travelers input to the dates step**

In the `step === "dates"` block, immediately after the `<DateRangePicker ... />` line, add:

```tsx
          <label className="flex flex-col text-sm text-gray-600 gap-1 max-w-[10rem]">
            Travelers (adults)
            <input
              type="number"
              min={1}
              max={8}
              value={adults}
              onChange={(e) => setAdults(Math.min(8, Math.max(1, Number(e.target.value) || 1)))}
              className={selectClasses}
            />
          </label>
```

- [ ] **Step 6: Render `WhereToStay` and pass stays to the map**

In the `step === "itinerary"` block, replace:

```tsx
          <ItineraryMap days={days} />
```

with:

```tsx
          <ItineraryMap days={days} stayRecommendations={stayRecommendations} />
          <WhereToStay recommendations={stayRecommendations} adults={adults} />
```

- [ ] **Step 7: Type-check and full test run**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 8: Pause for review** (no commit).

---

## Task 9: Browser verification

**Files:** none (manual/preview verification).

- [ ] **Step 1: Start the dev server and open the app**

Use the preview tooling (`preview_start` with the dev server), then walk the wizard:
1. Select several places across **two+ regions** (e.g. a few Osaka + Kyoto + Tokyo attractions).
2. Pick a date range long enough to span them; set travelers to 3.
3. Build the itinerary.

- [ ] **Step 2: Verify the "Where to stay" section**

Confirm:
- One card per region-stay, with day range, nights, and check-in → check-out dates.
- Up to 3 areas per stay, "Top pick" on the first.
- Booking.com and Airbnb buttons open in a new tab with the correct area, dates, and `adults=3` in the URL.

- [ ] **Step 3: Verify the map**

Confirm bed/🛏️ lodging markers appear (distinct from numbered pins) at the top recommended area for each stay, with a "Stay: <area>" popup.

- [ ] **Step 4: Check the console**

Use `read_console_messages`; expect no errors/warnings from the new code.

- [ ] **Step 5: Report results to the user** (no commit — the owner commits).

---

## Self-Review Notes

- **Spec coverage:** dataset (Task 1), `haversineKm`/`toISODate` (Task 2), `groupStays` w/ checkIn/checkOut/nights (Task 3), `recommendForStay`/`recommendStays` (Task 4), `bookingLinksForArea` Booking+Airbnb (Task 5), `WhereToStay` w/ buttons (Task 6), map markers (Task 7), Wizard travelers input + wiring + persisted `adults` (Task 8), verification (Task 9). All spec sections covered.
- **Type consistency:** `Stay`, `LodgingArea`, `BookingLink`, `StayRecommendation` names and fields are identical across tasks; `ItineraryMap` prop `stayRecommendations` is optional to keep compilation green until Task 8.
- **No placeholders:** every code/step is concrete.
```