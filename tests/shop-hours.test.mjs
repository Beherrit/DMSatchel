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

test('closing time', async () => {
  const { untilChange } = await import('../js/shop-hours.js');
  const shop = { fields: { type: 'Shop' } }, inn = { fields: { type: 'Tavern' } };
  assert.deepEqual(untilChange(shop, 16 * 60 + 40), { open: true, mins: 200 });
  assert.deepEqual(untilChange(shop, 6 * 60), { open: false, mins: 120 });
  assert.deepEqual(untilChange(shop, 22 * 60), { open: false, mins: 600 });
  assert.deepEqual(untilChange(inn, 23 * 60), { open: true, mins: 180 });
  assert.deepEqual(untilChange(inn, 60), { open: true, mins: 60 });
  assert.deepEqual(untilChange(shop, 600, 'Bridge Day'), { open: false, mins: null });
});

test('holiday prices on the shelf: the eve of a holiday', async () => {
  const { holidayTomorrow, evePrice, isFestive } = await import('../js/shop-hours.js');
  const { makeCalendar } = await import('../js/calendar.js');
  const cal = { ...makeCalendar('seasons', 1040), month: 1, day: 4, holidays: [{ name: 'Bridge Day', month: 1, day: 5 }] };
  assert.equal(holidayTomorrow(cal), 'Bridge Day'); assert.equal(holidayTomorrow({ ...cal, day: 5 }), ''); assert.equal(holidayTomorrow(null), '');
  assert.ok(isFestive('Candle')); assert.ok(isFestive('Wine, common (pitcher)')); assert.ok(!isFestive('Rope'));
  assert.equal(evePrice(100, 'Candle', 'Bridge Day'), 125); assert.equal(evePrice(100, 'Rope', 'Bridge Day'), 100); assert.equal(evePrice(100, 'Candle', ''), 100);
});

test('openText: open till, shut till, shut for a holiday', async () => {
  const { openText } = await import('../js/shop-hours.js');
  const shop = { fields: { type: 'Shop' } }, inn = { fields: { type: 'Tavern' } };
  assert.deepEqual(openText(shop, 600), { open: true, text: 'open till 20:00' });
  assert.deepEqual(openText(shop, 21 * 60), { open: false, text: 'shut till 08:00' });
  assert.deepEqual(openText(shop, 300), { open: false, text: 'shut till 08:00' });
  assert.deepEqual(openText(inn, 23 * 60), { open: true, text: 'open till 02:00' });
  assert.deepEqual(openText(inn, 60), { open: true, text: 'open till 02:00' });
  assert.deepEqual(openText(shop, 600, 'Bridge Day'), { open: false, text: 'shut for Bridge Day' });
  assert.deepEqual(openText(inn, 600, 'Bridge Day'), { open: true, text: 'open till 02:00' });
});
