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
import { useScreenSize } from "../../hooks/useScreenSize";

export default function ManagerDashboard() {
  const screenSize = useScreenSize();
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

    const maxRecruiters = screenSize === 'mobile' ? 5 : screenSize === 'tablet' ? 8 : 12;
    return Object.values(recruiterStats)
      .sort((a, b) => b.uploaded - a.uploaded)
      .slice(0, maxRecruiters);
  }, [scopedCandidates, users, user, selectedMonth, allReporteeIds, screenSize]);

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Manager Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Welcome back! Here's a summary of your team's recruitment activities.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 w-fit">
          <span className="text-xs sm:text-sm font-semibold text-slate-600 whitespace-nowrap uppercase tracking-wider">Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-2 py-0.5 border-none bg-transparent focus:ring-0 text-sm sm:text-base font-bold text-blue-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-8 sm:mb-10">
        {[
          { label: "Total Candidates", value: stats.totalCandidates, icon: Users, color: "blue", path: "/Manager/candidates" },
          { label: "Total Positions", value: stats.totalPositions, icon: Briefcase, color: "indigo", path: "/Manager/jobs" },
          { label: "Positions Left", value: stats.remainingPositions, icon: Briefcase, color: "orange", path: "/Manager/jobs" },
          { label: "Selected", value: stats.selectedCandidates, icon: CheckCircle, color: "emerald", path: "/Manager/candidates?status=Selected" },
          { label: "Joined", value: stats.joinedCandidates, icon: Users, color: "green", path: "/Manager/candidates?status=Joined" }
        ].map((stat, i) => (
          <div
            key={i}
            onClick={() => navigate(stat.path)}
            className="bg-white rounded-xl shadow-sm p-5 sm:p-6 flex justify-between items-center hover:shadow-md transition-all border border-slate-100 cursor-pointer group"
          >
            <div>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold uppercase tracking-wider">{stat.label}</p>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-slate-800">{stat.value}</h2>
            </div>
            <div className={`p-3 rounded-xl transition-colors ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' :
                stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100' :
                  stat.color === 'orange' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-100' :
                    stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' :
                      'bg-green-50 text-green-600 group-hover:bg-green-100'
              }`}>
              <stat.icon size={screenSize === 'mobile' ? 20 : 24} />
            </div>
          </div>
        ))}
      </div>

      {/* Recruiter Performance Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-8 mb-8 sm:mb-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8 gap-4 sm:gap-6">
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-slate-800 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              Team Performance
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Candidates uploaded, shortlisted, and joined by team members</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500"></div><span>Uploaded</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-orange-500"></div><span>Shortlisted</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div><span>Joined/Selected</span></div>
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
                tick={{ fill: '#64748b', fontSize: screenSize === 'mobile' ? 9 : 11 }}
                interval={0}
                angle={screenSize === 'mobile' ? -45 : 0}
                textAnchor={screenSize === 'mobile' ? 'end' : 'middle'}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="uploaded" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 16 : 24} />
              <Bar dataKey="shortlisted" fill="#f97316" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 16 : 24} />
              <Bar dataKey="joined" fill="#10b981" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 16 : 24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {recruiterPerformanceData.length > 0 && (
          <p className="mt-4 text-[10px] sm:text-xs text-slate-400 italic text-center">
            Showing top {recruiterPerformanceData.length} team members based on screen size
          </p>
        )}
      </div>

      {/* Active Jobs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 sm:mb-10">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Your Team's Active Jobs</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Positions currently being worked on by your team</p>
          </div>
          <span className="bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
            {scopedJobs.filter(j => j.status === "Open").length} Open Jobs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
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
