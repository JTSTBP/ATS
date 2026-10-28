const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function profileRoute(user) {
  let handler;
  const router = { post() {}, get() {}, put(_path, ...handlers) { handler = handlers.at(-1); } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/Authroutes.js'), 'utf8'), {
    module: { exports: {} }, console, URL,
    require(name) {
      if (name === 'express') return { Router: () => router };
      if (name === '../models/Users') return { findById: async () => user };
      if (name === '../middleware/profileUpload') return { single: () => () => {} };
      if (name === '../config/s3Config') return { getSignedUrl: value => value };
      return {};
    },
  });
  return async body => {
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; } };
    await handler({ user: { _id: 'recruiter' }, body }, response);
    return response;
  };
}

test('profile saves and returns recruiter contact details and birth date', async () => {
  const user = { async save() { return this; } };
  const response = await profileRoute(user)({ joinDate: '2024-01-02', dateOfBirth: '1995-03-04', phone: '+919876543210', whatsappLink: 'https://wa.me/919876543210', linkedinLink: 'https://www.linkedin.com/in/recruiter' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.user.dateOfBirth, '1995-03-04');
  assert.equal(response.body.user.whatsappLink, 'https://wa.me/919876543210');
  assert.equal(response.body.user.linkedinLink, 'https://www.linkedin.com/in/recruiter');
  assert.equal(user.dateOfJoining, '2024-01-02');
  assert.equal(user.phoneNumber.official, '+919876543210');
});

test('profile rejects unsafe and wrong-domain social links before saving', async () => {
  for (const body of [{ whatsappLink: 'javascript:alert(1)' }, { linkedinLink: 'https://linkedin.com.evil.test/in/name' }, { dateOfBirth: 'invalid' }]) {
    let saved = false;
    const response = await profileRoute({ async save() { saved = true; return this; } })(body);
    assert.equal(response.statusCode, 400);
    assert.equal(saved, false);
  }
});

test('optional profile fields can be cleared', async () => {
  const user = { dateOfBirth: '1995-03-04', whatsappLink: 'https://wa.me/123', async save() { return this; } };
  const response = await profileRoute(user)({ dateOfBirth: '', whatsappLink: '', linkedinLink: '', joinDate: '', phone: '' });
  assert.equal(response.statusCode, 200);
  assert.equal(user.dateOfBirth, null);
  assert.equal(user.whatsappLink, '');
  assert.equal(user.joinDate, null);
});
