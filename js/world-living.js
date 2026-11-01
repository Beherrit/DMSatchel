// Living costs (GMs): after days pass on the calendar (the calendar page, or travel on a map), offer to charge the
// party for living: a lifestyle (SRD 5.1, per day), paid by each character from their own coin, or by the treasury
// in one line of the loot log. Nobody's purse goes below nothing; the dialog says who came up short. Hirelings'
// wages (see hirelings.js) come from the treasury too, as their own line.
import { el, toast, setKids } from './dom.js';
import { api, isGm, previewing, session } from './api.js';
import { world, worldEntries, patchEntry } from './world-store.js';
import { downtimeProgress } from './downtime-days.js';
import { roadJournal } from './road-journal.js';
import { playOf, addCoins, changePlay } from './sheet-ui.js';
import { eatRations, feedFromStash, feedHirelings, stashAfter } from './rations.js';
import { coinText } from './economy.js';
import { LIFESTYLES, livingCosts } from './lifestyle.js';
import { payroll } from './hirelings.js';

const ACTIVE = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);
const keyOf = () => `satchel-lifestyle-${session.worldKey || 'default'}`;
const remembered = () => { try { return localStorage.getItem(keyOf()) || 'Modest'; } catch { return 'Modest'; } };
const remember = (v) => { try { localStorage.setItem(keyOf(), v); } catch { /* private window */ } };

const ROAD = 'road'; // the lifestyle choice for eating rations on the road
let ateOnRoad = 0; // days of rations each ate after the last days passed (for the road journal)

