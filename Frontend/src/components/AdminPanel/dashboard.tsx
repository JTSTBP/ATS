import { Users, ShieldCheck, Briefcase, CalendarCheck } from "lucide-react";
import { useUserContext } from "../../context/UserProvider";
import { useJobContext } from "../../context/DataProvider";
import { formatDate } from "../../utils/dateUtils";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const { users, leaves, fetchAllLeaves, fetchUsers } = useUserContext();
  const { jobs, fetchJobs } = useJobContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log(user, "user")
  // Fetch data on mount
  useEffect(() => {
    fetchUsers();
    fetchAllLeaves();
    fetchJobs();
    fetchallCandidates();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeAdmins = users.filter((u) => u.isAdmin).length;
    // Case-insensitive check for 'Recruiter' designation
    const recruiters = users.filter(
      (u) => u.designation?.toLowerCase() === "recruiter"
    ).length;
    const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
    const activeJobs = jobs.filter((j) => j.status === "Open").length;

    return {
      totalUsers,
      activeAdmins,
      recruiters,
      pendingLeaves,
      activeJobs,
    };
  }, [users, leaves, jobs]);

  // Prepare Recruiter Performance Data
  const recruiterPerformanceData = useMemo(() => {
    const recruiterStats: Record<string, { name: string; uploaded: number; shortlisted: number; joined: number }> = {};

    // Initialize with all recruiters
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

      recruiterStats[creatorId].uploaded += 1;
      if (c.status === "Shortlisted") recruiterStats[creatorId].shortlisted += 1;
      if (c.status === "Joined" || c.status === "Selected") recruiterStats[creatorId].joined += 1;
    });

    return Object.values(recruiterStats)
      .sort((a, b) => b.uploaded - a.uploaded);
  }, [candidates, users]);

  return (
    <div className="text-slate-800">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">
          Welcome back, Admin! Here's a quick summary of your portal activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Users */}
        <div
          onClick={() => navigate("/Admin/Users")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-blue-600 transition-colors">
              Total Users
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.totalUsers}
            </h2>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
            <Users size={24} />
          </div>
        </div>

        {/* Active Admins */}
        <div
          onClick={() => navigate("/Admin/Users?isAdmin=true")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-green-600 transition-colors">
              Active Admins
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.activeAdmins}
            </h2>
          </div>
          <div className="bg-green-50 text-green-600 p-3 rounded-xl group-hover:bg-green-100 transition-colors">
            <ShieldCheck size={24} />
          </div>
        </div>

        {/* Recruiters */}
        <div
          onClick={() => navigate("/Admin/Users?role=Recruiter")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-orange-600 transition-colors">
              Recruiters
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.recruiters}
            </h2>
          </div>
          <div className="bg-orange-50 text-orange-600 p-3 rounded-xl group-hover:bg-orange-100 transition-colors">
            <Briefcase size={24} />
          </div>
        </div>

        {/* Pending Leaves */}
        <div
          onClick={() => navigate("/Admin/leaveApplications?status=Pending")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-purple-600 transition-colors">
              Pending Leaves
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {stats.pendingLeaves}
            </h2>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-xl group-hover:bg-purple-100 transition-colors">
            <CalendarCheck size={24} />
          </div>
        </div>
      </div>

      {/* Recruiter Performance Chart */}
      <div className="bg-white rounded-xl shadow border border-slate-100 p-6 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Recruiter Performance</h3>
            <p className="text-sm text-slate-500">Candidates uploaded, shortlisted, and joined</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
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
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recruiterPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval={0}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="uploaded" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="shortlisted" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="joined" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-[11px] text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-800 uppercase mr-1">Note:</span>
            <span className="text-blue-600 font-semibold">Blue</span>: Total Uploads |
            <span className="text-orange-600 font-semibold ml-1">Orange</span>: Shortlisted |
            <span className="text-emerald-600 font-semibold ml-1">Green</span>: Selected/Joined.
            Showing all recruiters.
          </p>
        </div>
      </div>

      {/* Active Jobs Section */}
      <div className="bg-white rounded-xl shadow border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              Active Job Postings
            </h3>
            <p className="text-sm text-slate-500">Currently open positions</p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">
            {stats.activeJobs} Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Posted Date</th>
                <th className="px-6 py-4">Posted By</th>
                <th className="px-6 py-4 text-right">Status</th>
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
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {job.title}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {Array.isArray(job.location)
                          ? job.location.map((l: any) => l.name).join(", ")
                          : typeof job.location === "object" &&
                            job.location !== null
                            ? (job.location as any).name
                            : job.location}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {job.clientId?.companyName || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {job.createdAt
                          ? formatDate(job.createdAt)
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {job.CreatedBy?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No active jobs found.
                  </td>
                </tr>
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
              View All Jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
