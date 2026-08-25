/**
 * "Where should I go?" — a five-question recommender over the local dataset.
 *
 * There is no model and no API call. Answers become weighted preferences that
 * are scored against the search index, which is already the compact form of
 * the whole atlas. Results are deterministic and explainable, and the tool
 * tells you *why* each place surfaced.
 */
import { loadIndex, type SearchDoc } from './search';

interface Answer {
  value: string;
  label: string;
  /** Tag slugs this answer rewards. */
  tags?: string[];
  /** Category slugs this answer rewards. */
  categories?: string[];
  /** Division slugs this answer rewards. */
  divisions?: string[];
  /** Reward or penalise renown: 'known' | 'quiet' | 'either'. */
  renown?: 'known' | 'quiet' | 'either';
  note?: string;
}

interface Question {
  id: string;
  prompt: string;
  hint?: string;
  multi?: boolean;
  answers: Answer[];
}

const QUESTIONS: Question[] = [
  {
    id: 'when',
    prompt: 'When are you travelling?',
    hint: 'Season matters more in Bangladesh than almost anywhere. Some of these places do not exist half the year.',
    answers: [
      { value: 'winter', label: 'December – February', note: 'Cool, dry, clear', tags: ['birdwatching'], categories: ['forest', 'wildlife', 'archaeological', 'beach'] },
      { value: 'spring', label: 'March – April', note: 'Flowering, then hot', categories: ['temple', 'archaeological', 'tea-garden'] },
      { value: 'summer', label: 'May – June', note: 'Hot; mango and litchi', categories: ['market', 'hill'] },
      { value: 'monsoon', label: 'July – September', note: 'Flood, waterfalls, haors', tags: ['seasonal', 'boat-trip'], categories: ['haor', 'waterfall', 'river'] },
      { value: 'autumn', label: 'October – November', note: 'The best month nobody picks', tags: ['photography'], categories: ['river', 'haor', 'viewpoint'] },
    ],
  },
  {
    id: 'howLong',
    prompt: 'How much time do you have?',
    answers: [
      { value: 'half-day', label: 'A few hours', tags: ['day-trip', 'accessible'] },
      { value: 'day', label: 'One full day', tags: ['day-trip'] },
      { value: 'overnight', label: 'A weekend', tags: ['weekend', 'night'] },
      { value: 'multi-day', label: 'Several days', tags: ['expedition', 'adventure', 'trekking'] },
    ],
  },
  {
    id: 'what',
    prompt: 'What do you actually enjoy?',
    hint: 'Pick as many as you like.',
    multi: true,
    answers: [
      { value: 'nature', label: 'Landscape and wildlife', categories: ['forest', 'wildlife', 'national-park', 'haor', 'wetland', 'island'], tags: ['birdwatching'] },
      { value: 'water', label: 'Rivers and boats', categories: ['river', 'lake', 'haor', 'beach'], tags: ['boat-trip'] },
      { value: 'hills', label: 'Hills and viewpoints', categories: ['hill', 'viewpoint', 'waterfall'], tags: ['trekking'] },
      { value: 'heritage', label: 'Ruins and old buildings', categories: ['archaeological', 'historical', 'palace', 'zamindar-bari', 'fort', 'museum'], tags: ['architecture'] },
      { value: 'faith', label: 'Mosques, temples and shrines', categories: ['mosque', 'temple', 'buddhist', 'shrine', 'church'] },
      { value: 'culture', label: 'Crafts, markets and music', categories: ['village', 'market', 'cultural'], tags: ['shopping', 'literary'] },
      { value: 'food', label: 'Eating something specific', tags: ['food'], categories: ['market'] },
      { value: 'photos', label: 'Taking photographs', tags: ['photography', 'sunrise', 'sunset'] },
    ],
  },
  {
    id: 'who',
    prompt: 'Who is going?',
    answers: [
      { value: 'solo', label: 'Just me', tags: ['solo', 'offbeat'] },
      { value: 'couples', label: 'Two of us', tags: ['couples'] },
      { value: 'family', label: 'With family', tags: ['family', 'accessible'] },
      { value: 'group', label: 'A group of friends', tags: ['group', 'adventure'] },
    ],
  },
  {
    id: 'crowds',
    prompt: 'Do you mind other people?',
    answers: [
      { value: 'known', label: 'I want the famous ones', renown: 'known', tags: ['iconic'] },
      { value: 'either', label: 'No strong feeling', renown: 'either' },
      { value: 'quiet', label: 'I want them to myself', renown: 'quiet', tags: ['hidden-gem', 'offbeat'] },
    ],
  },
];

/* ────────────────────────── scoring ────────────────────────── */

interface Weights {
  tags: Map<string, number>;
  categories: Map<string, number>;
  divisions: Map<string, number>;
  renown: 'known' | 'quiet' | 'either';
}

