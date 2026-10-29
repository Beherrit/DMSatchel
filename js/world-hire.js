// Hirelings on the page: GMs hire an NPC for the party at a daily wage (or let them go), and the party page lists
// who's on the payroll. Wages are paid from the treasury when days pass (see world-living.js).
import { el, toast } from './dom.js';
import { isGm, previewing } from './api.js';
import { worldEntries, link, patchEntry } from './world-store.js';
import { coinText, parseCoins } from './economy.js';
import { WAGES, isHired, wageOf, payroll } from './hirelings.js';

export function hireLine(e, rerender) {
  if (e.kind !== 'npc' || !isGm() || previewing() || ['Dead', 'Missing'].includes(e.fields?.status)) return null;
  const save = async (fields, msg) => { try { await patchEntry(e, { fields }); toast(msg); rerender(); } catch (err) { toast(err.message, 'bad'); } };
  if (isHired(e)) {
    return el('p', { class: 'hire-line small' }, el('span', { 'aria-hidden': 'true' }, '🪙 '), `Travelling with the party for ${coinText(wageOf(e))} a day. `,
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => save({ hired: '', wage: '' }, `${e.name} is off the payroll`) }, 'Let go'));
  }
  const pick = el('select', { id: 'hire-rate' }, WAGES.map(([n, cp]) => el('option', { value: coinText(cp) }, `${n}: ${coinText(cp)} a day`)), el('option', { value: '' }, 'Another wage…'));
  const other = el('input', { type: 'text', id: 'hire-other', placeholder: 'e.g. 5 gp', hidden: true, 'aria-label': 'Daily wage' });
  pick.addEventListener('change', () => { other.hidden = Boolean(pick.value); if (!pick.value) other.focus(); });
  const form = el('form', { class: 'controls' }, el('label', { for: 'hire-rate' }, 'Wage'), pick, other, el('button', { class: 'btn small', type: 'submit' }, 'Hire'));
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const wage = pick.value || other.value.trim();
    if (!parseCoins(wage)) { other.hidden = false; other.focus(); return; }
    save({ hired: 'yes', wage: coinText(parseCoins(wage)) }, `${e.name} joins the party for ${coinText(parseCoins(wage))} a day`);
  });
  return el('details', { class: 'hire-line small' }, el('summary', {}, 'Hire for the party…'), form);
}

// On the party page: who's on the payroll, for everyone; the daily total for GMs.
export function payrollCard() {
  const p = payroll(worldEntries());
  if (!p.list.length) return null;
  return el('section', { class: 'card payroll' }, el('h3', {}, 'Hirelings'),
    el('ul', { class: 'plain entry-list' }, p.list.map(({ entry, wage }) => el('li', {}, link(entry), entry.fields?.role ? el('span', { class: 'muted small' }, entry.fields.role) : null, isGm() ? el('span', { class: 'muted small' }, `${coinText(wage)} a day`) : null))),
    isGm() ? el('p', { class: 'small' }, `Wages: ${coinText(p.perDay)} a day in all, paid from the treasury as days pass.`) : null);
}
