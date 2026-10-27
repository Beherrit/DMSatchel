// Rumors in the world: the Rumors tab on towns, the Rumors list with how far each has spread, and the
// "let rumors spread" action for GMs.
import { el, toast } from './dom.js';
import { isGm, isMember } from './api.js';
import { world, worldEntries, getEntry, link, createEntry, patchEntry, notice, byName } from './world-store.js';
import { reach, spreadRumors, truthOf } from './rumors.js';
import { makeRng } from './rng.js';
import * as D from './tables.js';

const TRUTHS = ['True', 'Partly true', 'False', 'Unknown'];

export function rumorsAt(townId) {
  return worldEntries().filter((e) => e.kind === 'rumor').map((r) => ({ r, v: reach(r)[townId] })).filter((x) => x.v).sort((a, b) => a.v.hops - b.v.hops || byName(a.r, b.r));
}

export async function letRumorsSpread() {
  const changes = spreadRumors(worldEntries(), makeRng(Date.now()));
  if (!changes.length) { toast('No rumor travelled this time.'); return 0; }
  let towns = 0;
  for (const c of changes) {
    const before = Object.keys(reach(c.rumor)).length;
    try { await patchEntry(c.rumor, { fields: { spread: JSON.stringify(c.spread) } }); towns += Object.keys(reach(world.entries.get(c.rumor.id))).length - before; }
    catch (err) { toast(err.message, 'bad'); }
  }
  toast(`${changes.length} rumor${changes.length === 1 ? '' : 's'} reached ${towns} new town${towns === 1 ? '' : 's'}`);
  return changes.length;
}

function addForm(townId, after) {
  const text = el('input', { type: 'text', placeholder: 'What people are saying…', 'aria-label': 'Rumor', maxlength: 400 });
  const truth = el('select', { 'aria-label': 'How true is it' }, TRUTHS.map((t) => el('option', { value: t }, t)));
  truth.value = 'Unknown';
  const towns = worldEntries().filter((e) => e.kind === 'settlement').sort(byName);
  const where = townId ? null : el('select', { 'aria-label': 'Started in' }, towns.map((t) => el('option', { value: t.id }, t.name)));
  const form = el('form', { class: 'controls rumor-add' },
    text, el('button', { class: 'btn small ghost', type: 'button', onclick: () => { text.value = D.TABLES.rumor.items[Math.floor(Math.random() * D.TABLES.rumor.items.length)]; } }, 'Roll one'),
    where, isGm() ? truth : null, el('button', { class: 'btn small primary', type: 'submit' }, isGm() ? 'Start the rumor' : 'Suggest it'));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const t = text.value.trim(); if (!t) { text.focus(); return; }
    const home = townId || where?.value;
    if (!home) { toast('Add a town first: rumors start somewhere.', 'bad'); return; }
    try {
      await createEntry({ kind: 'rumor', name: t.length > 60 ? `${t.slice(0, 58).replace(/\s\S*$/, '')}…` : t, summary: t, parent_id: home, secret: isGm() ? `Truth: ${truth.value}.` : '', fields: { source: '' } });
      toast(isGm() ? 'The rumor is out' : 'Suggested to the GMs'); after();
    } catch (err) { toast(err.message, 'bad'); }
  });
  return form;
}

// The Rumors tab on a town.
export function rumorSection(place, rerender) {
  const list = rumorsAt(place.id);
  return el('div', { class: 'rumors' },
    list.length ? el('ul', { class: 'rumor-list' }, list.map(({ r, v }) => el('li', { class: 'rumor card' },
      el('blockquote', {}, `“${v.text}”`),
      el('div', { class: 'muted small' }, v.hops ? `Heard here third-hand (${v.hops} retelling${v.hops === 1 ? '' : 's'} from ${getEntry(r.parent_id)?.name || 'elsewhere'}). ` : 'Started here. ',
        link(r, 'About this rumor'), isGm() && truthOf(r) ? el('span', { class: 'tag' }, truthOf(r)) : null))))
      : el('p', { class: 'muted' }, `No rumors going around ${place.name} yet.`),
    isMember() ? addForm(place.id, rerender) : null,
    isGm() ? el('div', { class: 'btnrow' }, el('button', { class: 'btn small', type: 'button', onclick: async () => { await letRumorsSpread(); rerender(); } }, 'Let rumors spread')) : null);
}

// Replaces the plain list for the Rumors kind: how far each rumor has gone, and the spread button.
export function viewRumors(rerender) {
  const list = worldEntries().filter((e) => e.kind === 'rumor').sort(byName);
  const box = el('div', { class: 'w-view' },
    el('div', { class: 'panel-head row' }, el('div', {}, el('h2', {}, 'Rumors'), el('p', {}, 'Gossip starts in one town and travels: to towns that trade with it, then across the area and the region, changing a little with every telling.')),
      isGm() ? el('button', { class: 'btn primary', type: 'button', onclick: async () => { await letRumorsSpread(); rerender(); } }, 'Let rumors spread') : null),
    isMember() ? el('section', { class: 'card' }, el('h3', {}, isGm() ? 'Start a rumor' : 'Suggest a rumor'), addForm(null, rerender)) : null,
    list.length ? el('ul', { class: 'rumor-list' }, list.map((r) => {
      const where = Object.entries(reach(r)).map(([id, v]) => [getEntry(id), v]).filter(([t]) => t);
      return el('li', { class: 'rumor card' },
        el('div', { class: 'entry-head' }, link(r), isGm() && truthOf(r) ? el('span', { class: 'tag' }, truthOf(r)) : null),
        el('blockquote', {}, `“${r.summary || r.name}”`),
        el('p', { class: 'small' }, `Heard in ${where.length} town${where.length === 1 ? '' : 's'}: `, where.flatMap(([t, v], i) => [i ? ', ' : '', link(t), v.hops ? el('span', { class: 'muted' }, ` (${v.hops})`) : null])));
    })) : notice('No rumors yet', 'Start one in a town, or roll one from the tavern table.'));
  return box;
}

