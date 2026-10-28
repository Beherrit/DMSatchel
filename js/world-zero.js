// Session zero: the world's primer every member reads when they join (what kind of game it is, tone, house rules,
// safety tools, the table's lines and veils), and each person's private answers for the GMs: a topic checklist,
// their own lines and veils, and anything else, optionally without their name. GMs see what the table said and can
// add it to the primer in one click. Route: #world/zero
import { el, toast, setKids } from './dom.js';
import { api, isGm, isMember } from './api.js';
import { world, richText, notice, when } from './world-store.js';
import { TOPICS, RATINGS, summarize, primerEmpty } from './zero.js';
import { startHereCard } from './world-start.js';

const TOOLS_HINT = 'e.g. We use the X-card: tap it, or type X in chat, to skip anything, no questions asked. Anyone can call a break at any time.';

export async function viewZero() {
  if (!isMember()) return notice('Members only', 'Join this world to read its session zero page.');
  let data;
  try { data = await api('party', { query: { zero: 1 } }); } catch (err) { return notice('Couldn’t load session zero', err.message); }
  const view = el('div', { class: 'w-view zero-view' });
  if (!data.mine.read_at) {
    api('party', { method: 'POST', body: { zero_read: true } }).then(() => { world.info = { ...world.info, zero_read: true }; }).catch(() => {});
  }
  const draw = () => setKids(view,
    el('div', { class: 'panel-head' }, el('h2', {}, 'Session zero'),
      el('p', {}, 'What kind of game this is and how we look after each other at the table. Read it before your first session.')),
    primerCard(data, draw),
    startHereCard({ fresh: true }),
    answerCard(data, draw),
    isGm() ? tableCard(data, draw) : null);
  draw();
  return view;
}

// ---- the primer -----------------------------------------------------------------------------------------------

function primerCard(data, redraw) {
  const p = data.primer;
  if (data.editing || (isGm() && primerEmpty(p))) return primerForm(data, redraw);
  if (primerEmpty(p)) return notice('Nothing here yet', 'The GMs haven’t written the session zero page yet. You can still tell them below what you’d like kept out of the game.');
  const part = (title, body) => (body ? el('section', { class: 'zero-part' }, el('h3', {}, title), body) : null);
  const items = (l) => (l?.length ? el('ul', {}, l.map((x) => el('li', {}, x))) : null);
  return el('article', { class: 'card zero-primer' },
    p.tone ? el('p', { class: 'zero-tone' }, el('span', { class: 'eyebrow' }, 'Tone'), ' ', p.tone) : null,
    part('The game', p.pitch ? richText(p.pitch) : null),
    part('House rules', p.rules ? richText(p.rules) : null),
    part('Safety tools', p.tools ? richText(p.tools) : null),
    p.lines?.length || p.veils?.length ? el('div', { class: 'zero-lv' },
      el('section', { class: 'zero-part' }, el('h3', {}, 'Lines'), el('p', { class: 'muted small' }, 'Kept out of the game entirely.'), items(p.lines) || el('p', { class: 'muted' }, 'None yet.')),
      el('section', { class: 'zero-part' }, el('h3', {}, 'Veils'), el('p', { class: 'muted small' }, 'Can happen, but off screen.'), items(p.veils) || el('p', { class: 'muted' }, 'None yet.'))) : null,
    el('div', { class: 'btnrow' },
      p.updated_by ? el('span', { class: 'muted small' }, `Last changed by ${p.updated_by}${p.updated_at ? `, ${when(p.updated_at)}` : ''}`) : null,
      isGm() ? el('button', { class: 'btn small', type: 'button', onclick: () => { data.editing = true; redraw(); } }, 'Edit') : null));
}

