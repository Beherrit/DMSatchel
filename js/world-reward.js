// Quest rewards to the treasury (GMs): once a quest is Completed, its page offers to add the reward to the party
// treasury: coin and items read from the reward text, checked and corrected first, logged against the latest session.
import { el, toast } from './dom.js';
import { api, isGm } from './api.js';
import { worldEntries, getEntry, patchEntry, when } from './world-store.js';
import { coinText, parseCoins } from './economy.js';
import { parseReward } from './reward.js';

const latestSession = () => worldEntries().filter((e) => e.kind === 'session')
  .sort((a, b) => (parseFloat(b.fields?.number) || 0) - (parseFloat(a.fields?.number) || 0) || String(b.created_at).localeCompare(String(a.created_at)))[0] || null;

const markPaid = (q, rerender) => patchEntry(getEntry(q.id) || q, { fields: { reward_paid: new Date().toISOString().slice(0, 10) } }).then(rerender);

export function rewardCard(q, rerender) {
  if (q.kind !== 'quest' || !isGm() || q.fields?.status !== 'Completed' || !String(q.fields?.reward || '').trim()) return null;
  if (q.fields.reward_paid) return el('p', { class: 'muted small reward-paid' }, `Reward added to the party treasury on ${when(q.fields.reward_paid)}.`);
  return el('section', { class: 'card reward-card' },
    el('h3', {}, 'Quest complete: pay the reward?'),
    el('p', {}, el('strong', {}, 'Reward: '), q.fields.reward),
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn primary small', type: 'button', onclick: () => openDialog(q, rerender) }, 'Add to the party treasury'),
      el('button', { class: 'btn ghost small', type: 'button', onclick: () => markPaid(q, rerender).catch((err) => toast(err.message, 'bad')) }, 'Already handled')));
}

function openDialog(q, rerender) {
  const r = parseReward(q.fields.reward);
  const coin = el('input', { type: 'text', id: 'rw-coin', value: r.cp ? coinText(r.cp) : '', placeholder: 'e.g. 200 gp' });
  const rows = el('ul', { class: 'plain rw-items' });
  const row = (it = { item: '', qty: 1 }) => {
    const li = el('li', { class: 'rw-row' },
      el('input', { type: 'checkbox', class: 'rw-on', checked: true, 'aria-label': 'Add this item' }),
      el('input', { type: 'number', class: 'rw-qty', min: 1, value: it.qty, 'aria-label': 'How many' }),
      el('input', { type: 'text', class: 'rw-item', value: it.item, placeholder: 'Item', 'aria-label': 'Item' }));
    rows.append(li);
  };
  r.items.forEach(row);
  const session = latestSession();
  const status = el('p', { class: 'form-status', role: 'status' });
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'rw-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'rw-title' }, `Reward for ${q.name}`),
    el('p', { class: 'muted small' }, `Read from “${q.fields.reward}”. Check it, then it goes into the party treasury${session ? ` as part of ${session.name}` : ''}.`),
    el('div', { class: 'field' }, el('label', { for: 'rw-coin' }, 'Coin'), coin),
    el('h3', { class: 'rw-h' }, 'Items'), rows,
    el('button', { class: 'btn small ghost', type: 'button', onclick: () => row() }, '+ Another item'),
    status,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Add to the treasury'), el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const cp = parseCoins(coin.value);
    const items = [...rows.children].filter((li) => li.querySelector('.rw-on').checked && li.querySelector('.rw-item').value.trim())
      .map((li) => ({ item: li.querySelector('.rw-item').value.trim(), qty: Math.max(1, Number(li.querySelector('.rw-qty').value) || 1) }));
    if (!cp && !items.length) { status.textContent = 'Nothing to add: enter some coin or tick an item.'; status.className = 'form-status error'; return; }
    status.textContent = 'Adding…'; status.className = 'form-status';
    const note = `Reward: ${q.name}`, session_id = session?.id || null;
    try {
      if (cp) await api('party', { method: 'POST', body: { cp, note, session_id } });
      for (const it of items) await api('party', { method: 'POST', body: { item: it.item, qty: it.qty, note, session_id } });
      await markPaid(q, () => {});
      toast(`Added to the treasury: ${[cp ? coinText(cp) : '', ...items.map((i) => `${i.qty > 1 ? `${i.qty} × ` : ''}${i.item}`)].filter(Boolean).join(', ')}`);
      d.close(); rerender();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}
