import test from 'node:test';
import assert from 'node:assert/strict';
import { addStop, removeStop, journeyFor, journeyOnMap, JOURNEY_MAX } from '../js/journey.js';

test('addStop keeps moves, not stays, and caps the log', () => {
  let j = addStop(undefined, { id: 'a', at: 't1', day: '1 Frost', by: 'Ann' });
  j = addStop(j, { id: 'a', at: 't2' });
  j = addStop(j, { id: 'b', at: 't3' });
  assert.deepEqual(j, [{ id: 'a', at: 't1', day: '1 Frost', by: 'Ann' }, { id: 'b', at: 't3' }]);
  assert.equal(addStop(j, null), j);
  let long = [];
  for (let i = 0; i < JOURNEY_MAX + 5; i++) long = addStop(long, { id: `p${i}`, at: `t${i}` });
  assert.equal(long.length, JOURNEY_MAX); assert.equal(long[0].id, 'p5');
  assert.deepEqual(removeStop(j, 't1').map((s) => s.id), ['b']);
});

test('journeyFor hides unseen places without splitting stays', () => {
  const j = [{ id: 'a', at: '1' }, { id: 'secret', at: '2' }, { id: 'a', at: '3' }, { id: 'b', at: '4' }];
  assert.deepEqual(journeyFor(j, (id) => id !== 'secret').map((s) => s.at), ['1', '4']);
  assert.deepEqual(journeyFor(null, () => true), []);
});

test('journeyOnMap uses the nearest pinned place and merges stays at one pin', () => {
  const parent = { inn: 'town', town: 'reg', cave: 'reg', far: null };
  const chainOf = (id) => { const c = []; for (let x = id; x; x = parent[x]) c.push(x); return c; };
  const pins = [{ entry_id: 'town', x: 0.1, y: 0.2 }, { entry_id: 'cave', x: 0.5, y: 0.6 }];
  const pts = journeyOnMap([{ id: 'town', at: '1' }, { id: 'inn', at: '2' }, { id: 'far', at: '3' }, { id: 'cave', at: '4' }], pins, chainOf);
  assert.deepEqual(pts.map((p) => [p.x, p.y, p.stops.map((s) => s.at)]), [[0.1, 0.2, ['1', '2']], [0.5, 0.6, ['4']]]);
});
