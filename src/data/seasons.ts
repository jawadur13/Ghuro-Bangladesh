import type { Season } from '@lib/types';

/**
 * Bangladesh's six-season calendar (ষড়ঋতু), mapped onto Gregorian months.
 *
 * The traditional Bengali seasons are two months each and start mid-month; the
 * `months` arrays below round to whole Gregorian months, which is what a
 * traveller planning a trip actually needs.
 */
export const seasons: Season[] = [
  {
    slug: 'winter',
    name: 'Winter',
    nameBn: 'শীত',
    bengaliSeason: 'Shit',
    months: [12, 1, 2],
    tagline: 'The travel season. Clear skies, cool mornings, everything open.',
    description:
      'From December to February the monsoon water has drained, the air is dry, and daytime temperatures across most of the country sit between 18 and 26°C. This is when the haors turn to paddy, migratory birds arrive in the wetlands in tens of thousands, and the date-palm sap runs for gur. It is also peak domestic travel season — book ahead for Cox’s Bazar, Sajek and Sundarbans boats.',
    goodFor: [
      'Sundarbans boat trips — the best months by a wide margin',
      'Birdwatching at Tanguar, Hakaluki, Baikka Beel and Chalan Beel',
      'The Chittagong Hill Tracts, when the roads are dry and the views clear',
      'Kanchenjunga from Tetulia (best in late autumn, still possible in December)',
      'Archaeology and long walking days without heat',
      'Khejur gur, pitha and the winter sweet season',
    ],
    watchOut: [
      'Dense morning fog can delay launches, flights and highway travel in January',
      'Northern districts get genuinely cold at night — carry warm layers',
      'Waterfalls are at their weakest; Nafakhum and Hamham underwhelm',
      'The most crowded season at every major destination',
    ],
  },
  {
    slug: 'spring',
    name: 'Spring',
    nameBn: 'বসন্ত',
    bengaliSeason: 'Boshonto',
    months: [2, 3],
    tagline: 'Shimul and palash in flower, and the last comfortable weeks.',
    description:
      'A short, lovely window. Late February and March bring flowering trees — the red silk-cotton (shimul) and palash in particular — and the Shimul Bagan grove in Sunamganj becomes a genuine destination for a few weeks. Temperatures rise through March but remain manageable, and Pohela Falgun and Ekushey February fill Dhaka with events.',
    goodFor: [
      'Shimul Bagan at Sunamganj, in bloom for roughly three weeks',
      'The Ekushey Book Fair and Pohela Falgun in Dhaka',
      'Tea gardens before the first flush',
      'Dol Purnima at the Lalon shrine in Kushtia',
    ],
    watchOut: [
      'Nor’wester (kalboishakhi) squalls can begin in late March',
      'Haze increases and long-distance visibility drops',
      'River levels are at their lowest — some boat routes are impassable',
    ],
  },
  {
    slug: 'summer',
    name: 'Summer',
    nameBn: 'গ্রীষ্ম',
    bengaliSeason: 'Grishmo',
    months: [4, 5],
    tagline: 'Hot and hazy, but this is when the mangoes and litchis come in.',
    description:
      'April and May are the hottest months, with Chuadanga, Rajshahi and Jashore regularly above 40°C, and sudden violent nor’wester storms. It is a poor time for walking heritage sites and a very good time for orchards: litchi in Dinajpur and Ishwardi from mid-May, and mango in Chapai Nawabganj from late May onwards.',
    goodFor: [
      'Litchi orchards in Dinajpur and Ishwardi (mid-May onward)',
      'The start of mango season at Kansat and Shibganj',
      'Hill districts, which stay several degrees cooler',
      'Early-season waterfalls after the first heavy rain',
    ],
    watchOut: [
      'Heat is a genuine health risk — plan for early mornings and long middays indoors',
      'Nor’wester squalls disrupt river and air travel with little warning',
      'Pre-monsoon cyclone risk in the Bay through April and May',
      'Coastal swimming is unsafe once the sea gets up',
    ],
  },
  {
    slug: 'monsoon',
    name: 'Monsoon',
    nameBn: 'বর্ষা',
    bengaliSeason: 'Borsha',
    months: [6, 7, 8],
    tagline: 'The most dramatic season — and the only time some places exist.',
    description:
      'June to August is when Bangladesh becomes itself. The haors fill into inland seas, Ratargul’s swamp forest floods to the canopy, the waterfalls of Bandarban and Khagrachhari run at full force, and the guava canals of Swarupkathi open their floating markets. It is also difficult: roads flood, boats are the only transport in large areas, and leeches and mud come with the territory.',
    goodFor: [
      'Tanguar Haor, Nikli and the Mithamoin haor road at full flood',
      'Ratargul swamp forest — only navigable by boat when the water is high',
      'Nafakhum, Richang, Hamham, Sahasradhara and every other waterfall',
      'Bhimruli and Atghar-Kuriana floating guava markets (July–September)',
      'Hilsa season on the Padma and Meghna',
      'Tea gardens at their greenest',
    ],
    watchOut: [
      'Serious flooding in the haor basin and the northern chars — check before travelling',
      'Hill Tracts landslides can close roads for days',
      'Sea travel to Saint Martin’s and most coastal boat routes stops entirely',
      'Leeches in the Sylhet and Hill Tracts forests; carry salt and long socks',
    ],
  },
  {
    slug: 'autumn',
    name: 'Autumn',
    nameBn: 'শরৎ',
    bengaliSeason: 'Shorot',
    months: [9, 10],
    tagline: 'Kash flowers, white cloud, and the clearest skies of the year.',
    description:
      'September and October are underrated. The rain eases, the air clears dramatically, and the riverbanks and chars fill with kash — tall white grass flowers that are the visual signature of the Bengali autumn. Durga Puja falls in this window, and the Kanchenjunga view from Tetulia is at its most likely in October.',
    goodFor: [
      'Kash flowers on the char lands, especially along the Jamuna and Padma',
      'Kanchenjunga from Tetulia and Banglabandha',
      'Durga Puja in Dhaka, Chattogram, Sylhet and the temple towns',
      'Waterfalls still running, roads mostly passable',
      'Photography — the clearest light of the year',
    ],
    watchOut: [
      'Post-monsoon cyclone risk in the Bay through October and November',
      'The annual hilsa fishing ban (usually 22 days in October) closes the fish markets',
      'Some haor water levels drop enough to strand boats',
    ],
  },
  {
    slug: 'late-autumn',
    name: 'Late Autumn',
    nameBn: 'হেমন্ত',
    bengaliSeason: 'Hemonto',
    months: [11],
    tagline: 'Harvest. The quietest, most golden month in rural Bangladesh.',
    description:
      'November is the aman rice harvest, and the countryside turns gold. It is cool, dry, clear and far less crowded than December and January — arguably the single best month to travel in Bangladesh if you want the winter weather without the winter crowds. Nabanna, the harvest festival, falls in this season.',
    goodFor: [
      'The aman harvest across the whole country',
      'Everything winter is good for, with fewer people',
      'Kanchenjunga views, still reliable in early November',
      'The start of the Sundarbans season',
      'Tea gardens, haors draining, and comfortable all-day walking',
    ],
    watchOut: [
      'Early-season cyclone risk persists through mid-November',
      'Nights get cold in the north from late in the month',
    ],
  },
];

export const seasonBySlug = new Map(seasons.map((s) => [s.slug, s]));

/** Month index (1–12) → the seasons that cover it. */
export const seasonsByMonth: Record<number, string[]> = seasons.reduce(
  (acc, s) => {
    for (const m of s.months) (acc[m] ||= []).push(s.slug);
    return acc;
  },
  {} as Record<number, string[]>
);

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
