"use client";
import { formatClock, type ScheduleEntry } from "@/lib/schedule";
import { durationRangeFor, formatRange } from "@/lib/duration";

const MODE_LABELS: Record<string, string> = { transit: "transit", walking: "on foot", driving: "by car" };

export default function DaySchedule({ entries }: { entries: ScheduleEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50 p-4 grid gap-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Suggested day plan</p>
      <ol className="grid gap-2">
        {entries.map((e, i) => {
          if (e.kind === "wake") {
            return (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 tabular-nums font-medium text-gray-500 dark:text-gray-400 w-12">
                  {formatClock(e.time)}
                </span>
                <span className="text-gray-600 dark:text-gray-300">🌅 {e.label}</span>
              </li>
            );
          }
          if (e.kind === "travel") {
            return (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 tabular-nums text-gray-400 dark:text-gray-500 w-12">
                  {formatClock(e.time)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  🚆 Travel to <span className="text-gray-700 dark:text-gray-200">{e.to}</span> · ~{e.minutes} min{" "}
                  {MODE_LABELS[e.mode] ?? e.mode}{" "}
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 dark:text-red-400 hover:underline"
                  >
                    Directions ↗
                  </a>
                </span>
              </li>
            );
          }
          return (
            <li key={i} className="flex gap-3 text-sm">
              <span className="shrink-0 tabular-nums font-medium text-gray-700 dark:text-gray-200 w-12">
                {formatClock(e.time)}
              </span>
              <span className="text-gray-800 dark:text-gray-100">
                📍 <span className="font-medium">{e.place.name}</span>{" "}
                <span className="text-gray-500 dark:text-gray-400">
                  {formatClock(e.time)}–{formatClock(e.endTime)} · est {formatRange(durationRangeFor(e.place))}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        Times are estimates including approximate travel — check live train schedules via the Directions links.
      </p>
    </div>
  );
}
