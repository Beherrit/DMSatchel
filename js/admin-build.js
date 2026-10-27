// The Build console (quick creation of any world entry) and the Pins manager, shown on the Admin page.
import { el, toast, setKids, confirmButton } from './dom.js';
import { api } from './api.js';
import { KINDS, PLACE_KINDS } from './world-schema.js';
import { world, worldEntries, getEntry, findByName, byName, kindLabel, link, when, createEntry } from './world-store.js';
import { npcDraft, questDraft, tavernDraft, shopDraft, settlementDraft, areaDraft, orgDraft } from './generators.js';
import { PIN_ICONS } from './world-maps.js';
import { regionName } from './names.js';
import { makeRng } from './rng.js';

const rr = makeRng(Date.now() ^ 0xb11d);
// What the console can make: [id, label, kind, random-draft maker or null, extra defaults]
const TYPES = [
  ['quest', 'Quest', 'quest', (p) => questDraft(p, 0)],
  ['keynpc', 'Key NPC', 'npc', (p) => npcDraft(p), { tags: ['key'] }],
  ['npc', 'NPC', 'npc', (p) => npcDraft(p)],
  ['faction', 'Faction', 'faction', (p) => orgDraft(p, 'faction')],
  ['guild', 'Guild', 'guild', (p) => orgDraft(p, 'guild')],
  ['clan', 'Clan / House', 'clan', (p) => orgDraft(p, 'clan')],
  ['region', 'Region', 'region', () => ({ kind: 'region', name: regionName(rr), fields: {} })],
  ['area', 'Area', 'area', (p) => areaDraft(p)],
  ['settlement', 'Town / City', 'settlement', (p) => settlementDraft(p)],
  ['location', 'Location', 'location', (p) => (rr.chance(0.5) ? tavernDraft(p) : shopDraft(p))],
  ['deity', 'Deity', 'deity', null],
  ['item', 'Item', 'item', null],
  ['event', 'Event', 'event', null],
  ['lore', 'Lore', 'lore', null],
];
let current = 'quest';
const madeHere = [];

function placeOptions(id) {
  return el('datalist', { id }, worldEntries().filter((e) => PLACE_KINDS.includes(e.kind)).sort(byName).map((e) => el('option', { value: e.name }, e.fields?.type || e.fields?.size || kindLabel(e.kind))));
}

