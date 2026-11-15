const NAV = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#destinations", label: "Destinations" },
  { href: "#plan", label: "Plan" },
  { href: "#culture", label: "Culture" },
  { href: "#tips", label: "Tips" },
];

export default function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-3">
          <svg viewBox="0 0 64 64" className="w-10 h-10 shrink-0" aria-hidden="true">
            <circle cx="32" cy="32" r="32" fill="#ef4444" />
            <g fill="#fff">
              <path d="M10.5 18.5Q32 24.5 53.5 18.5L52 25Q32 30 12 25Z" />
              <rect x="16" y="31.5" width="32" height="4.5" rx="1" />
              <rect x="30" y="27" width="4" height="5" />
              <path d="M20.5 27h5.2l.8 24h-6.8z" />
              <path d="M38.3 27h5.2l.8 24h-6.8z" />
            </g>
          </svg>
          <span className="text-xl font-medium text-gray-900">Trip to Japan</span>
        </a>
        <nav className="hidden md:flex items-center gap-6">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-gray-700 hover:text-red-500 transition-colors duration-200"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#plan"
          className="md:hidden text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full transition-colors"
        >
          Plan
        </a>
      </div>
    </header>
  );
}
