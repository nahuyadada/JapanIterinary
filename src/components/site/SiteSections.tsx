import Image from "next/image";

/* ---------------------------------- Why Japan --------------------------------- */

const REASONS = [
  {
    emoji: "🏯",
    title: "Rich History",
    body: "Explore thousands of years of preserved culture, from ancient temples to traditional arts.",
  },
  {
    emoji: "🌸",
    title: "Natural Beauty",
    body: "From cherry blossoms to autumn leaves, experience Japan's stunning seasonal transformations.",
  },
  {
    emoji: "🍜",
    title: "Culinary Excellence",
    body: "Discover the art of Japanese cuisine, from street food to Michelin-starred restaurants.",
  },
];

export function WhyJapan() {
  return (
    <section id="about" className="py-20 bg-gradient-to-br from-pink-50 to-red-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900">Why Japan?</h2>
          <p className="text-lg text-gray-600">
            Japan offers an extraordinary journey through time, where ancient temples stand alongside
            futuristic skyscrapers, and traditional tea ceremonies coexist with cutting-edge
            technology.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {REASONS.map((r) => (
            <div key={r.title} className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl">{r.emoji}</span>
              </div>
              <h3 className="text-xl mb-2 text-gray-900">{r.title}</h3>
              <p className="text-gray-600">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Popular Destinations -------------------------- */

const DESTINATIONS = [
  {
    name: "Tokyo",
    tagline: "The vibrant capital city",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Kyoto",
    tagline: "Ancient capital of temples",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Osaka",
    tagline: "Japan's kitchen",
    image:
      "https://images.unsplash.com/photo-1590559899731-a382839e5549?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
];

export function PopularDestinations() {
  return (
    <section id="destinations" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900">Popular Destinations</h2>
          <p className="text-lg text-gray-600">
            Discover the most captivating cities and regions that showcase Japan&apos;s diverse beauty
            and culture.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {DESTINATIONS.map((d) => (
            <a key={d.name} href="#plan" className="group cursor-pointer block">
              <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Image
                  src={d.image}
                  alt={d.name}
                  width={800}
                  height={256}
                  unoptimized
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl mb-2">{d.name}</h3>
                  <p className="text-white/90">{d.tagline}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    Plan a trip
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Culture Section ----------------------------- */

const TRADITIONS = [
  {
    title: "Tea Ceremony",
    tagline: "The art of mindful preparation",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Cherry Blossom Viewing",
    tagline: "Celebrating the beauty of impermanence",
    image:
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
];

export function CultureSection() {
  return (
    <section id="culture" className="py-20 bg-gradient-to-br from-red-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900">Culture &amp; Traditions</h2>
          <p className="text-lg text-gray-600">
            Immerse yourself in the rich tapestry of Japanese culture, where every tradition tells a
            story of centuries-old wisdom.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {TRADITIONS.map((t) => (
            <div
              key={t.title}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={t.image}
                  alt={t.title}
                  width={800}
                  height={256}
                  unoptimized
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl mb-3 text-gray-900">{t.title}</h3>
                <p className="text-gray-600">{t.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Travel Tips -------------------------------- */

const TIPS = [
  {
    emoji: "🎫",
    title: "JR Pass",
    body: "Get a Japan Rail Pass for unlimited travel on JR trains, including most shinkansen (bullet trains).",
  },
  {
    emoji: "💴",
    title: "Cash Culture",
    body: "Japan is still largely cash-based. Always carry yen, as many places don't accept cards.",
  },
  {
    emoji: "🙇",
    title: "Etiquette",
    body: "Bow when greeting, remove shoes indoors, and don't eat while walking on the street.",
  },
  {
    emoji: "📱",
    title: "Pocket WiFi",
    body: "Rent a pocket WiFi device or get a SIM card to stay connected throughout your journey.",
  },
  {
    emoji: "🌸",
    title: "Seasonal Timing",
    body: "Spring (cherry blossoms) and autumn (fall colors) are the most popular but crowded seasons.",
  },
  {
    emoji: "🍜",
    title: "Food Adventures",
    body: "Don't miss trying ramen, sushi, tempura, and regional specialties. Look for places with queues!",
  },
];

export function TravelTips() {
  return (
    <section id="tips" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900">Travel Tips</h2>
          <p className="text-lg text-gray-600">
            Essential advice to make your Japanese adventure smooth and memorable.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TIPS.map((t) => (
            <div
              key={t.title}
              className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl hover:shadow-lg transition-all duration-300"
            >
              <div className="text-4xl mb-4">{t.emoji}</div>
              <h3 className="text-xl mb-3 text-gray-900">{t.title}</h3>
              <p className="text-gray-600">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Site Footer -------------------------------- */

export function SiteFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="text-xl mb-3">Trip to Japan</h3>
          <p className="text-white/70">
            Your gateway to discovering the wonders of Japan. Let us help you create unforgettable
            memories.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-white/90">Contact Info</h4>
          <ul className="grid gap-2 text-white/70 text-sm">
            <li>📧 info@triptojapan.com</li>
            <li>📞 +1 (555) 123-4567</li>
            <li>📍 123 Travel Street, Adventure City, AC 12345</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-white/90">Explore</h4>
          <ul className="grid gap-2 text-white/70 text-sm">
            <li>
              <a href="#destinations" className="hover:text-red-400 transition-colors">
                Destinations
              </a>
            </li>
            <li>
              <a href="#plan" className="hover:text-red-400 transition-colors">
                Plan your trip
              </a>
            </li>
            <li>
              <a href="#culture" className="hover:text-red-400 transition-colors">
                Culture &amp; Traditions
              </a>
            </li>
            <li>
              <a href="#tips" className="hover:text-red-400 transition-colors">
                Travel Tips
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-10 pt-6 border-t border-white/10 text-center text-white/50 text-sm">
        © 2025 Trip to Japan. All rights reserved. | Designed with ❤️ for Japan lovers
      </div>
    </footer>
  );
}
