export const REGIONS = [
  "Tokyo",
  "Kyoto",
  "Osaka",
  "Nara",
  "Hakone / Fuji",
  "Hiroshima",
  "Sapporo / Hokkaido",
  "Kobe / Himeji",
  "Chubu (Nagoya / Kanazawa / Takayama)",
  "Kyushu (Fukuoka / Beppu / Nagasaki)",
  "Shikoku",
  "Okinawa",
  "Tohoku",
  "Chugoku (Okayama / Tottori)",
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
  imageUrl?: string;
  activities: string[];
};

export const PLACES: Place[] = [
  // Tokyo
  { id: "tokyo-sensoji", name: "Sensō-ji Temple", city: "Asakusa, Tokyo", region: "Tokyo", category: "temple-shrine", description: "Tokyo's oldest temple, entered through the lantern-hung Kaminarimon gate and Nakamise shopping street.", lat: 35.7148, lng: 139.7967, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/43/Sensoji_2023.jpg", activities: ["Draw an omikuji fortune slip", "Stroll Nakamise shopping street for snacks", "Photograph the giant Kaminarimon lantern"] },
  { id: "tokyo-meiji", name: "Meiji Jingu Shrine", city: "Shibuya, Tokyo", region: "Tokyo", category: "temple-shrine", description: "A serene forest shrine dedicated to Emperor Meiji, moments from the Harajuku bustle.", lat: 35.6764, lng: 139.6993, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Meiji_Jingu_2023-3.jpg/3840px-Meiji_Jingu_2023-3.jpg", activities: ["Walk the forested approach beneath torii gates", "Write a wish on an ema plaque", "Browse the nearby Harajuku streets after"] },
  { id: "tokyo-shibuya", name: "Shibuya Crossing", city: "Shibuya, Tokyo", region: "Tokyo", category: "landmark", description: "The world's busiest pedestrian scramble, ringed by giant screens and neon.", lat: 35.6595, lng: 139.7005, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/88/Shibuya_Crossing%2C_Aerial.jpg", activities: ["Cross with the crowd at the famous scramble", "Get the classic view from a cafe window above", "Take a photo with the Hachiko statue"] },
  { id: "tokyo-shibuyasky", name: "Shibuya Sky", city: "Shibuya, Tokyo", region: "Tokyo", category: "landmark", description: "Open-air rooftop observation deck atop Shibuya Scramble Square, with panoramic views over the crossing below and Mount Fuji on clear days.", lat: 35.6590, lng: 139.7016, activities: ["Watch sunset from the open-air rooftop deck", "Spot Mount Fuji on a clear day", "Relax in the rooftop hammock lounge area"] },
  { id: "tokyo-teamlab", name: "teamLab Planets", city: "Toyosu, Tokyo", region: "Tokyo", category: "activity", description: "An immersive digital-art museum you walk through barefoot, water and light all around.", lat: 35.6486, lng: 139.7905, activities: ["Wade barefoot through the mirrored water room", "Wander the infinity crystal light garden", "Lie down in the floating flower garden dome"] },
  { id: "tokyo-tsukiji", name: "Tsukiji Outer Market", city: "Chūō, Tokyo", region: "Tokyo", category: "food", description: "Warren of stalls for fresh sushi, grilled seafood, and tamagoyaki.", lat: 35.6655, lng: 139.7708, activities: ["Eat fresh tuna sushi for breakfast", "Try a grilled scallop or tamagoyaki skewer", "Browse stalls for knives and tea"] },
  { id: "tokyo-ueno", name: "Ueno Park", city: "Taitō, Tokyo", region: "Tokyo", category: "nature", description: "Sprawling park with museums, a zoo, and famous spring cherry blossoms.", lat: 35.7156, lng: 139.7745, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/18/Ueno_park.jpg", activities: ["Cherry-blossom viewing (hanami) in spring", "Visit the Tokyo National Museum", "See the pandas at Ueno Zoo"] },
  { id: "tokyo-skytree", name: "Tokyo Skytree", city: "Sumida, Tokyo", region: "Tokyo", category: "landmark", description: "At 634m, one of the world's tallest towers with sweeping city observation decks.", lat: 35.7101, lng: 139.8107, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/84/Tokyo_Skytree_2014_%E2%85%A2.jpg", activities: ["Ride the elevator to the Tembo Deck", "Walk the glass floor section", "Shop and dine at Solamachi at the base"] },
  { id: "tokyo-tower", name: "Tokyo Tower", city: "Minato, Tokyo", region: "Tokyo", category: "landmark", description: "Red-and-white Eiffel-inspired lattice tower with two observation decks over central Tokyo.", lat: 35.6586, lng: 139.7454, activities: ["Ride to the Main Deck for city views", "Visit the glass-floor Top Deck", "Browse FootTown's shops below"] },
  { id: "tokyo-akihabara", name: "Akihabara Electric Town", city: "Chiyoda, Tokyo", region: "Tokyo", category: "shopping", description: "Neon district packed with electronics, anime, arcades, and hobby shops.", lat: 35.7022, lng: 139.7745, imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Sotokanda%2C_Akihabara_Electric_Town_at_night_20231114.png/3840px-Sotokanda%2C_Akihabara_Electric_Town_at_night_20231114.png", activities: ["Browse multi-floor anime and manga stores", "Play retro games at an arcade", "Visit a themed cafe"] },
  { id: "tokyo-shinjukugyoen", name: "Shinjuku Gyoen", city: "Shinjuku, Tokyo", region: "Tokyo", category: "nature", description: "Spacious park blending Japanese, French, and English garden styles, famous for cherry blossoms.", lat: 35.6852, lng: 139.7100, activities: ["Picnic under cherry blossoms in spring", "Stroll the traditional Japanese garden", "Visit the tropical greenhouse"] },
  { id: "tokyo-imperialpalace", name: "Imperial Palace", city: "Chiyoda, Tokyo", region: "Tokyo", category: "landmark", description: "Primary residence of Japan's Emperor, surrounded by moats, stone walls, and the public East Gardens.", lat: 35.6852, lng: 139.7528, activities: ["Walk the East Gardens grounds", "Photograph Nijubashi bridge", "Join a guided palace grounds tour"] },
  { id: "tokyo-harajuku", name: "Takeshita Street", city: "Harajuku, Tokyo", region: "Tokyo", category: "shopping", description: "Narrow, colorful pedestrian street packed with youth fashion boutiques and crepe stands.", lat: 35.6702, lng: 139.7026, activities: ["Try a rainbow crepe from a street stand", "Shop for quirky fashion and pop-culture goods", "People-watch Harajuku's street style"] },
  { id: "tokyo-odaiba", name: "Odaiba", city: "Minato, Tokyo", region: "Tokyo", category: "activity", description: "Man-made bay island of futuristic malls, a life-size Gundam statue, and beach views of Rainbow Bridge.", lat: 35.6197, lng: 139.7756, activities: ["Photograph the life-size Unicorn Gundam statue", "Walk the seaside promenade at sunset", "Ride the Ferris wheel at Palette Town"] },
  { id: "tokyo-ghibli", name: "Ghibli Museum", city: "Mitaka, Tokyo", region: "Tokyo", category: "activity", description: "Whimsical museum designed by Hayao Miyazaki, dedicated to Studio Ghibli's animated films.", lat: 35.6960, lng: 139.5704, activities: ["Watch an exclusive short film in the museum theater", "Climb to the rooftop robot soldier statue", "Browse original animation cels and sketches"] },

  // Kyoto
  { id: "kyoto-fushimi", name: "Fushimi Inari Taisha", city: "Fushimi, Kyoto", region: "Kyoto", category: "temple-shrine", description: "Thousands of vermilion torii gates winding up the sacred Mount Inari.", lat: 34.9671, lng: 135.7727, activities: ["Hike the torii gate trail up Mount Inari", "Photograph the endless vermilion gate tunnels", "Look for the fox statues guarding the shrine"] },
  { id: "kyoto-kinkakuji", name: "Kinkaku-ji (Golden Pavilion)", city: "Kita, Kyoto", region: "Kyoto", category: "temple-shrine", description: "A gold-leaf Zen temple mirrored in its tranquil reflecting pond.", lat: 35.0394, lng: 135.7292, activities: ["Photograph the gold pavilion across the pond", "Walk the traditional strolling garden", "Sip matcha at the on-site tea house"] },
  { id: "kyoto-arashiyama", name: "Arashiyama Bamboo Grove", city: "Arashiyama, Kyoto", region: "Kyoto", category: "nature", description: "Towering bamboo corridors on the city's scenic western edge.", lat: 35.0170, lng: 135.6710, activities: ["Walk the towering bamboo path", "Visit nearby Tenryu-ji temple garden", "Ride a rickshaw through the grove"] },
  { id: "kyoto-gion", name: "Gion District", city: "Higashiyama, Kyoto", region: "Kyoto", category: "scenic", description: "Historic geisha quarter of wooden machiya, teahouses, and lantern-lit lanes.", lat: 35.0037, lng: 135.7752, activities: ["Stroll Hanamikoji street at dusk", "Spot a geisha or maiko heading to an appointment", "Browse traditional craft and tea shops"] },
  { id: "kyoto-kiyomizu", name: "Kiyomizu-dera", city: "Higashiyama, Kyoto", region: "Kyoto", category: "temple-shrine", description: "Hillside temple with a vast wooden stage overlooking the city.", lat: 34.9948, lng: 135.7850, activities: ["Stand on the famous wooden stage view", "Drink from the Otowa waterfall for luck", "Walk down through Sannenzaka's old streets"] },
  { id: "kyoto-nishiki", name: "Nishiki Market", city: "Nakagyō, Kyoto", region: "Kyoto", category: "food", description: "Kyoto's narrow 'kitchen' arcade of pickles, sweets, and street snacks.", lat: 35.0050, lng: 135.7649, activities: ["Sample skewered street food as you walk", "Try fresh Kyoto-style pickles", "Pick up a Japanese knife or tea set"] },
  { id: "kyoto-nijo", name: "Nijo Castle", city: "Nakagyō, Kyoto", region: "Kyoto", category: "landmark", description: "Shogunate-era castle famous for its 'nightingale floors' that chirp to warn of intruders.", lat: 35.0142, lng: 135.7481, activities: ["Listen for the chirping nightingale floors", "Explore the ornate Ninomaru Palace rooms", "Walk the castle's moat and gardens"] },
  { id: "kyoto-philosophers", name: "Philosopher's Path", city: "Higashiyama, Kyoto", region: "Kyoto", category: "scenic", description: "Cherry-tree-lined canal path connecting Ginkaku-ji to Nanzen-ji, favored for quiet strolls.", lat: 35.0270, lng: 135.7960, activities: ["Walk the canal path under cherry blossoms", "Stop at small cafes along the way", "Visit Ginkaku-ji (Silver Pavilion) at one end"] },

  // Osaka
  { id: "osaka-castle", name: "Osaka Castle", city: "Chūō, Osaka", region: "Osaka", category: "landmark", description: "Iconic five-story castle keep set in a moated park.", lat: 34.6873, lng: 135.5259, activities: ["Climb to the castle keep observation floor", "Walk the surrounding moat and stone walls", "Picnic under the cherry trees in Nishinomaru Garden"] },
  { id: "osaka-dotonbori", name: "Dōtonbori", city: "Namba, Osaka", region: "Osaka", category: "nightlife", description: "Canal-side blaze of neon signs, street food, and the Glico running man.", lat: 34.6687, lng: 135.5013, activities: ["Take a photo under the Glico running man sign", "Try takoyaki and okonomiyaki street food", "Cruise the canal on a Tombori River boat"] },
  { id: "osaka-usj", name: "Universal Studios Japan", city: "Konohana, Osaka", region: "Osaka", category: "activity", description: "Blockbuster theme park with Super Nintendo World and Harry Potter lands.", lat: 34.6654, lng: 135.4323, activities: ["Ride the Flight of the Hippogriff in Wizarding World", "Explore Super Nintendo World's Mario Kart ride", "Watch a seasonal parade on the park's main street"] },
  { id: "osaka-kuromon", name: "Kuromon Ichiba Market", city: "Chūō, Osaka", region: "Osaka", category: "food", description: "Covered market famed for fresh seafood grilled and eaten on the spot.", lat: 34.6656, lng: 135.5064, activities: ["Eat fresh grilled seafood at a stall", "Try Wagyu beef skewers", "Sample seasonal fruit and street sweets"] },
  { id: "osaka-shinsekai", name: "Shinsekai", city: "Naniwa, Osaka", region: "Osaka", category: "scenic", description: "Retro downtown around Tsūtenkaku tower, home of kushikatsu skewers.", lat: 34.6524, lng: 135.5063, activities: ["Eat kushikatsu skewers under the neon signs", "Ride the elevator up Tsutenkaku Tower", "Rub the Billiken statue's feet for luck"] },
  { id: "osaka-umeda", name: "Umeda Sky Building", city: "Kita, Osaka", region: "Osaka", category: "landmark", description: "Twin-tower skyscraper connected by a floating observatory with 360-degree city views.", lat: 34.7053, lng: 135.4900, activities: ["Ride the glass escalator to the Floating Garden Observatory", "Take in 360-degree night views of Osaka", "Browse the retro Showa-era basement market"] },

  // Nara
  { id: "nara-park", name: "Nara Park", city: "Nara", region: "Nara", category: "nature", description: "Wide parkland where free-roaming sika deer bow for crackers.", lat: 34.6851, lng: 135.8430, activities: ["Feed and bow to the free-roaming deer", "Walk the path to Tōdai-ji through the park", "Picnic under the park's old trees"] },
  { id: "nara-todaiji", name: "Tōdai-ji", city: "Nara", region: "Nara", category: "temple-shrine", description: "Colossal wooden hall housing Japan's Great Buddha.", lat: 34.6889, lng: 135.8398, activities: ["See the Great Buddha statue up close", "Try squeezing through the Buddha's-nostril-sized pillar hole", "Photograph the massive wooden Great Buddha Hall"] },
  { id: "nara-kasuga", name: "Kasuga Taisha", city: "Nara", region: "Nara", category: "temple-shrine", description: "Shrine famed for its thousands of moss-covered stone and bronze lanterns.", lat: 34.6819, lng: 135.8483, activities: ["Walk the lantern-lined forest approach", "See thousands of bronze and stone lanterns", "Visit during a lantern-lighting festival if timed right"] },

  // Hakone / Fuji
  { id: "hakone-ashi", name: "Lake Ashi", city: "Hakone", region: "Hakone / Fuji", category: "nature", description: "Volcanic crater lake with pirate-ship cruises and Fuji views on clear days.", lat: 35.2018, lng: 139.0244, activities: ["Cruise the lake on a pirate-ship sightseeing boat", "Photograph Mount Fuji over the water on a clear day", "Ride the Hakone Ropeway for aerial lake views"] },
  { id: "hakone-openair", name: "Hakone Open-Air Museum", city: "Hakone", region: "Hakone / Fuji", category: "activity", description: "Mountain sculpture park mixing modern art with hot-spring foot baths.", lat: 35.2445, lng: 139.0503, activities: ["Wander sculpture gardens with mountain backdrops", "Visit the Picasso pavilion collection", "Soak your feet in the on-site hot spring bath"] },
  { id: "fuji-chureito", name: "Chureito Pagoda", city: "Fujiyoshida", region: "Hakone / Fuji", category: "scenic", description: "Five-story pagoda framing the classic postcard view of Mount Fuji.", lat: 35.4004, lng: 138.8005, activities: ["Climb the steps for the classic pagoda-and-Fuji photo", "Visit in spring for cherry blossoms framing the view", "Continue the trail for a higher viewpoint"] },
  { id: "fuji-fujiq", name: "Fuji-Q Highland", city: "Fujiyoshida", region: "Hakone / Fuji", category: "activity", description: "Thrill park of record-breaking roller coasters below Mount Fuji.", lat: 35.4874, lng: 138.7809, activities: ["Ride one of the park's record-breaking coasters", "Try the horror-themed haunted attraction", "Take in Mount Fuji views from the rides"] },
  { id: "hakone-owakudani", name: "Ōwakudani", city: "Hakone", region: "Hakone / Fuji", category: "nature", description: "Steaming volcanic valley known for black eggs boiled in sulphur springs.", lat: 35.2447, lng: 139.0197, activities: ["Eat a black egg boiled in the sulphur springs", "Walk the volcanic valley steam vents trail", "Ride the ropeway over the crater for views"] },

  // Hiroshima
  { id: "hiroshima-peace", name: "Peace Memorial Park", city: "Hiroshima", region: "Hiroshima", category: "landmark", description: "Moving memorial and museum beside the preserved A-Bomb Dome.", lat: 34.3955, lng: 132.4536, activities: ["Visit the Peace Memorial Museum", "See the preserved A-Bomb Dome", "Fold a paper crane at the Children's Peace Monument"] },
  { id: "hiroshima-itsukushima", name: "Itsukushima Shrine (Miyajima)", city: "Miyajima", region: "Hiroshima", category: "temple-shrine", description: "Island shrine with a giant torii gate that appears to float at high tide.", lat: 34.2959, lng: 132.3199, activities: ["Photograph the floating torii gate at high tide", "Feed the friendly wild deer on the island", "Ride the ropeway up Mount Misen"] },
  { id: "hiroshima-castle", name: "Hiroshima Castle", city: "Hiroshima", region: "Hiroshima", category: "landmark", description: "Reconstructed 'Carp Castle' with a museum of the city's samurai past.", lat: 34.4026, lng: 132.4593, activities: ["Climb the reconstructed castle keep museum", "Walk the moat and castle grounds", "View cherry blossoms here in spring"] },
  { id: "hiroshima-shukkeien", name: "Shukkeien Garden", city: "Hiroshima", region: "Hiroshima", category: "nature", description: "Compact landscape garden of miniature valleys, bridges, and tea houses.", lat: 34.4001, lng: 132.4665, activities: ["Stroll the miniature valley landscape garden", "Cross the garden's arched bridges", "Visit the small tea house for matcha"] },

  // Sapporo / Hokkaido
  { id: "sapporo-odori", name: "Odori Park", city: "Sapporo", region: "Sapporo / Hokkaido", category: "nature", description: "Green ribbon through central Sapporo, host of the winter Snow Festival.", lat: 43.0605, lng: 141.3469, activities: ["Walk the park during the Sapporo Snow Festival", "Ride the Sapporo TV Tower observation deck", "Enjoy a seasonal food festival stall"] },
  { id: "hokkaido-otaru", name: "Otaru Canal", city: "Otaru", region: "Sapporo / Hokkaido", category: "scenic", description: "Gas-lit canal lined with restored stone warehouses and glass workshops.", lat: 43.1988, lng: 140.9948, activities: ["Walk the gas-lit canal at dusk", "Browse glass-blowing workshops and shops", "Try fresh Otaru sushi or seafood bowls"] },
  { id: "sapporo-beer", name: "Sapporo Beer Museum", city: "Sapporo", region: "Sapporo / Hokkaido", category: "food", description: "Japan's only beer museum, with tastings in a red-brick former brewery.", lat: 43.0710, lng: 141.3690, activities: ["Take the free museum exhibit tour", "Sample tasting-room beers on site", "Eat Genghis Khan grilled lamb at the beer garden"] },
  { id: "sapporo-moiwa", name: "Mount Moiwa Ropeway", city: "Sapporo", region: "Sapporo / Hokkaido", category: "scenic", description: "Cable car to a summit deck famed for Sapporo's glittering night view.", lat: 43.0273, lng: 141.3230, activities: ["Ride the ropeway up for Sapporo's night view", "Photograph the city skyline from the summit deck", "Visit the summit shrine"] },
  { id: "hokkaido-niseko", name: "Niseko", city: "Niseko", region: "Sapporo / Hokkaido", category: "activity", description: "World-class powder ski resort, with hiking and hot springs off-season.", lat: 42.8048, lng: 140.6874, activities: ["Ski or snowboard the resort's powder slopes", "Soak in an outdoor onsen with mountain views", "Hike or raft the area in summer"] },
  { id: "sapporo-shiroikoibito", name: "Shiroi Koibito Park", city: "Sapporo", region: "Sapporo / Hokkaido", category: "activity", description: "Whimsical chocolate factory and gardens behind the famous cookie brand.", lat: 43.0896, lng: 141.2790, activities: ["Tour the chocolate factory production line", "Decorate your own cookie in a workshop", "Browse the whimsical European-style gardens"] },

  // Kobe / Himeji
  { id: "kobe-harborland", name: "Kobe Harborland", city: "Kobe", region: "Kobe / Himeji", category: "scenic", description: "Waterfront shopping and entertainment district with views of the illuminated Kobe Port Tower.", lat: 34.6811, lng: 135.1826, activities: ["Photograph the red Kobe Port Tower at night", "Stroll the Meriken Park waterfront", "Try authentic Kobe beef at a local steakhouse"] },
  { id: "himeji-castle", name: "Himeji Castle", city: "Himeji", region: "Kobe / Himeji", category: "landmark", description: "Japan's best-preserved feudal castle, a UNESCO site nicknamed the 'White Heron Castle'.", lat: 34.8394, lng: 134.6939, activities: ["Climb through the castle's original wooden interior", "Photograph the castle from Otemae Park", "Visit in spring for cherry blossoms around the moat"] },
  { id: "kobe-nunobiki", name: "Nunobiki Herb Garden", city: "Kobe", region: "Kobe / Himeji", category: "nature", description: "Ropeway-accessed hillside herb garden overlooking Kobe city and harbor.", lat: 34.7056, lng: 135.1946, activities: ["Ride the ropeway up for harbor views", "Wander themed herb and flower gardens", "Relax at the garden's cafe terrace"] },

  // Chubu (Nagoya / Kanazawa / Takayama)
  { id: "nagoya-castle", name: "Nagoya Castle", city: "Nagoya", region: "Chubu (Nagoya / Kanazawa / Takayama)", category: "landmark", description: "Reconstructed castle famed for its golden shachihoko (tiger-fish) roof ornaments.", lat: 35.1856, lng: 136.8996, activities: ["Photograph the golden shachihoko ornaments", "Explore the reconstructed Honmaru Palace", "Walk the surrounding moat and stone walls"] },
  { id: "shirakawago", name: "Shirakawa-go", city: "Shirakawa", region: "Chubu (Nagoya / Kanazawa / Takayama)", category: "scenic", description: "UNESCO village of steep thatched-roof gassho-zukuri farmhouses in a mountain valley.", lat: 36.2578, lng: 136.9066, activities: ["Photograph the thatched-roof farmhouses", "Hike to the hilltop viewpoint over the village", "Visit a farmhouse museum interior"] },
  { id: "takayama-oldtown", name: "Takayama Old Town", city: "Takayama", region: "Chubu (Nagoya / Kanazawa / Takayama)", category: "scenic", description: "Preserved Edo-period merchant streets with sake breweries and morning markets.", lat: 36.1461, lng: 137.2521, activities: ["Sample sake at an old brewery", "Browse the riverside morning market stalls", "Walk the preserved Sanmachi Suji streets"] },
  { id: "kanazawa-kenrokuen", name: "Kenroku-en Garden", city: "Kanazawa", region: "Chubu (Nagoya / Kanazawa / Takayama)", category: "nature", description: "One of Japan's three great gardens, with ponds, teahouses, and seasonal scenery.", lat: 36.5613, lng: 136.6625, activities: ["Stroll past the iconic Kotoji-toro lantern", "Visit a traditional teahouse in the garden", "Explore nearby Kanazawa Castle grounds"] },
  { id: "matsumoto-castle", name: "Matsumoto Castle", city: "Matsumoto", region: "Chubu (Nagoya / Kanazawa / Takayama)", category: "landmark", description: "One of Japan's oldest original castles, known as the 'Crow Castle' for its black exterior.", lat: 36.2381, lng: 137.9688, activities: ["Climb the steep original wooden staircases", "Photograph the black castle reflected in its moat", "Visit in autumn for surrounding foliage"] },
  { id: "jigokudani", name: "Jigokudani Snow Monkey Park", city: "Yamanouchi", region: "Chubu (Nagoya / Kanazawa / Takayama)", category: "nature", description: "Mountain hot spring park famous for wild Japanese macaques bathing in steaming pools.", lat: 36.7377, lng: 138.4623, activities: ["Watch snow monkeys bathe in the hot spring", "Hike the snowy trail to the monkey pools", "Photograph macaques in winter snowfall"] },

  // Kyushu (Fukuoka / Beppu / Nagasaki)
  { id: "fukuoka-canalcity", name: "Canal City Hakata", city: "Fukuoka", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", category: "shopping", description: "Futuristic mall complex built around an indoor canal with fountains and a water show.", lat: 33.5898, lng: 130.4114, activities: ["Watch the indoor canal's fountain show", "Sample Hakata ramen at the Ramen Stadium", "Shop across the multi-level complex"] },
  { id: "dazaifu-tenmangu", name: "Dazaifu Tenmangu", city: "Dazaifu", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", category: "temple-shrine", description: "Shrine dedicated to the god of learning, approached through a plum-tree-lined precinct.", lat: 33.5192, lng: 130.5352, activities: ["Buy a good-luck charm for exams", "Walk the plum blossom grounds in season", "Browse the historic approach street's sweets shops"] },
  { id: "beppu-hells", name: "Beppu Hot Springs (Jigoku Tour)", city: "Beppu", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", category: "nature", description: "Onsen town famous for its 'hells' — vividly colored hot spring pools too hot to bathe in.", lat: 33.2797, lng: 131.5011, activities: ["Tour the colorful jigoku (hell) hot spring pools", "Soak in a traditional public bathhouse", "Try an onsen-steamed local meal"] },
  { id: "kumamoto-castle", name: "Kumamoto Castle", city: "Kumamoto", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", category: "landmark", description: "Imposing black castle known for its curved defensive stone walls.", lat: 32.8065, lng: 130.7055, activities: ["Photograph the castle's curved musha-gaeshi walls", "Explore the reconstructed castle keep", "Walk the surrounding Ninomaru Historical Park"] },
  { id: "nagasaki-glover", name: "Glover Garden", city: "Nagasaki", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", category: "scenic", description: "Hillside garden of preserved Meiji-era Western merchant houses overlooking Nagasaki harbor.", lat: 32.7375, lng: 129.8663, activities: ["Tour the historic Western-style merchant houses", "Take in harbor views from the garden terraces", "Visit nearby Oura Church"] },
  { id: "yakushima", name: "Yakushima", city: "Yakushima", region: "Kyushu (Fukuoka / Beppu / Nagasaki)", category: "nature", description: "Subtropical island of ancient cedar forests, said to have inspired scenery in Princess Mononoke.", lat: 30.3856, lng: 130.5300, activities: ["Hike to the ancient Jomon Sugi cedar tree", "Walk the moss-covered Shiratani Unsuikyo ravine", "Relax at a coastal onsen with ocean views"] },

  // Shikoku
  { id: "naoshima", name: "Naoshima Art Island", city: "Naoshima", region: "Shikoku", category: "activity", description: "Small Seto Inland Sea island transformed into an open-air contemporary art destination.", lat: 34.4602, lng: 133.9967, activities: ["Photograph Yayoi Kusama's giant pumpkin sculpture", "Tour the Benesse House and Chichu Art Museum", "Cycle between the island's scattered art installations"] },
  { id: "dogoonsen", name: "Dogo Onsen", city: "Matsuyama", region: "Shikoku", category: "activity", description: "One of Japan's oldest hot spring bathhouses, said to have inspired Spirited Away's bathhouse.", lat: 33.8518, lng: 132.7857, activities: ["Bathe in the historic wooden onsen building", "Stroll the surrounding shopping arcade in a yukata", "Visit nearby Matsuyama Castle"] },
  { id: "ritsuringarden", name: "Ritsurin Garden", city: "Takamatsu", region: "Shikoku", category: "nature", description: "Expansive Edo-period strolling garden with ponds, pine trees, and a hilltop teahouse view.", lat: 34.3358, lng: 134.0433, activities: ["Ride a traditional wooden boat across the ponds", "Walk the winding paths past pruned pines", "Sip tea at the hilltop Kikugetsu-tei teahouse"] },

  // Okinawa
  { id: "shurijo", name: "Shuri Castle", city: "Naha", region: "Okinawa", category: "landmark", description: "Reconstructed Ryukyu Kingdom royal castle blending Chinese and Japanese architectural styles.", lat: 26.2170, lng: 127.7192, activities: ["Photograph the vivid vermilion castle gate", "Learn Ryukyu Kingdom history in the palace halls", "Walk the surrounding UNESCO castle grounds"] },
  { id: "churaumi", name: "Churaumi Aquarium", city: "Motobu", region: "Okinawa", category: "activity", description: "One of the world's largest aquariums, famous for its whale shark tank.", lat: 26.6941, lng: 127.8779, activities: ["Watch whale sharks glide through the giant tank", "See a dolphin show at the adjacent theater", "Walk the seaside Ocean Expo Park grounds"] },
  { id: "kokusaistreet", name: "Kokusai Street", city: "Naha", region: "Okinawa", category: "shopping", description: "Naha's mile-long main shopping strip of souvenir shops, eateries, and local markets.", lat: 26.2141, lng: 127.6892, activities: ["Browse souvenir shops for Okinawan crafts", "Try Okinawa soba at a local diner", "Explore the covered Makishi Public Market"] },

  // Tohoku
  { id: "matsushima", name: "Matsushima Bay", city: "Matsushima", region: "Tohoku", category: "scenic", description: "Bay dotted with hundreds of pine-covered islets, ranked among Japan's three most scenic views.", lat: 38.3691, lng: 141.0644, activities: ["Cruise the bay past pine-covered islets", "Visit the seaside Zuiganji Zen temple", "Walk the red Godaido Hall footbridge"] },
  { id: "zaofox", name: "Zao Fox Village", city: "Shiroishi", region: "Tohoku", category: "nature", description: "Open sanctuary where visitors walk among dozens of free-roaming foxes.", lat: 38.1180, lng: 140.5675, activities: ["Walk freely among roaming foxes", "Photograph rare fox color variants", "Hand-feed foxes from a designated area"] },
  { id: "ginzanonsen", name: "Ginzan Onsen", city: "Obanazawa", region: "Tohoku", category: "scenic", description: "Nostalgic hot spring town of wooden ryokan inns lit by gas lamps along a snowy river.", lat: 38.5734, lng: 140.5389, activities: ["Walk the gaslit riverside street at night", "Soak in a traditional ryokan's hot spring bath", "Photograph the snow-covered wooden inns in winter"] },

  // Chugoku (Okayama / Tottori)
  { id: "kurashiki", name: "Kurashiki Bikan Historical Area", city: "Kurashiki", region: "Chugoku (Okayama / Tottori)", category: "scenic", description: "Preserved canal district of white-walled merchant warehouses turned shops and cafes.", lat: 34.5883, lng: 133.7717, activities: ["Ride a boat along the historic canal", "Browse warehouse-turned craft shops", "Visit the Ohara Museum of Art"] },
  { id: "adachimuseum", name: "Adachi Museum of Art", city: "Yasugi", region: "Chugoku (Okayama / Tottori)", category: "scenic", description: "Art museum renowned for its meticulously landscaped gardens viewed like living paintings.", lat: 35.4189, lng: 133.0703, activities: ["View the gardens framed like paintings through windows", "Tour the modern Japanese art collection", "Walk the moss and white-sand garden paths"] },
  { id: "tottoridunes", name: "Tottori Sand Dunes", city: "Tottori", region: "Chugoku (Okayama / Tottori)", category: "nature", description: "Japan's largest coastal sand dune system, resembling a desert beside the Sea of Japan.", lat: 35.5386, lng: 134.2233, activities: ["Climb the tallest dune for a sea view", "Ride a camel across the dunes", "Try sandboarding down the slopes"] },
];
