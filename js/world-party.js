// The party page: who's in the party, the shared treasury and loot log, current quests, handouts and the journal.
// Route: #world/party
import { el, toast, confirmButton, setKids, copyText } from './dom.js';
import { api, isGm, isMember, session } from './api.js';
import { world, worldEntries, getEntry, byName, link, when, richText, setEntryState, patchEntry, mentions } from './world-store.js';
import { appearances, sceneOf, sessionOrder } from './appearances.js';
import { namedIn, journalsAbout } from './session-named.js';
import { PLACE_KINDS } from './world-schema.js';
import { thumb } from './image-ui.js';
import { lastShownLine } from './world-show.js';
import { addCoins, playOf, changePlay } from './sheet-ui.js';
import { readHandOut, handOutTotal } from './hand-out.js';
import { partyRows, partyWealth, sortRows } from './party-glance.js';
import { sellLoot } from './purchase.js';
import { addTrade } from './shop-trade.js';
import { partyDebts } from './debts.js';
import { readTab, tabTotal } from './tab.js';
import { openBounties } from './bounty.js';
import { dayOf } from './routine.js';
import { giftCounts } from './gifts.js';
import { owedTo } from './hirelings.js';
import { shopStanding, sellWithStanding } from './standing-price.js';
import { giveItem, tidyInventory } from './handover.js';
import { progressBadge } from './world-objectives.js';
import { advancementSection } from './world-attendance.js';
import { partyBondsSection } from './world-bonds.js';
import { splitCoins } from './economy.js';
import { coinChart } from './world-coinchart.js';
import { payrollCard } from './world-hire.js';
import { whoHas } from './who-has.js';
import { campButton } from './world-camp.js';

const ACTIVE = (e) => !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);

// Coin text and parsing live in economy.js (pure, so recaps and tests can use them too).
export { coinText, parseCoins } from './economy.js';
import { coinText, parseCoins, GOODS } from './economy.js';
import { tableCard } from './world-profiles.js';
import { journeySection } from './world-journey.js';
import { wishedBy, partyWishes } from './world-wishes.js';
import { itemsNamed } from './play-cards.js';
import { sceneFor } from './world-scene.js';
import { openNowLine, partyTown, weekInTownBox, todaysStalls } from './world-routine.js';
import { nextMarket, inDaysText } from './week-in-town.js';
import { purchases, shoppingText } from './purchases.js';
import { cleanCalendar, withLocal } from './calendar.js';

// GMs: every active character in one table: hit points (flagged in words when low or down), coin, days of rations,
// exhaustion and conditions.
function glanceTable(active) {
  if (!active.length) return null;
  const rows = partyRows(active.map((c) => ({ id: c.id, name: c.name, play: playOf(c) })));
  // Who has the most coin: each column header sorts the table (again to reverse it).
  const COLS = [['name', 'Character'], ['hp', 'Hit points'], ['cp', 'Coin'], ['rations', 'Rations'], ['exhaustion', 'Exhaustion'], ['conditions', 'Conditions']];
  let key = 'name', dir = 1;
  const head = el('tr'), body = el('tbody');
  const draw = () => {
    setKids(head, COLS.map(([k, label]) => el('th', { scope: 'col', 'aria-sort': k === key ? (dir > 0 ? 'ascending' : 'descending') : 'none' },
      el('button', { class: 'sort-btn', type: 'button', onclick: () => { if (key === k) dir = -dir; else { key = k; dir = ['cp', 'rations', 'exhaustion', 'conditions'].includes(k) ? -1 : 1; } draw(); } }, label, k === key ? (dir > 0 ? ' ▲' : ' ▼') : ''))));
    setKids(body, sortRows(rows, key, dir).map((r) => el('tr', {},
      el('th', { scope: 'row' }, link(getEntry(r.id) || { id: r.id, name: r.name })),
      el('td', { class: `num${r.low || r.down ? ' hp-bad' : ''}` }, r.max ? `${r.hp} / ${r.max}` : '—', r.down ? ' (down)' : r.low ? ' (low)' : ''),
      el('td', { class: 'num' }, coinText(r.cp)),
      el('td', { class: `num${r.rations ? '' : ' muted'}` }, r.rations ? `${r.rations} day${r.rations === 1 ? '' : 's'}` : 'none'),
      el('td', { class: 'num' }, r.exhaustion ? String(r.exhaustion) : '—'),
      el('td', {}, r.conditions.length ? r.conditions.join(', ') : '—'))));
  };
  draw();
  // A tidy for the party: merge duplicate inventory lines on every sheet that has some, in one go.
  const messy = active.filter((c) => tidyInventory(playOf(c).inventory).merged);
  const tidyAll = messy.length ? el('button', { class: 'btn small ghost', type: 'button', onclick: async () => {
    tidyAll.disabled = true; let lines = 0; const failed = [];
    for (const c of messy) { try { await changePlay(world.entries.get(c.id) || c, (play) => { const t = tidyInventory(play.inventory); lines += t.merged; play.inventory = t.text; }); } catch { failed.push(c.name); } }
    toast([`Tidied ${messy.length - failed.length} pack${messy.length - failed.length === 1 ? '' : 's'} (${lines} line${lines === 1 ? '' : 's'} merged)`, failed.length ? `not ${failed.join(', ')}` : ''].filter(Boolean).join(' · '), failed.length ? 'bad' : undefined);
    window.dispatchEvent(new Event('world:rerender'));
  } }, `Tidy ${messy.length === 1 ? `${messy[0].name}’s pack` : `${messy.length} packs`}`) : null;
  return el('section', { class: 'card party-glance' }, el('div', { class: 'entry-head' }, el('h3', {}, 'The party at a glance'), el('div', { class: 'btnrow' }, tidyAll, el('a', { class: 'btn small', href: '#world/screen' }, 'Party sheet for the screen'))),
    el('div', { class: 'table-wrap' }, el('table', { class: 'glance-table' }, el('thead', {}, head), body)),
    // Who's owed wages, at a glance: hirelings the treasury couldn't pay in full.
    (() => { const owed = worldEntries().filter((e) => e.kind === 'npc' && owedTo(e)); return owed.length ? el('p', { class: 'small bad-line glance-owed' }, 'Owed wages: ', owed.map((e, i) => [i ? ', ' : '', link(e), ` ${coinText(owedTo(e))}`])) : null; })());
}

