// Today for one shop, by the world's calendar: { holiday, weekday, market } for shop-hours.js, where market is true
// on the market day of the settlement the shop is in (its town opens two hours early).
import { world, getEntry } from './world-store.js';
import { tradeDay, isMarketDay, marketToday } from './shop-hours.js';
import { cleanCalendar } from './calendar.js';

export const townOfShop = (shop) => { for (let p = shop?.parent_id && getEntry(shop.parent_id), i = 0; p && i < 12; p = p.parent_id && getEntry(p.parent_id), i++) if (p.kind === 'settlement') return p; return null; };

export function dayFor(shop) {
  const d = tradeDay(cleanCalendar(world.info?.cal));
  return { ...d, market: marketToday(townOfShop(shop), d) };
}
