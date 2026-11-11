// A guild's members on its page: the player characters connected to it (either way), and, when its dues name an
// amount and a period, what each owes this in-world month, with a GM button to take it from their purse.
import { el, toast } from './dom.js';
import { isGm } from './api.js';
import { getEntry, link, linkedTo, world } from './world-store.js';
import { cleanCalendar } from './calendar.js';
import { changePlay, playOf } from './sheet-ui.js';
import { coinText } from './economy.js';
import { parseDues, duesLine, paidDues } from './guild-dues.js';

const ORGS = ['guild', 'faction', 'clan'];
export const memberCharacters = (org) => {
  const ids = new Set([...linkedTo(org.id, ['character']).map((x) => x.id), ...(org.links || []).map((l) => l.id)]);
  return [...ids].map(getEntry).filter((c) => c?.kind === 'character' && !['Dead'].includes(c.fields?.status)).sort((a, b) => a.name.localeCompare(b.name));
};

export function guildMembersCard(org, rerender) {
  if (!ORGS.includes(org.kind)) return null;
  const members = memberCharacters(org);
  if (!members.length) return null;
  const dues = org.kind === 'guild' ? parseDues(org.fields?.dues) : null, cal = cleanCalendar(world.info?.cal);
  const month = cal ? `${cal.months[cal.month].name} ${cal.year}` : '';
  return el('section', { class: 'card guild-members' }, el('h3', {}, `Members of the party (${members.length})`),
    dues && month ? el('p', { class: 'small muted' }, `Dues: ${coinText(dues.monthly)} a month${dues.per !== 'month' ? ` (${coinText(dues.cp)} a ${dues.per})` : ''}; this month is ${month}.`) : null,
    el('ul', { class: 'plain guild-member-list' }, members.map((c) => el('li', {}, link(c), (() => {
      if (!dues || !month) return null;
      if (paidDues(playOf(c).log, org.name, month)) return el('span', { class: 'small muted dues-paid' }, ` · ✓ dues paid for ${month}`);
      return [el('span', { class: 'small dues-owed' }, ` · owes ${coinText(dues.monthly)} for ${month}`), isGm() ? ' ' : null, isGm() ? payButton(org, c, dues.monthly, month, rerender) : null];
    })()))));
}

// Pay the dues: the month's dues from the member's purse, logged ("Paid 5 gp dues to the Masons for Thawmoon 1040").
function payButton(org, c, cp, month, rerender) {
  return el('button', { class: 'btn small ghost dues-pay', type: 'button', onclick: async () => {
    try {
      await changePlay(c, (p) => { if ((Number(p.cp) || 0) < cp) throw new Error(`${c.name} has only ${coinText(Number(p.cp) || 0)}; the dues are ${coinText(cp)}.`); p.cp -= cp; }, duesLine(org.name, month, coinText(cp)));
      toast(`${c.name} paid ${coinText(cp)} to ${org.name}`); rerender();
    } catch (err) { toast(err.message, 'bad'); }
  } }, 'Take the dues');
}
