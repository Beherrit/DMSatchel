// Buy from a shop: under a stocked shop's wares, members pick an item and a character (players: their own; GMs:
// anyone in the party) and pay from that character's coin. The server checks the coin and the shelf.
import { el, toast } from './dom.js';
import { api, isGm, isMember, previewing, session } from './api.js';
import { world, worldEntries } from './world-store.js';
import { playOf } from './sheet-ui.js';
import { coinText } from './economy.js';
import { stockItems } from './purchase.js';

const ACTIVE = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);

export function buyBox(shop, rerender) {
  if (!isMember() || previewing()) return null;
  const items = stockItems(shop.fields?.stock);
  const chars = worldEntries().filter((e) => ACTIVE(e) && (isGm() || e.owner_id === session.gm?.id)).sort((a, b) => a.name.localeCompare(b.name));
  if (!items.length || !chars.length) return null;
  const item = el('select', { id: 'buy-item' }, items.map((x) => el('option', { value: x.name }, `${x.name} (${coinText(x.cp)})`)));
  const qty = el('input', { type: 'number', id: 'buy-qty', min: 1, max: 100, value: 1, class: 'qty' });
  const who = el('select', { id: 'buy-who' }, chars.map((c) => el('option', { value: c.id }, c.name)));
  const total = el('p', { class: 'small', role: 'status' });
  const pick = () => items.find((x) => x.name === item.value);
  const show = () => {
    const it = pick(), n = Math.max(1, Number(qty.value) || 1), c = chars.find((x) => x.id === who.value), have = playOf(world.entries.get(c.id) || c).cp || 0;
    qty.max = it.qty > 0 ? it.qty : 100;
    total.textContent = `${n} × ${it.name} costs ${coinText(it.cp * n)}. ${c.name} has ${coinText(have)}.`;
    total.classList.toggle('bad-line', it.cp * n > have);
  };
  for (const x of [item, qty, who]) x.addEventListener('input', show);
  show();
  const form = el('form', { class: 'buy-form' },
    el('div', { class: 'controls' },
      el('label', { class: 'sr-only', for: 'buy-item' }, 'What to buy'), item,
      el('label', { class: 'sr-only', for: 'buy-qty' }, 'How many'), qty,
      chars.length > 1 || isGm() ? [el('label', { for: 'buy-who' }, 'for'), who] : null,
      el('button', { class: 'btn small primary', type: 'submit' }, 'Buy')),
    total);
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const c = world.entries.get(who.value), base = playOf(c);
    try {
      const r = await api('entries', { method: 'PATCH', body: { buy: { shop: shop.id, character: c.id, item: item.value, qty: Number(qty.value) || 1, base: { cp: base.cp, inventory: base.inventory } } } });
      for (const e of r.entries) world.entries.set(e.id, e);
      toast(`${c.name} bought ${r.bought.qty > 1 ? `${r.bought.qty} × ` : ''}${r.bought.name} for ${coinText(r.bought.cp)}`);
      rerender();
    } catch (err) { toast(err.message, 'bad'); }
  });
  return el('details', { class: 'buy-box' }, el('summary', {}, 'Buy something'), form);
}
