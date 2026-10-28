// Unlinked mentions: entry names written as plain text in another entry ("met the Mayor Vane at dawn") that could be
// [[links]]. Names must match whole words and their case; text already inside [[...]] is left alone, and a longer
// name wins over a shorter one inside it ("Red Hand" over "Hand"). Only the first plain mention of each becomes a
// link, the way a wiki does it. Pure, so it can be tested.

const MIN = 4;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const word = (n) => new RegExp(`(?<![\\p{L}\\p{N}])${esc(n)}(?![\\p{L}\\p{N}])`, 'gu');

// The parts of a text outside existing links: [[start, end), …].
function plainSpans(text) {
  const out = []; let at = 0;
  for (const m of text.matchAll(/\[\[[^\]]*\]\]/g)) { if (m.index > at) out.push([at, m.index]); at = m.index + m[0].length; }
  if (at < text.length) out.push([at, text.length]);
  return out;
}

// Where each name appears as plain text, longest names first so they claim their words before shorter names do.
function find(text, names) {
  const spans = plainSpans(text), taken = [], hits = [];
  for (const name of [...names].sort((a, b) => b.length - a.length)) {
    for (const [s, e] of spans) {
      for (const m of text.slice(s, e).matchAll(word(name))) {
        const a = s + m.index, b = a + name.length;
        if (taken.some(([x, y]) => a < y && b > x)) continue;
        taken.push([a, b]); hits.push({ name, at: a });
      }
    }
  }
  return hits.sort((x, y) => x.at - y.at);
}

const linkedNames = (text) => new Set([...String(text).matchAll(/\[\[([^\]|]+)/g)].map((m) => m[1].trim().toLowerCase()));

// entries: [{ id, name }] · texts: the strings to look through. → [{ entry, count }] in order of first appearance.
export function unlinkedMentions(texts, entries, selfId) {
  const all = texts.filter(Boolean).map(String);
  const already = new Set(all.flatMap((t) => [...linkedNames(t)]));
  const byName = new Map(), every = new Set();
  for (const e of entries) {
    const n = String(e.name).trim();
    if (n.length < MIN) continue;
    every.add(n); // every name still claims its words, so "Hand" never matches inside "Red Hand"
    if (e.id !== selfId && !already.has(n.toLowerCase())) byName.set(n, e);
  }
  const counts = new Map();
  for (const t of all) for (const h of find(t, [...every])) if (byName.has(h.name)) counts.set(h.name, (counts.get(h.name) || 0) + 1);
  return [...counts].map(([name, count]) => ({ entry: byName.get(name), count }));
}

// Link the first plain mention of each name across the texts, in order; `others` are names that still claim their
// words without being linked. → the new texts.
export function linkMentions(texts, names, others = []) {
  const left = new Set(names);
  return texts.map((t) => {
    if (!t || !left.size) return t;
    let out = String(t), shift = 0;
    for (const h of find(out, [...new Set([...left, ...others])])) {
      if (!left.has(h.name)) continue;
      left.delete(h.name);
      const a = h.at + shift;
      out = `${out.slice(0, a)}[[${h.name}]]${out.slice(a + h.name.length)}`;
      shift += 4;
    }
    return out;
  });
}
