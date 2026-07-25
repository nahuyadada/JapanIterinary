"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EMPTY_PROGRESS,
  activeDayIndex,
  completeLeg,
  guideStorageKey,
  legsDone,
  parseProgress,
  resetDay,
  serializeProgress,
  startTrip,
  tripPosition,
  tripProgress,
  undoLeg,
  type GuideDay,
  type GuideProgress,
} from "@/lib/guide";
import { hasCoords } from "@/lib/navigation";

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** Crow-flies distance, phrased as the rough figure it is. Null when we don't know. */
function fmtKm(km: number | null): string | null {
  if (km === null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(km < 10 ? 1 : 0)} km away`;
}

const primaryButton =
  "w-full px-5 py-3.5 rounded-full bg-red-500 text-white font-semibold text-center " +
  "hover:bg-red-600 active:bg-red-700 transition-colors";
const quietButton =
  "px-4 py-2 rounded-full border border-gray-300 dark:border-neutral-600 text-sm " +
  "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 " +
  "transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export default function TripGuide({ code, guideDays }: { code: string; guideDays: GuideDay[] }) {
  const [progress, setProgress] = useState<GuideProgress>(EMPTY_PROGRESS);
  const [hydrated, setHydrated] = useState(false);
  /** Now, read once on mount. Null until then, so server and client first render match. */
  const [now, setNow] = useState<Date | null>(null);
  /** The day the traveler is looking at; null means "follow the guide". */
  const [viewing, setViewing] = useState<number | null>(null);

  const storageKey = guideStorageKey(code);

  // Progress and the clock are both browser-only facts. Reading them in an effect keeps
  // the first client render identical to the server's, so hydration stays quiet.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      setProgress(parseProgress(localStorage.getItem(storageKey)));
    } catch {
      // Private browsing can throw on access; the traveler just starts fresh.
    }
    setNow(new Date());
    setHydrated(true);
  }, [storageKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist after every change, but never the empty state rendered before hydration —
  // that would wipe real progress on load.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, serializeProgress(progress));
    } catch {
      // Quota or availability errors are not worth interrupting a trip over.
    }
  }, [hydrated, storageKey, progress]);

  const position = useMemo(
    () => tripPosition(guideDays, now ?? guideDays[0]?.date ?? new Date(0)),
    [guideDays, now]
  );

  const guideDayIndex = useMemo(
    () => (now ? activeDayIndex(guideDays, progress, now) : 0),
    [guideDays, progress, now]
  );

  const dayIndex = viewing ?? guideDayIndex;
  const day = guideDays[dayIndex];
  const overall = useMemo(() => tripProgress(guideDays, progress), [guideDays, progress]);

  const advance = useCallback(() => {
    if (day) setProgress((prev) => completeLeg(prev, day));
  }, [day]);

  if (guideDays.length === 0 || !day) {
    return <p className="text-gray-600 dark:text-gray-300">This trip has no days planned.</p>;
  }

  const doneToday = legsDone(progress, day.dayIndex);
  const current = day.legs[doneToday] ?? null;

  return (
    <div className="grid gap-5">
      <header className="grid gap-1">
        <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Trip code {code}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {guideDays.length}-day trip to Japan
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {fmtDate(guideDays[0].date)} → {fmtDate(guideDays[guideDays.length - 1].date)}
        </p>
        {hydrated && position.phase === "before" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {position.daysUntilStart === 1
              ? "Your trip starts tomorrow."
              : `Your trip starts in ${position.daysUntilStart} days.`}
          </p>
        )}
      </header>

      {!progress.started ? (
        <>
          <ol className="grid gap-3">
            {guideDays.map((d) => (
              <li
                key={d.dayIndex}
                className="rounded-2xl border border-gray-200 dark:border-neutral-700 p-4"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Day {d.dayIndex + 1} · {fmtDate(d.date)}
                </p>
                {d.origin && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Starting from {d.origin.name}
                  </p>
                )}
                {d.legs.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Nothing planned — a free day.
                  </p>
                ) : (
                  <ul className="mt-2 grid gap-1">
                    {d.legs.map((leg) => (
                      <li key={leg.index} className="text-sm text-gray-700 dark:text-gray-300">
                        {leg.index + 1}. {leg.place.name}
                        <span className="text-gray-400 dark:text-gray-500">
                          {" "}
                          · {leg.place.city}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => setProgress(startTrip)} className={primaryButton}>
            Start trip
          </button>
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            Your progress is saved on this device only.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setViewing(Math.max(0, dayIndex - 1))}
              disabled={dayIndex === 0}
              className={quietButton}
              aria-label="Previous day"
            >
              ←
            </button>
            <div className="text-center">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Day {dayIndex + 1} of {guideDays.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(day.date)}</p>
            </div>
            <button
              type="button"
              onClick={() => setViewing(Math.min(guideDays.length - 1, dayIndex + 1))}
              disabled={dayIndex === guideDays.length - 1}
              className={quietButton}
              aria-label="Next day"
            >
              →
            </button>
          </div>

          {viewing !== null && viewing !== guideDayIndex && (
            <button
              type="button"
              onClick={() => setViewing(null)}
              className="text-sm text-red-600 dark:text-red-400 underline"
            >
              Back to where I am (day {guideDayIndex + 1})
            </button>
          )}

          {day.origin && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Today starts from {day.origin.name}
              {hasCoords(day.origin) ? "" : " (as you typed it)"}
            </p>
          )}

          {current ? (
            <section className="grid gap-3 rounded-2xl border-2 border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20 p-4">
              <p className="text-xs uppercase tracking-wide text-red-600 dark:text-red-400">
                Stop {current.index + 1} of {day.legs.length}
              </p>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {current.place.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {current.place.city}
                  {fmtKm(current.straightLineKm) ? ` · ${fmtKm(current.straightLineKm)}` : ""}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">From {current.from.name}</p>
              <a
                href={current.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryButton}
              >
                Get directions ↗
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Google Maps has the live route and travel time.
              </p>
              <button
                type="button"
                onClick={advance}
                className="w-full px-5 py-3 rounded-full border-2 border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                {current.index + 1 === day.legs.length
                  ? "Done — finish the day"
                  : "Done — next stop"}
              </button>
            </section>
          ) : (
            <section className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/20 p-4 grid gap-1">
              <p className="font-semibold text-green-800 dark:text-green-300">
                {day.legs.length === 0
                  ? "Nothing planned for today — enjoy the free day."
                  : "Day complete. Nice work."}
              </p>
              {dayIndex < guideDays.length - 1 && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  Day {dayIndex + 2} is next.
                </p>
              )}
              {dayIndex === guideDays.length - 1 && position.phase === "after" && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  That&apos;s the whole trip. Safe travels home.
                </p>
              )}
            </section>
          )}

          {day.legs.length > 0 && (
            <ol className="grid gap-2">
              {day.legs.map((leg) => {
                const isDone = leg.index < doneToday;
                const isCurrent = leg.index === doneToday;
                return (
                  <li
                    key={leg.index}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${
                      isCurrent
                        ? "border-red-300 dark:border-red-800"
                        : "border-gray-200 dark:border-neutral-700"
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isDone
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-red-500 text-white"
                          : "border border-gray-300 dark:border-neutral-600 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {isDone ? "✓" : leg.index + 1}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`font-medium ${
                          isDone
                            ? "text-gray-400 dark:text-gray-500 line-through"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {leg.place.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{leg.place.city}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {overall.done} of {overall.total} stop{overall.total === 1 ? "" : "s"} done
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProgress((prev) => undoLeg(prev, day.dayIndex))}
                disabled={doneToday === 0}
                className={quietButton}
              >
                Undo
              </button>
              <button
                type="button"
                onClick={() => setProgress((prev) => resetDay(prev, day.dayIndex))}
                disabled={doneToday === 0}
                className={quietButton}
              >
                Reset day
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
