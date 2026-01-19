import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileText, Briefcase, Building2 } from "lucide-react";
import { useUserContext } from "../../context/UserProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useJobContext } from "../../context/DataProvider";
import { useClientsContext } from "../../context/ClientsProvider";
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

export default function AnalyticsTab() {
  const { users, fetchUsers } = useUserContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { jobs, fetchJobs } = useJobContext();
  const { clients, fetchClients } = useClientsContext();
  const navigate = useNavigate();

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
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
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

  // Calculate Stats
  const stats = useMemo(() => {
    const totalUsers = filteredData.users.length;
    const totalCandidates = filteredData.candidates.length;
    const totalJobs = filteredData.jobs.length;
    const totalClients = filteredData.clients.length;

    // If no range, can't calculate growth vs prev period easily.
    if (!dateRange.startDate || !dateRange.endDate) {
      return {
        totalUsers,
        growth: "All Time",
        totalCandidates,
        totalJobs,
        totalClients
      };
    }

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const duration = end.getTime() - start.getTime();

    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start.getTime());

    const usersPrevPeriod = users.filter(u => {
      const d = new Date(u.createdAt);
      return d >= prevStart && d < prevEnd;
    }).length;

    let growthValue = 0;
    if (usersPrevPeriod > 0) {
      growthValue = ((totalUsers - usersPrevPeriod) / usersPrevPeriod) * 100;
    } else if (totalUsers > 0) {
      growthValue = 100;
    }

    const growth = growthValue >= 0 ? `+${growthValue.toFixed(1)}%` : `${growthValue.toFixed(1)}%`;

    return {
      totalUsers,
      growth,
      totalCandidates,
      totalJobs,
      totalClients
    };
  }, [filteredData, users, dateRange]);

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

  // Prepare Chart Data: Recruitment Funnel (Filtered)
  const recruitmentData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredData.candidates.forEach((c) => {
      const status = c.status || "New";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.keys(statusCounts).map((status) => ({
      name: status,
      value: statusCounts[status],
    }));
  }, [filteredData.candidates]);

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

    filteredData.candidates.forEach((c) => {
      const creator = c.createdBy;
      if (!creator) return;

      const creatorId = typeof creator === 'object' && '_id' in creator ? (creator as any)._id : String(creator);

      // If the recruiter exists in our list (is a recruiter or admin)
      if (recruiterStats[creatorId]) {
        recruiterStats[creatorId].uploaded += 1;
        if (c.status === "Shortlisted") recruiterStats[creatorId].shortlisted += 1;
        if (c.status === "Joined" || c.status === "Selected") recruiterStats[creatorId].joined += 1;
      }
    });

    return Object.values(recruiterStats)
      .filter(r => r.uploaded > 0) // Only show those who have done something
      .sort((a, b) => b.uploaded - a.uploaded);
  }, [filteredData.candidates, users]);

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics Overview</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Real-time insights into user activity and recruitment performance.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow border border-slate-200">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent p-1"
            />
          </div>
          <span className="text-slate-400">-</span>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent p-1"
            />
          </div>
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={clearFilter}
              className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div
          onClick={() => navigate("/Admin/Users")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-blue-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Active Users</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.totalUsers}</h2>
              <span className={`text-xs font-bold ${stats.growth.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stats.growth}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">vs previous period</p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
            <Users size={24} />
          </div>
        </div>

        <div
          onClick={() => navigate("/Admin/reports")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-orange-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">New Applications</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.totalCandidates}</h2>
          </div>
          <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
            <FileText size={24} />
          </div>
        </div>

        <div
          onClick={() => navigate("/Admin/Jobs")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-emerald-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Jobs Posted</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.totalJobs}</h2>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <Briefcase size={24} />
          </div>
        </div>

        <div
          onClick={() => navigate("/Admin/Clients")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-purple-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">New Clients</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.totalClients}</h2>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
            <Building2 size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">User Signups Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
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
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Candidate Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={recruitmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {recruitmentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recruiter Performance Chart */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Recruiter Performance</h2>
              <p className="text-sm text-slate-500">Comparison of candidates uploaded, shortlisted, and joined per recruiter (in selected period)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recruiterPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  interval={0}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="uploaded" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="shortlisted" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="joined" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Recruiters Table */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Top Performing Recruiters</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-6">Recruiter Name</th>
                  <th className="py-3 px-6">Candidates Added</th>
                  <th className="py-3 px-6">Performance Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topRecruiters.length > 0 ? (
                  topRecruiters.map((recruiter, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="py-3 px-6 font-medium text-slate-800">{recruiter.name}</td>
                      <td className="py-3 px-6 text-slate-600">{recruiter.count}</td>
                      <td className="py-3 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${index === 0 ? "bg-yellow-100 text-yellow-700" :
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
