import { useEffect, useMemo } from "react";
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

  // Calculate Stats
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalCandidates = candidates.length;
    const totalJobs = jobs.length;
    const totalClients = clients.length;

    // Calculate growth (comparing this month vs last month)
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const usersThisMonth = users.filter(u => new Date(u.createdAt) >= startOfThisMonth).length;
    const usersLastMonth = users.filter(u => {
      const d = new Date(u.createdAt);
      return d >= startOfLastMonth && d < startOfThisMonth;
    }).length;

    let growthValue = 0;
    if (usersLastMonth > 0) {
      growthValue = ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100;
    } else if (usersThisMonth > 0) {
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
  }, [users, candidates, jobs, clients]);

  // Prepare Chart Data: User Growth Trend (Last 6 months)
  const userGrowthData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    interface MonthlyData {
      name: string;
      month: number;
      year: number;
      users: number;
    }
    const last6Months: MonthlyData[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        name: months[d.getMonth()],
        month: d.getMonth(),
        year: d.getFullYear(),
        users: 0
      });
    }

    users.forEach(u => {
      const d = new Date(u.createdAt);
      const m = d.getMonth();
      const y = d.getFullYear();

      const monthIndex = last6Months.findIndex(item => item.month === m && item.year === y);
      if (monthIndex !== -1) {
        last6Months[monthIndex].users += 1;
      }
    });

    return last6Months;
  }, [users]);

  // Prepare Chart Data: Recruitment Funnel
  const recruitmentData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    candidates.forEach((c) => {
      const status = c.status || "New";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.keys(statusCounts).map((status) => ({
      name: status,
      value: statusCounts[status],
    }));
  }, [candidates]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#f97316", "#8b5cf6", "#ef4444"];

  // Prepare Recruiter Performance Data
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
        recruiterStats[creatorId].uploaded += 1;
        if (c.status === "Shortlisted") recruiterStats[creatorId].shortlisted += 1;
        if (c.status === "Joined" || c.status === "Selected") recruiterStats[creatorId].joined += 1;
      }
    });

    return Object.values(recruiterStats)
      .filter(r => r.uploaded > 0) // Only show those who have done something
      .sort((a, b) => b.uploaded - a.uploaded);
  }, [candidates, users]);

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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Analytics Overview</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">
          Real-time insights into user activity and recruitment performance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div
          onClick={() => navigate("/Admin/Users")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-blue-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Active Users</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.totalUsers}</h2>
              <span className={`text-xs font-bold ${stats.growth.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stats.growth}
              </span>
            </div>
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
            <p className="text-slate-500 text-sm font-medium">Total Applications</p>
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
            <p className="text-slate-500 text-sm font-medium">Active Jobs</p>
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
            <p className="text-slate-500 text-sm font-medium">Total Clients</p>
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
          <h2 className="text-lg font-bold text-slate-800 mb-6">User Onboarding Trend</h2>
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
              <p className="text-sm text-slate-500">Comparison of candidates uploaded, shortlisted, and joined per recruiter</p>
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
                    No recruiter data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
