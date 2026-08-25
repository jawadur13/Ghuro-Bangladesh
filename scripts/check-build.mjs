/**
 * check-build.mjs — post-build integrity check over `dist/`.
 *
 * Verifies that every internal link resolves to a built page, every image src
 * exists on disk, and that the SEO essentials are present on every page.
 * Run after `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) {
  console.error('  dist/ not found — run the build first.');
  process.exit(1);
}

/* ── Collect built pages and assets ── */

const pages = [];
const assets = new Set();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    const rel = '/' + path.relative(DIST, full).split(path.sep).join('/');
    assets.add(rel);
    if (entry.name.endsWith('.html')) pages.push({ file: full, rel });
  }
}
walk(DIST);

/** A URL path resolves if it maps to an .html file or a real asset. */
function resolves(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return assets.has('/index.html');
  const noSlash = clean.replace(/\/$/, '');
  return (
    assets.has(clean) ||
    assets.has(noSlash) ||
    assets.has(`${noSlash}/index.html`) ||
    assets.has(`${noSlash}.html`)
  );
}

/* ── Scan ── */

const errors = [];
const warnings = [];
const brokenLinks = new Map();
const brokenImages = new Map();

let totalLinks = 0;
let totalImages = 0;

const ATTR = (html, re) => [...html.matchAll(re)].map((m) => m[1]);

for (const page of pages) {
  const html = fs.readFileSync(page.file, 'utf8');
  const where = page.rel.replace(/\/index\.html$/, '') || '/';

  /* Links */
  for (const href of ATTR(html, /<a\b[^>]*?href="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) continue;
    totalLinks++;
    if (!resolves(href)) {
      const list = brokenLinks.get(href) ?? [];
      list.push(where);
      brokenLinks.set(href, list);
    }
  }

  /* Images */
  for (const src of ATTR(html, /<img\b[^>]*?src="([^"]+)"/g)) {
    if (/^(https?:|data:)/.test(src)) continue;
    totalImages++;
    if (!assets.has(src.split('?')[0])) {
      const list = brokenImages.get(src) ?? [];
      list.push(where);
      brokenImages.set(src, list);
    }
  }

  /* Alt text on every image */
  const imgTags = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  for (const tag of imgTags) {
    // Astro serialises alt="" as a bare `alt`, which is valid and equivalent.
    if (!/\salt(?:=|[\s/>])/.test(tag)) {
      errors.push(`${where}: <img> without alt — ${tag.slice(0, 90)}`);
    }
  }

  /* SEO essentials */
  if (!/<title>[^<]{5,}<\/title>/.test(html)) errors.push(`${where}: missing or empty <title>`);
  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  if (!desc || desc[1].trim().length < 40) errors.push(`${where}: missing or short meta description`);
  else if (desc[1].length > 175) warnings.push(`${where}: meta description is ${desc[1].length} chars`);
  if (!/<link rel="canonical"/.test(html)) errors.push(`${where}: missing canonical`);
  if (!/property="og:image"/.test(html)) errors.push(`${where}: missing og:image`);
  if (!/application\/ld\+json/.test(html)) warnings.push(`${where}: no JSON-LD`);

  /* Exactly one h1 */
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s === 0) errors.push(`${where}: no <h1>`);
  if (h1s > 1) errors.push(`${where}: ${h1s} <h1> elements`);

  /* Language */
  if (!/<html lang="/.test(html)) errors.push(`${where}: <html> without lang`);

  /* Unresolved template leakage */
  if (/\[object Object\]|undefined<\/|>undefined</.test(html)) {
    errors.push(`${where}: rendered "undefined" or "[object Object]"`);
  }
}

/* ── Required files ── */
const required = [
  '/index.html',
  '/404.html',
  '/search-index.json',
  '/sitemap-index.xml',
  '/robots.txt',
  '/favicon.svg',
  '/site.webmanifest',
  '/images/og/default.png',
];
for (const f of required) {
  if (!assets.has(f)) errors.push(`missing required file: ${f}`);
}

/* ── Search index sanity ── */
try {
  const index = JSON.parse(fs.readFileSync(path.join(DIST, 'search-index.json'), 'utf8'));
  if (!Array.isArray(index) || index.length < 100) {
    errors.push(`search-index.json has ${Array.isArray(index) ? index.length : 'no'} entries`);
  } else {
    for (const doc of index) {
      if (!assets.has(`/images/art/${doc.f}`)) {
        errors.push(`search index references missing artwork: ${doc.f} (${doc.i})`);
        break;
      }
      if (!resolves(`/places/${doc.i}`)) {
        errors.push(`search index references missing page: /places/${doc.i}`);
        break;
      }
    }
  }
} catch (e) {
  errors.push(`search-index.json unreadable: ${e.message}`);
}

/* ── Report ── */

for (const [href, where] of brokenLinks) {
  errors.push(`broken link ${href} (on ${where.length} page${where.length === 1 ? '' : 's'}, e.g. ${where[0]})`);
}
for (const [src, where] of brokenImages) {
  errors.push(`missing image ${src} (e.g. on ${where[0]})`);
}

const line = '─'.repeat(64);
console.log(line);
console.log('  Ghuro Bangladesh — build check');
console.log(line);
console.log(`  pages          ${pages.length}`);
console.log(`  assets         ${assets.size}`);
console.log(`  internal links ${totalLinks}`);
console.log(`  images         ${totalImages}`);
console.log(line);

if (warnings.length) {
  console.log(`\n  ${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 25)) console.log(`    · ${w}`);
  if (warnings.length > 25) console.log(`    · …and ${warnings.length - 25} more`);
}

if (errors.length) {
  console.error(`\n  ${errors.length} ERROR(S):`);
  for (const e of errors.slice(0, 40)) console.error(`    ✗ ${e}`);
  if (errors.length > 40) console.error(`    ✗ …and ${errors.length - 40} more`);
  console.error('');
  process.exit(1);
}

console.log('\n  ✓ Build is clean.\n');
