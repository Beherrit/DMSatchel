import test from 'node:test';
import assert from 'node:assert/strict';
import { chainOf, waitingNext } from '../js/quest-chain.js';

test('what came before and what follows', () => {
  const Q = (id, name, follows, extra = {}) => ({ id, kind: 'quest', name, fields: { ...(follows ? { follows } : {}), ...(extra.fields || {}) }, ...extra });
  const list = [Q('a', 'The Missing Miller'), Q('b', 'Wolves at the Mill', 'the missing  miller'), Q('c', 'The Wolf Queen', 'Wolves at the Mill', { visibility: 'gm' }),
    Q('d', 'A Hide for the Tanner', 'Wolves at the Mill', { fields: { follows: 'Wolves at the Mill', status: 'Available' } }), Q('x', 'Loop A', 'Loop B'), Q('y', 'Loop B', 'Loop A'), { id: 'n', kind: 'npc', name: 'Wolves at the Mill' }];
  const c = chainOf(list[2], list);
  assert.deepEqual(c.before.map((e) => e.id), ['a', 'b']);
  assert.deepEqual(chainOf(list[1], list).after.map((e) => e.id), ['d', 'c']);
  assert.deepEqual(chainOf(list[0], list).before, []);
  assert.deepEqual(chainOf(list[4], list).before.map((e) => e.id), ['y']); // loops stop
  assert.deepEqual(waitingNext(chainOf(list[1], list).after).map((e) => e.id), ['c']);
});
