import { useEffect, useState } from 'react';
import axios from 'axios';

type Reply = { candidateId: string; name: string; email: string; phone: string; respondedAt: string };
export default function CandidateEmailReplies({ requirementId }: { requirementId: string }) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    setReplies([]); setLoading(true); setError('');
    const load = async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/recruiter/follow-ups/requirements/${requirementId}/email-replies`, { signal: controller.signal });
        if (!controller.signal.aborted) { setReplies(data.replies || []); setError(''); }
      } catch {
        if (!controller.signal.aborted) setError('Unable to refresh responses. Please try again.');
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(load, 30000);
    window.addEventListener('focus', load);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener('focus', load); };
  }, [requirementId, refresh]);
  return <section aria-label="Candidate email responses" className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-slate-900">Email responses{!loading && ` (${replies.length})`}</h2>
      <button type="button" onClick={() => setRefresh(value => value + 1)} className="rounded-lg border px-3 py-2 text-sm font-semibold">Refresh responses</button>
    </div>
    <p className="mt-1 text-sm text-slate-500">Candidates who replied to this requirement’s email sequences. Responses stay here after notifications are read. Times shown in IST.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {loading ? <p role="status" className="mt-4 text-sm">Loading responses…</p> : replies.length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-slate-600"><tr>{['Candidate name', 'Phone number', 'Email', 'Responded on (IST)'].map(label => <th key={label} scope="col" className="px-3 py-3">{label}</th>)}</tr></thead>
      <tbody>{replies.map(reply => <tr key={reply.candidateId} className="border-t border-slate-100">
        <td className="px-3 py-3 font-semibold">{reply.name}<span className="ml-2 text-xs font-medium text-emerald-700">Responded</span></td>
        <td className="px-3 py-3">{reply.phone || 'Not provided'}</td><td className="px-3 py-3">{reply.email}</td>
        <td className="whitespace-nowrap px-3 py-3"><time dateTime={reply.respondedAt}>{new Date(reply.respondedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</time></td>
      </tr>)}</tbody>
    </table></div> : !error && <p className="mt-4 text-sm text-slate-500">No email responses detected yet.</p>}
  </section>;
}
