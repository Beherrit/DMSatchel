// Time between sessions: for each session (newest first), how long after the one before it was played (real dates,
// fields.played_on as YYYY-MM-DD) and how many in-world days passed (fields.world_date, read by the calendar). Pure.
import { parseDate, toDays } from './calendar.js';

const dayOf = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : null; };

// → Map(id → { real: days | null, world: days | null }), comparing each session with the next older one.
export function sessionGaps(list, cal) {
  const out = new Map();
  const wd = (s) => { if (!cal) return null; try { const d = parseDate(cal, s.fields?.world_date); return d ? toDays(cal, d) : null; } catch { return null; } };
  for (let i = 0; i < (list || []).length - 1; i++) {
    const s = list[i], prev = list[i + 1];
    const a = dayOf(s.fields?.played_on), b = dayOf(prev.fields?.played_on), x = wd(s), y = wd(prev);
    out.set(s.id, { real: a !== null && b !== null ? a - b : null, world: x !== null && y !== null ? x - y : null });
  }
  return out;
}

// "the same day", "the next day", "5 days later", "2 weeks later", "3 months later".
export function realGapText(days) {
  if (days === null || days === undefined || days < 0) return '';
  if (days === 0) return 'the same day';
  if (days === 1) return 'the next day';
  if (days < 14) return `${days} days later`;
  if (days < 60) return `${Math.round(days / 7)} weeks later`;
  return `${Math.round(days / 30)} months later`;
}

// Pace of play: the average days between sessions at the table, and in-world days per session (rounded; null when
// there's nothing to average).
export function pace(gaps) {
  const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const g = [...(gaps?.values?.() || [])];
  return { real: avg(g.map((x) => x.real).filter((x) => x !== null && x >= 0)), world: avg(g.map((x) => x.world).filter((x) => x !== null && x >= 0)) };
}
