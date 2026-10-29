import test from 'node:test';
import assert from 'node:assert/strict';
import { visitedPlaces } from '../js/visited.js';

test('being somewhere counts for everywhere around it', () => {
  const E = (id, parent_id = null) => ({ id, parent_id });
  const byId = new Map([E('r'), E('a', 'r'), E('t', 'a'), E('inn', 't'), E('t2', 'a'), E('far'), E('loop1', 'loop2'), E('loop2', 'loop1')].map((e) => [e.id, e]));
  assert.deepEqual([...visitedPlaces(['inn'], byId)].sort(), ['a', 'inn', 'r', 't']);
  assert.ok(visitedPlaces([], byId, 'far').has('far'));
  assert.equal(visitedPlaces(['gone'], byId).size, 0);
  assert.deepEqual([...visitedPlaces(['loop1'], byId)].sort(), ['loop1', 'loop2']); // a parent loop doesn't hang
});
