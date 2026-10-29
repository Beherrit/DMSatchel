// Hall of heroes: characters who died, retired or went missing, with how and when, their player's epitaph and the
// sessions they played. Route: #world/hall. Also the farewell card on an ended character's page.
import { el, toast } from './dom.js';
import { isGm, session } from './api.js';
import { worldEntries, getEntry, link, patchEntry, richText, mentions, notice } from './world-store.js';
import { thumb } from './image-ui.js';
import { worldCalendar, todayText } from './world-calendar.js';
import { hallOfHeroes, hasEnded } from './hall.js';

const VERB = { Dead: 'Fell', Retired: 'Retired', Missing: 'Went missing' };

function story(c) {
  const f = c.fields || {};
  return [
    el('p', { class: 'hall-when small' }, el('span', { class: 'tag' }, VERB[f.status] || f.status), f.fate_day ? ` ${f.fate_day}` : ''),
    f.fate ? el('div', { class: 'hall-fate' }, richText(f.fate)) : null,
    f.epitaph ? el('blockquote', { class: 'hall-epitaph' }, f.epitaph, c.owner || f.player ? el('footer', { class: 'small' }, `— ${c.owner || f.player}`) : null) : null,
  ];
}

// On the character's own page, once their story has ended: the farewell, and a form for its player and the GMs.
export function farewellCard(c, rerender) {
  if (!hasEnded(c)) return null;
  const can = isGm() || (session.gm && c.owner_id === session.gm.id);
  const f = c.fields || {};
  const fate = el('textarea', { id: 'fw-fate', rows: 3, maxlength: 4000 }, f.fate || '');
  const day = el('input', { type: 'text', id: 'fw-day', value: f.fate_day || '', placeholder: worldCalendar() ? todayText() : 'e.g. the night the bridge fell', maxlength: 200 });
  const epitaph = el('input', { type: 'text', id: 'fw-epitaph', value: f.epitaph || '', maxlength: 300, placeholder: 'A line to remember them by' });
  const form = can ? el('form', { class: 'fw-form' },
    el('div', { class: 'field' }, el('label', { for: 'fw-fate' }, 'How it ended'), fate),
    el('div', { class: 'field' }, el('label', { for: 'fw-day' }, 'When'), day),
    el('div', { class: 'field' }, el('label', { for: 'fw-epitaph' }, 'Epitaph'), epitaph),
    el('button', { class: 'btn small', type: 'submit' }, 'Save')) : null;
  form?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try { await patchEntry(getEntry(c.id) || c, { fields: { fate: fate.value.trim(), fate_day: day.value.trim(), epitaph: epitaph.value.trim() } }); toast('Saved to the Hall of heroes'); rerender(); }
    catch (err) { toast(err.message, 'bad'); }
  });
  const shown = f.fate || f.fate_day || f.epitaph;
  return el('section', { class: 'card farewell' }, el('h3', {}, 'Farewell'),
    shown ? story(c) : el('p', { class: 'muted small' }, can ? 'How did their story end? Write it here and it goes in the Hall of heroes.' : 'Their story has ended.'),
    form ? el('details', { open: shown ? null : true }, el('summary', {}, shown ? 'Edit the farewell' : 'Write the farewell'), form) : null,
    el('p', { class: 'small' }, el('a', { href: '#world/hall' }, 'Hall of heroes')));
}

export function viewHall() {
  const all = worldEntries();
  const hall = hallOfHeroes(all, mentions);
  const head = el('div', { class: 'panel-head' }, el('h2', {}, 'Hall of heroes'), el('p', {}, 'The characters whose stories have ended, and the sessions they played.'));
  if (!hall.length) return el('div', { class: 'w-view' }, head, notice('Nobody here yet', 'When a character dies, retires or goes missing (their status on their page), they’re remembered here.'));
  return el('div', { class: 'w-view hall-view' }, head,
    el('ul', { class: 'plain hall-list' }, hall.map(({ character: c, sessions, first, last }) => el('li', { class: 'card hall-card' },
      el('div', { class: 'person-head' }, thumb(c, 'avatar'), el('div', {}, el('h3', {}, link(c)),
        el('span', { class: 'muted small' }, [c.fields?.species, c.fields?.class, c.fields?.level && `level ${c.fields.level}`].filter(Boolean).join(' · ')))),
      ...story(c),
      sessions.length ? el('p', { class: 'small' }, `Played ${sessions.length} session${sessions.length === 1 ? '' : 's'}`, first !== last ? [': from ', link(first), ' to ', link(last)] : [': ', link(first)]) : null))));
}
