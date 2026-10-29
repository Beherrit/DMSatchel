// Light, dark or automatic (follows the device), and the text size: header buttons cycle through them, remembered in
// this browser. index.html applies the saved choices before the page draws, so nothing flashes or jumps.
import { $ } from './dom.js';

const KEY = 'satchel-theme';
const MODES = [['auto', '◐', 'Automatic (follows your device)'], ['light', '☀', 'Light'], ['dark', '☾', 'Dark']];

const saved = () => { try { const t = localStorage.getItem(KEY); return t === 'light' || t === 'dark' ? t : 'auto'; } catch { return 'auto'; } };

function apply(mode) {
  if (mode === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = mode;
  try { if (mode === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch { /* private window */ }
  const [, icon, label] = MODES.find(([m]) => m === mode);
  const b = $('#theme-btn');
  if (b) { b.textContent = icon; b.title = `Theme: ${label}. Click to change.`; b.setAttribute('aria-label', `Theme: ${label}. Change theme`); }
  // The browser bar follows the page.
  const dark = mode === 'dark' || (mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#131923' : '#1D2332');
}

export function initTheme() {
  const b = $('#theme-btn');
  if (!b) return;
  apply(saved());
  b.addEventListener('click', () => { const i = MODES.findIndex(([m]) => m === saved()); apply(MODES[(i + 1) % MODES.length][0]); });
}

// Text size: every font size in the stylesheet is multiplied by --ts.
const TEXT_KEY = 'satchel-text';
export const TEXT_SIZES = [[1, 'Normal'], [1.15, 'Larger'], [1.3, 'Largest'], [0.9, 'Smaller']];
const savedText = () => { try { const z = Number(localStorage.getItem(TEXT_KEY)); return TEXT_SIZES.some(([s]) => s === z) ? z : 1; } catch { return 1; } };

function applyText(z) {
  if (z === 1) document.documentElement.style.removeProperty('--ts'); else document.documentElement.style.setProperty('--ts', String(z));
  try { if (z === 1) localStorage.removeItem(TEXT_KEY); else localStorage.setItem(TEXT_KEY, String(z)); } catch { /* private window */ }
  const label = TEXT_SIZES.find(([s]) => s === z)[1];
  const b = $('#text-btn');
  if (b) { b.textContent = { Normal: 'A', Larger: 'A+', Largest: 'A++', Smaller: 'A−' }[label]; b.title = `Text size: ${label}. Click to change.`; b.setAttribute('aria-label', `Text size: ${label}. Change text size`); b.dataset.size = label.toLowerCase(); }
}

export function initTextSize() {
  const b = $('#text-btn');
  if (!b) return;
  applyText(savedText());
  b.addEventListener('click', () => { const i = TEXT_SIZES.findIndex(([s]) => s === savedText()); applyText(TEXT_SIZES[(i + 1) % TEXT_SIZES.length][0]); });
}
