// Attitudes on entry pages: on a character, how NPCs and powers feel about them; on an NPC or power, how it feels
// about each player character. GMs set them from either side; players see them.
import { el, toast } from './dom.js';
import { isGm } from './api.js';
import { worldEntries, getEntry, patchEntry, link, byName, findByName } from './world-store.js';
import { ATTITUDES, ATTITUDE_KINDS, readAttitudes, withAttitude, towards, tone } from './attitudes.js';

const ACTIVE = (e) => !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);
const chip = (a) => el('span', { class: `att-chip att-${tone(a)}` }, a);

async function setAttitude(character, targetId, a, note, rerender) {
  try {
    await patchEntry(getEntry(character.id) || character, { fields: { attitudes: withAttitude(getEntry(character.id) || character, targetId, a, note) } });
    rerender();
  } catch (err) { toast(err.message, 'bad'); }
}

function picker(value, onChange, label) {
  const s = el('select', { 'aria-label': label }, el('option', { value: '' }, '—'), ATTITUDES.map((a) => el('option', { value: a }, a)));
  s.value = value || '';
  s.addEventListener('change', () => onChange(s.value || null));
  return s;
}

// On a character's page.
export function attitudesOfCharacter(e, rerender) {
  const map = readAttitudes(e);
  const rows = Object.entries(map).map(([id, v]) => ({ target: getEntry(id), ...v })).filter((x) => x.target)
    .sort((x, y) => ATTITUDES.indexOf(x.a) - ATTITUDES.indexOf(y.a) || byName(x.target, y.target));
  if (!rows.length && !isGm()) return null;
  const gm = isGm();
  let add = null;
  if (gm) {
    const targets = worldEntries().filter((x) => ATTITUDE_KINDS.includes(x.kind)).sort(byName);
    const who = el('input', { type: 'text', list: 'att-targets', placeholder: 'An NPC, faction, guild…', 'aria-label': 'Who' });
    const what = picker('Friendly', () => {}, 'Their attitude'); what.value = 'Friendly';
    const note = el('input', { type: 'text', placeholder: 'Why (optional)', 'aria-label': 'Why' });
    add = el('form', { class: 'att-add controls' }, who, what, note, el('button', { class: 'btn small', type: 'submit' }, 'Set'),
      el('datalist', { id: 'att-targets' }, targets.map((t) => el('option', { value: t.name }))));
    add.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const t = findByName(who.value.trim());
      if (!t || !ATTITUDE_KINDS.includes(t.kind)) { toast('Pick an NPC, faction, guild, house, deity or town from the world'); who.focus(); return; }
      setAttitude(e, t.id, what.value, note.value.trim(), rerender);
    });
  }
  return el('section', { class: 'card attitudes' }, el('h3', {}, `How others see ${e.name}`),
    rows.length ? el('ul', { class: 'plain att-list' }, rows.map((r) => el('li', {}, link(r.target), ' ',
      gm ? picker(r.a, (a) => setAttitude(e, r.target.id, a, r.note, rerender), `${r.target.name}’s attitude`) : chip(r.a),
      r.note ? el('span', { class: 'muted small' }, ` ${r.note}`) : null)))
      : el('p', { class: 'muted small' }, 'Nobody has an opinion yet. Set how an NPC or a power feels about them.'),
    add);
}

// On an NPC's or power's page.
export function attitudesToward(e, rerender) {
  if (!ATTITUDE_KINDS.includes(e.kind)) return null;
  const set = towards(worldEntries(), e.id);
  if (!isGm()) {
    return set.length ? el('section', { class: 'card attitudes' }, el('h3', {}, 'How they feel about the party'),
      el('ul', { class: 'plain att-list' }, set.map((x) => el('li', {}, link(x.character), ' ', chip(x.a), x.note ? el('span', { class: 'muted small' }, ` ${x.note}`) : null)))) : null;
  }
  const pcs = worldEntries().filter((c) => c.kind === 'character' && ACTIVE(c)).sort(byName);
  if (!pcs.length) return null;
  return el('section', { class: 'card attitudes' }, el('h3', {}, 'How they feel about the party'),
    el('ul', { class: 'plain att-list' }, pcs.map((c) => {
      const cur = readAttitudes(c)[e.id];
      return el('li', {}, link(c), ' ', picker(cur?.a, (a) => setAttitude(c, e.id, a, cur?.note || '', rerender), `Attitude toward ${c.name}`),
        cur?.note ? el('span', { class: 'muted small' }, ` ${cur.note}`) : null);
    })),
    el('p', { class: 'muted small' }, 'Players see these on their character pages too.'));
}

// One line for session prep: "Brann: Friendly · Vex: Wary".
export function attitudeLine(e) {
  const set = towards(worldEntries(), e.id);
  return set.length ? el('span', { class: 'att-line small' }, set.map((x, i) => [i ? ' · ' : '', `${x.character.name}: `, chip(x.a)])) : null;
}
