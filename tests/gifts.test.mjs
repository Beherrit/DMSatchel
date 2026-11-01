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

test('wantsMatch: a gift they wanted', async () => {
  const { wantsMatch, addGift, readGifts } = await import('../js/gifts.js');
  const wants = 'A cure for her son. Wants rare herbs and an old map of the marsh; always short of money.';
  assert.equal(wantsMatch(wants, 'Map of the Marches'), true);
  assert.equal(wantsMatch(wants, 'The old one'), false); // only small words
  assert.equal(wantsMatch(wants, 'Dried herbs (bundle)'), true);
  assert.equal(wantsMatch(wants, 'Potion of healing'), false);
  assert.equal(wantsMatch(wants, '', 500), true);
  assert.equal(wantsMatch('A quiet life', '', 500), false);
  assert.equal(wantsMatch('', 'Map'), false);
  assert.equal(readGifts(addGift('', { by: 'Ann', item: 'Map', wanted: true }))[0].wanted, true);
  assert.equal(readGifts(addGift('', { by: 'Ann', item: 'Map' }))[0].wanted, undefined);
});

test('givenBy: the gifts a character has given', async () => {
  const { givenBy, addGift } = await import('../js/gifts.js');
  const ide = { name: 'Ide' }, jory = { name: 'Jory' };
  const list = givenBy('Ann', [{ entry: ide, gifts: addGift(addGift('', { by: 'Ann', item: 'Map', at: 't1' }), { by: 'Bo', item: 'Rope', at: 't2' }) }, { entry: jory, gifts: addGift('', { by: 'ann', cp: 500, at: 't3' }) }]);
  assert.deepEqual(list.map((x) => `${x.npc.name}:${x.item || x.cp}`), ['Jory:500', 'Ide:Map']);
});

test('giftsSince: gifts given since the last session', async () => {
  const { giftsSince, addGift } = await import('../js/gifts.js');
  const ide = { name: 'Ide' };
  const list = giftsSince([{ entry: ide, gifts: addGift(addGift('', { by: 'Ann', item: 'Map', at: '2026-01-01T00:00:00Z' }), { by: 'Bo', item: 'Rope', at: '2026-03-01T00:00:00Z' }) }], '2026-02-01T00:00:00Z');
  assert.deepEqual(list.map((x) => `${x.by}:${x.item}`), ['Bo:Rope']);
});
