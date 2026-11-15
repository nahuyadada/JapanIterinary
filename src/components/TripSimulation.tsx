"use client";
import { useEffect, useMemo, useState } from "react";
import type { Day } from "@/lib/itinerary";
import type { GuideDay } from "@/lib/guide";
import { hasCoords, type NavPoint, type TransportMode } from "@/lib/navigation";
import { formatClock } from "@/lib/schedule";
import { buildSimulation, type SimStep } from "@/lib/simulation";
import { thumbUrl } from "@/lib/image";
import Icon, { type IconName } from "@/components/Icon";

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
  onExit,
}: {
  days: Day[];
  guideDays: GuideDay[];
  mode: TransportMode;
  onExit: () => void;
}) {
  const steps = useMemo(() => {
    const origins = new Map<number, NavPoint>();
    for (const d of guideDays) {
      if (d.origin && hasCoords(d.origin)) origins.set(d.dayIndex, d.origin);
    }
    return buildSimulation(days, origins, mode);
  }, [days, guideDays, mode]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const atEnd = index >= steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setIndex((i) => {
        if (i >= steps.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [playing, steps.length]);

  const step = steps[index];
  if (!step) return null;

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
          {step.travelMinutes !== undefined && (
            <p className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <Icon name={MODE_ICON[mode]} />
              About {fmtMinutes(step.travelMinutes)} to get here
            </p>
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
        Times are estimates for a day that starts at 9:00. Running the simulation does not change
        your saved trip progress.
      </p>
    </section>
  );
}
