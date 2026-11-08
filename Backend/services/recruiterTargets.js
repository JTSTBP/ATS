const DAY = 86400000;
const istDay = value => {
  const time = value == null ? NaN : new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time + 19800000).toISOString().slice(0, 10) : null;
};
const dayNumber = value => Date.parse(`${istDay(value)}T00:00:00Z`) / DAY;

// Thirty calendar days, anchored to the employee's DOJ, never calendar months.
function targetWindow(doj, now = new Date()) {
  if (!doj || !Number.isFinite(new Date(doj).getTime())) return null;
  const anchor = dayNumber(doj), today = dayNumber(now);
  if (anchor > today) return null;
  const start = anchor + Math.floor((today - anchor) / 30) * 30;
  return { start: new Date(start * DAY).toISOString().slice(0, 10), end: new Date((start + 29) * DAY).toISOString().slice(0, 10), elapsed: today - start + 1, daysLeft: start + 30 - today, cycle: Math.floor((today - anchor) / 30) + 1 };
}

function calculateTargets({ doj, candidates = [], sources = [], logs = [], now = new Date() }) {
  const today = istDay(now), window = targetWindow(doj, now);
  const closures = candidates.filter(c => c.status === 'Joined' && c.joiningDate && window && istDay(c.joiningDate) >= window.start && istDay(c.joiningDate) <= today && istDay(c.joiningDate) <= window.end);
  const lineups = candidates.filter(c => istDay(c.createdAt) === today);
  const approved = lineups.filter(c => c.lineupApproval?.status === 'Approved');
  // Source records are removed on conversion. Durable Follow-ups creation logs
  // preserve additions; IDs deduplicate profiles still present in both places.
  const added = new Set(sources.filter(c => !c.isDuplicate && istDay(c.createdAt) === today).map(c => String(c._id)));
  logs.filter(l => istDay(l.createdAt) === today).forEach(l => added.add(String(l.targetId)));
  const sourceBreakdown = {};
  sources.filter(c => added.has(String(c._id))).forEach(c => { const key = c.contactSource || 'Other'; sourceBreakdown[key] = (sourceBreakdown[key] || 0) + 1; });
  return { today, window, closures: closures.length, closureTarget: 7, lineups: lineups.length, approved: approved.length, pending: lineups.filter(c => !c.lineupApproval || c.lineupApproval.status === 'Pending').length, rejected: lineups.filter(c => c.lineupApproval?.status === 'Rejected').length, lineupTarget: 5, sourced: added.size, sourcingTarget: 50, sourceBreakdown, closureIds: closures.map(c => String(c._id)) };
}
module.exports = { istDay, targetWindow, calculateTargets };
