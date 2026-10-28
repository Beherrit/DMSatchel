// [[Link]] completion while writing: find an unfinished "[[" before the cursor, rank entry names for what's been
// typed, and put the chosen name in. Pure, so it can be tested.

// { start, query } when the cursor sits after "[[" with no "]]" or line break since, else null.
export function openLink(text, caret) {
  const before = String(text).slice(0, caret);
  const at = before.lastIndexOf('[[');
  if (at < 0) return null;
  const query = before.slice(at + 2);
  if (/[\]\n]/.test(query) || query.length > 60) return null;
  return { start: at, query };
}

// Names that start with the query first, then words that start with it, then anywhere; at most `n`.
export function rankNames(entries, query, n = 8) {
  const q = query.trim().toLowerCase();
  const scored = [];
  for (const e of entries) {
    const name = e.name.toLowerCase();
    const s = !q ? 3 : name.startsWith(q) ? 0 : name.split(/[\s'’-]+/).some((w) => w.startsWith(q)) ? 1 : name.includes(q) ? 2 : -1;
    if (s >= 0) scored.push([s, e]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].name.length - b[1].name.length || a[1].name.localeCompare(b[1].name)).slice(0, n).map(([, e]) => e);
}

// The text with the open link finished as [[Name]] (any "]]" already after the cursor is reused), and the new cursor.
export function finishLink(text, caret, open, name) {
  const after = String(text).slice(caret);
  const closes = after.startsWith(']]') ? 2 : 0;
  const out = `${text.slice(0, open.start)}[[${name}]]${after.slice(closes)}`;
  return { text: out, caret: open.start + name.length + 4 };
}
