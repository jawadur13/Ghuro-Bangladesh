/**
 * generate-artwork.mjs — Ghuro Bangladesh's editorial artwork system.
 *
 * Rather than shipping stock photography of uncertain provenance, every
 * destination, district, division and collection gets a layered SVG scene
 * composed from a landscape family (`art.key`) and a deterministic seed.
 * Same seed, same picture — every time, on every machine.
 *
 * Output: public/images/art/<key>-<mood>-<seed>.svg
 * Run:    npm run art
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/images/art');

const W = 1200;
const H = 800;

/* ═══════════════════════════ deterministic RNG ═══════════════════════════ */

/** mulberry32 — small, fast, well-distributed, and identical everywhere. */
function rng(seed) {
  let a = (seed >>> 0) || 1;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const mk = (seed) => {
  const r = rng(seed);
  return {
    f: (min, max) => min + r() * (max - min),
    i: (min, max) => Math.floor(min + r() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    chance: (p) => r() < p,
  };
};

const n = (v) => Math.round(v * 10) / 10;

/* ═══════════════════════════ palettes ═══════════════════════════ */

/**
 * Each mood gives: sky gradient stops, a light disc colour, an atmospheric
 * haze colour used to fade distant layers, and a base "ink" for silhouettes.
 */
const MOODS = {
  dawn: {
    sky: ['#2d4272', '#6d5a94', '#c47b96', '#f2a878', '#ffdda4'],
    disc: '#fff6dc',
    discGlow: '#ffc078',
    haze: '#f3c9a3',
    ink: '#1d2a38',
    water: '#4d6c88',
    waterLit: '#ffb680',
    discY: 0.62,
  },
  day: {
    sky: ['#2f80b8', '#5ea5d2', '#9ecfe4', '#d3eaf0', '#f4f5ea'],
    disc: '#fffdf2',
    discGlow: '#ffefc0',
    haze: '#d6e6e6',
    ink: '#1c3239',
    water: '#3d87a8',
    waterLit: '#b5dcea',
    discY: 0.22,
  },
  dusk: {
    sky: ['#23305a', '#5b3f76', '#ad4e6c', '#ee8145', '#ffbc5e'],
    disc: '#ffeeb4',
    discGlow: '#ff9040',
    haze: '#e08556',
    ink: '#171426',
    water: '#3a3a63',
    waterLit: '#ff9f52',
    discY: 0.66,
  },
  night: {
    sky: ['#070d22', '#101c40', '#1c2c58', '#2f4374', '#4d5f92'],
    disc: '#f2f5ff',
    discGlow: '#a2b6e4',
    haze: '#38497a',
    ink: '#05080f',
    water: '#132043',
    waterLit: '#8299cc',
    discY: 0.2,
  },
  monsoon: {
    sky: ['#4d6470', '#6d8489', '#93a89c', '#bccbb4', '#e0e7d3'],
    disc: '#f5f8ec',
    discGlow: '#d3ddcb',
    haze: '#b3c3b6',
    ink: '#1a2f28',
    water: '#4e7871',
    waterLit: '#a9c8be',
    discY: 0.3,
  },
};

/** Accent families borrowed from the brand palette, keyed by art family. */
const ACCENTS = {
  terracotta: ['#b8502a', '#c85a2c', '#de764d', '#eb9d7c'],
  delta: ['#0b584b', '#0b6f5d', '#128a72', '#2ba98f'],
  sundari: ['#33512b', '#4c7a3a', '#6a9a4c', '#8bb765'],
  marigold: ['#a76420', '#d1862a', '#e8a33d', '#f2c66a'],
  indigo: ['#1d2745', '#2b3a67', '#43578d', '#6f83b5'],
  stone: ['#6b6357', '#8a8073', '#a99e8d', '#c6bcaa'],
};

/** Which mood and accent each landscape family defaults to. */
const FAMILY = {
  sea: { mood: 'dusk', accent: 'delta' },
  island: { mood: 'day', accent: 'delta' },
  hills: { mood: 'dawn', accent: 'indigo' },
  forest: { mood: 'monsoon', accent: 'sundari' },
  mangrove: { mood: 'dawn', accent: 'sundari' },
  river: { mood: 'dusk', accent: 'delta' },
  lake: { mood: 'day', accent: 'delta' },
  haor: { mood: 'monsoon', accent: 'delta' },
  waterfall: { mood: 'monsoon', accent: 'sundari' },
  tea: { mood: 'monsoon', accent: 'sundari' },
  ruins: { mood: 'day', accent: 'terracotta' },
  mosque: { mood: 'dusk', accent: 'terracotta' },
  temple: { mood: 'dawn', accent: 'terracotta' },
  stupa: { mood: 'day', accent: 'terracotta' },
  mansion: { mood: 'dusk', accent: 'stone' },
  fort: { mood: 'day', accent: 'terracotta' },
  city: { mood: 'dusk', accent: 'indigo' },
  bridge: { mood: 'dusk', accent: 'stone' },
  field: { mood: 'dawn', accent: 'marigold' },
  market: { mood: 'day', accent: 'marigold' },
  village: { mood: 'dawn', accent: 'sundari' },
  garden: { mood: 'day', accent: 'marigold' },
};

/* ═══════════════════════════ drawing helpers ═══════════════════════════ */

/** Mix two hex colours. t=0 → a, t=1 → b. */
function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const out = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** A smooth, closed ridge/horizon path across the full width. */
function ridge(rand, baseY, amplitude, points, roughness = 0.5) {
  const step = W / (points - 1);
  const ys = [];
  let y = baseY + rand.f(-amplitude, amplitude) * 0.4;
  for (let i = 0; i < points; i++) {
    y += rand.f(-amplitude, amplitude) * roughness;
    y = Math.max(baseY - amplitude * 1.6, Math.min(baseY + amplitude * 1.2, y));
    ys.push(y);
  }
  let d = `M-40 ${n(ys[0])}`;
  for (let i = 1; i < points; i++) {
    const x0 = (i - 1) * step;
    const x1 = i * step;
    const cx = (x0 + x1) / 2;
    d += ` C${n(cx)} ${n(ys[i - 1])} ${n(cx)} ${n(ys[i])} ${n(x1)} ${n(ys[i])}`;
  }
  d += ` L${W + 40} ${H + 40} L-40 ${H + 40} Z`;
  return d;
}

/** A sharper, more angular ridge — used for hill country. */
function peaks(rand, baseY, height, count) {
  const step = W / count;
  let d = `M-40 ${n(baseY + height * 0.5)}`;
  for (let i = 0; i <= count; i++) {
    const x = i * step + rand.f(-step * 0.25, step * 0.25);
    const y = baseY - Math.abs(Math.sin(i * 1.7 + rand.f(0, 1))) * height * rand.f(0.55, 1);
    const cx = x - step * 0.4;
    d += ` Q${n(cx)} ${n(y + height * 0.25)} ${n(x)} ${n(y)}`;
    d += ` Q${n(x + step * 0.35)} ${n(y + height * 0.3)} ${n(x + step * 0.6)} ${n(baseY + rand.f(-6, 10))}`;
  }
  d += ` L${W + 40} ${H + 40} L-40 ${H + 40} Z`;
  return d;
}

/** Palm tree silhouette at (x, y) with the given trunk height. */
function palm(rand, x, y, h, fill) {
  const lean = rand.f(-0.16, 0.16);
  const topX = x + h * lean;
  const topY = y - h;
  let s = `<path d="M${n(x - h * 0.035)} ${n(y)} Q${n(x + h * lean * 0.3)} ${n(y - h * 0.55)} ${n(topX)} ${n(topY)} L${n(topX + h * 0.035)} ${n(topY)} Q${n(x + h * lean * 0.3 + h * 0.045)} ${n(y - h * 0.55)} ${n(x + h * 0.045)} ${n(y)} Z" fill="${fill}"/>`;
  const fronds = rand.i(6, 8);
  for (let i = 0; i < fronds; i++) {
    const a = (Math.PI * (i + 0.5)) / fronds + rand.f(-0.14, 0.14);
    const len = h * rand.f(0.3, 0.46);
    const ex = topX - Math.cos(a) * len;
    const ey = topY - Math.sin(a) * len * 0.62 + len * 0.25;
    const cx = topX - Math.cos(a) * len * 0.55;
    const cy = topY - Math.sin(a) * len * 0.9;
    s += `<path d="M${n(topX)} ${n(topY)} Q${n(cx)} ${n(cy)} ${n(ex)} ${n(ey)} Q${n(cx)} ${n(cy + len * 0.14)} ${n(topX)} ${n(topY + 3)} Z" fill="${fill}"/>`;
  }
  return s;
}

/** Rounded broadleaf tree silhouette. */
function tree(rand, x, y, h, fill) {
  const w = h * rand.f(0.6, 0.95);
  let s = `<rect x="${n(x - h * 0.028)}" y="${n(y - h * 0.5)}" width="${n(h * 0.056)}" height="${n(h * 0.5)}" fill="${fill}"/>`;
  const blobs = rand.i(3, 5);
  for (let i = 0; i < blobs; i++) {
    const bx = x + rand.f(-w * 0.34, w * 0.34);
    const by = y - h * rand.f(0.52, 0.86);
    const br = w * rand.f(0.24, 0.4);
    s += `<circle cx="${n(bx)}" cy="${n(by)}" r="${n(br)}" fill="${fill}"/>`;
  }
  return s;
}

/** Conical/columnar tree (sal, casuarina, sundari). */
function spire(rand, x, y, h, fill) {
  const w = h * rand.f(0.22, 0.34);
  return `<path d="M${n(x)} ${n(y - h)} Q${n(x + w * 0.75)} ${n(y - h * 0.42)} ${n(x + w * 0.42)} ${n(y)} L${n(x - w * 0.42)} ${n(y)} Q${n(x - w * 0.75)} ${n(y - h * 0.42)} ${n(x)} ${n(y - h)} Z" fill="${fill}"/>`;
}

/** A country boat silhouette — the recurring motif of the whole system. */
function boat(rand, x, y, len, fill, sail = false) {
  const h = len * 0.2;
  let s = `<path d="M${n(x - len / 2)} ${n(y)} Q${n(x - len * 0.42)} ${n(y + h)} ${n(x)} ${n(y + h * 1.05)} Q${n(x + len * 0.42)} ${n(y + h)} ${n(x + len / 2)} ${n(y)} Q${n(x)} ${n(y + h * 0.34)} ${n(x - len / 2)} ${n(y)} Z" fill="${fill}"/>`;
  if (sail) {
    const mh = len * rand.f(0.75, 1.05);
    s += `<rect x="${n(x - len * 0.012)}" y="${n(y - mh)}" width="${n(len * 0.024)}" height="${n(mh)}" fill="${fill}"/>`;
    s += `<path d="M${n(x)} ${n(y - mh)} L${n(x + len * 0.38)} ${n(y - h * 0.1)} L${n(x)} ${n(y - h * 0.1)} Z" fill="${fill}" opacity="0.9"/>`;
  } else {
    s += `<path d="M${n(x - len * 0.06)} ${n(y)} l${n(len * 0.1)} ${n(-len * 0.2)} l${n(len * 0.03)} ${n(len * 0.02)} l${n(-len * 0.1)} ${n(len * 0.2)} Z" fill="${fill}"/>`;
  }
  return s;
}

/** Mughal/Bengali dome with a finial. */
function dome(x, baseY, w, h, fill) {
  const r = w / 2;
  return (
    `<path d="M${n(x - r)} ${n(baseY)} C${n(x - r)} ${n(baseY - h * 1.15)} ${n(x + r)} ${n(baseY - h * 1.15)} ${n(x + r)} ${n(baseY)} Z" fill="${fill}"/>` +
    `<rect x="${n(x - w * 0.045)}" y="${n(baseY - h - w * 0.2)}" width="${n(w * 0.09)}" height="${n(w * 0.22)}" fill="${fill}"/>` +
    `<circle cx="${n(x)}" cy="${n(baseY - h - w * 0.24)}" r="${n(w * 0.055)}" fill="${fill}"/>`
  );
}

/** Slim minaret. */
function minaret(x, baseY, h, w, fill) {
  return (
    `<rect x="${n(x - w / 2)}" y="${n(baseY - h)}" width="${n(w)}" height="${n(h)}" fill="${fill}"/>` +
    `<rect x="${n(x - w * 0.85)}" y="${n(baseY - h - w * 0.35)}" width="${n(w * 1.7)}" height="${n(w * 0.4)}" fill="${fill}"/>` +
    `<path d="M${n(x - w * 0.62)} ${n(baseY - h - w * 0.35)} Q${n(x)} ${n(baseY - h - w * 1.7)} ${n(x + w * 0.62)} ${n(baseY - h - w * 0.35)} Z" fill="${fill}"/>` +
    `<rect x="${n(x - w * 0.06)}" y="${n(baseY - h - w * 2.15)}" width="${n(w * 0.12)}" height="${n(w * 0.5)}" fill="${fill}"/>`
  );
}

/** Bengali ratna / shikhara tower — the temple motif. */
function ratna(x, baseY, w, h, fill) {
  return (
    `<path d="M${n(x - w / 2)} ${n(baseY)} L${n(x - w * 0.36)} ${n(baseY - h * 0.55)} Q${n(x)} ${n(baseY - h * 1.12)} ${n(x + w * 0.36)} ${n(baseY - h * 0.55)} L${n(x + w / 2)} ${n(baseY)} Z" fill="${fill}"/>` +
    `<rect x="${n(x - w * 0.05)}" y="${n(baseY - h * 1.28)}" width="${n(w * 0.1)}" height="${n(h * 0.2)}" fill="${fill}"/>` +
    `<circle cx="${n(x)}" cy="${n(baseY - h * 1.3)}" r="${n(w * 0.07)}" fill="${fill}"/>`
  );
}

/* ═══════════════════════════ scene builders ═══════════════════════════ */

/**
 * Each builder returns SVG markup for the layers between the sky and the
 * foreground vignette. `ctx` carries the RNG, palette and horizon.
 */
const SCENES = {
  /* ── Water & coast ─────────────────────────────────────────────── */
  sea(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    const beachY = H * r.f(0.7, 0.78);
    // Open sea between the horizon and the beach
    s += `<rect x="0" y="${n(hz)}" width="${W}" height="${n(beachY - hz + 30)}" fill="${p.water}"/>`;
    // Reflected sky at the horizon, so the waterline is not a hard edge
    s += `<rect x="0" y="${n(hz)}" width="${W}" height="${n((beachY - hz) * 0.22)}" fill="${mix(p.sky4, p.water, 0.4)}"/>`;
    s += `<rect x="0" y="${n(hz)}" width="${W}" height="3" fill="${p.disc}" opacity="0.35"/>`;
    // Sun glitter widening towards the shore, kept inside the water
    const gx = W * r.f(0.3, 0.7);
    s += `<clipPath id="wtr${n(beachY)}"><rect x="0" y="${n(hz)}" width="${W}" height="${n(beachY - hz - 12)}"/></clipPath>`;
    s += `<g clip-path="url(#wtr${n(beachY)})"><path d="M${n(gx - 20)} ${n(hz)} L${n(gx + 20)} ${n(hz)} L${n(gx + 130)} ${n(beachY)} L${n(gx - 130)} ${n(beachY)} Z" fill="${p.waterLit}" opacity="0.3"/></g>`;
    // Swell lines
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const y = hz + Math.pow(t, 1.5) * (beachY - hz);
      s += `<rect x="0" y="${n(y)}" width="${W}" height="${n(1.5 + t * 5)}" fill="${mix(p.water, p.waterLit, 0.6)}" opacity="${n(0.1 + t * 0.22)}"/>`;
    }
    // Breaking surf: a band along the waterline, clipped to the water
    s += `<clipPath id="surf${n(beachY)}"><rect x="0" y="${n(beachY - 40)}" width="${W}" height="46"/></clipPath>`;
    for (let i = 0; i < 3; i++) {
      const y = beachY - 30 + i * 11;
      s += `<g clip-path="url(#surf${n(beachY)})"><path d="${ridge(r, y, 6, 14, 0.6)}" fill="#ffffff" opacity="${n(0.2 + i * 0.16)}"/></g>`;
    }
    // Wet sand, then dry sand
    s += `<path d="${ridge(r, beachY + 6, 10, 9, 0.4)}" fill="${mix(acc[3], p.waterLit, 0.5)}" opacity="0.9"/>`;
    s += `<path d="${ridge(r, beachY + 52, 12, 8, 0.35)}" fill="${mix('#e8d3aa', p.haze, 0.25)}"/>`;
    // Ripple texture on the sand
    for (let i = 0; i < 7; i++) {
      s += `<path d="${ridge(r, beachY + 70 + i * 22, 6, 8, 0.3)}" fill="${mix('#d9c39c', p.haze, 0.4)}" opacity="0.2"/>`;
    }
    // Boats out on the water
    for (let i = 0; i < r.i(1, 3); i++) {
      const t = r.f(0.1, 0.7);
      s += boat(r, r.f(100, W - 100), hz + t * (beachY - hz), 40 + t * 90, mix(p.ink, p.haze, 0.4 - t * 0.3), r.chance(0.55));
    }
    // Casuarina or palms framing one side
    if (r.chance(0.8)) {
      const side = r.chance(0.5);
      for (let i = 0; i < r.i(2, 4); i++) {
        const x = side ? r.f(-30, 200) : r.f(W - 200, W + 30);
        s += palm(r, x, beachY + r.f(60, 130), r.f(170, 280), p.ink);
      }
    }
    return s;
  },

  island(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = `<rect x="0" y="${n(hz)}" width="${W}" height="${n(H - hz)}" fill="${p.water}"/>`;
    for (let i = 0; i < 7; i++) {
      const y = hz + Math.pow(i / 7, 1.6) * (H - hz);
      s += `<rect x="0" y="${n(y)}" width="${W}" height="${n(2 + i * 1.4)}" fill="${p.waterLit}" opacity="${n(0.1 + i * 0.024)}"/>`;
    }
    // Distant islets
    for (let i = 0; i < r.i(2, 4); i++) {
      const x = r.f(60, W - 60);
      const w = r.f(90, 260);
      const h = r.f(14, 34);
      s += `<path d="M${n(x - w / 2)} ${n(hz + 4)} Q${n(x)} ${n(hz - h)} ${n(x + w / 2)} ${n(hz + 4)} Z" fill="${mix(p.ink, p.haze, 0.62)}"/>`;
    }
    // Main island
    const iy = hz + r.f(70, 140);
    const iw = r.f(560, 800);
    const ix = W * r.f(0.38, 0.62);
    s += `<path d="M${n(ix - iw / 2)} ${n(iy + 26)} Q${n(ix - iw * 0.3)} ${n(iy - 46)} ${n(ix)} ${n(iy - 54)} Q${n(ix + iw * 0.3)} ${n(iy - 44)} ${n(ix + iw / 2)} ${n(iy + 26)} Z" fill="${mix(acc[0], p.ink, 0.35)}"/>`;
    for (let i = 0; i < r.i(4, 7); i++) {
      s += palm(r, ix + r.f(-iw * 0.36, iw * 0.36), iy - r.f(20, 44), r.f(100, 165), mix(acc[0], p.ink, 0.2));
    }
    // Foreground water and a boat
    s += `<path d="${ridge(r, H * 0.86, 10, 7, 0.3)}" fill="${mix(p.water, p.ink, 0.4)}" opacity="0.75"/>`;
    s += boat(r, r.f(150, W - 150), H * 0.8, r.f(90, 140), p.ink, r.chance(0.4));
    return s;
  },

  mangrove(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = `<rect x="0" y="${n(hz)}" width="${W}" height="${n(H - hz)}" fill="${p.water}"/>`;
    // Receding forest walls
    for (let layer = 0; layer < 3; layer++) {
      const t = layer / 3;
      const y = hz + 12 + layer * r.f(38, 62);
      const fill = mix(acc[0], p.haze, 0.55 - layer * 0.24);
      let band = `<path d="${ridge(r, y, 10, 12, 0.5)}" fill="${fill}"/>`;
      for (let i = 0; i < 22 - layer * 4; i++) {
        band += tree(r, r.f(-30, W + 30), y + r.f(0, 10), r.f(46, 96) * (1 + t * 0.7), fill);
      }
      s += band;
    }
    // Waterline and pneumatophore roots
    const wy = H * r.f(0.66, 0.74);
    s += `<rect x="0" y="${n(wy)}" width="${W}" height="${n(H - wy)}" fill="${mix(p.water, p.ink, 0.32)}"/>`;
    for (let i = 0; i < 6; i++) {
      s += `<rect x="0" y="${n(wy + 12 + i * 22)}" width="${W}" height="2.5" fill="${p.waterLit}" opacity="${n(0.1 + i * 0.03)}"/>`;
    }
    const roots = r.i(80, 140);
    for (let i = 0; i < roots; i++) {
      const x = r.f(-10, W + 10);
      const y = wy + r.f(6, H - wy - 8);
      const h = r.f(8, 30) * (0.4 + (y - wy) / (H - wy));
      s += `<rect x="${n(x)}" y="${n(y - h)}" width="${n(r.f(1.6, 3.6))}" height="${n(h)}" fill="${p.ink}" opacity="${n(r.f(0.35, 0.8))}"/>`;
    }
    if (r.chance(0.6)) s += boat(r, r.f(160, W - 160), wy + r.f(30, 80), r.f(90, 150), p.ink);
    return s;
  },

  river(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    // Far bank
    s += `<path d="${ridge(r, hz + 6, 9, 10, 0.4)}" fill="${mix(acc[0], p.haze, 0.5)}"/>`;
    for (let i = 0; i < 16; i++) {
      s += tree(r, r.f(-20, W + 20), hz + r.f(6, 16), r.f(30, 62), mix(acc[0], p.haze, 0.42));
    }
    // The river itself, opening towards the viewer
    const ry = hz + r.f(14, 30);
    s += `<path d="M-40 ${n(H)} L${n(W * r.f(0.24, 0.36))} ${n(ry)} L${n(W * r.f(0.64, 0.76))} ${n(ry)} L${W + 40} ${n(H)} Z" fill="${p.water}"/>`;
    s += `<path d="M${n(W * 0.44)} ${n(ry)} L${n(W * 0.56)} ${n(ry)} L${n(W * 0.72)} ${H} L${n(W * 0.28)} ${H} Z" fill="${p.waterLit}" opacity="0.3"/>`;
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const y = ry + Math.pow(t, 1.6) * (H - ry);
      const spread = 0.1 + t * 0.62;
      s += `<rect x="${n(W * (0.5 - spread))}" y="${n(y)}" width="${n(W * spread * 2)}" height="${n(2 + i * 1.2)}" fill="${p.waterLit}" opacity="${n(0.09 + t * 0.16)}"/>`;
    }
    // Banks
    s += `<path d="M-40 ${n(H * 0.72)} L${n(W * 0.3)} ${n(ry + 8)} L${n(W * 0.2)} ${n(ry + 8)} L-40 ${n(H * 0.62)} Z" fill="${mix(acc[1], p.ink, 0.28)}"/>`;
    s += `<path d="M${W + 40} ${n(H * 0.72)} L${n(W * 0.7)} ${n(ry + 8)} L${n(W * 0.8)} ${n(ry + 8)} L${W + 40} ${n(H * 0.62)} Z" fill="${mix(acc[1], p.ink, 0.28)}"/>`;
    // Boats receding upstream
    for (let i = 0; i < r.i(2, 4); i++) {
      const t = r.f(0.15, 0.9);
      const y = ry + t * (H - ry) * 0.8;
      s += boat(r, W * r.f(0.32, 0.68), y, 40 + t * 130, mix(p.ink, p.haze, 0.15 - t * 0.15), r.chance(0.35));
    }
    return s;
  },

  lake(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    const ridges = 3;
    for (let i = 0; i < ridges; i++) {
      const y = hz - 20 + i * r.f(16, 30);
      s += `<path d="${peaks(r, y, r.f(70, 130) * (1 - i * 0.18), r.i(4, 7))}" fill="${mix(acc[0], p.haze, 0.6 - i * 0.24)}"/>`;
    }
    const wy = hz + r.f(20, 46);
    s += `<rect x="0" y="${n(wy)}" width="${W}" height="${n(H - wy)}" fill="${p.water}"/>`;
    // Mirror reflection of the ridge line
    s += `<g transform="translate(0 ${n(wy * 2)}) scale(1 -1)" opacity="0.3">
      <path d="${peaks(r, hz - 20, 96, 5)}" fill="${mix(acc[0], p.water, 0.4)}"/>
    </g>`;
    for (let i = 0; i < 9; i++) {
      const t = i / 9;
      s += `<rect x="0" y="${n(wy + Math.pow(t, 1.5) * (H - wy))}" width="${W}" height="${n(2 + i * 1.4)}" fill="${p.waterLit}" opacity="${n(0.08 + t * 0.16)}"/>`;
    }
    if (r.chance(0.8)) s += boat(r, r.f(180, W - 180), wy + r.f(60, 180), r.f(70, 130), p.ink);
    // Foreground shore with trees
    s += `<path d="M-40 ${H} L-40 ${n(H * 0.9)} Q${n(W * 0.3)} ${n(H * 0.83)} ${n(W * 0.62)} ${n(H * 0.93)} L${n(W * 0.62)} ${H} Z" fill="${p.ink}"/>`;
    for (let i = 0; i < r.i(3, 6); i++) {
      s += tree(r, r.f(-20, W * 0.6), H * r.f(0.86, 0.94), r.f(80, 160), p.ink);
    }
    return s;
  },

  haor(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    // Distant escarpment (the Meghalaya wall)
    if (r.chance(0.75)) {
      s += `<path d="${peaks(r, hz - 6, r.f(50, 90), r.i(5, 8))}" fill="${mix(acc[0], p.haze, 0.68)}" opacity="0.9"/>`;
    }
    s += `<rect x="0" y="${n(hz)}" width="${W}" height="${n(H - hz)}" fill="${p.water}"/>`;
    // A band of reflected sky right at the horizon — this is what makes a haor read
    s += `<rect x="0" y="${n(hz)}" width="${W}" height="${n((H - hz) * 0.16)}" fill="${mix(p.sky4, p.water, 0.35)}"/>`;
    s += `<rect x="0" y="${n(hz)}" width="${W}" height="4" fill="${p.disc}" opacity="0.4"/>`;
    // Village mounds sitting on the water
    const mounds = r.i(3, 6);
    for (let i = 0; i < mounds; i++) {
      const x = r.f(60, W - 60);
      const y = hz + r.f(10, 90);
      const w = r.f(70, 180);
      const fill = mix(p.ink, p.haze, 0.3);
      s += `<path d="M${n(x - w / 2)} ${n(y)} Q${n(x)} ${n(y - 12)} ${n(x + w / 2)} ${n(y)} Z" fill="${fill}"/>`;
      for (let j = 0; j < r.i(2, 5); j++) {
        s += tree(r, x + r.f(-w * 0.4, w * 0.4), y - 2, r.f(20, 46), fill);
      }
      s += `<rect x="${n(x - w / 2)}" y="${n(y)}" width="${n(w)}" height="3" fill="${p.waterLit}" opacity="0.35"/>`;
    }
    // Open water bands to the foreground
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      s += `<rect x="0" y="${n(hz + Math.pow(t, 1.5) * (H - hz))}" width="${W}" height="${n(2 + i * 1.3)}" fill="${p.waterLit}" opacity="${n(0.07 + t * 0.15)}"/>`;
    }
    // Reeds in the foreground
    for (let i = 0; i < r.i(30, 60); i++) {
      const x = r.f(-10, W + 10);
      const h = r.f(30, 90);
      const lean = r.f(-10, 10);
      s += `<path d="M${n(x)} ${H} Q${n(x + lean * 0.4)} ${n(H - h * 0.6)} ${n(x + lean)} ${n(H - h)}" stroke="${p.ink}" stroke-width="${n(r.f(1.4, 3))}" fill="none" opacity="${n(r.f(0.4, 0.9))}"/>`;
    }
    if (r.chance(0.7)) s += boat(r, r.f(150, W - 150), hz + r.f(120, 240), r.f(80, 150), p.ink, r.chance(0.5));
    return s;
  },

  waterfall(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    // Backing ridge
    s += `<path d="${peaks(r, hz + 6, r.f(90, 150), r.i(3, 5))}" fill="${mix(acc[0], p.haze, 0.55)}"/>`;

    // The gorge: two cliff walls closing in on the fall
    const cliffTop = hz + r.f(16, 48);
    const fx = W * r.f(0.42, 0.58);
    const fw = r.f(150, 240);
    const poolY = H * r.f(0.76, 0.85);
    const wallDark = mix(acc[0], p.ink, 0.72);
    const wallMid = mix(acc[0], p.ink, 0.56);

    // Left wall
    s += `<path d="M-40 ${n(cliffTop - 40)} L${n(fx - fw * 0.5)} ${n(cliffTop + 10)} L${n(fx - fw * 0.62)} ${n(poolY + 20)} L-40 ${H} Z" fill="${wallMid}"/>`;
    s += `<path d="M-40 ${n(cliffTop + 30)} L${n(fx - fw * 0.66)} ${n(cliffTop + 60)} L${n(fx - fw * 0.78)} ${H} L-40 ${H} Z" fill="${wallDark}"/>`;
    // Right wall
    s += `<path d="M${W + 40} ${n(cliffTop - 30)} L${n(fx + fw * 0.5)} ${n(cliffTop + 10)} L${n(fx + fw * 0.62)} ${n(poolY + 20)} L${W + 40} ${H} Z" fill="${wallMid}"/>`;
    s += `<path d="M${W + 40} ${n(cliffTop + 40)} L${n(fx + fw * 0.66)} ${n(cliffTop + 70)} L${n(fx + fw * 0.78)} ${H} L${W + 40} ${H} Z" fill="${wallDark}"/>`;
    // Rock strata
    for (let i = 0; i < 9; i++) {
      const y = cliffTop + 60 + i * ((H - cliffTop - 60) / 9);
      s += `<path d="M-40 ${n(y)} L${n(fx - fw * 0.7)} ${n(y + 14)}" stroke="${p.ink}" stroke-width="2" opacity="0.2"/>`;
      s += `<path d="M${W + 40} ${n(y + 8)} L${n(fx + fw * 0.7)} ${n(y + 22)}" stroke="${p.ink}" stroke-width="2" opacity="0.2"/>`;
    }

    // The fall itself — wide at the lip, spreading as it drops
    const lip = fw * 0.42;
    const foot = fw * 0.56;
    s += `<path d="M${n(fx - lip)} ${n(cliffTop + 8)} L${n(fx + lip)} ${n(cliffTop + 8)} L${n(fx + foot)} ${n(poolY)} L${n(fx - foot)} ${n(poolY)} Z" fill="#ffffff" opacity="0.82"/>`;
    s += `<path d="M${n(fx - lip * 0.6)} ${n(cliffTop + 8)} L${n(fx + lip * 0.6)} ${n(cliffTop + 8)} L${n(fx + foot * 0.7)} ${n(poolY)} L${n(fx - foot * 0.7)} ${n(poolY)} Z" fill="#ffffff" opacity="0.5"/>`;
    // Streaking
    for (let i = 0; i < 14; i++) {
      const t = r.f(-1, 1);
      const x0 = fx + t * lip;
      const x1 = fx + t * foot;
      s += `<path d="M${n(x0)} ${n(cliffTop + 8)} L${n(x1)} ${n(poolY)}" stroke="${mix('#ffffff', p.waterLit, 0.4)}" stroke-width="${n(r.f(1.5, 5))}" opacity="${n(r.f(0.15, 0.45))}"/>`;
    }
    // Lip highlight
    s += `<rect x="${n(fx - lip)}" y="${n(cliffTop + 4)}" width="${n(lip * 2)}" height="7" fill="#ffffff" opacity="0.9"/>`;

    // Spray at the base
    for (let i = 0; i < r.i(5, 9); i++) {
      s += `<ellipse cx="${n(fx + r.f(-foot, foot))}" cy="${n(poolY + r.f(-20, 16))}" rx="${n(r.f(40, 110))}" ry="${n(r.f(14, 34))}" fill="#ffffff" opacity="${n(r.f(0.12, 0.3))}"/>`;
    }

    // Plunge pool
    s += `<rect x="0" y="${n(poolY)}" width="${W}" height="${n(H - poolY)}" fill="${p.water}"/>`;
    for (let i = 0; i < 7; i++) {
      s += `<rect x="0" y="${n(poolY + 12 + i * 20)}" width="${W}" height="${n(2 + i)}" fill="${p.waterLit}" opacity="${n(0.12 + i * 0.04)}"/>`;
    }
    // Boulders in and around the pool
    for (let i = 0; i < r.i(8, 15); i++) {
      const bx = r.f(0, W);
      const by = poolY + r.f(-4, H - poolY - 6);
      const br = r.f(14, 52) * (0.5 + (by - poolY) / (H - poolY));
      s += `<ellipse cx="${n(bx)}" cy="${n(by)}" rx="${n(br)}" ry="${n(br * 0.6)}" fill="${p.ink}" opacity="${n(r.f(0.6, 0.95))}"/>`;
    }
    // Canopy leaning in over the gorge
    for (let i = 0; i < r.i(4, 7); i++) {
      const side = r.chance(0.5);
      const x = side ? r.f(-40, fx - fw * 0.6) : r.f(fx + fw * 0.6, W + 40);
      s += tree(r, x, cliffTop + r.f(20, 90), r.f(90, 190), mix(acc[0], p.ink, 0.82));
    }
    return s;
  },

  /* ── Land ─────────────────────────────────────────────────────── */
  hills(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    const layers = r.i(4, 6);
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1);
      const y = hz - 40 + t * (H * 0.55);
      const fill = mix(mix(acc[0], p.haze, 0.72), p.ink, t * 0.95);
      s += `<path d="${peaks(r, y, r.f(90, 180) * (1 - t * 0.35), r.i(3, 6))}" fill="${fill}"/>`;
      if (i > layers - 3) {
        for (let j = 0; j < r.i(6, 16); j++) {
          s += spire(r, r.f(-20, W + 20), y + r.f(20, 80), r.f(26, 60), fill);
        }
      }
    }
    // Cloud sitting in the valleys
    if (r.chance(0.8)) {
      for (let i = 0; i < r.i(2, 4); i++) {
        const y = hz + r.f(-10, 90);
        s += `<ellipse cx="${n(r.f(100, W - 100))}" cy="${n(y)}" rx="${n(r.f(160, 340))}" ry="${n(r.f(14, 30))}" fill="#ffffff" opacity="${n(r.f(0.16, 0.36))}"/>`;
      }
    }
    return s;
  },

  forest(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1);
      const y = hz + t * (H - hz) * 0.82;
      const fill = mix(mix(acc[0], p.haze, 0.6), p.ink, t * 0.9);
      s += `<path d="${ridge(r, y, 14, 10, 0.5)}" fill="${fill}"/>`;
      const count = Math.round(26 - i * 4);
      for (let j = 0; j < count; j++) {
        const x = r.f(-30, W + 30);
        const h = r.f(50, 120) * (0.6 + t);
        if (r.chance(0.45)) s += spire(r, x, y + r.f(0, 18), h, fill);
        else s += tree(r, x, y + r.f(0, 18), h, fill);
      }
    }
    // Light shafts through the canopy
    if (r.chance(0.55)) {
      for (let i = 0; i < r.i(1, 3); i++) {
        const x = r.f(140, W - 140);
        s += `<path d="M${n(x)} 0 L${n(x + 44)} 0 L${n(x + 120)} ${n(H * 0.72)} L${n(x - 30)} ${n(H * 0.72)} Z" fill="${p.disc}" opacity="0.05"/>`;
      }
    }
    // Fern and undergrowth silhouettes anchoring the foreground
    for (let i = 0; i < r.i(18, 34); i++) {
      const x = r.f(-20, W + 20);
      const h = r.f(40, 120);
      const lean = r.f(-24, 24);
      s += `<path d="M${n(x)} ${H} Q${n(x + lean * 0.5)} ${n(H - h * 0.7)} ${n(x + lean)} ${n(H - h)}" stroke="${p.ink}" stroke-width="${n(r.f(2, 5))}" fill="none" opacity="${n(r.f(0.5, 0.95))}"/>`;
    }
    return s;
  },

  tea(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${peaks(r, hz - 10, r.f(60, 110), r.i(4, 6))}" fill="${mix(acc[0], p.haze, 0.62)}"/>`;
    // Terraced rows of tea, receding
    const rows = r.i(11, 16);
    for (let i = 0; i < rows; i++) {
      const t = i / rows;
      const y = hz + 14 + Math.pow(t, 1.35) * (H - hz);
      const fill = mix(mix(acc[1], p.haze, 0.44 - t * 0.4), p.ink, t * 0.42);
      const amp = 8 + t * 22;
      s += `<path d="${ridge(r, y, amp, 8, 0.4)}" fill="${fill}"/>`;
      // Bush texture along the row edge
      const bushes = Math.round(30 + t * 30);
      for (let j = 0; j < bushes; j++) {
        const x = r.f(-20, W + 20);
        const rr = (3 + t * 12) * r.f(0.7, 1.3);
        s += `<circle cx="${n(x)}" cy="${n(y + r.f(-2, 6))}" r="${n(rr)}" fill="${mix(fill, p.ink, 0.16)}" opacity="0.85"/>`;
      }
    }
    // Shade trees standing over the tea
    for (let i = 0; i < r.i(4, 8); i++) {
      const t = r.f(0.15, 0.9);
      const y = hz + 20 + Math.pow(t, 1.3) * (H - hz) * 0.92;
      s += tree(r, r.f(-20, W + 20), y, r.f(70, 210) * (0.5 + t), mix(p.ink, acc[0], 0.25 - t * 0.25));
    }
    return s;
  },

  field(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    // Tree line on the horizon
    s += `<path d="${ridge(r, hz + 4, 6, 10, 0.35)}" fill="${mix(acc[0], p.haze, 0.55)}"/>`;
    for (let i = 0; i < 18; i++) {
      const x = r.f(-20, W + 20);
      if (r.chance(0.35)) s += palm(r, x, hz + 8, r.f(46, 84), mix(acc[0], p.haze, 0.48));
      else s += tree(r, x, hz + 8, r.f(30, 62), mix(acc[0], p.haze, 0.48));
    }
    // Paddy bands
    const bands = r.i(6, 9);
    for (let i = 0; i < bands; i++) {
      const t = i / bands;
      const y = hz + 10 + Math.pow(t, 1.4) * (H - hz);
      const fill = mix(mix(acc[2], acc[1], t), p.ink, t * 0.36);
      s += `<path d="${ridge(r, y, 6 + t * 16, 7, 0.35)}" fill="${fill}"/>`;
      // Bunds between the plots
      s += `<path d="${ridge(r, y + 2, 5 + t * 12, 7, 0.35)}" fill="${mix(fill, p.ink, 0.22)}" opacity="0.55"/>`;
    }
    // Kash grass in the foreground
    for (let i = 0; i < r.i(40, 80); i++) {
      const x = r.f(-10, W + 10);
      const h = r.f(40, 110);
      const lean = r.f(-16, 16);
      s += `<path d="M${n(x)} ${H} Q${n(x + lean * 0.4)} ${n(H - h * 0.6)} ${n(x + lean)} ${n(H - h)}" stroke="${p.ink}" stroke-width="${n(r.f(1.4, 3))}" fill="none" opacity="${n(r.f(0.35, 0.85))}"/>`;
      if (r.chance(0.5)) {
        s += `<ellipse cx="${n(x + lean)}" cy="${n(H - h)}" rx="${n(r.f(3, 7))}" ry="${n(r.f(8, 18))}" fill="${mix('#ffffff', p.haze, 0.35)}" opacity="${n(r.f(0.35, 0.7))}" transform="rotate(${n(lean * 0.8)} ${n(x + lean)} ${n(H - h)})"/>`;
      }
    }
    return s;
  },

  village(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${ridge(r, hz + 8, 8, 9, 0.4)}" fill="${mix(acc[0], p.haze, 0.55)}"/>`;
    for (let i = 0; i < 12; i++) {
      s += tree(r, r.f(-20, W + 20), hz + 12, r.f(34, 70), mix(acc[0], p.haze, 0.48));
    }
    // Homesteads under palms, with the tin roofs catching the light
    const homes = r.i(4, 7);
    const baseY = H * r.f(0.62, 0.7);
    s += `<path d="${ridge(r, baseY + 20, 10, 8, 0.35)}" fill="${mix(acc[1], p.ink, 0.34)}"/>`;
    for (let i = 0; i < homes; i++) {
      const x = (W / (homes + 1)) * (i + 1) + r.f(-60, 60);
      const w = r.f(90, 160);
      const y = baseY + r.f(-10, 26);
      const wall = mix(p.ink, acc[0], 0.22);
      const roof = mix(p.haze, p.ink, r.f(0.28, 0.5));
      const rh = w * r.f(0.34, 0.46);
      // Curved chala roof, lit
      s += `<path d="M${n(x - w * 0.56)} ${n(y)} L${n(x - w * 0.46)} ${n(y - rh * 0.68)} Q${n(x)} ${n(y - rh * 1.18)} ${n(x + w * 0.46)} ${n(y - rh * 0.68)} L${n(x + w * 0.56)} ${n(y)} Z" fill="${roof}"/>`;
      // Roof corrugation
      for (let j = 1; j < 7; j++) {
        const rx = x - w * 0.46 + (w * 0.92 * j) / 7;
        s += `<path d="M${n(rx)} ${n(y)} L${n(rx)} ${n(y - rh * 0.82)}" stroke="${p.ink}" stroke-width="1.6" opacity="0.22"/>`;
      }
      // Walls and a doorway
      s += `<rect x="${n(x - w * 0.4)}" y="${n(y)}" width="${n(w * 0.8)}" height="${n(w * 0.3)}" fill="${wall}"/>`;
      s += `<rect x="${n(x - w * 0.08)}" y="${n(y + w * 0.08)}" width="${n(w * 0.16)}" height="${n(w * 0.22)}" fill="${p.ink}"/>`;
    }
    for (let i = 0; i < r.i(6, 10); i++) {
      s += palm(r, r.f(-20, W + 20), baseY + r.f(0, 60), r.f(130, 240), p.ink);
    }
    // Pond in the foreground, as every Bengali homestead has
    const py = H * r.f(0.88, 0.94);
    s += `<ellipse cx="${n(W * r.f(0.3, 0.7))}" cy="${n(py + 40)}" rx="${n(W * 0.46)}" ry="${n(H * 0.11)}" fill="${p.water}" opacity="0.85"/>`;
    for (let i = 0; i < 4; i++) {
      s += `<rect x="${n(W * 0.1)}" y="${n(py + 12 + i * 16)}" width="${n(W * 0.8)}" height="2" fill="${p.waterLit}" opacity="${n(0.14 + i * 0.05)}"/>`;
    }
    return s;
  },

  garden(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${ridge(r, hz + 6, 7, 9, 0.35)}" fill="${mix(acc[0], p.haze, 0.55)}"/>`;
    for (let i = 0; i < 14; i++) {
      s += tree(r, r.f(-20, W + 20), hz + 10, r.f(40, 80), mix(acc[0], p.haze, 0.45));
    }
    // Orderly rows of trees, receding
    const rows = r.i(4, 6);
    for (let i = 0; i < rows; i++) {
      const t = i / rows;
      const y = hz + 30 + Math.pow(t, 1.3) * (H - hz) * 0.9;
      const fill = mix(mix(acc[1], p.haze, 0.4 - t * 0.36), p.ink, t * 0.5);
      s += `<path d="${ridge(r, y + 10, 5 + t * 10, 6, 0.25)}" fill="${mix(acc[2], p.ink, 0.24 + t * 0.3)}"/>`;
      const count = Math.round(9 - i);
      for (let j = 0; j <= count; j++) {
        const x = (W / count) * j + r.f(-24, 24);
        s += tree(r, x, y + 12, r.f(70, 140) * (0.55 + t), fill);
      }
    }
    // Flower beds in the foreground, as discrete blocks rather than a wash
    const beds = r.i(3, 5);
    for (let i = 0; i < beds; i++) {
      const y = H * (0.86 + i * 0.04);
      const col = r.pick(ACCENTS.marigold.concat(ACCENTS.terracotta));
      s += `<path d="${ridge(r, y, 5, 7, 0.25)}" fill="${mix(col, p.ink, 0.45)}"/>`;
      for (let j = 0; j < 44; j++) {
        s += `<circle cx="${n(r.f(-10, W + 10))}" cy="${n(y + r.f(-6, 10))}" r="${n(r.f(3, 7))}" fill="${col}" opacity="${n(r.f(0.55, 1))}"/>`;
      }
    }
    return s;
  },

  /* ── Built ────────────────────────────────────────────────────── */
  mosque(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${ridge(r, hz + 10, 6, 8, 0.3)}" fill="${mix(acc[0], p.haze, 0.6)}"/>`;
    for (let i = 0; i < 10; i++) s += tree(r, r.f(-20, W + 20), hz + 16, r.f(34, 74), mix(acc[0], p.haze, 0.5));

    const baseY = H * r.f(0.66, 0.72);
    const cx = W * r.f(0.44, 0.56);
    const bw = r.f(420, 620);
    const fill = p.ink;
    // Prayer hall block
    s += `<rect x="${n(cx - bw / 2)}" y="${n(baseY - bw * 0.2)}" width="${n(bw)}" height="${n(bw * 0.2 + 60)}" fill="${fill}"/>`;
    // Dome field — one large, flanked by smaller
    const domes = r.i(3, 7);
    const step = bw / (domes + 1);
    for (let i = 1; i <= domes; i++) {
      const isCentre = i === Math.ceil(domes / 2);
      const dw = isCentre ? step * r.f(1.5, 1.9) : step * r.f(0.85, 1.1);
      s += dome(cx - bw / 2 + step * i, baseY - bw * 0.2, dw, dw * r.f(0.5, 0.66), fill);
    }
    // Arched openings
    const arches = domes + 1;
    for (let i = 0; i < arches; i++) {
      const ax = cx - bw / 2 + (bw / arches) * (i + 0.5);
      const aw = (bw / arches) * 0.5;
      s += `<path d="M${n(ax - aw / 2)} ${n(baseY + 60)} L${n(ax - aw / 2)} ${n(baseY - bw * 0.05)} Q${n(ax)} ${n(baseY - bw * 0.14)} ${n(ax + aw / 2)} ${n(baseY - bw * 0.05)} L${n(ax + aw / 2)} ${n(baseY + 60)} Z" fill="${mix(p.disc, p.ink, 0.72)}" opacity="0.55"/>`;
    }
    // Minarets
    s += minaret(cx - bw / 2 - r.f(20, 50), baseY + 60, bw * r.f(0.42, 0.56), bw * 0.036, fill);
    s += minaret(cx + bw / 2 + r.f(20, 50), baseY + 60, bw * r.f(0.42, 0.56), bw * 0.036, fill);
    // Reflecting tank
    s += `<rect x="0" y="${n(baseY + 60)}" width="${W}" height="${n(H - baseY - 60)}" fill="${p.water}"/>`;
    s += `<g transform="translate(0 ${n((baseY + 60) * 2)}) scale(1 -1)" opacity="0.22">
      <rect x="${n(cx - bw / 2)}" y="${n(baseY - bw * 0.2)}" width="${n(bw)}" height="${n(bw * 0.2 + 60)}" fill="${fill}"/>
    </g>`;
    for (let i = 0; i < 6; i++) {
      s += `<rect x="0" y="${n(baseY + 76 + i * 24)}" width="${W}" height="2.5" fill="${p.waterLit}" opacity="${n(0.12 + i * 0.04)}"/>`;
    }
    return s;
  },

  temple(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${ridge(r, hz + 12, 6, 8, 0.3)}" fill="${mix(acc[0], p.haze, 0.6)}"/>`;
    for (let i = 0; i < 10; i++) s += tree(r, r.f(-20, W + 20), hz + 18, r.f(34, 78), mix(acc[0], p.haze, 0.5));

    const baseY = H * r.f(0.7, 0.78);
    const cx = W * r.f(0.42, 0.58);
    const bw = r.f(280, 400);
    const fill = p.ink;
    // Plinth
    s += `<rect x="${n(cx - bw * 0.72)}" y="${n(baseY)}" width="${n(bw * 1.44)}" height="${n(H - baseY)}" fill="${fill}"/>`;
    s += `<rect x="${n(cx - bw * 0.62)}" y="${n(baseY - bw * 0.34)}" width="${n(bw * 1.24)}" height="${n(bw * 0.34)}" fill="${fill}"/>`;
    // Navaratna: four corner towers plus a central one
    const th = bw * r.f(0.62, 0.86);
    s += ratna(cx, baseY - bw * 0.34, bw * 0.44, th, fill);
    const corners = [-0.46, 0.46];
    for (const c of corners) {
      s += ratna(cx + bw * c, baseY - bw * 0.34, bw * 0.24, th * 0.52, fill);
    }
    if (r.chance(0.6)) {
      for (const c of corners) {
        s += ratna(cx + bw * c * 0.55, baseY - bw * 0.34 - th * 0.32, bw * 0.18, th * 0.36, fill);
      }
    }
    // Arched entrances
    for (let i = 0; i < 3; i++) {
      const ax = cx + (i - 1) * bw * 0.36;
      const aw = bw * 0.2;
      s += `<path d="M${n(ax - aw / 2)} ${n(baseY)} L${n(ax - aw / 2)} ${n(baseY - bw * 0.18)} Q${n(ax)} ${n(baseY - bw * 0.3)} ${n(ax + aw / 2)} ${n(baseY - bw * 0.18)} L${n(ax + aw / 2)} ${n(baseY)} Z" fill="${mix(p.disc, p.ink, 0.7)}" opacity="0.5"/>`;
    }
    // Terracotta panel banding, suggested rather than drawn
    for (let i = 0; i < 5; i++) {
      const y = baseY - bw * 0.32 + i * 7;
      s += `<rect x="${n(cx - bw * 0.6)}" y="${n(y)}" width="${n(bw * 1.2)}" height="2" fill="${acc[2]}" opacity="0.3"/>`;
    }
    // Tank in front
    s += `<ellipse cx="${n(W * 0.5)}" cy="${n(H * 1.02)}" rx="${n(W * 0.6)}" ry="${n(H * 0.1)}" fill="${p.water}" opacity="0.75"/>`;
    return s;
  },

  stupa(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${ridge(r, hz + 16, 8, 8, 0.35)}" fill="${mix(acc[0], p.haze, 0.6)}"/>`;
    const baseY = H * r.f(0.74, 0.82);
    const cx = W * r.f(0.44, 0.56);
    const bw = r.f(520, 720);
    const fill = p.ink;
    // Terraced platform, stepping inward
    const terraces = r.i(3, 5);
    for (let i = 0; i < terraces; i++) {
      const t = i / terraces;
      const w = bw * (1 - t * 0.52);
      const h = bw * 0.055;
      const y = baseY - i * h * 1.5;
      s += `<rect x="${n(cx - w / 2)}" y="${n(y - h)}" width="${n(w)}" height="${n(h * 1.5)}" fill="${mix(fill, acc[0], 0.06 * i)}"/>`;
      // Plaque band
      s += `<rect x="${n(cx - w / 2)}" y="${n(y - h * 0.5)}" width="${n(w)}" height="3" fill="${acc[2]}" opacity="0.32"/>`;
    }
    // Central shrine
    const topY = baseY - terraces * bw * 0.0825 - bw * 0.02;
    const sw = bw * 0.3;
    s += `<rect x="${n(cx - sw / 2)}" y="${n(topY - sw * 0.55)}" width="${n(sw)}" height="${n(sw * 0.6)}" fill="${fill}"/>`;
    s += `<path d="M${n(cx - sw * 0.56)} ${n(topY - sw * 0.55)} L${n(cx)} ${n(topY - sw * 1.15)} L${n(cx + sw * 0.56)} ${n(topY - sw * 0.55)} Z" fill="${fill}"/>`;
    s += `<rect x="${n(cx - sw * 0.035)}" y="${n(topY - sw * 1.42)}" width="${n(sw * 0.07)}" height="${n(sw * 0.3)}" fill="${fill}"/>`;
    // Monastic cells suggested along the base
    for (let i = 0; i < 16; i++) {
      const x = (W / 16) * i + r.f(-4, 4);
      s += `<rect x="${n(x)}" y="${n(baseY + bw * 0.02)}" width="${n(W / 16 - 8)}" height="${n(bw * 0.06)}" fill="${mix(fill, p.haze, 0.12)}"/>`;
    }
    s += `<rect x="0" y="${n(baseY + bw * 0.08)}" width="${W}" height="${n(H)}" fill="${mix(acc[0], p.ink, 0.55)}"/>`;
    return s;
  },

  ruins(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${ridge(r, hz + 14, 8, 9, 0.4)}" fill="${mix(acc[0], p.haze, 0.6)}"/>`;
    for (let i = 0; i < 8; i++) s += tree(r, r.f(-20, W + 20), hz + 20, r.f(34, 76), mix(acc[0], p.haze, 0.5));

    const baseY = H * r.f(0.7, 0.78);
    // Excavated brick reads warmer than a pure silhouette — this is Paharpur red.
    const brick = mix(acc[0], p.ink, 0.42);
    const brickLit = mix(acc[1], p.haze, 0.28);

    // Broken wall line, with a raking-light face and openings through it
    let x = -40;
    while (x < W + 40) {
      const w = r.f(80, 210);
      const h = r.f(50, 210);
      const gap = r.chance(0.24);
      if (!gap) {
        // Ragged top — walls do not break level
        const notch = r.f(6, 26);
        s += `<path d="M${n(x)} ${n(baseY + 24)} L${n(x)} ${n(baseY - h)} L${n(x + w * 0.4)} ${n(baseY - h + notch)} L${n(x + w * 0.62)} ${n(baseY - h - notch * 0.5)} L${n(x + w)} ${n(baseY - h + notch * 0.7)} L${n(x + w)} ${n(baseY + 24)} Z" fill="${brick}"/>`;
        // Lit edge along the top course
        s += `<path d="M${n(x)} ${n(baseY - h)} L${n(x + w * 0.4)} ${n(baseY - h + notch)} L${n(x + w * 0.62)} ${n(baseY - h - notch * 0.5)} L${n(x + w)} ${n(baseY - h + notch * 0.7)}" stroke="${brickLit}" stroke-width="5" fill="none" opacity="0.6"/>`;
        // Arched opening through the wall, showing sky beyond
        if (w > 110 && r.chance(0.7)) {
          const aw = w * r.f(0.28, 0.44);
          const ah = h * r.f(0.42, 0.66);
          const axx = x + w / 2;
          s += `<path d="M${n(axx - aw / 2)} ${n(baseY + 24)} L${n(axx - aw / 2)} ${n(baseY - ah)} Q${n(axx)} ${n(baseY - ah - aw * 0.5)} ${n(axx + aw / 2)} ${n(baseY - ah)} L${n(axx + aw / 2)} ${n(baseY + 24)} Z" fill="${p.sky4}" opacity="0.6"/>`;
        }
        // Brick courses
        for (let i = 1; i < Math.floor(h / 16); i++) {
          s += `<rect x="${n(x)}" y="${n(baseY - h + i * 16)}" width="${n(w)}" height="1.6" fill="${p.ink}" opacity="0.14"/>`;
        }
      }
      x += w + (gap ? r.f(40, 100) : r.f(4, 14));
    }

    // A surviving tower or stupa core standing above the wall line
    if (r.chance(0.8)) {
      const tx = W * r.f(0.24, 0.76);
      const tw = r.f(90, 150);
      const th = r.f(190, 320);
      s += `<path d="M${n(tx - tw / 2)} ${n(baseY + 24)} L${n(tx - tw * 0.42)} ${n(baseY - th)} L${n(tx + tw * 0.42)} ${n(baseY - th * 0.94)} L${n(tx + tw / 2)} ${n(baseY + 24)} Z" fill="${mix(brick, p.ink, 0.18)}"/>`;
      for (let i = 1; i < Math.floor(th / 18); i++) {
        s += `<rect x="${n(tx - tw * 0.46)}" y="${n(baseY - th + i * 18)}" width="${n(tw * 0.92)}" height="1.6" fill="${p.ink}" opacity="0.16"/>`;
      }
      // A fig tree growing out of the top — the signature of a Bengali ruin
      if (r.chance(0.6)) s += tree(r, tx + r.f(-20, 20), baseY - th + 6, r.f(50, 90), mix(acc[0], p.ink, 0.8));
    }

    // Ground: red laterite earth with scattered brick
    s += `<rect x="0" y="${n(baseY + 24)}" width="${W}" height="${n(H - baseY - 24)}" fill="${mix(acc[0], p.ink, 0.5)}"/>`;
    s += `<path d="${ridge(r, baseY + 60, 8, 8, 0.3)}" fill="${mix(acc[1], p.ink, 0.5)}" opacity="0.6"/>`;
    for (let i = 0; i < r.i(26, 48); i++) {
      const bx = r.f(0, W);
      const by = r.f(baseY + 30, H);
      const bwd = r.f(8, 22) * (0.5 + (by - baseY) / (H - baseY));
      s += `<rect x="${n(bx)}" y="${n(by)}" width="${n(bwd)}" height="${n(bwd * 0.36)}" fill="${p.ink}" opacity="${n(r.f(0.25, 0.6))}" transform="rotate(${n(r.f(-20, 20))} ${n(bx)} ${n(by)})"/>`;
    }
    return s;
  },

  fort(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${ridge(r, hz + 18, 7, 8, 0.3)}" fill="${mix(acc[0], p.haze, 0.6)}"/>`;
    const baseY = H * r.f(0.68, 0.76);
    const fill = p.ink;
    // Curtain wall with crenellations
    const wallTop = baseY - r.f(90, 150);
    s += `<rect x="-40" y="${n(wallTop)}" width="${n(W + 80)}" height="${n(baseY - wallTop + 40)}" fill="${fill}"/>`;
    const merlons = 26;
    for (let i = 0; i < merlons; i++) {
      const mx = -40 + ((W + 80) / merlons) * i;
      s += `<path d="M${n(mx)} ${n(wallTop)} L${n(mx)} ${n(wallTop - 14)} L${n(mx + ((W + 80) / merlons - 10) / 2)} ${n(wallTop - 24)} L${n(mx + (W + 80) / merlons - 10)} ${n(wallTop - 14)} L${n(mx + (W + 80) / merlons - 10)} ${n(wallTop)} Z" fill="${fill}"/>`;
    }
    // Lit stone face and blind arcading along the curtain wall
    s += `<rect x="-40" y="${n(wallTop)}" width="${n(W + 80)}" height="7" fill="${mix(fill, p.haze, 0.4)}"/>`;
    for (let i = 0; i < 22; i++) {
      const ax = -40 + ((W + 80) / 22) * (i + 0.5);
      const aw = (W + 80) / 22 * 0.5;
      const ah = (baseY - wallTop) * 0.42;
      s += `<path d="M${n(ax - aw / 2)} ${n(baseY)} L${n(ax - aw / 2)} ${n(baseY - ah)} Q${n(ax)} ${n(baseY - ah - aw * 0.4)} ${n(ax + aw / 2)} ${n(baseY - ah)} L${n(ax + aw / 2)} ${n(baseY)} Z" fill="${mix(fill, p.ink, 0.5)}" opacity="0.7"/>`;
    }
    // Bastions
    for (const bx of [W * r.f(0.16, 0.24), W * r.f(0.76, 0.84)]) {
      const bw = r.f(120, 170);
      const bh = r.f(150, 220);
      s += `<rect x="${n(bx - bw / 2)}" y="${n(baseY - bh)}" width="${n(bw)}" height="${n(bh + 40)}" fill="${fill}"/>`;
      s += dome(bx, baseY - bh, bw * 0.96, bw * 0.42, fill);
    }
    // Gateway
    const gx = W * 0.5;
    const gw = r.f(120, 180);
    const gh = r.f(150, 210);
    s += `<rect x="${n(gx - gw / 2)}" y="${n(baseY - gh)}" width="${n(gw)}" height="${n(gh + 40)}" fill="${fill}"/>`;
    s += `<path d="M${n(gx - gw * 0.26)} ${n(baseY + 40)} L${n(gx - gw * 0.26)} ${n(baseY - gh * 0.42)} Q${n(gx)} ${n(baseY - gh * 0.66)} ${n(gx + gw * 0.26)} ${n(baseY - gh * 0.42)} L${n(gx + gw * 0.26)} ${n(baseY + 40)} Z" fill="${mix(p.disc, p.ink, 0.76)}" opacity="0.6"/>`;
    s += dome(gx, baseY - gh, gw * 0.7, gw * 0.32, fill);
    // Foreground garden
    s += `<rect x="0" y="${n(baseY + 40)}" width="${W}" height="${n(H - baseY - 40)}" fill="${mix(acc[0], p.ink, 0.6)}"/>`;
    s += `<rect x="${n(W * 0.42)}" y="${n(baseY + 60)}" width="${n(W * 0.16)}" height="${n(H - baseY - 60)}" fill="${p.water}" opacity="0.7"/>`;
    return s;
  },

  mansion(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${ridge(r, hz + 14, 7, 8, 0.3)}" fill="${mix(acc[0], p.haze, 0.6)}"/>`;
    for (let i = 0; i < 8; i++) s += tree(r, r.f(-20, W + 20), hz + 20, r.f(40, 90), mix(acc[0], p.haze, 0.48));

    const baseY = H * r.f(0.66, 0.74);
    const fill = p.ink;
    const bw = r.f(700, 940);
    const cx = W * 0.5;
    const bh = r.f(150, 220);
    // Main range
    s += `<rect x="${n(cx - bw / 2)}" y="${n(baseY - bh)}" width="${n(bw)}" height="${n(bh + 40)}" fill="${fill}"/>`;
    // Central pediment
    const pw = bw * r.f(0.24, 0.34);
    s += `<rect x="${n(cx - pw / 2)}" y="${n(baseY - bh - 34)}" width="${n(pw)}" height="36" fill="${fill}"/>`;
    s += `<path d="M${n(cx - pw * 0.58)} ${n(baseY - bh - 34)} L${n(cx)} ${n(baseY - bh - 34 - pw * 0.22)} L${n(cx + pw * 0.58)} ${n(baseY - bh - 34)} Z" fill="${fill}"/>`;
    if (r.chance(0.5)) s += dome(cx, baseY - bh - 34 - pw * 0.2, pw * 0.5, pw * 0.3, fill);
    // Colonnade
    const cols = r.i(11, 17);
    for (let i = 0; i <= cols; i++) {
      const x = cx - bw / 2 + (bw / cols) * i;
      s += `<rect x="${n(x - 5)}" y="${n(baseY - bh * 0.7)}" width="10" height="${n(bh * 0.7 + 40)}" fill="${mix(fill, p.disc, 0.14)}"/>`;
      s += `<rect x="${n(x - 9)}" y="${n(baseY - bh * 0.7 - 8)}" width="18" height="8" fill="${mix(fill, p.disc, 0.14)}"/>`;
    }
    // Lit windows on the upper floor
    for (let i = 0; i < cols; i++) {
      const x = cx - bw / 2 + (bw / cols) * (i + 0.5);
      if (r.chance(0.55)) {
        s += `<rect x="${n(x - 8)}" y="${n(baseY - bh * 0.94)}" width="16" height="${n(bh * 0.2)}" fill="${p.disc}" opacity="${n(r.f(0.2, 0.55))}"/>`;
      }
    }
    // Forecourt and tank
    s += `<rect x="0" y="${n(baseY + 40)}" width="${W}" height="${n(H - baseY - 40)}" fill="${mix(acc[0], p.ink, 0.66)}"/>`;
    s += `<ellipse cx="${n(cx)}" cy="${n(H * 0.96)}" rx="${n(W * 0.34)}" ry="${n(H * 0.08)}" fill="${p.water}" opacity="0.72"/>`;
    return s;
  },

  city(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    // Back skyline
    for (let layer = 0; layer < 3; layer++) {
      const t = layer / 2;
      const base = hz + 40 + layer * 44;
      const fill = mix(mix(acc[0], p.haze, 0.62), p.ink, t * 0.95);
      let x = -40;
      let d = `M-40 ${H}`;
      while (x < W + 40) {
        const w = r.f(28, 100);
        const h = r.f(30, 190) * (1 - t * 0.2);
        d += ` L${n(x)} ${n(base - h)} L${n(x + w)} ${n(base - h)}`;
        x += w;
      }
      d += ` L${W + 40} ${H} Z`;
      s += `<path d="${d}" fill="${fill}"/>`;
      // Lit windows on the nearest layer
      if (layer === 2) {
        for (let i = 0; i < 140; i++) {
          s += `<rect x="${n(r.f(0, W))}" y="${n(r.f(base - 180, base - 10))}" width="${n(r.f(3, 7))}" height="${n(r.f(4, 9))}" fill="${p.disc}" opacity="${n(r.f(0.1, 0.5))}"/>`;
        }
      }
    }
    // A dome and minaret in the skyline — this is Dhaka, after all
    const mx = W * r.f(0.2, 0.8);
    s += dome(mx, hz + 96, r.f(70, 120), r.f(38, 62), p.ink);
    s += minaret(mx + r.f(60, 110), hz + 96, r.f(110, 170), 12, p.ink);
    // River foreground
    const wy = H * r.f(0.78, 0.86);
    s += `<rect x="0" y="${n(wy)}" width="${W}" height="${n(H - wy)}" fill="${p.water}"/>`;
    for (let i = 0; i < 7; i++) {
      s += `<rect x="0" y="${n(wy + 8 + i * 18)}" width="${W}" height="2.5" fill="${p.waterLit}" opacity="${n(0.12 + i * 0.04)}"/>`;
    }
    for (let i = 0; i < r.i(2, 4); i++) {
      s += boat(r, r.f(80, W - 80), wy + r.f(20, 90), r.f(70, 150), p.ink);
    }
    return s;
  },

  bridge(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${ridge(r, hz + 10, 6, 8, 0.3)}" fill="${mix(acc[0], p.haze, 0.6)}"/>`;
    const wy = hz + r.f(30, 70);
    s += `<rect x="0" y="${n(wy)}" width="${W}" height="${n(H - wy)}" fill="${p.water}"/>`;
    const deckY = wy - r.f(30, 70);
    const fill = p.ink;
    // Truss spans
    const spans = r.i(5, 8);
    const sw = (W + 80) / spans;
    s += `<rect x="-40" y="${n(deckY)}" width="${n(W + 80)}" height="12" fill="${fill}"/>`;
    for (let i = 0; i < spans; i++) {
      const x0 = -40 + i * sw;
      const th = sw * r.f(0.32, 0.44);
      // Through-truss arch
      s += `<path d="M${n(x0)} ${n(deckY)} Q${n(x0 + sw / 2)} ${n(deckY - th * 1.5)} ${n(x0 + sw)} ${n(deckY)} L${n(x0 + sw)} ${n(deckY - 5)} Q${n(x0 + sw / 2)} ${n(deckY - th * 1.5 - 12)} ${n(x0)} ${n(deckY - 5)} Z" fill="${fill}"/>`;
      // Diagonal members
      for (let j = 1; j < 6; j++) {
        const dx = x0 + (sw / 6) * j;
        const dy = deckY - Math.sin((j / 6) * Math.PI) * th * 1.35;
        s += `<line x1="${n(dx)}" y1="${n(deckY)}" x2="${n(dx + sw / 12)}" y2="${n(dy)}" stroke="${fill}" stroke-width="3"/>`;
        s += `<line x1="${n(dx)}" y1="${n(dy)}" x2="${n(dx + sw / 12)}" y2="${n(deckY)}" stroke="${fill}" stroke-width="3"/>`;
      }
      // Pier
      s += `<rect x="${n(x0 + sw - 12)}" y="${n(deckY + 10)}" width="24" height="${n(H - deckY)}" fill="${fill}"/>`;
    }
    // Reflections
    s += `<g transform="translate(0 ${n(wy * 2)}) scale(1 -1)" opacity="0.2">
      <rect x="-40" y="${n(deckY)}" width="${n(W + 80)}" height="12" fill="${fill}"/>
    </g>`;
    for (let i = 0; i < 8; i++) {
      s += `<rect x="0" y="${n(wy + 10 + i * 22)}" width="${W}" height="2.5" fill="${p.waterLit}" opacity="${n(0.1 + i * 0.035)}"/>`;
    }
    if (r.chance(0.7)) s += boat(r, r.f(120, W - 120), wy + r.f(60, 150), r.f(80, 140), p.ink, r.chance(0.4));
    return s;
  },

  market(ctx) {
    const { r, p, acc, hz } = ctx;
    let s = '';
    s += `<path d="${ridge(r, hz + 8, 7, 9, 0.35)}" fill="${mix(acc[0], p.haze, 0.55)}"/>`;
    for (let i = 0; i < 14; i++) s += tree(r, r.f(-20, W + 20), hz + 14, r.f(38, 84), mix(acc[0], p.haze, 0.46));

    const wy = H * r.f(0.5, 0.58);
    s += `<rect x="0" y="${n(wy)}" width="${W}" height="${n(H - wy)}" fill="${p.water}"/>`;
    for (let i = 0; i < 9; i++) {
      const t = i / 9;
      s += `<rect x="0" y="${n(wy + Math.pow(t, 1.5) * (H - wy))}" width="${W}" height="${n(2 + i * 1.2)}" fill="${p.waterLit}" opacity="${n(0.08 + t * 0.14)}"/>`;
    }
    // A crowd of laden boats, scaling with depth
    const boats = r.i(12, 20);
    for (let i = 0; i < boats; i++) {
      const t = Math.pow(i / boats, 0.8);
      const y = wy + 20 + t * (H - wy) * 0.8;
      const x = r.f(-40, W + 40);
      const len = 50 + t * 190;
      const shade = mix(p.ink, p.haze, 0.34 - t * 0.34);
      s += boat(r, x, y, len, shade);
      // Cargo heaped in the hull
      const heap = r.pick(ACCENTS.sundari.concat(ACCENTS.marigold));
      for (let j = 0; j < r.i(5, 12); j++) {
        s += `<circle cx="${n(x + r.f(-len * 0.3, len * 0.3))}" cy="${n(y + r.f(-len * 0.06, len * 0.03))}" r="${n(len * r.f(0.03, 0.06))}" fill="${heap}" opacity="${n(0.6 + t * 0.4)}"/>`;
      }
    }
    return s;
  },
};

