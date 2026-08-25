import type { IconKey } from './icons';

/**
 * Ghuro Bangladesh — core domain model.
 *
 * Everything the site renders comes from plain TypeScript data modules under
 * `src/data/`. There is no database and no CMS: adding a destination means
 * appending an object to a `src/data/places/<division>.ts` file. The types
 * below are the contract, and `scripts/validate-data.mjs` enforces them at
 * build time (referential integrity, slug uniqueness, coordinate sanity).
 */

/* ────────────────────────────── Geography ────────────────────────────── */

export type DivisionSlug =
  | 'dhaka'
  | 'chattogram'
  | 'rajshahi'
  | 'khulna'
  | 'barishal'
  | 'sylhet'
  | 'rangpur'
  | 'mymensingh';

export interface Division {
  slug: DivisionSlug;
  name: string;
  nameBn: string;
  /** Former/alternate spellings — indexed for search. */
  altNames?: string[];
  /** Name of the divisional headquarters city. */
  headquarters: string;
  /** One-line editorial hook used on cards and the division hero. */
  tagline: string;
  /** 1–2 sentences. Card + meta description. */
  summary: string;
  /** Long-form paragraphs for the division page. */
  description: string[];
  /** What travel in this region actually feels like. */
  character: string[];
  /** Signature themes travellers come here for. */
  themes: { title: string; note: string; icon: IconKey }[];
  /** Districts, in the order they should be listed. */
  districts: string[];
  /** Approximate area in km² (Bangladesh Bureau of Statistics figures, rounded). */
  areaKm2: number;
  /** Boundary-name key used to join against `src/data/geo/*.json`. */
  geoKey: string;
  /** Editorial accent for maps and division chrome. */
  hue: 'delta' | 'terracotta' | 'marigold' | 'indigo' | 'sundari';
  art: ArtRef;
}

export interface District {
  slug: string;
  name: string;
  nameBn: string;
  altNames?: string[];
  division: DivisionSlug;
  /** Boundary-name key used to join against `src/data/geo/districts.json`. */
  geoKey: string;
  /** One-line editorial hook. */
  tagline: string;
  /** 1–2 sentences. Card + meta description. */
  summary: string;
  /** Long-form paragraphs for the district page. */
  description: string[];
  /** Specific, non-generic notes: what defines this district. */
  knownFor: string[];
  /** Approximate area in km² (rounded). */
  areaKm2?: number;
  /** Geographic centre — used for map markers and distance sorting. */
  coords: Coords;
  /** Districts that physically border this one (slugs). */
  borders: string[];
  /** Best-known local food, where there is a genuine speciality. */
  speciality?: string;
  art: ArtRef;
}

export interface Coords {
  lat: number;
  lng: number;
}

/* ────────────────────────── Taxonomy ────────────────────────── */

export type CategorySlug =
  | 'beach'
  | 'island'
  | 'hill'
  | 'forest'
  | 'wildlife'
  | 'waterfall'
  | 'river'
  | 'lake'
  | 'haor'
  | 'tea-garden'
  | 'archaeological'
  | 'historical'
  | 'palace'
  | 'zamindar-bari'
  | 'fort'
  | 'mosque'
  | 'temple'
  | 'buddhist'
  | 'church'
  | 'shrine'
  | 'museum'
  | 'liberation-war'
  | 'park'
  | 'eco-park'
  | 'national-park'
  | 'amusement'
  | 'resort'
  | 'viewpoint'
  | 'bridge'
  | 'market'
  | 'cultural'
  | 'village'
  | 'wetland';

export interface Category {
  slug: CategorySlug;
  name: string;
  nameBn: string;
  /** Grouping used by the category index and filter UI. */
  group: 'nature' | 'heritage' | 'faith' | 'culture' | 'leisure';
  tagline: string;
  description: string;
  icon: IconKey;
  /** Artwork family used when a place in this category has no explicit art key. */
  art: ArtKey;
}

export type TagSlug = string;

export interface Tag {
  slug: TagSlug;
  name: string;
  nameBn?: string;
  /** Shown on the tag index; keeps tag pages from feeling like bare lists. */
  description: string;
  /** Tags surfaced in the primary "Travel by interest" navigation. */
  featured?: boolean;
}

/* ────────────────────────── Seasons & travel ────────────────────────── */

export type SeasonSlug = 'winter' | 'spring' | 'summer' | 'monsoon' | 'autumn' | 'late-autumn';

export interface Season {
  slug: SeasonSlug;
  name: string;
  nameBn: string;
  /** Bengali six-season name, transliterated. */
  bengaliSeason: string;
  /** 1-indexed calendar months this season roughly covers. */
  months: number[];
  tagline: string;
  description: string;
  /** What this season is genuinely good for, travel-wise. */
  goodFor: string[];
  /** Honest caveats. */
  watchOut: string[];
}

export type TransportMode =
  | 'bus'
  | 'train'
  | 'launch'
  | 'boat'
  | 'flight'
  | 'car'
  | 'cng'
  | 'rickshaw'
  | 'walk'
  | 'ferry'
  | 'trek';

export interface RouteLeg {
  /** Where this leg starts, e.g. "Dhaka (Sayedabad)". */
  from: string;
  /** Where it ends. */
  to: string;
  modes: TransportMode[];
  /** Plain-language description of the leg. */
  note: string;
  /** Rough duration in hours, as a range. Omit rather than guess. */
  hours?: [number, number];
}

