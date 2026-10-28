// Copy a place with what's in it (GMs): a second village built like the first. Asks for the new name, whether to
// bring the people, shops and places inside, and whether to hide the copies; then makes them, inside each other.
import { el, toast } from './dom.js';
import { world, worldEntries, createEntries, patchEntry, getEntry, kindLabel } from './world-store.js';
import { copyLevels, copyOf, contentsCount } from './copy-place.js';

export function copyPlaceDialog(place, plainCopy) {
  const levels = copyLevels(place, worldEntries());
  const counts = contentsCount(levels);
  const n = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!n) { plainCopy(); return; }
  const name = el('input', { type: 'text', id: 'cp-name', value: `${place.name} (copy)`, maxlength: 200 });
  const bring = el('input', { type: 'checkbox', id: 'cp-bring', checked: true });
  const hide = el('input', { type: 'checkbox', id: 'cp-hide', checked: true });
  const status = el('p', { class: 'form-status', role: 'status' });
  const what = Object.entries(counts).map(([k, c]) => `${c} ${c === 1 ? kindLabel(k) : (k === 'npc' ? 'NPCs' : `${kindLabel(k)}s`)}`).join(', ');
  const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'cp-title' }, el('form', { class: 'dialog-body', method: 'dialog' },
    el('h2', { id: 'cp-title' }, `Copy ${place.name}`),
    el('div', { class: 'field' }, el('label', { for: 'cp-name' }, 'Name of the copy'), name),
    el('label', { class: 'check', for: 'cp-bring' }, bring, ` Bring what’s inside (${what})`),
    el('label', { class: 'check', for: 'cp-hide' }, hide, ' Hide the copies from players for now'),
    el('p', { class: 'muted small' }, 'Copies keep their names (rename them afterwards), get the tag “copied”, and leave behind play state, galleries and player characters. Connections between copied entries point at the copies.'),
    status,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Make the copy'), el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
  d.querySelector('form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!bring.checked) { d.close(); plainCopy(name.value.trim()); return; }
    const made = new Map(), pairs = [];
    try {
      for (const [depth, level] of levels.entries()) {
        for (let i = 0; i < level.length; i += 25) {
          status.textContent = `Copying… ${made.size} of ${n + 1}`; status.className = 'form-status';
          const chunk = level.slice(i, i + 25);
          const out = await createEntries(chunk.map((e) => copyOf(e, made, { name: depth === 0 ? name.value.trim() || `${place.name} (copy)` : e.name, hide: hide.checked })));
          out.forEach((x, j) => { made.set(chunk[j].id, x.id); pairs.push([chunk[j], x]); });
        }
      }
      // Links to copies made later than the entry that points at them.
      for (const [orig, copy] of pairs) {
        const want = copyOf(orig, made).links;
        if (JSON.stringify(want) !== JSON.stringify(copy.links || [])) await patchEntry(getEntry(copy.id) || copy, { links: want });
      }
      toast(`Made ${made.size} entries: ${name.value.trim() || place.name} and what’s inside`);
      d.close(); location.hash = `world/e/${made.get(place.id)}`;
    } catch (err) { status.textContent = `${err.message} (${made.size} were made before this)`; status.className = 'form-status error'; }
  });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); d.showModal(); name.select();
}
