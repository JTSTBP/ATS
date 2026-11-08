import { useEffect, useState } from 'react';
import axios from 'axios';
type Row = { _id: string; dynamicFields?: Record<string, string>; createdBy?: { name: string }; jobId?: { title: string } };
const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/recruiter/dashboard/approvals`;
export default function LineupApprovals() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [loaded, setLoaded] = useState(false);
  const load = async () => { try { const { data } = await axios.get(endpoint); setRows(data.candidates); setError(''); setLoaded(true); } catch { setError('Unable to load line-up approvals.'); } };
  useEffect(() => { void load(); }, []);
  const review = async (id: string, status: string) => { setBusy(id); try { await axios.patch(`${endpoint}/${id}`, { status }); await load(); } catch { setError('Review could not be saved. Refresh and retry.'); } finally { setBusy(''); } };
  return <section className="rounded-xl border border-indigo-100 bg-white p-4">
    <div className="flex justify-between gap-3"><h3 className="font-semibold">Mentor line-up approvals ({rows.length})</h3><button type="button" className="text-sm text-indigo-700" onClick={load}>Refresh</button></div>
    <p className="mt-1 text-xs text-slate-500">Only approved line-ups count toward the recruiter’s daily target of 5. The submission date determines the target day.</p>
    {error && <p role="alert" className="mt-2 text-red-600">{error}</p>}
    <div className="mt-3 max-h-80 overflow-auto">{rows.map(row => <div key={row._id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3 text-sm"><div><strong>{row.dynamicFields?.candidateName || row.dynamicFields?.name || row.dynamicFields?.Name || 'Candidate'}</strong><p className="text-xs text-slate-500">{row.jobId?.title} · {row.createdBy?.name}</p></div><div className="flex gap-2"><button disabled={!!busy} onClick={() => review(row._id, 'Approved')} className="rounded bg-emerald-100 px-3 py-2 text-emerald-800 disabled:opacity-50">Approve</button><button disabled={!!busy} onClick={() => review(row._id, 'Rejected')} className="rounded bg-red-50 px-3 py-2 text-red-700 disabled:opacity-50">Reject</button></div></div>)}{loaded && !rows.length && <p className="py-3 text-sm text-slate-500">No line-ups awaiting review.</p>}</div>
  </section>;
}
