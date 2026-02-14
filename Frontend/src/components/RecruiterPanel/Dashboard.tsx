import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, FileCheck, Clock, Calendar, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useJobContext } from "../../context/DataProvider";
import { useClientsContext } from "../../context/ClientsProvider";
import { formatDate } from "../../utils/dateUtils";
import PerformanceReportTable from "./PerformanceReportTable";

// Add helper function to format YYYY-MM for input type="month"
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { candidates, fetchCandidatesByUser } = useCandidateContext();
  const { fetchJobs } = useJobContext();
  const { fetchClients } = useClientsContext();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  useEffect(() => {
    fetchJobs();
    fetchClients();
    if (user?._id) {
      // Fetch all candidates to ensure data visibility
      fetchCandidatesByUser(user._id);
    }
  }, [user]);

  const stats = useMemo(() => {
    const isSelectedMonth = (dateString?: string) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      const [year, month] = selectedMonth.split('-').map(Number);
      return date.getMonth() === month - 1 && date.getFullYear() === year;
    };

    if (!candidates) return [];

    // Filter candidates relevant to the selected month
    // Strategy: 
    // Total Lined Up -> Created in selected month
    // Shortlisted -> Status Shortlisted AND (updatedAt in month OR createdAt in month) - sticking to createdAt/updatedAt logic
    // Actually, usually "Count for Month X" means "Created in Month X" for Total
    // For Statuses, it implies "Achieved status in Month X" ideally, but often "Currently in status X and touched in Month X" is used.
    // Let's use isSelectedMonth(c.updatedAt || c.createdAt) as a general "Active/Relevant in Month" check for statuses
    // For "Total", we use creation date.

    const total = candidates.filter(c => isSelectedMonth(c.createdAt)).length;

    const shortlisted = candidates.filter((c) =>
      c.status === "Shortlisted" && isSelectedMonth(c.updatedAt || c.createdAt)
    ).length;

    // Interviews includes Interview, Interviewed
    const interviews = candidates.filter((c) =>
      ["Interview", "Interviewed"].includes(c.status || "") && isSelectedMonth(c.dynamicFields?.interviewDate || c.updatedAt || c.createdAt)
    ).length;

    // Selected (Offer/Selected)
    const selectedMonthCount = candidates.filter((c) =>
      ["Offer", "Selected"].includes(c.status || "") && isSelectedMonth(c.updatedAt || c.createdAt)
    ).length;

    // Hired (Joined/Hired)
    const hiredCandidates = candidates.filter((c) =>
      ["Joined", "Hired"].includes(c.status || "") && isSelectedMonth(c.updatedAt || c.createdAt)
    ).length;

    return [
      {
        label: "Total Lined Up",
        value: total,
        icon: Users,
        color: "bg-blue-500",
        clickable: true,
        route: "/Recruiter/candidates",
      },
      {
        label: "Shortlisted",
        value: shortlisted,
        icon: FileCheck,
        color: "bg-green-500",
        clickable: true,
        route: "/Recruiter/candidates?status=Shortlisted",
      },
      {
        label: "Interviews",
        value: interviews,
        icon: Clock,
        color: "bg-amber-500",
        clickable: true,
        route: "/Recruiter/candidates?status=Interview",
      },
      {
        label: "Selected",
        value: selectedMonthCount,
        icon: Calendar,
        color: "bg-indigo-500",
        clickable: true,
        route: "/Recruiter/candidates?status=Selected",
      },
      {
        label: "Hired",
        value: hiredCandidates,
        icon: CheckCircle,
        color: "bg-teal-500",
        clickable: true,
        route: "/Recruiter/candidates?status=Hired",
      },
    ];
  }, [candidates, selectedMonth]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 leading-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Track your recruitment progress for the month
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1 font-mono">Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => stat.clickable && navigate(stat.route)}
              className={`bg-white rounded-2xl shadow-sm p-5 border border-gray-100 group hover:shadow-md transition-all ${stat.clickable ? "cursor-pointer" : ""
                }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-2.5 rounded-xl text-white shadow-lg shadow-${stat.color.split('-')[1]}-200 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Current Month</span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-1">
                {stat.value}
              </p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Performance Report Table */}
      <PerformanceReportTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {candidates
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
              .slice(0, 5)
              .map((candidate, index) => {
                const name = candidate.dynamicFields?.candidateName ||
                  candidate.dynamicFields?.name ||
                  candidate.dynamicFields?.Name ||
                  candidate.dynamicFields?.fullName ||
                  "Unknown Candidate";
                return (
                  <div
                    key={candidate._id || index}
                    className="flex items-center gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-bold shrink-0">
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        New candidate added
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {name}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 font-mono whitespace-nowrap">
                      {formatDate(candidate.createdAt || Date.now())}
                    </span>
                  </div>
                );
              })}
            {candidates.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 italic">No recent activity.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Shortlisted Pipeline</h2>
          </div>
          <div className="space-y-4">
            {candidates
              .filter((c) => c.status === "Shortlisted")
              .slice(0, 5)
              .map((candidate, index) => {
                const name = candidate.dynamicFields?.candidateName ||
                  candidate.dynamicFields?.name ||
                  candidate.dynamicFields?.Name ||
                  candidate.dynamicFields?.fullName ||
                  "Unknown Candidate";
                const role = (candidate.jobId as any)?.title ||
                  candidate.dynamicFields?.role ||
                  candidate.dynamicFields?.position ||
                  candidate.dynamicFields?.jobTitle ||
                  "Candidate";

                const dynamicKeys = Object.keys(candidate.dynamicFields || {});
                let companyKey = dynamicKeys.find(k => k.toLowerCase() === "current company");
                if (!companyKey) companyKey = dynamicKeys.find(k => k.toLowerCase() === "company");
                if (!companyKey) companyKey = dynamicKeys.find(k => k.toLowerCase().includes("company"));

                const company = (companyKey && candidate.dynamicFields?.[companyKey]) || (candidate as any).currentCompany || "Not Specified";

                return (
                  <div
                    key={candidate._id || index}
                    className="flex items-center gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {role} • {company}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg font-mono whitespace-nowrap">
                      {candidate.dynamicFields?.interviewDate
                        ? new Date(candidate.dynamicFields.interviewDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        })
                        : "Shortlisted"}
                    </span>
                  </div>
                );
              })}
            {candidates.filter((c) => c.status === "Shortlisted").length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 italic">No candidates in shortlisted pipeline.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
