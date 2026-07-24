# TODO — Japan Itinerary Maker

Notes for picking this back up in a future session.

## Unfinished features

### 1. Place photos (hover preview)
Only **6 of 74** places have a real photo (`imageUrl` in `src/data/places.ts`): Sensō-ji, Meiji
Jingu Shrine, Shibuya Crossing, Ueno Park, Tokyo Skytree, and Akihabara Electric Town. Every
other place — including the 7 newer Tokyo additions (Shibuya Sky, Tokyo Tower, Shinjuku Gyoen,
Imperial Palace, Takeshita Street, Odaiba, Ghibli Museum) and all of Kyoto, Osaka, Nara,
Hakone/Fuji, Hiroshima, Sapporo/Hokkaido, Kobe/Himeji, Chubu, Kyushu, Shikoku, Okinawa, Tohoku,
and Chugoku — falls back to a colored emoji placeholder in the hover preview.

To find more real photos:
- Use Wikipedia's REST summary API: `https://en.wikipedia.org/api/rest_v1/page/summary/<title>`,
  preferring `originalimage.source` (fall back to `thumbnail.source`).
- Only accept `upload.wikimedia.org`-hosted URLs (stable, appropriately licensed).
- **Do this in small batches** (roughly 8–10 places at a time). A background agent tried to do
  all remaining places in one pass this session and repeatedly hit session cost limits partway
  through — pace it out across turns/sessions instead.

### 2. Hover preview positioning
The preview popover (`src/components/PlaceCard.tsx`) always opens to the right of the card
(`left-full`). Cards in the last grid column can have the popover clipped off-screen on
narrower viewports. Needs either a viewport-aware flip (open left when near the right edge) or
at least manual testing across breakpoints.

### 3. Itinerary day-distribution behavior (route + duration aware) — HIGH PRIORITY
`buildItinerary` (`src/lib/itinerary.ts`) currently fills each day up to a flat `MAX_PER_DAY` (4)
places, and only has basic start-city/end-city ordering (start city's places first, end city's
places last, fixed region-list order in between — see the `startCity`/`endCity` options added in
the prior session). The user wants this to become meaningfully smarter:

- **Start-city-anchored early days**: the first day(s) of the trip should be in or near the
  chosen starting city specifically (not just "somewhere in that city's region eventually") —
  make sure the very first days are dominated by places in/near `startCity`.
- **Transportation-aware middle route**: instead of the fixed `REGIONS` array order for
  everything between the start and end city, the middle of the trip should follow a sensible
  geographic/transportation-aware route — progressing logically from the start city, through
  intermediate regions, toward the end city, minimizing backtracking rather than using an
  arbitrary fixed region order. Could use rough region-to-region distance/travel-time data (even
  a hardcoded adjacency/ordering table keyed by common Japan travel routes — e.g. Shinkansen
  line order — would be a big improvement over the current fixed list).
- **Per-place estimated duration**: add a duration field to `Place` in `src/data/places.ts`
  (e.g. `durationHours: number`, or a simpler tier like `"quick" | "half-day" | "full-day"`) so
  the algorithm knows roughly how long a visit + its activities take, instead of assuming every
  place takes an equal slot.
- **Duration-aware day packing**: replace the flat `MAX_PER_DAY` cap with logic that fills each
  day based on total estimated available hours (e.g. ~8-10 hours of activity time per day) —
  several quick places can share a day, while a long one takes most/all of a day by itself.
- **Multi-day attractions**: some places are big enough to reasonably fill a whole day, or even
  span multiple days — the example given was **Universal Studios Japan (USJ)**, which has enough
  attractions/activities to justify being a full day on its own, with an option for the user to
  allocate **2 days** there instead of 1. Add a `suggestedDays`/`maxDays`-style field (or min/max
  range) for places like this, and either auto-allocate that many days in the itinerary or prompt
  the user (e.g. "How many days at Universal Studios Japan? 1 / 2") when such a place is
  selected.

This was explicitly requested as the next thing to build — not yet started.

## Housekeeping

### 4. Stale docs in the new repo
`docs/superpowers/plans/2026-07-15-date-planner-mvp.md` and
`docs/superpowers/specs/2026-07-15-date-planner-design.md` are leftovers from the original
DatePlanner project (dating itinerary planner with auth/DB) and don't apply to this app. Flagged
during the repo transfer but never actually removed.

### 5. `.env.example`
Leftover from the original NextAuth/Prisma setup, which has since been fully removed from the
app. This project has no backend or env vars anymore — the file should probably just be deleted.

### 6. Design docs don't cover later features
`docs/superpowers/specs/2026-07-24-japan-itinerary-maker-design.md` and its accompanying plan
only document the original 3-step wizard build. The hover-preview feature, the 74-place catalog
expansion, and the search box were all built directly without matching spec/plan docs.

### 7. Git state
The `JapanIterinary` repo (https://github.com/nahuyadada/JapanIterinary.git) has been
initialized locally with `origin` set and all files staged (`git add -A`), but nothing has been
committed or pushed yet — that's intentionally left for the user to do.

### 8. Map labels are in Japanese, not English
`src/components/ItineraryMap.tsx` uses the default OpenStreetMap "Standard" tile layer
(`https://tile.openstreetmap.org/{z}/{x}/{y}.png`), which renders place/street labels in the
local language (Japanese) rather than English — hard to read for non-Japanese-speaking users.
Confirmed as a bug to fix; not yet implemented.

Fix: swap the tile provider for one that renders labels in English/Latin script by default, e.g.:
- CartoDB Voyager: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- CartoDB Positron (lighter/minimal style): `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
- Or a Mapbox/Stadia Maps style with a `language=en` parameter, if willing to sign up for a
  (free-tier) API key — gives the most reliable full-English labeling.

Whichever is chosen, remember to also update the attribution string in the `<TileLayer>` to
match that provider's required attribution.

## Possible next features (not started)
- Fill in remaining real photos (see #1).
- Route + duration aware day-distribution (see #3 — top priority for next session).
- Hover preview on the Itinerary step's day cards too (currently only in the "Choose places" catalog).
- Switch map tiles to an English-labeled provider (see #8).
- Mobile/touch testing of the hover-preview "i" tap toggle — never verified on an actual touch device.
- Export/print/share the finished itinerary.