/* ═══════════════════════════ composition ═══════════════════════════ */

function buildSvg(key, seed, moodOverride) {
  const family = FAMILY[key] ?? FAMILY.field;
  const moodName = moodOverride ?? family.mood;
  const p = { ...(MOODS[moodName] ?? MOODS.day) };
  p.sky4 = p.sky[3];
  const acc = ACCENTS[family.accent] ?? ACCENTS.delta;
  const r = mk(seed * 2654435761 + key.length * 7919 + moodName.length * 104729);

  const hz = H * r.f(0.42, 0.56);
  const ctx = { r, p, acc, hz, key };

  const gid = `g${(seed % 9973).toString(36)}${key.slice(0, 3)}`;

  /* Sky */
  let svg = `<defs>
    <linearGradient id="${gid}sky" x1="0" y1="0" x2="0" y2="1">
      ${p.sky.map((c, i) => `<stop offset="${n((i / (p.sky.length - 1)) * 100)}%" stop-color="${c}"/>`).join('')}
    </linearGradient>
    <radialGradient id="${gid}glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${p.discGlow}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${p.discGlow}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${gid}vig" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.ink}" stop-opacity="0.28"/>
      <stop offset="34%" stop-color="${p.ink}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${p.ink}" stop-opacity="0.34"/>
    </linearGradient>
  </defs>`;

  svg += `<rect width="${W}" height="${H}" fill="url(#${gid}sky)"/>`;

  /* Stars, on night scenes only */
  if (moodName === 'night') {
    for (let i = 0; i < 130; i++) {
      const y = r.f(0, hz);
      svg += `<circle cx="${n(r.f(0, W))}" cy="${n(y)}" r="${n(r.f(0.6, 1.9))}" fill="#ffffff" opacity="${n(r.f(0.15, 0.9) * (1 - y / hz))}"/>`;
    }
  }

  /* Sun or moon, with a tight halo */
  const dx = W * r.f(0.18, 0.82);
  const dy = hz * p.discY;
  const dr = r.f(30, 52);
  svg += `<circle cx="${n(dx)}" cy="${n(dy)}" r="${n(dr * 3.2)}" fill="url(#${gid}glow)"/>`;
  svg += `<circle cx="${n(dx)}" cy="${n(dy)}" r="${n(dr)}" fill="${p.disc}" opacity="${moodName === 'monsoon' ? 0.7 : 0.96}"/>`;

  /* Clouds — built from overlapping lobes so they read as clouds, not lozenges */
  const clouds = moodName === 'monsoon' ? r.i(4, 7) : r.i(2, 4);
  const cloudCol = moodName === 'night' ? p.haze : '#ffffff';
  for (let i = 0; i < clouds; i++) {
    const cy = r.f(hz * 0.08, hz * 0.82);
    const cw = r.f(170, 400);
    const ch = cw * r.f(0.06, 0.13);
    const op = moodName === 'monsoon' ? r.f(0.22, 0.4) : r.f(0.12, 0.3);
    const cx = r.f(-60, W + 60);
    let lobes = `<ellipse cx="0" cy="0" rx="${n(cw / 2)}" ry="${n(ch)}"/>`;
    for (let j = 0; j < r.i(3, 6); j++) {
      const lx = r.f(-cw * 0.34, cw * 0.34);
      const lr = cw * r.f(0.1, 0.2);
      lobes += `<ellipse cx="${n(lx)}" cy="${n(-lr * r.f(0.15, 0.7))}" rx="${n(lr)}" ry="${n(lr * r.f(0.5, 0.85))}"/>`;
    }
    svg += `<g transform="translate(${n(cx)} ${n(cy)})" fill="${cloudCol}" opacity="${n(op)}">${lobes}</g>`;
  }

  /* Birds — the small human touch that ties the set together */
  if (r.chance(0.7) && moodName !== 'night') {
    const flock = r.i(3, 8);
    const bx = W * r.f(0.15, 0.85);
    const by = hz * r.f(0.25, 0.7);
    for (let i = 0; i < flock; i++) {
      const x = bx + r.f(-140, 140);
      const y = by + r.f(-60, 60);
      const w = r.f(7, 15);
      svg += `<path d="M${n(x - w)} ${n(y)} q${n(w * 0.5)} ${n(-w * 0.5)} ${n(w)} 0 q${n(w * 0.5)} ${n(-w * 0.5)} ${n(w)} 0" stroke="${p.ink}" stroke-width="1.8" fill="none" opacity="${n(r.f(0.3, 0.7))}"/>`;
    }
  }

  /* The scene itself */
  const scene = SCENES[key] ?? SCENES.field;
  svg += scene(ctx);

  /* Vignette */
  svg += `<rect width="${W}" height="${H}" fill="url(#${gid}vig)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" role="img"><title>Ghuro Bangladesh — ${key} landscape</title>${svg}</svg>`;
}

