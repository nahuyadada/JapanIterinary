// Curated, approximate booking requirements for attractions, keyed by Place.id.
//
// This file stores only facts that CANNOT be derived. `src/lib/reservations.ts`
// derives the display flags (reservationRequired, walkInAvailable), the real dates,
// the priority, and the traveler notices. Keeping derivation out of the data means a
// 74-entry hand-written table can't contradict itself.
//
// Opening hours and visit durations deliberately live in placeMeta.ts, not here, so
// there is exactly one source for each.
//
// PRICES AND RULES ARE APPROXIMATE. Japanese attractions revise admission yearly and
// booking windows change without notice. The UI says so; always confirm officially.

export type BookingStatus = "none" | "recommended" | "required";

/**
 * When booking opens, as a rule that resolves against a visit date.
 * Not every rule is "N days before" — the Ghibli Museum sells each month's tickets
 * from the 10th of the previous month, so that shape has to be expressible too.
 */
export type BookingOpens =
  | { kind: "daysBefore"; days: number }
  | { kind: "monthlyOn"; day: number; monthsBefore: number };

export type ReservationMeta = {
  status: BookingStatus;
  /** A dated or timed ticket must be bought ahead. Orthogonal to `status`. */
  advanceTicket: boolean;
  /**
   * Override ONLY where walk-in availability differs from the status default
   * (none/recommended allow walk-ins, required does not). E.g. a park that is free to
   * enter but whose museum needs a ticket.
   */
  walkIn?: boolean;
  /** Entry is tied to a specific chosen time slot. */
  timeSlot?: boolean;
  /** Frequently sells out. Forces high priority and a warning notice. */
  sellsOut?: boolean;
  /** When booking opens. Omit when tickets are always available. */
  opens?: BookingOpens;
  /** Days before the visit that booking closes (1 = by the day before). */
  closesDaysBefore?: number;
  /** Recommended lead time in days; drives the computed "book by" date. */
  bookByDaysBefore?: number;
  /** Display copy for that same lead time, e.g. "2–4 weeks before travel". */
  recommendedBookingTime?: string;
  /**
   * Official booking or ticket page. Omitted rather than guessed — a dead link on a
   * "you must book this" row is worse than no link at all.
   */
  officialBookingUrl?: string;
  /** Approximate adult admission, e.g. "¥3,600 (adult)" or "Free". */
  ticketPrice?: string;
  notes?: string;
};

/** Walk-ins are fine: free, always-open public places. */
const OPEN_ACCESS: ReservationMeta = { status: "none", advanceTicket: false, ticketPrice: "Free" };