function primerForm(data, redraw) {
  const p = data.primer || {};
  const field = (id, label, input, hint) => el('div', { class: 'field wide' }, el('label', { for: id }, label), input, hint ? el('p', { class: 'muted small' }, hint) : null);
  const area = (id, value, rows, placeholder) => el('textarea', { id, rows, placeholder }, value || '');
  const pitch = area('z-pitch', p.pitch, 4, 'What the campaign is about, where it starts, what the characters should have in common.');
  const tone = el('input', { type: 'text', id: 'z-tone', value: p.tone || '', maxlength: 300, placeholder: 'e.g. Heroic and hopeful, with some horror' });
  const rules = area('z-rules', p.rules, 5, 'Variant and house rules, character creation (point buy?), what’s allowed from which books.');
  const tools = area('z-tools', p.tools, 3, TOOLS_HINT);
  const lines = area('z-lines', (p.lines || []).join('\n'), 4, 'One per line');
  const veils = area('z-veils', (p.veils || []).join('\n'), 4, 'One per line');
  const status = el('p', { class: 'form-status', role: 'status' });
  const form = el('form', { class: 'card zero-form' },
    el('h3', {}, primerEmpty(p) ? 'Write the session zero page' : 'Edit the session zero page'),
    el('p', { class: 'muted small' }, 'Every member of the world sees this. Players can tell you privately below what they’d like kept out.'),
    field('z-pitch', 'The game', pitch), field('z-tone', 'Tone', tone), field('z-rules', 'House rules', rules), field('z-tools', 'Safety tools', tools),
    el('div', { class: 'zero-lv' }, field('z-lines', 'Lines (kept out entirely)', lines), field('z-veils', 'Veils (off screen)', veils)),
    status,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Save'),
      data.editing ? el('button', { class: 'btn', type: 'button', onclick: () => { data.editing = false; redraw(); } }, 'Cancel') : null));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    status.textContent = 'Saving…'; status.className = 'form-status';
    try {
      const r = await api('party', { method: 'PATCH', body: { primer: { pitch: pitch.value, tone: tone.value, rules: rules.value, tools: tools.value, lines: lines.value, veils: veils.value } } });
      data.primer = r.primer; data.editing = false;
      world.info = { ...world.info, primer: primerEmpty(r.primer) ? null : { tone: r.primer.tone, updated_at: r.primer.updated_at } };
      toast('Session zero saved'); redraw();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return form;
}

// ---- your answers ---------------------------------------------------------------------------------------------

