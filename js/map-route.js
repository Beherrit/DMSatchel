// Measuring on a map: a route of points (x and y as fractions of the map's width and height) on a map whose scale
// is `miles` across its full width. Pure, so it can be tested.

// Miles between two points; `ratio` is the map's height over its width.
export const legMiles = (a, b, miles, ratio = 1) => Math.hypot((a.x - b.x) * miles, (a.y - b.y) * miles * ratio);

// → { total, legs: [miles per leg] }
export function routeMiles(points, miles, ratio = 1) {
  const legs = [];
  for (let i = 1; i < points.length; i++) legs.push(legMiles(points[i - 1], points[i], miles, ratio));
  return { total: legs.reduce((t, x) => t + x, 0), legs };
}

// Short distances in a readable form: "0.4 miles", "12 miles".
export const milesText = (m) => `${m < 10 ? m.toFixed(1).replace(/\.0$/, '') : Math.round(m).toLocaleString('en-US')} mile${m === 1 ? '' : 's'}`;
