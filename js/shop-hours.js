// Shops keep hours: by the world's clock (minutes after midnight), shops trade from 8 in the morning to 8 at night,
// and taverns until 2 in the morning. Pure, so the page and the server share it.

const HOURS = { shop: [8 * 60, 20 * 60], tavern: [8 * 60, 26 * 60] }; // a close past 24:00 runs into the next day

const kindOf = (shop) => (shop?.fields?.type === 'Tavern' || /tavern|inn/i.test(shop?.fields?.shop_type || '') ? 'tavern' : 'shop');

// holiday: the name of today's holiday, if any: shops shut for it all day (taverns stay open: it's a festival).
// → { open, opens (text, when shut), holiday? }
export function shopOpen(shop, minutes, holiday = '') {
  if (holiday && kindOf(shop) === 'shop') return { open: false, opens: 'tomorrow', holiday };
  const [from, to] = HOURS[kindOf(shop)];
  const m = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  const open = (m >= from && m < Math.min(to, 1440)) || (to > 1440 && m < to - 1440);
  return { open, opens: open ? '' : 'at 8 in the morning' };
}

// Today's holiday on a calendar (from calendar.js's cleaned calendar), for shopOpen: its name, or ''.
export function holidayToday(cal) {
  if (!cal || !Array.isArray(cal.holidays)) return '';
  return cal.holidays.find((h) => h.month === cal.month && h.day === cal.day)?.name || '';
}

// What a shut shop says: "shut for Bridge Day" or "shut for the night".
export const shutText = (o) => (o.holiday ? `shut for ${o.holiday}` : 'shut for the night');

// Closing time: how long until a shop shuts (when open) or opens (when shut), in minutes of the world's clock.
// → { open, mins } (mins null when it's shut for a holiday: it opens tomorrow).
export function untilChange(shop, minutes, holiday = '') {
  const o = shopOpen(shop, minutes, holiday);
  if (o.holiday) return { open: false, mins: null };
  const [from, to] = HOURS[kindOf(shop)];
  const m = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  if (o.open) return { open: true, mins: to > 1440 && m < to - 1440 ? to - 1440 - m : to - m };
  return { open: false, mins: m < from ? from - m : 1440 - m + from };
}
