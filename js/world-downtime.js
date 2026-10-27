// Downtime between sessions: players file what their character does (train, craft, carouse, research…); a GM
// writes how it turned out. Each lands in that character's history on their page.
// Route: #world/downtime
import { el, toast, setKids } from './dom.js';
import { isGm, isMember, session } from './api.js';
import { worldEntries, createEntry, patchEntry, getEntry, link, when, byName, richText, notice } from './world-store.js';
import { DOWNTIME_ACTIVITIES } from './world-schema.js';

const ACTIVE = (e) => !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);
const downtimeOf = (charId) => worldEntries().filter((d) => d.kind === 'downtime' && d.fields?.character === charId);
const newestFirst = (a, b) => String(b.created_at).localeCompare(String(a.created_at));

// One activity: what was done, by whom, and the outcome (or that it's waiting for a GM).
function item(d, { showChar = true, resolve = null } = {}) {
  const f = d.fields || {}, ch = getEntry(f.character);
  return el('li', { class: `card downtime-item${f.resolved ? ' is-resolved' : ' is-waiting'}${d.visibility === 'gm' ? ' is-hidden' : ''}` },
    el('div', { class: 'entry-head' }, el('div', {}, showChar && ch ? [link(ch), ' · '] : null, el('strong', {}, f.activity || 'Downtime'),
      f.days ? el('span', { class: 'muted small' }, ` · ${f.days} day${String(f.days) === '1' ? '' : 's'}`) : null, f.cost ? el('span', { class: 'muted small' }, ` · ${f.cost}`) : null),
      el('span', { class: `tag${f.resolved ? '' : ' waiting-tag'}` }, f.resolved ? 'Resolved' : 'Waiting for a GM')),
    d.summary ? el('p', {}, d.summary) : null,
    f.outcome ? el('div', { class: 'downtime-outcome' }, el('span', { class: 'label' }, 'Outcome'), richText(f.outcome)) : null,
    el('p', { class: 'muted small' }, `${d.owner || d.created_by || 'Someone'}, ${when(d.created_at)}${d.visibility === 'gm' ? ' · only the GMs and the player can see this' : ''} · `, link(d, 'Open')),
    resolve);
}

