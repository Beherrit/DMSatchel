// The admin page: GM invite codes, world settings, activity, backups.
import { el, toast, copyText, download, confirmButton } from './dom.js';
import { api, isAdmin, session } from './api.js';
import { loadWorld } from './world-ui.js';
import { openSignIn } from './signin.js';
import { KINDS } from './world-schema.js';

let root;
const when = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'never');

function codeBox(name, code) {
  return el('div', { class: 'code-box', role: 'status' },
    el('p', {}, el('strong', {}, `${name}’s invite code`), ' (shown once; copy it now and send it to them privately):'),
    el('div', { class: 'code-row' }, el('code', {}, code), el('button', { class: 'btn small', type: 'button', onclick: () => copyText(code) }, 'Copy')),
    el('p', { class: 'muted small' }, `They open ${location.origin}, choose “GM sign in” and enter the code.`));
}

async function gmsSection() {
  const box = el('section', { class: 'card' }, el('h3', {}, 'Game Masters'));
  const out = el('div');
  const list = el('div', { class: 'gm-table' }, el('p', { class: 'muted' }, 'Loading…'));
  const name = el('input', { type: 'text', id: 'a-gm-name', placeholder: 'Their name, as other GMs will see it', maxlength: 60 });
  const role = el('select', { id: 'a-gm-role' }, el('option', { value: 'gm' }, 'GM'), el('option', { value: 'admin' }, 'Admin'));
  const form = el('form', { class: 'controls' }, el('div', { class: 'field grow' }, el('label', { for: 'a-gm-name' }, 'Add a GM'), name),
    el('div', { class: 'field' }, el('label', { for: 'a-gm-role' }, 'Role'), role), el('button', { class: 'btn primary', type: 'submit' }, 'Create invite code'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const r = await api('gms', { method: 'POST', body: { name: name.value, role: role.value } }); out.replaceChildren(codeBox(r.gm.name, r.code)); name.value = ''; refresh(); }
    catch (err) { out.replaceChildren(el('p', { class: 'error' }, err.message)); }
  });
  async function patch(id, body, label) {
    try { const r = await api('gms', { method: 'PATCH', body: { id, ...body } }); if (r.code) out.replaceChildren(codeBox(r.gm.name, r.code)); else toast(label); refresh(); }
    catch (err) { toast(err.message, 'bad'); }
  }
  async function refresh() {
    try {
      const r = await api('gms');
      list.replaceChildren(el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['Name', 'Role', 'Last seen', 'Edits', ''].map((h) => el('th', {}, h)))),
        el('tbody', {}, r.gms.map((g) => el('tr', { class: g.disabled ? 'disabled' : '' },
          el('td', {}, g.name, g.disabled ? el('span', { class: 'tag' }, 'Locked out') : null), el('td', {}, g.role === 'admin' ? 'Admin' : 'GM'), el('td', {}, when(g.last_seen)), el('td', { class: 'num' }, g.edits),
          el('td', {}, el('div', { class: 'actions' }, g.id === session.gm.id ? el('span', { class: 'muted small' }, 'You') : [
            confirmButton('New code', () => patch(g.id, { newCode: true })),
            el('button', { class: 'btn small ghost', type: 'button', onclick: () => patch(g.id, { disabled: !g.disabled }, g.disabled ? `${g.name} can sign in again` : `${g.name} is locked out`) }, g.disabled ? 'Unlock' : 'Lock out'),
            el('button', { class: 'btn small ghost', type: 'button', onclick: () => patch(g.id, { role: g.role === 'admin' ? 'gm' : 'admin' }, 'Role changed') }, g.role === 'admin' ? 'Make GM' : 'Make admin'),
          ]))))))));
    } catch (err) { list.replaceChildren(el('p', { class: 'error' }, err.message)); }
  }
  box.append(el('p', { class: 'muted' }, 'Each GM gets a personal code. Their edits carry their name. “New code” replaces a lost code and signs them out everywhere; “Lock out” removes access without deleting their work.'), form, out, list);
  refresh();
  return box;
}

