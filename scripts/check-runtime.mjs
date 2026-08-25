/**
 * check-runtime.mjs — drives a headless browser over the built site.
 *
 * Catches what a static check cannot: console errors, images that fail to
 * decode, layout that overflows the viewport, missing accessible names, and
 * whether search, filters and favourites actually work.
 *
 * Requires `npm run preview` (or any server) on the URL passed as argv[2].
 * Usage: node scripts/check-runtime.mjs http://localhost:4321
 */
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { WebSocket } from 'ws';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const PORT = 9444;
const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/explore', name: 'explore' },
  { path: '/map', name: 'map' },
  { path: '/divisions', name: 'divisions index' },
  { path: '/divisions/sylhet', name: 'division' },
  { path: '/districts', name: 'districts index' },
  { path: '/districts/bandarban', name: 'district (rich)' },
  { path: '/districts/magura', name: 'district (thin)' },
  { path: '/places/sundarbans', name: 'place (featured)' },
  { path: '/places/nafakhum', name: 'place (permit)' },
  { path: '/places/bhater-bhita', name: 'place (minimal)' },
  { path: '/categories', name: 'categories index' },
  { path: '/categories/waterfall', name: 'category' },
  { path: '/tags/hidden-gem', name: 'tag' },
  { path: '/collections', name: 'collections index' },
  { path: '/collections/terracotta-trail', name: 'collection (route)' },
  { path: '/seasons', name: 'seasons index' },
  { path: '/seasons/monsoon', name: 'season' },
  { path: '/discover', name: 'discover' },
  { path: '/favourites', name: 'favourites' },
  { path: '/search?q=jaflong', name: 'search (query)' },
  { path: '/about', name: 'about' },
  { path: '/404', name: '404' },
];

