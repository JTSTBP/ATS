const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const recruiterId = '1234567890abcdef12345678';
function load({ found = true } = {}) {
  const calls = [], handlers = {};
  const protect = () => {};
  const chain = value => ({ select(fields) { calls.push({ select: fields }); return this; }, populate(field, fields) { calls.push({ populate: field, fields }); return this; }, sort() { return this; }, lean: async () => value });
  const router = { get(route, ...args) { handlers[route] = args; }, post() {}, put() {}, patch() {}, delete() {} };
  const User = {
    find(query) { calls.push({ mentors: query }); return chain([{ _id: 'mentor' }]); },
    findOne(query) { calls.push({ recruiter: query }); return chain(found ? { _id: recruiterId, name: 'Sample recruiter' } : null); },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/Userroutes.js'), 'utf8'), { module: { exports: {} }, console, require(name) {
    if (name === 'express') return { Router: () => router };
    if (name === '../models/Users') return User;
    if (name === '../middleware/authMiddleware') return { protect };
    if (name === '../models/Jobs') return { find(query) { calls.push({ jobs: query }); return chain([{ _id: 'job', title: 'Area Manager' }]); } };
    return {};
  } });
  const route = handlers['/:id/team-profile']; assert.equal(route[0], protect);
  return { handler: route.at(-1), calls };
}
const res = () => ({ code: 200, headers: {}, set(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
const req = designation => ({ user: { _id: 'actor', designation }, params: { id: recruiterId } });
for (const role of ['Mentor', 'Manager']) test(`${role} can view only reporting recruiters with an explicit safe field selection`, async () => {
  const app = load(), response = res(); await app.handler(req(role), response);
  assert.equal(response.code, 200); assert.equal(response.headers['Cache-Control'], 'no-store');
  const scope = app.calls.find(call => call.recruiter).recruiter;
  assert.equal(scope._id, recruiterId); assert.equal(scope.designation, 'Recruiter');
  assert.deepEqual(JSON.parse(JSON.stringify(scope.$or)), [{ reporter: { $in: role === 'Manager' ? ['actor', 'mentor'] : ['actor'] } }, { secondary_managers: { $in: role === 'Manager' ? ['actor', 'mentor'] : ['actor'] } }]);
  const selection = app.calls.find(call => call.select?.includes('personalEmail')).select.split(' ');
  for (const secret of ['password', 'appPassword', 'microsoftMail']) assert.equal(selection.includes(secret), false);
  if (role === 'Manager') assert.equal(app.calls.find(call => call.mentors).mentors.designation, 'Mentor');
  assert.equal(response.body.jobs[0].title, 'Area Manager');
});
test('non-team recruiter is unavailable and assigned jobs are never queried', async () => {
  const app = load({ found: false }), response = res(); await app.handler(req('Mentor'), response);
  assert.equal(response.code, 404); assert.equal(app.calls.some(call => call.jobs), false);
});
test('recruiters, disabled accounts, and invalid ids are rejected before any data query', async () => {
  for (const request of [req('Recruiter'), { ...req('Manager'), user: { ...req('Manager').user, isDisabled: true } }, { ...req('Mentor'), params: { id: 'invalid' } }]) {
    const app = load(), response = res(); await app.handler(request, response);
    assert.ok([400, 403].includes(response.code)); assert.equal(app.calls.length, 0);
  }
});
