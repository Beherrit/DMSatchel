// Fog of war for maps: a coarse grid over the map, one bit per cell (1 = hidden), stored as base64.
// Pure helpers shared by the map page and the server (which hides pins under the fog from players).

export const MAX_CELLS = 96;

// Grid size for a map: about 64 cells along the long side, at least 8 along the short one.
export function fogGrid(width, height) {
  const w = Math.max(1, Number(width) || 1), h = Math.max(1, Number(height) || 1);
  const long = 64;
  return w >= h ? { cols: long, rows: Math.min(MAX_CELLS, Math.max(8, Math.round(long * h / w))) }
    : { rows: long, cols: Math.min(MAX_CELLS, Math.max(8, Math.round(long * w / h))) };
}

export const newFog = (cols, rows, hidden = true) => new Uint8Array(cols * rows).fill(hidden ? 1 : 0);

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// Bits → base64 of the packed bytes (works the same in the browser and in Node).
export function encodeFog(cells) {
  const bytes = new Uint8Array(Math.ceil(cells.length / 8));
  cells.forEach((v, i) => { if (v) bytes[i >> 3] |= 1 << (i & 7); });
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? B64[n & 63] : '=');
  }
  return out;
}
export function decodeFog(str, count) {
  const s = String(str || '').replace(/=+$/, '');
  const bytes = [];
  for (let i = 0; i < s.length; i += 4) {
    const n = [0, 1, 2, 3].reduce((t, j) => (t << 6) | Math.max(0, B64.indexOf(s[i + j] || 'A')), 0);
    bytes.push((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
  const cells = new Uint8Array(count);
  for (let i = 0; i < count; i++) cells[i] = (bytes[i >> 3] >> (i & 7)) & 1;
  return cells;
}

// A clean fog record, or null when it's malformed: { on, cols, rows, bits }.
export function cleanFog(f) {
  if (!f || typeof f !== 'object') return null;
  const cols = Math.round(Number(f.cols)), rows = Math.round(Number(f.rows));
  if (!(cols >= 1 && cols <= MAX_CELLS && rows >= 1 && rows <= MAX_CELLS)) return null;
  const bits = String(f.bits || '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(bits) || bits.length !== Math.ceil(Math.ceil(cols * rows / 8) / 3) * 4) return null;
  return { on: Boolean(f.on), cols, rows, bits };
}

// Paint a round brush of `radius` cells centred at (x, y) in 0..1 map coordinates. Returns how many cells changed.
export function paintFog(cells, cols, rows, x, y, radius, value) {
  const cx = x * cols, cy = y * rows; let changed = 0;
  for (let r = Math.max(0, Math.floor(cy - radius)); r <= Math.min(rows - 1, Math.ceil(cy + radius)); r++) {
    for (let c = Math.max(0, Math.floor(cx - radius)); c <= Math.min(cols - 1, Math.ceil(cx + radius)); c++) {
      if (Math.hypot(c + 0.5 - cx, r + 0.5 - cy) <= radius && cells[r * cols + c] !== value) { cells[r * cols + c] = value; changed++; }
    }
  }
  return changed;
}

// Is the point (x, y) in 0..1 map coordinates under the fog?
export function fogHides(fog, cells, x, y) {
  if (!fog?.on) return false;
  const c = Math.min(fog.cols - 1, Math.max(0, Math.floor(x * fog.cols))), r = Math.min(fog.rows - 1, Math.max(0, Math.floor(y * fog.rows)));
  return cells[r * fog.cols + c] === 1;
}

// Share of the map still hidden, 0..1.
export const hiddenShare = (cells) => (cells.length ? cells.reduce((t, v) => t + v, 0) / cells.length : 0);
