import test from 'node:test';
import assert from 'node:assert/strict';
import { lengthText, parseLength, averageLength, breakDue } from '../js/session-timer.js';

test('lengthText and parseLength: written lengths both ways', () => {
  assert.equal(lengthText(220), '3 h 40 min'); assert.equal(lengthText(180), '3 h'); assert.equal(lengthText(45), '45 min');
  for (const [t, m] of [['3 h 40 min', 220], ['3h40', 220], ['2.5 hours', 150], ['200 min', 200], ['3:15', 195], ['4 hrs', 240], ['2,5 h', 150]]) assert.equal(parseLength(t), m, t);
  assert.equal(parseLength('all evening'), null); assert.equal(parseLength(''), null);
});

test('averageLength and breakDue', () => {
  assert.deepEqual(averageLength(['3 h', '4 h', 'a while', '']), { minutes: 210, count: 2 });
  assert.equal(averageLength([]), null);
  assert.deepEqual(breakDue(60), { due: false, next: 90 });
  assert.deepEqual(breakDue(95), { due: true, next: 180 });
  assert.deepEqual(breakDue(95, 90, 90), { due: false, next: 180 });
  assert.deepEqual(breakDue(185, 90, 90), { due: true, next: 270 });
});
