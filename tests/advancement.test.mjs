import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelForXp, splitXp, readAttendance, advancement } from '../js/advancement.js';

test('XP levels follow the table', () => {
  assert.equal(levelForXp(0), 1); assert.equal(levelForXp(299), 1); assert.equal(levelForXp(300), 2);
  assert.equal(levelForXp(6500), 5); assert.equal(levelForXp(999999), 20);
});

test('XP splits evenly in whole numbers', () => {
  assert.deepEqual(splitXp(1000, ['a', 'b', 'c']), [{ id: 'a', xp: 334 }, { id: 'b', xp: 333 }, { id: 'c', xp: 333 }]);
  assert.deepEqual(splitXp(500, []), []);
});

test('attendance adds up, and milestones are owed until the character levels', () => {
  const S = (id, chars, milestone = false) => ({ id, kind: 'session', fields: { attendance: JSON.stringify({ chars, milestone }) } });
  const entries = [
    { id: 'c1', kind: 'character', name: 'Brann', fields: { level: '3' } },
    { id: 'c2', kind: 'character', name: 'Vex', fields: { level: '2' } },
    S('s1', [{ id: 'c1', xp: 450, lvl: 2 }, { id: 'c2', xp: 450, lvl: 2 }]),
    S('s2', [{ id: 'c1', xp: 600, lvl: 3 }], true),
    S('s3', [{ id: 'c2', xp: 0, lvl: 2 }, { id: 'ghost', xp: 10 }], true),
    { id: 's4', kind: 'session', fields: { attendance: 'not json' } },
  ];
  const r = Object.fromEntries(advancement(entries).map((x) => [x.character.name, x]));
  assert.equal(r.Brann.sessions, 2); assert.equal(r.Brann.xp, 1050); assert.equal(r.Brann.xpLevel, 3); assert.equal(r.Brann.next, 2700);
  assert.equal(r.Brann.owed, 1, 'milestone at level 3, still level 3'); assert.equal(r.Brann.due, 4);
  assert.equal(r.Vex.owed, 1); assert.equal(r.Vex.due, 3);
  assert.deepEqual(readAttendance(entries[5]), { chars: [], milestone: false });
  entries[0].fields.level = '4';
  assert.equal(Object.fromEntries(advancement(entries).map((x) => [x.character.name, x])).Brann.owed, 0, 'levelled: nothing owed');
});