export const RESERVATION_META: Record<string, ReservationMeta> = {
  // ---------------------------------------------------------------- Tokyo
  "tokyo-sensoji": {
    ...OPEN_ACCESS,
    notes: "Temple grounds are always open and free. Nakamise shopping street is busiest 10:00–16:00.",
  },
  "tokyo-meiji": {
    ...OPEN_ACCESS,
    notes: "Shrine grounds are free. The Inner Garden charges a small separate fee (about ¥500).",
  },
  "tokyo-shibuya": {
    ...OPEN_ACCESS,
    notes: "The Scramble Crossing is a public street — just show up. Liveliest after dark.",
  },
  "tokyo-shibuyasky": {
    status: "required",
    advanceTicket: true,
    timeSlot: true,
    sellsOut: true,
    opens: { kind: "daysBefore", days: 14 },
    closesDaysBefore: 0,
    bookByDaysBefore: 14,
    recommendedBookingTime: "As soon as slots open, 2 weeks ahead",
    officialBookingUrl: "https://www.shibuya-scramble-square.com/sky/",
    ticketPrice: "¥2,700 (adult, online)",
    notes:
      "Timed entry. Slots release 14 days ahead at midnight JST and the hour before sunset sells out almost immediately — book that slot the moment it opens, or pick a daytime slot instead.",
  },
  "tokyo-teamlab": {
    status: "required",
    advanceTicket: true,
    timeSlot: true,
    sellsOut: true,
    opens: { kind: "daysBefore", days: 60 },
    closesDaysBefore: 0,
    bookByDaysBefore: 21,
    recommendedBookingTime: "2–4 weeks before travel",
    officialBookingUrl: "https://teamlabplanets.dmm.com/en",
    ticketPrice: "¥3,600 (adult)",
    notes:
      "Tickets are NOT sold at the door — you must buy online in advance. You walk through water, so wear shorts or clothing you can roll above the knee.",
  },
  "tokyo-tsukiji": {
    ...OPEN_ACCESS,
    notes:
      "Outer Market is walk-in. Go before 10:00; many stalls close early and shut Sundays and some Wednesdays.",
  },
  "tokyo-ueno": {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 7,
    recommendedBookingTime: "1 week ahead for special exhibitions",
    ticketPrice: "Park free; museums ¥600–¥2,100",
    notes:
      "The park is free and always open. Blockbuster special exhibitions at the Tokyo National Museum can require timed tickets — check before going.",
  },
  "tokyo-skytree": {
    status: "recommended",
    advanceTicket: false,
    timeSlot: true,
    opens: { kind: "daysBefore", days: 30 },
    bookByDaysBefore: 7,
    recommendedBookingTime: "1–2 weeks before your visit",
    officialBookingUrl: "https://www.tokyo-skytree.jp/en/",
    ticketPrice: "¥2,400–¥3,500 (adult, varies by deck and date)",
    notes:
      "Date-and-time tickets online skip the queue and cost less than same-day tickets at the counter. Walk-in is possible but waits reach an hour on weekends.",
  },
  "tokyo-tower": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥1,500 (adult, main deck)",
    notes: "Walk up and buy at the counter. Queues are short outside holidays.",
  },
  "tokyo-akihabara": {
    ...OPEN_ACCESS,
    notes:
      "Shops and arcades are walk-in. Themed and character cafés in the district are a different matter — those usually need their own reservation, often weeks ahead.",
  },
  "tokyo-shinjukugyoen": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥500 (adult)",
    notes:
      "Pay at the gate. Closed Mondays. During cherry-blossom season entry can be capped by advance reservation — check if visiting late March to early April.",
  },
  "tokyo-imperialpalace": {
    status: "required",
    advanceTicket: false,
    walkIn: false,
    timeSlot: true,
    opens: { kind: "monthlyOn", day: 1, monthsBefore: 1 },
    closesDaysBefore: 4,
    bookByDaysBefore: 30,
    recommendedBookingTime: "About a month before your visit",
    officialBookingUrl: "https://sankan.kunaicho.go.jp/english/",
    ticketPrice: "Free (guided tour)",
    notes:
      "The East Gardens are free and walk-in, but the guided tour of the inner grounds needs an Imperial Household Agency reservation and is capped daily. Closed Mondays and Fridays. Bring your passport.",
  },
  "tokyo-harajuku": {
    ...OPEN_ACCESS,
    notes: "Takeshita Street is public. Avoid weekend afternoons unless you like crowds.",
  },
  "tokyo-odaiba": {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 7,
    recommendedBookingTime: "1 week ahead for individual venues",
    ticketPrice: "Varies by venue",
    notes:
      "The waterfront and malls are free to wander. Individual attractions here price and book separately.",
  },
  "tokyo-ghibli": {
    status: "required",
    advanceTicket: true,
    walkIn: false,
    timeSlot: true,
    sellsOut: true,
    opens: { kind: "monthlyOn", day: 10, monthsBefore: 1 },
    closesDaysBefore: 1,
    bookByDaysBefore: 45,
    recommendedBookingTime: "The 10th of the previous month, the moment sales open",
    officialBookingUrl: "https://www.ghibli-museum.jp/en/tickets/",
    ticketPrice: "¥1,000 (adult)",
    notes:
      "The hardest ticket in Tokyo. Each month's tickets go on sale at 10:00 JST on the 10th of the previous month and sell out within minutes. No tickets are sold at the museum. Entry is by 10:00/12:00/14:00/16:00 slot, and the name on the ticket must match your passport exactly. Closed Tuesdays.",
  },

  // ---------------------------------------------------------------- Kyoto
  "kyoto-fushimi": {
    ...OPEN_ACCESS,
    notes:
      "Open all night and free. Arrive before 8:00 or after 17:00 for the torii gates without the crowd.",
  },
  "kyoto-kinkakuji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥500 (adult)",
    notes: "Pay at the gate. Busiest 10:00–14:00.",
  },
  "kyoto-arashiyama": {
    ...OPEN_ACCESS,
    notes:
      "The bamboo grove is a free public path, best before 9:00. Tenryū-ji temple and the monkey park inside the area charge separately at the gate.",
  },
  "kyoto-gion": {
    ...OPEN_ACCESS,
    notes:
      "The streets are public and free. Tea-house and geisha experiences require booking well ahead. Photography is restricted on some private lanes.",
  },
  "kyoto-kiyomizu": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥500 (adult)",
    notes: "Pay at the gate. Special night viewings in spring and autumn keep longer hours.",
  },
  "kyoto-nishiki": {
    ...OPEN_ACCESS,
    notes: "Market arcade is walk-in. Many stalls close by 17:00–18:00.",
  },
  "kyoto-nijo": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥1,300 (adult, castle and palace)",
    notes:
      "Pay at the gate. Closed some Tuesdays and over New Year. The Ninomaru Palace interior closes earlier than the grounds.",
  },
  "kyoto-philosophers": {
    ...OPEN_ACCESS,
    notes: "A free public canal path. Spectacular and very crowded during cherry blossom season.",
  },

  // ---------------------------------------------------------------- Osaka
  "osaka-castle": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥1,200 (adult, main tower)",
    notes: "Park is free; the tower charges at the door. Queues build midday in peak season.",
  },
  "osaka-dotonbori": {
    ...OPEN_ACCESS,
    notes:
      "Free to walk, best after dark. Popular restaurants here can hold hour-long waits — some take same-day reservations.",
  },
  "osaka-usj": {
    status: "required",
    advanceTicket: true,
    walkIn: false,
    sellsOut: true,
    opens: { kind: "daysBefore", days: 60 },
    closesDaysBefore: 1,
    bookByDaysBefore: 30,
    recommendedBookingTime: "4–8 weeks before travel",
    officialBookingUrl: "https://www.usj.co.jp/web/en/us",
    ticketPrice: "¥8,900–¥10,900 (adult 1-Day Studio Pass, varies by date)",
    notes:
      "Studio Pass is date-specific and popular dates sell out — buy before you fly. Super Nintendo World and the Wizarding World also need a separate free timed-entry ticket obtained in the official app on the day, so install the app in advance. Express Passes are a separate paid add-on and sell out first.",
  },
  "osaka-kuromon": {
    ...OPEN_ACCESS,
    notes: "Market is walk-in. Go in the morning; stalls thin out mid-afternoon.",
  },
  "osaka-shinsekai": {
    ...OPEN_ACCESS,
    notes: "Free to wander and liveliest in the evening. Tsūtenkaku tower charges separately.",
  },
  "osaka-umeda": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥2,000 (adult, Floating Garden Observatory)",
    notes: "Walk-in at the counter. Sunset is the prize slot and the busiest.",
  },

  // ---------------------------------------------------------------- Nara
  "nara-park": {
    ...OPEN_ACCESS,
    notes:
      "Free and always open. Deer crackers are sold by vendors in the park; the deer are wild animals, not exhibits.",
  },
  "nara-todaiji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥800 (adult, Great Buddha Hall)",
    notes: "Pay at the hall. Hours shift seasonally — earlier closing in winter.",
  },
  "nara-kasuga": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Grounds free; inner sanctuary ¥500",
    notes: "Walk-in. The lantern-lined approach is free to walk at any hour.",
  },

  // ---------------------------------------------------------- Hakone / Fuji
  "hakone-ashi": {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 3,
    recommendedBookingTime: "A few days ahead in peak season",
    ticketPrice: "¥1,200+ (one-way cruise); Hakone Free Pass ¥6,100",
    notes:
      "Cruises run to a timetable and don't need booking, but the Hakone Free Pass bought ahead covers the boat, ropeway, and railways together and saves both money and queueing.",
  },
  "hakone-openair": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥1,600 (adult)",
    notes: "Walk-in at the gate. Online tickets shave a little off the price.",
  },
  "fuji-chureito": {
    ...OPEN_ACCESS,
    notes:
      "Free, open at all hours, reached by about 400 steps. Sunrise is the classic shot. Fuji is often cloud-covered — plan a spare morning if you can.",
  },
  "fuji-fujiq": {
    status: "recommended",
    advanceTicket: true,
    sellsOut: true,
    opens: { kind: "daysBefore", days: 30 },
    closesDaysBefore: 1,
    bookByDaysBefore: 14,
    recommendedBookingTime: "2 weeks before your visit",
    officialBookingUrl: "https://www.fujiq.jp/en/",
    ticketPrice: "¥6,000–¥6,800 (adult, 1-day pass)",
    notes:
      "Date-specified passes online are cheaper than the gate and let you skip the ticket line. The headline coasters also use a separate in-park priority-ticket system that sells out early in the day.",
  },
  "hakone-owakudani": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Free to visit; ropeway ¥1,500 one-way",
    notes:
      "Walk-in. The valley closes without warning when volcanic gas levels rise — check the status on the day.",
  },

  // ------------------------------------------------------------- Hiroshima
  "hiroshima-peace": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Park free; museum ¥200 (adult)",
    notes:
      "The park is free and always open. The museum is inexpensive and walk-in, but school groups fill it mid-morning on weekdays.",
  },
  "hiroshima-itsukushima": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Shrine ¥300 + ferry ¥180 each way + ¥100 visitor tax",
    notes:
      "Walk-in, reached by frequent ferry. Check the tide table before going: high tide floats the torii gate, low tide lets you walk out to it.",
  },
  "hiroshima-castle": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥370 (adult)",
    notes: "Walk-in at the gate.",
  },
  "hiroshima-shukkeien": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥260 (adult)",
    notes: "Walk-in. Hours shorten in winter.",
  },

  // ------------------------------------------------------ Sapporo / Hokkaido
  "sapporo-odori": {
    ...OPEN_ACCESS,
    notes:
      "A free public park. During the February Snow Festival it is extremely crowded and nearby hotels sell out months ahead.",
  },
  "hokkaido-otaru": {
    ...OPEN_ACCESS,
    notes: "The canal and streets are free. Individual workshops and museums charge at the door.",
  },
  "sapporo-beer": {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 7,
    recommendedBookingTime: "1 week ahead for the tour",
    officialBookingUrl: "https://www.sapporobeer.jp/brewery/hokkaido/",
    ticketPrice: "Museum free; paid tasting tour about ¥1,000",
    notes:
      "The museum is free and walk-in. The guided tour with tasting is a small-group booking and fills up, especially at weekends.",
  },
  "sapporo-moiwa": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥2,100 (adult, ropeway round trip)",
    notes:
      "Walk-in. Night views are the draw. The ropeway stops in bad weather and for maintenance — check before heading up.",
  },
  "hokkaido-niseko": {
    status: "recommended",
    advanceTicket: true,
    bookByDaysBefore: 60,
    recommendedBookingTime: "2–3 months ahead for peak ski season",
    ticketPrice: "¥9,500+ per day (all-mountain lift pass)",
    notes:
      "Lift passes are available daily, but January and February accommodation, lessons, and rental gear book out months in advance. Sort lodging before anything else.",
  },
  "sapporo-shiroikoibito": {
    status: "recommended",
    advanceTicket: true,
    timeSlot: true,
    opens: { kind: "daysBefore", days: 30 },
    bookByDaysBefore: 14,
    recommendedBookingTime: "2 weeks before your visit",
    officialBookingUrl: "https://www.shiroikoibitopark.jp/english/",
    ticketPrice: "¥1,500 (adult)",
    notes:
      "Timed entry, and the cookie-making workshop is a separate reservation that fills well ahead of the park itself.",
  },

  // --------------------------------------------------------- Kobe / Himeji
  "kobe-harborland": {
    ...OPEN_ACCESS,
    notes: "Free waterfront and malls. Individual venues charge separately.",
  },
  "himeji-castle": {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 7,
    recommendedBookingTime: "Not needed, but arrive early in peak season",
    officialBookingUrl: "https://www.himejicastle.jp/en/",
    ticketPrice: "¥1,000 (adult); ¥1,050 with Kōko-en garden",
    notes:
      "Walk-in at the gate. Japan's finest surviving castle, so cherry-blossom season and Golden Week bring numbered-entry crowd control and long waits for the steep main keep. Arrive at opening.",
  },
  "kobe-nunobiki": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Falls free; ropeway ¥1,500 round trip",
    notes: "Walk-in. The falls are reachable free on foot from Shin-Kobe station.",
  },

  // ---------------------------------------------------------------- Chubu
  "nagoya-castle": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥500 (adult)",
    notes:
      "Walk-in. The main keep is closed for earthquake retrofitting; the reconstructed Hommaru Palace is open.",
  },
  shirakawago: {
    status: "recommended",
    advanceTicket: true,
    bookByDaysBefore: 30,
    recommendedBookingTime: "1 month ahead for buses; 6 months for the winter light-up",
    ticketPrice: "Village free; individual houses ¥300–¥400",
    notes:
      "The village is free to walk. Reserved-seat highway buses are the practical way in and sell out in autumn. The January evening light-up is reservation-only by lottery, entered many months ahead.",
  },
  "takayama-oldtown": {
    ...OPEN_ACCESS,
    notes:
      "Free to wander; merchant houses charge small entry. The morning markets wind down by noon.",
  },
  "kanazawa-kenrokuen": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥320 (adult)",
    notes: "Walk-in. Free entry in the early morning before official opening.",
  },
  "matsumoto-castle": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥700 (adult)",
    notes:
      "Walk-in. The original keep has steep wooden stairs and a strict internal capacity, so waits can reach an hour in peak season.",
  },
  jigokudani: {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥800 (adult)",
    notes:
      "Walk-in, after a 1.6 km forest walk from the car park. The snow monkeys are wild and bathe most reliably in cold weather; sightings are not guaranteed.",
  },

  // --------------------------------------------------------------- Kyushu
  "fukuoka-canalcity": {
    ...OPEN_ACCESS,
    notes: "A free shopping complex. Walk-in.",
  },
  "dazaifu-tenmangu": {
    ...OPEN_ACCESS,
    notes: "Shrine grounds are free. Busiest in plum-blossom season and around exam season.",
  },
  "beppu-hells": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥2,200 (adult, combined pass for all seven)",
    notes: "Walk-in. The combined pass is cheaper than paying at each of the seven sites.",
  },
  "kumamoto-castle": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥800 (adult)",
    notes:
      "Walk-in. Still under earthquake reconstruction, so some areas are viewable only from the elevated walkway.",
  },
  "nagasaki-glover": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥620 (adult)",
    notes: "Walk-in at the gate.",
  },
  yakushima: {
    status: "recommended",
    advanceTicket: true,
    bookByDaysBefore: 45,
    recommendedBookingTime: "6–8 weeks ahead for ferries, lodging, and guides",
    ticketPrice: "Forest entry ¥1,000–¥2,000; guides ¥15,000+ per day",
    notes:
      "The trails need no ticket, but reaching the island does: ferries and flights are limited and island lodging is scarce. The Jōmon Sugi hike is a 10-hour round trip, and in peak season access to the Arakawa trailhead is by shuttle bus only. A guide is strongly advised.",
  },

  // -------------------------------------------------------------- Shikoku
  naoshima: {
    status: "required",
    advanceTicket: true,
    walkIn: false,
    timeSlot: true,
    sellsOut: true,
    opens: { kind: "monthlyOn", day: 1, monthsBefore: 3 },
    closesDaysBefore: 1,
    bookByDaysBefore: 30,
    recommendedBookingTime: "1–2 months before travel",
    officialBookingUrl: "https://benesse-artsite.jp/en/",
    ticketPrice: "¥2,100 (Chichu Art Museum); other museums ¥1,000–¥1,500",
    notes:
      "The Chichu Art Museum is timed-entry and online-reservation only — no door sales — and slots go early. The outdoor works and the Yellow Pumpkin are free. Most museums close Mondays, so check the calendar before committing a day. Ferries also stop running early evening.",
  },
  dogoonsen: {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥460–¥1,300 depending on bath tier",
    notes:
      "Walk-in at the historic bathhouse. Tattoos may restrict entry at some baths — check ahead if relevant.",
  },
  ritsuringarden: {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥410 (adult)",
    notes: "Walk-in. Opens around sunrise, which is the quietest and best light.",
  },

  // -------------------------------------------------------------- Okinawa
  shurijo: {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥400 (adult)",
    notes:
      "Walk-in. The main hall burned in 2019 and is being rebuilt; the reconstruction work itself is now part of the visit.",
  },
  churaumi: {
    status: "recommended",
    advanceTicket: true,
    bookByDaysBefore: 7,
    recommendedBookingTime: "1 week before your visit",
    officialBookingUrl: "https://churaumi.okinawa/en/",
    ticketPrice: "¥2,180 (adult); cheaper bought in advance",
    notes:
      "Walk-in works, but advance tickets are discounted and skip the queue. Aim for late afternoon when tour groups have left.",
  },
  kokusaistreet: {
    ...OPEN_ACCESS,
    notes: "A public shopping street. Walk-in, liveliest in the evening.",
  },

  // --------------------------------------------------------------- Tohoku
  matsushima: {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Bay free; cruises ¥1,500–¥3,000",
    notes:
      "The bay and islands are free. Sightseeing cruises run to a timetable and rarely need booking outside holidays.",
  },
  zaofox: {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥1,000 (adult)",
    notes:
      "Walk-in. Remote, with sparse public transport — check the bus timetable before committing, or drive.",
  },
  ginzanonsen: {
    status: "recommended",
    advanceTicket: true,
    bookByDaysBefore: 90,
    recommendedBookingTime: "3–6 months ahead if staying overnight",
    ticketPrice: "Village free; day-use baths ¥500–¥1,000",
    notes:
      "Walking the gas-lit street is free, but the handful of historic ryokan book out months ahead — and the town is at its best after dark, which really means staying. Winter day visitors are restricted to a park-and-shuttle system.",
  },

  // -------------------------------------------------------------- Chugoku
  kurashiki: {
    ...OPEN_ACCESS,
    notes: "The canal quarter is free to walk. The Ohara Museum charges separately at the door.",
  },
  adachimuseum: {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥2,300 (adult)",
    notes:
      "Walk-in. The celebrated gardens are viewed through windows as living paintings — you don't walk in them. Open every day of the year.",
  },
  tottoridunes: {
    ...OPEN_ACCESS,
    notes:
      "The dunes are free and always open. Camel rides, sandboarding, and paragliding are separate paid activities, some needing same-day booking.",
  },
};

/** Curated booking requirements for a place, or null when none are recorded. */
export function reservationMeta(id: string): ReservationMeta | null {
  return RESERVATION_META[id] ?? null;
}
