// Curated, approximate metadata for attractions, keyed by Place.id.
// - popularity: a RELATIVE fame score (0-100), hand-assigned, for ranking only.
// - hours: TYPICAL opening hours as a human-readable string. Approximate and subject
//   to seasonal/holiday change — always verify before visiting.

export type PlaceMeta = { popularity: number; hours: string };

export const PLACE_META: Record<string, PlaceMeta> = {
  // Tokyo
  "tokyo-sensoji": { popularity: 95, hours: "Grounds 24h; main hall 6:00–17:00" },
  "tokyo-meiji": { popularity: 88, hours: "Sunrise–sunset (~5:00–18:00)" },
  "tokyo-shibuya": { popularity: 92, hours: "24 hours" },
  "tokyo-shibuyasky": { popularity: 85, hours: "10:00–22:30" },
  "tokyo-teamlab": { popularity: 84, hours: "9:00–21:00" },
  "tokyo-tsukiji": { popularity: 80, hours: "5:00–14:00 (some stalls closed Sun/Wed)" },
  "tokyo-ueno": { popularity: 78, hours: "Park 24h; museums 9:30–17:00" },
  "tokyo-skytree": { popularity: 86, hours: "10:00–21:00" },
  "tokyo-tower": { popularity: 82, hours: "9:00–22:30" },
  "tokyo-akihabara": { popularity: 83, hours: "Shops ~10:00–20:00" },
  "tokyo-shinjukugyoen": { popularity: 75, hours: "9:00–16:00 (closed Mon)" },
  "tokyo-imperialpalace": { popularity: 74, hours: "Gardens 9:00–16:00 (closed Mon/Fri)" },
  "tokyo-harajuku": { popularity: 80, hours: "Shops ~11:00–20:00" },
  "tokyo-odaiba": { popularity: 72, hours: "Varies by venue" },
  "tokyo-ghibli": { popularity: 84, hours: "10:00–18:00 (reservation; closed Tue)" },

  // Kyoto
  "kyoto-fushimi": { popularity: 96, hours: "24 hours" },
  "kyoto-kinkakuji": { popularity: 90, hours: "9:00–17:00" },
  "kyoto-arashiyama": { popularity: 88, hours: "Grove 24 hours" },
  "kyoto-gion": { popularity: 85, hours: "Streets 24 hours; shops vary" },
  "kyoto-kiyomizu": { popularity: 90, hours: "6:00–18:00" },
  "kyoto-nishiki": { popularity: 80, hours: "9:30–18:00 (shops vary)" },
  "kyoto-nijo": { popularity: 76, hours: "8:45–16:00 (closed some Tue)" },
  "kyoto-philosophers": { popularity: 70, hours: "24 hours" },

  // Osaka
  "osaka-castle": { popularity: 88, hours: "9:00–17:00" },
  "osaka-dotonbori": { popularity: 90, hours: "24 hours" },
  "osaka-usj": { popularity: 92, hours: "Varies (~9:00–21:00)" },
  "osaka-kuromon": { popularity: 78, hours: "9:00–18:00 (shops vary)" },
  "osaka-shinsekai": { popularity: 74, hours: "Streets 24h; lively evenings" },
  "osaka-umeda": { popularity: 78, hours: "Observatory 9:30–22:30" },

  // Nara
  "nara-park": { popularity: 85, hours: "24 hours" },
  "nara-todaiji": { popularity: 88, hours: "7:30–17:30 (seasonal)" },
  "nara-kasuga": { popularity: 76, hours: "6:00–18:00 (seasonal)" },

  // Hakone / Fuji
  "hakone-ashi": { popularity: 80, hours: "Cruises ~9:00–17:00" },
  "hakone-openair": { popularity: 78, hours: "9:00–17:00" },
  "fuji-chureito": { popularity: 82, hours: "24 hours" },
  "fuji-fujiq": { popularity: 80, hours: "Varies (~9:00–18:00)" },
  "hakone-owakudani": { popularity: 76, hours: "9:00–17:00" },

  // Hiroshima
  "hiroshima-peace": { popularity: 90, hours: "Park 24h; museum 8:30–18:00" },
  "hiroshima-itsukushima": { popularity: 88, hours: "6:30–18:00 (varies)" },
  "hiroshima-castle": { popularity: 72, hours: "9:00–18:00 (seasonal)" },
  "hiroshima-shukkeien": { popularity: 68, hours: "9:00–18:00 (seasonal)" },

  // Sapporo / Hokkaido
  "sapporo-odori": { popularity: 78, hours: "24 hours" },
  "hokkaido-otaru": { popularity: 80, hours: "Canal 24h; shops daytime" },
  "sapporo-beer": { popularity: 72, hours: "11:00–20:00" },
  "sapporo-moiwa": { popularity: 74, hours: "Ropeway ~10:30–22:00" },
  "hokkaido-niseko": { popularity: 78, hours: "Varies by season" },
  "sapporo-shiroikoibito": { popularity: 70, hours: "10:00–17:00" },

  // Kobe / Himeji
  "kobe-harborland": { popularity: 74, hours: "Shops ~10:00–21:00" },
  "himeji-castle": { popularity: 85, hours: "9:00–17:00 (seasonal)" },
  "kobe-nunobiki": { popularity: 66, hours: "Ropeway ~9:30–17:00" },

  // Chubu
  "nagoya-castle": { popularity: 76, hours: "9:00–16:30" },
  "shirakawago": { popularity: 84, hours: "Village 24h; houses daytime" },
  "takayama-oldtown": { popularity: 78, hours: "Shops ~9:00–17:00" },
  "kanazawa-kenrokuen": { popularity: 82, hours: "7:00–18:00 (seasonal)" },
  "matsumoto-castle": { popularity: 78, hours: "8:30–17:00" },
  "jigokudani": { popularity: 80, hours: "8:30–17:00 (seasonal)" },

  // Kyushu
  "fukuoka-canalcity": { popularity: 70, hours: "10:00–21:00" },
  "dazaifu-tenmangu": { popularity: 76, hours: "6:30–18:30 (seasonal)" },
  "beppu-hells": { popularity: 78, hours: "8:00–17:00" },
  "kumamoto-castle": { popularity: 76, hours: "9:00–17:00" },
  "nagasaki-glover": { popularity: 72, hours: "8:00–18:00" },
  "yakushima": { popularity: 80, hours: "Trails 24h (daylight advised)" },

  // Shikoku
  "naoshima": { popularity: 80, hours: "Museums ~10:00–17:00 (closed Mon)" },
  "dogoonsen": { popularity: 82, hours: "6:00–23:00" },
  "ritsuringarden": { popularity: 76, hours: "Sunrise–sunset (~7:00–17:00)" },

  // Okinawa
  "shurijo": { popularity: 78, hours: "8:30–18:00" },
  "churaumi": { popularity: 85, hours: "8:30–18:30" },
  "kokusaistreet": { popularity: 74, hours: "Shops ~10:00–22:00" },

  // Tohoku
  "matsushima": { popularity: 76, hours: "Bay 24h; cruises daytime" },
  "zaofox": { popularity: 72, hours: "9:00–17:00" },
  "ginzanonsen": { popularity: 78, hours: "Town 24 hours" },

  // Chugoku
  "kurashiki": { popularity: 74, hours: "Streets 24h; shops daytime" },
  "adachimuseum": { popularity: 78, hours: "9:00–17:30 (seasonal)" },
  "tottoridunes": { popularity: 78, hours: "24 hours (daylight best)" },
};

/** Relative fame score (0-100). Defaults to 50 for anything not in the table. */
export function placePopularity(id: string): number {
  return PLACE_META[id]?.popularity ?? 50;
}

/** Typical, approximate opening hours as a display string. */
export function placeHours(id: string): string {
  return PLACE_META[id]?.hours ?? "Hours vary — check ahead";
}
