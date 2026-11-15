"use client";
import { REGIONS, CATEGORIES, CATEGORY_LABELS } from "@/data/places";
import type { Region, Category } from "@/data/places";
import { CATEGORY_EMOJI } from "@/components/PlaceCard";

const chip = (active: boolean) =>
  `shrink-0 text-sm px-3 py-1.5 rounded-full border transition-colors ${
    active
      ? "border-red-500 bg-red-500 text-white"
      : "border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:text-red-600"
  }`;

export default function CatalogFilters({
  region,
  category,
  query,
  selectedOnly,
  selectedCount,
  resultCount,
  onRegion,
  onCategory,
  onQuery,
  onSelectedOnly,
}: {
  region: Region | "all";
  category: Category | "all";
  query: string;
  selectedOnly: boolean;
  selectedCount: number;
  resultCount: number;
  onRegion: (r: Region | "all") => void;
  onCategory: (c: Category | "all") => void;
  onQuery: (q: string) => void;
  onSelectedOnly: (v: boolean) => void;
}) {
  const filtered = region !== "all" || category !== "all" || query.trim() !== "" || selectedOnly;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[14rem]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search places, activities, food, shopping..."
            aria-label="Search places"
            className="w-full border border-gray-300 rounded-full pl-9 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
          />
        </div>
        <select
          value={region}
          onChange={(e) => onRegion(e.target.value as Region | "all")}
          aria-label="Region"
          className="border border-gray-300 rounded-full px-4 py-2.5 text-sm text-gray-900 bg-white max-w-full focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
        >
          <option value="all">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label="Category">
        <button type="button" aria-pressed={category === "all"} onClick={() => onCategory("all")} className={chip(category === "all")}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => onCategory(category === c ? "all" : c)}
            className={chip(category === c)}
          >
            {CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
        <span>
          {resultCount} place{resultCount === 1 ? "" : "s"}
        </span>
        {(selectedCount > 0 || selectedOnly) && (
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-gray-700">
            <input
              type="checkbox"
              checked={selectedOnly}
              onChange={(e) => onSelectedOnly(e.target.checked)}
              className="accent-red-500"
            />
            Show only my picks
          </label>
        )}
        {filtered && (
          <button
            type="button"
            onClick={() => {
              onRegion("all");
              onCategory("all");
              onQuery("");
              onSelectedOnly(false);
            }}
            className="text-red-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
