/**
 * build-geo.mjs — one-time build step.
 * Converts raw geoBoundaries GeoJSON (46MB) into a compact, pre-projected
 * SVG path dataset that ships inside the project. Run: node scripts/build-geo.mjs
 *
 * Source: geoBoundaries gbOpen BGD ADM1 (CC0) / ADM2 (CC BY 3.0 IGO, BBS+OCHA).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/data/geo');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- geometry helpers ---------- */

// Perpendicular distance from p to segment a-b
function segDist(p, a, b) {
  let x = a[0], y = a[1], dx = b[0] - x, dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = b[0]; y = b[1]; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = p[0] - x; dy = p[1] - y;
  return dx * dx + dy * dy;
}

// Douglas–Peucker, iterative (avoids stack overflow on 30k-point rings)
function simplify(points, sqTol) {
  const n = points.length;
  if (n < 4) return points;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxSq = 0, idx = -1;
    for (let i = first + 1; i < last; i++) {
      const d = segDist(points[i], points[first], points[last]);
      if (d > maxSq) { maxSq = d; idx = i; }
    }
    if (maxSq > sqTol && idx > 0) {
      keep[idx] = 1;
      stack.push([first, idx], [idx, last]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(points[i]);
  return out;
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(a / 2);
}

// Area-weighted centroid of the largest ring set
function polyCentroid(rings) {
  let cx = 0, cy = 0, area = 0;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      area += f; cx += (ring[j][0] + ring[i][0]) * f; cy += (ring[j][1] + ring[i][1]) * f;
    }
  }
  if (area === 0) return rings[0][0];
  return [cx / (3 * area), cy / (3 * area)];
}

function toPolygons(geom) {
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates;
  return [];
}

/* ---------- projection ---------- */
// Bangladesh spans ~4.7deg lon x ~6.2deg lat: equirectangular with a cos(lat)
// correction is visually indistinguishable from Mercator here and keeps the
// math trivial for runtime coordinate -> pixel conversion in the browser.
const LAT_MID = 23.685;
const K = Math.cos((LAT_MID * Math.PI) / 180);
const VIEW_W = 1000;

function collectBounds(featureSets) {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const fc of featureSets) {
    for (const f of fc.features) {
      for (const poly of toPolygons(f.geometry)) {
        for (const ring of poly) {
          for (const [lon, lat] of ring) {
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          }
        }
      }
    }
  }
  return { minLon, maxLon, minLat, maxLat };
}

/* ---------- run ---------- */
const adm1 = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/bgd-adm1.geojson'), 'utf8'));
const adm2 = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/bgd-adm2.geojson'), 'utf8'));

const b = collectBounds([adm1, adm2]);
const padLon = (b.maxLon - b.minLon) * 0.01;
const padLat = (b.maxLat - b.minLat) * 0.01;
b.minLon -= padLon; b.maxLon += padLon; b.minLat -= padLat; b.maxLat += padLat;

const scale = VIEW_W / ((b.maxLon - b.minLon) * K);
const VIEW_H = Math.round((b.maxLat - b.minLat) * scale);

const project = ([lon, lat]) => [
  ((lon - b.minLon) * K) * scale,
  (b.maxLat - lat) * scale,
];

const r = (n) => Math.round(n * 10) / 10;

