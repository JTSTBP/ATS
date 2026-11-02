const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const Communication = require('../models/Communication');
const Job = require('../models/Jobs');
const SourcedCandidate = require('../models/SourcedCandidate');

router.use(protect, (req, res, next) => {
  if (!req.user || req.user.isDisabled) return res.status(401).json({ message: 'Unauthorized' });
  res.set('Cache-Control', 'no-store');
  next();
});
const ownerScope = req => ({ recruiterId: req.user._id, channel: 'EMAIL', sequenceId: { $type: 'string' }, replyDetectedAt: { $type: 'date' } });

router.get('/', async (req, res) => {
  try {
    // Derive alerts from durable detection records: polling or server restarts cannot lose or duplicate them.
    const [result] = await Communication.aggregate([
      { $match: ownerScope(req) },
      { $group: { _id: '$sequenceId', candidateId: { $first: '$candidateId' }, requirementId: { $first: '$requirementId' }, recipient: { $first: '$recipient' }, receivedAt: { $min: '$replyDetectedAt' }, readAt: { $max: '$replyNotificationReadAt' } } },
      { $facet: { items: [{ $sort: { receivedAt: -1, _id: 1 } }, { $limit: 50 }], unread: [{ $match: { readAt: null } }, { $count: 'count' }] } },
    ]);
    const items = result?.items || [];
    const [jobs, candidates] = await Promise.all([
      Job.find({ _id: { $in: items.map(item => item.requirementId).filter(Boolean) } }).select('title').lean(),
      SourcedCandidate.find({ _id: { $in: items.map(item => item.candidateId).filter(Boolean) } }).select('name').lean(),
    ]);
    const jobNames = new Map(jobs.map(job => [String(job._id), job.title]));
    const candidateNames = new Map(candidates.map(candidate => [String(candidate._id), candidate.name]));
    res.json({ unreadCount: result?.unread?.[0]?.count || 0, notifications: items.map(item => ({
      sequenceId: item._id,
      candidateName: candidateNames.get(String(item.candidateId)) || '',
      requirementTitle: jobNames.get(String(item.requirementId)) || 'Requirement unavailable',
      recipient: item.recipient,
      receivedAt: item.receivedAt,
      readAt: item.readAt || null,
    })) });
  } catch { res.status(500).json({ message: 'Unable to load email reply notifications' }); }
});

router.post('/read-all', async (req, res) => {
  try {
    await Communication.updateMany(ownerScope(req), { $set: { replyNotificationReadAt: new Date() } });
    res.json({ success: true });
  } catch { res.status(500).json({ message: 'Unable to mark email replies read' }); }
});

router.post('/:sequenceId/read', async (req, res) => {
  if (!/^[a-zA-Z0-9:_-]{1,200}$/.test(req.params.sequenceId || '')) return res.status(400).json({ message: 'Invalid sequence' });
  try {
    const result = await Communication.updateMany({ ...ownerScope(req), sequenceId: req.params.sequenceId }, { $set: { replyNotificationReadAt: new Date() } });
    if (!result.matchedCount) return res.status(404).json({ message: 'Reply notification not found' });
    res.json({ success: true });
  } catch { res.status(500).json({ message: 'Unable to mark this reply read' }); }
});

module.exports = router;
