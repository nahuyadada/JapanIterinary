# Traveler-entered accommodation, with geocoding and a map fallback

Date: 2026-07-25

## Problem

A traveler who has already booked a hotel has no way to tell the app about it. The
itinerary assumes they are staying in whichever neighborhood `recommendStays` suggests,
so every day's directions start from a neighborhood centroid rather than from their
actual door.

An earlier iteration shipped a free-text input per stay (`payload.stayOrigins`), then had
its UI removed. The text-only design had a real limitation: a typed name carries no
coordinates, so distances could not be computed and the accommodation could not be drawn
on the map. This design brings the feature back with resolved coordinates.

## Decisions

Settled with the user before design:

1. **Role in the itinerary — both.** The accommodation becomes the routing origin for
   every day of its stay *and* appears as a visible overnight row in the day.
2. **Recognition — geocode, with a map fallback.** Names are resolved against
   OpenStreetMap Nominatim through a server-side proxy. When nothing matches, the
   traveler places a pin themselves.
3. **Map marker — yes.** The trip map gains a distinct accommodation pin per stay.
4. **Geocoder contact — environment variable.** `GEOCODER_CONTACT` lives in `.env.local`,
   which `.gitignore:34` (`.env*`) excludes from the repository. The contact address is
   never committed.

## Data model

`stayOrigins` keeps its field name and its `${region}-${firstDayIndex}` key format, so
existing shared links and existing `localStorage` state continue to resolve. Its value
widens:

```ts
/** Where the traveler is actually staying for one stay. */
export type StayLodging = {
  /** What the traveler typed, or the name the geocoder returned. */
  name: string;
  /** Present once resolved by geocoding or a dropped pin; absent means name-only. */
  lat?: number;
  lng?: number;
  /** Geocoder address line, kept to disambiguate similar names. */
  address?: string;
  /** How the coordinates were obtained, surfaced so the traveler knows what to trust. */
  source?: "geocoded" | "pinned";
};
```

`parsePayload` remains the single trust boundary and normalizes both the legacy and the
current shape. A bare string migrates to `{ name }`, which degrades precisely to today's
text-origin behavior — no shared link breaks.

### Validation rules

Applied in `parsePayload`, because coordinates arriving from a shared link are untrusted:

- `name`: non-empty after trimming, capped at 120 characters. An entry without a usable
  name is dropped.
- `lat` / `lng`: finite numbers with `lat` in [-90, 90] and `lng` in [-180, 180]. If
  either is missing or invalid, **both are dropped** and the entry degrades to name-only.
  Half a coordinate pair is never kept.
- `address`: optional string, capped at 200 characters.
- `source`: kept only when exactly `"geocoded"` or `"pinned"`; anything else is dropped.
- Entry count capped at 40, matching the existing defensive caps.

Worst case for a hostile payload is a wrong pin and a wrong directions link for whoever
opens that link — bounded, and no worse than the free-text version.

### Amendment 2026-07-25: the compact share-link format must carry coordinates

Discovered after this design was approved. `tripPayload.ts` has a second serializer —
`encodePayload` / `decodePayload`, a compact `~`-delimited string behind
`/itinerary/view?p=`. It wrote stay origins as flat text:

```ts
Object.entries(payload.stayOrigins).map(([k, v]) => `${k}:${v}`).join("|")
```

A `StayLodging` object cannot survive that. Left alone, `String(lodging)` would emit
`[object Object]` and the accommodation would silently vanish from every `?p=` link.

This is not a rare path. `POST /api/itinerary` falls back to `encodePayload` whenever
`DATABASE_URL` is unset **or** the insert throws, and `Wizard.shareTrip` falls back to it
on any network error. On a deployment without a database it is the *only* share path.

**Decision: extend the compact format to carry coordinates.** Preserving name-only here
was the alternative, but it would silently downgrade the feature's whole point — real
coordinates for routing and the map — on the primary share path of a database-less
deployment. A share link that quietly loses the traveler's hotel is exactly the silent
data loss this project's trust-boundary discipline exists to prevent.

Per-entry format, entries still joined by `|`:

```
key:lat:lng:src:name
```

- `lat` / `lng` — stringified numbers, or empty strings for a name-only entry.
- `src` — `"g"` for geocoded, `"p"` for pinned, empty when unknown. Abbreviated because
  this format's entire reason to exist is URL length.
- `name` — percent-encoded, so it cannot contain the `:`, `|`, or `~` that delimit the
  format. `encodeURIComponent` leaves `~` alone, so it is escaped explicitly; a typed
  hotel name containing `~` previously corrupted the whole compact string, and new links
  no longer can.

