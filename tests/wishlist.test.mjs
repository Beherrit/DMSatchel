import test from 'node:test';
import assert from 'node:assert/strict';
import { wishesOf, wishMatches, wantersOf } from '../js/wishlist.js';

test('wishMatches: loose but whole-word', () => {
  assert.ok(wishMatches('rope', 'Rope (50 feet)'));
  assert.ok(wishMatches('a good lantern', 'Hooded lantern'));
  assert.ok(wishMatches('Candles', 'Candles (10)'));
  assert.ok(wishMatches('candle', 'Candles (10)'));
  assert.ok(!wishMatches('rope', 'Ropewalker’s boots'));
  assert.ok(!wishMatches('silver dagger', 'Dagger'));
  assert.ok(!wishMatches('', 'Dagger'));
});

test('wantersOf: the characters who want it', () => {
  const ann = { name: 'Ann', fields: { wishlist: '- Rope\nA good lantern' } }, bo = { name: 'Bo', fields: { wishlist: 'dagger' } }, cy = { name: 'Cy', fields: {} };
  assert.deepEqual(wishesOf(ann), ['Rope', 'A good lantern']);
  assert.deepEqual(wantersOf([ann, bo, cy], 'Hooded lantern').map((c) => c.name), ['Ann']);
  assert.deepEqual(wantersOf([ann, bo, cy], 'Dagger').map((c) => c.name), ['Bo']);
});
