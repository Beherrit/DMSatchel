// Mood music on an entry's page (and in session prep): a link that opens the music in a new tab. A place without
// its own uses the nearest place around it that has some.
import { el } from './dom.js';
import { trail } from './world-store.js';
import { PLACE_KINDS } from './world-schema.js';
import { musicFor, musicSite } from './music.js';

export function musicLine(e, cls = 'music-line') {
  const m = musicFor(PLACE_KINDS.includes(e?.kind) ? [e, ...trail(e).reverse()] : [e]);
  if (!m) return null;
  return el('p', { class: cls }, el('a', { href: m.url, target: '_blank', rel: 'noopener noreferrer' },
    el('span', { 'aria-hidden': 'true' }, '♫ '), 'Mood music', m.from !== e ? ` for ${m.from.name}` : '', ` (${musicSite(m.url)})`, el('span', { class: 'sr-only' }, ', opens in a new tab')));
}
