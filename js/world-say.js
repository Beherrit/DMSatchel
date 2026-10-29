// The pronunciation guide: every entry with a "say it", A to Z. Route: #world/say
import { el } from './dom.js';
import { isGm } from './api.js';
import { worldEntries, link, kindLabel, notice } from './world-store.js';
import { sayGuide, sayOf } from './say.js';

// Under an entry's name on its page and cards.
export const sayLine = (e, cls = 'say-it') => (sayOf(e) ? el('p', { class: cls }, el('span', { class: 'sr-only' }, 'Say it: '), el('span', { 'aria-hidden': 'true' }, '🗣 '), sayOf(e)) : null);

export function viewSay() {
  const groups = sayGuide(worldEntries());
  const head = el('div', { class: 'panel-head' }, el('h2', {}, 'Say it right'),
    el('p', {}, 'How to say the names in this world. Add one with “Say it” beside the name when editing an entry.'));
  if (!groups.length) return el('div', { class: 'w-view' }, head, notice('No pronunciations yet', isGm() ? 'Edit an entry and fill in “Say it”, e.g. BRAM-well.' : 'When the GMs add how to say a name, it shows here.'));
  return el('div', { class: 'w-view say-guide' }, head,
    el('nav', { class: 'say-letters', 'aria-label': 'Letters' }, groups.map((g) => el('a', { href: `#world/say`, onclick: (ev) => { ev.preventDefault(); document.getElementById(`say-${g.letter}`)?.scrollIntoView(); } }, g.letter))),
    groups.map((g) => el('section', { class: 'card', 'aria-labelledby': `say-${g.letter}` }, el('h3', { id: `say-${g.letter}` }, g.letter),
      el('dl', { class: 'say-list' }, g.entries.flatMap((e) => [el('dt', {}, link(e), el('span', { class: 'muted small' }, ` ${kindLabel(e.kind)}`)), el('dd', {}, sayOf(e))])))));
}
