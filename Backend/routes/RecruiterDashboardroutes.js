const router = require('express').Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const Candidate = require('../models/CandidatesByJob');
const Source = require('../models/SourcedCandidate');
const User = require('../models/Users');
const Job = require('../models/Jobs');
const Activity = require('../models/activitylog');
const FollowUp = require('../models/FollowUp');
const { calculateTargets, istDay } = require('../services/recruiterTargets');

router.use(protect, (req, res, next) => {
  if (!req.user || req.user.isDisabled) return res.status(401).json({ message: 'Unauthorized' });
  if (!['Recruiter', 'Mentor', 'Admin', 'Manager'].includes(req.user.designation)) return res.status(403).json({ message: 'Not allowed' });
  next();
});

router.get('/', async (req, res) => {
  try {
    const id = req.user._id;
    const today = istDay(new Date());
    const since = new Date(`${today}T00:00:00+05:30`);
    const [candidates, sources, logs, followUps] = await Promise.all([
      Candidate.find({ createdBy: id }).select('dynamicFields jobId status createdAt joiningDate expectedJoiningDate selectionDate lineupApproval').populate({ path: 'jobId', select: 'title clientId', populate: { path: 'clientId', select: 'companyName' } }).sort({ createdAt: -1 }).lean(),
      Source.find({ recruiterId: id, createdAt: { $gte: since } }).select('createdAt contactSource isDuplicate').lean(),
      Activity.find({ userId: id, actionType: 'candidate_created', targetModel: 'SourceCandidate', 'metadata.source': 'recruiter_followups', 'metadata.isDuplicate': { $ne: true }, createdAt: { $gte: since } }).select('targetId createdAt').lean(),
      FollowUp.find({ recruiterId: id, status: { $in: ['Pending', 'Overdue'] } }).populate('candidateId', 'name').sort({ dueDate: 1, dueTime: 1 }).limit(20).lean(),
    ]);
    const metrics = calculateTargets({ doj: req.user.dateOfJoining || req.user.joinDate, candidates, sources: sources.filter(source => logs.some(log => String(log.targetId) === String(source._id))), logs });
    res.json({ metrics, candidates, followUps, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Recruiter dashboard failed:', error.message);
    res.status(500).json({ message: 'Unable to load dashboard' });
  }
});

async function approvalScope(user) {
  if (user.designation !== 'Mentor') return null;
  const [staff, jobs] = await Promise.all([
    User.find({ $or: [{ reporter: user._id }, { secondary_managers: user._id }] }).distinct('_id'),
    Job.find({ assignedMentors: user._id }).distinct('_id'),
  ]);
  return { $or: [{ createdBy: { $in: staff } }, { jobId: { $in: jobs } }] };
}
router.get('/approvals', async (req, res) => {
  if (req.user.designation !== 'Mentor') return res.status(403).json({ message: 'Mentor approval required' });
  try {
    const scope = await approvalScope(req.user);
    const rows = await Candidate.find({ ...(scope || {}), 'lineupApproval.status': { $nin: ['Approved', 'Rejected'] } }).select('dynamicFields createdBy jobId createdAt lineupApproval').populate('createdBy', 'name').populate('jobId', 'title').sort({ createdAt: -1 }).limit(200).lean();
    res.json({ candidates: rows });
  } catch (error) { res.status(500).json({ message: 'Unable to load approvals' }); }
});
router.patch('/approvals/:id', async (req, res) => {
  if (req.user.designation !== 'Mentor') return res.status(403).json({ message: 'Only a mentor can approve line-ups' });
  if (!mongoose.isValidObjectId(req.params.id) || !['Approved', 'Rejected'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid approval' });
  try {
    const scope = await approvalScope(req.user);
    const candidate = await Candidate.findOneAndUpdate({ _id: req.params.id, ...scope, createdBy: { $ne: req.user._id }, 'lineupApproval.status': { $nin: ['Approved', 'Rejected'] } }, { $set: { lineupApproval: { status: req.body.status, reviewedBy: req.user._id, reviewedAt: new Date() } } }, { new: true });
    if (!candidate) return res.status(409).json({ message: 'Candidate unavailable, already reviewed, or outside your team' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ message: 'Unable to save approval' }); }
});
module.exports = router;
