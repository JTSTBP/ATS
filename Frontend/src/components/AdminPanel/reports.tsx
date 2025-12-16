import { useState, useEffect } from "react";
import { FileText, Users, BarChart3, AlertTriangle, X, ChevronRight } from "lucide-react";
import { useUserContext } from "../../context/UserProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "../../utils/dateUtils";

export default function ReportsTab() {
  const { users, leaves, fetchUsers, fetchAllLeaves } = useUserContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchAllLeaves();
    fetchallCandidates();
  }, []);

  const stats = {
    totalUsers: users.length,
    totalCandidates: candidates.length,
    pendingLeaves: leaves.filter((l) => l.status === "Pending").length,
    totalLeaves: leaves.length,
  };

  const reports = [
    {
      id: "candidates",
      name: "Candidate Summary",
      category: "Recruitment",
      date: formatDate(new Date()),
      status: "Available",
      count: stats.totalCandidates,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "pending_leaves",
      name: "Pending Leave Requests",
      category: "HR Management",
      date: formatDate(new Date()),
      status: stats.pendingLeaves > 0 ? "Action Required" : "Clear",
      count: stats.pendingLeaves,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      id: "users",
      name: "User Directory",
      category: "System",
      date: formatDate(new Date()),
      status: "Updated",
      count: stats.totalUsers,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: "all_leaves",
      name: "Leave History Log",
      category: "HR Management",
      date: formatDate(new Date()),
      status: "Available",
      count: stats.totalLeaves,
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const getReportData = (reportId: string) => {
    switch (reportId) {
      case "candidates":
        return candidates.map((c) => {
          // Smart field mapping - find name field (same logic as Recruiter panel)
          const dynamicKeys = Object.keys(c.dynamicFields || {});
          const nameKey = dynamicKeys.find(k => k.toLowerCase().includes("name")) || dynamicKeys[0];
          const candidateName = c.dynamicFields?.[nameKey] || "Unknown";

          return {
            col1: candidateName,
            col2: c.jobId ? (typeof c.jobId === 'object' ? c.jobId.title : "Job ID: " + c.jobId) : "No Job",
            col3: c.status || "New",
            col4: formatDate(c.createdAt),
          };
        });
      case "pending_leaves":
        return leaves
          .filter((l) => l.status === "Pending")
          .map((l) => ({
            col1: l.user?.name || "Unknown",
            col2: l.leaveType,
            col3: `${formatDate(l.fromDate)} - ${formatDate(l.toDate)}`,
            col4: l.reason,
          }));
      case "users":
        return users.map((u) => ({
          col1: u.name,
          col2: u.designation,
          col3: u.email,
          col4: u.phoneNumber?.official || "N/A",
        }));
      case "all_leaves":
        return leaves.map((l) => ({
          col1: l.user?.name || "Unknown",
          col2: l.leaveType,
          col3: l.status,
          col4: formatDate(l.appliedDate),
        }));
      default:
        return [];
    }
  };

  const getHeaders = (reportId: string) => {
    switch (reportId) {
      case "candidates":
        return ["Candidate Name", "Job Applied", "Status", "Applied Date"];
      case "pending_leaves":
        return ["Employee", "Leave Type", "Duration", "Reason"];
      case "users":
        return ["Name", "Role", "Email", "Phone"];
      case "all_leaves":
        return ["Employee", "Type", "Status", "Applied On"];
      default:
        return [];
    }
  };
  console.log(reports, "give me ")
  return (
    <div className="text-slate-800 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reports & Insights</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">

          Real-time system overview and detailed reports.
        </p>
      </div>

      {/* Summary Cards */}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div
          onClick={() => setSelectedReport("users")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-blue-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Users</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.totalUsers}</h2>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
            <Users size={24} />
          </div>
        </div>

        <div
          onClick={() => setSelectedReport("candidates")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-green-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Candidates</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.totalCandidates}</h2>
          </div>
          <div className="bg-green-50 text-green-600 p-3 rounded-lg">
            <FileText size={24} />
          </div>
        </div>

        <div
          onClick={() => setSelectedReport("pending_leaves")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-orange-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Pending Leaves</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.pendingLeaves}</h2>
          </div>
          <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div
          onClick={() => setSelectedReport("all_leaves")}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-purple-200"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Leaves</p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">{stats.totalLeaves}</h2>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
            <BarChart3 size={24} />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Available Reports</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${report.bgColor} ${report.color} flex items-center justify-center`}>
                  <report.icon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {report.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>{report.category}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{report.count} Records</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${report.status === "Action Required"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
                  }`}>
                  {report.status}
                </span>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {reports.find(r => r.id === selectedReport)?.name}
                  </h2>
                  <p className="text-sm text-slate-500">Detailed View</p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      {getHeaders(selectedReport).map((header, i) => (
                        <th key={i} className="py-3 px-4">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getReportData(selectedReport).length > 0 ? (
                      getReportData(selectedReport).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-800">{row.col1}</td>
                          <td className="py-3 px-4 text-slate-600">{row.col2}</td>
                          <td className="py-3 px-4 text-slate-600">{row.col3}</td>
                          <td className="py-3 px-4 text-slate-600">{row.col4}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          No records found for this report.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
