import { Menu, User, LogOut, Bell } from 'lucide-react';
import logo from '../../images/logo.png';
import SupervisorInbox from '../Common/SupervisorInbox';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { formatDate } from '../../utils/dateUtils';

interface NavbarProps {
  toggleSidebar: () => void;
}

interface ReplyNotification {
  sequenceId: string;
  candidateName: string;
  requirementTitle: string;
  recipient: string;
  receivedAt: string;
  readAt: string | null;
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
  targetId?: unknown;
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
  const [replies, setReplies] = useState<ReplyNotification[]>([]);
  const [replyUnreadCount, setReplyUnreadCount] = useState(0);
  const [replyError, setReplyError] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyBusy, setReplyBusy] = useState(false);
  const replyRequest = useRef(0);
  const replyUser = useRef(user?._id);
  replyUser.current = user?._id;
  const isRecruiter = user?.designation === 'Recruiter';
  const replyApi = `${import.meta.env.VITE_BACKEND_URL}/api/email-replies`;

  const fetchReplies = useCallback(async (signal?: AbortSignal) => {
    if (!user?._id || user.designation !== 'Recruiter') return;
    const requestId = ++replyRequest.current;
    setReplyLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/email-replies`, { signal });
      if (!signal?.aborted && replyUser.current === user._id && requestId === replyRequest.current) {
        setReplies(data.notifications || []); setReplyUnreadCount(data.unreadCount || 0); setReplyError('');
      }
    } catch {
      if (!signal?.aborted && replyUser.current === user._id && requestId === replyRequest.current) setReplyError('Unable to check email replies. Please retry.');
    } finally {
      if (!signal?.aborted && replyUser.current === user._id && requestId === replyRequest.current) setReplyLoading(false);
    }
  }, [user?._id, user?.designation]);

  useEffect(() => {
    const controller = new AbortController();
    setReplies([]); setReplyUnreadCount(0); setReplyError(''); setReplyLoading(false);
    if (!isRecruiter) return () => controller.abort();
    const refresh = () => { if (document.visibilityState === 'visible') void fetchReplies(controller.signal); };
    void fetchReplies(controller.signal);
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [fetchReplies, isRecruiter]);

  const markRepliesRead = async (sequenceId?: string) => {
    if (replyBusy) return;
    setReplyBusy(true); setReplyError('');
    try {
      await axios.post(sequenceId ? `${replyApi}/${encodeURIComponent(sequenceId)}/read` : `${replyApi}/read-all`);
      await fetchReplies();
    } catch { setReplyError('Unable to mark replies read. Please retry.'); }
    finally { setReplyBusy(false); }
  };

  const [lastViewed, setLastViewed] = useState(() => {
    const saved = localStorage.getItem('notificationLastViewed');
    return saved ? new Date(saved) : new Date(0);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchActivities = useCallback(async () => {
    if (!user?._id) return;

    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

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
  }, [user?._id]);

  useEffect(() => { void fetchActivities(); }, [fetchActivities]);

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
    return formatDate(dateString);
  };

  // Get unread activities (newer than lastViewed)
  const unreadActivities = activities.filter(activity => {
    const activityDate = new Date(activity.createdAt);
    return activityDate > lastViewed;
  });
  const unreadCount = unreadActivities.length + replyUnreadCount;

  return (
    <nav className="bg-white shadow-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
          <button
            onClick={toggleSidebar}
            aria-label="Toggle navigation"
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Menu size={24} />
          </button>
          {user?.designation === 'Recruiter' && <img src={logo} alt="" className="hidden sm:block h-8 w-auto max-w-16 object-contain" />}
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800 truncate">
            {user?.designation === 'Recruiter' ? 'Jobs Territory ATS' :
              user?.designation === 'Manager' ? 'Manager Portal' : user?.designation === 'Admin' ? 'Admin Portal' : user?.designation === "Mentor" ? "Mentor Portal" : 'Finance Portal'}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 relative">
          <SupervisorInbox key={user?._id} />
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-700">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500">{user?.designation || 'Staff'}</p>
          </div>

          <button
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={showNotifications}
            onClick={() => {
              if (!showNotifications) {
                fetchActivities(); // Refresh activities when opening
                void fetchReplies();
                // Mark as read immediately
                const now = new Date();
                setLastViewed(now);
                localStorage.setItem('notificationLastViewed', now.toISOString());
              }
              setShowNotifications(!showNotifications);
            }}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 rounded-full border border-white bg-red-600 px-1 text-[10px] font-bold leading-5 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          <button
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Account menu"
            aria-expanded={showDropdown}
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
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {isRecruiter && <section aria-label="Email reply notifications" className="border-b border-slate-200">
                    <div className="flex items-center justify-between gap-2 px-4 pt-3"><h4 className="text-sm font-semibold text-slate-900">Email replies</h4><button type="button" disabled={replyBusy || !replyUnreadCount} onClick={() => void markRepliesRead()} className="min-h-9 text-xs font-semibold text-blue-700 disabled:opacity-50">Mark all read</button></div>
                    <p className="px-4 pb-2 text-xs text-slate-500">Response status only, including automatic replies. Read messages in Outlook.</p>
                    {replyError && <div role="alert" className="px-4 pb-3 text-xs text-red-700">{replyError} <button type="button" onClick={() => void fetchReplies()} className="min-h-9 underline">Retry</button></div>}
                    {replyLoading && !replies.length && <p role="status" className="px-4 py-3 text-xs text-slate-500">Checking replies…</p>}
                    {!replyLoading && !replyError && !replies.length && <p className="px-4 py-3 text-xs text-slate-500">No reply notifications yet.</p>}
                    {replies.map(reply => <div key={reply.sequenceId} className={`border-t border-slate-100 px-4 py-3 ${reply.readAt ? '' : 'bg-blue-50/60'}`}>
                      <p className="text-sm font-semibold text-slate-900">Reply received</p>
                      <p className="mt-1 break-words text-sm text-slate-700">{reply.candidateName || reply.recipient}</p>
                      {reply.candidateName && <p className="break-all text-xs text-slate-500">{reply.recipient}</p>}
                      <p className="mt-1 text-xs text-slate-600">{reply.requirementTitle}</p>
                      <div className="mt-2 flex items-center justify-between gap-2"><time dateTime={reply.receivedAt} className="text-xs text-slate-500">{getRelativeTime(reply.receivedAt)}</time>{reply.readAt ? <span className="text-xs text-slate-500">Read</span> : <button type="button" disabled={replyBusy} aria-label={`Mark reply from ${reply.candidateName || reply.recipient} as read`} onClick={() => void markRepliesRead(reply.sequenceId)} className="min-h-9 text-xs font-semibold text-blue-700 disabled:opacity-50">Mark read</button>}</div>
                    </div>)}
                  </section>}
                  <h4 className="px-4 pt-3 text-sm font-semibold text-slate-800">Recent activity</h4>
                  {loading ? (
                    <div className="p-8 text-center text-slate-500">
                      <p className="text-sm">Loading activities...</p>
                    </div>
                  ) : activities.length > 0 ? (
                    activities.slice(0, 20).map((activity) => {
                      const notification = formatNotification(activity);
                      const isUnread = unreadActivities.some(a => a._id === activity._id);

                      return (
                        <div
                          key={activity._id}
                          onClick={() => handleNotificationClick(activity)}
                          className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${isUnread ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {isUnread && (
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
                    onClick={() => {
                      setShowDropdown(false);
                      navigate(`/${user?.designation === 'Finance' ? 'Admin' : user?.designation}/profile`);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 text-slate-700"
                  >
                    <User size={18} />
                    <span className="font-medium">My Profile</span>
                  </button>
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
