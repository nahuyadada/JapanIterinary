import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItinerary } from "@/lib/db";
import { buildGuideDays, dayBases } from "@/lib/guide";
import { recommendStays } from "@/lib/lodging";
import { isShareCode, normalizeShareCode } from "@/lib/shareCode";
import { decodePayload, parsePayload, payloadToItinerary, type TripPayload } from "@/lib/tripPayload";
import TripGuide from "@/components/TripGuide";

// Read from the database or decode from payload on every request
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
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ p?: string }>;
}) {
  const { code: raw } = await params;
  const sParams = searchParams ? await searchParams : {};
  const decodedRaw = decodeURIComponent(raw);

  let payload: TripPayload | null = null;
  let code = normalizeShareCode(decodedRaw);

  // 1. Encoded payload in query param: /itinerary/view?p=...
  if (sParams.p) {
    payload = decodePayload(sParams.p);
    code = "LINK";
  }

  // 2. Direct encoded payload in path: /itinerary/eyJ2...
  if (!payload && (decodedRaw === "view" || decodedRaw === "share" || decodedRaw.length > 20)) {
    payload = decodePayload(decodedRaw);
    code = "LINK";
  }

  // 3. Database share code: /itinerary/ABCDEFGH
  if (!payload && isShareCode(code)) {
    const stored = await getItinerary(code);
    if (stored) {
      payload = parsePayload(stored.payload);
    }
  }

  if (!payload) notFound();

  // Rebuilt with the same functions the wizard uses, so a shared link picks up later
  // routing improvements instead of showing a frozen schedule.
  const days = payloadToItinerary(payload);
  const bases = dayBases(recommendStays(days, 3), payload.stayOrigins);
  const guideDays = buildGuideDays(days, bases, payload.transportMode);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <TripGuide code={code} guideDays={guideDays} days={days} payload={payload} />
      <footer className="mt-10 pt-6 border-t border-gray-200 dark:border-neutral-800 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="underline hover:text-gray-700 dark:hover:text-gray-200">
          Plan another trip
        </Link>
        <Link href="/#plan" className="underline hover:text-gray-700 dark:hover:text-gray-200">
          Create custom itinerary ↗
        </Link>
      </footer>
    </div>
  );

}

