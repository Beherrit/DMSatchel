import test from 'node:test';
import assert from 'node:assert/strict';
import { mergedEntry, relinkLinks, relinkText } from '../js/merge.js';

test('the surviving entry keeps its own and gains the other’s', () => {
  const into = { id: 'a', summary: '', body: 'Runs the inn.', secret: '', fields: { role: 'Innkeeper', voice: '' }, tags: ['key'], links: [{ id: 'x', label: 'friend of' }, { id: 'b', label: 'same as' }] };
  const from = { id: 'b', summary: 'A gruff innkeeper.', body: 'Owes the guild.', secret: 'A spy', fields: { role: 'Cook', voice: 'Gravel' }, tags: ['key', 'brindle'], links: [{ id: 'x', label: 'friend of' }, { id: 'a', label: 'twin' }, { id: 'y', label: 'owes' }] };
  const m = mergedEntry(into, from);
  assert.equal(m.summary, 'A gruff innkeeper.');
  assert.equal(m.body, 'Runs the inn.\n\nOwes the guild.');
  assert.equal(m.secret, 'A spy');
  assert.deepEqual(m.fields, { role: 'Innkeeper', voice: 'Gravel' });
  assert.deepEqual(m.tags, ['key', 'brindle']);
  assert.deepEqual(m.links.map((l) => `${l.id}:${l.label}`), ['x:friend of', 'y:owes']);
});

test('other entries’ connections and mentions move over', () => {
  assert.deepEqual(relinkLinks([{ id: 'b', label: 'ally' }, { id: 'a', label: 'ally' }, { id: 'c', label: 'x' }], 'b', 'a', 'z').map((l) => l.id), ['a', 'c']);
  assert.equal(relinkText('Ask [[Old Bram]] or [[old bram|the old man]] about [[Bramble]].', 'Old Bram', 'Bram the Innkeeper'),
    'Ask [[Bram the Innkeeper|Old Bram]] or [[Bram the Innkeeper|the old man]] about [[Bramble]].');
  assert.equal(relinkText('See [[Brindel]].', 'Brindel', 'Brindle'), 'See [[Brindle|Brindel]].');
  assert.equal(relinkText('See [[brindle]].', 'brindle', 'Brindle'), 'See [[Brindle]].');
});