One field is **deliberately** not carried: `address`. It is display-only disambiguation,
and up to 200 characters per stay is a poor trade in a format that exists solely to keep
URLs short. A `?p=` link therefore shows the accommodation's name, its source badge, and
its map pin, but no address line. Everything load-bearing — the routing origin and the
marker position — survives. This is a stated degradation, not a silent one; the database
share path (`/itinerary/<code>`) carries the full object including the address.

Reading is backward compatible. An entry is treated as the new shape only when it splits
into at least five `:` fields **and** fields 2–3 each parse as a number-or-empty **and**
field 4 is one of `g` / `p` / empty. Anything else is read the legacy way — everything
after the first colon is a raw name, yielding `{ name }`. Keys are `${region}-${index}`
and contain no colon, so the split is unambiguous.

The decoded result still goes through `parsePayload`, which remains the single trust
boundary: the compact decoder does no validation of its own beyond shape discrimination.

**The compact string must be URL-encoded by whoever puts it in `?p=`.** Both call sites —
`Wizard.shareTrip` and the `POST /api/itinerary` fallback — previously interpolated it raw.
That is load-bearing rather than cosmetic once names are percent-escaped: the URL layer
decodes `%7C` back to `|` before `decodePayload` runs, so a name containing a delimiter
would split into fragments and the accommodation would be truncated. Verified in the
browser: a stay named `Annex|East ~ 50% off` arrived as `Annex` before the fix and intact
after it. A test round-trips `encodePayload` through a real `URLSearchParams` read to keep
the requirement from regressing.

## Geocoding

### Route

`src/app/api/geocode/route.ts`, `GET ?q=<query>`, `dynamic = "force-dynamic"`.

Proxies `https://nominatim.openstreetmap.org/search` with `format=jsonv2`,
`countrycodes=jp`, `limit=5`, `addressdetails=1`.

The proxy is not optional. The browser cannot set the identifying `User-Agent` that
Nominatim's usage policy requires, and routing through our own origin also avoids CORS.
Keeping it server-side puts policy compliance in exactly one place.

Only `q` is user-controlled, and it is URL-encoded into a query parameter of a hard-coded
host, so there is no SSRF surface.

### Usage-policy compliance

Nominatim's public instance asks for an identifying User-Agent, at most one request per
second, and cached results. This design satisfies that by:

- Sending `User-Agent: japan-itinerary-maker/0.1 (+${GEOCODER_CONTACT})`, falling back to
  a generic repository identifier when the variable is unset.
- Searching only on an **explicit** action — button press or Enter — never per keystroke.
  This is the main reason request volume stays low, and it is better UX here than
  search-as-you-type.
- Caching normalized queries in an in-process `Map` with a TTL, so repeated lookups of the
  same name cost nothing.

A high-traffic deployment would outgrow the public instance and should move to a paid or
self-hosted geocoder. That limit is documented, not designed around.

### Failure handling

A 5-second `AbortSignal.timeout` bounds the upstream call. Timeouts, non-OK responses, and
unparseable bodies all produce a plain error message, and the map fallback stays available
throughout. Geocoding never blocks setting an accommodation.

### Testability

Query validation and Nominatim response normalization live in `src/lib/geocode.ts` as pure
functions, unit-tested without network. The route handler stays thin: read `q`, delegate,
respond.

## Components

### `StayLodgingPicker` (new)

One per stay, rendered in `CityPlan` beneath the recommended areas — the same place the
removed input lived, and the natural spot for "or tell us where you actually booked".

Props: the stay's region, a city hint for display, the current `StayLodging | null`, an
`onChange`, and a default map center (the stay's top recommended area, so a dropped pin
starts somewhere sensible rather than mid-ocean).

Flow:

1. Type a name, press Enter or the search button.
2. Pick from up to five candidates, each showing name and address. Selecting one yields
   `{ name, address, lat, lng, source: "geocoded" }`.
3. "Set location on map instead" switches to `CustomLocationMapPicker`, yielding
   `{ name, lat, lng, source: "pinned" }`.
4. A clear action removes the accommodation entirely.

Once resolved, the picker shows the name, the address, and a badge naming the source, so a
geocoded match is never mistaken for a hand-placed pin.

`CustomLocationMapPicker` is reused as-is via `next/dynamic`, mirroring how
`AddCustomLocationModal` already imports it.

## Guide changes

`guideOrigins` is replaced by `dayBases`, returning both facts per day:

```ts
export type DayBase = { origin: NavOrigin; lodging: StayLodging | null };
export function dayBases(
  recommendations: StayRecommendation[],
  lodging: Record<string, StayLodging>
): Map<number, DayBase>;
```

Threading two parallel maps into `buildGuideDays` would be worse than one map carrying the
pair. This is the only interface churn, and it migrates the existing `guideOrigins` tests.

Origin precedence per day, unchanged in spirit:

