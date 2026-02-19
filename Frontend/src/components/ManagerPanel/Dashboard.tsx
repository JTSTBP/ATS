import {
  Users,
  Briefcase,
  CalendarCheck,
  CheckCircle,
  TrendingUp,
  Building2,
  UserPlus,
  ClipboardCheck,
  Clock,
} from "lucide-react";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useEffect, useState, useMemo, useCallback } from "react";
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

  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });

  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const filterByRange = (dateString: string | undefined) => {
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

  // --- Manager Scoping Logic ---
  const scopedData = useMemo(() => {
    if (!user || !users || !jobs || !candidates) return { scopedJobs: [], scopedCandidates: [] };

    // Designation-agnostic recursive reporting
    const directReportees = users.filter((u: any) => (u?.reporter?._id || u?.reporter) === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);

    // Get 2nd level reportees (e.g., Recruiters reporting to Mentors)
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

    return { scopedJobs, scopedCandidates, allReporteeIds };
  }, [user, users, jobs, candidates]);

  const { scopedJobs, scopedCandidates, allReporteeIds } = scopedData;

  // Centralized Helper for Stats & Performance Calculation
  const openJobIds = useMemo(() => {
    const openJobs = scopedJobs.filter(j => j.status === "Open");
    return new Set(openJobs.map(job => (job._id || "").toString()));
  }, [scopedJobs]);

  const getCandidateJobId = useCallback((c: any) => {
    const jid = c.jobId?._id || c.jobId;
    return jid ? String(jid) : null;
  }, []);

  const isOpenJobCandidate = useCallback((c: any) => {
    const jid = getCandidateJobId(c);
    return jid && openJobIds.has(jid);
  }, [openJobIds, getCandidateJobId]);

  // Calculate statistics (Identical Logic to Admin)
  const stats = useMemo(() => {
    // 1. Global (System Status) Statistics for Scoped Requirements
    const openJobs = scopedJobs.filter(j => j.status === "Open");
    const activeJobs = openJobs.length;

    // Active Clients linked to Open jobs in scope
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

    // Remaining Positions for Open jobs in scope: sum(positions) - sum(joined)
    const totalPositionsGlobal = openJobs.reduce((sum, j) => sum + (Number(j.noOfPositions) || 0), 0);
    const totalJoinedInOpenJobs = scopedCandidates.filter(c =>
      c.status === "Joined" && isOpenJobCandidate(c)
    ).length;
    const remainingPositions = Math.max(0, totalPositionsGlobal - totalJoinedInOpenJobs);

    // 2. Range-based (Activity) Statistics
    const totalCandidates = scopedCandidates.filter((c) => filterByRange(c.createdAt) && isOpenJobCandidate(c)).length;

    // Status-specific counts
    const newCandidates = scopedCandidates.filter((c) => c.status === "New" && filterByRange(c.createdAt) && isOpenJobCandidate(c)).length;
    const shortlistedCandidates = scopedCandidates.filter((c) => (c.status === "Shortlisted" || c.status === "Screen" || c.status === "Screened") && filterByRange(c.createdAt) && isOpenJobCandidate(c)).length;
    const interviewedCandidates = scopedCandidates.filter((c) => c.status === "Interviewed" && filterByRange(c.createdAt) && isOpenJobCandidate(c)).length;
    const selectedCandidates = scopedCandidates.filter((c) => c.status === "Selected" && (c.selectionDate ? filterByRange(String(c.selectionDate)) : false) && isOpenJobCandidate(c)).length;
    const joinedCandidates = scopedCandidates.filter((c) => c.status === "Joined" && (c.joiningDate ? filterByRange(String(c.joiningDate)) : false) && isOpenJobCandidate(c)).length;

    return {
      totalCandidates,
      activeJobs,
      activeClients,
      remainingPositions,
      newCandidates,
      shortlistedCandidates,
      interviewedCandidates,
      selectedCandidates,
      joinedCandidates,
    };
  }, [scopedJobs, scopedCandidates, startDate, endDate, isOpenJobCandidate]);

  // Recruiter Performance Data (For team members)
  const recruiterPerformanceData = useMemo(() => {
    const recruiterStats: Record<string, { name: string; uploaded: number; shortlisted: number; joined: number }> = {};

    // Get all team members plus the manager themselves
    const teamMembers = users.filter(u => u._id === user?._id || (allReporteeIds || []).includes(u._id));

    teamMembers.forEach(u => {
      recruiterStats[u._id] = { name: u.name, uploaded: 0, shortlisted: 0, joined: 0 };
    });

    scopedCandidates.forEach((c) => {
      const creatorId = c.createdBy?._id || c.createdBy;
      if (!recruiterStats[creatorId]) return;

      if (filterByRange(c.createdAt) && isOpenJobCandidate(c)) {
        recruiterStats[creatorId].uploaded += 1;
        if (["Shortlisted", "Screen", "Screened"].includes(c.status || "")) {
          recruiterStats[creatorId].shortlisted += 1;
        }
      }
      if (c.status === "Joined" && (c.joiningDate ? filterByRange(String(c.joiningDate)) : false) && isOpenJobCandidate(c)) {
        recruiterStats[creatorId].joined += 1;
      }
    });

    const maxRecruiters = screenSize === 'mobile' ? 5 : screenSize === 'tablet' ? 8 : 12;
    return Object.values(recruiterStats)
      .sort((a, b) => b.uploaded - a.uploaded)
      .slice(0, maxRecruiters);
  }, [scopedCandidates, users, user, startDate, endDate, allReporteeIds, screenSize, isOpenJobCandidate]);

  useEffect(() => {
    fetchUsers();
    fetchJobs();
    fetchallCandidates();
  }, []);

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">Manager Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Welcome back! Here's a summary of your team's recruitment activities.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-col xs:flex-row items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 flex-1">
              <CalendarCheck size={16} className="text-indigo-500 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm font-semibold focus:ring-0 cursor-pointer p-0"
              />
            </div>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden xs:block">to</div>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm font-semibold focus:ring-0 cursor-pointer p-0"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all h-full self-stretch sm:self-auto flex items-center justify-center border border-red-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
        {[
          { label: "Active Clients", value: stats.activeClients, icon: Building2, color: "purple", path: "/Manager/clients" },
          { label: "Positions Left", value: stats.remainingPositions, icon: Briefcase, color: "orange", path: "/Manager/jobs" },
          { label: "Active Requirements", value: stats.activeJobs, icon: CalendarCheck, color: "amber", path: "/Manager/jobs" },
          { label: "Total Candidates", value: stats.totalCandidates, icon: Users, color: "blue", path: "/Manager/candidates" },
          { label: "New", value: stats.newCandidates, icon: UserPlus, color: "blue", path: "/Manager/candidates" },
          { label: "Screen", value: stats.shortlistedCandidates, icon: ClipboardCheck, color: "orange", path: "/Manager/candidates" },
          { label: "Interviewed", value: stats.interviewedCandidates, icon: Clock, color: "purple", path: "/Manager/candidates" },
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
