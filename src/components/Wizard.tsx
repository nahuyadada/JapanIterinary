"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { PLACES, REGIONS, CATEGORY_LABELS } from "@/data/places";
import type { Region, Category } from "@/data/places";
import { buildItinerary, tripDays, type Day } from "@/lib/itinerary";
import { recommendStays } from "@/lib/lodging";
import { suggestForItinerary } from "@/lib/suggestions";
import { stayKey } from "@/lib/guide";
import { buildPayload } from "@/lib/tripPayload";
import type { TransportMode } from "@/lib/navigation";
import PlaceCard from "@/components/PlaceCard";
import CatalogFilters from "@/components/CatalogFilters";
import DateRangePicker from "@/components/DateRangePicker";
import ItineraryDay from "@/components/ItineraryDay";
import CityPlan from "@/components/CityPlan";
import TripChecklist from "@/components/TripChecklist";

const ItineraryMap = dynamic(() => import("@/components/ItineraryMap"), { ssr: false });

type Step = "select" | "dates" | "itinerary";
const STORAGE_KEY = "japan-itinerary-v1";

type PersistedState = {
  step: Step;
  selectedIds: string[];
  start: string;
  end: string;
  manualMoves: Record<string, number>;
  startCity: string;
  endCity: string;
  dayAllocations: Record<string, number>;
  adults: number;
  transportMode: TransportMode;
  /** Typed hotel per stay, keyed by stayKey(region, firstDayIndex). */
  stayOrigins: Record<string, string>;
};

const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "Choose places" },
  { key: "dates", label: "Pick dates" },
  { key: "itinerary", label: "Your itinerary" },
];

const selectClasses =
  "border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400";

/** What a successful share returns, or what went wrong. */
type ShareState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "shared"; url: string; code: string }
  | { status: "failed"; message: string };