export type TripLength = 'half-day' | 'day' | 'overnight' | 'multi-day';

/* ────────────────────────── Artwork ────────────────────────── */

/**
 * Ghuro Bangladesh ships procedurally generated editorial artwork instead of
 * stock photography: every destination gets a layered SVG scene composed from
 * a landscape family (`ArtKey`) plus a deterministic `seed` that varies the
 * horizon, silhouettes and palette. See `scripts/generate-artwork.mjs`.
 */
export type ArtKey =
  | 'sea'
  | 'island'
  | 'hills'
  | 'forest'
  | 'mangrove'
  | 'river'
  | 'lake'
  | 'haor'
  | 'waterfall'
  | 'tea'
  | 'ruins'
  | 'mosque'
  | 'temple'
  | 'stupa'
  | 'mansion'
  | 'fort'
  | 'city'
  | 'bridge'
  | 'field'
  | 'market'
  | 'village'
  | 'garden';

export interface ArtRef {
  key: ArtKey;
  /** Any integer; drives the deterministic variation. */
  seed: number;
  /** Optional palette override, otherwise derived from the art key. */
  mood?: 'dawn' | 'day' | 'dusk' | 'night' | 'monsoon';
}

export interface Video {
  title: string;
  type: 'youtube';
  /** YouTube video id only — never a full URL, so embeds stay privacy-friendly. */
  id: string;
  /** Channel or uploader, for attribution. */
  credit?: string;
}

/* ────────────────────────── Destination ────────────────────────── */

export type EntryType = 'free' | 'ticketed' | 'permit' | 'restricted' | 'unknown';

export interface Place {
  /** Stable identifier: `<district-slug>--<place-slug>`. Never reused. */
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  /** Alternate spellings and local names — all indexed for search. */
  altNames?: string[];

  /** One line, ≤ 95 chars. The hook that appears on the card. */
  tagline: string;
  /** 1–2 sentences for cards, search results and meta descriptions. */
  summary: string;
  /** Long-form paragraphs for the destination page. */
  description: string[];

  division: DivisionSlug;
  district: string;
  upazila?: string;
  /** Human-readable position, e.g. "12 km north of Sreemangal town". */
  locationNote?: string;
  coords?: Coords;
  /**
   * How precise `coords` is.
   *  - `exact`  : the site itself
   *  - `approx` : within a few kilometres
   *  - `area`   : a representative point for a large or diffuse area
   */
  coordPrecision?: 'exact' | 'approx' | 'area';

  /** First entry is the primary category. */
  categories: CategorySlug[];
  tags: TagSlug[];

  /** The single most persuasive reason to make the trip. */
  whyVisit: string;
  highlights?: string[];
  see?: string[];
  do?: string[];

  bestTime?: {
    /** 1-indexed months. */
    months: number[];
    note: string;
  };
  seasons?: SeasonSlug[];
  /** Realistic time on site. */
  duration?: { label: string; hours?: [number, number] };
  tripLength?: TripLength;

  /** Travel legs, coarse to fine. */
  routes?: RouteLeg[];
  /** Nearest town/city with transport connections and hotels. */
  nearestHub?: string;

  entry?: { type: EntryType; note?: string };
  /** Only present where opening hours are stable and publicly documented. */
  hours?: string;
  contact?: { label: string; value: string; href?: string }[];
  website?: string;

  tips?: string[];
  safety?: string[];
  accessibility?: string[];
  stay?: string;
  eat?: string;

  videos?: Video[];
  /** Slugs of related destinations, curated. */
  related?: string[];

  /**
   * Editorial renown, 1–5. Drives default sort and the "popular" surfaces.
   *  5 = nationally iconic · 4 = well known · 3 = regionally known
   *  2 = local favourite · 1 = genuinely obscure
   */
  popularity: 1 | 2 | 3 | 4 | 5;
  hiddenGem?: boolean;
  featured?: boolean;
  unesco?: boolean;
  /** Era or period, for heritage sites, e.g. "8th century CE". */
  period?: string;

  art: ArtRef;
  /** Where the harder facts came from, in plain language. */
  sources?: string[];
  /** Fields we deliberately left blank because we could not verify them. */
  unverified?: string[];
}

/* ────────────────────────── Collections & guides ────────────────────────── */

export interface Collection {
  slug: string;
  title: string;
  titleBn?: string;
  tagline: string;
  description: string[];
  /** Ordered place slugs. */
  places: string[];
  kind: 'route' | 'theme' | 'season' | 'time';
  /** For routes: suggested number of days. */
  days?: number;
  art: ArtRef;
  featured?: boolean;
}

/* ────────────────────────── UI helpers ────────────────────────── */

/* The icon set is the source of truth; see lib/icons.ts. */
export type { IconKey };

/** Shape of one row in the prebuilt client search index. */
export interface SearchDoc {
  i: string; // slug
  n: string; // name
  b: string; // Bengali name
  a: string; // alt names, space-joined
  d: string; // district name
  db: string; // district Bengali name
  v: string; // division name
  c: string; // category names, space-joined
  t: string; // tag names, space-joined
  s: string; // summary + tagline
  p: number; // popularity
  g: 0 | 1; // hidden gem
  k: ArtKey;
  f: string; // resolved artwork filename
  sd: string; // district slug
  sv: DivisionSlug;
}
