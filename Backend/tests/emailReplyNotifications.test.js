const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function load() {
  const handlers = {}, middleware = [], queries = [];
  let matchedCount = 1;
  const router = { use(...args) { middleware.push(...args); }, get(route, handler) { handlers['GET ' + route] = handler; }, post(route, handler) { handlers['POST ' + route] = handler; } };
  const chain = value => ({ select() { return this; }, lean: async () => value });
  const dependencies = {
    express: { Router: () => router },
    '../middleware/authMiddleware': { protect: (_req, _res, next) => next() },
    '../models/Communication': {
      aggregate: async pipeline => { queries.push(pipeline[0].$match); return [{ items: [{ _id: 'client-sequence', candidateId: 'candidate', requirementId: 'job', recipient: 'candidate@example.com', receivedAt: new Date(), readAt: null, body: 'must not be returned' }], unread: [{ count: 1 }] }]; },
      updateMany: async (filter, update) => { queries.push({ filter, update }); return { matchedCount }; },
    },
    '../models/Jobs': { find: () => chain([{ _id: 'job', title: 'Area Manager' }]) },
    '../models/SourcedCandidate': { find: () => chain([{ _id: 'candidate', name: 'Sarun' }]) },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/EmailReplyNotificationroutes.js'), 'utf8'), { module: { exports: {} }, require: name => { if (!(name in dependencies)) throw Error(name); return dependencies[name]; }, Date, console });
  return { handlers, middleware, queries, missing: () => { matchedCount = 0; } };
}
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, set() { return this; }, json(body) { this.body = body; return this; } });
const request = () => ({ user: { _id: 'owner' }, params: { sequenceId: 'client-sequence' }, body: { userId: 'someone-else' } });

test('reply notifications are restricted to the signed-in mailbox owner and contain no email content', async () => {
  const app = load(), res = response();
  await app.handlers['GET /'](request(), res);
  assert.equal(res.code, 200);
  assert.equal(app.queries[0].recruiterId, 'owner');
  assert.equal(res.body.unreadCount, 1);
  assert.equal(res.body.notifications[0].candidateName, 'Sarun');
  assert.equal(res.body.notifications[0].requirementTitle, 'Area Manager');
  assert.equal(res.body.notifications[0].recipient, 'candidate@example.com');
  assert.equal('body' in res.body.notifications[0], false);
  assert.equal('subject' in res.body.notifications[0], false);
});

test('marking one or all reply notifications read is scoped to the authenticated owner', async () => {
  const app = load();
  for (const route of ['POST /:sequenceId/read', 'POST /read-all']) {
    const res = response(); await app.handlers[route](request(), res);
    assert.equal(res.code, 200);
    assert.equal(app.queries.at(-1).filter.recruiterId, 'owner');
    assert.ok(app.queries.at(-1).update.$set.replyNotificationReadAt instanceof Date);
  }
  app.missing(); const res = response(); await app.handlers['POST /:sequenceId/read'](request(), res);
  assert.equal(res.code, 404);
});

test('missing or disabled accounts cannot read reply alerts, and invalid sequence IDs cannot be acknowledged', async () => {
  const app = load();
  for (const user of [undefined, { _id: 'owner', isDisabled: true }]) {
    const res = response(); app.middleware[1]({ user }, res, () => assert.fail()); assert.equal(res.code, 401);
  }
  const req = request(); req.params.sequenceId = 'bad/id'; const res = response();
  await app.handlers['POST /:sequenceId/read'](req, res); assert.equal(res.code, 400);
  assert.equal(app.queries.length, 0);
});