export default function Wizard() {
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startCity, setStartCity] = useState("");
  const [endCity, setEndCity] = useState("");
  const [manualMoves, setManualMoves] = useState<Record<string, number>>({});
  const [dayAllocations, setDayAllocations] = useState<Record<string, number>>({});
  const [adults, setAdults] = useState(2);
  const [transportMode, setTransportMode] = useState<TransportMode>("transit");
  const [stayOrigins, setStayOrigins] = useState<Record<string, string>>({});
  const [share, setShare] = useState<ShareState>({ status: "idle" });
  const [regionFilter, setRegionFilter] = useState<Region | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
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
        if (typeof s.startCity === "string") setStartCity(s.startCity);
        if (typeof s.endCity === "string") setEndCity(s.endCity);
        if (s.manualMoves && typeof s.manualMoves === "object") setManualMoves(s.manualMoves);
        if (s.dayAllocations && typeof s.dayAllocations === "object") setDayAllocations(s.dayAllocations);
        if (typeof s.adults === "number" && s.adults >= 1) setAdults(s.adults);
        if (s.transportMode === "transit" || s.transportMode === "walking" || s.transportMode === "driving") {
          setTransportMode(s.transportMode);
        }
        if (s.stayOrigins && typeof s.stayOrigins === "object") setStayOrigins(s.stayOrigins);
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
    const payload: PersistedState = {
      step,
      selectedIds,
      start,
      end,
      manualMoves,
      startCity,
      endCity,
      dayAllocations,
      adults,
      transportMode,
      stayOrigins,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota/availability errors
    }
  }, [hydrated, step, selectedIds, start, end, manualMoves, startCity, endCity, dayAllocations, adults, transportMode, stayOrigins]);

  // A share link is a snapshot. As soon as the trip changes it no longer describes what
  // is on screen, so drop it rather than hand out a link to something stale.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setShare({ status: "idle" });
  }, [selectedIds, start, end, startCity, endCity, manualMoves, dayAllocations, adults, transportMode, stayOrigins]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const selectedPlaces = useMemo(
    () => PLACES.filter((p) => selectedIds.includes(p.id)),
    [selectedIds]
  );

  const datesValid = start !== "" && end !== "" && end >= start;

  const availableCities = useMemo(
    () => [...new Set(selectedPlaces.map((p) => p.city))].sort(),
    [selectedPlaces]
  );

  // Places big enough to warrant more than one day (e.g. Universal Studios Japan).
  const multiDayPlaces = useMemo(
    () => selectedPlaces.filter((p) => (p.maxDays ?? 1) > 1),
    [selectedPlaces]
  );

  const days: Day[] = useMemo(() => {
    if (!datesValid) return [];
    const base = buildItinerary(selectedPlaces, new Date(start), new Date(end), {
      startCity: startCity || undefined,
      endCity: endCity || undefined,
      dayAllocations,
    });
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
  }, [datesValid, selectedPlaces, start, end, startCity, endCity, manualMoves, dayAllocations]);

  const stayRecommendations = useMemo(() => recommendStays(days, 3), [days]);

  const suggestionByStay = useMemo(() => {
    const groups = suggestForItinerary(days, { limit: 5 });
    return new Map(groups.map((g) => [stayKey(g.region, g.dayIndexes[0]), g]));
  }, [days]);

  // Days grouped under their stay, plus any not covered by a stay (rendered plainly).
  const cityBlocks = useMemo(
    () =>
      stayRecommendations.map((rec) => ({
        rec,
        stayDays: days.filter((d) => rec.stay.dayIndexes.includes(d.dayIndex)),
      })),
    [stayRecommendations, days]
  );

  const leftoverDays = useMemo(() => {
    const covered = new Set(stayRecommendations.flatMap((r) => r.stay.dayIndexes));
    return days.filter((d) => !covered.has(d.dayIndex));
  }, [stayRecommendations, days]);

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
    setDayAllocations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function movePlace(id: string, toDayIndex: number) {
    setManualMoves((prev) => ({ ...prev, [id]: toDayIndex }));
  }

  function setDays(id: string, count: number) {
    setDayAllocations((prev) => ({ ...prev, [id]: count }));
  }

  function setStayOrigin(key: string, value: string) {
    setStayOrigins((prev) => ({ ...prev, [key]: value }));
  }

  async function shareTrip() {
    setShare({ status: "saving" });
    try {
      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildPayload({
            selectedIds,
            start,
            end,
            startCity: startCity || undefined,
            endCity: endCity || undefined,
            manualMoves,
            dayAllocations,
            adults,
            transportMode,
            stayOrigins,
          })
        ),
      });
      const body = (await response.json().catch(() => null)) as
        | { code?: string; error?: string }
        | null;

      if (!response.ok || !body?.code) {
        setShare({
          status: "failed",
          message: body?.error ?? "Could not save your trip. Please try again.",
        });
        return;
      }
      setShare({
        status: "shared",
        code: body.code,
        url: `${window.location.origin}/itinerary/${body.code}`,
      });
    } catch {
      setShare({ status: "failed", message: "No connection. Check your network and try again." });
    }
  }

  function startOver() {
    setSelectedIds([]);
    setStart("");
    setEnd("");
    setStartCity("");
    setEndCity("");
    setManualMoves({});
    setDayAllocations({});
    setAdults(2);
    setTransportMode("transit");
    setStayOrigins({});
    setShare({ status: "idle" });
    setRegionFilter("all");
    setCategoryFilter("all");
    setSearchQuery("");
    setStep("select");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visiblePlaces = PLACES.filter((p) => {
    if (regionFilter !== "all" && p.region !== regionFilter) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (normalizedQuery) {
      const haystack = [p.name, p.city, p.region, CATEGORY_LABELS[p.category], p.description, ...p.activities]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }
    return true;
  });
  const visibleByRegion = REGIONS.map((region) => ({
    region,
    places: visiblePlaces.filter((p) => p.region === region),
  })).filter((g) => g.places.length > 0);

  const activeIndex = STEPS.findIndex((x) => x.key === step);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-5 sm:p-8 grid gap-6">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const state = i === activeIndex ? "active" : i < activeIndex ? "done" : "todo";
          return (
            <li
              key={s.key}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${
                state === "active"
                  ? "border-red-500 bg-red-50 text-red-700 font-semibold"
                  : state === "done"
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  state === "active"
                    ? "bg-red-500 text-white"
                    : state === "done"
                    ? "bg-green-500 text-white"
                    : "bg-white border border-gray-300 text-gray-500"
                }`}
              >
                {i + 1}
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>

      {step === "select" && (
        <div className="grid gap-4">
          <CatalogFilters
            region={regionFilter}
            category={categoryFilter}
            query={searchQuery}
            onRegion={setRegionFilter}
            onCategory={setCategoryFilter}
            onQuery={setSearchQuery}
          />
          {visibleByRegion.length === 0 && <p className="text-gray-500">No places match your search or filters.</p>}
          {visibleByRegion.map(({ region, places }) => (
            <section key={region} className="grid gap-3">
              <h3 className="text-lg font-semibold text-gray-800">{region}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {places.map((place, i) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    selected={selectedIds.includes(place.id)}
                    onToggle={togglePlace}
                    lastInRow={i % 3 === 2}
                  />
                ))}
              </div>
            </section>
          ))}
          <div className="sticky bottom-0 -mx-5 sm:-mx-8 px-5 sm:px-8 bg-white/90 backdrop-blur border-t border-gray-200 py-3 flex items-center justify-between rounded-b-2xl">
            <span className="text-sm text-gray-600">
              {selectedIds.length} place{selectedIds.length === 1 ? "" : "s"} selected
            </span>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => setStep("dates")}
              className="px-6 py-2.5 rounded-full bg-red-500 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
            >
              Next: pick dates
            </button>
          </div>
        </div>
      )}

      {step === "dates" && (
        <div className="grid gap-6">
          <p className="text-gray-600">
            When are you travelling? We&apos;ll spread your {selectedIds.length} selected place
            {selectedIds.length === 1 ? "" : "s"} across the trip.
          </p>
          <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd} />
          <label className="flex flex-col text-sm text-gray-600 gap-1 max-w-[10rem]">
            Travelers (adults)
            <input
              type="number"
              min={1}
              max={8}
              value={adults}
              onChange={(e) => setAdults(Math.min(8, Math.max(1, Number(e.target.value) || 1)))}
              className={selectClasses}
            />
          </label>
          {availableCities.length > 0 && (
            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col text-sm text-gray-600 gap-1">
                Starting city
                <select value={startCity} onChange={(e) => setStartCity(e.target.value)} className={selectClasses}>
                  <option value="">No preference</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm text-gray-600 gap-1">
                Ending city
                <select value={endCity} onChange={(e) => setEndCity(e.target.value)} className={selectClasses}>
                  <option value="">No preference</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {multiDayPlaces.length > 0 && (
            <div className="grid gap-3 rounded-xl bg-red-50 border border-red-100 p-4">
              <p className="text-sm font-medium text-gray-800">
                Some places are worth more than a day — choose how long to spend:
              </p>
              <div className="flex flex-wrap gap-4">
                {multiDayPlaces.map((p) => (
                  <label key={p.id} className="flex flex-col text-sm text-gray-600 gap-1">
                    {p.name}
                    <select
                      value={dayAllocations[p.id] ?? 1}
                      onChange={(e) => setDays(p.id, Number(e.target.value))}
                      className={selectClasses}
                    >
                      {Array.from({ length: p.maxDays ?? 1 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "day" : "days"}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!datesValid}
              onClick={() => setStep("itinerary")}
              className="px-6 py-2.5 rounded-full bg-red-500 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
            >
              Build itinerary
            </button>
          </div>
        </div>
      )}

      {step === "itinerary" && (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-gray-600">
              {tripDays(new Date(start), new Date(end))}-day trip with {selectedPlaces.length} places
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Preferred transport
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                  className={selectClasses}
                >
                  <option value="transit">Transit</option>
                  <option value="walking">Walking</option>
                  <option value="driving">Driving</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => setStep("dates")}
                className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={startOver}
                className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={shareTrip}
                disabled={share.status === "saving"}
                className="px-6 py-2.5 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {share.status === "saving" ? "Creating link…" : "Share trip"}
              </button>
            </div>
          </div>

          {share.status === "shared" && (
            <div className="grid gap-2 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                Your trip is ready to share — code {share.code}
              </p>
              <p className="text-sm text-green-700">
                Open this on your phone for a step-by-step guide while you travel.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/itinerary/${share.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-4 py-2 rounded-full bg-white border border-green-300 text-green-800 hover:bg-green-100 transition-colors break-all"
                >
                  Open trip guide ↗
                </a>
                <input
                  type="text"
                  readOnly
                  value={share.url}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Shareable link"
                  className="flex-1 min-w-[16rem] text-sm border border-green-300 rounded-lg px-3 py-2 bg-white text-gray-700"
                />
              </div>
              <p className="text-xs text-green-700">
                Anyone with this link can see the trip, so only send it to people you want to
                share it with.
              </p>
            </div>
          )}

          {share.status === "failed" && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {share.message}
            </p>
          )}

          <ItineraryMap days={days} stayRecommendations={stayRecommendations} />

          <TripChecklist days={days} />

          {cityBlocks.map(({ rec, stayDays }) => (
            <CityPlan
              key={stayKey(rec.stay.region, rec.stay.dayIndexes[0])}
              rec={rec}
              days={stayDays}
              dayCount={days.length}
              adults={adults}
              mode={transportMode}
              suggestion={suggestionByStay.get(stayKey(rec.stay.region, rec.stay.dayIndexes[0]))}
              stayOrigin={stayOrigins[stayKey(rec.stay.region, rec.stay.dayIndexes[0])] ?? ""}
              onStayOrigin={(value) =>
                setStayOrigin(stayKey(rec.stay.region, rec.stay.dayIndexes[0]), value)
              }
              onRemove={removePlace}
              onMove={movePlace}
              onAdd={togglePlace}
            />
          ))}

          {leftoverDays.length > 0 && (
            <div className="grid gap-4">
              {leftoverDays.map((day) => (
                <ItineraryDay
                  key={day.dayIndex}
                  day={day}
                  dayCount={days.length}
                  onRemove={removePlace}
                  onMove={movePlace}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
