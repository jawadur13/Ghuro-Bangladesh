import type { Division } from '@lib/types';

/**
 * The eight administrative divisions of Bangladesh.
 *
 * `geoKey` joins each entry to a boundary polygon in `src/data/geo/divisions.json`
 * (geoBoundaries gbOpen ADM1), which still carries the older romanisations.
 * Area figures are Bangladesh Bureau of Statistics values, rounded to km².
 */
export const divisions: Division[] = [
  /* ───────────────────────────── DHAKA ───────────────────────────── */
  {
    slug: 'dhaka',
    name: 'Dhaka',
    nameBn: 'ঢাকা',
    headquarters: 'Dhaka',
    geoKey: 'Dhaka',
    areaKm2: 20594,
    hue: 'terracotta',
    tagline: 'Mughal capitals, river ports and the country pressed into one delta.',
    summary:
      'The political and cultural centre of Bangladesh — a division where 400-year-old Mughal forts, riverside zamindar palaces and the largest city in the delta sit within a few hours of each other.',
    description: [
      'Dhaka division is where Bangladesh concentrates. Thirteen districts wrap around the capital, threaded together by the Buriganga, Shitalakshya, Padma and Old Brahmaputra rivers — the same waterways that made this the richest muslin-trading region in the world four centuries ago.',
      'Travel here rewards short hops. You can spend a morning inside the unfinished Mughal fort at Lalbagh, an afternoon among the crumbling Greco-Roman colonnades of Panam City in Sonargaon, and be back in Dhaka for dinner. Push a little further and the division opens out: the tin-roofed river town of Chandpur to the south, the Madhupur sal forest to the north, and the astonishing haor-country wetlands around Kishoreganj where a road runs straight across open water.',
      'It is also the most layered region historically. Buddhist Vikrampur, Hindu Bikrampur, Mughal Jahangirnagar, colonial Dacca and modern Dhaka all occupy overlapping ground. The best trips here follow a thread — Mughal, riverine, or textile — rather than trying to cover the whole map.',
    ],
    character: [
      'Short travel distances: most of the division is a two- to four-hour drive from the capital.',
      'The densest concentration of Mughal-era architecture in the country.',
      'River ports — Sadarghat, Chandpur, Aricha — that still run on launches, not bridges.',
      'Weekend resorts and eco-parks in Gazipur that absorb the capital every Friday.',
    ],
    themes: [
      { title: 'Mughal Dhaka', note: 'Lalbagh Fort, Ahsan Manzil, Bara Katra and the Armenian quarter, all walkable in a long day.', icon: 'dome' },
      { title: 'Zamindar country', note: 'Baliati, Balia, Murapara and Panam City — the palaces landlords built on jute and indigo money.', icon: 'crown' },
      { title: 'Haor horizons', note: 'The Nikli and Mithamoin wetlands of Kishoreganj, where the road disappears under monsoon water.', icon: 'reed' },
      { title: 'River crossings', note: 'Chandpur, Mawa and Aricha — hilsa, ferry decks and the Padma at its widest.', icon: 'boat' },
    ],
    districts: [
      'dhaka', 'gazipur', 'narayanganj', 'munshiganj', 'manikganj', 'narsingdi',
      'kishoreganj', 'tangail', 'faridpur', 'gopalganj', 'madaripur', 'shariatpur', 'rajbari',
    ],
    art: { key: 'city', seed: 11, mood: 'dusk' },
  },

  /* ─────────────────────────── CHATTOGRAM ─────────────────────────── */
  {
    slug: 'chattogram',
    name: 'Chattogram',
    nameBn: 'চট্টগ্রাম',
    altNames: ['Chittagong'],
    headquarters: 'Chattogram',
    geoKey: 'Chittagong',
    areaKm2: 33909,
    hue: 'delta',
    tagline: 'The only division with mountains, and the longest beach on earth.',
    summary:
      "Bangladesh's largest and most varied division: the 120 km sweep of Cox's Bazar beach, the Chittagong Hill Tracts, coral-fringed Saint Martin's, and the ancient Buddhist and Mughal heartland of Cumilla.",
    description: [
      'Chattogram is the division that breaks the delta rule. Everywhere else Bangladesh is flat alluvium; here the Arakan ranges push north across the border and throw up ridge after forested ridge across Bandarban, Rangamati and Khagrachhari — the Chittagong Hill Tracts, home to eleven Indigenous peoples and the only summits in the country above 1,000 metres.',
      "West of the hills, the coast runs for hundreds of kilometres. Cox's Bazar claims the world's longest uninterrupted natural sea beach; south of it the road continues to Teknaf and then, by boat, to Saint Martin's — the country's only coral-bearing island. North of the port city the shore turns industrial and strange, with the shipbreaking yards of Sitakunda backed by hills that hold both a hot spring and a Hindu pilgrimage site on the same ridge.",
      'Inland, Cumilla and Brahmanbaria hold a much older story: Mainamati, where the Buddhist monasteries of the Deva and Chandra dynasties were excavated from a low ridge of red earth, and the terracotta-rich temple towns that grew along the Gumti.',
      'It is a division that genuinely takes a week. The hills and the coast are different holidays, and the Hill Tracts have their own permit and travel rules that need checking before you go.',
    ],
    character: [
      'The only genuine mountain travel in Bangladesh — Keokradong, Tazing Dong, Nafakhum.',
      "A coastline that runs from Sitakunda's mudflats to Saint Martin's coral shelf.",
      'Distinct Indigenous cultures — Marma, Chakma, Tripura, Mro, Bawm and others.',
      'Some travel in the Hill Tracts requires permission and a local guide; rules change.',
    ],
    themes: [
      { title: 'Hill Tracts', note: 'Nilgiri, Boga Lake, Sajek Valley and the waterfall trek to Nafakhum.', icon: 'mountain' },
      { title: 'The long coast', note: "Cox's Bazar, Inani, Himchari, Teknaf and the boat to Saint Martin's.", icon: 'wave' },
      { title: 'Buddhist Bengal', note: 'Mainamati, Shalban Vihara and the monastery mounds of the Lalmai ridge.', icon: 'stupa' },
      { title: 'Port city', note: 'Chattogram itself — hills inside the city, colonial cemeteries, and the Karnaphuli.', icon: 'boat' },
    ],
    districts: [
      'chattogram', 'coxs-bazar', 'bandarban', 'rangamati', 'khagrachhari',
      'cumilla', 'brahmanbaria', 'chandpur', 'noakhali', 'feni', 'lakshmipur',
    ],
    art: { key: 'hills', seed: 22, mood: 'dawn' },
  },

  /* ──────────────────────────── SYLHET ──────────────────────────── */
  {
    slug: 'sylhet',
    name: 'Sylhet',
    nameBn: 'সিলেট',
    headquarters: 'Sylhet',
    geoKey: 'Sylhet',
    areaKm2: 12635,
    hue: 'sundari',
    tagline: 'Tea terraces above, wetlands below, and stone rivers running out of Meghalaya.',
    summary:
      'Four districts of tea estates, freshwater swamp forest and vast monsoon haors, edged by the Meghalaya hills — the most photographed landscape in Bangladesh and the greenest.',
    description: [
      'Sylhet is a bowl. The Khasi and Jaintia hills of Meghalaya rise sharply along its northern rim, catching some of the heaviest rainfall on Earth and sending it down into the plain as clear, boulder-strewn rivers — the Piyain at Jaflong, the Dhalai at Bichanakandi, the Goyain at Ratargul.',
      'That water has shaped everything. In the monsoon the low ground floods into haors — seasonal freshwater seas that can stretch past the horizon. Tanguar Haor and Hakaluki Haor are Ramsar-listed wetlands where villages sit on raised earth mounds and the only transport is a boat. Ratargul, near Gowainghat, is one of very few freshwater swamp forests in the world, and for three or four months a year you paddle through the canopy.',
      'On higher ground the British planted tea. Moulvibazar district alone holds close to a hundred estates; Sreemangal, which calls itself the tea capital, is also the base for Lawachara National Park and its hoolock gibbons, and for the seven-layer tea that has become a small local legend.',
      "Sylhet is also a place of pilgrimage. The shrines of Hazrat Shah Jalal and Hazrat Shah Paran in Sylhet city draw visitors from across the country and from the large Sylheti diaspora in Britain, and give the region a distinct devotional character."
    ],
    character: [
      'Rain defines the calendar: the region is transformed between April and September.',
      'Tea estate landscapes — terraced, shaded, and mostly open to respectful visitors.',
      'Haor travel is by boat, and boat hire is the main cost of a trip.',
      'Strong shrine culture and a distinctive Sylheti dialect and cuisine.',
    ],
    themes: [
      { title: 'Tea country', note: 'Sreemangal, Lawachara, Madhabpur Lake and the estates of Moulvibazar.', icon: 'tea' },
      { title: 'Stone rivers', note: 'Jaflong, Bichanakandi, Sada Pathor and Panthumai, all fed from Meghalaya.', icon: 'droplet' },
      { title: 'Haor season', note: 'Tanguar and Hakaluki — Ramsar wetlands best seen by boat between June and October.', icon: 'reed' },
      { title: 'Shrines', note: 'Hazrat Shah Jalal, Shah Paran, and the shrine culture that shapes the city.', icon: 'dome' },
    ],
    districts: ['sylhet', 'moulvibazar', 'sunamganj', 'habiganj'],
    art: { key: 'tea', seed: 33, mood: 'monsoon' },
  },

  /* ──────────────────────────── KHULNA ──────────────────────────── */
  {
    slug: 'khulna',
    name: 'Khulna',
    nameBn: 'খুলনা',
    headquarters: 'Khulna',
    geoKey: 'Khulna',
    areaKm2: 22285,
    hue: 'sundari',
    tagline: 'The Sundarbans, a lost Muslim city, and the ghats where Bengali culture was written.',
    summary:
      'Home to two UNESCO World Heritage Sites — the Sundarbans mangrove forest and the mosque city of Bagerhat — plus the Kushtia riverside where Lalon and Tagore both worked.',
    description: [
      'Khulna division carries more UNESCO weight than the rest of the country combined. In the south, the Sundarbans: the largest contiguous mangrove forest on the planet, a tidal maze of Sundari trees, mudflats and creeks that is the last stronghold of the Bengal tiger and the reason the whole region exists as it does.',
      "In Bagerhat, the fifteenth-century Historic Mosque City founded by the saint-general Khan Jahan Ali — the sixty-domed Shat Gambuj Mosque and dozens of smaller monuments swallowed and then recovered from the forest. Between them sit Mongla port, the shrimp ghers of Satkhira, and a coastline that takes the brunt of every cyclone that comes up the Bay.",
      'North of the mangroves the division changes character entirely. Kushtia, Meherpur and Chuadanga sit on the Padma and the Gorai and form the cultural core of western Bengal — the Lalon Shah shrine at Cheuria, the Tagore family kuthibari at Shilaidaha where much of Gitanjali took shape, and Mujibnagar, where Bangladesh declared its provisional government in 1971.',
      'Jashore, Jhenaidah, Magura and Narail add a quieter layer: flower fields at Godkhali that supply half the country, the date-palm jaggery belt, and the studio of the painter S. M. Sultan on the Chitra river.',
    ],
    character: [
      'Two World Heritage Sites, both requiring at least a full day each.',
      'Sundarbans travel means a licensed boat package — day trips reach only the fringe.',
      'The western districts are the literary and musical heartland of Bengal.',
      'Winter is decisively the best season; the coast is exposed from May to October.',
    ],
    themes: [
      { title: 'Sundarbans', note: 'Karamjal, Kotka, Katka and Hiron Point — tiger country by boat.', icon: 'tree' },
      { title: 'Mosque City', note: 'Shat Gambuj, Nine-Dome, Singair and the tomb of Khan Jahan Ali at Bagerhat.', icon: 'dome' },
      { title: 'Lalon & Tagore', note: 'Cheuria, Shilaidaha and the Baul music tradition of the Kushtia riverside.', icon: 'scroll' },
      { title: 'Flowers & jaggery', note: 'Godkhali flower fields and the winter date-palm harvest of Jashore.', icon: 'leaf' },
    ],
    districts: [
      'khulna', 'bagerhat', 'satkhira', 'jashore', 'jhenaidah',
      'magura', 'narail', 'kushtia', 'chuadanga', 'meherpur',
    ],
    art: { key: 'mangrove', seed: 44, mood: 'dawn' },
  },

  /* ──────────────────────────── BARISHAL ──────────────────────────── */
  {
    slug: 'barishal',
    name: 'Barishal',
    nameBn: 'বরিশাল',
    altNames: ['Barisal'],
    headquarters: 'Barishal',
    geoKey: 'Barisal',
    areaKm2: 13225,
    hue: 'delta',
    tagline: 'The Venice of Bengal — a division you are meant to arrive at by water.',
    summary:
      'The deepest part of the delta: floating guava markets, red-crab beaches at Kuakata where the sun both rises and sets over the sea, and overnight launches from Dhaka that are a destination in themselves.',
    description: [
      'Barishal is best understood from a deck. The overnight launch from Sadarghat in Dhaka down the Meghna and Kirtankhola is one of the great journeys in South Asia, and it still runs most nights — a three-deck riverboat leaving at dusk and tying up in Barishal around dawn.',
      'The division is water first, land second. Around Swarupkathi in Pirojpur, guava growers row their crop to floating markets on narrow canals in July and August, and boatyards build country vessels on the bank. In Bhola — the largest island district in the country — char land appears and disappears with the river.',
      'On the outer coast, Kuakata faces almost due south across the Bay of Bengal, which gives it the rare distinction of an unbroken sunrise and sunset over the same stretch of sea. Behind the beach are Rakhine villages, a 200-year-old Buddhist temple, and the Gangamati reserved forest.',
      'This is also the birthplace of a great deal of modern Bengali literature — Jibanananda Das grew up in Barishal town, and the landscape he wrote about is still recognisable from the water.',
    ],
    character: [
      'The launch journey from Dhaka is genuinely part of the experience.',
      'Very low-lying; cyclone season runs roughly April–May and October–November.',
      'Floating markets are seasonal — guava season peaks July to early September.',
      'Fresh hilsa is at its best here, and it is a real reason to make the trip.',
    ],
    themes: [
      { title: 'Floating markets', note: 'Bhimruli, Atghar-Kuriana and the guava canals of Swarupkathi.', icon: 'boat' },
      { title: 'Kuakata', note: 'Sunrise and sunset over the Bay, red crabs, and the Rakhine villages behind the dune line.', icon: 'sun' },
      { title: 'Launch travel', note: 'Overnight riverboats from Sadarghat — cabins, deck class and the Meghna at night.', icon: 'boat' },
      { title: 'River islands', note: 'Bhola, Char Kukri-Mukri and the shifting char lands of the lower Meghna.', icon: 'reed' },
    ],
    districts: ['barishal', 'patuakhali', 'bhola', 'pirojpur', 'jhalokati', 'barguna'],
    art: { key: 'river', seed: 55, mood: 'dawn' },
  },

  /* ──────────────────────────── RAJSHAHI ──────────────────────────── */
  {
    slug: 'rajshahi',
    name: 'Rajshahi',
    nameBn: 'রাজশাহী',
    headquarters: 'Rajshahi',
    geoKey: 'Rajshani',
    areaKm2: 18153,
    hue: 'terracotta',
    tagline: 'Ancient Pundravardhana — mango groves, terracotta temples and the oldest cities in Bengal.',
    summary:
      "The archaeological heartland: the UNESCO Buddhist monastery at Paharpur, the 2,500-year-old citadel of Mahasthangarh, and the finest terracotta temple facades in the country, set among Chapai Nawabganj's mango orchards.",
    description: [
      'If Bangladesh has an ancient capital, it is here. Mahasthangarh in Bogura was the seat of Pundravardhana, occupied from around the third century BCE and the oldest urban site yet excavated in the country. Sixty kilometres away, the eighth-century Somapura Mahavihara at Paharpur was one of the largest Buddhist monasteries south of the Himalayas — a single cruciform temple ringed by 177 monastic cells, and a UNESCO World Heritage Site since 1985.',
      'The region kept building. Between the seventeenth and nineteenth centuries the temple towns of Puthia, Kantanagar and Dinajpur produced terracotta work of extraordinary density — every brick face carved with Ramayana scenes, court processions, hunting parties and sometimes steamships. Puthia in Rajshahi district holds the greatest concentration of Hindu temples anywhere in Bangladesh.',
      'Along the Ganges — here called the Padma — Chapai Nawabganj holds the ruins of Gaur, the medieval capital that straddles the Indian border, with the Choto Sona Mosque and the Darasbari madrasa on the Bangladeshi side. It is also the mango capital: in June and July the orchards around Kansat run the largest mango market in the country.',
      'Rajshahi city itself is unusually calm and green for Bangladesh, with a riverside promenade along the Padma and one of the best archaeological museums in the region.',
    ],
    character: [
      'The strongest archaeology in Bangladesh, spread across Bogura, Naogaon and Nawabganj.',
      'Terracotta temple architecture at Puthia and Kantanagar is unmatched nationally.',
      'Drier and hotter than the delta — visit October to March; April–May can exceed 40°C.',
      'Mango season (late May to July) transforms the western districts.',
    ],
    themes: [
      { title: 'Somapura', note: 'The Paharpur monastery — UNESCO-listed and the largest of its kind in the subcontinent.', icon: 'stupa' },
      { title: 'Terracotta', note: 'Puthia, Kantanagar and Dinajpur — brick facades carved end to end.', icon: 'temple' },
      { title: 'Ancient cities', note: 'Mahasthangarh, Wari-Bateshwar-era trade routes and the Gaur ruins at Nawabganj.', icon: 'column' },
      { title: 'Mango belt', note: 'Kansat, Shibganj and the orchards of Chapai Nawabganj in June.', icon: 'leaf' },
    ],
    districts: ['rajshahi', 'bogura', 'naogaon', 'chapai-nawabganj', 'natore', 'pabna', 'sirajganj', 'joypurhat'],
    art: { key: 'ruins', seed: 66, mood: 'day' },
  },

  /* ──────────────────────────── RANGPUR ──────────────────────────── */
  {
    slug: 'rangpur',
    name: 'Rangpur',
    nameBn: 'রংপুর',
    headquarters: 'Rangpur',
    geoKey: 'Rangpur',
    areaKm2: 16185,
    hue: 'marigold',
    tagline: 'The far north — Himalayan views on a clear winter morning, and Bengal’s finest temple.',
    summary:
      'Bangladesh at its northernmost: Kanchenjunga visible from Tetulia on clear winter days, the terracotta masterpiece of Kantajew Temple, and the country’s only inland stone-collecting river at Panchagarh.',
    description: [
      'Rangpur division is the quiet corner, and the one with the biggest surprise. From Tetulia in Panchagarh — the northernmost point in Bangladesh, a narrow finger of land between India and Nepal\'s corridor — Kanchenjunga is visible on clear mornings in October and November, roughly 140 km away.',
      'Dinajpur holds what many consider the single finest building in Bangladesh: Kantajew Temple, an eighteenth-century navaratna temple whose entire surface is covered in terracotta plaques — perhaps fifteen thousand of them, showing the Ramayana, the Mahabharata, court life and Mughal-era figures in astonishing detail.',
      'This is also the region of the great river islands. The Teesta, Dharla and Brahmaputra braid across Kurigram, Lalmonirhat and Gaibandha, creating and destroying char settlements each year. Rowmari and Chilmari in Kurigram sit on the Brahmaputra where it is several kilometres wide.',
      'Historically, Rangpur was the seat of the Nawabs of Dinajpur and later a colonial administrative centre — hence Tajhat Palace in Rangpur city and the Rajbari at Dinajpur. It is also the poorest and least-visited division, which means the sites are uncrowded and travel is slower.',
    ],
    character: [
      'Coldest part of Bangladesh — December and January nights can drop below 6°C.',
      'The only place in the country where the Himalaya are visible.',
      'Terracotta temple architecture at Kantanagar is a genuine world-class site.',
      'Distances are long and roads are slower; allow more time than the map suggests.',
    ],
    themes: [
      { title: 'Himalaya view', note: 'Tetulia, Banglabandha and the Kanchenjunga window in late autumn.', icon: 'mountain' },
      { title: 'Kantajew', note: 'The eighteenth-century terracotta temple at Kantanagar, Dinajpur.', icon: 'temple' },
      { title: 'Char country', note: 'The Teesta and Brahmaputra islands of Kurigram, Gaibandha and Lalmonirhat.', icon: 'reed' },
      { title: 'Palaces', note: 'Tajhat, Dinajpur Rajbari and the zamindar estates of the north.', icon: 'crown' },
    ],
    districts: ['rangpur', 'dinajpur', 'panchagarh', 'thakurgaon', 'nilphamari', 'lalmonirhat', 'kurigram', 'gaibandha'],
    art: { key: 'temple', seed: 77, mood: 'dawn' },
  },

  /* ──────────────────────────── MYMENSINGH ──────────────────────────── */
  {
    slug: 'mymensingh',
    name: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    headquarters: 'Mymensingh',
    geoKey: 'Mymensingh',
    areaKm2: 10485,
    hue: 'indigo',
    tagline: 'Garo hills, china-clay lakes and a river town that kept its colonial bones.',
    summary:
      'The newest division and one of the most underrated — the Garo Hills border country of Netrokona and Sherpur, the turquoise china-clay lakes of Durgapur, and the Brahmaputra riverfront at Mymensingh.',
    description: [
      'Mymensingh became a division in 2015, carved out of Dhaka, and it still feels undiscovered. Its northern edge runs along the Meghalaya foothills, where the land tilts up into the Garo Hills and the population shifts — Garo, Hajong and Koch communities live in the border belt, with their own languages, churches and harvest festivals.',
      'The signature landscape is Birishiri and Durgapur in Netrokona, where a century of china-clay quarrying has left flooded pits of an improbable blue-green, ringed by white and pink cliffs, with the Someshwari river running clear over sand below. It is the most photographed spot in the division and genuinely unlike anywhere else in Bangladesh.',
      'Mymensingh city itself sits on the Old Brahmaputra with a long riverside walk, the Shashi Lodge — a 1900s zamindar mansion of unusual elegance — and Bangladesh Agricultural University, whose campus is one of the greenest in the country.',
      'Sherpur and Jamalpur complete the division with Gajni in the hills, the Madhutila eco-park, and the shrine and mosque complex at Jamalpur.',
    ],
    character: [
      'Border-hill scenery without the permit requirements of the Chittagong Hill Tracts.',
      'Distinct Indigenous cultures — Garo (Mandi), Hajong and Koch.',
      'Best from October to March; the Someshwari swells hard in the monsoon.',
      'Very few foreign visitors; infrastructure is basic outside Mymensingh city.',
    ],
    themes: [
      { title: 'China-clay country', note: 'Birishiri, Durgapur, Bijoypur and the Someshwari river.', icon: 'mountain' },
      { title: 'Garo hills', note: 'Gajni, Madhutila and the border villages of Sherpur and Netrokona.', icon: 'tree' },
      { title: 'River town', note: 'The Old Brahmaputra waterfront, Shashi Lodge and Muktagacha Rajbari.', icon: 'house' },
      { title: 'Haor edge', note: 'The southern wetlands where Netrokona meets the Sunamganj haor basin.', icon: 'reed' },
    ],
    districts: ['mymensingh', 'netrokona', 'jamalpur', 'sherpur'],
    art: { key: 'lake', seed: 88, mood: 'day' },
  },
];

export const divisionBySlug = new Map(divisions.map((d) => [d.slug, d]));
