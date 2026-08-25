/**
 * validate-data.mjs — runs before every build (`npm run build`).
 *
 * There is no database, so this script is the schema enforcement layer:
 * it checks referential integrity, slug uniqueness, coordinate sanity and
 * coverage, and fails the build on any error. Warnings are printed but do
 * not block.
 *
 * Run directly with: node scripts/validate-data.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ── Load the TypeScript data modules by transpiling them with esbuild ── */
const esbuild = await import('esbuild');

const entry = path.join(ROOT, 'src/data/index.ts');
const bundle = await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  logLevel: 'silent',
  loader: { '.json': 'json' },
  alias: {
    '@lib': path.join(ROOT, 'src/lib'),
    '@data': path.join(ROOT, 'src/data'),
    '@components': path.join(ROOT, 'src/components'),
    '@': path.join(ROOT, 'src'),
  },
});

const tmp = path.join(ROOT, '.cache', 'data-bundle.mjs');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, bundle.outputFiles[0].text);
const data = await import(pathToFileURL(tmp).href + `?t=${bundle.outputFiles[0].hash}`);

const {
  places,
  districts,
  divisions,
  categories,
  tags,
  seasons,
  collections,
  placeBySlug,
  districtBySlug,
  divisionBySlug,
} = data;

/* ────────────────────────── Checks ────────────────────────── */

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

/* Bangladesh bounding box, generous. */
const BOUNDS = { minLat: 20.4, maxLat: 26.7, minLng: 87.9, maxLng: 92.8 };

/* — 1. Structural integrity of the reference data — */

if (divisions.length !== 8) err(`Expected 8 divisions, found ${divisions.length}`);
if (districts.length !== 64) err(`Expected 64 districts, found ${districts.length}`);

const divisionDistrictLists = new Set();
for (const d of divisions) {
  for (const slug of d.districts) {
    if (!districtBySlug.has(slug)) err(`Division "${d.slug}" lists unknown district "${slug}"`);
    if (divisionDistrictLists.has(slug)) err(`District "${slug}" is listed by more than one division`);
    divisionDistrictLists.add(slug);
  }
}
for (const d of districts) {
  if (!divisionBySlug.has(d.division)) err(`District "${d.slug}" has unknown division "${d.division}"`);
  if (!divisionDistrictLists.has(d.slug)) err(`District "${d.slug}" is not listed by any division`);
  for (const b of d.borders) {
    if (!districtBySlug.has(b)) err(`District "${d.slug}" borders unknown district "${b}"`);
    const other = districtBySlug.get(b);
    if (other && !other.borders.includes(d.slug)) {
      warn(`Border is not reciprocal: "${d.slug}" lists "${b}" but not the reverse`);
    }
  }
  const { lat, lng } = d.coords;
  if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat || lng < BOUNDS.minLng || lng > BOUNDS.maxLng) {
    err(`District "${d.slug}" coordinates ${lat},${lng} fall outside Bangladesh`);
  }
}

/* — 2. Geo join: every district and division must match a boundary polygon — */

const geoDistricts = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/geo/districts.json'), 'utf8'));
const geoDivisions = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/geo/divisions.json'), 'utf8'));
const geoDistrictNames = new Set(geoDistricts.districts.map((d) => d.name));
const geoDivisionNames = new Set(geoDivisions.divisions.map((d) => d.name));

for (const d of districts) {
  if (!geoDistrictNames.has(d.geoKey)) err(`District "${d.slug}" geoKey "${d.geoKey}" has no boundary polygon`);
}
for (const d of divisions) {
  if (!geoDivisionNames.has(d.geoKey)) err(`Division "${d.slug}" geoKey "${d.geoKey}" has no boundary polygon`);
}
if (geoDistrictNames.size !== 64) err(`Boundary file has ${geoDistrictNames.size} districts, expected 64`);

/* — 3. Places — */

const seenSlugs = new Set();
const seenIds = new Set();
const categorySlugs = new Set(categories.map((c) => c.slug));
const tagSlugs = new Set(tags.map((t) => t.slug));
const seasonSlugs = new Set(seasons.map((s) => s.slug));
const artKeys = new Set([
  'sea', 'island', 'hills', 'forest', 'mangrove', 'river', 'lake', 'haor', 'waterfall',
  'tea', 'ruins', 'mosque', 'temple', 'stupa', 'mansion', 'fort', 'city', 'bridge',
  'field', 'market', 'village', 'garden',
]);
const tripLengths = new Set(['half-day', 'day', 'overnight', 'multi-day']);
const entryTypes = new Set(['free', 'ticketed', 'permit', 'restricted', 'unknown']);
const precisions = new Set(['exact', 'approx', 'area']);

