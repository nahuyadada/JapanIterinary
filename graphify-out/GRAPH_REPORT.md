# Graph Report - .  (2026-07-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 229 nodes · 456 edges · 24 communities (15 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a3ccf19d`
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

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `durationRangeFor()` - 15 edges
3. `Day` - 15 edges
4. `Place` - 13 edges
5. `formatRange()` - 11 edges
6. `PLACES` - 10 edges
7. `haversineKm()` - 9 edges
8. `suggestForItinerary()` - 9 edges
9. `Region` - 8 edges
10. `tripDays()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `CityPlan()` --indirect_call--> `area()`  [INFERRED]
  src/components/CityPlan.tsx → src/lib/navigation.test.ts
- `ItineraryMap()` --indirect_call--> `p()`  [INFERRED]
  src/components/ItineraryMap.tsx → src/lib/itinerary.test.ts
- `AddAttraction()` --indirect_call--> `p()`  [INFERRED]
  src/components/AddAttraction.tsx → src/lib/itinerary.test.ts
- `CityPlan()` --calls--> `bookingLinksForArea()`  [EXTRACTED]
  src/components/CityPlan.tsx → src/lib/lodging.ts
- `DaySchedule()` --calls--> `durationRangeFor()`  [EXTRACTED]
  src/components/DaySchedule.tsx → src/lib/duration.ts

## Import Cycles
- None detected.

## Communities (24 total, 9 thin omitted)

### Community 0 - "Wizard.tsx"
Cohesion: 0.15
Nodes (23): DateRangePicker(), CATEGORY_EMOJI, PlaceCard(), ItineraryMap, PersistedState, stayKey(), Step, STEPS (+15 more)

### Community 1 - "schedule.ts"
Cohesion: 0.15
Nodes (21): CityPlan(), fmt(), DaySchedule(), MODE_LABELS, Day, haversineKm(), StayRecommendation, buildDayRoutes() (+13 more)

### Community 2 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 3 - "suggestions.ts"
Cohesion: 0.18
Nodes (21): AddAttraction(), DAY_COLORS, ItineraryDay(), VERDICT, StaySuggestions(), HourRange, PLACE_META, placeDurationRange() (+13 more)

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
Cohesion: 0.22
Nodes (11): LODGING_AREAS, LodgingArea, BookingLink, bookingLinksForArea(), groupStays(), meanDistanceToPlaces(), nightsBetween(), recommendForStay() (+3 more)

### Community 8 - "PLACES"
Cohesion: 0.40
Nodes (4): PLACES, byId(), byId(), byId()

### Community 9 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 10 - "ItineraryMap.tsx"
Cohesion: 0.60
Nodes (4): DAY_COLORS, ItineraryMap(), lodgingIcon(), numberIcon()

## Knowledge Gaps
- **83 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Day` connect `schedule.ts` to `Wizard.tsx`, `suggestions.ts`, `lib/lodging.ts`, `PLACES`, `ItineraryMap.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `schedule.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1471264367816092 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._