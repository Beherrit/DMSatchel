import test from 'node:test';
import assert from 'node:assert/strict';
import { downtimeProgress } from '../js/downtime-days.js';

test('downtime counts the days', () => {
  const D = (id, fields) => ({ id, kind: 'downtime', name: id, fields });
  const list = [D('a', { days: '5' }), D('b', { days: '3', done: '2' }), D('c', { days: '4', resolved: '2030-01-01' }), D('d', {}), D('e', { days: '2', done: '2' }), { id: 'n', kind: 'npc', fields: { days: '3' } }];
  assert.deepEqual(downtimeProgress(list, 2).map((x) => [x.entry.id, x.done, x.ready]), [['a', 2, false], ['b', 3, true]]);
  assert.deepEqual(downtimeProgress(list, 9).map((x) => [x.entry.id, x.done, x.ready]), [['a', 5, true], ['b', 3, true]]);
  assert.deepEqual(downtimeProgress(list, 0), []);
});
