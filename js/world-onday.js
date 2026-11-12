// On the day: on a session's page, what happened on the day it was played: purchases made (by real date), riddles
// solved (by real date), and prophecy signs that came to pass (by its in-world date). Copyable as text.
import { el, copyText } from './dom.js';
import { worldEntries, link } from './world-store.js';
import { worldCalendar } from './world-calendar.js';
import { parseDate, toDays } from './calendar.js';
import { purchases } from './purchases.js';
import { readSolved } from './riddle.js';
import { readObjectives } from './objectives.js';
import { isProphecy } from './world-objectives.js';

const day = (iso) => String(iso || '').slice(0, 10);

export function onTheDay(s) {
  const real = String(s.fields?.played_on || '').trim().slice(0, 10), cal = worldCalendar();
  const sameWorldDay = (a, b) => { if (!cal || !a || !b) return false; try { const x = parseDate(cal, a), y = parseDate(cal, b); return !!x && !!y && toDays(cal, x) === toDays(cal, y); } catch { return false; } };
  const bought = /^\d{4}-\d\d-\d\d$/.test(real) ? purchases(worldEntries().filter((c) => c.kind === 'character')).filter((p) => day(p.at) === real) : [];
  const solved = /^\d{4}-\d\d-\d\d$/.test(real) ? worldEntries().filter((h) => h.kind === 'handout').map((h) => ({ h, by: readSolved(h.fields?.solved).filter((x) => day(x.at) === real).map((x) => x.name) })).filter((x) => x.by.length) : [];
  const signs = s.fields?.world_date ? worldEntries().filter(isProphecy).flatMap((p) => readObjectives(p).filter((o) => o.done && o.when && sameWorldDay(o.when, s.fields.world_date)).map((o) => ({ p, text: o.text }))) : [];
  return { bought, solved, signs };
}

const strip = (t) => String(t || '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a);
export const onTheDayText = (s, d) => [`On the day: ${s.name}`, ...d.signs.map((x) => `- A sign came to pass (${x.p.name}): ${strip(x.text)}`), ...d.solved.map((x) => `- ${x.by.join(', ')} solved “${x.h.name}”`), ...d.bought.map((p) => `- ${p.who.name}: ${p.text}`)].join('\n');

export function onTheDayCard(s) {
  if (s.kind !== 'session') return null;
  const d = onTheDay(s);
  if (!d.bought.length && !d.solved.length && !d.signs.length) return null;
  return el('section', { class: 'card on-the-day' }, el('div', { class: 'entry-head' }, el('h3', {}, 'On the day'),
    el('button', { class: 'btn small ghost onday-copy', type: 'button', onclick: () => copyText(onTheDayText(s, d)) }, 'Copy as text')),
    d.signs.length ? el('div', { class: 'onday-signs' }, el('h4', {}, '🔮 Signs that came to pass'), el('ul', { class: 'plain small' }, d.signs.map((x) => el('li', {}, link(x.p), `: ${strip(x.text)}`)))) : null,
    d.solved.length ? el('div', { class: 'onday-riddles' }, el('h4', {}, '🧩 Riddles solved'), el('ul', { class: 'plain small' }, d.solved.map((x) => el('li', {}, link(x.h), ` by ${x.by.join(', ')}`)))) : null,
    d.bought.length ? el('div', { class: 'onday-bought' }, el('h4', {}, `🛒 Bought (${d.bought.length})`), el('ul', { class: 'plain small' }, d.bought.slice(0, 20).map((p) => el('li', {}, link(p.who), `: ${p.text}`)))) : null);
}
