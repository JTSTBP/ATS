import { motion } from 'framer-motion';
import { TrendingUp, Calendar } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useCandidateContext } from '../../context/CandidatesProvider';
import { useAuth } from '../../context/AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function Reports() {
  const { user } = useAuth();
  const { candidates, fetchallCandidates, loading } = useCandidateContext();
  const navigate = useNavigate();

  // Fetch data on component mount
  useEffect(() => {
    fetchallCandidates();
  }, []);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    console.log("Reports Debug - User:", user);
    console.log("Reports Debug - All Candidates:", candidates);

    if (!user || !candidates) return {
      totalApplications: 0,
      interviews: 0,
      hires: 0,
      screening: 0,
      shortlisted: 0,
      rejected: 0,
    };

    // 🚨 Relaxed Filter: Show ALL candidates to match Candidates.tsx behavior
    // The previous strict filter by createdBy was causing "0" reports if the user didn't create the candidates themselves.
    const userCandidates = candidates;

    /* 
    // Old Strict Filter
    const userCandidates = candidates.filter(
      (c) => {
        const creatorId = typeof c.createdBy === 'string' ? c.createdBy : c.createdBy?._id;
        // Loose comparison for ID to handle potential type mismatches (string vs objectId)
        return creatorId == user._id;
      }
    );
    */

    console.log("Reports Debug - Using All Candidates:", userCandidates);

    const totalApplications = userCandidates.length;
    // Match both 'Interview' (new) and 'Interviewed' (old/backend)
    const interviews = userCandidates.filter((c) =>
      c.status === 'Interview' || c.status === 'Interviewed'
    ).length;

    // Match 'Hired', 'Offer' (new) and 'Joined', 'Selected' (old/backend)
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
  }, [candidates, user]);

  // Calculate top positions
  const topPositions = useMemo(() => {
    const userCandidates = candidates;
    /*
    const userCandidates = candidates.filter(
      (c) => {
        const creatorId = typeof c.createdBy === 'string' ? c.createdBy : c.createdBy?._id;
        return creatorId === user?._id;
      }
    );
    */

    const jobCounts = userCandidates.reduce((acc, candidate) => {
      const jobTitle = typeof candidate.jobId === 'string' ? 'Unknown Position' : (candidate.jobId?.title || 'Unknown Position');
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
  }, [candidates, user, stats.totalApplications]);

  // Calculate recent activity
  const recentActivity = useMemo(() => {
    const userCandidates = candidates;
    /*
    const userCandidates = candidates.filter(
      (c) => {
        const creatorId = typeof c.createdBy === 'string' ? c.createdBy : c.createdBy?._id;
        return creatorId === user?._id;
      }
    );
    */

    // Group by date
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentCandidates = userCandidates.filter(
      (c) => c.createdAt && new Date(c.createdAt) >= last7Days
    );

    // Group by date
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
  }, [candidates, user]);

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
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Recruitment Reports Overview</h1>
          <p className="text-slate-600">Analytics and insights for your recruitment process</p>
        </div>
      </div>

      {/* Stats Cards - Now with REAL data and CLICKABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          onClick={() => navigate('/Recruiter/candidates')}
          className="bg-white rounded-xl shadow-md p-6 border border-slate-200 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Applications</h3>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-2">{stats.totalApplications}</p>
          <p className="text-sm text-slate-500">Total candidates uploaded</p>
        </div>

        <div
          onClick={() => navigate('/Recruiter/candidates?status=Interview')}
          className="bg-white rounded-xl shadow-md p-6 border border-slate-200 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Interviews</h3>
            <TrendingUp size={20} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-2">{stats.interviews}</p>
          <p className="text-sm text-slate-500">Candidates interviewed</p>
        </div>

        <div
          onClick={() => navigate('/Recruiter/candidates?status=Hired')}
          className="bg-white rounded-xl shadow-md p-6 border border-slate-200 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Hires</h3>
            <TrendingUp size={20} className="text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-2">{stats.hires}</p>
          <p className="text-sm text-slate-500">Successfully hired</p>
        </div>
      </div>

      {/* Top Positions and Hiring Funnel - Now with REAL data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Top Positions</h2>
          <div className="space-y-4">
            {topPositions.length > 0 ? (
              topPositions.map((item) => (
                <div
                  key={item.position}
                  onClick={() => navigate(`/Recruiter/candidates?jobTitle=${encodeURIComponent(item.position)}`)}
                  className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{item.position}</span>
                    <span className="text-sm font-semibold text-slate-800">{item.count} applicants</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">No data available yet. Upload candidates to see top positions.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Hiring Funnel</h2>
          <div className="space-y-6">
            {[
              { stage: 'Applications Received', count: stats.totalApplications, color: 'bg-slate-500', status: '' },
              { stage: 'Screening', count: stats.screening, color: 'bg-blue-500', status: 'New' },
              { stage: 'Shortlisted', count: stats.shortlisted, color: 'bg-cyan-500', status: 'Shortlisted' },
              { stage: 'Interview', count: stats.interviews, color: 'bg-green-500', status: 'Interview' },
              { stage: 'Hired', count: stats.hires, color: 'bg-purple-500', status: 'Hired' },
            ].map((stage) => (
              <div
                key={stage.stage}
                onClick={() => navigate(stage.status ? `/Recruiter/candidates?status=${stage.status}` : '/Recruiter/candidates')}
                className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all"
              >
                <div className={`w-4 h-4 rounded-full ${stage.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{stage.stage}</p>
                </div>
                <span className="text-sm font-bold text-blue-600 hover:text-blue-700">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity - Now with REAL data */}
      <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Recent Activity Log</h2>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={16} />
            <span>Last 7 days</span>
          </div>
        </div>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((log, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{log.action}</p>
                  <p className="text-xs text-slate-500">{log.date}</p>
                </div>
                <span className="text-sm font-semibold text-slate-600">{log.count} items</span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">No recent activity in the last 7 days</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
