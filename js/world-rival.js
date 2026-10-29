// A rival party (GMs, in a place's Powers tab): roll another adventuring company, reroll until it fits, and save it
// as a guild with its four members (linked to it, tagged "rival"). Their grudge goes in the company's GM secret.
import { el, toast, setKids } from './dom.js';
import { createEntry, createEntries, link } from './world-store.js';
import { partyDefaults } from './encounter-ui.js';
import { makeRng } from './rng.js';
import { rivalParty } from './rival.js';

export function rivalBox(place, rerender) {
  const rng = makeRng(`${Date.now()}-${Math.random()}`);
  let r = rivalParty(rng, { level: partyDefaults().level, place });
  const box = el('div', { class: 'preview card rival-box' });
  const status = el('p', { class: 'form-status', role: 'status' });
  const draw = () => setKids(box,
    el('div', { class: 'entry-head' }, el('h4', {}, 'A rival party'), el('button', { class: 'reroll', type: 'button', 'aria-label': 'Close', onclick: () => box.remove() }, '✕')),
    el('label', { class: 'sr-only', for: 'rv-name' }, 'Name of the company'),
    el('input', { type: 'text', id: 'rv-name', class: 'draft-name', value: r.company.name, maxlength: 200, onchange: (ev) => { r.company.name = ev.target.value.trim() || r.company.name; } }),
    el('p', { class: 'small' }, r.company.summary),
    el('ul', { class: 'plain rival-members' }, r.members.map((m) => el('li', {}, el('strong', {}, m.name), el('span', { class: 'muted small' }, ` ${m.fields.ancestry} ${m.fields.level}`), el('div', { class: 'small' }, m.summary.split('; ')[1])))),
    el('p', { class: 'small secret-line' }, el('strong', {}, 'GM only: '), `Their grudge: ${r.grudge}.`),
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn small primary', type: 'button', onclick: save }, 'Save the company and its people'),
      el('button', { class: 'btn small', type: 'button', onclick: () => { r = rivalParty(rng, { level: partyDefaults().level, place }); draw(); } }, '↻ Another')),
    status);
  async function save() {
    status.textContent = 'Saving…'; status.className = 'form-status';
    try {
      const company = await createEntry(r.company);
      await createEntries(r.members.map((m) => ({ ...m, links: [{ id: company.id, label: 'member of' }] })));
      toast(`Saved ${company.name} and its four members`);
      box.replaceWith(el('p', { class: 'small' }, 'Saved: ', link(company), '.'));
      rerender();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  }
  draw();
  return box;
}
