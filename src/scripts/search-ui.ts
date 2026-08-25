/**
 * The global search dialog.
 *
 * Opens on `/`, ⌘K or the header button. Loads the index on first open,
 * shows curated suggestions before anything is typed, and supports full
 * keyboard navigation.
 */
import { loadIndex, search, highlight, type SearchDoc, type SearchHit } from './search';
import { getRecent } from './store';

const VIA_LABEL: Record<SearchHit['via'], string> = {
  name: '',
  bengali: 'Bengali name',
  alt: 'also known as',
  district: 'district',
  division: 'division',
  category: 'category',
  tag: 'interest',
  text: 'in description',
};

const SUGGESTIONS = [
  'Sundarbans',
  'Sreemangal',
  'Cox’s Bazar',
  'Paharpur',
  'Sajek',
  'Kantajew',
  'Tanguar Haor',
  'Kuakata',
  'waterfall',
  'hidden gem',
];

export function initSearchDialog(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-search-dialog]');
  if (!dialog) return;

  const input = dialog.querySelector<HTMLInputElement>('[data-search-input]')!;
  const results = dialog.querySelector<HTMLElement>('[data-search-results]')!;
  const status = dialog.querySelector<HTMLElement>('[data-search-status]')!;
  const closeBtn = dialog.querySelector<HTMLButtonElement>('[data-search-close]');

  let docs: SearchDoc[] | null = null;
  let loadFailed = false;
  let active = -1;
  let lastQuery = '';

  /* ── Opening and closing ── */

  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    input.value = '';
    active = -1;
    renderIdle();
    void ensureIndex();
    // showModal focuses the dialog; move focus to the field on the next frame.
    requestAnimationFrame(() => input.focus());
  };

  const close = () => {
    if (!dialog.open) return;
    dialog.close();
  };

  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
  });

  for (const trigger of document.querySelectorAll<HTMLElement>('[data-search-open]')) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    });
  }
  closeBtn?.addEventListener('click', close);

  // Click on the backdrop (the dialog element itself) closes it.
  dialog.addEventListener('mousedown', (e) => {
    if (e.target === dialog) close();
  });

  document.addEventListener('keydown', (e) => {
    if (dialog.open) return;
    const target = e.target as HTMLElement | null;
    const typing =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable);
    if (typing) return;

    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      open();
    } else if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open();
    }
  });

  /* ── Index ── */

  async function ensureIndex(): Promise<SearchDoc[] | null> {
    if (docs) return docs;
    if (loadFailed) return null;
    status.textContent = 'Loading the atlas…';
    try {
      docs = await loadIndex();
      status.textContent = '';
      if (input.value.trim()) run(input.value);
      return docs;
    } catch {
      loadFailed = true;
      status.textContent = '';
      results.innerHTML = errorState();
      return null;
    }
  }

  /* ── Rendering ── */

  function renderIdle(): void {
    const recent = getRecent().slice(0, 5);
    results.innerHTML = `
      ${
        recent.length
          ? `<div class="sr-group">
              <p class="sr-group-title">Recently viewed</p>
              <ul class="sr-list" role="listbox" aria-label="Recently viewed">
                ${recent
                  .map(
                    (r, i) => `<li role="option" aria-selected="false">
                      <a class="sr-item" href="/places/${escapeAttr(r.slug)}" data-idx="${i}">
                        <span class="sr-name">${escapeHtml(r.name)}</span>
                        <span class="sr-via">recent</span>
                      </a></li>`
                  )
                  .join('')}
              </ul>
            </div>`
          : ''
      }
      <div class="sr-group">
        <p class="sr-group-title">Try searching for</p>
        <div class="sr-chips">
          ${SUGGESTIONS.map(
            (s) => `<button type="button" class="chip" data-suggest="${escapeAttr(s)}">${escapeHtml(s)}</button>`
          ).join('')}
        </div>
      </div>
      <div class="sr-group">
        <p class="sr-group-title">Or jump to</p>
        <div class="sr-chips">
          <a class="chip" href="/explore">All destinations</a>
          <a class="chip" href="/districts">64 districts</a>
          <a class="chip" href="/map">The map</a>
          <a class="chip" href="/discover">Where should I go?</a>
          <a class="chip" href="/collections">Collections</a>
        </div>
      </div>`;
    bindSuggestions();
  }

  function errorState(): string {
    return `<div class="sr-empty">
        <p class="sr-empty-title">Search is unavailable</p>
        <p class="sr-empty-body">The index could not be loaded. You can still browse
          <a href="/explore">all destinations</a>, <a href="/districts">by district</a>
          or <a href="/map">on the map</a>.</p>
      </div>`;
  }

  function emptyState(q: string): string {
    return `<div class="sr-empty">
        <p class="sr-empty-title">Nothing matched “${escapeHtml(q)}”</p>
        <p class="sr-empty-body">Try a district (Sylhet, Bandarban), a category (waterfall, mosque)
          or a Bengali name. Older spellings work too — Chittagong finds Chattogram.</p>
        <div class="sr-chips">
          ${SUGGESTIONS.slice(0, 5)
            .map((s) => `<button type="button" class="chip" data-suggest="${escapeAttr(s)}">${escapeHtml(s)}</button>`)
            .join('')}
        </div>
      </div>`;
  }

  function renderHits(hits: SearchHit[], q: string): void {
    if (!hits.length) {
      results.innerHTML = emptyState(q);
      bindSuggestions();
      status.textContent = `No results for ${q}`;
      return;
    }

    results.innerHTML = `
      <ul class="sr-list" role="listbox" aria-label="Search results">
        ${hits
          .map((hit, i) => {
            const d = hit.doc;
            const via = VIA_LABEL[hit.via];
            return `<li role="option" aria-selected="false">
              <a class="sr-item" href="/places/${escapeAttr(d.i)}" data-idx="${i}">
                <img class="sr-art" src="/images/art/${escapeAttr(d.f)}" alt="" width="56" height="40" loading="lazy" decoding="async">
                <span class="sr-text">
                  <span class="sr-name">${highlight(d.n, q)}</span>
                  <span class="sr-sub">${escapeHtml(d.d)} · ${escapeHtml(d.v)}</span>
                </span>
                <span class="sr-right">
                  ${d.g ? '<span class="sr-gem">gem</span>' : ''}
                  ${via ? `<span class="sr-via">${escapeHtml(via)}</span>` : ''}
                </span>
              </a></li>`;
          })
          .join('')}
      </ul>
      <a class="sr-all" href="/search?q=${encodeURIComponent(q)}">
        See all results for “${escapeHtml(q)}”
      </a>`;
    status.textContent = `${hits.length} result${hits.length === 1 ? '' : 's'} for ${q}`;
    setActive(0);
  }

  function bindSuggestions(): void {
    for (const btn of results.querySelectorAll<HTMLButtonElement>('[data-suggest]')) {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.suggest!;
        input.focus();
        run(input.value);
      });
    }
  }

  /* ── Query handling ── */

  function run(raw: string): void {
    const q = raw.trim();
    lastQuery = q;
    if (!q) {
      renderIdle();
      status.textContent = '';
      return;
    }
    if (!docs) {
      void ensureIndex();
      return;
    }
    renderHits(search(docs, q, 12), q);
  }

  let debounce: number | undefined;
  input.addEventListener('input', () => {
    window.clearTimeout(debounce);
    const value = input.value;
    // Short queries feel better instantly; longer ones benefit from a beat.
    debounce = window.setTimeout(() => run(value), value.length <= 2 ? 0 : 90);
  });

  /* ── Keyboard navigation ── */

  function items(): HTMLAnchorElement[] {
    return [...results.querySelectorAll<HTMLAnchorElement>('.sr-item')];
  }

  function setActive(index: number): void {
    const list = items();
    if (!list.length) {
      active = -1;
      return;
    }
    active = (index + list.length) % list.length;
    list.forEach((el, i) => {
      const on = i === active;
      el.classList.toggle('active', on);
      el.parentElement?.setAttribute('aria-selected', String(on));
      if (on) el.scrollIntoView({ block: 'nearest' });
    });
  }

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active - 1);
    } else if (e.key === 'Enter') {
      const list = items();
      if (active >= 0 && list[active]) {
        e.preventDefault();
        list[active].click();
      } else if (lastQuery) {
        e.preventDefault();
        location.href = `/search?q=${encodeURIComponent(lastQuery)}`;
      }
    } else if (e.key === 'Escape') {
      // Let the browser close the dialog, but clear a non-empty query first.
      if (input.value) {
        e.preventDefault();
        input.value = '';
        run('');
      }
    }
  });

  results.addEventListener('mousemove', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLAnchorElement>('.sr-item');
    if (!item) return;
    const idx = Number(item.dataset.idx);
    if (Number.isFinite(idx) && idx !== active) setActive(idx);
  });
}

/* ────────────────────────── helpers ────────────────────────── */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
