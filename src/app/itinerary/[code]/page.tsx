import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItinerary } from "@/lib/db";
import { buildGuideDays, guideOrigins } from "@/lib/guide";
import { recommendStays } from "@/lib/lodging";
import { isShareCode, normalizeShareCode } from "@/lib/shareCode";
import { parsePayload, payloadToItinerary } from "@/lib/tripPayload";
import TripGuide from "@/components/TripGuide";

// Read from the database on every request: a trip can be opened the moment it is saved,
// and one code's render must never be served for another.
export const dynamic = "force-dynamic";

/**
 * The code is the only thing protecting a shared trip, so keep these pages out of search
 * indexes — a crawled link would hand the itinerary to anyone.
 */
export const metadata: Metadata = {
  title: "Your trip to Japan",
  robots: { index: false, follow: false },
};

export default async function SharedItineraryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = normalizeShareCode(decodeURIComponent(raw));

  // Reject anything that isn't shaped like a code before touching the database, so a
  // scan of junk URLs costs nothing.
  if (!isShareCode(code)) notFound();

  const stored = await getItinerary(code);
  if (!stored) notFound();

  const payload = parsePayload(stored.payload);
  if (!payload) notFound();

  // Rebuilt with the same functions the wizard uses, so a shared link picks up later
  // routing improvements instead of showing a frozen schedule.
  const days = payloadToItinerary(payload);
  const origins = guideOrigins(recommendStays(days, 3), payload.stayOrigins);
  const guideDays = buildGuideDays(days, origins, payload.transportMode);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <TripGuide code={code} guideDays={guideDays} />
      <footer className="mt-10 pt-6 border-t border-gray-200 dark:border-neutral-800">
        <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 underline">
          Plan another trip
        </Link>
      </footer>
    </div>
  );
}
