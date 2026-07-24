# DatePlanner — Design Spec

Date: 2026-07-15

## Summary

A responsive web app (works on phone browser and desktop, no native app needed) for planning a date night or multi-day date trip. Users build an itinerary of stops (restaurants, parks, scenic spots, movies, activities, etc.), each with a time, location, and estimated cost. The app tracks a running budget against an optional limit, lets users log actual spend after the date, shows a weather forecast, and supports exporting/printing the plan. Places can be searched via a real maps API or picked from ratings-based suggestions. Plans are private by default; the owner can share a read-only link or invite a specific person as an editor.

## Audience & Access Model

- General multi-user product: anyone can sign up.
- A **Plan** has one **owner**. The owner can invite a specific person by email to become an **editor** (that person must have or create an account to log in and edit).
- The owner can also generate a **read-only share link** — anyone with the link can view the itinerary, map, and budget summary, but cannot edit and does not need an account.

## Tech Stack

- **Frontend:** Next.js (React) — single responsive codebase for phone + desktop.
- **Backend:** Next.js API routes (Node) — no separate backend service.
- **Database:** PostgreSQL (hosted on Neon or Supabase) via Prisma ORM.
- **Auth:** NextAuth.js — email/password to start; easy to add OAuth (Google) later.
- **Places search:** Google Places API (search, details, ratings, price level, geocoding). Covers all place types needed — restaurants, parks, scenic viewpoints, entertainment, etc., not restaurant-specific.
- **Place suggestions (MVP):** ratings/popularity-based, sourced from the Places API response data. No AI required.
- **AI-curated suggestions (deferred, post-MVP):** Claude API for "plan my date for me" style prompts (mood/budget/occasion → suggested ideas), cross-referenced against real places from the Places API. Deferred because the user doesn't yet have a Claude API key. The data model and suggestion API leave room for this to be added later without rework.
- **Weather:** Open-Meteo (free, no API key) by lat/lng + date. Forecasts are only available roughly 14 days out; for dates beyond that, the UI shows a "check back closer to the date" note instead of erroring.
- **Export:** Server-rendered PDF (e.g. `@react-pdf/renderer`) plus a print-friendly CSS view.
- **Hosting:** Vercel (app) + Neon/Supabase (DB).

## Data Model

- **User** — id, email, password_hash, name
- **Plan** — id, owner_id, title, start_date, end_date, budget_limit (nullable), share_token, created_at
- **PlanDay** — id, plan_id, date, day_order *(a single-day plan has exactly one PlanDay; multi-day plans have several)*
- **Stop** — id, plan_day_id, name, address, lat, lng, category, start_time, end_time, estimated_cost, actual_cost (nullable, filled in after the date), notes, stop_order, source ("places_api" | "manual")
- **PlanCollaborator** — plan_id, user_id, role ("editor")

Categories are broad, not restaurant-centric: Restaurant, Park, Scenic View/Nature, Movie/Entertainment, Activity, Shopping, Other.

Derived values (computed on load, not stored): `total_estimated`, `total_actual`, `over_budget` (estimated total vs. `budget_limit`), `variance` (actual vs. estimated, once actual costs are logged).

## Core Flows

**Creating a plan:** Set title + date range (single day or multiple) and an optional budget limit. For each day, add stops by searching real places (Places API autocomplete), picking from ratings-based suggestions nearby, or entering a stop manually. Each stop gets a time slot, category, and estimated cost (pre-filled from the place's price level when available, always editable).

**Viewing a plan:** Map-first layout — a map with numbered pins showing the day's route, itinerary list below it ordered by time, running budget total shown against the limit (warns/turns red if the estimated total exceeds it). Weather forecast shown per day near the top when within the forecast window.

**After the date:** User fills in `actual_cost` per stop; the plan shows estimated vs. actual totals and the variance.

**Sharing & collaboration:** Owner gets a read-only share link (no edit controls, no login required) and can separately invite a specific person by email to become an editor (they must sign up/log in).

**Exporting:** From a plan view, "Export" generates a PDF or print-friendly view of the itinerary — stops, times, addresses, costs — for offline use.

## Error Handling

- Places API failures fall back to manual stop entry — never blocks plan creation.
- Weather API failures hide the weather block rather than erroring the page.
- Budget/variance figures are always computed from stored stop costs, so they display correctly even if a downstream API is down.

## Non-Functional Notes

- **Access control:** every plan/stop API route checks the caller is the owner or an editor (for writes) or holds a valid share_token (for read-only access).
- **Responsive design:** mobile-first CSS; the map-first view needs the map on top with a collapsible list below on small screens.
- **Testing:** unit tests for budget/variance calculations and access-control logic (owner vs. editor vs. share-link viewer); integration tests for plan CRUD API routes; end-to-end tests for the core flow (create plan → add stop → view budget warning → export).

## Deferred / Future

- AI-curated suggestions (needs a Claude API key)
- Reminders/notifications
- Native mobile app
