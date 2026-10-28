// The party page: who's in the party, the shared treasury and loot log, current quests, handouts and the journal.
// Route: #world/party
import { el, toast, confirmButton, setKids } from './dom.js';
import { api, isGm, isMember, session } from './api.js';
import { worldEntries, byName, link, when, richText, setEntryState } from './world-store.js';
import { thumb } from './image-ui.js';
import { lastShownLine } from './world-show.js';
import { addCoins } from './sheet-ui.js';
import { progressBadge } from './world-objectives.js';
import { advancementSection } from './world-attendance.js';
import { partyBondsSection } from './world-bonds.js';
import { splitCoins } from './economy.js';

const ACTIVE = (e) => !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);

// Coin text and parsing live in economy.js (pure, so recaps and tests can use them too).
export { coinText, parseCoins } from './economy.js';
import { coinText, parseCoins } from './economy.js';
import { tableCard } from './world-profiles.js';

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
      el('ul', { class: 'entry-list' }, former.map((e) => el('li', {}, link(e), el('span', { class: 'kind-tag' }, e.fields.status))))) : null);
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
    items.length ? el('div', {}, el('span', { class: 'eyebrow' }, 'Items held'),
      el('ul', { class: 'plain item-held' }, items.map((i) => el('li', {}, i.qty > 1 ? `${i.qty} × ` : '', el('strong', {}, i.item), i.holder ? el('span', { class: 'muted small' }, ` (${i.holder})`) : null))))
      : el('p', { class: 'muted small' }, 'No items in the shared stash.'));
  if (isGm() && active.length && cp > 0) box.append(splitForm(cp, active, reload));
  if (isMember()) box.append(ledgerForm(chars, reload));
  box.append(el('details', { class: 'ledger', open: lines.length && lines.length <= 8 ? true : null }, el('summary', {}, `Loot log (${lines.length})`),
    lines.length ? el('ul', { class: 'plain ledger-lines' }, lines.slice(0, 200).map((l) => el('li', {},
      el('span', { class: `amt ${l.cp < 0 || l.qty < 0 ? 'out' : 'in'}` }, [l.cp ? `${l.cp > 0 ? '+' : ''}${coinText(l.cp)}` : '', l.item ? `${l.qty > 0 ? '+' : '−'}${Math.abs(l.qty)} ${l.item}` : ''].filter(Boolean).join(', ')),
      l.note ? el('span', {}, ` ${l.note}`) : null, l.holder ? el('span', { class: 'muted small' }, ` → ${l.holder}`) : null,
      el('span', { class: 'muted small' }, ` · ${l.by || 'someone'}, ${when(l.at)}`),
      isGm() || l.gm_id === session.gm?.id ? confirmButton('Strike', async () => { try { await api('party', { method: 'DELETE', query: { id: l.id } }); reload(); } catch (err) { toast(err.message, 'bad'); } }, 'btn small ghost') : null)))
      : el('p', { class: 'muted small' }, 'Nothing recorded yet.')));
  return box;
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
      for (const x of p.each) { try { await addCoins(active.find((c) => c.id === x.id), x.cp); } catch { failed.push(names.get(x.id)); } }
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
    el('div', { class: 'panel-head' }, el('h2', {}, 'The Party'), el('p', {}, 'Who’s adventuring, what they carry, what they’re chasing and what they’ve found.'), lastShownLine()),
    el('div', { class: 'party-grid' },
      el('div', { class: 'party-main' }, members(chars), partyBondsSection(), advancementSection(),
        el('section', {}, el('h3', { class: 'section-title' }, 'Current quests'),
          quests.length ? el('ul', { class: 'entry-list' }, quests.map((q) => el('li', {}, link(q), progressBadge(q), q.fields?.reward ? el('span', { class: 'muted small' }, `Reward: ${q.fields.reward}`) : null)))
            : el('p', { class: 'muted' }, 'No active quests.'),
          offered ? el('p', { class: 'small' }, el('a', { href: '#world/k/quest' }, `${offered} more on offer or rumored`)) : null),
        handouts(all.filter((e) => e.kind === 'handout').sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))), rerender),
        el('section', {}, el('div', { class: 'entry-head' }, el('h3', { class: 'section-title' }, 'Party journal'), isMember() ? el('a', { class: 'btn small', href: '#world/new/journal' }, '+ Journal entry') : null),
          journal.length ? el('ul', { class: 'entry-list' }, journal.slice(0, 8).map((j) => el('li', {}, link(j), el('span', { class: 'muted small' }, [j.fields?.character || j.owner || j.created_by, j.fields?.date || when(j.created_at)].filter(Boolean).join(' · ')))))
            : el('p', { class: 'muted' }, 'Nobody has written anything yet.'),
          journal.length > 8 ? el('a', { href: '#world/k/journal' }, `All ${journal.length} entries`) : null)),
      el('aside', { class: 'party-side' }, treasuryBox, tableCard())));
}

