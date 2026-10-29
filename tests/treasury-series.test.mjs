import test from 'node:test';
import assert from 'node:assert/strict';
import { balanceSeries, coinTicks } from '../js/treasury-series.js';

test('the running balance, oldest first', () => {
  const s = balanceSeries([
    { at: '2026-03-02', cp: -300, note: 'Rope' }, { at: '2026-03-01', cp: 1000, note: 'Bounty' },
    { at: '2026-03-03', cp: 0, item: 'Sword', qty: 1 }, { at: '2026-03-04', cp: 500, deleted: true },
  ]);
  assert.deepEqual(s.map((x) => [x.at, x.cp, x.change, x.note]), [['2026-03-01', 1000, 1000, 'Bounty'], ['2026-03-02', 700, -300, 'Rope']]);
  assert.deepEqual(balanceSeries(null), []);
});

test('round gridlines from zero past the top', () => {
  assert.deepEqual(coinTicks(0, 1000), [0, 500, 1000]);
  const t = coinTicks(120, 4700);
  assert.equal(t[0], 0); assert.ok(t.at(-1) >= 4700); assert.ok(t.length <= 5);
  assert.ok(coinTicks(-200, 300)[0] <= -200);
});
