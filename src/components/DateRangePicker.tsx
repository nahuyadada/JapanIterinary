"use client";
import { tripDays } from "@/lib/itinerary";

export default function DateRangePicker({
  start,
  end,
  onStart,
  onEnd,
}: {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
}) {
  const bothSet = start !== "" && end !== "";
  const invalid = bothSet && end < start;
  const length = bothSet && !invalid ? tripDays(new Date(start), new Date(end)) : 0;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col text-sm text-gray-600 dark:text-gray-400 gap-1">
          Start date
          <input
            type="date"
            value={start}
            onChange={(e) => onStart(e.target.value)}
            className="border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-600 dark:text-gray-400 gap-1">
          End date
          <input
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => onEnd(e.target.value)}
            className="border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-900"
          />
        </label>
      </div>
      {invalid && <p className="text-sm text-red-600 dark:text-red-400">End date must be on or after the start date.</p>}
      {length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Trip length: <span className="font-semibold">{length}</span> {length === 1 ? "day" : "days"}
        </p>
      )}
    </div>
  );
}
