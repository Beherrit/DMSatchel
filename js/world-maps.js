// World maps: upload a map, pan and zoom it, and pin entries to it.
// Routes: #world/maps · #world/map/<id> · #world/map/<id>/<pinId>
import { el, toast, confirmButton, setKids } from './dom.js';
import { api, isGm, isMember, mapImageUrl } from './api.js';
import { shrinkImage } from './dom.js';
import { travelText } from './encounters.js';
import { world, getEntry, findByName, link, kindLabel, notice, nameList, whenTime, createEntry, mapsOf, trail } from './world-store.js';
import { KINDS, PLACE_KINDS, pinIconFor } from './world-schema.js';
import { placeDrawer } from './world-place.js';
import { randomTownName, areaDraft } from './generators.js';
import { fogGrid, newFog, encodeFog, decodeFog, paintFog, hiddenShare } from './fog.js';
import { partyPin } from './party-pin.js';
import { routeMiles, milesText, travelDayOptions } from './map-route.js';
import { travel } from './encounters.js';
import { worldCalendar, todayText, daysPassed } from './world-calendar.js';
import { advance, formatDate, today } from './calendar.js';
import { journeyOnMap } from './journey.js';
import { controllers, powerSlots } from './control.js';
import { journey, chainOf, notePartyMove } from './world-journey.js';

// The party's place, then each place above it (for the party token).
const partyChain = () => { const at = world.info?.party_at && getEntry(world.info.party_at); return at ? [at.id, ...trail(at).reverse().map((p) => p.id)] : []; };

// GMs: the party is here now (saved as session prep's location).
async function setPartyAt(entry) {
  try {
    const r = await api('settings', { method: 'PATCH', body: { prep: { location_id: entry.id } } });
    if (world.info?.party_at !== r.prep.location_id) notePartyMove(r.prep.location_id);
    world.info = { ...world.info, party_at: r.prep.location_id };
    toast(`The party is in ${entry.name}`);
  } catch (err) { toast(err.message, 'bad'); }
}

export const PIN_ICONS = { region: ['Region', '⬢'], area: ['Area', '◍'], city: ['City', '■'], town: ['Town', '●'], port: ['Port', '◗'], dungeon: ['Dungeon', '▼'], temple: ['Temple', '✚'], camp: ['Camp', '▲'], danger: ['Danger', '✕'], poi: ['Point of interest', '◆'] };
const imageUrl = mapImageUrl;

export function pinsFor(entryId) {
  const out = [];
  for (const map of world.maps || []) for (const pin of map.pins || []) if (pin.entry_id === entryId) out.push({ map, pin });
  return out;
}

const shrink = (file) => shrinkImage(file);

function imageSize(url) {
  return new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve({ width: i.naturalWidth, height: i.naturalHeight }); i.onerror = () => reject(new Error('That link didn’t load as an image.')); i.src = url; });
}

