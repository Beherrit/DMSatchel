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

// Follow an entry: changes others make to it come first in "since your last visit", get their own toast when they
// arrive live, and the sidebar marks followed entries that changed since your last visit.
const follows = () => (Array.isArray(world.info?.following) ? world.info.following : null);

export function followButton(e) {
  const list = follows();
  if (!list || !isMember() || e.status === 'suggested') return null;
  const on = list.includes(e.id);
  return el('button', { class: `btn small follow${on ? ' on' : ''}`, type: 'button', 'aria-pressed': String(on), title: on ? 'Stop following' : 'Hear about changes others make to this',
    onclick: async () => {
      try {
        const r = await api('party', { method: 'PUT', body: { follow: e.id, on: !on } });
        world.info = { ...world.info, following: r.following };
        toast(on ? `No longer following ${e.name}` : `Following ${e.name}: you’ll see when others change it`);
        window.dispatchEvent(new Event('world:rerender'));
      } catch (err) { toast(err.message, 'bad'); }
    } }, on ? '🔔 Following' : '🔔 Follow');
}

// Followed entries, newest change first; a dot on those someone else changed since your last visit.
export function followingNav(me) {
  const since = world.visitSince;
  const list = (follows() || []).map(getEntry).filter(Boolean).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  if (!list.length) return null;
  const fresh = (e) => since && e.updated_by && e.updated_by !== me && Date.parse(e.updated_at) > Date.parse(since);
  const n = list.filter(fresh).length;
  return el('details', { class: 'w-favs w-follows', open: n > 0 || null },
    el('summary', { class: 'w-favs-h' }, `🔔 Following${n ? ` · ${n} changed` : ''}`),
    el('ul', {}, list.slice(0, 10).map((e) => el('li', {}, link(e), fresh(e) ? el('span', { class: 'follow-dot', title: `Changed by ${e.updated_by}` }, ' •', el('span', { class: 'sr-only' }, ' changed since your last visit')) : null))));
}

export function favoritesNav() {
  const list = (favs() || []).map(getEntry).filter(Boolean);
  if (!list.length) return null;
  return el('nav', { class: 'w-favs', 'aria-label': 'Your favorites' }, el('h3', { class: 'w-favs-h' }, '★ Favorites'),
    el('ul', { class: 'plain' }, list.slice(0, 12).map((e) => el('li', {}, link(e)))));
}
