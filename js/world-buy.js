// Buy from (and sell to) a shop: under a stocked shop's wares, members pick a character (players: their own; GMs:
// anyone in the party) and buy with that character's coin, or sell from their inventory at the shop's buy-back rate.
// The server checks the coin, the inventory and the shelf.
import { el, toast } from './dom.js';
import { api, isGm, isMember, previewing, session } from './api.js';
import { world, worldEntries, patchEntry, whenTime } from './world-store.js';
import { readTrade, tradeText, tradeTotals } from './shop-trade.js';
import { readAsks, dropAsk, shelfLine } from './shop-asks.js';
import { priceIndex } from './worth.js';
import { playOf, characterOf } from './sheet-ui.js';
import { loadAfter, lbs } from './weights.js';
import { coinText, GOODS, parseCoins } from './economy.js';
import { stockItems, sellTo, HAGGLES, readHaggle, haggleFor, setHaggle, withHaggle } from './purchase.js';
import { inventoryLines } from './handover.js';
import { readList, listFirst } from './shopping.js';
import { shopOpen, shutText, holidayTomorrow, evePrice, isFestive } from './shop-hours.js';
import { cleanCalendar } from './calendar.js';
import { ownerIn } from './world-routine.js';
import { shopStanding, sellWithStanding } from './standing-price.js';
import { dayFor } from './world-hours.js';

const ACTIVE = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);

// A shop's ledger: the party's recent trade here, newest first, with what they've spent and taken in.
export function tradeLedger(shop) {
  const list = readTrade(shop.fields?.trade);
  if (!list.length) return null;
  const t = tradeTotals(list);
  const newest = list.slice().reverse();
  return el('details', { class: 'shop-ledger' }, el('summary', {}, `The party’s trade here (${list.length})`),
    el('p', { class: 'small muted' }, [t.bought ? `Spent ${coinText(t.bought)}` : '', t.sold ? `took in ${coinText(t.sold)}` : ''].filter(Boolean).join(', ').replace(/^t/, 'T') + '.'),
    el('ul', { class: 'plain sheet-log' }, newest.slice(0, 12).map((x) => el('li', {}, el('span', {}, tradeText(x)), x.at ? el('span', { class: 'muted small' }, ` · ${whenTime(x.at)}`) : null))),
    list.length > 12 ? el('p', { class: 'small muted' }, `And ${list.length - 12} older.`) : null);
}

// Ask the shopkeeper: ask for something that isn't on the shelf (the GMs see it on the shop's page).
function askPart(shop, chars, rerender) {
  const who = chars.length > 1 ? el('select', { 'aria-label': 'Who’s asking' }, chars.map((c) => el('option', { value: c.id }, c.name))) : null;
  const what = el('input', { type: 'text', maxlength: 80, placeholder: 'e.g. a grappling hook', 'aria-label': 'What to ask for' });
  const go = el('button', { class: 'btn small', type: 'button', onclick: async () => {
    if (!what.value.trim()) { what.focus(); return; }
    go.disabled = true;
    try {
      const r = await api('entries', { method: 'PATCH', body: { ask_shop: { shop: shop.id, item: what.value, character: who ? who.value : chars[0]?.id } } });
      world.entries.set(r.entry.id, r.entry);
      toast(`Asked ${shop.name} for ${r.asked.item}`); rerender();
    } catch (err) { toast(err.message, 'bad'); go.disabled = false; }
  } }, 'Ask');
  return el('div', { class: 'controls trade-ask' }, el('span', { class: 'eyebrow' }, 'Not on the shelf?'), who, what, go);
}

// The GMs' side of the asks: put the thing on the shelf (at its list price, or one they choose) or let it go.
export function asksBox(shop, rerender) {
  if (!isGm() || previewing()) return null;
  const asks = readAsks(shop.fields?.asks);
  if (!asks.length) return null;
  const price = priceIndex(GOODS);
  return el('section', { class: 'card shop-asks' }, el('h3', {}, `Asked for here (${asks.length})`),
    el('ul', { class: 'plain' }, asks.slice().reverse().map((a) => {
      const p = price(a.item);
      const cost = el('input', { type: 'text', class: 'coin-amt', value: p ? coinText(p.cp) : '', placeholder: 'price', 'aria-label': `Price for ${a.item}` });
      const save = async (stock) => {
        const cur = world.entries.get(shop.id) || shop;
        try { await patchEntry(cur, { fields: { ...(stock ? { stock } : {}), asks: dropAsk(cur.fields?.asks, a.item) } }); toast(stock ? `${a.item} is on the shelf` : 'Let it go'); rerender(); }
        catch (err) { toast(err.message, 'bad'); }
      };
      return el('li', { class: 'controls' }, el('span', {}, el('strong', {}, a.item), el('span', { class: 'muted small' }, ` · ${a.by}`)), cost,
        el('button', { class: 'btn small', type: 'button', onclick: () => {
          const cp = parseCoins(cost.value);
          if (!cp) { toast('Give it a price, like “2 gp”'); cost.focus(); return; }
          const cur = world.entries.get(shop.id) || shop;
          save(`${String(cur.fields?.stock || '').replace(/\s+$/, '')}\n${shelfLine(a.item, cp, 1)}`);
        } }, 'Put it on the shelf'),
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => save(null) }, 'Dismiss'));
    })));
}

