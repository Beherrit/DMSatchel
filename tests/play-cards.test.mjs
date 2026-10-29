import test from 'node:test';
import assert from 'node:assert/strict';
import { cardText, itemCard, itemsNamed } from '../js/play-cards.js';

test('cardText trims at a sentence, else a word, and drops formatting', () => {
  assert.equal(cardText('**Bold** and [[Brindle|town]].'), 'Bold and town.');
  const long = 'One sentence here. '.repeat(40);
  assert.ok(cardText(long, 100).endsWith('here.') && cardText(long, 100).length <= 100);
  assert.ok(cardText('word '.repeat(60), 50).endsWith('…'));
});

test('itemCard picks player text and a tidy subtitle', () => {
  const c = itemCard({ name: 'Cloak of Elvenkind', body: 'Long body.', secret: 'GM only', fields: { type: 'Wondrous item', rarity: 'Uncommon', attunement: 'yes', properties: 'You have advantage on Stealth.', value: '500 gp' } });
  assert.deepEqual(c, { title: 'Cloak of Elvenkind', sub: 'Wondrous item · uncommon · requires attunement', text: 'You have advantage on Stealth.', foot: '500 gp', image: null });
  assert.equal(itemCard({ name: 'Rope', fields: { rarity: 'Mundane', attunement: 'No' }, summary: 'Hempen.' }).sub, '');
  assert.equal(itemCard({ name: 'X', fields: { attunement: 'Requires attunement by a wizard' } }).sub, 'Requires attunement by a wizard');
  assert.equal(itemCard({ name: 'X', fields: { attunement: 'by a cleric' } }).sub, 'requires attunement by a cleric');
});

test('itemsNamed matches treasury names to item entries', () => {
  const list = [{ kind: 'item', name: 'The Bell of Brindle' }, { kind: 'item', name: 'Rope' }, { kind: 'npc', name: 'Rope' }];
  assert.deepEqual(itemsNamed(list, ['bell of brindle', 'a rope', 'Sword']).map((e) => e.name), ['The Bell of Brindle', 'Rope']);
});
