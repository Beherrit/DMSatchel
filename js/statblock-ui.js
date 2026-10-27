// Renders the plain-text stat block and spellcasting saved on NPCs (and the Forge's spellbook) as a proper block,
// with spell slot pips a GM can tick off during play. Pip state is kept per viewer in this browser.
import { el } from './dom.js';

const ABIL_RE = /^STR \d+ .*CHA \d+/;
const STORE = 'dm-satchel-slots';
const loadUsed = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } };
const saveUsed = (v) => { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* fine */ } };

export function renderStats(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const box = el('div', { class: 'statblock' });
  for (const line of lines) {
    if (ABIL_RE.test(line)) {
      box.append(el('div', { class: 'sb-abilities' }, line.split(' · ').map((p) => {
        const m = p.match(/^(\w+) (\d+) \(([^)]+)\)/);
        return m ? el('div', { class: 'sb-ab' }, el('span', { class: 'sb-ab-n' }, m[1]), el('span', { class: 'sb-ab-v' }, m[2]), el('span', { class: 'sb-ab-m' }, m[3])) : el('span', {}, p);
      })));
    } else if (/^AC \d/.test(line)) {
      box.append(el('div', { class: 'sb-top' }, line.split(' · ').map((p) => {
        const m = p.match(/^(AC|HP|Speed|Initiative) (.*)$/);
        return m ? el('div', { class: 'sb-chip' }, el('span', { class: 'sb-chip-l' }, m[1]), el('span', { class: 'sb-chip-v' }, m[2])) : el('span', {}, p);
      })));
    } else {
      const m = line.match(/^([A-Z][\w ]{1,20}): (.*)$/);
      box.append(m ? el('p', { class: 'sb-line' }, el('strong', {}, `${m[1]} `), m[2]) : el('p', { class: 'sb-line' }, line));
    }
  }
  return box;
}

export function renderSpells(text, key = 'x') {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const used = loadUsed(); used[key] ||= {};
  const box = el('div', { class: 'spellblock' });
  const pips = (label, n, slotKey) => el('div', { class: 'slot-row' }, el('span', { class: 'slot-l' }, label),
    el('span', { class: 'pips' }, Array.from({ length: n }, (_, i) => {
      const b = el('button', { type: 'button', class: `pip${(used[key][slotKey] || 0) > i ? ' used' : ''}`, 'aria-label': `${label} slot ${i + 1}`, 'aria-pressed': String((used[key][slotKey] || 0) > i) });
      b.addEventListener('click', () => {
        const cur = used[key][slotKey] || 0; used[key][slotKey] = cur > i ? i : i + 1; saveUsed(used);
        [...b.parentElement.children].forEach((p, j) => { const on = used[key][slotKey] > j; p.classList.toggle('used', on); p.setAttribute('aria-pressed', String(on)); });
      });
      return b;
    })));
  let hasSlots = false;
  for (const line of lines) {
    let m;
    if ((m = line.match(/^Pact slots: (\d+) × (\w+)/))) {
      hasSlots = true; box.append(el('div', { class: 'slots' }, pips(`${m[2]}-level pact`, +m[1], 'pact')));
    } else if ((m = line.match(/^Slots: (.*)$/))) {
      hasSlots = true;
      box.append(el('div', { class: 'slots' }, m[1].split(' · ').map((p) => { const [lv, n] = p.split(' '); return pips(lv, +n, lv); })));
    } else if ((m = line.match(/^(Cantrips|1st|2nd|3rd|[4-9]th): (.*)$/))) {
      box.append(el('div', { class: 'spell-row' }, el('span', { class: 'spell-lv' }, m[1]), el('span', { class: 'spell-names' }, m[2].split(', ').map((n) => el('span', { class: 'spell' }, n)))));
    } else box.append(el('p', { class: 'sb-head' }, line));
  }
  if (hasSlots) box.append(el('button', { class: 'btn small ghost', type: 'button', onclick: () => { used[key] = {}; saveUsed(used); box.querySelectorAll('.pip').forEach((p) => { p.classList.remove('used'); p.setAttribute('aria-pressed', 'false'); }); } }, 'Long rest (reset slots)'));
  return box;
}

