import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BellRing, CalendarDays, CheckCircle2, Database, Download, RefreshCw, Target, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import './Dashboard.css';

type Candidate = { _id: string; status: string; createdAt: string; joiningDate?: string; expectedJoiningDate?: string; dynamicFields?: Record<string, string>; jobId?: { title?: string; clientId?: { companyName?: string } }; lineupApproval?: { status: string } };
type Metrics = { today: string; window: { start: string; end: string; elapsed: number; daysLeft: number; cycle: number } | null; closures: number; closureTarget: number; lineups: number; approved: number; pending: number; rejected: number; lineupTarget: number; sourced: number; sourcingTarget: number; sourceBreakdown: Record<string, number>; closureIds: string[] };
type Data = { metrics: Metrics; candidates: Candidate[]; followUps: { _id: string; type: string; dueDate: string; dueTime: string; candidateId?: { name?: string }; status: string }[]; generatedAt: string };
const nameOf = (c: Candidate) => c.dynamicFields?.candidateName || c.dynamicFields?.name || c.dynamicFields?.Name || c.dynamicFields?.fullName || 'Candidate';
const date = (s?: string) => s ? new Date(s.slice(0, 10) + 'T12:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';
const remaining = (n: number, goal: number) => Math.max(0, goal - n);
const percent = (n: number, goal: number) => Math.min(100, Math.round(n / goal * 100));
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all');
  const [details, setDetails] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/recruiter/dashboard`); setData(response.data); setError(''); }
    catch { setError('Unable to load your dashboard. Please retry.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 60000);
    const refresh = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [load]);
  const exportAudit = () => {
    if (!data) return;
    const rows = [['Candidate', 'Role', 'Client', 'Status', 'DOJ', 'Expected DOJ', 'Mentor approval', 'Closure in current cycle'], ...data.candidates.map(c => [nameOf(c), c.jobId?.title || '', c.jobId?.clientId?.companyName || '', c.status, c.joiningDate || '', c.expectedJoiningDate || '', c.lineupApproval?.status || 'Pending', data.metrics.closureIds.includes(c._id) ? 'Yes' : 'No'])];
    const blob = new Blob(['\uFEFF' + rows.map(row => row.map(value => '"' + String(value).replace(/^[=+@-]/, "'").replaceAll('"', '""') + '"').join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `recruiter-audit-${data.metrics.today}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };
  if (!data) return <div className="target-dashboard"><section className="td-card" aria-live="polite">{loading ? 'Loading your performance dashboard…' : error}<button onClick={load}>Retry</button></section></div>;
  const m = data.metrics;
  const offers = data.candidates.filter(c => c.status === 'Selected');
  const pipeline = data.candidates.filter(c => ['Selected', 'Joined'].includes(c.status));
  const projected = m.window ? Math.round(m.closures / m.window.elapsed * 30 * 10) / 10 : null;
  const alerts = [
    ...(m.window ? [] : [{ group: 'milestones', title: 'Recruiter DOJ is missing', text: 'Ask your administrator to set your date of joining to start the 30-day closure cycle.', route: '/Recruiter/profile' }]),
    ...(m.approved < 5 ? [{ group: 'critical', title: 'Daily line-up target', text: `${remaining(m.approved, 5)} more mentor-approved line-ups needed today. ${m.pending} submissions awaiting review.`, route: '/Recruiter/candidates' }] : []),
    ...(m.sourced < 50 ? [{ group: 'sourcing', title: 'Sourcing fuel', text: `Add ${remaining(m.sourced, 50)} more candidates in Follow-ups to reach your daily goal.`, route: '/Recruiter/follow-ups' }] : []),
    ...offers.filter(c => !c.expectedJoiningDate).map(c => ({ group: 'milestones', title: `Joining date needed: ${nameOf(c)}`, text: `${c.jobId?.title || 'Offer accepted'} · confirm expected DOJ.`, route: '/Recruiter/candidates?status=Selected' })),
  ];
  return <div className="target-dashboard">
    <section className="td-hero">
      <div className="td-hero-top"><div><p className="td-eyebrow"><span className="td-live">LIVE TARGETS</span> Recruitment operations · IST</p><h1>Welcome, {user?.name?.split(' ')[0]}! Your targets are waiting.</h1><p>You need <strong>{remaining(m.closures, 7)} more closures</strong> this cycle, <strong>{remaining(m.approved, 5)} approved line-ups</strong> and <strong>{remaining(m.sourced, 50)} profiles</strong> to reach today’s goals.</p></div><div className="td-actions"><button aria-expanded={details} onClick={() => setDetails(!details)}>View briefing</button><button className="td-primary" disabled={loading} onClick={load}><RefreshCw size={14} />{loading ? 'Syncing…' : 'Refresh data'}</button></div></div>
      {details && <div className="td-note">Closures: candidates marked Joined with an actual DOJ inside your current 30-day employment cycle. Line-ups: submitted today and explicitly approved by your mentor. Sourcing: unique, nonduplicate profiles added in Follow-ups today. Days reset at midnight IST.</div>}
      <div className="td-summary">{[[Target, 'Closures', `${m.closures} / 7`], [Users, 'Today’s approved line-ups', `${m.approved} / 5`], [Database, 'Profiles added', `${m.sourced} / 50`], [CalendarDays, '30-day window', m.window ? `${m.window.daysLeft} days left` : 'DOJ required']].map(([Icon, label, value]) => { const Component = Icon as typeof Target; return <div key={String(label)}><Component size={21}/><span><small>{String(label)}</small><strong>{String(value)}</strong></span></div>; })}</div>
    </section>
    {error && <p className="td-error" role="alert">{error} Showing the last successful update.</p>}
    <div className="td-target-grid">
      {[{ tag: 'PRIORITY #1 METRIC', title: 'Monthly closures', count: m.closures, target: 7, icon: Target, label: m.window ? `Cycle ${m.window.cycle}: ${date(m.window.start)} – ${date(m.window.end)}` : 'Set your employee DOJ to calculate the cycle.', note: 'Counted on actual candidate joining date. Each cycle runs for 30 days from your DOJ.', route: '/Recruiter/candidates?status=Joined', action: 'View closure tracker' }, { tag: 'DAILY EXECUTION', title: 'Today’s line-ups', count: m.approved, target: 5, icon: Users, label: `${m.lineups} submitted · ${m.pending} pending · ${m.rejected} rejected`, note: 'Only mentor-approved submissions count toward your daily target.', route: '/Recruiter/upload-cv', action: 'Add next line-up' }, { tag: 'SOURCING FUEL', title: 'Database additions', count: m.sourced, target: 50, icon: Database, label: Object.entries(m.sourceBreakdown).map(([key, n]) => `${key}: ${n}`).join(' · ') || 'No source additions recorded today', note: 'Add candidates through Follow-ups. Conversion to a line-up preserves your sourcing credit.', route: '/Recruiter/follow-ups', action: 'Quick add in Follow-ups' }].map(card => <section className="td-card td-target" key={card.title}><div className="td-card-top"><span className="td-eyebrow">● {card.tag}</span><span className={`td-badge ${card.count >= card.target ? 'good' : ''}`}>{card.count >= card.target ? 'Goal achieved' : `${remaining(card.count, card.target)} remaining`}</span></div><h2><card.icon size={18}/>{card.title}</h2><div className="td-count"><strong>{card.count}<small> / {card.target}</small></strong><span>{percent(card.count, card.target)}%</span></div><progress value={Math.min(card.count, card.target)} max={card.target} aria-label={`${card.title} progress`}/><p className="td-meta">{card.label}</p><p className="td-note">{card.note}</p><button onClick={() => navigate(card.route)}>{card.action}<ArrowRight size={14}/></button></section>)}
    </div>
    <div className="td-middle">
      <section className="td-card"><p className="td-eyebrow">PERFORMANCE OUTLOOK</p><h2>30-day pace projection</h2><div className="td-projection"><small>At your current verified closure rate</small><strong>{projected ?? '—'} <span>estimated closures</span></strong><span className="td-badge">{projected === null ? 'DOJ required' : projected >= 7 ? 'On pace' : 'Below target pace'}</span></div><p className="td-meta">Simple pace estimate: closures ÷ elapsed cycle days × 30. This is an estimate, not a confirmed result.</p><dl className="td-factors"><div><dt>Verified closures</dt><dd>{m.closures}</dd></div><div><dt>Accepted offers awaiting joining</dt><dd>{offers.length}</dd></div><div><dt>Interviewed candidates</dt><dd>{data.candidates.filter(c => c.status === 'Interviewed').length}</dd></div><div><dt>Calendar days remaining</dt><dd>{m.window?.daysLeft ?? '—'}</dd></div></dl><button onClick={() => navigate('/Recruiter/reports')}>Open performance reports<ArrowRight size={14}/></button></section>
      <section className="td-card"><div className="td-card-top"><div><p className="td-eyebrow">YOUR SCHEDULE</p><h2>Upcoming follow-ups</h2></div><span className="td-badge">{date(m.today)}</span></div><div className="td-schedule">{data.followUps.length ? data.followUps.slice(0, 6).map(f => <button key={f._id} onClick={() => navigate('/Recruiter/follow-ups')}><span className="td-avatar">{(f.candidateId?.name || 'C').slice(0, 2).toUpperCase()}</span><span><strong>{f.candidateId?.name || 'Candidate'}</strong><small>{f.type} · {f.status}</small></span><span className="td-time">{date(f.dueDate)}<small>{f.dueTime} IST</small></span></button>) : <p className="td-empty">No pending follow-ups. Schedule your next candidate touchpoint in Follow-ups.</p>}</div><button onClick={() => navigate('/Recruiter/follow-ups')}>View all follow-ups<ArrowRight size={14}/></button></section>
    </div>
    <section className="td-card"><div className="td-card-top"><div><p className="td-eyebrow">PIPELINE SECURITY</p><h2><CheckCircle2 size={18}/>Upcoming joinings & closure tracker</h2></div><button onClick={exportAudit}><Download size={14}/>Download audit</button></div><div className="td-pipeline">{pipeline.length ? pipeline.slice(0, 6).map(c => <article key={c._id}><div className="td-card-top"><h3>{nameOf(c)}</h3><span className={`td-badge ${c.status === 'Joined' ? 'good' : ''}`}>{c.status}</span></div><p>{c.jobId?.title || 'Role not specified'} · {c.jobId?.clientId?.companyName || 'Client not specified'}</p><div className="td-facts"><div><small>Joining date</small><strong>{date(c.status === 'Joined' ? c.joiningDate : c.expectedJoiningDate)}</strong></div><div><small>Closure credit</small><strong>{m.closureIds.includes(c._id) ? 'Current cycle' : c.status === 'Selected' ? 'Awaiting joining' : 'Outside current cycle'}</strong></div></div><button onClick={() => navigate(`/Recruiter/candidates?status=${c.status}`)}>View candidate<ArrowRight size={14}/></button></article>) : <p className="td-empty">No offers or joinings yet. Your accepted offers and verified closures will appear here.</p>}</div>{pipeline.length > 6 && <button onClick={() => navigate('/Recruiter/candidates')}>View all {pipeline.length} pipeline candidates</button>}</section>
    <section className="td-card"><div className="td-card-top"><div><p className="td-eyebrow">OPERATIONAL PULSE</p><h2><BellRing size={18}/>Target pace alerts</h2></div><div className="td-tabs">{['all', 'critical', 'sourcing', 'milestones'].map(tab => <button aria-pressed={view === tab} key={tab} onClick={() => setView(tab)}>{tab}</button>)}</div></div>{alerts.filter(a => view === 'all' || a.group === view).map((alert, i) => <div className="td-alert" key={i}><BellRing size={18}/><div><strong>{alert.title}</strong><p>{alert.text}</p></div><button onClick={() => navigate(alert.route)}>Take action<ArrowRight size={14}/></button></div>)}{!alerts.filter(a => view === 'all' || a.group === view).length && <p className="td-empty">No alerts in this category.</p>}</section>
    <p className="td-updated">Last synchronized: {new Date(data.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST · Automatically refreshes every minute.</p>
  </div>;
}
