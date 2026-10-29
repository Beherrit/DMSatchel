// "Say it right": how to pronounce an entry's name, kept as fields.say on any kind of entry. Pure, so it can be tested.

export const SAY_MAX = 80;

// One line, trimmed, at most SAY_MAX characters; '' when there's nothing worth keeping.
export function cleanSay(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, SAY_MAX).trim();
}

export const sayOf = (e) => cleanSay(e?.fields?.say);

// The world's pronunciation guide: entries with a "say it", alphabetical, grouped by first letter.
// → [{ letter, entries }]; names that don't start with a letter go under '#'.
export function sayGuide(entries) {
  const list = (entries || []).filter((e) => sayOf(e)).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  const groups = [];
  for (const e of list) {
    const first = e.name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim()[0]?.toUpperCase() || '#';
    const letter = /[A-Z]/.test(first) ? first : '#';
    if (groups.at(-1)?.letter !== letter) groups.push({ letter, entries: [] });
    groups.at(-1).entries.push(e);
  }
  return groups;
}
