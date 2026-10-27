// The admin page: building tools for GMs; members, invites, settings and backups for the world's owner; people for the site admin.
import { el, toast, copyText, download, confirmButton, setKids } from './dom.js';
import { api, isAdmin, isGm, isOwner, isMember, signedIn, session, currentWorld, refreshWorlds, setWorld } from './api.js';
import { loadWorld } from './world-ui.js';
import { world } from './world-store.js';
import { buildSection, pinsSection } from './admin-build.js';
import { openSignIn } from './signin.js';
import { KINDS } from './world-schema.js';
import { markInvitesSeen } from './onboarding.js';

let root;
const when = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'never');

function codeBox(name, code) {
  return el('div', { class: 'code-box', role: 'status' },
    el('p', {}, el('strong', {}, `${name}’s personal code`), ' (shown once; copy it now and send it to them privately):'),
    el('div', { class: 'code-row' }, el('code', {}, code), el('button', { class: 'btn small', type: 'button', onclick: () => copyText(code) }, 'Copy')),
    el('p', { class: 'muted small' }, `They open ${location.origin}, choose “Sign in” and enter the code.`));
}

const ROLE_LABEL = { owner: 'Owner', gm: 'GM', player: 'Player' };
const inviteUrl = (code) => `${location.origin}/#join/${code}`;

// The world owner's page: invite links for GMs and players, and everyone who has joined.
async function membersSection() {
  const box = el('section', { class: 'card' }, el('h3', {}, 'Members & invites'));
  const body = el('div', {}, el('p', { class: 'muted' }, 'Loading…'));
  const wid = currentWorld()?.id || world.info?.id;
  markInvitesSeen();
  async function act(fn, label) {
    try { const r = await fn(); if (label) toast(label); render(r.world); } catch (err) { toast(err.message, 'bad'); }
  }
  function invite(kind, code, blurb) {
    return el('div', { class: 'invite-card' },
      el('div', { class: 'entry-head' }, el('h4', {}, kind === 'gm' ? 'GM invite' : 'Player invite'), el('span', { class: 'muted small' }, blurb)),
      el('div', { class: 'code-row' }, el('code', { class: 'invite-url' }, inviteUrl(code)),
        el('button', { class: 'btn small primary', type: 'button', onclick: () => copyText(inviteUrl(code)) }, 'Copy link'),
        el('button', { class: 'btn small', type: 'button', onclick: () => copyText(code) }, 'Copy code')),
      el('div', { class: 'btnrow' }, confirmButton('New link', () => act(() => api('worlds', { method: 'PATCH', body: { id: wid, rotate: kind } }), 'The old link no longer works'), 'btn small ghost')));
  }
  function render(w) {
    setKids(body,
      el('p', { class: 'muted' }, 'Send a link to your friends. Opening it asks for their name, gives them a personal sign-in code and adds them to this world. GMs can build and see secrets; players can read, add their characters and journals, and suggest new entries.'),
      el('div', { class: 'invite-grid' }, invite('gm', w.gm_invite, 'Can build, edit and see secrets'), invite('player', w.player_invite, 'Read, characters, journals, suggestions')),
      el('h4', {}, `Members (${w.members.length})`),
      el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['Name', 'Role', 'Joined', 'Last seen', 'Edits', ''].map((h) => el('th', {}, h)))),
        el('tbody', {}, w.members.map((m) => {
          const sel = el('select', { 'aria-label': `Role for ${m.name}`, onchange: () => act(() => api('worlds', { method: 'PATCH', body: { id: wid, member: m.id, role: sel.value } }), `${m.name} is now ${ROLE_LABEL[sel.value]}`) },
            Object.entries(ROLE_LABEL).map(([k, t]) => el('option', { value: k }, t)));
          sel.value = m.role;
          return el('tr', {}, el('td', {}, m.name, m.id === session.gm?.id ? el('span', { class: 'muted small' }, ' (you)') : null), el('td', {}, sel),
            el('td', {}, when(m.joined_at)), el('td', {}, when(m.last_seen)), el('td', { class: 'num' }, m.edits),
            el('td', {}, m.id === session.gm?.id ? null : confirmButton('Remove', () => act(() => api('worlds', { method: 'DELETE', query: { id: wid, member: m.id } }), `${m.name} was removed from the world`), 'btn small ghost')));
        })))),
      el('p', { class: 'muted small' }, 'Removing someone keeps everything they wrote. If someone loses their personal code, the site admin can give them a new one.'));
  }
  box.append(body);
  try { render((await api('worlds', { query: { id: wid } })).world); } catch (err) { setKids(body, el('p', { class: 'error' }, err.message)); }
  return box;
}

