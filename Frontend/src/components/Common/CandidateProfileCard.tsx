import type { ReactNode } from 'react';
import { BadgeCheck, CalendarDays, Clock3, Eye, Mail, MapPin, Phone } from 'lucide-react';
import { candidatePresentation } from '../../utils/candidatePresentation';
import { formatDate } from '../../utils/dateUtils';
import '../AdminPanel/candidate-design.css';

type ProfileCandidate = Omit<Parameters<typeof candidatePresentation>[0], 'jobId'> & {
  _id?: string;
  jobId?: unknown;
  createdBy?: unknown;
  notes?: string;
  rejectionReason?: string;
};
type JobSummary = { _id?: string; title?: string; status?: string; clientId?: { companyName?: string }; stages?: { name?: string }[] };
type StaffSummary = { name?: string; reporter?: { name?: string } };

// Presentation only: each panel supplies its own existing, permission-aware controls.
export default function CandidateProfileCard({ candidate, resume, status, actions, details, onOpen }: {
  candidate: ProfileCandidate;
  resume: ReactNode;
  status: ReactNode;
  actions?: ReactNode;
  details?: ReactNode;
  onOpen?: () => void;
}) {
  const job = candidate.jobId && typeof candidate.jobId === 'object' ? candidate.jobId as JobSummary : {};
  const staff = candidate.createdBy && typeof candidate.createdBy === 'object' ? candidate.createdBy as StaffSummary : {};
  const profile = candidatePresentation({ ...candidate, jobId: job });
  return <article className="candidate-profile-card">
    <div className="candidate-card-top">
      <div className="candidate-card-top-left">
        <span className="candidate-card-date"><CalendarDays aria-hidden="true" />{candidate.createdAt ? formatDate(candidate.createdAt) : '—'}</span>
        <span className={`candidate-requirement-badge ${job.status === 'Closed' ? 'is-closed' : ''}`}><span />{job.status || 'Open'} Requirement</span>
        <span className="candidate-stage-badge">{profile.stage}</span>
      </div>
      <div className="candidate-card-top-right">
        <span className="candidate-match-badge" title={profile.aiMatch === null ? 'AI match score is not available for this candidate' : 'AI match score'}><BadgeCheck aria-hidden="true" />{profile.aiMatch === null ? '—' : `${profile.aiMatch}%`} AI Match</span>
        <span className="candidate-requirement-id">Req ID: #{profile.requirementId}</span>
      </div>
    </div>
    <div className="candidate-card-body">
      <div className="candidate-card-person">
        <div className="candidate-avatar" aria-hidden="true">{profile.initials}</div>
        <div className="candidate-card-identity">
          <div className="candidate-name-row"><h3>{onOpen ? <button className="candidate-name-open" onClick={onOpen}>{profile.name}</button> : profile.name}</h3><span className="candidate-location"><MapPin aria-hidden="true" />{profile.location}</span></div>
          <div className="candidate-contact-row">
            {profile.email ? <a href={`mailto:${profile.email}`}><Mail aria-hidden="true" />{profile.email}</a> : <span><Mail aria-hidden="true" />No Email</span>}
            <span className="candidate-contact-separator" aria-hidden="true">•</span>
            <span><Phone aria-hidden="true" />{profile.phone || 'No Phone'}</span>
          </div>
        </div>
      </div>
      <div className="candidate-role-summary">
        <div className="candidate-summary-line"><span>Client:</span><strong>{job.clientId?.companyName || '—'}</strong></div>
        <div className="candidate-summary-line candidate-summary-role"><span>Role:</span><strong title={job.title}>{job.title || '—'}</strong></div>
        <div className="candidate-summary-metrics"><span>CTC: <strong>{profile.ctc}</strong></span><i aria-hidden="true">•</i><span>Notice: <strong>{profile.notice}</strong></span><i aria-hidden="true">•</i><span>Exp: <strong>{profile.experience}</strong></span></div>
      </div>
      <div className="candidate-card-controls">
        <div className="candidate-card-resume">{resume}</div>
        <div className="candidate-card-status">{status}</div>
        <div className="candidate-card-actions">{onOpen && <button title="View candidate" aria-label={`View ${profile.name}`} onClick={onOpen}><Eye size={18}/></button>}{actions}</div>
      </div>
      {details && <div className="candidate-extra-details">{details}</div>}
    </div>
    <div className="candidate-card-footer">
      <div className="candidate-footer-details"><span>Recruiter: <strong>{staff.name || '—'}</strong></span><i aria-hidden="true">•</i><span>Mentor: <strong>{staff.reporter?.name || '—'}</strong></span><i aria-hidden="true">•</i><span className="candidate-footer-remarks" title={candidate.notes}>Remarks: <strong>{candidate.notes ? `"${candidate.notes}"` : '—'}</strong></span>{candidate.status === 'Rejected' && candidate.rejectionReason && <span className="text-red-600">Reason: {candidate.rejectionReason}</span>}</div>
      <span className="candidate-last-action"><Clock3 aria-hidden="true" />Last action: {profile.lastAction}</span>
    </div>
  </article>;
}

export function CandidateStatusTabs({ value, onChange, counts, allValue = 'all' }: { value: string; onChange: (status: string) => void; counts?: Record<string, number> | null; allValue?: string }) {
  return <div className="candidate-status-panel bg-white"><div className="candidate-status-tabs">
    {[allValue, 'New', 'Shortlisted', 'Interviewed', 'Selected', 'Joined', 'Rejected', 'Dropped', 'Hold', 'Not responding'].map(status => <button key={status} aria-pressed={value === status} onClick={() => onChange(status)}>{status === allValue ? 'All' : status === 'Not responding' ? 'Not Responding' : status}{counts && (status === allValue || counts[status] > 0) && <span className="candidate-status-count">{(counts[status === allValue ? 'all' : status] || 0).toLocaleString('en-US')}</span>}</button>)}
  </div></div>;
}
