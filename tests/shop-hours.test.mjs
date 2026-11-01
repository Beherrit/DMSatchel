import test from 'node:test';
import assert from 'node:assert/strict';
import { shopOpen } from '../js/shop-hours.js';

test('shops keep hours', () => {
  const shop = { fields: { type: 'Shop' } }, inn = { fields: { type: 'Tavern' } }, innShop = { fields: { type: 'Shop', shop_type: 'Tavern & inn' } };
  assert.equal(shopOpen(shop, 9 * 60).open, true); assert.equal(shopOpen(shop, 7 * 60 + 59).open, false); assert.equal(shopOpen(shop, 20 * 60).open, false);
  assert.equal(shopOpen(shop, 23 * 60).opens, 'at 8 in the morning');
  assert.equal(shopOpen(inn, 23 * 60).open, true); assert.equal(shopOpen(inn, 60 + 30).open, true); assert.equal(shopOpen(inn, 3 * 60).open, false);
  assert.equal(shopOpen(innShop, 22 * 60).open, true);
});
