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
    await handler({ user: { _id: 'recruiter', designation: user.designation || 'Recruiter', isAdmin: user.isAdmin }, body }, response);
    return response;
  };
}

test('profile saves and returns recruiter contact details and birth date', async () => {
  const user = { designation: 'Admin', async save() { return this; } };
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
  const user = { designation: 'Admin', dateOfBirth: '1995-03-04', whatsappLink: 'https://wa.me/123', async save() { return this; } };
  const response = await profileRoute(user)({ dateOfBirth: '', whatsappLink: '', linkedinLink: '', joinDate: '', phone: '' });
  assert.equal(response.statusCode, 200);
  assert.equal(user.dateOfBirth, null);
  assert.equal(user.whatsappLink, '');
  assert.equal(user.joinDate, null);
});

test('recruiters cannot change DOJ through either field name', async () => {
  for (const field of ['joinDate', 'dateOfJoining']) {
    let saved = false;
    const user = { joinDate: '2024-01-02', async save() { saved = true; return this; } };
    const response = await profileRoute(user)({ [field]: '2026-01-01' });
    assert.equal(response.statusCode, 403);
    assert.equal(saved, false);
    assert.equal(user.joinDate, '2024-01-02');
  }
});

test('recruiters can save other profile details without sending DOJ', async () => {
  const user = { joinDate: '2024-01-02', async save() { return this; } };
  const response = await profileRoute(user)({ phone: '+919876543210' });
  assert.equal(response.statusCode, 200);
  assert.equal(user.joinDate, '2024-01-02');
});

test('user management authenticates updates and restricts both DOJ fields to admins', async () => {
  let handlers;
  const protect = () => {};
  const user = { joinDate: '2024-01-02', async save() { return this; } };
  const router = { post() {}, get() {}, delete() {}, patch() {}, put(_path, ...registered) { handlers = registered; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/Userroutes.js'), 'utf8'), {
    module: { exports: {} }, console,
    require(name) {
      if (name === 'express') return { Router: () => router };
      if (name === '../middleware/authMiddleware') return { protect };
      if (name === '../models/Users') return { findById: async () => user, findOne: async () => null };
      return {};
    },
  });
  assert.equal(handlers[0], protect);
  for (const designation of ['Recruiter', 'Manager', 'Admin']) {
    for (const field of ['joinDate', 'dateOfJoining']) {
      const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.body = data; } };
      await handlers.at(-1)({ user: { designation }, params: { id: 'recruiter' }, body: { [field]: '2026-01-01' } }, response);
      assert.equal(response.statusCode, designation === 'Admin' ? 200 : 403);
      if (designation === 'Admin') {
        assert.equal(user.joinDate, '2026-01-01');
        assert.equal(user.dateOfJoining, '2026-01-01');
      }
    }
  }
});
