// World search: every word must appear somewhere (or nearly: a typo or two in a name or tag still finds it); names
// that match rank first, near misses last. Filters narrow by kind, tag, the
// place an entry sits in, and (for GMs) hidden-from-players or suggestions only. Pure, so it can be tested.
import { nearWord, wordsOf } from './name-check.js';

export function parseSearch(raw) {
  const [q = '', qs = ''] = String(raw || '').split('?');
  const p = new URLSearchParams(qs);
  let query = ''; try { query = decodeURIComponent(q); } catch { query = q; }
  return { q: query, kind: p.get('kind') || '', tag: p.get('tag') || '', inside: p.get('in') || '', state: p.get('state') || '' };
}

export function searchHash(f) {
  const p = new URLSearchParams();
  if (f.kind) p.set('kind', f.kind); if (f.tag) p.set('tag', f.tag); if (f.inside) p.set('in', f.inside); if (f.state) p.set('state', f.state);
  const qs = p.toString();
  return `world/q/${encodeURIComponent(f.q || '')}${qs ? `?${qs}` : ''}`;
}

// opts: { gm, within: Set of ids inside the chosen place (including it) }
export function searchEntries(entries, f, opts = {}) {
  let term = String(f.q || '').trim().toLowerCase();
  let tag = f.tag || '';
  if (term.startsWith('#') && !term.includes(' ')) { tag = tag || term.slice(1); term = ''; }
  const words = term.split(/\s+/).filter(Boolean);
  const text = (e) => [e.name, e.summary, e.body, ...Object.values(e.fields || {}), ...(e.tags || []), opts.gm ? e.secret : ''].join('\n').toLowerCase();
  const score = (e) => {
    const n = e.name.toLowerCase();
    if (!words.length) return 0;
    if (n === term) return 0;
    if (n.startsWith(term)) return 1;
    if (words.every((w) => n.includes(w))) return 2;
    if (words.every((w) => String(e.summary || '').toLowerCase().includes(w))) return 3;
    return 4;
  };
  return entries.filter((e) => (!f.kind || e.kind === f.kind)
    && (!tag || (e.tags || []).includes(tag))
    && (!opts.within || opts.within.has(e.id))
    && (!f.state || !opts.gm || (f.state === 'hidden' ? e.visibility === 'gm' : f.state === 'suggested' ? e.status === 'suggested' : true))
    && (!words.length || words.every((w) => text(e).includes(w) || nearWord(w, wordsOf(e.name, ...(e.tags || []))))))
    .map((e) => [words.every((w) => text(e).includes(w)) ? score(e) : 5, e]).sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name)).map(([, e]) => e);
}