1. Accommodation with coordinates → a `NavPoint`. Distances and the day schedule now work
   from the traveler's real location.
2. Accommodation with a name only (legacy payloads) → `textOrigin(name, cityProper(...))`,
   today's behavior.
3. No accommodation → the stay's top recommended area.

`GuideDay` gains `lodging`, set only when the traveler specified one.

### The overnight row is presentational

The accommodation is **not** injected into `days` as a synthetic `Place`. Doing so would
corrupt leg distances, stop numbering, `tripProgress` totals, and the "X of Y stops done"
counter. `TripGuide` renders `day.lodging` as its own row instead.

## Consistency fix that falls out

`buildDaySchedule` currently estimates the first leg from the recommended *area*, which is
why the wizard's schedule could disagree with the guide's origin. With real coordinates
available, `CityPlan` passes the accommodation instead, and the two views agree.

## Map marker

**Amended 2026-07-25: smaller than originally specced.** `ItineraryMap` already draws a
lodging pin per stay — `lodgingIcon`, a 🛏️ marker distinct from the numbered attraction
markers, positioned from `stayRecommendations[].areas[0]` and coloured by day. The marker
system exists; this design does not add one.

The actual change is one of **precedence inside the marker that already exists**: when the
traveler has set an accommodation with coordinates for a stay, that pin is drawn at their
door instead of at the recommended area's centroid, and its popup names their hotel rather
than the area. `ItineraryMap` takes a new optional `lodging` prop keyed by stay key and
prefers it per stay; everything about the icon, the colour, and the layering is untouched.

Precedence per stay, mirroring `dayBases`:

1. Accommodation with coordinates → pin at those coordinates, popup shows its name.
2. Accommodation with a name only → the recommended area keeps the pin. There are no
   coordinates to move it to, and guessing a position is exactly the fabrication this
   design avoids. The popup still names the area, because that is what is being pointed at.
3. No accommodation → today's behaviour, unchanged.

A stay with no recommended areas *and* a name-only accommodation draws no pin, as today.

`ItineraryMap` is rendered by `Wizard`, not by the shared trip page, so this marker is
immediate feedback while planning — the same screen the picker lives on.

## Testing

- `geocode.test.ts` — query validation (too short, too long, whitespace) and response
  normalization (well-formed results, missing fields, empty array, malformed JSON).
- `tripPayload.test.ts` — legacy string migration, coordinate range checks, half-pair
  rejection, `source` whitelist, caps, round-trip through `buildPayload`, and — per the
  compact-format amendment — a coordinate-preserving round-trip through
  `encodePayload`/`decodePayload`, a legacy `key:name` compact entry still decoding to
  `{ name }`, and names containing `:`, `|`, or `~` surviving intact.
- `guide.test.ts` — `dayBases` precedence across all three origin cases; coordinates
  produce measurable distances where a name-only entry produces `null`; `lodging` surfaces
  on `GuideDay` only when set.
- Browser verification of the full flow: search, select, pin fallback, overnight row, map
  marker, and a legacy shared link still rendering.

## Files

**New**

- `src/app/api/geocode/route.ts`
- `src/lib/geocode.ts`, `src/lib/geocode.test.ts`
- `src/components/StayLodgingPicker.tsx`

**Changed**

- `src/lib/tripPayload.ts` (+ test) — `StayLodging`, validation, legacy migration, and the
  amended compact `encodePayload`/`decodePayload` stay format
- `src/lib/guide.ts` (+ test) — `dayBases`, `DayBase`, `GuideDay.lodging`
- `src/components/CityPlan.tsx` — mount the picker, pass accommodation to
  `buildDaySchedule`
- `src/components/Wizard.tsx` — `stayOrigins` state becomes `Record<string, StayLodging>`
- `src/components/TripGuide.tsx` — overnight row, richer lodging-tab display
- `src/components/ItineraryMap.tsx` — prefer the traveler's accommodation over the
  recommended area in the lodging marker that already exists (see amended Map marker)

**Configuration**

- `.env.local` — `GEOCODER_CONTACT`, gitignored

## Out of scope

- Hotel *booking*. The existing `bookingLinksForArea` deep links remain the booking path.
- Storing accommodation check-in/check-out times or reservation numbers.
- A bundled hotel dataset. Nominatim plus a map pin covers the need without shipping data
  that would go stale.
- Reverse geocoding a dropped pin into an address. The traveler's own name for the place is
  what gets displayed.

## Risks

- **External dependency.** Geocoding needs network and a third-party service. Mitigated by
  the always-available map fallback and bounded failure handling.
- **Match quality.** Small guesthouses may not be in OSM. This is why the fallback is a
  first-class path, not an error state.
- **Public-instance limits.** Documented above; outgrowing them means changing geocoder,
  which the `src/lib/geocode.ts` boundary keeps to one file.