// The GM's resolve box: write the outcome, mark it resolved (or edit an outcome already written).
function resolveBox(d, after) {
  const text = el('textarea', { rows: 3, 'aria-label': `Outcome for ${d.name}`, placeholder: 'How it went: what they gained, spent, learned or got into.' }, d.fields?.outcome || '');
  const save = async () => {
    if (!text.value.trim()) { text.focus(); return; }
    try { await patchEntry(d, { fields: { outcome: text.value.trim(), resolved: d.fields?.resolved || new Date().toISOString() } }); toast('Outcome saved: the player can see it'); after(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  return el('div', { class: 'downtime-resolve' }, text, el('div', { class: 'btnrow' }, el('button', { class: 'btn small primary', type: 'button', onclick: save }, d.fields?.resolved ? 'Update outcome' : 'Resolve')));
}

function fileForm(after, preset) {
  const mine = worldEntries().filter((e) => e.kind === 'character' && ACTIVE(e) && (isGm() || e.owner_id === session.gm?.id)).sort(byName);
  if (!mine.length) return el('div', { class: 'card' }, el('p', { class: 'muted' }, isGm() ? 'There are no active player characters yet.' : 'Make or claim a character first, then you can file their downtime here.'),
    isGm() ? null : el('a', { class: 'btn small', href: '#world/new/character' }, '+ My character'));
  const ch = el('select', { id: 'dt-char' }, mine.map((c) => el('option', { value: c.id }, c.name)));
  if (preset && mine.some((c) => c.id === preset)) ch.value = preset;
  const act = el('select', { id: 'dt-act' }, DOWNTIME_ACTIVITIES.map((a) => el('option', { value: a }, a)));
  const days = el('input', { type: 'text', id: 'dt-days', inputmode: 'numeric', placeholder: 'e.g. 5' });
  const cost = el('input', { type: 'text', id: 'dt-cost', placeholder: 'e.g. 25 gp' });
  const what = el('textarea', { id: 'dt-what', rows: 3, placeholder: 'What they do, where, and what they hope to get out of it.' });
  const priv = el('input', { type: 'checkbox', id: 'dt-private' });
  const status = el('p', { class: 'form-status', role: 'status' });
  const form = el('form', { class: 'card edit-form downtime-form' }, el('h3', {}, 'File downtime'),
    el('div', { class: 'edit-fields' },
      el('div', { class: 'field' }, el('label', { for: 'dt-char' }, 'Character'), ch),
      el('div', { class: 'field' }, el('label', { for: 'dt-act' }, 'Activity'), act),
      el('div', { class: 'field' }, el('label', { for: 'dt-days' }, 'Days spent'), days),
      el('div', { class: 'field' }, el('label', { for: 'dt-cost' }, 'Cost (optional)'), cost),
      el('div', { class: 'field wide' }, el('label', { for: 'dt-what' }, 'What they do'), what)),
    el('label', { class: 'check' }, priv, ' Keep it between me and the GMs'),
    status, el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'File it')));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!what.value.trim()) { status.textContent = 'Say what they do.'; status.className = 'form-status error'; what.focus(); return; }
    const c = getEntry(ch.value);
    try {
      await createEntry({ kind: 'downtime', name: `${c.name}: ${act.value}`, summary: what.value.trim(), visibility: priv.checked ? 'gm' : 'all',
        fields: { character: c.id, activity: act.value, days: days.value.trim(), cost: cost.value.trim() } });
      toast(isGm() ? 'Downtime filed' : 'Filed: a GM will write how it goes');
      after();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return form;
}

export function viewDowntime(rerender, preset) {
  if (!isMember()) return notice('Members only', 'Join this world to file and read downtime.');
  const all = worldEntries().filter((d) => d.kind === 'downtime').sort(newestFirst);
  const waiting = all.filter((d) => !d.fields?.resolved), done = all.filter((d) => d.fields?.resolved);
  const mineIds = new Set(worldEntries().filter((e) => e.kind === 'character' && e.owner_id === session.gm?.id).map((e) => e.id));
  const yours = isGm() ? [] : all.filter((d) => mineIds.has(d.fields?.character) || d.owner_id === session.gm?.id);
  return el('div', { class: 'w-view downtime-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Downtime'),
      el('p', {}, 'What the characters do between sessions. Players file an activity; a GM writes how it turned out, and it’s kept on the character’s page.')),
    isGm() ? el('section', {}, el('h3', { class: 'section-title' }, `Waiting for a GM (${waiting.length})`),
      waiting.length ? el('ul', { class: 'downtime-list' }, waiting.map((d) => item(d, { resolve: resolveBox(d, rerender) }))) : el('p', { class: 'muted' }, 'Nothing waiting. All caught up.'))
      : yours.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Yours'), el('ul', { class: 'downtime-list' }, yours.map((d) => item(d)))) : null,
    fileForm(rerender, preset),
    el('section', {}, el('h3', { class: 'section-title' }, 'Recently resolved'),
      done.length ? el('ul', { class: 'downtime-list' }, done.slice(0, 30).map((d) => item(d, { resolve: isGm() ? el('details', {}, el('summary', { class: 'small' }, 'Edit outcome'), resolveBox(d, rerender)) : null })))
        : el('p', { class: 'muted' }, 'Nothing resolved yet.')));
}

// On a character's page: their downtime, newest first.
export function downtimeSection(e) {
  const list = downtimeOf(e.id).sort(newestFirst);
  const canFile = isGm() || e.owner_id === session.gm?.id;
  if (!list.length && !canFile) return null;
  return el('section', { class: 'downtime-section' },
    el('div', { class: 'entry-head' }, el('h3', {}, 'Downtime'), canFile ? el('a', { class: 'btn small', href: `#world/downtime/${e.id}` }, 'File downtime') : null),
    list.length ? el('ul', { class: 'downtime-list' }, list.map((d) => item(d, { showChar: false }))) : el('p', { class: 'muted small' }, 'Nothing yet. What do they do between sessions?'));
}
