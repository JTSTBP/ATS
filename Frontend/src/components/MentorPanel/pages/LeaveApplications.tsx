import { motion } from "framer-motion";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

const leaveApplications = [
  {
    id: 1,
    name: "Emma Thompson",
    type: "Annual Leave",
    startDate: "2025-11-10",
    endDate: "2025-11-15",
    days: 5,
    status: "Pending",
    statusColor: "bg-amber-100 text-amber-700",
  },
  {
    id: 2,
    name: "James Wilson",
    type: "Sick Leave",
    startDate: "2025-11-05",
    endDate: "2025-11-06",
    days: 2,
    status: "Approved",
    statusColor: "bg-green-100 text-green-700",
  },
  {
    id: 3,
    name: "Olivia Martinez",
    type: "Personal Leave",
    startDate: "2025-11-12",
    endDate: "2025-11-14",
    days: 3,
    status: "Pending",
    statusColor: "bg-amber-100 text-amber-700",
  },
  {
    id: 4,
    name: "Noah Anderson",
    type: "Annual Leave",
    startDate: "2025-11-08",
    endDate: "2025-11-09",
    days: 2,
    status: "Rejected",
    statusColor: "bg-red-100 text-red-700",
  },
];

export default function MentorLeaveApplications() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-slate-800 mb-2">
        Manage Leave Requests
      </h1>
      <p className="text-slate-600 mb-8">
        Review and approve leave applications from your team
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">8</p>
              <p className="text-sm text-slate-600">Pending Requests</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">24</p>
              <p className="text-sm text-slate-600">Approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">3</p>
              <p className="text-sm text-slate-600">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            Leave Applications
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {leaveApplications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {application.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">
                      {application.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                      <span className="font-medium">{application.type}</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {application.days} days
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>{application.startDate}</span>
                      <span>→</span>
                      <span>{application.endDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${application.statusColor}`}
                  >
                    {application.status}
                  </span>
                  {application.status === "Pending" && (
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                        Approve
                      </button>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
