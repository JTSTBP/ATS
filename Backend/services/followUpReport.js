// Report dates use the portal's India timezone, including the entire selected day.
function reportDateRange(from, to) {
  if (typeof from !== 'string' || typeof to !== 'string') throw new Error('Invalid report date');
  const parse = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error('Invalid report date');
    return new Date(`${value}T00:00:00+05:30`);
  };
  const start = from ? parse(from) : null;
  const end = to ? parse(to) : null;
  if (start && end && start > end) throw new Error('From date must be before to date');
  return { ...(start ? { $gte: start } : {}), ...(end ? { $lt: new Date(end.getTime() + 86400000) } : {}) };
}

function buildReportRows(jobs, added, sent) {
  const counts = new Map(added.map(item => [String(item._id), item.count]));
  const messages = new Map(sent.map(item => [String(item._id), item]));
  return jobs.map(job => ({
    requirementId: job._id, title: job.title,
    company: job.clientId?.companyName || job.clientId?.clientName || job.clientId?.name || 'N/A',
    added: counts.get(String(job._id)) || 0,
    emailed: messages.get(String(job._id))?.emailed || 0,
    whatsapp: messages.get(String(job._id))?.whatsapp || 0,
  }));
}
module.exports = { reportDateRange, buildReportRows };