export function buildSection() {
  const box = el('section', { class: 'card build' });
  const status = el('p', { class: 'form-status', role: 'status' });
  const recent = el('div', { class: 'build-recent' });

  function render(prefill) {
    const [, label, kind, maker, extra = {}] = TYPES.find(([id]) => id === current);
    const d = prefill || { kind, name: '', summary: '', fields: {}, secret: '', tags: extra.tags || [], parent_id: null };
    if (!d.fields?.status) d.fields = { ...(d.fields || {}), ...(kind === 'quest' ? { status: 'Available' } : kind === 'npc' ? { status: 'Alive' } : {}) };
    const parent = d.parent_id && getEntry(d.parent_id);
    const chips = el('div', { class: 'type-chips', role: 'group', 'aria-label': 'What to add' }, TYPES.map(([id, t]) =>
      el('button', { type: 'button', class: 'chip-btn', 'aria-pressed': String(id === current), onclick: () => { current = id; render(); } }, t)));
    const fieldEls = KINDS[kind].fields.map(([k, l, type, opts]) => {
      const v = d.fields?.[k] || '';
      if (type === 'hidden') return null;
      if (type === 'select') {
        const s = el('select', { id: `b-${k}`, 'data-field': k }, el('option', { value: '' }, '—'), opts.map((o) => el('option', { value: o }, o)));
        s.value = opts.includes(v) ? v : '';
        return el('div', { class: 'field' }, el('label', { for: `b-${k}` }, l), s);
      }
      return type === 'long'
        ? el('div', { class: 'field wide' }, el('label', { for: `b-${k}` }, l), el('textarea', { id: `b-${k}`, 'data-field': k, rows: 2 }, v))
        : el('div', { class: 'field' }, el('label', { for: `b-${k}` }, l), el('input', { type: 'text', id: `b-${k}`, 'data-field': k, value: v }));
    });
    const mapSel = PLACE_KINDS.includes(kind) && (world.maps || []).length
      ? el('select', { id: 'b-map', 'aria-label': 'Pin on a map after saving' }, el('option', { value: '' }, 'Don’t pin it yet'), world.maps.map((m) => el('option', { value: m.id }, `Pin it on ${m.name}`)))
      : null;
    const keyBox = kind === 'npc' ? el('label', { class: 'check' }, el('input', { type: 'checkbox', id: 'b-key', checked: (d.tags || []).includes('key') || null }), ' Key NPC (shows on the world’s front page and first in each town)') : null;
    const form = el('form', { class: 'edit-form build-form', autocomplete: 'off' },
      el('div', { class: 'edit-grid' },
        el('div', { class: 'field' }, el('label', { for: 'b-name' }, 'Name'), el('div', { class: 'name-row' }, el('input', { type: 'text', id: 'b-name', value: d.name, required: true, placeholder: `Name of the ${label.toLowerCase()}` }),
          maker ? el('button', { class: 'btn small', type: 'button', title: 'Fill everything in at random', onclick: () => {
            const p = findByName(form.querySelector('#b-parent').value);
            const draft = maker(p && PLACE_KINDS.includes(p.kind) ? p : null);
            draft.tags = [...new Set([...(draft.tags || []), ...(extra.tags || []), ...(form.querySelector('#b-key')?.checked ? ['key'] : [])])];
            render(draft);
          } }, 'Random') : null)),
        el('div', { class: 'field' }, el('label', { for: 'b-parent' }, kind === 'quest' ? 'Posted in (town or place)' : kind === 'npc' ? 'Lives in' : 'Located in / part of'),
          el('input', { type: 'text', id: 'b-parent', list: 'b-places', value: parent?.name || '', placeholder: 'Pick a place (optional)' }))),
      el('div', { class: 'field wide' }, el('label', { for: 'b-summary' }, 'Summary'), el('textarea', { id: 'b-summary', rows: 2 }, d.summary || '')),
      el('div', { class: 'edit-fields' }, fieldEls),
      el('div', { class: 'field wide' }, el('label', { for: 'b-body' }, 'Notes'), el('textarea', { id: 'b-body', rows: 3, placeholder: 'Anything else. [[Entry names]] become links.' }, d.body || '')),
      el('div', { class: 'field wide' }, el('label', { for: 'b-secret' }, 'GM-only secret'), el('textarea', { id: 'b-secret', rows: 2 }, d.secret || '')),
      el('div', { class: 'edit-grid' }, el('div', { class: 'field' }, el('label', { for: 'b-tags' }, 'Tags'), el('input', { type: 'text', id: 'b-tags', value: (d.tags || []).filter((t) => t !== 'key').join(', '), placeholder: 'comma separated' })),
        mapSel ? el('div', { class: 'field' }, el('label', { for: 'b-map' }, 'Map'), mapSel) : null),
      keyBox, placeOptions('b-places'), status,
      el('div', { class: 'btnrow' },
        el('button', { class: 'btn primary', type: 'submit', value: 'again' }, 'Save & add another'),
        el('button', { class: 'btn', type: 'submit', value: 'open' }, 'Save & open'),
        el('button', { class: 'btn ghost', type: 'button', onclick: () => render() }, 'Clear')));
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const how = ev.submitter?.value || 'again';
      const parentName = form.querySelector('#b-parent').value.trim();
      const p = parentName ? findByName(parentName) : null;
      if (parentName && !p) { status.textContent = `There’s no place called “${parentName}”. Create it first, or leave that blank.`; status.className = 'form-status error'; return; }
      const fields = {};
      for (const f of form.querySelectorAll('[data-field]')) if (f.value.trim()) fields[f.dataset.field] = f.value.trim();
      const tags = form.querySelector('#b-tags').value.split(',').map((t) => t.trim()).filter(Boolean);
      if (form.querySelector('#b-key')?.checked) tags.push('key');
      const entry = { kind, name: form.querySelector('#b-name').value.trim(), summary: form.querySelector('#b-summary').value, body: form.querySelector('#b-body').value, secret: form.querySelector('#b-secret').value, fields, tags, links: [], parent_id: p?.id || null };
      if (!entry.name) { status.textContent = 'Give it a name.'; status.className = 'form-status error'; return; }
      status.textContent = 'Saving…'; status.className = 'form-status';
      try {
        const made = await createEntry(entry);
        madeHere.unshift(made);
        toast(`Saved ${made.name}`);
        const mapId = form.querySelector('#b-map')?.value;
        if (mapId) { location.hash = `world/map/${mapId}/place:${made.id}`; return; }
        if (how === 'open') { location.hash = `world/e/${made.id}`; return; }
        // Keep the place so the next one lands in the same town.
        render({ kind, name: '', summary: '', fields: {}, secret: '', tags: extra.tags || [], parent_id: made.parent_id });
        form.ownerDocument.getElementById('b-name')?.focus();
        drawRecent();
      } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
    });
    setKids(box, el('div', { class: 'entry-head' }, el('h3', {}, 'Build'), el('span', { class: 'muted small' }, 'Add anything to the world. “Random” fills the whole form; change what you like before saving.')),
      chips, form, recent);
    drawRecent();
  }

  function drawRecent() {
    const list = madeHere.length ? madeHere.filter((e) => getEntry(e.id)).map((e) => getEntry(e.id))
      : worldEntries().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 12);
    setKids(recent, list.length ? [el('h4', {}, madeHere.length ? 'Added just now' : 'Recently added'),
      el('ul', { class: 'entry-list' }, list.slice(0, 20).map((e) => el('li', {}, link(e), el('span', { class: 'kind-tag' }, (e.tags || []).includes('key') ? 'Key NPC' : kindLabel(e.kind)),
        getEntry(e.parent_id) ? el('span', { class: 'muted small' }, 'in ', link(getEntry(e.parent_id))) : null,
        el('span', { class: 'muted small' }, when(e.created_at)),
        el('a', { class: 'btn small ghost', href: `#world/edit/${e.id}` }, 'Edit'))))] : null);
  }

  render();
  return box;
}

