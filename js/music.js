// Mood music: a music or ambience link on any entry (kept as fields.music), played from its page and offered in
// session prep for where the party is. Pure, so it can be tested.

const HOSTS = [[/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, 'YouTube'], [/(^|\.)spotify\.com$/, 'Spotify'], [/(^|\.)tabletopaudio\.com$/, 'Tabletop Audio'],
  [/(^|\.)soundcloud\.com$/, 'SoundCloud'], [/(^|\.)bandcamp\.com$/, 'Bandcamp'], [/(^|\.)music\.apple\.com$/, 'Apple Music'], [/(^|\.)deezer\.com$/, 'Deezer']];

// Only https links; '' for anything else.
export function cleanMusic(v) {
  const s = String(v ?? '').trim();
  if (!s || s.length > 500 || /\s/.test(s)) return '';
  try { const u = new URL(s); return u.protocol === 'https:' && u.hostname.includes('.') ? u.href : ''; } catch { return ''; }
}

// Where it plays: "YouTube", "Spotify"… or the site's own name.
export function musicSite(url) {
  try { const h = new URL(url).hostname.replace(/^www\./, ''); return HOSTS.find(([re]) => re.test(h))?.[1] || h; } catch { return ''; }
}

// The music for a place: its own, else the nearest place around it that has some. chain: [entry, parent, …].
export function musicFor(chain) {
  for (const e of chain || []) { const m = cleanMusic(e?.fields?.music); if (m) return { url: m, from: e }; }
  return null;
}
