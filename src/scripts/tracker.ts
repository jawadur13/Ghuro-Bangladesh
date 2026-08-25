/**
 * District completion tracker.
 *
 * Marks which of the 64 districts a visitor has been to, entirely in
 * localStorage. It is the one piece of "gamification" here that earns its
 * place: sixty-four is a satisfying number and most Bangladeshis have a
 * running mental count already.
 */
import { getVisitedDistricts, toggleVisitedDistrict, clearVisitedDistricts } from './store';
import { announce } from './app';

export function initTracker(): void {
  const root = document.querySelector<HTMLElement>('[data-district-tracker]');
  if (!root) return;

  const countEl = document.querySelector<HTMLElement>('[data-visited-count]');
  const pctEl = document.querySelector<HTMLElement>('[data-visited-pct]');
  const barEl = document.querySelector<HTMLElement>('[data-visited-bar]');
  const resetBtn = document.querySelector<HTMLButtonElement>('[data-visited-reset]');
  const remainingEl = document.querySelector<HTMLElement>('[data-visited-remaining]');
  const total = Number(root.dataset.total ?? 64);

  function sync(): void {
    const visited = getVisitedDistricts();

    for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-visit-toggle]')) {
      const slug = btn.dataset.visitToggle!;
      const on = visited.has(slug);
      btn.setAttribute('aria-pressed', String(on));
      const row = btn.closest<HTMLElement>('[data-visit-row]');
      row?.toggleAttribute('data-visited', on);
    }

    // Reflect onto the map, when one is on the page.
    for (const region of document.querySelectorAll<SVGGElement>('[data-region]')) {
      const slug = region.getAttribute('data-region')!;
      if (visited.has(slug)) region.setAttribute('data-visited', '');
      else region.removeAttribute('data-visited');
    }

    const n = visited.size;
    const pct = Math.round((n / total) * 100);
    if (countEl) countEl.textContent = String(n);
    if (pctEl) pctEl.textContent = String(pct);
    if (barEl) barEl.style.setProperty('--pct', String(pct));
    if (remainingEl) remainingEl.textContent = String(total - n);
    if (resetBtn) resetBtn.hidden = n === 0;
  }

  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-visit-toggle]');
    if (!btn) return;
    e.preventDefault();
    const slug = btn.dataset.visitToggle!;
    const name = btn.dataset.visitName ?? slug;
    const visited = toggleVisitedDistrict(slug);
    announce(visited ? `${name} marked as visited` : `${name} unmarked`);
  });

  resetBtn?.addEventListener('click', () => {
    if (!getVisitedDistricts().size) return;
    if (!window.confirm('Reset your district tracker? This cannot be undone.')) return;
    clearVisitedDistricts();
    announce('District tracker reset');
  });

  window.addEventListener('gb:visited', sync);
  sync();
}
