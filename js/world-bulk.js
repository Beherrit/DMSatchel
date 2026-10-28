// Bulk actions (GMs): "Select" on an entry list or search results puts a tick box on each entry and a bar with
// Reveal, Hide, Add or remove a tag, and Move into a place. The selection survives the redraw after each action,
// so several changes can be made to the same entries.
import { el, toast } from './dom.js';
import { api, isGm } from './api.js';
import { world, worldEntries, byName } from './world-store.js';
import { PLACE_KINDS } from './world-schema.js';
import { cleanTag, movable } from './bulk.js';

let state = null; // { hash, ids: Set }

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function bulkControls(list, container) {
  if (!isGm() || list.length < 2) return { button: null, bar: null };
  const ids = new Set(list.map((e) => e.id));
  const count = el('span', { class: 'bulk-count', role: 'status' });
  const tagIn = el('input', { type: 'text', list: 'bulk-tags', placeholder: 'tag', 'aria-label': 'Tag', size: 10 });
  const places = worldEntries().filter((e) => PLACE_KINDS.includes(e.kind)).sort(byName);
  const moveTo = el('select', { 'aria-label': 'Move into' }, el('option', { value: '' }, 'Move into…'), places.map((p) => el('option', { value: p.id }, p.name)), el('option', { value: '-' }, 'Out of any place'));
  const act = (label, fn, cls = 'btn small') => el('button', { class: cls, type: 'button', onclick: fn }, label);
  const bar = el('div', { class: 'bulk-bar', hidden: true, role: 'region', 'aria-label': 'Change the selected entries' },
    count, act('All / none', () => { const all = picked().length === boxes().length; boxes().forEach((b) => { b.checked = !all; }); sync(); }, 'btn small ghost'),
    el('span', { class: 'bulk-group' }, act('Reveal', () => send({ visibility: 'all' }, 'Revealed')), act('Hide', () => send({ visibility: 'gm' }, 'Hid'))),
    el('span', { class: 'bulk-group' }, tagIn, act('Add tag', () => tag('add_tag')), act('Remove tag', () => tag('remove_tag')),
      el('datalist', { id: 'bulk-tags' }, [...new Set(worldEntries().flatMap((e) => e.tags || []))].sort().map((t) => el('option', { value: t })))),
    el('span', { class: 'bulk-group' }, moveTo, act('Move', move)),
    act('Done', off, 'btn small ghost'));
  const button = el('button', { class: 'btn', type: 'button', 'aria-pressed': 'false', onclick: () => (state ? off() : on(new Set())) }, 'Select');

  const boxes = () => [...container.querySelectorAll('input.bulk-pick')];
  const picked = () => boxes().filter((b) => b.checked).map((b) => b.value);
  function sync() {
    const n = picked().length;
    count.textContent = `${n} of ${boxes().length} selected`;
    if (state) state.ids = new Set(picked());
    bar.querySelectorAll('.bulk-group button').forEach((b) => { b.disabled = !n; });
  }
  function on(keep) {
    state = { hash: location.hash, ids: keep };
    for (const li of container.querySelectorAll('li[data-id]')) {
      if (!ids.has(li.dataset.id) || li.querySelector('.bulk-pick')) continue;
      const e = world.entries.get(li.dataset.id);
      const b = el('input', { type: 'checkbox', class: 'bulk-pick', value: li.dataset.id, 'aria-label': `Select ${e?.name || 'entry'}`, checked: keep.has(li.dataset.id) });
      b.addEventListener('change', sync);
      li.classList.add('picking'); li.prepend(el('label', { class: 'bulk-box' }, b));
    }
    bar.hidden = false; button.setAttribute('aria-pressed', 'true'); button.textContent = 'Stop selecting'; sync();
  }
  function off() {
    state = null;
    container.querySelectorAll('.bulk-box').forEach((x) => x.remove());
    container.querySelectorAll('.picking').forEach((x) => x.classList.remove('picking'));
    bar.hidden = true; button.setAttribute('aria-pressed', 'false'); button.textContent = 'Select';
  }
  async function send(body, verb, what = '', note = '') {
    const sel = picked();
    if (!sel.length) return;
    try {
      const r = await api('entries', { method: 'PATCH', body: { ids: sel, ...body } });
      for (const e of r.entries) world.entries.set(e.id, e);
      const n = r.entries.length, same = sel.length - n;
      toast(`${verb} ${plural(n, 'entry', 'entries')}${what}${note || (same ? ` (${same} already ${body.visibility ? (body.visibility === 'all' ? 'visible' : 'hidden') : 'that way'})` : '')}`);
      window.dispatchEvent(new Event('world:rerender'));
    } catch (err) { toast(err.message, 'bad'); }
  }
  function tag(key) {
    const t = cleanTag(tagIn.value);
    if (!t) { toast('Type a tag first'); tagIn.focus(); return; }
    send({ [key]: t }, key === 'add_tag' ? 'Tagged' : 'Untagged', ` #${t}`);
  }
  function move() {
    if (!moveTo.value) { toast('Pick a place to move them into'); moveTo.focus(); return; }
    const to = moveTo.value === '-' ? null : moveTo.value;
    const { stay } = movable(worldEntries(), picked(), to);
    const name = to ? world.entries.get(to)?.name : '';
    send({ move_to: to }, 'Moved', to ? ` into ${name}` : ' out of any place', stay.length ? `. ${stay.map((id) => world.entries.get(id)?.name).join(', ')} ${stay.length === 1 ? 'stays' : 'stay'} put (a place can’t go inside itself or anywhere within it)` : '');
  }

  if (state?.hash === location.hash) on(new Set([...state.ids].filter((id) => ids.has(id))));
  else state = null;
  return { button, bar };
}
