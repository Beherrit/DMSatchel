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

test('nextHoliday: the next one within a month, across a month end', async () => {
  const { nextHoliday } = await import('../js/shop-hours.js');
  const { makeCalendar } = await import('../js/calendar.js');
  const cal = makeCalendar('seasons', 1040);
  const len = cal.months[0].days;
  const c = { ...cal, month: 1, day: 1, holidays: [{ name: 'Bridge Day', month: 1, day: 5 }, { name: 'Lanterns', month: 2, day: 2 }] };
  assert.deepEqual(nextHoliday(c), { name: 'Bridge Day', days: 4 });
  assert.deepEqual(nextHoliday({ ...c, day: 5 }), { name: 'Lanterns', days: len - 5 + 2 });
  assert.equal(nextHoliday({ ...c, day: 5 }, 3), null);
  assert.equal(nextHoliday({ ...c, holidays: [] }), null);
  assert.equal(nextHoliday(null), null);
});

test('a shop keeps its own hours', async () => {
  const { shopOpen, untilChange, openText, parseHours, tradingHours } = await import('../js/shop-hours.js');
  assert.deepEqual(parseHours('10-18'), [600, 1080]);
  assert.deepEqual(parseHours('6pm–2am'), [1080, 1560]);
  assert.deepEqual(parseHours('9am to 5pm'), [540, 1020]);
  assert.deepEqual(parseHours('noon–midnight'), [720, 1440]);
  assert.equal(parseHours('whenever'), null); assert.equal(parseHours('5-5'), null); assert.equal(parseHours(''), null);
  const night = { fields: { type: 'Shop', hours: '6pm–2am' } };
  assert.equal(shopOpen(night, 600).open, false); assert.equal(shopOpen(night, 600).opens, 'at 18:00');
  assert.equal(shopOpen(night, 23 * 60).open, true); assert.equal(shopOpen(night, 60).open, true);
  assert.deepEqual(untilChange(night, 23 * 60), { open: true, mins: 180 });
  assert.deepEqual(openText(night, 600), { open: false, text: 'shut till 18:00' });
  assert.deepEqual(tradingHours(night), [1080, 1560]);
  // Unreadable hours fall back to the usual.
  assert.equal(shopOpen({ fields: { type: 'Shop', hours: 'whenever' } }, 600).open, true);
  // Still shut on holidays.
  assert.equal(shopOpen(night, 23 * 60, 'Bridge Day').open, false);
});

test('a day off each week', async () => {
  const { shopOpen, openText, untilChange, tradeDay, shutText } = await import('../js/shop-hours.js');
  const { makeCalendar, weekday } = await import('../js/calendar.js');
  const cal = { ...makeCalendar('seasons', 1040), month: 1, day: 5, holidays: [] };
  const wd = weekday(cal, { year: 1040, month: 1, day: 5 });
  assert.deepEqual(tradeDay(cal), { holiday: '', weekday: wd });
  const shop = { fields: { type: 'Shop', closed_on: wd } }, inn = { fields: { type: 'Tavern', closed_on: `${wd}s` } }, other = { fields: { type: 'Shop', closed_on: 'Nonday' } };
  assert.deepEqual(shopOpen(shop, 600, tradeDay(cal)), { open: false, opens: 'tomorrow', dayOff: wd });
  assert.equal(shopOpen(inn, 600, tradeDay(cal)).open, false); // taverns take their day off too
  assert.equal(shopOpen(other, 600, tradeDay(cal)).open, true);
  assert.deepEqual(openText(shop, 600, tradeDay(cal)), { open: false, text: `shut on ${wd}s` });
  assert.deepEqual(untilChange(shop, 600, tradeDay(cal)), { open: false, mins: null });
  assert.equal(shutText({ dayOff: wd }), `shut on ${wd}s`);
  // A plain holiday name still works as before.
  assert.equal(shopOpen(shop, 600, '').open, true);
  assert.deepEqual(tradeDay(null), { holiday: '', weekday: '' });
});

test('hoursSign: the sign on the door', async () => {
  const { hoursSign } = await import('../js/shop-hours.js');
  assert.equal(hoursSign({ fields: { type: 'Shop' } }), 'Open 08:00–20:00');
  assert.equal(hoursSign({ fields: { type: 'Tavern' } }), 'Open 08:00–02:00');
  assert.equal(hoursSign({ fields: { type: 'Shop', hours: '6pm–2am', closed_on: 'Firedays' } }), 'Open 18:00–02:00 · Shut on Firedays');
});

test('rolled shops keep hours that suit their trade, and they all read', async () => {
  const { typicalHours, parseHours } = await import('../js/shop-hours.js');
  const { SHOP_TYPES } = await import('../js/economy.js');
  for (const t of Object.keys(SHOP_TYPES)) { const h = typicalHours(t); if (h) assert.ok(parseHours(h), `${t}: ${h}`); }
  assert.equal(typicalHours('Black market'), '10pm–4am'); assert.equal(typicalHours('General store'), ''); assert.equal(typicalHours('Nope'), '');
});
