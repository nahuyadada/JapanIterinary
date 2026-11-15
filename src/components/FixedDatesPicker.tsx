"use client";
import { useState } from "react";
import type { Place } from "@/data/places";
import Icon from "@/components/Icon";

const inputClasses =
  "h-11 w-full border border-gray-300 dark:border-neutral-600 rounded-lg px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus:border-red-400";

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Lock places to a calendar date — a dated USJ or Disney ticket — so the itinerary is
 * planned around them instead of placing them wherever the route happens to reach.
 */
export default function FixedDatesPicker({
  places,
  start,
  end,
  fixedDates,
  onChange,
}: {
  places: Place[];
  start: string;
  end: string;
  fixedDates: Record<string, string>;
  onChange: (placeId: string, date: string | null) => void;
}) {
  const [pickId, setPickId] = useState("");
  const [pickDate, setPickDate] = useState("");
  const [expanded, setExpanded] = useState(false);

  const pinned = places.filter((p) => fixedDates[p.id]).sort((a, b) => fixedDates[a.id].localeCompare(fixedDates[b.id]));
  const unpinned = places.filter((p) => !fixedDates[p.id]);
  const datesSet = start !== "" && end !== "" && end >= start;
  const outside = (iso: string) => datesSet && (iso < start || iso > end);

  function add() {
    if (!pickId || !pickDate) return;
    onChange(pickId, pickDate);
    setPickId("");
    setPickDate("");
  }

  const open = expanded || pinned.length > 0;

  return (
    <div className="grid gap-3 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 sm:p-5">
      <div className="grid gap-1">
        {pinned.length > 0 ? (
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Fixed dates
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300">
              Optional
            </span>
          </h3>
        ) : (
          <h3>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={open}
              className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700"
            >
              <Icon name="chevronDown" className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
              Fixed dates
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300">
                Optional
              </span>
            </button>
          </h3>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have tickets for a certain day (like USJ or Disney)? Lock the place to that date
          and the rest of the trip is planned around it.
        </p>
      </div>

      {open && pinned.length > 0 && (
        <ul className="grid gap-2">
          {pinned.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-gray-900 dark:text-gray-100 min-w-[10rem]">
                <Icon name="lock" className="w-3.5 h-3.5 text-gray-500" />
                {p.name}
              </span>
              <input
                type="date"
                value={fixedDates[p.id]}
                min={start || undefined}
                max={end || undefined}
                onChange={(e) => onChange(p.id, e.target.value || null)}
                aria-label={`Date for ${p.name}`}
                className={`${inputClasses} sm:w-auto`}
              />
              <span className="text-gray-500 dark:text-gray-400">{formatDate(fixedDates[p.id])}</span>
              <button
                type="button"
                onClick={() => onChange(p.id, null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Remove
              </button>
              {outside(fixedDates[p.id]) && (
                <span className="w-full text-red-600 dark:text-red-400">
                  This date is outside your trip, so it&apos;s being ignored.
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {open && unpinned.length > 0 && (
        <div className="grid sm:grid-cols-[1fr_1fr_auto] items-end gap-3">
          <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-300 gap-1">
            Place
            <select value={pickId} onChange={(e) => setPickId(e.target.value)} className={inputClasses}>
              <option value="">Choose a place…</option>
              {unpinned.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-300 gap-1">
            Date
            <input
              type="date"
              value={pickDate}
              min={start || undefined}
              max={end || undefined}
              onChange={(e) => setPickDate(e.target.value)}
              className={inputClasses}
            />
          </label>
          <button
            type="button"
            disabled={!pickId || !pickDate}
            onClick={add}
            className="h-11 px-5 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Lock date
          </button>
        </div>
      )}
    </div>
  );
}
