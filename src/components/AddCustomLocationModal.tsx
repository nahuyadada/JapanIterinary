"use client";
import { useState } from "react";
import { REGIONS, CATEGORIES, CATEGORY_LABELS, type Category, type Place, type Region } from "@/data/places";

export default function AddCustomLocationModal({
  isOpen,
  defaultRegion = "Tokyo",
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  defaultRegion?: Region;
  onClose: () => void;
  onAdd: (place: Place) => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState<Region>(defaultRegion);
  const [category, setCategory] = useState<Category>("food");
  const [customTime, setCustomTime] = useState("");
  const [durationHours, setDurationHours] = useState(1);
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlace: Place = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      city: city.trim() || region,
      region,
      category,
      description: description.trim() || `Custom location in ${region}`,
      lat: NaN,
      lng: NaN,
      durationHours,
      customTime: customTime.trim() || undefined,
      isCustom: true,
      activities: [],
    };

    onAdd(newPlace);
    setName("");
    setCity("");
    setCustomTime("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-xl overflow-hidden">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📍</span> Add Custom Location
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-5 grid gap-4 text-sm">
          <label className="grid gap-1">
            <span className="font-medium text-gray-800 dark:text-gray-200">
              Location Name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ichiran Ramen Asakusa, My Airbnb"
              className="border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-red-400 focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="font-medium text-gray-800 dark:text-gray-200">Region</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-red-400 focus:outline-none text-xs"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="font-medium text-gray-800 dark:text-gray-200">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-red-400 focus:outline-none text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                Time <span className="text-xs font-normal text-gray-400">(optional)</span>
              </span>
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="e.g. 13:30 or 2:00 PM"
                className="border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-red-400 focus:outline-none"
              />
            </label>

            <label className="grid gap-1">
              <span className="font-medium text-gray-800 dark:text-gray-200">Est. Duration</span>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-red-400 focus:outline-none text-xs"
              >
                <option value={0.5}>30 mins</option>
                <option value={1}>1 hour</option>
                <option value={1.5}>1.5 hours</option>
                <option value={2}>2 hours</option>
                <option value={3}>3 hours</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="font-medium text-gray-800 dark:text-gray-200">
              Address / Notes <span className="text-xs font-normal text-gray-400">(optional)</span>
            </span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Asakusa 1-chome, Taito City, Tokyo"
              className="border border-gray-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-red-400 focus:outline-none"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-xs font-semibold shadow-sm"
            >
              Add to Itinerary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
