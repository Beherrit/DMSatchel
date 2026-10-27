import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFile, parseDocument, frontMatter, kindFromWords, checkDrafts } from '../js/md-import.js';

test('kind hints from folders and front matter', () => {
  assert.equal(kindFromWords('NPCs'), 'npc'); assert.equal(kindFromWords('02 Towns'), 'settlement');
  assert.equal(kindFromWords('Bestiary'), 'creature'); assert.equal(kindFromWords('random stuff'), null);
});

test('front matter with lists', () => {
  const { meta, rest } = frontMatter('---\ntype: npc\ntags: [villain, cult]\naliases:\n  - The Hag\n---\nBody');
  assert.equal(meta.type, 'npc'); assert.deepEqual(meta.tags, ['villain', 'cult']); assert.deepEqual(meta.aliases, ['The Hag']); assert.equal(rest, 'Body');
});

test('an Obsidian note becomes an entry with fields, tags, parent and tidied links', () => {
  const [d] = parseFile('Vault/NPCs/Mabel.md', '---\ntags: [innkeeper]\nlocation: "[[Brindle]]"\n---\nRuns the Drowned Bell inn. #key\n\nRole:: Innkeeper\n**Personality:** Warm, nosy.\n\nShe owes [[Old Bram#debts|Bram]] money. ![[portrait.png]]');
  assert.equal(d.name, 'Mabel'); assert.equal(d.kind, 'npc'); assert.equal(d.parentName, 'Brindle');
  assert.equal(d.fields.role, 'Innkeeper'); assert.equal(d.fields.personality, 'Warm, nosy.');
  assert.deepEqual(d.tags.sort(), ['innkeeper', 'key']);
  assert.equal(d.summary, 'Runs the Drowned Bell inn. #key');
  assert.ok(d.body.includes('[[Old Bram|Bram]]') && !d.body.includes('portrait'));
});

test("this app's own export round-trips", () => {
  const md = `# The Marches\n\nGM copy\n\n## Settlements\n\n### Brindle\n\n*Settlement · Town · in The Marches*\n\nA muddy river town.\n\n**Size:** Town  \n\nHome of Mabel.\n\n> **GM:** The mayor is a doppelganger.\n\nConnections: trades with [Fenmoor](#fenmoor); spies for [Red Hand](#red-hand) (GM only)\n\nTags: #river #trade\n\n## NPCs\n\n### Mabel\n\n*NPC · in Brindle*\n\n**Role or job:** Innkeeper  \n`;
  const ds = parseDocument(md);
  assert.deepEqual(ds.map((d) => [d.name, d.kind, d.parentName]), [['Brindle', 'settlement', 'The Marches'], ['Mabel', 'npc', 'Brindle']]);
  const b = ds[0];
  assert.equal(b.summary, 'A muddy river town.'); assert.equal(b.fields.size, 'Town'); assert.equal(b.secret, 'The mayor is a doppelganger.');
  assert.deepEqual(b.tags, ['river', 'trade']);
  assert.deepEqual(b.linkNames.map((l) => [l.label, l.name, l.secret]), [['trades with', 'Fenmoor', false], ['spies for', 'Red Hand', true]]);
  assert.equal(ds[1].fields.role, 'Innkeeper');
});

test('plain "## Name" documents and duplicate checks', () => {
  const ds = parseDocument('## Bog Hag\nLives in the fen.\n\n## Bog Hag\nAgain.\n\n## Lantern\nGlows.');
  assert.equal(ds.length, 3);
  const c = checkDrafts(ds, [{ kind: 'lore', name: 'lantern' }, { kind: 'npc', name: 'Bog Hag' }]);
  assert.deepEqual(c.map((d) => d.status), ['name', 'duplicate', 'exists']);
  assert.equal(c[0].otherKind, 'npc');
});
