import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useCandidateContext } from '../../context/CandidatesProvider';
import { useAuth } from '../../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useJobContext } from '../../context/DataProvider';
import { useClientsContext } from '../../context/ClientsProvider';
import PerformanceReportTable from './PerformanceReportTable';

export default function Reports() {
  const { user } = useAuth();
  const { candidates, fetchCandidatesByUser, loading } = useCandidateContext();
  const { fetchJobs } = useJobContext();
  const { fetchClients } = useClientsContext();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const filterByRange = (dateString: string | null | undefined, start: string, end: string) => {
    if (!start && !end) return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    const s = start ? new Date(start) : new Date(0);
    s.setHours(0, 0, 0, 0);
    const e = end ? new Date(end) : new Date(8640000000000000);
    e.setHours(23, 59, 59, 999);
    return date >= s && date <= e;
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchJobs();
    fetchClients();
    if (user?._id) {
      fetchCandidatesByUser(user._id);
    }
  }, [user]);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    if (!user || !candidates) return {
      totalApplications: 0,
      interviews: 0,
      hires: 0,
      screening: 0,
      shortlisted: 0,
      rejected: 0,
    };

    const userCandidates = candidates.filter(c => filterByRange(c.createdAt, startDate, endDate));

    const totalApplications = userCandidates.length;
    const interviews = userCandidates.filter((c) =>
      c.status === 'Interview' || c.status === 'Interviewed'
    ).length;

    const hires = userCandidates.filter((c) =>
      c.status === 'Hired' || c.status === 'Offer' || c.status === 'Joined' || c.status === 'Selected'
    ).length;

    const screening = userCandidates.filter((c) => c.status === 'New' || c.status === 'Screening' || c.status === 'Under Review').length;
    const shortlisted = userCandidates.filter((c) => c.status === 'Shortlisted').length;
    const rejected = userCandidates.filter((c) => c.status === 'Rejected').length;

    return {
      totalApplications,
      interviews,
      hires,
      screening,
      shortlisted,
      rejected,
    };
  }, [candidates, user, startDate, endDate]);

  // Calculate top positions
  const topPositions = useMemo(() => {
    const userCandidates = candidates;

    const jobCounts = userCandidates.reduce((acc, candidate) => {
      const jobTitle = typeof candidate.jobId === 'string' ? 'Unknown Position' : (candidate.jobId as any)?.title || 'Unknown Position';
      acc[jobTitle] = (acc[jobTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(jobCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([position, count]) => ({
        position,
        count,
        percentage:
          stats.totalApplications > 0
            ? (count / stats.totalApplications) * 100
            : 0,
      }));
  }, [candidates, user, stats.totalApplications, startDate, endDate]);

  // Calculate recent activity
  const recentActivity = useMemo(() => {
    const userCandidates = candidates.filter(c => filterByRange(c.createdAt, startDate, endDate));
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentCandidates = userCandidates.filter(
      (c) => c.createdAt && new Date(c.createdAt) >= last7Days
    );

    const activityByDate = recentCandidates.reduce((acc, candidate) => {
      const date = new Date(candidate.createdAt!).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(candidate);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(activityByDate)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 4)
      .map(([date, candidates]) => ({
        date,
        action: `CV uploaded for ${typeof candidates[0]?.jobId === 'string' ? 'position' : (candidates[0]?.jobId?.title || 'position')}`,
        count: candidates.length,
      }));
  }, [candidates, user, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-slate-800 space-y-6"
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col min-w-[140px]">
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Upload From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-50 border-none text-gray-700 text-xs sm:text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
          />
        </div>
        <div className="flex flex-col min-w-[140px]">
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Upload To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-50 border-none text-gray-700 text-xs sm:text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
          />
        </div>
        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
          className="mt-5 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: 'Applications', value: stats.totalApplications, icon: TrendingUp, color: 'text-blue-600', hover: 'hover:border-blue-300', route: '/Recruiter/candidates', description: 'Total candidates uploaded' },
          { label: 'Interviews', value: stats.interviews, icon: TrendingUp, color: 'text-indigo-600', hover: 'hover:border-indigo-300', route: '/Recruiter/candidates?status=Interview', description: 'Candidates interviewed' },
          { label: 'Hires', value: stats.hires, icon: TrendingUp, color: 'text-purple-600', hover: 'hover:border-purple-300', route: '/Recruiter/candidates?status=Selected', description: 'Successfully hired' }
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.route)}
            className={`bg-white rounded-2xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-md transition-all group ${item.hover}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-mono">{item.label}</h3>
              <item.icon size={20} className="text-green-500 group-hover:scale-110 transition-transform" />
            </div>
            <p className={`text-3xl font-extrabold ${item.color} mb-2`}>{item.value}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Top Positions and Hiring Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Top Positions</h2>
          <div className="space-y-6">
            {topPositions.length > 0 ? (
              topPositions.map((item) => (
                <div
                  key={item.position}
                  onClick={() => navigate(`/Recruiter/candidates?jobTitle=${encodeURIComponent(item.position)}`)}
                  className="cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{item.position}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">{item.count} applicants</span>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden border border-gray-100 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">No data available yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Hiring Funnel</h2>
          <div className="space-y-4">
            {[
              { stage: 'Applications Received', count: stats.totalApplications, color: 'bg-gray-400', status: '', icon: Users },
              { stage: 'Screening', count: stats.screening, color: 'bg-blue-500', status: 'New', icon: TrendingUp },
              { stage: 'Shortlisted', count: stats.shortlisted, color: 'bg-indigo-500', status: 'Shortlisted', icon: TrendingUp },
              { stage: 'Interview', count: stats.interviews, color: 'bg-purple-500', status: 'Interview', icon: TrendingUp },
              { stage: 'Hired', count: stats.hires, color: 'bg-emerald-500', status: 'Selected', icon: TrendingUp },
            ].map((stage) => (
              <div
                key={stage.stage}
                onClick={() => navigate(stage.status ? `/Recruiter/candidates?status=${stage.status}` : '/Recruiter/candidates')}
                className="flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 p-3 rounded-xl transition-all border border-transparent hover:border-gray-100 group"
              >
                <div className={`w-10 h-10 rounded-xl ${stage.color.replace('bg-', 'bg-')}/10 flex items-center justify-center`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{stage.stage}</p>
                </div>
                <span className="text-sm font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg font-mono">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Report Table Component */}
      <PerformanceReportTable />

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Recent Activity Log</h2>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100">
            <Calendar size={14} />
            <span>Last 7 days</span>
          </div>
        </div>
        <div className="space-y-2">
          {recentActivity.length > 0 ? (
            recentActivity.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{log.action}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono mt-1">{log.date}</p>
                </div>
                <span className="text-sm font-extrabold text-blue-600 bg-white px-3 py-1 rounded-lg border border-gray-100 font-mono shrink-0 ml-4">{log.count} uploads</span>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No recent activity detected.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div >
  );
}
