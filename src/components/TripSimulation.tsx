"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Day } from "@/lib/itinerary";
import type { GuideDay } from "@/lib/guide";
import { directionsUrl, hasCoords, type NavPoint, type TransportMode } from "@/lib/navigation";
import { formatClock } from "@/lib/schedule";
import { buildSimulation, dayHops, hopSegments, type HopSegment, type SimStep } from "@/lib/simulation";
import { STATION_MAX_POINTS, pointKey, type Station } from "@/lib/stations";
import { thumbUrl } from "@/lib/image";
import Icon, { type IconName } from "@/components/Icon";
import JourneyScene, { SCENE_MS } from "@/components/JourneyScene";

// Leaflet touches `window` on import, so the map can only load in the browser.
const TripSimulationMap = dynamic(() => import("@/components/TripSimulationMap"), { ssr: false });

const SEGMENT_ICON: Record<HopSegment["kind"], IconName> = { walk: "walk", train: "train", drive: "car" };

const MODE_ICON: Record<TransportMode, IconName> = { transit: "train", walking: "walk", driving: "car" };
const STEP_MS = 1800;

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function fmtMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function segmentText(s: HopSegment): string {
  const minutes = fmtMinutes(Math.round(s.end - s.start));
  if (s.kind === "walk") return `Walk ${minutes} to ${s.to.name}`;
  if (s.kind === "drive") return `Drive ${minutes} to ${s.to.name}`;
  return `Train from ${s.from.name} to ${s.to.name}, about ${minutes}`;
}

function stepTitle(step: SimStep): string {
  if (step.kind === "free") return "Free day";
  if (step.kind === "visit") return step.place?.name ?? "";
  if (step.kind === "leave") return step.baseName ? `Leave ${step.baseName}` : "Start the day";
  return step.baseName ? `Back at ${step.baseName}` : "Day ends";
}

const controlButton =
  "inline-flex items-center justify-center gap-1.5 min-h-10 px-3.5 rounded-lg border border-gray-300 dark:border-neutral-600 " +
  "text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 " +
  "transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

/**
 * A dry run of the trip: step through every departure, stop and return with estimated
 * clock times. It never touches the traveler's real progress.
 */