function collect(selections: Map<string, Set<string>>): Weights {
  const w: Weights = {
    tags: new Map(),
    categories: new Map(),
    divisions: new Map(),
    renown: 'either',
  };
  const bump = (map: Map<string, number>, key: string, by: number) =>
    map.set(key, (map.get(key) ?? 0) + by);

  for (const q of QUESTIONS) {
    const chosen = selections.get(q.id);
    if (!chosen?.size) continue;
    // A single decisive pick counts for more than one of five multi-picks.
    const share = 1 / chosen.size;
    for (const a of q.answers) {
      if (!chosen.has(a.value)) continue;
      for (const t of a.tags ?? []) bump(w.tags, t, 3 * share);
      for (const c of a.categories ?? []) bump(w.categories, c, 4 * share);
      for (const d of a.divisions ?? []) bump(w.divisions, d, 2 * share);
      if (a.renown) w.renown = a.renown;
    }
  }
  return w;
}

interface Scored {
  doc: SearchDoc;
  score: number;
  reasons: string[];
}

function scoreDoc(doc: SearchDoc, w: Weights, labels: Record<string, string>): Scored {
  let score = 0;
  const reasons: string[] = [];

  const cats = doc.c.toLowerCase();
  const tags = doc.t.toLowerCase();

  for (const [slug, weight] of w.categories) {
    const label = (labels[slug] ?? slug).toLowerCase();
    if (label && cats.includes(label)) {
      score += weight;
      if (reasons.length < 3) reasons.push(labels[slug] ?? slug);
    }
  }
  for (const [slug, weight] of w.tags) {
    const label = (labels[slug] ?? slug).toLowerCase();
    if (label && tags.includes(label)) {
      score += weight;
      if (reasons.length < 3) reasons.push(labels[slug] ?? slug);
    }
  }
  for (const [slug, weight] of w.divisions) {
    if (doc.sv === slug) score += weight;
  }

  if (w.renown === 'known') score += doc.p * 2.2;
  else if (w.renown === 'quiet') score += (6 - doc.p) * 2.2 + (doc.g ? 5 : 0);
  else score += doc.p * 0.7;

  return { doc, score, reasons };
}

/* ────────────────────────── UI ────────────────────────── */

