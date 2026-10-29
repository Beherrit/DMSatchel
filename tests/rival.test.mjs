import test from 'node:test';
import assert from 'node:assert/strict';
import { rivalParty } from '../js/rival.js';
import { makeRng } from '../js/rng.js';

test('a rival party: a company and four adventurers near the party’s level', () => {
  for (let s = 0; s < 30; s++) {
    const r = rivalParty(makeRng(`rival-${s}`), { level: 5, place: { id: 'p', name: 'Brindle' } });
    assert.equal(r.company.kind, 'guild'); assert.equal(r.company.parent_id, 'p');
    assert.equal(r.members.length, 4);
    const classes = r.members.map((m) => m.fields.level.split(' ')[0]);
    assert.equal(new Set(classes).size, 4, 'four different classes');
    for (const m of r.members) { const l = Number(m.fields.level.split(' ')[1]); assert.ok(l >= 4 && l <= 7, m.fields.level); assert.equal(m.kind, 'npc'); }
    assert.ok(r.company.secret.startsWith('Their grudge'));
    for (const m of r.members) assert.ok(r.company.body.includes(`[[${m.name}]]`));
    assert.ok(!/\{|\}/.test(r.company.name), r.company.name);
  }
  // Same seed, same party; level 1 never goes below 1.
  assert.deepEqual(rivalParty(makeRng('x'), { level: 1 }), rivalParty(makeRng('x'), { level: 1 }));
  assert.ok(rivalParty(makeRng('y'), { level: 1 }).members.every((m) => Number(m.fields.level.split(' ')[1]) >= 1));
});
