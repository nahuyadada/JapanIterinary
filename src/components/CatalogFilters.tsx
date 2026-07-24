"use client";
import { REGIONS, CATEGORIES, CATEGORY_LABELS } from "@/data/places";
import type { Region, Category } from "@/data/places";

export default function CatalogFilters({
  region,
  category,
  onRegion,
  onCategory,
}: {
  region: Region | "all";
  category: Category | "all";
  onRegion: (r: Region | "all") => void;
  onCategory: (c: Category | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col text-xs text-gray-500 dark:text-gray-400 gap-1">
        Region
        <select
          value={region}
          onChange={(e) => onRegion(e.target.value as Region | "all")}
          className="border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-900"
        >
          <option value="all">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-gray-500 dark:text-gray-400 gap-1">
        Category
        <select
          value={category}
          onChange={(e) => onCategory(e.target.value as Category | "all")}
          className="border border-gray-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-900"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
