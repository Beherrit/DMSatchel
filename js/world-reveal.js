// Reveal a place and everything in it (GMs): one button on a place's page lists what's still hidden inside (people,
// sub-places, items, quests, its maps) with a tick box each, then reveals the ticked ones in one go.
import { el, toast } from './dom.js';
import { api, isGm } from './api.js';
import { world, descendantsOf, byName } from './world-store.js';
import { PLACE_KINDS, KIND_ORDER, KINDS } from './world-schema.js';

function hiddenInside(place) {
  const inside = descendantsOf(place.id).filter((e) => e.visibility === 'gm' && e.status !== 'suggested');
  const ids = new Set([place.id, ...descendantsOf(place.id).map((e) => e.id)]);
  const maps = (world.maps || []).filter((m) => m.secret && ids.has(m.entry_id));
  return { entries: [...(place.visibility === 'gm' ? [place] : []), ...inside], maps };
}

export function revealButton(place, rerender) {
  if (!isGm() || !PLACE_KINDS.includes(place.kind)) return null;
  const { entries, maps } = hiddenInside(place);
  const n = entries.length + maps.length;
  if (!n || (entries.length === 1 && !maps.length && entries[0].id === place.id)) return null;
  return el('button', { class: 'btn small', type: 'button', title: 'Reveal this place and what’s hidden inside it', onclick: () => openDialog(place, rerender) }, `Reveal with contents (${n})`);
}

function openDialog(place, rerender) {
  const { entries, maps } = hiddenInside(place);
  const boxes = [];
  const item = (label, sub, value) => { const b = el('input', { type: 'checkbox', checked: true, value }); boxes.push(b); return el('li', {}, el('label', { class: 'check' }, b, ' ', label, sub ? el('span', { class: 'muted small' }, ` ${sub}`) : null)); };
  const groups = KIND_ORDER.map((k) => [k, entries.filter((e) => e.kind === k).sort(byName)]).filter(([, l]) => l.length);
  const count = el('span', { class: 'muted small', role: 'status' });
  const recount = () => { count.textContent = `${boxes.filter((b) => b.checked).length} of ${boxes.length} ticked`; };
  const d = el('dialog', { class: 'dialog reveal-dialog', 'aria-labelledby': 'reveal-title' }, el('div', { class: 'dialog-body' },
    el('h2', { id: 'reveal-title' }, `Reveal ${place.name}`),
    el('p', { class: 'muted small' }, 'Everything ticked becomes visible to players. Untick anything the party hasn’t found yet.'),
    el('div', { class: 'reveal-groups' },
      groups.map(([k, l]) => el('div', {}, el('h4', {}, `${KINDS[k].plural} (${l.length})`), el('ul', { class: 'plain' }, l.map((e) => item(e.name, e.id === place.id ? '(the place itself)' : e.fields?.role || '', `e:${e.id}`))))),
      maps.length ? el('div', {}, el('h4', {}, `Maps (${maps.length})`), el('ul', { class: 'plain' }, maps.map((m) => item(m.name, '', `m:${m.id}`)))) : null),
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => { boxes.forEach((b) => { b.checked = !boxes.every((x) => x.checked); }); recount(); } }, 'All / none'), count),
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: go }, 'Reveal'), el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
  d.addEventListener('change', recount);
  d.addEventListener('close', () => d.remove());
  document.body.append(d); recount(); d.showModal();

  async function go() {
    const picked = boxes.filter((b) => b.checked).map((b) => b.value);
    const ids = picked.filter((v) => v.startsWith('e:')).map((v) => v.slice(2)), mapIds = picked.filter((v) => v.startsWith('m:')).map((v) => v.slice(2));
    if (!picked.length) { d.close(); return; }
    try {
      if (ids.length) { const r = await api('entries', { method: 'PATCH', body: { ids, visibility: 'all' } }); for (const e of r.entries) world.entries.set(e.id, e); }
      for (const id of mapIds) {
        const m = (world.maps || []).find((x) => x.id === id);
        const r = await api('maps', { method: 'PUT', query: { id }, body: { map: { secret: false, version: m.version } } });
        Object.assign(m, r.map);
      }
      toast(`Revealed ${ids.length} entr${ids.length === 1 ? 'y' : 'ies'}${mapIds.length ? ` and ${mapIds.length} map${mapIds.length === 1 ? '' : 's'}` : ''}`);
      d.close(); rerender();
    } catch (err) { toast(err.message, 'bad'); }
  }
}
