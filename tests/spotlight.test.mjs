import test from 'node:test';
import assert from 'node:assert/strict';
import { namesFor, mentionsIn, spotlight } from '../js/spotlight.js';

test('names a log might use', () => {
  assert.deepEqual(namesFor('Pip the Bold'), ['Pip the Bold', 'Pip']);
  assert.deepEqual(namesFor('Sir Brann'), ['Sir Brann']);
  assert.deepEqual(namesFor('Vo'), ['Vo']);
});

test('whole words only, any case', () => {
  assert.equal(mentionsIn('Then [[Pip the Bold]] ran', 'Pip the Bold'), true);
  assert.equal(mentionsIn('pip picked the lock', 'Pip the Bold'), true);
  assert.equal(mentionsIn('The pipe burst', 'Pip the Bold'), false);
  assert.equal(mentionsIn('Zoë stayed', 'Zoë'), true);
});

test('least attention first; missed sessions do not count against you', () => {
  const C = (id, name) => ({ id, kind: 'character', name, fields: { status: 'Active' } });
  const S = (n, body, chars) => ({ id: `s${n}`, kind: 'session', name: `Session ${n}`, body, fields: { number: String(n), ...(chars ? { attendance: JSON.stringify({ chars: chars.map((id) => ({ id })) }) } : {}) } });
  const entries = [C('a', 'Ann'), C('b', 'Bram'), C('c', 'Cy'), { ...C('d', 'Dead Dan'), fields: { status: 'Dead' } },
    S(1, 'Ann and Bram and Cy fought.'), S(2, 'Ann talked to the mayor.', ['a', 'b']), S(3, 'Ann and Bram explored.', ['a', 'b']), S(4, 'Bram found a key.', ['a', 'b'])];
  const r = spotlight(entries, 3);
  assert.deepEqual(r.map((x) => [x.character.name, x.featured, x.attended]), [['Ann', 2, 3], ['Bram', 2, 3], ['Cy', 0, 0]]);
  const byName = Object.fromEntries(r.map((x) => [x.character.name, x]));
  assert.equal(byName.Cy.attended, 0); // missed the last three
  assert.equal(byName.Cy.last, '1');
  assert.equal(byName.Ann.featured, 2);
  assert.equal(byName.Bram.last, '4');
  assert.equal(r.some((x) => x.character.name === 'Dead Dan'), false);
});
