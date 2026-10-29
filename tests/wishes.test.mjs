import test from 'node:test';
import assert from 'node:assert/strict';
import { readWishes, addWish, setGot, removeWish, openWishes, wishMatches, wishersFor } from '../js/wishes.js';

test('wishes are added, ticked off and removed', () => {
  let l = addWish([], '  A flying ship ');
  assert.equal(l[0].text, 'A flying ship'); assert.equal(l[0].got, false);
  l = setGot(l, l[0].id, true, 'T');
  assert.deepEqual([l[0].got, l[0].at], [true, 'T']); assert.equal(openWishes(l).length, 0);
  l = setGot(l, l[0].id, false);
  assert.equal('at' in l[0], false);
  assert.deepEqual(removeWish(l, l[0].id), []);
  assert.deepEqual(readWishes({ fields: { wishes: 'not json' } }), []);
  assert.deepEqual(readWishes({ fields: { wishes: JSON.stringify([{ id: 'a', text: 'x' }, { text: '  ' }, null]) } }), [{ id: 'a', text: 'x', got: false }]);
});

test('loot matches wishes by name or by words', () => {
  assert.ok(wishMatches('A Cloak of Elvenkind', 'cloak of elvenkind'));
  assert.ok(wishMatches('an elvenkind cloak', 'Cloak of Elvenkind'));
  assert.ok(wishMatches('Boots of [[Speed]]', 'Boots of Speed'));
  assert.ok(wishMatches('flame tongue sword', 'Flame Tongue Longsword') === false);
  assert.ok(!wishMatches('a potion of healing', 'Potion of Fire Breath'));
  assert.ok(!wishMatches('a ship', 'Gem'));
  const pip = { name: 'Pip', fields: { wishes: JSON.stringify([{ id: '1', text: 'Bag of Holding' }, { id: '2', text: 'bag of holding', got: true }]) } };
  assert.deepEqual(wishersFor('Bag of Holding', [pip, { name: 'Bo', fields: {} }]).map((x) => [x.character.name, x.wish.id]), [['Pip', '1']]);
});