export async function offerLivingCosts(days, { travel = false } = {}) {
  if (!isGm() || previewing() || !(days > 0)) return;
  const chars = worldEntries().filter(ACTIVE).sort((a, b) => a.name.localeCompare(b.name)).map((e) => ({ id: e.id, name: e.name, cp: playOf(e).cp || 0, lifestyle: e.fields?.lifestyle || '', e }));
  const pay = payroll(worldEntries(), days);
  if (!chars.length && !pay.list.length) return;
  let treasury = 0;
  let stash = [];
  try { const t = await api('party'); treasury = t.cp || 0; stash = t.items || []; } catch { /* the treasury choice just shows 0 */ }
  // On the road (after travel, by default), the party eats its rations instead of paying for its keep.
  const want = travel ? ROAD : remembered();
  const style = el('select', { id: 'lv-style' }, el('option', { value: ROAD, selected: want === ROAD || null }, 'On the road: eat rations'),
    LIFESTYLES.map(([n, cp]) => { const o = el('option', { value: n }, `${n} (${cp ? `${coinText(cp)} a day` : 'free'})`); if (n === want) o.selected = true; return o; }));
  const road = () => style.value === ROAD;
  const eating = () => chars.map((c) => ({ ...c, ...eatRations(playOf(world.entries.get(c.id) || c.e).inventory, days) }));
  const own = el('input', { type: 'radio', name: 'lv-who', id: 'lv-own', value: 'own', checked: true });
  const pot = el('input', { type: 'radio', name: 'lv-who', id: 'lv-pot', value: 'pot' });
  const preview = el('p', { class: 'small', role: 'status' });
  const wages = pay.list.length ? el('input', { type: 'checkbox', id: 'lv-wages', checked: true }) : null;
  const plan = () => (pot.checked ? livingCosts(chars, days, style.value, treasury) : livingCosts(chars, days, style.value));
  const whoPays = el('fieldset', { class: 'plain-fieldset' }, el('legend', {}, 'Who pays'),
      el('label', { class: 'check', for: 'lv-own' }, own, ' Each character, from their own coin'),
      el('label', { class: 'check', for: 'lv-pot' }, pot, ` The party treasury (${coinText(treasury)})`));
  // Hirelings eat too: on the road, hired NPCs eat from the treasury's rations, before any character's shortfall.
  const hires = pay.list.map((x) => ({ id: x.entry.id, name: x.entry.name }));
  const hireFeed = hires.length ? feedHirelings(hires, days, stash) : null;
  const hireLine = hires.length ? el('p', { class: 'small hire-food', hidden: true }) : null;
  if (hireLine) {
    const ate = hireFeed.fed.used.reduce((t, u) => t + u.qty, 0);
    hireLine.textContent = ate
      ? `${hires.length === 1 ? hires[0].name : 'The hirelings'} eat${hires.length === 1 ? 's' : ''} ${ate} of the treasury’s rations${hireFeed.short.length ? `; not enough: ${hireFeed.short.map((x) => `${x.name} goes ${x.days} day${x.days === 1 ? '' : 's'} short`).join(', ')}` : ''}.`
      : `The treasury has no rations for ${hires.length === 1 ? hires[0].name : 'the hirelings'}: ${hireFeed.short.map((x) => `${x.name} goes ${x.days} day${x.days === 1 ? '' : 's'} short`).join(', ')}.`;
    hireLine.classList.toggle('bad-line', hireFeed.short.length > 0);
  }
  const stashLeft = hireFeed ? stashAfter(stash, hireFeed.fed.used) : stash;
  // Rations from the stash: shortfalls are covered from the treasury's rations first (ticked, when there are any).
  const stashRations = stashLeft.filter((s) => /\bration/i.test(s.item) && s.qty > 0).reduce((t, s) => t + s.qty, 0);
  const fromStash = stashRations ? el('input', { type: 'checkbox', id: 'lv-stash', checked: true }) : null;
  const stashLine = fromStash ? el('label', { class: 'check stash-line', for: 'lv-stash', hidden: true }, fromStash, el('span', {})) : null;
  const fed = (list) => (fromStash?.checked ? feedFromStash(list.filter((x) => x.short).map((x) => ({ id: x.id, name: x.name, short: x.short })), stashLeft) : null);
  const stillShort = (list) => { const f = fed(list); return list.map((x) => ({ ...x, fromStash: f ? x.short - (f.left.get(x.id) ?? x.short) : 0, short: f ? (f.left.get(x.id) ?? x.short) : x.short })); };
  // Who went short of food on the road: the GM may give them a level of exhaustion (unticked: it's their call).
  const tired = new Set();
  const hunger = el('fieldset', { class: 'plain-fieldset hunger', hidden: true });
  const showHunger = (list) => {
    const hungry = list.filter((x) => x.short);
    hunger.hidden = !hungry.length;
    setKids(hunger, el('legend', {}, 'Hunger takes its toll'), hungry.map((x) => {
      const cb = el('input', { type: 'checkbox', id: `hg-${x.id}`, checked: tired.has(x.id) || null });
      cb.addEventListener('change', () => { if (cb.checked) tired.add(x.id); else tired.delete(x.id); });
      return el('label', { class: 'check', for: `hg-${x.id}` }, cb, ` A level of exhaustion for ${x.name} (${x.short} day${x.short === 1 ? '' : 's'} without food)`);
    }));
  };
  const show = () => {
    whoPays.hidden = road();
    if (!road()) hunger.hidden = true;
    if (hireLine) hireLine.hidden = !road();
    if (stashLine) {
      const anyShort = road() && eating().some((x) => x.short);
      stashLine.hidden = !anyShort;
      if (anyShort) { const covered = stillShort(eating()).filter((x) => x.fromStash); stashLine.lastChild.textContent = ` Feed them from the treasury’s rations (${stashRations} there)${fromStash.checked && covered.length ? `: ${covered.map((x) => `${x.name} ${x.fromStash}`).join(', ')}` : ''}`; }
    }
    if (road()) {
      showHunger(stillShort(eating()));
      preview.textContent = eating().map((x) => (x.had ? `${x.name} eats ${x.ate} (${x.had - x.ate} left)${x.short ? `, ${x.short} day${x.short === 1 ? '' : 's'} short` : ''}` : `${x.name} has no rations`)).join('; ') + '.';
      return;
    }
    const p = plan();
    preview.textContent = pot.checked
      ? `The treasury pays ${coinText(p.paid)} for ${chars.length} character${chars.length === 1 ? '' : 's'}${p.short ? `; it’s ${coinText(p.short)} short` : ''}.`
      : p.each.map((x) => `${x.name} ${coinText(x.paid)}${x.lifestyle !== style.value ? ` (${x.lifestyle.toLowerCase()})` : ''}${x.short ? ` (${coinText(x.short)} short)` : ''}`).join(', ') + '.';
  };
  for (const x of [style, own, pot, fromStash].filter(Boolean)) x.addEventListener('change', show);
  show();
  const go = el('button', { class: 'btn primary', type: 'submit' }, 'Charge it');
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'lv-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'lv-title' }, `Living costs for ${days} day${days === 1 ? '' : 's'}?`),
    el('div', { class: 'field' }, el('label', { for: 'lv-style' }, chars.some((c) => c.lifestyle) ? 'How the rest of the party lives' : 'How the party lives'), style),
    chars.some((c) => c.lifestyle) ? el('p', { class: 'muted small' }, `Living their own way: ${chars.filter((c) => c.lifestyle).map((c) => `${c.name} (${c.lifestyle.toLowerCase()})`).join(', ')}. On the road, everyone eats rations.`) : null,
    whoPays,
    preview,
    hireLine,
    stashLine,
    hunger,
    wages ? el('label', { class: 'check', for: 'lv-wages' }, wages, ` Pay ${pay.list.length === 1 ? pay.list[0].entry.name : `${pay.list.length} hirelings`} ${coinText(pay.total)} in wages from the treasury`) : null,
    el('div', { class: 'btnrow' }, go, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    remember(style.value);
    if (road()) { await eatOnTheRoad(); return; }
    const p = plan();
    const payWages = Boolean(wages?.checked && pay.total);
    if (!(pot.checked ? p.paid : p.total) && !payWages) { d.close(); toast('Nothing to pay'); return; }
    go.disabled = true;
    try {
      if (payWages) await api('party', { method: 'POST', body: { cp: -pay.total, note: `Wages: ${days} day${days === 1 ? '' : 's'} for ${pay.list.map((x) => x.entry.name).join(', ')}` } });
      const wagesNote = payWages ? `; wages ${coinText(pay.total)} from the treasury` : '';
      if (pot.checked) {
        if (p.paid) await api('party', { method: 'POST', body: { cp: -p.paid, note: `Living costs: ${days} day${days === 1 ? '' : 's'}, ${style.value.toLowerCase()}, ${chars.length} character${chars.length === 1 ? '' : 's'}` } });
        toast(`The treasury paid ${coinText(p.paid)} in living costs${p.short ? ` (${coinText(p.short)} short)` : ''}${wagesNote}`);
      } else {
        const failed = [];
        for (const x of p.each) if (x.paid) { try { await addCoins(chars.find((c) => c.id === x.id).e, -x.paid, `−${coinText(x.paid)} living costs (${x.lifestyle.toLowerCase()}, ${days} day${days === 1 ? '' : 's'})`); } catch { failed.push(x.name); } }
        toast(failed.length ? `Charged, but these sheets didn’t update: ${failed.join(', ')}` : `Living costs paid: ${coinText(p.total)} in all${wagesNote}`, failed.length ? 'bad' : undefined);
      }
      d.close();
      window.dispatchEvent(new Event('world:rerender'));
    } catch (err) { toast(err.message, 'bad'); go.disabled = false; }
  });
  async function eatOnTheRoad() {
    go.disabled = true;
    const raw = eating(), f = fed(raw), list = stillShort(raw), failed = [];
    ateOnRoad = days;
    if (hireFeed) for (const u of hireFeed.fed.used) { try { await api('party', { method: 'POST', body: { item: u.item, qty: -u.qty, note: `Eaten on the road by ${u.by.join(', ')} (hired)` } }); } catch (err) { toast(err.message, 'bad'); } }
    if (f) for (const u of f.used) { try { await api('party', { method: 'POST', body: { item: u.item, qty: -u.qty, note: `Eaten on the road by ${u.by.join(', ')}` } }); } catch (err) { toast(err.message, 'bad'); } }
    if (wages?.checked && pay.total) { try { await api('party', { method: 'POST', body: { cp: -pay.total, note: `Wages: ${days} day${days === 1 ? '' : 's'} for ${pay.list.map((x) => x.entry.name).join(', ')}` } }); } catch (err) { toast(err.message, 'bad'); } }
    for (const x of list) {
      const worn = x.short && tired.has(x.id);
      if (!x.ate && !worn && !x.fromStash) continue;
      const note = [x.ate ? `Ate ${x.ate} day${x.ate === 1 ? '' : 's'} of rations on the road${x.short ? ` (${x.short} short)` : ''}` : x.short ? `${x.short} day${x.short === 1 ? '' : 's'} on the road without food` : '', x.fromStash ? `${x.fromStash} day${x.fromStash === 1 ? '' : 's'} from the treasury’s rations` : '', worn ? 'a level of exhaustion from hunger' : ''].filter(Boolean).join('; ');
      try { await changePlay(x.e, (play) => { play.inventory = eatRations(play.inventory, days).text; if (worn) play.exhaustion = Math.min(6, (Number(play.exhaustion) || 0) + 1); }, note); } catch { failed.push(x.name); }
    }
    const hungry = [...list.filter((x) => x.short).map((x) => x.name), ...(hireFeed?.short || []).map((x) => x.name)];
    toast([`${days} day${days === 1 ? '' : 's'} of rations eaten`, hungry.length ? `out of food: ${hungry.join(', ')}` : '', failed.length ? `these sheets didn’t update: ${failed.join(', ')}` : ''].filter(Boolean).join(' · '), hungry.length || failed.length ? 'bad' : undefined);
    d.close();
    window.dispatchEvent(new Event('world:rerender'));
  }
  d.addEventListener('close', () => d.remove());
  // Resolves when the dialog closes, so what comes after it (the shops' deliveries) waits its turn.
  return new Promise((resolve) => { d.addEventListener('close', resolve); document.body.append(d); d.showModal(); });
}

