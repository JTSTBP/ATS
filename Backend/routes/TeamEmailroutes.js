const router = require('express').Router();
const mongoose = require('mongoose');
const crypto = require('node:crypto');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/Users');
const Job = require('../models/Jobs');
const SourcedCandidate = require('../models/SourcedCandidate');
const CandidateByJob = require('../models/CandidatesByJob');
const Communication = require('../models/Communication');
const EmailSuppression = require('../models/EmailSuppression');
const ClientEmailSequence = require('../models/ClientEmailSequence');
const ClientEmailDispatch = require('../models/ClientEmailDispatch');
const { getEmailSequences, validateEmailSequences } = require('../services/emailSequences');
const { getUserEmailOptions } = require('../services/userEmailService');
const { assertReplyDetection } = require('../services/microsoftMailService');
const { assertNotSuppressed, unsubscribeUrl } = require('../services/emailSuppression');
const { scheduleForStep } = require('../utils/emailSchedule');
const { selectClientContacts, normalizeEmail, id } = require('../services/teamEmailSequences');

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const objectId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) && mongoose.Types.ObjectId.isValid(value);
const field = (candidate, keys) => {
  for (const source of [candidate, candidate.dynamicFields || {}]) {
    for (const key of keys) if (source[key] != null && String(source[key]).trim()) return String(source[key]).trim();
  }
  return '';
};
const render = (text, variables) => String(text || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => variables[key] || '');

router.use(protect, async (req, res, next) => {
  if (!req.user || req.user.isDisabled) return res.status(401).json({ message: 'Unauthorized' });
  if (!['Mentor', 'Manager'].includes(req.user.designation)) return res.status(403).json({ message: 'Only mentors and managers can manage team email sequences' });
  try {
    const direct = await User.find({ $or: [{ reporter: req.user._id }, { secondary_managers: req.user._id }] }).select('_id name email designation reporter secondary_managers isDisabled').lean();
    const mentors = req.user.designation === 'Manager' ? direct.filter(member => member.designation === 'Mentor' && !member.isDisabled).map(member => member._id) : [];
    const indirect = mentors.length ? await User.find({ designation: 'Recruiter', $or: [{ reporter: { $in: mentors } }, { secondary_managers: { $in: mentors } }] }).select('_id name email designation isDisabled').lean() : [];
    req.emailTeam = [...new Map([...direct, ...indirect].filter(member => member.designation === 'Recruiter').map(member => [id(member._id), member])).values()];
    req.emailJobScope = { $or: [{ CreatedBy: req.user._id }, { assignedMentors: { $in: [req.user._id, ...mentors] } }, { assignedRecruiters: { $in: req.emailTeam.map(member => member._id) } }] };
    next();
  } catch { res.status(500).json({ message: 'Unable to load your email team' }); }
});

