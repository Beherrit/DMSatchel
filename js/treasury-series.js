// The treasury over time: the party's coin after each change in the loot log, oldest first, for a small line chart
// on the party page. Pure, so it can be tested.

// lines: loot-log lines ({ at, cp, note, item }) in any order → [{ at, cp (balance after), change, note }].
export function balanceSeries(lines) {
  let total = 0;
  return (lines || []).filter((l) => !l.deleted && Number(l.cp)).slice().sort((a, b) => String(a.at).localeCompare(String(b.at)))
    .map((l) => { total += Number(l.cp); return { at: l.at, cp: total, change: Number(l.cp), note: l.note || l.item || '' }; });
}

// Up to about four round gridline values from 0 (or the lowest point, if it dips below) to past the highest.
export function coinTicks(lo, hi) {
  const min = Math.min(0, lo), max = Math.max(hi, min + 1);
  const raw = (max - min) / 3, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const out = [];
  for (let v = Math.floor(min / step) * step; v < max + step; v += step) out.push(Math.round(v));
  return out;
}