function newMapForm() {
  const status = el('p', { class: 'form-status', role: 'status' });
  const file = el('input', { type: 'file', id: 'm-file', accept: 'image/*' });
  const form = el('form', { class: 'card edit-form' },
    el('h3', {}, 'Add a map'),
    el('div', { class: 'edit-grid' },
      el('div', { class: 'field' }, el('label', { for: 'm-name' }, 'Name'), el('input', { type: 'text', id: 'm-name', required: true, placeholder: 'e.g. The Sable Marches' })),
      el('div', { class: 'field' }, el('label', { for: 'm-entry' }, 'Map of (optional)'), el('input', { type: 'text', id: 'm-entry', list: 'w-names', placeholder: 'A region or city entry' }))),
    el('div', { class: 'edit-grid' },
      el('div', { class: 'field' }, el('label', { for: 'm-file' }, 'Upload an image'), file),
      el('div', { class: 'field' }, el('label', { for: 'm-url' }, 'Or paste an image link'), el('input', { type: 'text', id: 'm-url', placeholder: 'https://…' }))),
    el('label', { class: 'check' }, el('input', { type: 'checkbox', id: 'm-secret' }), ' GM only (players can’t see this map)'),
    nameList(), status, el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Add map')));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = form.querySelector('#m-name').value.trim();
    const url = form.querySelector('#m-url').value.trim();
    const entryName = form.querySelector('#m-entry').value.trim();
    const entry = entryName ? findByName(entryName) : null;
    if (entryName && !entry) { status.textContent = `There’s no entry called “${entryName}”.`; status.className = 'form-status error'; return; }
    try {
      let image, width, height;
      if (file.files[0]) { status.textContent = 'Preparing the image…'; ({ data: image, width, height } = await shrink(file.files[0])); }
      else if (url) { ({ width, height } = await imageSize(url)); image = url; }
      else throw new Error('Choose an image file or paste a link.');
      status.textContent = 'Uploading…'; status.className = 'form-status';
      const r = await api('maps', { method: 'POST', body: { map: { name, image, width, height, entry_id: entry?.id || null, secret: form.querySelector('#m-secret').checked } } });
      world.maps = [...(world.maps || []), r.map];
      location.hash = `world/map/${r.map.id}`;
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return form;
}

export function viewMaps() {
  const maps = world.maps || [];
  return el('div', { class: 'w-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Maps'), el('p', {}, 'The world, its cities and dungeons. Pins link to entries; GM-only pins stay hidden from players.')),
    maps.length ? el('ul', { class: 'map-grid' }, maps.map((m) => el('li', {}, el('a', { class: 'map-card', href: `#world/map/${m.id}` },
      el('img', { src: imageUrl(m), alt: '', loading: 'lazy' }),
      el('span', { class: 'map-card-name' }, m.name, m.secret ? el('span', { class: 'tag' }, 'GM only') : null),
      el('span', { class: 'muted small' }, `${(m.pins || []).length} pins${m.entry_id && getEntry(m.entry_id) ? ` · ${getEntry(m.entry_id).name}` : ''}`)))))
      : notice('No maps yet', isGm() ? 'Upload a world map, then drop pins for cities, dungeons and anything else.' : 'The GMs haven’t added any maps yet.'),
    isGm() ? newMapForm() : null);
}

export async function viewMap(id, focusPin) {
  let map;
  let marks = [], partyMarks = [];
  try { const r = await api('maps', { query: { id } }); map = r.map; marks = r.mine || []; partyMarks = r.party || []; } catch (err) { return notice('Couldn’t open the map', err.message); }
  let marking = false;
  let measuring = false, route = [];
  const myBox = el('div', { class: 'my-marks' });
  let pins = map.pins || [];
  let scale = 1, tx = 0, ty = 0, adding = false, openPin = null;

  const viewport = el('div', { class: 'map-viewport', tabindex: '0', 'aria-label': `${map.name} map. Drag to pan, scroll or pinch to zoom.` });
  const stage = el('div', { class: 'map-stage' });
  const img = el('img', { src: imageUrl(map), alt: map.name, draggable: 'false' });
  const layer = el('div', { class: 'pin-layer' });
  const pop = el('div', { class: 'pin-pop', hidden: true });
  // Fog of war: one canvas pixel per cell, stretched over the map (the browser's smoothing softens the edges).
  const fogCanvas = el('canvas', { class: `fog-layer${isGm() ? ' gm' : ''}`, 'aria-hidden': 'true' });
  // The ruler's route, drawn over the map (coordinates in thousandths of the width; the height keeps the map's shape).
  const ratio = (map.height || 1) / (map.width || 1);
  const NS = 'http://www.w3.org/2000/svg';
  const routeSvg = document.createElementNS(NS, 'svg');
  routeSvg.setAttribute('class', 'route-layer'); routeSvg.setAttribute('viewBox', `0 0 1000 ${1000 * ratio}`); routeSvg.setAttribute('preserveAspectRatio', 'none'); routeSvg.setAttribute('aria-hidden', 'true');
  // Where the party has been: their stops on this map, joined up (under the ruler's route).
  const journeySvg = document.createElementNS(NS, 'svg');
  journeySvg.setAttribute('class', 'journey-layer'); journeySvg.setAttribute('viewBox', `0 0 1000 ${1000 * ratio}`); journeySvg.setAttribute('preserveAspectRatio', 'none'); journeySvg.setAttribute('aria-hidden', 'true');
  let showJourney = true;
  const journeyPoints = () => journeyOnMap(journey(), pins, chainOf);
  function drawJourney() {
    const pts = showJourney ? journeyPoints() : [];
    const node = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
    journeySvg.replaceChildren(...(pts.length > 1 ? [node('polyline', { points: pts.map((p) => `${p.x * 1000},${p.y * 1000 * ratio}`).join(' '), class: 'journey-line', 'vector-effect': 'non-scaling-stroke' })] : []),
      ...(pts.length > 1 ? pts.map((p) => node('circle', { cx: p.x * 1000, cy: p.y * 1000 * ratio, r: 4, class: 'journey-dot', 'vector-effect': 'non-scaling-stroke' })) : []));
    journeyBtn.hidden = journeyPoints().length < 2;
  }
  const journeyBtn = el('button', { class: 'btn small', type: 'button', 'aria-pressed': 'true', title: 'Show where the party has been on this map', onclick: () => { showJourney = !showJourney; journeyBtn.setAttribute('aria-pressed', String(showJourney)); drawJourney(); } }, 'Route so far');
  stage.append(img, fogCanvas, journeySvg, routeSvg, layer); viewport.append(stage, pop);
  const dims = map.fog ? { cols: map.fog.cols, rows: map.fog.rows } : fogGrid(map.width, map.height);
  let cells = map.fog ? decodeFog(map.fog.bits, dims.cols * dims.rows) : newFog(dims.cols, dims.rows, true);
  let fogOn = Boolean(map.fog?.on), fogMode = false, brush = 0, radius = 3, painting = false;
  function drawFog() {
    fogCanvas.hidden = !fogOn && !fogMode;
    fogCanvas.width = dims.cols; fogCanvas.height = dims.rows;
    const g = fogCanvas.getContext('2d'), data = g.createImageData(dims.cols, dims.rows);
    cells.forEach((v, i) => { if (v) data.data.set([34, 29, 24, 255], i * 4); });
    g.putImageData(data, 0, 0);
    if (fogInfo) fogInfo.textContent = `${Math.round(hiddenShare(cells) * 100)}% hidden${fogOn ? '' : ' · players can’t see the fog yet'}`;
  }
  function paintAt(ev) {
    const s = stage.getBoundingClientRect();
    if (paintFog(cells, dims.cols, dims.rows, (ev.clientX - s.left) / s.width, (ev.clientY - s.top) / s.height, radius, brush)) drawFog();
  }
  const saveFog = (msg) => save(pins, msg || 'Fog saved.', { fog: { on: fogOn, cols: dims.cols, rows: dims.rows, bits: encodeFog(cells) } });
  const list = el('ul', { class: 'pin-list' });
  const status = el('p', { class: 'form-status', role: 'status' });
  const filter = el('input', { type: 'search', placeholder: 'Find a pin…', 'aria-label': 'Find a pin' });

  const apply = () => { stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; layer.style.setProperty('--inv', String(1 / scale)); };
  function fit() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const w = map.width || img.naturalWidth || 1000, h = map.height || img.naturalHeight || 1000;
    stage.style.width = `${w}px`; stage.style.height = `${h}px`;
    scale = Math.min(vw / w, vh / h); tx = (vw - w * scale) / 2; ty = (vh - h * scale) / 2; apply();
  }
  function zoomAt(f, cx, cy) {
    const ns = Math.min(8, Math.max(0.05, scale * f));
    tx = cx - (cx - tx) * (ns / scale); ty = cy - (cy - ty) * (ns / scale); scale = ns; apply();
  }
  function centerOn(pin) {
    const w = parseFloat(stage.style.width), h = parseFloat(stage.style.height);
    scale = Math.max(scale, Math.min(viewport.clientWidth / w, viewport.clientHeight / h) * 2.5);
    tx = viewport.clientWidth / 2 - pin.x * w * scale; ty = viewport.clientHeight / 2 - pin.y * h * scale; apply();
  }

  async function save(nextPins, msg, extra = {}) {
    status.textContent = 'Saving…'; status.className = 'form-status';
    try {
      const r = await api('maps', { method: 'PUT', query: { id: map.id }, body: { map: { pins: nextPins, version: map.version, ...extra } } });
      map = r.map; pins = map.pins; status.textContent = msg || 'Saved.';
      const i = (world.maps || []).findIndex((m) => m.id === map.id); if (i >= 0) world.maps[i] = { ...map }; else world.maps = [...(world.maps || []), map];
      renderPins(); return true;
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; return false; }
  }

  function pinForm(pin, isNew) {
    const entry = pin.entry_id && getEntry(pin.entry_id);
    const iconSel = el('select', { id: 'p-icon' }, Object.entries(PIN_ICONS).map(([k, [t, g]]) => el('option', { value: k }, `${g} ${t}`)));
    iconSel.value = pin.icon || 'poi';
    let iconTouched = !isNew;
    iconSel.addEventListener('change', () => { iconTouched = true; });
    // A new pin can create its place in the same step.
    const newKind = el('select', { id: 'p-newkind', 'aria-label': 'Type of new entry' }, ['settlement', 'area', 'location', 'region', 'npc', 'quest', 'item', 'lore'].map((k) => el('option', { value: k }, KINDS[k].label)));
    const newName = el('input', { type: 'text', id: 'p-newname', placeholder: 'Name of the new place' });
    const dice = el('button', { class: 'btn small', type: 'button', title: 'Random name', 'aria-label': 'Random name', onclick: () => { newName.value = newKind.value === 'area' ? areaDraft(null).name : randomTownName(); } }, 'Random');
    newKind.addEventListener('change', () => { if (!iconTouched) iconSel.value = pinIconFor({ kind: newKind.value, fields: { size: 'Town' } }); });
    if (isNew && !iconTouched) iconSel.value = pinIconFor({ kind: 'settlement', fields: { size: 'Town' } });
    const createBox = isNew && isGm() ? el('fieldset', { class: 'pin-new' }, el('legend', {}, 'Or create a new entry here'),
      el('div', { class: 'pin-new-row' }, newKind, newName, dice)) : null;
    const form = el('form', { class: 'pin-form' },
      el('div', { class: 'field' }, el('label', { for: 'p-entry' }, isNew ? 'Link an existing entry' : 'Entry'), el('input', { type: 'text', id: 'p-entry', list: 'w-names', value: entry?.name || '', placeholder: 'Start typing a name…' })),
      createBox,
      el('div', { class: 'field' }, el('label', { for: 'p-label' }, 'Label'), el('input', { type: 'text', id: 'p-label', value: pin.label || '', placeholder: 'Shown on the map' })),
      el('div', { class: 'field' }, el('label', { for: 'p-icon' }, 'Marker'), iconSel),
      el('div', { class: 'field' }, el('label', { for: 'p-note' }, 'Note'), el('textarea', { id: 'p-note', rows: 2 }, pin.note || '')),
      el('label', { class: 'check' }, el('input', { type: 'checkbox', id: 'p-secret', checked: pin.secret || null }), ' GM only'),
      el('div', { class: 'btnrow' }, el('button', { class: 'btn primary small', type: 'submit' }, isNew ? 'Add pin' : 'Save pin'),
        el('button', { class: 'btn ghost small', type: 'button', onclick: () => closePop() }, 'Cancel'),
        isNew ? null : confirmButton('Delete', () => { save(pins.filter((p) => p.id !== pin.id), 'Pin deleted.'); closePop(); })));
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const en = form.querySelector('#p-entry').value.trim();
      let target = en ? findByName(en) : null;
      if (en && !target) { toast(`There’s no entry called “${en}”. Use “Or create a new entry here” to make it.`, 'bad'); return; }
      if (!target && newName.value.trim()) {
        try {
          const parent = map.entry_id && getEntry(map.entry_id);
          target = await createEntry({ kind: newKind.value, name: newName.value.trim(), parent_id: parent && PLACE_KINDS.includes(parent.kind) ? parent.id : null, fields: newKind.value === 'settlement' ? { size: 'Town' } : {} });
          toast(`Created ${target.name}`);
        } catch (err) { toast(err.message, 'bad'); return; }
      }
      if (target && !iconTouched) iconSel.value = pinIconFor(target);
      const next = { ...pin, entry_id: target?.id || null, label: form.querySelector('#p-label').value.trim() || target?.name || 'Pin', icon: iconSel.value, note: form.querySelector('#p-note').value, secret: form.querySelector('#p-secret').checked };
      save(isNew ? [...pins, next] : pins.map((p) => (p.id === pin.id ? next : p)), isNew ? 'Pin added.' : 'Pin saved.');
      closePop();
    });
    return form;
  }

  function placePop(pin) {
    if (pop.classList.contains('drawer')) { pop.style.left = ''; pop.style.top = ''; return; }
    const r = viewport.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const x = s.left - r.left + pin.x * s.width, y = s.top - r.top + pin.y * s.height;
    pop.style.left = `${Math.min(Math.max(8, x + 14), r.width - 300)}px`;
    pop.style.top = `${Math.min(Math.max(8, y - 10), Math.max(8, r.height - pop.offsetHeight - 8))}px`;
  }
  function showPin(pin, edit) {
    openPin = pin; pop.hidden = false;
    const entry = pin.entry_id && getEntry(pin.entry_id);
    if (edit) setKids(pop, pinForm(pin, !pins.includes(pin)));
    else {
      const subMaps = entry ? mapsOf(entry.id).filter((m) => m.id !== map.id) : [];
      setKids(pop,
        el('div', { class: 'entry-head' }, el('div', {}, el('div', { class: 'eyebrow' }, entry ? [kindLabel(entry.kind), entry.fields?.type || entry.fields?.size].filter(Boolean).join(' · ') : 'Pin'),
          el('strong', { class: 'drawer-title' }, entry ? link(entry, entry.name) : pin.label || 'Pin')),
          el('button', { class: 'reroll', type: 'button', 'aria-label': 'Close', onclick: () => closePop() }, '✕')),
        entry?.summary ? el('p', { class: 'small' }, entry.summary) : null,
        pin.note ? el('p', { class: 'small muted' }, pin.note) : null,
        pin.secret ? el('p', { class: 'tag' }, 'GM-only pin') : null,
        el('div', { class: 'btnrow' },
          entry ? el('a', { class: 'btn small primary', href: `#world/e/${entry.id}` }, 'Open page') : null,
          subMaps.map((m) => el('a', { class: 'btn small', href: `#world/map/${m.id}` }, `Open ${m.name}`)),
          isGm() ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => showPin(pin, true) }, 'Edit pin') : null,
          isGm() ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => startMove(pin) }, 'Move') : null,
          isGm() && entry && PLACE_KINDS.includes(entry.kind) && world.info?.party_at !== entry.id ? el('button', { class: 'btn small ghost', type: 'button', onclick: async () => { const from = map.miles && partyPin(pins, partyChain()); await setPartyAt(entry); renderPins(); showPin(pin); const to = partyPin(pins, partyChain()); if (from && to && from.pin.id !== to.pin.id) offerDaysPass(from.pin, to.pin); } }, '⚑ The party is here') : null),
        // How far from the party (when the map has a scale and the party is on it somewhere else).
        (() => { const at = map.miles && partyPin(pins, partyChain()); return at && at.pin.id !== pin.id ? el('p', { class: 'small from-party' }, el('span', { 'aria-hidden': 'true' }, '⚑ '), `From the party: ${travelText(milesBetween(at.pin, pin))}.`) : null; })(),
        map.miles && pins.length > 1 ? travelPicker(pin) : null,
        entry && PLACE_KINDS.includes(entry.kind) ? placeDrawer(entry, () => showPin(pin)) : null,
        !entry && isGm() ? el('p', { class: 'muted small' }, 'This pin isn’t linked to an entry yet. Use “Edit pin” to link one or create it.') : null);
    }
    pop.classList.toggle('drawer', !edit && Boolean(entry));
    placePop(pin);
    for (const b of layer.children) b.classList.toggle('active', b.dataset.id === pin.id);
  }
  // Distance on this map in miles (the scale is miles across the full width).
  const milesBetween = (a, b) => Math.hypot((a.x - b.x) * map.miles, (a.y - b.y) * map.miles * ((map.height || 1) / (map.width || 1)));
  function travelPicker(pin) {
    const out = el('p', { class: 'small travel-out' });
    const diff = el('input', { type: 'checkbox' });
    const sel = el('select', { 'aria-label': `Travel from ${pin.label} to` }, el('option', { value: '' }, 'Travel to…'),
      pins.filter((p) => p.id !== pin.id).sort((a, b) => String(a.label).localeCompare(String(b.label))).map((p) => el('option', { value: p.id }, p.label)));
    const show = () => { const to = pins.find((p) => p.id === sel.value); out.textContent = to ? `To ${to.label}: ${travelText(milesBetween(pin, to), { difficult: diff.checked })}.` : ''; };
    sel.addEventListener('change', show); diff.addEventListener('change', show);
    return el('div', { class: 'travel-pick' }, el('div', { class: 'controls' }, sel, el('label', { class: 'check' }, diff, ' Rough going')), out);
  }
  // Travel takes time: after the party moves on a scaled map, offer to move the calendar on by the journey.
  function offerDaysPass(a, b) {
    const cal = worldCalendar();
    const miles = milesBetween(a, b), opts = travelDayOptions(travel(miles));
    if (!cal || !opts.length) return;
    const dlg = el('dialog', { class: 'dialog', 'aria-labelledby': 'dp-title' }, el('div', { class: 'dialog-body' },
      el('h2', { id: 'dp-title' }, 'Move the calendar on?'),
      el('p', {}, `From ${a.label} to ${b.label} is ${milesText(miles)}. Today is ${todayText(cal)}.`),
      el('div', { class: 'btnrow' }, opts.map(([pace, days]) => el('button', { class: `btn${pace === 'Normal' ? ' primary' : ''}`, type: 'button', onclick: async () => {
        try {
          const r = await api('settings', { method: 'PATCH', body: { cal: advance(cal, days) } });
          world.info = { ...world.info, cal: r.cal };
          toast(`${days} day${days === 1 ? '' : 's'} pass: it’s now ${formatDate(r.cal, today(r.cal))}`); dlg.close(); daysPassed(days, { travel: true });
        } catch (err) { toast(err.message, 'bad'); }
      } }, `${days} day${days === 1 ? '' : 's'} (${pace.toLowerCase()} pace)`)),
        el('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close() }, 'Not now'))));
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg); dlg.showModal();
  }
  function closePop() { openPin = null; pop.hidden = true; for (const b of layer.children) b.classList.remove('active'); renderPins(); }

  let moving = null;
  function startMove(pin) { moving = pin; adding = false; closePop(); viewport.classList.add('placing'); status.textContent = `Click the map to move “${pin.label}”.`; status.className = 'form-status'; }

  // Your own markers: only you see them.
  function markDialog(mk) {
    const label = el('input', { type: 'text', id: 'mk-label', value: mk.label || '', maxlength: 80, placeholder: 'e.g. We camped here' });
    const note = el('textarea', { id: 'mk-note', rows: 3, placeholder: 'Anything to remember about this spot' }, mk.note || '');
    const shared = el('input', { type: 'checkbox', id: 'mk-shared', checked: Boolean(mk.shared) });
    const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'mk-title' }, el('div', { class: 'dialog-body' },
      el('h2', { id: 'mk-title' }, mk.id ? 'Your marker' : 'New marker'), el('p', { class: 'muted small' }, 'Only you can see your markers, unless you show one to the party.'),
      el('label', { for: 'mk-label' }, 'Label'), label, el('label', { for: 'mk-note' }, 'Note'), note,
      el('label', { class: 'check', for: 'mk-shared' }, shared, ' Show to the party (everyone in the world sees it, with your name)'),
      el('div', { class: 'btnrow' },
        el('button', { class: 'btn primary', type: 'button', onclick: async () => {
          try {
            const r = await api('maps', { method: 'POST', body: { mark: { ...mk, map_id: map.id, label: label.value, note: note.value, shared: shared.checked } } });
            marks = [...marks.filter((x) => x.id !== r.mark.id), r.mark]; d.close(); renderPins();
          } catch (err) { toast(err.message, 'bad'); }
        } }, 'Save'),
        mk.id ? el('button', { class: 'btn', type: 'button', onclick: () => { d.close(); moving = { mark: mk }; viewport.classList.add('placing'); status.textContent = `Click the map to move “${mk.label}”.`; status.className = 'form-status'; } }, 'Move') : null,
        mk.id ? confirmButton('Delete', async () => { try { await api('maps', { method: 'DELETE', query: { mark: mk.id } }); marks = marks.filter((x) => x.id !== mk.id); d.close(); renderPins(); } catch (err) { toast(err.message, 'bad'); } }, 'btn') : null,
        el('button', { class: 'btn ghost', type: 'button', onclick: () => d.close() }, 'Cancel'))));
    d.addEventListener('close', () => d.remove());
    document.body.append(d); d.showModal(); label.focus();
  }

  // Who holds what: pins tinted by the faction, guild or house that controls the place, with a key.
  let holdsOn = false, hold = new Map(), slots = new Map();
  const holdKey = el('div', { class: 'hold-key', hidden: true, 'aria-label': 'Who holds what', role: 'group' });
  function drawHoldKey() {
    holdKey.hidden = !holdsOn;
    if (!holdsOn) return;
    const counts = new Map();
    for (const p of pins) { const h = p.entry_id && hold.get(p.entry_id); if (h) counts.set(h.by, (counts.get(h.by) || 0) + 1); }
    setKids(holdKey, counts.size ? [...counts].sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name)).map(([by, n]) => {
      const slot = slots.get(by.id) ?? -1;
      return el('span', { class: 'hold-item' }, el('span', { class: `hold-swatch hold-${slot < 0 ? 'other' : slot}`, 'aria-hidden': 'true' }), link(by), el('span', { class: 'muted small' }, ` ${n}`));
    }) : el('span', { class: 'muted small' }, 'No pinned place says who holds it yet. Set “Ruled by”, “Controlled by”, “Led by” or “Owner” to a faction, or connect the place “controlled by” one.'));
  }
  const holdBtn = el('button', { class: 'btn small', type: 'button', 'aria-pressed': 'false', title: 'Tint pins by the faction that controls each place', onclick: () => {
    holdsOn = !holdsOn; holdBtn.setAttribute('aria-pressed', String(holdsOn));
    if (holdsOn) { const all = [...world.entries.values()].filter((e) => e.status !== 'suggested'); hold = controllers(all); slots = powerSlots(all); }
    renderPins();
  } }, 'Who holds what');

  function renderPins() {
    const q = filter.value.trim().toLowerCase();
    setKids(layer, ...partyMarks.map((m) => el('button', { class: 'pin mark party-mark', type: 'button', style: `left:${m.x * 100}%;top:${m.y * 100}%`, title: `${m.label} (${m.by})`, 'aria-label': `${m.by}’s marker: ${m.label}`,
      onclick: (ev) => { ev.stopPropagation(); partyMarkInfo(m); } }, el('span', { class: 'glyph', 'aria-hidden': 'true' }, '✦'), el('span', { class: 'pin-label' }, `${m.label} · ${m.by}`))),
    ...marks.map((m) => el('button', { class: `pin mark${m.shared ? ' shared' : ''}`, type: 'button', style: `left:${m.x * 100}%;top:${m.y * 100}%`, title: m.label, 'aria-label': `Your marker: ${m.label}`,
      onclick: (ev) => { ev.stopPropagation(); markDialog(m); } }, el('span', { class: 'glyph', 'aria-hidden': 'true' }, '✎'), el('span', { class: 'pin-label' }, m.label))),
    ...(() => {
      const at = partyPin(pins, partyChain());
      if (!at) return [];
      const place = getEntry(world.info.party_at);
      return [el('button', { class: 'pin party-token', type: 'button', style: `left:${at.pin.x * 100}%;top:${at.pin.y * 100}%`, title: `The party is ${at.exact ? 'here' : `in ${place.name}`}`,
        'aria-label': `The party is ${at.exact ? `here, in ${place.name}` : `in ${place.name}, in ${at.pin.label}`}`, onclick: (ev) => { ev.stopPropagation(); showPin(at.pin); } },
        el('span', { class: 'glyph', 'aria-hidden': 'true' }, '⚑'), el('span', { class: 'pin-label' }, at.exact ? 'The party' : `The party (${place.name})`))];
    })(),
    ...pins.map((p) => {
      const held = holdsOn && p.entry_id && hold.get(p.entry_id);
      const slot = held ? slots.get(held.by.id) ?? -1 : null;
      return el('button', {
        class: `pin pin-${p.icon || 'poi'}${p.secret ? ' secret' : ''}${p.entry_id && mapsOf(p.entry_id).some((m) => m.id !== map.id) ? ' has-map' : ''}${held ? ` held hold-${slot < 0 ? 'other' : slot}` : ''}`, type: 'button', 'data-id': p.id, style: `left:${p.x * 100}%;top:${p.y * 100}%`,
        title: held ? `${p.label}: held by ${held.by.name}` : p.label, 'aria-label': held ? `${p.label}, held by ${held.by.name}` : p.label, onclick: (ev) => { ev.stopPropagation(); showPin(p); },
      }, el('span', { class: 'glyph', 'aria-hidden': 'true' }, PIN_ICONS[p.icon || 'poi'][1]), el('span', { class: 'pin-label' }, p.label));
    }));
    drawHoldKey();
    const shown = pins.filter((p) => !q || `${p.label} ${getEntry(p.entry_id)?.name || ''}`.toLowerCase().includes(q)).sort((a, b) => String(a.label).localeCompare(String(b.label)));
    setKids(list, ...(shown.length ? shown.map((p) => el('li', {}, el('button', { class: 'linkish', type: 'button', onclick: () => { centerOn(p); showPin(p); } },
      el('span', { class: `glyph pin-${p.icon || 'poi'}` }, PIN_ICONS[p.icon || 'poi'][1]), ' ', p.label), p.secret ? el('span', { class: 'tag' }, 'GM') : null))
      : [el('li', { class: 'muted small' }, pins.length ? 'No pins match.' : 'No pins yet.')]));
    drawMine(); drawJourney();
  }
  filter.addEventListener('input', renderPins);
  // The side list of your markers (redrawn with the pins).
  // Someone else's shared marker: who left it and what it says.
  function partyMarkInfo(m) {
    const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'pm-title' }, el('div', { class: 'dialog-body' },
      el('h2', { id: 'pm-title' }, m.label), el('p', { class: 'muted small' }, `A marker ${m.by} shared with the party.`), m.note ? el('p', {}, m.note) : null,
      el('div', { class: 'btnrow' }, el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Close'))));
    d.addEventListener('close', () => d.remove()); document.body.append(d); d.showModal();
  }
  const drawMine = () => setKids(myBox, ...(partyMarks.length ? [el('h3', { class: 'section-title' }, `Shared by the party (${partyMarks.length})`), el('ul', { class: 'pin-list' }, partyMarks.map((m) => el('li', {},
    el('button', { class: 'linkish', type: 'button', onclick: () => { centerOn(m); partyMarkInfo(m); } }, el('span', { class: 'glyph mark-glyph party', 'aria-hidden': 'true' }, '✦'), ' ', m.label), el('span', { class: 'muted small' }, ` ${m.by}`))))] : []),
    ...(marks.length ? [el('h3', { class: 'section-title' }, `Your markers (${marks.length})`), el('ul', { class: 'pin-list' }, [...marks].sort((a, b) => a.label.localeCompare(b.label)).map((m) => el('li', {},
    el('button', { class: 'linkish', type: 'button', onclick: () => { centerOn(m); markDialog(m); } }, el('span', { class: 'glyph mark-glyph', 'aria-hidden': 'true' }, '✎'), ' ', m.label), m.shared ? el('span', { class: 'tag' }, 'shared') : null, m.note ? el('span', { class: 'muted small' }, ` ${m.note.slice(0, 60)}`) : null)))] : []));

  // Pan, zoom and place pins.
  const pointers = new Map(); let last = null, pinchDist = 0, dragged = false;
  viewport.addEventListener('pointerdown', (ev) => {
    if (ev.target.closest('.pin, .pin-pop')) return;
    if (fogMode && ev.isPrimary) { viewport.setPointerCapture(ev.pointerId); painting = true; paintAt(ev); return; }
    viewport.setPointerCapture(ev.pointerId); pointers.set(ev.pointerId, ev); last = { x: ev.clientX, y: ev.clientY }; dragged = false;
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
  });
  viewport.addEventListener('pointermove', (ev) => {
    if (painting) { paintAt(ev); return; }
    if (!pointers.has(ev.pointerId)) return;
    pointers.set(ev.pointerId, ev);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]; const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const r = viewport.getBoundingClientRect();
      if (pinchDist) zoomAt(dist / pinchDist, (a.clientX + b.clientX) / 2 - r.left, (a.clientY + b.clientY) / 2 - r.top);
      pinchDist = dist; dragged = true; return;
    }
    const dx = ev.clientX - last.x, dy = ev.clientY - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true;
    tx += dx; ty += dy; last = { x: ev.clientX, y: ev.clientY }; apply();
    if (openPin) placePop(openPin);
  });
  const up = (ev) => {
    if (painting) { painting = false; saveFog(); return; }
    const wasDrag = dragged; pointers.delete(ev.pointerId); if (pointers.size < 2) pinchDist = 0;
    if (wasDrag || ev.type === 'pointercancel' || ev.target.closest('.pin, .pin-pop')) return;
    const s = stage.getBoundingClientRect();
    const x = (ev.clientX - s.left) / s.width, y = (ev.clientY - s.top) / s.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    if (moving?.mark) { const mk = moving.mark; moving = null; viewport.classList.remove('placing'); api('maps', { method: 'POST', body: { mark: { ...mk, map_id: map.id, x, y } } }).then((r) => { marks = marks.map((m) => (m.id === mk.id ? r.mark : m)); status.textContent = 'Marker moved.'; renderPins(); }).catch((err) => toast(err.message, 'bad')); return; }
    if (measuring) { route.push({ x, y }); drawRoute(); return; }
    if (marking) { marking = false; viewport.classList.remove('placing'); markBtn.setAttribute('aria-pressed', 'false'); status.textContent = ''; markDialog({ x, y, label: '', note: '' }); return; }
    if (moving) { const m = moving; moving = null; viewport.classList.remove('placing'); save(pins.map((p) => (p.id === m.id ? { ...p, x, y } : p)), 'Pin moved.'); return; }
    if (adding) {
      adding = false; viewport.classList.remove('placing'); addBtn.setAttribute('aria-pressed', 'false');
      const pinId = `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
      if (presetEntry) {
        const e = presetEntry; presetEntry = null;
        save([...pins, { id: pinId, x, y, entry_id: e.id, label: e.name, icon: pinIconFor(e), secret: false, note: '' }], `${e.name} pinned.`);
        return;
      }
      showPin({ id: pinId, x, y, icon: 'poi', label: '', secret: false }, true);
      return;
    }
    if (openPin) closePop();
  };
  viewport.addEventListener('pointerup', up); viewport.addEventListener('pointercancel', up);
  viewport.addEventListener('wheel', (ev) => { ev.preventDefault(); const r = viewport.getBoundingClientRect(); zoomAt(ev.deltaY < 0 ? 1.15 : 1 / 1.15, ev.clientX - r.left, ev.clientY - r.top); if (openPin) placePop(openPin); }, { passive: false });
  viewport.addEventListener('keydown', (ev) => {
    const step = 60, c = [viewport.clientWidth / 2, viewport.clientHeight / 2];
    if (ev.key === '+' || ev.key === '=') zoomAt(1.2, ...c); else if (ev.key === '-') zoomAt(1 / 1.2, ...c);
    else if (ev.key === 'ArrowLeft') { tx += step; apply(); } else if (ev.key === 'ArrowRight') { tx -= step; apply(); }
    else if (ev.key === 'ArrowUp') { ty += step; apply(); } else if (ev.key === 'ArrowDown') { ty -= step; apply(); }
    else if (ev.key === 'Escape') { closePop(); adding = false; moving = null; viewport.classList.remove('placing'); } else return;
    ev.preventDefault();
  });

  const addBtn = el('button', { class: 'btn primary small', type: 'button', 'aria-pressed': 'false', onclick: () => {
    adding = !adding; moving = null; addBtn.setAttribute('aria-pressed', String(adding)); viewport.classList.toggle('placing', adding);
    status.textContent = adding ? 'Click the map where the pin goes.' : ''; status.className = 'form-status';
  } }, '+ Add pin');
  const c = () => [viewport.clientWidth / 2, viewport.clientHeight / 2];
  const markBtn = el('button', { class: 'btn small', type: 'button', 'aria-pressed': 'false', title: 'A private marker only you can see', onclick: () => {
    marking = !marking; adding = false; moving = null; markBtn.setAttribute('aria-pressed', String(marking)); viewport.classList.toggle('placing', marking);
    status.textContent = marking ? 'Click the map where your marker goes.' : ''; status.className = 'form-status';
  } }, '+ My marker');

  // The ruler: click points along a route to see how far it is, and how long it takes at each pace.
  const routeInfo = el('div', { class: 'route-info', role: 'status' });
  function drawRoute() {
    const pts = route.map((p) => `${p.x * 1000},${p.y * 1000 * ratio}`).join(' ');
    routeSvg.replaceChildren(...(route.length > 1 ? [Object.assign(document.createElementNS(NS, 'polyline'), {})] : []), ...route.map(() => document.createElementNS(NS, 'circle')));
    if (route.length > 1) { const line = routeSvg.firstChild; line.setAttribute('points', pts); line.setAttribute('class', 'route-line'); line.setAttribute('vector-effect', 'non-scaling-stroke'); }
    [...routeSvg.querySelectorAll('circle')].forEach((c, i) => { c.setAttribute('cx', route[i].x * 1000); c.setAttribute('cy', route[i].y * 1000 * ratio); c.setAttribute('r', 5); c.setAttribute('class', 'route-dot'); c.setAttribute('vector-effect', 'non-scaling-stroke'); });
    const r = routeMiles(route, map.miles || 0, ratio);
    setKids(routeInfo, route.length < 2 ? el('span', { class: 'muted small' }, route.length ? 'Click the next point.' : 'Click points along the route, one after another.')
      : [el('strong', {}, milesText(r.total)), r.legs.length > 1 ? el('span', { class: 'muted small' }, ` in ${r.legs.length} legs (${r.legs.map(milesText).join(' + ')})`) : null,
        el('p', { class: 'small route-time' }, travelText(r.total).replace(/^\d+ miles: /, 'Travel time: '))]);
  }
  const measureBar = el('div', { class: 'measure-bar card', hidden: true }, routeInfo,
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => { route.pop(); drawRoute(); } }, 'Undo point'),
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => { route = []; drawRoute(); } }, 'Clear'),
      el('button', { class: 'btn small', type: 'button', onclick: () => toggleMeasure(false) }, 'Done')));
  function toggleMeasure(on = !measuring) {
    measuring = on; adding = false; marking = false; moving = null;
    measureBtn.setAttribute('aria-pressed', String(on)); measureBar.hidden = !on; viewport.classList.toggle('placing', on);
    if (!on) route = [];
    drawRoute();
  }
  const measureBtn = el('button', { class: 'btn small', type: 'button', 'aria-pressed': 'false', title: 'Measure a route on this map', onclick: () => toggleMeasure() }, 'Measure');
  viewport.addEventListener('keydown', (ev) => { if (measuring && ev.key === 'Escape') toggleMeasure(false); });

  // The GM's fog tools: paint to reveal or hide, show or hide the fog to players, cover or clear everything.
  let fogInfo = null;
  function fogBar() {
    fogInfo = el('span', { class: 'muted small' });
    const seg = el('div', { class: 'seg', role: 'group', 'aria-label': 'Brush' }, [[0, 'Reveal'], [1, 'Hide']].map(([v, t]) =>
      el('button', { type: 'button', 'aria-pressed': String(brush === v), onclick: (ev) => { brush = v; for (const b of seg.children) b.setAttribute('aria-pressed', String(b === ev.target)); } }, t)));
    const size = el('select', { 'aria-label': 'Brush size' }, [[1.5, 'Small brush'], [3, 'Medium brush'], [6, 'Large brush']].map(([v, t]) => el('option', { value: v }, t)));
    size.value = String(radius); size.addEventListener('change', () => { radius = Number(size.value); });
    const on = el('input', { type: 'checkbox', checked: fogOn || null });
    on.addEventListener('change', () => { fogOn = on.checked; drawFog(); saveFog(fogOn ? 'Players now see the fog.' : 'Fog turned off for players.'); });
    const fill = (v) => () => { cells.fill(v); drawFog(); saveFog(v ? 'The whole map is hidden.' : 'The whole map is revealed.'); };
    const bar = el('div', { class: 'fog-bar card', hidden: true },
      el('label', { class: 'check' }, on, ' Players see the fog'), seg, size,
      el('button', { class: 'btn small ghost', type: 'button', onclick: fill(1) }, 'Hide all'), el('button', { class: 'btn small ghost', type: 'button', onclick: fill(0) }, 'Reveal all'),
      fogInfo, el('p', { class: 'muted small' }, 'Drag on the map to paint. Players see a dark cover over hidden parts, and pins under it are left out for them. The map picture itself is still sent whole, so it hides things from the table, not from someone digging through the page.'));
    return bar;
  }
  const fogTools = isGm() ? fogBar() : null;
  const fogBtn = el('button', { class: 'btn small', type: 'button', 'aria-pressed': 'false', onclick: () => {
    fogMode = !fogMode; fogBtn.setAttribute('aria-pressed', String(fogMode)); fogTools.hidden = !fogMode; viewport.classList.toggle('painting', fogMode);
    adding = false; moving = null; addBtn.setAttribute('aria-pressed', 'false'); viewport.classList.remove('placing'); drawFog();
  } }, 'Fog');
  function scaleControl() {
    const label = el('span', { class: 'muted small map-scale' }, map.miles ? `${Math.round(map.miles).toLocaleString('en-US')} miles across` : isGm() ? '' : '');
    if (!isGm()) return map.miles ? label : null;
    const input = el('input', { type: 'number', min: 0, class: 'hp-amt', 'aria-label': 'Miles across the whole map', value: map.miles || '', placeholder: 'miles' });
    const box = el('span', { class: 'scale-edit', hidden: true }, input, el('button', { class: 'btn small', type: 'button', onclick: async () => {
      if (await save(pins, 'Scale saved: open a pin to see travel times.', { miles: Number(input.value) || null })) { label.textContent = map.miles ? `${Math.round(map.miles).toLocaleString('en-US')} miles across` : ''; box.hidden = true; }
    } }, 'Save'));
    return el('span', { class: 'scale-ctl' }, label, el('button', { class: 'btn small ghost', type: 'button', onclick: () => { box.hidden = !box.hidden; if (!box.hidden) input.focus(); } }, map.miles ? 'Scale' : 'Set scale'), box);
  }
  const toolbar = el('div', { class: 'map-tools' },
    el('button', { class: 'btn small', type: 'button', 'aria-label': 'Zoom in', onclick: () => zoomAt(1.3, ...c()) }, '+'),
    el('button', { class: 'btn small', type: 'button', 'aria-label': 'Zoom out', onclick: () => zoomAt(1 / 1.3, ...c()) }, '−'),
    el('button', { class: 'btn small', type: 'button', onclick: fit }, 'Fit'),
    el('button', { class: 'btn small', type: 'button', onclick: () => layer.classList.toggle('no-labels') }, 'Labels'),
    isGm() ? addBtn : null,
    isGm() ? fogBtn : null,
    isMember() ? markBtn : null,
    map.miles ? measureBtn : null,
    journeyBtn,
    holdBtn,
    scaleControl());

  const entry = map.entry_id && getEntry(map.entry_id);
  // Maps of the places this map's place sits inside, outermost first, for drilling back up.
  const upMaps = entry ? trail(entry).map((p) => mapsOf(p.id)[0]).filter(Boolean) : [];
  const node = el('div', { class: 'w-view map-view' },
    upMaps.length ? el('nav', { class: 'crumbs', 'aria-label': 'Larger maps' }, upMaps.flatMap((m, i) => [i ? ' › ' : '', el('a', { href: `#world/map/${m.id}` }, m.name)]), ' › ', map.name) : null,
    el('div', { class: 'panel-head row' }, el('div', {}, el('div', { class: 'eyebrow' }, 'Map', map.secret ? ' · GM only' : ''), el('h2', {}, map.name), entry ? el('p', {}, 'Map of ', link(entry)) : null),
      isGm() ? el('div', { class: 'btnrow' }, confirmButton('Delete map', async () => {
        try { await api('maps', { method: 'DELETE', query: { id: map.id } }); world.maps = (world.maps || []).filter((m) => m.id !== map.id); toast('Map deleted'); location.hash = 'world/maps'; }
        catch (err) { toast(err.message, 'bad'); }
      }, 'btn ghost small')) : null),
    toolbar, holdKey, fogTools, measureBar, viewport, status,
    el('div', { class: 'map-side' }, el('h3', { class: 'section-title' }, 'Pins'), filter, list, myBox),
    el('p', { class: 'muted small' }, `Last changed ${whenTime(map.updated_at)}${map.updated_by ? ` by ${map.updated_by}` : ''}. Drag to pan; scroll, pinch or use + and − to zoom.`),
    nameList());

  let presetEntry = null;
  const ready = () => {
    fit(); renderPins(); drawFog();
    if (focusPin === 'add' && isGm()) { addBtn.click(); return; }
    if (focusPin?.startsWith('place:') && isGm()) {
      presetEntry = getEntry(focusPin.slice(6));
      if (presetEntry) { adding = true; addBtn.setAttribute('aria-pressed', 'true'); viewport.classList.add('placing'); status.textContent = `Click the map where ${presetEntry.name} goes.`; status.className = 'form-status'; }
      return;
    }
    const p = focusPin && pins.find((x) => x.id === focusPin); if (p) { centerOn(p); showPin(p); }
  };
  if (img.complete && img.naturalWidth) requestAnimationFrame(ready); else img.addEventListener('load', ready, { once: true });
  img.addEventListener('error', () => { status.textContent = 'The map image didn’t load. If it’s a link, the site hosting it may block embedding.'; status.className = 'form-status error'; });
  new ResizeObserver(() => { if (img.naturalWidth) fit(); }).observe(viewport);
  return node;
}
