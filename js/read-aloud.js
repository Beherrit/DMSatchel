// Read-aloud in prep: the "> " boxes from the entries planned for the next session, in order, ready to read.
// Pure, so it can be tested.
import { blocks } from './rich.js';

// The read-aloud boxes in one text: each box's lines, without the "> " marks (formatting kept for the page).
export function boxesIn(text) {
  const out = [];
  for (const para of String(text ?? '').replace(/\r/g, '').split(/\n{2,}/)) {
    const lines = para.split('\n').filter((l) => l.trim());
    if (lines.length && lines.every((l) => /^\s*>/.test(l))) out.push(lines.map((l) => l.replace(/^\s*>\s?/, '')).join('\n'));
  }
  return out;
}

// One entry's boxes: description first, then its long fields (longKeys, in order), then the GM secret.
// → [{ from: 'body' | fieldKey | 'secret', text }]
export function entryBoxes(e, longKeys = []) {
  const from = [['body', e?.body], ...longKeys.map((k) => [k, e?.fields?.[k]]), ['secret', e?.secret]];
  return from.flatMap(([k, t]) => boxesIn(t).map((text) => ({ from: k, text })));
}

// The [[names]] a text mentions, in order, once each (case doesn't matter).
export function mentionsIn(text) {
  const seen = new Set(), out = [];
  for (const b of blocks(text)) {
    const parts = b.lines || b.items || [b.v];
    for (const line of parts) for (const n of line || []) if (n.t === 'link' && !seen.has(n.name.toLowerCase())) { seen.add(n.name.toLowerCase()); out.push(n.name); }
  }
  return out;
}

// Lists of entries (the GMs' plan, where the party is and what's inside, quests in play) → one list, first place
// each entry turns up, leaving out ones with no read-aloud box. → [{ entry, boxes }]
export function readAloudPlan(lists, longKeysOf = () => []) {
  const seen = new Set(), out = [];
  for (const list of lists) for (const e of list || []) {
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    const boxes = entryBoxes(e, longKeysOf(e));
    if (boxes.length) out.push({ entry: e, boxes });
  }
  return out;
}

