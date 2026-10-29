import test from 'node:test';
import assert from 'node:assert/strict';
import { canRoll, rollDetail } from '../js/roll-detail.js';
import { makeRng } from '../js/rng.js';

test('rolls NPC details and settlement troubles from the tables', () => {
  const rng = makeRng('seed');
  for (const k of ['appearance', 'personality', 'voice', 'wants', 'secret']) {
    const t = rollDetail('npc', k, rng);
    assert.ok(typeof t === 'string' && t.length > 3 && /^[A-Z“"'(]/.test(t), `${k}: ${t}`);
  }
  assert.match(rollDetail('settlement', 'landmarks', rng), /^- .+\n- .+$/);
  assert.equal(rollDetail('npc', 'level', rng), null);
  assert.equal(rollDetail('creature', 'appearance', rng), null);
});

test('place features need a type with a scene', () => {
  const rng = makeRng(1);
  assert.equal(canRoll('location', 'features', { type: 'Tavern' }), true);
  assert.equal(canRoll('location', 'features', { type: 'Other' }), false);
  assert.equal(canRoll('location', 'features', {}), false);
  assert.ok(rollDetail('area', 'features', rng, { type: 'Forest' }).endsWith('.'));
  assert.equal(rollDetail('area', 'features', rng, { type: 'Plains' }), null);
});

test('the same seed rolls the same', () => {
  assert.equal(rollDetail('npc', 'voice', makeRng('x')), rollDetail('npc', 'voice', makeRng('x')));
});
