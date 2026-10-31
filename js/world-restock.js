// Shops restock with time (GMs): after days pass, the shops whose last delivery is a week or more old are offered a
// fresh stock at their town's prices; untick any that should stay as they are.
import { el, toast } from './dom.js';
import { worldEntries, getEntry, patchEntry } from './world-store.js';
import { worldCalendar } from './world-calendar.js';
import { toDays, today } from './calendar.js';
import { restockDraft } from './world-place.js';
import { shopsDue, RESTOCK_EVERY } from './restock.js';

const townOf = (e) => { let p = getEntry(e.parent_id), guard = 0; while (p && guard++ < 12) { if (p.kind === 'settlement') return p; p = getEntry(p.parent_id); } return null; };

export function offerRestock() {
  const cal = worldCalendar();
  if (!cal) return;
  const due = shopsDue(worldEntries().filter((e) => e.kind === 'location'), toDays(cal, today(cal)));
  if (!due.length) return;
  const boxes = due.map((s) => ({ s, cb: el('input', { type: 'checkbox', id: `rs-${s.id}`, checked: true }) }));
  const status = el('p', { class: 'form-status', role: 'status' });
  const go = el('button', { class: 'btn primary', type: 'submit' }, 'Restock them');
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'rs-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'rs-title' }, 'New deliveries?'),
    el('p', {}, `These shops haven’t had a delivery for ${RESTOCK_EVERY} days or more. Fresh stock replaces what’s on their shelves, at their town’s prices.`),
    el('ul', { class: 'plain' }, boxes.map(({ s, cb }) => el('li', {}, el('label', { class: 'check', for: `rs-${s.id}` }, cb, ` ${s.name}`, townOf(s) ? el('span', { class: 'muted small' }, ` · ${townOf(s).name}`) : null)))),
    status,
    el('div', { class: 'btnrow' }, go, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const picked = boxes.filter((b) => b.cb.checked).map((b) => b.s);
    if (!picked.length) { d.close(); return; }
    go.disabled = true;
    const failed = [];
    for (const [i, s] of picked.entries()) {
      status.textContent = `Restocking ${i + 1} of ${picked.length}…`;
      try { const cur = getEntry(s.id) || s; await patchEntry(cur, { fields: restockDraft(cur, townOf(cur)) }); } catch { failed.push(s.name); }
    }
    toast(failed.length ? `Restocked, except: ${failed.join(', ')}` : `Restocked ${picked.length} shop${picked.length === 1 ? '' : 's'}`, failed.length ? 'bad' : undefined);
    d.close();
    window.dispatchEvent(new Event('world:rerender'));
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}
