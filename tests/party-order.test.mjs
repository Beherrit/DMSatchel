import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanOrder, watchShifts, onWatch, hhmm } from '../js/party-order.js';

test('cleanOrder: distinct ids, in order, at most 12', () => {
  assert.deepEqual(cleanOrder(['a', 'b', 'a', '', null, 'c']), ['a', 'b', 'c']);
  assert.deepEqual(cleanOrder('nope'), []);
  assert.equal(cleanOrder(Array.from({ length: 20 }, (_, i) => `x${i}`)).length, 12);
});

test('watchShifts and onWatch: the night split between the watchers', () => {
  const s = watchShifts(['a', 'b', 'c']);
  assert.deepEqual(s.map((x) => [x.id, hhmm(x.from), hhmm(x.to)]), [['a', '22:00', '00:40'], ['b', '00:40', '03:20'], ['c', '03:20', '06:00']]);
  assert.equal(onWatch(s, 23 * 60).id, 'a');
  assert.equal(onWatch(s, 2 * 60).id, 'b');
  assert.equal(onWatch(s, 5 * 60 + 59).id, 'c');
  assert.equal(onWatch(s, 12 * 60), null);
  assert.deepEqual(watchShifts([]), []);
});

test('ordersText: the orders as plain text', async () => {
  const { ordersText } = await import('../js/party-order.js');
  const names = { a: 'Ann', b: 'Bo' };
  assert.equal(ordersText(['b', 'a', 'x'], ['a', 'b'], (id) => names[id] || ''), 'Marching order (front to back): Bo, Ann\nWatches: 22:00–02:00 Ann; 02:00–06:00 Bo');
  assert.equal(ordersText([], [], () => ''), '');
});

test('cleanWatchTime: a sensible start and length, else 22:00 for eight hours', async () => {
  const { cleanWatchTime } = await import('../js/party-order.js');
  assert.deepEqual(cleanWatchTime(21 * 60, 9), { start: 1260, hours: 9 });
  assert.deepEqual(cleanWatchTime(undefined, undefined), { start: 1320, hours: 8 });
  assert.deepEqual(cleanWatchTime(-5, 40), { start: 1320, hours: 8 });
  assert.deepEqual(cleanWatchTime('1200', '6'), { start: 1200, hours: 6 });
});
