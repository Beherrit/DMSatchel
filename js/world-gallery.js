// More pictures on an entry's page: a gallery anyone who can edit the entry fills (several uploads at once, or
// https links), captions and arranges; everyone who can see the entry can open the pictures in a viewer.
import { el, toast, setKids, shrinkImage } from './dom.js';
import { api } from './api.js';
import { getEntry, patchEntry } from './world-store.js';
import { isImageRef } from './world-schema.js';
import { readGallery, addPictures, setCaption, removePicture, movePicture, MAX_PICTURES } from './gallery.js';

let arranging = null; // the entry id being arranged, kept across redraws

export function gallerySection(e, rerender) {
  const list = readGallery(e), can = Boolean(e.can_edit);
  if (!list.length && !can) return null;
  const status = el('span', { class: 'muted small', role: 'status' });
  const save = async (next, msg) => {
    try { await patchEntry(getEntry(e.id) || e, { fields: { gallery: next.length ? JSON.stringify(next) : '' } }); if (msg) toast(msg); rerender(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  const arrange = arranging === e.id;
  let tools = null;
  if (can) {
    const files = el('input', { type: 'file', id: `gal-files-${e.id}`, accept: 'image/*', multiple: true, class: 'sr-only' });
    files.addEventListener('change', async () => {
      const chosen = [...files.files].slice(0, MAX_PICTURES - list.length);
      if (!chosen.length) { status.textContent = `The gallery holds ${MAX_PICTURES} pictures.`; return; }
      const urls = [];
      for (const [i, f] of chosen.entries()) {
        status.textContent = `Uploading ${i + 1} of ${chosen.length}…`;
        try { const { data, width, height } = await shrinkImage(f, { max: 1600, limit: 1_000_000 }); urls.push((await api('images', { method: 'POST', body: { image: data, width, height } })).url); }
        catch (err) { status.textContent = `${f.name}: ${err.message}`; }
      }
      files.value = '';
      if (urls.length) save(addPictures(list, urls), `Added ${urls.length} picture${urls.length === 1 ? '' : 's'}`);
    });
    const link = el('input', { type: 'text', placeholder: 'or paste an https:// image link', 'aria-label': 'Image link', class: 'gal-link' });
    link.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      const v = link.value.trim();
      if (!isImageRef(v)) { status.textContent = 'Links must start with https://'; return; }
      save(addPictures(list, [v]), 'Picture added');
    });
    tools = el('div', { class: 'gal-tools' },
      list.length < MAX_PICTURES ? [el('label', { class: 'btn small', for: `gal-files-${e.id}` }, '+ Add pictures'), files, link] : el('span', { class: 'muted small' }, `${MAX_PICTURES} pictures is the most a gallery holds.`),
      list.length ? el('button', { class: 'btn small ghost', type: 'button', 'aria-pressed': String(arrange), onclick: () => { arranging = arrange ? null : e.id; rerender(); } }, arrange ? 'Done arranging' : 'Arrange') : null,
      status);
  }
  return el('section', { class: 'gallery-section' },
    el('h3', { class: 'section-title' }, `More pictures${list.length ? ` (${list.length})` : ''}`),
    list.length ? el('ul', { class: `gal-grid${arrange ? ' arranging' : ''}` }, list.map((p, i) => el('li', { class: 'gal-item' },
      el('button', { class: 'gal-open', type: 'button', 'aria-label': `Open picture ${i + 1}${p.caption ? `: ${p.caption}` : ''}`, onclick: () => viewer(list, i, e.name) },
        el('img', { src: p.src, alt: p.caption || `${e.name}, picture ${i + 1}`, title: p.caption || null, loading: 'lazy' })),
      arrange ? el('div', { class: 'gal-edit' },
        el('input', { type: 'text', value: p.caption, maxlength: 200, placeholder: 'Caption', 'aria-label': `Caption for picture ${i + 1}`, onchange: (ev) => save(setCaption(list, i, ev.target.value)) }),
        el('div', { class: 'btnrow' },
          el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move picture ${i + 1} earlier`, disabled: i === 0 || null, onclick: () => save(movePicture(list, i, -1)) }, '←'),
          el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Move picture ${i + 1} later`, disabled: i === list.length - 1 || null, onclick: () => save(movePicture(list, i, 1)) }, '→'),
          el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Remove picture ${i + 1}`, onclick: () => save(removePicture(list, i), 'Picture removed') }, '✕')))
        : p.caption ? el('p', { class: 'gal-caption small' }, p.caption) : null)))
      : el('p', { class: 'muted small' }, 'Add more pictures: a place from different angles, a handout’s pages, a character’s sketches.'),
    tools);
}

// A full-size viewer: ← → (or the buttons) to move through the pictures, Esc to close.
function viewer(list, start, name) {
  let i = start;
  const img = el('img', { class: 'gal-big' });
  const cap = el('p', { class: 'gal-big-cap' });
  const count = el('span', { class: 'muted small' });
  const show = () => { const p = list[i]; img.src = p.src; img.alt = p.caption || `${name}, picture ${i + 1}`; cap.textContent = p.caption; count.textContent = `${i + 1} of ${list.length}`; };
  const go = (by) => { i = (i + by + list.length) % list.length; show(); };
  const d = el('dialog', { class: 'dialog gal-dialog', 'aria-label': `Pictures of ${name}` }, el('div', { class: 'dialog-body' },
    el('div', { class: 'gal-stage' }, img), cap,
    el('div', { class: 'btnrow gal-nav' },
      list.length > 1 ? el('button', { class: 'btn small', type: 'button', onclick: () => go(-1) }, '← Previous') : null, count,
      list.length > 1 ? el('button', { class: 'btn small', type: 'button', onclick: () => go(1) }, 'Next →') : null,
      el('a', { class: 'btn small ghost', href: '#', onclick: (ev) => { ev.preventDefault(); window.open(list[i].src, '_blank', 'noopener'); } }, 'Open full size'),
      el('button', { class: 'btn small ghost', type: 'button', onclick: () => d.close() }, 'Close'))));
  d.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowLeft') go(-1); if (ev.key === 'ArrowRight') go(1); });
  d.addEventListener('close', () => d.remove());
  document.body.append(d); show(); d.showModal();
}
