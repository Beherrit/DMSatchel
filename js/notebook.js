// The personal session notebook: things a DM saves from the tools. Kept in this browser.
import { $, el, toast, copyText, confirmButton, download, setKids } from './dom.js';

const KEY = 'dm-satchel-notes';
let notes = [];
let storageOk = true;

function load() {
  try { notes = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { notes = []; storageOk = false; }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(notes)); storageOk = true; } catch { storageOk = false; }
}

export function saveNote(kind, title, body) {
  notes.unshift({ id: `n${Date.now()}${Math.floor(Math.random() * 1000)}`, kind, title, body, createdAt: Date.now() });
  persist(); render(); toast('Saved to your notebook');
}

function render() {
  const box = $('#notes'); if (!box) return;
  setKids(box);
  $('#nb-status').textContent = storageOk ? 'Kept in this browser' : 'Not saved after you close this page';
  if (!notes.length) {
    box.append(el('div', { class: 'empty' }, 'Nothing saved yet. Hit “Save” on any NPC, quest, name, place or loot and it lands here, so you remember what you made up mid-session.'));
    return;
  }
  for (const n of notes) {
    const node = el('div', { class: 'note' });
    node.append(
      el('div', { class: 'note-head' }, el('span', { class: 'note-kind' }, n.kind), el('span', { class: 'note-actions' },
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => node.classList.toggle('open') }, 'More'),
        el('button', { class: 'btn small ghost', type: 'button', onclick: () => copyText(`${n.title}\n${n.body}`) }, 'Copy'),
        confirmButton('Delete', () => { notes = notes.filter((x) => x.id !== n.id); persist(); render(); }))),
      el('div', { class: 'note-title' }, n.title),
      el('div', { class: 'note-body' }, n.body));
    box.append(node);
  }
}

export function initNotebook() {
  load();
  $('#nb-export').addEventListener('click', () => download('dm-satchel-notebook.json', JSON.stringify(notes, null, 2), 'application/json'));
  $('#nb-import').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const list = JSON.parse(await f.text());
      if (!Array.isArray(list)) throw new Error();
      const have = new Set(notes.map((n) => n.id));
      notes = [...list.filter((n) => n && n.title && !have.has(n.id)), ...notes].sort((a, b) => b.createdAt - a.createdAt);
      persist(); render(); toast(`Imported ${list.length} notes`);
    } catch { toast('That file isn’t a notebook export.', 'bad'); }
    e.target.value = '';
  });
  render();
}
