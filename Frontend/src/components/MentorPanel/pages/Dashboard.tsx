import { Briefcase, Users, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';

type Stats = {
  totalJobs: number;
  openJobs: number;
  totalCandidates: number;
  totalApplications: number;
  screening: number;
  shortlisted: number;
  interview: number;
  hired: number;
  rejected: number;
};

export const Dashboard = () => {
  const stats: Stats = {
    totalJobs: 12,
    openJobs: 8,
    totalCandidates: 145,
    totalApplications: 287,
    screening: 45,
    shortlisted: 32,
    interview: 18,
    hired: 12,
    rejected: 180,
  };

  const statCards = [
    { label: 'Total Jobs', value: stats.totalJobs, subValue: `${stats.openJobs} Open`, icon: Briefcase, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Total Candidates', value: stats.totalCandidates, icon: Users, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' },
    { label: 'Total Applications', value: stats.totalApplications, icon: FileText, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50' },
    { label: 'Hired', value: stats.hired, icon: CheckCircle, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50' },
  ];

  const pipelineStages = [
    { label: 'Screening', value: stats.screening, color: 'bg-yellow-400' },
    { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-blue-400' },
    { label: 'Interview', value: stats.interview, color: 'bg-cyan-400' },
    { label: 'Hired', value: stats.hired, color: 'bg-green-400' },
    { label: 'Rejected', value: stats.rejected, color: 'bg-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h2>
        <p className="text-gray-600">Overview of recruitment activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bgColor} rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-br ${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {card.subValue && (
                  <span className="text-sm font-medium text-gray-600">{card.subValue}</span>
                )}
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{card.value}</h3>
              <p className="text-sm text-gray-600">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-800">Recruitment Pipeline</h3>
          </div>
          <div className="space-y-4">
            {pipelineStages.map((stage) => (
              <div key={stage.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                  <span className="text-sm font-bold text-gray-800">{stage.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`${stage.color} h-3 rounded-full transition-all duration-300`}
                    style={{ width: `${stats.totalApplications > 0 ? (stage.value / stats.totalApplications) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-xl font-bold text-gray-800">Quick Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Active Pipeline</span>
              <span className="text-2xl font-bold text-blue-600">{stats.screening + stats.shortlisted + stats.interview}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Success Rate</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.totalApplications > 0 ? Math.round((stats.hired / stats.totalApplications) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Rejection Rate</span>
              <span className="text-2xl font-bold text-red-600">
                {stats.totalApplications > 0 ? Math.round((stats.rejected / stats.totalApplications) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
