"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PLACES, REGIONS, CATEGORY_LABELS } from "@/data/places";
import type { Region, Category, Place } from "@/data/places";

import { buildItinerary, tripDays, type Day } from "@/lib/itinerary";
import { applyTicketTimes } from "@/lib/schedule";
import { recommendStays, toISODate } from "@/lib/lodging";
import { LODGING_AREAS } from "@/data/lodging";
import { suggestForItinerary } from "@/lib/suggestions";
import { dayEstimate } from "@/lib/duration";
import { stayKey } from "@/lib/guide";
import {
  buildPayload,
  encodePayload,
  parseStayLodgings,
  type StayLodging,
} from "@/lib/tripPayload";

import type { TransportMode } from "@/lib/navigation";
import PlaceCard from "@/components/PlaceCard";
import CatalogFilters from "@/components/CatalogFilters";
import DateRangePicker from "@/components/DateRangePicker";
import FixedDatesPicker from "@/components/FixedDatesPicker";
import ItineraryDay from "@/components/ItineraryDay";
import CityPlan from "@/components/CityPlan";
import TripChecklist from "@/components/TripChecklist";
import Icon from "@/components/Icon";

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
  /** placeId → local ISO date the place is locked to (e.g. a dated USJ ticket). */
  fixedDates: Record<string, string>;
  adults: number;
  transportMode: TransportMode;
  /** The traveler's accommodation per stay, keyed by stayKey(region, firstDayIndex). */
  stayOrigins: Record<string, StayLodging>;
  customPlaces?: Place[];
  /** Sleep in one region all trip and day-trip to the rest; "" means move hotels as you go. */
  homeBase?: Region | "";
  /** placeId -> local ISO dates the traveler found sold out, so they are not suggested again. */
  soldOut?: Record<string, string[]>;
  /** placeId -> "HH:MM" entry time on a ticket for a locked place. */
  fixedTimes?: Record<string, string>;
};

/** Regions we have lodging areas for, so a base always comes with somewhere to stay. */
const BASE_REGIONS = REGIONS.filter((r) => LODGING_AREAS.some((a) => a.region === r));

const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "Choose places" },
  { key: "dates", label: "Pick dates" },
  { key: "itinerary", label: "Your itinerary" },
];

/** Places shown per region before "Show all", so 150+ cards don't become one endless scroll. */
const REGION_PREVIEW = 6;

const selectClasses =
  "border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus:border-red-400";
const fieldClasses =
  "h-11 w-full border border-gray-300 rounded-lg px-3 text-sm text-gray-900 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus:border-red-400";
function fmtRangeDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
const fieldLabel = "flex flex-col text-sm font-medium text-gray-700 gap-1";
const cardClasses = "grid gap-4 rounded-xl border border-gray-200 p-4 sm:p-5";

/** What a successful share returns, or what went wrong. */
type ShareState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "shared"; url: string; code: string }
  | { status: "failed"; message: string };

