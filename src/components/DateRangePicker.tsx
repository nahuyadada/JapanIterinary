"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { tripDays } from "@/lib/itinerary";
import { toISODate } from "@/lib/lodging";
import Icon from "@/components/Icon";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(iso: string): string {
  return parseISO(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

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
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState<"start" | "end">("start");
  const [hover, setHover] = useState("");
  const [view, setView] = useState(() => monthStart(new Date()));
  const rootRef = useRef<HTMLDivElement>(null);

  const today = toISODate(new Date());
  const bothSet = start !== "" && end !== "";
  const length = bothSet && end >= start ? tripDays(new Date(start), new Date(end)) : 0;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openFor(field: "start" | "end") {
    const target = field === "end" && start ? "end" : "start";
    setPicking(target);
    setHover("");
    setView(monthStart(start ? parseISO(start) : new Date()));
    setOpen(true);
  }

  function pick(iso: string) {
    if (picking === "start" || !start || iso < start) {
      onStart(iso);
      if (end && iso > end) onEnd("");
      setPicking("end");
      return;
    }
    onEnd(iso);
    setOpen(false);
  }

  const rangeEnd = end || (picking === "end" && hover >= start ? hover : "");

  function renderMonth(month: Date, extraClass = "") {
    const year = month.getFullYear();
    const m = month.getMonth();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const cells: (string | null)[] = [
      ...Array.from({ length: month.getDay() }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(year, m, i + 1))),
    ];
    return (
      <div className={extraClass}>
        <p className="text-sm font-semibold text-gray-900 text-center mb-2">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <div className="grid grid-cols-7 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="text-xs text-gray-400 py-1">
              {w}
            </span>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <span key={`blank-${i}`} />;
            const disabled = iso < today;
            const isStart = iso === start;
            const isEnd = iso === rangeEnd && Boolean(start);
            const inRange = Boolean(start && rangeEnd) && iso > start && iso < rangeEnd;
            return (
              <span
                key={iso}
                className={`py-0.5 ${inRange ? "bg-red-50" : ""} ${
                  isStart && rangeEnd && rangeEnd !== start ? "bg-gradient-to-r from-transparent from-50% to-red-50 to-50%" : ""
                } ${isEnd && rangeEnd !== start ? "bg-gradient-to-l from-transparent from-50% to-red-50 to-50%" : ""}`}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(iso)}
                  onMouseEnter={() => setHover(iso)}
                  onFocus={() => setHover(iso)}
                  aria-label={formatDate(iso)}
                  aria-pressed={isStart || iso === end}
                  className={`w-9 h-9 rounded-full text-sm tabular-nums transition-colors ${
                    isStart || iso === end
                      ? "bg-red-500 text-white font-semibold"
                      : isEnd
                      ? "bg-red-200 text-red-900"
                      : disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : iso === today
                      ? "text-red-600 font-semibold hover:bg-red-100"
                      : "text-gray-800 hover:bg-red-100"
                  }`}
                >
                  {Number(iso.slice(8))}
                </button>
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  const field = (which: "start" | "end", label: string, value: string) => {
    const active = open && picking === which;
    return (
      <div className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-300 gap-1">
        {label}
        <button
          type="button"
          onClick={() => openFor(which)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`h-11 w-full flex items-center justify-between gap-2 border rounded-lg px-3 text-sm text-left bg-white dark:bg-neutral-900 transition-colors ${
            active ? "border-red-400 ring-2 ring-red-300" : "border-gray-300 dark:border-neutral-600 hover:border-gray-400"
          }`}
        >
          <span className={value ? "text-gray-900 dark:text-gray-100 font-normal" : "text-gray-400 font-normal"}>
            {value ? formatDate(value) : "Select date"}
          </span>
          <Icon name="calendar" className="w-4 h-4 text-gray-500 shrink-0" />
        </button>
      </div>
    );
  };

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
      <div ref={rootRef} className="relative">
        <div className="grid sm:grid-cols-2 gap-4">
          {field("start", "Start date", start)}
          {field("end", "End date", end)}
        </div>
        {open && (
          <div
            role="dialog"
            aria-label="Choose trip dates"
            className="absolute z-40 left-0 top-full mt-2 w-full sm:w-auto rounded-xl border border-gray-200 bg-white shadow-lg p-4 grid gap-3"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView((v) => addMonths(v, -1))}
                disabled={view <= monthStart(new Date())}
                aria-label="Previous month"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon name="chevronLeft" />
              </button>
              <p className="text-xs text-gray-500">
                {picking === "start" ? "Select your start date" : "Select your end date"}
              </p>
              <button
                type="button"
                onClick={() => setView((v) => addMonths(v, 1))}
                aria-label="Next month"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100"
              >
                <Icon name="chevronRight" />
              </button>
            </div>
            <div className="flex gap-6 justify-center" onMouseLeave={() => setHover("")}>
              {renderMonth(view)}
              {renderMonth(addMonths(view, 1), "hidden sm:block")}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  onStart("");
                  onEnd("");
                  setPicking("start");
                }}
                disabled={!start && !end}
                className="text-sm text-gray-500 hover:text-gray-900 hover:underline disabled:opacity-40 disabled:no-underline"
              >
                Clear dates
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
