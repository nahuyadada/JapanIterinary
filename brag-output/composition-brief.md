# Hyperframes Composition Brief: Trip to Japan

## Objective
Create a short launch-style brag video for Trip to Japan.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 22 seconds

## Source Material
- Project root: the JapanIterinary Next.js app
- Primary files read: `src/app/page.tsx`, `src/components/Wizard.tsx`, `PlaceCard.tsx`, `CatalogFilters.tsx`, `ItineraryMap.tsx`, `ItineraryDay.tsx`, `DaySchedule.tsx`, `site/Hero.tsx`, `site/SiteHeader.tsx`, `src/data/places.ts`
- Product name: Trip to Japan
- Strongest claim: "a smart, route-aware day-by-day itinerary across Japan"
- Key UI to show: the real components, not recreations. `capture.mjs` opens the running app in headless Chrome, walks the flow, and saves the rendered DOM of each state plus the app's own CSS, fonts and images into `composition/assets/app/`. `build.mjs` places those fragments in `index.html`.
- Copy that must appear verbatim: "Discover Japan", "Start Your Journey", "Plan Your Trip", "Trip to Japan"

## Creative Direction
- Tone preset: app-store — quiet, warm travel-product film
- Angle: the real flow in three steps, driven by a cursor
- Hook: the app's hero and a press on "Start Your Journey"
- Outro: "Trip to Japan — Plan Your Trip"
- Avoid: generic SaaS language, abstract filler, any redesign of the UI

## Visual Identity
- LOOK: the app's own light theme — pink-50 → white ground, white rounded-2xl cards, red-500 accent, Geist Sans; captions in gray-900 on the pink ground.

## Storyboard
See `brag-plan.md`. 1 Hero 0–2.73 · 2 Choose places 2.73–8.74 · 3 Pick dates 8.74–12.55 · 4 Itinerary 12.55–18.56 · 5 Outro 18.56–22.

## Audio
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`, volume 0.32, 2s fade-out
- Cue source: bundled preset `cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.md`
- Beat locks: 8.74 (scene cut), 13.11 (map), 18.56 (logo); clicks on 4.91 / 6.00 / 7.09
- SFX: `interface/click_003.ogg` per cursor press, `impact/impactSoft_medium_001.ogg` on the logo
- Audio-reactive: skipped — the media-use extraction helper is not installed on this machine.

## Hyperframes Instructions
Hyperframes skills are not installed here; the composition follows the contract in the scaffold's `CLAUDE.md` and `npx hyperframes docs` (data attributes, one paused root GSAP timeline on `window.__timelines`, deterministic, local assets). Gate: `npx hyperframes check`.
