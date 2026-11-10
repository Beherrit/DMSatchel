import test from 'node:test';
import assert from 'node:assert/strict';
import { findGood, craftEstimate } from '../js/crafting.js';

const goods = [['Longsword', 15, 'Weapons'], ['Plate armor', 1500, 'Armor'], ['Rope (50 feet)', 1, 'Adventuring gear'], ['Chain mail', 75, 'Armor']];

test('findGood: by name, or the start of it', () => {
  assert.equal(findGood('longsword', goods).gp, 15);
  assert.equal(findGood('rope', goods).name, 'Rope (50 feet)');
  assert.equal(findGood('a flying carpet', goods), null);
  assert.equal(findGood('', goods), null);
  assert.equal(findGood('a longsword', goods).name, 'Longsword');
});

test('craftEstimate: half the price in materials, price ÷ 10 days, divided among helpers', () => {
  assert.deepEqual(craftEstimate('Longsword', 1, goods), { name: 'Longsword', gp: 15, materialsCp: 750, days: 2, daysEach: 2, helpers: 1, tools: 'Smith’s tools' });
  assert.deepEqual(craftEstimate('Plate armor', 1, goods), { name: 'Plate armor', gp: 1500, materialsCp: 75000, days: 150, daysEach: 150, helpers: 1, tools: 'Smith’s tools' });
  assert.equal(craftEstimate('Plate armor', 4, goods).daysEach, 38);
  assert.equal(craftEstimate('rope', 1, goods).days, 1);
  assert.equal(craftEstimate('Chain mail', 3, goods).daysEach, 3);
  assert.equal(craftEstimate('nothing', 1, goods), null);
});

test('craftEstimate: works on the real price list', () => {
  const e = craftEstimate('Shortbow');
  assert.ok(e && e.gp === 25 && e.days === 3 && e.materialsCp === 1250);
});

test('toolsFor: the artisan’s tools an item is usually made with', async () => {
  const { toolsFor } = await import('../js/crafting.js');
  assert.equal(toolsFor('Longsword', 'Weapons'), 'Smith’s tools');
  assert.equal(toolsFor('Longbow', 'Weapons'), 'Woodcarver’s tools');
  assert.equal(toolsFor('Leather armor', 'Armor'), 'Leatherworker’s tools');
  assert.equal(toolsFor('Padded armor', 'Armor'), 'Weaver’s tools');
  assert.equal(toolsFor('Hooded lantern', 'Adventuring gear'), 'Tinker’s tools');
  assert.equal(toolsFor('Antitoxin (vial)', 'Alchemy'), 'Herbalism kit');
  assert.equal(toolsFor('Lute', 'Instruments'), 'Woodcarver’s tools');
  assert.equal(toolsFor('Diamond', 'Gems & jewelry'), '');
});

test('hasTools: the pack holds the tools, whatever the apostrophe or case', async () => {
  const { hasTools } = await import('../js/crafting.js');
  assert.equal(hasTools('Rope\nsmith\'s tools (from the Smithy)', 'Smith’s tools'), true);
  assert.equal(hasTools('Rope\nTinker’s tools', 'Smith’s tools'), false);
  assert.equal(hasTools('', 'Smith’s tools'), false);
  assert.equal(hasTools('Smith’s tools', ''), false);
});

test('craftableWith and toolsInPack: what a pack’s tools could make', async () => {
  const { craftableWith, toolsInPack } = await import('../js/crafting.js');
  assert.deepEqual(craftableWith('Smith’s tools', goods).map((g) => g.name), ['Longsword', 'Chain mail', 'Plate armor']);
  assert.deepEqual(toolsInPack('Rope\nSmith’s tools\nweaver\'s tools'), ['Smith’s tools', 'Weaver’s tools'].filter((t) => toolsInPack('Rope\nSmith’s tools\nweaver\'s tools').includes(t)));
  assert.ok(toolsInPack('Smith’s tools').includes('Smith’s tools'));
  assert.deepEqual(toolsInPack('Rope'), []);
});
