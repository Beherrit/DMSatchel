// A riddle on a handout's page: the hints shown so far, a box to answer it (checked by the server, so the answer
// never reaches players), who has solved it, and for GMs the answer and a button to reveal the next hint.
import { el, toast } from './dom.js';
import { api, isGm, isMember, previewing } from './api.js';
import { world, getEntry, patchEntry } from './world-store.js';
import { readSolved, hintsOf, shownHints } from './riddle.js';

export function riddleCard(h, rerender) {
  if (h.kind !== 'handout') return null;
  const f = h.fields || {}, gm = isGm(), riddle = gm ? Boolean(f.answer) : f.riddle === 'yes';
  if (!riddle) return null;
  const all = hintsOf(f.hints), shown = gm ? shownHints(f.hints, f.hints_shown) : hintsOf(f.hints), solved = readSolved(f.solved);
  const guess = el('input', { type: 'text', id: 'riddle-guess', maxlength: 200, placeholder: 'Your answer', 'aria-label': 'Your answer to the riddle', autocomplete: 'off' });
  const out = el('p', { class: 'small riddle-result', role: 'status' });
  const form = isMember() && !previewing() && !gm ? el('form', { class: 'controls riddle-form' }, guess, el('button', { class: 'btn small primary', type: 'submit' }, 'Answer')) : null;
  form?.addEventListener('submit', async (ev) => {
    ev.preventDefault(); if (!guess.value.trim()) { guess.focus(); return; }
    try {
      const r = await api('entries', { method: 'PATCH', body: { guess: { handout: h.id, text: guess.value } } });
      if (r.correct) { for (const e of r.entries || []) world.entries.set(e.id, e); toast('That’s it!'); rerender(); }
      else { out.textContent = `“${guess.value.trim()}” isn’t it.`; out.classList.add('bad-line'); guess.select(); }
    } catch (err) { toast(err.message, 'bad'); }
  });
  // Hints: GMs reveal them one at a time.
  const reveal = gm && shown.length < all.length ? el('button', { class: 'btn small riddle-hint', type: 'button', onclick: async () => {
    try { await patchEntry(getEntry(h.id) || h, { fields: { hints_shown: String(shown.length + 1) } }); toast(`Hint ${shown.length + 1} revealed`); rerender(); } catch (err) { toast(err.message, 'bad'); }
  } }, `Reveal hint ${shown.length + 1} of ${all.length}`) : null;
  return el('section', { class: 'card riddle' }, el('h3', {}, '🧩 Riddle'),
    gm ? el('p', { class: 'small riddle-answer' }, el('strong', {}, 'Answer: '), f.answer.split('|').map((x) => x.trim()).join(' or '), el('span', { class: 'muted' }, ' (only GMs see this)')) : null,
    shown.length ? el('ol', { class: 'small riddle-hints' }, shown.map((x) => el('li', {}, x))) : null,
    reveal,
    solved.length ? el('p', { class: 'small riddle-solved' }, `✔ Solved by ${solved.map((x) => x.name).join(', ')}`) : form ? null : el('p', { class: 'muted small' }, 'Nobody has solved it yet.'),
    form, out);
}
