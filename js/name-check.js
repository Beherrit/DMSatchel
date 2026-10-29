// Is that name taken? While a new entry is being named, find entries with the same name, or one close enough to be
// the same thing ("The Brindle" / "Brindle", "Brindel" / "Brindle"). Pure, so it can be tested.

export const normName = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();

// Edit distance where swapping two neighbouring letters counts as one edit, giving up early past `max`.
function distance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let before = null, prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (before && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], before[j - 2] + 1);
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    before = prev; prev = cur;
  }
  return prev[b.length];
}

// How alike two normalised names are: 'exact', 1 (a typo or two apart), 2 (one inside the other, or a plural), or 0.
// Names with different numbers in them ("Session 12", "Session 13") are never close.
export function closeness(n, m) {
  if (!n || !m) return 0;
  if (n === m) return 'exact';
  if ((n.match(/\d+/g) || []).join() !== (m.match(/\d+/g) || []).join()) return 0;
  const max = n.length >= 9 ? 2 : 1;
  if (n.length >= 5 && m.length >= 5 && distance(n, m, max) <= max) return 1;
  const inside = Math.min(n.length, m.length) >= 4 && (m === n.replace(/s$/, '') || n === m.replace(/s$/, '') || (` ${m} `).includes(` ${n} `) || (` ${n} `).includes(` ${m} `));
  return inside ? 2 : 0;
}

// Forgiving search: does a typed word (4+ letters) nearly match one of these words? A typo or two away (two for
// long words), whole or as the start of a longer word ("brimdle" finds Brindle, "silvr" finds Silverhand).
export function nearWord(word, tokens) {
  const w = String(word).toLowerCase();
  if (w.length < 4) return false;
  const max = w.length >= 8 ? 2 : 1;
  return (tokens || []).some((t) => { const s = String(t).toLowerCase(); return Math.abs(s.length - w.length) <= max ? distance(w, s, max) <= max : s.length > w.length && distance(w, s.slice(0, w.length), max) <= max; });
}

// The words of a name or tag list, for nearWord.
export const wordsOf = (...texts) => texts.join(' ').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((x) => x.length >= 3);

// → { exact: [entries], close: [entries] } (at most five close ones, nearest first).
export function similarNames(name, entries, selfId) {
  const n = normName(name);
  if (n.length < 3) return { exact: [], close: [] };
  const exact = [], close = [];
  for (const e of entries) {
    if (e.id === selfId) continue;
    const m = normName(e.name);
    if (!m) continue;
    const c = closeness(n, m);
    if (c === 'exact') exact.push(e); else if (c) close.push([e, c]);
  }
  return { exact, close: close.sort((a, b) => a[1] - b[1] || a[0].name.localeCompare(b[0].name)).slice(0, 5).map(([e]) => e) };
}
