import Link from "next/link";

/**
 * Shown for a code that doesn't resolve. Deliberately vague about why: whether a code was
 * mistyped or never existed isn't something a stranger needs to be able to tell.
 */
export default function ItineraryNotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 grid gap-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        We couldn&apos;t find that trip
      </h1>
      <p className="text-gray-600 dark:text-gray-300">
        The link may have been mistyped, or the trip may no longer be shared. Check the code
        with whoever sent it to you.
      </p>
      <Link
        href="/"
        className="justify-self-center px-6 py-3 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
      >
        Plan a trip
      </Link>
    </div>
  );
}