function members(chars) {
  const active = chars.filter(ACTIVE), former = chars.filter((e) => !ACTIVE(e));
  const card = (e) => el('li', { class: 'person card' },
    el('div', { class: 'person-head' }, thumb(e, 'avatar'), link(e)),
    el('span', { class: 'muted small' }, [e.fields?.species, e.fields?.class, e.fields?.level && `level ${e.fields.level}`].filter(Boolean).join(' · ') || 'Adventurer'),
    e.fields?.player || e.owner ? el('span', { class: 'small' }, `Played by ${e.fields?.player || e.owner}`) : null,
    e.summary ? el('p', { class: 'small' }, e.summary) : null);
  return el('section', { class: 'party-members' },
    el('div', { class: 'entry-head' }, el('h3', { class: 'section-title' }, `The party (${active.length})`),
      isMember() ? el('a', { class: 'btn small', href: '#world/new/character' }, '+ Character') : null),
    active.length ? el('ul', { class: 'people-grid' }, active.map(card))
      : el('p', { class: 'muted' }, 'No characters yet. Players add their own from “+ My character”, or roll one in the Character Forge.'),
    former.length ? el('details', { class: 'former' }, el('summary', {}, `Former members (${former.length})`),
      el('ul', { class: 'entry-list' }, former.map((e) => el('li', {}, link(e), el('span', { class: 'kind-tag' }, e.fields.status)))),
      el('p', { class: 'small' }, el('a', { href: '#world/hall' }, 'Hall of heroes'), ': how their stories ended')) : null);
}

