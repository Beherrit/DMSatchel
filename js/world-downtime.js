// Downtime between sessions: players file what their character does (train, craft, carouse, research…); a GM
// writes how it turned out. Each lands in that character's history on their page.
// Route: #world/downtime
import { el, toast, setKids } from './dom.js';
import { isGm, isMember, session } from './api.js';
import { worldEntries, createEntry, patchEntry, getEntry, link, when, byName, richText, notice } from './world-store.js';
import { DOWNTIME_ACTIVITIES } from './world-schema.js';
import { GOODS, coinText } from './economy.js';
import { craftEstimate, hasTools } from './crafting.js';
import { changePlay, playOf } from './sheet-ui.js';
import { giveItem } from './handover.js';

const ACTIVE = (e) => !['Retired', 'Dead', 'Missing'].includes(e.fields?.status);
const downtimeOf = (charId) => worldEntries().filter((d) => d.kind === 'downtime' && d.fields?.character === charId);
const newestFirst = (a, b) => String(b.created_at).localeCompare(String(a.created_at));

// One activity: what was done, by whom, and the outcome (or that it's waiting for a GM).
function item(d, { showChar = true, resolve = null } = {}) {
  const f = d.fields || {}, ch = getEntry(f.character);
  return el('li', { class: `card downtime-item${f.resolved ? ' is-resolved' : ' is-waiting'}${d.visibility === 'gm' ? ' is-hidden' : ''}` },
    el('div', { class: 'entry-head' }, el('div', {}, showChar && ch ? [link(ch), ' · '] : null, el('strong', {}, f.activity || 'Downtime'),
      f.days ? el('span', { class: 'muted small' }, f.done && !f.resolved ? ` · ${Math.min(+f.done, +f.days || +f.done)} of ${f.days} days` : ` · ${f.days} day${String(f.days) === '1' ? '' : 's'}`) : null, f.cost ? el('span', { class: 'muted small' }, ` · ${f.cost}`) : null),
      el('span', { class: `tag${f.resolved ? '' : ' waiting-tag'}` }, f.resolved ? 'Resolved' : +f.days > 0 && +f.done >= +f.days ? 'Ready to resolve' : 'Waiting for a GM')),
    // What's being crafted, with the SRD 5.2 estimate when it's on the price list.
    f.craft ? (() => { const e = craftEstimate(f.craft); return el('p', { class: 'small craft-line' }, `🔨 Making: ${f.craft}`, e ? el('span', { class: 'muted' }, ` (materials ${coinText(e.materialsCp)}, ${e.days} day${e.days === 1 ? '' : 's'} of work${e.tools ? `, ${e.tools}` : ''})`) : null); })() : null,
    d.summary ? el('p', {}, d.summary) : null,
    f.outcome ? el('div', { class: 'downtime-outcome' }, el('span', { class: 'label' }, 'Outcome'), richText(f.outcome)) : null,
    el('p', { class: 'muted small' }, `${d.owner || d.created_by || 'Someone'}, ${when(d.created_at)}${d.visibility === 'gm' ? ' · only the GMs and the player can see this' : ''} · `, link(d, 'Open')),
    resolve);
}

// The GM's resolve box: write the outcome, mark it resolved (or edit an outcome already written).
function resolveBox(d, after) {
  const text = el('textarea', { rows: 3, 'aria-label': `Outcome for ${d.name}`, placeholder: 'How it went: what they gained, spent, learned or got into.' }, d.fields?.outcome || '');
  const save = async () => {
    if (!text.value.trim()) { text.focus(); return; }
    try { await patchEntry(d, { fields: { outcome: text.value.trim(), resolved: d.fields?.resolved || new Date().toISOString() } }); toast('Outcome saved: the player can see it'); after(); }
    catch (err) { toast(err.message, 'bad'); }
  };
  // Hand over what was made: a crafting activity's item into the character's pack (once), logged on their sheet.
  const f = d.fields || {}, ch = getEntry(f.character);
  const hand = f.craft && ch && !f.handed ? el('button', { class: 'btn small craft-hand', type: 'button', onclick: async () => {
    try {
      await changePlay(ch, (p) => { p.inventory = giveItem(p.inventory, f.craft, 1, 'their own work'); }, `Crafted ${f.craft}`);
      await patchEntry(getEntry(d.id) || d, { fields: { handed: new Date().toISOString() } });
      toast(`${f.craft} is in ${ch.name}’s pack`); after();
    } catch (err) { toast(err.message, 'bad'); }
  } }, `Put the ${f.craft} in ${ch.name}’s pack`) : f.handed ? el('span', { class: 'muted small' }, `✓ ${f.craft} handed over`) : null;
  // Pay for the materials: the estimate's raw materials, taken from the crafter's purse (once), logged on their sheet.
  const est = f.craft ? craftEstimate(f.craft) : null;
  const pay = est && ch && !f.paid ? el('button', { class: 'btn small craft-pay', type: 'button', onclick: async () => {
    try {
      await changePlay(ch, (p) => { if ((Number(p.cp) || 0) < est.materialsCp) throw new Error(`${ch.name} has only ${coinText(Number(p.cp) || 0)}; the materials cost ${coinText(est.materialsCp)}.`); p.cp -= est.materialsCp; }, `Paid ${coinText(est.materialsCp)} for materials (${f.craft})`);
      await patchEntry(getEntry(d.id) || d, { fields: { paid: new Date().toISOString() } });
      toast(`${coinText(est.materialsCp)} taken from ${ch.name}’s purse`); after();
    } catch (err) { toast(err.message, 'bad'); }
  } }, `Take ${coinText(est.materialsCp)} for materials from ${ch.name}`) : f.paid && est ? el('span', { class: 'muted small' }, '✓ Materials paid') : null;
  return el('div', { class: 'downtime-resolve' }, text, el('div', { class: 'btnrow' }, el('button', { class: 'btn small primary', type: 'button', onclick: save }, d.fields?.resolved ? 'Update outcome' : 'Resolve'), pay, hand));
}

