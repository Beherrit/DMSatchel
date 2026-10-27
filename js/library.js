// Your library: creatures, items and rules options you've summarized from your own books, kept as world entries.
// These helpers turn them into the shapes the generators use, so encounters, loot and shops can draw on them.
import { TERRAINS, terrainsFor } from './encounters.js';

const RARITY_CODE = { Common: 'c', Uncommon: 'u', Rare: 'r', 'Very rare': 'v', Legendary: 'l', Artifact: 'a' };

// "1/4", "½", "0.25", "CR 5" → number; null if it isn't a challenge rating.
export function parseCr(v) {
  const s = String(v ?? '').toLowerCase().replace(/^cr\s*/, '').replace('½', '1/2').replace('¼', '1/4').replace('⅛', '1/8').trim();
  if (!s) return null;
  const f = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  const n = f ? Number(f[1]) / Number(f[2]) : Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 30) return null;
  // Snap to the standard steps (1/8, 1/4, 1/2, 1, 2, …).
  return n === 0 ? 0 : n < 0.19 ? 0.125 : n < 0.38 ? 0.25 : n < 0.75 ? 0.5 : Math.round(n);
}

// Creatures from the bestiary, in the encounter builder's shape. No terrain written means they can turn up anywhere.
export function libraryCreatures(entries) {
  return entries.filter((e) => e.kind === 'creature' && parseCr(e.fields?.cr) != null).map((e) => ({
    name: e.name, cr: parseCr(e.fields.cr), type: String(e.fields?.type || 'monstrosity').toLowerCase(),
    terrains: String(e.fields?.terrain || '').trim() ? terrainsFor(e.fields.terrain) : [...TERRAINS],
    entryId: e.id, link: e.fields?.link || null,
  }));
}

// Items with a source book, in the magic item catalog's shape, so loot and shops can roll them.
export function libraryItems(entries) {
  return entries.filter((e) => e.kind === 'item' && String(e.fields?.source || '').trim() && RARITY_CODE[e.fields?.rarity]).map((e) => ({
    name: e.name, rarity: RARITY_CODE[e.fields.rarity], type: e.fields?.type || 'Wondrous item',
    attunement: /^(yes|requires)/i.test(e.fields?.attunement || '') ? e.fields.attunement : '',
    summary: e.summary || String(e.fields?.properties || '').split('\n')[0] || '', cursed: (e.tags || []).includes('cursed'),
    source: e.fields.source, entryId: e.id, library: true,
  }));
}

export const LIBRARY_CATEGORIES = ['Class', 'Subclass', 'Species', 'Background', 'Feat', 'Spell', 'Other'];
export const ruleOptions = (entries, category) => entries.filter((e) => e.kind === 'rule' && (!category || e.fields?.category === category));
