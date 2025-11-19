import { motion } from 'framer-motion';
import { TrendingUp, Download, Calendar } from 'lucide-react';

export default function Reports() {
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
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          <Download size={18} />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Applications</h3>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-2">1,248</p>
          <p className="text-sm text-green-600 font-medium">+12.5% from last month</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Interviews</h3>
            <TrendingUp size={20} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-2">324</p>
          <p className="text-sm text-blue-600 font-medium">+8.3% from last month</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Hires</h3>
            <TrendingUp size={20} className="text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 mb-2">42</p>
          <p className="text-sm text-purple-600 font-medium">+15.2% from last month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Top Positions</h2>
          <div className="space-y-4">
            {[
              { position: 'Frontend Developer', count: 45, percentage: 85 },
              { position: 'Backend Engineer', count: 38, percentage: 70 },
              { position: 'UI/UX Designer', count: 32, percentage: 60 },
              { position: 'Product Manager', count: 28, percentage: 50 },
            ].map((item) => (
              <div key={item.position}>
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
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Hiring Funnel</h2>
          <div className="space-y-6">
            {[
              { stage: 'Applications Received', count: 1248, color: 'bg-slate-500' },
              { stage: 'Screening', count: 624, color: 'bg-blue-500' },
              { stage: 'Interview', count: 324, color: 'bg-green-500' },
              { stage: 'Offer', count: 86, color: 'bg-amber-500' },
              { stage: 'Hired', count: 42, color: 'bg-purple-500' },
            ].map((stage) => (
              <div key={stage.stage} className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${stage.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{stage.stage}</p>
                </div>
                <span className="text-sm font-bold text-slate-800">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Recent Activity Log</h2>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={16} />
            <span>Last 7 days</span>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { date: '2025-11-04', action: 'CV uploaded for Frontend Developer position', count: 12 },
            { date: '2025-11-03', action: 'Interviews scheduled', count: 8 },
            { date: '2025-11-03', action: 'Candidates shortlisted', count: 15 },
            { date: '2025-11-02', action: 'Offers sent', count: 4 },
          ].map((log, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{log.action}</p>
                <p className="text-xs text-slate-500">{log.date}</p>
              </div>
              <span className="text-sm font-semibold text-slate-600">{log.count} items</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