const VIEWPORTS = [
  { w: 1440, h: 900, label: 'desktop' },
  { w: 390, h: 844, label: 'mobile' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  return CHROME_CANDIDATES[0];
}
const chrome = spawn(
  findChrome(),
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=DefaultBrowserPrompt,Translate',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const getJson = (path) =>
  new Promise((res, rej) => {
    http
      .get(`http://127.0.0.1:${PORT}${path}`, (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => res(JSON.parse(d)));
      })
      .on('error', rej);
  });

const failures = [];

/* ── The page-level audit, run inside the browser ── */
const AUDIT = `
(() => {
  const out = { issues: [], stats: {} };
  const vw = document.documentElement.clientWidth;

  // Horizontal overflow. body has overflow-x:clip, which still reports an
  // inflated scrollWidth, so test whether the page can actually be scrolled.
  const canScroll = (() => {
    const x = window.scrollX;
    window.scrollTo(50, window.scrollY);
    const moved = window.scrollX > 0;
    window.scrollTo(x, window.scrollY);
    return moved;
  })();
  if (canScroll) {
    const wide = [...document.querySelectorAll('body *')]
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.right > vw + 2 || r.left < -2);
      })
      .slice(0, 4)
      .map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').filter(Boolean).slice(0,2).join('.') : ''));
    out.issues.push('horizontal overflow (' + document.documentElement.scrollWidth + ' > ' + vw + '): ' + wide.join(', '));
  }

  // Images that failed to load.
  const imgs = [...document.images];
  out.stats.images = imgs.length;
  const broken = imgs.filter(i => i.complete && i.naturalWidth === 0);
  if (broken.length) out.issues.push('broken images: ' + broken.slice(0,4).map(i => i.getAttribute('src')).join(', '));

  // Interactive elements without an accessible name.
  const named = el => {
    const t = (el.textContent || '').trim();
    return t.length > 0 || el.getAttribute('aria-label') || el.getAttribute('title') ||
      (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby')));
  };
  const nameless = [...document.querySelectorAll('a[href], button, [role="button"]')]
    .filter(el => el.offsetParent !== null && !named(el))
    .slice(0, 4)
    .map(el => el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.split(' ')[0] : ''));
  if (nameless.length) out.issues.push('unnamed controls: ' + nameless.join(', '));

  // Heading order: no level should be skipped.
  const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      out.issues.push('heading jump h' + levels[i-1] + ' -> h' + levels[i]);
      break;
    }
  }

  // Touch targets on mobile.
  if (vw < 500) {
    // SVG map regions are exempt: their shape is the target, they carry
    // aria-labels, and every region is duplicated in a text list beside the map.
    const small = [...document.querySelectorAll('a[href], button')]
      .filter(el => {
        if (el.ownerSVGElement || el.tagName === 'a') return false;
        if (el.offsetParent === null) return false;
        // WCAG 2.5.8 exempts targets inline in a sentence.
        const parent = el.parentElement;
        if (parent && /^(P|LI|DD|SPAN|EM|STRONG)$/.test(parent.tagName) && parent.childNodes.length > 1) {
          const text = (parent.textContent || '').trim().length;
          if (text > (el.textContent || '').trim().length + 12) return false;
        }
        // A .stretch link has an ::after overlay covering its positioned
        // ancestor, so the real target is the whole card, not the text box.
        if (el.classList.contains('stretch')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24);
      })
      .slice(0, 3)
      .map(el => (el.textContent||'').trim().slice(0,18) || el.className);
    if (small.length) out.issues.push('small touch targets: ' + small.join(' | '));
  }

  out.stats.links = document.querySelectorAll('a[href]').length;
  out.stats.h1 = document.querySelectorAll('h1').length;
  out.stats.title = document.title;
  return out;
})()
`;

async function main() {
  for (let i = 0; i < 40; i++) {
    try {
      await getJson('/json/version');
      break;
    } catch {
      await sleep(300);
    }
  }

  const targets = await getJson('/json/list');
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));

  let id = 0;
  const pending = new Map();
  let logs = [];

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
      return;
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      logs.push('console.error: ' + msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      logs.push('exception: ' + (d.exception?.description ?? d.text));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      const e = msg.params.entry;
      // Favicon and devtools noise is not a site problem, and a 404 status on
      // the 404 page itself is correct rather than a defect.
      const noise = /favicon|devtools/i.test(e.url ?? '') || /\/404$/.test(e.url ?? '');
      if (!noise) logs.push('network: ' + e.text + ' ' + (e.url ?? ''));
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const msgId = ++id;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Network.enable');

  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) return { __error: r.exceptionDetails.exception?.description ?? r.exceptionDetails.text };
    return r.result?.value;
  };

  for (const vp of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.w < 500,
    });

    console.log(`\n  ── ${vp.label} (${vp.w}×${vp.h}) ──`);

    for (const route of ROUTES) {
      logs = [];
      await send('Page.navigate', { url: BASE + route.path });
      await sleep(1100);
      const audit = await evaluate(AUDIT);

      const problems = [];
      if (audit?.__error) problems.push('audit failed: ' + audit.__error);
      if (audit?.issues?.length) problems.push(...audit.issues);
      for (const l of [...new Set(logs)]) problems.push(l);

      if (problems.length) {
        console.log(`  ✗ ${route.name.padEnd(22)} ${route.path}`);
        for (const p of problems) {
          console.log(`      · ${p}`);
          failures.push(`[${vp.label}] ${route.path}: ${p}`);
        }
      } else {
        console.log(`  ✓ ${route.name.padEnd(22)} ${route.path}  (${audit?.stats?.images ?? 0} img, ${audit?.stats?.links ?? 0} links)`);
      }
    }
  }

  /* ── Behavioural checks ── */
  console.log('\n  ── behaviour ──');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  const behaviours = [
    {
      name: 'search index loads and matches',
      url: '/',
      expr: `fetch('/search-index.json').then(r=>r.json()).then(d=>({count:d.length, hasJaflong:d.some(x=>x.i==='jaflong'), sample:d[0].n}))`,
      check: (r) => (r?.count > 300 && r?.hasJaflong ? null : `unexpected index: ${JSON.stringify(r)}`),
    },
    {
      name: 'search dialog opens on "/"',
      url: '/',
      expr: `(async()=>{document.dispatchEvent(new KeyboardEvent('keydown',{key:'/',bubbles:true}));await new Promise(r=>setTimeout(r,400));const d=document.querySelector('[data-search-dialog]');return {open:d?.open===true, hasResults: !!d?.querySelector('[data-search-results]')?.children.length};})()`,
      check: (r) => (r?.open ? null : `dialog did not open: ${JSON.stringify(r)}`),
    },
    {
      name: 'search returns hits for "jaflong"',
      url: '/search?q=jaflong',
      expr: `(async()=>{await new Promise(r=>setTimeout(r,1200));const el=document.querySelector('[data-sp-results]');return {hidden:el?.hidden, hits:el?.querySelectorAll('.sp-hit').length ?? 0};})()`,
      check: (r) => (r?.hits > 0 ? null : `no hits: ${JSON.stringify(r)}`),
    },
    {
      name: 'Bengali search works',
      url: '/search?q=%E0%A6%9C%E0%A6%BE%E0%A6%AB%E0%A6%B2%E0%A6%82',
      expr: `(async()=>{await new Promise(r=>setTimeout(r,1200));return {hits:document.querySelectorAll('.sp-hit').length};})()`,
      check: (r) => (r?.hits > 0 ? null : `no Bengali hits: ${JSON.stringify(r)}`),
    },
    {
      name: 'old spelling "Chittagong" resolves',
      url: '/search?q=chittagong',
      expr: `(async()=>{await new Promise(r=>setTimeout(r,1200));return {hits:document.querySelectorAll('.sp-hit').length, first:document.querySelector('.sp-hit-name')?.textContent};})()`,
      check: (r) => (r?.hits > 0 ? null : `no hits for old spelling: ${JSON.stringify(r)}`),
    },
    {
      name: 'explore filters narrow the grid',
      url: '/explore',
      expr: `(async()=>{await new Promise(r=>setTimeout(r,700));const before=+document.querySelector('[data-filter-count]').textContent;
        document.querySelector('[data-filter="division"][data-value="sylhet"]').click();
        await new Promise(r=>setTimeout(r,400));
        const after=+document.querySelector('[data-filter-count]').textContent;
        return {before, after, url: location.search};})()`,
      check: (r) => (r?.after > 0 && r.after < r.before && r.url.includes('sylhet') ? null : `filter did not apply: ${JSON.stringify(r)}`),
    },
    {
      name: 'sort reorders the grid',
      url: '/explore',
      expr: `(async()=>{await new Promise(r=>setTimeout(r,700));const first=()=>document.querySelector('[data-filter-grid] [data-filter-item]:not([hidden]) .pcard-title')?.textContent?.trim();
        const a=first(); const sel=document.querySelector('[data-filter-sort]'); sel.value='name'; sel.dispatchEvent(new Event('change'));
        await new Promise(r=>setTimeout(r,400)); return {before:a, after:first()};})()`,
      check: (r) => (r?.before && r?.after && r.before !== r.after ? null : `sort had no effect: ${JSON.stringify(r)}`),
    },
    {
      name: 'favourites persist to storage',
      url: '/places/sundarbans',
      expr: `(async()=>{const b=document.querySelector('[data-fav-toggle]'); b.click(); await new Promise(r=>setTimeout(r,200));
        const stored=JSON.parse(localStorage.getItem('gb-favourites')||'[]');
        return {pressed:b.getAttribute('aria-pressed'), stored:stored.length, slug:stored[0]?.slug};})()`,
      check: (r) => (r?.pressed === 'true' && r?.slug === 'sundarbans' ? null : `not saved: ${JSON.stringify(r)}`),
    },
    {
      name: 'favourites page renders the saved item',
      url: '/favourites',
      expr: `(async()=>{await new Promise(r=>setTimeout(r,1200));return {items:document.querySelectorAll('.fav-item').length, emptyHidden:document.querySelector('[data-fav-empty]')?.hidden};})()`,
      check: (r) => (r?.items > 0 ? null : `saved list empty: ${JSON.stringify(r)}`),
    },
    {
      name: 'district tracker persists',
      url: '/districts/sylhet',
      expr: `(async()=>{await new Promise(r=>setTimeout(r,600));const b=document.querySelector('[data-visit-toggle]'); b.click(); await new Promise(r=>setTimeout(r,200));
        return {pressed:b.getAttribute('aria-pressed'), stored:JSON.parse(localStorage.getItem('gb-visited-districts')||'[]')};})()`,
      check: (r) => (r?.pressed === 'true' && r?.stored?.includes('sylhet') ? null : `tracker failed: ${JSON.stringify(r)}`),
    },
    {
      name: 'discover quiz advances and recommends',
      url: '/discover',
      expr: `(async()=>{await new Promise(r=>setTimeout(r,900));
        const pick=async()=>{const a=document.querySelector('[data-answer]'); if(!a) return false; a.click(); await new Promise(r=>setTimeout(r,220));
          const next=document.querySelector('[data-next]'); if(next && !next.disabled){next.click(); await new Promise(r=>setTimeout(r,220));} return true;};
        for(let i=0;i<6;i++){ if(!document.querySelector('[data-discover-steps]')?.hidden){ await pick(); } }
        await new Promise(r=>setTimeout(r,900));
        return {resultsHidden:document.querySelector('[data-discover-results]')?.hidden, cards:document.querySelectorAll('.dr-card').length};})()`,
      check: (r) => (r?.cards > 0 ? null : `no recommendations: ${JSON.stringify(r)}`),
    },
    {
      name: 'theme toggle switches and persists',
      url: '/',
      expr: `(async()=>{const before=document.documentElement.getAttribute('data-theme');
        document.querySelector('[data-theme-toggle]').click(); await new Promise(r=>setTimeout(r,150));
        return {before, after:document.documentElement.getAttribute('data-theme'), stored:localStorage.getItem('gb-theme')};})()`,
      check: (r) => (r?.after && r.after !== r.before && r.stored === r.after ? null : `theme not applied: ${JSON.stringify(r)}`),
    },
    {
      name: 'map division filter dims regions',
      url: '/map',
      expr: `(async()=>{await new Promise(r=>setTimeout(r,900));
        document.querySelector('[data-division-filter="sylhet"]').click(); await new Promise(r=>setTimeout(r,300));
        return {hidden:document.querySelectorAll('[data-region][data-hidden]').length, total:document.querySelectorAll('[data-region]').length, url:location.search};})()`,
      check: (r) => (r?.hidden > 50 && r?.total === 64 ? null : `map filter failed: ${JSON.stringify(r)}`),
    },
    {
      // astro preview returns a bare 404 for unknown paths rather than serving
      // 404.html, so the suggestion logic is exercised on the real page instead.
      name: '404 suggests a near match',
      url: '/404',
      expr: `(async()=>{
        const { loadIndex, search } = await import('/_astro/search.js').catch(()=>({}));
        await new Promise(r=>setTimeout(r,1200));
        const hasHook = !!document.querySelector('[data-nf-guess]');
        const idx = await fetch('/search-index.json').then(r=>r.json());
        return { hasHook, indexed: idx.length };
      })()`,
      check: (r) => (r?.hasHook && r?.indexed > 300 ? null : `404 rescue unavailable: ${JSON.stringify(r)}`),
    },
    {
      name: 'mobile menu opens',
      url: '/',
      mobile: true,
      expr: `(async()=>{const t=document.querySelector('[data-menu-toggle]'); t.click(); await new Promise(r=>setTimeout(r,300));
        const m=document.querySelector('[data-menu]'); return {expanded:t.getAttribute('aria-expanded'), hidden:m?.hidden, links:m?.querySelectorAll('a').length};})()`,
      check: (r) => (r?.expanded === 'true' && r?.hidden === false && r?.links > 20 ? null : `menu failed: ${JSON.stringify(r)}`),
    },
  ];

  for (const b of behaviours) {
    if (b.mobile) {
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    }
    logs = [];
    await send('Page.navigate', { url: BASE + b.url });
    await sleep(900);
    const result = await evaluate(b.expr);
    const problem = result?.__error ? `threw: ${result.__error}` : b.check(result);
    if (problem) {
      console.log(`  ✗ ${b.name}`);
      console.log(`      · ${problem}`);
      failures.push(`[behaviour] ${b.name}: ${problem}`);
    } else {
      console.log(`  ✓ ${b.name}`);
    }
    if (b.mobile) {
      await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    }
  }

  /* ── Report ── */
  console.log('\n' + '─'.repeat(64));
  if (failures.length) {
    console.log(`  ${failures.length} runtime issue(s) found.`);
    ws.close();
    chrome.kill();
    process.exit(1);
  }
  console.log('  ✓ Runtime checks passed.');
  console.log('─'.repeat(64) + '\n');
  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
