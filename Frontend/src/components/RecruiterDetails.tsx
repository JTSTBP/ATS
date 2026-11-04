import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

type Reporter = { _id: string; name: string; email?: string; designation?: string };
type Profile = {
  _id: string; name: string; email: string; designation: string; personalEmail?: string; phone?: string;
  phoneNumber?: { personal?: string; official?: string }; department?: string; dateOfJoining?: string; joinDate?: string;
  dateOfBirth?: string; profilePhoto?: string; linkedinLink?: string; whatsappLink?: string; reporter?: Reporter;
  secondary_managers?: Reporter[]; isDisabled?: boolean; disabledAt?: string; createdAt?: string;
};
type Job = { _id: string; title: string; status?: string; noOfPositions?: number; clientId?: { companyName?: string; clientName?: string; name?: string } };
const date = (value?: string) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not provided';
const profileLink = (value?: string) => {
  try { const url = new URL(value || ''); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined; } catch { return undefined; }
};

export default function RecruiterDetails({ recruiterId, onClose }: { recruiterId: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<{ recruiter: Profile; jobs: Job[] } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${recruiterId}/team-profile`, { signal: controller.signal })
      .then(response => { if (!controller.signal.aborted) setData(response.data); })
      .catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.message || 'Unable to load recruiter details.'); });
    return () => controller.abort();
  }, [recruiterId, retry]);
  const p = data?.recruiter;
  const jobs = data?.jobs || [];
  const facts = p ? [
    ['Designation', p.designation], ['Official email', p.email], ['Personal email', p.personalEmail],
    ['Official phone', p.phoneNumber?.official || p.phone], ['Personal phone', p.phoneNumber?.personal], ['Department', p.department],
    ['Date of joining', date(p.dateOfJoining || p.joinDate)], ['Date of birth', date(p.dateOfBirth)],
    ['Primary reporter', p.reporter ? `${p.reporter.name} (${p.reporter.designation || 'Team member'})${p.reporter.email ? ` · ${p.reporter.email}` : ''}` : 'Not assigned'],
    ['Additional reporting managers', p.secondary_managers?.map(person => `${person.name} (${person.designation || 'Team member'})`).join(', ') || 'None'],
    ['Status', p.isDisabled ? 'Inactive' : 'Active'], ['Account created', date(p.createdAt)], ...(p.disabledAt ? [['Disabled on', date(p.disabledAt)]] : []),
  ] : [];
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="recruiter-details-title" className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50">
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white px-5 py-4">
      <h2 id="recruiter-details-title" className="text-xl font-bold">{p?.name || 'Recruiter details'}</h2>
      <button type="button" autoFocus onClick={onClose} aria-label="Close recruiter details" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100 focus-visible:outline-blue-600"><X size={20} /></button>
    </div>
    <div className="space-y-6 p-5">
      {error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-3 min-h-11 rounded-lg border px-4 text-sm font-semibold">Try again</button></div> : !p ? <p role="status">Loading recruiter details…</p> : <>
        {profileLink(p.profilePhoto) && <img src={profileLink(p.profilePhoto)} alt={`${p.name}'s profile`} className="h-20 w-20 rounded-xl object-cover" />}
        <dl className="grid gap-4 sm:grid-cols-2">{facts.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm">{value || 'Not provided'}</dd></div>)}</dl>
        {(profileLink(p.linkedinLink) || profileLink(p.whatsappLink)) && <div className="flex flex-wrap gap-3">{[['LinkedIn profile', p.linkedinLink], ['WhatsApp profile', p.whatsappLink]].map(([label, value]) => profileLink(value) && <a key={label} href={profileLink(value)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-semibold text-blue-700">{label}</a>)}</div>}
        <section aria-label="Assigned jobs"><h3 className="font-bold">Assigned jobs ({jobs.length})</h3>{jobs.length ? <ul className="mt-3 space-y-3">{jobs.map(job => <li key={job._id} className="rounded-xl border border-slate-200 p-3"><p className="break-words font-semibold">{job.title}</p><p className="mt-1 text-sm text-slate-600">{job.clientId?.companyName || job.clientId?.clientName || job.clientId?.name || 'Client not provided'} · {job.status || 'Status not provided'}{job.noOfPositions !== undefined && ` · ${job.noOfPositions} openings`}</p></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">No assigned jobs.</p>}</section>
      </>}
    </div>
  </dialog>;
}