export function buyBox(shop, rerender) {
  if (!isMember() || previewing()) return null;
  const items = stockItems(shop.fields?.stock);
  const chars = worldEntries().filter((e) => ACTIVE(e) && (isGm() || e.owner_id === session.gm?.id)).sort((a, b) => a.name.localeCompare(b.name));
  if (!chars.length) return null;
  // Shut at night by the world's clock: players see a notice; GMs can still trade (and are told).
  // …and on the world's holidays (taverns stay open for those).
  const hours = shopOpen(shop, world.info?.clock?.minutes ?? 480, dayFor(shop));
  const shut = hours.open ? null : el('p', { class: 'shop-shut small' }, el('span', { 'aria-hidden': 'true' }, hours.holiday ? '🎉 ' : hours.night === false ? '🔒 ' : '🌙 '), `${shop.name} is ${shutText(hours)}. It opens ${hours.opens}.`, isGm() ? ' (GMs can still trade.)' : '');
  if (shut && !isGm()) return el('div', { class: 'trade' }, shut);
  // Who minds the shop: open, but the owner's routine has them elsewhere just now.
  const who = hours.open ? ownerIn(shop) : null;
  const minds = String(shop.fields?.minder || '').replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, '$1').trim();
  const minder = who && !who.here ? el('p', { class: 'shop-minder small muted' }, '🛎 ', who.owner.name, ` is out; ${minds || 'an apprentice'} minds the counter.`) : null;
  return el('div', { class: 'trade' }, shut, minder, items.length ? buyPart(shop, items, chars, rerender) : null, sellPart(shop, chars, rerender), askPart(shop, chars, rerender), isGm() && items.length ? hagglePart(shop, chars, rerender) : null);
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

function buyPart(shop, stock, chars, rerender) {
  // Holiday prices on the shelf: the day before a holiday, festive goods cost a quarter more.
  const eve = holidayTomorrow(cleanCalendar(world.info?.cal));
  // Friends get a discount (or enemies pay more): the party's open standing with whoever holds this place.
  const found = shopStanding(shop, worldEntries(), world.standings?.log);
  const stand = found && found.holder.visibility !== 'gm' && found.holder.status !== 'suggested' ? found : null;
  // What's on the buyer's shopping list comes first, starred.
  let items = stock;
  const item = el('select', { id: 'buy-item' });
  const order = () => {
    const c = world.entries.get(who.value);
    items = listFirst(stock, readList(playOf(c)));
    const keep = item.value;
    item.replaceChildren(...items.map((x) => el('option', { value: x.name }, `${x.wanted ? '★ ' : ''}${x.name} (${coinText(x.cp)})`)));
    if (items.some((x) => x.name === keep)) item.value = keep;
  };
  const qty = el('input', { type: 'number', id: 'buy-qty', min: 1, max: 100, value: 1, class: 'qty' });
  const who = el('select', { id: 'buy-who' }, chars.map((c) => el('option', { value: c.id }, c.name)));
  order();
  who.addEventListener('change', order);
  const total = el('p', { class: 'small', role: 'status' });
  const heavy = el('p', { class: 'small bad-line buy-heavy', hidden: true });
  const pick = () => items.find((x) => x.name === item.value);
  const show = () => {
    const it = pick(), n = Math.max(1, Number(qty.value) || 1), c = chars.find((x) => x.id === who.value), have = playOf(world.entries.get(c.id) || c).cp || 0;
    qty.max = it.qty > 0 ? it.qty : 100;
    const pct = haggleFor(shop.fields?.haggle, c.id), cost = withHaggle(withHaggle(evePrice(it.cp * n, it.name, eve), stand?.pct || 0), pct);
    total.textContent = `${n} × ${it.name} costs ${coinText(cost)}${pct ? ` (haggled: ${pct < 0 ? `${-pct}% off` : `${pct}% more`})` : ''}. ${c.name} has ${coinText(have)}.`;
    total.classList.toggle('bad-line', cost > have);
    // Too heavy to carry it: say so before they pay (for Forge characters, whose Strength is known).
    const ch = characterOf(world.entries.get(c.id) || c), l = loadAfter(playOf(world.entries.get(c.id) || c), it.name, n, cost, ch?.abilities?.scores?.Str, ch?.size);
    heavy.hidden = !(l.after.over && l.after.lb > l.before.lb);
    heavy.textContent = heavy.hidden ? '' : `That would put ${c.name} over their carrying capacity: ${lbs(l.after.lb)} of ${lbs(l.after.capacity)}.`;
  };
  for (const x of [item, qty, who]) x.addEventListener('input', show);
  show();
  const form = el('form', { class: 'buy-form' },
    el('div', { class: 'controls' },
      el('label', { class: 'sr-only', for: 'buy-item' }, 'What to buy'), item,
      el('label', { class: 'sr-only', for: 'buy-qty' }, 'How many'), qty,
      chars.length > 1 || isGm() ? [el('label', { for: 'buy-who' }, 'for'), who] : null,
      el('button', { class: 'btn small primary', type: 'submit' }, 'Buy')),
    total, heavy,
    eve && stock.some((x) => isFestive(x.name)) ? el('p', { class: 'small eve-prices' }, `🎉 ${eve} tomorrow: candles, drink and sweets cost a quarter more today.`) : null,
    stand?.pct ? el('p', { class: 'small standing-price' }, stand.pct < 0 ? `Friends of ${stand.holder.name}: 10% off here.` : `${stand.holder.name} holds this place, and the party is not welcome: 10% more.`) : null,
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
  const found = shopStanding(shop, worldEntries(), world.standings?.log);
  const stand = found && found.holder.visibility !== 'gm' && found.holder.status !== 'suggested' ? found : null;
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
    offer.textContent = r.error || `They’ll pay ${coinText(sellWithStanding(r.cp, stand?.pct || 0))}${stand?.pct ? (stand.pct < 0 ? ` (friends of ${stand.holder.name} get 10% more)` : ` (${stand.holder.name}’s people pay 10% less)`) : ''}.`;
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
