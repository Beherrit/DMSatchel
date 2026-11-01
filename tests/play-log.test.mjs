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

test('newLines: only the lines that are new since the old copy', async () => {
  const { newLines, playJson } = await import('../js/play-log.js');
  const a = { at: '2026-01-01T00:00:00Z', text: 'Bought rope', by: 'Ann' };
  const b = { at: '2026-01-02T00:00:00Z', text: 'Handed out by the GMs: 2 × Potion of healing', by: 'Morgan' };
  assert.deepEqual(newLines({ log: [a] }, { log: [a, b] }), [b]);
  assert.deepEqual(newLines({}, { log: [a] }), [a]);
  assert.deepEqual(newLines({ log: [a, b] }, { log: [a, b] }), []);
  assert.deepEqual(newLines(undefined, undefined), []);
  assert.deepEqual(playJson({ fields: { play: '{"log":[]}' } }), { log: [] });
  assert.deepEqual(playJson({ fields: { play: 'nope' } }), {});
  assert.deepEqual(playJson(null), {});
});
