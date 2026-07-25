"use client";
import { useState } from "react";
import { CATEGORY_LABELS } from "@/data/places";
import { durationRangeFor, formatRange } from "@/lib/duration";
import { placeHours } from "@/data/placeMeta";
import type { StaySuggestion } from "@/lib/suggestions";

export default function AddAttraction({
  group,
  onAdd,
}: {
  group: StaySuggestion | undefined;
  onAdd: (placeId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!group || group.suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-dashed border-gray-300 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800/60 rounded-xl transition-colors"
      >
        <span>
          ＋ Add an attraction
          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
            {group.suggestions.length} nearby · ≈{Math.round(group.freeHours)}h free
          </span>
        </span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border-t border-gray-100 dark:border-neutral-800">
          {group.suggestions.map((p) => (
            <li key={p.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {CATEGORY_LABELS[p.category]} · {formatRange(durationRangeFor(p))} · {placeHours(p.id)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{p.description}</p>
              </div>
              <button
                type="button"
                onClick={() => onAdd(p.id)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                + Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
