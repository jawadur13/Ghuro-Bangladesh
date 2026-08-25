/**
 * Filtering and sorting for the explore / listing pages.
 *
 * Every card is already in the DOM (server-rendered), so this only shows,
 * hides and reorders. That keeps the pages fully functional without JS — a
 * visitor without it simply sees the complete, unsorted list.
 *
 * State lives in the URL so a filtered view can be shared and bookmarked.
 */

interface CardState {
  el: HTMLElement;
  slug: string;
  name: string;
  popularity: number;
  district: string;
  division: string;
  categories: string[];
  tags: string[];
}

export function initFilters(): void {
  const root = document.querySelector<HTMLElement>('[data-filters]');
  if (!root) return;

  const gridRoot = document.querySelector<HTMLElement>('[data-filter-grid]');
  if (!gridRoot) return;
  /* Re-bound so the narrowing survives into the hoisted render() below. */
  const grid: HTMLElement = gridRoot;

  const cards: CardState[] = [...grid.querySelectorAll<HTMLElement>('[data-place]')].map((el) => ({
    el: (el.closest<HTMLElement>('[data-filter-item]') ?? el) as HTMLElement,
    slug: el.dataset.place!,
    name: el.querySelector('.pcard-title')?.textContent?.trim() ?? '',
    popularity: Number(el.dataset.popularity ?? 0),
    district: el.dataset.district ?? '',
    division: el.dataset.division ?? '',
    categories: (el.dataset.categories ?? '').split(' ').filter(Boolean),
    tags: (el.dataset.tags ?? '').split(' ').filter(Boolean),
  }));

  const countEl = document.querySelector<HTMLElement>('[data-filter-count]');
  const emptyEl = document.querySelector<HTMLElement>('[data-filter-empty]');
  const clearBtn = document.querySelector<HTMLButtonElement>('[data-filter-clear]');
  const activeEl = document.querySelector<HTMLElement>('[data-filter-active]');
  const sortSelect = document.querySelector<HTMLSelectElement>('[data-filter-sort]');
  const queryInput = document.querySelector<HTMLInputElement>('[data-filter-query]');

  /** Original DOM order, used to restore the default "curated" sort. */
  const originalOrder = cards.map((c) => c.el);

  const state = {
    division: new Set<string>(),
    category: new Set<string>(),
    tag: new Set<string>(),
    query: '',
    sort: 'curated',
  };

  /* ── URL sync ── */

  function readUrl(): void {
    const params = new URLSearchParams(location.search);
    for (const key of ['division', 'category', 'tag'] as const) {
      const value = params.get(key);
      if (value) for (const v of value.split(',').filter(Boolean)) state[key].add(v);
    }
    state.query = params.get('q') ?? '';
    state.sort = params.get('sort') ?? 'curated';
  }

  function writeUrl(): void {
    const params = new URLSearchParams();
    for (const key of ['division', 'category', 'tag'] as const) {
      if (state[key].size) params.set(key, [...state[key]].join(','));
    }
    if (state.query) params.set('q', state.query);
    if (state.sort !== 'curated') params.set('sort', state.sort);
    const qs = params.toString();
    history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);
  }

  /* ── Matching ── */

  function matches(card: CardState): boolean {
    if (state.division.size && !state.division.has(card.division)) return false;
    if (state.category.size && !card.categories.some((c) => state.category.has(c))) return false;
    if (state.tag.size && !card.tags.every((_) => true)) return false;
    // Tags are AND-ed: picking "family" and "day-trip" should mean both.
    if (state.tag.size) {
      for (const t of state.tag) if (!card.tags.includes(t)) return false;
    }
    if (state.query) {
      const q = state.query.toLowerCase();
      const haystack = `${card.name} ${card.district} ${card.slug}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }

  /* ── Sorting ── */

  function applySort(visible: CardState[]): HTMLElement[] {
    const sorted = [...visible];
    switch (state.sort) {
      case 'popular':
        sorted.sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'district':
        sorted.sort((a, b) => a.district.localeCompare(b.district) || a.name.localeCompare(b.name));
        break;
      case 'quiet':
        sorted.sort((a, b) => a.popularity - b.popularity || a.name.localeCompare(b.name));
        break;
      default:
        return originalOrder.filter((el) => visible.some((v) => v.el === el));
    }
    return sorted.map((c) => c.el);
  }

  /* ── Render ── */

  function render(): void {
    const visible: CardState[] = [];
    for (const card of cards) {
      const ok = matches(card);
      card.el.hidden = !ok;
      if (ok) visible.push(card);
    }

    // Reorder only when a non-default sort is active; DOM writes are not free.
    if (state.sort !== 'curated') {
      const frag = document.createDocumentFragment();
      for (const el of applySort(visible)) frag.appendChild(el);
      // Hidden cards keep their place at the end so the DOM stays complete.
      for (const card of cards) if (card.el.hidden) frag.appendChild(card.el);
      grid.appendChild(frag);
    }

    if (countEl) countEl.textContent = String(visible.length);
    if (emptyEl) emptyEl.hidden = visible.length > 0;
    grid.hidden = visible.length === 0;

    const activeCount = state.division.size + state.category.size + state.tag.size + (state.query ? 1 : 0);
    if (clearBtn) clearBtn.hidden = activeCount === 0;
    if (activeEl) renderActive(activeEl);

    for (const btn of root!.querySelectorAll<HTMLElement>('[data-filter]')) {
      const group = btn.dataset.filter as 'division' | 'category' | 'tag';
      const value = btn.dataset.value!;
      const on = state[group]?.has(value) ?? false;
      btn.setAttribute('aria-pressed', String(on));
      btn.dataset.active = String(on);
    }

    writeUrl();
  }

  function renderActive(el: HTMLElement): void {
    const chips: string[] = [];
    const push = (group: string, value: string) => {
      const src = root!.querySelector<HTMLElement>(`[data-filter="${group}"][data-value="${value}"]`);
      const label = src?.dataset.label ?? src?.textContent?.trim() ?? value;
      chips.push(
        `<button type="button" class="chip active-chip" data-remove-filter="${group}" data-value="${value}">
          ${escapeHtml(label)}<span aria-hidden="true">×</span>
          <span class="sr-only">Remove filter</span>
        </button>`
      );
    };
    for (const v of state.division) push('division', v);
    for (const v of state.category) push('category', v);
    for (const v of state.tag) push('tag', v);
    if (state.query) {
      chips.push(
        `<button type="button" class="chip active-chip" data-remove-filter="query" data-value="">
          “${escapeHtml(state.query)}”<span aria-hidden="true">×</span>
          <span class="sr-only">Clear search</span>
        </button>`
      );
    }
    el.innerHTML = chips.join('');
    el.hidden = chips.length === 0;
  }

  /* ── Events ── */

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-filter]');
    if (!btn) return;
    e.preventDefault();
    const group = btn.dataset.filter as 'division' | 'category' | 'tag';
    const value = btn.dataset.value!;
    const set = state[group];
    if (!set) return;
    if (set.has(value)) set.delete(value);
    else set.add(value);
    render();
  });

  activeEl?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-remove-filter]');
    if (!btn) return;
    const group = btn.dataset.removeFilter!;
    if (group === 'query') {
      state.query = '';
      if (queryInput) queryInput.value = '';
    } else {
      state[group as 'division' | 'category' | 'tag']?.delete(btn.dataset.value!);
    }
    render();
  });

  clearBtn?.addEventListener('click', () => {
    state.division.clear();
    state.category.clear();
    state.tag.clear();
    state.query = '';
    if (queryInput) queryInput.value = '';
    render();
  });

  sortSelect?.addEventListener('change', () => {
    state.sort = sortSelect.value;
    render();
  });

  let debounce: number | undefined;
  queryInput?.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      state.query = queryInput.value.trim();
      render();
    }, 140);
  });

  // Collapsible filter panel on small screens.
  const panelToggle = document.querySelector<HTMLButtonElement>('[data-filter-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-filter-panel]');
  if (panelToggle && panel) {
    panelToggle.addEventListener('click', () => {
      const open = panelToggle.getAttribute('aria-expanded') === 'true';
      panelToggle.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  }

  readUrl();
  if (queryInput && state.query) queryInput.value = state.query;
  if (sortSelect) sortSelect.value = state.sort;
  render();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
