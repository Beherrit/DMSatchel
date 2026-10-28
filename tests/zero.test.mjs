import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPrimer, primerEmpty, cleanAnswer, answerEmpty, summarize } from '../js/zero.js';

test('primer lists come from lines of text, deduplicated', () => {
  const p = cleanPrimer({ pitch: 'Pirates!', lines: '- Harm to children\n\n* Torture\nTorture', veils: ['Romance'], junk: 1 });
  assert.deepEqual(p.lines, ['Harm to children', 'Torture']);
  assert.deepEqual(p.veils, ['Romance']);
  assert.equal('junk' in p, false);
  assert.equal(primerEmpty(p), false);
  assert.equal(primerEmpty(cleanPrimer({ tone: '  ' })), true);
});

test('answers keep only known topics and ratings', () => {
  const a = cleanAnswer({ ratings: { Torture: 'line', Romance: 'veil', Spiders: 'line', Fire: 'nope' }, lines: 'Clowns', note: ' hi ', anon: 1 });
  assert.deepEqual(a, { ratings: { Torture: 'line', Romance: 'veil' }, lines: ['Clowns'], veils: [], note: 'hi', anon: true });
  assert.equal(answerEmpty(cleanAnswer({})), true);
});

test('the strictest answer wins, and what the primer has is not suggested again', () => {
  const s = summarize([
    { name: 'Pip', answer: cleanAnswer({ ratings: { Torture: 'veil', Romance: 'veil', Drowning: 'line' }, veils: 'Clowns' }) },
    { name: null, answer: cleanAnswer({ ratings: { Torture: 'line', Drowning: 'line' }, lines: 'Clowns', note: 'Go easy on the horror' }) },
    { name: 'Bo', answer: null },
  ], { lines: ['drowning'], veils: [] });
  assert.deepEqual(s.topics.map((t) => [t.topic, t.line.length, t.veil.length]), [['Drowning', 2, 0], ['Torture', 1, 1], ['Romance', 0, 1]]);
  assert.deepEqual(s.topics[1].line, ['Someone (anonymous)']);
  assert.deepEqual(s.suggest, { lines: ['Torture', 'Clowns'], veils: ['Romance'] });
  assert.deepEqual(s.notes, [{ text: 'Go easy on the horror', who: 'Someone (anonymous)' }]);
});
