const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
test('role candidate tabs count the visible team across statuses without changing the selected page', async () => {
 let pipeline, handler;
 const router = { get(route, ...handlers) { if (route === '/role-based-candidates') handler = handlers.at(-1); }, post() {}, patch() {}, put() {}, delete() {}, use() {} };
 vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/CandidatesByJobroutes.js'), 'utf8'), {
  module: { exports: {} }, console: { log() {}, error() {} }, Date, RegExp,
  require(name) {
   if (name === 'express') return { Router: () => router };
   if (name === 'mongoose') return { Types: { ObjectId: class { constructor(id) { this.id = id; } } } };
   if (name === '../models/Users') return { findById: async () => ({ _id: 'recruiter' }) };
   if (name === '../models/CandidatesByJob') return { aggregate: async value => { pipeline = value; return [{ candidates: [], totalCount: [{ count: 2 }], statusCounts: [{ _id: 'New', count: 3 }, { _id: 'Joined', count: 2 }] }]; } };
   if (name.includes('Upload') || name === '../middleware/upload') return { single: () => () => {} };
   if (name === '../config/s3Config') return { getSignedUrl: value => value };
   if (name === 'fs') return fs;
   if (name === 'path') return path;
   return {};
  }
 });
 const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
 await handler({ query: { userId: 'recruiter', designation: 'Recruiter', page: '1', limit: '10', status: 'Joined' } }, res);
 assert.equal(res.body.success, true);
 assert.equal(res.body.statusCounts.all, 5);
 assert.equal(res.body.statusCounts.New, 3);
 assert.equal(res.body.totalCandidates, 2);
 assert.equal(pipeline[0].$match.createdBy.$in[0].id, 'recruiter');
 assert.ok(!pipeline[0].$match.status);
 const facet = pipeline.find(stage => stage.$facet).$facet;
 assert.equal(facet.candidates[0].$match.status.source, '^Joined$');
 assert.equal(facet.totalCount[0].$match.status.source, '^Joined$');
 assert.equal(facet.statusCounts[0].$group._id, '$status');
});
