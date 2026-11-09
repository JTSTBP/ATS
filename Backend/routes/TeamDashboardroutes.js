const router = require('express').Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/Users');
const Candidate = require('../models/CandidatesByJob');
const Source = require('../models/SourcedCandidate');
const Job = require('../models/Jobs');
const Activity = require('../models/activitylog');
const Attendance = require('../models/Attendance');
const State = require('../models/SupervisorState');
const logActivity = require('./logactivity');
const { idOf, productiveActions, scopedStaff, recruiterRow } = require('../services/teamDashboard');
const { istDay } = require('../services/recruiterTargets');
const { reassignMandate } = require('../services/reassignMandate');
router.use(protect, (req, res, next) => {
 if (!req.user || req.user.isDisabled) return res.status(401).json({ message: 'Unauthorized' });
 next();
});
router.get('/inbox', async (req, res) => {
 try { const record = await State.findOne({ recruiterId: req.user._id }).populate('pings.from', 'name designation').lean(); const pings = (record?.pings || []).slice().reverse(); res.json({ pings, unreadCount: pings.filter(p => !p.readAt).length }); }
 catch { res.status(500).json({ message: 'Unable to load internal pings' }); }
});
router.post('/inbox/:id/read', async (req, res) => {
 if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ping' });
 try { const record = await State.findOneAndUpdate({ recruiterId: req.user._id, 'pings._id': req.params.id }, { $set: { 'pings.$.readAt': new Date() } }); if (!record) return res.status(404).json({ message: 'Ping not found' }); res.json({ success: true }); }
 catch { res.status(500).json({ message: 'Unable to acknowledge ping' }); }
});
router.use(async (req, res, next) => {
 if (!['Mentor', 'Manager'].includes(req.user.designation)) return res.status(403).json({ message: 'Supervisor access required' });
 try {
  const users = await User.find({ isDisabled: { $ne: true } }).select('_id name designation reporter secondary_managers dateOfJoining joinDate').lean();
  req.teamStaff = scopedStaff(req.user, users); req.teamRecruiters = req.teamStaff.filter(u => u.designation === 'Recruiter' && idOf(u) !== idOf(req.user)); next();
 } catch { res.status(500).json({ message: 'Unable to resolve your team' }); }
});
router.get('/', async (req, res) => {
 try {
  const now = new Date(), date = req.query.date || istDay(now);
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date > istDay(now)) return res.status(400).json({ message: 'Choose a valid day, not a future date' });
  const start = new Date(`${date}T00:00:00+05:30`), end = new Date(Math.min(now.getTime(), new Date(`${date}T23:59:59.999+05:30`).getTime()));
  const ids = req.teamRecruiters.map(u => u._id), allIds = [req.user._id, ...req.teamStaff.map(u => u._id)];
  const recent = new Date(start.getTime() - 30 * 86400000);
  const [candidates, sources, logs, activity, lastWrites, attendances, states, jobs, overviewCounts, totalSourced] = await Promise.all([
   Candidate.find({ createdBy: { $in: ids }, $or: [{ createdAt: { $gte: start, $lte: end } }, { joiningDate: { $gte: recent, $lte: end } }, { status: { $in: ['Selected', 'Interviewed', 'Shortlisted'] } }] }).select('createdBy jobId status createdAt joiningDate lineupApproval').lean(),
   Source.find({ recruiterId: { $in: ids }, createdAt: { $gte: start, $lte: end }, isDuplicate: { $ne: true } }).select('recruiterId createdAt contactSource').lean(),
   Activity.find({ userId: { $in: ids }, actionType: 'candidate_created', targetModel: 'SourceCandidate', 'metadata.source': 'recruiter_followups', 'metadata.isDuplicate': { $ne: true }, createdAt: { $gte: start, $lte: end } }).select('userId targetId createdAt').lean(),
   Activity.find({ userId: { $in: ids }, actionType: { $in: productiveActions }, createdAt: { $gte: start, $lte: end } }).select('userId description actionType createdAt targetId').sort({ createdAt: -1 }).lean(),
   Activity.aggregate([{ $match: { userId: { $in: ids }, actionType: { $in: productiveActions }, createdAt: { $lte: end } } }, { $group: { _id: '$userId', at: { $max: '$createdAt' } } }]),
   Attendance.find({ user: { $in: ids }, createdAt: { $gte: start, $lte: end } }).select('user createdAt date status').lean(),
   State.find({ recruiterId: { $in: ids } }).select('-pings').lean(),
   Job.find({ $or: [{ CreatedBy: { $in: allIds } }, { assignedMentors: { $in: allIds } }, { assignedRecruiters: { $in: ids } }] }).select('title status assignedRecruiters assignedMentors clientId noOfPositions salary').populate('clientId', 'companyName').lean(),
   Candidate.aggregate([{ $match: { createdBy: { $in: allIds } } }, { $group: { _id: { status: '$status', jobId: '$jobId' }, count: { $sum: 1 } } }]),
   Source.countDocuments({ recruiterId: { $in: allIds } }),
  ]);
  const rows = req.teamRecruiters.map(user => {
   const id = idOf(user), ownLogs = logs.filter(l => idOf(l.userId) === id), sourceIds = new Set(ownLogs.map(l => idOf(l.targetId)));
   return recruiterRow({ user, candidates: candidates.filter(c => idOf(c.createdBy) === id), sources: sources.filter(c => idOf(c.recruiterId) === id && sourceIds.has(idOf(c))), sourceLogs: ownLogs, activity: activity.filter(l => idOf(l.userId) === id), lastWrite: lastWrites.find(l => idOf(l) === id)?.at, attendance: attendances.find(a => idOf(a.user) === id), state: date === istDay(now) ? states.find(s => idOf(s.recruiterId) === id) || {} : {}, supervisorId: req.user._id, now: end });
  });
  const pendingByJob = new Map();
  candidates.filter(c => istDay(c.createdAt) === date && (!c.lineupApproval || c.lineupApproval.status === 'Pending')).forEach(c => {
   const key = idOf(c.jobId), counts = pendingByJob.get(key) || {};
   counts[idOf(c.createdBy)] = (counts[idOf(c.createdBy)] || 0) + 1; pendingByJob.set(key, counts);
  });
  const statusCounts = {}; overviewCounts.forEach(bucket => { statusCounts[bucket._id.status || 'New'] = (statusCounts[bucket._id.status || 'New'] || 0) + bucket.count; });
  const open = jobs.filter(j => j.status === 'Open');
  res.json({ rows, mentors: req.teamStaff.filter(u => u.designation === 'Mentor').map(u => ({ _id: idOf(u), name: u.name })), jobs: jobs.map(j => ({ ...j, _id: idOf(j), assignedRecruiters: (j.assignedRecruiters || []).map(idOf), pendingToday: pendingByJob.get(idOf(j)) || {} })), overview: { statusCounts, totalCandidates: overviewCounts.reduce((n, b) => n + b.count, 0), totalSourced, activeJobs: open.length, activeClients: new Set(open.map(j => idOf(j.clientId)).filter(Boolean)).size, positionsLeft: Math.max(0, open.reduce((n, j) => n + (j.noOfPositions || 0), 0) - overviewCounts.filter(b => b._id.status === 'Joined' && open.some(j => idOf(j) === idOf(b._id.jobId))).reduce((n, b) => n + b.count, 0)) }, date, historical: date !== istDay(now), generatedAt: now.toISOString(), policy: { shift: '09:30–18:30 IST · Mon–Sat', lunch: '13:00–14:00 IST', idleMinutes: 30, criticalMinutes: 60, nudgeCooldownMinutes: 30, refreshSeconds: 15 } });
 } catch (error) { console.error('Team dashboard:', error.message); res.status(500).json({ message: 'Unable to load team dashboard' }); }
});
router.post('/:recruiterId/actions', async (req, res) => {
 const target = req.teamRecruiters.find(u => idOf(u) === req.params.recruiterId);
 if (!target) return res.status(403).json({ message: 'Recruiter is outside your team' });
 const now = new Date(), kind = req.body.kind;
 if (req.body.date && req.body.date !== istDay(now)) return res.status(400).json({ message: 'Supervisor actions are available only for today. Refresh the dashboard.' });
 if (!['nudge', 'break', 'resume', 'acknowledge', 'reassign'].includes(kind)) return res.status(400).json({ message: 'Invalid supervisor action' });
 try {
  if (kind === 'reassign') {
   if (!mongoose.isValidObjectId(req.body.jobId) || !mongoose.isValidObjectId(req.body.toRecruiterId)) return res.status(400).json({ message: 'Select a mandate and target recruiter' });
   let saved;
   for (let attempt = 0; attempt < 3 && !saved; attempt++) {
    const current = await Job.findById(req.body.jobId).lean(); if (!current) return res.status(404).json({ message: 'Mandate not found' });
    const assignments = reassignMandate(current, target._id, req.body.toRecruiterId, req.user, req.teamStaff);
    saved = await Job.findOneAndUpdate({ _id: current._id, __v: current.__v ?? { $exists: false } }, { $set: { ...assignments, UpdatedBy: req.user._id }, $inc: { __v: 1 } }, { new: true, runValidators: true });
   }
   if (!saved) return res.status(409).json({ message: 'Assignment changed while saving. Refresh and retry.' });
   await logActivity(req.user._id, 'updated', 'job', 'Reassigned mandate within team', saved._id, 'Job', { actionType: 'assignment_changed', jobId: saved._id, metadata: { fromRecruiterId: target._id, toRecruiterId: req.body.toRecruiterId } });
  } else if (kind === 'nudge') {
   const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''; if (!message || message.length > 500) return res.status(400).json({ message: 'Enter a message up to 500 characters' });
   await State.findOneAndUpdate({ recruiterId: target._id, $or: [{ lastNudgeAt: { $lte: new Date(now.getTime() - 1800000) } }, { lastNudgeAt: { $exists: false } }] }, { $set: { lastNudgeAt: now }, $push: { pings: { $each: [{ from: req.user._id, message, at: now }], $slice: -20 } } }, { upsert: true, new: true, runValidators: true });
  } else {
   let update;
   if (kind === 'break') { const minutes = Number(req.body.minutes); if (![15, 30, 60].includes(minutes)) return res.status(400).json({ message: 'Choose a 15, 30 or 60 minute break' }); update = { breakUntil: new Date(now.getTime() + minutes * 60000), breakStartedAt: now, breakBy: req.user._id }; }
   if (kind === 'resume') update = { breakUntil: now };
   if (kind === 'acknowledge') { const last = await Activity.findOne({ userId: target._id, actionType: { $in: productiveActions }, createdAt: { $lte: now } }).sort({ createdAt: -1 }).select('createdAt').lean(); update = { [`acknowledgements.${idOf(req.user)}`]: { until: new Date(now.getTime() + 1800000), activityAt: last?.createdAt ? new Date(last.createdAt).toISOString() : '' } }; }
   await State.findOneAndUpdate({ recruiterId: target._id }, { $set: update }, { upsert: true, new: true, runValidators: true });
  }
  res.json({ success: true, message: kind === 'nudge' ? 'Internal ping delivered' : 'Supervisor action saved' });
 } catch (error) { if (error.code === 11000) return res.status(kind === 'nudge' ? 429 : 409).json({ message: kind === 'nudge' ? 'A ping was sent recently. Allow 30 minutes between nudges.' : 'This record changed while saving. Refresh and retry.' }); res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to save supervisor action' }); }
});
module.exports = router;