// Site admin only: every account on the site.
async function peopleSection() {
  const box = el('section', { class: 'card' }, el('h3', {}, 'People'));
  const out = el('div');
  const list = el('div', { class: 'gm-table' }, el('p', { class: 'muted' }, 'Loading…'));
  const name = el('input', { type: 'text', id: 'a-gm-name', placeholder: 'Their name, as others will see it', maxlength: 60 });
  const role = el('select', { id: 'a-gm-role' }, el('option', { value: 'gm' }, 'GM'), el('option', { value: 'player' }, 'Player'), el('option', { value: 'owner' }, 'Owner'), el('option', { value: '' }, 'No world yet'));
  const form = el('form', { class: 'controls' }, el('div', { class: 'field grow' }, el('label', { for: 'a-gm-name' }, 'Add someone'), name),
    el('div', { class: 'field' }, el('label', { for: 'a-gm-role' }, `Role in ${world.info?.name || 'this world'}`), role), el('button', { class: 'btn primary', type: 'submit' }, 'Create personal code'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const r = await api('gms', { method: 'POST', body: { name: name.value, world: role.value ? currentWorld()?.id || world.info?.id : '', role: role.value } });
      setKids(out, codeBox(r.gm.name, r.code)); name.value = ''; refresh();
    } catch (err) { setKids(out, el('p', { class: 'error' }, err.message)); }
  });
  async function patch(id, body, label) {
    try { const r = await api('gms', { method: 'PATCH', body: { id, ...body } }); if (r.code) setKids(out, codeBox(r.gm.name, r.code)); else toast(label); refresh(); }
    catch (err) { toast(err.message, 'bad'); }
  }
  async function refresh() {
    try {
      const r = await api('gms');
      setKids(list, el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, ['Name', 'Worlds', 'Last seen', 'Edits', ''].map((h) => el('th', {}, h)))),
        el('tbody', {}, r.gms.map((g) => el('tr', { class: g.disabled ? 'disabled' : '' },
          el('td', {}, g.name, g.role === 'admin' ? el('span', { class: 'tag' }, 'Site admin') : null, g.disabled ? el('span', { class: 'tag' }, 'Locked out') : null),
          el('td', { class: 'small' }, (g.worlds || []).map((w) => `${w.world} (${ROLE_LABEL[w.role] || w.role})`).join(', ') || el('span', { class: 'muted' }, 'none')),
          el('td', {}, when(g.last_seen)), el('td', { class: 'num' }, g.edits),
          el('td', {}, el('div', { class: 'actions' }, g.id === session.gm.id ? el('span', { class: 'muted small' }, 'You') : [
            confirmButton('New code', () => patch(g.id, { newCode: true })),
            el('button', { class: 'btn small ghost', type: 'button', onclick: () => patch(g.id, { disabled: !g.disabled }, g.disabled ? `${g.name} can sign in again` : `${g.name} is locked out`) }, g.disabled ? 'Unlock' : 'Lock out'),
            confirmButton(g.role === 'admin' ? 'Remove site admin' : 'Make site admin', () => patch(g.id, { admin: g.role !== 'admin' }, 'Changed'), 'btn small ghost'),
          ]))))))));
    } catch (err) { setKids(list, el('p', { class: 'error' }, err.message)); }
  }
  box.append(el('p', { class: 'muted' }, 'Everyone with an account on this site. Most people join through a world’s invite link; you can also create someone here. “New code” replaces a lost code and signs them out everywhere; “Lock out” removes access without deleting their work.'), form, out, list);
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
    f('s-cal', 'Calendar & current date', w.calendar, 3),
    el('label', { class: 'check' }, el('input', { type: 'checkbox', id: 's-public', checked: w.public || null }), ' Open world: anyone with the link can read what players can see'),
    status, el('button', { class: 'btn primary', type: 'submit' }, 'Save settings'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('settings', { method: 'PUT', body: { name: form.querySelector('#s-name').value, tagline: form.querySelector('#s-tagline').value, about: form.querySelector('#s-about').value, calendar: form.querySelector('#s-cal').value, public: form.querySelector('#s-public').checked } });
      status.textContent = 'Saved.'; status.className = 'form-status'; loadWorld(true); refreshWorlds();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  const leave = el('div', { class: 'danger-zone' }, el('h4', {}, 'Archive this world'),
    el('p', { class: 'muted small' }, 'Archiving hides the world from everyone, members included. Nothing is deleted; the site admin can bring it back.'),
    confirmButton('Archive world', async () => {
      try { await api('worlds', { method: 'DELETE', query: { id: w.id } }); setWorld(null, { silent: true }); await refreshWorlds(); toast('Archived'); location.hash = 'worlds'; }
      catch (err) { toast(err.message, 'bad'); }
    }, 'btn ghost'));
  box.append(form, leave);
  return box;
}

