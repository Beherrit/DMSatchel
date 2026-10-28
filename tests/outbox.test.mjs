import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueue, remove, keyOf, isOffline } from '../js/outbox-core.js';

test('the latest change to the same thing replaces the older one', () => {
  let q = enqueue([], { world: 'w', kind: 'play', id: 'c1', data: { hp: 5 } }, 't1');
  q = enqueue(q, { world: 'w', kind: 'note', id: 'c1', data: 'hi' }, 't2');
  q = enqueue(q, { world: 'w', kind: 'play', id: 'c1', data: { hp: 3 } }, 't3');
  assert.deepEqual(q.map((x) => [x.kind, x.data, x.at]), [['note', 'hi', 't2'], ['play', { hp: 3 }, 't3']]);
  assert.equal(remove(q, keyOf({ world: 'w', kind: 'note', id: 'c1' })).length, 1);
});

test('only connection failures count as offline', () => {
  assert.equal(isOffline({ status: 0 }), true);
  assert.equal(isOffline({ status: 409 }), false);
  assert.equal(isOffline({ status: 0, body: { code: 'preview' } }), false);
  assert.equal(isOffline(new TypeError('x is undefined')), false);
});
