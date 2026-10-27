// Import Markdown notes into the world (GMs): pick files, a whole folder (an Obsidian vault works), or paste a
// document; check the preview; import. Entries are created in batches, then "located in" parents and connections
// are matched by name. Route: #world/import
import { el, toast, setKids } from './dom.js';
import { isGm } from './api.js';
import { worldEntries, createEntries, patchEntry, findByName, getEntry, notice } from './world-store.js';
import { KINDS, KIND_ORDER } from './world-schema.js';
import { parseFile, parseDocument, checkDrafts } from './md-import.js';

const MAX_FILES = 1000, MAX_BYTES = 400_000;
let drafts = [];

async function readFiles(files) {
  const out = [], skipped = [];
  for (const f of [...files].slice(0, MAX_FILES)) {
    const path = f.webkitRelativePath || f.name;
    if (!/\.(md|markdown|txt)$/i.test(path) || /(^|\/)\.(obsidian|trash|git)\//.test(path)) continue;
    if (f.size > MAX_BYTES) { skipped.push(path); continue; }
    const text = await f.text();
    // A single big file with several "##" headings is a whole document; otherwise one file = one entry.
    out.push(...((text.match(/^##\s+/gm) || []).length >= 2 && files.length === 1 ? parseDocument(text, { source: path }) : parseFile(path, text)));
  }
  return { drafts: out, skipped };
}

export function viewImport(rerender) {
  if (!isGm()) return notice('GMs only', 'Importing notes is for the GMs.');
  const preview = el('div', { class: 'import-preview' });
  const status = el('p', { class: 'form-status', role: 'status' });
  const hide = el('input', { type: 'checkbox', id: 'imp-hide', checked: true });
  const tag = el('input', { type: 'text', id: 'imp-tag', value: 'imported', 'aria-label': 'Tag for imported entries' });

  const files = el('input', { type: 'file', id: 'imp-files', 'aria-label': 'Choose Markdown files', multiple: true, accept: '.md,.markdown,.txt,text/markdown,text/plain' });
  const folder = el('input', { type: 'file', id: 'imp-folder', 'aria-label': 'Choose a folder of notes', multiple: true, webkitdirectory: '', directory: '' });
  const paste = el('textarea', { id: 'imp-paste', 'aria-label': 'Paste Markdown', rows: 8, placeholder: '## Bog Hag\nLives in the fen. Mimics voices.\n\n## Brindle\nA muddy river town…' });

  const load = async (list) => {
    status.textContent = 'Reading…'; status.className = 'form-status';
    const r = await readFiles(list);
    drafts = checkDrafts(r.drafts, worldEntries()).map((d) => ({ ...d, include: d.status === 'new' }));
    status.textContent = `${drafts.length} entr${drafts.length === 1 ? 'y' : 'ies'} found${r.skipped.length ? `; skipped ${r.skipped.length} file(s) over 400 KB` : ''}.`;
    draw();
  };
  files.addEventListener('change', () => load(files.files));
  folder.addEventListener('change', () => load(folder.files));

  function draw() {
    if (!drafts.length) { setKids(preview); return; }
    const count = drafts.filter((d) => d.include).length;
    setKids(preview,
      el('div', { class: 'entry-head' }, el('h3', {}, `Preview (${count} of ${drafts.length} selected)`),
        el('div', { class: 'btnrow' },
          el('button', { class: 'btn small ghost', type: 'button', onclick: () => { drafts.forEach((d) => { d.include = d.status === 'new'; }); draw(); } }, 'Only new'),
          el('button', { class: 'btn small ghost', type: 'button', onclick: () => { drafts.forEach((d) => { d.include = false; }); draw(); } }, 'None'))),
      el('div', { class: 'table-wrap' }, el('table', { class: 'import-table' },
        el('thead', {}, el('tr', {}, ['', 'Name', 'Kind', 'Located in', 'Details', ''].map((h) => el('th', {}, h)))),
        el('tbody', {}, drafts.map((d, i) => {
          const box = el('input', { type: 'checkbox', checked: d.include || null, 'aria-label': `Import ${d.name}` });
          box.addEventListener('change', () => { d.include = box.checked; draw(); });
          const kind = el('select', { 'aria-label': `Kind for ${d.name}` }, KIND_ORDER.map((k) => el('option', { value: k }, KINDS[k].label)));
          kind.value = d.kind;
          kind.addEventListener('change', () => { d.kind = kind.value; drafts[i] = checkDrafts([d], worldEntries())[0]; drafts[i].include = d.include; draw(); });
          const nFields = Object.keys(d.fields).length;
          return el('tr', { class: d.include ? '' : 'muted' }, el('td', {}, box), el('td', {}, el('strong', {}, d.name), el('div', { class: 'muted small' }, d.source)),
            el('td', {}, kind), el('td', { class: 'small' }, d.parentName || '—'),
            el('td', { class: 'small' }, [nFields && `${nFields} field${nFields === 1 ? '' : 's'}`, d.tags.length && `${d.tags.length} tag${d.tags.length === 1 ? '' : 's'}`, d.secret && 'GM secret', d.linkNames.length && `${d.linkNames.length} connection${d.linkNames.length === 1 ? '' : 's'}`, `${(d.summary + d.body).length.toLocaleString()} chars`].filter(Boolean).join(' · ')),
            el('td', {}, d.status === 'new' ? null : el('span', { class: 'tag' }, d.status === 'exists' ? 'Already in the world' : d.status === 'name' ? `Name already used (${KINDS[d.otherKind]?.label || 'entry'})` : 'Repeated')));
        })))),
      el('div', { class: 'controls' }, el('label', { class: 'check' }, hide, ' Hide imported entries from players (reveal them later)'),
        el('label', { class: 'check', for: 'imp-tag' }, 'Tag them ', tag)),
      el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', disabled: count ? null : true, onclick: run }, `Import ${count} entr${count === 1 ? 'y' : 'ies'}`)));
  }

  async function run() {
    const chosen = drafts.filter((d) => d.include);
    if (!chosen.length) return;
    const t = tag.value.trim().toLowerCase().replace(/[^\w-]+/g, '-');
    const made = [];
    try {
      for (let i = 0; i < chosen.length; i += 25) {
        status.textContent = `Creating ${Math.min(i + 25, chosen.length)} of ${chosen.length}…`; status.className = 'form-status';
        const batch = chosen.slice(i, i + 25).map((d) => ({
          kind: d.kind, name: d.name, summary: d.summary, body: d.body, fields: d.fields, secret: d.secret,
          tags: [...new Set([...d.tags, ...(t ? [t] : [])])].slice(0, 30), visibility: hide.checked ? 'gm' : 'all',
        }));
        const created = await createEntries(batch);
        created.forEach((e, j) => made.push([e, chosen[i + j]]));
      }
      // Second pass: now every imported name exists, match "located in" parents and connections by name.
      let linked = 0;
      for (const [e, d] of made) {
        const parent = d.parentName && findByName(d.parentName);
        const links = d.linkNames.map((l) => ({ l, t: findByName(l.name) })).filter((x) => x.t && x.t.id !== e.id).map(({ l, t: target }) => ({ id: target.id, label: l.label, secret: l.secret }));
        if ((parent && parent.id !== e.id) || links.length) {
          status.textContent = `Linking places and connections (${++linked})…`;
          await patchEntry(getEntry(e.id), { parent_id: parent && parent.id !== e.id ? parent.id : e.parent_id, links: [...(e.links || []), ...links] });
        }
      }
      toast(`Imported ${made.length} entr${made.length === 1 ? 'y' : 'ies'}`);
      status.textContent = `Done: ${made.length} imported, ${linked} linked to places or each other.`;
      drafts = checkDrafts(drafts, worldEntries()).map((d) => ({ ...d, include: false }));
      draw();
    } catch (err) {
      status.textContent = `${err.message} (${made.length} were imported before this; importing again skips them).`; status.className = 'form-status error';
      drafts = checkDrafts(drafts, worldEntries()).map((d) => ({ ...d, include: d.include && d.status === 'new' }));
      draw();
    }
  }

  return el('div', { class: 'w-view import-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Import notes'),
      el('p', {}, 'Bring in Markdown notes: one file per entry (an Obsidian vault folder works, with front matter and [[links]]), or one document with a heading per entry, including this app’s own export. You’ll see a preview before anything is saved.')),
    el('div', { class: 'import-sources' },
      el('section', { class: 'card' }, el('h3', {}, 'Files'), el('p', { class: 'muted small' }, '.md or .txt; pick several at once. The folder a file sits in hints its kind (“NPCs”, “Towns”, “Bestiary”…).'), files),
      el('section', { class: 'card' }, el('h3', {}, 'A whole folder'), el('p', { class: 'muted small' }, 'Every Markdown file inside, including subfolders. Obsidian settings and trash are skipped.'), folder),
      el('section', { class: 'card' }, el('h3', {}, 'Paste'), paste,
        el('button', { class: 'btn small', type: 'button', onclick: () => {
          if (!paste.value.trim()) { paste.focus(); return; }
          drafts = checkDrafts(parseDocument(paste.value), worldEntries()).map((d) => ({ ...d, include: d.status === 'new' }));
          status.textContent = `${drafts.length} entr${drafts.length === 1 ? 'y' : 'ies'} found.`; status.className = 'form-status'; draw();
        } }, 'Read it'))),
    status, preview,
    el('p', { class: 'muted small' }, 'Kinds come from front matter (type: npc), the folder name, or the section heading; anything unclear becomes Lore, and you can change it in the preview. Entries already in the world are left alone.'));
}
