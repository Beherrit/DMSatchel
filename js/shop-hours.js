// Shops keep hours: by the world's clock (minutes after midnight), shops trade from 8 in the morning to 8 at night,
// and taverns until 2 in the morning. Pure, so the page and the server share it.

const HOURS = { shop: [8 * 60, 20 * 60], tavern: [8 * 60, 26 * 60] }; // a close past 24:00 runs into the next day

const kindOf = (shop) => (shop?.fields?.type === 'Tavern' || /tavern|inn/i.test(shop?.fields?.shop_type || '') ? 'tavern' : 'shop');

// → { open, opens (text, when shut) }
export function shopOpen(shop, minutes) {
  const [from, to] = HOURS[kindOf(shop)];
  const m = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  const open = (m >= from && m < Math.min(to, 1440)) || (to > 1440 && m < to - 1440);
  return { open, opens: open ? '' : 'at 8 in the morning' };
}
