import test from 'node:test';
import assert from 'node:assert/strict';
import { factionNews } from '../js/faction-news.js';

test('only what players may know, finished plans first, within a notice', () => {
  const E = { f: { name: 'The Silver Hand', visibility: 'all' }, h: { name: 'Hidden Cult', visibility: 'gm' } };
  const moved = [{ entry_id: 'f', name: 'Bridge toll', size: 4, filled: 2 }, { entry_id: 'f', name: 'Takeover', size: 6, filled: 6 },
    { entry_id: 'f', name: 'Secret plot', size: 4, filled: 4, secret: true }, { entry_id: 'h', name: 'Summoning', size: 6, filled: 6 }, { entry_id: 'x', name: 'Gone', size: 2, filled: 1 }];
  assert.equal(factionNews(moved, (id) => E[id]), 'News from across the land:\nThe Silver Hand: “Takeover” has come to pass.\nThe Silver Hand: “Bridge toll” draws closer.');
  assert.equal(factionNews([], () => null), '');
  const many = Array.from({ length: 30 }, (_, i) => ({ entry_id: 'f', name: `Plan number ${i}`, size: 4, filled: 1 }));
  assert.ok(factionNews(many, (id) => E[id]).length <= 500 && factionNews(many, (id) => E[id]).endsWith('…and more.'));
});
