const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const policy = require('../services/teamEmailSequences');
const sequences = require('../services/emailSequences');
const oid = number => String(number).padStart(24, '0');
const actor = { _id: oid(1), designation: 'Manager' };
const clientId = oid(2), firstId = oid(3), laterId = oid(4), recruiterA = oid(5), recruiterB = oid(6), jobId = oid(7), templateId = oid(8);
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const chain = data => ({ select() { return this; }, populate() { return this; }, sort() { return this; }, limit() { return this; }, async lean() { return data; } });

function load() {
  const handlers = {}, middleware = [], dispatches = [], messages = [];
  const team = [{ _id: recruiterA, name: 'First recruiter', email: 'first@example.com', designation: 'Recruiter' }, { _id: recruiterB, name: 'Later recruiter', email: 'later@example.com', designation: 'Recruiter' }];
  const job = { _id: jobId, clientId: { _id: clientId, companyName: 'Client' }, title: 'Developer', status: 'Open', assignedRecruiters: [recruiterA, recruiterB] };
  let allowed = true, mailboxAvailable = true, failInsert = false, replyAccess = true, userResults = [team];
  const userQueries = [];
  const router = { use(...args) { middleware.push(...args); }, get(url, handler) { handlers[`GET ${url}`] = handler; }, post(url, handler) { handlers[`POST ${url}`] = handler; } };
  const template = { _id: templateId, name: 'Two steps', steps: [{ subject: 'Hi {{candidateName}}', body: 'From {{recruiterName}}' }, { subject: 'Follow up', body: 'More details' }] };
  const dependencies = {
    express: { Router: () => router }, mongoose, 'node:crypto': require('node:crypto'),
    '../middleware/authMiddleware': { protect: (_req, _res, next) => next() },
    '../models/Users': { find: query => { const position = userQueries.length; userQueries.push(query); return chain(userResults[position] || []); } },
    '../models/Jobs': { exists: async () => allowed, find: () => chain([job]) },
    '../models/SourcedCandidate': { find: () => chain([{ _id: laterId, recruiterId: recruiterB, requirementId: jobId, name: 'Later', email: ' PERSON@example.com ', createdAt: '2026-10-02' }, { _id: firstId, recruiterId: recruiterA, requirementId: jobId, name: 'First', email: 'person@example.com', createdAt: '2026-10-01' }]) },
    '../models/CandidatesByJob': { find: () => chain([]) },
    '../models/EmailSuppression': { find: () => chain([]) },
    '../models/ClientEmailSequence': { find: () => chain([template]), create: async data => data },
    '../models/ClientEmailDispatch': {
      init: async () => {}, find: () => chain([...dispatches]),
      create: async data => {
        if (dispatches.some(item => String(item.clientId) === String(data.clientId) && item.email === data.email)) throw Object.assign(Error('Duplicate'), { code: 11000 });
        const item = { ...data, _id: oid(100 + dispatches.length), state: 'preparing' }; dispatches.push(item); return item;
      },
      updateOne: async (filter, update) => Object.assign(dispatches.find(item => item._id === filter._id), update.$set),
      findOne: () => chain(dispatches[0]),
    },
    '../models/Communication': {
      find: () => chain([]),
      insertMany: async data => { if (failInsert) throw Error('Database unavailable'); messages.push(...data); },
      updateMany: async (filter, update) => { for (const message of messages.filter(item => item.clientDispatchId === filter.clientDispatchId)) Object.assign(message, update.$set); },
    },
    '../services/emailSequences': sequences,
    '../services/teamEmailSequences': policy,
    '../services/userEmailService': { getUserEmailOptions: async () => { if (!mailboxAvailable) throw Error('Missing mailbox'); } },
    '../services/microsoftMailService': { assertReplyDetection: async () => { if (!replyAccess) throw Object.assign(Error('Read consent required'), { code: 'MICROSOFT_READ_CONSENT_REQUIRED' }); } },
    '../services/emailSuppression': { assertNotSuppressed: async () => {}, unsubscribeUrl: () => 'https://example.com/unsubscribe' },
    '../utils/emailSchedule': { scheduleForStep: step => new Date(2026, 10, 1 + step) },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/TeamEmailroutes.js'), 'utf8'), { require: name => { if (!(name in dependencies)) throw Error(name); return dependencies[name]; }, module: { exports: {} }, console, Date, Map, Set });
  const request = () => ({ user: actor, params: { clientId }, emailTeam: team, emailJobScope: {}, body: { candidateIds: [firstId, laterId], templateKey: templateId } });
  return { handlers, middleware, dispatches, messages, request, userQueries, setUserResults: value => { userResults = value; }, setAllowed: value => { allowed = value; }, setReplyAccess: value => { replyAccess = value; }, setMailbox: value => { mailboxAvailable = value; }, setFailInsert: value => { failInsert = value; } };
}

test('manager team follows primary/secondary reporting mentors instead of granting company-wide mailbox access', async () => {
  const app = load(), mentor = { _id: oid(20), designation: 'Mentor' };
  app.setUserResults([[mentor, { _id: recruiterA, designation: 'Recruiter' }], [{ _id: recruiterB, designation: 'Recruiter' }]]);
  const req = { user: actor }; let proceeded = false;
  await app.middleware[1](req, response(), () => { proceeded = true; });
  assert.equal(proceeded, true);
  assert.deepEqual(Array.from(req.emailTeam, member => member._id), [recruiterA, recruiterB]);
  assert.equal(app.userQueries[0].$or[0].reporter, actor._id);
  assert.equal(app.userQueries[0].$or[1].secondary_managers, actor._id);
  assert.deepEqual(Array.from(app.userQueries[1].$or[0].reporter.$in), [mentor._id]);
  assert.deepEqual(Array.from(app.userQueries[1].$or[1].secondary_managers.$in), [mentor._id]);
});

test('only active mentors/managers can access team email; recruiters and admins cannot initiate', async () => {
  const { middleware } = load();
  for (const designation of ['Recruiter', 'Finance', 'Admin']) {
    const res = response(); let next = false;
    await middleware[1]({ user: { designation } }, res, () => { next = true; });
    assert.equal(res.code, 403); assert.equal(next, false);
  }
  const res = response();
  await middleware[1]({ user: { ...actor, isDisabled: true } }, res, () => assert.fail());
  assert.equal(res.code, 401);
});

test('team mailbox list excludes disabled recruiters without transferring their contact ownership', async () => {
  const app = load();
  const req = app.request();
  req.emailTeam[0].isDisabled = true;
  const res = response();
  await app.handlers['GET /clients/:clientId/preview'](req, res);
  assert.equal(res.code, 200);
  assert.deepEqual(Array.from(res.body.mailboxes, mailbox => mailbox._id), [recruiterB]);
  const first = res.body.contacts.find(contact => contact.candidateId === firstId);
  const later = res.body.contacts.find(contact => contact.candidateId === laterId);
  assert.equal(first.eligible, false);
  assert.equal(first.reason, 'Recruiter account is disabled');
  assert.equal(later.eligible, false);
  assert.match(later.reason, /Duplicate/);
});

test('batch queues one sequence using the first recruiter identity and preserves the manager actor', async () => {
  const app = load(), res = response();
  await app.handlers['POST /clients/:clientId/start'](app.request(), res);
  assert.equal(res.code, 200); assert.equal(res.body.queued, 1); assert.equal(res.body.skipped, 1);
  assert.equal(app.messages.length, 2);
  for (const message of app.messages) {
    assert.equal(message.recruiterId, recruiterA); assert.equal(message.initiatedBy, actor._id); assert.equal(message.recipient, 'person@example.com'); assert.equal(message.status, 'scheduled');
  }
  assert.equal(app.messages[0].subject, 'Hi First'); assert.equal(app.messages[0].body, 'From First recruiter');
});

test('simultaneous submissions and later batches cannot enroll a client email twice', async () => {
  const app = load();
  await Promise.all([1, 2].map(async () => { const res = response(); await app.handlers['POST /clients/:clientId/start'](app.request(), res); assert.equal(res.code, 200); }));
  assert.equal(app.dispatches.length, 1); assert.equal(app.messages.length, 2);
  const res = response(); await app.handlers['POST /clients/:clientId/start'](app.request(), res);
  assert.equal(res.body.queued, 0); assert.equal(app.messages.length, 2);
});

test('missing mailbox is skipped without any reservation; outsider client/contact and invalid templates fail before writes', async () => {
  const app = load(); app.setMailbox(false);
  let res = response(); await app.handlers['POST /clients/:clientId/start'](app.request(), res);
  assert.equal(res.body.queued, 0); assert.equal(app.dispatches.length, 0);
  app.setMailbox(true); app.setAllowed(false); res = response(); await app.handlers['POST /clients/:clientId/start'](app.request(), res); assert.equal(res.code, 403);
  app.setAllowed(true); const req = app.request(); req.body.candidateIds = [oid(999)]; res = response(); await app.handlers['POST /clients/:clientId/start'](req, res); assert.equal(res.code, 403);
  req.body = { candidateIds: [firstId], templateKey: 'foreign-template' }; res = response(); await app.handlers['POST /clients/:clientId/start'](req, res); assert.equal(res.code, 400);
  assert.equal(app.dispatches.length, 0); assert.equal(app.messages.length, 0);
});

test('failed preparation is recorded and cannot silently create a second sequence', async () => {
  const app = load(); app.setFailInsert(true); const res = response();
  await app.handlers['POST /clients/:clientId/start'](app.request(), res);
  assert.equal(res.body.queued, 0); assert.equal(app.dispatches[0].state, 'failed'); assert.equal(app.messages.length, 0);
});

test('manager stop holds remaining steps and retains the client claim against future batches', async () => {
  const app = load();
  await app.handlers['POST /clients/:clientId/start'](app.request(), response());
  const req = app.request(); req.params.dispatchId = app.dispatches[0]._id;
  const res = response();
  await app.handlers['POST /clients/:clientId/sequences/:dispatchId/stop'](req, res);
  assert.equal(res.code, 200); assert.equal(app.dispatches[0].state, 'stopped');
  assert.ok(app.messages.every(message => message.status === 'stopped' && message.stopReason === 'manager_stop'));
  const retry = response(); await app.handlers['POST /clients/:clientId/start'](app.request(), retry);
  assert.equal(retry.body.queued, 0); assert.equal(app.dispatches.length, 1);
});

test('sequence templates reject empty content and more than five steps', async () => {
  const app = load();
  for (const steps of [[], Array(6).fill({ subject: 'Subject', body: 'Body' }), [{ subject: '', body: 'Body' }]]) {
    const req = app.request(); req.body = { name: 'Template', steps }; const res = response();
    await app.handlers['POST /clients/:clientId/templates'](req, res); assert.equal(res.code, 400);
  }
});

test('sending connection without reply consent is identified as missing Mail.Read, not disconnected', async () => {
  const app = load(); app.setReplyAccess(false);
  const res = response();
  await app.handlers['GET /clients/:clientId/preview'](app.request(), res);
  assert.equal(res.code, 200);
  assert.equal(res.body.mailboxes[0].ready, false);
  assert.match(res.body.mailboxes[0].reason, /connected for sending/);
  assert.match(res.body.mailboxes[0].reason, /Mail.Read/);
  assert.doesNotMatch(res.body.mailboxes[0].reason, /Mailbox connection needed/);
});
