// Dreams: GMs send a character a dream, a handout shared with that character's player alone (the GMs see it too). A
// character's page lists their dreams; a dream can be tied to a prophecy, whose page tells GMs who has dreamed of it.
import { el, toast } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, getEntry, createEntry, link, when, richText } from './world-store.js';
import { isProphecy } from './world-objectives.js';

export const dreamsOf = (c) => worldEntries().filter((h) => h.kind === 'handout' && h.fields?.dream_for === c.id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
export const allDreams = () => worldEntries().filter((h) => h.kind === 'handout' && h.fields?.dream_for).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

// Send a dream: a GM's dialog on a character's page.
function sendDialog(c, rerender) {
  const name = el('input', { type: 'text', id: 'dream-name', value: 'A dream', maxlength: 120 });
  const text = el('textarea', { id: 'dream-text', rows: 6, placeholder: 'What they dream, told to them alone.' });
  const prophecies = worldEntries().filter(isProphecy).sort((a, b) => a.name.localeCompare(b.name));
  const of = prophecies.length ? el('select', { id: 'dream-of' }, el('option', { value: '' }, '— not tied to a prophecy —'), prophecies.map((p) => el('option', { value: p.id }, p.name))) : null;
  const go = el('button', { class: 'btn primary', type: 'submit' }, 'Send the dream');
  const form = el('form', { class: 'dialog-body', method: 'dialog' }, el('h2', { id: 'dream-title' }, `A dream for ${c.name}`),
    el('p', { class: 'muted small' }, `Only ${c.name}’s player and the GMs will see it.`),
    el('div', { class: 'field' }, el('label', { for: 'dream-name' }, 'Title'), name),
    el('div', { class: 'field' }, el('label', { for: 'dream-text' }, 'The dream'), text),
    of ? el('div', { class: 'field' }, el('label', { for: 'dream-of' }, 'A dream of'), of) : null,
    el('div', { class: 'btnrow' }, go, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Not now')));
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'dream-title' }, form);
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault(); if (!text.value.trim()) { text.focus(); return; }
    go.disabled = true;
    try {
      const h = await createEntry({ kind: 'handout', name: name.value.trim() || 'A dream', visibility: 'gm', summary: `A dream, sent to ${c.name}.`,
        fields: { from: 'A dream', text: text.value.trim(), dream_for: c.id }, links: [{ id: c.id, label: 'dreamed by' }, ...(of?.value ? [{ id: of.value, label: 'a dream of' }] : [])] });
      const r = await api('entries', { method: 'PATCH', body: { id: h.id, share: [c.owner_id] } });
      world.entries.set(r.entry.id, r.entry);
      toast(`Dream sent to ${c.name}`); d.close(); rerender();
    } catch (err) { toast(err.message, 'bad'); go.disabled = false; }
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal(); text.focus();
}

// Dreams on the character page (for its player and the GMs, who are the ones the server sends them to).
export function dreamsSection(c, rerender) {
  if (c.kind !== 'character') return null;
  const ds = dreamsOf(c), gm = isGm();
  if (!ds.length && !(gm && c.owner_id)) return null;
  return el('section', { class: 'card dreams' }, el('div', { class: 'entry-head' }, el('h3', {}, `🌙 Dreams${ds.length ? ` (${ds.length})` : ''}`),
    gm && c.owner_id ? el('button', { class: 'btn small dream-send', type: 'button', onclick: () => sendDialog(c, rerender) }, 'Send a dream…') : null),
    ds.length ? el('ul', { class: 'plain dream-list' }, ds.map((h) => el('li', {}, link(h), el('span', { class: 'muted small' }, ` · ${when(h.created_at)}`),
      h.fields?.text ? el('div', { class: 'small dream-text' }, richText(String(h.fields.text).slice(0, 400))) : null)))
      : el('p', { class: 'muted small' }, 'No dreams yet.'));
}

// Dreams of a prophecy: on its page, for GMs, who has dreamed of it.
export function dreamersLine(p) {
  if (!isProphecy(p) || !isGm()) return null;
  const ds = allDreams().filter((h) => (h.links || []).some((l) => l.id === p.id));
  if (!ds.length) return null;
  return el('p', { class: 'small dreamers-line' }, '🌙 Dreamed of by ', ds.map((h, i) => { const c = getEntry(h.fields.dream_for); return [i ? ', ' : '', c ? link(c) : 'someone', ' (', link(h, 'the dream'), ')']; }), '.');
}
