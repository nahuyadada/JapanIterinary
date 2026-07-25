# Reservation & Ticket Requirement Assistant — design

**Date:** 2026-07-25
**Status:** Approved

## Problem

A traveler builds an itinerary, flies to Japan, and discovers the Ghibli Museum sold
out six weeks ago and teamLab Planets does not sell tickets at the door. The app
plans *where* to go but says nothing about *what must be booked first*.

This feature annotates every itinerary activity with its booking requirements and
derives a pre-departure checklist of the things that actually need action.

## Constraints & context

- The app is fully static/offline. Attractions live in `src/data/places.ts` as a typed
  array; there is no backend and no live availability API. All booking facts are
  curated data, and the UI must be honest that they are approximate.
- Logic belongs in pure, unit-tested modules under `src/lib` (vitest), mirroring
  `itinerary.ts`, `lodging.ts`, `suggestions.ts`, and `duration.ts`.
- The itinerary is a `Day[]` derived by `useMemo` in `Wizard.tsx`. Anything derived
  from it therefore updates automatically whenever the itinerary changes — no
  invalidation logic is needed to satisfy the "must stay up to date" requirement.
- **Naming:** `lodging.ts` already owns `bookingLinksForArea` / `BookingLink` for
  *hotel* booking. This feature is namespaced `reservations` to keep attraction
  ticketing distinct from lodging.
- `openingHours` and `estimatedVisitDuration` already exist via
  `placeMeta.placeHours(id)` and `duration.durationRangeFor(place)`. This feature
  reads them rather than duplicating them, so they cannot drift.

## Decisions

- **Curate all 74 places.** Every id in `PLACES` gets an explicit entry. A
  data-integrity test enforces total coverage and rejects orphan entries.
- **Store facts, derive the rest.** Hand-writing 13 fields × 74 places invites
  contradictions (an entry marked `required` but `walkInAvailable: true`). The data
  file stores only what cannot be derived; the lib derives the flags, dates, priority,
  and notices. Consistency becomes structural instead of a thing to get right 74 times.
- **Computed dates, not static copy.** Curated *rules* ("opens 30 days before",
  "the 10th of the previous month") resolve against the traveler's real visit date to
  produce real dates, plus an "open now — book it" signal against today.
- **Never invent a URL.** A dead link on a "you must book this" row is worse than no
  link. URLs for the critical attractions were verified by search; where a URL could
  not be stood behind, the field is omitted and the row simply does not render.
- **Exact yen with one honest caveat.** Prices are the most useful field for
  budgeting, so they are exact — with a single footer line noting they are approximate
  and to confirm officially, rather than hedging 74 times.
- **Checklist is 🔴/🟡 only** and read-only. It is an action list; 🟢 places still
  show their green badge and card in the itinerary but create no to-do.

## Data model — `src/data/reservations.ts`

```ts
export type BookingStatus = "none" | "recommended" | "required";

/** When booking opens, as a rule that resolves against a visit date. */
export type BookingOpens =
  | { kind: "daysBefore"; days: number }
  | { kind: "monthlyOn"; day: number; monthsBefore: number };

export type ReservationMeta = {
  status: BookingStatus;
  /** A dated/timed ticket must be bought ahead. Orthogonal to `status`. */
  advanceTicket: boolean;
  /** Override only where walk-in availability differs from the `status` default. */
  walkIn?: boolean;
  timeSlot?: boolean;
  /** Frequently sells out. Forces high priority and a warning notice. */
  sellsOut?: boolean;
  opens?: BookingOpens;
  /** Days before the visit that booking closes (1 = by the day before). */
  closesDaysBefore?: number;
  /** Recommended lead time in days; drives the computed "book by" date. */
  bookByDaysBefore?: number;
  /** Display copy for that lead time, e.g. "2–4 weeks before travel". */
  recommendedBookingTime?: string;
  officialBookingUrl?: string;
  /** Approximate adult admission, e.g. "¥3,600 (adult)" or "Free". */
  ticketPrice?: string;
  notes?: string;
};
```

