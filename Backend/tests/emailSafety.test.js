const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(file, dependencies) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../services', file), 'utf8'), { module, URL, process, Date, require(name) { if (!(name in dependencies)) throw Error(name); return dependencies[name]; } });
  return module.exports;
}
const normalizeEmail = email => String(email || '').trim().toLowerCase();
const pendingStatuses = ['generated', 'reviewed', 'scheduled', 'pending', 'failed'];
const sent = { from: { emailAddress: { address: 'recruiter@example.com' } }, toRecipients: [{ emailAddress: { address: 'candidate@example.com' } }], conversationId: 'thread', internetMessageId: '<first>', internetMessageHeaders: [{ name: 'X-ATS-Sequence-ID', value: 'seq' }] };
const reply = { from: { emailAddress: { address: 'Candidate@example.com' } }, conversationId: 'thread', receivedDateTime: '2026-10-30T10:00:00Z', internetMessageHeaders: [] };
test('any incoming response in the sequence thread stops follow-ups, including automatic replies', () => {
  const { findSequenceReply } = load('emailReplyDetection.js', { '../models/Communication': {}, '../models/EmailEnrollment': {}, './microsoftMailService': {}, './emailSuppression': { normalizeEmail, pendingStatuses } });
  const match = incoming => findSequenceReply([sent], incoming, 'seq', 'candidate@example.com', '2026-10-29T10:00:00Z');
  assert.equal(match([reply]), reply);
  assert.equal(match([{ ...reply, conversationId: 'different' }]), null);
  assert.ok(match([{ ...reply, from: { emailAddress: { address: 'other@example.com' } } }]));
  assert.equal(match([{ ...reply, from: { emailAddress: { address: 'recruiter@example.com' } } }]), null);
  assert.equal(match([{ ...reply, internetMessageId: '<first>' }]), null);
  assert.equal(match([{ ...reply, receivedDateTime: '2026-10-28T10:00:00Z' }]), null);
  assert.ok(match([{ ...reply, internetMessageHeaders: [{ name: 'Auto-Submitted', value: 'auto-replied' }] }]));
  assert.ok(match([{ ...reply, conversationId: 'different', internetMessageHeaders: [{ name: 'In-Reply-To', value: '<first>' }] }]));
});
test('reply check stops the sequence and releases enrollment; missing correlation fails closed', async () => {
  const changes = [];
  let correlate = true;
  let released = false;
  const service = load('emailReplyDetection.js', {
    '../models/Communication': { find: () => ({ sort: () => ({ lean: async () => [{ sentAt: '2026-10-29T10:00:00Z' }] }) }), updateMany: async (filter, update) => changes.push({ filter, update }) },
    '../models/EmailEnrollment': { deleteOne: async () => { released = true; } },
    './emailSuppression': { normalizeEmail, pendingStatuses },
    './microsoftMailService': { listMailboxMessages: async (_user, folder) => folder === 'sentitems' ? correlate ? [sent] : [] : [reply] },
  });
  const item = { sequenceId: 'seq', recruiterId: 'r', recipient: 'candidate@example.com' };
  assert.equal(await service.checkSequenceReplies(item), false);
  assert.equal(changes.at(-1).update.$set.stopReason, 'replied');
  assert.equal(released, true);
  correlate = false;
  await assert.rejects(service.checkSequenceReplies(item), { code: 'REPLY_CORRELATION_PENDING' });
});
test('suppression normalizes addresses, stops pending emails globally, and enforces at send time', async () => {
  let stored;
  let stopped;
  const service = load('emailSuppression.js', {
    jsonwebtoken: {}, '../models/EmailEnrollment': { deleteMany: async () => {} },
    '../models/EmailSuppression': { findOne: () => ({ lean: async () => stored }), updateOne: async (filter, update) => { stored = { ...filter, ...update.$set }; } },
    '../models/Communication': { updateMany: async (filter, update) => { stopped = { filter, update }; } },
  });
  await service.assertNotSuppressed('candidate@example.com');
  await service.suppressEmail(' CANDIDATE@example.com ', 'unsubscribed', 'admin');
  assert.equal(stored.email, 'candidate@example.com');
  assert.equal(stopped.filter.recruiterId, undefined);
  assert.ok(stopped.filter.status.$in.includes('pending'));
  assert.equal(stopped.update.$set.status, 'stopped');
  await assert.rejects(service.assertNotSuppressed('candidate@example.com'), { code: 'EMAIL_SUPPRESSED' });
  await assert.rejects(service.suppressEmail('invalid', 'manual'));
  await assert.rejects(service.suppressEmail('candidate@example.com', 'untrusted-reason'));
});
