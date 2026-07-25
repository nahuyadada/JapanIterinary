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

  // Kyoto
  "kyoto-fushimi": { popularity: 96, hours: "24 hours", duration: [2, 3] },
  "kyoto-kinkakuji": { popularity: 90, hours: "9:00–17:00", duration: [1, 1.5] },
  "kyoto-arashiyama": { popularity: 88, hours: "Grove 24 hours", duration: [2, 3] },
  "kyoto-gion": { popularity: 85, hours: "Streets 24 hours; shops vary", duration: [1.5, 3] },
  "kyoto-kiyomizu": { popularity: 90, hours: "6:00–18:00", duration: [1.5, 2.5] },
  "kyoto-nishiki": { popularity: 80, hours: "9:30–18:00 (shops vary)", duration: [1, 2] },
  "kyoto-nijo": { popularity: 76, hours: "8:45–16:00 (closed some Tue)", duration: [1.5, 2.5] },
  "kyoto-philosophers": { popularity: 70, hours: "24 hours", duration: [1, 2] },

  // Osaka
  "osaka-castle": { popularity: 88, hours: "9:00–17:00", duration: [1.5, 2] },
  "osaka-dotonbori": { popularity: 90, hours: "24 hours", duration: [2, 4] },
  "osaka-usj": { popularity: 92, hours: "Varies (~9:00–21:00)", duration: [8, 10] },
  "osaka-kuromon": { popularity: 78, hours: "9:00–18:00 (shops vary)", duration: [1, 2] },
  "osaka-shinsekai": { popularity: 74, hours: "Streets 24h; lively evenings", duration: [1.5, 3] },
  "osaka-umeda": { popularity: 78, hours: "Observatory 9:30–22:30", duration: [1, 2] },

  // Nara
  "nara-park": { popularity: 85, hours: "24 hours", duration: [1.5, 3] },
  "nara-todaiji": { popularity: 88, hours: "7:30–17:30 (seasonal)", duration: [1, 2] },
  "nara-kasuga": { popularity: 76, hours: "6:00–18:00 (seasonal)", duration: [1, 1.5] },

  // Hakone / Fuji
  "hakone-ashi": { popularity: 80, hours: "Cruises ~9:00–17:00", duration: [2, 3.5] },
  "hakone-openair": { popularity: 78, hours: "9:00–17:00", duration: [1.5, 3] },
  "fuji-chureito": { popularity: 82, hours: "24 hours", duration: [1, 2] },
  "fuji-fujiq": { popularity: 80, hours: "Varies (~9:00–18:00)", duration: [6, 9] },
  "hakone-owakudani": { popularity: 76, hours: "9:00–17:00", duration: [1, 2] },

  // Hiroshima
  "hiroshima-peace": { popularity: 90, hours: "Park 24h; museum 8:30–18:00", duration: [1.5, 3] },
  "hiroshima-itsukushima": { popularity: 88, hours: "6:30–18:00 (varies)", duration: [3, 5] },
  "hiroshima-castle": { popularity: 72, hours: "9:00–18:00 (seasonal)", duration: [1, 2] },
  "hiroshima-shukkeien": { popularity: 68, hours: "9:00–18:00 (seasonal)", duration: [1, 1.5] },

  // Sapporo / Hokkaido
  "sapporo-odori": { popularity: 78, hours: "24 hours", duration: [0.5, 1.5] },
  "hokkaido-otaru": { popularity: 80, hours: "Canal 24h; shops daytime", duration: [3, 5] },
  "sapporo-beer": { popularity: 72, hours: "11:00–20:00", duration: [1.5, 2.5] },
  "sapporo-moiwa": { popularity: 74, hours: "Ropeway ~10:30–22:00", duration: [1, 2] },
  "hokkaido-niseko": { popularity: 78, hours: "Varies by season", duration: [6, 10] },
  "sapporo-shiroikoibito": { popularity: 70, hours: "10:00–17:00", duration: [2, 3] },

  // Kobe / Himeji
  "kobe-harborland": { popularity: 74, hours: "Shops ~10:00–21:00", duration: [1.5, 3] },
  "himeji-castle": { popularity: 85, hours: "9:00–17:00 (seasonal)", duration: [1.5, 3] },
  "kobe-nunobiki": { popularity: 66, hours: "Ropeway ~9:30–17:00", duration: [1.5, 2.5] },

  // Chubu
  "nagoya-castle": { popularity: 76, hours: "9:00–16:30", duration: [1.5, 2.5] },
  "shirakawago": { popularity: 84, hours: "Village 24h; houses daytime", duration: [2, 4] },
  "takayama-oldtown": { popularity: 78, hours: "Shops ~9:00–17:00", duration: [2, 3] },
  "kanazawa-kenrokuen": { popularity: 82, hours: "7:00–18:00 (seasonal)", duration: [1.5, 2.5] },
  "matsumoto-castle": { popularity: 78, hours: "8:30–17:00", duration: [1, 2] },
  "jigokudani": { popularity: 80, hours: "8:30–17:00 (seasonal)", duration: [2, 3] },

  // Kyushu
  "fukuoka-canalcity": { popularity: 70, hours: "10:00–21:00", duration: [1.5, 3] },
  "dazaifu-tenmangu": { popularity: 76, hours: "6:30–18:30 (seasonal)", duration: [1, 2] },
  "beppu-hells": { popularity: 78, hours: "8:00–17:00", duration: [2, 3] },
  "kumamoto-castle": { popularity: 76, hours: "9:00–17:00", duration: [1.5, 2.5] },
  "nagasaki-glover": { popularity: 72, hours: "8:00–18:00", duration: [1.5, 2.5] },
  "yakushima": { popularity: 80, hours: "Trails 24h (daylight advised)", duration: [6, 10] },

  // Shikoku
  "naoshima": { popularity: 80, hours: "Museums ~10:00–17:00 (closed Mon)", duration: [4, 7] },
  "dogoonsen": { popularity: 82, hours: "6:00–23:00", duration: [1.5, 3] },
  "ritsuringarden": { popularity: 76, hours: "Sunrise–sunset (~7:00–17:00)", duration: [1.5, 2.5] },

  // Okinawa
  "shurijo": { popularity: 78, hours: "8:30–18:00", duration: [1.5, 2.5] },
  "churaumi": { popularity: 85, hours: "8:30–18:30", duration: [2.5, 4] },
  "kokusaistreet": { popularity: 74, hours: "Shops ~10:00–22:00", duration: [1.5, 3] },

  // Tohoku
  "matsushima": { popularity: 76, hours: "Bay 24h; cruises daytime", duration: [2, 4] },
  "zaofox": { popularity: 72, hours: "9:00–17:00", duration: [1, 2] },
  "ginzanonsen": { popularity: 78, hours: "Town 24 hours", duration: [2, 4] },

  // Chugoku
  "kurashiki": { popularity: 74, hours: "Streets 24h; shops daytime", duration: [1.5, 3] },
  "adachimuseum": { popularity: 78, hours: "9:00–17:30 (seasonal)", duration: [1.5, 2.5] },
  "tottoridunes": { popularity: 78, hours: "24 hours (daylight best)", duration: [1.5, 3] },
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
