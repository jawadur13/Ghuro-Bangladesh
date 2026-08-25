# Ghuro Bangladesh

**Discover Bangladesh, One Place at a Time.**

A field atlas of Bangladesh — **307 researched destinations** across all **8 divisions** and every one of the **64 districts**, with honest travel notes, seasonal guidance, transport routes, an interactive map, and search that works in Bengali and English.

There is **no database**, no CMS and no backend. Every byte of content lives in plain TypeScript files inside `src/data/`, and the whole site compiles to static HTML.

---

## Contents

- [What it is](#what-it-is)
- [Who it is for](#who-it-is-for)
- [Features](#features)
- [Technology](#technology)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [The data model](#the-data-model)
- [Adding a destination](#adding-a-destination)
- [Adding a district or division](#adding-a-district-or-division)
- [Images and artwork](#images-and-artwork)
- [How search works](#how-search-works)
- [The map](#the-map)
- [Running locally](#running-locally)
- [Build and deploy](#build-and-deploy)
- [Scripts reference](#scripts-reference)
- [Quality gates](#quality-gates)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [SEO](#seo)
- [Architectural decisions](#architectural-decisions)
- [Editorial rules](#editorial-rules)
- [Attribution](#attribution)
- [Roadmap](#roadmap)

---

## What it is

*Ghuro* — ঘুরো — means *roam*, or *travel around*.

Most travel writing about Bangladesh cycles through the same eight destinations. This atlas covers the Sundarbans and Cox's Bazar, and it also covers a cast-iron-framed guest house in Mymensingh, a mosque surfaced entirely in broken porcelain in Syedpur, the mango market that runs from four in the morning at Kansat, and the road across the Kishoreganj haor that disappears under open water for four months a year.

Every entry answers six questions:

> What is special? · Why go? · What can I do? · How do I get there? · When should I go? · What should I know before I turn up?

If an entry cannot answer those, it does not belong in the atlas.

**Coverage:**

| | |
| --- | --- |
| Destinations | 307 |
| Divisions | 8 (all) |
| Districts | 64 (all, every one with at least one destination) |
| Categories | 33 |
| Interest tags | 34 |
| Curated collections | 15 |
| UNESCO World Heritage sites | 3 |
| Generated pages | 480 |

---

## Who it is for

1. **Bangladeshis planning domestic travel** — the largest audience. Most can name fifteen districts; this covers all sixty-four, with a tracker for the ones you have been to.
2. **The Bangladeshi diaspora** returning and wanting to go beyond the family district.
3. **Independent international travellers** who need honest logistics: what needs a permit, what only exists in the monsoon, where the sea is unsafe to swim.
4. **Anyone researching Bengal's heritage** — the archaeology, terracotta and Liberation War material is unusually complete.

---

## Features

### Discovery
- **Global search** (`/` or ⌘K) over every destination, district, category and tag — English, **Bengali script**, and historical romanisations (*Chittagong* finds *Chattogram*, *Jessore* finds *Jashore*).
- **"Where should I go?"** — a five-question recommender that scores the whole dataset against your season, time available, interests, party and crowd tolerance, and tells you *why* each result surfaced.
- **Interactive map** of all 64 districts, shaded by destination density, with per-division filtering.
- **Filter and sort** on every listing page: by division, category and interest; sorted by curated order, renown, *least visited first*, name or district.
- **Seasonal browsing** across Bangladesh's six-season calendar, including a "only really worth it in this season" cut.
- **Curated collections** — routes with leg distances, themes, seasonal picks and time-based groupings.
- **Nearby destinations** computed by great-circle distance from real coordinates.

### Content depth
Every destination page carries, where the information could be established: long-form description, why-visit, highlights, things to see, things to do, a best-months strip, seasonal notes, multi-leg transport routes with modes and durations, entry terms, nearest hub, accommodation and food notes, practical tips, **safety warnings**, accessibility notes, video, related destinations, and an explicit list of **what could not be verified**.

### Personal state (no account, no server)
- **Saved places**, grouped by division, with JSON export and import.
- **District tracker** — mark which of the 64 you have visited, with a progress bar and map.
- **Recently viewed**, surfaced in the search dialog.
- **Light / dark theme** with system default, resolved before first paint.

All of it lives in `localStorage` on the visitor's own device. Nothing is transmitted.

---

## Technology

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Astro 5** | Static-first, zero JS by default, content-focused, first-class TypeScript |
| Language | **TypeScript** (strict) | The data model is the contract; the compiler enforces it |
| Styling | **Tailwind CSS 4** tokens + scoped component CSS | `@theme` for design tokens, scoped styles for components — no utility soup in markup |
| Client JS | **Vanilla TypeScript modules** | No framework runtime. 5 KB gzipped shared, 1–3 KB per page module |
| Search | **Hand-rolled index + matcher** | Needs Bengali script, transliteration and multi-token prefix matching in ~2 KB |
| Map | **Pre-projected inline SVG** | No tile server, no map library, no external request, works without JS |
| Images | **Procedurally generated SVG** | No stock photography, no licensing ambiguity, ~14 KB each |
| Fonts | **Self-hosted, subset** | Fraunces, Inter, Noto Sans Bengali — no external font request |
| Data | **TypeScript modules** | Type-checked, diffable, greppable, zero runtime cost |

**Deliberately not used:** any database, any CMS, any ORM, any state library, any UI framework, any map SDK, any analytics, any external API at runtime.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  src/data/*.ts          The atlas. Plain TypeScript objects.   │
│    ├── divisions.ts       8 divisions                          │
│    ├── districts.ts       64 districts                         │
│    ├── categories.ts      33 categories                        │
│    ├── tags.ts            34 interest tags                     │
│    ├── seasons.ts         6 Bengali seasons                    │
│    ├── collections.ts     15 curated routes and themes         │
│    ├── places/*.ts        307 destinations, one file per       │
│    │                      division                             │
│    └── geo/*.json         Pre-projected boundary geometry      │
└──────────────────────────┬─────────────────────────────────────┘
                           │  imported at build time
┌──────────────────────────▼─────────────────────────────────────┐
│  src/data/index.ts       Aggregation layer                     │
│    Derived indexes (by division / district / category / tag),  │
│    great-circle distance, related and nearby resolution,       │
│    search-document construction, counts.                       │
└──────────────────────────┬─────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌──────────────────┐
│ 480 static    │  │ search-index  │  │ 504 SVG artworks │
│ HTML pages    │  │ .json (50 KB  │  │ (generated once) │
│               │  │ gzipped)      │  │                  │
└───────────────┘  └───────┬───────┘  └──────────────────┘
                           │ fetched once, on first search
                   ┌───────▼────────┐
                   │ Client search, │
                   │ filters, quiz, │
                   │ localStorage   │
                   └────────────────┘
```

Every arrow is a build-time step except the last. At runtime the site is static files plus 5 KB of JavaScript.

---

## Project structure

```
ghuro-bangladesh/
├── src/
│   ├── data/                     ← THE ATLAS. All content lives here.
│   │   ├── index.ts                Aggregation, derived indexes, helpers
│   │   ├── divisions.ts            8 divisions
│   │   ├── districts.ts            64 districts
│   │   ├── categories.ts           33 categories, grouped into 5 families
│   │   ├── tags.ts                 34 interest tags
│   │   ├── seasons.ts              6 Bengali seasons
│   │   ├── collections.ts          15 curated routes and themes
│   │   ├── places/                 307 destinations, one file per division
│   │   │   ├── dhaka.ts              55
│   │   │   ├── chattogram.ts         87
│   │   │   ├── sylhet.ts             42
│   │   │   ├── khulna.ts             28
│   │   │   ├── rajshahi.ts           31
│   │   │   ├── rangpur.ts            27
│   │   │   ├── barishal.ts           19
│   │   │   └── mymensingh.ts         18
│   │   └── geo/                    Pre-projected SVG boundary geometry
│   │       ├── districts.json        Full detail (218 KB) — map page
│   │       ├── districts-lite.json   Coarse (59 KB) — thumbnails
│   │       ├── divisions.json
│   │       └── divisions-lite.json
│   │
│   ├── lib/
│   │   ├── types.ts              The domain model. The contract.
│   │   └── seo.ts                Titles, descriptions, JSON-LD builders
│   │
│   ├── components/
│   │   ├── Logo.astro            The compass-and-meander mark
│   │   ├── Header.astro          Nav, search trigger, theme, mobile menu
│   │   ├── Footer.astro
│   │   ├── Icon.astro            One inline SVG icon set (~70 icons)
│   │   ├── Art.astro             Renders a destination's procedural artwork
│   │   ├── PlaceCard.astro       4 variants: default, compact, feature, row
│   │   ├── DivisionCard.astro
│   │   ├── BangladeshMap.astro   The inline-SVG map
│   │   ├── SearchDialog.astro    ⌘K / "/" search overlay
│   │   ├── FilterBar.astro       Shared filter and sort control
│   │   ├── PageHero.astro
│   │   ├── SectionHead.astro
│   │   ├── Breadcrumbs.astro
│   │   └── FavButton.astro
│   │
│   ├── layouts/
│   │   └── Base.astro            HTML shell, SEO head, theme bootstrap
│   │
│   ├── pages/                    Routing = file structure
│   │   ├── index.astro                     /
│   │   ├── explore.astro                   /explore
│   │   ├── map.astro                       /map
│   │   ├── search.astro                    /search
│   │   ├── discover.astro                  /discover
│   │   ├── favourites.astro                /favourites
│   │   ├── about.astro                     /about
│   │   ├── 404.astro                       /404
│   │   ├── search-index.json.ts            /search-index.json
│   │   ├── places/[place].astro            /places/:slug        (307)
│   │   ├── districts/index.astro           /districts
│   │   ├── districts/[district].astro      /districts/:slug     (64)
│   │   ├── divisions/index.astro           /divisions
│   │   ├── divisions/[division].astro      /divisions/:slug     (8)
│   │   ├── categories/index.astro          /categories
│   │   ├── categories/[category].astro     /categories/:slug    (33)
│   │   ├── tags/[tag].astro                /tags/:slug          (34)
│   │   ├── collections/index.astro         /collections
│   │   ├── collections/[collection].astro  /collections/:slug   (15)
│   │   ├── seasons/index.astro             /seasons
│   │   └── seasons/[season].astro          /seasons/:slug       (6)
│   │
│   ├── scripts/                  Client TypeScript (progressive enhancement)
│   │   ├── app.ts                  Boot: header, theme, favourites, reveals
│   │   ├── store.ts                localStorage, guarded everywhere
│   │   ├── search.ts               Index loading, folding, scoring
│   │   ├── search-ui.ts            The search dialog
│   │   ├── filters.ts              Filtering and sorting
│   │   ├── discover.ts             The recommender
│   │   ├── favourites-page.ts      Saved places, export/import
│   │   ├── map.ts                  Map hover cards and division filter
│   │   └── tracker.ts              District completion tracker
│   │
│   └── styles/
│       ├── global.css            Design tokens, base, primitives, utilities
│       └── fonts.css             Generated @font-face rules
│
├── public/
│   ├── images/
│   │   ├── art/                  504 generated destination artworks
│   │   └── og/default.png        Default Open Graph card
│   ├── fonts/                    7 self-hosted, subset woff2 files
│   ├── icons/                    PWA icons
│   ├── favicon.svg               Theme-aware favicon
│   ├── site.webmanifest
│   └── robots.txt
│
├── scripts/                      Build and maintenance (Node, run manually)
│   ├── build-geo.mjs             GeoJSON → projected SVG paths
│   ├── generate-artwork.mjs      The procedural artwork compositor
│   ├── generate-assets.mjs       Favicon, PWA icons, manifest, OG image
│   ├── fetch-fonts.mjs           Self-host and subset the typefaces
│   ├── validate-data.mjs         Schema and integrity gate (runs on build)
│   ├── check-build.mjs           Post-build link, image and SEO audit
│   └── check-runtime.mjs         Headless-browser behaviour and a11y audit
│
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## The data model

The contract lives in [`src/lib/types.ts`](src/lib/types.ts). The central type is `Place`:

```ts
interface Place {
  id: string;                 // `<district-slug>--<place-slug>`, never reused
  slug: string;               // URL segment
  name: string;
  nameBn: string;             // Bengali name — indexed for search
  altNames?: string[];        // Older spellings and local names

  tagline: string;            // One line, ≤ 95 chars. The card hook.
  summary: string;            // 1–2 sentences. Cards, search, meta description.
  description: string[];      // Long-form paragraphs

  division: DivisionSlug;
  district: string;
  upazila?: string;
  locationNote?: string;      // "12 km north of Sreemangal town"
  coords?: { lat: number; lng: number };
  coordPrecision?: 'exact' | 'approx' | 'area';   // ← declared, never implied

  categories: CategorySlug[]; // First entry is primary
  tags: TagSlug[];

  whyVisit: string;           // The single most persuasive reason
  highlights?: string[];
  see?: string[];
  do?: string[];

  bestTime?: { months: number[]; note: string };
  seasons?: SeasonSlug[];
  duration?: { label: string; hours?: [number, number] };
  tripLength?: 'half-day' | 'day' | 'overnight' | 'multi-day';

  routes?: RouteLeg[];        // Multi-leg, with modes and hour ranges
  nearestHub?: string;

  entry?: { type: EntryType; note?: string };
  hours?: string;             // Only where stable and documented
  contact?: { label: string; value: string; href?: string }[];
  website?: string;

  tips?: string[];
  safety?: string[];
  accessibility?: string[];
  stay?: string;
  eat?: string;

  videos?: Video[];           // YouTube ids only, never full URLs
  related?: string[];         // Curated slugs

  popularity: 1 | 2 | 3 | 4 | 5;   // Editorial renown, drives default sort
  hiddenGem?: boolean;
  featured?: boolean;
  unesco?: boolean;
  period?: string;            // "8th century CE"

  art: ArtRef;                // { key, seed, mood? }
  sources?: string[];
  unverified?: string[];      // ← rendered on the page, under its own heading
}
```

Two fields deserve particular attention because they are the honesty mechanism:

- **`coordPrecision`** — every coordinate declares how much to trust it. `exact` is the site itself, `approx` is within a few kilometres, `area` is a representative point for something large or diffuse (a haor, a stretch of coast, a trekking region). The destination page prints the corresponding caveat.
- **`unverified`** — a list of things the entry could not establish. It renders on the page under *"What we could not confirm"*. 30-odd destinations carry one. That number going up is a good sign.

---

## Adding a destination

There is no admin panel, because there is no server. You add an object to a file.

**1. Open the right division file** — `src/data/places/<division>.ts`.

**2. Append an entry.** The minimum viable destination:

```ts
{
  id: 'sylhet--example-place',
  slug: 'example-place',
  name: 'Example Place',
  nameBn: 'উদাহরণ',
  tagline: 'One line that makes someone want to go.',
  summary: 'One or two sentences for cards, search results and meta descriptions.',
  description: [
    'A paragraph.',
    'Another paragraph.',
  ],
  division: 'sylhet',
  district: 'sylhet',
  categories: ['river'],
  tags: ['day-trip', 'photography'],
  whyVisit: 'The single most persuasive reason to make the trip.',
  popularity: 3,
  art: { key: 'river', seed: 3199 },
}
```

Everything else is optional and should be omitted rather than guessed.

**3. Pick an art key and seed.** `key` is one of the 22 landscape families in `ArtKey`; `seed` is any integer. Convention: a per-division 1000-block, incrementing (`31xx` for Sylhet district, `32xx` for Moulvibazar, and so on). Two places may share a key but should not share a seed.

**4. Generate the artwork:**

```bash
npm run art
```

This writes `public/images/art/<key>-<mood>-<seed>.svg`. It only ever regenerates what the data references, and it clears orphans.

**5. Validate:**

```bash
npm run data:check
```

The validator fails the build on: duplicate slugs or ids, unknown division/district/category/tag/season references, a district that does not belong to its declared division, coordinates outside Bangladesh, an unknown art key, popularity outside 1–5, missing `tagline`/`summary`/`whyVisit`/`description`, self-referencing `related`, a malformed YouTube id, or **any district ending up with zero destinations**.

It warns (without failing) on: non-reciprocal district borders, coordinates far from the district centre, taglines over 110 characters, a `related` slug that does not resolve, unused categories or tags, and districts with only one destination.

**6. Build:**

```bash
npm run build
```

The new page appears at `/places/example-place`, is added to the sitemap and the search index, and is picked up automatically by its district page, division page, every category and tag page it belongs to, the map, nearby-destination calculations on neighbouring places, and any collection that lists it.

### Cross-references are one-directional

You never edit two files to link two places. `related` is curated and one-way; if it is thin, `relatedPlaces()` tops it up from the same district, then by proximity, then by primary category. Nearby destinations are computed from coordinates. Category, tag, season and division membership are all derived.

---

## Adding a district or division

Both are effectively fixed — Bangladesh has had 64 districts since 1984 and 8 divisions since 2015 — but the mechanism exists.

**A district** needs an entry in `src/data/districts.ts` and a matching boundary polygon:

```ts
{
  slug: 'example',
  name: 'Example',
  nameBn: 'উদাহরণ',
  division: 'sylhet',
  geoKey: 'Example',          // must match a name in geo/districts.json
  tagline: '…',
  summary: '…',
  description: ['…'],
  knownFor: ['…'],
  areaKm2: 1234,
  coords: { lat: 24.5, lng: 91.5 },   // the district HQ town
  borders: ['sylhet', 'habiganj'],    // reciprocal, validated
  speciality: '…',
  art: { key: 'field', seed: 999 },
}
```

Then add the slug to the parent division's `districts` array. The validator checks that every district is claimed by exactly one division and that `geoKey` resolves to a real polygon.

**`geoKey` exists because the boundary source uses pre-2018 romanisations.** *Bogura* is `Bogra`, *Chattogram* is `Chittagong`, *Cumilla* is `Comilla`, *Jashore* is `Jessore`, *Barishal* is `Barisal`, *Moulvibazar* is `Maulvibazar`, *Chapai Nawabganj* is `Nawabganj`, *Netrokona* is `Netrakona`. The atlas uses current names everywhere and maps to the old ones only at the geometry join.

**A division** needs an entry in `src/data/divisions.ts` with its `districts` array, `geoKey`, `themes`, `character` notes and an editorial `hue`.

If boundaries change, replace the source GeoJSON in `.cache/` and re-run:

```bash
npm run geo
```

---

## Images and artwork

**There are no photographs.** Rather than use stock imagery of uncertain provenance or scrape pictures with unclear licensing, every destination, district, division and collection has procedurally generated artwork.

### How it works

`scripts/generate-artwork.mjs` is a small scene compositor. Each artwork is defined by:

- an **`ArtKey`** — one of 22 landscape families: `sea`, `island`, `hills`, `forest`, `mangrove`, `river`, `lake`, `haor`, `waterfall`, `tea`, `ruins`, `mosque`, `temple`, `stupa`, `mansion`, `fort`, `city`, `bridge`, `field`, `market`, `village`, `garden`
- a **`seed`** — any integer, driving a `mulberry32` PRNG
- an optional **`mood`** — `dawn`, `day`, `dusk`, `night` or `monsoon`, each with its own sky gradient, light colour, atmospheric haze and water palette

The compositor layers a sky gradient, a sun or moon with a halo, multi-lobed clouds, birds, the scene itself (ridges, water bands, tree and building silhouettes, boats, domes, ratna towers, terracotta banding) and a vignette. Motifs are shared across families — the country boat, the palm, the Bengali dome and the chala roof recur — which is what makes 504 separate images read as one set.

**Same seed, same picture, on every machine, forever.** There is no randomness at request time and no build-order dependency.

### Regenerating

```bash
npm run art
```

Reads every `art` reference in the data, generates exactly those files plus a `seed: 1000` fallback for every family × mood combination (used by category, tag and season pages that compose art keys at render time), and deletes orphans.

Output: `public/images/art/<key>-<mood>-<seed>.svg`, ~14 KB each.

### Where images live

```
public/
└── images/
    ├── art/                  Generated destination artwork
    │   ├── river-dusk-3101.svg
    │   ├── haor-monsoon-3301.svg
    │   └── …
    └── og/
        └── default.png       Open Graph fallback card
```

Individual pages use their own artwork as the Open Graph image; `default.png` covers the homepage and index pages.

### If you want to add photographs later

`Art.astro` is the single point of change. Give `Place` an optional `photo` field, render an `<img>` or `<picture>` when present and fall back to the generated artwork when not. Nothing else needs to know.

---

## How search works

There is no search service. The whole thing is a static JSON file and about 200 lines of TypeScript.

### The index

`src/pages/search-index.json.ts` is an Astro endpoint that runs at build time and emits `/search-index.json`. Field names are single letters to keep the payload small:

```jsonc
{
  "i": "jaflong",              // slug
  "n": "Jaflong",              // name
  "b": "জাফলং",                 // Bengali name
  "a": "Jaflong Zero Point …", // alt names
  "d": "Sylhet",  "db": "সিলেট", // district, and its Bengali name
  "v": "Sylhet",               // division
  "c": "Rivers & Confluences …",// category names
  "t": "Day Trip Photography …",// tag names
  "s": "…tagline + summary…",
  "p": 5,                      // popularity
  "g": 0,                      // hidden gem flag
  "k": "river",                // art family
  "f": "river-day-3101.svg",   // resolved artwork filename
  "sd": "sylhet", "sv": "sylhet"
}
```

**185 KB raw, 49 KB gzipped**, fetched **once, on first search interaction**, then cached in module scope. Search costs nothing until someone uses it.

### Matching

`src/scripts/search.ts`:

1. **Fold** the query — NFC normalise, lowercase, strip Latin diacritics (Bengali combining marks are preserved), normalise the apostrophes and hyphens in names like *Cox's Bazar*, collapse whitespace.
2. **Expand** through an alias table — `chittagong → chattogram`, `jessore → jashore`, `bogra → bogura`, `srimangal → sreemangal`, `stmartin → saint martins`, `kantaji → kantajew`, and about twenty more.
3. **Score** every token against nine weighted fields. An exact whole-field match scores highest, then start-of-field, then word-boundary, then substring. Every token must match somewhere for the document to qualify, so multi-word queries genuinely narrow.
4. **Break ties by renown** so two equally good textual matches order sensibly.
5. **Report which field matched**, which is why results are labelled *Bengali name*, *also known as*, *district*, *category* or *in description*.

Folded field values are memoised in a `WeakMap`, so a session's second query is materially faster than its first.

### Surfaces

- **The dialog** (`/` or ⌘K, from anywhere) — recent views and suggestions before you type, live results after, full keyboard navigation.
- **`/search?q=…`** — a shareable URL. Ships a complete browsable directory as its no-JS fallback, so it is never a dead end.
- **`/explore` and every listing page** — the filter bar's text box filters the already-rendered cards, which is a different and cheaper operation.
- **`/404`** — takes the last path segment and runs it through the same index, so a mistyped URL usually recovers.

---

## The map

`src/components/BangladeshMap.astro` renders **inline SVG**. No tile server, no map library, no external request, and every region is a real `<a>` — the map is a navigable list of links with JavaScript disabled.

### Geometry pipeline

`scripts/build-geo.mjs` runs once and converts raw GeoJSON into pre-projected SVG paths:

1. Read geoBoundaries ADM1 (8 divisions) and ADM2 (64 districts) — 46 MB of source GeoJSON.
2. Project to a fixed 1000 × 1410 viewBox using equirectangular with a `cos(latitude)` correction. Bangladesh spans ~4.7° longitude, so this is visually indistinguishable from Mercator and keeps runtime coordinate→pixel conversion to two multiplications.
3. Simplify with an **iterative** Douglas–Peucker (recursion overflows the stack on 33,000-point rings), drop sub-threshold islands, sort polygons largest-first so the mainland paints before its offshore fragments.
4. Compute an area-weighted centroid per region, and un-project it back to lon/lat.
5. Emit two resolutions.

| File | Size | Used by |
| --- | --- | --- |
| `districts.json` | 218 KB | `/map` |
| `districts-lite.json` | 59 KB | Everything else (default) |
| `divisions.json` | 42 KB | `/divisions` |
| `divisions-lite.json` | 21 KB | Thumbnails |

The `detail` prop controls which. This matters: the full geometry was adding **~60 KB gzipped to every one of 400 pages** for a 250-pixel sidebar thumbnail. Switching those to `lite` cut the destination page from 103 KB to 40 KB gzipped.

### Rendering

- **Choropleth** — five discrete steps on one sequential ramp (delta green → marigold → terracotta). An earlier version tinted each division with its own hue; it looked considered and read as mud. The shading's job is *more here / less here*, and that has to survive at thumbnail size, so division colour now lives only in the legend.
- **Pins** — sized by renown, gold for hidden gems, and automatically shrunk when there are more than 40 (district labels are dropped in that mode too, since they compete).
- **Focus** — one region highlighted, the rest dimmed. Used on destination and district pages.
- **Tracker** — visited districts filled green, driven by `localStorage`.
- **Interaction** — hover and focus cards positioned from the region's stored centroid, division filtering that writes to the URL, and label density tied to a `ResizeObserver`.

---

## Running locally

**Requirements:** Node 18.20+ (developed on 24.x) and npm.

```bash
npm install
npm run dev          # http://localhost:4321
```

There are **no environment variables**. Nothing to configure, no keys, no services. Clone and run.

If `sharp` or `esbuild` install scripts are blocked by your npm settings, the build scripts need them:

```bash
npm approve-scripts esbuild
npm approve-scripts sharp
npm rebuild esbuild sharp
```

---

## Build and deploy

```bash
npm run build        # validates the data, then builds to dist/
npm run preview      # serve dist/ locally
```

`dist/` is **pure static output**: HTML, CSS, JS, SVG, JSON, fonts. No server-side rendering, no Node runtime, no adapter.

Deploy it anywhere that serves static files — Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 + CloudFront, or any web server:

```bash
# Netlify
netlify deploy --prod --dir=dist

# Vercel
vercel deploy --prebuilt

# Cloudflare Pages
wrangler pages deploy dist

# Anything else
rsync -av dist/ user@host:/var/www/ghuro/
```

### Host configuration

Two settings are worth getting right:

1. **404 handling** — serve `/404.html` for unmatched paths. Most static hosts do this automatically. It matters here because the 404 page runs the mistyped URL through the search index and offers near matches.
2. **Caching** — `/_astro/*` and `/images/art/*` are content-addressed or immutable and can be cached hard. `/search-index.json` ships with `max-age=3600, must-revalidate`.

```
/_astro/*         Cache-Control: public, max-age=31536000, immutable
/images/art/*     Cache-Control: public, max-age=31536000, immutable
/fonts/*          Cache-Control: public, max-age=31536000, immutable
/*.html           Cache-Control: public, max-age=0, must-revalidate
```

### Before going live

Change `site` in `astro.config.mjs` and `SITE.url` in `src/lib/seo.ts` to the real domain. They drive canonicals, Open Graph URLs, the sitemap and JSON-LD.

---

## Scripts reference

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with HMR |
| `npm run build` | Validate data, then build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run data:check` | Schema, referential integrity and coverage report |
| `npm run art` | Regenerate destination artwork |
| `npm run typecheck` | `astro check` |
| `npm run geo` | Rebuild map geometry from source GeoJSON in `.cache/` |
| `npm run assets` | Favicon, PWA icons, manifest, robots, OG card |
| `npm run fonts` | Re-download and subset the typefaces |
| `npm run check:build` | Post-build link, image and SEO audit |
| `npm run check:runtime -- <url>` | Headless-browser behaviour and a11y audit |

The last three are QA gates rather than part of the build; see below.

---

## Quality gates

Three layers, each catching what the others cannot.

### 1. `validate-data.mjs` — runs on every build

Transpiles the TypeScript data with esbuild, imports it, and enforces the schema. **Fails the build** on any structural error. It is the reason there is no database: this *is* the constraint layer.

```
────────────────────────────────────────────────────────────────
  Ghuro Bangladesh — data validation
────────────────────────────────────────────────────────────────
  divisions     8
  districts     64   (64 with destinations)
  destinations  307
  categories    33
  tags          34
  collections   15
────────────────────────────────────────────────────────────────
  Chattogram       87 destinations
  Dhaka            55 destinations
  Sylhet           42 destinations
  Rajshahi         31 destinations
  Khulna           28 destinations
  Rangpur          27 destinations
  Barishal         19 destinations
  Mymensingh       18 destinations
────────────────────────────────────────────────────────────────

  ✓ Data valid.
```

### 2. `check-build.mjs` — static audit of `dist/`

Walks all 480 pages and checks **98,000 internal links** and **6,200 images** resolve to real files, that every page has a title, a meta description of usable length, a canonical, an `og:image`, exactly one `<h1>`, a `lang` attribute and JSON-LD, that no `<img>` is missing `alt`, that no template leaked `undefined` or `[object Object]`, and that the search index only references pages and artwork that exist.

### 3. `check-runtime.mjs` — headless-browser audit

Drives Chrome over 23 representative routes at **desktop and mobile**, checking for console errors, uncaught exceptions, network failures, images that fail to decode, genuine horizontal overflow, controls without accessible names, skipped heading levels and pointer targets under 24 px — with the WCAG 2.5.8 exemptions for inline links and SVG map regions applied correctly.

Then it exercises fifteen behaviours end to end:

```
  ✓ search index loads and matches        ✓ favourites persist to storage
  ✓ search dialog opens on "/"            ✓ favourites page renders the saved item
  ✓ search returns hits for "jaflong"     ✓ district tracker persists
  ✓ Bengali search works                  ✓ discover quiz advances and recommends
  ✓ old spelling "Chittagong" resolves    ✓ theme toggle switches and persists
  ✓ explore filters narrow the grid       ✓ map division filter dims regions
  ✓ sort reorders the grid                ✓ 404 suggests a near match
  ✓ mobile menu opens
```

Run it against a preview server:

```bash
npm run build
npm run preview &
npm run check:runtime -- http://localhost:4321
```

---

## Performance

Measured on the production build.

| Page | HTML (raw) | HTML (gzip) |
| --- | --- | --- |
| Home | 253 KB | **47 KB** |
| Destination page | 168 KB | **40 KB** |
| District page | 160 KB | **38 KB** |
| Map | 419 KB | 109 KB |
| Explore (307 cards) | 925 KB | 81 KB |
| About | 57 KB | 11 KB |

| Asset | Raw | Gzip |
| --- | --- | --- |
| Shared JS bundle | 14 KB | **5 KB** |
| Largest page module (`discover`) | 8 KB | 3 KB |
| Base CSS | 36 KB | 8 KB |
| Per-page CSS | 6–14 KB | 1–2 KB |
| Search index (lazy) | 185 KB | 49 KB |
| One artwork | 14 KB | ~4 KB |

**How it stays small:**

- **Static HTML.** No framework runtime, no hydration, no client router.
- **Per-page JavaScript.** `app.ts` boots the shared behaviour; filters, discover, map, tracker and the favourites page each `import()` only when their markup is present.
- **The search index is lazy.** Nothing is fetched until someone searches.
- **Two map resolutions.** The single largest win — see [The map](#the-map).
- **Self-hosted, subsetted fonts.** Two preloaded above the fold; Bengali and Latin-Extended load only when their unicode ranges are used.
- **`content-visibility: auto`** on long card grids, with `contain-intrinsic-size` so the scrollbar stays stable.
- **Lazy images below the fold**, `fetchpriority="high"` on the hero, explicit `width`/`height` on every image so nothing shifts.
- **`prefetch` on hover** for internal links, with `clientPrerender` where supported.

---

## Accessibility

- Semantic HTML throughout: real `<nav>`, `<main>`, `<article>`, `<section>`, `<figure>`, `<dl>`, `<table>`.
- One `<h1>` per page and no skipped heading levels, verified by the build audit.
- Skip link, visible focus rings on every interactive element, logical tab order.
- Full keyboard support in the search dialog: `↑ ↓` navigate, `↵` opens, `Esc` clears then closes, with `role="listbox"` and `aria-selected` tracking.
- Live regions announce favourite toggles, tracker changes, search result counts and clipboard results.
- All pointer targets meet the 24 px minimum, with the inline-text and SVG-shape exemptions applied deliberately rather than by accident.
- `prefers-reduced-motion` disables reveals, counters, parallax-ish scaling and the scroll indicator.
- Light and dark themes both meet contrast targets; theme resolves before first paint so there is no flash.
- Bengali text is marked `lang="bn"` and rendered in a Bengali face with appropriate line-height.
- Every image has an `alt` — descriptive where the artwork carries meaning, empty where it is decorative.
- The site is fully usable without JavaScript: all content renders, all navigation works, the map is a list of links, and search degrades to a browsable directory.

---

## SEO

- Unique title and meta description on all 480 pages, length-clamped so search engines actually show them.
- Canonical URL on every page; `noindex, follow` on `/search` and `/favourites`.
- Open Graph and Twitter cards, with each destination using its own artwork.
- **JSON-LD** as a single `@graph` per page: `Organization` and `WebSite` (with `SearchAction`) sitewide, plus `TouristAttraction` with `geo` on destinations, `TouristTrip` with a full `itinerary` on route collections, `CollectionPage` with `ItemList` on listings, `BreadcrumbList` everywhere, and `FAQPage` on the homepage and about page.
- Breadcrumbs rendered and marked up on every deep page.
- `sitemap-index.xml` generated at build, with per-route-type priorities.
- Clean, stable, human-readable URLs: `/places/:slug`, `/districts/:slug`, `/divisions/:slug`, `/categories/:slug`, `/tags/:slug`, `/collections/:slug`, `/seasons/:slug`.
- Dense internal linking — every destination links to its district, division, categories, tags, seasons, related destinations and nearby destinations, and every one of those links back.

---

## Architectural decisions

### No database — and what replaces it

The requirement was zero database. The consequence people usually miss is that you also lose schema enforcement, referential integrity and migrations. `scripts/validate-data.mjs` puts all three back: it fails the build on a broken foreign key, a duplicate id, a coordinate outside Bangladesh, or a district that has quietly ended up empty. Data errors are caught at build time, not in production.

The trade is real and worth naming: content edits require a rebuild and a deploy. For an atlas that changes weekly rather than hourly, that is the right side of the trade — and it buys a site with no runtime dependencies at all.

### Astro over Next.js

Next.js would have shipped a React runtime for a site that is 95% static text. Astro ships zero JavaScript by default and lets the four genuinely interactive pieces (search, filters, quiz, map) be plain modules that load on demand. The result is 5 KB of shared client JavaScript.

### Vanilla TypeScript over a UI framework

The interactive surfaces here are a dialog, a filter list, a five-question form and some SVG hover states. None of them has state complex enough to need a framework, and a framework would have cost more than all of them put together.

### Inline SVG over a map library

Leaflet or MapLibre would have meant a tile server, an external request on every map view, a 40 KB+ library, and a map that renders nothing without JavaScript. Pre-projecting the boundaries at build time gives a map that is part of the document, styleable with CSS variables, themeable, keyboard navigable, and functional with scripting disabled.

### Two map resolutions

Shipping one geometry meant 218 KB of path data on 400 pages that render it at 250 pixels wide. Generating a coarse variant and defaulting to it cut destination pages by 61%. The full geometry survives only where the map is the point.

### Generated artwork over photography

Stock photography of Bangladesh with clean licensing is genuinely hard to source at 300+ destinations, and scraped imagery is not defensible. Procedural artwork sidesteps both problems, guarantees visual consistency, costs 14 KB per image, and scales to any number of new destinations for free. It is an editorial position, not a placeholder — and `Art.astro` is the single seam if that position ever changes.

### One file per division

307 destinations in one file would be unreviewable. One file per destination would mean 307 files and a slow build. Per-division files sit at the natural editorial boundary: 18–87 entries each, small enough to navigate, large enough that adding a place touches exactly one file.

### Single-letter search index keys

`{"i","n","b","a","d","db","v","c","t","s","p","g","k","f","sd","sv"}` looks hostile. It is 185 KB instead of roughly 260 KB, on a payload that is fetched over the connections a lot of this site will actually be read on. The type is documented in `src/lib/types.ts` and the field meanings are in a comment directly above the interface.

### `localStorage` and nothing else

Saved places and the district tracker are per-device, and the UI says so. Every read and write is wrapped in `try/catch`, because private windows and blocked site data must degrade to "no saved state" rather than throwing. Export and import exist because a list that can only live in one browser is a list you will eventually lose.

---

## Editorial rules

The data model exists to serve these. They are the reason the atlas is worth trusting on the parts you cannot check yourself.

**It will:**

- Say when a place is only worth visiting in a specific season, and which one.
- Declare how precise every coordinate is.
- Name permit, escort and convoy requirements in the Chittagong Hill Tracts — and say that the rules change.
- Flag real risks: rip currents at Cox's Bazar, flash rises in the Mirsharai gorges, crocodiles in Thakur Dighi, the documented Nipah virus risk in raw date-palm sap, the tiger risk that is the reason for the armed guard requirement in the Sundarbans.
- Say when a district is thinly covered, and point outward to the nearest destinations in any direction.
- List what it could not verify, on the page, under its own heading.

**It will not:**

- Invent entry fees or opening hours. Both change; a stale number is worse than none. Where a site is free it says free; where a ticket is required it says so without inventing a price.
- Publish coordinates it is not confident in without saying so.
- Claim to have documented every tourist location in Bangladesh. It has not, and neither has anyone else.
- Pad a district page to make coverage look even.
- Describe a working village as an attraction, or a shrine as a photo opportunity.
- Pretend the labour behind the postcard is not there — the stone-lifters at Jaflong, the sand boats on the Someshwari, the shipbreakers at Sitakunda.

---

## Attribution

| | |
| --- | --- |
| **Administrative boundaries** | geoBoundaries gbOpen — Bangladesh ADM1 (CC0) and ADM2 (CC BY 3.0 IGO, sourced from the Bangladesh Bureau of Statistics and OCHA ROAP). Simplified for web display; not suitable for any purpose requiring accurate boundaries. |
| **Area and administrative figures** | Bangladesh Bureau of Statistics and standard Banglapedia values, rounded, treated as approximate throughout. |
| **Typography** | Fraunces, Inter and Noto Sans Bengali — all SIL Open Font License, self-hosted and subset. |
| **Artwork** | Generated for this project. No third-party images are used anywhere. |
| **Editorial content** | Written for this atlas. Historical and geographical claims are drawn from standard reference sources and cross-checked where possible; anything that could not be established is marked unverified on the relevant page. |

---

## Roadmap

The architecture is deliberately boring so that it can grow.

1. **More destinations, especially in the thin districts.** Magura, Chuadanga, Kurigram and a dozen others deserve better than two entries. The data model already supports thousands; the constraint is research, not code.
2. **A full Bengali edition.** Every place already carries a Bengali name and search handles Bengali script. The remaining work is the prose.
3. **Upazila-level pages.** Every destination already has an `upazila` field; the routing does not use it yet.
4. **Trip planning that saves.** The favourites store already groups by division; turning that into a multi-day itinerary with travel legs is a small step from there.
5. **Seasonal and access alerts.** Hill Tracts permits, the annual hilsa ban, Saint Martin's restrictions and Sundarbans closures all move on schedules the data model could carry.
6. **Commercial layers, if ever wanted.** Accommodation, guides, transport and affiliate links would all attach to the existing `Place` type as optional fields without disturbing anything. The first version deliberately has none.

---

*Ghuro Bangladesh — ঘুরো বাংলাদেশ*
