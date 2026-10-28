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