function fileForm(after, preset) {
  const mine = worldEntries().filter((e) => e.kind === 'character' && ACTIVE(e) && (isGm() || e.owner_id === session.gm?.id)).sort(byName);
  if (!mine.length) return el('div', { class: 'card' }, el('p', { class: 'muted' }, isGm() ? 'There are no active player characters yet.' : 'Make or claim a character first, then you can file their downtime here.'),
    isGm() ? null : el('a', { class: 'btn small', href: '#world/new/character' }, '+ My character'));
  const ch = el('select', { id: 'dt-char' }, mine.map((c) => el('option', { value: c.id }, c.name)));
  if (preset && mine.some((c) => c.id === preset)) ch.value = preset;
  const act = el('select', { id: 'dt-act' }, DOWNTIME_ACTIVITIES.map((a) => el('option', { value: a }, a)));
  const days = el('input', { type: 'text', id: 'dt-days', inputmode: 'numeric', placeholder: 'e.g. 5' });
  const cost = el('input', { type: 'text', id: 'dt-cost', placeholder: 'e.g. 25 gp' });
  const what = el('textarea', { id: 'dt-what', rows: 3, placeholder: 'What they do, where, and what they hope to get out of it.' });
  // Crafting costs: for crafting, the item to make; on the price list, the SRD 5.2 estimate (materials and days).
  const craft = el('input', { type: 'text', id: 'dt-craft', list: 'dt-craft-list', placeholder: 'e.g. Longsword', autocomplete: 'off' });
  const craftList = el('datalist', { id: 'dt-craft-list' }, GOODS.map((g) => el('option', { value: g[0] })));
  // Many hands: characters crafting together divide the days.
  const helpers = el('input', { type: 'number', id: 'dt-helpers', min: 1, max: 20, value: 1, class: 'hp-amt', 'aria-label': 'Crafters working on it' });
  const estimate = el('p', { class: 'small craft-estimate', 'aria-live': 'polite' });
  const toolNote = el('p', { class: 'small bad-line craft-tools', 'aria-live': 'polite' });
  // Use the estimate: puts its days (each) and the materials' cost into the activity.
  const use = el('button', { class: 'btn small craft-use', type: 'button', hidden: true, onclick: () => { const e = craftEstimate(craft.value, helpers.value); if (!e) return; days.value = String(e.daysEach); cost.value = coinText(e.materialsCp); toast('Days and cost filled in'); } }, 'Use the estimate');
  const showEstimate = () => {
    const e = craft.value.trim() ? craftEstimate(craft.value, helpers.value) : null;
    use.hidden = !e;
    // Got the tools?: the crafter's pack, checked for the tools the item needs.
    const who = getEntry(ch.value), missing = e?.tools && who && !hasTools(playOf(who).inventory, e.tools);
    toolNote.textContent = missing ? `⚠ ${who.name}’s pack has no ${e.tools}.` : '';
    estimate.textContent = !craft.value.trim() ? 'Name an item from the price list for an estimate (or describe anything else below).'
      : e ? `${e.name} (${coinText(Math.round(e.gp * 100))}): raw materials ${coinText(e.materialsCp)}, ${e.days} day${e.days === 1 ? '' : 's'} of work${e.helpers > 1 ? `, or ${e.daysEach} day${e.daysEach === 1 ? '' : 's'} each with ${e.helpers} crafting` : ''}. ${e.tools ? `Usually made with ${e.tools}, and they need proficiency with them.` : 'They need proficiency with the right tools.'}`
        : 'Not on the price list: a GM will set the cost and time.';
  };
  craft.addEventListener('input', showEstimate); helpers.addEventListener('input', showEstimate); ch.addEventListener('change', showEstimate);
  const craftBox = el('div', { class: 'field wide craft-box' }, el('label', { for: 'dt-craft' }, 'Item to craft'), craft, craftList,
    el('div', { class: 'controls' }, el('label', { for: 'dt-helpers', class: 'small' }, 'Crafters'), helpers, use), estimate, toolNote);
  const showCraft = () => { craftBox.hidden = act.value !== 'Crafting'; showEstimate(); };
  act.addEventListener('change', showCraft); showCraft();
  const priv = el('input', { type: 'checkbox', id: 'dt-private' });
  const status = el('p', { class: 'form-status', role: 'status' });
  const form = el('form', { class: 'card edit-form downtime-form' }, el('h3', {}, 'File downtime'),
    el('div', { class: 'edit-fields' },
      el('div', { class: 'field' }, el('label', { for: 'dt-char' }, 'Character'), ch),
      el('div', { class: 'field' }, el('label', { for: 'dt-act' }, 'Activity'), act),
      el('div', { class: 'field' }, el('label', { for: 'dt-days' }, 'Days spent'), days),
      el('div', { class: 'field' }, el('label', { for: 'dt-cost' }, 'Cost (optional)'), cost),
      craftBox,
      el('div', { class: 'field wide' }, el('label', { for: 'dt-what' }, 'What they do'), what)),
    el('label', { class: 'check' }, priv, ' Keep it between me and the GMs'),
    status, el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'submit' }, 'File it')));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!what.value.trim()) { status.textContent = 'Say what they do.'; status.className = 'form-status error'; what.focus(); return; }
    const c = getEntry(ch.value);
    try {
      await createEntry({ kind: 'downtime', name: `${c.name}: ${act.value}`, summary: what.value.trim(), visibility: priv.checked ? 'gm' : 'all',
        fields: { character: c.id, activity: act.value, days: days.value.trim(), cost: cost.value.trim(), ...(act.value === 'Crafting' && craft.value.trim() ? { craft: craft.value.trim().slice(0, 120) } : {}) } });
      toast(isGm() ? 'Downtime filed' : 'Filed: a GM will write how it goes');
      after();
    } catch (err) { status.textContent = err.message; status.className = 'form-status error'; }
  });
  return form;
}

