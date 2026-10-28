// Goals on a character's page: what the player wants for their character, short and long term. The player and the
// GMs add goals and mark them advanced or done; a goal can be kept from the rest of the party.
import { el, toast } from './dom.js';
import { isGm, session } from './api.js';
import { getEntry, patchEntry, richText } from './world-store.js';
import { TERMS, STATES, readGoals, addGoal, setGoal, removeGoal } from './goals.js';

const termLabel = (t) => TERMS.find(([k]) => k === t)?.[1] || t;

export function goalsSection(c, rerender) {
  if (c.kind !== 'character') return null;
  const list = readGoals(c);
  const can = isGm() || (session.gm && c.owner_id === session.gm.id);
  if (!list.length && !can) return null;
  const save = async (next, msg) => {
    try { await patchEntry(getEntry(c.id) || c, { fields: { goals: JSON.stringify(next) } }); if (msg) toast(msg); rerender(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  const text = el('input', { type: 'text', id: 'goal-new', maxlength: 300, placeholder: 'e.g. Find out who burned the [[Old Mill]]', 'aria-label': 'New goal' });
  const term = el('select', { 'aria-label': 'Short or long term' }, TERMS.map(([v, t]) => el('option', { value: v }, t)));
  const secret = el('input', { type: 'checkbox', id: 'goal-secret' });
  const add = can ? el('form', { class: 'goal-add controls' }, text, term, el('label', { class: 'check', for: 'goal-secret' }, secret, ' Keep from the party'), el('button', { class: 'btn small', type: 'submit' }, 'Add goal')) : null;
  add?.addEventListener('submit', (ev) => { ev.preventDefault(); if (!text.value.trim()) { text.focus(); return; } save(addGoal(list, text.value, term.value, secret.checked), 'Goal added'); });
  const order = [...list].sort((a, b) => (a.state === 'done') - (b.state === 'done') || (a.term === b.term ? 0 : a.term === 'short' ? -1 : 1));
  return el('section', { class: 'card goals' },
    el('h3', {}, 'Goals'),
    order.length ? el('ul', { class: 'plain goal-list' }, order.map((g) => {
      const state = can ? el('select', { class: 'goal-state', 'aria-label': `How it’s going: ${g.text}` }, STATES.map(([v, t]) => el('option', { value: v }, t))) : null;
      if (state) { state.value = g.state; state.addEventListener('change', () => save(setGoal(list, g.id, { state: state.value }), state.value === 'done' ? 'Goal done' : null)); }
      return el('li', { class: `goal goal-${g.state}` },
        el('div', { class: 'goal-text' }, richText(g.text),
          el('span', { class: 'goal-tags small' }, el('span', { class: 'tag' }, termLabel(g.term)), g.secret ? el('span', { class: 'tag' }, 'kept from the party') : null,
            !can && g.state !== 'open' ? el('span', { class: 'tag' }, STATES.find(([v]) => v === g.state)[1]) : null)),
        state,
        can ? el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Remove goal: ${g.text}`, onclick: () => save(removeGoal(list, g.id)) }, '✕') : null);
    })) : el('p', { class: 'muted small' }, 'What does this character want? Short-term goals give the GMs hooks for next session; long-term ones shape the campaign.'),
    add);
}
