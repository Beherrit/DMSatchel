import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDungeon, dungeonText, dungeonSvg, THEMES } from '../js/dungeon.js';

test('every theme makes a connected, keyed dungeon with a unique map cell per room', () => {
  for (const theme of Object.keys(THEMES)) for (const rooms of [5, 8, 12]) for (const level of [1, 7, 14, 19]) {
    const d = generateDungeon({ theme, rooms, level, seed: `${theme}${rooms}${level}` });
    assert.equal(d.rooms.length, rooms);
    const seen = new Set([0]); let grew = true;
    while (grew) { grew = false; for (const [a, b] of d.links) { if (seen.has(a) && !seen.has(b)) { seen.add(b); grew = true; } if (seen.has(b) && !seen.has(a)) { seen.add(a); grew = true; } } }
    assert.equal(seen.size, rooms, `${theme} ${rooms}: every room reachable`);
    assert.equal(new Set(d.pos.map((p) => p.join(','))).size, rooms, 'no two rooms share a map cell');
    assert.ok(d.rooms.some((r) => r.role === 'boss'));
    assert.ok(dungeonText(d).includes(d.name));
    const m = dungeonSvg(d);
    assert.ok(m.svg.startsWith('<svg') && m.centers.every(([x, y]) => x > 0 && x < 1 && y > 0 && y < 1));
  }
});

test('the same seed makes the same dungeon', () => {
  assert.equal(dungeonText(generateDungeon({ seed: 'same' })), dungeonText(generateDungeon({ seed: 'same' })));
});
