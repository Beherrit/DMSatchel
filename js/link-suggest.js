// While writing anywhere in a world (entry forms, notes, table talk, quick notes), typing [[ opens a list of entry
// names; ↑ ↓ to move, Enter or Tab to pick, Esc to close. Picking finishes the [[link]].
import { el, setKids } from './dom.js';
import { world, worldEntries, kindLabel } from './world-store.js';
import { openLink, rankNames, finishLink } from './link-complete.js';

let pop = null, field = null, open = null, items = [], active = 0;

const writable = (t) => t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && t.type === 'text')) && t.closest('#panel-world, dialog') && world.loaded;

function close() {
  if (field) { field.removeAttribute('aria-activedescendant'); }
  if (pop) pop.hidden = true;
  open = null; items = [];
}

function draw() {
  if (!pop) {
    pop = el('ul', { class: 'link-pop', id: 'link-pop', role: 'listbox', 'aria-label': 'Link to an entry', hidden: true });
    document.body.append(pop);
  }
  // Inside a modal dialog the list must be in the dialog's layer to be seen.
  const host = field.closest('dialog') || document.body;
  if (pop.parentNode !== host) host.append(pop);
  setKids(pop, items.map((e, i) => el('li', { role: 'option', id: `link-opt-${i}`, 'aria-selected': String(i === active), class: i === active ? 'active' : '',
    onmousedown: (ev) => { ev.preventDefault(); pick(i); } }, el('span', {}, e.name), el('span', { class: 'muted small' }, ` ${kindLabel(e.kind)}`))));
  const r = field.getBoundingClientRect();
  Object.assign(pop.style, { left: `${Math.max(8, r.left)}px`, top: `${Math.min(r.bottom + 2, innerHeight - 40)}px`, width: `${Math.min(360, Math.max(220, r.width))}px` });
  pop.hidden = false;
  field.setAttribute('aria-controls', 'link-pop'); field.setAttribute('aria-activedescendant', `link-opt-${active}`);
}

function update(t) {
  field = t;
  const o = openLink(t.value, t.selectionStart);
  if (!o) { close(); return; }
  const list = rankNames(worldEntries().filter((e) => e.status !== 'suggested'), o.query);
  if (!list.length) { close(); return; }
  open = o; items = list; active = Math.min(active, items.length - 1);
  draw();
}

function pick(i) {
  const e = items[i];
  if (!e || !field || !open) return;
  const r = finishLink(field.value, field.selectionStart, open, e.name);
  field.value = r.text; field.setSelectionRange(r.caret, r.caret);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  close(); field.focus();
}

export function initLinkSuggest() {
  document.addEventListener('input', (ev) => { if (writable(ev.target)) { if (ev.target !== field) active = 0; update(ev.target); } }, true);
  document.addEventListener('keydown', (ev) => {
    if (!open || ev.target !== field) return;
    if (ev.key === 'ArrowDown') { active = (active + 1) % items.length; draw(); }
    else if (ev.key === 'ArrowUp') { active = (active - 1 + items.length) % items.length; draw(); }
    else if (ev.key === 'Enter' || ev.key === 'Tab') pick(active);
    else if (ev.key === 'Escape') { close(); ev.stopPropagation(); }
    else return;
    ev.preventDefault();
  }, true);
  document.addEventListener('focusout', (ev) => { if (ev.target === field) setTimeout(close, 120); }, true);
  addEventListener('hashchange', close);
}
