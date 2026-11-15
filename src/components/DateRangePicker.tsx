"use client";
import type { ReactNode } from "react";
import { tripDays } from "@/lib/itinerary";
import { toISODate } from "@/lib/lodging";

const inputClasses =
  "h-11 w-full border border-gray-300 dark:border-neutral-600 rounded-lg px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus:border-red-400";

export default function DateRangePicker({
  start,
  end,
  onStart,
  onEnd,
  children,
}: {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  children?: ReactNode;
}) {
  const bothSet = start !== "" && end !== "";
  const invalid = bothSet && end < start;
  const length = bothSet && !invalid ? tripDays(new Date(start), new Date(end)) : 0;

  return (
    <div className="grid gap-4 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Trip dates</h3>
        {length > 0 && (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300">
            {length} {length === 1 ? "day" : "days"}
          </span>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-300 gap-1">
          Start date
          <input
            type="date"
            value={start}
            min={toISODate(new Date())}
            onChange={(e) => {
              onStart(e.target.value);
              if (end && e.target.value > end) onEnd("");
            }}
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-300 gap-1">
          End date
          <input
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => onEnd(e.target.value)}
            className={inputClasses}
          />
        </label>
      </div>
      {invalid && <p className="text-sm text-red-600 dark:text-red-400">End date must be on or after the start date.</p>}
      {children}
    </div>
  );
}
