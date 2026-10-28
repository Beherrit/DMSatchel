// Party bonds on the character page (set by the character's player or a GM) and on the party page.
import { el, toast } from './dom.js';
import { worldEntries, getEntry, patchEntry, link, byName } from './world-store.js';
import { BOND_LABELS, partyBonds, withBond } from './bonds.js';

const ACTIVE = (e) => e.kind === 'character' && !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);

export function bondsSection(e, rerender) {
  if (e.kind !== 'character') return null;
  const all = partyBonds(worldEntries());
  const mine = all.filter((b) => b.from.id === e.id), toward = all.filter((b) => b.to.id === e.id);
  const can = Boolean(e.can_edit);
  if (!mine.length && !toward.length && !can) return null;
  const save = async (links, msg) => { try { await patchEntry(getEntry(e.id) || e, { links }); toast(msg); rerender(); } catch (err) { toast(err.message, 'bad'); } };
  let add = null;
  const others = worldEntries().filter((c) => ACTIVE(c) && c.id !== e.id).sort(byName);
  if (can && others.length) {
    const label = el('select', { 'aria-label': 'Bond' }, BOND_LABELS.map((l) => el('option', { value: l }, l)));
    const who = el('select', { 'aria-label': 'With' }, others.map((c) => el('option', { value: c.id }, c.name)));
    add = el('form', { class: 'controls bond-add' }, el('span', {}, e.name), label, who, el('button', { class: 'btn small', type: 'submit' }, 'Add bond'));
    add.addEventListener('submit', (ev) => { ev.preventDefault(); save(withBond(getEntry(e.id) || e, who.value, label.value), `${e.name} ${label.value} ${getEntry(who.value)?.name}`); });
  }
  return el('section', { class: 'card bonds' }, el('h3', {}, 'Bonds'),
    mine.length || toward.length ? el('ul', { class: 'plain bond-list' },
      mine.map((b) => el('li', {}, `${e.name} ${b.label} `, link(b.to),
        can ? el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Remove: ${b.label} ${b.to.name}`, onclick: () => save((getEntry(e.id) || e).links.filter((l) => !(l.id === b.to.id && l.label === b.label)), 'Bond removed') }, '✕') : null)),
      toward.map((b) => el('li', {}, link(b.from), ` ${b.label} ${e.name}`)))
      : el('p', { class: 'muted small' }, 'No bonds yet. How is this character tied to the rest of the party?'),
    add);
}

export function partyBondsSection() {
  const bonds = partyBonds(worldEntries()).filter((b) => ACTIVE(b.from) && ACTIVE(b.to));
  if (!bonds.length) return null;
  return el('section', {}, el('h3', { class: 'section-title' }, 'Bonds'),
    el('ul', { class: 'plain bond-list' }, bonds.map((b) => el('li', {}, link(b.from), ` ${b.label} `, link(b.to)))));
}
