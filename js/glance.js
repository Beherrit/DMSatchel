// Places at a glance: the few facts a GM reaches for when the party walks into a settlement (who leads it, who holds
// it, how big it is, how many people, shops and open jobs are there), as a short list of tiles. Pure, so it can be
// tested. inside: every entry inside the place; holder: { by, inherited } from control.js, or nothing;
// named(name) → the entry with that name, or nothing.

const OPEN = ['Available', 'Active', 'Rumor'];
const isShop = (e) => e.kind === 'location' && (e.fields?.type === 'Shop' || e.fields?.type === 'Tavern' || Boolean(e.fields?.shop_type));

export function glanceOf(place, inside, { holder, named } = {}) {
  const f = place?.fields || {};
  const ruler = String(f.ruler || '').trim();
  const leader = ruler ? { label: 'Led by', text: ruler, entry: named?.(ruler) || null } : null;
  const held = holder?.by && holder.by.id !== leader?.entry?.id
    ? { label: 'Held by', text: holder.by.name, entry: holder.by, note: holder.inherited ? 'through the land around it' : '' } : null;
  const size = [f.size, f.population].map((x) => String(x || '').trim()).filter(Boolean).join(', ');
  const list = inside || [];
  const people = list.filter((e) => e.kind === 'npc' && e.fields?.status !== 'Dead').length;
  const shops = list.filter(isShop).length;
  const jobs = list.filter((e) => e.kind === 'quest' && OPEN.includes(e.fields?.status || 'Available')).length;
  return {
    facts: [leader, held, size ? { label: 'Size', text: size } : null].filter(Boolean),
    counts: [{ key: 'people', label: people === 1 ? 'person' : 'people', n: people }, { key: 'market', label: shops === 1 ? 'shop' : 'shops', n: shops }, { key: 'quests', label: jobs === 1 ? 'open job' : 'open jobs', n: jobs }],
  };
}
