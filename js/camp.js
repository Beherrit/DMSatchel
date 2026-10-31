// Make camp: a long rest anywhere, eight hours on the clock, and maybe trouble in the night. Pure, so it can be
// tested: rng from rng.js makeRng.

export const CAMP_MINUTES = 8 * 60;

// oneIn: 0 for no roll, else the chance is 1 in that. rows: the area's encounter table lines (may be empty).
// → { happens, row (the table line, if there's a table), roll (the die result), die }
export function nightRoll(rng, oneIn, rows = []) {
  if (!oneIn) return { happens: false, row: null, roll: null, die: 0 };
  const happens = rng.int(oneIn) === 0;
  if (!happens || !rows.length) return { happens, row: null, roll: null, die: rows.length };
  const i = rng.int(rows.length);
  return { happens, row: rows[i], roll: i + 1, die: rows.length };
}

// An encounter table's text ("1. Wolves\n2. …") → its lines.
export const tableRows = (text) => String(text || '').split('\n').map((l) => l.replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean);
