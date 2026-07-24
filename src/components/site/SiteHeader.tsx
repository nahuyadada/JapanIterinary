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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-red-100">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-3">
          <span className="w-10 h-10 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600" />
          </span>
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
