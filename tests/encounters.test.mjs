import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CREATURES, rollEncounter, encounterTable, budget, xpFor, terrainsFor, rollWeather, seasonOf, travel, TERRAINS } from '../js/encounters.js';

test('every creature has a known CR and terrain', () => {
  const names = new Set();
  for (const c of CREATURES) {
    assert.ok(xpFor(c.cr) > 0, c.name);
    assert.ok(c.terrains.length && c.terrains.every((t) => TERRAINS.includes(t)), c.name);
    assert.ok(!names.has(c.name), `duplicate ${c.name}`); names.add(c.name);
  }
  for (const t of TERRAINS) assert.ok(CREATURES.filter((c) => c.terrains.includes(t)).length >= 8, t);
});

test('encounters never exceed the budget', () => {
  for (const level of [1, 3, 5, 10, 17]) for (const terrain of ['forest', 'underdark', 'arctic', 'urban', 'underwater']) for (const difficulty of ['Low', 'Moderate', 'High']) {
    for (let i = 0; i < 10; i++) {
      const e = rollEncounter({ terrain: [terrain], level, size: 4, difficulty, seed: `${level}${terrain}${difficulty}${i}` });
      assert.ok(e, `${level} ${terrain} ${difficulty}`);
      assert.ok(e.xp <= budget(level, 4, difficulty));
      assert.equal(e.xp, e.groups.reduce((t, g) => t + g.count * xpFor(g.cr), 0));
    }
  }
});

test('seeded results repeat; tables have the right size', () => {
  assert.deepEqual(rollEncounter({ seed: 'x' }), rollEncounter({ seed: 'x' }));
  assert.equal(encounterTable({ terrain: ['swamp'], dice: 8 }).length, 8);
});

test('terrain, weather, seasons and travel', () => {
  assert.deepEqual(terrainsFor('Snowy mountain pass'), ['arctic', 'mountain']);
  assert.ok(terrainsFor('City district').includes('urban'));
  assert.equal(seasonOf(0, 12), 'Winter'); assert.equal(seasonOf(6, 12), 'Summer');
  const w = rollWeather({ terrain: ['arctic'], season: 'Winter', seed: 'w' });
  assert.ok(w.temp < 0 && w.rules.some((r) => r.startsWith('Extreme cold')));
  assert.equal(travel(24).Normal.days, 1);
  assert.equal(travel(24, { difficult: true }).Normal.days, 2);
});
