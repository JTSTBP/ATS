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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm md:text-base text-slate-600">
            Here's what's happening with your recruitment today.
          </p>
        </div>
        <div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => stat.clickable && navigate(stat.route)}
              className={`bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow ${stat.clickable ? "cursor-pointer" : ""
                }`}
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

      {/* Performance Report Table */}
      <PerformanceReportTable />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Recent Activity
          </h2>
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
                    className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Users size={18} className="text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        New candidate added
                      </p>
                      <p className="text-xs text-slate-500">
                        {name}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(candidate.createdAt || Date.now())}
                    </span>
                  </div>
                );
              })}
            {candidates.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No recent activity.</p>
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Upcoming Interviews
          </h2>
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
                // Smart field mapping for Company
                const dynamicKeys = Object.keys(candidate.dynamicFields || {});
                let companyKey = dynamicKeys.find(k => k.toLowerCase() === "current company");
                if (!companyKey) companyKey = dynamicKeys.find(k => k.toLowerCase() === "company");
                if (!companyKey) companyKey = dynamicKeys.find(k => k.toLowerCase().includes("company"));

                const company = (companyKey && candidate.dynamicFields?.[companyKey]) || (candidate as any).currentCompany || "Not Specified";

                return (
                  <div
                    key={candidate._id || index}
                    className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {role} • {company}
                      </p>
                    </div>
                    <span className="text-xs text-slate-600 font-medium">
                      {candidate.dynamicFields?.interviewDate
                        ? new Date(candidate.dynamicFields.interviewDate).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : "Scheduled"}
                    </span>
                  </div>
                );
              })}
            {candidates.filter((c) => c.status === "Shortlisted").length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No interviews scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
