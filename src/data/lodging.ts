import type { Region } from "@/data/places";

export type LodgingArea = {
  id: string;
  name: string;
  region: Region;
  lat: number;
  lng: number;
  /** One line on the neighborhood's character. */
  blurb: string;
  /** Who/what it suits, e.g. "Nightlife & food, excellent transit". */
  goodFor: string;
  /** Optional override for the booking-search query; defaults to `${name}, Japan`. */
  searchTerm?: string;
};

export const LODGING_AREAS: LodgingArea[] = [
  // Tokyo
  { id: "tokyo-shinjuku", name: "Shinjuku", region: "Tokyo", lat: 35.6938, lng: 139.7036, blurb: "Neon-lit hub of hotels, dining, and nightlife around Tokyo's busiest station.", goodFor: "First-timers, nightlife, unbeatable transit", searchTerm: "Shinjuku, Tokyo, Japan" },
  { id: "tokyo-ueno-asakusa", name: "Ueno / Asakusa", region: "Tokyo", lat: 35.7138, lng: 139.7770, blurb: "Old-Tokyo temples, museums, and value stays on the northeast side.", goodFor: "Sightseeing, budget, families", searchTerm: "Asakusa, Tokyo, Japan" },
  { id: "tokyo-ginza-station", name: "Ginza / Tokyo Station", region: "Tokyo", lat: 35.6812, lng: 139.7671, blurb: "Upscale central district with easy Shinkansen access.", goodFor: "Shopping, Shinkansen access, comfort", searchTerm: "Ginza, Tokyo, Japan" },
  { id: "tokyo-shibuya", name: "Shibuya", region: "Tokyo", lat: 35.6595, lng: 139.7005, blurb: "Youthful, fashionable, and central to west-side sights.", goodFor: "Trendy dining, west Tokyo sights", searchTerm: "Shibuya, Tokyo, Japan" },

  // Kyoto
  { id: "kyoto-station", name: "Kyoto Station", region: "Kyoto", lat: 34.9858, lng: 135.7588, blurb: "Transit heart of Kyoto with hotels of every budget.", goodFor: "Day trips, Shinkansen access", searchTerm: "Kyoto Station, Kyoto, Japan" },
  { id: "kyoto-gion", name: "Gion / Higashiyama", region: "Kyoto", lat: 35.0037, lng: 135.7752, blurb: "Historic geisha quarter near the eastern temples.", goodFor: "Atmosphere, temples on foot", searchTerm: "Gion, Kyoto, Japan" },
  { id: "kyoto-downtown", name: "Downtown Kawaramachi", region: "Kyoto", lat: 35.0037, lng: 135.7681, blurb: "Central shopping and dining by the Nishiki Market.", goodFor: "Food, shopping, central base", searchTerm: "Kawaramachi, Kyoto, Japan" },

  // Osaka
  { id: "osaka-namba", name: "Namba / Dotonbori", region: "Osaka", lat: 34.6659, lng: 135.5012, blurb: "Osaka's neon food-and-nightlife core in the south (Minami).", goodFor: "Nightlife, street food, first-timers", searchTerm: "Namba, Osaka, Japan" },
  { id: "osaka-umeda", name: "Umeda / Kita", region: "Osaka", lat: 34.7025, lng: 135.4959, blurb: "Northern business and shopping hub around Osaka/Umeda Station.", goodFor: "Transit, shopping, day trips", searchTerm: "Umeda, Osaka, Japan" },
  { id: "osaka-tennoji", name: "Tennoji / Shinsekai", region: "Osaka", lat: 34.6465, lng: 135.5136, blurb: "Retro southern district with value hotels near the park.", goodFor: "Budget, USJ/airport access", searchTerm: "Tennoji, Osaka, Japan" },

  // Nara
  { id: "nara-center", name: "Nara City Center", region: "Nara", lat: 34.6789, lng: 135.8296, blurb: "Between the JR and Kintetsu stations, walkable to the park.", goodFor: "Transit, walkable sightseeing", searchTerm: "Nara City, Nara, Japan" },
  { id: "nara-park", name: "Nara Park Area", region: "Nara", lat: 34.6851, lng: 135.8430, blurb: "Quiet ryokan and inns beside the deer park and temples.", goodFor: "Atmosphere, early temple access", searchTerm: "Nara Park, Nara, Japan" },

  // Hakone / Fuji
  { id: "hakone-yumoto", name: "Hakone-Yumoto", region: "Hakone / Fuji", lat: 35.2325, lng: 139.1069, blurb: "Onsen gateway town at the foot of the Hakone loop.", goodFor: "Onsen ryokan, transit hub", searchTerm: "Hakone-Yumoto, Hakone, Japan" },
  { id: "hakone-gora", name: "Gora", region: "Hakone / Fuji", lat: 35.2469, lng: 139.0503, blurb: "Upper-mountain hot-spring village near the Open-Air Museum.", goodFor: "Ryokan, art museum, views", searchTerm: "Gora, Hakone, Japan" },
  { id: "fuji-kawaguchiko", name: "Kawaguchiko", region: "Hakone / Fuji", lat: 35.5000, lng: 138.7500, blurb: "Lakeside base with classic Mount Fuji views.", goodFor: "Fuji views, Fuji-Q, lake resorts", searchTerm: "Kawaguchiko, Fujikawaguchiko, Japan" },

  // Hiroshima
  { id: "hiroshima-station", name: "Hiroshima Station", region: "Hiroshima", lat: 34.3975, lng: 132.4753, blurb: "Transit hub with business hotels and tram links.", goodFor: "Transit, day trips to Miyajima", searchTerm: "Hiroshima Station, Hiroshima, Japan" },
  { id: "hiroshima-peace", name: "Peace Park / Kamiya-cho", region: "Hiroshima", lat: 34.3955, lng: 132.4553, blurb: "Downtown core beside the Peace Memorial Park.", goodFor: "Walkable sights, dining", searchTerm: "Kamiyacho, Hiroshima, Japan" },
  { id: "hiroshima-miyajima", name: "Miyajima", region: "Hiroshima", lat: 34.2969, lng: 132.3197, blurb: "Island ryokan by the floating torii — magical after day-trippers leave.", goodFor: "Atmosphere, sunset/sunrise torii", searchTerm: "Miyajima, Hatsukaichi, Japan" },

  // Sapporo / Hokkaido
  { id: "sapporo-susukino", name: "Susukino", region: "Sapporo / Hokkaido", lat: 43.0554, lng: 141.3530, blurb: "Sapporo's dining and nightlife district.", goodFor: "Nightlife, ramen, central", searchTerm: "Susukino, Sapporo, Japan" },
  { id: "sapporo-station", name: "Sapporo Station", region: "Sapporo / Hokkaido", lat: 43.0686, lng: 141.3508, blurb: "Northern transit hub with hotels above the shops.", goodFor: "Transit, shopping, day trips", searchTerm: "Sapporo Station, Sapporo, Japan" },
  { id: "hokkaido-otaru", name: "Otaru", region: "Sapporo / Hokkaido", lat: 43.1907, lng: 140.9947, blurb: "Historic canal port a short train ride from Sapporo.", goodFor: "Scenery, seafood, quiet stays", searchTerm: "Otaru, Hokkaido, Japan" },

  // Kobe / Himeji
  { id: "kobe-sannomiya", name: "Sannomiya", region: "Kobe / Himeji", lat: 34.6946, lng: 135.1955, blurb: "Kobe's central station district for dining and transit.", goodFor: "Central base, Kobe beef, transit", searchTerm: "Sannomiya, Kobe, Japan" },
  { id: "kobe-harborland", name: "Harborland", region: "Kobe / Himeji", lat: 34.6810, lng: 135.1780, blurb: "Waterfront hotels with harbor and tower views.", goodFor: "Views, romantic, families", searchTerm: "Kobe Harborland, Kobe, Japan" },
  { id: "himeji-station", name: "Himeji Station", region: "Kobe / Himeji", lat: 34.8276, lng: 134.6903, blurb: "Walkable to the castle with easy Shinkansen access.", goodFor: "Castle access, Shinkansen", searchTerm: "Himeji Station, Himeji, Japan" },

  // Chubu (Nagoya / Kanazawa / Takayama)
  { id: "chubu-nagoya", name: "Nagoya Station", region: "Chubu (Nagoya / Kanazawa / Takayama)", lat: 35.1706, lng: 136.8816, blurb: "Major Shinkansen hub with hotels above the towers.", goodFor: "Transit, regional day trips", searchTerm: "Nagoya Station, Nagoya, Japan" },
  { id: "chubu-kanazawa", name: "Kanazawa Station", region: "Chubu (Nagoya / Kanazawa / Takayama)", lat: 36.5780, lng: 136.6480, blurb: "Walkable base for Kenroku-en and the old districts.", goodFor: "Gardens, geisha districts, transit", searchTerm: "Kanazawa Station, Kanazawa, Japan" },
  { id: "chubu-takayama", name: "Takayama Old Town", region: "Chubu (Nagoya / Kanazawa / Takayama)", lat: 36.1408, lng: 137.2519, blurb: "Edo-era streets and ryokan in the mountains.", goodFor: "Atmosphere, ryokan, morning markets", searchTerm: "Takayama, Gifu, Japan" },

  // Kyushu (Fukuoka / Beppu / Nagasaki)
  { id: "kyushu-hakata", name: "Hakata", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", lat: 33.5902, lng: 130.4207, blurb: "Fukuoka's Shinkansen gateway and ramen heartland.", goodFor: "Transit, ramen, first-timers", searchTerm: "Hakata, Fukuoka, Japan" },
  { id: "kyushu-tenjin", name: "Tenjin", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", lat: 33.5914, lng: 130.3990, blurb: "Fukuoka's downtown shopping and nightlife hub.", goodFor: "Shopping, nightlife, central", searchTerm: "Tenjin, Fukuoka, Japan" },
  { id: "kyushu-beppu", name: "Beppu Onsen", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", lat: 33.2846, lng: 131.4911, blurb: "Steamy hot-spring resort town on the east coast.", goodFor: "Onsen ryokan, relaxation", searchTerm: "Beppu, Oita, Japan" },
  { id: "kyushu-nagasaki", name: "Nagasaki City", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", lat: 32.7448, lng: 129.8737, blurb: "Harbor city with hillside views and history.", goodFor: "History, harbor views", searchTerm: "Nagasaki City, Nagasaki, Japan" },

  // Shikoku
  { id: "shikoku-takamatsu", name: "Takamatsu", region: "Shikoku", lat: 34.3497, lng: 134.0466, blurb: "Gateway port for Naoshima and Ritsurin Garden.", goodFor: "Art islands, gardens, ferries", searchTerm: "Takamatsu, Kagawa, Japan" },
  { id: "shikoku-matsuyama", name: "Matsuyama / Dogo", region: "Shikoku", lat: 33.8416, lng: 132.7657, blurb: "Castle city beside the historic Dogo Onsen.", goodFor: "Onsen, castle, relaxed base", searchTerm: "Dogo Onsen, Matsuyama, Japan" },

  // Okinawa
  { id: "okinawa-naha", name: "Naha / Kokusai-dori", region: "Okinawa", lat: 26.2141, lng: 127.6880, blurb: "Okinawa's capital and main shopping street.", goodFor: "First-timers, transit, dining", searchTerm: "Kokusai Dori, Naha, Japan" },
  { id: "okinawa-onna", name: "Onna Coast", region: "Okinawa", lat: 26.4979, lng: 127.8530, blurb: "Beach-resort strip on the central west coast.", goodFor: "Beach resorts, aquarium access", searchTerm: "Onna, Okinawa, Japan" },

  // Tohoku
  { id: "tohoku-sendai", name: "Sendai", region: "Tohoku", lat: 38.2601, lng: 140.8825, blurb: "Tohoku's largest city and Shinkansen hub.", goodFor: "Transit, dining, day trips", searchTerm: "Sendai Station, Sendai, Japan" },
  { id: "tohoku-matsushima", name: "Matsushima", region: "Tohoku", lat: 38.3700, lng: 141.0600, blurb: "Scenic bay town of pine-clad islets.", goodFor: "Views, seafood, quiet stays", searchTerm: "Matsushima, Miyagi, Japan" },
  { id: "tohoku-ginzan", name: "Ginzan Onsen", region: "Tohoku", lat: 38.5730, lng: 140.5382, blurb: "Gaslit hot-spring street of wooden ryokan.", goodFor: "Ryokan, winter scenery", searchTerm: "Ginzan Onsen, Obanazawa, Japan" },

  // Chugoku (Okayama / Tottori)
  { id: "chugoku-okayama", name: "Okayama Station", region: "Chugoku (Okayama / Tottori)", lat: 34.6657, lng: 133.9184, blurb: "Shinkansen hub central to the region's sights.", goodFor: "Transit, day trips", searchTerm: "Okayama Station, Okayama, Japan" },
  { id: "chugoku-kurashiki", name: "Kurashiki Bikan", region: "Chugoku (Okayama / Tottori)", lat: 34.5980, lng: 133.7716, blurb: "Canal district of white-walled merchant inns.", goodFor: "Atmosphere, walkable old town", searchTerm: "Kurashiki Bikan, Kurashiki, Japan" },
  { id: "chugoku-tottori", name: "Tottori City", region: "Chugoku (Okayama / Tottori)", lat: 35.4900, lng: 134.2350, blurb: "Base for the famous sand dunes.", goodFor: "Dunes access, quiet base", searchTerm: "Tottori City, Tottori, Japan" },
];
