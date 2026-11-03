import test from 'node:test';
import assert from 'node:assert/strict';
import { readClock, advanceClock, addLight, removeLight, setTime, partOfDay, hhmm, leftText } from '../js/clock.js';

test('a new clock starts at eight in the morning with no lights', () => {
  assert.deepEqual(readClock(null), { minutes: 480, lights: [] });
});

test('time moves on, lights burn down and go out, midnight turns the day', () => {
  let c = addLight(setTime(null, 1380), 'Torch', 60).clock; // 23:00
  c = addLight(c, 'Lantern', 360).clock;
  c = addLight(c, 'Continual flame', 0).clock;
  const r = advanceClock(c, 90);
  assert.equal(r.days, 1);
  assert.equal(hhmm(r.clock.minutes), '00:30');
  assert.deepEqual(r.out, ['Torch']);
  assert.deepEqual(r.clock.lights.map((l) => [l.name, l.left]), [['Lantern', 270], ['Continual flame', 0]]);
  assert.equal(advanceClock(r.clock, 60 * 24 * 3).days, 3);
});

test('lights: named, limited, removable', () => {
  assert.match(addLight(null, ' ', 60).error, /Name/);
  const c = addLight(null, 'Candle', 60).clock;
  assert.equal(removeLight(c, c.lights[0].id).lights.length, 0);
});

test('readable times', () => {
  assert.equal(partOfDay(400), 'dawn');
  assert.equal(partOfDay(700), 'midday');
  assert.equal(partOfDay(1300), 'night');
  assert.equal(partOfDay(30), 'the dead of night');
  assert.equal(leftText(90), '1 h 30 min');
  assert.equal(leftText(45), '45 min');
});

test('lights from the pack: what each light uses', async () => {
  const { fuelFor } = await import('../js/clock.js');
  const { takeItem } = await import('../js/handover.js');
  assert.equal(fuelFor('Torch'), 'torch'); assert.equal(fuelFor('Lantern'), 'oil'); assert.equal(fuelFor('Light (cantrip)'), null);
  assert.deepEqual(takeItem('Rope\n5 Torches', fuelFor('Torch')), { text: 'Rope\n4 Torches', name: 'Torches', qty: 1 });
  assert.equal(takeItem('Rope\n2 Flasks of oil', fuelFor('Lantern')).text, 'Rope\n1 Flasks of oil');
  assert.ok(takeItem('Rope', fuelFor('Torch')).error);
});

test('lightName: whose light it is', async () => {
  const { lightName } = await import('../js/clock.js');
  assert.equal(lightName('Torch', 'Ann'), 'Ann’s torch'); assert.equal(lightName('Lantern'), 'Lantern');
});

test('untilNext: always forward to the next time of day', async () => {
  const { untilNext, JUMPS } = await import('../js/clock.js');
  assert.equal(untilNext(7 * 60, 8 * 60), 60);
  assert.equal(untilNext(20 * 60, 8 * 60), 12 * 60);
  assert.equal(untilNext(8 * 60, 8 * 60), 1440);
  assert.equal(untilNext(23 * 60 + 30, 22 * 60), 22 * 60 + 30);
  assert.deepEqual(JUMPS.map(([l]) => l), ['Morning', 'Midday', 'Evening', 'Night']);
});
