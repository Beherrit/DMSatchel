import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffVersions, restoreFrom, brief } from '../js/versions.js';

const v1 = { kind: 'npc', name: 'Mabel', summary: 'Innkeeper', body: 'Kind.', secret: '', tags: ['inn'], links: [], parent_id: 'town', fields: { role: 'Innkeeper' } };
const v2 = { ...v1, summary: 'Innkeeper and spy', tags: ['inn', 'spy'], fields: { role: 'Spy', status: 'Alive' } };

test('what changed between two versions', () => {
  const d = diffVersions(v1, v2);
  assert.deepEqual(d.map((x) => x.key), ['summary', 'tags', 'fields.role', 'fields.status']);
  assert.equal(d.find((x) => x.key === 'fields.role').label, 'Role or job');
  assert.equal(diffVersions(null, v1).length > 3, true, 'first version: everything is new');
  assert.deepEqual(diffVersions(v1, { ...v1, fields: { ...v1.fields, play: '{"hp":3}' } }), [], 'live state is not a change');
  assert.equal(brief(['a', 'b']), 'a, b'); assert.equal(brief(''), '(empty)');
});

test('restoring keeps live state, visibility and version', () => {
  const current = { id: 'x', version: 7, visibility: 'gm', ...v2, kind: 'character', fields: { class: 'Rogue', play: '{"hp":9}', known: '["a"]' } };
  const snap = { ...v1, kind: 'character', fields: { class: 'Fighter', play: '{"hp":1}' } };
  const r = restoreFrom(current, snap);
  assert.equal(r.summary, 'Innkeeper'); assert.equal(r.fields.class, 'Fighter');
  assert.equal(r.fields.play, '{"hp":9}', 'play state stays current'); assert.equal(r.fields.known, '["a"]');
  assert.equal(r.version, 7); assert.equal(r.visibility, 'gm'); assert.equal(r.id, 'x');
});
