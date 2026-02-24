import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Briefcase, Building2, UserCheck, UserPlus, Monitor, MessageSquare, CheckCircle } from "lucide-react";
import { useUserContext } from "../../context/UserProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useJobContext } from "../../context/DataProvider";
import { useClientsContext } from "../../context/ClientsProvider";
import { getStatusTimestamp } from "../../utils/statusUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Helper hook to detect screen size
function useScreenSize() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

export default function AnalyticsTab() {
  const { users, fetchUsers } = useUserContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { jobs, fetchJobs } = useJobContext();
  const { clients, fetchClients } = useClientsContext();
  const navigate = useNavigate();
  const screenSize = useScreenSize();

  useEffect(() => {
    console.log("AnalyticsTab loaded - forcing refresh");
    fetchUsers();
    fetchallCandidates();
    fetchJobs();
    fetchClients();
  }, []);

  // Date Filter State (Defaults to Current Month)
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const start = `${year}-${month}-01`;
    const end = `${year}-${month}-${day}`;
    return { startDate: start, endDate: end };
  });

  const clearFilter = () => {
    setDateRange({ startDate: "", endDate: "" });
  };

  // Filter Data based on Date Range
  const filteredData = useMemo(() => {
    // If no dates selected, return all data
    if (!dateRange.startDate || !dateRange.endDate) {
      return { users, candidates, jobs, clients };
    }

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    // Set end date to end of day to include records created on that day
    end.setHours(23, 59, 59, 999);

    const filterByDate = (item: any) => {
      if (!item.createdAt) return false;
      const date = new Date(item.createdAt);
      return date >= start && date <= end;
    };

    return {
      users: users.filter(filterByDate),
      candidates: candidates.filter(filterByDate),
      jobs: jobs.filter(filterByDate),
      clients: clients.filter(filterByDate)
    };
  }, [users, candidates, jobs, clients, dateRange]);

  // Helper function to check if a date is in the selected range
  const isInRange = (dateString: string | undefined | null) => {
    if (!dateRange.startDate && !dateRange.endDate) return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const end = dateRange.endDate ? new Date(dateRange.endDate) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    if (start && end) return date >= start && date <= end;
    if (start) return date >= start;
    if (end) return date <= end;
    return true;
  };

  // Active Job Helpers
  const openJobIds = useMemo(() => {
    return new Set(jobs.filter(j => j.status === "Open").map(job => String(job._id)));
  }, [jobs]);

  // Helper to get jobId robustly
  const getCandidateJobId = (c: any) => {
    const jid = c.jobId?._id || c.jobId;
    return jid ? String(jid) : null;
  };

  const isOpenJobCandidate = (c: any) => {
    const jid = getCandidateJobId(c);
    return jid && openJobIds.has(jid);
  };

  // Calculate Stats
  const stats = useMemo(() => {
    // 1. Global (System Status) Statistics - Always based on current Open jobs
    const openJobs = jobs.filter(j => j.status === "Open");
    const activeJobs = openJobs.length;

    // Active Clients: unique clientIds from active jobs
    const activeClientIds = new Set(
      openJobs
        .map(j => {
          const cid = j.clientId;
          if (!cid) return null;
          return typeof cid === "object" && "_id" in cid ? String(cid._id) : String(cid);
        })
        .filter(Boolean)
    );
    const activeClients = activeClientIds.size;

    // Positions Left: total noOfPositions across active jobs - total joined across active jobs
    const totalPositions = openJobs.reduce((sum, j) => sum + (Number(j.noOfPositions) || 0), 0);
    const totalJoinedInOpenJobs = candidates.filter(c =>
      c.status === "Joined" && isOpenJobCandidate(c)
    ).length;
    const positionsLeft = Math.max(0, totalPositions - totalJoinedInOpenJobs);

    // Active Requirements: open jobs count
    const activeRequirements = activeJobs;

    // Candidate status breakdown (date-filtered and OPEN JOB candidates)
    // For consistency with Dashboard, use status update timestamps
    const statusCounts = { New: 0, Screen: 0, Interviewed: 0, Selected: 0, Joined: 0 };

    statusCounts.New = candidates.filter(c =>
      c.status === "New" && isInRange(getStatusTimestamp(c, "New")) && isOpenJobCandidate(c)
    ).length;

    statusCounts.Screen = candidates.filter(c =>
      (c.status === "Shortlisted" || c.status === "Screen" || c.status === "Screened") &&
      isInRange(getStatusTimestamp(c, ["Shortlisted", "Screen", "Screened"])) &&
      isOpenJobCandidate(c)
    ).length;

    statusCounts.Interviewed = candidates.filter(c =>
      c.status === "Interviewed" && isInRange(getStatusTimestamp(c, "Interviewed")) && isOpenJobCandidate(c)
    ).length;

    const activeCandidates = statusCounts.New + statusCounts.Screen + statusCounts.Interviewed;

    // To strictly match Dashboard logic for Selected/Joined (date filter on the status field itself):
    statusCounts.Selected = candidates.filter(c =>
      c.status === "Selected" && isInRange(getStatusTimestamp(c, "Selected", c.selectionDate)) && isOpenJobCandidate(c)
    ).length;
    statusCounts.Joined = candidates.filter(c =>
      c.status === "Joined" && isInRange(getStatusTimestamp(c, "Joined", c.joiningDate))
    ).length;

    return {
      activeClients,
      positionsLeft,
      activeRequirements,
      activeCandidates,
      ...statusCounts
    };
  }, [filteredData, jobs, candidates, dateRange, openJobIds]);

  // Prepare Chart Data: User Growth Trend (Filtered)
  const userGrowthData = useMemo(() => {
    let isDaily = false;

    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      isDaily = diffDays <= 60;
    }

    const dataMap: Record<string, number> = {};

    filteredData.users.forEach(u => {
      const d = new Date(u.createdAt);
      let key = "";
      if (isDaily) {
        key = d.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      }
      dataMap[key] = (dataMap[key] || 0) + 1;
    });

    return Object.keys(dataMap).sort().map(key => ({
      name: key,
      users: dataMap[key]
    }));
  }, [filteredData.users, dateRange]);

  // Prepare Chart Data: Candidate Status Distribution
  // Filters: open jobs only + date range applied to status-change timestamp (not upload date)
  const recruitmentData = useMemo(() => {
    const statusCounts: Record<string, number> = {};

    candidates.forEach((c) => {
      const status = c.status || "New";

      // JOINED: count for all jobs, OTHERS: only open jobs
      if (status !== "Joined" && !isOpenJobCandidate(c)) return;

      // Use the timestamp when the current status was set
      const statusTs =
        status === "Joined"
          ? getStatusTimestamp(c, "Joined", c.joiningDate)
          : status === "Selected"
            ? getStatusTimestamp(c, "Selected", c.selectionDate)
            : getStatusTimestamp(c, status);

      // Fall back to createdAt for "New" candidates that may lack a status history entry
      const effectiveDate = statusTs || c.createdAt;

      if (!isInRange(effectiveDate)) return;

      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.keys(statusCounts).map((status) => ({
      name: status,
      value: statusCounts[status],
    }));
  }, [candidates, openJobIds, dateRange]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#f97316", "#8b5cf6", "#ef4444"];

  // Prepare Recruiter Performance Data (Filtered)
  const recruiterPerformanceData = useMemo(() => {
    const recruiterStats: Record<string, { name: string; uploaded: number; shortlisted: number; joined: number }> = {};

    // Initialize with all recruiters/admins
    users.forEach(u => {
      const designation = (u.designation || "").toLowerCase();
      if (designation.includes("recruiter") || u.isAdmin) {
        recruiterStats[u._id] = { name: u.name, uploaded: 0, shortlisted: 0, joined: 0 };
      }
    });

    candidates.forEach((c) => {
      const creator = c.createdBy;
      if (!creator) return;

      const creatorId = typeof creator === 'object' && '_id' in creator ? (creator as any)._id : String(creator);

      // If the recruiter exists in our list (is a recruiter or admin)
      if (recruiterStats[creatorId]) {
        // Check if candidate belongs to an OPEN job
        if (!isOpenJobCandidate(c)) return;

        // 1. Uploaded - based on creation date
        if (c.createdAt && isInRange(c.createdAt)) {
          recruiterStats[creatorId].uploaded += 1;
        }

        // 2. Shortlisted - ONLY if current status is Shortlisted/Screen/Screened AND timestamp is in range
        if (["Shortlisted", "Screen", "Screened"].includes(c.status || "")) {
          const shortlistedTimestamp = getStatusTimestamp(c, ["Shortlisted", "Screen", "Screened"]);
          if (shortlistedTimestamp && isInRange(shortlistedTimestamp)) {
            recruiterStats[creatorId].shortlisted += 1;
          }
        }

        // 3. Joined - ONLY if current status is Joined/Selected AND timestamp is in range
        if (c.status === "Joined") {
          const joinedTimestamp = getStatusTimestamp(c, "Joined", c.joiningDate);
          if (joinedTimestamp && isInRange(joinedTimestamp)) {
            recruiterStats[creatorId].joined += 1;
          }
        } else if (c.status === "Selected") {
          const selectedTimestamp = getStatusTimestamp(c, "Selected", c.selectionDate);
          if (selectedTimestamp && isInRange(selectedTimestamp)) {
            recruiterStats[creatorId].joined += 1;
          }
        }
      }
    });

    const allRecruiters = Object.values(recruiterStats)
      .filter(r => r.uploaded > 0)
      .sort((a, b) => b.uploaded - a.uploaded);

    // Limit based on screen size to prevent label crowding
    const maxRecruiters = screenSize === 'mobile' ? 5 : screenSize === 'tablet' ? 8 : 12;
    return allRecruiters.slice(0, maxRecruiters);
  }, [candidates, users, screenSize, dateRange, jobs, openJobIds]);

  // Prepare Top Recruiters Data (for the table)
  const topRecruiters = useMemo(() => {
    return recruiterPerformanceData.slice(0, 5).map(r => ({
      name: r.name,
      count: r.uploaded
    }));
  }, [recruiterPerformanceData]);

  return (
    <div className="text-slate-800 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Analytics Overview</h1>
          <p className="text-sm lg:text-base text-slate-500 mt-1">
            Real-time insights into user activity and recruitment performance.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-3 sm:p-2 rounded-lg shadow border border-slate-200">
          <div className="flex flex-col flex-1 sm:flex-initial">
            <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent p-1 w-full"
            />
          </div>
          <span className="text-slate-400 hidden sm:inline">-</span>
          <div className="flex flex-col flex-1 sm:flex-initial">
            <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent p-1 w-full"
            />
          </div>
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={clearFilter}
              className="px-3 py-2 sm:px-2 sm:py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors self-center"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards — Row 1: Active Clients | Positions Left | Active Requirements */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {/* Active Clients */}
        <div
          onClick={() => navigate("/Admin/Clients")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-purple-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Active Clients</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.activeClients}</h2>
            <p className="text-[10px] text-slate-400 mt-1">Clients with open jobs</p>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
            <Building2 size={24} />
          </div>
        </div>

        {/* Positions Left */}
        <div
          onClick={() => navigate("/Admin/Jobs")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-emerald-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Positions Left</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.positionsLeft}</h2>
            <p className="text-[10px] text-slate-400 mt-1">Open positions – joined</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <Briefcase size={24} />
          </div>
        </div>

        {/* Active Requirements */}
        <div
          onClick={() => navigate("/Admin/Jobs")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-amber-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Active Requirements</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.activeRequirements}</h2>
            <p className="text-[10px] text-slate-400 mt-1">Jobs with Open status</p>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-lg">
            <Briefcase size={24} />
          </div>
        </div>
      </div>

      {/* Summary Cards — Row 2: Total Candidates + Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {/* Active Candidates */}
        <div
          onClick={() => navigate("/Admin/reports")}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-blue-200 col-span-2 sm:col-span-1"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Active Candidates</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.activeCandidates}</h2>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
            <Users size={22} />
          </div>
        </div>

        {/* New */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-xs font-medium">New</p>
            <h2 className="text-2xl font-bold mt-1 text-slate-800">{stats.New}</h2>
          </div>
          <div className="bg-blue-50 text-blue-500 p-2.5 rounded-lg">
            <UserPlus size={20} />
          </div>
        </div>

        {/* Screen */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-xs font-medium">Screen</p>
            <h2 className="text-2xl font-bold mt-1 text-slate-800">{stats.Screen}</h2>
          </div>
          <div className="bg-indigo-50 text-indigo-500 p-2.5 rounded-lg">
            <Monitor size={20} />
          </div>
        </div>

        {/* Interviewed */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-xs font-medium">Interviewed</p>
            <h2 className="text-2xl font-bold mt-1 text-slate-800">{stats.Interviewed}</h2>
          </div>
          <div className="bg-orange-50 text-orange-500 p-2.5 rounded-lg">
            <MessageSquare size={20} />
          </div>
        </div>

        {/* Selected */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-xs font-medium">Selected</p>
            <h2 className="text-2xl font-bold mt-1 text-slate-800">{stats.Selected}</h2>
          </div>
          <div className="bg-yellow-50 text-yellow-500 p-2.5 rounded-lg">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Joined */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-xs font-medium">Joined</p>
            <h2 className="text-2xl font-bold mt-1 text-slate-800">{stats.Joined}</h2>
          </div>
          <div className="bg-emerald-50 text-emerald-500 p-2.5 rounded-lg">
            <CheckCircle size={20} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">User Signups Trend</h2>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recruitment Funnel Chart */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">Candidate Status Distribution</h2>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={recruitmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {recruitmentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recruiter Performance Chart */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 sm:p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Recruiter Performance</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Comparison of candidates uploaded, shortlisted, and joined per recruiter (in selected period)
                {screenSize === 'mobile' && ' - Top 5'}
                {screenSize === 'tablet' && ' - Top 8'}
                {screenSize === 'desktop' && ' - Top 12'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium">
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
                <span>Joined/Selected</span>
              </div>
            </div>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={recruiterPerformanceData}
                margin={{ top: 10, right: 10, left: -20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: screenSize === 'mobile' ? 9 : 10 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="uploaded" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 16 : 20} />
                <Bar dataKey="shortlisted" fill="#f97316" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 16 : 20} />
                <Bar dataKey="joined" fill="#10b981" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 16 : 20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Recruiters Table */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Top Performing Recruiters</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[500px]">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4 sm:px-6 whitespace-nowrap">Recruiter Name</th>
                  <th className="py-3 px-4 sm:px-6 whitespace-nowrap">Candidates Added</th>
                  <th className="py-3 px-4 sm:px-6 whitespace-nowrap">Performance Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topRecruiters.length > 0 ? (
                  topRecruiters.map((recruiter, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="py-3 px-4 sm:px-6 font-medium text-slate-800 whitespace-nowrap">{recruiter.name}</td>
                      <td className="py-3 px-4 sm:px-6 text-slate-600">{recruiter.count}</td>
                      <td className="py-3 px-4 sm:px-6">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-gray-100 text-gray-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                          {index === 0 ? "Gold" : index === 1 ? "Silver" : "Bronze"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No recruiter data available in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