function answerCard(data, redraw) {
  const a = data.mine.answer || { ratings: {}, lines: [], veils: [], note: '', anon: false };
  const rows = TOPICS.map((t, i) => {
    const name = `zr-${i}`;
    return el('tr', {}, el('th', { scope: 'row', id: `${name}-l` }, t),
      el('td', {}, el('div', { class: 'zero-rate', role: 'radiogroup', 'aria-labelledby': `${name}-l` },
        RATINGS.map(([v, label]) => el('label', { class: `zr zr-${v || 'fine'}` },
          el('input', { type: 'radio', name, value: v, 'data-topic': t, checked: (a.ratings[t] || '') === v }), ' ', label.replace(/ \(.*/, ''))))));
  });
  const lines = el('textarea', { id: 'za-lines', rows: 3, placeholder: 'One per line' }, (a.lines || []).join('\n'));
  const veils = el('textarea', { id: 'za-veils', rows: 3, placeholder: 'One per line' }, (a.veils || []).join('\n'));
  const note = el('textarea', { id: 'za-note', rows: 3, placeholder: 'Phobias, what you’re hoping for, what you’d rather not do at the table…' }, a.note || '');
  const anon = el('input', { type: 'checkbox', id: 'za-anon', checked: a.anon });
  const status = el('p', { class: 'form-status', role: 'status' });
  const form = el('form', { class: 'card zero-answers' },
    el('h3', {}, isGm() ? 'Your own answers' : 'Tell the GMs privately'),
    el('p', { class: 'muted small' }, 'Only the GMs see these, never other players. Change them whenever you like. A line keeps something out of the game; a veil lets it happen off screen.'),
    el('div', { class: 'zero-table-wrap' }, el('table', { class: 'zero-table' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Topic'), el('th', { scope: 'col' }, 'For me'))), el('tbody', {}, rows))),
    el('div', { class: 'zero-lv' },
      el('div', { class: 'field wide' }, el('label', { for: 'za-lines' }, 'My own lines'), lines),
      el('div', { class: 'field wide' }, el('label', { for: 'za-veils' }, 'My own veils'), veils)),
    el('div', { class: 'field wide' }, el('label', { for: 'za-note' }, 'Anything else the GMs should know'), note),
    el('label', { class: 'check' }, anon, ' Don’t show my name to the GMs'),
    el('p', { class: 'muted small' }, 'With only a few players, the GMs may still be able to guess who wrote what.'),
    status,
    el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'Save my answers'),
      data.mine.answer ? el('span', { class: 'muted small' }, 'Saved. Only the GMs can see it.') : null));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const ratings = {};
    for (const r of form.querySelectorAll('input[type=radio]:checked')) if (r.value) ratings[r.dataset.topic] = r.value;
    status.textContent = 'Saving…'; status.className = 'form-status';
    try {
      const r = await api('party', { method: 'PUT', body: { zero: { ratings, lines: lines.value, veils: veils.value, note: note.value, anon: anon.checked } } });
      data.mine = { answer: r.answer, read_at: data.mine.read_at || new Date().toISOString() };
      if (isGm()) data = Object.assign(data, await api('party', { query: { zero: 1 } }));
      toast(r.answer ? 'Saved for the GMs' : 'Answers cleared'); redraw();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return form;
}

// ---- what the table said (GMs) --------------------------------------------------------------------------------

function tableCard(data, redraw) {
  const s = summarize(data.answers || [], data.primer || {});
  const add = async (key, item) => {
    const p = data.primer || {};
    const next = { ...p, [key]: [...(p[key] || []), item] };
    try {
      const r = await api('party', { method: 'PATCH', body: { primer: next } });
      data.primer = r.primer; world.info = { ...world.info, primer: { tone: r.primer.tone, updated_at: r.primer.updated_at } };
      toast(`Added “${item}” to the ${key}`); redraw();
    } catch (err) { toast(err.message, 'bad'); }
  };
  const names = (l) => l.join(', ');
  const unread = (data.members || []).filter((m) => !m.read_at);
  return el('section', { class: 'card zero-table-said' },
    el('h3', {}, 'What the table told you'),
    el('p', { class: 'muted small' }, `${(data.answers || []).length} of ${(data.members || []).length} members have answered. Anonymous answers have no name.`),
    s.suggest.lines.length || s.suggest.veils.length ? el('div', { class: 'zero-suggest' },
      el('h4', {}, 'Not on the page yet'),
      el('ul', { class: 'plain' },
        s.suggest.lines.map((t) => el('li', {}, el('span', { class: 'zr-tag zr-line' }, 'Line'), ' ', t, ' ', el('button', { class: 'btn small', type: 'button', onclick: () => add('lines', t) }, 'Add to lines'))),
        s.suggest.veils.map((t) => el('li', {}, el('span', { class: 'zr-tag zr-veil' }, 'Veil'), ' ', t, ' ', el('button', { class: 'btn small', type: 'button', onclick: () => add('veils', t) }, 'Add to veils'), ' ', el('button', { class: 'btn small ghost', type: 'button', onclick: () => add('lines', t) }, 'Make it a line'))))) : null,
    s.topics.length ? el('table', { class: 'zero-table' },
      el('thead', {}, el('tr', {}, el('th', { scope: 'col' }, 'Topic'), el('th', { scope: 'col' }, 'Line for'), el('th', { scope: 'col' }, 'Veil for'))),
      el('tbody', {}, s.topics.map((t) => el('tr', {}, el('th', { scope: 'row' }, t.topic), el('td', {}, names(t.line)), el('td', {}, names(t.veil)))))) : null,
    s.lines.length || s.veils.length ? el('ul', { class: 'plain zero-free' },
      s.lines.map((l) => el('li', {}, el('span', { class: 'zr-tag zr-line' }, 'Line'), ` ${l.text} `, el('span', { class: 'muted small' }, `· ${l.who}`))),
      s.veils.map((l) => el('li', {}, el('span', { class: 'zr-tag zr-veil' }, 'Veil'), ` ${l.text} `, el('span', { class: 'muted small' }, `· ${l.who}`)))) : null,
    s.notes.length ? el('div', {}, el('h4', {}, 'Notes'), el('ul', { class: 'plain zero-free' }, s.notes.map((n) => el('li', {}, el('div', {}, richText(n.text)), el('span', { class: 'muted small' }, n.who))))) : null,
    !s.topics.length && !s.lines.length && !s.veils.length && !s.notes.length ? el('p', { class: 'muted' }, 'Nobody has answered yet.') : null,
    data.members?.length ? el('p', { class: 'small' }, el('strong', {}, 'Read it: '), data.members.filter((m) => m.read_at).map((m) => m.name).join(', ') || 'nobody yet',
      unread.length ? el('span', { class: 'muted' }, ` · Not yet: ${unread.map((m) => m.name).join(', ')}`) : null) : null);
}
