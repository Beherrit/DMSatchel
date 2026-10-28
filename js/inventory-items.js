// Find known items named in free-text inventory ("Potion of Healing x2, bag of holding, 50 ft rope"). Longer names
// win over shorter ones inside them ("Potion of Greater Healing" before "Potion of Healing"); names under five
// letters are ignored ("Ring" would match "ring of keys"). Pure, so it can be tested.
const norm = (s) => String(s || '').toLowerCase().replace(/[’‘]/g, "'");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function matchItems(text, candidates) {
  const t = norm(text);
  if (!t.trim()) return [];
  const taken = [], found = [];
  const seen = new Set();
  const list = candidates.filter((c) => c?.name && c.name.length >= 5).sort((a, b) => b.name.length - a.name.length);
  for (const c of list) {
    const key = norm(c.name);
    if (seen.has(key)) continue;
    const re = new RegExp(`(^|[^a-z0-9])${esc(key)}(?=$|[^a-z0-9])`, 'g');
    let m;
    while ((m = re.exec(t))) {
      const start = m.index + m[1].length, end = start + key.length;
      if (taken.some(([s, e]) => start < e && end > s)) continue;
      taken.push([start, end]); found.push({ ...c, at: start }); seen.add(key);
      break;
    }
  }
  return found.sort((a, b) => a.at - b.at).map(({ at, ...c }) => c);
}
