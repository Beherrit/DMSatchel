import test from 'node:test';
import assert from 'node:assert/strict';
import { unlinkedMentions, linkMentions } from '../js/mentions.js';

const E = (id, name) => ({ id, name });
const world = [E('me', 'Brindle'), E('m', 'Mayor Vane'), E('r', 'Red Hand'), E('h', 'Hand'), E('w', 'The Well'), E('x', 'Ox')];

test('finds plain mentions, whole words, matching case, longest name first', () => {
  const r = unlinkedMentions(['Brindle is run by Mayor Vane. The Red Hand watch Mayor Vane.', 'Mayor Vaned? no. a hand. Handy. the well.'], world, 'me');
  assert.deepEqual(r.map((x) => [x.entry.id, x.count]), [['m', 2], ['r', 1]]);
});

test('a linked longer name still keeps a shorter one out of its words', () => {
  assert.deepEqual(unlinkedMentions(['The [[Red Hand]] came.', 'Later the Red Hand left.'], world), []);
  assert.deepEqual(linkMentions(['the Red Hand and a Hand'], ['Hand'], ['Red Hand']), ['the Red Hand and a [[Hand]]']);
});

test('names already linked anywhere, or inside links, are skipped', () => {
  assert.deepEqual(unlinkedMentions(['[[Mayor Vane]] and Mayor Vane', 'the [[Red Hand|Hand]] agents'], world), []);
});

test('links the first plain mention of each name only', () => {
  const out = linkMentions(['Ask Mayor Vane.', 'Mayor Vane and the Red Hand; Red Hand again. [[Hand]]'], ['Mayor Vane', 'Red Hand']);
  assert.deepEqual(out, ['Ask [[Mayor Vane]].', 'Mayor Vane and the [[Red Hand]]; Red Hand again. [[Hand]]']);
  assert.deepEqual(linkMentions(['', null, 'x'], ['Red Hand']), ['', null, 'x']);
});
