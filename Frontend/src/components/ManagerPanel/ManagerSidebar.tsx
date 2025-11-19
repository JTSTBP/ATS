import { LayoutDashboard, Users, FileText, BarChart3, Calendar, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/manager', icon: LayoutDashboard },
  { name: 'Candidates', href: '/manager/candidates', icon: Users },
  { name: 'Applications', href: '/manager/applications', icon: FileText },
  { name: 'Reports', href: '/manager/reports', icon: BarChart3 },
  { name: 'Leave Applications', href: '/manager/leave-applications', icon: Calendar },
];

export default function ManagerSidebar() {
  const location = useLocation();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed">
      <div className="flex items-center gap-3 p-6 border-b border-gray-200">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Manager Panel</h1>
          <p className="text-xs text-gray-500">HR Management</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
