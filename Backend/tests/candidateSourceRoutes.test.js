const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { validateCandidateContact } = require('../services/candidateContact');

function load() {
  const handlers = {}, changes = [];
  let candidate;
  const job = { _id: 'job', status: 'Open' };
  const chain = value => ({ populate() { return this; }, select() { return this; }, sort() { return this; }, lean: async () => value });
  const router = { use() {}, get() {}, delete() {}, post(route, ...args) { handlers['POST ' + route] = args.at(-1); }, patch(route, ...args) { handlers['PATCH ' + route] = args.at(-1); } };
  const source = {
    exists: async () => false,
    find: query => { assert.ok(query.$or.length); return chain([]); },
    create: async data => { candidate = { ...data, _id: 'candidate' }; return candidate; },
    findById: () => chain(candidate),
    findOne: () => chain(candidate ? { ...candidate, requirementId: job } : null),
    findOneAndUpdate: (_query, update) => { Object.assign(candidate, update.$set); return chain(candidate); },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/RecruiterFollowuproutes.js'), 'utf8'), { module: { exports: {} }, console, Date, require(name) {
    if (name === 'express') return { Router: () => router };
    if (name === 'mongoose') return { Types: { ObjectId: { isValid: () => true } } };
    if (name === '../middleware/upload') return { single: () => () => {} };
    if (name === '../models/Jobs') return { findOne: () => chain(job) };
    if (name === '../models/CandidatesByJob') return { find: () => chain([]) };
    if (name === '../models/SourcedCandidate') return source;
    if (name === '../models/Communication') return { updateMany: async (query, update) => changes.push({ query, update }) };
    if (name === '../services/candidateContact') return { validateCandidateContact };
    if (name === '../config/s3Config') return { getSignedUrl: value => value };
    if (name === './logactivity') return () => {};
    return {};
  } });
  return { handlers, changes, candidate: () => candidate };
}
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
const request = body => ({ user: { _id: 'recruiter', designation: 'Recruiter' }, params: { requirementId: 'job', candidateId: 'candidate' }, body });

test('LinkedIn-only candidates save without a file or empty duplicate queries, and edits preserve the source', async () => {
  const app = load(), res = response();
  await app.handlers['POST /requirements/:requirementId/candidates'](request({ contactSource: 'LinkedIn', candidateName: 'Candidate', linkedinProfile: 'https://www.linkedin.com/in/candidate' }), res);
  assert.equal(res.code, 201);
  assert.equal(res.body.candidate.contactSource, 'LinkedIn');
  assert.equal(app.candidate().resumeFileUrl, null);
  assert.equal(app.candidate().email, '');
  const edited = response();
  await app.handlers['PATCH /candidates/:candidateId'](request({ candidateName: 'Updated candidate' }), edited);
  assert.equal(edited.code, 200); assert.equal(edited.body.candidate.contactSource, 'LinkedIn');
});

test('Naukri requires a resume when creating and reuses its existing resume when editing', async () => {
  const app = load(); const req = request({ contactSource: 'Naukri', email: 'candidate@example.com', phone: '9876543210' });
  const missing = response(); await app.handlers['POST /requirements/:requirementId/candidates'](req, missing); assert.equal(missing.code, 400);
  req.file = { path: 'test-resume.pdf' }; const created = response();
  await app.handlers['POST /requirements/:requirementId/candidates'](req, created); assert.equal(created.code, 201);
  const edited = response(); await app.handlers['PATCH /candidates/:candidateId'](request({ candidateName: 'Candidate' }), edited);
  assert.equal(edited.code, 200); assert.equal(app.candidate().resumeFileUrl, 'test-resume.pdf');
});

test('removing an optional email stops unsent emails instead of changing their recipient to an empty address', async () => {
  const app = load();
  await app.handlers['POST /requirements/:requirementId/candidates'](request({ contactSource: 'Other', candidateName: 'Candidate', linkedinProfile: 'https://www.linkedin.com/in/candidate', email: 'candidate@example.com' }), response());
  const res = response(); await app.handlers['PATCH /candidates/:candidateId'](request({ email: '' }), res);
  assert.equal(res.code, 200);
  const emailChange = app.changes.find(change => change.query.channel === 'EMAIL');
  assert.equal(emailChange.update.$set.status, 'stopped');
  assert.equal(emailChange.update.$set.stopReason, 'candidate_email_changed');
  assert.equal('recipient' in emailChange.update.$set, false);
});

test('changing only email casing preserves existing email sequences', async () => {
  const app = load();
  await app.handlers['POST /requirements/:requirementId/candidates'](request({ contactSource: 'LinkedIn', candidateName: 'Candidate', linkedinProfile: 'https://www.linkedin.com/in/candidate', email: 'candidate@example.com' }), response());
  const res = response(); await app.handlers['PATCH /candidates/:candidateId'](request({ email: 'CANDIDATE@example.com' }), res);
  assert.equal(res.code, 200); assert.equal(app.changes.length, 0);
});
