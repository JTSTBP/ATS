import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, FileText, TrendingUp, Clock, CheckCircle, Plus, UserPlus, Calendar, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthProvider';
import { useUserContext } from '../../../context/UserProvider';
import { useCandidateContext } from '../../../context/CandidatesProvider';
import { useJobContext } from '../../../context/DataProvider';
import ActivityLogs from '../../AdminPanel/activitylogs';
import { useScreenSize } from '../../../hooks/useScreenSize';
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

  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let i = 0; i < 5; i++) {
      result.push(currentYear - i);
    }
    return result;
  }, []);

  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);

  // --- 1. Filter by Date Range (Selected Month/Year) ---
  const isWithinSelectedMonth = (dateString: string | null | undefined) => {
    if (selectedMonth === null || selectedYear === null) return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  };

  useEffect(() => {
    fetchJobs();
    fetchallCandidates();
  }, []);

  useEffect(() => {
    if (!user || !jobs || !candidates || !users) return;

    // --- 2. Filter Jobs ---
    const directReportees = users.filter((u: any) => u?.reporter?._id === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);

    if (user.designation === "Manager") {
      directReportees.forEach((mentor: any) => {
        const mentorReportees = users.filter(
          (u: any) => u?.reporter?._id === mentor._id
        );
        allReporteeIds = [
          ...allReporteeIds,
          ...mentorReportees.map((u: any) => u._id),
        ];
      });
    }

    const mentorOnlyJobs = jobs.filter((job: any) => {
      const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    const filteredJobs = mentorOnlyJobs.filter((job: any) => isWithinSelectedMonth(job.createdAt));

    // --- 3. Filter Candidates/Applications ---
    const mentorOnlyCandidates = candidates.filter((c: any) => {
      const creatorId = c.createdBy?._id || c.createdBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    const fCandidates = mentorOnlyCandidates.filter((c: any) => isWithinSelectedMonth(c.createdAt));
    setFilteredCandidates(mentorOnlyCandidates); // Store ALL mentor candidates to filter them dynamically in chart/stats

    // --- 4. Calculate Positions Left (Based on mentor's jobs in this period) ---
    let totalPositionsLeft = 0;
    filteredJobs.forEach((job: any) => {
      // For hired count, we check candidates for this job that joined
      const hiredCount = candidates.filter((c: any) => (c.jobId?._id === job._id || c.jobId === job._id) && c.status === "Joined").length;
      totalPositionsLeft += Math.max(0, (job.noOfPositions || 0) - hiredCount);
    });

    // --- 5. Calculate Stats ---
    const newStats: Stats = {
      totalJobs: filteredJobs.length,
      openJobs: filteredJobs.filter((j: any) => j.status === 'Open').length,
      totalCandidates: fCandidates.length,
      totalApplications: fCandidates.length,
      new: fCandidates.filter((c: any) => c.status === 'New').length,
      shortlisted: fCandidates.filter((c: any) => (c.status === 'Shortlisted' || c.status === 'Screen') && isWithinSelectedMonth(c.createdAt)).length,
      interviewed: fCandidates.filter((c: any) => c.status === 'Interviewed' && isWithinSelectedMonth(c.createdAt)).length,
      selected: mentorOnlyCandidates.filter((c: any) => c.status === 'Selected' && isWithinSelectedMonth(c.selectionDate)).length,
      joined: mentorOnlyCandidates.filter((c: any) => c.status === 'Joined' && isWithinSelectedMonth(c.joiningDate)).length,
      rejected: fCandidates.filter((c: any) => c.status === 'Rejected').length,
      positionsLeft: totalPositionsLeft,
    };

    setStats(newStats);

  }, [user, jobs, candidates, users, selectedMonth, selectedYear]);

  // --- Calculate Date Props for ActivityLogs ---
  const { externalStartDate, externalEndDate } = useMemo(() => {
    if (selectedMonth === null || selectedYear === null) return { externalStartDate: undefined, externalEndDate: undefined };

    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);

    return {
      externalStartDate: start.toISOString().split('T')[0],
      externalEndDate: end.toISOString().split('T')[0]
    };
  }, [selectedMonth, selectedYear]);

  // --- 4. Identify Team Members ---
  const teamMemberIds = useMemo(() => {
    if (!user || !users) return [];

    const directReportees = users.filter((u: any) => u?.reporter?._id === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);

    if (user.designation === "Manager") {
      directReportees.forEach((mentor: any) => {
        const mentorReportees = users.filter(
          (u: any) => u?.reporter?._id === mentor._id
        );
        allReporteeIds = [
          ...allReporteeIds,
          ...mentorReportees.map((u: any) => u._id),
        ];
      });
    }

    // Include self
    return [user._id, ...allReporteeIds];
  }, [user, users]);

  // --- 5. Prepare Recruiter Performance Data ---
  const recruiterPerformanceData = useMemo(() => {
    const recruiterStats: Record<string, { name: string; uploaded: number; shortlisted: number; joined: number }> = {};

    // Initialize with all team members
    users.forEach(u => {
      if (teamMemberIds.includes(u._id)) {
        recruiterStats[u._id] = { name: u.name, uploaded: 0, shortlisted: 0, joined: 0 };
      }
    });

    filteredCandidates.forEach((c) => {
      const creator = c.createdBy;
      if (!creator) return;

      const creatorId = typeof creator === 'object' && '_id' in creator ? (creator as any)._id : String(creator);
      const creatorName = typeof creator === 'object' && 'name' in creator ? (creator as any).name : "Unknown";

      if (!recruiterStats[creatorId]) {
        recruiterStats[creatorId] = { name: creatorName, uploaded: 0, shortlisted: 0, joined: 0 };
      }

      // Check for upload/shortlist in selected period
      if (isWithinSelectedMonth(c.createdAt)) {
        recruiterStats[creatorId].uploaded += 1;
        if (c.status === "Shortlisted") recruiterStats[creatorId].shortlisted += 1;
      }

      // Check for join/select in selected period
      if (c.status === "Selected" && isWithinSelectedMonth(c.selectionDate)) {
        recruiterStats[creatorId].joined += 1;
      }
      if (c.status === "Joined" && isWithinSelectedMonth(c.joiningDate)) {
        recruiterStats[creatorId].joined += 1;
      }
    });

    const maxRecruiters = screenSize === 'mobile' ? 5 : screenSize === 'tablet' ? 8 : 12;
    return Object.values(recruiterStats)
      .sort((a, b) => b.uploaded - a.uploaded)
      .slice(0, maxRecruiters);
  }, [filteredCandidates, users, teamMemberIds, selectedMonth, selectedYear, screenSize]);

  const statCards: Array<{ label: string; value: number; subValue?: string; icon: any; color: string; bgColor: string; path: string }> = [
    {
      label: 'Total Jobs',
      value: stats.totalJobs,
      subValue: `${stats.openJobs} Open`,
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      path: '/Mentor/jobs'
    },
    {
      label: 'Total Candidates',
      value: stats.totalCandidates,
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      path: '/Mentor/candidates'
    },
    {
      label: 'Positions Left',
      value: stats.positionsLeft,
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      path: '/Mentor/jobs'
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

  const upcomingInterviews = filteredCandidates.filter(
    (c) => c.status?.toLowerCase() === "interviewed"
  );

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
          <div className="flex flex-col flex-1 min-w-[80px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Year</label>
            <select
              value={selectedYear === null ? "" : selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === "" ? null : Number(e.target.value))}
              className="bg-gray-50 border-none text-gray-700 text-xs sm:text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
            >
              <option value="">All</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col flex-1 min-w-[100px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Month</label>
            <select
              value={selectedMonth === null ? "" : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === "" ? null : Number(e.target.value))}
              className="bg-gray-50 border-none text-gray-700 text-xs sm:text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
            >
              <option value="">All</option>
              {months.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </div>
          {(selectedMonth !== null || selectedYear !== null) && (
            <button
              onClick={() => {
                setSelectedMonth(null);
                setSelectedYear(null);
              }}
              className="mt-5 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
            >
              Clear
            </button>
          )}
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
                    angle={screenSize === 'mobile' ? -45 : 0}
                    textAnchor={screenSize === 'mobile' ? 'end' : 'middle'}
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
                <span className="text-xs sm:text-sm font-bold text-blue-900">Post Job</span>
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
                <ActivityLogs externalStartDate={externalStartDate} externalEndDate={externalEndDate} />
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
                {upcomingInterviews.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-2">
                    No upcoming interviews
                  </p>
                ) : (
                  upcomingInterviews.slice(0, 5).map((interview: any, index: number) => (
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
