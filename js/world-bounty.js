// Bounties pay out: after a GM marks an NPC with a bounty dead or captured, offer the bounty for the party treasury.
import { el, toast } from './dom.js';
import { api, isGm } from './api.js';
import { world, patchEntry } from './world-store.js';
import { coinText } from './economy.js';
import { bountyDue } from './bounty.js';

export function offerBounty(before, after) {
  const due = isGm() ? bountyDue(before, after) : null;
  if (!due) return;
  const how = after.fields.status === 'Captured' ? 'captured' : 'dead';
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'bt-title' }, el('div', { class: 'dialog-body' },
    el('h2', { id: 'bt-title' }, `Claim the bounty on ${after.name}?`),
    el('p', {}, `${after.name} is ${how}. The bounty is ${due.text}${due.by ? `, offered by ${due.by}` : ''}. Pay ${coinText(due.cp)} into the party treasury?`),
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn primary', type: 'button', onclick: async (ev) => {
        ev.currentTarget.disabled = true;
        try {
          await api('party', { method: 'POST', body: { cp: due.cp, note: `Bounty on ${after.name}${due.by ? `, paid by ${due.by}` : ''}` } });
          const cur = world.entries.get(after.id) || after;
          await patchEntry(cur, { fields: { bounty_paid: new Date().toISOString().slice(0, 10) } });
          toast(`${coinText(due.cp)} into the treasury for ${after.name}`);
        } catch (err) { toast(err.message, 'bad'); }
        d.close();
      } }, 'Pay it in'),
      el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now'))));
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal();
}
