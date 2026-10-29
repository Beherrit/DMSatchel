// Pictures on entries: a form field that uploads (shrunk in the browser) or takes a link, and small display helpers.
import { el, setKids, shrinkImage } from './dom.js';
import { api } from './api.js';
import { isImageRef } from './world-schema.js';

// A form field whose hidden input (data-field=<key>) holds the picture's address, so the form collects it like any field.
// alt: the picture's description (kept as fields.image_alt), typed under the picture.
export function pictureField(value, { id = 'ff-image', key = 'image', label = 'Picture', alt = null } = {}) {
  const hidden = el('input', { type: 'hidden', 'data-field': key, value: value || '' });
  const altBox = alt === null ? null : el('input', { type: 'text', id: `${id}-alt`, 'data-field': 'image_alt', value: alt || '', maxlength: 300, placeholder: 'What it shows, e.g. a grey-bearded dwarf in a leather apron' });
  const preview = el('div', { class: 'pic-preview' });
  const status = el('span', { class: 'muted small', role: 'status' });
  const file = el('input', { type: 'file', id, accept: 'image/*', class: 'pic-file' });
  const link = el('input', { type: 'text', placeholder: 'or paste an https:// image link', 'aria-label': 'Image link', value: value?.startsWith('https://') ? value : '' });
  const show = () => {
    const v = hidden.value;
    setKids(preview, v ? el('img', { src: v, alt: 'Picture preview' }) : el('span', { class: 'muted small' }, 'No picture'),
      v ? el('button', { class: 'btn small ghost', type: 'button', onclick: () => { hidden.value = ''; link.value = ''; show(); } }, 'Remove') : null);
  };
  file.addEventListener('change', async () => {
    const f = file.files[0]; if (!f) return;
    status.textContent = 'Uploading…';
    try {
      const { data, width, height } = await shrinkImage(f, { max: 1200, limit: 1_000_000 });
      const r = await api('images', { method: 'POST', body: { image: data, width, height } });
      hidden.value = r.url; link.value = ''; status.textContent = 'Uploaded. Save the entry to keep it.'; show();
    } catch (err) { status.textContent = err.message; }
    file.value = '';
  });
  link.addEventListener('change', () => {
    const v = link.value.trim();
    if (!v) return;
    if (!isImageRef(v)) { status.textContent = 'Links must start with https://'; return; }
    hidden.value = v; status.textContent = ''; show();
  });
  show();
  return el('div', { class: 'field wide pic-field' }, el('label', { for: id }, label),
    el('div', { class: 'pic-row' }, preview, el('div', { class: 'pic-inputs' }, file, link, status,
      altBox ? [el('label', { for: `${id}-alt`, class: 'small' }, 'Describe the picture (read aloud by screen readers)'), altBox] : null)), hidden);
}

export const pictureOf = (e) => (e?.fields?.image && isImageRef(e.fields.image) ? e.fields.image : null);

export function thumb(e, cls = 'thumb') {
  const src = pictureOf(e);
  return src ? el('img', { class: cls, src, alt: '', loading: 'lazy' }) : null;
}

export function figure(e) {
  const src = pictureOf(e);
  if (!src) return null;
  const alt = String(e.fields?.image_alt || '').trim();
  return el('figure', { class: `entry-pic k-${e.kind}` }, el('a', { href: src, target: '_blank', rel: 'noopener' }, el('img', { src, alt: alt || e.name, title: alt || null, loading: 'lazy' })));
}
