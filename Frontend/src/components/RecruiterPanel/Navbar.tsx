import { Menu, User, LogOut, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface NavbarProps {
  toggleSidebar: () => void;
}

interface Activity {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    designation: string;
  };
  action: string;
  module: string;
  description: string;
  targetId?: any;
  targetModel: string;
  createdAt: string;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch activities when component mounts or when notifications dropdown is opened
  useEffect(() => {
    if (user?._id) {
      fetchActivities();
    }
  }, [user?._id]);

  const fetchActivities = async () => {
    if (!user?._id) return;

    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/activities/user/${user._id}`
      );

      if (response.data.success) {
        setActivities(response.data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (activity: Activity) => {
    // Close the notification dropdown
    setShowNotifications(false);

    // Get base path based on user designation
    const basePath = user?.designation === 'Recruiter' ? '/Recruiter' :
      user?.designation === 'Mentor' ? '/Mentor' :
        user?.designation === 'Manager' ? '/Manager' :
          user?.designation === 'Admin' ? '/Admin' : '/Recruiter';

    // Navigate based on the module type
    const navigationMap: Record<string, string> = {
      'candidate': `${basePath}/candidates`,
      'candidate-status': `${basePath}/candidates`,
      'job': basePath === '/Recruiter' ? `${basePath}` : `${basePath}/jobs`,
      'leave': basePath === '/Recruiter' ? `${basePath}/leave-applications` :
        basePath === '/Admin' ? `${basePath}/leaveApplications` :
          `${basePath}/leaveapplications`,
    };

    const path = navigationMap[activity.module] || basePath;
    navigate(path);
  };

  // Format activity into notification format
  const formatNotification = (activity: Activity) => {
    const actionIcons: Record<string, string> = {
      'created': '➕',
      'updated': '✏️',
      'deleted': '🗑️',
      'approved': '✅',
      'rejected': '❌',
    };

    const icon = actionIcons[activity.action] || '📝';

    return {
      title: `${icon} ${activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} ${activity.module}`,
      message: activity.description,
      user: activity.userId?.name || 'Unknown User',
    };
  };

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get recent activities (last 24 hours)
  const recentActivities = activities.filter(activity => {
    const activityDate = new Date(activity.createdAt);
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    return activityDate >= oneDayAgo;
  });

  return (
    <nav className="bg-white shadow-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={toggleSidebar}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800 truncate">
            {user?.designation === 'Recruiter' ? 'Recruiter Portal' :
              user?.designation === 'Manager' ? 'Manager Portal' : user?.designation === 'Admin' ? 'Admin Portal' : user?.designation === "Mentor" ? "Mentor Portal" : 'Hr Portal'}
          </h1>
        </div>

        <div className="flex items-center gap-3 relative">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-700">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500">{user?.designation || 'Staff'}</p>
          </div>

          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                fetchActivities(); // Refresh activities when opening
              }
            }}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors relative"
          >
            <Bell size={20} />
            {recentActivities.length > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
          >
            <User size={20} className="text-white" />
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-14 w-[300px] bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Recent Activity</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                      {recentActivities.length} new
                    </span>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-slate-500">
                      <p className="text-sm">Loading activities...</p>
                    </div>
                  ) : activities.length > 0 ? (
                    activities.slice(0, 20).map((activity) => {
                      const notification = formatNotification(activity);
                      const isRecent = recentActivities.some(a => a._id === activity._id);

                      return (
                        <div
                          key={activity._id}
                          onClick={() => handleNotificationClick(activity)}
                          className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${isRecent ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {isRecent && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 mb-1">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-600 mb-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                  by {notification.user}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {getRelativeTime(activity.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      const basePath = user?.designation === 'Recruiter' ? '/Recruiter' :
                        user?.designation === 'Mentor' ? '/Mentor' :
                          user?.designation === 'Manager' ? '/Manager' :
                            user?.designation === 'Admin' ? '/Admin' : '/Recruiter';
                      navigate(basePath);
                    }}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-14 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <p className="font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-sm text-slate-600">{user?.email}</p>
                  <p className="text-xs text-slate-500 mt-1">{user?.designation}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                >
                  <LogOut size={18} />
                  <span className="font-medium">Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {(showDropdown || showNotifications) && (
        <div
          onClick={() => {
            setShowDropdown(false);
            setShowNotifications(false);
          }}
          className="fixed inset-0 z-40"
        />
      )}
    </nav>
  );
}
