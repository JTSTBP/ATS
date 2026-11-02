const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function load(job = { _id: 'job' }) {
  const handlers = {}, queries = [];
  const chain = value => ({ populate() { return this; }, select() { return this; }, lean: async () => value });
  const router = { use() {}, get(route, handler) { handlers[route] = handler; }, post() {}, patch() {}, delete() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/RecruiterFollowuproutes.js'), 'utf8'), { module: { exports: {} }, console, Date, require(name) {
    if (name === 'express') return { Router: () => router };
    if (name === 'mongoose') return { Types: { ObjectId: { isValid: () => true } } };
    if (name === '../middleware/upload') return { single: () => () => {} };
    if (name === '../models/Jobs') return { findOne: query => { queries.push(query); return chain(job); } };
    if (name === '../models/Communication') return { aggregate: async pipeline => { queries.push(pipeline); return [{ _id: 'source', email: 'one@example.com', respondedAt: '2026-11-02T10:20:00Z' }, { _id: 'converted', email: 'two@example.com', respondedAt: '2026-11-01T10:20:00Z' }]; } };
    if (name === '../models/SourcedCandidate') return { find: () => chain([{ _id: 'source', name: 'Sarun', phoneNumber: '9876543210' }]) };
    if (name === '../models/CandidatesByJob') return { find: () => chain([{ _id: 'converted', dynamicFields: { Name: 'Converted candidate', Phone: '9123456780' } }]) };
    return {};
  } });
  return { handler: handlers['/requirements/:requirementId/email-replies'], queries };
}
const response = () => ({ code: 200, set() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
for (const role of ['Recruiter', 'Mentor']) test(`${role} response list uses requirement and owner scope and keeps converted candidate metadata`, async () => {
  const app = load(), res = response();
  await app.handler({ user: { _id: 'owner', designation: role }, params: { requirementId: 'job' }, followUpTeamIds: ['owner', 'teammate'], followUpRequirementIds: ['job'] }, res);
  assert.equal(res.code, 200);
  const match = app.queries[1][0].$match;
  assert.equal(match.requirementId, 'job'); assert.equal(match.channel, 'EMAIL');
  assert.equal(match.replyDetectedAt.$type, 'date');
  assert.equal(JSON.stringify(match.recruiterId), JSON.stringify(role === 'Recruiter' ? 'owner' : { $in: ['owner', 'teammate'] }));
  assert.equal(app.queries[1][1].$group._id, '$candidateId');
  assert.equal(app.queries[1][1].$group.respondedAt.$max, '$replyDetectedAt');
  assert.equal(res.body.replies[0].name, 'Sarun'); assert.equal(res.body.replies[0].phone, '9876543210');
  assert.equal(res.body.replies[1].name, 'Converted candidate'); assert.equal(res.body.replies[1].phone, '9123456780');
  assert.equal('body' in res.body.replies[0], false);
});
test('inaccessible requirement returns 404 without querying responses', async () => {
  const app = load(null), res = response(); await app.handler({ user: { _id: 'owner', designation: 'Recruiter' }, params: { requirementId: 'job' } }, res);
  assert.equal(res.code, 404); assert.equal(app.queries.length, 1);
});
