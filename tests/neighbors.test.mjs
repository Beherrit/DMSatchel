import test from 'node:test';
import assert from 'node:assert/strict';
import { neighbors } from '../js/neighbors.js';

test('by name within a kind, sessions by number', () => {
  const list = [{ id: 'c', kind: 'npc', name: 'Cob' }, { id: 'a', kind: 'npc', name: 'ann' }, { id: 'b', kind: 'npc', name: 'Bram' }, { id: 'x', kind: 'location', name: 'Bell' },
    { id: 's2', kind: 'session', name: 'Session 2', fields: { number: '2' } }, { id: 's10', kind: 'session', name: 'Session 10', fields: { number: '10' } }, { id: 's1', kind: 'session', name: 'Session 1', fields: { number: '1' } }];
  const n = (id) => { const r = neighbors(list, list.find((x) => x.id === id)); return [r.prev?.id ?? null, r.next?.id ?? null]; };
  assert.deepEqual(n('b'), ['a', 'c']); assert.deepEqual(n('a'), [null, 'b']); assert.deepEqual(n('c'), ['b', null]);
  assert.deepEqual(n('s2'), ['s1', 's10']); assert.deepEqual(n('x'), [null, null]);
});
