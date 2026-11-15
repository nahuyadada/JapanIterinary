import Image from "next/image";
import Icon, { type IconName } from "@/components/Icon";

/* ---------------------------------- Why Japan --------------------------------- */

const REASONS = [
  {
    title: "History",
    body: "Temples, shrines, castles and old merchant streets, many of them still in everyday use.",
  },
  {
    title: "Seasons",
    body: "Cherry blossoms in spring, red maples in autumn, and snow across the north in winter.",
  },
  {
    title: "Food",
    body: "Ramen, sushi and regional dishes, from station counters and street stalls to sit-down restaurants.",
  },
];

export function WhyJapan() {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900">Why Japan?</h2>
          <p className="text-lg text-gray-600">
            Old temples and dense modern cities sit close together, and the rail network makes it
            practical to see several regions in a single trip.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {REASONS.map((r) => (
            <div key={r.title} className="bg-white rounded-xl p-6 border border-gray-200">
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
            The three cities most first trips are built around.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {DESTINATIONS.map((d) => (
            <a key={d.name} href="#plan" className="group block">
              <div className="relative overflow-hidden rounded-xl border border-gray-200">
                <Image
                  src={d.image}
                  alt={d.name}
                  width={800}
                  height={256}
                  unoptimized
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl mb-2">{d.name}</h3>
                  <p className="text-white/90">{d.tagline}</p>
                  <span className="mt-3 inline-block text-sm underline-offset-4 group-hover:underline">
                    Plan a trip →
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
    tagline: "A set way of preparing and serving matcha, often offered to visitors in Kyoto.",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Cherry Blossom Viewing",
    tagline: "Hanami: picnics under the blossoms, around late March to early April in Tokyo and Kyoto.",
    image:
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
];

export function CultureSection() {
  return (
    <section id="culture" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900">Culture &amp; Traditions</h2>
          <p className="text-lg text-gray-600">
            Two traditions worth planning a day around.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {TRADITIONS.map((t) => (
            <div key={t.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={t.image}
                  alt={t.title}
                  width={800}
                  height={256}
                  unoptimized
                  className="w-full h-full object-cover"
                />
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

const TIPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "ticket",
    title: "JR Pass",
    body: "A Japan Rail Pass covers JR trains, including most shinkansen. Check whether it pays off for your route before buying.",
  },
  {
    icon: "yen",
    title: "Carry some cash",
    body: "Cards are widely accepted in cities, but small shops, shrines and rural places are often cash only.",
  },
  {
    icon: "etiquette",
    title: "Etiquette",
    body: "Bow when greeting, take your shoes off where asked, and avoid eating while walking.",
  },
  {
    icon: "phone",
    title: "Staying connected",
    body: "Rent a pocket WiFi or buy a SIM or eSIM so maps and directions work everywhere.",
  },
  {
    icon: "blossom",
    title: "When to go",
    body: "Spring (cherry blossoms) and autumn (fall colours) are the most popular seasons, and the most crowded.",
  },
  {
    icon: "food",
    title: "Food",
    body: "Try ramen, sushi, tempura and each region's specialities. A queue outside is usually a good sign.",
  },
];

export function TravelTips() {
  return (
    <section id="tips" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-2xl mb-12">
          <h2 className="text-4xl md:text-5xl mb-6 text-gray-900">Travel Tips</h2>
          <p className="text-lg text-gray-600">
            Practical things to sort out before you go.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TIPS.map((t) => (
            <div key={t.title} className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="flex items-center gap-2 text-xl mb-3 text-gray-900">
                <Icon name={t.icon} className="w-5 h-5 text-gray-400" />
                {t.title}
              </h3>
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
            A trip planner for Japan. Pick places, set your dates, and get a day-by-day plan you can
            share and follow on your phone.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-white/90">Contact</h4>
          <a href="mailto:andreyjapan@gmail.com" className="text-white/70 text-sm hover:text-white">
            andreyjapan@gmail.com
          </a>
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
        © {new Date().getFullYear()} Trip to Japan
      </div>
    </footer>
  );
}
