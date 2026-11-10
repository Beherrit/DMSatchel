import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCalendar, parseHolidayLines, withLocal, holidaysOn } from '../js/calendar.js';
import { weekInTown } from '../js/week-in-town.js';
import { tradeDay, shopOpen } from '../js/shop-hours.js';

const cal = { ...makeCalendar('seasons', 1040), month: 1, day: 5, holidays: [] };

test('parseHolidayLines: name and date per line, bad lines named', () => {
  const r = parseHolidayLines(cal, 'Founding Day, 6 Thawmoon\nNonsense\nLamp Night, 99 Nowhere');
  assert.deepEqual(r.holidays, [{ name: 'Founding Day', month: 1, day: 6 }]);
  assert.deepEqual(r.bad, ['Nonsense', 'Lamp Night']);
});

test('withLocal: a town’s own holidays join the calendar, marked local', () => {
  const town = { name: 'Brindle', fields: { holidays: 'Founding Day, 5 Thawmoon' } };
  const c = withLocal(cal, town);
  assert.deepEqual(holidaysOn(c, { year: 1040, month: 1, day: 5 }).map((h) => [h.name, h.local]), [['Founding Day', 'Brindle']]);
  assert.equal(tradeDay(c).holiday, 'Founding Day');
  assert.equal(shopOpen({ fields: { type: 'Shop', stock: 'x' } }, 12 * 60, tradeDay(c)).open, false);
  assert.equal(withLocal(cal, { fields: {} }), cal);
  assert.equal(withLocal(null, town), null);
  assert.deepEqual(weekInTown(c, town, []).map((d) => d.holidays), [['Founding Day']]);
  assert.equal(cal.holidays.length, 0); // the world's calendar is untouched
});

test('local holidays with a first year count their anniversaries', async () => {
  const { ordinal, holidayTitle } = await import('../js/calendar.js');
  const r = parseHolidayLines(cal, 'Founding Day, 5 Thawmoon 841\nLamp Night, 6 Thawmoon');
  assert.deepEqual(r.holidays, [{ name: 'Founding Day', month: 1, day: 5, since: 841 }, { name: 'Lamp Night', month: 1, day: 6 }]);
  assert.equal(holidayTitle(r.holidays[0], 1040), 'the 200th Founding Day');
  assert.equal(holidayTitle(r.holidays[0], 841), 'the 1st Founding Day');
  assert.equal(holidayTitle(r.holidays[0], 800), 'Founding Day');
  assert.equal(holidayTitle(r.holidays[1], 1040), 'Lamp Night');
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 101, 111].map(ordinal), ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st', '111th']);
});