// ---- pins manager ------------------------------------------------------------------------------

export function pinsSection() {
  const box = el('section', { class: 'card pins-admin' });
  async function saveMap(m, pins, msg) {
    try {
      const r = await api('maps', { method: 'PUT', query: { id: m.id }, body: { map: { pins, version: m.version } } });
      const i = world.maps.findIndex((x) => x.id === m.id); world.maps[i] = r.map;
      toast(msg); draw();
    } catch (err) { toast(err.message, 'bad'); }
  }
  function draw() {
    const maps = world.maps || [];
    const pinned = new Set(maps.flatMap((m) => (m.pins || []).map((p) => p.entry_id)).filter(Boolean));
    const unpinned = worldEntries().filter((e) => PLACE_KINDS.includes(e.kind) && !pinned.has(e.id)).sort(byName);
    setKids(box,
      el('div', { class: 'entry-head' }, el('h3', {}, 'Map pins'), el('a', { class: 'btn small', href: '#world/maps' }, maps.length ? 'Add a map' : 'Upload your first map')),
      !maps.length ? el('p', { class: 'muted' }, 'Upload a map on the Maps page, then manage every pin here.') : null,
      maps.map((m) => el('details', { class: 'pin-map', open: maps.length < 3 || null },
        el('summary', {}, el('strong', {}, m.name), el('span', { class: 'muted small' }, ` ${(m.pins || []).length} pins`)),
        el('div', { class: 'btnrow' }, el('a', { class: 'btn small primary', href: `#world/map/${m.id}/add` }, '+ Custom pin'), el('a', { class: 'btn small ghost', href: `#world/map/${m.id}` }, 'Open map')),
        (m.pins || []).length ? el('div', { class: 'table-wrap' }, el('table', {},
          el('thead', {}, el('tr', {}, ['Marker', 'Label', 'Linked entry', 'GM only', ''].map((h) => el('th', {}, h)))),
          el('tbody', {}, m.pins.map((p) => {
            const icon = el('select', { 'aria-label': 'Marker' }, Object.entries(PIN_ICONS).map(([k, [t, g]]) => el('option', { value: k }, `${g} ${t}`))); icon.value = p.icon || 'poi';
            const label = el('input', { type: 'text', value: p.label || '', 'aria-label': 'Label' });
            const ent = el('input', { type: 'text', list: 'pins-names', value: getEntry(p.entry_id)?.name || '', placeholder: 'Not linked', 'aria-label': 'Linked entry' });
            const sec = el('input', { type: 'checkbox', checked: p.secret || null, 'aria-label': 'GM only' });
            const save = () => {
              const target = ent.value.trim() ? findByName(ent.value) : null;
              if (ent.value.trim() && !target) { toast(`No entry called “${ent.value}”.`, 'bad'); return; }
              saveMap(m, m.pins.map((x) => (x.id === p.id ? { ...x, icon: icon.value, label: label.value.trim() || target?.name || 'Pin', entry_id: target?.id || null, secret: sec.checked } : x)), 'Pin saved');
            };
            return el('tr', {}, el('td', {}, icon), el('td', {}, label), el('td', {}, ent), el('td', {}, sec),
              el('td', {}, el('div', { class: 'actions' }, el('button', { class: 'btn small', type: 'button', onclick: save }, 'Save'),
                el('a', { class: 'btn small ghost', href: `#world/map/${m.id}/${p.id}` }, 'Show'),
                confirmButton('Delete', () => saveMap(m, m.pins.filter((x) => x.id !== p.id), 'Pin deleted')))));
          })))) : el('p', { class: 'muted small' }, 'No pins on this map yet.'))),
      maps.length && unpinned.length ? el('div', {}, el('h4', {}, `Places not on any map (${unpinned.length})`),
        el('ul', { class: 'entry-list' }, unpinned.slice(0, 60).map((e) => el('li', {}, link(e), el('span', { class: 'kind-tag' }, e.fields?.type || e.fields?.size || kindLabel(e.kind)),
          maps.map((m) => el('a', { class: 'btn small ghost', href: `#world/map/${m.id}/place:${e.id}` }, `Pin on ${m.name}`)))))) : null,
      el('datalist', { id: 'pins-names' }, worldEntries().sort(byName).map((e) => el('option', { value: e.name }, kindLabel(e.kind)))));
  }
  draw();
  return box;
}

