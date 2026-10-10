import { motion } from 'framer-motion';
import { UserCheck, Award, DollarSign, Briefcase, Construction, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export default function HRPanel() {
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
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center shadow-lg"
          >
            <Construction size={40} className="text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold text-slate-800 text-center mb-4">
            HR Panel
          </h1>
          <p className="text-slate-600 text-center mb-8">
            This section is under development
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <UserCheck size={20} className="text-blue-600" />
                <h3 className="font-semibold text-slate-800">Employee Records</h3>
              </div>
              <p className="text-sm text-slate-600">Manage employee information</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <Award size={20} className="text-green-600" />
                <h3 className="font-semibold text-slate-800">Performance Reviews</h3>
              </div>
              <p className="text-sm text-slate-600">Conduct and track evaluations</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign size={20} className="text-purple-600" />
                <h3 className="font-semibold text-slate-800">Payroll</h3>
              </div>
              <p className="text-sm text-slate-600">Manage compensation and benefits</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase size={20} className="text-orange-600" />
                <h3 className="font-semibold text-slate-800">Onboarding</h3>
              </div>
              <p className="text-sm text-slate-600">Handle new hire processes</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Coming soon with comprehensive HR management tools
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
