// The Dungeons & Lairs tool: generate a keyed site, read it, and save it to the world as a location with one
// entry per room and a map with a pin on each room.
import { el, toast, copyText, download, setKids, fresh } from './dom.js';
import { THEMES, generateDungeon, dungeonText, dungeonSvg } from './dungeon.js';
import { saveNote } from './notebook.js';
import { isGm, onSession, api } from './api.js';
import { world, worldEntries, loadWorld, createEntry, createEntries, byName, kindLabel } from './world-store.js';
import { PLACE_KINDS } from './world-schema.js';
import { partyDefaults } from './encounter-ui.js';

// Draw the SVG map onto a canvas so it can be stored like any uploaded map image.
function svgToPng(svg, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = width; c.height = height; c.getContext('2d').drawImage(img, 0, 0); resolve(c.toDataURL('image/png')); };
    img.onerror = () => reject(new Error('Couldn’t draw the map.'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

const short = (d) => d.name.replace(/^The /, '');

async function saveToWorld(d, { parentId, hidden }) {
  const vis = hidden ? 'gm' : 'all';
  const boss = d.rooms.find((r) => r.role === 'boss');
  const reward = d.rooms.find((r) => r.role === 'reward');
  const site = await createEntry({
    kind: 'location', name: d.name, parent_id: parentId || null, visibility: vis, tags: ['dungeon', d.theme],
    summary: d.history,
    body: `A ${d.label.toLowerCase()} of ${d.rooms.length} rooms, made for a level ${d.level} party of ${d.size}. Each room has its own entry; the map shows how they connect.`,
    fields: { type: d.theme === 'lair' ? 'Lair' : 'Dungeon', features: d.rooms.map((r) => `${r.n}. ${r.name}`).join('\n'),
      dangers: boss?.lines.join('\n') || '', treasure: reward?.lines.filter((l) => l.startsWith('Treasure')).join('\n') || '' },
  });
  const made = await createEntries(d.rooms.map((r) => ({
    kind: 'location', name: `${short(d)} ${r.n}: ${r.name}`, parent_id: site.id, visibility: vis, tags: ['room'],
    summary: `A ${r.size} room. ${r.sense}`,
    body: [`There is ${r.feature}.`, ...r.lines, `Exits: ${r.exits.join(', ') || 'none'}.`].join('\n\n'),
    fields: { type: 'Room', dangers: r.lines.filter((l) => /^(Creatures|Trap|Also a trap|Puzzle)/.test(l)).join('\n'), treasure: r.treasure?.line || '' },
  })));
  const m = dungeonSvg(d);
  const image = await svgToPng(m.svg, m.width, m.height);
  const pins = d.rooms.map((r, i) => ({ id: `room${r.n}`, x: m.centers[i][0], y: m.centers[i][1], label: `${r.n}. ${r.name}`, entry_id: made[i]?.id || null, icon: r.role === 'boss' ? 'danger' : 'poi', secret: hidden }));
  const map = await api('maps', { method: 'POST', body: { map: { name: `Map of ${d.name}`, image, width: m.width, height: m.height, entry_id: site.id, secret: hidden, pins } } });
  world.maps = [...(world.maps || []), map.map];
  return site;
}

export function mountDungeons(root) {
  let d = null;
  const party = partyDefaults();
  const theme = el('select', { id: 'dg-theme' }, Object.entries(THEMES).map(([k, t]) => el('option', { value: k }, t.label)));
  const rooms = el('select', { id: 'dg-rooms' }, [[5, '5 rooms (classic)'], [8, '8 rooms'], [12, '12 rooms']].map(([v, t]) => el('option', { value: v }, t)));
  rooms.value = '8';
  const level = el('select', { id: 'dg-level' }, Array.from({ length: 20 }, (_, i) => el('option', { value: i + 1 }, `Level ${i + 1}`)));
  level.value = String(party.level);
  const size = el('select', { id: 'dg-size' }, Array.from({ length: 8 }, (_, i) => el('option', { value: i + 1 }, `${i + 1} characters`)));
  size.value = String(Math.min(8, party.size));
  const card = el('article', { class: 'card dungeon' });
  const saveBox = el('div', { class: 'dg-save' });
  const lab = (l, x) => el('div', { class: 'field' }, el('label', { for: x.id }, l), x);

  function roll() {
    d = generateDungeon({ theme: theme.value, rooms: +rooms.value, level: +level.value, size: +size.value });
    render(); fresh(card);
  }

  function render() {
    const m = dungeonSvg(d);
    const mapBox = el('div', { class: 'dg-map' });
    mapBox.innerHTML = m.svg; // generated here, with names escaped
    setKids(card,
      el('div', { class: 'eyebrow' }, `${d.label} · ${d.rooms.length} rooms · level ${d.level} party of ${d.size}`),
      el('h3', { class: 'card-title' }, d.name),
      el('p', { class: 'lede' }, d.history),
      mapBox,
      el('p', { class: 'muted small' }, 'Map key: red is the master’s room, gold holds treasure, purple has a trap; dashed lines are secret doors.'),
      el('ol', { class: 'dg-rooms' }, d.rooms.map((r) => el('li', { class: `dg-room role-${r.role}` },
        el('h4', {}, `${r.n}. ${r.name}`),
        el('p', {}, `A ${r.size} room. ${r.sense} There is ${r.feature}.`),
        r.lines.map((l) => el('p', { class: /^(Creatures|Trap|Also a trap)/.test(l) ? 'danger-line' : /^Treasure/.test(l) ? 'treasure-line' : '' }, l)),
        el('p', { class: 'muted small' }, `Exits: ${r.exits.join(', ') || 'none'}.`)))),
      el('div', { class: 'btnrow' },
        el('button', { class: 'btn', type: 'button', onclick: () => saveNote('Dungeon', d.name, dungeonText(d)) }, 'Save to notebook'),
        el('button', { class: 'btn', type: 'button', onclick: () => copyText(dungeonText(d)) }, 'Copy'),
        el('button', { class: 'btn', type: 'button', onclick: () => download(`${d.name.replace(/[^\w]+/g, '-')}.txt`, dungeonText(d)) }, 'Download')),
      saveBox);
    renderSave();
  }

  async function renderSave() {
    if (!d) return;
    if (!isGm()) { setKids(saveBox, el('p', { class: 'muted small' }, 'GMs can save this to the world: the site, a page per room, and a map with a pin on each room.')); return; }
    if (!world.loaded) await loadWorld();
    const places = worldEntries().filter((e) => PLACE_KINDS.includes(e.kind) && e.fields?.type !== 'Room').sort(byName);
    const where = el('select', { id: 'dg-where' }, el('option', { value: '' }, 'Not inside anything'), places.map((p) => el('option', { value: p.id }, `${p.name} (${kindLabel(p.kind).toLowerCase()})`)));
    const hide = el('input', { type: 'checkbox', id: 'dg-hide', checked: true });
    const status = el('p', { class: 'form-status', role: 'status' });
    const go = el('button', { class: 'btn primary world', type: 'button', onclick: async () => {
      go.disabled = true; status.textContent = 'Saving the site, its rooms and its map…'; status.className = 'form-status';
      try { const site = await saveToWorld(d, { parentId: where.value, hidden: hide.checked }); toast(`${d.name} is in the world`); location.hash = `world/e/${site.id}/places`; }
      catch (err) { status.textContent = err.message; status.className = 'form-status error'; go.disabled = false; }
    } }, 'Add to world');
    setKids(saveBox, el('div', { class: 'card dg-save-card' }, el('h4', {}, 'Add to the world'),
      el('div', { class: 'controls' }, lab('Located in', where), el('label', { class: 'check' }, hide, ' Hide from players until they explore it')), el('div', { class: 'btnrow' }, go), status));
  }

  root.append(
    el('div', { class: 'panel-head' }, el('h2', {}, 'Dungeons & Lairs'),
      el('p', {}, 'A keyed site in one roll: its history, a room-by-room key with monsters fitted to your party, traps scaled to their tier, puzzles and treasure, and a map of how the rooms connect. GMs can add the whole thing to the world.')),
    el('div', { class: 'controls' }, lab('Kind of site', theme), lab('Size', rooms), lab('Party level', level), lab('Party size', size)),
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: roll }, 'Generate')),
    card);
  for (const s of [theme, rooms, level, size]) s.addEventListener('change', roll);
  onSession(() => renderSave());
  roll();
}
