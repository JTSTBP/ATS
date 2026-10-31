import { useEffect, useState } from 'react';
import axios from 'axios';
import EmailOperations from './EmailOperations';

type Staff = { _id: string; name: string };
type Row = { requirementId: string; title: string; company: string; added: number; emailed: number; whatsapp: number };

export default function FollowUpReport({ isAdmin = false }: { isAdmin?: boolean }) {
  const [filters, setFilters] = useState({ from: '', to: '', recruiterId: '', mentorId: '' });
  const [report, setReport] = useState<{ rows: Row[]; recruiters: Staff[]; mentors: Staff[] }>({ rows: [], recruiters: [], mentors: [] });
  const [rowFilters, setRowFilters] = useState({ requirement: '', client: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/recruiter/follow-ups/report`, { params: filters, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setReport(data); })
      .catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.message || 'Unable to load report'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, refresh]);
  const rows = report.rows.filter(row => row.title.toLowerCase().includes(rowFilters.requirement.trim().toLowerCase()) && row.company.toLowerCase().includes(rowFilters.client.trim().toLowerCase()));
  const totals = rows.reduce((sum, row) => ({ added: sum.added + row.added, emailed: sum.emailed + row.emailed, whatsapp: sum.whatsapp + row.whatsapp }), { added: 0, emailed: 0, whatsapp: 0 });
  const inputClass = 'mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800';
  return <section className="mb-6 min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Follow-up activity report">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-slate-900">Requirement activity report</h2>
      <button type="button" onClick={() => setRefresh(value => value + 1)} className="text-sm font-semibold text-blue-600">Refresh report</button>
    </div>
    <p className="mt-1 text-xs text-slate-500">Unique candidates added, emailed or sent WhatsApp per requirement. Only successful sends count, using each activity’s date in India time. Manual WhatsApp sends cannot be confirmed.</p>
    <div className="my-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-xs font-semibold text-slate-600">From date<input type="date" value={filters.from} max={filters.to || undefined} onChange={event => setFilters(prev => ({ ...prev, from: event.target.value }))} className={inputClass} /></label>
      <label className="text-xs font-semibold text-slate-600">To date<input type="date" value={filters.to} min={filters.from || undefined} onChange={event => setFilters(prev => ({ ...prev, to: event.target.value }))} className={inputClass} /></label>
      {(['recruiter', 'mentor'] as const).map(kind => <label key={kind} className="text-xs font-semibold capitalize text-slate-600">{kind} name<select value={filters[`${kind}Id`]} onChange={event => setFilters(prev => ({ ...prev, [`${kind}Id`]: event.target.value }))} className={inputClass}><option value="">All {kind}s</option>{report[`${kind}s`].map(person => <option key={person._id} value={person._id}>{person.name}</option>)}</select></label>)}
    </div>
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      {(['requirement', 'client'] as const).map(kind => <label key={kind} className="text-xs font-semibold capitalize text-slate-600">{kind}<input type="search" value={rowFilters[kind]} onChange={event => setRowFilters(prev => ({ ...prev, [kind]: event.target.value }))} placeholder={`Search ${kind}`} className={inputClass} /></label>)}
    </div>
    <button type="button" onClick={() => { setRowFilters({ requirement: '', client: '' }); setFilters({ from: '', to: '', recruiterId: '', mentorId: '' }); }} className="mb-3 text-xs font-semibold text-blue-600">Clear filters</button>
    {loading ? <p role="status" className="py-6 text-sm text-slate-500">Loading report…</p> : error ? <p role="alert" className="py-6 text-sm text-red-600">{error}</p> : <div className="max-h-[420px] overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Requirement</th><th className="p-3">Client</th><th className="p-3 text-right">Candidates added</th><th className="p-3 text-right">Candidates emailed</th><th className="p-3 text-right">Candidates sent WhatsApp</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map(row => <tr key={row.requirementId}><td className="p-3"><div className="font-semibold text-slate-900">{row.title}</div></td><td className="p-3 text-slate-600">{row.company}</td><td className="p-3 text-right">{row.added}</td><td className="p-3 text-right">{row.emailed}</td><td className="p-3 text-right">{row.whatsapp}</td></tr>)}{!rows.length && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No requirements match these filters.</td></tr>}</tbody>
        <tfoot className="border-t bg-slate-50 font-bold"><tr><td colSpan={2} className="p-3">Total</td><td className="p-3 text-right">{totals.added}</td><td className="p-3 text-right">{totals.emailed}</td><td className="p-3 text-right">{totals.whatsapp}</td></tr></tfoot>
      </table>
    </div>}
    {isAdmin && <EmailOperations filters={filters} />}
  </section>;
}