for (const p of places) {
  const where = `Place "${p.slug}"`;

  if (seenSlugs.has(p.slug)) err(`Duplicate place slug: "${p.slug}"`);
  seenSlugs.add(p.slug);
  if (seenIds.has(p.id)) err(`Duplicate place id: "${p.id}"`);
  seenIds.add(p.id);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) err(`${where} has a non-kebab-case slug`);

  if (!divisionBySlug.has(p.division)) err(`${where} has unknown division "${p.division}"`);
  const district = districtBySlug.get(p.district);
  if (!district) err(`${where} has unknown district "${p.district}"`);
  else if (district.division !== p.division) {
    err(`${where} is in district "${p.district}" (division ${district.division}) but declares division "${p.division}"`);
  }

  if (!p.categories?.length) err(`${where} has no categories`);
  for (const c of p.categories ?? []) if (!categorySlugs.has(c)) err(`${where} has unknown category "${c}"`);
  for (const t of p.tags ?? []) if (!tagSlugs.has(t)) err(`${where} has unknown tag "${t}"`);
  for (const s of p.seasons ?? []) if (!seasonSlugs.has(s)) err(`${where} has unknown season "${s}"`);

  if (!artKeys.has(p.art?.key)) err(`${where} has unknown art key "${p.art?.key}"`);
  if (typeof p.art?.seed !== 'number') err(`${where} has a non-numeric art seed`);

  if (p.tripLength && !tripLengths.has(p.tripLength)) err(`${where} has invalid tripLength "${p.tripLength}"`);
  if (p.entry && !entryTypes.has(p.entry.type)) err(`${where} has invalid entry type "${p.entry.type}"`);
  if (p.coordPrecision && !precisions.has(p.coordPrecision)) err(`${where} has invalid coordPrecision`);

  if (!(p.popularity >= 1 && p.popularity <= 5)) err(`${where} has popularity outside 1–5`);

  if (p.coords) {
    const { lat, lng } = p.coords;
    if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat || lng < BOUNDS.minLng || lng > BOUNDS.maxLng) {
      err(`${where} coordinates ${lat},${lng} fall outside Bangladesh`);
    }
    if (!p.coordPrecision) warn(`${where} has coordinates but no coordPrecision declared`);
    if (district) {
      const km = data.distanceKm(p.coords, district.coords);
      if (km > 130) warn(`${where} is ${Math.round(km)} km from its district centre — check the district assignment`);
    }
  } else {
    warn(`${where} has no coordinates (it will fall back to the district centre on maps)`);
  }

  for (const field of ['tagline', 'summary', 'whyVisit']) {
    if (!p[field] || !String(p[field]).trim()) err(`${where} is missing "${field}"`);
  }
  if (!p.description?.length) err(`${where} has no description paragraphs`);
  if (p.tagline && p.tagline.length > 110) warn(`${where} tagline is ${p.tagline.length} chars (aim for <= 95)`);

  for (const r of p.related ?? []) {
    if (!placeBySlug.has(r)) warn(`${where} links to unknown related place "${r}"`);
    if (r === p.slug) err(`${where} lists itself as related`);
  }

  for (const v of p.videos ?? []) {
    if (v.type !== 'youtube') err(`${where} has a video of unsupported type "${v.type}"`);
    if (!/^[A-Za-z0-9_-]{11}$/.test(v.id)) err(`${where} has an invalid YouTube id "${v.id}"`);
  }
}

/* — 4. Collections — */

for (const c of collections) {
  if (!c.places?.length) err(`Collection "${c.slug}" has no places`);
  for (const s of c.places) {
    if (!placeBySlug.has(s)) err(`Collection "${c.slug}" references unknown place "${s}"`);
  }
  if (!artKeys.has(c.art?.key)) err(`Collection "${c.slug}" has unknown art key "${c.art?.key}"`);
}

/* — 5. Coverage — */

const byDistrict = new Map();
for (const p of places) byDistrict.set(p.district, (byDistrict.get(p.district) ?? 0) + 1);

const empty = districts.filter((d) => !byDistrict.has(d.slug));
const thin = districts.filter((d) => (byDistrict.get(d.slug) ?? 0) === 1);

if (empty.length) {
  err(`${empty.length} district(s) have no destinations: ${empty.map((d) => d.slug).join(', ')}`);
}
if (thin.length) {
  warn(`${thin.length} district(s) have only one destination: ${thin.map((d) => d.slug).join(', ')}`);
}

const byDivision = new Map();
for (const p of places) byDivision.set(p.division, (byDivision.get(p.division) ?? 0) + 1);
for (const d of divisions) {
  if (!byDivision.has(d.slug)) err(`Division "${d.slug}" has no destinations`);
}

/* — 6. Taxonomy usage — */

const usedCategories = new Set(places.flatMap((p) => p.categories));
for (const c of categories) {
  if (!usedCategories.has(c.slug)) warn(`Category "${c.slug}" is not used by any place`);
}
const usedTags = new Set(places.flatMap((p) => p.tags));
for (const t of tags) {
  if (!usedTags.has(t.slug)) warn(`Tag "${t.slug}" is not used by any place`);
}

/* ────────────────────────── Report ────────────────────────── */

const line = '─'.repeat(64);
console.log(line);
console.log('  Ghuro Bangladesh — data validation');
console.log(line);
console.log(`  divisions     ${divisions.length}`);
console.log(`  districts     ${districts.length}   (${byDistrict.size} with destinations)`);
console.log(`  destinations  ${places.length}`);
console.log(`  categories    ${categories.length}`);
console.log(`  tags          ${tags.length}`);
console.log(`  collections   ${collections.length}`);
console.log(line);

const sortedDivisions = [...byDivision.entries()].sort((a, b) => b[1] - a[1]);
for (const [slug, count] of sortedDivisions) {
  const label = divisionBySlug.get(slug)?.name ?? slug;
  console.log(`  ${label.padEnd(14)} ${String(count).padStart(4)} destinations`);
}
console.log(line);

if (warnings.length) {
  console.log(`\n  ${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 40)) console.log(`    · ${w}`);
  if (warnings.length > 40) console.log(`    · …and ${warnings.length - 40} more`);
}

if (errors.length) {
  console.error(`\n  ${errors.length} ERROR(S):`);
  for (const e of errors) console.error(`    ✗ ${e}`);
  console.error('\n  Data validation failed.\n');
  process.exit(1);
}

console.log('\n  ✓ Data valid.\n');
