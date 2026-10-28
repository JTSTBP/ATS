const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

const profileLink = (value, domains) => {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' && domains.includes(url.hostname) && !url.username && !url.password && !url.port ? url.href : '';
  } catch { return ''; }
};

const withProfileSignature = (message, user) => {
  const details = [user.name, user.email, user.phone || user.phoneNumber?.official || user.phoneNumber?.personal].map(value => String(value || '').trim()).filter(Boolean);
  const links = [
    ['WhatsApp', profileLink(user.whatsappLink, ['wa.me', 'api.whatsapp.com', 'whatsapp.com', 'www.whatsapp.com'])],
    ['LinkedIn', profileLink(user.linkedinLink, ['linkedin.com', 'www.linkedin.com'])],
  ].filter(([, url]) => url);
  const text = String(message.text || '').replace(/\n\n-- \n[\s\S]*$/, '').replace(/\s*Regards,\s*\n[^\n]+\nJobs Territory Recruitment Team\s*$/i, '');
  const html = String(message.html || escapeHtml(text).replace(/\n/g, '<br/>'))
    .replace(/<div data-ats-signature="true"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<p\b[^>]*>\s*Regards,<br\s*\/?>(?:(?!<\/p>)[\s\S])*Jobs Territory Recruitment Team<\/span>\s*<\/p>/gi, '');
  const signature = [...details.map(escapeHtml), ...links.map(([label, url]) => `<a href="${escapeHtml(url)}" style="color:#2563eb;">${label}</a>`)];
  const footer = `<div data-ats-signature="true" style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#334155;">Regards,<br/>${signature.join('<br/>')}</div>`;
  // Place the signature inside complete HTML templates as well as HTML fragments.
  return {
    ...message,
    text: `${text}\n\n-- \nRegards,\n${[...details, ...links.map(([label, url]) => `${label}: ${url}`)].join('\n')}`,
    html: /<\/body\s*>/i.test(html) ? html.replace(/<\/body\s*>/i, `${footer}</body>`) : html + footer,
  };
};

module.exports = { withProfileSignature };
