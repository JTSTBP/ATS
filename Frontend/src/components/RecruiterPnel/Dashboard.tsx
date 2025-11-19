import { motion } from "framer-motion";
import { Users, FileCheck, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";

const stats = [
  {
    label: "Total Candidates",
    value: "248",
    icon: Users,
    color: "bg-blue-500",
  },
  { label: "Shortlisted", value: "64", icon: FileCheck, color: "bg-green-500" },
  { label: "Pending Review", value: "38", icon: Clock, color: "bg-amber-500" },
  {
    label: "Hired This Month",
    value: "12",
    icon: TrendingUp,
    color: "bg-purple-500",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  console.log(user, "user");
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-slate-800 mb-2">
        Welcome to Recruiter Dashboard
      </h1>
      <p className="text-slate-600 mb-8">
        Track and manage your recruitment activities
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              {
                action: "New CV uploaded",
                name: "John Smith",
                time: "2 hours ago",
              },
              {
                action: "Interview scheduled",
                name: "Emily Davis",
                time: "5 hours ago",
              },
              {
                action: "Candidate shortlisted",
                name: "Michael Brown",
                time: "1 day ago",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users size={18} className="text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {activity.action}
                  </p>
                  <p className="text-xs text-slate-500">{activity.name}</p>
                </div>
                <span className="text-xs text-slate-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Upcoming Interviews
          </h2>
          <div className="space-y-4">
            {[
              {
                name: "Sarah Wilson",
                position: "Frontend Developer",
                time: "Today, 2:00 PM",
              },
              {
                name: "David Lee",
                position: "Backend Engineer",
                time: "Tomorrow, 10:00 AM",
              },
              {
                name: "Anna Martinez",
                position: "UI/UX Designer",
                time: "Tomorrow, 3:30 PM",
              },
            ].map((interview, index) => (
              <div
                key={index}
                className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {interview.name}
                  </p>
                  <p className="text-xs text-slate-500">{interview.position}</p>
                </div>
                <span className="text-xs text-slate-600 font-medium">
                  {interview.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
