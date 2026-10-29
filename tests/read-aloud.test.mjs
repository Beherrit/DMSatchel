import test from 'node:test';
import assert from 'node:assert/strict';
import { boxesIn, entryBoxes, mentionsIn, readAloudPlan } from '../js/read-aloud.js';

test('boxesIn finds every read-aloud box and only those', () => {
  const t = 'Intro.\n\n> The door creaks.\n> Cold air spills out.\n\nNotes.\n\n> **Second** box\n\nMixed\n> not a box';
  assert.deepEqual(boxesIn(t), ['The door creaks.\nCold air spills out.', '**Second** box']);
  assert.deepEqual(boxesIn(''), []); assert.deepEqual(boxesIn(null), []);
});

test('entryBoxes: description, long fields, then the secret', () => {
  const e = { body: '> A', fields: { features: '> B', dangers: 'none' }, secret: '> C' };
  assert.deepEqual(entryBoxes(e, ['features', 'dangers']), [{ from: 'body', text: 'A' }, { from: 'features', text: 'B' }, { from: 'secret', text: 'C' }]);
});

test('mentionsIn keeps order and drops repeats', () => {
  assert.deepEqual(mentionsIn('Open at [[The Gate]], then [[Ann|the guard]].\n\n- [[the gate]] again\n- [[Crypt]]'), ['The Gate', 'Ann', 'Crypt']);
});

test('readAloudPlan merges lists, first place wins, skips entries without boxes', () => {
  const a = { id: 'a', body: '> one' }, b = { id: 'b', body: 'no box' }, c = { id: 'c', body: '> three' };
  assert.deepEqual(readAloudPlan([[c], [a, b, c], null]).map((x) => x.entry.id), ['c', 'a']);
});
