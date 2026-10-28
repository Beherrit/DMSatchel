import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTable, rollTable, rollDice, expand, chances } from '../js/rolltable.js';
import { makeRng } from '../js/rng.js';

test('tables read weights, die ranges, comments and bullets', () => {
  const rows = parseTable('# patrons\nA one-eyed fisherman\n3x Nothing but rats\n1-4: Rain\n5–6: Fog\n7) Snow\n- Bulleted line\n2.5 gp coin');
  assert.deepEqual(rows.map((r) => [r.text, r.weight]), [['A one-eyed fisherman', 1], ['Nothing but rats', 3], ['Rain', 4], ['Fog', 2], ['Snow', 1], ['Bulleted line', 1], ['2.5 gp coin', 1]]);
  assert.deepEqual(chances([{ weight: 1 }, { weight: 3 }]), [0.25, 0.75]);
});

test('rolls follow the weights, and fill in dice, choices and other tables', () => {
  const rng = makeRng('t1');
  const rows = parseTable('9x common\nrare');
  const counts = { common: 0, rare: 0 };
  for (let i = 0; i < 2000; i++) counts[rollTable(rows, rng).text]++;
  assert.ok(counts.common > 1650 && counts.rare > 120, JSON.stringify(counts));
  for (let i = 0; i < 50; i++) { const d = rollDice('2d6+1', rng); assert.ok(d >= 3 && d <= 13); }
  assert.equal(rollDice('banana', rng), null);
  const tables = { Colour: parseTable('red\nblue'), Loop: parseTable('again [[Loop]]') };
  const t = expand('{1d4} [[Colour]] {cats|dogs} [[Missing]] {not dice}', rng, (n) => tables[n]);
  assert.match(t, /^[1-4] (red|blue) (cats|dogs) \[\[Missing\]\] \{not dice\}$/);
  assert.equal((expand('[[Loop]]', rng, (n) => tables[n]).match(/again/g) || []).length, 3, 'nesting stops at three deep');
  assert.equal(rollTable([], rng), null);
});
