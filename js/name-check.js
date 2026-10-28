// Is that name taken? While a new entry is being named, find entries with the same name, or one close enough to be
// the same thing ("The Brindle" / "Brindle", "Brindel" / "Brindle"). Pure, so it can be tested.

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();

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

// → { exact: [entries], close: [entries] } (at most five close ones, nearest first).
export function similarNames(name, entries, selfId) {
  const n = norm(name);
  if (n.length < 3) return { exact: [], close: [] };
  const exact = [], close = [];
  for (const e of entries) {
    if (e.id === selfId) continue;
    const m = norm(e.name);
    if (!m) continue;
    if (m === n) { exact.push(e); continue; }
    const max = n.length >= 9 ? 2 : 1;
    const typo = n.length >= 5 && m.length >= 5 && distance(n, m, max) <= max;
    const inside = Math.min(n.length, m.length) >= 4 && (m === n.replace(/s$/, '') || n === m.replace(/s$/, '') || (` ${m} `).includes(` ${n} `) || (` ${n} `).includes(` ${m} `));
    if (typo || inside) close.push([e, typo ? 1 : 2]);
  }
  return { exact, close: close.sort((a, b) => a[1] - b[1] || a[0].name.localeCompare(b[0].name)).slice(0, 5).map(([e]) => e) };
}