async function activitySection() {
  const box = el('section', { class: 'card' }, el('h3', {}, 'Recent activity'));
  try {
    const r = await api('activity');
    box.append(r.activity.length ? el('ul', { class: 'plain activity' }, r.activity.map((h) => el('li', {}, el('span', { class: 'muted small' }, when(h.at)), ' ', el('strong', {}, h.gm || 'Someone'), ` ${{ create: 'created', edit: 'edited', delete: 'deleted', restore: 'restored', import: 'imported', suggest: 'suggested', approve: 'approved', unapprove: 'un-approved', reject: 'rejected', reveal: 'revealed', hide: 'hid', claim: 'claimed', unassign: 'unassigned' }[h.action] || h.action} `,
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
    el('p', { class: 'muted' }, el('a', { href: '#world/export' }, 'Export & print'), ' makes a readable Markdown or print copy, for GMs or players. ',
      'Download the whole world, GM secrets included, as one JSON file. Keep a copy somewhere safe. Importing a backup adds its entries and replaces any with the same id.'),
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn', type: 'button', onclick: async () => {
        try { const r = await api('entries'); download(`world-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ exported: new Date().toISOString(), world: r.world, entries: r.entries }, null, 2), 'application/json'); }
        catch (err) { toast(err.message, 'bad'); }
      } }, 'Download backup'),
      el('label', { class: 'btn', for: 'a-import' }, 'Import backup…'), file), status);
}

// Build, pins and activity are open to every GM of the world; members, settings and backups to its owner;
// people to the site admin.
const TABS = [['build', 'Build', 'gm'], ['pins', 'Map pins', 'gm'], ['members', 'Members & invites', 'owner'], ['world', 'World settings', 'owner'],
  ['activity', 'Activity', 'gm'], ['backup', 'Backup', 'owner'], ['people', 'People', 'admin']];
const allowed = (need) => (need === 'admin' ? isAdmin() : need === 'owner' ? isOwner() : isGm());

function notGm() {
  if (!signedIn()) {
    return el('div', { class: 'card empty-state' }, el('h3', {}, 'GMs only'),
      el('p', {}, 'Sign in with your personal code to build the world. New GM? Open the invite link the world’s owner sent you.'),
      el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: openSignIn }, 'Sign in'), el('a', { class: 'btn', href: '#join' }, 'I have an invite')));
  }
  const w = currentWorld();
  return el('div', { class: 'card empty-state' }, el('h3', {}, w ? `You’re a player in ${w.name}` : 'Not a GM here'),
    el('p', {}, w ? 'The GMs build the world; you can add your characters and journals, and suggest new entries from the World page.' : 'Open a world you’re a GM of, or create your own.'),
    el('div', { class: 'btnrow' }, w ? el('a', { class: 'btn primary', href: '#world/mine' }, 'My things') : null, el('a', { class: 'btn', href: '#worlds' }, 'All worlds'),
      w && isMember() ? confirmButton('Leave this world', async () => {
        try { await api('worlds', { method: 'DELETE', query: { id: w.id, member: session.gm.id } }); setWorld(null, { silent: true }); await refreshWorlds(); toast(`You left ${w.name}`); location.hash = 'worlds'; }
        catch (err) { toast(err.message, 'bad'); }
      }, 'btn ghost') : null));
}

export async function showAdmin(sub) {
  const tabs = TABS.filter(([, , need]) => allowed(need));
  if (!tabs.length) { setKids(root, notGm()); return; }
  const tab = tabs.some(([k]) => k === sub) ? sub : tabs[0][0];
  const owner = isOwner() || isAdmin();
  setKids(root, el('div', { class: 'panel-head' }, el('h2', {}, owner ? 'Admin' : 'Build'),
    el('p', {}, owner ? `Build ${world.info?.name || 'the world'}, manage map pins, invite GMs and players, and keep backups.` : 'Add quests, factions, key NPCs, places and map pins.')),
    el('nav', { class: 'subtabs', 'aria-label': 'Admin sections' }, tabs.map(([k, t]) => el('a', { href: `#admin/${k}`, 'data-tab': k, 'aria-current': k === tab ? 'page' : 'false' }, t))),
    el('p', { class: 'muted' }, 'Loading…'));
  if (!world.loaded) await loadWorld();
  let body;
  if (tab === 'build') body = buildSection();
  else if (tab === 'pins') body = pinsSection();
  else if (tab === 'members') body = await membersSection();
  else if (tab === 'people') body = await peopleSection();
  else if (tab === 'world') body = await settingsSection();
  else if (tab === 'activity') body = await activitySection();
  else body = backupSection();
  root.lastChild.replaceWith(body);
}

export function mountAdmin(r) { root = r; }
