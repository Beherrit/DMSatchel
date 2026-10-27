// "Getting started" checklists on the world front page: one for GMs building a world, one for players joining.
// Steps tick themselves off from what's in the world; the card can be dismissed per world in this browser.
import { el } from './dom.js';
import { isGm, isOwner, isPlayer, session, currentWorld } from './api.js';
import { world, worldEntries } from './world-store.js';

const key = (who) => `dm-satchel-start:${who}:${currentWorld()?.id || world.info?.id || 'world'}`;
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* fine */ } };
export const markInvitesSeen = () => write(`${key('gm')}:invites`, '1');

function steps() {
  const all = worldEntries();
  const me = session.gm?.id;
  if (isGm()) {
    return [
      ['Name your world and write a welcome', !/^World \d+$/.test(world.info?.name || 'World 1') || Boolean(world.info?.about), isOwner() ? '#admin/world' : null],
      ['Invite your players and co-GMs', Boolean(read(`${key('gm')}:invites`)) || all.some((e) => e.owner_id && e.owner_id !== me), isOwner() ? '#admin/members' : null],
      ['Add a region and a town', all.some((e) => e.kind === 'region') && all.some((e) => e.kind === 'settlement'), '#admin/build'],
      ['Put a map in and pin your places', (world.maps || []).some((m) => (m.pins || []).length), '#world/maps'],
      ['Give a town some people: roll NPCs into it', all.some((e) => e.kind === 'npc' && e.parent_id), '#world/atlas'],
      ['Post a job on a quest board', all.some((e) => e.kind === 'quest'), '#admin/build'],
      ['Set up the calendar', Boolean(world.info?.cal), '#world/calendar'],
    ];
  }
  if (isPlayer()) {
    return [
      ['Add your character (roll one in the Character Forge, or write it up)', all.some((e) => e.kind === 'character' && e.owner_id === me), '#world/new/character'],
      ['Meet the party', Boolean(read(`${key('player')}:party`)), '#world/party'],
      ['Write your first journal entry', all.some((e) => e.kind === 'journal' && e.owner_id === me), '#world/new/journal'],
      ['Suggest something for the world: a rumor, an NPC, a place', all.some((e) => e.status === 'suggested' && e.owner_id === me) || all.some((e) => e.owner_id === me && !['character', 'journal'].includes(e.kind)), '#world/new/lore'],
    ];
  }
  return null;
}

export function startCard(rerender) {
  const list = steps();
  if (!list) return null;
  const who = isGm() ? 'gm' : 'player';
  if (read(`${key(who)}:dismissed`) || list.every(([, done]) => done)) return null;
  const done = list.filter(([, d]) => d).length;
  return el('section', { class: 'card start-card' },
    el('div', { class: 'entry-head' }, el('h3', {}, who === 'gm' ? 'Getting your world ready' : 'Welcome to the table'),
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => { write(`${key(who)}:dismissed`, '1'); rerender(); } }, 'Hide')),
    el('div', { class: 'start-progress', role: 'progressbar', 'aria-label': `${done} of ${list.length} steps done`, 'aria-valuemin': 0, 'aria-valuemax': list.length, 'aria-valuenow': done }, el('span', { style: `width:${(done / list.length) * 100}%` })),
    el('ol', { class: 'start-steps' }, list.map(([label, ok, href]) => el('li', { class: ok ? 'done' : '' },
      el('span', { class: 'tick', 'aria-hidden': 'true' }, ok ? '✓' : ''), href && !ok ? el('a', { href, onclick: () => { if (href === '#world/party') write(`${key('player')}:party`, '1'); } }, label) : el('span', {}, label),
      ok ? el('span', { class: 'sr-only' }, ' (done)') : null))));
}

export const markPartySeen = () => write(`${key('player')}:party`, '1');
