// NPC table cards: a compact card per NPC (who they are, how they sound, what they want, a stat line, how they feel
// about the party and, for GMs, their secret) to print as a set. Route: #world/cards/<place id> · /prep · /n:<npc id>
import { el, setKids } from './dom.js';
import { api, isGm } from './api.js';
import { worldEntries, getEntry, descendantsOf, byName, notice, link } from './world-store.js';
import { towards } from './attitudes.js';
import { stripMarks } from './rich.js';

const plain = (t) => stripMarks(t).replace(/\s+/g, ' ').trim();
const cut = (t, n) => { const s = plain(t); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };
const ALIVE = (e) => e.kind === 'npc' && !['Dead'].includes(e.fields?.status);

// The stat block's first line ("AC 15 (chain shirt) · HP 27 · Speed 30 ft…") is plenty at the table.
const statLine = (e) => String(e.fields?.stats || '').split('\n').map((l) => l.trim()).find(Boolean) || '';

export function npcCard(e, { gm = isGm(), onRemove } = {}) {
  const f = e.fields || {};
  const att = towards(worldEntries(), e.id);
  const row = (label, text, n) => (text ? el('p', {}, el('strong', {}, `${label}: `), cut(text, n)) : null);
  return el('article', { class: 'npc-card' },
    el('header', {}, el('h3', {}, e.name), onRemove ? el('button', { class: 'btn small ghost card-x', type: 'button', 'aria-label': `Leave out ${e.name}`, onclick: onRemove }, '✕') : null),
    el('p', { class: 'npc-card-sub' }, [f.role, f.ancestry, f.level, getEntry(e.parent_id)?.name].filter(Boolean).join(' · ')),
    e.summary ? el('p', { class: 'npc-card-sum' }, cut(e.summary, 180)) : null,
    row('Looks', f.appearance, 120), row('Voice', f.voice, 110), row('Manner', f.personality, 130), row('Wants', f.wants, 130),
    statLine(e) ? el('p', { class: 'npc-card-stats' }, cut(statLine(e), 140)) : null,
    att.length ? el('p', { class: 'small' }, el('strong', {}, 'Feels about: '), att.map((x) => `${x.character.name} ${x.a.toLowerCase()}`).join(', ')) : null,
    gm && e.secret ? el('p', { class: 'npc-card-secret' }, el('strong', {}, 'Secret: '), cut(e.secret, 160)) : null);
}

export async function viewCards(arg) {
  let title = 'NPC cards', list = [];
  if (arg === 'prep') {
    let prep = {};
    try { prep = (await api('settings')).world?.prep || {}; } catch { /* no prep */ }
    const here = prep.location_id && getEntry(prep.location_id);
    if (!here) return notice('No location set', 'Pick where the party is in session prep, then print cards for the people there.', el('a', { class: 'btn', href: '#world/prep' }, 'Session prep'));
    title = `People in ${here.name}`; list = descendantsOf(here.id).filter(ALIVE);
  } else if (arg?.startsWith('n:')) {
    const e = getEntry(arg.slice(2)); if (e) { title = e.name; list = [e]; }
  } else if (arg) {
    const place = getEntry(arg);
    if (place) { title = `People in ${place.name}`; list = descendantsOf(place.id).filter(ALIVE); }
  } else { list = worldEntries().filter((e) => ALIVE(e) && (e.tags || []).includes('key')); title = 'Key NPCs'; }
  // Key NPCs first, then by name.
  list.sort((a, b) => Number((b.tags || []).includes('key')) - Number((a.tags || []).includes('key')) || byName(a, b));
  const grid = el('div', { class: 'card-grid' });
  const draw = () => setKids(grid, list.length ? list.map((e) => npcCard(e, { onRemove: () => { list = list.filter((x) => x.id !== e.id); draw(); } }))
    : notice('Nobody here', 'No NPCs are recorded in this place yet.'));
  draw();
  return el('div', { class: 'w-view cards-view' },
    el('div', { class: 'panel-head row card-tools' }, el('div', {}, el('h2', {}, title), el('p', {}, 'One card per person, to print and keep by your screen. ✕ leaves someone out of this print.')),
      el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: () => window.print() }, 'Print'))),
    grid);
}

export const cardsButton = (e) => {
  if (!isGm()) return null;
  if (e.kind === 'npc') return el('a', { class: 'btn small ghost', href: `#world/cards/n:${e.id}` }, 'Table card');
  if (descendantsOf(e.id).some(ALIVE)) return el('a', { class: 'btn small ghost', href: `#world/cards/${e.id}` }, 'NPC cards');
  return null;
};
