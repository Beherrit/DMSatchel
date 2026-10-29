// Pages the party writes together: GMs open an entry to the party, and any player can then change its text
// (summary, description, tags). Its name, kind, secrets, fields and who sees it stay as the GMs set them.
import { el, toast } from './dom.js';
import { isGm, session } from './api.js';
import { getEntry, patchEntry, world, when } from './world-store.js';

export const isPartyPage = (e) => e?.fields?.party_edit === 'yes';

// GMs: open or close the page to the party.
export function partyPageButton(e, rerender) {
  if (!isGm() || e.status === 'suggested') return null;
  const on = isPartyPage(e);
  return el('button', { class: 'btn small ghost', type: 'button', 'aria-pressed': String(on), title: 'Let every player edit this page’s text',
    onclick: async () => { try { await patchEntry(getEntry(e.id) || e, { fields: { party_edit: on ? '' : 'yes' } }); toast(on ? 'Only GMs can edit it again' : 'The party can edit this page now'); rerender(); } catch (err) { toast(err.message, 'bad'); } } },
  on ? '✎ Open to the party' : '✎ Open to the party?');
}

export const partyPageNote = (e) => (isPartyPage(e) ? el('p', { class: 'small party-page-note' }, '✎ The whole party writes this page. ', e.updated_by ? el('span', { class: 'muted' }, `Last changed by ${e.updated_by}, ${when(e.updated_at)}.`) : null) : null);

// A player's form for a party page: just the text.
export function partyPageForm(existing) {
  const status = el('p', { class: 'form-status', role: 'status' });
  const sum = el('textarea', { id: 'pp-summary', rows: 2 }, existing.summary || '');
  const body = el('textarea', { id: 'pp-body', rows: 14 }, existing.body || '');
  const tags = el('input', { type: 'text', id: 'pp-tags', value: (existing.tags || []).join(', ') });
  const f = el('form', { class: 'edit-form' },
    el('div', { class: 'field' }, el('label', { for: 'pp-summary' }, 'Summary'), sum),
    el('div', { class: 'field' }, el('label', { for: 'pp-body' }, 'The page'), body, el('small', { class: 'muted' }, 'Link to other entries with [[double brackets]]. **Bold**, *italic*, “- ” for a list, “## ” for a heading.')),
    el('div', { class: 'field' }, el('label', { for: 'pp-tags' }, 'Tags'), tags),
    status,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Save'), el('a', { class: 'btn ghost', href: `#world/e/${existing.id}` }, 'Cancel')));
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    status.textContent = 'Saving…'; status.className = 'form-status';
    try {
      await patchEntry(getEntry(existing.id) || existing, { summary: sum.value, body: body.value, tags: tags.value.split(',').map((t) => t.trim()).filter(Boolean) });
      toast('Saved'); location.hash = `world/e/${existing.id}`;
    } catch (err) {
      status.textContent = err.message; status.className = 'form-status error';
      if (err.status === 409 && err.body?.entry) world.entries.set(err.body.entry.id, err.body.entry);
    }
  });
  return el('div', { class: 'w-view' }, el('div', { class: 'panel-head' }, el('h2', {}, `Edit ${existing.name}`),
    el('p', {}, `The whole party writes this page. Last changed by ${existing.updated_by || 'someone'} ${when(existing.updated_at)}; if someone saves first, you’ll be told before anything is overwritten.`)), f);
}

export const canPartyEdit = (e) => isPartyPage(e) && !isGm() && e.owner_id !== session.gm?.id;
