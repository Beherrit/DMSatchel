// Gifts for NPCs: an NPC's page lists what the party has given them, and members can give them something from one of
// their characters (an item and/or coin, with what it's for), paid from that sheet by the server.
import { el, toast, setKids } from './dom.js';
import { api, isGm, isMember, previewing, session } from './api.js';
import { world, worldEntries, link, findByName, whenTime } from './world-store.js';
import { playOf } from './sheet-ui.js';
import { inventoryLines } from './handover.js';
import { coinText, parseCoins } from './economy.js';
import { readGifts, giftWhat, wantsMatch, givenBy } from './gifts.js';

const ACTIVE = (c) => c.kind === 'character' && c.status !== 'suggested' && !['Retired', 'Dead', 'Missing'].includes(c.fields?.status);

function giveDialog(npc, chars, rerender) {
  const from = el('select', { id: 'gf-from' }, chars.map((c) => el('option', { value: c.id }, c.name)));
  const item = el('select', { id: 'gf-item' });
  const qty = el('input', { type: 'number', id: 'gf-qty', min: 1, value: 1 });
  const coin = el('input', { type: 'text', id: 'gf-coin', placeholder: 'e.g. 5 gp' });
  const coinLabel = el('label', { for: 'gf-coin' }, 'Coin');
  const why = el('input', { type: 'text', id: 'gf-why', maxlength: 200, placeholder: 'e.g. for the map, to keep quiet' });
  const status = el('p', { class: 'form-status', role: 'status' });
  // A gift they wanted: say so when the item (or coin) answers the NPC's Wants.
  const wanted = el('p', { class: 'small gift-wanted', 'aria-live': 'polite' });
  const checkWanted = () => { const hit = wantsMatch(npc.fields?.wants, item.value, coin.value.trim() ? 1 : 0); wanted.textContent = hit ? `💝 Something ${npc.name} wants.` : ''; };
  const field = (id, label, input) => el('div', { class: 'field' }, el('label', { for: id }, label), input);
  const syncQty = () => { const n = Number(item.selectedOptions[0]?.dataset.qty) || 1; qty.max = n; qty.value = Math.min(Number(qty.value) || 1, n); qty.closest('.field').hidden = !item.value || n < 2; };
  const fill = () => {
    const c = world.entries.get(from.value), p = playOf(c);
    setKids(item, el('option', { value: '' }, 'No item, just coin'), inventoryLines(p.inventory).map((x) => el('option', { value: x.name, 'data-qty': x.qty }, x.qty > 1 ? `${x.name} (${x.qty})` : x.name)));
    coinLabel.textContent = `Coin (${c.name} has ${coinText(p.cp)})`;
    syncQty();
  };
  from.addEventListener('change', () => { fill(); checkWanted(); }); item.addEventListener('change', () => { syncQty(); checkWanted(); }); coin.addEventListener('input', checkWanted);
  const go = el('button', { class: 'btn primary', type: 'submit' }, 'Give');
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'gf-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'gf-title' }, `Give ${npc.name} something`),
    field('gf-from', 'From', from), field('gf-item', 'Item', item), field('gf-qty', 'How many', qty), el('div', { class: 'field' }, coinLabel, coin), field('gf-why', 'What for (optional)', why), wanted,
    el('p', { class: 'muted small' }, `It leaves the sheet, and ${npc.name}’s page remembers who gave what.`), status,
    el('div', { class: 'btnrow' }, go, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
  fill();
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const cp = coin.value.trim() ? parseCoins(coin.value) : 0;
    if (coin.value.trim() && !cp) { status.textContent = 'Write coins like “15 gp” or “2 sp”.'; status.className = 'form-status error'; return; }
    const c = world.entries.get(from.value), p = playOf(c);
    go.disabled = true;
    try {
      const r = await api('entries', { method: 'PATCH', body: { gift: { from: c.id, to: npc.id, item: item.value, qty: Number(qty.value) || 1, cp, note: why.value, base: { cp: p.cp, inventory: p.inventory } } } });
      for (const x of r.entries) world.entries.set(x.id, x);
      toast(`${c.name} gave ${giftWhat(r.gift)} to ${npc.name}${r.gift.wanted ? ': something they wanted' : ''}`);
      d.close(); rerender();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; go.disabled = false; }
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}

export function giftsSection(npc, rerender) {
  if (npc.kind !== 'npc') return null;
  const gifts = readGifts(npc.fields?.gifts).slice().reverse();
  const chars = isMember() && !previewing() ? worldEntries().filter((c) => ACTIVE(c) && (isGm() || c.owner_id === session.gm?.id)).sort((a, b) => a.name.localeCompare(b.name)) : [];
  if (!gifts.length && !chars.length) return null;
  const by = (name) => { const c = findByName(name); return c && c.kind === 'character' ? link(c) : name; };
  return el('section', { class: 'gifts' },
    el('div', { class: 'entry-head' }, el('h3', { class: 'section-title' }, gifts.length ? `Gifts (${gifts.length})` : 'Gifts'),
      chars.length && !['Dead'].includes(npc.fields?.status) ? el('button', { class: 'btn small', type: 'button', onclick: () => giveDialog(npc, chars, rerender) }, 'Give them something…') : null),
    gifts.length ? el('ul', { class: 'plain sheet-log' }, gifts.slice(0, 12).map((g) => el('li', {}, el('span', {}, g.wanted ? el('span', { title: 'Something they wanted' }, '💝 ') : null, giftWhat(g), ' from ', by(g.by), g.note ? el('span', { class: 'muted' }, ` (${g.note})`) : null), g.at ? el('span', { class: 'muted small' }, ` · ${whenTime(g.at)}`) : null)))
      : el('p', { class: 'muted small' }, 'Nothing given yet.'));
}

// Who's been given what: on a character's page, the gifts they've given NPCs (as the viewer can see them).
export function givenSection(char) {
  if (char.kind !== 'character') return null;
  const list = givenBy(char.name, worldEntries().filter((x) => x.kind === 'npc' && x.fields?.gifts).map((x) => ({ entry: x, gifts: x.fields.gifts })));
  if (!list.length) return null;
  return el('section', { class: 'gifts-given' }, el('h3', { class: 'section-title' }, `Gifts given (${list.length})`),
    el('ul', { class: 'plain sheet-log' }, list.slice(0, 12).map((g) => el('li', {}, el('span', {}, g.wanted ? el('span', { title: 'Something they wanted' }, '💝 ') : null, giftWhat(g), ' to ', link(g.npc), g.note ? el('span', { class: 'muted' }, ` (${g.note})`) : null), g.at ? el('span', { class: 'muted small' }, ` · ${whenTime(g.at)}`) : null))));
}
