import test from 'node:test';
import assert from 'node:assert/strict';
import { recentEdits } from '../js/recent-edits.js';

test('the latest changes, runs of saves folded', () => {
  const rows = [
    { entry_id: 'a', action: 'edit', at: '5', gm: 'Ann', entry_name: 'Brindle', kind: 'settlement' },
    { entry_id: 'a', action: 'edit', at: '4', gm: 'Ann', entry_name: 'Brindle', kind: 'settlement' },
    { entry_id: 'a', action: 'edit', at: '3', gm: 'Bo', entry_name: 'Brindle', kind: 'settlement' },
    { entry_id: 'b', action: 'reveal', at: '2', gm: null, entry_name: 'Vex', kind: 'npc' },
    { entry_id: 'a', action: 'create', at: '1', gm: 'Ann', entry_name: 'Brindle', kind: 'settlement' },
  ];
  assert.deepEqual(recentEdits(rows).map((r) => `${r.gm} ${r.verb} ${r.name}×${r.times}`), ['Ann edited Brindle×2', 'Bo edited Brindle×1', 'Someone revealed Vex×1', 'Ann created Brindle×1']);
  assert.equal(recentEdits(rows, 2).length, 2);
  // A run that continues past the cut still counts in full.
  assert.equal(recentEdits(rows.slice(0, 2), 1)[0].times, 2);
  assert.deepEqual(recentEdits(null), []);
});