const endpoint = handler => async (req, res) => {
  try { await handler(req, res); }
  catch (error) { console.error('Team email:', error.message); res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to process team email. Please retry or contact your administrator.' }); }
};

async function clientJobs(req) {
  if (!objectId(req.params.clientId)) fail(400, 'Invalid client');
  if (!await Job.exists({ clientId: req.params.clientId, ...req.emailJobScope })) fail(403, 'Client is outside your team');
  // Ownership is determined across the whole client, including contacts outside the actor's team.
  return Job.find({ clientId: req.params.clientId }).populate('clientId', 'companyName name clientName').lean();
}

async function loadPlan(req, jobs) {
  const jobIds = jobs.map(job => job._id);
  const [sourced, lineup, suppressed, dispatches, previous] = await Promise.all([
    SourcedCandidate.find({ requirementId: { $in: jobIds } }).limit(10001).lean(),
    CandidateByJob.find({ jobId: { $in: jobIds } }).limit(10001).lean(),
    EmailSuppression.find({}).select('email').lean(),
    ClientEmailDispatch.find({ clientId: req.params.clientId }).select('email').lean(),
    Communication.find({ requirementId: { $in: jobIds }, channel: 'EMAIL', status: { $in: ['sent', 'pending', 'scheduled'] } }).select('recipient').lean(),
  ]);
  if (sourced.length + lineup.length > 10000) fail(413, 'This client has more than 10,000 contacts. Contact your administrator before sending; no partial duplicate check was performed.');
  const jobMap = new Map(jobs.map(job => [id(job._id), job]));
  const contacts = [...new Map([...sourced, ...lineup].map(candidate => [id(candidate._id), {
    ...candidate,
    recruiterId: candidate.recruiterId || candidate.createdBy,
    requirementId: candidate.requirementId || candidate.jobId,
    email: field(candidate, ['email', 'Email']),
    name: field(candidate, ['name', 'candidateName', 'CandidateName', 'Name']),
    createdAt: candidate.sourceCreatedAt || candidate.createdAt,
    uncertainDate: !candidate.sourceCreatedAt && String(candidate.notes || '').includes('Converted to lineup from Follow-ups'),
    closed: jobMap.get(id(candidate.requirementId || candidate.jobId))?.status !== 'Open',
  }])).values()];
  const mailboxErrors = new Map();
  for (const member of req.emailTeam) {
    if (member.isDisabled) { mailboxErrors.set(id(member._id), 'Recruiter account is disabled'); continue; }
    try { await getUserEmailOptions(member._id); await assertReplyDetection(member._id); }
    catch { mailboxErrors.set(id(member._id), 'Mailbox connection needed — recruiter must connect Microsoft 365 with reply access'); }
  }
  const rows = selectClientContacts({ contacts, teamIds: req.emailTeam.map(member => member._id), mailboxErrors, suppressed: new Set(suppressed.map(item => normalizeEmail(item.email))), contacted: new Set([...dispatches.map(item => normalizeEmail(item.email)), ...previous.map(item => normalizeEmail(item.recipient))]) });
  const members = new Map(req.emailTeam.map(member => [id(member._id), member]));
  for (const row of rows) {
    row.recruiterName = members.get(row.recruiterId)?.name || 'Recruiter';
    row.senderEmail = members.get(row.recruiterId)?.email || '';
    row.requirementTitle = jobMap.get(row.requirementId)?.title || '';
  }
  return { contacts, rows, members, mailboxErrors };
}

async function templatesFor(req, jobs) {
  const saved = await ClientEmailSequence.find({ clientId: req.params.clientId }).sort({ name: 1 }).lean();
  return [
    ...saved.map(template => ({ key: id(template._id), name: template.name, steps: template.steps })),
    ...jobs.filter(job => job.status === 'Open' && job.assignedRecruiters?.some(member => req.emailTeam.some(recruiter => id(recruiter._id) === id(member)))).flatMap(job => getEmailSequences(job.communicationTemplates || []).map(sequence => ({ key: `${job._id}:${sequence.name}`, name: `${job.title} — ${sequence.name}`, steps: sequence.templates.map(template => ({ subject: template.subject, body: template.body })) }))),
  ];
}

router.get('/clients', endpoint(async (req, res) => {
  const jobs = await Job.find(req.emailJobScope).select('clientId').populate('clientId', 'companyName name clientName').lean();
  const clients = [...new Map(jobs.filter(job => job.clientId?._id).map(job => [id(job.clientId), { _id: id(job.clientId), name: job.clientId.companyName || job.clientId.clientName || job.clientId.name || 'Client' }])).values()];
  res.json({ clients });
}));

router.get('/clients/:clientId/preview', endpoint(async (req, res) => {
  const jobs = await clientJobs(req);
  const { rows, mailboxErrors } = await loadPlan(req, jobs);
  const templates = await templatesFor(req, jobs);
  const dispatches = await ClientEmailDispatch.find({ clientId: req.params.clientId, recruiterId: { $in: req.emailTeam.map(member => member._id) } }).sort({ createdAt: -1 }).limit(100).lean();
  const messages = await Communication.find({ clientDispatchId: { $in: dispatches.map(dispatch => dispatch._id) } }).select('clientDispatchId status stopReason replyCheckError sentAt').lean();
  const sequences = dispatches.map(dispatch => ({ _id: dispatch._id, email: dispatch.email, name: dispatch.sequenceName, createdAt: dispatch.createdAt, state: dispatch.state, steps: messages.filter(message => id(message.clientDispatchId) === id(dispatch._id)).map(message => ({ status: message.status, stopReason: message.stopReason, replyCheckError: message.replyCheckError })) }));
  res.json({ contacts: rows, templates, sequences, mailboxes: req.emailTeam.map(member => ({ _id: member._id, name: member.name, email: member.email, ready: !mailboxErrors.has(id(member._id)), reason: mailboxErrors.get(id(member._id)) || '' })) });
}));

router.post('/clients/:clientId/templates', endpoint(async (req, res) => {
  await clientJobs(req);
  const { name, steps } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100 || !Array.isArray(steps) || steps.length < 1 || steps.length > 5) fail(400, 'Provide a sequence name and one to five email steps');
  if (steps.some(step => !step || typeof step.subject !== 'string' || typeof step.body !== 'string' || step.subject.length > 500 || step.body.length > 20000)) fail(400, 'Each email needs a subject (up to 500 characters) and message (up to 20,000 characters)');
  validateEmailSequences(steps.map((step, index) => ({ ...step, channel: 'EMAIL', label: `Email ${index + 1}`, sequenceName: name.trim() })));
  const template = await ClientEmailSequence.create({ clientId: req.params.clientId, name: name.trim(), steps: steps.map(step => ({ subject: step.subject.trim(), body: step.body.trim() })), createdBy: req.user._id });
  res.status(201).json({ template });
}));

