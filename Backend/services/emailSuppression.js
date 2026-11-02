const jwt = require('jsonwebtoken');
const EmailSuppression = require('../models/EmailSuppression');
const Communication = require('../models/Communication');
const EmailEnrollment = require('../models/EmailEnrollment');
const normalizeEmail = value => String(value || '').trim().toLowerCase();
const validEmail = value => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
const pendingStatuses = ['generated', 'reviewed', 'scheduled', 'pending', 'failed'];
async function assertNotSuppressed(recipient) {
  const email = normalizeEmail(recipient);
  if (!validEmail(email)) throw Object.assign(new Error('Invalid recipient email'), { status: 400 });
  const suppression = await EmailSuppression.findOne({ email }).lean();
  if (suppression) throw Object.assign(new Error(`Email sending stopped: ${suppression.reason}`), { code: 'EMAIL_SUPPRESSED', status: 409 });
}
async function suppressEmail(recipient, reason, addedBy) {
  const email = normalizeEmail(recipient);
  if (!validEmail(email) || !['declined', 'unsubscribed', 'bounced', 'manual'].includes(reason)) throw Object.assign(new Error('Valid email and suppression reason required'), { status: 400 });
  await EmailSuppression.updateOne({ email }, { $set: { reason, ...(addedBy ? { addedBy } : {}) } }, { upsert: true });
  await Communication.updateMany({ channel: 'EMAIL', recipient: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, status: { $in: pendingStatuses } }, { $set: { status: 'stopped', stoppedAt: new Date(), stopReason: reason } });
  await EmailEnrollment.deleteMany({ key: { $regex: `:${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
}
function unsubscribeUrl(email) {
  const setupError = message => Object.assign(new Error(message), { code: 'UNSUBSCRIBE_SETUP_REQUIRED', status: 503 });
  if (!process.env.JWT_SECRET) throw setupError('Configure JWT_SECRET for unsubscribe links');
  const explicitBase = process.env.PUBLIC_BASE_URL || process.env.BACKEND_PUBLIC_URL;
  // The existing OAuth callback already identifies the public backend serving unsubscribe requests.
  const base = String(explicitBase || process.env.MICROSOFT_REDIRECT_URI || '').trim();
  if (!base) throw setupError('Configure PUBLIC_BASE_URL or the Microsoft backend callback URL for unsubscribe links');
  let url;
  try { url = new URL(base); }
  catch { throw setupError('The unsubscribe backend URL must be a valid absolute URL'); }
  if (url.username || url.password || !(url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw setupError('Unsubscribe URL requires HTTPS outside localhost and must not contain credentials');
  if (!explicitBase && url.pathname !== '/api/microsoft-mail/callback') throw setupError('Configure PUBLIC_BASE_URL with the public backend origin for unsubscribe links');
  const token = jwt.sign({ purpose: 'email-unsubscribe', email: normalizeEmail(email) }, process.env.JWT_SECRET, { expiresIn: '180d', audience: 'ats-unsubscribe' });
  return `${url.origin}/api/email-unsubscribe?token=${encodeURIComponent(token)}`;
}
module.exports = { normalizeEmail, assertNotSuppressed, suppressEmail, unsubscribeUrl, pendingStatuses };
