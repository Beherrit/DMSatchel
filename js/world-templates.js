// Entry templates (GMs): save any entry as a template ("Roadside inn", "Cult cell") and start new entries from it.
// Templates live with the world (settings API) and come down with the world for GMs.
import { el, toast, setKids } from './dom.js';
import { api, isGm } from './api.js';
import { world } from './world-store.js';
import { KINDS } from './world-schema.js';

const templates = () => (Array.isArray(world.info?.templates) ? world.info.templates : []);
const store = (list) => { world.info = { ...world.info, templates: list }; };

export function saveTemplateButton(e) {
  if (!isGm() || e.status === 'suggested') return null;
  return el('button', { class: 'btn small ghost', type: 'button', title: 'Start new entries from a copy of this one', onclick: () => {
    const name = el('input', { type: 'text', id: 'tpl-name', value: e.name, maxlength: 80 });
    const d = el('dialog', { class: 'dialog', 'aria-labelledby': 'tpl-title' }, el('div', { class: 'dialog-body' },
      el('h2', { id: 'tpl-title' }, 'Save as a template'),
      el('p', { class: 'muted small' }, `New ${KINDS[e.kind].label.toLowerCase()} entries can start from it: its summary, text, fields, tags and GM notes are copied in. Pictures of a particular character, play state and connections are left out.`),
      el('label', { for: 'tpl-name' }, 'Template name'), name,
      el('div', { class: 'btnrow' }, el('button', { class: 'btn primary', type: 'button', onclick: async () => {
        if (!name.value.trim()) { name.focus(); return; }
        try {
          const r = await api('settings', { method: 'PATCH', body: { template: { name: name.value.trim(), kind: e.kind, summary: e.summary, body: e.body, fields: e.fields, tags: e.tags, secret: e.secret } } });
          store(r.templates); toast(`Template “${name.value.trim()}” saved`); d.close();
        } catch (err) { toast(err.message, 'bad'); }
      } }, 'Save template'), el('button', { class: 'btn', type: 'button', onclick: () => d.close() }, 'Cancel'))));
    d.addEventListener('close', () => d.remove());
    document.body.append(d); d.showModal(); name.select();
  } }, 'Save as template');
}

// On the new-entry form: start from a template (this kind's first), and tidy up old ones.
export function templatePicker(kind) {
  if (!isGm() || !templates().length) return null;
  const box = el('div', { class: 'card template-picker' });
  const draw = () => {
    const list = [...templates()].sort((a, b) => (a.kind === kind ? 0 : 1) - (b.kind === kind ? 0 : 1) || a.name.localeCompare(b.name));
    if (!list.length) { box.remove(); return; }
    const sel = el('select', { id: 'tpl-pick', 'aria-label': 'Start from a template' }, el('option', { value: '' }, 'Start from a template…'),
      list.map((t) => el('option', { value: t.id }, `${t.name} (${KINDS[t.kind]?.label || t.kind})`)));
    sel.addEventListener('change', () => {
      const t = list.find((x) => x.id === sel.value); if (!t) return;
      // The same path as "Add to world" from the tools: the new-entry form opens filled in.
      window.dispatchEvent(new CustomEvent('world:draft', { detail: { kind: t.kind, name: '', summary: t.summary, body: t.body, fields: { ...t.fields }, tags: [...(t.tags || [])], secret: t.secret } }));
      toast(`Started from “${t.name}”: give it a name`);
    });
    setKids(box, el('div', { class: 'controls' }, sel),
      el('details', {}, el('summary', { class: 'small' }, `Manage templates (${list.length})`), el('ul', { class: 'plain' }, list.map((t) => el('li', {}, `${t.name} `, el('span', { class: 'muted small' }, KINDS[t.kind]?.label || t.kind), ' ',
        el('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Delete template ${t.name}`, onclick: async () => {
          try { const r = await api('settings', { method: 'PATCH', body: { template_remove: t.id } }); store(r.templates); toast('Template deleted'); draw(); } catch (err) { toast(err.message, 'bad'); }
        } }, '✕'))))));
  };
  draw();
  return box;
}
