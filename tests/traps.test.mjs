import test from 'node:test';
import assert from 'node:assert/strict';
import { readTraps, addTrap, setTrap, removeTrap, trapsForPlayers, armedCount } from '../js/traps.js';

test('traps: add, set, remove, and what players may see', () => {
  let l = addTrap([], 'Pit under the rug'); l = addTrap(l, 'Poison needle in the lock');
  assert.equal(armedCount(l), 2);
  l = setTrap(l, l[1].id, 'found'); l = setTrap(l, l[1].id, 'nonsense');
  assert.deepEqual(l.map((t) => t.state), ['armed', 'found']);
  const place = { fields: { traps: JSON.stringify(l) } };
  assert.deepEqual(readTraps(place).map((t) => t.text), ['Pit under the rug', 'Poison needle in the lock']);
  assert.deepEqual(JSON.parse(trapsForPlayers(place.fields.traps)).map((t) => t.text), ['Poison needle in the lock']);
  assert.equal(removeTrap(l, l[0].id).length, 1);
  assert.deepEqual(readTraps({ fields: { traps: 'bad' } }), []);
  const s = setTrap(l, l[0].id, 'sprung', 'T1'); assert.equal(s[0].at, 'T1'); assert.equal(setTrap(s, l[0].id, 'armed')[0].at, undefined);
});
