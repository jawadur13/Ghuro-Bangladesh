/**
 * The site's single client bundle.
 *
 * Everything here is progressive enhancement: the pages are fully usable with
 * JavaScript disabled, and each module below no-ops if its markup is absent.
 */
import {
  getFavouriteSlugs,
  toggleFavourite,
  getFavourites,
  setTheme,
  resolvedTheme,
  pushRecent,
} from './store';
import { initSearchDialog } from './search-ui';

/* ────────────────────────── Header ────────────────────────── */

function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 8) header.setAttribute('data-scrolled', '');
      else header.removeAttribute('data-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (toggle && menu) {
    const setOpen = (open: boolean) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    // A resize past the desktop breakpoint should not leave the body locked.
    window.matchMedia('(min-width: 68rem)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  }
}

/* ────────────────────────── Theme ────────────────────────── */

function initTheme(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    btn.addEventListener('click', () => {
      const next = resolvedTheme() === 'dark' ? 'light' : 'dark';
      setTheme(next);
      btn.setAttribute('aria-label', next === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      window.dispatchEvent(new CustomEvent('gb:theme', { detail: { theme: next } }));
    });
  }
}

/* ────────────────────────── Favourites ────────────────────────── */

function syncFavButtons(): void {
  const saved = getFavouriteSlugs();
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-fav-toggle]')) {
    const slug = btn.dataset.favToggle!;
    const name = btn.dataset.favName ?? 'this place';
    const on = saved.has(slug);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? `Remove ${name} from saved places` : `Save ${name}`);
    btn.setAttribute('title', on ? `Saved — click to remove` : `Save ${name}`);
  }
  const count = saved.size;
  for (const el of document.querySelectorAll<HTMLElement>('[data-fav-count]')) {
    el.textContent = String(count);
    el.hidden = count === 0;
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-fav-total]')) {
    el.textContent = String(count);
  }
}

function initFavourites(): void {
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-fav-toggle]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const slug = btn.dataset.favToggle!;
    const name = btn.dataset.favName ?? slug;
    const saved = toggleFavourite(slug, name);
    announce(saved ? `${name} saved` : `${name} removed from saved places`);
  });

  window.addEventListener('gb:favourites', syncFavButtons);
  syncFavButtons();
}

/* ────────────────────────── Recently viewed ────────────────────────── */

function initRecent(): void {
  const el = document.querySelector<HTMLElement>('[data-record-visit]');
  if (!el) return;
  pushRecent(el.dataset.recordVisit!, el.dataset.recordName ?? '');
}

/* ────────────────────────── Scroll reveal ────────────────────────── */

function initReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const t of targets) t.classList.add('in');
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const delay = Number(el.dataset.revealDelay ?? 0);
        if (delay) el.style.transitionDelay = `${delay}ms`;
        el.classList.add('in');
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
  );
  for (const t of targets) io.observe(t);
}

/* ────────────────────────── Animated counters ────────────────────────── */

function initCounters(): void {
  const counters = document.querySelectorAll<HTMLElement>('[data-count-to]');
  if (!counters.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.countTo ?? 0);
    if (reduce || !Number.isFinite(target)) {
      el.textContent = String(target);
      return;
    }
    const started = performance.now();
    const dur = 1100;
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!('IntersectionObserver' in window)) {
    for (const c of counters) run(c);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        run(e.target as HTMLElement);
        io.unobserve(e.target);
      }
    },
    { threshold: 0.4 }
  );
  for (const c of counters) io.observe(c);
}

/* ────────────────────────── Share & copy ────────────────────────── */

function initShare(): void {
  document.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-share]');
    if (!btn) return;
    e.preventDefault();

    const url = btn.dataset.shareUrl || location.href;
    const title = btn.dataset.shareTitle || document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user dismissed the sheet — fall through to copying */
      }
    }
    await copyToClipboard(url, btn);
  });

  document.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]');
    if (!btn) return;
    e.preventDefault();
    await copyToClipboard(btn.dataset.copy || location.href, btn);
  });
}

async function copyToClipboard(text: string, btn: HTMLElement): Promise<void> {
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    // Older browsers and non-secure contexts have no clipboard API.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      // eslint-disable-next-line deprecation/deprecation -- the only fallback there is
      ok = document.execCommand('copy');
      ta.remove();
    } catch {
      ok = false;
    }
  }

  const label = btn.querySelector<HTMLElement>('[data-copy-label]') ?? btn;
  const original = label.textContent;
  label.textContent = ok ? 'Link copied' : 'Copy failed';
  btn.setAttribute('data-copied', ok ? 'true' : 'false');
  announce(ok ? 'Link copied to clipboard' : 'Could not copy the link');
  window.setTimeout(() => {
    label.textContent = original;
    btn.removeAttribute('data-copied');
  }, 1800);
}

/* ────────────────────────── Screen reader announcements ────────────────────────── */

let liveRegion: HTMLElement | null = null;

export function announce(message: string): void {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  // Clearing first forces assistive tech to re-announce an identical message.
  liveRegion.textContent = '';
  window.setTimeout(() => {
    if (liveRegion) liveRegion.textContent = message;
  }, 60);
}

/* ────────────────────────── Boot ────────────────────────── */

function boot(): void {
  initHeader();
  initTheme();
  initFavourites();
  initRecent();
  initReveal();
  initCounters();
  initShare();
  initSearchDialog();

  // Page modules load on demand so the shared bundle stays small.
  if (document.querySelector('[data-bd-map]')) {
    import('./map').then((m) => m.initMap()).catch(() => {});
  }
  if (document.querySelector('[data-filters]')) {
    import('./filters').then((m) => m.initFilters()).catch(() => {});
  }
  if (document.querySelector('[data-discover]')) {
    import('./discover').then((m) => m.initDiscover()).catch(() => {});
  }
  if (document.querySelector('[data-favourites-page]')) {
    import('./favourites-page').then((m) => m.initFavouritesPage()).catch(() => {});
  }
  if (document.querySelector('[data-district-tracker]')) {
    import('./tracker').then((m) => m.initTracker()).catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

export { getFavourites };
