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
import { directionsUrl, hasCoords } from "@/lib/navigation";
import type { Day } from "@/lib/itinerary";
import type { Place } from "@/data/places";
import type { StayLodging } from "@/lib/tripPayload";
import { bookingLinksForArea, recommendStays } from "@/lib/lodging";
import type { TripPayload } from "@/lib/tripPayload";
import TripChecklist from "@/components/TripChecklist";
import TripSimulation from "@/components/TripSimulation";
import { thumbUrl } from "@/lib/image";
import Icon, { type IconName } from "@/components/Icon";
import { CATEGORY_ICON } from "@/components/PlaceCard";

/** A place's photo, falling back to a plain tile when there is no image or it fails to load. */
function PlaceThumb({ place, className }: { place: Place; className: string }) {
  const [error, setError] = useState(false);
  if (!place.imageUrl || error) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100 dark:bg-neutral-800 text-gray-400`}
        aria-hidden
      >
        <Icon name={CATEGORY_ICON[place.category] ?? "pin"} className="w-5 h-5" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={thumbUrl(place.imageUrl, 500)}
      loading="lazy"
      alt={place.name}
      className={`${className} object-cover`}
      onError={() => setError(true)}
    />
  );
}

/**
 * Where the traveler sleeps that night, as its own row.
 *
 * Deliberately not one of the day's stops: adding it to `legs` would inflate the "X of Y
 * stops done" counter, shift every stop's number, and put a leg distance between the last
 * attraction and the hotel that the traveler never asked to walk.
 */
function OvernightRow({ lodging }: { lodging: StayLodging }) {
  const point =
    lodging.lat !== undefined && lodging.lng !== undefined
      ? { name: lodging.name, lat: lodging.lat, lng: lodging.lng }
      : null;

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800/50 px-3 py-2">
      <Icon name="bed" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <span className="min-w-0 flex-1 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Overnight · </span>
        <span className="font-medium text-gray-900 dark:text-gray-100 break-words">
          {lodging.name}
        </span>
      </span>
      {point && (
        <a
          href={directionsUrl(null, point)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
        >
          Directions ↗
        </a>
      )}
    </div>
  );
}

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
const headerButton =
  "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors";
const quietButton =
  "inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 text-sm " +
  "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 " +
  "transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

type OverviewItem =
  | { kind: "day"; day: GuideDay }
  | { kind: "free"; first: GuideDay; last: GuideDay };

/** Collapses runs of consecutive empty days (no stops, no overnight row) into one item. */
function overviewItems(days: GuideDay[]): OverviewItem[] {
  const items: OverviewItem[] = [];
  for (const day of days) {
    const empty = day.legs.length === 0 && !day.lodging;
    const prev = items[items.length - 1];
    if (empty && prev?.kind === "free" && prev.last.dayIndex === day.dayIndex - 1) {
      prev.last = day;
    } else if (empty) {
      items.push({ kind: "free", first: day, last: day });
    } else {
      items.push({ kind: "day", day });
    }
  }
  return items;
}

const TABS: { key: "guide" | "lodging" | "checklist"; label: string; icon: IconName }[] = [
  { key: "guide", label: "Daily guide", icon: "map" },
  { key: "lodging", label: "Where to stay", icon: "bed" },
  { key: "checklist", label: "Things to book", icon: "clipboard" },
];

export default function TripGuide({
  code,
  guideDays,
  days,
  payload,
}: {
  code: string;
  guideDays: GuideDay[];
  days?: Day[];
  payload?: TripPayload;
}) {

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

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"guide" | "lodging" | "checklist">("guide");
  const [simulating, setSimulating] = useState(false);

  const stayRecommendations = useMemo(
    () => (days ? recommendStays(days, 3, payload?.homeBase) : []),
    [days, payload]
  );

  const handleCustomize = () => {
    if (payload) {
      try {
        const data = {
          step: "itinerary",
          selectedIds: payload.selectedIds,
          start: payload.start,
          end: payload.end,
          startCity: payload.startCity ?? "",
          endCity: payload.endCity ?? "",
          manualMoves: payload.manualMoves,
          dayAllocations: payload.dayAllocations,
          fixedDates: payload.fixedDates ?? {},
          adults: payload.adults,
          transportMode: payload.transportMode,
          stayOrigins: payload.stayOrigins,
          homeBase: payload.homeBase ?? "",
        };
        localStorage.setItem("japan-itinerary-v1", JSON.stringify(data));
      } catch {
        // ignore
      }
    }
    window.location.href = "/#plan";
  };

  const handleSharePlan = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${guideDays.length}-day trip to Japan`,
          text: `Check out this ${guideDays.length}-day Japan travel itinerary!`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard if share modal is cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  if (guideDays.length === 0 || !day) {
    return <p className="text-gray-600 dark:text-gray-300">This trip has no days planned.</p>;
  }

  const doneToday = legsDone(progress, day.dayIndex);
  const current = day.legs[doneToday] ?? null;

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 dark:border-neutral-800 pb-4">
        <div className="grid gap-1">
          {code && code !== "LINK" && (
            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Trip code {code}
            </p>
          )}
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {guideDays.length}-day trip to Japan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {fmtDate(guideDays[0].date)} → {fmtDate(guideDays[guideDays.length - 1].date)}
          </p>
          {hydrated && position.phase === "before" && (
            <p className="mt-1 justify-self-start inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300">
              <Icon name="calendar" className="w-3.5 h-3.5 text-gray-500" />
              {position.daysUntilStart === 1
                ? "Your trip starts tomorrow."
                : `Your trip starts in ${position.daysUntilStart} days.`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCustomize}
            className={`${headerButton} border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800`}
          >
            <Icon name="pencil" />
            Edit itinerary
          </button>
          <button
            type="button"
            onClick={handleSharePlan}
            className={`${headerButton} border-red-500 bg-red-500 text-white hover:bg-red-600`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Link copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 107.032-2.128 3 3 0 00-7.032 2.128zm0 8a3 3 0 107.032 2.128 3 3 0 00-7.032-2.128z" />
                </svg>
                <span>Share plan</span>
              </>
            )}
          </button>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Trip sections"
        className="flex overflow-x-auto overflow-y-hidden whitespace-nowrap border-b border-gray-200 dark:border-neutral-800 text-sm font-medium -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {TABS.filter(
          (t) =>
            t.key === "guide" ||
            (t.key === "lodging" && stayRecommendations.length > 0) ||
            (t.key === "checklist" && days)
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 min-h-11 px-4 border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-red-500 text-red-600 dark:text-red-400 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400"
            }`}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "lodging" && (
        <section className="grid gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Where to Stay</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Recommended lodging areas tailored to this itinerary route.
            </p>
          </div>
          {stayRecommendations.map((rec) => {
            const { stay, areas } = rec;
            const stayKey = `${stay.region}-${stay.dayIndexes[0]}`;
            const userHotel = payload?.stayOrigins?.[stayKey];
            const firstDay = stay.dayIndexes[0] + 1;
            const lastDay = stay.dayIndexes[stay.dayIndexes.length - 1] + 1;
            const dayLabel = firstDay === lastDay ? `Day ${firstDay}` : `Days ${firstDay}–${lastDay}`;

            return (
              <article
                key={stayKey}
                className="border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden p-4 grid gap-3"
              >
                <header>
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{stay.region}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dayLabel} · {stay.nights} night{stay.nights === 1 ? "" : "s"} · {fmtDate(stay.checkIn)} → {fmtDate(stay.checkOut)}
                  </p>
                </header>

                {userHotel && (
                  <div className="rounded-lg bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 p-3 text-sm grid gap-0.5">
                    <p className="flex items-center gap-1.5">
                      <Icon name="bed" className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">Booked hotel: </span>
                      <span className="text-gray-900 dark:text-gray-100">{userHotel.name}</span>
                    </p>
                    {userHotel.address && (
                      <p className="text-xs text-gray-600 dark:text-gray-300">{userHotel.address}</p>
                    )}
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {userHotel.source === "geocoded" && "Matched on the map"}
                      {userHotel.source === "pinned" && "Pin placed by hand"}
                      {!userHotel.source && "Name only. Looked up when you open directions."}
                    </p>
                  </div>
                )}

                {areas.length > 0 && (
                  <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border-t border-gray-100 dark:border-neutral-800 pt-2">
                    {areas.map((area, i) => {
                      const links = bookingLinksForArea(area, stay.checkIn, stay.checkOut, payload?.adults ?? 2);
                      return (
                        <li key={area.id} className="py-3 grid gap-1.5">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {area.name}
                              {i === 0 && (
                                <span className="ml-2 align-middle text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700">
                                  Top pick
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{area.blurb}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{area.goodFor}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {links.map((link) => (
                              <a
                                key={link.provider}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                {link.label} ↗
                              </a>
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            );
          })}
        </section>
      )}

      {activeTab === "checklist" && days && (
        <TripChecklist days={days} />
      )}

      {activeTab === "guide" && simulating && days && (
        <TripSimulation
          days={days}
          guideDays={guideDays}
          mode={payload?.transportMode ?? "transit"}
          onExit={() => setSimulating(false)}
        />
      )}

      {activeTab === "guide" && !(simulating && days) && (
        <>
      {days && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-neutral-700 px-4 py-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            See how each day runs, hour by hour, before you go.
          </p>
          <button type="button" onClick={() => setSimulating(true)} className={quietButton}>
            Simulate trip
          </button>
        </div>
      )}

      {!progress.started ? (
        <>
          <ol className="grid gap-3">
            {overviewItems(guideDays).map((item) =>
              item.kind === "free" ? (
                <li
                  key={item.first.dayIndex}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-700 px-4 py-2.5 text-sm"
                >
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {item.first === item.last
                      ? `Day ${item.first.dayIndex + 1} · ${fmtDate(item.first.date)}`
                      : `Days ${item.first.dayIndex + 1}–${item.last.dayIndex + 1} · ${fmtDate(item.first.date)} – ${fmtDate(item.last.date)}`}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {item.first === item.last ? "Free day" : "Free days"}
                  </span>
                </li>
              ) : (
                <li
                  key={item.day.dayIndex}
                  className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Day {item.day.dayIndex + 1} · {fmtDate(item.day.date)}
                  </p>
                  {item.day.origin && item.day.legs.length > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Starting from {item.day.origin.name}
                    </p>
                  )}
                  {item.day.legs.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Free day.</p>
                  ) : (
                    <ul className="mt-2 grid gap-2">
                      {item.day.legs.map((leg) => (
                        <li key={leg.index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <PlaceThumb place={leg.place} className="w-10 h-10 rounded-lg shrink-0" />
                          <span className="min-w-0">
                            {leg.index + 1}. {leg.place.name}
                            <span className="text-gray-400 dark:text-gray-500"> · {leg.place.city}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.day.lodging && (
                    <div className="mt-2">
                      <OvernightRow lodging={item.day.lodging} />
                    </div>
                  )}
                </li>
              )
            )}
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
              <Icon name="chevronLeft" className="w-5 h-5" />
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
              <Icon name="chevronRight" className="w-5 h-5" />
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
            <section className="grid gap-3 rounded-xl border-2 border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20 p-4 overflow-hidden">
              <PlaceThumb
                place={current.place}
                className="-mx-4 -mt-4 w-[calc(100%+2rem)] h-40 sm:h-48"
              />
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
              {current.place.activities.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 grid gap-0.5">
                  {current.place.activities.map((activity) => (
                    <li key={activity}>{activity}</li>
                  ))}
                </ul>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-300">From {current.from.name}</p>
              <a
                href={directionsUrl(null, current.to)}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryButton}
              >
                Get directions ↗
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Google Maps opens with live directions starting from your current location.
              </p>

              <button
                type="button"
                onClick={advance}
                className="w-full px-5 py-3 rounded-full border-2 border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                {current.index + 1 === day.legs.length
                  ? "Done, finish the day"
                  : "Done, next stop"}
              </button>
            </section>
          ) : (
            <section className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/20 p-4 grid gap-1">
              <p className="font-semibold text-green-800 dark:text-green-300">
                {day.legs.length === 0
                  ? "Nothing planned for today. Enjoy the free day."
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
                      {isDone ? <Icon name="check" className="w-3.5 h-3.5" /> : leg.index + 1}
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

          {day.lodging && <OvernightRow lodging={day.lodging} />}

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
      </>
      )}
    </div>
  );
}

