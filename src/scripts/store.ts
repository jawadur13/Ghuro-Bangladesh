/**
 * Local persistence.
 *
 * Ghuro Bangladesh has no backend, so anything user-specific lives in
 * localStorage on the visitor's own device. Every read and write is guarded:
 * private windows, blocked site data and quota errors must degrade to "no
 * saved state" rather than breaking the page.
 */

const KEYS = {
  favourites: 'gb-favourites',
  visited: 'gb-visited-districts',
  recent: 'gb-recent',
  theme: 'gb-theme',
} as const;

export type StoreKey = keyof typeof KEYS;

function read<T>(key: StoreKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(KEYS[key]);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: StoreKey, value: unknown): boolean {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ────────────────────────── Favourites ────────────────────────── */

export interface FavouriteEntry {
  slug: string;
  name: string;
  at: number;
}

export function getFavourites(): FavouriteEntry[] {
  const raw = read<unknown>('favourites', []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is FavouriteEntry =>
      !!e && typeof e === 'object' && typeof (e as FavouriteEntry).slug === 'string'
  );
}

export function getFavouriteSlugs(): Set<string> {
  return new Set(getFavourites().map((f) => f.slug));
}

export function isFavourite(slug: string): boolean {
  return getFavouriteSlugs().has(slug);
}

/** Returns the new state: true if saved, false if removed. */
export function toggleFavourite(slug: string, name: string): boolean {
  const list = getFavourites();
  const idx = list.findIndex((f) => f.slug === slug);
  let saved: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    saved = false;
  } else {
    list.unshift({ slug, name, at: Date.now() });
    saved = true;
  }
  write('favourites', list);
  emit('gb:favourites', { slug, saved, count: list.length });
  return saved;
}

export function clearFavourites(): void {
  write('favourites', []);
  emit('gb:favourites', { count: 0 });
}

/* ────────────────────────── District tracking ────────────────────────── */

export function getVisitedDistricts(): Set<string> {
  const raw = read<unknown>('visited', []);
  return new Set(Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : []);
}

export function toggleVisitedDistrict(slug: string): boolean {
  const set = getVisitedDistricts();
  const visited = !set.has(slug);
  if (visited) set.add(slug);
  else set.delete(slug);
  write('visited', [...set]);
  emit('gb:visited', { slug, visited, count: set.size });
  return visited;
}

export function clearVisitedDistricts(): void {
  write('visited', []);
  emit('gb:visited', { count: 0 });
}

/* ────────────────────────── Recently viewed ────────────────────────── */

const RECENT_LIMIT = 12;

export function getRecent(): FavouriteEntry[] {
  const raw = read<unknown>('recent', []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is FavouriteEntry =>
      !!e && typeof e === 'object' && typeof (e as FavouriteEntry).slug === 'string'
  );
}

export function pushRecent(slug: string, name: string): void {
  const list = getRecent().filter((e) => e.slug !== slug);
  list.unshift({ slug, name, at: Date.now() });
  write('recent', list.slice(0, RECENT_LIMIT));
}

/* ────────────────────────── Theme ────────────────────────── */

export type Theme = 'light' | 'dark' | 'system';

export function getTheme(): Theme {
  try {
    const t = localStorage.getItem(KEYS.theme);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

export function setTheme(theme: Theme): void {
  try {
    if (theme === 'system') localStorage.removeItem(KEYS.theme);
    else localStorage.setItem(KEYS.theme, theme);
  } catch {
    /* storage unavailable — the choice simply will not persist */
  }
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

/** What the page is actually rendering right now. */
export function resolvedTheme(): 'light' | 'dark' {
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/* ────────────────────────── Events ────────────────────────── */

function emit(name: string, detail: unknown): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