function buildFeature(f, { tol, minAreaPx, nameKey = 'shapeName' }) {
  const polys = toPolygons(f.geometry);
  const projected = [];
  for (const poly of polys) {
    const rings = [];
    for (const ring of poly) {
      const pts = ring.map(project);
      const simp = simplify(pts, tol * tol);
      if (simp.length < 4) continue;
      if (ringArea(simp) < minAreaPx) continue;
      rings.push(simp);
    }
    if (rings.length) projected.push(rings);
  }
  // Sort polygons largest-first so the mainland renders first
  projected.sort((p, q) => ringArea(q[0]) - ringArea(p[0]));

  let d = '';
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const rings of projected) {
    for (const ring of rings) {
      d += 'M' + ring.map(([x, y]) => `${r(x)} ${r(y)}`).join('L') + 'Z';
      for (const [x, y] of ring) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  const c = polyCentroid(projected[0]);
  // Un-project the centroid back to lon/lat for geographic use
  const lon = c[0] / scale / K + b.minLon;
  const lat = b.maxLat - c[1] / scale;
  return {
    name: f.properties[nameKey],
    d,
    c: [r(c[0]), r(c[1])],
    ll: [Math.round(lat * 1e4) / 1e4, Math.round(lon * 1e4) / 1e4],
    bbox: [r(minX), r(minY), r(maxX - minX), r(maxY - minY)],
    parts: projected.length,
  };
}

const districts = adm2.features
  .map((f) => buildFeature(f, { tol: 0.55, minAreaPx: 1.2 }))
  .sort((a, z) => a.name.localeCompare(z.name));

const divisions = adm1.features
  .map((f) => buildFeature(f, { tol: 0.4, minAreaPx: 1.2 }))
  .sort((a, z) => a.name.localeCompare(z.name));

// Outline = union approximation: just the division outlines drawn as one path
const outline = divisions.map((d) => d.d).join('');

const payload = {
  $license: 'Boundaries: geoBoundaries gbOpen — BGD ADM1 (CC0), BGD ADM2 (CC BY 3.0 IGO; source: Bangladesh Bureau of Statistics / OCHA ROAP). Simplified for web display.',
  view: { w: VIEW_W, h: VIEW_H },
  bounds: {
    minLon: Math.round(b.minLon * 1e6) / 1e6,
    maxLon: Math.round(b.maxLon * 1e6) / 1e6,
    minLat: Math.round(b.minLat * 1e6) / 1e6,
    maxLat: Math.round(b.maxLat * 1e6) / 1e6,
    k: Math.round(K * 1e8) / 1e8,
    scale: Math.round(scale * 1e6) / 1e6,
  },
  districts,
  divisions,
  outline,
};

fs.writeFileSync(path.join(OUT, 'bangladesh.json'), JSON.stringify(payload));
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + ' KB';
console.log('viewBox', VIEW_W, 'x', VIEW_H);
console.log('districts', districts.length, kb(JSON.stringify(districts)));
console.log('divisions', divisions.length, kb(JSON.stringify(divisions)));
console.log('total    ', kb(JSON.stringify(payload)));
console.log('sample   ', districts[0].name, districts[0].ll, 'parts=' + districts[0].parts);

/* ----------------------------------------------------------------------
 * Low-detail variant.
 *
 * The full district geometry is ~220 KB of path data. That is right for the
 * full-page map, and completely wrong for a 250px sidebar thumbnail repeated
 * on 400 pages — it was adding ~100 KB gzipped to every destination page.
 * This coarser pass keeps the silhouette recognisable at small sizes and
 * drops roughly 85% of the bytes.
 * -------------------------------------------------------------------- */
const districtsLite = adm2.features
  .map((f) => buildFeature(f, { tol: 3.2, minAreaPx: 26 }))
  .sort((a, z) => a.name.localeCompare(z.name));

const divisionsLite = adm1.features
  .map((f) => buildFeature(f, { tol: 2.4, minAreaPx: 26 }))
  .sort((a, z) => a.name.localeCompare(z.name));

const outlineLite = divisionsLite.map((d) => d.d).join('');

/* ---------- split output: light (divisions) + full (districts) ---------- */
const base = { $license: payload.$license, view: payload.view, bounds: payload.bounds };
fs.writeFileSync(path.join(OUT, 'divisions.json'), JSON.stringify({ ...base, divisions, outline }));
fs.writeFileSync(path.join(OUT, 'districts.json'), JSON.stringify({ ...base, districts }));
fs.writeFileSync(
  path.join(OUT, 'districts-lite.json'),
  JSON.stringify({ ...base, districts: districtsLite, outline: outlineLite })
);
fs.writeFileSync(
  path.join(OUT, 'divisions-lite.json'),
  JSON.stringify({ ...base, divisions: divisionsLite, outline: outlineLite })
);
fs.rmSync(path.join(OUT, 'bangladesh.json'), { force: true });

const size = (f) => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(1) + ' KB';
console.log('districts.json      ', size('districts.json'));
console.log('districts-lite.json ', size('districts-lite.json'));
console.log('divisions.json      ', size('divisions.json'));
console.log('divisions-lite.json ', size('divisions-lite.json'));
