import { Users, Briefcase, CalendarCheck, UserPlus, ClipboardCheck, Clock, CheckCircle, Filter, X, Building2 } from "lucide-react";
import { useUserContext } from "../../context/UserProvider";
import { useJobContext } from "../../context/DataProvider";
import { useClientsContext } from "../../context/ClientsProvider";
import { formatDate } from "../../utils/dateUtils";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import FinanceDashboard from "./FinanceDashboard";
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

export default function AdminDashboard() {
  const { users, leaves, fetchAllLeaves, fetchUsers } = useUserContext();
  const { jobs, fetchJobs } = useJobContext();
  const { clients, fetchClients } = useClientsContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const screenSize = useScreenSize();

  console.log(user, "user")
  // Fetch data on mount
  useEffect(() => {
    fetchUsers();
    fetchAllLeaves();
    fetchJobs();
    fetchallCandidates();
    fetchClients();
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

  // If user is Finance, show Finance Dashboard
  if (user?.designation === 'Finance') {
    return <FinanceDashboard />;
  }

  // Filter functions
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
    const openJobIds = new Set(openJobs.map(job => job._id.toString()));
    const totalJoinedInOpenJobs = candidates.filter(candidate =>
      candidate.status === "Joined" &&
      candidate.jobId &&
      openJobIds.has(candidate.jobId._id.toString())
    ).length;


    // const totalJoinedInOpenJobs = openJobs.reduce((sum, j) => sum + (Number(j.joined) || 0), 0);
    const remainingPositions = Math.max(0, totalPositions - totalJoinedInOpenJobs);


    // helper function
    const isOpenJobCandidate = (candidate) =>
      candidate.jobId &&
      openJobIds.has(candidate.jobId._id.toString());


    // Status-specific counts for candidates in range
    // const newCandidates = candidates.filter((c) => c.status === "New" && filterByRange(c.createdAt)).length;
    // const shortlistedCandidates = candidates.filter((c) => (c.status === "Shortlisted" || c.status === "Screen" || c.status === "Screened") && filterByRange(c.createdAt)).length;
    // const interviewedCandidates = candidates.filter((c) => c.status === "Interviewed" && filterByRange(c.createdAt)).length;

    // // Selection and Join counts based on their specific event dates in range
    // const selectedCandidates = candidates.filter((c) => c.status === "Selected" && filterByRange(c.selectionDate)).length;
    // const joinedCandidates = candidates.filter((c) => c.status === "Joined" && filterByRange(c.joiningDate)).length;

    const totalCandidates = candidates.filter(c =>
      filterByRange(getStatusTimestamp(c, (c.status as string) || "New")) &&
      isOpenJobCandidate(c)
    ).length;

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

    // Selection count based on selectionDate/statusHistory
    const selectedCandidates = candidates.filter(c =>
      c.status === "Selected" &&
      filterByRange(getStatusTimestamp(c, "Selected", c.selectionDate)) &&
      isOpenJobCandidate(c)
    ).length;

    // Joined count based on joiningDate/statusHistory
    const joinedCandidates = candidates.filter(c =>
      c.status === "Joined" &&
      filterByRange(getStatusTimestamp(c, "Joined", c.joiningDate)) &&
      isOpenJobCandidate(c)
    ).length;
    console.log(totalCandidates, "totalCandidates")
    return {
      totalCandidates,
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
  }, [users, leaves, jobs, candidates, clients, startDate, endDate]);

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

      // 1. Uploaded/Shortlisted check (by status history)
      if (filterByRange(getStatusTimestamp(c, (c.status as string) || "New"))) {
        recruiterStats[creatorId].uploaded += 1;
        if (["Shortlisted", "Screen", "Screened"].includes(c.status || "")) {
          recruiterStats[creatorId].shortlisted += 1;
        }
      }

      // 2. Selected check (by status history)
      if (c.status === "Selected" && filterByRange(getStatusTimestamp(c, "Selected", c.selectionDate))) {
        recruiterStats[creatorId].joined += 1;
      }

      // 3. Joined check (by status history)
      if (c.status === "Joined" && filterByRange(getStatusTimestamp(c, "Joined", c.joiningDate))) {
        recruiterStats[creatorId].joined += 1;
      }
    });

    const allRecruiters = Object.values(recruiterStats)
      .sort((a, b) => b.uploaded - a.uploaded);

    // Limit based on screen size to prevent label crowding
    const maxRecruiters = screenSize === 'mobile' ? 5 : screenSize === 'tablet' ? 8 : 12;
    return allRecruiters.slice(0, maxRecruiters);
  }, [candidates, users, startDate, endDate, screenSize]);

  return (
    <div className="text-slate-800">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            Welcome back, Admin! Here's a quick summary of your portal activity.
          </p>
        </div>

        {/* Date Range Filter - Simplified */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
            <CalendarCheck className="w-4 h-4 text-slate-500" />

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 p-0 w-24 cursor-pointer"
              />
              <span className="text-slate-300 font-bold px-1">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 p-0 w-24 cursor-pointer"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-1 border-l border-slate-200 pl-2"
                title="Clear Filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
        {/* Active Clients */}
        <div
          onClick={() => navigate("/Admin/clients")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-emerald-600 transition-colors">
              Active Clients
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.activeClients}
            </h2>
            <p className="text-[10px] text-slate-400 mt-1">Clients with open jobs</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
            <Building2 size={24} />
          </div>
        </div>

        {/* Positions Left */}
        <div
          onClick={() => navigate("/Admin/jobs")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-amber-600 transition-colors">
              Positions Left
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.remainingPositions}
            </h2>
            <p className="text-[10px] text-slate-400 mt-1">Open positions – joined</p>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-100 transition-colors">
            <Briefcase size={24} />
          </div>
        </div>

        {/* Active Requirements */}
        <div
          onClick={() => navigate("/Admin/jobs")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-blue-600 transition-colors">
              Active Requirements
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.activeJobs}
            </h2>
            <p className="text-[10px] text-slate-400 mt-1">Jobs with Open status</p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
            <CalendarCheck size={24} />
          </div>
        </div>

        {/* Total Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">
              Total Candidates
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.totalCandidates}
            </h2>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
            <Users size={24} />
          </div>
        </div>

        {/* New Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-sky-600 transition-colors">
              New
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.newCandidates}
            </h2>
          </div>
          <div className="bg-sky-50 text-sky-600 p-3 rounded-xl group-hover:bg-sky-100 transition-colors">
            <UserPlus size={24} />
          </div>
        </div>

        {/* Screened Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-orange-600 transition-colors">
              Screen
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.shortlistedCandidates}
            </h2>
          </div>
          <div className="bg-orange-50 text-orange-600 p-3 rounded-xl group-hover:bg-orange-100 transition-colors">
            <ClipboardCheck size={24} />
          </div>
        </div>

        {/* Interviewed Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-purple-600 transition-colors">
              Interviewed
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.interviewedCandidates}
            </h2>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-xl group-hover:bg-purple-100 transition-colors">
            <Clock size={24} />
          </div>
        </div>

        {/* Selected Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-green-600 transition-colors">
              Selected
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.selectedCandidates}
            </h2>
          </div>
          <div className="bg-green-50 text-green-600 p-3 rounded-xl group-hover:bg-green-100 transition-colors">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Joined Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-emerald-600 transition-colors">
              Joined
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.joinedCandidates}
            </h2>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Recruiter Performance Chart */}
      <div className="bg-white rounded-xl shadow border border-slate-100 p-4 sm:p-6 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6 gap-4">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-800">Recruiter Performance</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Candidates uploaded, shortlisted, and joined
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
        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recruiterPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 80 }}>
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
              <Bar dataKey="uploaded" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 20 : 24} />
              <Bar dataKey="shortlisted" fill="#f97316" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 20 : 24} />
              <Bar dataKey="joined" fill="#10b981" radius={[4, 4, 0, 0]} barSize={screenSize === 'mobile' ? 20 : 24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-[10px] sm:text-[11px] text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-800 uppercase mr-1">Note:</span>
            <span className="text-blue-600 font-semibold">Blue</span>: Total Uploads |
            <span className="text-orange-600 font-semibold ml-1">Orange</span>: Shortlisted |
            <span className="text-emerald-600 font-semibold ml-1">Green</span>: Selected/Joined.
            {screenSize === 'desktop' ? ' Showing top 12 recruiters.' : screenSize === 'tablet' ? ' Showing top 8 recruiters.' : ' Showing top 5 recruiters.'}
          </p>
        </div>
      </div>

      {/* Active Jobs Section */}
      <div className="bg-white rounded-xl shadow border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-800">
              Active Requirements
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">Currently open positions</p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">
            {stats.remainingPositions} openings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Job Title</th>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Location</th>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Client</th>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Posted Date</th>
                <th className="px-4 sm:px-6 py-4 whitespace-nowrap">Posted By</th>
                <th className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.filter((j) => j.status === "Open").slice(0, 5).length >
                0 ? (
                jobs
                  .filter((j) => j.status === "Open")
                  .slice(0, 5)
                  .map((job) => (
                    <tr
                      key={job._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 font-medium text-slate-800 text-sm">
                        {job.title}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-slate-600 text-sm">
                        {Array.isArray(job.location)
                          ? job.location.map((l: any) => l.name).join(", ")
                          : typeof job.location === "object" &&
                            job.location !== null
                            ? (job.location as any).name
                            : job.location}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-slate-600 text-sm">
                        {job.clientId?.companyName || "N/A"}
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-slate-500 text-sm">
                        {job.createdAt
                          ? formatDate(job.createdAt)
                          : "N/A"}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-slate-600 text-sm">
                        {job.CreatedBy?.name || "N/A"}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
              ) : (
                <td
                  colSpan={6}
                  className="px-4 sm:px-6 py-8 text-center text-slate-500"
                >
                  No active requirements found.
                </td>
              )}
            </tbody>
          </table>
        </div>
        {jobs.filter((j) => j.status === "Open").length > 5 && (
          <div className="p-4 border-t border-slate-100 text-center">
            <button
              onClick={() => navigate("/Admin/jobs")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All Requirements
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