async function settingsSection() {
  const box = el('section', { class: 'card' }, el('h3', {}, 'World settings'));
  let w = {};
  try { w = (await api('settings')).world || {}; } catch { /* empty */ }
  const f = (id, label, value, long, hint) => el('div', { class: 'field wide' }, el('label', { for: id }, label), long ? el('textarea', { id, rows: long }, value || '') : el('input', { type: 'text', id, value: value || '' }), hint ? el('small', { class: 'muted' }, hint) : null);
  const status = el('p', { class: 'form-status', role: 'status' });
  const form = el('form', { class: 'edit-form' }, f('s-name', 'World name', w.name), f('s-tagline', 'Tagline', w.tagline), f('s-about', 'Introduction for players', w.about, 6, 'Shown on the world’s front page. [[Entry names]] become links.'),
    f('s-cal', 'Calendar & current date', w.calendar, 3), status, el('button', { class: 'btn primary', type: 'submit' }, 'Save settings'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('settings', { method: 'PUT', body: { name: form.querySelector('#s-name').value, tagline: form.querySelector('#s-tagline').value, about: form.querySelector('#s-about').value, calendar: form.querySelector('#s-cal').value } });
      status.textContent = 'Saved.'; status.className = 'form-status'; loadWorld(true);
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  box.append(form);
  return box;
}

async function activitySection() {
  const box = el('section', { class: 'card' }, el('h3', {}, 'Recent activity'));
  try {
    const r = await api('activity');
    box.append(r.activity.length ? el('ul', { class: 'plain activity' }, r.activity.map((h) => el('li', {}, el('span', { class: 'muted small' }, when(h.at)), ' ', el('strong', {}, h.gm || 'Someone'), ` ${{ create: 'created', edit: 'edited', delete: 'deleted', restore: 'restored', import: 'imported' }[h.action] || h.action} `,
      h.entry_name ? el('a', { href: `#world/e/${h.entry_id}` }, h.entry_name) : 'an entry', h.kind ? el('span', { class: 'kind-tag' }, KINDS[h.kind]?.label || h.kind) : null))) : el('p', { class: 'muted' }, 'No changes yet.'));
  } catch (err) { box.append(el('p', { class: 'error' }, err.message)); }
  return box;
}

function backupSection() {
  const status = el('p', { class: 'form-status', role: 'status' });
  const file = el('input', { type: 'file', id: 'a-import', accept: 'application/json,.json', hidden: true });
  file.addEventListener('change', async () => {
    const f = file.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const entries = Array.isArray(data) ? data : data.entries;
      if (!Array.isArray(entries)) throw new Error('That file has no entries in it.');
      status.textContent = `Importing ${entries.length} entries…`;
      const r = await api('entries', { method: 'POST', body: { mode: 'import', entries } });
      if (data.world) await api('settings', { method: 'PUT', body: data.world });
      status.textContent = `Imported ${r.imported} entries. Entries with the same id were replaced.`;
      loadWorld(true);
    } catch (err) { status.textContent = err.message || 'That file isn’t a world backup.'; status.className = 'form-status error'; }
    file.value = '';
  });
  return el('section', { class: 'card' }, el('h3', {}, 'Backup'),
    el('p', { class: 'muted' }, 'Download the whole world, GM secrets included, as one JSON file. Keep a copy somewhere safe. Importing a backup adds its entries and replaces any with the same id.'),
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn', type: 'button', onclick: async () => {
        try { const r = await api('entries'); download(`world-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ exported: new Date().toISOString(), world: r.world, entries: r.entries }, null, 2), 'application/json'); }
        catch (err) { toast(err.message, 'bad'); }
      } }, 'Download backup'),
      el('label', { class: 'btn', for: 'a-import' }, 'Import backup…'), file), status);
}

export async function showAdmin() {
  if (!isAdmin()) {
    root.replaceChildren(el('div', { class: 'card empty-state' }, el('h3', {}, 'Admin only'),
      el('p', {}, session.gm ? 'Your account is a GM account. Ask the admin if you need admin access.' : 'Sign in with the admin code to manage GMs and the world.'),
      session.gm ? null : el('button', { class: 'btn primary', type: 'button', onclick: openSignIn }, 'Sign in')));
    return;
  }
  root.replaceChildren(el('div', { class: 'panel-head' }, el('h2', {}, 'Admin'), el('p', {}, 'Invite GMs, name the world, watch what changes and keep backups.')));
  const parts = await Promise.all([gmsSection(), settingsSection(), activitySection()]);
  root.append(el('div', { class: 'admin-grid' }, parts[0], parts[1], parts[2], backupSection()));
}

export function mountAdmin(r) { root = r; }
