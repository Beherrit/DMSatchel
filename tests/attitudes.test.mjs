import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAttitudes, withAttitude, towards, tone } from '../js/attitudes.js';

test('attitudes are stored on the character and read back both ways', () => {
  const brann = { id: 'c1', kind: 'character', name: 'Brann', fields: {} };
  brann.fields.attitudes = withAttitude(brann, 'n1', 'Friendly', 'Saved her son');
  brann.fields.attitudes = withAttitude(brann, 'f1', 'Hostile');
  const vex = { id: 'c2', kind: 'character', name: 'Vex', fields: { attitudes: withAttitude({ fields: {} }, 'n1', 'Wary') } };
  assert.deepEqual(readAttitudes(brann), { n1: { a: 'Friendly', note: 'Saved her son' }, f1: { a: 'Hostile', note: '' } });
  assert.deepEqual(towards([brann, vex, { id: 'n1', kind: 'npc', name: 'Mabel' }], 'n1').map((x) => [x.character.name, x.a]), [['Brann', 'Friendly'], ['Vex', 'Wary']]);
  brann.fields.attitudes = withAttitude(brann, 'n1', null);
  assert.deepEqual(Object.keys(readAttitudes(brann)), ['f1']);
  assert.deepEqual(readAttitudes({ fields: { attitudes: '{"x":{"a":"Smitten"},"y":"bad"}' } }), {}, 'unknown values dropped');
  assert.deepEqual(readAttitudes({ fields: { attitudes: 'not json' } }), {});
  assert.equal(tone('Devoted'), 'good'); assert.equal(tone('Indifferent'), 'neutral'); assert.equal(tone('Wary'), 'bad');
});