export default function TripSimulation({
  days,
  guideDays,
  mode,
  fixedTimes,
  onExit,
}: {
  days: Day[];
  guideDays: GuideDay[];
  mode: TransportMode;
  /** placeId -> "HH:MM" ticket entry times, so the rehearsal keeps those appointments. */
  fixedTimes?: Record<string, string>;
  onExit: () => void;
}) {
  const steps = useMemo(() => {
    const origins = new Map<number, NavPoint>();
    for (const d of guideDays) {
      if (d.origin && hasCoords(d.origin)) origins.set(d.dayIndex, d.origin);
    }
    return buildSimulation(days, origins, mode, fixedTimes);
  }, [days, guideDays, mode, fixedTimes]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const atEnd = index >= steps.length - 1;

  const [showMap, setShowMap] = useState(false);

  const dayIndex = steps[index]?.dayIndex ?? -1;
  const hops = useMemo(() => dayHops(steps, dayIndex), [steps, dayIndex]);

  /** Nearest station per point, by pointKey. Null means we asked and there is none nearby. */
  const [stations, setStations] = useState<Record<string, Station | null>>({});
  const requested = useRef(new Set<string>());

  useEffect(() => {
    if (mode !== "transit") return;
    const wanted = new Map<string, NavPoint>();
    for (const hop of hops) {
      for (const point of [hop.from, hop.to]) {
        const key = pointKey(point);
        if (!requested.current.has(key)) wanted.set(key, point);
      }
    }
    const points = [...wanted.entries()].slice(0, STATION_MAX_POINTS);
    if (points.length === 0) return;
    for (const [key] of points) requested.current.add(key);

    const pts = points.map(([, p]) => `${p.lat},${p.lng}`).join(";");
    fetch(`/api/stations?pts=${encodeURIComponent(pts)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { stations?: (Station | null)[] } | null) => {
        const found = body?.stations;
        if (!Array.isArray(found)) return;
        setStations((prev) => ({
          ...prev,
          ...Object.fromEntries(points.map(([key], i) => [key, found[i] ?? null])),
        }));
      })
      .catch(() => {
        // Without stations each journey simply stays one estimated piece.
      });
  }, [hops, mode]);

  const hopParts = useMemo(
    () =>
      hops.map((hop) =>
        hopSegments(hop, mode, stations[pointKey(hop.from)] ?? null, stations[pointKey(hop.to)] ?? null)
      ),
    [hops, mode, stations]
  );

  // A step with a journey waits for its animation to finish before moving on.
  useEffect(() => {
    if (!playing) return;
    const hasJourney = hops.some((hop) => hop.stepIndex === index);
    const timer = setTimeout(
      () => {
        if (index >= steps.length - 1) setPlaying(false);
        else setIndex(index + 1);
      },
      hasJourney ? SCENE_MS + 900 : STEP_MS
    );
    return () => clearTimeout(timer);
  }, [playing, index, hops, steps.length]);

  const step = steps[index];
  if (!step) return null;

  const activeHop = hops.findIndex((hop) => hop.stepIndex === index);
  const journey = activeHop >= 0 ? { hop: hops[activeHop], parts: hopParts[activeHop] } : null;

  const here: NavPoint | null =
    step.kind === "visit" && step.place
      ? { name: step.place.name, lat: step.place.lat, lng: step.place.lng }
      : step.base ?? null;

  const mapStops: { point: NavPoint; label: string }[] = [];
  for (const s of steps) {
    if (s.dayIndex !== step.dayIndex) continue;
    if (s.kind === "leave" && s.base) mapStops.push({ point: s.base, label: "H" });
    if (s.kind === "visit" && s.place) {
      const number = mapStops.filter((stop) => stop.label !== "H").length + 1;
      mapStops.push({
        point: { name: s.place.name, lat: s.place.lat, lng: s.place.lng },
        label: String(number),
      });
    }
  }

  const daySteps = steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.dayIndex === step.dayIndex);
  const dayEnd = daySteps[daySteps.length - 1].s;

  return (
    <section className="grid gap-4" aria-label="Trip simulation">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Simulation
          </p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Day {step.dayIndex + 1} of {days.length}
            <span className="font-normal text-gray-500 dark:text-gray-400"> · {fmtDate(step.date)}</span>
          </p>
        </div>
        <button type="button" onClick={onExit} className={controlButton}>
          <Icon name="x" />
          Exit simulation
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
        {step.kind === "visit" && step.place?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={step.place.id}
            src={thumbUrl(step.place.imageUrl, 500)}
            alt=""
            className="w-full h-40 sm:h-48 object-cover bg-gray-100 dark:bg-neutral-800"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        <div className="p-4 grid gap-1.5" aria-live="polite">
          {step.time !== undefined && (
            <p className="text-3xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {formatClock(step.time)}
            </p>
          )}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stepTitle(step)}</h2>
          {step.kind === "visit" && step.place && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {step.place.city}
              {step.endTime !== undefined && step.time !== undefined
                ? ` · about ${fmtMinutes(step.endTime - step.time)} here, until ${formatClock(step.endTime)}`
                : ""}
            </p>
          )}
          {step.travelMinutes !== undefined && !journey && (
            <p className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <Icon name={MODE_ICON[mode]} />
              About {fmtMinutes(step.travelMinutes)} to get here
            </p>
          )}
          {journey && (
            <div className="mt-1.5 grid gap-1.5 border-t border-gray-100 dark:border-neutral-800 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Getting here from {journey.hop.from.name}
              </p>
              <JourneyScene key={index} parts={journey.parts} />
              <ol className="grid gap-1">
                {journey.parts.map((part, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className="w-11 shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {formatClock(part.start)}
                    </span>
                    <Icon name={SEGMENT_ICON[part.kind]} className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                    <span className="min-w-0">{segmentText(part)}</span>
                  </li>
                ))}
              </ol>
              <a
                href={directionsUrl(journey.hop.from, journey.hop.to, mode)}
                target="_blank"
                rel="noopener noreferrer"
                className="justify-self-start text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
              >
                Real departure times in Google Maps ↗
              </a>
            </div>
          )}
          {step.kind === "free" && (
            <p className="text-sm text-gray-600 dark:text-gray-300">Nothing planned for this day.</p>
          )}
          {step.kind === "leave" && dayEnd.time !== undefined && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {daySteps.filter(({ s }) => s.kind === "visit").length} stop
              {daySteps.filter(({ s }) => s.kind === "visit").length === 1 ? "" : "s"} today, done around{" "}
              {formatClock(dayEnd.time)}.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowMap((v) => !v)}
        aria-expanded={showMap}
        className="justify-self-start inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <Icon name="map" />
        {showMap ? "Hide map" : "Show this day on a map"}
        <Icon name="chevronDown" className={`w-4 h-4 transition-transform ${showMap ? "rotate-180" : ""}`} />
      </button>
      {showMap && (
        <TripSimulationMap
          stops={mapStops}
          hops={hopParts}
          activeHop={activeHop >= 0 ? activeHop : null}
          here={here}
        />
      )}

      <div className="grid gap-2">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={index}
          onChange={(e) => {
            setPlaying(false);
            setIndex(Number(e.target.value));
          }}
          aria-label="Position in the trip"
          className="w-full accent-red-500"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setIndex((i) => Math.max(0, i - 1));
              }}
              disabled={index === 0}
              aria-label="Previous step"
              className={controlButton}
            >
              <Icon name="chevronLeft" />
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (atEnd) setIndex(0);
                setPlaying((p) => !p);
              }}
              className="inline-flex items-center justify-center min-h-10 min-w-24 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
            >
              {playing ? "Pause" : atEnd ? "Replay" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setIndex((i) => Math.min(steps.length - 1, i + 1));
              }}
              disabled={atEnd}
              aria-label="Next step"
              className={controlButton}
            >
              Next
              <Icon name="chevronRight" />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            Step {index + 1} of {steps.length}
          </p>
        </div>
      </div>

      <ol className="grid gap-1.5">
        {daySteps.map(({ s, i }) => {
          const isCurrent = i === index;
          const isPast = i < index;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setIndex(i);
                }}
                aria-current={isCurrent ? "step" : undefined}
                className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  isCurrent
                    ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                    : "border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
                }`}
              >
                <span className="w-11 shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {s.time !== undefined ? formatClock(s.time) : ""}
                </span>
                <span
                  className={`min-w-0 flex-1 ${
                    isPast ? "text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {stepTitle(s)}
                </span>
                {s.travelMinutes !== undefined && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Icon name={MODE_ICON[mode]} className="w-3.5 h-3.5" />
                    {fmtMinutes(s.travelMinutes)}
                  </span>
                )}
                {isPast && <Icon name="check" className="w-4 h-4 shrink-0 text-green-600" />}
              </button>
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        The animation is a picture of the plan, not to scale. Times are estimates for a day that
        starts at 9:00 unless a ticket sets it, and stations are the nearest ones found, not a
        real timetable. Running the simulation does not change your saved trip progress.
      </p>
    </section>
  );
}
