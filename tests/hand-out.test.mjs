import test from 'node:test';
import assert from 'node:assert/strict';
import { readHandOut, handOutTotal } from '../js/hand-out.js';

test('handing out to everyone', () => {
  assert.deepEqual(readHandOut({ item: ' Potion of  healing ', qty: '2' }), { item: 'Potion of healing', qty: 2, cp: 0 });
  assert.deepEqual(readHandOut({ coin: '5 gp' }), { item: '', qty: 0, cp: 500 });
  assert.deepEqual(readHandOut({ item: 'Rope', qty: 0, coin: '10' }), { item: 'Rope', qty: 1, cp: 1000 });
  assert.ok(readHandOut({}).error);
  assert.deepEqual(handOutTotal({ item: 'Rope', qty: 2, cp: 50 }, 3), { qty: 6, cp: 150 });
});
