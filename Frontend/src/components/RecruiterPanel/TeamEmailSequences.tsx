import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api/team-email`;
type Step = { subject: string; body: string };
type Contact = { requirementId: string; candidateId: string; name: string; email: string; recruiterName: string; senderEmail: string; requirementTitle: string; createdAt: string; eligible: boolean; reason: string };
type Template = { key: string; name: string; steps: Step[] };
type Sequence = { _id: string; email: string; name: string; state: string; createdAt: string; steps: { status: string; stopReason?: string; replyCheckError?: string }[] };
type Requirement = { _id: string; title: string };
type Preview = { requirements: Requirement[]; contacts: Contact[]; templates: Template[]; sequences: Sequence[]; mailboxes: { _id: string; name: string; email: string; ready: boolean; reason: string }[] };
type Result = { email: string; status: string; reason?: string; senderEmail?: string };
const errorMessage = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || 'Unable to reach the server. Please retry.' : 'Unable to process this request.';

export default function TeamEmailSequences() {
  const [clients, setClients] = useState<{ _id: string; name: string }[]>([]);
  const [clientId, setClientId] = useState('');
  const [requirementId, setRequirementId] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [templateKey, setTemplateKey] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<Step[]>([{ subject: '', body: '' }]);
  const mutation = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    axios.get(`${API}/clients`, { signal: controller.signal }).then(({ data }) => { setClients(data.clients); setClientsLoading(false); }).catch(error => { if (!controller.signal.aborted) { setError(errorMessage(error)); setClientsLoading(false); } });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setPreview(null); setSelected([]); setPage(1); setSearch('');
    if (!clientId) { setLoading(false); return () => controller.abort(); }
    setLoading(true); setError('');
    axios.get(`${API}/clients/${clientId}/preview`, { signal: controller.signal, params: { requirementId: requirementId || undefined } }).then(({ data }) => {
      setRequirements(data.requirements || []); setPreview(data); setTemplateKey(current => data.templates.some((template: Template) => template.key === current) ? current : '');
    }).catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [clientId, requirementId, refresh]);

  const saveTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mutation.current) return;
    mutation.current = true; setBusy('save'); setError('');
    try {
      const { data } = await axios.post(`${API}/clients/${clientId}/templates`, { name, steps });
      setTemplateKey(data.template._id); setName(''); setSteps([{ subject: '', body: '' }]); setEditing(false); setNotice('Sequence template saved.'); setRefresh(value => value + 1);
    } catch (error) { setError(errorMessage(error)); }
    finally { mutation.current = false; setBusy(''); }
  };

  const start = async () => {
    if (mutation.current || !requirementId || !selected.length || !templateKey) return;
    mutation.current = true; setBusy('start'); setError(''); setResults([]);
    try {
      const { data } = await axios.post(`${API}/clients/${clientId}/start`, { requirementId, candidateIds: selected, templateKey });
      setResults(data.results); setNotice(`${data.queued} sequences queued. ${data.skipped} contacts skipped. Emails follow the daytime schedule; they are not all sent immediately.`); setRefresh(value => value + 1);
    } catch (error) { setError(errorMessage(error)); setRefresh(value => value + 1); }
    finally { mutation.current = false; setBusy(''); }
  };

  const stop = async (sequence: Sequence) => {
    if (mutation.current) return;
    mutation.current = true; setBusy(sequence._id); setError('');
    try {
      await axios.post(`${API}/clients/${clientId}/sequences/${sequence._id}/stop`);
      setNotice('Remaining emails stopped. Already submitted messages cannot be recalled.'); setRefresh(value => value + 1);
    } catch (error) { setError(errorMessage(error)); }
    finally { mutation.current = false; setBusy(''); }
  };

  const template = preview?.templates.find(template => template.key === templateKey);
  const filtered = (preview?.contacts || []).filter(contact => contact.requirementId === requirementId).filter(contact => `${contact.name} ${contact.email} ${contact.recruiterName} ${contact.requirementTitle}`.toLowerCase().includes(search.toLowerCase()));
  const eligible = filtered.filter(contact => contact.eligible);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 50));
  const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100';
  const button = 'min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

  return <section aria-labelledby="team-email-title" className="mb-6 min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="team-email-title" className="text-xl font-bold text-slate-900">Team email sequences</h2><p className="mt-1 text-sm text-slate-600">Select a client, position and sequence. Each contact receives emails from the recruiter who added the address first for that client.</p></div>
      <button type="button" className={button} disabled={!clientId || loading || !!busy} onClick={() => setRefresh(value => value + 1)}>Refresh preview</button>
    </div>
    <label className="block max-w-md text-sm font-semibold text-slate-700">Client<select className={input} value={clientId} disabled={!!busy} onChange={event => { setClientId(event.target.value); setRequirementId(''); setRequirements([]); setSelected([]); setPreview(null); setTemplateKey(''); setResults([]); setNotice(''); setEditing(false); }}><option value="">Select client</option>{clients.map(client => <option key={client._id} value={client._id}>{client.name}</option>)}</select></label>
    {clientId && <label className="block max-w-md text-sm font-semibold text-slate-700">Position<select className={input} value={requirementId} disabled={!!busy || clientsLoading} onChange={event => { setRequirementId(event.target.value); setSelected([]); setTemplateKey(''); setPreview(null); setResults([]); setNotice(''); }}><option value="">Select position</option>{requirements.map(requirement => <option key={requirement._id} value={requirement._id}>{requirement.title}</option>)}</select></label>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{notice}</p>}
    {(loading || clientsLoading) && <p role="status" className="text-sm text-slate-500">Loading team email preview…</p>}
    {!loading && !clientsLoading && !clients.length && !error && <p className="text-sm text-slate-500">No clients are assigned to your team yet.</p>}
    {preview && <>
      <details className="rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-semibold">Team mailboxes — {preview.mailboxes.filter(mailbox => mailbox.ready).length} of {preview.mailboxes.length} ready</summary><ul className="mt-3 space-y-2">{preview.mailboxes.map(mailbox => <li key={mailbox._id} className="text-sm"><b>{mailbox.name}</b> · {mailbox.email}<span className={mailbox.ready ? 'ml-2 text-emerald-700' : 'ml-2 text-amber-800'}>{mailbox.ready ? 'Connected' : mailbox.reason}</span></li>)}</ul></details>
      <div className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm font-semibold text-slate-700">Sequence template<select className={input} disabled={!!busy || !requirementId} value={templateKey} onChange={event => setTemplateKey(event.target.value)}><option value="">Select sequence template</option>{preview.templates.map(template => <option key={template.key} value={template.key}>{template.name} ({template.steps.length} emails)</option>)}</select></label><button type="button" className={button} disabled={!!busy} onClick={() => setEditing(value => !value)}>{editing ? 'Close editor' : 'Create sequence template'}</button></div>
      {!preview.templates.length && <p className="text-sm text-slate-500">Create a sequence template for this client, or add a named email sequence to a team requirement.</p>}
      {editing && <form onSubmit={saveTemplate} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold">Create sequence template</h3>
        <label className="block text-sm font-semibold">Sequence name<input required maxLength={100} className={input} value={name} disabled={!!busy} onChange={event => setName(event.target.value)} /></label>
        <p className="text-xs text-slate-600">Use {'{{candidateName}}'}, {'{{recruiterName}}'}, {'{{companyName}}'}, {'{{jobTitle}}'}, {'{{location}}'}, {'{{experience}}'} or {'{{salary}}'} for personalized text. Each step is sent on a separate day.</p>
        {steps.map((step, index) => <fieldset key={index} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3" disabled={!!busy}><legend className="px-1 text-sm font-semibold">Email {index + 1}</legend><label className="block text-sm">Subject<input required maxLength={500} className={input} value={step.subject} onChange={event => setSteps(current => current.map((item, position) => position === index ? { ...item, subject: event.target.value } : item))} /></label><label className="block text-sm">Message<textarea required maxLength={20000} rows={4} className={input} value={step.body} onChange={event => setSteps(current => current.map((item, position) => position === index ? { ...item, body: event.target.value } : item))} /></label>{steps.length > 1 && <button type="button" className="min-h-11 text-sm font-semibold text-red-700" onClick={() => setSteps(current => current.filter((_, position) => position !== index))}>Remove email {index + 1}</button>}</fieldset>)}
        <div className="flex flex-wrap gap-3"><button type="button" className={button} disabled={steps.length >= 5 || !!busy} onClick={() => setSteps(current => [...current, { subject: '', body: '' }])}>Add email step</button><button type="submit" disabled={!!busy} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy === 'save' ? 'Saving…' : 'Save sequence template'}</button></div>
      </form>}
      {template && <details className="rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-semibold">Preview {template.name} — {template.steps.length} emails</summary><ol className="mt-3 space-y-3">{template.steps.map((step, index) => <li key={index} className="rounded-lg bg-slate-50 p-3 text-sm"><b>Email {index + 1}: {step.subject}</b><p className="mt-2 whitespace-pre-wrap break-words">{step.body}</p></li>)}</ol></details>}
      <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Each email address can join only one sequence per client, including later batches. Missing mailboxes, duplicates, suppressed contacts, and previously contacted addresses are skipped. Stopping a sequence does not make the address eligible again.</div>
      <div className="flex flex-wrap items-end justify-between gap-3"><label className="block min-w-0 flex-1 text-sm font-semibold">Search contacts<input type="search" className={input} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Name, email, recruiter or requirement" /></label><button type="button" className={button} disabled={!!busy || !eligible.length} onClick={() => setSelected(eligible.slice(0, 500).map(contact => contact.candidateId))}>Select eligible ({Math.min(eligible.length, 500)})</button><button type="button" className={button} disabled={!!busy || !selected.length} onClick={() => setSelected([])}>Clear selection</button></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="pb-3 text-left text-xs text-slate-500">{preview.contacts.length} contact records · {preview.contacts.filter(contact => contact.eligible).length} eligible · {selected.length} selected. Up to 500 contacts per batch.</caption><thead className="bg-slate-50 text-slate-600"><tr>{['Select', 'Contact', 'Recruiter / sending mailbox', 'First added (IST)', 'Requirement', 'Eligibility'].map(label => <th key={label} scope="col" className="px-3 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{filtered.slice((page - 1) * 50, page * 50).map(contact => <tr key={contact.candidateId} className="border-b border-slate-100"><td className="px-3 py-3"><input type="checkbox" aria-label={`Select ${contact.name} (${contact.email})`} disabled={!contact.eligible || !!busy || (!selected.includes(contact.candidateId) && selected.length >= 500)} checked={selected.includes(contact.candidateId)} onChange={event => setSelected(current => event.target.checked ? [...current, contact.candidateId] : current.filter(value => value !== contact.candidateId))} /></td><td className="px-3 py-3"><b>{contact.name}</b><p className="text-slate-500">{contact.email || 'No email'}</p></td><td className="px-3 py-3">{contact.recruiterName}<p className="text-xs text-slate-500">{contact.senderEmail}</p></td><td className="whitespace-nowrap px-3 py-3">{new Date(contact.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', second: '2-digit', minute: '2-digit', hour: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })}</td><td className="px-3 py-3">{contact.requirementTitle}</td><td className={`px-3 py-3 ${contact.eligible ? 'text-emerald-700' : 'text-amber-800'}`}>{contact.eligible ? 'Ready' : contact.reason}</td></tr>)}</tbody></table>{!filtered.length && <p className="py-5 text-center text-sm text-slate-500">{requirementId ? 'No matching team contacts for this position.' : 'Select a position to view its contacts.'}</p>}</div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><button className={button} disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span className="text-sm">Page {page} of {pageCount}</span><button className={button} disabled={page >= pageCount} onClick={() => setPage(value => value + 1)}>Next</button></div><button type="button" disabled={!requirementId || !template || !selected.length || !!busy || loading} onClick={start} className="min-h-11 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy === 'start' ? 'Queuing sequences…' : `Start ${selected.length} sequence${selected.length === 1 ? '' : 's'}`}</button></div>
      {!!results.length && <details open className="rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer font-semibold">Batch results</summary><ul className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">{results.map((result, index) => <li key={index}><b>{result.email}</b> — {result.status === 'queued' ? `Queued from ${result.senderEmail}` : result.reason}</li>)}</ul></details>}
      <details className="rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer font-semibold">Recent client sequences ({preview.sequences.length})</summary><div className="mt-3 space-y-3">{preview.sequences.map(sequence => {
        const active = sequence.steps.some(step => ['scheduled', 'pending', 'generated'].includes(step.status));
        return <div key={sequence._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"><div><b>{sequence.email}</b> · {sequence.name}<p className="text-slate-600">{sequence.steps.filter(step => step.status === 'sent').length}/{sequence.steps.length} sent · {sequence.steps.some(step => step.status === 'failed') ? 'Failed' : active ? 'Queued' : sequence.steps.length ? 'Finished / stopped' : sequence.state}</p>{sequence.steps.find(step => step.replyCheckError)?.replyCheckError && <p className="text-amber-800">{sequence.steps.find(step => step.replyCheckError)?.replyCheckError}</p>}{sequence.steps.find(step => step.stopReason)?.stopReason && <p className="text-slate-500">Stopped: {sequence.steps.find(step => step.stopReason)?.stopReason}</p>}</div>{active && <button type="button" className={button} disabled={!!busy} onClick={() => stop(sequence)}>Stop remaining emails</button>}</div>;
      })}{!preview.sequences.length && <p className="text-sm text-slate-500">No team sequences started for this client yet.</p>}</div></details>
    </>}
  </section>;
}
