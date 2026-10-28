import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchEntries, parseSearch, searchHash } from '../js/search.js';

const E = (id, kind, name, x = {}) => ({ id, kind, name, summary: '', body: '', fields: {}, tags: [], visibility: 'all', status: 'live', ...x });
const all = [
  E('a', 'npc', 'Mabel', { summary: 'Innkeeper of the Drowned Bell', tags: ['key'] }),
  E('b', 'location', 'Drowned Bell', { summary: 'An inn' }),
  E('c', 'quest', 'Ring the bell', { body: 'The drowned bell must ring', visibility: 'gm' }),
  E('d', 'npc', 'Tom', { secret: 'drowned the bell himself', status: 'suggested' }),
];

test('every word must match, and names rank first', () => {
  assert.deepEqual(searchEntries(all, { q: 'drowned bell' }).map((e) => e.id), ['b', 'a', 'c']);
  assert.deepEqual(searchEntries(all, { q: 'drowned bell' }, { gm: true }).map((e) => e.id), ['b', 'a', 'c', 'd'], 'GMs search secrets too');
  assert.deepEqual(searchEntries(all, { q: 'mab' }).map((e) => e.id), ['a']);
});

test('filters by kind, tag, place and state', () => {
  assert.deepEqual(searchEntries(all, { q: 'bell', kind: 'npc' }).map((e) => e.id), ['a']);
  assert.deepEqual(searchEntries(all, { q: '#key' }).map((e) => e.id), ['a']);
  assert.deepEqual(searchEntries(all, { tag: 'key' }).map((e) => e.id), ['a']);
  assert.deepEqual(searchEntries(all, { q: '' }, { within: new Set(['a', 'b']) }).map((e) => e.id), ['b', 'a'], 'no words: by name');
  assert.deepEqual(searchEntries(all, { state: 'hidden' }, { gm: true }).map((e) => e.id), ['c']);
  assert.deepEqual(searchEntries(all, { state: 'suggested' }, { gm: true }).map((e) => e.id), ['d']);
  assert.equal(searchEntries(all, { state: 'hidden' }).length, 4, 'players: the state filter does nothing');
});

test('search links round-trip', () => {
  const f = { q: 'drowned bell? yes', kind: 'npc', tag: '', inside: 'x1', state: 'hidden' };
  const h = searchHash(f);
  assert.equal(h, 'world/q/drowned%20bell%3F%20yes?kind=npc&in=x1&state=hidden');
  assert.deepEqual(parseSearch(h.slice('world/q/'.length)), f);
  assert.deepEqual(parseSearch(''), { q: '', kind: '', tag: '', inside: '', state: '' });
});