// A day on the road: offer the journey as a party journal draft.
function offerRoadJournal(trip, ate) {
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'rj-title' }, el('div', { class: 'dialog-body' },
    el('h2', { id: 'rj-title' }, 'Write up the journey?'),
    el('p', {}, `A party journal entry for the road from ${trip.from} to ${trip.to}, with the days, the weather and the rations, ready to add to.`),
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn primary', type: 'button', onclick: () => { d.close(); window.dispatchEvent(new CustomEvent('world:draft', { detail: roadJournal(trip, ate) })); } }, 'Draft it'),
      el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'))));
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}

// Open downtime counts the days that passed; say which activities are now ready to resolve.
async function downtimeMoves(days) {
  const moved = downtimeProgress(worldEntries(), days), failed = [];
  for (const m of moved) { try { await patchEntry(world.entries.get(m.entry.id) || m.entry, { fields: { done: String(m.done) } }); } catch { failed.push(m.entry.name); } }
  const ready = moved.filter((m) => m.ready).map((m) => { const ch = world.entries.get(m.entry.fields?.character); return `${ch ? `${ch.name}’s ` : ''}${String(m.entry.fields?.activity || 'downtime').toLowerCase()}`; });
  if (ready.length || failed.length) toast([ready.length ? `Downtime ready to resolve: ${ready.join(', ')}` : '', failed.length ? `couldn’t update: ${failed.join(', ')}` : ''].filter(Boolean).join(' · '), failed.length ? 'bad' : undefined);
}

window.addEventListener('world:days', async (ev) => {
  ateOnRoad = 0;
  await offerLivingCosts(ev.detail?.days, { travel: Boolean(ev.detail?.travel) });
  if (isGm() && !previewing() && ev.detail?.days > 0) {
    await downtimeMoves(ev.detail.days);
    await (await import('./world-restock.js')).offerRestock();
    if (ev.detail.trip) offerRoadJournal(ev.detail.trip, ateOnRoad);
  }
});
