import test from 'node:test';
import assert from 'node:assert/strict';
import { readGifts, addGift, giftWhat, GIFTS_MAX } from '../js/gifts.js';

test('gifts for NPCs', () => {
  let j = addGift('', { by: 'Ann', item: 'Potion of healing', qty: 2, note: 'to win her over', at: 't1' });
  j = addGift(j, { by: 'Bo', cp: 500, at: 't2' });
  const list = readGifts(j);
  assert.deepEqual(list, [{ at: 't1', by: 'Ann', item: 'Potion of healing', qty: 2, cp: 0, note: 'to win her over' }, { at: 't2', by: 'Bo', item: '', qty: 1, cp: 500, note: '' }]);
  assert.equal(giftWhat(list[0]), '2 × Potion of healing'); assert.equal(giftWhat(list[1]), '5 gp');
  assert.deepEqual(readGifts('nope'), []);
  let k = ''; for (let i = 0; i < 35; i++) k = addGift(k, { by: 'A', item: `I${i}` });
  assert.equal(readGifts(k).length, GIFTS_MAX);
});
