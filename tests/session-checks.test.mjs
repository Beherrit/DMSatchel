import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionChecks } from '../js/session-checks.js';

const S = (id, number, body = 'A long enough log about what happened at the inn and on the road home, with [[Ann]].') => ({ kind: 'session', id, name: `Session ${number}`, fields: { number }, body });

test('sessionChecks: missing and repeated numbers, unnumbered sessions', () => {
  const r = sessionChecks([S('a', '1'), S('b', '2'), S('c', '2'), S('d', '5'), S('e', ''), { kind: 'npc' }]);
  assert.deepEqual(r.missing, [3, 4]);
  assert.deepEqual(r.repeated.map((x) => [x.n, x.sessions.map((s) => s.id)]), [[2, ['b', 'c']]]);
  assert.deepEqual(r.unnumbered.map((s) => s.id), ['e']);
});

test('sessionChecks: logs still to write', () => {
  const r = sessionChecks([S('a', '1'), S('b', '2', ''), S('c', '3', 'Fought [[Goblins]].')]);
  assert.deepEqual(r.empty.map((s) => s.id), ['c', 'b']);
  assert.deepEqual(sessionChecks([]), { missing: [], repeated: [], unnumbered: [], empty: [] });
});
