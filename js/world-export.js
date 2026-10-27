// Export and print: the whole world, one place and everything inside it, or one kind of entry, as Markdown or a
// print-ready page. A player-safe copy leaves out hidden entries, suggestions, secrets and GM-only connections.
// Route: #world/export
import { el, toast, download } from './dom.js';
import { isGm } from './api.js';
import { world, worldEntries, byName, kindLabel, notice, descendantsOf, getEntry } from './world-store.js';
import { KINDS, KIND_ORDER, PLACE_KINDS } from './world-schema.js';
import { todayText } from './world-calendar.js';

const SKIP_FIELDS = new Set(['forge', 'play', 'image', 'stats', 'spells', 'market', 'stock', 'encounters']);

function pick({ scope, playerSafe }) {
  let list = worldEntries();
  if (playerSafe) list = list.filter((e) => e.visibility !== 'gm' && e.status !== 'suggested');
  if (scope.startsWith('place:')) {
    const id = scope.slice(6);
    const inside = new Set(descendantsOf(id).map((e) => e.id));
    list = list.filter((e) => e.id === id || inside.has(e.id));
  } else if (scope.startsWith('kind:')) list = list.filter((e) => e.kind === scope.slice(5));
  return list.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || byName(a, b));
}

const plain = (text) => String(text || '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, n, label) => label || n);
const anchor = (name) => name.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

function fieldsOf(e, playerSafe) {
  const rows = [];
  for (const [k, label] of KINDS[e.kind]?.fields || []) {
    const v = e.fields?.[k];
    if (!v || SKIP_FIELDS.has(k) || (k === 'sheet' && e.fields.forge)) continue;
    rows.push([label, v]);
  }
  if (e.fields?.stats && !playerSafe) rows.push(['Stat block', e.fields.stats]);
  if (e.fields?.stock) rows.push(['For sale', e.fields.stock]);
  return rows;
}

function connections(e, playerSafe, included) {
  return (e.links || []).filter((l) => !(playerSafe && l.secret)).map((l) => ({ label: l.label, target: getEntry(l.id), secret: l.secret }))
    .filter((l) => l.target && (!playerSafe || included.has(l.target.id)));
}

export function toMarkdown({ scope = 'all', playerSafe = false } = {}) {
  const list = pick({ scope, playerSafe });
  const included = new Set(list.map((e) => e.id));
  const info = world.info || {};
  const title = scope.startsWith('place:') ? getEntry(scope.slice(6))?.name : scope.startsWith('kind:') ? `${info.name || 'The World'}: ${KINDS[scope.slice(5)]?.plural}` : info.name || 'The World';
  const L = [`# ${title}`, ''];
  if (scope === 'all') { if (info.tagline) L.push(`*${info.tagline}*`, ''); if (info.about) L.push(plain(info.about), ''); }
  if (todayText()) L.push(`Today in the world: ${todayText()}.`, '');
  L.push(`${playerSafe ? 'Player copy' : 'GM copy, with secrets'} · ${list.length} entries · exported ${new Date().toLocaleDateString()}`, '');
  let kind = null;
  for (const e of list) {
    if (e.kind !== kind) { kind = e.kind; L.push(`## ${KINDS[kind]?.plural || kind}`, ''); }
    const parent = e.parent_id && included.has(e.parent_id) ? getEntry(e.parent_id) : e.parent_id && !playerSafe ? getEntry(e.parent_id) : null;
    L.push(`### ${e.name}`, '');
    L.push(`*${[kindLabel(e.kind), e.fields?.type || e.fields?.size].filter(Boolean).join(' · ')}${parent ? ` · in ${parent.name}` : ''}${!playerSafe && e.visibility === 'gm' ? ' · hidden from players' : ''}*`, '');
    if (e.summary) L.push(plain(e.summary), '');
    for (const [label, v] of fieldsOf(e, playerSafe)) L.push(String(v).includes('\n') ? `**${label}:**\n\n${plain(v)}\n` : `**${label}:** ${plain(v)}  `);
    L.push('');
    if (e.body) L.push(plain(e.body), '');
    if (!playerSafe && e.secret) L.push(...plain(e.secret).split('\n').map((x) => `> **GM:** ${x}`), '');
    const links = connections(e, playerSafe, included);
    if (links.length) L.push(`Connections: ${links.map((l) => `${l.label} [${l.target.name}](#${anchor(l.target.name)})${l.secret ? ' (GM only)' : ''}`).join('; ')}`, '');
    if (e.tags?.length) L.push(`Tags: ${e.tags.map((t) => `#${t}`).join(' ')}`, '');
  }
  L.push('---', '', 'Made with The DM’s Satchel. Includes material from the System Reference Documents 5.1 and 5.2 by Wizards of the Coast LLC, licensed under CC BY 4.0.');
  return { title, text: L.join('\n').replace(/\n{3,}/g, '\n\n') };
}

// A minimal Markdown-to-HTML for the print page (headings, emphasis, quotes, links, paragraphs).
function mdToHtml(md) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const inline = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(#([\w-]+)\)/g, '<a href="#$2">$1</a>');
  return md.split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (!b) return '';
    const h = b.match(/^(#{1,3}) (.*)$/);
    if (h) return `<h${h[1].length} id="${anchor(h[2])}">${inline(h[2])}</h${h[1].length}>`;
    if (b === '---') return '<hr>';
    if (b.startsWith('> ')) return `<blockquote>${b.split('\n').map((l) => inline(l.replace(/^> /, ''))).join('<br>')}</blockquote>`;
    return `<p>${b.split('\n').map((l) => inline(l.replace(/ {2}$/, ''))).join('<br>')}</p>`;
  }).join('\n');
}

export function printHtml({ title, text }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title.replace(/</g, '&lt;')}</title>
<style>
  body { font: 16px/1.5 Georgia, "Iowan Old Style", serif; color: #1d1a14; background: #fff; max-width: 760px; margin: 32px auto; padding: 0 20px }
  h1 { font-size: 32px; margin: 0 0 8px } h2 { font-size: 24px; margin: 36px 0 8px; border-bottom: 2px solid #1d1a14; page-break-after: avoid }
  h3 { font-size: 19px; margin: 24px 0 4px; page-break-after: avoid } p { margin: 6px 0 } a { color: inherit }
  blockquote { margin: 8px 0; padding: 6px 12px; border-left: 4px solid #8a2c2c; background: #f6eeee } hr { margin: 32px 0 }
  .bar { position: sticky; top: 0; background: #fff; padding: 8px 0; border-bottom: 1px solid #ccc; margin-bottom: 16px; font-family: system-ui, sans-serif }
  @media print { .bar { display: none } body { margin: 0; max-width: none } }
</style></head><body><div class="bar"><button onclick="print()">Print or save as PDF</button></div>${mdToHtml(text)}</body></html>`;
}

export function viewExport() {
  if (!worldEntries().length && !world.info) return notice('Nothing to export', 'The world is empty.');
  const gm = isGm();
  const places = worldEntries().filter((e) => PLACE_KINDS.includes(e.kind) && e.fields?.type !== 'Room').sort(byName);
  const scope = el('select', { id: 'x-scope' }, el('option', { value: 'all' }, 'The whole world'),
    places.length ? el('optgroup', { label: 'A place and everything in it' }, places.map((p) => el('option', { value: `place:${p.id}` }, p.name))) : null,
    el('optgroup', { label: 'One kind of entry' }, KIND_ORDER.map((k) => el('option', { value: `kind:${k}` }, KINDS[k].plural))));
  const safe = el('select', { id: 'x-safe' }, gm ? el('option', { value: 'gm' }, 'GM copy (secrets and hidden entries)') : null, el('option', { value: 'player' }, 'Player copy (only what players can see)'));
  const preview = el('pre', { class: 'export-preview' });
  const opts = () => ({ scope: scope.value, playerSafe: safe.value === 'player' });
  const refresh = () => { const { text } = toMarkdown(opts()); preview.textContent = text.length > 6000 ? `${text.slice(0, 6000)}\n\n… (${Math.round(text.length / 1000)}k characters in full)` : text; };
  scope.addEventListener('change', refresh); safe.addEventListener('change', refresh);
  const file = (t) => `${t.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'world'}`;
  const node = el('div', { class: 'w-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Export & print'), el('p', {}, 'Take the world with you: Markdown for notes apps and wikis, or a print-ready page you can save as a PDF. Player copies leave out hidden entries, suggestions, secrets and GM-only connections.')),
    el('div', { class: 'controls' }, el('div', { class: 'field' }, el('label', { for: 'x-scope' }, 'What'), scope), el('div', { class: 'field' }, el('label', { for: 'x-safe' }, 'For'), safe)),
    el('div', { class: 'btnrow' },
      el('button', { class: 'btn primary', type: 'button', onclick: () => { const r = toMarkdown(opts()); download(`${file(r.title)}${opts().playerSafe ? '-players' : ''}.md`, r.text, 'text/markdown'); } }, 'Download Markdown'),
      el('button', { class: 'btn', type: 'button', onclick: () => {
        const url = URL.createObjectURL(new Blob([printHtml(toMarkdown(opts()))], { type: 'text/html' }));
        const w = window.open(url, '_blank');
        if (!w) toast('Your browser blocked the new tab. Allow pop-ups for this site, or download the Markdown.', 'bad');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } }, 'Open print page')),
    el('h3', { class: 'section-title' }, 'Preview'), preview);
  refresh();
  return node;
}
