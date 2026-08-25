/**
 * Interactive behaviour for the Bangladesh map.
 *
 * The SVG itself is server-rendered and every region is already a link, so
 * this only adds hover cards, keyboard hints, division filtering and label
 * density — none of which the page depends on.
 */
export function initMap(): void {
  for (const map of document.querySelectorAll<HTMLElement>('[data-bd-map]')) {
    setupMap(map);
  }
  setupFilterBar();
}

function setupMap(map: HTMLElement): void {
  const svg = map.querySelector<SVGSVGElement>('.bdmap-svg');
  const tip = map.querySelector<HTMLElement>('[data-map-tip]');
  if (!svg) return;

  const tipName = tip?.querySelector<HTMLElement>('[data-tip-name]');
  const tipBn = tip?.querySelector<HTMLElement>('[data-tip-bn]');
  const tipCount = tip?.querySelector<HTMLElement>('[data-tip-count]');

  const showTip = (region: SVGGElement | HTMLElement) => {
    if (!tip || !tipName || !tipCount) return;
    const name = region.getAttribute('data-name') ?? '';
    const bn = region.getAttribute('data-name-bn') ?? '';
    const count = Number(region.getAttribute('data-count') ?? 0);

    tipName.textContent = name;
    if (tipBn) {
      tipBn.textContent = bn;
      tipBn.hidden = !bn;
    }
    tipCount.textContent =
      count === 0 ? 'No destinations yet' : `${count} destination${count === 1 ? '' : 's'}`;

    // Position from the region's centroid, converted to map-box coordinates.
    const cx = Number(region.getAttribute('data-cx'));
    const cy = Number(region.getAttribute('data-cy'));
    const box = svg.viewBox.baseVal;
    const rect = svg.getBoundingClientRect();
    const mapRect = map.getBoundingClientRect();

    if (Number.isFinite(cx) && Number.isFinite(cy) && box.width) {
      const scale = rect.width / box.width;
      tip.style.left = `${rect.left - mapRect.left + cx * scale}px`;
      tip.style.top = `${rect.top - mapRect.top + cy * scale}px`;
    }

    tip.hidden = false;
    tip.setAttribute('aria-hidden', 'true');
  };

  const hideTip = () => {
    if (tip) tip.hidden = true;
  };

  for (const region of svg.querySelectorAll<SVGGElement>('[data-region]')) {
    region.addEventListener('mouseenter', () => showTip(region));
    region.addEventListener('focus', () => showTip(region));
    region.addEventListener('mouseleave', hideTip);
    region.addEventListener('blur', hideTip);
  }
  map.addEventListener('mouseleave', hideTip);

  // District labels are noisy at small sizes; show them only when there is room.
  if (map.classList.contains('bdmap-districts')) {
    const check = () => {
      if (map.getBoundingClientRect().width >= 620) map.setAttribute('data-show-labels', '');
      else map.removeAttribute('data-show-labels');
    };
    check();
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(check).observe(map);
    } else {
      window.addEventListener('resize', check, { passive: true });
    }
  }
}

/**
 * Division filter chips on the map page: dim everything outside the chosen
 * division and update the accompanying district list.
 */
function setupFilterBar(): void {
  const bar = document.querySelector<HTMLElement>('[data-map-filter]');
  if (!bar) return;

  const regions = document.querySelectorAll<SVGGElement>('[data-region]');
  const listItems = document.querySelectorAll<HTMLElement>('[data-map-list-item]');
  const countEl = document.querySelector<HTMLElement>('[data-map-count]');

  const apply = (division: string) => {
    let shown = 0;
    for (const region of regions) {
      const match = division === 'all' || region.getAttribute('data-division') === division;
      region.toggleAttribute('data-hidden', !match);
      if (match) shown++;
    }
    for (const item of listItems) {
      const match = division === 'all' || item.dataset.division === division;
      item.hidden = !match;
    }
    if (countEl) {
      countEl.textContent = String(shown);
    }
    for (const btn of bar.querySelectorAll<HTMLButtonElement>('[data-division-filter]')) {
      const on = btn.dataset.divisionFilter === division;
      btn.setAttribute('aria-pressed', String(on));
    }
    // Keep the choice in the URL so the view is shareable and survives reload.
    const url = new URL(location.href);
    if (division === 'all') url.searchParams.delete('division');
    else url.searchParams.set('division', division);
    history.replaceState(null, '', url);
  };

  bar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-division-filter]');
    if (!btn) return;
    apply(btn.dataset.divisionFilter!);
  });

  const initial = new URL(location.href).searchParams.get('division');
  if (initial) apply(initial);
}
