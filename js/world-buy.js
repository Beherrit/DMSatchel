// Buy from (and sell to) a shop: under a stocked shop's wares, members pick a character (players: their own; GMs:
// anyone in the party) and buy with that character's coin, or sell from their inventory at the shop's buy-back rate.
// The server checks the coin, the inventory and the shelf.
import { el, toast } from './dom.js';
import { api, isGm, isMember, previewing, session } from './api.js';
import { world, worldEntries, patchEntry } from './world-store.js';
import { playOf } from './sheet-ui.js';
import { coinText, GOODS } from './economy.js';
import { stockItems, sellTo, HAGGLES, readHaggle, haggleFor, setHaggle, withHaggle } from './purchase.js';
import { inventoryLines } from './handover.js';

const ACTIVE = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);

export function buyBox(shop, rerender) {
  if (!isMember() || previewing()) return null;
  const items = stockItems(shop.fields?.stock);
  const chars = worldEntries().filter((e) => ACTIVE(e) && (isGm() || e.owner_id === session.gm?.id)).sort((a, b) => a.name.localeCompare(b.name));
  if (!chars.length) return null;
  return el('div', { class: 'trade' }, items.length ? buyPart(shop, items, chars, rerender) : null, sellPart(shop, chars, rerender), isGm() && items.length ? hagglePart(shop, chars, rerender) : null);
}

const dc = (shop) => Number((String(shop.fields?.stock || '').match(/Haggle DC (\d+)/) || [])[1]) || 0;

// GMs: grant the result of a haggle at the table, for one character's next purchase here.
function hagglePart(shop, chars, rerender) {
  const who = el('select', { id: 'hg-who' }, chars.map((c) => el('option', { value: c.id }, c.name)));
  const res = el('select', { id: 'hg-res' }, HAGGLES.map(([p, label]) => el('option', { value: p }, label)));
  const save = async (charId, pct, msg) => {
    try { const cur = world.entries.get(shop.id) || shop; await patchEntry(cur, { fields: { haggle: setHaggle(cur.fields?.haggle, charId, pct) } }); toast(msg); rerender(); } catch (err) { toast(err.message, 'bad'); }
  };
  const granted = Object.entries(readHaggle(shop.fields?.haggle)).map(([id, pct]) => [world.entries.get(id), pct]).filter(([c]) => c);
  const form = el('form', { class: 'controls' }, el('label', { for: 'hg-who' }, 'Who'), who, el('label', { class: 'sr-only', for: 'hg-res' }, 'Result'), res, el('button', { class: 'btn small', type: 'submit' }, 'Grant'));
  form.addEventListener('submit', (ev) => { ev.preventDefault(); const c = world.entries.get(who.value); save(c.id, Number(res.value), `${c.name}’s next purchase here: ${HAGGLES.find(([p]) => p === Number(res.value))[1].split(':')[0]}`); });
  return el('details', { class: 'buy-box' }, el('summary', {}, `Haggle result${dc(shop) ? ` (DC ${dc(shop)})` : ''}`),
    form,
    granted.length ? el('ul', { class: 'plain small' }, granted.map(([c, pct]) => el('li', {}, `${c.name}: ${pct < 0 ? `${-pct}% off` : `${pct}% more`} on the next purchase `,
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => save(c.id, 0, 'Haggle result taken back') }, 'Take back')))) : null);
}

