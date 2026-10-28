// Party bonds: how player characters are tied to each other, stored as ordinary connections between character
// entries using these labels (so the relationship web and entry pages show them too). Pure, so it can be tested.
export const BOND_LABELS = ['sibling of', 'childhood friend of', 'rival of', 'owes a debt to', 'saved the life of', 'sworn to protect', 'in love with', 'mentor of', 'keeps a secret from', 'distrusts', 'old comrade of'];

// [{ from, to, label }] between characters that both exist, oldest connections first.
export function partyBonds(entries) {
  const chars = new Map(entries.filter((e) => e.kind === 'character').map((e) => [e.id, e]));
  const out = [];
  for (const c of chars.values()) for (const l of c.links || []) if (BOND_LABELS.includes(l.label) && chars.has(l.id) && l.id !== c.id) out.push({ from: c, to: chars.get(l.id), label: l.label });
  return out;
}

// One character's links with a bond added (or replaced, for the same other character and label) or removed.
export function withBond(character, otherId, label) {
  const links = (character.links || []).filter((l) => !(l.id === otherId && BOND_LABELS.includes(l.label) && (!label || l.label === label)));
  return label ? [...links, { id: otherId, label, secret: false }] : links;
}
