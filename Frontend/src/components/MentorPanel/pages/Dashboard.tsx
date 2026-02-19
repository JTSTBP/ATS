import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, FileText, TrendingUp, Clock, CheckCircle, Plus, UserPlus, Calendar, ClipboardCheck, Building2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthProvider';
import { useUserContext } from '../../../context/UserProvider';
import { useCandidateContext } from '../../../context/CandidatesProvider';
import { useJobContext } from '../../../context/DataProvider';
import ActivityLogs from '../../AdminPanel/activitylogs';
import { useScreenSize } from '../../../hooks/useScreenSize';
import { getStatusTimestamp } from '../../../utils/statusUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Stats = {
  totalJobs: number;
  openJobs: number;
  activeClients: number;
  totalCandidates: number;
  totalApplications: number;
  new: number;
  shortlisted: number;
  interviewed: number;
  selected: number;
  joined: number;
  rejected: number;
  positionsLeft: number;
};

export const Dashboard = () => {
  const screenSize = useScreenSize();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users } = useUserContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { jobs, fetchJobs } = useJobContext();

  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    openJobs: 0,
    activeClients: 0,
    totalCandidates: 0,
    totalApplications: 0,
    new: 0,
    shortlisted: 0,
    interviewed: 0,
    selected: 0,
    joined: 0,
    rejected: 0,
    positionsLeft: 0,
  });

  // --- 1. Date Range Filter Setup ---
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const filterByRange = (dateString: string | null | undefined, start: string, end: string) => {
    if (!start && !end) return true; // Show overall data if no range
    if (!dateString) return false;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    const s = start ? new Date(start) : new Date(0);
    s.setHours(0, 0, 0, 0);
    const e = end ? new Date(end) : new Date(8640000000000000);
    e.setHours(23, 59, 59, 999);
    return date >= s && date <= e;
  };

  useEffect(() => {
    fetchJobs();
    fetchallCandidates();
  }, []);

  // --- 2. Calculate Scoped Data & Statistics ---
  const scopedData = useMemo(() => {
    if (!user || !users || !jobs || !candidates) return { scopedJobs: [], scopedCandidates: [] };

    // Designation-agnostic recursive reporting
    const directReportees = users.filter((u: any) => (u?.reporter?._id || u?.reporter) === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);

    // Get 2nd level reportees (e.g., Recruiters reporting to Mentors reporting to Manager)
    directReportees.forEach((reportee: any) => {
      const childReportees = users.filter((u: any) => (u?.reporter?._id || u?.reporter) === reportee._id);
      allReporteeIds = [...allReporteeIds, ...childReportees.map((u: any) => u._id)];
    });

    const scopedJobs = jobs.filter((job: any) => {
      const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    const scopedCandidates = candidates.filter((c: any) => {
      const creatorId = c.createdBy?._id || c.createdBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    return { scopedJobs, scopedCandidates };
  }, [user, users, jobs, candidates]);

  useEffect(() => {
    const { scopedJobs, scopedCandidates } = scopedData;
    if (!scopedJobs.length && !scopedCandidates.length) return;

    // A. Filter Jobs (Open Only for headlines)
    const openJobs = scopedJobs.filter((j: any) => j.status === 'Open');
    const openJobIds = new Set(openJobs.map((job: any) => (job._id || "").toString()));

    const isOpenJobCandidate = (c: any) => {
      const jid = c.jobId?._id || c.jobId;
      return jid && openJobIds.has(String(jid));
    };

    // B. Global (Open Jobs) Headline Stats
    const activeClientIdsInRange = new Set(
      openJobs.map((j: any) => {
        const cid = j.clientId;
        return typeof cid === "object" && cid?._id ? cid._id : String(cid);
      }).filter(Boolean)
    );

    const totalPositionsGlobal = openJobs.reduce((sum, j: any) => sum + (Number(j.noOfPositions) || 0), 0);
    const totalJoinedInOpenJobs = scopedCandidates.filter((c: any) =>
      c.status === "Joined" && isOpenJobCandidate(c)
    ).length;
    const remainingPositions = Math.max(0, totalPositionsGlobal - totalJoinedInOpenJobs);

    // C. Range-based Statistics
    const candidatesInRange = scopedCandidates.filter(c => filterByRange(getStatusTimestamp(c, (c.status as string) || "New"), startDate, endDate) && isOpenJobCandidate(c));

    const newStats: Stats = {
      totalJobs: openJobs.length,
      openJobs: openJobs.length,
      activeClients: activeClientIdsInRange.size,
      totalCandidates: candidatesInRange.length,
      totalApplications: candidatesInRange.length,
      new: scopedCandidates.filter((c: any) =>
        c.status === 'New' &&
        filterByRange(getStatusTimestamp(c, 'New'), startDate, endDate) &&
        isOpenJobCandidate(c)
      ).length,
      shortlisted: scopedCandidates.filter((c: any) =>
        ['Shortlisted', 'Screen', 'Screened'].includes(c.status) &&
        filterByRange(getStatusTimestamp(c, ['Shortlisted', 'Screen', 'Screened']), startDate, endDate) &&
        isOpenJobCandidate(c)
      ).length,
      interviewed: scopedCandidates.filter((c: any) =>
        c.status === 'Interviewed' &&
        filterByRange(getStatusTimestamp(c, 'Interviewed'), startDate, endDate) &&
        isOpenJobCandidate(c)
      ).length,
      selected: scopedCandidates.filter((c: any) =>
        c.status === 'Selected' &&
        filterByRange(getStatusTimestamp(c, 'Selected', c.selectionDate), startDate, endDate) &&
        isOpenJobCandidate(c)
      ).length,
      joined: scopedCandidates.filter((c: any) =>
        c.status === 'Joined' &&
        filterByRange(getStatusTimestamp(c, 'Joined', c.joiningDate), startDate, endDate) &&
        isOpenJobCandidate(c)
      ).length,
      rejected: scopedCandidates.filter((c: any) =>
        c.status === 'Rejected' &&
        filterByRange(getStatusTimestamp(c, 'Rejected'), startDate, endDate) &&
        isOpenJobCandidate(c)
      ).length,
      positionsLeft: remainingPositions,
    };

    setStats(newStats);
  }, [scopedData, startDate, endDate]);

  // --- 3. Identify Team Members for Chart ---
  const teamMemberIds = useMemo(() => {
    if (!user || !users) return [];
    const directReportees = users.filter((u: any) => (u?.reporter?._id || u?.reporter) === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);
    directReportees.forEach((reportee: any) => {
      const childReportees = users.filter((u: any) => (u?.reporter?._id || u?.reporter) === reportee._id);
      allReporteeIds = [...allReporteeIds, ...childReportees.map((u: any) => u._id)];
    });
    return [user._id, ...allReporteeIds];
  }, [user, users]);

  // --- 4. Prepare Recruiter Performance Data ---
  const recruiterPerformanceData = useMemo(() => {
    const recruiterStats: Record<string, { name: string; uploaded: number; shortlisted: number; joined: number }> = {};
    const { scopedCandidates } = scopedData;

    users.forEach(u => {
      if (teamMemberIds.includes(u._id)) {
        recruiterStats[u._id] = { name: u.name, uploaded: 0, shortlisted: 0, joined: 0 };
      }
    });

    scopedCandidates.forEach((c) => {
      const creatorId = String(c.createdBy?._id || c.createdBy);
      if (!recruiterStats[creatorId]) return;

      if (filterByRange(c.createdAt || "", startDate, endDate)) {
        recruiterStats[creatorId].uploaded += 1;
        if (['Shortlisted', 'Screen', 'Screened'].includes(c.status)) recruiterStats[creatorId].shortlisted += 1;
      }

      if (c.status === "Selected" && filterByRange(c.selectionDate || "", startDate, endDate)) {
        recruiterStats[creatorId].joined += 1;
      }
      if (c.status === "Joined" && filterByRange(c.joiningDate || "", startDate, endDate)) {
        recruiterStats[creatorId].joined += 1;
      }
    });

    const maxRecruiters = screenSize === 'mobile' ? 5 : screenSize === 'tablet' ? 8 : 12;
    return Object.values(recruiterStats)
      .sort((a, b) => b.uploaded - a.uploaded)
      .slice(0, maxRecruiters);
  }, [scopedData, users, teamMemberIds, startDate, endDate, screenSize]);

  const statCards: Array<{ label: string; value: number; subValue?: string; icon: any; color: string; bgColor: string; path: string }> = [
    {
      label: 'Active Clients',
      value: stats.activeClients || 0,
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      path: '/Mentor/clients'
    },
    {
      label: 'Positions Left',
      value: stats.positionsLeft,
      icon: Briefcase,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      path: '/Mentor/jobs'
    },
    {
      label: 'Active Requirements',
      value: stats.openJobs,
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      path: '/Mentor/jobs'
    },
    {
      label: 'Total Candidates',
      value: stats.totalCandidates,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      path: '/Mentor/candidates'
    },
    {
      label: 'New',
      value: stats.new,
      icon: UserPlus,
      color: 'from-blue-400 to-blue-500',
      bgColor: 'bg-blue-50',
      path: '/Mentor/candidates'
    },
    {
      label: 'Screen',
      value: stats.shortlisted,
      icon: ClipboardCheck,
      color: 'from-orange-400 to-orange-500',
      bgColor: 'bg-orange-50',
      path: '/Mentor/candidates'
    },
    {
      label: 'Interviewed',
      value: stats.interviewed,
      icon: Clock,
      color: 'from-purple-400 to-purple-500',
      bgColor: 'bg-purple-50',
      path: '/Mentor/candidates'
    },
    {
      label: 'Selected',
      value: stats.selected,
      icon: CheckCircle,
      color: 'from-green-400 to-green-500',
      bgColor: 'bg-green-50',
      path: '/Mentor/candidates'
    },
    {
      label: 'Joined',
      value: stats.joined,
      icon: Users,
      color: 'from-emerald-400 to-emerald-500',
      bgColor: 'bg-emerald-50',
      path: '/Mentor/candidates'
    },
  ];

  const pipelineStages = [
    { label: 'New', value: stats.new, color: 'bg-yellow-400' },
    { label: 'Screen', value: stats.shortlisted, color: 'bg-blue-400' },
    { label: 'Interviewed', value: stats.interviewed, color: 'bg-cyan-400' },
    { label: 'Selected', value: stats.selected, color: 'bg-purple-400' },
    { label: 'Joined', value: stats.joined, color: 'bg-green-400' },
    { label: 'Rejected', value: stats.rejected, color: 'bg-red-400' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 font-sans p-4 sm:p-0">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 leading-tight">
            Mentor Dashboard
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-base sm:text-lg">
            Overview of your recruitment activities and pipeline.
          </p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              onClick={() => navigate(stat.path)}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 sm:p-4 rounded-xl ${stat.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                  <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${stat.color.replace('bg-', 'text-').replace('500', '600')}`} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 uppercase tracking-widest">
                  {stat.label}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-0.5">{stat.value}</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-500/80 uppercase tracking-wider">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          {/* Recruiter Performance Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8 gap-4 sm:gap-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  Performance
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Candidates uploaded, shortlisted, and joined by team members</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                  <span>Uploaded</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
                  <span>Shortlisted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                  <span>Joined</span>
                </div>
              </div>
            </div>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={recruiterPerformanceData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: screenSize === 'mobile' ? 50 : 20
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: screenSize === 'mobile' ? 9 : 11, fontWeight: 600 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="uploaded" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 16 : 24} />
                  <Bar dataKey="shortlisted" fill="#f97316" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 16 : 24} />
                  <Bar dataKey="joined" fill="#10b981" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 16 : 24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                <span className="font-bold uppercase mr-2">Note:</span>
                This chart shows performance metrics for you and your direct/indirect reportees.
                <span className="mx-2">|</span>
                <span className="text-blue-600 font-bold">Blue</span>: Uploads
                <span className="mx-2">•</span>
                <span className="text-orange-600 font-bold">Orange</span>: Shortlisted
                <span className="mx-2">•</span>
                <span className="text-emerald-600 font-bold">Green</span>: Joined/Selected
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <button
                onClick={() => navigate('/Mentor/jobs/create')}
                className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group border border-blue-200/50"
              >
                <div className="p-2 sm:p-3 bg-white rounded-full shadow-sm mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-blue-900">Post Requirement</span>
              </button>
              <button
                onClick={() => navigate('/Mentor/candidates/add')}
                className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group border border-purple-200/50"
              >
                <div className="p-2 sm:p-3 bg-white rounded-full shadow-sm mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-purple-900">Add Candidate</span>
              </button>
              <button
                onClick={() => navigate('/Mentor/candidates?status=Interviewed')}
                className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 group border border-green-200/50"
              >
                <div className="p-2 sm:p-3 bg-white rounded-full shadow-sm mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-green-900">Interviews</span>
              </button>
              <button
                onClick={() => navigate('/Mentor/applications')}
                className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 group border border-orange-200/50"
              >
                <div className="p-2 sm:p-3 bg-white rounded-full shadow-sm mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-orange-900">Applications</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                Recent Activities
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <ActivityLogs externalStartDate={startDate} externalEndDate={endDate} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Recruitment Pipeline</h3>
            </div>
            <div className="space-y-5">
              {pipelineStages.map((stage) => (
                <div key={stage.label} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">{stage.label}</span>
                    <span className="text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">{stage.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`${stage.color} h-3 rounded-full transition-all duration-500 ease-out group-hover:opacity-80`}
                      style={{ width: `${stats.totalApplications > 0 ? (stage.value / stats.totalApplications) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                Upcoming Interviews
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {scopedData.scopedCandidates.filter(c => c.status?.toLowerCase() === "interviewed").length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-2">
                    No upcoming interviews
                  </p>
                ) : (
                  scopedData.scopedCandidates.filter(c => c.status?.toLowerCase() === "interviewed").slice(0, 5).map((interview: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock size={18} className="text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {interview.dynamicFields?.candidateName || 'Unknown Candidate'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {interview.jobId?.title || "Position not available"}
                        </p>
                      </div>

                      <span className="text-xs text-slate-600 font-medium">
                        {interview.time
                          ? new Date(interview.time).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
