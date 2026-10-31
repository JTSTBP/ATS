import { useEffect, useState } from 'react';
import axios from 'axios';
const api = `${import.meta.env.VITE_BACKEND_URL}/api/recruiter/follow-ups`;
export default function EmailOperations({ filters }: { filters: { from: string; to: string; recruiterId: string } }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('manual');
  const [removeId, setRemoveId] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    axios.get(`${api}/email-operations`, { params: { from: filters.from, to: filters.to, recruiterId: filters.recruiterId }, signal: controller.signal }).then(({ data }) => { if (!controller.signal.aborted) setData(data); }).catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.message || 'Unable to load email operations'); });
    return () => controller.abort();
  }, [filters.from, filters.to, filters.recruiterId, version]);
  async function mutate(action: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await action(); setEmail(''); setRemoveId(''); setVersion(value => value + 1); }
    catch (error: any) { setError(error.response?.data?.message || 'Unable to update suppression'); }
    finally { setBusy(false); }
  }
  return <section className="mt-6 border-t border-slate-200 pt-4" aria-label="Admin email operations">
    <div className="flex items-center justify-between"><h3 className="font-bold">Admin email operations</h3><button type="button" onClick={() => setVersion(value => value + 1)} className="text-sm text-blue-600">Refresh email report</button></div>
    <p className="my-2 text-xs text-slate-500">Uses the date and recruiter filters above. Counts are email steps, not unique candidates. Requirement, client and mentor searches apply to the candidate report only.</p>
    {error && <p role="alert" className="my-2 text-sm text-red-700">{error}</p>}
    {!data ? !error && <p role="status">Loading email operations…</p> : <>
      <div className="my-3 flex flex-wrap gap-3">{['sent', 'scheduled', 'pending', 'failed', 'stopped'].map(status => <div key={status} className="rounded-lg bg-slate-50 px-4 py-2 text-sm"><span className="capitalize">{status}</span>: <b>{data.counts.find((item: any) => item._id === status)?.count || 0}</b></div>)}</div>
      <p className="mb-2 text-xs text-slate-500">Latest 100 email steps</p>
      <div className="max-h-80 overflow-auto"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50"><tr>{['Recruiter', 'Requirement', 'Candidate email', 'Sequence / step', 'Status', 'Reply / stop / check'].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{data.recent.map((row: any) => <tr key={row._id} className="border-t"><td className="p-2">{row.recruiterId?.name || 'Unknown'}</td><td className="p-2">{row.requirementId?.title || 'Deleted requirement'}</td><td className="p-2">{row.recipient}</td><td className="p-2">{row.sequenceName || 'Default'} / {(row.sequenceStep || 0) + 1}</td><td className="p-2">{row.status}</td><td className="p-2">{row.replyDetectedAt ? `Replied ${new Date(row.replyDetectedAt).toLocaleString('en-IN')}` : row.stopReason || row.replyCheckError || '—'}</td></tr>)}</tbody></table>{!data.recent.length && <p className="p-4 text-sm text-slate-500">No email sequences in this period.</p>}</div>
      <h3 className="mt-5 font-bold">Shared email suppression list</h3><p className="my-2 text-xs text-slate-500">Blocks this email address across all recruiters and requirements. Showing the latest 200 entries.</p>
      <form className="my-3 flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); mutate(() => axios.post(`${api}/suppressions`, { email, reason })); }}><input aria-label="Email to suppress" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="candidate@example.com" className="rounded-lg border p-2 text-sm" /><select aria-label="Admin suppression reason" value={reason} onChange={event => setReason(event.target.value)} className="rounded-lg border p-2 text-sm"><option value="manual">Manual</option><option value="declined">Declined</option><option value="unsubscribed">Unsubscribed</option><option value="bounced">Bounced</option></select><button disabled={busy} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">Add suppression</button></form>
      <ul className="max-h-64 overflow-auto divide-y">{data.suppressions.map((item: any) => <li key={item._id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span>{item.email} — {item.reason}</span>{removeId === item._id ? <span className="flex flex-wrap items-center gap-2"><span className="text-xs">Future emails will be allowed; stopped sequences stay stopped.</span><button disabled={busy} onClick={() => mutate(() => axios.delete(`${api}/suppressions/${item._id}`))} className="font-semibold text-red-700">Confirm removal</button><button onClick={() => setRemoveId('')}>Cancel</button></span> : <button onClick={() => setRemoveId(item._id)} className="text-blue-600">Remove</button>}</li>)}</ul>
    </>}
  </section>;
}