export default function Wizard() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startCity, setStartCity] = useState("");
  const [endCity, setEndCity] = useState("");
  const [manualMoves, setManualMoves] = useState<Record<string, number>>({});
  const [dayAllocations, setDayAllocations] = useState<Record<string, number>>({});
  const [fixedDates, setFixedDates] = useState<Record<string, string>>({});
  const [adults, setAdults] = useState(2);
  const [transportMode, setTransportMode] = useState<TransportMode>("transit");
  const [stayOrigins, setStayOrigins] = useState<Record<string, StayLodging>>({});
  const [customPlaces, setCustomPlaces] = useState<Place[]>([]);
  const [homeBase, setHomeBase] = useState<Region | "">("");
  const [soldOut, setSoldOut] = useState<Record<string, string[]>>({});
  const [fixedTimes, setFixedTimes] = useState<Record<string, string>>({});
  const [share, setShare] = useState<ShareState>({ status: "idle" });
  const [copied, setCopied] = useState(false);
  const [regionFilter, setRegionFilter] = useState<Region | "all">("all");

  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<Region[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore persisted trip state after mount.
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
        if (s.fixedDates && typeof s.fixedDates === "object") {
          setFixedDates(
            Object.fromEntries(
              Object.entries(s.fixedDates).filter(([, v]) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v))
            )
          );
        }
        if (typeof s.adults === "number" && s.adults >= 1) setAdults(s.adults);
        if (s.transportMode === "transit" || s.transportMode === "walking" || s.transportMode === "driving") {
          setTransportMode(s.transportMode);
        }
        // State saved by the free-text version holds plain strings, so normalize rather
        // than trust the shape.
        if (s.stayOrigins && typeof s.stayOrigins === "object") {
          setStayOrigins(parseStayLodgings(s.stayOrigins));
        }
        if (Array.isArray(s.customPlaces)) setCustomPlaces(s.customPlaces);
        const savedBase = BASE_REGIONS.find((r) => r === s.homeBase);
        if (savedBase) setHomeBase(savedBase);
        if (s.fixedTimes && typeof s.fixedTimes === "object") {
          setFixedTimes(
            Object.fromEntries(
              Object.entries(s.fixedTimes).filter(([, v]) => typeof v === "string" && /^\d{2}:\d{2}$/.test(v))
            )
          );
        }
        if (s.soldOut && typeof s.soldOut === "object") {
          setSoldOut(
            Object.fromEntries(
              Object.entries(s.soldOut).filter(
                ([, v]) => Array.isArray(v) && v.every((d) => typeof d === "string")
              )
            )
          );
        }
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
      fixedDates,
      adults,
      transportMode,
      stayOrigins,
      customPlaces,
      homeBase,
      soldOut,
      fixedTimes,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore quota/availability errors
    }
  }, [hydrated, step, selectedIds, start, end, manualMoves, startCity, endCity, dayAllocations, fixedDates, adults, transportMode, stayOrigins, customPlaces, homeBase, soldOut, fixedTimes]);

  // A share link is a snapshot.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setShare({ status: "idle" });
  }, [selectedIds, start, end, startCity, endCity, manualMoves, dayAllocations, fixedDates, adults, transportMode, stayOrigins, customPlaces, homeBase, fixedTimes]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const allPlacesMap = useMemo(() => {
    const map = new Map<string, Place>(PLACES.map((p) => [p.id, p]));
    for (const cp of customPlaces) {
      map.set(cp.id, cp);
    }
    return map;
  }, [customPlaces]);

  const selectedPlaces = useMemo(
    () => selectedIds.map((id) => allPlacesMap.get(id)).filter((p): p is Place => p != null),
    [selectedIds, allPlacesMap]
  );

  const handleAddCustomPlace = (newPlace: Place) => {
    setCustomPlaces((prev) => [...prev, newPlace]);
    setSelectedIds((prev) => [...prev, newPlace.id]);
  };


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
      fixedDates,
    });
    if (Object.keys(manualMoves).length === 0) return applyTicketTimes(base, fixedTimes, transportMode);

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
    return applyTicketTimes(cleaned, fixedTimes, transportMode);
  }, [datesValid, selectedPlaces, start, end, startCity, endCity, manualMoves, dayAllocations, fixedDates, fixedTimes, transportMode]);

  const stayRecommendations = useMemo(
    () => recommendStays(days, 3, homeBase || undefined),
    [days, homeBase]
  );

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
    setFixedDate(id, null);
    setTicketTime(id, null);
  }

  function movePlace(id: string, toDayIndex: number) {
    // Moving a locked place changes its date, so the rest of the trip re-plans around it.
    if (fixedDates[id] && days[toDayIndex]) {
      setFixedDate(id, toISODate(days[toDayIndex].date));
      return;
    }
    setManualMoves((prev) => ({ ...prev, [id]: toDayIndex }));
  }

  /** Lock a place to a date, or unlock it. A locked place drops any manual day move. */
  function setFixedDate(id: string, date: string | null) {
    setFixedDates((prev) => {
      if (!date) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: date };
    });
    if (date) {
      setManualMoves((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function markSoldOut(id: string, date: string, isSoldOut: boolean) {
    setSoldOut((prev) => {
      const dates = (prev[id] ?? []).filter((d) => d !== date);
      return { ...prev, [id]: isSoldOut ? [...dates, date] : dates };
    });
  }

  function setTicketTime(id: string, time: string | null) {
    setFixedTimes((prev) => {
      if (time) return { ...prev, [id]: time };
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  /**
   * Lock a place to a date, or unlock it. Unlocking keeps the place on the day it is on:
   * without the manual move it would jump back to wherever the planner first put it.
   */
  function lockPlace(id: string, date: string | null) {
    if (!date) {
      const current = days.find((d) => d.places.some((p) => p.id === id));
      if (current && fixedDates[id]) {
        setManualMoves((prev) => ({ ...prev, [id]: current.dayIndex }));
      }
      setTicketTime(id, null);
    }
    setFixedDate(id, date);
  }

  const ticketing = {
    days,
    soldOut,
    times: fixedTimes,
    onLock: lockPlace,
    onSoldOut: markSoldOut,
    onTime: setTicketTime,
  };

  function setDays(id: string, count: number) {
    setDayAllocations((prev) => ({ ...prev, [id]: count }));
  }

  /** Set or clear one stay's accommodation. Clearing removes the key rather than storing null. */
  function setStayLodging(key: string, lodging: StayLodging | null) {
    setStayOrigins((prev) => {
      if (!lodging) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: lodging };
    });
  }

  async function shareTrip() {
    setShare({ status: "saving" });
    const payload = buildPayload({
      selectedIds,
      start,
      end,
      startCity: startCity || undefined,
      endCity: endCity || undefined,
      manualMoves,
      dayAllocations,
      fixedDates,
      adults,
      transportMode,
      stayOrigins,
      customPlaces,
      homeBase: homeBase || undefined,
      fixedTimes,
    });


    try {
      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as
        | { code?: string; url?: string; error?: string }
        | null;

      if (response.ok && (body?.url || body?.code)) {
        const shareUrl = body.url
          ? `${window.location.origin}${body.url}`
          : `${window.location.origin}/itinerary/${body.code}`;
        setShare({
          status: "shared",
          code: body.code ?? "LINK",
          url: shareUrl,
        });
        return;
      }
    } catch {
      // Server / network error fallback
    }

    // Client-side fallback if server endpoint fails or is unreachable. The compact string
    // must be URL-encoded — see the note in POST /api/itinerary: without it the URL layer
    // undoes the escaping that keeps an accommodation name out of the format's delimiters.
    const encoded = encodeURIComponent(encodePayload(payload));
    setShare({
      status: "shared",
      code: "LINK",
      url: `${window.location.origin}/itinerary/view?p=${encoded}`,
    });
  }


  function startOver() {
    if (!window.confirm("Start over? This clears your places, dates and stays.")) return;
    setSelectedIds([]);
    setCustomPlaces([]);
    setSelectedOnly(false);
    setExpandedRegions([]);
    setStart("");
    setEnd("");
    setStartCity("");
    setEndCity("");
    setManualMoves({});
    setDayAllocations({});
    setFixedDates({});
    setAdults(2);
    setTransportMode("transit");
    setStayOrigins({});
    setHomeBase("");
    setSoldOut({});
    setFixedTimes({});
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
    if (selectedOnly && !selectedIds.includes(p.id)) return false;
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

  // With a search or filter on, every match is shown; the per-region preview only trims
  // the unfiltered catalog.
  const filtersActive =
    regionFilter !== "all" || categoryFilter !== "all" || normalizedQuery !== "" || selectedOnly;

  const activeIndex = STEPS.findIndex((x) => x.key === step);

  const canOpen: Record<Step, boolean> = {
    select: true,
    dates: selectedIds.length > 0,
    itinerary: selectedIds.length > 0 && datesValid,
  };

  const overbookedDays = days.filter((d) => dayEstimate(d).verdict === "packed").length;
  const emptyDays = days.filter((d) => d.places.length === 0).length;

  /**
   * Bring the wizard into view on every step change. Without this, advancing from
   * "Choose places" (long enough to scroll well past the wizard's top) to "Pick dates"
   * swaps the content but leaves the viewport wherever the user happened to be, so the new
   * step can render off-screen or behind stale content.
   */
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  return (
    <div
      ref={rootRef}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-8 grid gap-6"
    >
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const state = i === activeIndex ? "active" : i < activeIndex ? "done" : "todo";
          const reachable = canOpen[s.key] && state !== "active";
          return (
            <li key={s.key}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => setStep(s.key)}
                aria-current={state === "active" ? "step" : undefined}
                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  state === "active"
                    ? "border-red-500 bg-red-50 text-red-700 font-semibold"
                    : state === "done"
                    ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                    : reachable
                    ? "border-gray-300 text-gray-600 hover:border-red-300 hover:text-red-600 cursor-pointer"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
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
                  {state === "done" ? <Icon name="check" className="w-3.5 h-3.5" /> : i + 1}
                </span>
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>

      {step === "select" && (
        <div className="grid gap-5">
          <CatalogFilters
            region={regionFilter}
            category={categoryFilter}
            query={searchQuery}
            selectedOnly={selectedOnly}
            selectedCount={selectedIds.length}
            resultCount={visiblePlaces.length}
            onRegion={setRegionFilter}
            onCategory={setCategoryFilter}
            onQuery={setSearchQuery}
            onSelectedOnly={setSelectedOnly}
          />
          {visibleByRegion.length === 0 && (
            <p className="text-gray-500 py-8 text-center">No places match your search or filters.</p>
          )}
          {visibleByRegion.map(({ region, places }) => {
            const showAll = filtersActive || expandedRegions.includes(region) || places.length <= REGION_PREVIEW;
            const shown = showAll ? places : places.slice(0, REGION_PREVIEW);
            const picked = places.filter((p) => selectedIds.includes(p.id)).length;
            return (
              <section key={region} className="grid gap-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-lg font-semibold text-gray-800">{region}</h3>
                  <span className="text-sm text-gray-400">
                    {places.length} place{places.length === 1 ? "" : "s"}
                  </span>
                  {picked > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      {picked} picked
                    </span>
                  )}
                </div>
                <div className="place-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {shown.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      selected={selectedIds.includes(place.id)}
                      onToggle={togglePlace}
                    />
                  ))}
                </div>
                {!filtersActive && places.length > REGION_PREVIEW && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedRegions((prev) =>
                        prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
                      )
                    }
                    className="justify-self-start text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                  >
                    {showAll ? "Show fewer" : `Show all ${places.length} in ${region}`}
                  </button>
                )}
              </section>
            );
          })}
          <div className="sticky bottom-0 z-30 -mx-5 sm:-mx-8 px-5 sm:px-8 bg-white/95 backdrop-blur border-t border-gray-200 py-3 grid gap-3 rounded-b-xl">
            {trayOpen && selectedPlaces.length > 0 && (
              <ul className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {selectedPlaces.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => removePlace(p.id)}
                      aria-label={`Remove ${p.name}`}
                      className="text-xs pl-3 pr-2 py-1 rounded-full bg-red-50 border border-red-200 text-red-800 hover:bg-red-100 inline-flex items-center gap-1.5"
                    >
                      {p.name} <span aria-hidden>×</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between gap-3">
              {selectedIds.length === 0 ? (
                <span className="text-sm text-gray-500">Tap places to add them to your trip</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTrayOpen((v) => !v)}
                  aria-expanded={trayOpen}
                  className="text-sm text-gray-700 hover:text-red-600 inline-flex items-center gap-1.5"
                >
                  <span className="font-semibold">{selectedIds.length}</span> place
                  {selectedIds.length === 1 ? "" : "s"} selected
                  <Icon name={trayOpen ? "chevronDown" : "chevronUp"} className="w-4 h-4 text-gray-400" />
                </button>
              )}
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
        </div>
      )}

      {step === "dates" && (
        <div className="grid gap-5">
          <p className="text-gray-600">
            When are you travelling? We&apos;ll spread your {selectedIds.length} selected place
            {selectedIds.length === 1 ? "" : "s"} across the trip.
          </p>
          <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd}>
            {datesValid &&
              (overbookedDays > 0 ? (
                <p className="flex gap-2 text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3.5 py-2.5">
                  <Icon name="warning" className="w-4 h-4 mt-0.5" />
                  <span>
                    {overbookedDays} of {days.length} day{days.length === 1 ? "" : "s"} would be
                    overbooked with your {selectedPlaces.length} places. Add a few days or drop some
                    places for a calmer trip.
                  </span>
                </p>
              ) : (
                <p className="flex gap-2 text-sm rounded-lg border border-green-200 bg-green-50 text-green-800 px-3.5 py-2.5">
                  <Icon name="check" className="w-4 h-4 mt-0.5" />
                  <span>
                    Your {selectedPlaces.length} place{selectedPlaces.length === 1 ? "" : "s"} fit
                    comfortably
                    {emptyDays > 0
                      ? `, with ${emptyDays} free day${emptyDays === 1 ? "" : "s"} to spare.`
                      : "."}
                  </span>
                </p>
              ))}
          </DateRangePicker>

          <div className={cardClasses}>
            <h3 className="text-sm font-semibold text-gray-900">Travelers &amp; route</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <label className={fieldLabel}>
                Travelers (adults)
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={adults}
                  onChange={(e) => setAdults(Math.min(8, Math.max(1, Number(e.target.value) || 1)))}
                  className={fieldClasses}
                />
              </label>
              {availableCities.length > 0 && (
                <>
                  <label className={fieldLabel}>
                    Starting city
                    <select value={startCity} onChange={(e) => setStartCity(e.target.value)} className={fieldClasses}>
                      <option value="">No preference</option>
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={fieldLabel}>
                    Ending city
                    <select value={endCity} onChange={(e) => setEndCity(e.target.value)} className={fieldClasses}>
                      <option value="">No preference</option>
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>
            <label className={fieldLabel}>
              Where you&apos;ll sleep
              <select
                value={homeBase}
                onChange={(e) => setHomeBase(e.target.value as Region | "")}
                className={`${fieldClasses} sm:max-w-sm`}
              >
                <option value="">Move hotels as I travel</option>
                {BASE_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    One base in {r}
                  </option>
                ))}
              </select>
              <span className="text-xs font-normal text-gray-500">
                {homeBase
                  ? `You keep one hotel in ${homeBase} for the whole trip and commute to everything else. Each day's travel times start from there.`
                  : "We suggest a new area to stay each time the trip moves to another region."}
              </span>
            </label>
          </div>

          {multiDayPlaces.length > 0 && (
            <div className={cardClasses}>
              <div className="grid gap-1">
                <h3 className="text-sm font-semibold text-gray-900">Multi-day places</h3>
                <p className="text-sm text-gray-600">
                  Some places are worth more than a day. Choose how long to spend at each.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {multiDayPlaces.map((p) => (
                  <label key={p.id} className={fieldLabel}>
                    {p.name}
                    <select
                      value={dayAllocations[p.id] ?? 1}
                      onChange={(e) => setDays(p.id, Number(e.target.value))}
                      className={fieldClasses}
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

          <FixedDatesPicker
            places={selectedPlaces}
            start={start}
            end={end}
            fixedDates={fixedDates}
            onChange={lockPlace}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="px-4 py-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Back
            </button>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {!datesValid && (
                <p className="text-sm text-gray-500">Choose a start and end date to continue.</p>
              )}
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
        </div>
      )}

      {step === "itinerary" && (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div>
              <p className="font-semibold text-gray-900">
                {tripDays(new Date(start), new Date(end))}-day trip · {selectedPlaces.length} place
                {selectedPlaces.length === 1 ? "" : "s"}
              </p>
              <p className="text-sm text-gray-500">
                {fmtRangeDate(start)} → {fmtRangeDate(end)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Transport
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
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon name="calendar" />
                Edit dates
              </button>
              <button
                type="button"
                onClick={shareTrip}
                disabled={share.status === "saving"}
                className="px-6 py-2.5 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {share.status === "saving" ? "Creating link…" : "Share trip"}
              </button>
              <button
                type="button"
                onClick={startOver}
                className="px-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                Start over
              </button>
            </div>
          </div>

          {share.status === "shared" && (
            <div className="grid gap-2 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                Your trip is ready to share{share.code && share.code !== "LINK" ? ` (code ${share.code})` : "."}
              </p>
              <p className="text-sm text-green-700">
                Open this on your phone for a step-by-step guide while you travel.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={share.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-4 py-2 rounded-lg bg-white border border-green-300 text-green-800 hover:bg-green-100 transition-colors break-all"
                >
                  Open trip guide ↗
                </a>
                <input
                  type="text"
                  readOnly
                  value={share.url}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Shareable link"
                  className="flex-1 min-w-[14rem] text-sm border border-green-300 rounded-lg px-3 py-2 bg-white text-gray-700"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(share.url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      // fallback
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-green-300 bg-white text-green-800 hover:bg-green-100 transition-colors"
                  title="Copy share link"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy link</span>
                    </>
                  )}
                </button>
                {typeof navigator !== "undefined" && Boolean(navigator.share) && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.share({
                          title: "Trip to Japan Itinerary",
                          text: "Check out my Japan trip itinerary!",
                          url: share.url,
                        });
                      } catch {
                        // User dismissed share dialog
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 107.032-2.128 3 3 0 00-7.032 2.128zm0 8a3 3 0 107.032 2.128 3 3 0 00-7.032-2.128z" />
                    </svg>
                    <span>Share via app</span>
                  </button>
                )}
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

          {days.length > 1 && (
            <nav
              aria-label="Jump to day"
              className="sticky top-[73px] z-30 -mx-5 sm:-mx-8 px-5 sm:px-8 py-2 bg-white/95 backdrop-blur border-y border-gray-100 flex gap-2 overflow-x-auto"
            >
              {days.map((d) => (
                <button
                  key={d.dayIndex}
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(`day-${d.dayIndex + 1}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  title={d.places.length === 0 ? "Free day" : undefined}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    d.places.length === 0
                      ? "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                      : "border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600"
                  }`}
                >
                  <span className={d.places.length === 0 ? "font-medium" : "font-semibold"}>
                    Day {d.dayIndex + 1}
                  </span>{" "}
                  <span className="text-gray-400">
                    {d.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </button>
              ))}
            </nav>
          )}

          <ItineraryMap
            days={days}
            stayRecommendations={stayRecommendations}
            lodging={stayOrigins}
          />

          <TripChecklist days={days} />

          <p className="text-xs text-gray-500 -mb-2">
            Times and travel are estimates. Tap a hop or Directions for live routes.
          </p>

          {cityBlocks.map(({ rec, stayDays }) => (
            <CityPlan
              key={stayKey(rec.stay.region, rec.stay.dayIndexes[0])}
              rec={rec}
              days={stayDays}
              dayCount={days.length}
              adults={adults}
              mode={transportMode}
              suggestion={suggestionByStay.get(stayKey(rec.stay.region, rec.stay.dayIndexes[0]))}
              lodging={stayOrigins[stayKey(rec.stay.region, rec.stay.dayIndexes[0])] ?? null}
              onLodging={(lodging) =>
                setStayLodging(stayKey(rec.stay.region, rec.stay.dayIndexes[0]), lodging)
              }
              onRemove={removePlace}
              onMove={movePlace}
              onAdd={togglePlace}
              onAddCustom={handleAddCustomPlace}
              fixedDates={fixedDates}
              ticketing={ticketing}
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
                  fixedDates={fixedDates}
                  ticketing={ticketing}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