function treasury(state, chars, reload) {
  const active = chars.filter(ACTIVE);
  const box = el('section', { class: 'card treasury' }, el('h3', {}, 'Treasury'));
  if (state.error) { box.append(el('p', { class: 'error' }, state.error)); return box; }
  const { cp = 0, items = [], lines = [] } = state.data || {};
  const share = active.length > 1 && cp > 0 ? Math.floor(cp / active.length) : 0;
  box.append(
    el('div', { class: 'coin-total' }, el('span', { class: 'eyebrow' }, 'Coin'), el('strong', {}, coinText(cp)),
      share ? el('span', { class: 'muted small' }, `${coinText(share)} each if split ${active.length} ways`) : null),
    ((w) => (w.purses ? el('p', { class: 'small party-worth' }, el('strong', {}, `The party’s worth: ${coinText(w.total)}`), el('span', { class: 'muted' }, ` (the treasury ${coinText(w.treasury)}, purses ${coinText(w.purses)})`)) : null))(partyWealth(cp, active.map((c) => ({ cp: playOf(c).cp })))),
    coinChart(lines),
    items.length ? el('div', {}, el('span', { class: 'eyebrow' }, 'Items held'),
      el('ul', { class: 'plain item-held' }, items.map((i) => el('li', {}, i.qty > 1 ? `${i.qty} × ` : '', el('strong', {}, i.item), i.holder ? el('span', { class: 'muted small' }, ` (${i.holder})`) : null, wishedBy(i.item, active)))),
      itemsNamed(worldEntries(), items.map((i) => i.item)).length ? el('a', { class: 'small', href: '#world/itemcards/held' }, 'Print cards for these items') : null)
      : el('p', { class: 'muted small' }, 'No items in the shared stash.'));
  box.append(whoHasBox(chars, items));
  if (isGm() && active.length && cp > 0) box.append(splitForm(cp, active, reload));
  if (isGm() && active.length) box.append(handOutForm(active, reload));
  if (isGm() && items.some((i) => i.qty > 0)) box.append(sellLootForm(items.filter((i) => i.qty > 0), reload));
  if (isGm() && active.length && items.some((i) => i.qty > 0)) box.append(divideLootForm(items.filter((i) => i.qty > 0), active, reload));
  if (isMember()) box.append(ledgerForm(chars, reload));
  box.append(el('details', { class: 'ledger', open: lines.length && lines.length <= 8 ? true : null }, el('summary', {}, `Loot log (${lines.length})`),
    lines.length ? el('ul', { class: 'plain ledger-lines' }, lines.slice(0, 200).map((l) => el('li', {},
      el('span', { class: `amt ${l.cp < 0 || l.qty < 0 ? 'out' : 'in'}` }, [l.cp ? `${l.cp > 0 ? '+' : ''}${coinText(l.cp)}` : '', l.item ? `${l.qty > 0 ? '+' : '−'}${Math.abs(l.qty)} ${l.item}` : ''].filter(Boolean).join(', ')),
      l.note ? el('span', {}, ` ${l.note}`) : null, l.holder ? el('span', { class: 'muted small' }, ` → ${l.holder}`) : null,
      el('span', { class: 'muted small' }, ` · ${l.by || 'someone'}, ${when(l.at)}`),
      isGm() || l.gm_id === session.gm?.id ? confirmButton('Strike', async () => { try { await api('party', { method: 'DELETE', query: { id: l.id } }); reload(); } catch (err) { toast(err.message, 'bad'); } }, 'btn small ghost') : null)))
      : el('p', { class: 'muted small' }, 'Nothing recorded yet.')));
  // A tab on the party page: what the party is running up at taverns.
  const tabs = worldEntries().filter((e) => e.kind === 'location' && e.fields?.tab).map((e) => ({ e, list: readTab(e.fields.tab) })).filter((x) => x.list.length);
  if (tabs.length) box.append(el('p', { class: 'small party-tabs' }, el('strong', {}, 'Tabs: '), tabs.map((t, i) => [i ? ', ' : '', link(t.e), ` ${coinText(tabTotal(t.list))}`])));
  return box;
}

// Who has it?: search every character's inventory and the treasury's items at once.
function whoHasBox(chars, items) {
  const input = el('input', { type: 'search', id: 'who-has', placeholder: 'e.g. rope, healing', autocomplete: 'off' });
  const out = el('div', { class: 'who-has-out', role: 'status' });
  const show = () => {
    const q = input.value.trim();
    const hits = whoHas(q, chars.map((c) => ({ id: c.id, name: c.name, inventory: playOf(c).inventory })), items);
    setKids(out, !q ? null : hits.length ? el('ul', { class: 'plain who-has-list' }, hits.map((h) => el('li', {}, el('strong', {}, h.qty > 1 ? `${h.qty} × ${h.item}` : h.item), ' · ', h.id ? link(getEntry(h.id) || { id: h.id, name: h.who }) : h.who)))
      : el('p', { class: 'muted small' }, `Nobody is carrying anything called “${q}”.`));
  };
  input.addEventListener('input', show);
  return el('div', { class: 'who-has' }, el('label', { for: 'who-has', class: 'eyebrow' }, 'Who has it?'), input, out, el('p', { class: 'small' }, el('a', { href: '#world/kit' }, 'Everything the party carries')));
}

// GMs: sell the treasury's loot to a stocked shop at its buy-back rate: the coin comes into the treasury and the
// items go onto the shop's shelf. Things the shop can't price stay in the treasury.
// Divide the loot (GMs): give the treasury's items out in one go, choosing who gets each and how many. Each goes
// through the stash route, so the ledger says "Given to …" and the sheet's history notes it.
function divideLootForm(items, active, reload) {
  const rows = items.map((i, n) => ({ i,
    who: el('select', { id: `dv-${n}`, 'aria-label': `Who gets ${i.item}` }, el('option', { value: '' }, 'Keep it'), active.map((c) => el('option', { value: c.id }, c.name))),
    qty: el('input', { type: 'number', min: 1, max: i.qty, value: i.qty, class: 'qty', 'aria-label': `How many ${i.item}` }) }));
  const go = el('button', { class: 'btn small primary', type: 'submit' }, 'Give them out');
  const form = el('form', { class: 'hand-out' },
    el('ul', { class: 'plain' }, rows.map((r, n) => el('li', { class: 'controls' }, el('label', { for: `dv-${n}` }, `${r.i.item}${r.i.holder ? ` (with ${r.i.holder})` : ''}`), r.who, r.qty, el('span', { class: 'muted small' }, `of ${r.i.qty}`)))),
    el('div', { class: 'btnrow' }, go));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const picks = rows.filter((r) => r.who.value);
    if (!picks.length) { toast('Choose who gets something'); return; }
    go.disabled = true;
    const done = [], failed = [];
    for (const r of picks) {
      const c = world.entries.get(r.who.value), qty = Math.min(r.i.qty, Math.max(1, Number(r.qty.value) || 1)), base = playOf(c);
      try {
        const x = await api('entries', { method: 'PATCH', body: { stash: { id: c.id, dir: 'out', item: r.i.item, qty, given: true, base: { cp: base.cp, inventory: base.inventory } } } });
        world.entries.set(x.entry.id, x.entry); done.push(`${qty > 1 ? `${qty} × ` : ''}${r.i.item} to ${c.name}`);
      } catch (err) { failed.push(`${r.i.item} (${err.message})`); }
    }
    toast([done.length ? `Given out: ${done.join(', ')}` : '', failed.length ? `not given: ${failed.join(', ')}` : ''].filter(Boolean).join(' · '), failed.length ? 'bad' : undefined);
    reload();
  });
  return el('details', { class: 'split-loot divide-loot' }, el('summary', {}, 'Divide the loot'), form);
}

