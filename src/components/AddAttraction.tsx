"use client";
import { useState } from "react";
import { CATEGORY_LABELS, type Place, type Region } from "@/data/places";
import { durationRangeFor, formatRange } from "@/lib/duration";
import { placeHours } from "@/data/placeMeta";
import type { StaySuggestion } from "@/lib/suggestions";
import AddCustomLocationModal from "@/components/AddCustomLocationModal";

export default function AddAttraction({
  group,
  region = "Tokyo",
  onAdd,
  onAddCustom,
}: {
  group?: StaySuggestion;
  region?: Region;
  onAdd: (placeId: string) => void;
  onAddCustom?: (place: Place) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  const hasSuggestions = group && group.suggestions.length > 0;

  return (
    <div className="rounded-xl border border-dashed border-gray-300 dark:border-neutral-700 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50/50 dark:bg-neutral-900/50">
        {hasSuggestions ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex-1 flex items-center justify-between gap-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 transition-colors"
          >
            <span>
              ＋ Add suggested attraction
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                {group.suggestions.length} nearby · ≈{Math.round(group.freeHours)}h free
              </span>
            </span>
            <span className="text-gray-400">{open ? "▲" : "▼"}</span>
          </button>
        ) : (
          <span className="text-xs text-gray-500">Need a specific spot?</span>
        )}

        {onAddCustom && (
          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors font-medium flex items-center gap-1"
          >
            <span>📍</span> Add custom spot with time
          </button>
        )}
      </div>

      {open && hasSuggestions && (
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

      {onAddCustom && (
        <AddCustomLocationModal
          isOpen={showCustomModal}
          defaultRegion={region}
          onClose={() => setShowCustomModal(false)}
          onAdd={onAddCustom}
        />
      )}
    </div>
  );
}

