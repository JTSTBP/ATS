const Communication = require('../models/Communication');
const EmailEnrollment = require('../models/EmailEnrollment');
const { listMailboxMessages } = require('./microsoftMailService');
const { pendingStatuses, normalizeEmail } = require('./emailSuppression');
const header = (message, name) => (message.internetMessageHeaders || []).find(item => item.name.toLowerCase() === name)?.value || '';
function findSequenceReply(sentMessages, incoming, sequenceId, recipient, startedAt) {
  const originals = sentMessages.filter(message => header(message, 'x-ats-sequence-id') === sequenceId && (message.toRecipients || []).some(item => normalizeEmail(item.emailAddress?.address) === normalizeEmail(recipient)));
  const conversations = new Set(originals.map(message => message.conversationId).filter(Boolean));
  const ids = new Set(originals.map(message => message.internetMessageId).filter(Boolean));
  const senders = new Set(originals.map(message => normalizeEmail(message.from?.emailAddress?.address)).filter(Boolean));
  return incoming.find(message => {
    const from = normalizeEmail(message.from?.emailAddress?.address);
    return from && !senders.has(from) && !ids.has(message.internetMessageId) && new Date(message.receivedDateTime) >= new Date(startedAt) && (conversations.has(message.conversationId) || header(message, 'in-reply-to').split(/\s+/).some(id => ids.has(id)) || header(message, 'references').split(/\s+/).some(id => ids.has(id)));
  }) || null;
}
async function checkSequenceReplies(item, mailbox) {
  const sent = await Communication.find({ sequenceId: item.sequenceId, recruiterId: item.recruiterId, status: 'sent' }).sort({ sentAt: 1 }).lean();
  if (!sent.length) return true;
  const since = new Date(new Date(sent[0].sentAt).getTime() - 60000);
  const [sentMessages, incoming] = mailbox ? await mailbox() : await Promise.all([listMailboxMessages(item.recruiterId, 'sentitems', since), listMailboxMessages(item.recruiterId, 'all', since)]);
  // A missing Sent Items copy cannot prove that there was no reply.
  if (!sentMessages.some(message => header(message, 'x-ats-sequence-id') === item.sequenceId)) throw Object.assign(new Error('Waiting for Outlook Sent Items correlation before sending another follow-up'), { code: 'REPLY_CORRELATION_PENDING' });
  const reply = findSequenceReply(sentMessages, incoming, item.sequenceId, item.recipient, sent[0].sentAt);
  const scope = { sequenceId: item.sequenceId, recruiterId: item.recruiterId };
  await Communication.updateMany(scope, { $set: { replyCheckedAt: new Date(), replyCheckError: '', ...(reply ? { replyDetectedAt: new Date(reply.receivedDateTime) } : {}) } });
  if (reply) await Communication.updateMany({ ...scope, status: { $in: pendingStatuses } }, { $set: { status: 'stopped', stoppedAt: new Date(), stopReason: 'replied' } });
  if (reply) await EmailEnrollment.deleteOne({ sequenceId: item.sequenceId });
  return !reply;
}
async function pollSequenceReplies() {
  const active = await Communication.find({ detectReplies: true, status: 'scheduled' }).sort({ scheduledAt: 1 }).limit(500).lean();
  const mailboxes = new Map();
  for (const item of active) {
    const key = String(item.recruiterId);
    if (!mailboxes.has(key)) mailboxes.set(key, []);
    mailboxes.get(key).push(item);
  }
  for (const items of mailboxes.values()) {
    const since = new Date(Math.min(...items.map(item => new Date(item.createdAt).getTime())) - 60000);
    let request;
    // Fetch each recruiter's mailbox once per poll, rather than once per candidate.
    const mailbox = () => request ||= Promise.all([listMailboxMessages(items[0].recruiterId, 'sentitems', since), listMailboxMessages(items[0].recruiterId, 'all', since)]);
    const seen = new Set();
    for (const item of items) {
      if (seen.has(item.sequenceId)) continue;
      seen.add(item.sequenceId);
      try { await checkSequenceReplies(item, mailbox); }
      catch (error) { await Communication.updateMany({ sequenceId: item.sequenceId, recruiterId: item.recruiterId }, { $set: { replyCheckError: error.message, replyCheckedAt: new Date() } }); }
    }
  }
}
module.exports = { findSequenceReply, checkSequenceReplies, pollSequenceReplies };
