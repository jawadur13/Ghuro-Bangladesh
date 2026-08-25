/**
 * Client-side search over the local dataset.
 *
 * The index is a static JSON file generated at build time from `src/data`.
 * It is fetched once, on first interaction, and cached in module scope — so
 * search costs nothing until someone actually opens it.
 *
 * Matching is deliberately hand-rolled rather than delegated to a library:
 * it needs to handle Bengali script, Latin transliteration and multi-word
 * prefix matching, and it needs to stay under a few kilobytes.
 */

export interface SearchDoc {
  i: string; // slug
  n: string; // name
  b: string; // Bengali name
  a: string; // alt names
  d: string; // district name
  db: string; // district Bengali name
  v: string; // division name
  c: string; // categories
  t: string; // tags
  s: string; // tagline + summary
  p: number; // popularity 1–5
  g: 0 | 1; // hidden gem
  k: string; // art key
  f: string; // resolved artwork filename
  sd: string; // district slug
  sv: string; // division slug
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
  /** Which field produced the strongest match, for the result label. */
  via: 'name' | 'bengali' | 'alt' | 'district' | 'division' | 'category' | 'tag' | 'text';
}

let indexPromise: Promise<SearchDoc[]> | null = null;

export function loadIndex(): Promise<SearchDoc[]> {
  if (!indexPromise) {
    indexPromise = fetch('/search-index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`search index ${r.status}`);
        return r.json();
      })
      .catch((err) => {
        // Reset so a later attempt can retry after a transient network failure.
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

/* ────────────────────────── normalisation ────────────────────────── */

/**
 * Fold a string for comparison: lowercase, strip diacritics, normalise the
 * apostrophes and hyphens that appear in names like Cox's Bazar and
 * Chapai Nawabganj, and collapse whitespace.
 *
 * Bengali text is left intact apart from case and spacing — Unicode
 * normalisation to NFC keeps composed and decomposed forms comparable.
 */
export function fold(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[‘’'`´]/g, '')
    .replace(/[‐-―_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip Latin diacritics only; Bengali combining marks must survive. */
function deaccent(input: string): string {
  return input.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const norm = (s: string) => deaccent(fold(s));

/**
 * Common romanisation drift in Bangladeshi place names. Queries are expanded
 * so that "Chittagong" finds Chattogram, "Jessore" finds Jashore and so on.
 * These are one-directional query hints, not renames.
 */
const ALIASES: Record<string, string> = {
  chittagong: 'chattogram',
  chatgaon: 'chattogram',
  comilla: 'cumilla',
  jessore: 'jashore',
  barisal: 'barishal',
  bogra: 'bogura',
  dacca: 'dhaka',
  maulvibazar: 'moulvibazar',
  moulavibazar: 'moulvibazar',
  netrakona: 'netrokona',
  nawabganj: 'chapai nawabganj',
  chapainawabganj: 'chapai nawabganj',
  srimangal: 'sreemangal',
  srimongol: 'sreemangal',
  sreemongol: 'sreemangal',
  sundarban: 'sundarbans',
  coxbazar: 'coxs bazar',
  coxsbazar: 'coxs bazar',
  saintmartin: 'saint martins',
  stmartin: 'saint martins',
  paharpur: 'somapura',
  kantaji: 'kantajew',
  kantanagar: 'kantajew',
  shatgombuj: 'shat gambuj',
  sixtydome: 'shat gambuj',
};

function expand(query: string): string[] {
  const base = norm(query);
  const out = [base];
  const compact = base.replace(/\s+/g, '');
  for (const [from, to] of Object.entries(ALIASES)) {
    if (base.includes(from) || compact.includes(from)) out.push(norm(to));
  }
  return out;
}

/* ────────────────────────── scoring ────────────────────────── */

interface Field {
  key: keyof SearchDoc;
  weight: number;
  via: SearchHit['via'];
}

const FIELDS: Field[] = [
  { key: 'n', weight: 100, via: 'name' },
  { key: 'b', weight: 92, via: 'bengali' },
  { key: 'a', weight: 74, via: 'alt' },
  { key: 'd', weight: 46, via: 'district' },
  { key: 'db', weight: 44, via: 'district' },
  { key: 'v', weight: 30, via: 'division' },
  { key: 'c', weight: 34, via: 'category' },
  { key: 't', weight: 26, via: 'tag' },
  { key: 's', weight: 16, via: 'text' },
];

/** Score a single token against a single field value. */
function scoreToken(token: string, value: string, weight: number): number {
  if (!value) return 0;
  const at = value.indexOf(token);
  if (at === -1) return 0;

  // Exact whole-field match is the strongest possible signal.
  if (value === token) return weight * 2.4;
  // Match at the start of the field.
  if (at === 0) return weight * 1.6;
  // Match at a word boundary.
  if (value[at - 1] === ' ') return weight * 1.25;
  // Match inside a word.
  return weight * 0.6;
}

const foldedCache = new WeakMap<SearchDoc, Record<string, string>>();

function folded(doc: SearchDoc): Record<string, string> {
  let cached = foldedCache.get(doc);
  if (!cached) {
    cached = {};
    for (const f of FIELDS) cached[f.key] = norm(String(doc[f.key] ?? ''));
    foldedCache.set(doc, cached);
  }
  return cached;
}

export function search(docs: SearchDoc[], query: string, limit = 24): SearchHit[] {
  const variants = expand(query);
  if (!variants[0]) return [];

  const tokenSets = variants.map((v) => v.split(' ').filter((t) => t.length > 0));
  const hits: SearchHit[] = [];

  for (const doc of docs) {
    const values = folded(doc);
    let best = 0;
    let bestVia: SearchHit['via'] = 'text';

    for (const tokens of tokenSets) {
      let total = 0;
      let matchedAll = true;
      let via: SearchHit['via'] = 'text';
      let viaScore = 0;

      for (const token of tokens) {
        let tokenBest = 0;
        let tokenVia: SearchHit['via'] = 'text';
        for (const field of FIELDS) {
          const sc = scoreToken(token, values[field.key], field.weight);
          if (sc > tokenBest) {
            tokenBest = sc;
            tokenVia = field.via;
          }
        }
        if (tokenBest === 0) {
          matchedAll = false;
          break;
        }
        total += tokenBest;
        if (tokenBest > viaScore) {
          viaScore = tokenBest;
          via = tokenVia;
        }
      }

      if (matchedAll && total > best) {
        best = total;
        bestVia = via;
      }
    }

    if (best > 0) {
      // Renown breaks ties: two equally good textual matches should show the
      // better-known place first.
      hits.push({ doc, score: best + doc.p * 6, via: bestVia });
    }
  }

  hits.sort((a, b) => b.score - a.score || a.doc.n.localeCompare(b.doc.n));
  return hits.slice(0, limit);
}

/** Wrap the matched substring in <mark>, escaping everything else. */
export function highlight(text: string, query: string): string {
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  const needle = norm(query).split(' ')[0];
  if (!needle) return esc(text);

  const hay = norm(text);
  const at = hay.indexOf(needle);
  if (at === -1) return esc(text);

  // norm() can change length (diacritic stripping); re-find on the raw string
  // when the folded offsets do not line up, and fall back to no highlight.
  const raw = text.toLowerCase();
  const rawAt = raw.indexOf(needle) !== -1 ? raw.indexOf(needle) : at;
  if (rawAt + needle.length > text.length) return esc(text);

  return (
    esc(text.slice(0, rawAt)) +
    '<mark>' +
    esc(text.slice(rawAt, rawAt + needle.length)) +
    '</mark>' +
    esc(text.slice(rawAt + needle.length))
  );
}
