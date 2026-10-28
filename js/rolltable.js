// Custom roll tables, written as plain lines:
//   "A one-eyed fisherman"            weight 1
//   "3x Nothing but rats"             weight 3
//   "1-4: Rain" / "5–6: Fog"          die ranges (become weights)
//   "# a comment" and blank lines are skipped
// Results can hold dice "{2d6+1}", choices "{red|blue|green}" and other tables "[[Weird weather]]", which are
// rolled too (up to three deep). Pure, so it can be tested.

export function parseTable(text) {
  const rows = [];
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    let m = line.match(/^(\d{1,3})\s*[x×]\s+(.+)$/i);
    if (m) { rows.push({ text: m[2].trim(), weight: Math.max(1, Math.min(1000, +m[1])) }); continue; }
    m = line.match(/^(\d{1,3})\s*(?:[-–—]\s*(\d{1,3}))?\s*[:.)]\s*(.+)$/);
    if (m && !/^\d+\.\d/.test(line)) { const lo = +m[1], hi = m[2] ? +m[2] : lo; rows.push({ text: m[3].trim(), weight: Math.max(1, Math.abs(hi - lo) + 1) }); continue; }
    rows.push({ text: line.replace(/^[-*•]\s+/, ''), weight: 1 });
  }
  return rows;
}

export function rollRow(rows, rng) {
  const total = rows.reduce((t, r) => t + r.weight, 0);
  if (!total) return null;
  let n = rng.next() * total;
  for (const r of rows) { n -= r.weight; if (n < 0) return r; }
  return rows[rows.length - 1];
}

export function rollDice(expr, rng) {
  const m = String(expr).replace(/\s+/g, '').match(/^(\d{0,2})d(\d{1,3})([+-]\d{1,3})?$/i);
  if (!m) return null;
  const n = Math.max(1, Math.min(50, +(m[1] || 1))), sides = Math.max(1, +m[2]);
  let t = 0; for (let i = 0; i < n; i++) t += rng.range(1, sides);
  return t + (m[3] ? +m[3] : 0);
}

// Fill in dice, choices and nested tables. lookup(name) → the rows of another table, or null.
export function expand(text, rng, lookup = () => null, depth = 0) {
  let out = String(text).replace(/\{([^{}]+)\}/g, (all, inner) => {
    if (inner.includes('|')) { const opts = inner.split('|').map((x) => x.trim()); return opts[Math.floor(rng.next() * opts.length)]; }
    const d = rollDice(inner, rng);
    return d == null ? all : String(d);
  });
  if (depth < 3) {
    out = out.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (all, name) => {
      const rows = lookup(name.trim());
      if (!rows?.length) return all;
      const r = rollRow(rows, rng);
      return r ? expand(r.text, rng, lookup, depth + 1) : all;
    });
  }
  return out;
}

// One roll: { row, text } (row is the line picked; text has everything filled in).
export function rollTable(rows, rng, lookup) {
  const row = rollRow(rows, rng);
  return row ? { row, text: expand(row.text, rng, lookup) } : null;
}

// The chance of each line, for the table's page ("12%").
export const chances = (rows) => { const t = rows.reduce((s, r) => s + r.weight, 0); return rows.map((r) => (t ? r.weight / t : 0)); };
