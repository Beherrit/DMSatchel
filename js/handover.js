// Hand it over: move an item (and coin) from one character's sheet to another's. Inventories are free text, one
// item per line, maybe with a count ("3 potions of healing", "Rope x2", "- Lantern"). Pure, so it can be tested.

const LINE = /^\s*(?:[-*•]\s*)?(?:(\d+)\s*[x×]?\s+)?(.*?)(?:\s*[x×]\s*(\d+)|\s*\((\d+)\))?\s*$/i;
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// One inventory line → { qty, name }.
export function readLine(line) {
  const m = String(line).match(LINE);
  const qty = Number(m?.[1] || m?.[3] || m?.[4]) || 1;
  return { qty, name: (m?.[2] || '').replace(/\s*\(from [^)]*\)\s*$/i, '').trim() };
}

// The inventory's items, for a picker: [{ line, index, qty, name }].
export const inventoryLines = (text) => String(text || '').split('\n').map((line, index) => ({ line, index, ...readLine(line) })).filter((x) => x.name);

// Take qty of an item out of an inventory: the line with that name (or the first line containing it).
// → { text, name, qty } or { error }
export function takeItem(text, item, qty = 1) {
  const want = norm(item), lines = String(text || '').split('\n');
  const all = inventoryLines(text);
  const hit = all.find((x) => norm(x.name) === want) || all.find((x) => norm(x.name).includes(want));
  if (!want || !hit) return { error: `“${item}” isn’t in the inventory.` };
  const n = Math.max(1, Math.round(qty));
  if (n > hit.qty) return { error: `There ${hit.qty === 1 ? 'is only 1' : `are only ${hit.qty}`} of ${hit.name}.` };
  if (n === hit.qty) lines.splice(hit.index, 1);
  else lines[hit.index] = `${hit.qty - n} ${hit.name}`;
  return { text: lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, ''), name: hit.name, qty: n };
}

export function giveItem(text, name, qty, from) {
  const line = `${qty > 1 ? `${qty} ` : ''}${name}${from ? ` (from ${from})` : ''}`;
  const t = String(text || '').replace(/\s+$/, '');
  return t ? `${t}\n${line}` : line;
}

// Tidy the pack: merge inventory lines naming the same thing ("Rope" and "2 Rope (from the Smithy)" → "3 Rope"),
// keeping the first one's place and spelling. Lines that aren't items, and kits written on one line with commas, stay.
// → { text, merged } (merged: how many lines were folded in).
export function tidyInventory(text) {
  const lines = String(text || '').split('\n'), keep = [], at = new Map();
  let merged = 0;
  for (const line of lines) {
    const x = readLine(line);
    if (!x.name || x.name.includes(',')) { keep.push({ raw: line }); continue; }
    const k = norm(x.name);
    if (at.has(k)) { keep[at.get(k)].qty += x.qty; merged++; continue; }
    at.set(k, keep.length); keep.push({ name: x.name, qty: x.qty, raw: line });
  }
  if (!merged) return { text: String(text || ''), merged: 0 };
  return { text: keep.map((x) => (x.name ? `${x.qty > 1 ? `${x.qty} ` : ''}${x.name}` : x.raw)).join('\n'), merged };
}