function sellLootForm(items, reload) {
  const shops = worldEntries().filter((e) => e.kind === 'location' && e.fields?.stock).sort((a, b) => a.name.localeCompare(b.name));
  if (!shops.length) return el('p', { class: 'muted small' }, 'Stock a shop to sell the loot to it.');
  const shop = el('select', { id: 'sl-shop' }, shops.map((s) => el('option', { value: s.id }, s.name)));
  const picks = items.map((i, n) => ({ i, cb: el('input', { type: 'checkbox', id: `sl-${n}` }), qty: el('input', { type: 'number', min: 1, max: i.qty, value: i.qty, class: 'qty', 'aria-label': `How many ${i.item}` }) }));
  const offer = el('p', { class: 'small', role: 'status' });
  const go = el('button', { class: 'btn small primary', type: 'submit' }, 'Sell');
  const plan = () => {
    const s = world.entries.get(shop.value);
    const r = sellLoot(s.fields.stock, picks.filter((p) => p.cb.checked).map((p) => ({ item: p.i.item, qty: Math.min(p.i.qty, Math.max(1, Number(p.qty.value) || 1)) })), GOODS);
    // Friends buy dear: the party's standing with whoever holds the shop's place (only powers players know of).
    const found = shopStanding(s, worldEntries(), world.standings?.log);
    const pct = found && found.holder.visibility !== 'gm' ? found.pct : 0;
    if (pct) r.sold = r.sold.map((x) => ({ ...x, cp: sellWithStanding(x.cp, pct) }));
    return { s, r };
  };
  const show = () => {
    const { r } = plan();
    const paid = r.sold.reduce((t, x) => t + x.cp, 0);
    offer.textContent = !r.sold.length && !r.skipped.length ? 'Tick what to sell.' : [paid ? `They’ll pay ${coinText(paid)}.` : '', r.skipped.length ? `They won’t buy ${r.skipped.map((x) => x.item).join(', ')} (can’t price it).` : ''].filter(Boolean).join(' ');
    go.disabled = !r.sold.length;
  };
  for (const x of [shop, ...picks.flatMap((p) => [p.cb, p.qty])]) x.addEventListener('input', show);
  show();
  const form = el('form', { class: 'hand-out' },
    el('div', { class: 'controls' }, el('label', { for: 'sl-shop' }, 'To'), shop),
    el('ul', { class: 'plain' }, picks.map((p, n) => el('li', { class: 'controls' }, el('label', { class: 'check', for: `sl-${n}` }, p.cb, ` ${p.i.item}`), p.qty, el('span', { class: 'muted small' }, `of ${p.i.qty}`)))),
    offer, el('div', { class: 'btnrow' }, go));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const { s, r } = plan();
    if (!r.sold.length) return;
    go.disabled = true;
    try {
      const trade = r.sold.reduce((j, x) => addTrade(j, { who: '', dir: 'sell', item: x.item, qty: x.qty, cp: x.cp }), s.fields.trade || '');
      await patchEntry(s, { fields: { stock: r.text, trade } }); // the shelf first: if someone else changed the shop, nothing is sold
      for (const x of r.sold) await api('party', { method: 'POST', body: { cp: x.cp, item: x.item, qty: -x.qty, note: `Sold to ${s.name}` } });
      toast(`Sold to ${s.name} for ${coinText(r.sold.reduce((t, x) => t + x.cp, 0))}`);
      reload();
    } catch (err) { toast(err.message, 'bad'); go.disabled = false; }
  });
  return el('details', { class: 'split-loot' }, el('summary', {}, 'Sell the loot'), form);
}

