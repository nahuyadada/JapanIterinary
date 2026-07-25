# Graph Report - JapanIterinary  (2026-07-25)

## Corpus Check
- 54 files · ~49,339 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 331 nodes · 625 edges · 28 communities (19 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aa0c4527`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Wizard.tsx
- schedule.ts
- compilerOptions
- suggestions.ts
- scripts
- devDependencies
- page.tsx
- lib/lodging.ts
- PLACES
- layout.tsx
- ItineraryMap.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- logo
- logo
- File Icon
- Globe Icon
- Next.js Logo
- Vercel Logo
- Itinerary Accommodation Recommendations Implementation Plan
- Japan Itinerary Maker — Design
- Itinerary-based accommodation recommendations — design
- Reservation & Ticket Requirement Assistant — design

## God Nodes (most connected - your core abstractions)
1. `Day` - 18 edges
2. `durationRangeFor()` - 17 edges
3. `Place` - 16 edges
4. `compilerOptions` - 16 edges
5. `formatRange()` - 13 edges
6. `Japan Itinerary Maker Implementation Plan` - 13 edges
7. `PLACES` - 12 edges
8. `resolveBooking()` - 12 edges
9. `Itinerary Accommodation Recommendations Implementation Plan` - 12 edges
10. `haversineKm()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `CityPlan()` --indirect_call--> `area()`  [INFERRED]
  src/components/CityPlan.tsx → src/lib/navigation.test.ts
- `ItineraryMap()` --indirect_call--> `p()`  [INFERRED]
  src/components/ItineraryMap.tsx → src/lib/itinerary.test.ts
- `suggestForItinerary()` --indirect_call--> `p()`  [INFERRED]
  src/lib/suggestions.ts → src/lib/itinerary.test.ts
- `AddAttraction()` --indirect_call--> `p()`  [INFERRED]
  src/components/AddAttraction.tsx → src/lib/itinerary.test.ts
- `BookingCard()` --calls--> `formatRange()`  [EXTRACTED]
  src/components/BookingCard.tsx → src/lib/duration.ts

## Import Cycles
- None detected.

## Communities (28 total, 9 thin omitted)

### Community 0 - "Wizard.tsx"
Cohesion: 0.11
Nodes (32): DateRangePicker(), CATEGORY_EMOJI, PlaceCard(), ItineraryMap, PersistedState, stayKey(), Step, STEPS (+24 more)

### Community 1 - "schedule.ts"
Cohesion: 0.10
Nodes (32): CityPlan(), fmt(), DaySchedule(), MODE_LABELS, LODGING_AREAS, LodgingArea, Day, BookingLink (+24 more)

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "suggestions.ts"
Cohesion: 0.20
Nodes (18): AddAttraction(), DAY_COLORS, ItineraryDay(), VERDICT, ItineraryPlaceRow(), StaySuggestions(), HourRange, PLACE_META (+10 more)

### Community 4 - "scripts"
Cohesion: 0.09
Nodes (21): leaflet, next, dependencies, leaflet, next, react, react-dom, react-leaflet (+13 more)

### Community 5 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/leaflet (+13 more)

### Community 6 - "page.tsx"
Cohesion: 0.16
Nodes (11): Hero(), NAV, CultureSection(), DESTINATIONS, PopularDestinations(), REASONS, SiteFooter(), TIPS (+3 more)

### Community 7 - "lib/lodging.ts"
Cohesion: 0.11
Nodes (30): BookingBadge(), STATUS_CLASSES, BookingCard(), PRIORITY_CLASSES, shortDate(), TripChecklist(), BookingOpens, BookingStatus (+22 more)

### Community 8 - "PLACES"
Cohesion: 0.14
Nodes (13): File Structure, Japan Itinerary Maker Implementation Plan, Self-Review Notes, Task 10: Full verification, Task 1: Delete obsolete auth/DB/plan code, Task 2: Places catalog data, Task 3: `buildItinerary` — failing tests first, Task 4: `buildItinerary` — implementation (+5 more)

### Community 9 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 10 - "ItineraryMap.tsx"
Cohesion: 0.60
Nodes (4): DAY_COLORS, ItineraryMap(), lodgingIcon(), numberIcon()

### Community 24 - "Itinerary Accommodation Recommendations Implementation Plan"
Cohesion: 0.15
Nodes (12): File Structure, Itinerary Accommodation Recommendations Implementation Plan, Self-Review Notes, Task 1: Lodging area dataset, Task 2: Distance & date helpers, Task 3: Group the itinerary into stays, Task 4: Rank lodging areas per stay, Task 5: Build real booking deep links (+4 more)

### Community 25 - "Japan Itinerary Maker — Design"
Cohesion: 0.15
Nodes (12): Architecture, Cleanup / Deletions, Components, Data — `src/data/places.ts`, Flow — `src/app/page.tsx` (client component), Goals, Itinerary logic — `src/lib/itinerary.ts`, Japan Itinerary Maker — Design (+4 more)

### Community 26 - "Itinerary-based accommodation recommendations — design"
Cohesion: 0.20
Nodes (9): Constraints & context, Data model — `src/data/lodging.ts`, Decisions, Itinerary-based accommodation recommendations — design, Out of scope, Problem, Recommendation logic — `src/lib/lodging.ts` (pure, tested), Testing (vitest, matching `itinerary.test.ts` style) (+1 more)

### Community 27 - "Reservation & Ticket Requirement Assistant — design"
Cohesion: 0.20
Nodes (9): Components, Constraints & context, Data model — `src/data/reservations.ts`, Decisions, Logic — `src/lib/reservations.ts`, Out of scope, Problem, Reservation & Ticket Requirement Assistant — design (+1 more)

## Knowledge Gaps
- **140 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+135 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Day` connect `schedule.ts` to `Wizard.tsx`, `ItineraryMap.tsx`, `suggestions.ts`, `lib/lodging.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `Place` connect `Wizard.tsx` to `schedule.ts`, `suggestions.ts`, `lib/lodging.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Wizard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10909090909090909 - nodes in this community are weakly interconnected._
- **Should `schedule.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09990749306197964 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._