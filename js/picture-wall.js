// The picture wall: every picture in the world on one page (entries' main pictures and galleries, and maps), so a
// table can browse the art. Pure, so it can be tested; the page supplies how isImageRef and map images work.
import { isImageRef } from './world-schema.js';
import { readGallery } from './gallery.js';

// → [{ src, caption, entry?, map?, kind, tags }] in name order, each picture once.
export function wallPictures(entries, maps = [], mapSrc = () => null) {
  const out = [], seen = new Set();
  const add = (p) => { if (!p.src || seen.has(p.src)) return; seen.add(p.src); out.push(p); };
  const sorted = [...(entries || [])].sort((a, b) => a.name.localeCompare(b.name));
  for (const e of sorted) {
    const main = e.fields?.image;
    if (main && isImageRef(main)) add({ src: main, caption: String(e.fields?.image_alt || '').trim(), entry: e, kind: e.kind, tags: e.tags || [] });
    for (const g of readGallery(e)) add({ src: g.src, caption: g.caption, entry: e, kind: e.kind, tags: e.tags || [] });
  }
  for (const m of [...(maps || [])].sort((a, b) => String(a.name).localeCompare(String(b.name)))) add({ src: mapSrc(m), caption: '', map: m, kind: 'map', tags: [] });
  return out;
}

// Narrow the wall: kind ('' for all, 'map' for maps) and tag ('' for any).
export const filterWall = (pics, { kind = '', tag = '' } = {}) => pics.filter((p) => (!kind || p.kind === kind) && (!tag || p.tags.includes(tag)));

// The kinds and tags that have pictures, with counts, most first: → { kinds: [[kind, n]], tags: [[tag, n]] }.
export function wallFacets(pics) {
  const count = (keys) => { const m = new Map(); for (const k of keys) m.set(k, (m.get(k) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))); };
  return { kinds: count(pics.map((p) => p.kind)), tags: count(pics.flatMap((p) => p.tags)) };
}