// GMs: the same item and/or coin to each of several characters ("a potion of healing each"), from nowhere or from the
// treasury (one loot-log line takes it out).
function handOutForm(active, reload) {
  const item = el('input', { type: 'text', id: 'ho-item', placeholder: 'e.g. Potion of healing', maxlength: 200 });
  const qty = el('input', { type: 'number', id: 'ho-qty', min: 1, max: 100, value: 1, class: 'qty' });
  const coin = el('input', { type: 'text', id: 'ho-coin', placeholder: 'e.g. 10 gp', class: 'num-in' });
  const pot = el('input', { type: 'checkbox', id: 'ho-pot' });
  const who = active.map((c) => ({ c, cb: el('input', { type: 'checkbox', id: `ho-${c.id}`, checked: true }) }));
  const go = el('button', { class: 'btn small primary', type: 'submit' }, 'Hand it out');
  const form = el('form', { class: 'hand-out' },
    el('div', { class: 'controls' }, el('label', { for: 'ho-item' }, 'Item'), item, el('label', { for: 'ho-qty' }, 'each'), qty),
    el('div', { class: 'controls' }, el('label', { for: 'ho-coin' }, 'Coin each'), coin),
    el('fieldset', { class: 'plain-fieldset' }, el('legend', { class: 'small' }, 'To'), who.map(({ c, cb }) => el('label', { class: 'check', for: `ho-${c.id}` }, cb, ` ${c.name}`))),
    el('label', { class: 'check', for: 'ho-pot' }, pot, ' Take it out of the treasury'),
    el('div', { class: 'btnrow' }, go));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const h = readHandOut({ item: item.value, qty: qty.value, coin: coin.value });
    if (h.error) { toast(h.error, 'bad'); item.focus(); return; }
    const to = who.filter((w) => w.cb.checked).map((w) => w.c);
    if (!to.length) { toast('Tick who gets it.', 'bad'); return; }
    go.disabled = true;
    try {
      if (pot.checked) { const t = handOutTotal(h, to.length); await api('party', { method: 'POST', body: { cp: -t.cp, ...(h.item ? { item: h.item, qty: -t.qty } : {}), note: `Handed out to ${to.map((c) => c.name).join(', ')}` } }); }
      const failed = [];
      for (const c of to) { try { await changePlay(c, (play) => { if (h.item) play.inventory = giveItem(play.inventory, h.item, h.qty); play.cp += h.cp; }, `Handed out by the GMs: ${[h.item ? `${h.qty > 1 ? `${h.qty} × ` : ''}${h.item}` : '', h.cp ? `+${coinText(h.cp)}` : ''].filter(Boolean).join(', ')}${pot.checked ? ' (from the treasury)' : ''}`); } catch { failed.push(c.name); } }
      const what = [h.item ? `${h.qty > 1 ? `${h.qty} × ` : ''}${h.item}` : '', h.cp ? coinText(h.cp) : ''].filter(Boolean).join(' and ');
      toast(failed.length ? `Handed out, but these sheets didn’t update: ${failed.join(', ')}` : `${what} each to ${to.length} character${to.length === 1 ? '' : 's'}`, failed.length ? 'bad' : undefined);
      reload();
    } catch (err) { toast(err.message, 'bad'); go.disabled = false; }
  });
  return el('details', { class: 'split-loot' }, el('summary', {}, 'Hand out to everyone'), form);
}

// GMs: split coin from the treasury between active characters, by shares. One ledger line takes it out; each share
// lands on that character's sheet.
function splitForm(cp, active, reload) {
  const amount = el('input', { type: 'text', id: 'split-amt', value: coinText(cp), 'aria-label': 'Coin to split' });
  const shares = active.map((c) => ({ c, input: el('input', { type: 'number', min: 0, max: 20, value: 1, class: 'qty', 'aria-label': `Shares for ${c.name}` }) }));
  const preview = el('p', { class: 'muted small', role: 'status' });
  const plan = () => splitCoins(Math.min(cp, parseCoins(amount.value)), shares.map(({ c, input }) => ({ id: c.id, shares: Math.max(0, Number(input.value) || 0) })));
  const show = () => {
    const p = plan(), names = new Map(active.map((c) => [c.id, c.name]));
    preview.textContent = p.each.length ? `${p.each.map((x) => `${names.get(x.id)} ${coinText(x.cp)}`).join(', ')}${cp - p.given > 0 ? `; ${coinText(cp - p.given)} stays in the treasury` : ''}.` : 'Nobody has a share.';
  };
  for (const x of [amount, ...shares.map((s) => s.input)]) x.addEventListener('input', show);
  show();
  const go = el('button', { class: 'btn small primary', type: 'button', onclick: async () => {
    const p = plan();
    if (!p.given) { amount.focus(); return; }
    if (parseCoins(amount.value) > cp) toast(`The treasury only has ${coinText(cp)}; splitting that.`);
    go.disabled = true;
    const names = new Map(active.map((c) => [c.id, c.name]));
    try {
      await api('party', { method: 'POST', body: { cp: -p.given, note: `Split between ${p.each.map((x) => names.get(x.id)).join(', ')}` } });
      const failed = [];
      for (const x of p.each) { try { await addCoins(active.find((c) => c.id === x.id), x.cp, `+${coinText(x.cp)}, a share of the treasury`); } catch { failed.push(names.get(x.id)); } }
      toast(failed.length ? `Split recorded, but these sheets didn’t update: ${failed.join(', ')}. Add their share by hand.` : `Split ${coinText(p.given)} between ${p.each.length} character${p.each.length === 1 ? '' : 's'}`, failed.length ? 'bad' : undefined);
      reload();
    } catch (err) { toast(err.message, 'bad'); go.disabled = false; }
  } }, 'Split it');
  return el('details', { class: 'split-loot' }, el('summary', {}, 'Split the coin'),
    el('div', { class: 'controls' }, el('label', { for: 'split-amt' }, 'Coin to split '), amount),
    el('ul', { class: 'plain split-shares' }, shares.map(({ c, input }) => el('li', {}, el('span', {}, c.name), input, el('span', { class: 'muted small' }, 'share(s)')))),
    preview, el('p', { class: 'muted small' }, 'Each share goes onto that character’s sheet; set a share to 0 to leave someone out.'), el('div', { class: 'btnrow' }, go));
}

