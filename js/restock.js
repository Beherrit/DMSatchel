// Shops restock with time: a stocked shop remembers the in-world day of its last delivery (fields.restocked, a day
// number on the world's calendar); when days pass, the ones whose delivery is a week or more old are due another.
// A shop with no recorded delivery counts as due. Pure, so it can be tested.

export const RESTOCK_EVERY = 7;

// shops: location entries; today: today's day number. → the shops due a delivery, by name.
export function shopsDue(shops, today, every = RESTOCK_EVERY) {
  return (shops || []).filter((s) => {
    if (!s?.fields?.stock) return false;
    const last = Number(s.fields.restocked);
    return !Number.isFinite(last) || !String(s.fields.restocked ?? '').trim() || today - last >= every;
  }).sort((a, b) => a.name.localeCompare(b.name));
}
