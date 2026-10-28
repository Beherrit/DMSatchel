// More pictures on an entry: a small gallery (a town from different angles, a handout's pages) besides the main
// picture, stored as JSON in the entry's hidden gallery field. Pure, shared by the page and the server.
import { isImageRef } from './world-schema.js';

export const MAX_PICTURES = 12;
const parse = (s) => { try { const v = typeof s === 'string' ? JSON.parse(s) : s; return Array.isArray(v) ? v : []; } catch { return []; } };

export const readGallery = (e) => cleanList(parse(e?.fields?.gallery));
function cleanList(list) {
  return list.filter((p) => p && isImageRef(String(p.src || ''))).slice(0, MAX_PICTURES)
    .map((p) => ({ src: String(p.src), caption: String(p.caption || '').replace(/\s+/g, ' ').trim().slice(0, 200) }));
}
// What the server keeps: only real image addresses, at most twelve. '' when nothing is left.
export function cleanGallery(raw) { const l = cleanList(parse(raw)); return l.length ? JSON.stringify(l) : ''; }

export const addPictures = (list, srcs) => [...list, ...srcs.map((src) => ({ src, caption: '' }))].slice(0, MAX_PICTURES);
export const setCaption = (list, i, caption) => list.map((p, j) => (j === i ? { ...p, caption: String(caption).trim().slice(0, 200) } : p));
export const removePicture = (list, i) => list.filter((_, j) => j !== i);
export function movePicture(list, i, by) {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const out = [...list]; [out[i], out[j]] = [out[j], out[i]]; return out;
}
