/**
 * generate-assets.mjs — one-time build step.
 *
 * Produces the favicon, PWA icons, web manifest, robots.txt and the default
 * Open Graph image. All derived from the brand mark so nothing drifts.
 *
 * Run: node scripts/generate-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const { default: sharp } = await import('sharp');

fs.mkdirSync(path.join(PUB, 'images/og'), { recursive: true });
fs.mkdirSync(path.join(PUB, 'icons'), { recursive: true });

const TERRACOTTA = '#b8502a';
const DELTA = '#0b584b';
const DELTA_LIGHT = '#2ba98f';
const PAPER = '#faf6ee';
const INK = '#10201d';
const MARIGOLD = '#e8a33d';

/* ═══════════════════════ favicon ═══════════════════════ */

/** The compass-rose mark on a rounded paper tile. */
function markSvg({ size = 48, bg = PAPER, ring = TERRACOTTA, tick = INK, river = DELTA_LIGHT, radius = 10 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}">
  <rect width="48" height="48" rx="${radius}" fill="${bg}"/>
  <circle cx="24" cy="24" r="19.5" fill="none" stroke="${ring}" stroke-width="2.2"/>
  <circle cx="24" cy="24" r="14.5" fill="none" stroke="${tick}" stroke-width="1" stroke-dasharray="2 3.4" opacity="0.5"/>
  <path d="M24 4.5v4M24 39.5v4M4.5 24h4M39.5 24h4" stroke="${tick}" stroke-width="2.2" stroke-linecap="round" opacity="0.65"/>
  <path d="M14 32.5c4 0 4-5.8 8-5.8s4 5.8 8 5.8" stroke="${river}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <path d="M24 10.5 28.9 24.5 24 21.2 19.1 24.5Z" fill="${ring}" stroke="${ring}" stroke-width="1.1" stroke-linejoin="round"/>
</svg>`.replace(/\n\s*/g, '');
}

/* Favicon: an SVG that adapts to the viewer's theme. */
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <style>
    .bg { fill: ${PAPER}; }
    .ink { stroke: ${INK}; }
    @media (prefers-color-scheme: dark) {
      .bg { fill: #0a1614; }
      .ink { stroke: #eef3f0; }
    }
  </style>
  <rect class="bg" width="48" height="48" rx="10"/>
  <circle cx="24" cy="24" r="19.5" fill="none" stroke="${TERRACOTTA}" stroke-width="2.4"/>
  <path class="ink" d="M24 4.5v4M24 39.5v4M4.5 24h4M39.5 24h4" stroke-width="2.4" stroke-linecap="round" opacity="0.6"/>
  <path d="M14 32.5c4 0 4-5.8 8-5.8s4 5.8 8 5.8" stroke="${DELTA_LIGHT}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
  <path d="M24 10.5 28.9 24.5 24 21.2 19.1 24.5Z" fill="${TERRACOTTA}" stroke="${TERRACOTTA}" stroke-width="1.1" stroke-linejoin="round"/>
</svg>`;

fs.writeFileSync(path.join(PUB, 'favicon.svg'), favicon.replace(/\n\s*/g, ''));

/* Raster icons for platforms that will not take SVG. */
const rasterSizes = [
  { file: 'apple-touch-icon.png', size: 180, radius: 0, bg: PAPER, dir: PUB },
  { file: 'icons/icon-192.png', size: 192, radius: 40, bg: PAPER, dir: PUB },
  { file: 'icons/icon-512.png', size: 512, radius: 108, bg: PAPER, dir: PUB },
  { file: 'icons/icon-maskable-512.png', size: 512, radius: 0, bg: PAPER, dir: PUB },
  { file: 'favicon-32.png', size: 32, radius: 6, bg: PAPER, dir: PUB },
];

for (const spec of rasterSizes) {
  const svg = markSvg({ size: spec.size, radius: (spec.radius / spec.size) * 48, bg: spec.bg });
  await sharp(Buffer.from(svg)).png().toFile(path.join(spec.dir, spec.file));
}

/* ═══════════════════════ manifest ═══════════════════════ */

const manifest = {
  name: 'Ghuro Bangladesh',
  short_name: 'Ghuro BD',
  description:
    'A field atlas of Bangladesh — researched destinations across all 8 divisions and 64 districts.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: PAPER,
  theme_color: PAPER,
  lang: 'en',
  dir: 'ltr',
  categories: ['travel', 'reference', 'education'],
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
  ],
  shortcuts: [
    { name: 'Search destinations', url: '/search' },
    { name: 'The map', url: '/map' },
    { name: 'Where should I go?', url: '/discover' },
    { name: 'Saved places', url: '/favourites' },
  ],
};
fs.writeFileSync(path.join(PUB, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

/* ═══════════════════════ robots.txt ═══════════════════════ */

fs.writeFileSync(
  path.join(PUB, 'robots.txt'),
  `# Ghuro Bangladesh
User-agent: *
Allow: /
Disallow: /search
Disallow: /favourites

Sitemap: https://ghurobangladesh.com/sitemap-index.xml
`
);

/* ═══════════════════════ Open Graph image ═══════════════════════ */

/**
 * The default OG card. Individual pages point Open Graph at their own
 * artwork; this is the fallback for the homepage and index pages.
 */
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#08302c"/>
      <stop offset="55%" stop-color="${DELTA}"/>
      <stop offset="100%" stop-color="#6e2d1a"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e4a42" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0a2f2a" stop-opacity="0.85"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Meander motif -->
  <g opacity="0.16" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round">
    ${Array.from({ length: 7 }, (_, i) => {
      const y = 120 + i * 78;
      return `<path d="M-40 ${y} C 180 ${y - 46}, 300 ${y + 46}, 520 ${y} S 900 ${y - 46}, 1240 ${y}"/>`;
    }).join('')}
  </g>

  <rect y="430" width="1200" height="200" fill="url(#water)"/>

  <!-- Mark -->
  <g transform="translate(80 78)">
    <circle cx="42" cy="42" r="39" fill="none" stroke="${MARIGOLD}" stroke-width="4"/>
    <path d="M42 6v9M42 69v9M6 42h9M69 42h9" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
    <path d="M22 58c8 0 8-11 16-11s8 11 16 11" stroke="${DELTA_LIGHT}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M42 17 51 44 42 38 33 44Z" fill="${MARIGOLD}" stroke="${MARIGOLD}" stroke-width="2" stroke-linejoin="round"/>
  </g>

  <text x="192" y="128" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="600" fill="#ffffff">Ghuro <tspan fill="${MARIGOLD}">Bangladesh</tspan></text>
  <text x="192" y="163" font-family="Georgia, serif" font-style="italic" font-size="22" fill="#cfe0da">Discover Bangladesh, One Place at a Time.</text>

  <text x="80" y="332" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="600" fill="#ffffff">A field atlas of</text>
  <text x="80" y="416" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="600" fill="${MARIGOLD}">Bangladesh</text>

  <g font-family="Helvetica, Arial, sans-serif" fill="#e6efe9">
    <text x="80" y="500" font-size="26" font-weight="700">300+ destinations</text>
    <text x="80" y="536" font-size="20" opacity="0.75">8 divisions · 64 districts · honest travel notes</text>
  </g>

  <text x="1120" y="560" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#9ec0b6" letter-spacing="3">GHUROBANGLADESH.COM</text>
</svg>`;

await sharp(Buffer.from(og)).png().toFile(path.join(PUB, 'images/og/default.png'));

console.log('  favicon.svg, apple-touch-icon, PWA icons, manifest, robots.txt, OG image written');
