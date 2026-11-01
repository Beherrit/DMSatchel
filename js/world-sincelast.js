// Since last session, for you: the top of a player's own character page says what changed for them since the last
// session was logged: coin up or down, items in and out, and the lines from the sheet's history behind it.
import { el } from './dom.js';
import { session } from './api.js';
import { worldEntries, link, whenTime } from './world-store.js';
import { lastSession } from './recap.js';
import { logSince, playJson } from './play-log.js';
import { coinText } from './economy.js';
import { worldCalendar } from './world-calendar.js';
import { comingUp, whenText } from './coming-up.js';

const list = (xs) => xs.map((x) => (x.qty > 1 ? `${x.qty} × ${x.name}` : x.name)).join(', ');

export function sinceLastCard(e) {
  if (e.kind !== 'character' || !session.gm || e.owner_id !== session.gm.id) return null;
  const last = lastSession(worldEntries());
  if (!last?.created_at) return null;
  const s = logSince(playJson(e), new Date(last.created_at).toISOString());
  if (!s.lines.length) return null;
  const facts = [
    s.cp ? el('li', {}, el('strong', {}, 'Coin: '), s.cp > 0 ? `+${coinText(s.cp)}` : coinText(s.cp)) : null,
    s.gained.length ? el('li', {}, el('strong', {}, 'In: '), list(s.gained)) : null,
    s.lost.length ? el('li', {}, el('strong', {}, 'Out: '), list(s.lost)) : null,
  ].filter(Boolean);
  const shown = s.lines.slice(0, 6);
  return el('section', { class: 'card since-last' },
    el('h3', {}, 'Since last session'),
    el('p', { class: 'muted small' }, 'What changed for ', e.name, ' since ', link(last), ' was logged.'),
    facts.length ? el('ul', { class: 'plain since-facts' }, facts) : null,
    el('ul', { class: 'plain sheet-log' }, shown.map((l) => el('li', {}, el('span', {}, l.text), el('span', { class: 'muted small' }, ` · ${l.by ? `${l.by}, ` : ''}${whenTime(l.at)}`)))),
    s.lines.length > shown.length ? el('p', { class: 'muted small' }, `And ${s.lines.length - shown.length} more in the sheet’s history.`) : null);
}

// Coming up for you: the next week of in-world days that matter to this character (owner only): their birthday, the
// deadlines of the quests linked to them (or the party's, when none are), festivals.
export function comingUpCard(e) {
  if (e.kind !== 'character' || !session.gm || e.owner_id !== session.gm.id) return null;
  const cal = worldCalendar();
  if (!cal) return null;
  const all = worldEntries().filter((x) => x.kind === 'quest');
  const mine = all.filter((q) => (q.links || []).some((l) => l.id === e.id) || (e.links || []).some((l) => l.id === q.id));
  const list = comingUp(cal, e, mine.length ? mine : all);
  if (!list.length) return null;
  return el('section', { class: 'card coming-up' }, el('h3', {}, 'Coming up'),
    el('ul', { class: 'plain sheet-log' }, list.map((x) => el('li', {}, `${x.icon} `, x.entry ? [x.text.replace(/:.*$/, ': '), link(x.entry)] : x.text, el('span', { class: 'muted small' }, ` · ${whenText(x.in)}`)))));
}
