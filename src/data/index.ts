/**
 * Data aggregation layer.
 *
 * Everything the site renders is assembled here from the plain TypeScript
 * modules in `src/data/`. There is no database: the derived indexes below are
 * built once at module load and reused across every page during the static
 * build, which keeps 300+ destination pages cheap to generate.
 */
import type {
  Category,
  CategorySlug,
  District,
  Division,
  DivisionSlug,
  Place,
  SearchDoc,
  Tag,
} from '@lib/types';

import { divisions, divisionBySlug } from './divisions';
import { districts, districtBySlug } from './districts';
import { categories, categoryBySlug, categoryGroups } from './categories';
import { tags, tagBySlug, featuredTags } from './tags';
import { seasons, seasonBySlug, seasonsByMonth, MONTHS, MONTHS_SHORT } from './seasons';
import { collections, collectionBySlug } from './collections';

import { dhakaPlaces } from './places/dhaka';
import { chattogramPlaces } from './places/chattogram';
import { sylhetPlaces } from './places/sylhet';
import { khulnaPlaces } from './places/khulna';
import { rajshahiPlaces } from './places/rajshahi';
import { rangpurPlaces } from './places/rangpur';
import { barishalPlaces } from './places/barishal';
import { mymensinghPlaces } from './places/mymensingh';

export {
  divisions,
  divisionBySlug,
  districts,
  districtBySlug,
  categories,
  categoryBySlug,
  categoryGroups,
  tags,
  tagBySlug,
  featuredTags,
  seasons,
  seasonBySlug,
  seasonsByMonth,
  collections,
  collectionBySlug,
  MONTHS,
  MONTHS_SHORT,
};

/* ────────────────────────── Places ────────────────────────── */

/** Every destination in the atlas, sorted by renown then alphabetically. */
export const places: Place[] = [
  ...dhakaPlaces,
  ...chattogramPlaces,
  ...sylhetPlaces,
  ...khulnaPlaces,
  ...rajshahiPlaces,
  ...rangpurPlaces,
  ...barishalPlaces,
  ...mymensinghPlaces,
].sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name));

export const placeBySlug = new Map(places.map((p) => [p.slug, p]));

/* ────────────────────────── Derived indexes ────────────────────────── */

function groupBy<T, K extends string>(items: T[], key: (item: T) => K | K[]): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    for (const one of Array.isArray(k) ? k : [k]) {
      const bucket = map.get(one);
      if (bucket) bucket.push(item);
      else map.set(one, [item]);
    }
  }
  return map;
}

export const placesByDivision = groupBy(places, (p) => p.division);
export const placesByDistrict = groupBy(places, (p) => p.district);
export const placesByCategory = groupBy(places, (p) => p.categories as CategorySlug[]);
export const placesByTag = groupBy(places, (p) => p.tags);
export const districtsByDivision = groupBy(districts, (d) => d.division);

/** Places whose `bestTime.months` includes the given 1-indexed month. */
export function placesInMonth(month: number): Place[] {
  return places.filter((p) => p.bestTime?.months.includes(month));
}

/** Places tagged for a given season, via their explicit `seasons` field. */
export function placesInSeason(season: string): Place[] {
  return places.filter((p) => p.seasons?.includes(season as never));
}

/* ────────────────────────── Accessors ────────────────────────── */

export function getDivision(slug: string): Division | undefined {
  return divisionBySlug.get(slug as DivisionSlug);
}

export function getDistrict(slug: string): District | undefined {
  return districtBySlug.get(slug);
}

export function getCategory(slug: string): Category | undefined {
  return categoryBySlug.get(slug as CategorySlug);
}

export function getTag(slug: string): Tag | undefined {
  return tagBySlug.get(slug);
}

export function getPlace(slug: string): Place | undefined {
  return placeBySlug.get(slug);
}

export function placesIn(divisionSlug: string): Place[] {
  return placesByDivision.get(divisionSlug as DivisionSlug) ?? [];
}

export function placesInDistrict(districtSlug: string): Place[] {
  return placesByDistrict.get(districtSlug) ?? [];
}

export function placesInCategory(categorySlug: string): Place[] {
  return placesByCategory.get(categorySlug as CategorySlug) ?? [];
}

export function placesWithTag(tagSlug: string): Place[] {
  return placesByTag.get(tagSlug) ?? [];
}

export function districtsIn(divisionSlug: string): District[] {
  return districtsByDivision.get(divisionSlug as DivisionSlug) ?? [];
}

