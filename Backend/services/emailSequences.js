const sequenceName = template => String(template.sequenceName || 'Default').trim();
function validateEmailSequences(templates) {
  if (!Array.isArray(templates)) throw Object.assign(new Error('Templates must be a list'), { status: 400 });
  const counts = new Map();
  for (const template of templates) {
    if (!template || !['EMAIL', 'WHATSAPP'].includes(template.channel)) throw Object.assign(new Error('Invalid template channel'), { status: 400 });
    if (template.channel !== 'EMAIL') continue;
    const name = sequenceName(template);
    if (!name || name.length > 100) throw Object.assign(new Error('Sequence names must contain 1–100 characters'), { status: 400 });
    const key = name.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
    if (counts.get(key) > 5) throw Object.assign(new Error(`Sequence "${name}" can contain up to five emails`), { status: 400 });
    if (!String(template.label || '').trim() || !String(template.subject || '').trim() || !String(template.body || '').trim()) throw Object.assign(new Error('Every email needs a label, subject and message'), { status: 400 });
  }
  return true;
}
function getEmailSequences(templates = []) {
  const groups = new Map();
  for (const template of templates.filter(item => item.channel === 'EMAIL')) {
    const name = sequenceName(template);
    const key = name.toLowerCase();
    if (!groups.has(key)) groups.set(key, { name, templates: [] });
    groups.get(key).templates.push(template);
  }
  return [...groups.values()];
}
function selectEmailSequence(templates, name) {
  const sequences = getEmailSequences(templates);
  const selected = name ? sequences.find(item => item.name.toLowerCase() === String(name).trim().toLowerCase()) : sequences[0];
  if (!selected) throw Object.assign(new Error('Select an email sequence saved on this requirement'), { status: 400 });
  validateEmailSequences(selected.templates);
  return selected;
}
module.exports = { validateEmailSequences, getEmailSequences, selectEmailSequence };
