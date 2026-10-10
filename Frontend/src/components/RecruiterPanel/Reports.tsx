import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Users, Search, X, Filter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useCandidateContext } from '../../context/CandidatesProvider';
import { useAuth } from '../../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useJobContext } from '../../context/DataProvider';
import { useClientsContext } from '../../context/ClientsProvider';
import { useUserContext } from '../../context/UserProvider';
import { formatDate } from '../../utils/dateUtils';
import PerformanceReportTable from './PerformanceReportTable';
import { getStatusTimestamp } from '../../utils/statusUtils';

export default function Reports() {
  const { user } = useAuth();
  const { candidates, fetchCandidatesByUser, loading } = useCandidateContext();
  const { fetchJobs } = useJobContext();
  const { clients, fetchClients } = useClientsContext();
  const { users, fetchUsers } = useUserContext();
  const navigate = useNavigate();

  // --- Search & Filter States for Recruiter Performance ---
  const [recruiterSearch, setRecruiterSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [candidatePopupData, setCandidatePopupData] = useState<{ title: string, clientName: string, candidates: any[] } | null>(null);

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const filterByRange = (dateString: string | null | undefined, start: string, end: string) => {
    if (!start && !end) return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    const s = start ? new Date(start) : new Date(0);
    s.setHours(0, 0, 0, 0);
    const e = end ? new Date(end) : new Date(8640000000000000);
    e.setHours(23, 59, 59, 999);
    return date >= s && date <= e;
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchJobs();
    fetchClients();
    fetchUsers();
    if (user?._id) {
      fetchCandidatesByUser(user._id);
    }
  }, [user]);

  const { jobs } = useJobContext();

  // Helper to check if a candidate belongs to an open job
  const openJobIds = useMemo(() => {
    return new Set(jobs.filter(j => j.status === 'Open').map(j => String(j._id)));
  }, [jobs]);

  const isOpenJobCandidate = (c: any) => {
    const jid = c.jobId?._id || c.jobId;
    return jid && openJobIds.has(String(jid));
  };

  // Calculate statistics from real data
  const stats = useMemo(() => {
    if (!user || !candidates) return {
      totalApplications: 0,
      interviews: 0,
      hires: 0,
      screening: 0,
      shortlisted: 0,
      rejected: 0,
    };

    // Filter candidates by Open jobs
    const openJobUserCandidates = candidates.filter(c => isOpenJobCandidate(c));

    // Stats were being filtered by createdAt - Applications still should follow upload date
    const totalApplications = openJobUserCandidates.filter(c =>
      filterByRange(c.createdAt, startDate, endDate)
    ).length;

    const interviews = openJobUserCandidates.filter((c) => {
      if (!['Interview', 'Interviewed'].includes(c.status)) return false;
      const ts = getStatusTimestamp(c, ['Interview', 'Interviewed']);
      return filterByRange(ts || c.createdAt, startDate, endDate);
    }).length;

    const hires = openJobUserCandidates.filter((c) => {
      const hireStatuses = ['Joined', 'Hired', 'Selected', 'Offer'];
      if (!hireStatuses.includes(c.status)) return false;
      const ts = c.status === 'Joined' ? getStatusTimestamp(c, 'Joined', c.joiningDate)
        : c.status === 'Selected' || c.status === 'Offer' ? getStatusTimestamp(c, 'Selected', c.selectionDate)
          : getStatusTimestamp(c, hireStatuses);
      return filterByRange(ts || c.createdAt, startDate, endDate);
    }).length;

    const screening = openJobUserCandidates.filter((c) => {
      const screeningStatuses = ['New', 'Screening', 'Under Review'];
      if (!screeningStatuses.includes(c.status)) return false;
      const ts = getStatusTimestamp(c, screeningStatuses);
      return filterByRange(ts || c.createdAt, startDate, endDate);
    }).length;

    const shortlisted = openJobUserCandidates.filter((c) => {
      const shortlistStatuses = ['Shortlisted', 'Screen', 'Screened'];
      if (!shortlistStatuses.includes(c.status)) return false;
      const ts = getStatusTimestamp(c, shortlistStatuses);
      return filterByRange(ts || c.createdAt, startDate, endDate);
    }).length;

    const rejected = openJobUserCandidates.filter((c) => {
      if (c.status !== 'Rejected' && c.status !== 'Reject') return false;
      const ts = getStatusTimestamp(c, ['Rejected', 'Reject']);
      return filterByRange(ts || c.createdAt, startDate, endDate);
    }).length;

    return {
      totalApplications,
      interviews,
      hires,
      screening,
      shortlisted,
      rejected,
    };
  }, [candidates, jobs, user, startDate, endDate]);

  // Calculate top positions
  const topPositions = useMemo(() => {
    // Only consider candidates from OPEN jobs AND within date range
    const userCandidates = candidates.filter(c =>
      isOpenJobCandidate(c) &&
      filterByRange(c.createdAt, startDate, endDate)
    );

    const jobCounts = userCandidates.reduce((acc, candidate) => {
      const jobTitle = typeof candidate.jobId === 'string' ? 'Unknown Position' : (candidate.jobId as any)?.title || 'Unknown Position';
      acc[jobTitle] = (acc[jobTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(jobCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([position, count]) => ({
        position,
        count,
        percentage:
          stats.totalApplications > 0
            ? (count / stats.totalApplications) * 100
            : 0,
      }));
  }, [candidates, jobs, user, stats.totalApplications]);

  // Calculate recent activity
  const recentActivity = useMemo(() => {
    // Only consider OPEN job candidates
    const userCandidates = candidates.filter(c => isOpenJobCandidate(c) && filterByRange(c.createdAt, startDate, endDate));
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentCandidates = userCandidates.filter(
      (c) => c.createdAt && new Date(c.createdAt) >= last7Days
    );

    const activityByDate = recentCandidates.reduce((acc, candidate) => {
      const date = new Date(candidate.createdAt!).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(candidate);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(activityByDate)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 4)
      .map(([date, candidates]) => ({
        date,
        action: `CV uploaded for ${typeof candidates[0]?.jobId === 'string' ? 'position' : (candidates[0]?.jobId?.title || 'position')}`,
        count: candidates.length,
      }));
  }, [candidates, jobs, user, startDate, endDate]);

  const recruiterPerformanceReportData = useMemo(() => {
    if (!user || !candidates || !jobs || !clients || !users) {
      return { reportRows: [], totals: { lineupsSubmitted: 0, target: 0, closureCount: 0 } };
    }

    const groups: Record<string, {
      date: string;
      recruiterId: string;
      recruiterName: string;
      clientId: string;
      clientName: string;
      jobId: string;
      position: string;
      candidates: any[];
    }> = {};

    candidates.forEach((candidate) => {
      if (!candidate.createdAt) return;

      if (!filterByRange(candidate.createdAt, startDate, endDate)) return;

      const creatorId = typeof candidate.createdBy === 'object' ? candidate.createdBy?._id : candidate.createdBy;
      if (!creatorId) return;

      const jId = typeof candidate.jobId === 'object' ? candidate.jobId?._id : candidate.jobId;
      if (!jId) return;

      const job = jobs.find((j: any) => String(j._id) === String(jId));
      if (!job) return;

      const dateStr = formatDate(candidate.createdAt);
      const recruiterObj = users.find((u: any) => u._id === creatorId);
      const recruiterName = recruiterObj?.name || "Unknown";

      const position = job.title || "Unknown";

      const jClientId = typeof job.clientId === 'object' ? job.clientId?._id : job.clientId;
      const client = clients.find((c: any) => c._id === jClientId);
      const clientName = client?.companyName || "Unknown";
      const clientId = client?._id || "unknown";

      const key = `${dateStr}|${creatorId}|${jId}`;

      if (!groups[key]) {
        groups[key] = {
          date: dateStr,
          recruiterId: creatorId,
          recruiterName,
          clientId,
          clientName,
          jobId: jId,
          position,
          candidates: []
        };
      }
      groups[key].candidates.push(candidate);
    });

    const rows = Object.values(groups).map((group) => {
      const lineupsSubmitted = group.candidates.length;
      const target = 5;

      const closureCandidates = group.candidates.filter(c => c.status === "Selected" || c.status === "Joined");
      const closureCount = closureCandidates.length;

      const recruiterObj = users.find((u: any) => u._id === group.recruiterId);
      const dateOfJoining = recruiterObj?.dateOfJoining ? formatDate(recruiterObj.dateOfJoining) : "-";

      return {
        ...group,
        lineupsSubmitted,
        target,
        closureCount,
        closureCandidates,
        dateOfJoining
      };
    });

    const filteredRows = rows.filter((row) => {
      const matchesRecruiter = recruiterSearch ? row.recruiterName.toLowerCase().includes(recruiterSearch.toLowerCase()) : true;
      const matchesClient = clientSearch ? row.clientName.toLowerCase().includes(clientSearch.toLowerCase()) : true;
      const matchesJob = jobSearch ? row.position.toLowerCase().includes(jobSearch.toLowerCase()) : true;
      return matchesRecruiter && matchesClient && matchesJob;
    });

    const sortedRows = filteredRows.sort((a, b) => {
      return new Date(b.candidates[0].createdAt).getTime() - new Date(a.candidates[0].createdAt).getTime();
    });

    const totals = sortedRows.reduce((acc, row) => {
      acc.lineupsSubmitted += row.lineupsSubmitted;
      acc.closureCount += row.closureCount;
      acc.target += row.target;
      return acc;
    }, { lineupsSubmitted: 0, closureCount: 0, target: 0 });

    return { reportRows: sortedRows, totals };
  }, [candidates, users, jobs, clients, user, startDate, endDate, recruiterSearch, clientSearch, jobSearch]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-slate-800 space-y-6"
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col min-w-[140px]">
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Upload From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-50 border-none text-gray-700 text-xs sm:text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
          />
        </div>
        <div className="flex flex-col min-w-[140px]">
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Upload To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-50 border-none text-gray-700 text-xs sm:text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
          />
        </div>
        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
          className="mt-5 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: 'Applications', value: stats.totalApplications, icon: TrendingUp, color: 'text-blue-600', hover: 'hover:border-blue-300', route: '/Recruiter/candidates', description: 'Total candidates uploaded' },
          { label: 'Interviews', value: stats.interviews, icon: TrendingUp, color: 'text-indigo-600', hover: 'hover:border-indigo-300', route: '/Recruiter/candidates?status=Interview', description: 'Candidates interviewed' },
          { label: 'Hires', value: stats.hires, icon: TrendingUp, color: 'text-purple-600', hover: 'hover:border-purple-300', route: '/Recruiter/candidates?status=Selected', description: 'Successfully hired' }
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.route)}
            className={`bg-white rounded-2xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-md transition-all group ${item.hover}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-mono">{item.label}</h3>
              <item.icon size={20} className="text-green-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className={`text-3xl font-extrabold ${item.color} mb-2`}>{item.value}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Top Positions and Hiring Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Top Positions</h2>
          <div className="space-y-6">
            {topPositions.length > 0 ? (
              topPositions.map((item) => (
                <div
                  key={item.position}
                  onClick={() => navigate(`/Recruiter/candidates?jobTitle=${encodeURIComponent(item.position)}`)}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{item.position}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">{item.count} applicants</span>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden border border-gray-100 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">No data available yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Hiring Funnel</h2>
          <div className="space-y-4">
            {[
              { stage: 'Applications Received', count: stats.totalApplications, color: 'bg-gray-400', status: '', icon: Users },
              { stage: 'Screening', count: stats.screening, color: 'bg-blue-500', status: 'New', icon: TrendingUp },
              { stage: 'Shortlisted', count: stats.shortlisted, color: 'bg-indigo-500', status: 'Shortlisted', icon: TrendingUp },
              { stage: 'Interview', count: stats.interviews, color: 'bg-purple-500', status: 'Interview', icon: TrendingUp },
              { stage: 'Hired', count: stats.hires, color: 'bg-emerald-500', status: 'Selected', icon: TrendingUp },
            ].map((stage) => (
              <div
                key={stage.stage}
                onClick={() => navigate(stage.status ? `/Recruiter/candidates?status=${stage.status}` : '/Recruiter/candidates')}
                className="flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 p-3 rounded-xl transition-all border border-transparent hover:border-gray-100 group"
              >
                <div className={`w-10 h-10 rounded-xl ${stage.color.replace('bg-', 'bg-')}/10 flex items-center justify-center`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{stage.stage}</p>
                </div>
                <span className="text-sm font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg font-mono">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Report Table Component */}
      <PerformanceReportTable />

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Recent Activity Log</h2>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100">
            <Calendar size={14} />
            <span>Last 7 days</span>
          </div>
        </div>
        <div className="space-y-2">
          {recentActivity.length > 0 ? (
            recentActivity.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{log.action}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono mt-1">{log.date}</p>
                </div>
                <span className="text-sm font-extrabold text-blue-600 bg-white px-3 py-1 rounded-lg border border-gray-100 font-mono shrink-0 ml-4">{log.count} uploads</span>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No recent activity detected.</p>
            </div>
          )}
            </div>
      </div>

      {/* Recruiter Performance Report */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Recruiter Performance Report</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mt-1">Breakdown by Recruiter, Client, and Position</p>
            </div>
          </div>

          {/* Search Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Recruiter..."
                value={recruiterSearch}
                onChange={(e) => setRecruiterSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
              />
            </div>
            <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
              />
            </div>
            <div className="relative group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Position..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="bg-gray-50/50 text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="py-4 px-6 uppercase tracking-widest text-[10px] font-mono">Date</th>
                <th className="py-4 px-6 uppercase tracking-widest text-[10px] font-mono">Recruiter Name</th>
                <th className="py-4 px-6 uppercase tracking-widest text-[10px] font-mono">Client</th>
                <th className="py-4 px-6 uppercase tracking-widest text-[10px] font-mono">Position</th>
                <th className="py-4 px-4 text-center uppercase tracking-widest text-[10px] font-mono">Lineups Submitted</th>
                <th className="py-4 px-4 text-center uppercase tracking-widest text-[10px] font-mono">Target</th>
                <th className="py-4 px-4 text-center uppercase tracking-widest text-[10px] font-mono">Closure</th>
                <th className="py-4 px-6 uppercase tracking-widest text-[10px] font-mono">Date of Joining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
              {recruiterPerformanceReportData.reportRows.length > 0 ? (
                recruiterPerformanceReportData.reportRows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-xs text-gray-500">{row.date}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                          {row.recruiterName.charAt(0)}
                        </div>
                        <span className="text-gray-900 font-bold">{row.recruiterName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-700">{row.clientName}</td>
                    <td className="py-4 px-6 text-gray-700 font-bold">{row.position}</td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setCandidatePopupData({
                          title: `${row.position} - Lineups Submitted`,
                          clientName: row.clientName,
                          candidates: row.candidates
                        })}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:scale-105 transition-all"
                      >
                        {row.lineupsSubmitted}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center text-gray-500 font-bold">{row.target}</td>
                    <td className="py-4 px-4 text-center">
                      <button
                        disabled={row.closureCount === 0}
                        onClick={() => setCandidatePopupData({
                          title: `${row.position} - Closures`,
                          clientName: row.clientName,
                          candidates: row.closureCandidates
                        })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border min-w-[32px] transition-all ${row.closureCount > 0
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:scale-105 cursor-pointer"
                          : "bg-gray-50 text-gray-300 border-gray-100 cursor-default"}`}
                      >
                        {row.closureCount}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">{row.dateOfJoining}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 italic">
                    No performance data found for the selected criteria.
                  </td>
                </tr>
              )}

              {/* Total Row */}
              {recruiterPerformanceReportData.reportRows.length > 0 && (
                <tr className="bg-gray-50 font-bold border-t border-gray-200 sticky bottom-0 z-10 shadow-sm">
                  <td colSpan={4} className="py-4 px-6 text-right text-gray-500 uppercase tracking-widest text-[10px]">Total</td>
                  <td className="py-4 px-4 text-center text-blue-600 text-xs font-bold">
                    {recruiterPerformanceReportData.totals.lineupsSubmitted}
                  </td>
                  <td className="py-4 px-4 text-center text-gray-700 text-xs font-bold">
                    {recruiterPerformanceReportData.totals.target}
                  </td>
                  <td className="py-4 px-4 text-center text-emerald-600 text-xs font-bold">
                    {recruiterPerformanceReportData.totals.closureCount}
                  </td>
                  <td className="py-4 px-6"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Details Popup Modal */}
      {candidatePopupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{candidatePopupData.title}</h3>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">Client: {candidatePopupData.clientName}</p>
              </div>
              <button
                onClick={() => setCandidatePopupData(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Joining Date</th>
                    <th className="py-3 px-4 text-center">Selection Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                  {candidatePopupData.candidates.length > 0 ? (
                    candidatePopupData.candidates.map((candidate: any, idx: number) => {
                      const name = candidate.dynamicFields?.candidateName || candidate.name || "N/A";
                      const email = candidate.dynamicFields?.Email || candidate.email || "N/A";
                      const phone = candidate.dynamicFields?.Phone || candidate.phone || "N/A";
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-4 font-bold text-gray-800">{name}</td>
                          <td className="py-4 px-4 text-xs">
                            <div>{email}</div>
                            <div>{phone}</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              candidate.status === 'Selected' ? 'bg-green-50 text-green-700 border border-green-100' :
                              candidate.status === 'Joined' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              candidate.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                              'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {candidate.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center text-xs text-gray-500">{candidate.joiningDate ? formatDate(candidate.joiningDate) : "-"}</td>
                          <td className="py-4 px-4 text-center text-xs text-gray-500">{candidate.selectionDate ? formatDate(candidate.selectionDate) : "-"}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 italic">No candidates found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setCandidatePopupData(null)}
                className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div >
  );
}
