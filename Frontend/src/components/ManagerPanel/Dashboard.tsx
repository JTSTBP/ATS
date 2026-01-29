import {
  Users,
  Briefcase,
  CalendarCheck,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthProvider"; // Corrected import path
import { useUserContext } from "../../context/UserProvider";
import { useJobContext } from "../../context/DataProvider";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDate } from "../../utils/dateUtils";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { users, fetchUsers } = useUserContext();
  const { jobs, fetchJobs } = useJobContext();
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7); // Default to current month (YYYY-MM)
  });

  useEffect(() => {
    fetchUsers();
    fetchJobs();
    fetchallCandidates();
  }, []);

  const filterByMonth = (dateString: string | undefined) => {
    if (!selectedMonth) return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    const month = date.toISOString().slice(0, 7); // YYYY-MM
    return month === selectedMonth;
  };

  // --- Manager Scoping Logic ---
  const scopedData = useMemo(() => {
    if (!user || !users || !jobs || !candidates) return { scopedJobs: [], scopedCandidates: [] };

    const directReportees = users.filter((u: any) => u?.reporter?._id === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);

    if (user.designation === "Manager") {
      directReportees.forEach((mentor: any) => {
        const mentorReportees = users.filter((u: any) => u?.reporter?._id === mentor._id);
        allReporteeIds = [...allReporteeIds, ...mentorReportees.map((u: any) => u._id)];
      });
    }

    const scopedJobs = jobs.filter((job: any) => {
      const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    const scopedCandidates = candidates.filter((c: any) => {
      const creatorId = c.createdBy?._id || c.createdBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    return { scopedJobs, scopedCandidates, allReporteeIds };
  }, [user, users, jobs, candidates]);

  const { scopedJobs, scopedCandidates, allReporteeIds } = scopedData;

  // Calculate statistics (Identical Logic to Admin)
  const stats = useMemo(() => {
    const filteredJobs = scopedJobs.filter((j) => filterByMonth(j.createdAt));

    const totalCandidates = scopedCandidates.filter((c) => filterByMonth(c.createdAt)).length;
    const activeJobs = scopedJobs.filter((j) => j.status === "Open").length;

    // Status-specific counts
    const newCandidates = scopedCandidates.filter((c) => c.status === "New" && filterByMonth(c.createdAt)).length;
    const shortlistedCandidates = scopedCandidates.filter((c) => c.status === "Shortlisted" && filterByMonth(c.createdAt)).length;
    const interviewedCandidates = scopedCandidates.filter((c) => c.status === "Interviewed" && filterByMonth(c.createdAt)).length;
    const selectedCandidates = scopedCandidates.filter((c) => c.status === "Selected" && filterByMonth(c.selectionDate)).length;

    const totalPositions = filteredJobs.reduce((sum, j) => sum + (Number(j.noOfPositions) || 0), 0);

    const joinedCandidates = scopedCandidates.filter(c => {
      const cJobId = typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
      return (
        c.status === "Joined" &&
        filterByMonth(c.joiningDate) &&
        filteredJobs.some(j => String(j._id) === String(cJobId))
      );
    }).length;

    const remainingPositions = totalPositions - joinedCandidates;

    return {
      totalCandidates,
      activeJobs,
      totalPositions,
      remainingPositions,
      newCandidates,
      shortlistedCandidates,
      interviewedCandidates,
      selectedCandidates,
      joinedCandidates,
    };
  }, [scopedJobs, scopedCandidates, selectedMonth]);

  // Recruiter Performance Data (For team members)
  const recruiterPerformanceData = useMemo(() => {
    const recruiterStats: Record<string, { name: string; uploaded: number; shortlisted: number; joined: number }> = {};

    // Get all team members plus the manager themselves
    const teamMembers = users.filter(u => u._id === user?._id || allReporteeIds.includes(u._id));

    teamMembers.forEach(u => {
      recruiterStats[u._id] = { name: u.name, uploaded: 0, shortlisted: 0, joined: 0 };
    });

    scopedCandidates.forEach((c) => {
      const creatorId = c.createdBy?._id || c.createdBy;
      if (!recruiterStats[creatorId]) return;

      if (filterByMonth(c.createdAt)) {
        recruiterStats[creatorId].uploaded += 1;
        if (c.status === "Shortlisted") recruiterStats[creatorId].shortlisted += 1;
      }
      if (c.status === "Selected" && filterByMonth(c.selectionDate)) {
        recruiterStats[creatorId].joined += 1;
      }
      if (c.status === "Joined" && filterByMonth(c.joiningDate)) {
        recruiterStats[creatorId].joined += 1;
      }
    });

    return Object.values(recruiterStats)
      .sort((a, b) => b.uploaded - a.uploaded);
  }, [scopedCandidates, users, user, selectedMonth, allReporteeIds]);

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back! Here's a summary of your team's recruitment activities.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Filter by Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2 py-1 border-none bg-transparent focus:ring-0 text-sm font-bold curso-pointer"
          />
        </div>
      </div>

      {/* Stats Grid - MATCH ADMIN DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
        {[
          { label: "Total Candidates", value: stats.totalCandidates, icon: Users, color: "indigo", path: "/Manager/candidates" },
          { label: "Total Positions", value: stats.totalPositions, icon: Briefcase, color: "blue", path: "/Manager/jobs" },
          { label: "Positions Left", value: stats.remainingPositions, icon: Briefcase, color: "emerald", path: "/Manager/jobs" },
          { label: "Selected", value: stats.selectedCandidates, icon: CheckCircle, color: "green", path: "/Manager/candidates?status=Selected" },
          { label: "Joined", value: stats.joinedCandidates, icon: Users, color: "emerald", path: "/Manager/candidates?status=Joined" }
        ].map((stat, i) => (
          <div
            key={i}
            onClick={() => navigate(stat.path)}
            className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
          >
            <div>
              <p className={`text-slate-500 text-sm font-medium group-hover:text-${stat.color}-600 transition-colors`}>{stat.label}</p>
              <h2 className="text-3xl font-bold mt-1 text-slate-800">{stat.value}</h2>
            </div>
            <div className={`bg-${stat.color}-50 text-${stat.color}-600 p-3 rounded-xl group-hover:bg-${stat.color}-100 transition-colors`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Recruiter Performance Chart */}
      <div className="bg-white rounded-xl shadow border border-slate-100 p-6 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Team Performance</h3>
            <p className="text-sm text-slate-500">Candidates uploaded, shortlisted, and joined by team members</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500"></div><span>Uploaded</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-orange-500"></div><span>Shortlisted</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div><span>Joined/Selected</span></div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recruiterPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="uploaded" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="shortlisted" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="joined" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Jobs Table - MATCH ADMIN DASHBOARD */}
      <div className="bg-white rounded-xl shadow border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Your Team's Active Jobs</h3>
            <p className="text-sm text-slate-500">Positions currently being worked on by your team</p>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full font-bold">
            {scopedJobs.filter(j => j.status === "Open").length} Open Jobs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Posted Date</th>
                <th className="px-6 py-4">Posted By</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {scopedJobs.filter((j) => j.status === "Open").slice(0, 5).length > 0 ? (
                scopedJobs
                  .filter((j) => j.status === "Open")
                  .slice(0, 5)
                  .map((job) => (
                    <tr key={job._id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4 font-bold text-slate-800">{job.title}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{job.clientId?.companyName || "N/A"}</td>
                      <td className="px-6 py-4 text-slate-500">{job.createdAt ? formatDate(job.createdAt) : "N/A"}</td>
                      <td className="px-6 py-4 text-slate-600">{job.CreatedBy?.name || "N/A"}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-tight">
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">No active jobs found for your team.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {scopedJobs.filter((j) => j.status === "Open").length > 5 && (
          <div className="p-4 border-t border-slate-100 text-center bg-slate-50/30">
            <button
              onClick={() => navigate("/Manager/jobs")}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center justify-center gap-2 mx-auto"
            >
              View All Jobs <TrendingUp size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
