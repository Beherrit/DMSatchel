import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, guessMapping, rowsToDrafts } from '../js/csv.js';
import { KINDS } from '../js/world-schema.js';

test('quotes, doubled quotes, line breaks inside cells, and other separators', () => {
  assert.deepEqual(parseCSV('﻿Name,Notes\r\n"Ann","Says ""hi"", often"\n"Bo","Line one\nLine two"\n\n'),
    [['Name', 'Notes'], ['Ann', 'Says "hi", often'], ['Bo', 'Line one\nLine two']]);
  assert.deepEqual(parseCSV('Name;Role\nAnn;Smith'), [['Name', 'Role'], ['Ann', 'Smith']]);
  assert.deepEqual(parseCSV('Name\tRole\nAnn\tSmith'), [['Name', 'Role'], ['Ann', 'Smith']]);
});

test('guesses columns from field labels and common names', () => {
  const role = KINDS.npc.fields.find(([k]) => k === 'role');
  const m = guessMapping(['Name', role[1], 'Located in', 'Tags', 'GM notes', 'Description', 'Shoe size', 'Title'], KINDS.npc.fields);
  assert.deepEqual(m, ['name', `f:${role[0]}`, 'parent', 'tags', 'secret', 'body', '', '']);
});

test('rows become drafts; nameless rows are dropped; a kind column wins', () => {
  const d = rowsToDrafts([['Ann', 'Smith', 'Brindle', '#key, smith', ''], ['', 'x', '', '', ''], ['Brindle', '', '', '', 'town']], ['name', 'f:role', 'parent', 'tags', 'kind'], 'npc');
  assert.equal(d.length, 2);
  assert.deepEqual([d[0].name, d[0].kind, d[0].fields, d[0].parentName, d[0].tags, d[0].source], ['Ann', 'npc', { role: 'Smith' }, 'Brindle', ['key', 'smith'], 'spreadsheet, row 2']);
  assert.equal(d[1].kind, 'settlement');
});

test('export: quoting, formula guard, and a round trip through the importer', async () => {
  const { toCSV, entriesCSV, parseCSV, guessMapping, rowsToDrafts } = await import('../js/csv.js');
  assert.equal(toCSV([['a', 'b,c', 'say "hi"', 'two\nlines', '=1+1', '-5', '- a list']]), 'a,"b,c","say ""hi""","two\nlines",\'=1+1,\'-5,- a list');
  const fields = [['role', 'Role or job'], ['status', 'Status', 'select'], ['play', 'Play', 'hidden']];
  const csv = entriesCSV([{ name: 'Bram, the Bold', summary: 'Runs the inn.', parent_id: 't', tags: ['key', 'north'], fields: { role: 'Innkeeper', status: 'Alive', play: '{}' }, body: 'Line one\nLine two', secret: 'Spy' }],
    'NPC', fields, (id) => (id === 't' ? 'Brindle' : ''), { gm: true });
  assert.ok(csv.startsWith('﻿Name,Kind,Summary,Located in,Tags,Role or job,Status,Description,Secret'));
  const rows = parseCSV(csv.replace(/^﻿/, ''));
  const mapping = guessMapping(rows[0], fields);
  const [d] = rowsToDrafts(rows.slice(1), mapping, 'npc');
  assert.deepEqual([d.name, d.summary, d.parentName, d.tags, d.fields.role, d.fields.status, d.body, d.secret], ['Bram, the Bold', 'Runs the inn.', 'Brindle', ['key', 'north'], 'Innkeeper', 'Alive', 'Line one\nLine two', 'Spy']);
  assert.ok(!entriesCSV([], 'NPC', fields, () => '').includes('Secret'));
});
