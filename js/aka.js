// Also known as: other names an entry goes by (a title, an old name, what the locals call it), kept in fields.aka as
// one string, names separated by semicolons or new lines. Search, mentions and the name check use them. Pure, so it
// can be tested.

export const MAX_AKA = 6;

// Raw text → the cleaned string to store ('' for none): trimmed, unique (ignoring case), at most MAX_AKA names of up
// to 80 characters, and never the entry's own name.
export function cleanAka(raw, ownName = '') {
  const own = String(ownName).trim().toLowerCase();
  const out = [];
  for (const part of String(raw || '').split(/[;\n|]+/)) {
    const n = part.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (n && n.toLowerCase() !== own && !out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
  }
  return out.slice(0, MAX_AKA).join('; ');
}

// An entry's other names, as a list.
export function akaOf(e) {
  return e?.fields?.aka ? String(e.fields.aka).split(/;\s*/).map((x) => x.trim()).filter(Boolean) : [];
}
