// Light, dark or automatic (follows the device): a header button cycles through them, remembered in this browser.
// index.html applies the saved choice before the page draws, so it never flashes the other theme.
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
