/**
 * SEO helpers — titles, descriptions and JSON-LD.
 *
 * Everything here is pure: given data, it returns strings. Pages pass the
 * result to `Base.astro`, which renders the head.
 */
import type { Place, District, Division, Category, Collection } from './types';

export const SITE = {
  name: 'Ghuro Bangladesh',
  nameBn: 'ঘুরো বাংলাদেশ',
  tagline: 'Discover Bangladesh, One Place at a Time.',
  url: 'https://ghurobangladesh.com',
  locale: 'en_GB',
  twitter: '@ghurobangladesh',
  description:
    'A field atlas of Bangladesh: 300+ researched destinations across all 8 divisions and 64 districts, with honest travel notes, seasons, routes and maps.',
} as const;

/** Trim a description to a length search engines will actually show. */
export function clamp(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '') + '…';
}

export function canonical(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return new URL(p === '/' ? '/' : p.replace(/\/+$/, ''), SITE.url).href;
}

/** Path to a place's artwork, used for both the page and its OG image. */
export function artPath(art: { key: string; seed: number; mood?: string }, fallbackMood: string): string {
  return `/images/art/${art.key}-${art.mood ?? fallbackMood}-${art.seed}.svg`;
}

/* ────────────────────────── JSON-LD ────────────────────────── */

type Json = Record<string, unknown>;

export function organisationLd(): Json {
  return {
    '@type': 'Organization',
    '@id': `${SITE.url}/#organisation`,
    name: SITE.name,
    alternateName: SITE.nameBn,
    url: SITE.url,
    slogan: SITE.tagline,
    description: SITE.description,
    areaServed: { '@type': 'Country', name: 'Bangladesh' },
  };
}

export function websiteLd(): Json {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: ['en', 'bn'],
    publisher: { '@id': `${SITE.url}/#organisation` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbLd(trail: { name: string; href: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonical(item.href),
    })),
  };
}

export function placeLd(place: Place, district: District | undefined, image: string): Json {
  const ld: Json = {
    '@type': 'TouristAttraction',
    '@id': `${canonical(`/places/${place.slug}`)}#attraction`,
    name: place.name,
    alternateName: [place.nameBn, ...(place.altNames ?? [])].filter(Boolean),
    description: clamp(place.summary, 300),
    url: canonical(`/places/${place.slug}`),
    image: canonical(image),
    isAccessibleForFree: place.entry?.type === 'free' ? true : undefined,
    touristType: place.tags.slice(0, 6),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BD',
      addressRegion: district?.name ?? place.district,
      addressLocality: place.upazila ?? district?.name,
    },
  };
  if (place.coords) {
    ld.geo = {
      '@type': 'GeoCoordinates',
      latitude: place.coords.lat,
      longitude: place.coords.lng,
    };
  }
  if (place.hours) ld.openingHours = place.hours;
  if (place.website) ld.sameAs = [place.website];
  return ld;
}

export function collectionLd(
  title: string,
  description: string,
  path: string,
  items: { name: string; slug: string }[]
): Json {
  return {
    '@type': 'CollectionPage',
    name: title,
    description: clamp(description, 300),
    url: canonical(path),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.slice(0, 50).map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: canonical(`/places/${item.slug}`),
      })),
    },
  };
}

export function itineraryLd(collection: Collection, places: { name: string; slug: string }[]): Json {
  return {
    '@type': 'TouristTrip',
    name: collection.title,
    description: clamp(collection.description.join(' '), 300),
    url: canonical(`/collections/${collection.slug}`),
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: places.length,
      itemListElement: places.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'TouristAttraction', name: p.name, url: canonical(`/places/${p.slug}`) },
      })),
    },
  };
}

export function faqLd(items: { q: string; a: string }[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

/** Wrap one or more nodes into a single @graph document. */
export function graph(nodes: Json[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
}

/* ────────────────────────── Page title helpers ────────────────────────── */

export function placeTitle(place: Place, district?: District): string {
  return `${place.name} — ${district?.name ?? place.district}, Bangladesh`;
}

export function districtTitle(district: District): string {
  return `${district.name} District — What to See and Do`;
}

export function divisionTitle(division: Division): string {
  return `${division.name} Division — Travel Guide`;
}

export function categoryTitle(category: Category): string {
  return `${category.name} in Bangladesh`;
}