function buyPart(shop, items, chars, rerender) {
  const item = el('select', { id: 'buy-item' }, items.map((x) => el('option', { value: x.name }, `${x.name} (${coinText(x.cp)})`)));
  const qty = el('input', { type: 'number', id: 'buy-qty', min: 1, max: 100, value: 1, class: 'qty' });
  const who = el('select', { id: 'buy-who' }, chars.map((c) => el('option', { value: c.id }, c.name)));
  const total = el('p', { class: 'small', role: 'status' });
  const pick = () => items.find((x) => x.name === item.value);
  const show = () => {
    const it = pick(), n = Math.max(1, Number(qty.value) || 1), c = chars.find((x) => x.id === who.value), have = playOf(world.entries.get(c.id) || c).cp || 0;
    qty.max = it.qty > 0 ? it.qty : 100;
    const pct = haggleFor(shop.fields?.haggle, c.id), cost = withHaggle(it.cp * n, pct);
    total.textContent = `${n} × ${it.name} costs ${coinText(cost)}${pct ? ` (haggled: ${pct < 0 ? `${-pct}% off` : `${pct}% more`})` : ''}. ${c.name} has ${coinText(have)}.`;
    total.classList.toggle('bad-line', cost > have);
  };
  for (const x of [item, qty, who]) x.addEventListener('input', show);
  show();
  const form = el('form', { class: 'buy-form' },
    el('div', { class: 'controls' },
      el('label', { class: 'sr-only', for: 'buy-item' }, 'What to buy'), item,
      el('label', { class: 'sr-only', for: 'buy-qty' }, 'How many'), qty,
      chars.length > 1 || isGm() ? [el('label', { for: 'buy-who' }, 'for'), who] : null,
      el('button', { class: 'btn small primary', type: 'submit' }, 'Buy')),
    total,
    dc(shop) ? el('p', { class: 'muted small' }, `Haggle DC ${dc(shop)}: roll for it at the table, and a GM can grant the result for your next purchase here.`) : null);
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const c = world.entries.get(who.value), base = playOf(c);
    try {
      const r = await api('entries', { method: 'PATCH', body: { buy: { shop: shop.id, character: c.id, item: item.value, qty: Number(qty.value) || 1, base: { cp: base.cp, inventory: base.inventory } } } });
      for (const e of r.entries) world.entries.set(e.id, e);
      toast(`${c.name} bought ${r.bought.qty > 1 ? `${r.bought.qty} × ` : ''}${r.bought.name} for ${coinText(r.bought.cp)}${r.bought.haggle ? ' (haggled)' : ''}`);
      rerender();
    } catch (err) { toast(err.message, 'bad'); }
  });
  return el('details', { class: 'buy-box' }, el('summary', {}, 'Buy something'), form);
}

function sellPart(shop, chars, rerender) {
  const who = el('select', { id: 'sell-who' }, chars.map((c) => el('option', { value: c.id }, c.name)));
  const item = el('select', { id: 'sell-item' });
  const qty = el('input', { type: 'number', id: 'sell-qty', min: 1, max: 100, value: 1, class: 'qty' });
  const offer = el('p', { class: 'small', role: 'status' });
  const go = el('button', { class: 'btn small primary', type: 'submit' }, 'Sell');
  const things = () => inventoryLines(playOf(world.entries.get(who.value)).inventory);
  const fill = () => { const list = things(); item.replaceChildren(...list.map((x) => el('option', { value: x.name }, x.qty > 1 ? `${x.name} (${x.qty})` : x.name))); show(); };
  const show = () => {
    const it = things().find((x) => x.name === item.value);
    if (!it) { offer.textContent = 'Nothing to sell.'; go.disabled = true; return; }
    qty.max = it.qty;
    const r = sellTo(shop.fields?.stock, it.name, Math.min(it.qty, Math.max(1, Number(qty.value) || 1)), GOODS);
    go.disabled = Boolean(r.error);
    offer.textContent = r.error || `They’ll pay ${coinText(r.cp)}.`;
  };
  who.addEventListener('change', fill); item.addEventListener('change', show); qty.addEventListener('input', show);
  fill();
  const form = el('form', { class: 'buy-form' },
    el('div', { class: 'controls' },
      chars.length > 1 || isGm() ? [el('label', { for: 'sell-who' }, 'Who'), who] : null,
      el('label', { class: 'sr-only', for: 'sell-item' }, 'What to sell'), item,
      el('label', { class: 'sr-only', for: 'sell-qty' }, 'How many'), qty, go),
    offer);
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const c = world.entries.get(who.value), base = playOf(c);
    try {
      const r = await api('entries', { method: 'PATCH', body: { sell: { shop: shop.id, character: c.id, item: item.value, qty: Number(qty.value) || 1, base: { cp: base.cp, inventory: base.inventory } } } });
      for (const e of r.entries) world.entries.set(e.id, e);
      toast(`${c.name} sold ${r.sold.qty > 1 ? `${r.sold.qty} × ` : ''}${r.sold.name} for ${coinText(r.sold.cp)}`);
      rerender();
    } catch (err) { toast(err.message, 'bad'); }
  });
  return el('details', { class: 'buy-box' }, el('summary', {}, 'Sell something'), form);
}
