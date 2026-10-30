import { Users, Briefcase, CalendarCheck, UserPlus, ClipboardCheck, Clock, CheckCircle, X, Building2, Database, Mail, ArrowRight, MapPin } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/UserProvider";
import { useJobContext } from "../../context/DataProvider";
import { useClientsContext } from "../../context/ClientsProvider";
import { formatDate } from "../../utils/dateUtils";
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import FinanceDashboard from "./FinanceDashboard";
import "./dashboard.css";
import { getStatusTimestamp } from "../../utils/statusUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Helper hook to detect screen size
function useScreenSize() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('mobile');
      else if (width < 768) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

function MetricValue({ value }: { value: number }) {
  const element = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!element.current) return;
    if (reduceMotion) {
      element.current.textContent = value.toLocaleString('en-IN');
      return;
    }
    element.current.textContent = '0';
    const animation = animate(0, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: current => { if (element.current) element.current.textContent = Math.round(current).toLocaleString('en-IN'); },
    });
    return () => animation.stop();
  }, [value, reduceMotion]);
  return <strong ref={element} aria-label={value.toLocaleString('en-IN')}>{value.toLocaleString('en-IN')}</strong>;
}

export default function AdminDashboard() {
  const { users, leaves, fetchAllLeaves, fetchUsers } = useUserContext();
  const { jobs, fetchJobs } = useJobContext();
  const { clients, fetchClients } = useClientsContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const screenSize = useScreenSize();
  const reduceMotion = useReducedMotion();
  const [totalSourced, setTotalSourced] = useState<number>(0);
  const [ceoReportSending, setCeoReportSending] = useState("");

  // Fetch data on mount
  useEffect(() => {
    fetchUsers();
    fetchAllLeaves();
    fetchJobs();
    fetchallCandidates();
    fetchClients();

    const fetchSourcedCount = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/source-candidates`, { params: { limit: 1 } });
        if (res.data.success) {
          setTotalSourced(res.data.totalCount ?? 0);
        }
      } catch (err) {
        console.error("Failed to fetch sourced candidates count", err);
      }
    };
    fetchSourcedCount();
  }, []);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });


  // Filter functions
  const filterByRange = (dateString: string | undefined | null) => {
    if (!startDate && !endDate) return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    if (start && end) return date >= start && date <= end;
    if (start) return date >= start;
    if (end) return date <= end;
    return true;
  };

  // Active jobs helper
  const openJobIds = useMemo(() => {
    return new Set(jobs.filter((j) => j.status === "Open").map(job => job._id?.toString()));
  }, [jobs]);

  const isOpenJobCandidate = (candidate: any) =>
    candidate.jobId &&
    openJobIds.has(candidate.jobId._id?.toString());

  // Calculate statistics
  const stats = useMemo(() => {
    // Active jobs (status = Open) — always unfiltered
    const openJobs = jobs.filter((j) => j.status === "Open");
    const activeJobs = openJobs.length;

    // Active Clients: unique clients that have at least one open job
    const activeClientIds = new Set(
      openJobs
        .map(j => {
          const cid = j.clientId;
          if (!cid) return null;
          return typeof cid === "object" && cid._id ? cid._id : String(cid);
        })
        .filter(Boolean)
    );
    const activeClients = activeClientIds.size;

    // Positions Left: total noOfPositions across ALL open jobs minus joined count across ALL open jobs
    const totalPositions = openJobs.reduce((sum, j) => sum + (Number(j.noOfPositions) || 0), 0);

    const totalJoinedInOpenJobs = candidates.filter(candidate =>
      candidate.status === "Joined" &&
      candidate.jobId &&
      openJobIds.has(candidate.jobId._id.toString())
    ).length;

    const remainingPositions = Math.max(0, totalPositions - totalJoinedInOpenJobs);


    // Status-specific counts for candidates in range
    // const newCandidates = candidates.filter((c) => c.status === "New" && filterByRange(c.createdAt)).length;
    // const shortlistedCandidates = candidates.filter((c) => (c.status === "Shortlisted" || c.status === "Screen" || c.status === "Screened") && filterByRange(c.createdAt)).length;
    // const interviewedCandidates = candidates.filter((c) => c.status === "Interviewed" && filterByRange(c.createdAt)).length;

    // // Selection and Join counts based on their specific event dates in range
    // const selectedCandidates = candidates.filter((c) => c.status === "Selected" && filterByRange(c.selectionDate)).length;
    // const joinedCandidates = candidates.filter((c) => c.status === "Joined" && filterByRange(c.joiningDate)).length;


    const newCandidates = candidates.filter(c =>
      c.status === "New" &&
      filterByRange(getStatusTimestamp(c, "New")) &&
      isOpenJobCandidate(c)
    ).length;

    const shortlistedCandidates = candidates.filter(c =>
      (c.status === "Shortlisted" ||
        c.status === "Screen" ||
        c.status === "Screened") &&
      filterByRange(getStatusTimestamp(c, ["Shortlisted", "Screen", "Screened"])) &&
      isOpenJobCandidate(c)
    ).length;

    const interviewedCandidates = candidates.filter(c =>
      c.status === "Interviewed" &&
      filterByRange(getStatusTimestamp(c, "Interviewed")) &&
      isOpenJobCandidate(c)
    ).length;

    const activeCandidates = newCandidates + shortlistedCandidates + interviewedCandidates;

    // Selection count based on selectionDate/statusHistory
    const selectedCandidates = candidates.filter(c =>
      c.status === "Selected" &&
      filterByRange(getStatusTimestamp(c, "Selected", c.selectionDate)) &&
      isOpenJobCandidate(c)
    ).length;

    // Joined count based on joiningDate/statusHistory - Includes ALL jobs
    const joinedCandidates = candidates.filter(c =>
      c.status === "Joined" &&
      filterByRange(getStatusTimestamp(c, "Joined", c.joiningDate))
    ).length;
    console.log(activeCandidates, "activeCandidates")
    return {
      activeCandidates,
      activeJobs,
      totalPositions,
      remainingPositions,
      activeClients,
      newCandidates,
      shortlistedCandidates,
      interviewedCandidates,
      selectedCandidates,
      joinedCandidates,
    };
  }, [users, leaves, jobs, candidates, clients, startDate, endDate, openJobIds]);

  // Prepare Recruiter Performance Data
  const recruiterPerformanceData = useMemo(() => {
    const recruiterStats: Record<string, { name: string; uploaded: number; shortlisted: number; joined: number }> = {};

    // Initialize with all recruiters - Filtered by month if needed? 
    // Usually performance is based on candidate activity, but let's filter the recruiters themselves first??
    // Actually, usually you want to see performance of *all* recruiters for the *selected period*.
    // So we should filter candidates by date, but keep all recruiters visible.

    users.forEach(u => {
      if (u.designation?.toLowerCase().includes("recruiter") || u.isAdmin) {
        recruiterStats[u._id] = { name: u.name, uploaded: 0, shortlisted: 0, joined: 0 };
      }
    });

    candidates.forEach((c) => {
      const creator = c.createdBy;
      if (!creator) return;

      const creatorId = typeof creator === 'object' && '_id' in creator ? (creator as any)._id : String(creator);
      const creatorName = typeof creator === 'object' && 'name' in creator ? (creator as any).name : "Unknown";

      if (!recruiterStats[creatorId]) {
        recruiterStats[creatorId] = { name: creatorName, uploaded: 0, shortlisted: 0, joined: 0 };
      }

      // Check if candidate belongs to an OPEN job
      if (!isOpenJobCandidate(c)) return;


      // 1. Uploaded - based on creation date
      if (c.createdAt && filterByRange(c.createdAt)) {
        recruiterStats[creatorId].uploaded += 1;
      }

      // 2. Shortlisted - ONLY if current status is Shortlisted/Screen/Screened AND timestamp is in range
      if (["Shortlisted", "Screen", "Screened"].includes(c.status || "")) {
        const shortlistedTimestamp = getStatusTimestamp(c, ["Shortlisted", "Screen", "Screened"]);
        if (shortlistedTimestamp && filterByRange(shortlistedTimestamp)) {
          recruiterStats[creatorId].shortlisted += 1;
        }
      }

      // 3. Joined - ONLY if current status is Joined/Selected AND timestamp is in range
      // Joined: Includes ALL jobs
      if (c.status === "Joined") {
        const joinedTimestamp = getStatusTimestamp(c, "Joined", c.joiningDate);
        if (joinedTimestamp && filterByRange(joinedTimestamp)) {
          recruiterStats[creatorId].joined += 1;
        }
      } else if (c.status === "Selected") {
        // Selected: ONLY if belongs to an OPEN job
        if (!isOpenJobCandidate(c)) return;
        const selectedTimestamp = getStatusTimestamp(c, "Selected", c.selectionDate);
        if (selectedTimestamp && filterByRange(selectedTimestamp)) {
          // Selected counts as joined for this graph? User asked for "Joined", usually implies both final stages.
          // Previous implementation combined them. Let's keep it consistent with "Joined/Selected" label.
          recruiterStats[creatorId].joined += 1;
        }
      }
    });

    const allRecruiters = Object.values(recruiterStats)
      .sort((a, b) => b.uploaded - a.uploaded);

    // Limit based on screen size to prevent label crowding
    const maxRecruiters = screenSize === 'mobile' ? 5 : screenSize === 'tablet' ? 8 : 12;
    return allRecruiters.slice(0, maxRecruiters);
  }, [candidates, users, startDate, endDate, screenSize, jobs, openJobIds]);

  const triggerCeoReport = async (label: string, endpoint: string, body: Record<string, unknown>) => {
    setCeoReportSending(label);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, body);
      if (response.data.skipped) {
        toast.info(response.data.reason || "Report skipped");
      } else {
        const delivery = response.data.delivery || response.data.log || {};
        const statusText = `Email: ${delivery.emailStatus || "unknown"}`;
        if (delivery.status === "success") {
          toast.success(`${label} sent. ${statusText}`);
        } else if (delivery.status === "partial") {
          toast.warn(`${label} partially sent. ${statusText}`);
        } else {
          toast.error(`${label} not sent. ${statusText}`);
        }
      }
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : "";
      toast.error(message || `${label} failed`);
    } finally {
      setCeoReportSending("");
    }
  };

  if (user?.designation === 'Finance') return <FinanceDashboard />;

  const openJobs = jobs.filter(job => job.status === 'Open');
  const recruiterHighlights = [
    { label: '#1 TOP SOURCING', tone: 'blue', recruiter: recruiterPerformanceData.find(recruiter => recruiter.uploaded > 0) },
    { label: '#2 CONVERSION', tone: 'amber', recruiter: [...recruiterPerformanceData].filter(recruiter => recruiter.uploaded > 0 && recruiter.joined > 0).sort((a, b) => b.joined / b.uploaded - a.joined / a.uploaded)[0] },
    { label: '#3 SHORTLISTED', tone: 'violet', recruiter: [...recruiterPerformanceData].filter(recruiter => recruiter.shortlisted > 0).sort((a, b) => b.shortlisted - a.shortlisted)[0] },
  ];
  const pipeline = [
    { label: 'Active Clients', value: stats.activeClients, detail: 'Clients with open jobs', icon: Building2, path: '/Admin/clients', tone: 'neutral' },
    { label: 'Positions Left', value: stats.remainingPositions, detail: 'Open positions - joined', icon: Briefcase, path: '/Admin/jobs', tone: 'neutral' },
    { label: 'Active Req.', value: stats.activeJobs, detail: 'Jobs with Open status', icon: CalendarCheck, path: '/Admin/jobs', tone: 'neutral' },
    { label: 'Candidates', value: stats.activeCandidates, detail: 'In active pipelines', icon: Users, path: '/Admin/candidates', tone: 'neutral' },
    { label: 'Sourced', value: totalSourced, detail: 'Stage 01', icon: Database, path: '/Admin/talent-database', tone: 'neutral' },
    { label: 'New', value: stats.newCandidates, detail: 'Stage 02', icon: UserPlus, path: '/Admin/candidates', tone: 'blue' },
    { label: 'Screen', value: stats.shortlistedCandidates, detail: 'Stage 03', icon: ClipboardCheck, path: '/Admin/candidates', tone: 'amber' },
    { label: 'Interviewed', value: stats.interviewedCandidates, detail: 'Stage 04', icon: Clock, path: '/Admin/candidates', tone: 'violet' },
    { label: 'Selected', value: stats.selectedCandidates, detail: 'Stage 05', icon: CheckCircle, path: '/Admin/candidates', tone: 'green' },
    { label: 'Joined', value: stats.joinedCandidates, detail: 'Placement', icon: Users, path: '/Admin/candidates', tone: 'teal' },
  ];

  return (
    <div className="executive-dashboard">
      <div className="dashboard-toolbar">
        <p className="dashboard-breadcrumb">Admin Portal <span>/</span> <strong>Dashboard Overview</strong></p>
        <div className="dashboard-date-controls">
          <button type="button" className="dashboard-button" onClick={() => navigate('/Admin/ceo-daily-report-settings')}><Mail size={15} />CEO Report Settings</button>
          <div className="dashboard-date-range">
            <CalendarCheck size={16} aria-hidden="true" />
            <input aria-label="Dashboard start date" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
            <span>—</span>
            <input aria-label="Dashboard end date" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} />
            {(startDate || endDate) && <button type="button" aria-label="Clear date filters" onClick={() => { setStartDate(''); setEndDate(''); }}><X size={14} /></button>}
          </div>
        </div>
      </div>

      <section className="dashboard-panel dashboard-welcome">
        <div>
          <div className="dashboard-title-row"><h1>Dashboard Overview</h1><span className="dashboard-live"><span />LIVE OPS</span></div>
          <p>Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! Here's a quick summary of your portal activity.</p>
        </div>
        <div className="dashboard-report-actions">
          <h2>CEO Daily Report Quick Actions</h2>
          <div>
            <button type="button" className="dashboard-button dashboard-button-primary" disabled={Boolean(ceoReportSending)} onClick={() => triggerCeoReport('Generate 12 PM Report Now', '/api/ceo-daily-reports/send/12PM', { force: true })}><Clock size={15} />{ceoReportSending === 'Generate 12 PM Report Now' ? 'Sending…' : 'Generate 12 PM Report Now'}</button>
            <button type="button" className="dashboard-button dashboard-button-dark" disabled={Boolean(ceoReportSending)} onClick={() => triggerCeoReport('Generate 7 PM Report Now', '/api/ceo-daily-reports/send/7PM', { force: true })}><Clock size={15} />{ceoReportSending === 'Generate 7 PM Report Now' ? 'Sending…' : 'Generate 7 PM Report Now'}</button>
            <button type="button" className="dashboard-button" disabled={Boolean(ceoReportSending)} onClick={() => triggerCeoReport('Send Test Email', '/api/ceo-daily-reports/test-email', { slot: '12PM' })}><Mail size={15} />{ceoReportSending === 'Send Test Email' ? 'Sending…' : 'Send Test Email'}</button>
          </div>
        </div>
      </section>

      <section className="dashboard-panel dashboard-pipeline" aria-labelledby="pipeline-title">
        <div className="dashboard-section-heading"><h2 id="pipeline-title">PIPELINE TELEMETRY <span>•</span> <small>Real-Time Funnel Flow</small></h2><p>Activity follows the selected date range</p></div>
        <div className="dashboard-metrics">
          {pipeline.map((metric, index) => <button type="button" key={metric.label} className={`dashboard-metric metric-${metric.tone}`} style={{ animationDelay: `${index * 45}ms` }} onClick={() => navigate(metric.path)}>
            <span className="metric-heading" title={metric.label}>{metric.label}</span>
            <MetricValue value={metric.value} /><span className="metric-detail" title={metric.detail}>{metric.detail}</span>
            <span className="metric-footer"><span className="metric-icon"><metric.icon size={14} aria-hidden="true" /></span></span>
          </button>)}
        </div>
        <p className="dashboard-metric-note">Client, requirement, position and sourced totals show current inventory. Candidate stages reflect the date filters.</p>
      </section>

      <div className="dashboard-columns">
        <div className="dashboard-performance-column">
          <section className="dashboard-panel dashboard-performance" aria-labelledby="performance-title">
            <div className="dashboard-performance-header">
              <div><div className="dashboard-chart-title"><h2 id="performance-title">Recruiter Performance</h2><span className="dashboard-rank-badge">Top {recruiterPerformanceData.length} Agents</span></div><p>Candidates uploaded, shortlisted, and joined - Top {recruiterPerformanceData.length}</p></div>
              <div className="dashboard-chart-legend"><span className="legend-blue">Uploaded</span><span className="legend-amber">Shortlisted</span><span className="legend-green">Joined/Selected</span></div>
            </div>
            <div className="dashboard-chart" role="img" aria-label="Recruiter performance chart showing uploads, shortlisted candidates and joined or selected candidates">
              {recruiterPerformanceData.some(recruiter => recruiter.uploaded || recruiter.shortlisted || recruiter.joined) ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recruiterPerformanceData} margin={{ top: 30, right: 0, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="2 3" vertical={false} stroke="#dbe5f1" />
                  <XAxis dataKey="name" axisLine={{ stroke: '#dce4ef' }} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 500 }} interval={0} height={38} tickMargin={12} tickFormatter={name => name.length > 8 ? `${name.slice(0, 6)}…` : name} />
                  <YAxis axisLine={false} tickLine={false} width={34} tickMargin={8} allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Inter, sans-serif' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', padding: '12px 16px', fontSize: 12, boxShadow: '0 12px 32px #0f172a18' }} labelStyle={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }} itemStyle={{ color: '#475569', padding: '3px 0' }} cursor={{ fill: '#dbeafe', fillOpacity: 0.35, radius: 8 }} />
                  <Bar name="Uploaded" dataKey="uploaded" fill="#3b82f6" radius={[0, 0, 0, 0]} maxBarSize={10} isAnimationActive={!reduceMotion} animationBegin={150} animationDuration={1000} animationEasing="ease-out" />
                  <Bar name="Shortlisted" dataKey="shortlisted" fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={10} isAnimationActive={!reduceMotion} animationBegin={300} animationDuration={1000} animationEasing="ease-out" />
                  <Bar name="Joined/Selected" dataKey="joined" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={10} isAnimationActive={!reduceMotion} animationBegin={450} animationDuration={1000} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer> : <div className="dashboard-empty"><Users size={28} /><p>No recruiter activity for the selected dates.</p></div>}
            </div>
            <div className="dashboard-chart-footer"><p><strong>NOTE:</strong> <span className="text-blue-600">Blue</span>: Total Upload | <span className="text-amber-600">Orange</span>: Shortlisted | <span className="text-emerald-600">Green</span>: Selected/Joined. <span className="dashboard-chart-note">• Showing top {recruiterPerformanceData.length} recruiters.</span></p><button type="button" onClick={() => navigate('/Admin/reports')}>Detailed Performance Report <ArrowRight size={15} /></button></div>
          </section>
          <div className="dashboard-leaders">
            {recruiterHighlights.map(({ label, tone, recruiter }) => <div key={label} className={`dashboard-leader leader-${tone}`}>
              <div><p>{label}</p><h3>{recruiter?.name || 'No activity'}</h3><span>{recruiter ? tone === 'violet' ? <><b>{recruiter.shortlisted} Shortlisted</b> / {recruiter.uploaded} Total</> : <><b>{recruiter.uploaded} Uploads</b> / {recruiter.joined} Joined/Selected</> : 'No activity for this period'}</span></div><span className="dashboard-avatar">{recruiter ? recruiter.name.split(' ').map(part => part[0]).slice(0, 2).join('') : '—'}</span>
            </div>)}
          </div>
        </div>

        <section className="dashboard-panel dashboard-requirements" aria-labelledby="requirements-title">
          <div className="dashboard-requirements-header"><div><div className="dashboard-chart-title"><h2 id="requirements-title">Active Requirements</h2><span className="dashboard-count">{stats.remainingPositions} openings</span></div><p>Currently open positions</p></div><button type="button" className="dashboard-button dashboard-requirements-link" onClick={() => navigate('/Admin/jobs')}>View All Requirements <ArrowRight size={14} /></button></div>
          <div className="dashboard-job-list">
            {openJobs.slice(0, 5).map(job => <article key={job._id} className="dashboard-job">
              <div className="dashboard-job-title"><h3>{job.title}</h3><span className="dashboard-open">Open</span></div>
              <div className="dashboard-job-details"><p className="dashboard-job-client"><Building2 size={12} />{job.clientId?.companyName || 'Client not specified'}</p><span aria-hidden="true">•</span><p className="dashboard-job-location"><MapPin size={12} />{(Array.isArray(job.location) ? job.location.map((location: any) => location.name).join(', ') : typeof job.location === 'object' && job.location !== null ? (job.location as any).name : job.location) || <em>Location Not specified</em>}</p></div>
              <div className="dashboard-job-meta"><span><span className="dashboard-mini-avatar">{(job.CreatedBy?.name || '?')[0]}</span>{job.CreatedBy?.name || 'Not specified'}</span><span>Posted {job.createdAt ? formatDate(job.createdAt) : 'Not specified'}</span></div>
            </article>)}
            {!openJobs.length && <div className="dashboard-empty"><Briefcase size={28} /><p>No active requirements found.</p></div>}
          </div>
          <div className="dashboard-jobs-footer"><span>Showing {Math.min(5, openJobs.length)} of {openJobs.length} open requirements</span><button type="button" onClick={() => navigate('/Admin/jobs')}>View All Requirements <ArrowRight size={15} /></button></div>
        </section>
      </div>
    </div>
  );
}
