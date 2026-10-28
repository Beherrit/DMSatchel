// Favorites: each person stars the entries they keep going back to; starred ones sit at the top of the world
// sidebar, for that person only (kept on their membership, so they follow them to any device).
import { el, toast } from './dom.js';
import { api, isMember } from './api.js';
import { world, getEntry, link } from './world-store.js';

const favs = () => (Array.isArray(world.info?.favorites) ? world.info.favorites : null);

export function starButton(e) {
  const list = favs();
  if (!list || !isMember() || e.status === 'suggested') return null;
  const on = list.includes(e.id);
  return el('button', { class: `btn small star${on ? ' on' : ''}`, type: 'button', 'aria-pressed': String(on), title: on ? 'Remove from your favorites' : 'Add to your favorites (only you see them)',
    onclick: async () => {
      try {
        const r = await api('party', { method: 'PUT', body: { favorite: e.id, on: !on } });
        world.info = { ...world.info, favorites: r.favorites };
        toast(on ? `Took ${e.name} out of your favorites` : `${e.name} is in your favorites`);
        window.dispatchEvent(new Event('world:rerender'));
      } catch (err) { toast(err.message, 'bad'); }
    } }, on ? '★ Favorite' : '☆ Favorite');
}

export function favoritesNav() {
  const list = (favs() || []).map(getEntry).filter(Boolean);
  if (!list.length) return null;
  return el('nav', { class: 'w-favs', 'aria-label': 'Your favorites' }, el('h3', { class: 'w-favs-h' }, '★ Favorites'),
    el('ul', { class: 'plain' }, list.slice(0, 12).map((e) => el('li', {}, link(e)))));
}
