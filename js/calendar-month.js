// A printable month: everything on the calendar this month, day by day, for the page printed under the grid. Pure.
import { toDays, holidaysOn, moonEvent } from './calendar.js';

// shown: { year, month }; dated: [{ entry, n, repeat }]; births: [{ entry, n, age }]; arrivals: [{ n, name }].
// → [{ day, n, things: [{ icon, text, entry? }] }] for the days with something on them, in order.
export function monthLines(cal, shown, { dated = [], births = [], arrivals = [] } = {}) {
  const first = toDays(cal, { ...shown, day: 1 }), out = [];
  for (let day = 1; day <= cal.months[shown.month].days; day++) {
    const d = { ...shown, day }, n = first + day - 1, things = [];
    for (const h of holidaysOn(cal, d)) things.push({ icon: '🎉', text: h.name });
    for (const m of cal.moons || []) { const ev = moonEvent(cal, m, d); if (ev) things.push({ icon: ev === 'full' ? '🌕' : '🌑', text: `${m.name}: ${ev} moon` }); }
    for (const b of births.filter((x) => x.n === n)) things.push({ icon: '🎂', text: b.age ? `${b.entry.name} turns ${b.age}` : `${b.entry.name}’s birthday`, entry: b.entry });
    for (const a of arrivals.filter((x) => x.n === n)) things.push({ icon: '⚑', text: `The party arrived in ${a.name}` });
    for (const x of dated.filter((y) => y.n === n)) {
      const k = x.entry.kind;
      things.push({ icon: k === 'session' ? '▶' : k === 'quest' ? '⏳' : x.repeat ? '↻' : '', text: k === 'session' ? `Played: ${x.entry.name}` : k === 'quest' ? `Deadline: ${x.entry.name}` : x.entry.name, entry: x.entry });
    }
    if (things.length) out.push({ day, n, things });
  }
  return out;
}
