import type { Category } from '@lib/types';

/**
 * Destination categories. Every place carries at least one; the first entry in
 * a place's `categories` array is treated as its primary category and drives
 * the card badge, the default artwork family and the breadcrumb.
 */
export const categories: Category[] = [
  /* ─────────────────────────── NATURE ─────────────────────────── */
  {
    slug: 'beach',
    name: 'Beaches',
    nameBn: 'সমুদ্র সৈকত',
    group: 'nature',
    icon: 'wave',
    art: 'sea',
    tagline: 'Six hundred kilometres of Bay of Bengal shoreline.',
    description:
      'From the 120 km sweep at Cox’s Bazar to the empty sand at Taltali and the double-sunset shore at Kuakata, Bangladesh’s coast runs from crowded and commercial to genuinely deserted within a few hours’ drive.',
  },
  {
    slug: 'island',
    name: 'Islands',
    nameBn: 'দ্বীপ',
    group: 'nature',
    icon: 'palm',
    art: 'island',
    tagline: 'Coral shelves, deer islands and land the river made last decade.',
    description:
      'Bangladesh’s islands come in two kinds: the old, stable ones like Saint Martin’s and Maheshkhali, and the chars — sandbank islands thrown up by the Meghna and Brahmaputra that appear, are settled, and vanish again within a generation.',
  },
  {
    slug: 'hill',
    name: 'Hills & Mountains',
    nameBn: 'পাহাড়',
    group: 'nature',
    icon: 'mountain',
    art: 'hills',
    tagline: 'The Chittagong Hill Tracts and the Garo and Meghalaya foothills.',
    description:
      'Almost all of Bangladesh sits below 10 metres. The exceptions are the Chittagong Hill Tracts, where ridges climb past 1,000 metres, the Sitakunda ridge, and the border foothills of Mymensingh and Sylhet.',
  },
  {
    slug: 'waterfall',
    name: 'Waterfalls',
    nameBn: 'জলপ্রপাত',
    group: 'nature',
    icon: 'droplet',
    art: 'waterfall',
    tagline: 'Monsoon-fed, and worth timing carefully.',
    description:
      'Bangladeshi waterfalls are seasonal in a way that catches people out: Nafakhum, Richang, Hamham and Sahasradhara are powerful from June to October and can be a trickle of rock in March. Go in or just after the rains.',
  },
  {
    slug: 'river',
    name: 'Rivers & Confluences',
    nameBn: 'নদী',
    group: 'nature',
    icon: 'boat',
    art: 'river',
    tagline: 'Around 700 rivers, and the largest delta on earth.',
    description:
      'The country is a river system with land in between. Confluences like Chandpur’s Molhead, stone rivers like the Piyain at Jaflong, and the sheer width of the Brahmaputra at Chilmari are destinations in their own right.',
  },
  {
    slug: 'lake',
    name: 'Lakes',
    nameBn: 'হ্রদ',
    group: 'nature',
    icon: 'droplet',
    art: 'lake',
    tagline: 'Crater lakes, dam reservoirs and flooded quarries.',
    description:
      'Bangladesh has few natural lakes, which makes the ones it has distinctive: Boga Lake in a mountain crater, Kaptai Lake behind a 1962 dam, and the improbable turquoise of Niladri and the Birishiri clay pits.',
  },
  {
    slug: 'haor',
    name: 'Haors & Wetlands',
    nameBn: 'হাওর',
    group: 'nature',
    icon: 'reed',
    art: 'haor',
    tagline: 'Inland seas that appear every monsoon and drain every winter.',
    description:
      'The haor basin of Sylhet, Sunamganj, Kishoreganj and Netrokona is one of the great seasonal landscapes of Asia — a hundred-plus square kilometres of open freshwater in August, a green plain of paddy in January, and a bird city in between.',
  },
  {
    slug: 'wetland',
    name: 'Beels & Bird Wetlands',
    nameBn: 'বিল',
    group: 'nature',
    icon: 'bird',
    art: 'haor',
    tagline: 'Where the winter migrations land.',
    description:
      'Beels are permanent or semi-permanent freshwater bodies, and the big ones — Chalan Beel, Baikka Beel, Hakaluki — are the country’s most reliable birdwatching, especially between December and February.',
  },
  {
    slug: 'forest',
    name: 'Forests',
    nameBn: 'বন',
    group: 'nature',
    icon: 'tree',
    art: 'forest',
    tagline: 'Mangrove, sal and semi-evergreen — three very different woodlands.',
    description:
      'Bangladesh’s forests fall into three families: the Sundarbans mangroves in the south-west, the red-soil sal tracts of Madhupur and Bhawal, and the mixed evergreen hill forest of Sylhet and the Hill Tracts.',
  },
  {
    slug: 'national-park',
    name: 'National Parks',
    nameBn: 'জাতীয় উদ্যান',
    group: 'nature',
    icon: 'tree',
    art: 'forest',
    tagline: 'Formally protected landscapes with trails and guides.',
    description:
      'Bangladesh has designated a growing list of national parks, from Lawachara and Satchari in the north-east to Nijhum Dwip in the estuary and Himchari on the coast. Most have Forest Department guides, and hiring one is usually worth it.',
  },
  {
    slug: 'wildlife',
    name: 'Wildlife & Sanctuaries',
    nameBn: 'বন্যপ্রাণী',
    group: 'nature',
    icon: 'bird',
    art: 'mangrove',
    tagline: 'Tigers, gibbons, dolphins and a very long bird list.',
    description:
      'The Bengal tiger of the Sundarbans is the headline, but the realistic wildlife of a Bangladeshi trip is hoolock gibbons at Lawachara, spotted deer at Nijhum Dwip and Char Kukri-Mukri, Ganges river dolphins in the Halda and Sundarbans channels, and around 700 recorded bird species.',
  },
  {
    slug: 'tea-garden',
    name: 'Tea Gardens',
    nameBn: 'চা বাগান',
    group: 'nature',
    icon: 'tea',
    art: 'tea',
    tagline: 'Terraced estates in Sylhet, and flat-land smallholdings in the far north.',
    description:
      'Tea has been grown here since Malnichhara was planted in 1854. Moulvibazar and Habiganj hold the classic shaded terraces; Panchagarh, since the 2000s, has developed an entirely different flat-land smallholder model.',
  },
  {
    slug: 'viewpoint',
    name: 'Viewpoints',
    nameBn: 'দৃশ্যপট',
    group: 'nature',
    icon: 'eye',
    art: 'hills',
    tagline: 'Ridges, hilltops and the places you go for one specific view.',
    description:
      'Some destinations exist for a single sightline: Nilgiri above the clouds, Sajek at dawn, Tetulia when Kanchenjunga is out, and the Chandranath ridge with the Bay of Bengal on one side and the plain on the other.',
  },

  /* ─────────────────────────── HERITAGE ─────────────────────────── */
  {
    slug: 'archaeological',
    name: 'Archaeological Sites',
    nameBn: 'প্রত্নতাত্ত্বিক স্থান',
    group: 'heritage',
    icon: 'column',
    art: 'ruins',
    tagline: 'Excavated cities, monasteries and mounds from 2,500 years of settlement.',
    description:
      'Bangladesh’s archaeology runs from the Iron Age fort city of Wari-Bateshwar through the Mauryan citadel of Mahasthangarh to the Pala monasteries of Paharpur and Mainamati — a continuous record most visitors never expect.',
  },
  {
    slug: 'historical',
    name: 'Historical Places',
    nameBn: 'ঐতিহাসিক স্থান',
    group: 'heritage',
    icon: 'scroll',
    art: 'mansion',
    tagline: 'Places where something happened that still matters.',
    description:
      'Battlefields, treaty grounds, colonial administrative buildings, ports and the sites of political turning points — from Isa Khan’s Sonargaon to the mango grove at Mujibnagar.',
  },
  {
    slug: 'palace',
    name: 'Palaces',
    nameBn: 'রাজপ্রাসাদ',
    group: 'heritage',
    icon: 'crown',
    art: 'mansion',
    tagline: 'Nawabi and princely architecture, mostly nineteenth century.',
    description:
      'Ahsan Manzil, Tajhat, Uttara Gonobhaban and Shashi Lodge are the grandest survivals — Indo-European hybrids built by families whose wealth came from land revenue, jute, salt or jewels.',
  },
  {
    slug: 'zamindar-bari',
    name: 'Zamindar Houses',
    nameBn: 'জমিদার বাড়ি',
    group: 'heritage',
    icon: 'house',
    art: 'mansion',
    tagline: 'The landlord estates that Partition emptied.',
    description:
      'Every district has them: courtyard mansions with Corinthian columns and terracotta temples in the garden, abandoned after 1947 and now variously restored, repurposed as offices, or standing roofless under a fig tree.',
  },
  {
    slug: 'fort',
    name: 'Forts',
    nameBn: 'দুর্গ',
    group: 'heritage',
    icon: 'shield',
    art: 'fort',
    tagline: 'Mughal river forts built to hold the delta against pirates.',
    description:
      'Bangladesh’s forts are river forts. Lalbagh, Idrakpur, Hajiganj and Sonakanda were built in the seventeenth century to control the waterways around Dhaka against Magh and Portuguese raiders.',
  },
  {
    slug: 'museum',
    name: 'Museums',
    nameBn: 'জাদুঘর',
    group: 'heritage',
    icon: 'scroll',
    art: 'mansion',
    tagline: 'Where the sculpture, the plaques and the manuscripts actually are.',
    description:
      'The Bangladesh National Museum, the Varendra Research Museum in Rajshahi and the site museums at Paharpur and Mainamati hold the objects that make the archaeological sites legible. Visit the museum before the ruin, where you can.',
  },
  {
    slug: 'bridge',
    name: 'Bridges & Structures',
    nameBn: 'সেতু',
    group: 'heritage',
    icon: 'bridge',
    art: 'bridge',
    tagline: 'Crossings that changed the map.',
    description:
      'In a country of rivers, bridges are events. Hardinge (1915), Bangabandhu (1998) and Padma (2022) each redrew how the country moves, and each is a genuine sight in its own right.',
  },
  {
    slug: 'liberation-war',
    name: 'Liberation War Sites',
    nameBn: 'মুক্তিযুদ্ধ',
    group: 'heritage',
    icon: 'flag',
    art: 'ruins',
    tagline: 'The 1971 war, remembered in memorials and museums.',
    description:
      'From the Mujibnagar oath-taking site and the National Martyrs’ Memorial at Savar to the Liberation War Museum in Dhaka and hundreds of local mass-grave memorials, this is the history closest to the surface in Bangladesh.',
  },

  /* ─────────────────────────── FAITH ─────────────────────────── */
  {
    slug: 'mosque',
    name: 'Mosques',
    nameBn: 'মসজিদ',
    group: 'faith',
    icon: 'dome',
    art: 'mosque',
    tagline: 'Sultanate brick, Mughal stone and the sixty-domed hall at Bagerhat.',
    description:
      'Bengal developed its own mosque architecture — curved cornices, terracotta ornament, multi-domed hypostyle halls — quite distinct from Delhi. Shat Gambuj, Choto Sona, Kusumba and Atia are the essential four.',
  },
  {
    slug: 'temple',
    name: 'Temples',
    nameBn: 'মন্দির',
    group: 'faith',
    icon: 'temple',
    art: 'temple',
    tagline: 'Terracotta facades, navaratna towers and Shakti pithas.',
    description:
      'Bengali temple architecture is unlike anywhere else in India: chala roofs copied from thatched huts, ratna towers, and brick surfaces carved into narrative panels. Kantajew and Puthia are the two you should not miss.',
  },
  {
    slug: 'buddhist',
    name: 'Buddhist Sites',
    nameBn: 'বৌদ্ধ স্থাপনা',
    group: 'faith',
    icon: 'stupa',
    art: 'stupa',
    tagline: 'Pala monasteries in the north, living Theravada in the south-east.',
    description:
      'Two distinct traditions: the ruined Mahayana monastic universities of Paharpur, Mainamati and Bikrampur, and the living Theravada Buddhism of the Chittagong Hill Tracts, Ramu and the Rakhine coastal villages.',
  },
  {
    slug: 'shrine',
    name: 'Shrines & Dargahs',
    nameBn: 'মাজার',
    group: 'faith',
    icon: 'dome',
    art: 'mosque',
    tagline: 'Sufi tombs, and the festivals that fill them.',
    description:
      'The dargahs of Shah Jalal, Shah Paran, Khan Jahan Ali and Bayazid Bostami, and the shrine of the Baul saint Lalon at Cheuria, are living institutions with their own music, gatherings and annual urs.',
  },
  {
    slug: 'church',
    name: 'Churches',
    nameBn: 'গির্জা',
    group: 'faith',
    icon: 'cross',
    art: 'mansion',
    tagline: 'Portuguese, Armenian and Anglican survivals.',
    description:
      'Bangladesh’s Christian heritage runs from the seventeenth-century Portuguese churches of Bandel and Tejgaon through the Armenian Church in Old Dhaka to the great red-brick Oxford Mission church at Barishal.',
  },

  /* ─────────────────────────── CULTURE ─────────────────────────── */
  {
    slug: 'cultural',
    name: 'Cultural Landmarks',
    nameBn: 'সাংস্কৃতিক নিদর্শন',
    group: 'culture',
    icon: 'mask',
    art: 'mansion',
    tagline: 'The places where Bengali culture was actually made.',
    description:
      'Tagore’s writing houses at Shilaidaha and Shahzadpur, Lalon’s shrine, S. M. Sultan’s studio in Narail, Nazrul’s Trishal — places that produced work rather than commemorating it.',
  },
  {
    slug: 'village',
    name: 'Villages & Crafts',
    nameBn: 'গ্রাম ও কারুশিল্প',
    group: 'culture',
    icon: 'basket',
    art: 'field',
    tagline: 'Weaving, pottery, boatbuilding and embroidery you can watch being done.',
    description:
      'Jamdani at Rupganj, nakshi kantha in Jamalpur, shital pati in Sylhet, Tangail sarees at Pathrail, pottery at Bijoypur — living crafts, several with Geographical Indication status.',
  },
  {
    slug: 'market',
    name: 'Markets & Haats',
    nameBn: 'হাট-বাজার',
    group: 'culture',
    icon: 'basket',
    art: 'market',
    tagline: 'Floating guava markets, mango wholesale and the cloth haats.',
    description:
      'A Bangladeshi haat is a scheduled event, not a permanent shop. Bhimruli on the water, Kansat for mangoes, Shahzadpur and Babur Hat for cloth — go early and go on the right day.',
  },

  /* ─────────────────────────── LEISURE ─────────────────────────── */
  {
    slug: 'park',
    name: 'Parks & Gardens',
    nameBn: 'উদ্যান',
    group: 'leisure',
    icon: 'leaf',
    art: 'garden',
    tagline: 'City greens, botanical gardens and Mughal pleasure grounds.',
    description:
      'Ramna Park and the Botanical Garden in Dhaka, the Padma promenade in Rajshahi and the riverside walk in Mymensingh are where the cities breathe.',
  },
  {
    slug: 'eco-park',
    name: 'Eco-Parks',
    nameBn: 'ইকো পার্ক',
    group: 'leisure',
    icon: 'leaf',
    art: 'forest',
    tagline: 'Managed forest areas with trails, towers and picnic grounds.',
    description:
      'Sitakunda, Madhutila, Banshkhali and the Jamuna eco-park sit between a national park and a day-out venue — walkable, family-friendly, and busiest on Fridays.',
  },
  {
    slug: 'amusement',
    name: 'Theme Parks',
    nameBn: 'বিনোদন পার্ক',
    group: 'leisure',
    icon: 'ferris',
    art: 'garden',
    tagline: 'Where Bangladeshi families actually spend a day out.',
    description:
      'Fantasy Kingdom, Nandan, Bhinno Jagat, Foy’s Lake and Dream Holiday Park are large, well-used and genuinely part of the country’s leisure culture, whatever a guidebook might say.',
  },
  {
    slug: 'resort',
    name: 'Resort Destinations',
    nameBn: 'রিসোর্ট',
    group: 'leisure',
    icon: 'bed',
    art: 'garden',
    tagline: 'The weekend-break belt around the big cities.',
    description:
      'Gazipur’s forest resorts, the Sreemangal tea-estate bungalows and the Cox’s Bazar Marine Drive properties are destinations in themselves — the point of the trip rather than a place to sleep.',
  },
];

export const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

export const categoryGroups = [
  { slug: 'nature', name: 'Nature', nameBn: 'প্রকৃতি', note: 'Coast, hills, forest, wetland and river.' },
  { slug: 'heritage', name: 'Heritage', nameBn: 'ঐতিহ্য', note: 'Archaeology, palaces, forts and the 1971 war.' },
  { slug: 'faith', name: 'Faith', nameBn: 'ধর্মীয়', note: 'Mosques, temples, shrines, stupas and churches.' },
  { slug: 'culture', name: 'Culture', nameBn: 'সংস্কৃতি', note: 'Crafts, markets and where the writing happened.' },
  { slug: 'leisure', name: 'Leisure', nameBn: 'অবকাশ', note: 'Parks, resorts and days out.' },
] as const;
