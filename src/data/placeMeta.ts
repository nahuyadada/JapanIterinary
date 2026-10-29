// Curated, approximate metadata for attractions, keyed by Place.id.
// - popularity: a RELATIVE fame score (0-100), hand-assigned, for ranking only.
// - hours: TYPICAL opening hours as a human-readable string. Approximate and subject
//   to seasonal/holiday change — always verify before visiting.
// - duration: TYPICAL visit-length range [minHours, maxHours], hand-assigned from the
//   attraction type and recommended activities. An estimate, not a guarantee.

export type HourRange = [number, number];

export type PlaceMeta = { popularity: number; hours: string; duration: HourRange };

export const PLACE_META: Record<string, PlaceMeta> = {
  // Tokyo
  "tokyo-sensoji": { popularity: 95, hours: "Grounds 24h; main hall 6:00–17:00", duration: [1.5, 2.5] },
  "tokyo-meiji": { popularity: 88, hours: "Sunrise–sunset (~5:00–18:00)", duration: [1, 2] },
  "tokyo-shibuya": { popularity: 92, hours: "24 hours", duration: [0.5, 1.5] },
  "tokyo-shibuyasky": { popularity: 85, hours: "10:00–22:30", duration: [1, 1.5] },
  "tokyo-teamlab": { popularity: 84, hours: "9:00–21:00", duration: [2, 3] },
  "tokyo-tsukiji": { popularity: 80, hours: "5:00–14:00 (some stalls closed Sun/Wed)", duration: [1.5, 2.5] },
  "tokyo-ueno": { popularity: 78, hours: "Park 24h; museums 9:30–17:00", duration: [2, 4] },
  "tokyo-skytree": { popularity: 86, hours: "10:00–21:00", duration: [1.5, 2.5] },
  "tokyo-tower": { popularity: 82, hours: "9:00–22:30", duration: [1, 2] },
  "tokyo-akihabara": { popularity: 83, hours: "Shops ~10:00–20:00", duration: [2, 3] },
  "tokyo-shinjukugyoen": { popularity: 75, hours: "9:00–16:00 (closed Mon)", duration: [1.5, 2.5] },
  "tokyo-imperialpalace": { popularity: 74, hours: "Gardens 9:00–16:00 (closed Mon/Fri)", duration: [1.5, 2.5] },
  "tokyo-harajuku": { popularity: 80, hours: "Shops ~11:00–20:00", duration: [1.5, 3] },
  "tokyo-odaiba": { popularity: 72, hours: "Varies by venue", duration: [3, 5] },
  "tokyo-ghibli": { popularity: 84, hours: "10:00–18:00 (reservation; closed Tue)", duration: [2, 3] },
  "tokyo-disneyland": { popularity: 93, hours: "Varies (~9:00–21:00)", duration: [9, 12] },
  "tokyo-disneysea": { popularity: 92, hours: "Varies (~9:00–21:00)", duration: [9, 12] },
  "tokyo-goldengai": { popularity: 80, hours: "Bars ~19:00–late", duration: [1.5, 3] },
  "tokyo-ginza": { popularity: 78, hours: "Shops ~11:00–20:00", duration: [2, 3] },
  "tokyo-roppongihills": { popularity: 72, hours: "Museum & deck ~10:00–22:00", duration: [1.5, 3] },
  "tokyo-yanaka": { popularity: 62, hours: "Streets 24h; shops ~10:00–18:00", duration: [1.5, 3] },
  "tokyo-toyosu": { popularity: 70, hours: "~5:00–15:00 (closed Sun & some Wed)", duration: [1.5, 2.5] },
  "tokyo-teamlabborderless": { popularity: 82, hours: "~9:00–21:00", duration: [2, 3] },
  "tokyo-puroland": { popularity: 66, hours: "~10:00–17:00 (varies)", duration: [4, 6] },
  "tokyo-harrypotter": { popularity: 80, hours: "~8:30–22:00 (timed entry)", duration: [3.5, 5] },
  "kamakura-daibutsu": { popularity: 82, hours: "8:00–17:30 (seasonal)", duration: [1, 2] },
  "nikko-toshogu": { popularity: 80, hours: "9:00–17:00 (to 16:00 in winter)", duration: [2, 3] },
  "yokohama-chinatown": { popularity: 72, hours: "Shops ~10:00–21:00", duration: [1.5, 3] },

  // Kyoto
  "kyoto-fushimi": { popularity: 96, hours: "24 hours", duration: [2, 3] },
  "kyoto-kinkakuji": { popularity: 90, hours: "9:00–17:00", duration: [1, 1.5] },
  "kyoto-arashiyama": { popularity: 88, hours: "Grove 24 hours", duration: [2, 3] },
  "kyoto-gion": { popularity: 85, hours: "Streets 24 hours; shops vary", duration: [1.5, 3] },
  "kyoto-kiyomizu": { popularity: 90, hours: "6:00–18:00", duration: [1.5, 2.5] },
  "kyoto-nishiki": { popularity: 80, hours: "9:30–18:00 (shops vary)", duration: [1, 2] },
  "kyoto-nijo": { popularity: 76, hours: "8:45–16:00 (closed some Tue)", duration: [1.5, 2.5] },
  "kyoto-philosophers": { popularity: 70, hours: "24 hours", duration: [1, 2] },
  "kyoto-ginkakuji": { popularity: 80, hours: "8:30–17:00 (to 16:30 in winter)", duration: [1, 1.5] },
  "kyoto-tofukuji": { popularity: 72, hours: "9:00–16:00 (extended in autumn)", duration: [1, 1.5] },
  "kyoto-sanjusangendo": { popularity: 76, hours: "8:30–17:00 (to 16:00 in winter)", duration: [0.75, 1.5] },
  "kyoto-ryoanji": { popularity: 75, hours: "8:00–17:00 (8:30–16:30 in winter)", duration: [1, 1.5] },
  "kyoto-tenryuji": { popularity: 78, hours: "8:30–17:00", duration: [1, 1.5] },
  "kyoto-nanzenji": { popularity: 72, hours: "8:40–17:00 (to 16:30 in winter)", duration: [1, 2] },
  "kyoto-toji": { popularity: 70, hours: "8:00–17:00", duration: [1, 1.5] },
  "kyoto-pontocho": { popularity: 76, hours: "Restaurants ~17:00–23:00", duration: [1.5, 3] },
  "kyoto-monkeypark": { popularity: 68, hours: "9:00–16:30", duration: [1, 1.5] },
  "uji-byodoin": { popularity: 72, hours: "8:30–17:30", duration: [1, 2] },

  // Osaka
  "osaka-castle": { popularity: 88, hours: "9:00–17:00", duration: [1.5, 2] },
  "osaka-dotonbori": { popularity: 90, hours: "24 hours", duration: [2, 4] },
  "osaka-usj": { popularity: 92, hours: "Varies (~9:00–21:00)", duration: [8, 10] },
  "osaka-kuromon": { popularity: 78, hours: "9:00–18:00 (shops vary)", duration: [1, 2] },
  "osaka-shinsekai": { popularity: 74, hours: "Streets 24h; lively evenings", duration: [1.5, 3] },
  "osaka-umeda": { popularity: 78, hours: "Observatory 9:30–22:30", duration: [1, 2] },
  "osaka-kaiyukan": { popularity: 82, hours: "10:00–20:00", duration: [2, 3] },
  "osaka-shitennoji": { popularity: 64, hours: "8:30–16:30", duration: [1, 1.5] },
  "osaka-abenoharukas": { popularity: 74, hours: "9:00–22:00", duration: [1, 1.5] },
  "osaka-sumiyoshi": { popularity: 62, hours: "6:00–17:00", duration: [1, 1.5] },
  "osaka-shinsaibashi": { popularity: 76, hours: "Shops ~11:00–21:00", duration: [1.5, 3] },
  "osaka-expopark": { popularity: 60, hours: "9:30–17:00 (closed Wed)", duration: [2, 4] },
  "koyasan": { popularity: 74, hours: "Grounds 24h; halls ~8:30–17:00", duration: [5, 8] },

  // Nara
  "nara-park": { popularity: 85, hours: "24 hours", duration: [1.5, 3] },
  "nara-todaiji": { popularity: 88, hours: "7:30–17:30 (seasonal)", duration: [1, 2] },
  "nara-kasuga": { popularity: 76, hours: "6:00–18:00 (seasonal)", duration: [1, 1.5] },
  "nara-naramachi": { popularity: 62, hours: "Streets 24h; shops ~10:00–17:00", duration: [1, 2] },
  "nara-horyuji": { popularity: 68, hours: "8:00–17:00 (to 16:30 in winter)", duration: [1.5, 2.5] },

  // Hakone / Fuji
  "hakone-ashi": { popularity: 80, hours: "Cruises ~9:00–17:00", duration: [2, 3.5] },
  "hakone-openair": { popularity: 78, hours: "9:00–17:00", duration: [1.5, 3] },
  "fuji-chureito": { popularity: 82, hours: "24 hours", duration: [1, 2] },
  "fuji-fujiq": { popularity: 80, hours: "Varies (~9:00–18:00)", duration: [6, 9] },
  "hakone-owakudani": { popularity: 76, hours: "9:00–17:00", duration: [1, 2] },
  "fuji-kawaguchiko": { popularity: 84, hours: "Lake 24h; ropeway ~9:00–17:00", duration: [3, 6] },
  "fuji-oshino": { popularity: 70, hours: "~9:00–17:00", duration: [1, 1.5] },
  "hakone-shrine": { popularity: 78, hours: "Grounds 24h; office ~8:30–16:30", duration: [0.75, 1.5] },
  "fuji-fifthstation": { popularity: 78, hours: "Road open ~mid-April to early December", duration: [2, 4] },

  // Hiroshima
  "hiroshima-peace": { popularity: 90, hours: "Park 24h; museum 8:30–18:00", duration: [1.5, 3] },
  "hiroshima-itsukushima": { popularity: 88, hours: "6:30–18:00 (varies)", duration: [3, 5] },
  "hiroshima-castle": { popularity: 72, hours: "9:00–18:00 (seasonal)", duration: [1, 2] },
  "hiroshima-shukkeien": { popularity: 68, hours: "9:00–18:00 (seasonal)", duration: [1, 1.5] },
  "okunoshima": { popularity: 66, hours: "Ferries ~7:00–19:00", duration: [2.5, 4] },
  "onomichi": { popularity: 64, hours: "Streets 24h", duration: [3, 6] },
  "iwakuni-kintaikyo": { popularity: 64, hours: "24 hours (toll booth ~8:00–17:00)", duration: [1.5, 2.5] },

  // Sapporo / Hokkaido
  "sapporo-odori": { popularity: 78, hours: "24 hours", duration: [0.5, 1.5] },
  "hokkaido-otaru": { popularity: 80, hours: "Canal 24h; shops daytime", duration: [3, 5] },
  "sapporo-beer": { popularity: 72, hours: "11:00–20:00", duration: [1.5, 2.5] },
  "sapporo-moiwa": { popularity: 74, hours: "Ropeway ~10:30–22:00", duration: [1, 2] },
  "hokkaido-niseko": { popularity: 78, hours: "Varies by season", duration: [6, 10] },
  "sapporo-shiroikoibito": { popularity: 70, hours: "10:00–17:00", duration: [2, 3] },
  "furano-tomita": { popularity: 72, hours: "~8:30–18:00 (seasonal)", duration: [1, 2] },
  "biei-bluepond": { popularity: 72, hours: "24 hours (parking ~7:00–19:00)", duration: [0.5, 1] },
  "asahiyama-zoo": { popularity: 70, hours: "9:30–17:15 (seasonal; closed some periods)", duration: [2, 3] },
  "noboribetsu": { popularity: 72, hours: "Valley 24 hours", duration: [1, 3] },
  "hakodate-mount": { popularity: 78, hours: "Ropeway ~10:00–22:00", duration: [1, 2] },
  "shiretoko": { popularity: 66, hours: "Visitor areas ~8:00–17:00 (seasonal)", duration: [5, 8] },

  // Kobe / Himeji
  "kobe-harborland": { popularity: 74, hours: "Shops ~10:00–21:00", duration: [1.5, 3] },
  "himeji-castle": { popularity: 85, hours: "9:00–17:00 (seasonal)", duration: [1.5, 3] },
  "kobe-nunobiki": { popularity: 66, hours: "Ropeway ~9:30–17:00", duration: [1.5, 2.5] },
  "kobe-kitano": { popularity: 62, hours: "Houses ~9:00–18:00", duration: [1.5, 2.5] },
  "arima-onsen": { popularity: 68, hours: "Public baths ~8:00–22:00", duration: [2.5, 5] },

  // Chubu
  "nagoya-castle": { popularity: 76, hours: "9:00–16:30", duration: [1.5, 2.5] },
  "shirakawago": { popularity: 84, hours: "Village 24h; houses daytime", duration: [2, 4] },
  "takayama-oldtown": { popularity: 78, hours: "Shops ~9:00–17:00", duration: [2, 3] },
  "kanazawa-kenrokuen": { popularity: 82, hours: "7:00–18:00 (seasonal)", duration: [1.5, 2.5] },
  "matsumoto-castle": { popularity: 78, hours: "8:30–17:00", duration: [1, 2] },
  "jigokudani": { popularity: 80, hours: "8:30–17:00 (seasonal)", duration: [2, 3] },
  "kanazawa-higashichaya": { popularity: 72, hours: "Streets 24h; shops ~9:00–17:00", duration: [1, 2] },
  "kanazawa-21stcentury": { popularity: 70, hours: "10:00–18:00 (closed Mon)", duration: [1.5, 2.5] },
  "kamikochi": { popularity: 72, hours: "Open mid-April to mid-November", duration: [4, 7] },
  "tateyama-kurobe": { popularity: 74, hours: "Open mid-April to November", duration: [6, 9] },
  "ghibli-park": { popularity: 80, hours: "~9:00–17:00 (closed Tue)", duration: [4, 7] },
  "ise-jingu": { popularity: 74, hours: "5:00–18:00 (seasonal)", duration: [3, 5] },
  "magome-tsumago": { popularity: 68, hours: "Trail daylight hours; shops ~9:00–17:00", duration: [3, 5] },

  // Kyushu
  "fukuoka-canalcity": { popularity: 70, hours: "10:00–21:00", duration: [1.5, 3] },
  "dazaifu-tenmangu": { popularity: 76, hours: "6:30–18:30 (seasonal)", duration: [1, 2] },
  "beppu-hells": { popularity: 78, hours: "8:00–17:00", duration: [2, 3] },
  "kumamoto-castle": { popularity: 76, hours: "9:00–17:00", duration: [1.5, 2.5] },
  "nagasaki-glover": { popularity: 72, hours: "8:00–18:00", duration: [1.5, 2.5] },
  "yakushima": { popularity: 80, hours: "Trails 24h (daylight advised)", duration: [6, 10] },
  "nagasaki-peace": { popularity: 74, hours: "Park 24h; museum 8:30–17:30", duration: [1.5, 3] },
  "gunkanjima": { popularity: 70, hours: "Tours ~9:00–14:00 (weather permitting)", duration: [3, 3.5] },
  "fukuoka-yatai": { popularity: 76, hours: "~18:00–late (weather permitting)", duration: [1.5, 2.5] },
  "mount-aso": { popularity: 70, hours: "Crater access ~9:00–17:00 (gas-dependent)", duration: [3, 6] },
  "takachiho": { popularity: 70, hours: "Boats ~8:30–17:00", duration: [2, 4] },
  "yufuin": { popularity: 72, hours: "Streets 24h; shops ~10:00–17:00", duration: [3, 5] },
  "sakurajima": { popularity: 70, hours: "Ferry 24 hours", duration: [2.5, 5] },
  "huistenbosch": { popularity: 68, hours: "~9:00–21:00 (varies)", duration: [6, 9] },

  // Shikoku
  "naoshima": { popularity: 80, hours: "Museums ~10:00–17:00 (closed Mon)", duration: [4, 7] },
  "dogoonsen": { popularity: 82, hours: "6:00–23:00", duration: [1.5, 3] },
  "ritsuringarden": { popularity: 76, hours: "Sunrise–sunset (~7:00–17:00)", duration: [1.5, 2.5] },
  "iya-valley": { popularity: 62, hours: "Vine bridge ~8:00–17:00", duration: [4, 7] },
  "matsuyama-castle": { popularity: 66, hours: "9:00–17:00 (seasonal)", duration: [1.5, 2] },
  "kotohiragu": { popularity: 64, hours: "Grounds ~6:00–18:00", duration: [2, 3.5] },
  "naruto-whirlpools": { popularity: 64, hours: "Whirlpools peak around tide times; venues ~9:00–17:00", duration: [1.5, 2.5] },

  // Okinawa
  "shurijo": { popularity: 78, hours: "8:30–18:00", duration: [1.5, 2.5] },
  "churaumi": { popularity: 85, hours: "8:30–18:30", duration: [2.5, 4] },
  "kokusaistreet": { popularity: 74, hours: "Shops ~10:00–22:00", duration: [1.5, 3] },
  "kouri-island": { popularity: 70, hours: "24 hours", duration: [1.5, 3] },
  "ishigaki-kabira": { popularity: 68, hours: "Boats ~9:00–17:00", duration: [1.5, 3] },
  "cape-manzamo": { popularity: 66, hours: "8:00–19:00 (seasonal)", duration: [0.5, 1] },
  "miyako-maehama": { popularity: 66, hours: "24 hours", duration: [2, 5] },

  // Tohoku
  "matsushima": { popularity: 76, hours: "Bay 24h; cruises daytime", duration: [2, 4] },
  "zaofox": { popularity: 72, hours: "9:00–17:00", duration: [1, 2] },
  "ginzanonsen": { popularity: 78, hours: "Town 24 hours", duration: [2, 4] },
  "hirosaki-castle": { popularity: 68, hours: "Park 24h; keep 9:00–17:00", duration: [1.5, 3] },
  "kakunodate": { popularity: 62, hours: "Houses ~9:00–17:00", duration: [1.5, 2.5] },
  "yamadera": { popularity: 66, hours: "8:00–17:00", duration: [2, 3] },
  "hiraizumi-chusonji": { popularity: 64, hours: "8:30–17:00 (to 16:30 in winter)", duration: [1.5, 2.5] },
  "oirase": { popularity: 64, hours: "24 hours (buses seasonal)", duration: [2, 5] },

  // Chugoku
  "kurashiki": { popularity: 74, hours: "Streets 24h; shops daytime", duration: [1.5, 3] },
  "adachimuseum": { popularity: 78, hours: "9:00–17:30 (seasonal)", duration: [1.5, 2.5] },
  "tottoridunes": { popularity: 78, hours: "24 hours (daylight best)", duration: [1.5, 3] },
  "okayama-korakuen": { popularity: 68, hours: "7:30–18:00 (8:00–17:00 in winter)", duration: [1, 2] },
  "izumo-taisha": { popularity: 70, hours: "6:00–20:00", duration: [1, 2] },
  "matsue-castle": { popularity: 62, hours: "8:30–18:30 (seasonal)", duration: [1.5, 2.5] },
};

/** Relative fame score (0-100). Defaults to 50 for anything not in the table. */
export function placePopularity(id: string): number {
  return PLACE_META[id]?.popularity ?? 50;
}

/** Typical, approximate opening hours as a display string. */
export function placeHours(id: string): string {
  return PLACE_META[id]?.hours ?? "Hours vary — check ahead";
}

/** Curated typical visit-duration range [minHours, maxHours], or null if none. */
export function placeDurationRange(id: string): HourRange | null {
  return PLACE_META[id]?.duration ?? null;
}