/* ═══════════════════════════ run ═══════════════════════════ */

/** Load every art reference from the data layer. */
const esbuild = await import('esbuild');
const built = await esbuild.build({
  entryPoints: [path.join(ROOT, 'src/data/index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  logLevel: 'silent',
  alias: {
    '@lib': path.join(ROOT, 'src/lib'),
    '@data': path.join(ROOT, 'src/data'),
    '@': path.join(ROOT, 'src'),
  },
});
const tmp = path.join(ROOT, '.cache', 'art-bundle.mjs');
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, built.outputFiles[0].text);
const data = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);

const refs = new Map();
const addRef = (art) => {
  if (!art?.key) return;
  const mood = art.mood ?? FAMILY[art.key]?.mood ?? 'day';
  refs.set(`${art.key}-${mood}-${art.seed}`, { key: art.key, mood, seed: art.seed });
};

for (const p of data.places) addRef(p.art);
for (const d of data.districts) addRef(d.art);
for (const d of data.divisions) addRef(d.art);
for (const c of data.collections) addRef(c.art);
/*
 * Neutral fallbacks at seed 1000 for every family in every mood. Category,
 * tag, season and error pages compose art keys at render time and may ask for
 * a mood the family does not default to; generating the full grid means those
 * requests can never miss.
 */
for (const key of Object.keys(FAMILY)) {
  for (const mood of Object.keys(MOODS)) addRef({ key, seed: 1000, mood });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
/* Clear stale artwork so renames do not leave orphans behind. */
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith('.svg')) fs.unlinkSync(path.join(OUT_DIR, f));
}

let bytes = 0;
for (const [name, ref] of refs) {
  const svg = buildSvg(ref.key, ref.seed, ref.mood);
  fs.writeFileSync(path.join(OUT_DIR, `${name}.svg`), svg);
  bytes += Buffer.byteLength(svg);
}

console.log(`  ${refs.size} artworks written to public/images/art/`);
console.log(`  ${(bytes / 1024).toFixed(0)} KB total, ${(bytes / refs.size / 1024).toFixed(1)} KB average`);
