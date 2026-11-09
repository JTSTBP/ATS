import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import type { TeamData, TeamRow } from './teamDashboardTypes';
export type SupervisorAction = { kind: 'nudge' | 'break' | 'reassign'; row: TeamRow };
export default function TeamActionDialog({ action, data, busy, error, onClose, onSubmit }: { action: SupervisorAction; data: TeamData; busy: boolean; error: string; onClose: () => void; onSubmit: (body: Record<string, string | number>) => void }) {
 const dialog = useRef<HTMLDialogElement>(null);
 const [message, setMessage] = useState('Please review your pending candidates and today’s targets. Let me know if you need support.');
 const [minutes, setMinutes] = useState(30);
 const [jobId, setJobId] = useState('');
 const [toRecruiterId, setToRecruiterId] = useState('');
 useEffect(() => { const el = dialog.current; el?.showModal(); el?.querySelector<HTMLElement>('[data-initial-focus]')?.focus(); return () => el?.close(); }, []);
 const jobs = data.jobs.filter(j => j.status === 'Open' && j.assignedRecruiters.includes(action.row._id));
 return <dialog ref={dialog} className="team-action-dialog" aria-labelledby="team-action-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
  <form onSubmit={event => { event.preventDefault(); onSubmit({ kind: action.kind, message, minutes, jobId, toRecruiterId }); }}>
   <header><div><small>SUPERVISOR ACTION</small><h2 id="team-action-title">{action.kind === 'nudge' ? 'Send internal ping' : action.kind === 'break' ? 'Approve a break' : 'Reassign mandate'}</h2><p>{action.row.name}</p></div><button type="button" disabled={busy} aria-label="Close action dialog" onClick={onClose}><X size={18}/></button></header>
   {action.kind === 'nudge' && <div className="team-action-field"><label htmlFor="team-ping-message">Message</label><textarea id="team-ping-message" data-initial-focus aria-describedby="team-ping-help" maxLength={500} required value={message} onChange={e => setMessage(e.target.value)}/><small id="team-ping-help">Delivered in the recruiter’s internal inbox. One nudge per recruiter every 30 minutes.</small></div>}
   {action.kind === 'break' && <div className="team-action-field"><label htmlFor="team-break-duration">Break duration</label><select id="team-break-duration" data-initial-focus aria-describedby="team-break-help" value={minutes} onChange={e => setMinutes(Number(e.target.value))}>{[15,30,60].map(n => <option key={n} value={n}>{n} minutes</option>)}</select><small id="team-break-help">Activity alerts pause until the break ends or you resume tracking.</small></div>}
   {action.kind === 'reassign' && <><div className="team-action-field"><label htmlFor="team-mandate">Open mandate</label><select id="team-mandate" data-initial-focus required value={jobId} onChange={e => setJobId(e.target.value)}><option value="">Select mandate</option>{jobs.map(j => <option key={j._id} value={j._id}>{j.clientId?.companyName || 'Client'} · {j.title}</option>)}</select></div><div className="team-action-field"><label htmlFor="team-new-recruiter">Assign future work to</label><select id="team-new-recruiter" required value={toRecruiterId} onChange={e => setToRecruiterId(e.target.value)}><option value="">Select recruiter</option>{data.rows.filter(r => r._id !== action.row._id).map(r => <option key={r._id} value={r._id}>{r.name}</option>)}</select></div><p className="team-muted">Existing candidates and historical target credit stay with their original recruiter.</p></>}
   {error && <p role="alert" className="team-error">{error}</p>}
   <footer><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className="team-primary" disabled={busy || (action.kind === 'reassign' && (!jobs.length || data.rows.length < 2))}><Send size={14}/>{busy ? 'Saving…' : 'Confirm action'}</button></footer>
  </form>
 </dialog>;
}
