import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestableFields, cleanProposal, applyProposal } from '../js/edit-suggest.js';

const FIELDS = [['role', 'Role'], ['stock', 'Stock', 'long'], ['voice', 'Voice', 'long'], ['stats', 'Stats', 'hidden'], ['image', 'Picture', 'image'], ['plot', 'Plot', 'long', null, { gmOnly: true }], ['x_true', 'True name', 'text', null, { custom: true, gmSecret: true }]];
const entry = { summary: 'A smith', body: 'Old text', fields: { role: 'Smith', voice: 'Gruff' } };

test('only visible, ordinary fields can be suggested', () => {
  assert.deepEqual(suggestableFields(FIELDS).map(([k]) => k), ['role', 'voice']);
});

test('a proposal keeps only real changes', () => {
  const p = cleanProposal(entry, { summary: 'A smith ', body: 'New text', fields: { role: 'Smith', voice: '', stats: 'x', plot: 'y', x_true: 'z', nope: 1 } }, FIELDS);
  assert.deepEqual(p, { body: 'New text', fields: { voice: '' } });
  assert.deepEqual(cleanProposal(entry, { summary: 'A smith' }, FIELDS), {});
});

test('applying a proposal', () => {
  const after = applyProposal(entry, { body: 'New text', fields: { voice: '', role: 'Master smith' } });
  assert.deepEqual([after.summary, after.body, after.fields], ['A smith', 'New text', { role: 'Master smith' }]);
  assert.equal(entry.fields.voice, 'Gruff');
});
