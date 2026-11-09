const { mergeMentorAssignments } = require('./mentorJobAssignments');
const { idOf } = require('./teamDashboard');
function reassignMandate(job, fromId, toId, actor, staff) {
 const from = idOf(fromId), to = idOf(toId), allowed = new Set(staff.map(idOf));
 const target = staff.find(u => idOf(u) === to && u.designation === 'Recruiter' && !u.isDisabled);
 if (from === to || !allowed.has(from) || !target || !(job.assignedRecruiters || []).some(id => idOf(id) === from) || job.status !== 'Open') throw Object.assign(new Error('Select an open assigned mandate and a different recruiter in your team'), { status: 400 });
 if (actor.designation === 'Mentor') {
  if (idOf(job.CreatedBy) !== idOf(actor) && !(job.assignedMentors || []).some(id => idOf(id) === idOf(actor))) throw Object.assign(new Error('You are not assigned to this mandate'), { status: 403 });
  const own = job.mentorAssignments?.[idOf(actor)];
  const recruiters = (own?.assignedRecruiters || job.assignedRecruiters).map(idOf).filter(id => allowed.has(id));
  if (!recruiters.includes(from)) throw Object.assign(new Error('Recruiter is outside your mandate allocation'), { status: 403 });
  const next = [...new Set(recruiters.map(id => id === from ? to : id))];
  const oldLead = idOf(own?.leadRecruiter || job.leadRecruiter);
  return mergeMentorAssignments(job, { assignedRecruiters: next, leadRecruiter: next.includes(oldLead) ? oldLead : to }, actor._id, staff.map(idOf));
 }
 const records = { ...(job.mentorAssignments || {}) };
 for (const [key, record] of Object.entries(records)) {
  if (!allowed.has(key) || !(record.assignedRecruiters || []).some(id => idOf(id) === from)) continue;
  const next = record.assignedRecruiters.map(idOf).filter(id => id !== from);
  if (next.length) records[key] = { ...record, assignedRecruiters: next, leadRecruiter: next.includes(idOf(record.leadRecruiter)) ? idOf(record.leadRecruiter) : next[0] };
  else delete records[key];
 }
 const mentor = staff.find(u => u.designation === 'Mentor' && (idOf(target.reporter) === idOf(u) || (target.secondary_managers || []).some(m => idOf(m) === idOf(u))));
 if (mentor) { const key = idOf(mentor), record = records[key]; records[key] = { mentorId: key, assignedRecruiters: [...new Set([...(record?.assignedRecruiters || []).map(idOf), to])], leadRecruiter: record ? idOf(record.leadRecruiter) : to }; }
 const shared = Object.values(records).some(r => (r.assignedRecruiters || []).some(id => idOf(id) === from));
 return { assignedRecruiters: [...new Set([...job.assignedRecruiters.map(idOf).filter(id => id !== from || shared), to])], assignedMentors: [...new Set([...(job.assignedMentors || []).map(idOf), ...(mentor ? [idOf(mentor)] : [])])], leadRecruiter: idOf(job.leadRecruiter) === from && !shared ? to : job.leadRecruiter, mentorAssignments: records };
}
module.exports = { reassignMandate };
