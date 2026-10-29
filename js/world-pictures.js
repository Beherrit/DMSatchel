// The picture wall: every picture in the world (entries' pictures and galleries, and maps) on one page, filterable
// by kind and tag, each opening its entry or map. Route: #world/pictures
import { el, setKids } from './dom.js';
import { isGm, mapImageUrl } from './api.js';
import { world, worldEntries, kindLabel, notice } from './world-store.js';
import { KINDS } from './world-schema.js';
import { wallPictures, filterWall, wallFacets } from './picture-wall.js';

const SHOW = 120;
const mapSrc = mapImageUrl;
const kindName = (k) => (k === 'map' ? 'Maps' : KINDS[k]?.plural || kindLabel(k));

export function viewPictures() {
  // Players never see a fogged map whole: those stay on the map page, under their fog.
  const maps = (world.maps || []).filter((m) => isGm() || !m.fog?.on);
  const all = wallPictures(worldEntries(), maps, mapSrc);
  const head = el('div', { class: 'panel-head' }, el('h2', {}, 'Picture wall'), el('p', {}, 'Every picture in the world: portraits, places, handouts and maps. Pick one to open its page.'));
  if (!all.length) return el('div', { class: 'w-view' }, head, notice('No pictures yet', 'Add a picture (or a gallery) to any entry, or upload a map, and it shows here.'));
  const { kinds, tags } = wallFacets(all);
  const state = { kind: '', tag: '', more: false };
  const kindSel = el('select', { id: 'pw-kind' }, el('option', { value: '' }, `Everything (${all.length})`), kinds.map(([k, n]) => el('option', { value: k }, `${kindName(k)} (${n})`)));
  const tagSel = tags.length ? el('select', { id: 'pw-tag' }, el('option', { value: '' }, 'Any tag'), tags.map(([t, n]) => el('option', { value: t }, `${t} (${n})`))) : null;
  const grid = el('div');
  const draw = () => {
    const pics = filterWall(all, state);
    const shown = state.more ? pics : pics.slice(0, SHOW);
    setKids(grid, pics.length ? [
      el('ul', { class: 'plain pic-wall' }, shown.map((p) => {
        const name = p.entry?.name || p.map.name;
        const href = p.entry ? `#world/e/${p.entry.id}` : `#world/map/${p.map.id}`;
        return el('li', {}, el('a', { href, class: 'pw-item' },
          el('img', { src: p.src, alt: p.caption ? `${name}: ${p.caption}` : name, loading: 'lazy' }),
          el('span', { class: 'pw-cap' }, el('strong', {}, name), el('span', { class: 'small' }, p.caption || (p.kind === 'map' ? 'Map' : kindLabel(p.kind))))));
      })),
      pics.length > shown.length ? el('button', { class: 'btn', type: 'button', onclick: () => { state.more = true; draw(); } }, `Show all ${pics.length}`) : null]
      : el('p', { class: 'muted' }, 'No pictures match.'));
  };
  kindSel.addEventListener('change', () => { state.kind = kindSel.value; state.more = false; draw(); });
  tagSel?.addEventListener('change', () => { state.tag = tagSel.value; state.more = false; draw(); });
  draw();
  return el('div', { class: 'w-view pictures-view' }, head,
    el('div', { class: 'controls pw-filters' }, el('label', { for: 'pw-kind' }, 'Show'), kindSel, tagSel ? [el('label', { for: 'pw-tag' }, 'Tagged'), tagSel] : null),
    grid);
}
