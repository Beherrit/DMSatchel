import test from 'node:test';
import assert from 'node:assert/strict';
import { weekInTown, weekDayText } from '../js/week-in-town.js';
import { makeCalendar, weekday } from '../js/calendar.js';

const cal = { ...makeCalendar('seasons', 1040), month: 1, day: 5, holidays: [{ name: 'Bridge Day', month: 1, day: 7 }] };
const wd = (day) => weekday(cal, { year: 1040, month: 1, day });

test('weekInTown: market day, holidays and days off over the coming week', () => {
  const town = { name: 'Brindle', fields: { market_day: wd(6) } };
  const shops = [{ name: 'Smithy', fields: { type: 'Shop', stock: 'x', closed_on: wd(8) } }, { name: 'The Bell', fields: { type: 'Tavern', menu: 'ale' } }];
  const w = weekInTown(cal, town, shops);
  assert.deepEqual(w.map((d) => d.date.day), [6, 7, 8]);
  assert.equal(w[0].market, true);
  assert.deepEqual(w[1].holidays, ['Bridge Day']);
  assert.deepEqual(w[1].shut, [{ name: 'Smithy', why: 'holiday' }]);
  assert.deepEqual(w[2].shut, [{ name: 'Smithy', why: 'day off' }]);
  assert.equal(weekDayText(w[0]), '🧺 market day');
  assert.equal(weekDayText(w[1]), '🎉 Bridge Day · shut for the holiday: Smithy');
  assert.equal(weekDayText(w[2]), 'day off: Smithy');
});

test('weekInTown: no market on a holiday, today flagged, nothing to say → empty', () => {
  const town = { fields: { market_day: wd(7) } };
  const w = weekInTown(cal, town, []);
  assert.equal(w.length, 1); assert.equal(w[0].noMarket, true); assert.equal(w[0].market, false);
  assert.match(weekDayText(w[0]), /no market \(holiday\)/);
  assert.equal(weekInTown({ ...cal, holidays: [] }, { fields: {} }, []).length, 0);
  assert.equal(weekInTown({ ...cal, holidays: [] }, { fields: { market_day: wd(5) } }, [])[0].today, true);
  assert.deepEqual(weekInTown(null, town, []), []);
});

test('weekText: the week as plain text', async () => {
  const { weekText } = await import('../js/week-in-town.js');
  const town = { fields: { market_day: wd(6) } };
  const w = weekInTown(cal, town, []);
  assert.equal(weekText('Brindle', w, (d) => `Day ${d.date.day}`), 'The week in Brindle\n- Day 6: 🧺 market day\n- Day 7: 🎉 Bridge Day');
});

test('weekInTown: shops open for the holiday', () => {
  const shops = [{ name: 'Bakery', fields: { type: 'Shop', stock: 'x', holiday_open: 'Yes' } }, { name: 'Smithy', fields: { type: 'Shop', stock: 'x' } }];
  const w = weekInTown(cal, { fields: {} }, shops);
  assert.deepEqual(w[0].open, ['Bakery']);
  assert.equal(weekDayText(w[0]), '🎉 Bridge Day · shut for the holiday: Smithy · open for the holiday: Bakery');
});

test('weekInTown: birthdays of the people who live there', () => {
  const people = [{ kind: 'npc', name: 'Ada', fields: { born: '8 Thawmoon 1000' } }, { kind: 'npc', name: 'Bo', fields: { born: '20 Thawmoon' } }];
  const w = weekInTown({ ...cal, holidays: [] }, { fields: {} }, [], 7, people);
  assert.equal(w.length, 1); assert.deepEqual(w[0].births, [{ name: 'Ada', age: 40 }]);
  assert.equal(weekDayText(w[0]), '🎂 Ada’s birthday (40)');
});

test('nextMarket: today, later, skipping a holiday', async () => {
  const { nextMarket, inDaysText } = await import('../js/week-in-town.js');
  assert.equal(nextMarket(cal, { fields: { market_day: wd(5) } }).inDays, 0);
  assert.equal(nextMarket(cal, { fields: { market_day: wd(6) } }).inDays, 1);
  assert.equal(nextMarket(cal, { fields: { market_day: wd(7) } }).inDays, 9); // the 7th is Bridge Day
  assert.equal(nextMarket(cal, { fields: {} }), null);
  assert.equal(inDaysText(0), 'today'); assert.equal(inDaysText(1), 'tomorrow'); assert.equal(inDaysText(3), 'in 3 days');
});

test('nextShut: a shop’s next day off or holiday', async () => {
  const { nextShut } = await import('../js/week-in-town.js');
  const shop = { name: 'Smithy', fields: { type: 'Shop', stock: 'x', closed_on: wd(9) } };
  assert.deepEqual(nextShut(cal, shop), { inDays: 2, weekday: wd(7), why: 'holiday', holiday: 'Bridge Day' });
  assert.deepEqual(nextShut({ ...cal, holidays: [] }, shop), { inDays: 4, weekday: wd(9), why: 'day off' });
  assert.equal(nextShut({ ...cal, holidays: [] }, { name: 'X', fields: { type: 'Shop', stock: 'x' } }), null);
  assert.equal(nextShut(cal, { name: 'Bell', fields: { type: 'Tavern', menu: 'ale' } }), null); // taverns keep holidays open
});
