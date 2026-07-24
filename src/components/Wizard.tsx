"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { PLACES, REGIONS } from "@/data/places";
import type { Region, Category } from "@/data/places";
import { buildItinerary, tripDays, type Day } from "@/lib/itinerary";
import PlaceCard from "@/components/PlaceCard";
import CatalogFilters from "@/components/CatalogFilters";
import DateRangePicker from "@/components/DateRangePicker";
import ItineraryDay from "@/components/ItineraryDay";

const ItineraryMap = dynamic(() => import("@/components/ItineraryMap"), { ssr: false });

type Step = "select" | "dates" | "itinerary";
const STORAGE_KEY = "japan-itinerary-v1";

type PersistedState = {
  step: Step;
  selectedIds: string[];
  start: string;
  end: string;
  manualMoves: Record<string, number>;
};

const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "Choose places" },
  { key: "dates", label: "Pick dates" },
  { key: "itinerary", label: "Your itinerary" },
];

export default function Wizard() {
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [manualMoves, setManualMoves] = useState<Record<string, number>>({});
  const [regionFilter, setRegionFilter] = useState<Region | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [hydrated, setHydrated] = useState(false);

  // Restore persisted trip state after mount. We deliberately read localStorage in an
  // effect (rather than a lazy useState initializer) so the server-rendered HTML matches
  // the client's first render and there is no hydration mismatch. setState-in-effect is
  // the correct pattern here, so the lint rule is scoped off for this block.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<PersistedState>;
        if (s.step) setStep(s.step);
        if (Array.isArray(s.selectedIds)) setSelectedIds(s.selectedIds);
        if (typeof s.start === "string") setStart(s.start);
        if (typeof s.end === "string") setEnd(s.end);
        if (s.manualMoves && typeof s.manualMoves === "object") setManualMoves(s.manualMoves);
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist whenever state changes (after initial hydration).
  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedState = { step, selectedIds, start, end, manualMoves };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota/availability errors
    }
  }, [hydrated, step, selectedIds, start, end, manualMoves]);

  const selectedPlaces = useMemo(
    () => PLACES.filter((p) => selectedIds.includes(p.id)),
    [selectedIds]
  );

  const datesValid = start !== "" && end !== "" && end >= start;

  const days: Day[] = useMemo(() => {
    if (!datesValid) return [];
    const base = buildItinerary(selectedPlaces, new Date(start), new Date(end));
    if (Object.keys(manualMoves).length === 0) return base;

    // Apply manual moves: pull moved places out of their computed day, then append
    // to the target day (clamped to a valid index).
    const maxIndex = base.length - 1;
    const moved = new Set(Object.keys(manualMoves));
    const cleaned = base.map((d) => ({
      ...d,
      places: d.places.filter((p) => !moved.has(p.id)),
    }));
    for (const [placeId, rawTarget] of Object.entries(manualMoves)) {
      const place = selectedPlaces.find((p) => p.id === placeId);
      if (!place) continue;
      const target = Math.min(Math.max(rawTarget, 0), maxIndex);
      cleaned[target].places.push(place);
    }
    return cleaned;
  }, [datesValid, selectedPlaces, start, end, manualMoves]);

  function togglePlace(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function removePlace(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setManualMoves((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function movePlace(id: string, toDayIndex: number) {
    setManualMoves((prev) => ({ ...prev, [id]: toDayIndex }));
  }

  function startOver() {
    setSelectedIds([]);
    setStart("");
    setEnd("");
    setManualMoves({});
    setRegionFilter("all");
    setCategoryFilter("all");
    setStep("select");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  const visiblePlaces = PLACES.filter(
    (p) =>
      (regionFilter === "all" || p.region === regionFilter) &&
      (categoryFilter === "all" || p.category === categoryFilter)
  );
  const visibleByRegion = REGIONS.map((region) => ({
    region,
    places: visiblePlaces.filter((p) => p.region === region),
  })).filter((g) => g.places.length > 0);

  const activeIndex = STEPS.findIndex((x) => x.key === step);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 grid gap-6">
      <header className="grid gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Japan Itinerary Maker</h1>
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => {
            const state = i === activeIndex ? "active" : i < activeIndex ? "done" : "todo";
            return (
              <li
                key={s.key}
                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${
                  state === "active"
                    ? "border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold"
                    : state === "done"
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                    : "border-gray-200 dark:border-neutral-700 text-gray-400 dark:text-gray-500"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white dark:bg-neutral-800 border dark:border-neutral-600 flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                {s.label}
              </li>
            );
          })}
        </ol>
      </header>

      {step === "select" && (
        <div className="grid gap-4">
          <CatalogFilters
            region={regionFilter}
            category={categoryFilter}
            onRegion={setRegionFilter}
            onCategory={setCategoryFilter}
          />
          {visibleByRegion.length === 0 && <p className="text-gray-500 dark:text-gray-400">No places match those filters.</p>}
          {visibleByRegion.map(({ region, places }) => (
            <section key={region} className="grid gap-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{region}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    selected={selectedIds.includes(place.id)}
                    onToggle={togglePlace}
                  />
                ))}
              </div>
            </section>
          ))}
          <div className="sticky bottom-0 bg-gray-50/90 dark:bg-neutral-950/90 backdrop-blur border-t border-gray-200 dark:border-neutral-800 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedIds.length} place{selectedIds.length === 1 ? "" : "s"} selected
            </span>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => setStep("dates")}
              className="px-5 py-2 rounded-lg bg-rose-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-700"
            >
              Next: pick dates
            </button>
          </div>
        </div>
      )}

      {step === "dates" && (
        <div className="grid gap-6">
          <p className="text-gray-600 dark:text-gray-400">
            When are you travelling? We&apos;ll spread your {selectedIds.length} selected place
            {selectedIds.length === 1 ? "" : "s"} across the trip.
          </p>
          <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd} />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!datesValid}
              onClick={() => setStep("itinerary")}
              className="px-5 py-2 rounded-lg bg-rose-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-700"
            >
              Build itinerary
            </button>
          </div>
        </div>
      )}

      {step === "itinerary" && (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-gray-600 dark:text-gray-400">
              {tripDays(new Date(start), new Date(end))}-day trip with {selectedPlaces.length} places
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("dates")}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={startOver}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Start over
              </button>
            </div>
          </div>
          <ItineraryMap days={days} />
          <div className="grid gap-4">
            {days.map((day) => (
              <ItineraryDay
                key={day.dayIndex}
                day={day}
                dayCount={days.length}
                onRemove={removePlace}
                onMove={movePlace}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
