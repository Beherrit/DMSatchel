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

test('shut for the holiday', async () => {
  const { shopOpen, holidayToday, shutText } = await import('../js/shop-hours.js');
  const shop = { fields: { type: 'Shop' } }, inn = { fields: { type: 'Tavern' } };
  assert.deepEqual(shopOpen(shop, 600, 'Bridge Day'), { open: false, opens: 'tomorrow', holiday: 'Bridge Day' });
  assert.equal(shopOpen(inn, 600, 'Bridge Day').open, true);
  assert.equal(shopOpen(shop, 600, '').open, true);
  assert.equal(holidayToday({ month: 1, day: 5, holidays: [{ name: 'Bridge Day', month: 1, day: 5 }] }), 'Bridge Day');
  assert.equal(holidayToday({ month: 1, day: 6, holidays: [{ name: 'Bridge Day', month: 1, day: 5 }] }), '');
  assert.equal(holidayToday(null), '');
  assert.equal(shutText({ holiday: 'Bridge Day' }), 'shut for Bridge Day'); assert.equal(shutText({}), 'shut for the night');
});
