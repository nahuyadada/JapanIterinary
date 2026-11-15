import type { ReactNode } from "react";

const ICONS = {
  bed: (
    <>
      <path d="M3 6v13M3 15h18M21 19v-6a3 3 0 0 0-3-3h-7v5" />
      <circle cx="7" cy="12" r="1.5" />
    </>
  ),
  train: (
    <>
      <rect x="5" y="3" width="14" height="13" rx="3" />
      <path d="M5 10h14M8 16l-2 4M16 16l2 4" />
      <circle cx="8.5" cy="13" r=".75" />
      <circle cx="15.5" cy="13" r=".75" />
    </>
  ),
  walk: (
    <>
      <circle cx="13" cy="4.5" r="1.5" />
      <path d="M12 8l-1 6M8 11.5L12 8l2.5 3H17M11 14l-2.5 7M11 14l3.5 3v4" />
    </>
  ),
  car: (
    <>
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2M3 12h18M9 17h6" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </>
  ),
  pencil: <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5zM15 5l4 4" />,
  map: <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
      <path d="M9 11h6M9 15h4" />
    </>
  ),
  ticket: (
    <path d="M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1zM14 6v2M14 11v2M14 16v2" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  warning: (
    <path d="M10.3 4.9L2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.9a2 2 0 0 0-3.4 0zM12 10v4M12 17.5v.01" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  "temple-shrine": <path d="M3 6c3 1 15 1 18 0M5 10h14M7 6.8V21M17 6.8V21M12 7v3" />,
  scenic: (
    <>
      <path d="M3 19l6-10 4 6 2-3 6 7H3z" />
      <circle cx="17" cy="6" r="1.5" />
    </>
  ),
  food: <path d="M3 11h18c0 4.4-4 8-9 8s-9-3.6-9-8zM9 21h6M14 3l-3 8M19 4l-5 7" />,
  nightlife: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  activity: (
    <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4l-5.3 3 1.2-6-4.5-4.1 6-.7L12 3z" />
  ),
  shopping: <path d="M5 8h14l-1 13H6L5 8zM9 8V6a3 3 0 0 1 6 0v2" />,
  nature: <path d="M12 3L6 11h3l-4 6h14l-4-6h3l-6-8zM12 17v4" />,
  landmark: <path d="M12 2v3M8 21l4-16 4 16M6 21h12M9.5 15h5M10.5 10h3" />,
  yen: <path d="M7 4l5 7 5-7M12 11v9M8 13h8M8 16.5h8" />,
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5L12 13l8.5-6.5" />
    </>
  ),
  etiquette: (
    <>
      <circle cx="6.5" cy="8" r="2" />
      <path d="M8.5 9.5L15 12v9M10.5 10.5l.5 4.5M4 21h16" />
    </>
  ),
  blossom: (
    <>
      <circle cx="12" cy="7.5" r="2.75" />
      <circle cx="16.28" cy="10.61" r="2.75" />
      <circle cx="14.65" cy="15.64" r="2.75" />
      <circle cx="9.35" cy="15.64" r="2.75" />
      <circle cx="7.72" cy="10.61" r="2.75" />
      <circle cx="12" cy="12" r="1.25" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export default function Icon({ name, className = "w-4 h-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {ICONS[name]}
    </svg>
  );
}