/** Resolve a list of place slugs, silently dropping any that no longer exist. */
export function resolvePlaces(slugs: string[] | undefined): Place[] {
  if (!slugs) return [];
  const out: Place[] = [];
  for (const s of slugs) {
    const p = placeBySlug.get(s);
    if (p) out.push(p);
  }
  return out;
}

/* ────────────────────────── Curated surfaces ────────────────────────── */

export const featuredPlaces = places.filter((p) => p.featured);
export const hiddenGems = places.filter((p) => p.hiddenGem);
export const unescoPlaces = places.filter((p) => p.unesco);

/** The "popular" surface: renown 4 and above, excluding declared hidden gems. */
export const popularPlaces = places.filter((p) => p.popularity >= 4 && !p.hiddenGem);

/* ────────────────────────── Geo helpers ────────────────────────── */

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Nearest destinations to a given place, by great-circle distance.
 * Places without coordinates fall back to their district centre.
 */
export function nearbyPlaces(place: Place, limit = 6, maxKm = 120): Array<Place & { km: number }> {
  const origin = place.coords ?? getDistrict(place.district)?.coords;
  if (!origin) return [];

  const out: Array<Place & { km: number }> = [];
  for (const other of places) {
    if (other.slug === place.slug) continue;
    const point = other.coords ?? getDistrict(other.district)?.coords;
    if (!point) continue;
    const km = distanceKm(origin, point);
    if (km <= maxKm) out.push({ ...other, km });
  }
  out.sort((a, b) => a.km - b.km || b.popularity - a.popularity);
  return out.slice(0, limit);
}

/**
 * Related destinations for a place: curated `related` slugs first, topped up
 * with same-district and then nearby places so the section is never thin.
 */
export function relatedPlaces(place: Place, limit = 6): Place[] {
  const seen = new Set<string>([place.slug]);
  const out: Place[] = [];

  const push = (p: Place | undefined) => {
    if (!p || seen.has(p.slug) || out.length >= limit) return;
    seen.add(p.slug);
    out.push(p);
  };

  for (const slug of place.related ?? []) push(placeBySlug.get(slug));

  if (out.length < limit) {
    for (const p of placesInDistrict(place.district).sort((a, b) => b.popularity - a.popularity)) {
      push(p);
    }
  }
  if (out.length < limit) {
    for (const p of nearbyPlaces(place, limit * 2)) push(p);
  }
  if (out.length < limit) {
    const primary = place.categories[0];
    for (const p of placesInCategory(primary).sort((a, b) => b.popularity - a.popularity)) push(p);
  }
  return out;
}

/* ────────────────────────── Counts ────────────────────────── */

export const stats = {
  places: places.length,
  districts: districts.length,
  divisions: divisions.length,
  categories: categories.length,
  hiddenGems: hiddenGems.length,
  unesco: unescoPlaces.length,
  collections: collections.length,
  districtsCovered: new Set(places.map((p) => p.district)).size,
};

/* ────────────────────────── Search index ────────────────────────── */

/** Default mood per art family — mirrors FAMILY in scripts/generate-artwork.mjs. */
const ART_MOOD: Record<string, string> = {
  sea: 'dusk', island: 'day', hills: 'dawn', forest: 'monsoon', mangrove: 'dawn',
  river: 'dusk', lake: 'day', haor: 'monsoon', waterfall: 'monsoon', tea: 'monsoon',
  ruins: 'day', mosque: 'dusk', temple: 'dawn', stupa: 'day', mansion: 'dusk',
  fort: 'day', city: 'dusk', bridge: 'dusk', field: 'dawn', market: 'day',
  village: 'dawn', garden: 'day',
};

/**
 * The client search index is generated at build time and shipped as JSON.
 * Field names are single letters to keep the payload small — see `SearchDoc`.
 */
export function buildSearchDocs(): SearchDoc[] {
  return places.map((p) => {
    const district = getDistrict(p.district);
    const division = getDivision(p.division);
    return {
      i: p.slug,
      n: p.name,
      b: p.nameBn,
      a: (p.altNames ?? []).join(' '),
      d: district?.name ?? p.district,
      db: district?.nameBn ?? '',
      v: division?.name ?? p.division,
      c: p.categories.map((c) => getCategory(c)?.name ?? c).join(' '),
      t: p.tags.map((t) => getTag(t)?.name ?? t).join(' '),
      s: `${p.tagline} ${p.summary}`,
      p: p.popularity,
      g: p.hiddenGem ? 1 : 0,
      k: p.art.key,
      f: `${p.art.key}-${p.art.mood ?? ART_MOOD[p.art.key] ?? 'day'}-${p.art.seed}.svg`,
      sd: p.district,
      sv: p.division,
    };
  });
}
