function normalizeLinkedinProfile(value = '') {
  if (typeof value !== 'string' || value.length > 2048) return null;
  if (!value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && ['linkedin.com', 'www.linkedin.com'].includes(url.hostname) && !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}
module.exports = { normalizeLinkedinProfile };
