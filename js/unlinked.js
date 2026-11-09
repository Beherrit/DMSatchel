// Names left unlinked: entries a session's log names as plain text, without [[links]], so they don't count as
// mentioned. Matching is exact (case and whole words), names of four letters or more. Pure.
const KINDS = ['npc', 'character', 'location', 'settlement', 'region', 'area', 'quest', 'faction', 'guild', 'clan', 'item'];
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// The text with [[links]] blanked out (same length), so names inside links aren't found again.
const outsideLinks = (text) => String(text || '').replace(/\[\[[^\]]*\]\]/g, (m) => ' '.repeat(m.length));
const nameRe = (name) => new RegExp(`(^|[^\\p{L}\\p{N}])(${esc(name)})(?![\\p{L}\\p{N}])`, 'gu');

// → [{ entry, count }] for one text, longest names first (so "Lord Vane" wins over "Vane").
export function unlinkedIn(text, entries) {
  const plain = outsideLinks(text), out = [];
  const names = (entries || []).filter((e) => KINDS.includes(e.kind) && String(e.name || '').trim().length >= 4).sort((a, b) => b.name.length - a.name.length);
  let blank = plain;
  for (const e of names) {
    const hits = [...blank.matchAll(nameRe(e.name))];
    if (!hits.length) continue;
    out.push({ entry: e, count: hits.length });
    blank = blank.replace(nameRe(e.name), (m, pre, n) => pre + ' '.repeat(n.length));
  }
  return out;
}

// Link them: every plain mention of the given entries' names becomes a [[link]] (links already there are kept).
export function linkNames(text, entries) {
  let t = String(text || '');
  for (const e of [...(entries || [])].sort((a, b) => b.name.length - a.name.length)) {
    const parts = t.split(/(\[\[[^\]]*\]\])/);
    t = parts.map((p) => (p.startsWith('[[') ? p : p.replace(nameRe(e.name), (m, pre, n) => `${pre}[[${n}]]`))).join('');
  }
  return t;
}
