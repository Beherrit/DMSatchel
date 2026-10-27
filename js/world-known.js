// What a character knows: players (and GMs) mark entries their character has met, seen or been told about, with
// a note in the character's words. A button on every entry page; a list on the character's page.
import { el, toast } from './dom.js';
import { session, isGm } from './api.js';
import { worldEntries, getEntry, link, kindLabel, patchEntry, byName } from './world-store.js';
import { KIND_ORDER, KINDS } from './world-schema.js';

export const knownOf = (c) => { try { return JSON.parse(c.fields?.known || '{}') || {}; } catch { return {}; } };

// Characters this viewer can update: their own, or any for a GM. Active ones first.
export function myCharacters() {
  return worldEntries().filter((e) => e.kind === 'character' && (e.owner_id === session.gm?.id || (isGm() && e.can_edit)))
    .sort((a, b) => (a.owner_id === session.gm?.id ? 0 : 1) - (b.owner_id === session.gm?.id ? 0 : 1) || byName(a, b));
}

async function setKnown(c, id, note) {
  const k = knownOf(c);
  if (note === null) delete k[id]; else k[id] = String(note).slice(0, 500);
  await patchEntry(getEntry(c.id), { fields: { known: JSON.stringify(k) } });
}

// The "knows this" buttons on an entry page (only your own characters; GMs only when they play one).
export function knowsButtons(e, rerender) {
  if (e.kind === 'character' || e.kind === 'session') return null;
  const mine = myCharacters().filter((c) => c.owner_id === session.gm?.id);
  if (!mine.length) return null;
  return el('div', { class: 'knows' }, mine.map((c) => {
    const known = e.id in knownOf(c);
    return el('button', { class: 'chip-btn small', type: 'button', 'aria-pressed': String(known), title: known ? `${c.name} knows about this` : `Mark that ${c.name} knows about this`,
      onclick: async () => { try { await setKnown(c, e.id, known ? null : ''); toast(known ? `${c.name} forgot ${e.name}` : `${c.name} knows ${e.name}`); rerender(); } catch (err) { toast(err.message, 'bad'); } } },
    `${known ? '★' : '☆'} ${c.name} knows this`);
  }));
}

// The list on a character's page.
export function knownSection(c, rerender) {
  const k = knownOf(c);
  const items = Object.keys(k).map((id) => getEntry(id)).filter(Boolean);
  if (!items.length && !c.can_edit) return null;
  const groups = KIND_ORDER.map((kind) => [kind, items.filter((e) => e.kind === kind).sort(byName)]).filter(([, l]) => l.length);
  return el('section', { class: 'card known-card' },
    el('h3', {}, `What ${c.name} knows`),
    items.length ? groups.map(([kind, list]) => el('div', { class: 'known-group' }, el('h4', {}, KINDS[kind].plural),
      el('ul', { class: 'plain known-list' }, list.map((e) => {
        const note = el('input', { type: 'text', value: k[e.id] || '', placeholder: c.can_edit ? 'In their words: what they know or suspect…' : '', readonly: c.can_edit ? null : true, 'aria-label': `What ${c.name} knows about ${e.name}` });
        note.addEventListener('change', async () => { try { await setKnown(getEntry(c.id), e.id, note.value); toast('Noted'); } catch (err) { toast(err.message, 'bad'); } });
        return el('li', {}, link(e), el('span', { class: 'kind-tag' }, kindLabel(e.kind)), note);
      }))))
      : el('p', { class: 'muted small' }, `Nothing yet. On any page in the world, press “☆ ${c.name} knows this” to add it here.`));
}
