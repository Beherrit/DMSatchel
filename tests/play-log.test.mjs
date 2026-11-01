import test from 'node:test';
import assert from 'node:assert/strict';
import { addLog, readLog, LOG_MAX } from '../js/play-log.js';

test('a history of outside changes on the sheet', () => {
  const p = { cp: 5 };
  addLog(p, '  −5 sp living costs  (modest, 1 day) ', 'Ann', '2030-01-01T00:00:00Z');
  assert.deepEqual(p.log, [{ at: '2030-01-01T00:00:00Z', text: '−5 sp living costs (modest, 1 day)', by: 'Ann' }]);
  addLog(p, ''); assert.equal(p.log.length, 1);
  for (let i = 0; i < 40; i++) addLog(p, `line ${i}`);
  assert.equal(p.log.length, LOG_MAX); assert.equal(p.log.at(-1).text, 'line 39');
  assert.deepEqual(readLog({ log: [null, { text: 'x' }, {}] }), [{ text: 'x' }]);
});
