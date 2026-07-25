import type { BookingStatus } from "@/lib/reservations";
import { STATUS_DISPLAY } from "@/lib/reservations";

const STATUS_CLASSES: Record<BookingStatus, string> = {
  none: "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300",
  recommended:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  required:
    "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
};

/**
 * The traffic-light booking-status pill. The emoji is decorative — the label carries
 * the meaning, so the dot is hidden from screen readers.
 */
export default function BookingBadge({
  status,
  className = "",
}: {
  status: BookingStatus;
  className?: string;
}) {
  const { dot, label } = STATUS_DISPLAY[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${STATUS_CLASSES[status]} ${className}`}
    >
      <span aria-hidden="true">{dot}</span>
      {label}
    </span>
  );
}
