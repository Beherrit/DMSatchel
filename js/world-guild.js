// A guild's members on its page: the player characters connected to it (either way), and, when its dues name an
// amount and a period, what each owes this in-world month, with a GM button to take it from their purse.
import { el, toast } from './dom.js';
import { isGm } from './api.js';
import { getEntry, link, linkedTo, world, worldEntries } from './world-store.js';
import { session } from './api.js';
import { cleanCalendar } from './calendar.js';
import { changePlay, playOf } from './sheet-ui.js';
import { coinText } from './economy.js';
import { parseDues, duesLine, paidDues } from './guild-dues.js';

const ORGS = ['guild', 'faction', 'clan'];
export const memberCharacters = (org) => {
  const ids = new Set([...linkedTo(org.id, ['character']).map((x) => x.id), ...(org.links || []).map((l) => l.id)]);
  return [...ids].map(getEntry).filter((c) => c?.kind === 'character' && !['Dead'].includes(c.fields?.status)).sort((a, b) => a.name.localeCompare(b.name));
};

// Ranks: a member's rank from the label on the link between them ("journeyman of" → "Journeyman"); plain labels
// ("member", "member of", "part of") give none.
export function rankOf(org, c) {
  const l = (c.links || []).find((x) => x.id === org.id) || (org.links || []).find((x) => x.id === c.id);
  const t = String(l?.label || '').trim().replace(/\s+(of|in|at|for|to|with)$/i, '');
  return !t || /^(member|members|part|belongs|belongs to|joined)$/i.test(t) ? '' : t[0].toUpperCase() + t.slice(1);
}

// This in-world month, as dues are counted ("Thawmoon 1040"), or '' with no calendar.
export const duesMonth = () => { const cal = cleanCalendar(world.info?.cal); return cal ? `${cal.months[cal.month].name} ${cal.year}` : ''; };

// Dues still owed this month: [{ org, who, cp, month }] over the guilds this person can see (players: their own
// characters only).
export function duesOwed() {
  const month = duesMonth(); if (!month) return [];
  const out = [];
  for (const org of worldEntries().filter((x) => x.kind === 'guild')) {
    const d = parseDues(org.fields?.dues); if (!d) continue;
    for (const c of memberCharacters(org)) if ((isGm() || c.owner_id === session.gm?.id) && !paidDues(playOf(c).log, org.name, month)) out.push({ org, who: c, cp: d.monthly, month });
  }
  return out.sort((a, b) => a.who.name.localeCompare(b.who.name) || a.org.name.localeCompare(b.org.name));
}

// My guilds: the guilds, factions and clans a character is connected to, with their rank and this month's dues.
export function membershipsOf(c) {
  const ids = new Set([...(c.links || []).map((l) => l.id), ...worldEntries().filter((o) => ORGS.includes(o.kind) && (o.links || []).some((l) => l.id === c.id)).map((o) => o.id)]);
  const month = duesMonth();
  return [...ids].map(getEntry).filter((o) => o && ORGS.includes(o.kind)).sort((a, b) => a.name.localeCompare(b.name)).map((org) => {
    const d = org.kind === 'guild' ? parseDues(org.fields?.dues) : null;
    return { org, rank: rankOf(org, c), dues: d && month ? { cp: d.monthly, month, paid: paidDues(playOf(c).log, org.name, month) } : null };
  });
}

export function guildMembersCard(org, rerender) {
  if (!ORGS.includes(org.kind)) return null;
  const members = memberCharacters(org);
  if (!members.length) return null;
  const dues = org.kind === 'guild' ? parseDues(org.fields?.dues) : null, cal = cleanCalendar(world.info?.cal);
  const month = cal ? `${cal.months[cal.month].name} ${cal.year}` : '';
  return el('section', { class: 'card guild-members' }, el('h3', {}, `Members of the party (${members.length})`),
    dues && month ? el('p', { class: 'small muted' }, `Dues: ${coinText(dues.monthly)} a month${dues.per !== 'month' ? ` (${coinText(dues.cp)} a ${dues.per})` : ''}; this month is ${month}.`) : null,
    el('ul', { class: 'plain guild-member-list' }, members.map((c) => el('li', {}, link(c), rankOf(org, c) ? el('span', { class: 'small muted member-rank' }, ` (${rankOf(org, c)})`) : null, (() => {
      if (!dues || !month) return null;
      if (paidDues(playOf(c).log, org.name, month)) return el('span', { class: 'small muted dues-paid' }, ` · ✓ dues paid for ${month}`);
      return [el('span', { class: 'small dues-owed' }, ` · owes ${coinText(dues.monthly)} for ${month}`), isGm() ? ' ' : null, isGm() ? payButton(org, c, dues.monthly, month, rerender) : null];
    })()))));
}

// Pay the dues: the month's dues from the member's purse, logged ("Paid 5 gp dues to the Masons for Thawmoon 1040").
export function payButton(org, c, cp, month, rerender) {
  return el('button', { class: 'btn small ghost dues-pay', type: 'button', onclick: async () => {
    try {
      await changePlay(c, (p) => { if ((Number(p.cp) || 0) < cp) throw new Error(`${c.name} has only ${coinText(Number(p.cp) || 0)}; the dues are ${coinText(cp)}.`); p.cp -= cp; }, duesLine(org.name, month, coinText(cp)));
      toast(`${c.name} paid ${coinText(cp)} to ${org.name}`); rerender();
    } catch (err) { toast(err.message, 'bad'); }
  } }, 'Take the dues');
}