export function initDiscover(): void {
  const root = document.querySelector<HTMLElement>('[data-discover]');
  if (!root) return;

  const stepsEl = root.querySelector<HTMLElement>('[data-discover-steps]')!;
  const resultsEl = root.querySelector<HTMLElement>('[data-discover-results]')!;
  const progressEl = root.querySelector<HTMLElement>('[data-discover-progress]');
  const backBtn = root.querySelector<HTMLButtonElement>('[data-discover-back]');
  const restartBtn = root.querySelector<HTMLButtonElement>('[data-discover-restart]');

  /** Slug → display label, read from the server-rendered data island. */
  const labels: Record<string, string> = JSON.parse(
    root.querySelector<HTMLScriptElement>('[data-discover-labels]')?.textContent ?? '{}'
  );

  const selections = new Map<string, Set<string>>();
  let step = 0;
  let docs: SearchDoc[] | null = null;

  void loadIndex()
    .then((d) => {
      docs = d;
    })
    .catch(() => {
      docs = null;
    });

  function renderStep(): void {
    const q = QUESTIONS[step];
    resultsEl.hidden = true;
    stepsEl.hidden = false;

    const chosen = selections.get(q.id) ?? new Set<string>();

    stepsEl.innerHTML = `
      <div class="dq" role="group" aria-labelledby="dq-prompt">
        <p class="dq-step">Question ${step + 1} of ${QUESTIONS.length}</p>
        <h2 class="dq-prompt" id="dq-prompt">${escapeHtml(q.prompt)}</h2>
        ${q.hint ? `<p class="dq-hint">${escapeHtml(q.hint)}</p>` : ''}
        <div class="dq-answers">
          ${q.answers
            .map(
              (a) => `<button type="button" class="dq-answer" data-answer="${escapeHtml(a.value)}"
                aria-pressed="${chosen.has(a.value)}">
                <span class="dq-answer-label">${escapeHtml(a.label)}</span>
                ${a.note ? `<span class="dq-answer-note">${escapeHtml(a.note)}</span>` : ''}
              </button>`
            )
            .join('')}
        </div>
        ${
          q.multi
            ? `<button type="button" class="btn btn-primary dq-next" data-next ${chosen.size ? '' : 'disabled'}>
                 Continue
               </button>`
            : ''
        }
      </div>`;

    if (progressEl) {
      progressEl.style.setProperty('--progress', String(((step + 1) / QUESTIONS.length) * 100));
      progressEl.setAttribute('aria-valuenow', String(step + 1));
    }
    if (backBtn) backBtn.hidden = step === 0;
    if (restartBtn) restartBtn.hidden = true;

    stepsEl.querySelector<HTMLButtonElement>('.dq-answer')?.focus();
  }

  function choose(value: string): void {
    const q = QUESTIONS[step];
    const set = selections.get(q.id) ?? new Set<string>();
    if (q.multi) {
      if (set.has(value)) set.delete(value);
      else set.add(value);
      selections.set(q.id, set);
      // Repaint in place so the toggle state is visible.
      const btn = stepsEl.querySelector<HTMLButtonElement>(`[data-answer="${CSS.escape(value)}"]`);
      btn?.setAttribute('aria-pressed', String(set.has(value)));
      const next = stepsEl.querySelector<HTMLButtonElement>('[data-next]');
      if (next) next.disabled = set.size === 0;
      return;
    }
    selections.set(q.id, new Set([value]));
    advance();
  }

  function advance(): void {
    if (step < QUESTIONS.length - 1) {
      step++;
      renderStep();
    } else {
      showResults();
    }
  }

  function showResults(): void {
    stepsEl.hidden = true;
    resultsEl.hidden = false;
    if (backBtn) backBtn.hidden = true;
    if (restartBtn) restartBtn.hidden = false;
    if (progressEl) progressEl.style.setProperty('--progress', '100');

    if (!docs) {
      resultsEl.innerHTML = `
        <div class="dr-empty">
          <h2>Could not load the atlas</h2>
          <p>Something went wrong fetching the destination index. You can still
            <a href="/explore">browse everything</a> or <a href="/map">use the map</a>.</p>
        </div>`;
      return;
    }

    const weights = collect(selections);
    const scored = docs
      .map((d) => scoreDoc(d, weights, labels))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    // Spread the shortlist across divisions so it does not become a Sylhet list.
    const picked: Scored[] = [];
    const perDivision = new Map<string, number>();
    for (const s of scored) {
      const used = perDivision.get(s.doc.sv) ?? 0;
      if (used >= 3) continue;
      perDivision.set(s.doc.sv, used + 1);
      picked.push(s);
      if (picked.length >= 9) break;
    }
    // If the filters were narrow, fall back to the raw ranking.
    if (picked.length < 6) picked.push(...scored.slice(0, 9 - picked.length));

    if (!picked.length) {
      resultsEl.innerHTML = `
        <div class="dr-empty">
          <h2>Nothing matched that combination</h2>
          <p>That is usually a sign the filters pulled in opposite directions — a half-day
            trip and a multi-day trek, for instance. Try again with fewer constraints, or
            <a href="/explore">browse everything</a>.</p>
        </div>`;
      return;
    }

    const summary = summarise(selections);

    resultsEl.innerHTML = `
      <div class="dr-head">
        <p class="eyebrow">Your shortlist</p>
        <h2 class="dr-title">${picked.length} places worth your time</h2>
        <p class="dr-summary">${escapeHtml(summary)}</p>
      </div>
      <div class="dr-grid">
        ${picked
          .map(
            (s) => `<a class="dr-card" href="/places/${escapeHtml(s.doc.i)}">
              <img class="dr-art" src="/images/art/${escapeHtml(s.doc.f)}" alt="" width="320" height="200" loading="lazy" decoding="async">
              <div class="dr-body">
                <p class="dr-where">${escapeHtml(s.doc.d)} · ${escapeHtml(s.doc.v)}</p>
                <h3 class="dr-name">${escapeHtml(s.doc.n)}</h3>
                <p class="dr-blurb">${escapeHtml(s.doc.s.split('. ')[0])}.</p>
                ${
                  s.reasons.length
                    ? `<p class="dr-why"><span>Because you said</span> ${s.reasons
                        .map((r) => `<em>${escapeHtml(r)}</em>`)
                        .join(', ')}</p>`
                    : ''
                }
              </div>
            </a>`
          )
          .join('')}
      </div>
      <div class="dr-actions">
        <button type="button" class="btn btn-ghost" data-discover-restart-inline>Start again</button>
        <a class="btn btn-primary" href="/explore">Browse all destinations</a>
      </div>`;

    resultsEl.querySelector('.dr-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function summarise(sel: Map<string, Set<string>>): string {
    const parts: string[] = [];
    for (const q of QUESTIONS) {
      const chosen = sel.get(q.id);
      if (!chosen?.size) continue;
      const labelsFor = q.answers.filter((a) => chosen.has(a.value)).map((a) => a.label.toLowerCase());
      if (labelsFor.length) parts.push(labelsFor.join(' and '));
    }
    return parts.length ? `Based on: ${parts.join(' · ')}.` : '';
  }

  /* ── Wiring ── */

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const answer = target.closest<HTMLButtonElement>('[data-answer]');
    if (answer) {
      choose(answer.dataset.answer!);
      return;
    }
    if (target.closest('[data-next]')) {
      advance();
      return;
    }
    if (target.closest('[data-discover-back]')) {
      if (step > 0) {
        step--;
        renderStep();
      }
      return;
    }
    if (target.closest('[data-discover-restart]') || target.closest('[data-discover-restart-inline]')) {
      selections.clear();
      step = 0;
      renderStep();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  renderStep();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
