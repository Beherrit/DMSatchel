// Living costs (GMs): after days pass on the calendar (the calendar page, or travel on a map), offer to charge the
// party for living: a lifestyle (SRD 5.1, per day), paid by each character from their own coin, or by the treasury
// in one line of the loot log. Nobody's purse goes below nothing; the dialog says who came up short.
import { el, toast } from './dom.js';
import { api, isGm, previewing, session } from './api.js';
import { worldEntries } from './world-store.js';
import { playOf, addCoins } from './sheet-ui.js';
import { coinText } from './economy.js';
import { LIFESTYLES, livingCosts } from './lifestyle.js';

const ACTIVE = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);
const keyOf = () => `satchel-lifestyle-${session.worldKey || 'default'}`;
const remembered = () => { try { return localStorage.getItem(keyOf()) || 'Modest'; } catch { return 'Modest'; } };
const remember = (v) => { try { localStorage.setItem(keyOf(), v); } catch { /* private window */ } };

export async function offerLivingCosts(days) {
  if (!isGm() || previewing() || !(days > 0)) return;
  const chars = worldEntries().filter(ACTIVE).sort((a, b) => a.name.localeCompare(b.name)).map((e) => ({ id: e.id, name: e.name, cp: playOf(e).cp || 0, e }));
  if (!chars.length) return;
  let treasury = 0;
  try { treasury = (await api('party')).cp || 0; } catch { /* the treasury choice just shows 0 */ }
  const style = el('select', { id: 'lv-style' }, LIFESTYLES.map(([n, cp]) => { const o = el('option', { value: n }, `${n} (${cp ? `${coinText(cp)} a day` : 'free'})`); if (n === remembered()) o.selected = true; return o; }));
  const own = el('input', { type: 'radio', name: 'lv-who', id: 'lv-own', value: 'own', checked: true });
  const pot = el('input', { type: 'radio', name: 'lv-who', id: 'lv-pot', value: 'pot' });
  const preview = el('p', { class: 'small', role: 'status' });
  const plan = () => (pot.checked ? livingCosts(chars, days, style.value, treasury) : livingCosts(chars, days, style.value));
  const show = () => {
    const p = plan();
    preview.textContent = pot.checked
      ? `The treasury pays ${coinText(p.paid)} for ${chars.length} character${chars.length === 1 ? '' : 's'}${p.short ? `; it’s ${coinText(p.short)} short` : ''}.`
      : p.each.map((x) => `${x.name} ${coinText(x.paid)}${x.short ? ` (${coinText(x.short)} short)` : ''}`).join(', ') + '.';
  };
  for (const x of [style, own, pot]) x.addEventListener('change', show);
  show();
  const go = el('button', { class: 'btn primary', type: 'submit' }, 'Charge it');
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'lv-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'lv-title' }, `Living costs for ${days} day${days === 1 ? '' : 's'}?`),
    el('div', { class: 'field' }, el('label', { for: 'lv-style' }, 'How the party lives'), style),
    el('fieldset', { class: 'plain-fieldset' }, el('legend', {}, 'Who pays'),
      el('label', { class: 'check', for: 'lv-own' }, own, ' Each character, from their own coin'),
      el('label', { class: 'check', for: 'lv-pot' }, pot, ` The party treasury (${coinText(treasury)})`)),
    preview,
    el('div', { class: 'btnrow' }, go, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const p = plan(); remember(style.value);
    if (!(pot.checked ? p.paid : p.total)) { d.close(); toast('Nothing to pay'); return; }
    go.disabled = true;
    try {
      if (pot.checked) {
        await api('party', { method: 'POST', body: { cp: -p.paid, note: `Living costs: ${days} day${days === 1 ? '' : 's'}, ${style.value.toLowerCase()}, ${chars.length} character${chars.length === 1 ? '' : 's'}` } });
        toast(`The treasury paid ${coinText(p.paid)} in living costs${p.short ? ` (${coinText(p.short)} short)` : ''}`);
      } else {
        const failed = [];
        for (const x of p.each) if (x.paid) { try { await addCoins(chars.find((c) => c.id === x.id).e, -x.paid); } catch { failed.push(x.name); } }
        toast(failed.length ? `Charged, but these sheets didn’t update: ${failed.join(', ')}` : `Living costs paid: ${coinText(p.total)} in all`, failed.length ? 'bad' : undefined);
      }
      d.close();
      window.dispatchEvent(new Event('world:rerender'));
    } catch (err) { toast(err.message, 'bad'); go.disabled = false; }
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}

window.addEventListener('world:days', (ev) => offerLivingCosts(ev.detail?.days));
