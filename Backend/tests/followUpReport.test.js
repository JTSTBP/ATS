const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { reportDateRange, buildReportRows } = require('../services/followUpReport');

test('report includes both full India dates and rejects invalid ranges', () => {
  const range = reportDateRange('2026-10-01', '2026-10-30');
  assert.equal(range.$gte.toISOString(), '2026-09-30T18:30:00.000Z');
  assert.equal(range.$lt.toISOString(), '2026-10-30T18:30:00.000Z');
  assert.deepEqual(reportDateRange('', ''), {});
  for (const dates of [['2026-02-30', ''], ['2026-10-31', '2026-10-01'], ['bad', ''], [['2026-10-01'], '']]) assert.throws(() => reportDateRange(...dates));
});

test('report preserves zero-activity requirements and keeps message channels separate', () => {
  const rows = buildReportRows([{ _id: 'a', title: 'Sales', clientId: { companyName: 'Client' } }, { _id: 'b', title: 'HR' }], [{ _id: 'a', count: 3 }], [{ _id: 'a', emailed: 5, whatsapp: 2 }]);
  assert.equal(rows[0].added, 3);
  assert.equal(rows[0].emailed, 5);
  assert.equal(rows[0].whatsapp, 2);
  assert.deepEqual([rows[1].added, rows[1].emailed, rows[1].whatsapp], [0, 0, 0]);
});

function loadReport() {
  const handlers = {};
  const queries = {};
  const staff = [
    { _id: 'mentor', name: 'Mentor', designation: 'Mentor' },
    { _id: 'recruiter', name: 'Recruiter', designation: 'Recruiter', reporter: 'mentor' },
    { _id: 'other', name: 'Other', designation: 'Recruiter', reporter: 'elsewhere' },
    { _id: 'disabled', name: 'Disabled recruiter', designation: 'Recruiter', isDisabled: true },
  ];
  const chain = value => ({ select() { return this; }, populate() { return this; }, sort() { return this; }, async lean() { return value; } });
  const router = { use() {}, get(url, handler) { handlers[url] = handler; }, post() {}, patch() {}, delete() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/RecruiterFollowuproutes.js'), 'utf8'), {
    module: { exports: {} }, console,
    require(name) {
      if (name === 'express') return { Router: () => router };
      if (name === 'mongoose') return { Types: { ObjectId: { isValid: id => ['mentor', 'recruiter', 'other'].includes(id) } } };
      if (name === '../services/followUpReport') return { reportDateRange, buildReportRows };
      if (name === '../middleware/upload') return { single: () => () => {} };
      if (name === '../models/Users') return { find(query) { queries.staff = query; return chain(query._id ? staff.slice(0, 2) : staff); } };
      if (name === '../models/Jobs') return { find(query) { queries.jobs = query; return chain([{ _id: 'job', title: 'Sales' }]); } };
      if (name === '../models/SourcedCandidate') return { async aggregate(pipeline) { queries.added = pipeline; return [{ _id: 'job', count: 2 }]; } };
      if (name === '../models/Communication') return { async aggregate(pipeline) { queries.sent = pipeline; return [{ _id: 'job', emailed: 3, whatsapp: 1 }]; } };
      if (name === '../models/activitylog') return { collection: { name: 'activitylogs' } };
      return {};
    },
  });
  return { handler: handlers['/report'], queries };
}
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });

test('recruiter filter includes active accounts only, preserving historical totals', async () => {
  const { handler, queries } = loadReport();
  const res = response();
  await handler({ user: { designation: 'Admin' }, query: {} }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(Array.from(res.body.recruiters, member => member._id), ['recruiter', 'other']);
  assert.ok(queries.added[0].$match.recruiterId.$in.includes('disabled'));
});

test('report denies Recruiter/Finance and rejects staff outside mentor scope', async () => {
  const { handler } = loadReport();
  for (const designation of ['Recruiter', 'Finance']) {
    const res = response();
    await handler({ user: { designation }, query: {} }, res);
    assert.equal(res.code, 403);
  }
  const res = response();
  await handler({ user: { designation: 'Mentor' }, followUpTeamIds: ['mentor', 'recruiter'], query: { recruiterId: 'other' } }, res);
  assert.equal(res.code, 400);
});

test('report intersects mentor, recruiter and requirement scope and dates actual sends', async () => {
  const { handler, queries } = loadReport();
  const res = response();
  await handler({ user: { _id: 'mentor', designation: 'Mentor' }, followUpTeamIds: ['mentor', 'recruiter'], followUpRequirementIds: ['job'], query: { recruiterId: 'recruiter', mentorId: 'mentor', from: '2026-10-01' } }, res);
  assert.equal(res.code, 200);
  assert.deepEqual(Array.from(queries.added[0].$match.recruiterId.$in), ['recruiter']);
  assert.deepEqual(Array.from(queries.jobs.$and[0]._id.$in), ['job']);
  assert.equal(queries.jobs.$and[1].$or[0].assignedRecruiters, 'recruiter');
  assert.equal(queries.jobs.$and[1].$or[1].leadRecruiter, 'recruiter');
  assert.equal(queries.sent[0].$match.status, 'sent');
  assert.ok(queries.sent[0].$match.sentAt.$gte);
  assert.equal(queries.sent[0].$match.createdAt, undefined);
  assert.ok(queries.added.some(stage => stage.$unionWith));
  assert.equal(res.body.rows[0].added, 2);
});

test('selected recruiter limits open requirements; clearing retains open-only scope', async () => {
  for (const designation of ['Admin', 'Manager']) {
    const { handler, queries } = loadReport();
    await handler({ user: { designation }, query: { recruiterId: 'recruiter' } }, response());
    assert.equal(queries.jobs.$or[0].assignedRecruiters, 'recruiter');
    assert.equal(queries.jobs.$or[1].leadRecruiter, 'recruiter');
    assert.equal(queries.jobs.status, 'Open');
    await handler({ user: { designation }, query: {} }, response());
    assert.deepEqual(Object.keys(queries.jobs), ['status']);
    assert.equal(queries.jobs.status, 'Open');
  }
});

test('Admin and Manager can report, conflicting staff filters return an empty actor scope', async () => {
  for (const designation of ['Admin', 'Manager']) {
    const { handler, queries } = loadReport();
    const res = response();
    await handler({ user: { designation }, query: { mentorId: 'mentor', recruiterId: 'other' } }, res);
    assert.equal(res.code, 200);
    assert.equal(queries.added[0].$match.recruiterId.$in.length, 0);
    assert.equal(queries.sent[0].$match.recruiterId.$in.length, 0);
  }
});
