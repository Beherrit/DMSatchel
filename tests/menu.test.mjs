import test from 'node:test';
import assert from 'node:assert/strict';
import { rollMenu, readMenu, menuText } from '../js/menu.js';
import { makeRng } from '../js/rng.js';
import { coinText } from '../js/economy.js';

test('a village alehouse is cheap, a city inn is not', () => {
  const avg = (size) => { let t = 0; for (let s = 0; s < 40; s++) { const m = rollMenu(makeRng(`${size}${s}`), { size }); t += m.sections[2].items[1].cp; } return t / 40; };
  assert.ok(avg('Village') < avg('Town') && avg('Town') < avg('City') && avg('City') < avg('Metropolis'));
  for (let s = 0; s < 40; s++) {
    const m = rollMenu(makeRng(`v${s}`), { size: 'Village', town: 'Brindle' });
    assert.ok(['poor', 'modest'].includes(m.quality));
    assert.deepEqual(m.sections.map((x) => x.title), ['To drink', 'To eat', 'For the night']);
    assert.equal(m.sections[1].items.length, 3); assert.ok(m.special.name);
    assert.ok(m.sections[0].items[0].name.startsWith('Brindle '));
    assert.ok(!m.sections[1].items.some((x) => x.name === m.special.name), 'the special isn’t also on the list');
  }
});

test('stored menus are read back safely', () => {
  const m = rollMenu(makeRng('a'), { size: 'City' });
  assert.deepEqual(readMenu(JSON.stringify(m)), m);
  assert.equal(readMenu('nonsense'), null);
  assert.equal(readMenu(JSON.stringify({ quality: 'royal', sections: [] })), null);
  assert.equal(readMenu({ quality: 'poor', sections: [{ title: 'X', items: [{ name: 'Gruel', cp: -5 }] }] }).sections[0].items[0].cp, 0);
  const t = menuText(m, coinText);
  assert.ok(t.startsWith('Today: ') && t.includes('To drink') && /\d (gp|sp|cp)/.test(t));
});

test('prices are chalked up tidily', () => {
  for (let s = 0; s < 40; s++) for (const size of ['Village', 'City']) {
    for (const x of rollMenu(makeRng(`t${s}`), { size }).sections[1].items) assert.ok(x.cp < 10 || (x.cp < 20 ? x.cp % 5 === 0 : x.cp % 10 === 0), `${x.cp}`);
  }
});
