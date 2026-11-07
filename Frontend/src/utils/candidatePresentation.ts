type CandidatePresentationInput = {
  dynamicFields?: Record<string, unknown>;
  name?: string;
  email?: string;
  phoneNumber?: string;
  aiMatchScore?: number | string | null;
  matchScore?: number | string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  statusHistory?: { timestamp?: string | null }[];
  comments?: { timestamp?: string | null }[];
  interviewStage?: string | null;
  status?: string;
  jobId?: {
    requirementId?: string;
    jobCode?: string;
    _id?: string;
    stages?: { name?: string }[];
  };
};

// Candidate fields are configured per requirement, so labels may use different casing or separators.
export function candidatePresentation(candidate: CandidatePresentationInput, now = Date.now()) {
  const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fields = new Map(Object.entries(candidate.dynamicFields || {}).map(([key, value]) => [normalized(key), value]));
  const read = (...names: string[]) => {
    for (const name of names) {
      const value = fields.get(normalized(name));
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
    return '';
  };
  const name = read('candidateName', 'Name') || candidate.name || 'Unnamed Candidate';
  const money = (value: string) => /^\d/.test(value) ? `₹${value}` : value;
  const current = read('Current CTC', 'Current Salary');
  const expected = read('Expected CTC', 'Expected Salary');
  const experience = read('Experience', 'Total Experience', 'Years of Experience');
  const notice = read('Notice Period', 'Notice');
  const rawScore = candidate.aiMatchScore ?? candidate.matchScore ?? read('AI Match Score', 'AI Match');
  const score = rawScore === '' || rawScore == null ? NaN : Number(String(rawScore).replace(/%$/, ''));
  const timestamps = [candidate.updatedAt, candidate.createdAt, ...(candidate.statusHistory || []).map(entry => entry.timestamp), ...(candidate.comments || []).map(entry => entry.timestamp)].map(value => value ? new Date(value).getTime() : NaN).filter(Number.isFinite);
  const seconds = timestamps.length ? Math.max(0, Math.floor((now - Math.max(...timestamps)) / 1000)) : null;
  const lastAction = seconds === null ? '—' : seconds < 60 ? 'Just now' : seconds < 3600 ? `${Math.floor(seconds / 60)}m ago` : seconds < 86400 ? `${Math.floor(seconds / 3600)}h ago` : `${Math.floor(seconds / 86400)}d ago`;
  const stage = candidate.interviewStage || (candidate.status === 'New' || !candidate.status ? 'New Intake' : candidate.status);
  const stageIndex = (candidate.jobId?.stages || []).findIndex(item => item.name === stage);
  return {
    name, initials: name.split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase(),
    location: read('Current Location', 'Location', 'City') || '—',
    email: read('Email', 'Email ID') || candidate.email || '',
    phone: read('Phone', 'Phone Number', 'Number', 'Mobile') || candidate.phoneNumber || '',
    ctc: current && expected ? `${money(current)} – ${money(expected)}` : money(current || expected) || '—',
    experience: /^\d+(\.\d+)?$/.test(experience) ? `${experience} Yrs` : experience || '—',
    notice: /^\d+$/.test(notice) ? `${notice} Days` : notice || '—',
    aiMatch: Number.isFinite(score) && score >= 0 && score <= 100 ? score : null,
    stage: `Stage ${Math.max(0, stageIndex) + 1}: ${stage}`, lastAction,
    requirementId: candidate.jobId?.requirementId || candidate.jobId?.jobCode || candidate.jobId?._id || '—',
  };
}
