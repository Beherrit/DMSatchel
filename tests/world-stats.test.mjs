import test from 'node:test';
import assert from 'node:assert/strict';
import { worldStats } from '../js/world-stats.js';

const E = (id, kind, name, extra = {}) => ({ id, kind, name, summary: '', body: '', fields: {}, links: [], parent_id: null, created_by: 'Ann', created_at: '2026-01-01T00:00:00Z', ...extra });
const names = { Bram: 'b', Cora: 'c', Brindle: 't' };
const idsIn = (text) => [...String(text).matchAll(/\[\[([^\]|]+)/g)].map((m) => names[m[1]]).filter(Boolean);

test('counts, mentions, places, writers, sessions and the oldest open quest', () => {
  const list = [
    E('t', 'settlement', 'Brindle'), E('i', 'location', 'The Bell', { parent_id: 't' }),
    E('b', 'npc', 'Bram', { parent_id: 'i', body: 'Two words.' }), E('c', 'npc', 'Cora', { parent_id: 't', created_by: 'Bo' }),
    E('s1', 'session', 'Session 1', { fields: { number: '1' }, body: 'Met [[Bram]] and [[Cora]] in [[Brindle]].' }),
    E('s2', 'session', 'Session 2', { fields: { number: '2' }, body: '[[Bram]] again, and [[Bram]].', links: [{ id: 'b' }] }),
    E('q1', 'quest', 'Old job', { fields: { status: 'Active' }, created_at: '2026-01-01T00:00:00Z' }),
    E('q2', 'quest', 'New job', { fields: { status: 'Available' }, created_at: '2026-03-01T00:00:00Z' }),
    E('q3', 'quest', 'Done job', { fields: { status: 'Completed' } }),
    E('p', 'character', 'Pip', { fields: { status: 'Dead' } }), E('x', 'npc', 'Hidden', { status: 'suggested' }),
  ];
  const s = worldStats(list, idsIn, Date.parse('2026-01-11T00:00:00Z'));
  assert.equal(s.entries, 10);
  assert.deepEqual(s.kinds[0], ['quest', 3]);
  assert.deepEqual(s.mentionedNpcs.map(([e, n]) => [e.name, n]), [['Bram', 2], ['Cora', 1]]);
  assert.deepEqual(s.busiestPlaces.map(([e, n]) => [e.name, n]), [['Brindle', 3], ['The Bell', 1]]);
  assert.deepEqual(s.writers, [['Ann', 9], ['Bo', 1]]);
  assert.deepEqual([s.sessions.count, s.sessions.first.id, s.sessions.last.id], [2, 's1', 's2']);
  assert.deepEqual([s.longestQuest.quest.id, s.longestQuest.days], ['q1', 10]);
  assert.deepEqual([s.characters, s.fallen, s.questsDone], [1, 1, 1]);
  assert.ok(s.words > 10);
  assert.equal(s.mostConnected[0].name, 'Bram');
});

test('an empty world', () => {
  const s = worldStats([]);
  assert.deepEqual([s.entries, s.sessions.count, s.longestQuest, s.mostConnected], [0, 0, null, null]);
});
