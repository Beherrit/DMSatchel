import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDues, duesLine, paidDues } from '../js/guild-dues.js';

test('parseDues: an amount and a period, as monthly copper', () => {
  assert.deepEqual(parseDues('5 gp a month; members get a discount'), { cp: 500, per: 'month', monthly: 500 });
  assert.deepEqual(parseDues('Dues of 2 sp per tenday'), { cp: 20, per: 'week', monthly: 80 });
  assert.deepEqual(parseDues('50 gp a year'), { cp: 5000, per: 'year', monthly: 417 });
  assert.deepEqual(parseDues('10 gp monthly'), { cp: 1000, per: 'month', monthly: 1000 });
  assert.equal(parseDues('A favour now and then'), null);
  assert.equal(parseDues(''), null);
});

test('duesLine and paidDues: this month paid or not, by the log', () => {
  const line = duesLine('the Masons', 'Thawmoon 1040', '5 gp');
  assert.equal(line, 'Paid 5 gp dues to the Masons for Thawmoon 1040');
  assert.equal(paidDues([{ text: line }], 'the Masons', 'Thawmoon 1040'), true);
  assert.equal(paidDues([{ text: line }], 'the Masons', 'Seedtime 1040'), false);
  assert.equal(paidDues([{ text: line }], 'the Weavers', 'Thawmoon 1040'), false);
  assert.equal(paidDues(null, 'x', 'y'), false);
});
