import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, FileText, TrendingUp, Clock, CheckCircle, Plus, UserPlus, Calendar } from 'lucide-react';
import { useAuth } from '../../../context/AuthProvider';
import { useUserContext } from '../../../context/UserProvider';
import { useCandidateContext } from '../../../context/CandidatesProvider';
import { useJobContext } from '../../../context/DataProvider';
import ActivityLogs from '../../AdminPanel/activitylogs';

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
};

export const Dashboard = () => {
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
  });
  const [filteredCandidates, setFilteredCandidates] = useState<any[]>([]);

  useEffect(() => {
    fetchJobs();
    fetchallCandidates();
  }, []);

  useEffect(() => {
    if (!user || !jobs || !candidates || !users) return;

    // --- 1. Filter Jobs ---
    let filteredJobs = [];
    // Get direct reportees
    const directReportees = users.filter((u: any) => u?.reporter?._id === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);

    // If Manager, get indirect reportees (reportees of reportees)
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

    // Filter jobs created by self or reportees
    filteredJobs = jobs.filter((job: any) => {
      const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    // --- 2. Filter Candidates/Applications ---
    const fCandidates = candidates.filter((c: any) => {
      const creatorId = c.createdBy?._id || c.createdBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });
    setFilteredCandidates(fCandidates);

    // --- 3. Calculate Stats ---
    const newStats: Stats = {
      totalJobs: filteredJobs.length,
      openJobs: filteredJobs.filter((j: any) => j.status === 'Open').length,
      totalCandidates: fCandidates.length,
      totalApplications: fCandidates.length,
      new: fCandidates.filter((c: any) => c.status === 'New').length,
      shortlisted: fCandidates.filter((c: any) => c.status === 'Shortlisted').length,
      interviewed: fCandidates.filter((c: any) => c.status === 'Interviewed').length,
      selected: fCandidates.filter((c: any) => c.status === 'Selected').length,
      joined: fCandidates.filter((c: any) => c.status === 'Joined').length,
      rejected: fCandidates.filter((c: any) => c.status === 'Rejected').length,
    };

    setStats(newStats);

  }, [user, jobs, candidates, users]);

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
      label: 'Total Applications',
      value: stats.totalApplications,
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      path: '/Mentor/applications'
    },
    {
      label: 'Hired',
      value: stats.selected + stats.joined,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      path: '/Mentor/candidates' // Or applications, filtered by status
    },
  ];

  const pipelineStages = [
    { label: 'New', value: stats.new, color: 'bg-yellow-400' },
    { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-blue-400' },
    { label: 'Interviewed', value: stats.interviewed, color: 'bg-cyan-400' },
    { label: 'Selected', value: stats.selected, color: 'bg-purple-400' },
    { label: 'Joined', value: stats.joined, color: 'bg-green-400' },
    { label: 'Rejected', value: stats.rejected, color: 'bg-red-400' },
  ];

  const upcomingInterviews = filteredCandidates.filter(
    (c) => c.status?.toLowerCase() === "interviewed"
  );

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Mentor Dashboard
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Overview of your recruitment activities and pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              onClick={() => navigate(stat.path)}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-xl ${stat.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                  <Icon className={`w-7 h-7 ${stat.color.replace('bg-', 'text-').replace('500', '600')}`} />
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-50 text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-gray-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <button
                onClick={() => navigate('/Mentor/jobs/create')}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group border border-blue-200/50"
              >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-blue-900">Post Job</span>
              </button>
              <button
                onClick={() => navigate('/Mentor/candidates/add')}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group border border-purple-200/50"
              >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-purple-900">Add Candidate</span>
              </button>
              <button
                onClick={() => navigate('/Mentor/candidates?status=Interviewed')}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 group border border-green-200/50"
              >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-bold text-green-900">Interviews</span>
              </button>
              <button
                onClick={() => navigate('/Mentor/applications')}
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 group border border-orange-200/50"
              >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-bold text-orange-900">Applications</span>
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
