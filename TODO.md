# TODO — Japan Itinerary Maker

Notes for picking this back up in a future session.

## Done this session (2026-07-24)

- **Figma "Trip to Japan" landing UI** — the app is now wrapped in the landing page from
  https://micro-house-37289406.figma.site: fixed blurred header + nav, full-screen Mt. Fuji hero
  with "Start Your Journey" CTA, Why Japan, Popular Destinations, the interactive planner (the
  wizard, at `#plan`), Culture & Traditions, Travel Tips, and a dark footer. The whole app is
  pinned to light mode to match the design (red-500 / pink-50 language, rounded-2xl cards). New
  section components live in `src/components/site/`.
- **Route + duration aware itinerary** (was #3) — see `src/lib/itinerary.ts`:
  - Regions are ordered along a Shinkansen-style travel corridor (`ROUTE_ORDER`) via
    `orderRegions`, so the trip progresses geographically with minimal backtracking.
  - Start-city places anchor the first day(s); end-city places close the trip.
  - `Place.durationHours` (optional, defaults to `DEFAULT_DURATION_HOURS`) drives duration-based
    day packing (~`DAY_HOURS` = 9h/day) instead of a flat per-day count.
  - A new day starts when the region changes, so distant cities never share a day.
  - `Place.maxDays` + the wizard's day-allocation prompt let big places (Universal Studios Japan,
    Niseko, Yakushima) span multiple days. USJ defaults to a 1/2-day choice.
- **Hover-preview clipping** (was #2) — `PlaceCard` now flips the popover to the left for cards in
  the last grid column (`lastInRow` prop) so it isn't clipped off-screen.
- **English map tiles** (was #8) — `ItineraryMap` now uses CartoDB Voyager tiles (Latin-script
  labels) with the correct CARTO + OpenStreetMap attribution.
- **Housekeeping** (was #4, #5) — deleted the stale DatePlanner docs
  (`docs/superpowers/{plans,specs}/2026-07-15-date-planner-*`) and the leftover `.env.example`.
- **Photos** (part of #1) — added real Wikimedia Commons photos for 9 more places
  (Fushimi Inari, Kinkaku-ji, Arashiyama, Kiyomizu-dera, Osaka Castle, Dōtonbori, Nara Park,
  Tōdai-ji, Himeji Castle). ~15 of 74 places now have a real `imageUrl`.

## Unfinished / next up

### 1. Place photos (remaining)
Still ~59 of 74 places fall back to a colored emoji placeholder in the hover preview. To find more:
- Use Wikipedia's REST summary API: `https://en.wikipedia.org/api/rest_v1/page/summary/<title>`,
  preferring `originalimage.source` (fall back to `thumbnail.source`).
- Only accept `upload.wikimedia.org`-hosted **photos** (skip fair-use logos like the USJ logo).
- **Do this in small batches** (~8–10 places at a time) to avoid session cost limits.

### 6. Design docs don't cover later features
The spec/plan under `docs/superpowers/` still only describe the original 3-step wizard. The hover
preview, the 74-place catalog, the search box, the route+duration algorithm, and the landing-page
reskin were all built without matching spec/plan docs.

### 7. Git state
Repo (https://github.com/nahuyadada/JapanIterinary.git) has `origin` set; committing/pushing is
left to the user.

## Possible next features (not started)
- Fill in remaining real photos (see #1).
- Hover preview on the Itinerary step's day cards too (currently only in the catalog).
- Mobile/touch testing of the hover-preview "i" tap toggle — never verified on a real touch device.
- Export/print/share the finished itinerary.
- Consider travel-time estimates between regions to cap how far the itinerary jumps per day.
