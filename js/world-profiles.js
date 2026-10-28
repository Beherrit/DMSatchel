// Member profiles: everyone sets their pronouns and a short note for the table (availability, what they enjoy).
// The party page lists the table with each person's profile; your own row is a small form.
import { el, toast, setKids } from './dom.js';
import { api, isMember, session } from './api.js';
import { world } from './world-store.js';

const ROLE = { owner: 'Owner', gm: 'GM', player: 'Player' };
const COMMON = ['she/her', 'he/him', 'they/them', 'she/they', 'he/they', 'any pronouns'];

// "Pip (she/her)" wherever a member's name appears.
export const withPronouns = (id, name) => { const p = world.info?.pronouns?.[id]; return p ? `${name} (${p})` : name; };

export function tableCard() {
  if (!isMember()) return null;
  const box = el('section', { class: 'table-card', 'aria-labelledby': 'table-h' }, el('h3', { class: 'section-title', id: 'table-h' }, 'At the table'), el('p', { class: 'muted small' }, 'Loading…'));
  const draw = (members, me) => {
    const mine = members.find((m) => m.id === me);
    const pronouns = el('input', { type: 'text', id: 'pf-pronouns', list: 'pf-common', maxlength: 40, value: mine?.pronouns || '', placeholder: 'e.g. they/them' });
    const note = el('textarea', { id: 'pf-note', rows: 2, maxlength: 600, placeholder: 'When you can play, what you enjoy, anything the table should know' }, mine?.note || '');
    const form = mine ? el('form', { class: 'pf-form' },
      el('div', { class: 'field' }, el('label', { for: 'pf-pronouns' }, 'Your pronouns'), pronouns, el('datalist', { id: 'pf-common' }, COMMON.map((c) => el('option', { value: c })))),
      el('div', { class: 'field wide' }, el('label', { for: 'pf-note' }, 'A note for the table'), note),
      el('button', { class: 'btn small', type: 'submit' }, 'Save my profile')) : null;
    form?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try {
        const r = await api('party', { method: 'PUT', body: { profile: { pronouns: pronouns.value, note: note.value } } });
        Object.assign(mine, r.profile);
        const all = { ...(world.info?.pronouns || {}) };
        if (r.profile.pronouns) all[me] = r.profile.pronouns; else delete all[me];
        world.info = { ...world.info, pronouns: all };
        toast('Profile saved'); draw(members, me);
      } catch (err) { toast(err.message, 'bad'); }
    });
    setKids(box, el('h3', { class: 'section-title', id: 'table-h' }, 'At the table'),
      el('ul', { class: 'plain table-people' }, members.map((m) => el('li', {},
        el('div', {}, el('strong', {}, m.name), m.pronouns ? el('span', { class: 'muted small' }, ` (${m.pronouns})`) : null, el('span', { class: 'tag' }, ROLE[m.role] || m.role), m.id === me ? el('span', { class: 'muted small' }, ' you') : null),
        m.note ? el('p', { class: 'small' }, m.note) : null))),
      form ? el('details', { class: 'pf-edit' }, el('summary', {}, mine.pronouns || mine.note ? 'Edit your profile' : 'Add your pronouns and a note'), form) : null);
  };
  api('party', { query: { members: 1 } }).then((r) => draw(r.members, r.me ?? session.gm?.id)).catch((err) => setKids(box, el('p', { class: 'muted small' }, err.message)));
  return box;
}
