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
  "tokyo-disneyland": {
    status: "required",
    advanceTicket: true,
    walkIn: false,
    sellsOut: true,
    opens: { kind: "daysBefore", days: 60 },
    closesDaysBefore: 0,
    bookByDaysBefore: 30,
    recommendedBookingTime: "4–8 weeks before travel",
    officialBookingUrl: "https://www.tokyodisneyresort.jp/en/",
    ticketPrice: "¥7,900–¥10,900 (adult 1-Day Passport, varies by date)",
    notes:
      "Park tickets are date-specific, sold online, and weekends, holidays, and school breaks sell out. Install the Tokyo Disney Resort app before you go — Disney Premier Access (paid) and show entry are handled there on the day.",
  },
  "tokyo-disneysea": {
    status: "required",
    advanceTicket: true,
    walkIn: false,
    sellsOut: true,
    opens: { kind: "daysBefore", days: 60 },
    closesDaysBefore: 0,
    bookByDaysBefore: 30,
    recommendedBookingTime: "4–8 weeks before travel",
    officialBookingUrl: "https://www.tokyodisneyresort.jp/en/",
    ticketPrice: "¥7,900–¥10,900 (adult 1-Day Passport, varies by date)",
    notes:
      "Date-specific park tickets sold online; popular dates sell out. Fantasy Springs rides are reached via Disney Premier Access (paid) or a Standby Pass in the app — install the Tokyo Disney Resort app before your visit.",
  },
  "tokyo-goldengai": {
    ...OPEN_ACCESS,
    ticketPrice: "Free to walk; many bars charge a ¥500–¥1,500 cover",
    notes:
      "Walk-in only. Some bars are regulars-only — look for English signs or posted cover charges. Space is tight; small groups do best.",
  },
  "tokyo-ginza": {
    ...OPEN_ACCESS,
    notes:
      "Free to wander. Chuo-dori closes to cars on weekend afternoons. Kabuki-za single-act tickets are sold same day.",
  },
  "tokyo-roppongihills": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "~¥2,000 (adult, deck + museum)",
    notes:
      "Walk-in at the counter; online tickets are slightly cheaper. The museum stays open late most nights.",
  },
  "tokyo-yanaka": {
    ...OPEN_ACCESS,
    notes: "A free, quiet neighborhood walk. Many small shops close on Mondays.",
  },
  "tokyo-toyosu": {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 30,
    recommendedBookingTime: "Apply about a month ahead for the auction deck",
    ticketPrice: "Free",
    notes:
      "The general gallery is free and walk-in. The close-up lower auction deck uses an advance lottery — apply about a month ahead. Arrive before 6:00 to see the auction; closed Sundays, holidays, and some Wednesdays.",
  },
  "tokyo-teamlabborderless": {
    status: "required",
    advanceTicket: true,
    timeSlot: true,
    sellsOut: true,
    opens: { kind: "daysBefore", days: 60 },
    closesDaysBefore: 0,
    bookByDaysBefore: 21,
    recommendedBookingTime: "2–4 weeks before travel",
    officialBookingUrl: "https://www.teamlab.art/e/tokyo/",
    ticketPrice: "¥5,600 (adult, varies by date)",
    notes:
      "Date-and-time tickets online; weekend slots sell out. Separate from teamLab Planets in Toyosu — the two are different experiences.",
  },
  "tokyo-puroland": {
    status: "recommended",
    advanceTicket: true,
    opens: { kind: "daysBefore", days: 60 },
    bookByDaysBefore: 7,
    recommendedBookingTime: "1–2 weeks before your visit",
    officialBookingUrl: "https://www.puroland.jp/",
    ticketPrice: "¥3,600–¥4,900 (adult, varies by date)",
    notes:
      "Date-specific tickets are cheaper online and weekends fill up. Fully indoors, so a solid rainy-day pick.",
  },
  "tokyo-harrypotter": {
    status: "required",
    advanceTicket: true,
    walkIn: false,
    timeSlot: true,
    sellsOut: true,
    opens: { kind: "daysBefore", days: 90 },
    closesDaysBefore: 1,
    bookByDaysBefore: 30,
    recommendedBookingTime: "3–6 weeks before travel",
    officialBookingUrl: "https://www.wbstudiotour.jp/en/",
    ticketPrice: "¥6,500 (adult)",
    notes:
      "No tickets at the door — buy a timed entry online in advance. Weekends and school holidays sell out weeks ahead.",
  },
  "kamakura-daibutsu": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥300 (adult)",
    notes:
      "Pay at the gate. Kamakura is about an hour from Tokyo — pair it with Hase-dera and Tsurugaoka Hachimangu for a full day.",
  },
  "nikko-toshogu": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥1,600 (adult)",
    notes:
      "Walk-in. Nikko is about 2 hours from Tokyo, so plan the whole day; autumn foliage weekends bring heavy road traffic.",
  },
  "yokohama-chinatown": {
    ...OPEN_ACCESS,
    notes:
      "Free to wander. About 30–40 minutes from Tokyo; combine with the Cup Noodles Museum and Minato Mirai.",
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
  "kyoto-ginkakuji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥500 (adult)",
    notes: "Pay at the gate. Go at opening to beat tour groups.",
  },
  "kyoto-tofukuji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥600–¥1,000 (adult, by area/season)",
    notes:
      "Walk-in. During the November foliage peak, expect long lines and a single-direction route on the bridge.",
  },
  "kyoto-sanjusangendo": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥600 (adult)",
    notes: "Pay at the gate. No photos inside the hall.",
  },
  "kyoto-ryoanji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥600 (adult)",
    notes: "Walk-in. Early morning is the quietest time to sit with the garden.",
  },
  "kyoto-tenryuji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥500 (adult, garden)",
    notes: "Walk-in. Its north gate opens onto the bamboo grove, so visit them together.",
  },
  "kyoto-nanzenji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Grounds free; gate & gardens ~¥600 each",
    notes: "Grounds are free; the Sanmon gate and subtemple gardens each charge at the door.",
  },
  "kyoto-toji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Grounds free; halls ¥500–¥800",
    notes: "Walk-in. Time a visit for the 21st of the month to catch the Kobo-san market.",
  },
  "kyoto-pontocho": {
    ...OPEN_ACCESS,
    ticketPrice: "Free to walk",
    notes:
      "Free to stroll. Popular restaurants, especially riverside platforms (May–Sept), need dinner reservations.",
  },
  "kyoto-monkeypark": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥800 (adult)",
    notes: "Pay at the gate. The climb takes about 20 minutes; closes in bad weather.",
  },
  "uji-byodoin": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥700 (adult); hall interior +¥300",
    notes: "Walk-in. Interior tours of the Phoenix Hall are timed and sold on site — get one early.",
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
    officialBookingUrl: "https://www.usjticketing.com/expressPass",


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
  "osaka-kaiyukan": {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 3,
    recommendedBookingTime: "A few days ahead for weekends",
    officialBookingUrl: "https://www.kaiyukan.com/language/eng/",
    ticketPrice: "¥2,700 (adult)",
    notes:
      "Online date tickets skip the ticket queue. Weekends and holidays get crowded; walk-in works on weekdays.",
  },
  "osaka-shitennoji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Grounds free; inner precinct ¥300",
    notes: "Walk-in. Pair with Abeno Harukas and Shinsekai next door.",
  },
  "osaka-abenoharukas": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥2,000 (adult)",
    notes: "Walk-in at the 16th-floor counter. Sunset is the busiest slot.",
  },
  "osaka-sumiyoshi": {
    ...OPEN_ACCESS,
    notes: "Free and walk-in. Packed during the first days of the New Year.",
  },
  "osaka-shinsaibashi": {
    ...OPEN_ACCESS,
    notes: "Free to wander; covered, so a good rainy-day option.",
  },
  "osaka-expopark": {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 7,
    recommendedBookingTime: "About a week ahead for the tower interior",
    ticketPrice: "Park ¥260; tower interior ¥720",
    notes: "The park is walk-in. Entry inside the Tower of the Sun is by advance online reservation.",
  },
  koyasan: {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 60,
    recommendedBookingTime: "1–3 months ahead if staying overnight",
    ticketPrice: "Mostly free; halls ¥500–¥1,000",
    notes:
      "Day visits are walk-in, but it's about 2 hours from Osaka and best experienced overnight — temple lodgings (shukubo) book up weeks to months ahead.",
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
  "nara-naramachi": {
    ...OPEN_ACCESS,
    notes: "Free to wander, a short walk south of Sarusawa Pond.",
  },
  "nara-horyuji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥2,000 (adult)",
    notes: "Walk-in. About 30 minutes from Nara city by train and bus.",
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
  "fuji-kawaguchiko": {
    ...OPEN_ACCESS,
    ticketPrice: "Free; ropeway ~¥1,000",
    notes:
      "The lakeshore is free. Fuji is clearest early morning, especially October–February. Highway buses from Shinjuku sell out on weekends.",
  },
  "fuji-oshino": {
    ...OPEN_ACCESS,
    notes: "Free to walk. Small and very busy late morning — arrive early.",
  },
  "hakone-shrine": {
    ...OPEN_ACCESS,
    notes: "Free. The lakeside torii has a photo queue that can run 30–60 minutes midday.",
  },
  "fuji-fifthstation": {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 14,
    recommendedBookingTime: "2 weeks ahead for summit climbs (July–Sept)",
    ticketPrice: "Free to visit; climbing fee ¥4,000",
    notes:
      "Buses run from Kawaguchiko. The road closes in winter. Summit climbers on the Yoshida Trail must pre-register online and pay the climbing fee; the official season is July–early September.",
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
  okunoshima: {
    ...OPEN_ACCESS,
    ticketPrice: "Free; ferry ~¥360 each way",
    notes:
      "Walk-in. Bring rabbit food from the mainland side — none is sold on the island. Check the last ferry time.",
  },
  onomichi: {
    ...OPEN_ACCESS,
    notes: "Free to wander. Shimanami Kaido rental bikes can be reserved ahead in peak seasons.",
  },
  "iwakuni-kintaikyo": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥310 (bridge, round trip)",
    notes: "Pay at the toll booth. About 1 hour from Hiroshima — combine with Miyajima.",
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
  "furano-tomita": {
    ...OPEN_ACCESS,
    notes: "Free entry. Lavender peaks in mid-July; the farm is quiet outside summer.",
  },
  "biei-bluepond": {
    ...OPEN_ACCESS,
    notes: "Free; small parking fee. Best reached by rental car or a tour from Asahikawa or Furano.",
  },
  "asahiyama-zoo": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥1,000 (adult)",
    notes: "Pay at the gate. The zoo closes for maintenance in April and November — check dates.",
  },
  noboribetsu: {
    ...OPEN_ACCESS,
    notes:
      "The valley walk is free. Day-use baths at the big hotels are paid; overnight onsen stays are the real draw.",
  },
  "hakodate-mount": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥1,800 (adult, ropeway round trip)",
    notes: "Walk-in. The summit fills for sunset — arrive 30–45 minutes early. Fog sometimes hides the view.",
  },
  shiretoko: {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 14,
    recommendedBookingTime: "2+ weeks ahead for tours and cruises",
    ticketPrice: "Boardwalk free; cruises & ground-path tours paid",
    notes:
      "Very remote — plan a rental car and an overnight in Utoro. Cruises and the guided Five Lakes ground path (needed in bear season) require booking.",
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
  "kobe-kitano": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Streets free; houses ¥500–¥1,000 each",
    notes: "Free to walk; each house charges entry. Combo tickets cover several.",
  },
  "arima-onsen": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥650–¥800 (public baths)",
    notes:
      "Public baths are walk-in. Overnight ryokan stays should be booked ahead. Tattoo policies vary by bath.",
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
  "kanazawa-higashichaya": {
    ...OPEN_ACCESS,
    notes: "Free to stroll; individual teahouses charge entry. Busiest late morning.",
  },
  "kanazawa-21stcentury": {
    status: "recommended",
    advanceTicket: false,
    timeSlot: true,
    bookByDaysBefore: 7,
    recommendedBookingTime: "About a week ahead for the Swimming Pool",
    ticketPrice: "Free zones; exhibitions ¥450–¥2,000",
    notes:
      "Free public zones are walk-in. Viewing The Swimming Pool from below is timed — reserve online for busy days.",
  },
  kamikochi: {
    ...OPEN_ACCESS,
    notes: "Free to enter, but private cars are banned — arrive by bus or taxi. Closed in winter.",
  },
  "tateyama-kurobe": {
    status: "recommended",
    advanceTicket: true,
    opens: { kind: "daysBefore", days: 60 },
    bookByDaysBefore: 14,
    recommendedBookingTime: "2+ weeks ahead in snow-wall season",
    ticketPrice: "~¥10,000+ (adult, one-way through route)",
    notes:
      "Online web tickets reserve your ride slots — strongly advised during the April–May snow walls and autumn colors. Closed December to mid-April.",
  },
  "ghibli-park": {
    status: "required",
    advanceTicket: true,
    walkIn: false,
    sellsOut: true,
    opens: { kind: "monthlyOn", day: 10, monthsBefore: 2 },
    closesDaysBefore: 1,
    bookByDaysBefore: 45,
    recommendedBookingTime: "As soon as sales open, ~2 months ahead",
    officialBookingUrl: "https://ghibli-park.jp/en/",
    ticketPrice: "¥3,500–¥7,800 (adult, by pass)",
    notes:
      "Tickets are not sold at the gate. Each month's tickets go on sale about two months ahead on a fixed date and popular days sell out quickly — confirm the current sale schedule on the official site.",
  },
  "ise-jingu": {
    ...OPEN_ACCESS,
    notes:
      "Free and walk-in. Traditionally you visit the Geku (outer shrine) before the Naiku (inner shrine).",
  },
  "magome-tsumago": {
    ...OPEN_ACCESS,
    notes:
      "The trail is free. A seasonal baggage-forwarding service runs between the two towns' tourist offices.",
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
  "nagasaki-peace": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Park free; museum ¥200",
    notes: "Walk-in. The museum is a short walk south of the park.",
  },
  gunkanjima: {
    status: "required",
    advanceTicket: true,
    walkIn: false,
    timeSlot: true,
    sellsOut: true,
    bookByDaysBefore: 14,
    recommendedBookingTime: "1–3 weeks before your visit",
    ticketPrice: "~¥4,000–¥5,000 (adult, incl. landing fee)",
    notes:
      "Only reachable on licensed boat tours. Landings are cancelled in rough seas, so keep a backup day.",
  },
  "fukuoka-yatai": {
    ...OPEN_ACCESS,
    ticketPrice: "Free to visit; dishes ~¥500–¥1,500",
    notes:
      "Walk-in only and cash is safest. Stalls close in heavy rain and on some days — expect short waits at the famous ones.",
  },
  "mount-aso": {
    ...OPEN_ACCESS,
    ticketPrice: "Free; crater area entry ¥800",
    notes:
      "Crater access closes without notice when volcanic gas levels rise — check the day's status. A car makes the area far easier.",
  },
  takachiho: {
    status: "recommended",
    advanceTicket: false,
    bookByDaysBefore: 7,
    recommendedBookingTime: "About a week ahead for rowboats",
    ticketPrice: "Gorge free; rowboats ~¥5,100 per boat",
    notes: "The gorge walk is free. Rowboats now take online reservations and fill quickly on weekends.",
  },
  yufuin: {
    ...OPEN_ACCESS,
    notes:
      "Free to wander. Ryokan stays book up early; the Yufuin no Mori train from Fukuoka needs seat reservations.",
  },
  sakurajima: {
    ...OPEN_ACCESS,
    ticketPrice: "Free; ferry ¥250",
    notes: "Walk-in. Ash falls are normal — an umbrella helps on eruption days.",
  },
  huistenbosch: {
    status: "recommended",
    advanceTicket: true,
    bookByDaysBefore: 7,
    recommendedBookingTime: "1–2 weeks before your visit",
    officialBookingUrl: "https://english.huistenbosch.co.jp/",
    ticketPrice: "~¥7,600 (adult 1-Day Passport, varies by date)",
    notes: "Date tickets online are usually cheaper than at the gate. Walk-in is generally possible.",
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
  "iya-valley": {
    ...OPEN_ACCESS,
    ticketPrice: "Free; vine bridge ¥550",
    notes: "Remote: buses are infrequent, so a rental car makes the day much easier.",
  },
  "matsuyama-castle": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥520 (keep) + ropeway ¥520",
    notes: "Walk-in. Pair with nearby Dogo Onsen on the same day.",
  },
  kotohiragu: {
    ...OPEN_ACCESS,
    notes: "Free. The climb is steep — wear good shoes.",
  },
  "naruto-whirlpools": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Walkway ¥510; boats ~¥1,800–¥2,400",
    notes:
      "Walk-in. Whirlpools are only impressive near peak tides — check the published tide table and plan around it.",
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
  "kouri-island": {
    ...OPEN_ACCESS,
    notes: "Free. Best by rental car; pair with Churaumi Aquarium nearby.",
  },
  "ishigaki-kabira": {
    ...OPEN_ACCESS,
    ticketPrice: "Free; glass-bottom boats ~¥1,300",
    notes: "Swimming is not allowed in the bay itself. Ishigaki is a flight from Naha or the mainland.",
  },
  "cape-manzamo": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥100 (adult)",
    notes: "Small entry fee at the gate. On the drive between Naha and the northern resorts.",
  },
  "miyako-maehama": {
    ...OPEN_ACCESS,
    notes: "Free. Miyako is a flight from Naha or major mainland cities; a rental car is essential.",
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
  "hirosaki-castle": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Park mostly free; castle area ¥320",
    notes: "Walk-in. Hotels in Hirosaki fill up months ahead of the late-April cherry blossom festival.",
  },
  kakunodate: {
    status: "none",
    advanceTicket: false,
    ticketPrice: "Street free; houses ¥300–¥500",
    notes: "Free to walk. Easy to pair with Lake Tazawa and Nyuto Onsen.",
  },
  yamadera: {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥300 (adult)",
    notes: "Walk-in. Allow an hour for the climb; steps can be icy in winter.",
  },
  "hiraizumi-chusonji": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥1,000 (adult)",
    notes: "Walk-in. Pair with nearby Motsu-ji on the same visit.",
  },
  oirase: {
    ...OPEN_ACCESS,
    notes: "Free. Buses run along the gorge, so you can hike one section and ride back.",
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
  "okayama-korakuen": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥500 (adult)",
    notes: "Walk-in. Combo tickets with Okayama Castle save a little.",
  },
  "izumo-taisha": {
    ...OPEN_ACCESS,
    notes: "Free and walk-in. Note the local custom of clapping four times instead of two.",
  },
  "matsue-castle": {
    status: "none",
    advanceTicket: false,
    ticketPrice: "¥800 (adult)",
    notes: "Walk-in. The Horikawa boat ride is a separate ticket.",
  },
};

/** Curated booking requirements for a place, or null when none are recorded. */
export function reservationMeta(id: string): ReservationMeta | null {
  return RESERVATION_META[id] ?? null;
}
