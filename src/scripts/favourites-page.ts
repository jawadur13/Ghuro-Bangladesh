/**
 * The saved-places page.
 *
 * Everything lives in localStorage, so this page is rendered entirely on the
 * client from the search index. It also offers export and import, because a
 * list that can only exist in one browser is a list you will eventually lose.
 */
import { loadIndex, type SearchDoc } from './search';
import { getFavourites, clearFavourites, toggleFavourite } from './store';
import { announce } from './app';

export function initFavouritesPage(): void {
  const root = document.querySelector<HTMLElement>('[data-favourites-page]');
  if (!root) return;

  const listEl = root.querySelector<HTMLElement>('[data-fav-list]')!;
  const emptyEl = root.querySelector<HTMLElement>('[data-fav-empty]')!;
  const toolsEl = root.querySelector<HTMLElement>('[data-fav-tools]');
  const clearBtn = root.querySelector<HTMLButtonElement>('[data-fav-clear]');
  const exportBtn = root.querySelector<HTMLButtonElement>('[data-fav-export]');
  const importInput = root.querySelector<HTMLInputElement>('[data-fav-import]');
  const statusEl = root.querySelector<HTMLElement>('[data-fav-status]');

  let docs: SearchDoc[] | null = null;

  async function render(): Promise<void> {
    const saved = getFavourites();

    if (!saved.length) {
      listEl.innerHTML = '';
      listEl.hidden = true;
      emptyEl.hidden = false;
      if (toolsEl) toolsEl.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    listEl.hidden = false;
    if (toolsEl) toolsEl.hidden = false;

    if (!docs) {
      listEl.innerHTML = `<p class="fav-loading">Loading your places…</p>`;
      try {
        docs = await loadIndex();
      } catch {
        listEl.innerHTML = `<p class="fav-loading">Could not load destination details.
          Your saved list is intact — try reloading the page.</p>`;
        return;
      }
    }

    const byslug = new Map(docs.map((d) => [d.i, d]));
    const rows = saved.map((entry) => ({ entry, doc: byslug.get(entry.slug) }));

    // Group by division so a long list reads as a plan rather than a pile.
    const groups = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = row.doc?.v ?? 'Elsewhere';
      const bucket = groups.get(key) ?? [];
      bucket.push(row);
      groups.set(key, bucket);
    }

    listEl.innerHTML = [...groups.entries()]
      .map(
        ([division, items]) => `
        <section class="fav-group">
          <h2 class="fav-group-title">${escapeHtml(division)} <span class="tnum">${items.length}</span></h2>
          <ul class="fav-items">
            ${items
              .map(({ entry, doc }) =>
                doc
                  ? `<li class="fav-item">
                      <a class="fav-link" href="/places/${escapeHtml(doc.i)}">
                        <img class="fav-art" src="/images/art/${escapeHtml(doc.f)}" alt="" width="120" height="80" loading="lazy" decoding="async">
                        <span class="fav-text">
                          <span class="fav-name">${escapeHtml(doc.n)}</span>
                          <span class="fav-where">${escapeHtml(doc.d)}</span>
                          <span class="fav-blurb">${escapeHtml(doc.s.split('. ')[0])}.</span>
                        </span>
                      </a>
                      <button type="button" class="fav-remove" data-remove="${escapeHtml(doc.i)}"
                        data-name="${escapeHtml(doc.n)}" aria-label="Remove ${escapeHtml(doc.n)}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18"/>
                        </svg>
                      </button>
                    </li>`
                  : `<li class="fav-item fav-item-missing">
                      <span class="fav-text">
                        <span class="fav-name">${escapeHtml(entry.name || entry.slug)}</span>
                        <span class="fav-where">This destination is no longer in the atlas.</span>
                      </span>
                      <button type="button" class="fav-remove" data-remove="${escapeHtml(entry.slug)}"
                        data-name="${escapeHtml(entry.name || entry.slug)}" aria-label="Remove">×</button>
                    </li>`
              )
              .join('')}
          </ul>
        </section>`
      )
      .join('');
  }

  listEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-remove]');
    if (!btn) return;
    e.preventDefault();
    const slug = btn.dataset.remove!;
    toggleFavourite(slug, btn.dataset.name ?? slug);
  });

  clearBtn?.addEventListener('click', () => {
    if (!getFavourites().length) return;
    const ok = window.confirm('Remove every saved place? This cannot be undone.');
    if (!ok) return;
    clearFavourites();
    announce('All saved places removed');
  });

  exportBtn?.addEventListener('click', () => {
    const data = JSON.stringify({ app: 'ghuro-bangladesh', version: 1, places: getFavourites() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ghuro-bangladesh-saved-places.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Saved list downloaded.');
  });

  importInput?.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { places?: { slug: string; name: string }[] };
      if (!Array.isArray(parsed.places)) throw new Error('bad shape');
      let added = 0;
      const existing = new Set(getFavourites().map((f) => f.slug));
      for (const p of parsed.places) {
        if (typeof p?.slug !== 'string' || existing.has(p.slug)) continue;
        toggleFavourite(p.slug, typeof p.name === 'string' ? p.name : p.slug);
        added++;
      }
      setStatus(added ? `Added ${added} place${added === 1 ? '' : 's'}.` : 'Nothing new to add.');
    } catch {
      setStatus('That file could not be read. It should be a list exported from this site.');
    } finally {
      importInput.value = '';
    }
  });

  function setStatus(message: string): void {
    if (statusEl) statusEl.textContent = message;
    announce(message);
  }

  window.addEventListener('gb:favourites', () => void render());
  void render();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
