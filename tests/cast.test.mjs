import test from 'node:test';
import assert from 'node:assert/strict';
import { castList } from '../js/cast.js';

test('people met in the session log, alphabetical, with how often and when last', () => {
  const S = (id, n, body, links = []) => ({ id, kind: 'session', name: `Session ${n}`, fields: { number: String(n) }, body, links });
  const list = [{ id: 'b', kind: 'npc', name: 'bram' }, { id: 'a', kind: 'npc', name: 'Ann' }, { id: 'c', kind: 'npc', name: 'Cob' }, { id: 't', kind: 'settlement', name: 'Brindle' },
    S('s1', 1, 'Met [[Bram]] in [[Brindle]].'), S('s2', 2, 'Bram again.', [{ id: 'a' }, { id: 'b' }])];
  const names = { Bram: 'b', Brindle: 't' };
  const idsIn = (t) => [...String(t).matchAll(/\[\[([^\]|]+)/g)].map((m) => names[m[1]]).filter(Boolean);
  assert.deepEqual(castList(list, idsIn).map((x) => [x.entry.name, x.count, x.last.id]), [['Ann', 1, 's2'], ['bram', 2, 's2']]);
});

test('sortCast by name, longest unseen or most seen', async () => {
  const { sortCast } = await import('../js/cast.js');
  const L = [{ entry: { name: 'Bo' }, count: 1, ago: 3 }, { entry: { name: 'ann' }, count: 4, ago: 0 }, { entry: { name: 'Cy' }, count: 1, ago: 3 }];
  assert.deepEqual(sortCast(L).map((x) => x.entry.name), ['ann', 'Bo', 'Cy']);
  assert.deepEqual(sortCast(L, 'unseen').map((x) => x.entry.name), ['Bo', 'Cy', 'ann']);
  assert.deepEqual(sortCast(L, 'seen').map((x) => x.entry.name), ['ann', 'Bo', 'Cy']);
});

test('castText: one plain line each', async () => {
  const { castText } = await import('../js/cast.js');
  const L = [{ entry: { name: 'Ann', fields: { role: 'Innkeeper' } }, count: 2, last: { name: 'Session 2' } }, { entry: { name: 'Bo', fields: { status: 'Dead' } }, count: 1, last: { name: 'Session 1' } }];
  assert.equal(castText(L, (e) => (e.name === 'Ann' ? 'AN' : '')), 'Ann (AN) — Innkeeper · met in 2 sessions, last in Session 2\nBo · met in 1 session, last in Session 1 · dead');
});
