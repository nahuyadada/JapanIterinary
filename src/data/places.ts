export const REGIONS = [
  "Tokyo",
  "Kyoto",
  "Osaka",
  "Nara",
  "Hakone / Fuji",
  "Hiroshima",
  "Sapporo / Hokkaido",
] as const;
export type Region = (typeof REGIONS)[number];

export const CATEGORIES = [
  "temple-shrine",
  "scenic",
  "food",
  "nightlife",
  "activity",
  "shopping",
  "nature",
  "landmark",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  "temple-shrine": "Temple / Shrine",
  scenic: "Scenic",
  food: "Food",
  nightlife: "Nightlife",
  activity: "Activity",
  shopping: "Shopping",
  nature: "Nature",
  landmark: "Landmark",
};

export type Place = {
  id: string;
  name: string;
  city: string;
  region: Region;
  category: Category;
  description: string;
  lat: number;
  lng: number;
};

export const PLACES: Place[] = [
  // Tokyo
  { id: "tokyo-sensoji", name: "Sensō-ji Temple", city: "Asakusa, Tokyo", region: "Tokyo", category: "temple-shrine", description: "Tokyo's oldest temple, entered through the lantern-hung Kaminarimon gate and Nakamise shopping street.", lat: 35.7148, lng: 139.7967 },
  { id: "tokyo-meiji", name: "Meiji Jingu Shrine", city: "Shibuya, Tokyo", region: "Tokyo", category: "temple-shrine", description: "A serene forest shrine dedicated to Emperor Meiji, moments from the Harajuku bustle.", lat: 35.6764, lng: 139.6993 },
  { id: "tokyo-shibuya", name: "Shibuya Crossing", city: "Shibuya, Tokyo", region: "Tokyo", category: "landmark", description: "The world's busiest pedestrian scramble, ringed by giant screens and neon.", lat: 35.6595, lng: 139.7005 },
  { id: "tokyo-teamlab", name: "teamLab Planets", city: "Toyosu, Tokyo", region: "Tokyo", category: "activity", description: "An immersive digital-art museum you walk through barefoot, water and light all around.", lat: 35.6486, lng: 139.7905 },
  { id: "tokyo-tsukiji", name: "Tsukiji Outer Market", city: "Chūō, Tokyo", region: "Tokyo", category: "food", description: "Warren of stalls for fresh sushi, grilled seafood, and tamagoyaki.", lat: 35.6655, lng: 139.7708 },
  { id: "tokyo-ueno", name: "Ueno Park", city: "Taitō, Tokyo", region: "Tokyo", category: "nature", description: "Sprawling park with museums, a zoo, and famous spring cherry blossoms.", lat: 35.7156, lng: 139.7745 },
  { id: "tokyo-skytree", name: "Tokyo Skytree", city: "Sumida, Tokyo", region: "Tokyo", category: "landmark", description: "At 634m, one of the world's tallest towers with sweeping city observation decks.", lat: 35.7101, lng: 139.8107 },
  { id: "tokyo-akihabara", name: "Akihabara Electric Town", city: "Chiyoda, Tokyo", region: "Tokyo", category: "shopping", description: "Neon district packed with electronics, anime, arcades, and hobby shops.", lat: 35.7022, lng: 139.7745 },

  // Kyoto
  { id: "kyoto-fushimi", name: "Fushimi Inari Taisha", city: "Fushimi, Kyoto", region: "Kyoto", category: "temple-shrine", description: "Thousands of vermilion torii gates winding up the sacred Mount Inari.", lat: 34.9671, lng: 135.7727 },
  { id: "kyoto-kinkakuji", name: "Kinkaku-ji (Golden Pavilion)", city: "Kita, Kyoto", region: "Kyoto", category: "temple-shrine", description: "A gold-leaf Zen temple mirrored in its tranquil reflecting pond.", lat: 35.0394, lng: 135.7292 },
  { id: "kyoto-arashiyama", name: "Arashiyama Bamboo Grove", city: "Arashiyama, Kyoto", region: "Kyoto", category: "nature", description: "Towering bamboo corridors on the city's scenic western edge.", lat: 35.0170, lng: 135.6710 },
  { id: "kyoto-gion", name: "Gion District", city: "Higashiyama, Kyoto", region: "Kyoto", category: "scenic", description: "Historic geisha quarter of wooden machiya, teahouses, and lantern-lit lanes.", lat: 35.0037, lng: 135.7752 },
  { id: "kyoto-kiyomizu", name: "Kiyomizu-dera", city: "Higashiyama, Kyoto", region: "Kyoto", category: "temple-shrine", description: "Hillside temple with a vast wooden stage overlooking the city.", lat: 34.9948, lng: 135.7850 },
  { id: "kyoto-nishiki", name: "Nishiki Market", city: "Nakagyō, Kyoto", region: "Kyoto", category: "food", description: "Kyoto's narrow 'kitchen' arcade of pickles, sweets, and street snacks.", lat: 35.0050, lng: 135.7649 },

  // Osaka
  { id: "osaka-castle", name: "Osaka Castle", city: "Chūō, Osaka", region: "Osaka", category: "landmark", description: "Iconic five-story castle keep set in a moated park.", lat: 34.6873, lng: 135.5259 },
  { id: "osaka-dotonbori", name: "Dōtonbori", city: "Namba, Osaka", region: "Osaka", category: "nightlife", description: "Canal-side blaze of neon signs, street food, and the Glico running man.", lat: 34.6687, lng: 135.5013 },
  { id: "osaka-usj", name: "Universal Studios Japan", city: "Konohana, Osaka", region: "Osaka", category: "activity", description: "Blockbuster theme park with Super Nintendo World and Harry Potter lands.", lat: 34.6654, lng: 135.4323 },
  { id: "osaka-kuromon", name: "Kuromon Ichiba Market", city: "Chūō, Osaka", region: "Osaka", category: "food", description: "Covered market famed for fresh seafood grilled and eaten on the spot.", lat: 34.6656, lng: 135.5064 },
  { id: "osaka-shinsekai", name: "Shinsekai", city: "Naniwa, Osaka", region: "Osaka", category: "scenic", description: "Retro downtown around Tsūtenkaku tower, home of kushikatsu skewers.", lat: 34.6524, lng: 135.5063 },

  // Nara
  { id: "nara-park", name: "Nara Park", city: "Nara", region: "Nara", category: "nature", description: "Wide parkland where free-roaming sika deer bow for crackers.", lat: 34.6851, lng: 135.8430 },
  { id: "nara-todaiji", name: "Tōdai-ji", city: "Nara", region: "Nara", category: "temple-shrine", description: "Colossal wooden hall housing Japan's Great Buddha.", lat: 34.6889, lng: 135.8398 },
  { id: "nara-kasuga", name: "Kasuga Taisha", city: "Nara", region: "Nara", category: "temple-shrine", description: "Shrine famed for its thousands of moss-covered stone and bronze lanterns.", lat: 34.6819, lng: 135.8483 },

  // Hakone / Fuji
  { id: "hakone-ashi", name: "Lake Ashi", city: "Hakone", region: "Hakone / Fuji", category: "nature", description: "Volcanic crater lake with pirate-ship cruises and Fuji views on clear days.", lat: 35.2018, lng: 139.0244 },
  { id: "hakone-openair", name: "Hakone Open-Air Museum", city: "Hakone", region: "Hakone / Fuji", category: "activity", description: "Mountain sculpture park mixing modern art with hot-spring foot baths.", lat: 35.2445, lng: 139.0503 },
  { id: "fuji-chureito", name: "Chureito Pagoda", city: "Fujiyoshida", region: "Hakone / Fuji", category: "scenic", description: "Five-story pagoda framing the classic postcard view of Mount Fuji.", lat: 35.4004, lng: 138.8005 },
  { id: "fuji-fujiq", name: "Fuji-Q Highland", city: "Fujiyoshida", region: "Hakone / Fuji", category: "activity", description: "Thrill park of record-breaking roller coasters below Mount Fuji.", lat: 35.4874, lng: 138.7809 },
  { id: "hakone-owakudani", name: "Ōwakudani", city: "Hakone", region: "Hakone / Fuji", category: "nature", description: "Steaming volcanic valley known for black eggs boiled in sulphur springs.", lat: 35.2447, lng: 139.0197 },

  // Hiroshima
  { id: "hiroshima-peace", name: "Peace Memorial Park", city: "Hiroshima", region: "Hiroshima", category: "landmark", description: "Moving memorial and museum beside the preserved A-Bomb Dome.", lat: 34.3955, lng: 132.4536 },
  { id: "hiroshima-itsukushima", name: "Itsukushima Shrine (Miyajima)", city: "Miyajima", region: "Hiroshima", category: "temple-shrine", description: "Island shrine with a giant torii gate that appears to float at high tide.", lat: 34.2959, lng: 132.3199 },
  { id: "hiroshima-castle", name: "Hiroshima Castle", city: "Hiroshima", region: "Hiroshima", category: "landmark", description: "Reconstructed 'Carp Castle' with a museum of the city's samurai past.", lat: 34.4026, lng: 132.4593 },
  { id: "hiroshima-shukkeien", name: "Shukkeien Garden", city: "Hiroshima", region: "Hiroshima", category: "nature", description: "Compact landscape garden of miniature valleys, bridges, and tea houses.", lat: 34.4001, lng: 132.4665 },

  // Sapporo / Hokkaido
  { id: "sapporo-odori", name: "Odori Park", city: "Sapporo", region: "Sapporo / Hokkaido", category: "nature", description: "Green ribbon through central Sapporo, host of the winter Snow Festival.", lat: 43.0605, lng: 141.3469 },
  { id: "hokkaido-otaru", name: "Otaru Canal", city: "Otaru", region: "Sapporo / Hokkaido", category: "scenic", description: "Gas-lit canal lined with restored stone warehouses and glass workshops.", lat: 43.1988, lng: 140.9948 },
  { id: "sapporo-beer", name: "Sapporo Beer Museum", city: "Sapporo", region: "Sapporo / Hokkaido", category: "food", description: "Japan's only beer museum, with tastings in a red-brick former brewery.", lat: 43.0710, lng: 141.3690 },
  { id: "sapporo-moiwa", name: "Mount Moiwa Ropeway", city: "Sapporo", region: "Sapporo / Hokkaido", category: "scenic", description: "Cable car to a summit deck famed for Sapporo's glittering night view.", lat: 43.0273, lng: 141.3230 },
  { id: "hokkaido-niseko", name: "Niseko", city: "Niseko", region: "Sapporo / Hokkaido", category: "activity", description: "World-class powder ski resort, with hiking and hot springs off-season.", lat: 42.8048, lng: 140.6874 },
  { id: "sapporo-shiroikoibito", name: "Shiroi Koibito Park", city: "Sapporo", region: "Sapporo / Hokkaido", category: "activity", description: "Whimsical chocolate factory and gardens behind the famous cookie brand.", lat: 43.0896, lng: 141.2790 },
];
