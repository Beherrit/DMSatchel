// Table safety on every page: players can ask, anonymously, for a pause (the server keeps only when); GMs see a bar
// when someone has, until they mark it seen; an open check-in asks players how they're doing (👍 😐 👎, counted
// anonymously), and GMs see the tally and can ask or close one.
import { el, toast } from './dom.js';
import { api, isGm, isMember, previewing } from './api.js';
import { world } from './world-store.js';
import { MOODS, MOOD_ICON } from './safety.js';

const ago = (iso) => { const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000)); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };

async function askPause() {
  if (!confirm('This tells the GM someone would like to pause or move on. Nobody, not even the GM, sees it was you.')) return;
  try { await api('entries', { method: 'PATCH', body: { pause: true } }); toast('The GM has been told. Thank you for saying.'); } catch (err) { toast(err.message, 'bad'); }
}
async function answer(mood) {
  try { await api('entries', { method: 'PATCH', body: { checkin_answer: mood } }); world.info = { ...world.info, checkin: { ...world.info.checkin, answered: true } }; toast('Thanks: answered anonymously'); drawBar(); } catch (err) { toast(err.message, 'bad'); }
}
async function gm(body, after) {
  try { const r = await api('settings', { method: 'PATCH', body }); after(r); drawBar(); } catch (err) { toast(err.message, 'bad'); }
}

// The bar: for GMs, a pause asked for and the check-in tally; for players, an open check-in to answer.
function barContent() {
  const p = world.info?.pause, c = world.info?.checkin, out = [];
  if (isGm() && p?.count) out.push(el('div', { class: 'safety-pause', role: 'alert' }, el('strong', {}, `⏸ Someone asked to pause or move on${p.count > 1 ? ` (${p.count} times)` : ''}`), ` · ${ago(p.last)} · `,
    el('button', { class: 'btn small', type: 'button', onclick: () => gm({ pause_seen: true }, () => { world.info = { ...world.info, pause: { count: 0, last: null } }; }) }, 'Seen')));
  if (c?.id && isGm()) out.push(el('div', { class: 'safety-checkin gm' }, el('strong', {}, `💬 “${c.question}”: `), MOODS.map((m) => `${MOOD_ICON[m]} ${c.tally?.[m] || 0} `), el('span', { class: 'muted' }, `(${c.count || 0} answered) `),
    el('button', { class: 'btn small ghost', type: 'button', onclick: () => gm({ checkin: null }, () => { world.info = { ...world.info, checkin: null }; }) }, 'Close')));
  if (c?.id && !isGm() && isMember() && !previewing()) out.push(el('div', { class: 'safety-checkin' }, el('strong', {}, `💬 The GM asks: “${c.question}” `),
    c.answered ? el('span', { class: 'muted' }, 'Answered, thank you.') : MOODS.map((m) => el('button', { class: 'btn small', type: 'button', 'aria-label': { up: 'Good', meh: 'So-so', down: 'Not great' }[m], onclick: () => answer(m) }, MOOD_ICON[m])),
    el('span', { class: 'muted small' }, ' (anonymous)')));
  return out;
}
export function drawBar() {
  let bar = document.getElementById('safety-bar');
  const kids = isMember() ? barContent() : [];
  if (!kids.length) { bar?.remove(); return; }
  if (!bar) { bar = el('div', { id: 'safety-bar', class: 'safety-bar' }); document.body.append(bar); }
  bar.replaceChildren(...kids);
}
window.addEventListener('world:safety', drawBar);

// The tools: players' "Ask for a pause", GMs' "Ask how everyone's doing", for the party page.
export function safetyTools() {
  if (!isMember() || previewing()) return null;
  if (!isGm()) return el('button', { class: 'btn small ghost safety-ask', type: 'button', title: 'Anonymous: the GM sees only that someone asked', onclick: askPause }, '⏸ Ask for a pause');
  return el('button', { class: 'btn small ghost safety-checkin-ask', type: 'button', onclick: () => { const q = prompt('Ask the table (answers are anonymous):', 'How’s everyone doing?'); if (q !== null) gm({ checkin: { question: q } }, (r) => { world.info = { ...world.info, checkin: { ...r.checkin, answered: false, count: 0 } }; }); } }, '💬 Check in with the table');
}
