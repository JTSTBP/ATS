const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const jwt = require('jsonwebtoken');

function service(env) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../services/emailSuppression.js'), 'utf8'), {
    module, process: { env }, URL,
    require: name => name === 'jsonwebtoken' ? jwt : {},
  });
  return module.exports;
}
const secret = 'test-only-unsubscribe-secret';

test('unsubscribe links use the configured Microsoft backend callback origin when a separate public URL is absent', () => {
  const url = new URL(service({ JWT_SECRET: secret, MICROSOFT_REDIRECT_URI: 'https://backend.example.com/api/microsoft-mail/callback' }).unsubscribeUrl(' PERSON@example.com '));
  assert.equal(url.origin, 'https://backend.example.com');
  assert.equal(url.pathname, '/api/email-unsubscribe');
  const payload = jwt.verify(url.searchParams.get('token'), secret, { audience: 'ats-unsubscribe' });
  assert.equal(payload.email, 'person@example.com');
  assert.equal(payload.purpose, 'email-unsubscribe');
});

test('an explicit public backend URL takes precedence over the Microsoft callback', () => {
  const url = service({ JWT_SECRET: secret, PUBLIC_BASE_URL: 'https://public.example.com/', MICROSOFT_REDIRECT_URI: 'https://other.example.com/api/microsoft-mail/callback' }).unsubscribeUrl('person@example.com');
  assert.equal(new URL(url).origin, 'https://public.example.com');
});

test('unsubscribe setup still requires a signing secret and a valid secure backend URL', () => {
  for (const env of [
    { MICROSOFT_REDIRECT_URI: 'https://backend.example.com/api/microsoft-mail/callback' },
    { JWT_SECRET: secret, FRONTEND_URL: 'https://frontend.example.com' },
    { JWT_SECRET: secret, PUBLIC_BASE_URL: 'not-a-url' },
    { JWT_SECRET: secret, PUBLIC_BASE_URL: 'http://backend.example.com' },
    { JWT_SECRET: secret, PUBLIC_BASE_URL: 'javascript://localhost' },
    { JWT_SECRET: secret, PUBLIC_BASE_URL: 'https://user:password@backend.example.com' },
    { JWT_SECRET: secret, MICROSOFT_REDIRECT_URI: 'https://frontend.example.com/login' },
  ]) assert.throws(() => service(env).unsubscribeUrl('person@example.com'), error => error.status === 503);
});
