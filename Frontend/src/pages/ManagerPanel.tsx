import { motion } from 'framer-motion';
import { Users, Calendar, FileText, TrendingUp, Construction, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ManagerPanel() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <button
        onClick={handleLogout}
        className="fixed top-6 right-6 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2 text-red-600 font-medium shadow-md"
      >
        <LogOut size={18} />
        Logout
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-lg"
          >
            <Construction size={40} className="text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold text-slate-800 text-center mb-4">
            Manager Panel
          </h1>
          <p className="text-slate-600 text-center mb-8">
            This section is under development
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <Users size={20} className="text-blue-600" />
                <h3 className="font-semibold text-slate-800">Team Management</h3>
              </div>
              <p className="text-sm text-slate-600">View and manage your team members</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={20} className="text-green-600" />
                <h3 className="font-semibold text-slate-800">Leave Approvals</h3>
              </div>
              <p className="text-sm text-slate-600">Approve or reject leave requests</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <FileText size={20} className="text-purple-600" />
                <h3 className="font-semibold text-slate-800">Reports</h3>
              </div>
              <p className="text-sm text-slate-600">Access team performance reports</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={20} className="text-orange-600" />
                <h3 className="font-semibold text-slate-800">Analytics</h3>
              </div>
              <p className="text-sm text-slate-600">View hiring metrics and trends</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Coming soon with advanced features for managers
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
