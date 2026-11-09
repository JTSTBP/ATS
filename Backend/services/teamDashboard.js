const { calculateTargets, istDay } = require('./recruiterTargets');
const idOf = value => String(value?._id || value || '');
const productiveActions = ['candidate_created', 'candidate_updated', 'candidate_deleted', 'resume_replaced', 'status_changed', 'comment', 'lineup_approved'];
function scopedStaff(actor, staff) {
 const seen = new Set([idOf(actor)]);
 let parents = [idOf(actor)];
 while (parents.length) {
  const children = staff.filter(u => !u.isDisabled && !seen.has(idOf(u)) && parents.some(parent => idOf(u.reporter) === parent || (u.secondary_managers || []).some(m => idOf(m) === parent)));
  children.forEach(u => seen.add(idOf(u)));
  if (actor.designation !== 'Manager') break;
  parents = children.map(idOf);
 }
 return staff.filter(u => !u.isDisabled && seen.has(idOf(u)));
}
function shift(date) {
 const day = istDay(date), start = new Date(`${day}T09:30:00+05:30`), end = new Date(`${day}T18:30:00+05:30`);
 const lunchStart = new Date(`${day}T13:00:00+05:30`), lunchEnd = new Date(`${day}T14:00:00+05:30`);
 const sunday = new Date(`${day}T12:00:00+05:30`).getUTCDay() === 0;
 return { day, start, end, lunchStart, lunchEnd, sunday, inShift: !sunday && date >= start && date < end, lunch: date >= lunchStart && date < lunchEnd };
}
function workMinutes(from, to) {
 const s = shift(to); if (s.sunday) return 0;
 const start = Math.max(new Date(from).getTime(), s.start.getTime()), end = Math.min(to.getTime(), s.end.getTime());
 if (!Number.isFinite(start) || end <= start) return 0;
 const lunch = Math.max(0, Math.min(end, s.lunchEnd.getTime()) - Math.max(start, s.lunchStart.getTime()));
 return Math.floor((end - start - lunch) / 60000);
}
function activityState({ now, lastWrite, attendance, state = {}, supervisorId }) {
 const s = shift(now), last = lastWrite ? new Date(lastWrite) : null;
 const attendedToday = !!attendance && !['Absent', 'Leave'].includes(attendance.status) && istDay(attendance.createdAt || attendance.date) === s.day;
 const wroteToday = last && istDay(last) === s.day;
 let baseline = wroteToday ? last : attendedToday ? new Date(attendance.createdAt || s.start) : null;
 if (baseline && state.breakUntil && new Date(state.breakUntil) <= now && new Date(state.breakUntil) > baseline) baseline = new Date(state.breakUntil);
 const idleMinutes = baseline ? workMinutes(baseline, now) : null;
 const breakUntil = state.breakUntil && new Date(state.breakUntil);
 let status = 'Not started';
 if (!s.inShift) status = 'Off shift';
 else if ((s.lunch && baseline) || breakUntil > now) status = 'Break';
 else if (baseline) status = idleMinutes >= 60 ? 'Critical' : idleMinutes >= 30 ? 'Idle' : 'Active';
 const ack = state.acknowledgements?.[idOf(supervisorId)];
 const marker = last ? last.toISOString() : '';
 const muted = !!ack && new Date(ack.until) > now && ack.activityAt === marker;
 return { status, idleMinutes, present: attendedToday, lastWrite: last?.toISOString() || null, alert: status === 'Critical' && !muted, breakUntil: breakUntil > now ? breakUntil.toISOString() : null, lunch: s.inShift && s.lunch, ackUntil: muted ? ack.until : null };
}
function recruiterRow({ user, candidates, sources, sourceLogs, activity, lastWrite, attendance, state, supervisorId, now }) {
 const metrics = calculateTargets({ doj: user.dateOfJoining || user.joinDate, candidates, sources, logs: sourceLogs, now });
 const presence = activityState({ now, lastWrite, attendance, state, supervisorId });
 const s = shift(now);
 const latestSource = sourceLogs.reduce((latest, log) => new Date(log.createdAt) > new Date(latest || 0) ? log.createdAt : latest, null);
 const startedAt = latestSource || (attendance && istDay(attendance.createdAt || attendance.date) === s.day ? attendance.createdAt || s.start : activity[activity.length - 1]?.createdAt || null);
 const sourcingIdleMinutes = startedAt ? workMinutes(startedAt, now) : null;
 const sourcingWarning = s.inShift && !s.lunch && presence.status !== 'Break' && sourcingIdleMinutes !== null && sourcingIdleMinutes >= 30 && metrics.sourced < 50;
 const pendingWarning = s.inShift && !s.lunch && presence.status !== 'Break' && candidates.some(c => istDay(c.createdAt) === metrics.today && (!c.lineupApproval || c.lineupApproval.status === 'Pending') && workMinutes(c.createdAt, now) >= 30);
 const elapsed = workMinutes(s.start, now) / 480;
 const behind = (!s.sunday && now >= s.start && (metrics.sourced < Math.floor(50 * elapsed) || metrics.approved < Math.floor(5 * elapsed))) || (metrics.window && metrics.closures < Math.floor(7 * metrics.window.elapsed / 30));
 const hourly = Array.from({ length: 9 }, (_, i) => ({ label: `${String(9 + i).padStart(2, '0')}:30`, writes: 0, additions: 0, lineups: 0 }));
 const bucket = value => Math.floor((new Date(value).getTime() - shift(now).start.getTime()) / 3600000);
 activity.forEach(log => { const index = bucket(log.createdAt); if (hourly[index]) hourly[index].writes++; });
 const sourceIds = new Set(); sourceLogs.forEach(log => { const index = bucket(log.createdAt); if (!sourceIds.has(idOf(log.targetId)) && hourly[index]) { hourly[index].additions++; sourceIds.add(idOf(log.targetId)); } });
 candidates.filter(c => istDay(c.createdAt) === metrics.today).forEach(c => { const index = bucket(c.createdAt); if (hourly[index]) hourly[index].lineups++; });
 return { _id: idOf(user), name: user.name, mentorId: idOf(user.reporter), mentorIds: [idOf(user.reporter), ...(user.secondary_managers || []).map(idOf)].filter(Boolean), metrics, ...presence, lastIngest: latestSource, sourcingIdleMinutes, sourcingWarning, pendingWarning, behind: !!behind, hourly, activity: activity.slice(0, 25).map(log => ({ _id: idOf(log), description: log.description || log.actionType, actionType: log.actionType, createdAt: log.createdAt })), nudgeAvailableAt: state?.lastNudgeAt ? new Date(new Date(state.lastNudgeAt).getTime() + 1800000).toISOString() : null };
}
module.exports = { idOf, productiveActions, scopedStaff, shift, workMinutes, activityState, recruiterRow };
