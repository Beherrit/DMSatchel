import test from 'node:test';
import assert from 'node:assert/strict';
import { questGroups } from '../js/quest-groups.js';

test('in play first, finished folded, unknown statuses kept', () => {
  const Q = (id, status) => ({ id, fields: status === undefined ? {} : { status } });
  const g = questGroups([Q('a', 'Completed'), Q('b', 'Active'), Q('c', 'Rumor'), Q('d'), Q('e', 'Failed'), Q('f', 'Abandoned'), Q('g', 'Odd')]);
  assert.deepEqual(g.map((x) => [x.key, x.open, x.entries.map((q) => q.id).join('')]), [['active', true, 'b'], ['rumor', true, 'c'], ['none', true, 'dg'], ['done', false, 'a'], ['failed', false, 'ef']]);
  assert.deepEqual(questGroups([]), []);
});