`BookingOpens` is a union because real rules are not all "N days before": Shibuya Sky
releases slots 14 days ahead, while the Ghibli Museum sells each month's tickets from
10:00 JST on the 10th of the previous month. Both must resolve to a real date.

## Logic — `src/lib/reservations.ts`

`resolveBooking(place, visitDate, today = new Date())` returns every field the feature
displays. Derivations:

| Derived | Rule |
|---|---|
| `reservationRequired` | `status === "required"` |
| `walkInAvailable` | `walkIn` override if set, else `status !== "required"` |
| `bookingOpenDate` | resolved from `opens` against `visitDate` |
| `bookingDeadline` | `visitDate − closesDaysBefore` |
| `bookByDate` | `visitDate − bookByDaysBefore` |
| `bookingPriority` | `high` if `required \|\| sellsOut`; `medium` if `recommended`; else `low` |
| `openingHours` | `placeHours(place.id)` |
| `estimatedVisitDuration` | `durationRangeFor(place)` |

`today` is an injected parameter so date-sensitive behavior is deterministic under
test, matching the pure-function style of the rest of `src/lib`.

**Notices** are generated from resolved state:

- `sellsOut` → "This attraction frequently sells out."
- `bookByDate` in the future → "Book at least 2–4 weeks before your visit — by Sep 6."
- `bookingOpenDate` after `today` → "Reservations open Aug 21, 31 days before your visit."
- `bookingOpenDate` on/before `today` and status not `none` → "Booking is open now — reserve your slot."
- `walkInAvailable && status === "recommended"` → "Walk-ins are available but waiting times may be long."

**`tripChecklist(days, today)`** returns 🔴/🟡 items only, **deduped by place id** —
multi-day places such as USJ occupy several days but must appear once, dated to the
earliest — sorted high→medium priority then by visit date. Each item carries its
resolved booking plus an action line ("Book before your trip" / "Purchase tickets in
advance" / "Reserve a time slot").

## Components

| Component | Responsibility |
|---|---|
| `BookingBadge.tsx` | The 🟢🟡🔴 status pill. Shared by day rows and the checklist. |
| `BookingCard.tsx` | The full field list for one activity, shown when expanded. |
| `ItineraryPlaceRow.tsx` | One place inside a day: name, meta, move/remove controls, badge, and the disclosure state for its card. |
| `TripChecklist.tsx` | The "Things to Book Before Your Trip" section. |

`ItineraryDay.tsx` currently renders each place row inline. Adding a disclosure there
would push it past ~180 lines and mix day-level and place-level concerns, so the row
is extracted into `ItineraryPlaceRow.tsx` and `ItineraryDay` becomes a thin day shell.
This is the one pre-existing-code change the feature requires.

`Wizard.tsx` renders `<TripChecklist days={days} />` in the itinerary step, after the
map and before the city blocks — pre-departure actions belong where they are seen
first. It needs no new state: `days` is already a `useMemo`, so the checklist
recomputes on every itinerary change.

## Testing — `src/lib/reservations.test.ts`

- Derived-flag consistency across all three statuses.
- Date math against an injected `today`: `daysBefore` and `monthlyOn` resolution,
  deadline, and book-by date.
- Notice generation per scenario, including "opens later" vs "open now".
- Checklist: excludes 🟢, dedupes multi-day places to the earliest date, sorts
  high→medium.
- **Data integrity:** every `PLACES` id has an entry, no entry references an unknown
  id, every URL is `https:`, and no 🔴 entry claims walk-in entry without an explicit
  override — the guard that keeps a 74-entry hand-written file honest.

## Out of scope

- Live availability or real-time pricing (needs a backend and a paid API; would go stale).
- Actually booking anything in-app. Links go to official sites; the user books there.
- Restaurant reservations beyond what the curated catalog covers — the catalog has no
  individual restaurants, only food districts.
