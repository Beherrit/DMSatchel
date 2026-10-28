// Small DOM helpers shared by every tool.

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];

export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'value') e.value = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}

// replaceChildren that skips null/false and flattens arrays, like el() does.
export function setKids(node, ...kids) {
  node.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));
  return node;
}

export const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
export const fmt = (n) => Number(n).toLocaleString('en-US');

export function toast(msg, kind = '') {
  const t = $('#toast');
  t.textContent = msg; t.className = `toast ${kind}`; t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2200);
}

// A toast with an Undo button that stays a few seconds longer, for things that can be taken back.
export function toastUndo(msg, onUndo, ms = 7000) {
  const t = $('#toast');
  const undo = el('button', { class: 'toast-undo', type: 'button', onclick: async () => { clearTimeout(toast.timer); t.hidden = true; await onUndo(); } }, 'Undo');
  t.replaceChildren(msg, ' · ', undo); t.className = 'toast with-action'; t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, ms);
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); }
  catch {
    const ta = el('textarea', { style: 'position:fixed;opacity:0' }); ta.value = text; document.body.append(ta); ta.select();
    try { document.execCommand('copy'); toast('Copied'); } catch { toast('Select the text to copy it'); }
    ta.remove();
  }
}

export function download(filename, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = el('a', { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fresh(node) { node.classList.remove('fresh'); void node.offsetWidth; node.classList.add('fresh'); }

// A ↻ button that rerolls one field.
export const reroll = (label, fn) => el('button', { class: 'reroll', type: 'button', title: `Reroll ${label.toLowerCase()}`, 'aria-label': `Reroll ${label}`, onclick: fn }, '↻');

// label/value rows with optional reroll buttons: rows = [[key, label, value, onReroll?]]
export function traitList(rows) {
  return el('dl', { class: 'traits' }, rows.flatMap(([, label, value, onReroll]) => [
    el('dt', {}, label),
    el('dd', {}, el('span', {}, value), onReroll ? reroll(label, onReroll) : null),
  ]));
}

// Two-click confirm button for destructive actions (no window.confirm).
export function confirmButton(label, onConfirm, cls = 'btn small ghost') {
  let armed = false, timer;
  const b = el('button', { class: cls, type: 'button', onclick: () => {
    if (!armed) { armed = true; b.textContent = 'Confirm'; b.classList.add('danger'); timer = setTimeout(() => { armed = false; b.textContent = label; b.classList.remove('danger'); }, 3000); return; }
    clearTimeout(timer); onConfirm();
  } }, label);
  return b;
}

// Shrink an uploaded image (a File) to a JPEG data URL under `limit` characters, at most `max` pixels on its long side.
export async function shrinkImage(file, { max = 4000, limit = 3_200_000 } = {}) {
  const bitmap = await createImageBitmap(file);
  let quality = 0.86, data = '', w = 0, h = 0;
  for (let i = 0; i < 10; i++) {
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    w = Math.round(bitmap.width * scale); h = Math.round(bitmap.height * scale);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    data = c.toDataURL('image/jpeg', quality);
    if (data.length < limit) break;
    if (quality > 0.65) quality -= 0.08; else max = Math.round(max * 0.8);
  }
  return { data, width: w, height: h };
}