router.post('/clients/:clientId/start', endpoint(async (req, res) => {
  const { candidateIds, templateKey } = req.body || {};
  if (!Array.isArray(candidateIds) || !candidateIds.length || candidateIds.length > 500 || candidateIds.some(value => !objectId(value)) || new Set(candidateIds).size !== candidateIds.length || typeof templateKey !== 'string') fail(400, 'Select one sequence and 1–500 unique contacts');
  const jobs = await clientJobs(req);
  const template = (await templatesFor(req, jobs)).find(item => item.key === templateKey);
  if (!template) fail(400, 'Select a sequence saved for this client');
  validateEmailSequences(template.steps.map((step, index) => ({ ...step, channel: 'EMAIL', label: `Email ${index + 1}`, sequenceName: 'Selected' })));
  if (!template.steps.length) fail(400, 'The sequence has no email steps');
  const plan = await loadPlan(req, jobs);
  const rows = new Map(plan.rows.map(row => [row.candidateId, row]));
  if (candidateIds.some(candidateId => !rows.has(candidateId))) fail(403, 'One or more contacts are outside your team or client');
  // Validate global configuration before creating any permanent contact claims.
  unsubscribeUrl('setup-check@example.com');
  await ClientEmailDispatch.init();
  const jobMap = new Map(jobs.map(job => [id(job._id), job]));
  const contacts = new Map(plan.contacts.map(contact => [id(contact._id), contact]));
  const results = [];
  for (const candidateId of candidateIds) {
    const row = rows.get(candidateId);
    if (!row.eligible) { results.push({ candidateId, email: row.email, status: 'skipped', reason: row.reason }); continue; }
    let dispatch;
    try {
      await assertNotSuppressed(row.email);
      await getUserEmailOptions(row.recruiterId);
      await assertReplyDetection(row.recruiterId);
      const sequenceId = `client-${crypto.randomUUID()}`;
      // A database unique index arbitrates concurrent clicks and overlapping teams.
      dispatch = await ClientEmailDispatch.create({ clientId: req.params.clientId, email: row.email, candidateId, recruiterId: row.recruiterId, initiatedBy: req.user._id, sequenceId, sequenceName: template.name });
      const candidate = contacts.get(candidateId);
      const job = jobMap.get(row.requirementId);
      const recruiter = plan.members.get(row.recruiterId);
      const variables = { candidateName: row.name, profileName: row.name, name: row.name, recruiterName: recruiter.name, jobTitle: job.title, companyName: job.clientId?.companyName || job.clientId?.clientName || job.clientId?.name || 'our client', location: (job.location || []).map(item => item.name).join(', '), experience: field(candidate, ['experience', 'Experience']), salary: [job.salary?.currency, job.salary?.min, job.salary?.max].filter(Boolean).join(' ') };
      const startedAt = new Date();
      await Communication.insertMany(template.steps.map((step, index) => ({ candidateId, requirementId: row.requirementId, recruiterId: row.recruiterId, initiatedBy: req.user._id, clientDispatchId: dispatch._id, channel: 'EMAIL', recipient: row.email, subject: render(step.subject, variables), body: render(step.body, variables), sequenceId, sequenceName: template.name, sequenceStep: index, detectReplies: true, idempotencyKey: `${sequenceId}-${index}`, status: 'generated', scheduledAt: scheduleForStep(index, startedAt) })));
      await Communication.updateMany({ clientDispatchId: dispatch._id, status: 'generated' }, { $set: { status: 'scheduled', reviewedAt: startedAt } });
      await ClientEmailDispatch.updateOne({ _id: dispatch._id }, { $set: { state: 'queued' } });
      results.push({ candidateId, email: row.email, status: 'queued', sequenceId, senderEmail: row.senderEmail });
    } catch (error) {
      if (dispatch) {
        await Communication.updateMany({ clientDispatchId: dispatch._id, status: { $in: ['generated', 'scheduled'] } }, { $set: { status: 'stopped', stoppedAt: new Date(), stopReason: 'batch_setup_failed' } });
        await ClientEmailDispatch.updateOne({ _id: dispatch._id }, { $set: { state: 'failed' } });
      }
      results.push({ candidateId, email: row.email, status: 'skipped', reason: error.code === 11000 ? 'Already enrolled for this client' : dispatch ? 'Scheduling failed; contact your administrator before retrying' : error.status ? error.message : 'Mailbox or suppression check failed; no email queued' });
    }
  }
  res.json({ results, queued: results.filter(result => result.status === 'queued').length, skipped: results.filter(result => result.status === 'skipped').length });
}));

router.post('/clients/:clientId/sequences/:dispatchId/stop', endpoint(async (req, res) => {
  await clientJobs(req);
  if (!objectId(req.params.dispatchId)) fail(400, 'Invalid sequence');
  const dispatch = await ClientEmailDispatch.findOne({ _id: req.params.dispatchId, clientId: req.params.clientId, recruiterId: { $in: req.emailTeam.map(member => member._id) } }).lean();
  if (!dispatch) fail(404, 'Sequence not found in your team');
  await Communication.updateMany({ clientDispatchId: dispatch._id, status: { $in: ['generated', 'reviewed', 'scheduled', 'pending', 'failed'] } }, { $set: { status: 'stopped', stoppedAt: new Date(), stopReason: 'manager_stop' } });
  await ClientEmailDispatch.updateOne({ _id: dispatch._id }, { $set: { state: 'stopped' } });
  res.json({ success: true });
}));

module.exports = router;
