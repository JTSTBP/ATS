const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
test('unsubscribe GET is read-only; POST requires a valid purpose-bound token', async () => {
  let suppressed = 0;
  const handlers = {};
  const router = { get(url, handler) { handlers.get = handler; }, post(url, ...args) { handlers.post = args.at(-1); } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/EmailUnsubscriberoutes.js'), 'utf8'), { module: { exports: {} }, process: { env: { JWT_SECRET: 'test' } }, require(name) {
    if (name === 'express') return { Router: () => router, urlencoded: () => () => {} };
    if (name === 'jsonwebtoken') return { verify(token, _key, options) { assert.equal(options.audience, 'ats-unsubscribe'); if (token === 'bad') throw Error('Invalid'); return { purpose: token === 'wrong-purpose' ? 'other' : 'email-unsubscribe', email: 'candidate@example.com' }; } };
    return { suppressEmail: async (email, reason) => { assert.equal(email, 'candidate@example.com'); assert.equal(reason, 'unsubscribed'); suppressed++; } };
  } });
  const response = () => ({ code: 200, status(code) { this.code = code; return this; }, set() { return this; }, type() { return this; }, send(body) { this.body = body; return this; } });
  const get = response(); handlers.get({ query: { token: 'valid' } }, get);
  assert.match(get.body, /method="post"/); assert.equal(suppressed, 0);
  for (const token of ['bad', 'wrong-purpose']) { const res = response(); await handlers.post({ body: { token } }, res); assert.equal(res.code, 400); assert.equal(suppressed, 0); }
  const post = response(); await handlers.post({ body: { token: 'valid' } }, post); assert.equal(post.code, 200); assert.equal(suppressed, 1);
});
