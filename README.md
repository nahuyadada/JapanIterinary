# Japan Itinerary Maker

Browse a curated catalog of places across Japan, pick the ones you want to visit, choose your
trip dates, and get an editable day-by-day itinerary with a map. No login, no database — your
trip is saved locally in your browser.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Testing

```bash
npm test
```

Runs the Vitest suite covering the itinerary-generation logic in `src/lib/itinerary.ts`.

## How it works

- **Choose places** — a catalog of Japan destinations grouped by region (Tokyo, Kyoto, Osaka,
  Nara, Hakone/Fuji, Hiroshima, Sapporo/Hokkaido), filterable by category.
- **Pick dates** — set a start and end date for the trip.
- **Itinerary** — selected places are automatically distributed across the trip's days (grouped
  by region), shown alongside a map with day-numbered markers. Places can be moved between days
  or removed.