export function viewDowntime(rerender, preset) {
  if (!isMember()) return notice('Members only', 'Join this world to file and read downtime.');
  const all = worldEntries().filter((d) => d.kind === 'downtime').sort(newestFirst);
  const waiting = all.filter((d) => !d.fields?.resolved), done = all.filter((d) => d.fields?.resolved);
  const mineIds = new Set(worldEntries().filter((e) => e.kind === 'character' && e.owner_id === session.gm?.id).map((e) => e.id));
  const yours = isGm() ? [] : all.filter((d) => mineIds.has(d.fields?.character) || d.owner_id === session.gm?.id);
  return el('div', { class: 'w-view downtime-view' },
    el('div', { class: 'panel-head' }, el('h2', {}, 'Downtime'),
      el('p', {}, 'What the characters do between sessions. Players file an activity; a GM writes how it turned out, and it’s kept on the character’s page.')),
    isGm() ? el('section', {}, el('h3', { class: 'section-title' }, `Waiting for a GM (${waiting.length})`),
      waiting.length ? el('ul', { class: 'downtime-list' }, waiting.map((d) => item(d, { resolve: resolveBox(d, rerender) }))) : el('p', { class: 'muted' }, 'Nothing waiting. All caught up.'))
      : yours.length ? el('section', {}, el('h3', { class: 'section-title' }, 'Yours'), el('ul', { class: 'downtime-list' }, yours.map((d) => item(d)))) : null,
    fileForm(rerender, preset),
    el('section', {}, el('h3', { class: 'section-title' }, 'Recently resolved'),
      done.length ? el('ul', { class: 'downtime-list' }, done.slice(0, 30).map((d) => item(d, { resolve: isGm() ? el('details', {}, el('summary', { class: 'small' }, 'Edit outcome'), resolveBox(d, rerender)) : null })))
        : el('p', { class: 'muted' }, 'Nothing resolved yet.')));
}

// On a character's page: their downtime, newest first.
export function downtimeSection(e) {
  const list = downtimeOf(e.id).sort(newestFirst);
  const canFile = isGm() || e.owner_id === session.gm?.id;
  if (!list.length && !canFile) return null;
  return el('section', { class: 'downtime-section' },
    el('div', { class: 'entry-head' }, el('h3', {}, 'Downtime'), canFile ? el('a', { class: 'btn small', href: `#world/downtime/${e.id}` }, 'File downtime') : null),
    list.length ? el('ul', { class: 'downtime-list' }, list.map((d) => item(d, { showChar: false }))) : el('p', { class: 'muted small' }, 'Nothing yet. What do they do between sessions?'));
}
