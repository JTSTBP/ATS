import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import ActivityLogs from "../AdminPanel/activitylogs";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import { useUserContext } from "../../context/UserProvider";
import { useJobContext } from "../../context/DataProvider";
import { useNavigate } from "react-router-dom";
import { Plus, UserPlus, Briefcase } from "lucide-react";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { users } = useUserContext();
  const { jobs, fetchJobs } = useJobContext();
  const navigate = useNavigate();
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);

  useEffect(() => {
    fetchallCandidates();
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!candidates || !user || !jobs) return;

    // 🔸 Step 1: Direct reportees (works for mentor & manager)
    const directReportees = users.filter((u) => u?.reporter?._id === user._id);

    let allReporteeIds = directReportees.map((u) => u._id);

    // 🔸 Step 2: ONLY if user is manager → also get mentor's reportees (recruiters)
    if (user.designation === "Manager") {
      directReportees.forEach((mentor) => {
        const mentorReportees = users.filter(
          (u) => u?.reporter?._id === mentor._id
        );
        allReporteeIds = [
          ...allReporteeIds,
          ...mentorReportees.map((u) => u._id),
        ];
      });
    }

    // 🔸 Step 3: Filter candidates
    const filtered = candidates.filter(
      (c) =>
        c.createdBy?._id === user._id ||
        allReporteeIds.includes(c.createdBy?._id)
    );

    setFilteredCandidates(filtered);

    // 🔸 Step 4: Filter jobs
    const fJobs = jobs.filter((job) => {
      const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });
    setFilteredJobs(fJobs);

  }, [candidates, users, user, jobs]);


  const interviewedCandidates = filteredCandidates.filter(
    (c) => c.status?.toLowerCase() === "interviewed"
  );
  const shortlistedCandidates = filteredCandidates.filter(
    (c) => c.status?.toLowerCase() === "shortlisted"
  );
  const activeJobs = filteredJobs.filter(
    (j) => j.status === 'Open'
  );
  const pendingReviews = filteredCandidates.filter(
    (c) => c.status?.toLowerCase() === 'new'
  );

  const stats = [
    {
      name: "Total Candidates",
      value: filteredCandidates.length,
      change: "+12%",
      trend: "up",

      color: "blue",
      icon: Users,
  
      path: "/Manager/candidates"
    },
    {
      name: "Active Jobs",
      value: activeJobs.length,
      change: "+8%",
      trend: "up",
      icon: FileText,
      color: "green",
      path: "/Manager/jobs"
    },
    {
      name: "Shortlisted",
      value: shortlistedCandidates.length,
      change: "+5%",
      trend: "up",
      icon: CheckCircle,
      color: "purple",
      path: "/Manager/candidates?status=Shortlisted"
    },
    {
      name: "Pending Reviews",
      value: pendingReviews.length,
      change: "-3%",
      trend: "down",
      icon: Clock,
      color: "orange",
      path: "/Manager/candidates?status=New"
    },
  ];

  const pipelineStages = [
    { label: 'New', value: pendingReviews.length, color: 'bg-yellow-400' },
    { label: 'Shortlisted', value: shortlistedCandidates.length, color: 'bg-blue-400' },
    { label: 'Interviewed', value: interviewedCandidates.length, color: 'bg-cyan-400' },
    { label: 'Selected', value: filteredCandidates.filter(c => c.status?.toLowerCase() === 'selected').length, color: 'bg-purple-400' },
    { label: 'Joined', value: filteredCandidates.filter(c => c.status?.toLowerCase() === 'joined').length, color: 'bg-green-400' },
    { label: 'Rejected', value: filteredCandidates.filter(c => c.status?.toLowerCase() === 'rejected').length, color: 'bg-red-400' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Manager Dashboard
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Welcome back! Here's an overview of your recruitment activities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            onClick={() => navigate(stat.path)}
            className="bg-white rounded-2xl p-6 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-4 rounded-xl bg-${stat.color}-50 group-hover:bg-${stat.color}-100 transition-colors`}>
                <stat.icon className={`w-7 h-7 text-${stat.color}-600`} />
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-bold ${stat.trend === "up" ? "text-green-600" : "text-red-600"
                  } bg-gray-50 px-2 py-1 rounded-full`}
              >
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-gray-500">{stat.name}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <button
                onClick={() => navigate('/Manager/jobs/create')}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group border border-blue-200/50"
              >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-blue-900">Post Job</span>
              </button>
              <button
                onClick={() => navigate('/Manager/candidates/add')}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group border border-purple-200/50"
              >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-purple-900">Add Candidate</span>
              </button>
              <button
                onClick={() => navigate('/Manager/jobs')}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 group border border-green-200/50"
              >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-bold text-green-900">View Jobs</span>
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
                <ActivityLogs />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Recruitment Funnel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Recruitment Funnel</h3>
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
                      style={{ width: `${filteredCandidates.length > 0 ? (stage.value / filteredCandidates.length) * 100 : 0}%` }}
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
                {interviewedCandidates.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-2">
                    No interviewed candidates yet
                  </p>
                ) : (
                  interviewedCandidates.slice(0, 5).map((interview, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock size={18} className="text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {interview.dynamicFields.candidateName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {interview.jobId.title || "Position not available"}
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
}
