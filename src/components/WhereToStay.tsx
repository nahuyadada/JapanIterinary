"use client";
import { bookingLinksForArea, type StayRecommendation } from "@/lib/lodging";

const DAY_COLORS = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

function fmt(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function WhereToStay({
  recommendations,
  adults,
}: {
  recommendations: StayRecommendation[];
  adults: number;
}) {
  const withAreas = recommendations.filter((r) => r.areas.length > 0);
  if (withAreas.length === 0) return null;

  return (
    <section className="grid gap-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Where to stay</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Suggested base areas that keep each leg&apos;s attractions close. Booking links open real,
          date-filtered results on the provider&apos;s site.
        </p>
      </div>

      {withAreas.map((rec) => {
        const { stay, areas } = rec;
        const firstDay = stay.dayIndexes[0] + 1;
        const lastDay = stay.dayIndexes[stay.dayIndexes.length - 1] + 1;
        const dayLabel = firstDay === lastDay ? `Day ${firstDay}` : `Days ${firstDay}–${lastDay}`;
        const color = DAY_COLORS[stay.dayIndexes[0] % DAY_COLORS.length];

        return (
          <article
            key={`${stay.region}-${stay.dayIndexes[0]}`}
            className="border border-gray-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden"
          >
            <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
              <span className="w-2.5 h-10 rounded-full" style={{ background: color }} aria-hidden />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {dayLabel} · {stay.region}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stay.nights} night{stay.nights === 1 ? "" : "s"} · {fmt(stay.checkIn)} → {fmt(stay.checkOut)}
                </p>
              </div>
            </header>

            <ul className="divide-y divide-gray-100 dark:divide-neutral-800">
              {areas.map((area, i) => {
                const links = bookingLinksForArea(area, stay.checkIn, stay.checkOut, adults);
                return (
                  <li key={area.id} className="px-4 py-3 grid gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {area.name}
                          {i === 0 && (
                            <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                              Top pick
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{area.blurb}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{area.goodFor}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {links.map((link) => (
                        <a
                          key={link.provider}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          {link.label} ↗
                        </a>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
