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

test('changeOf, addLog with a change, and logSince', async () => {
  const { changeOf, logSince, snapshot } = await import('../js/play-log.js');
  const c = changeOf({ cp: 1000, inventory: 'Rope\n3 potions of healing\nLute' }, { cp: 600, inventory: 'Rope\n1 Potions of healing\n2 Torch' });
  assert.equal(c.cp, -400);
  assert.deepEqual(c.items, [{ name: 'Potions of healing', qty: -2 }, { name: 'Lute', qty: -1 }, { name: 'Torch', qty: 2 }]);
  assert.deepEqual(changeOf({}, {}), { cp: 0, items: [] });
  assert.deepEqual(snapshot({ cp: 5, inventory: 'x', hp: 3 }), { cp: 5, inventory: 'x' });
  const play = {};
  addLog(play, 'Bought rope', 'Ann', '2026-01-01T00:00:00Z', { cp: -100, items: [{ name: 'Rope', qty: 1 }] });
  addLog(play, 'A rest', 'Ann', '2026-01-05T00:00:00Z', { cp: 0, items: [] });
  addLog(play, 'Handed out by the GMs: 50 gp, 2 × Potion of healing', 'Morgan', '2026-01-06T00:00:00Z', { cp: 5000, items: [{ name: 'Potion of healing', qty: 2 }] });
  addLog(play, 'Sold rope', 'Ann', '2026-01-07T00:00:00Z', { cp: 50, items: [{ name: 'rope', qty: -1 }, { name: 'Lute', qty: -1 }] });
  assert.equal(play.log[1].cp, undefined); assert.equal(play.log[1].items, undefined);
  const s = logSince(play, '2026-01-04T00:00:00Z');
  assert.deepEqual(s.lines.map((x) => x.text), ['Sold rope', 'Handed out by the GMs: 50 gp, 2 × Potion of healing', 'A rest']);
  assert.equal(s.cp, 5050);
  assert.deepEqual(s.gained, [{ name: 'Potion of healing', qty: 2 }]);
  assert.deepEqual(s.lost, [{ name: 'rope', qty: 1 }, { name: 'Lute', qty: 1 }]);
  assert.equal(logSince(play, null).lines.length, 4);
  assert.equal(logSince(play, null).lost.length, 1); // the rope bought and sold cancels out
});
