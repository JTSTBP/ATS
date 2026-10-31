const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { suppressEmail } = require('../services/emailSuppression');
// GET only renders confirmation; email scanners must not unsubscribe candidates.
router.get('/', (req, res) => {
  try {
    jwt.verify(String(req.query.token || ''), process.env.JWT_SECRET, { audience: 'ats-unsubscribe' });
    const token = String(req.query.token).replace(/[&<>"']/g, '');
    res.set('Cache-Control', 'no-store').set('Content-Security-Policy', "default-src 'none'; form-action 'self'; frame-ancestors 'none'").type('html').send(`<h1>Stop recruitment emails</h1><form method="post"><input type="hidden" name="token" value="${token}"><button type="submit">Unsubscribe from recruitment emails</button></form>`);
  } catch { res.status(400).send('This unsubscribe link is invalid or expired. Please contact the sender.'); }
});
router.post('/', require('express').urlencoded({ extended: false, limit: '8kb' }), async (req, res) => {
  try {
    const payload = jwt.verify(String(req.body.token || ''), process.env.JWT_SECRET, { audience: 'ats-unsubscribe' });
    if (payload.purpose !== 'email-unsubscribe') return res.status(400).send('Invalid unsubscribe link');
    await suppressEmail(payload.email, 'unsubscribed');
    res.set('Cache-Control', 'no-store').send('You have been unsubscribed from recruitment emails.');
  } catch { res.status(400).send('Unable to unsubscribe. Please contact the sender.'); }
});
module.exports = router;