function ledgerForm(chars, reload) {
  const dir = el('select', { id: 'pl-dir', 'aria-label': 'In or out' }, el('option', { value: '1' }, 'Gained'), el('option', { value: '-1' }, 'Spent / gave away'));
  const coins = el('input', { type: 'text', id: 'pl-coins', placeholder: 'e.g. 120 gp 5 sp', 'aria-label': 'Coins' });
  const item = el('input', { type: 'text', id: 'pl-item', placeholder: 'Item (optional)', 'aria-label': 'Item' });
  const qty = el('input', { type: 'number', id: 'pl-qty', value: 1, min: 1, 'aria-label': 'How many', class: 'qty' });
  const holder = el('input', { type: 'text', id: 'pl-holder', list: 'pl-chars', placeholder: 'Who carries it', 'aria-label': 'Who carries it' });
  const note = el('input', { type: 'text', id: 'pl-note', placeholder: 'Why: “sold the gargoyle head”, “reward from the mayor”', 'aria-label': 'Note' });
  const status = el('p', { class: 'form-status', role: 'status' });
  const form = el('form', { class: 'ledger-form' },
    el('div', { class: 'controls' }, dir, coins, item, qty, holder), note,
    el('datalist', { id: 'pl-chars' }, chars.map((c) => el('option', { value: c.name })), el('option', { value: 'Party stash' })),
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary small', type: 'submit' }, 'Record'), status));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sign = Number(dir.value);
    const cp = parseCoins(coins.value);
    if (coins.value.trim() && !cp) { status.textContent = 'Write coins like “25 gp” or “3 gp 5 sp”.'; status.className = 'form-status error'; return; }
    try {
      await api('party', { method: 'POST', body: { cp: sign * cp, item: item.value, qty: sign * Math.max(1, Number(qty.value) || 1), holder: holder.value, note: note.value } });
      toast('Recorded'); reload();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return form;
}

function handouts(list, rerender) {
  // Players also see handouts the GMs gave just to them.
  const shown = list.filter((h) => h.visibility !== 'gm' || h.shared), held = list.filter((h) => h.visibility === 'gm' && !h.shared);
  const paper = (h) => el('li', { class: `handout${h.visibility === 'gm' && !h.shared ? ' held' : ''}` },
    el('div', { class: 'entry-head' }, link(h), h.visibility === 'gm' && isGm() ? el('button', { class: 'btn small primary', type: 'button', onclick: async () => {
      try { await setEntryState(h, { visibility: 'all' }); toast(`Handed out ${h.name}`); rerender(); } catch (err) { toast(err.message, 'bad'); }
    } }, 'Hand out') : null),
    thumb(h, 'handout-pic'),
    h.fields?.text ? el('div', { class: 'paper' }, richText(h.fields.text)) : h.summary ? el('p', {}, h.summary) : null,
    [h.fields?.from && `From ${h.fields.from}`, h.fields?.found].filter(Boolean).length ? el('p', { class: 'muted small' }, [h.fields?.from && `From ${h.fields.from}`, h.fields?.found].filter(Boolean).join(' · ')) : null);
  return el('section', {},
    el('div', { class: 'entry-head' }, el('h3', { class: 'section-title' }, 'Handouts'), isGm() ? el('a', { class: 'btn small', href: '#world/new/handout' }, '+ Handout') : null),
    isGm() && held.length ? el('div', {}, el('p', { class: 'muted small' }, `Ready to hand out (${held.length}): players can’t see these yet.`), el('ul', { class: 'handout-list' }, held.map(paper))) : null,
    shown.length ? el('ul', { class: 'handout-list' }, shown.map(paper))
      : el('p', { class: 'muted' }, isGm() ? 'Write a letter, a map note or a clue as a handout. Keep it hidden until the party finds it, then press “Hand out”.' : 'No handouts yet.'));
}

// Debts at a glance: who owes whom in the party, from the sheets (each debt read from the lender's side).
function debtsCard(chars) {
  const list = partyDebts(chars.filter(ACTIVE).map((c) => ({ id: c.id, name: c.name, play: playOf(c) })));
  if (!list.length) return null;
  return el('section', { class: 'card party-debts' }, el('h3', {}, 'Who owes whom'),
    el('ul', { class: 'plain' }, list.map((d) => el('li', {}, link(getEntry(d.fromId) || { id: d.fromId, name: d.from }), ` owes `, link(getEntry(d.toId) || { id: d.toId, name: d.to }), ` ${coinText(d.cp)}`, d.note ? el('span', { class: 'muted small' }, ` (${d.note})`) : null))));
}

// Bounties on the party page: open bounties on NPCs the viewer knows of.
function bountiesCard() {
  const list = openBounties(worldEntries());
  if (!list.length) return null;
  const seen = appearances(worldEntries(), mentions);
  return el('section', { class: 'card party-bounties' }, el('h3', {}, 'Wanted'),
    el('ul', { class: 'plain' }, list.slice(0, 10).map((b) => {
      // Bounty hunters' board: where they're usually found by day, from their routine.
      const d = b.entry.fields?.routine ? dayOf(b.entry.fields.routine) : [], by = d[0]?.place || d[1]?.place;
      // …and where the party last saw them, from the session logs.
      const s = seen.get(b.entry.id), at = s && sceneOf(s.last, mentions, getEntry, PLACE_KINDS, b.entry);
      return el('li', {}, link(b.entry), `: ${b.text}`, b.by ? el('span', { class: 'muted small' }, ` (from ${b.by})`) : null, by ? el('div', { class: 'small' }, `Usually by day: ${by}`) : null,
        s ? el('div', { class: 'small muted wanted-seen' }, '👁 Last seen in ', link(s.last), at ? [', at ', link(at)] : '', s.ago ? ` (${s.ago} session${s.ago === 1 ? '' : 's'} ago)` : ' (the latest session)') : null);
    })));
}

// Who gave the most: gifts to NPCs counted by giver, for the table's amusement.
function giftsTally() {
  const list = giftCounts(worldEntries().filter((x) => x.kind === 'npc' && x.fields?.gifts).map((x) => ({ entry: x, gifts: x.fields.gifts })));
  if (!list.length) return null;
  return el('section', { class: 'card party-gifts' }, el('h3', {}, '💝 Most generous'),
    el('ol', { class: 'plain' }, list.slice(0, 6).map((x) => { const c = worldEntries().find((e) => e.kind === 'character' && e.name.toLowerCase() === x.by.toLowerCase()); return el('li', {}, c ? link(c) : x.by, `: ${x.count} gift${x.count === 1 ? '' : 's'}`); })));
}

export async function viewParty(rerender) {
  const all = worldEntries();
  const chars = all.filter((e) => e.kind === 'character').sort(byName);
  const quests = all.filter((e) => e.kind === 'quest' && e.fields?.status === 'Active').sort(byName);
  const offered = all.filter((e) => e.kind === 'quest' && ['Available', 'Rumor'].includes(e.fields?.status)).length;
  const journal = all.filter((e) => e.kind === 'journal').sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const state = {};
  try { state.data = await api('party'); } catch (err) { state.error = err.message; }
  const treasuryBox = el('div');
  const reload = async () => {
    try { state.data = await api('party'); state.error = null; } catch (err) { state.error = err.message; }
    setKids(treasuryBox, treasury(state, chars, reload));
  };
  setKids(treasuryBox, treasury(state, chars, reload));
  return el('div', { class: 'w-view party-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'The Party'), el('p', {}, 'Who’s adventuring, what they carry, what they’re chasing and what they’ve found.'), lastShownLine(),
      // Where we are, for everyone: the time, the weather and the light where the party is.
      (() => { const t = sceneFor(); return t ? el('p', { class: 'party-scene' }, '📍 ', t) : null; })(),
      // Open now, for players: what's open in the town the party is in.
      openNowLine(partyTown(), true),
      // Next market, for players: when the party's town next has its market (holidays skipped).
      (() => { const t = partyTown(), cal = withLocal(cleanCalendar(world.info?.cal), t), m = t?.kind === 'settlement' && cal ? nextMarket(cal, t) : null;
        return m ? el('p', { class: 'small party-market' }, `🧺 ${m.inDays === 0 ? `Market day in ${t.name} today` : `Next market in ${t.name}: ${m.weekday}, ${inDaysText(m.inDays)}`}.`) : null; })(),
      // Stalls on the party page: on market day, the travelling stalls in the party's town (buy them on its Market tab).
      (() => { const t = partyTown(), ss = todaysStalls(t); return ss.length ? el('details', { class: 'party-stalls' }, el('summary', {}, `🧺 Market stalls in ${t.name} today (${ss.length})`),
        el('ul', { class: 'plain small' }, ss.map((st) => el('li', {}, el('strong', {}, st.name), ': ', st.goods.map((g) => `${g.name} ${g.price}`).join(', ')))),
        el('a', { class: 'small', href: `#world/e/${t.id}/market` }, 'Buy from the stalls →')) : null; })(),
      // What the party wishes for: the open wishes this person may see (GMs: everyone's; players: their own), and where
      // in the party's town each is for sale today.
      (() => { const t = partyTown(), ws = partyWishes(t?.kind === 'settlement' ? t : null); if (!ws.length) return null;
        const found = ws.filter((w) => w.at.length).length;
        // Players only receive their own characters' wishes (the server keeps the rest), so they see their own here.
        return el('details', { class: 'party-wants' }, el('summary', {}, `⭐ ${isGm() ? 'What the party wishes for' : 'Your wishes'} (${ws.length}${found ? `, ${found} for sale in ${t.name}` : ''})`),
          el('ul', { class: 'plain small' }, ws.map((w) => el('li', {}, link(w.who), `: ${w.wish.text}`, w.at.length ? el('span', { class: 'wish-at' }, ' · ', w.at.slice(0, 3).map((x, i) => [i ? ', ' : '', typeof x.where === 'string' ? x.where : link(x.where), ` (${x.good.name}, ${coinText(x.good.cp)})`])) : null)))); })(),
      // What the party bought: the latest purchases from shops, stalls and taverns, from the characters' logs.
      (() => { const ps = purchases(worldEntries().filter((c) => c.kind === 'character')); return ps.length ? el('details', { class: 'party-bought' }, el('summary', {}, `🛒 What the party bought (${ps.length})`),
        el('ul', { class: 'plain small' }, ps.slice(0, 12).map((x) => el('li', {}, link(x.who), `: ${x.text}`, el('span', { class: 'muted' }, ` · ${when(x.at)}`)))),
        el('button', { class: 'btn small ghost bought-copy', type: 'button', onclick: () => copyText(shoppingText(ps.slice(0, 30), when)) }, 'Copy as text')) : null; })(),
      // The week on the party page: the coming week in the party's town, folded away.
      (() => { const t = partyTown(); return t ? weekInTownBox(t) : null; })(),
      // Last session, for players: which it was and who and what came up in it.
      (() => { const last = sessionOrder(worldEntries())[0]; if (!last) return null; const named = namedIn(last).filter((x) => x.kind !== 'character');
        // Write about the last session: a journal entry started with a link to it.
        const write = isMember() ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => window.dispatchEvent(new CustomEvent('world:draft', { detail: { kind: 'journal', name: `After ${last.name}`, body: `About [[${last.name}]]:\n\n` } })) }, `Write about ${last.name}`) : null;
        // Who has written about it: the writers of the journal entries about the last session.
        const writers = [...new Set(journalsAbout(last.id).map((j) => j.owner || j.fields?.character || '').filter(Boolean))];
        return el('p', { class: 'small party-last-session' }, '📖 Last session: ', link(last), named.length ? [' · came up: ', named.slice(0, 8).map((x, i) => [i ? ', ' : '', link(x)])] : '',
          writers.length ? el('span', { class: 'party-last-writers' }, ` · ✍ written up by ${writers.length > 1 ? `${writers.slice(0, -1).join(', ')} and ${writers[writers.length - 1]}` : writers[0]}`) : '', ' ', write); })(),
      isGm() ? el('div', { class: 'btnrow' }, campButton(rerender)) : null),
    el('div', { class: 'party-grid' },
      el('div', { class: 'party-main' }, isGm() ? glanceTable(chars.filter(ACTIVE)) : null, members(chars), partyBondsSection(), advancementSection(),
        el('section', {}, el('h3', { class: 'section-title' }, 'Current quests'),
          quests.length ? el('ul', { class: 'entry-list' }, quests.map((q) => el('li', {}, link(q), world.info?.next_move === q.id ? el('span', { class: 'tag', title: 'Your pick for what’s next' }, '★ your pick') : null, progressBadge(q), q.fields?.reward ? el('span', { class: 'muted small' }, `Reward: ${q.fields.reward}`) : null)))
            : el('p', { class: 'muted' }, 'No active quests.'),
          offered ? el('p', { class: 'small' }, el('a', { href: '#world/k/quest' }, `${offered} more on offer or rumored`)) : null),
        handouts(all.filter((e) => e.kind === 'handout').sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))), rerender),
        el('section', {}, el('div', { class: 'entry-head' }, el('h3', { class: 'section-title' }, 'Party journal'), isMember() ? el('a', { class: 'btn small', href: '#world/new/journal' }, '+ Journal entry') : null),
          journal.length ? el('ul', { class: 'entry-list' }, journal.slice(0, 8).map((j) => el('li', {}, link(j), el('span', { class: 'muted small' }, [j.fields?.character || j.owner || j.created_by, j.fields?.date || when(j.created_at)].filter(Boolean).join(' · ')))))
            : el('p', { class: 'muted' }, 'Nobody has written anything yet.'),
          journal.length > 8 ? el('a', { href: '#world/k/journal' }, `All ${journal.length} entries`) : null)),
      el('aside', { class: 'party-side' }, treasuryBox, debtsCard(chars), bountiesCard(), giftsTally(), payrollCard(), journeySection(), tableCard())));
}

