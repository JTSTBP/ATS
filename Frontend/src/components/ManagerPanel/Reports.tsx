import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Info, Check, Users, Briefcase, CalendarCheck, X, UserPlus, ClipboardCheck, Clock, CheckCircle, Filter } from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { useUserContext } from "../../context/UserProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useClientsContext } from "../../context/ClientsProvider";
import { useJobContext } from "../../context/DataProvider";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "../../utils/dateUtils";

export default function ManagerReports() {
  const { user } = useAuth();
  const { users, fetchUsers } = useUserContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { clients, fetchClients } = useClientsContext();
  const { jobs, fetchJobs } = useJobContext();
  const navigate = useNavigate();
  const [candidatePopupData, setCandidatePopupData] = useState<{ title: string, clientName: string, candidates: any[] } | null>(null);

  // States for advanced filtering
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    date: [],
    client: [],
    job: [],
    recruiter: []
  });

  // Default to current month
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [clientSearch, setClientSearch] = useState("");
  const [recruiterSearch, setRecruiterSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchallCandidates();
    fetchClients();
    fetchJobs();
  }, []);

  const isWithinDateRange = (dateString: string) => {
    if (!startDate && !endDate) return true;
    const date = new Date(dateString);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    if (start && end) return date >= start && date <= end;
    if (start) return date >= start;
    if (end) return date <= end;
    return true;
  };

  const applyDateShortcut = (shortcut: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    let end = new Date(today);

    if (shortcut === 'T') {
      // Today
    } else if (shortcut === 'Y') {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
    } else if (shortcut === 'W') {
      const day = today.getDay();
      const diff = today.getDate() - (day === 0 ? 6 : day - 1);
      start = new Date(today.getFullYear(), today.getMonth(), diff);
    } else if (shortcut === 'L') {
      const day = today.getDay();
      const diffToLastMon = today.getDate() - (day === 0 ? 6 : day - 1) - 7;
      start = new Date(today.getFullYear(), today.getMonth(), diffToLastMon);
      const diffToLastSun = diffToLastMon + 6;
      end = new Date(today.getFullYear(), today.getMonth(), diffToLastSun);
    }

    const formatDateLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setStartDate(formatDateLocal(start));
    setEndDate(formatDateLocal(end));
  };

  const toggleFilterValue = (column: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[column] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [column]: updated };
    });
  };

  const clearFilter = (column: string) => {
    setSelectedFilters(prev => ({ ...prev, [column]: [] }));
  };

  // --- Manager Scoping Logic ---
  const scopedData = useMemo(() => {
    if (!user || !users || !jobs || !candidates) return { scopedJobs: [], scopedCandidates: [] };

    const directReportees = users.filter((u: any) => u?.reporter?._id === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);

    if (user.designation === "Manager") {
      directReportees.forEach((mentor: any) => {
        const mentorReportees = users.filter((u: any) => u?.reporter?._id === mentor._id);
        allReporteeIds = [...allReporteeIds, ...mentorReportees.map((u: any) => u._id)];
      });
    }

    const scopedJobs = jobs.filter((job: any) => {
      const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    const scopedCandidates = candidates.filter((c: any) => {
      const creatorId = c.createdBy?._id || c.createdBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    return { scopedJobs, scopedCandidates };
  }, [user, users, jobs, candidates]);

  const { scopedJobs, scopedCandidates } = scopedData;

  // --- Report Data Memo ---
  const clientJobReportData = useMemo(() => {
    const reportRows: any[] = [];

    scopedJobs.forEach(job => {
      const jobCandidatesInRange = scopedCandidates.filter(c => {
        const cJobId = typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
        return cJobId === job._id && (c.createdAt ? isWithinDateRange(c.createdAt) : true);
      });

      const joinedCandidatesInRangeCount = scopedCandidates.filter(c => {
        const cJobId = typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
        return (
          cJobId === job._id &&
          c.status === "Joined" &&
          (c.joiningDate ? isWithinDateRange(c.joiningDate.toString()) : false)
        );
      }).length;

      const jClientId = typeof job.clientId === 'object' ? job.clientId?._id : job.clientId;
      const client = clients.find(c => c._id === jClientId);
      const clientName = client?.companyName || "Unknown";
      const dateReceived = job.createdAt ? formatDate(job.createdAt) : "N/A";

      const assignedRecruiterIds = Array.isArray(job.assignedRecruiters)
        ? job.assignedRecruiters.map((r: any) => typeof r === 'object' ? r._id : r)
        : [];
      const recruitersInvolved = assignedRecruiterIds
        .map(recruiterId => users.find(u => u._id === recruiterId)?.name)
        .filter(Boolean) as string[];

      // Column Filters
      const matchesDateFilter = selectedFilters.date?.length > 0 ? selectedFilters.date.includes(dateReceived) : true;
      const matchesClientFilter = selectedFilters.client?.length > 0 ? selectedFilters.client.includes(clientName) : true;
      const matchesJobFilter = selectedFilters.job?.length > 0 ? selectedFilters.job.includes(job.title) : true;
      const matchesRecruiterFilter = selectedFilters.recruiter?.length > 0 ? recruitersInvolved.some(r => selectedFilters.recruiter.includes(r)) : true;

      // Search filters
      const matchesClientSearch = clientSearch ? clientName.toLowerCase().includes(clientSearch.toLowerCase()) : true;
      const matchesRecruiterSearch = recruiterSearch ? recruitersInvolved.some(r => r.toLowerCase().includes(recruiterSearch.toLowerCase())) : true;
      const matchesJobSearch = jobSearch ? job.title.toLowerCase().includes(jobSearch.toLowerCase()) : true;
      const matchesGlobalDate = job.createdAt ? isWithinDateRange(job.createdAt) : true;

      if (matchesDateFilter && matchesClientFilter && matchesJobFilter && matchesRecruiterFilter && matchesClientSearch && matchesRecruiterSearch && matchesJobSearch && matchesGlobalDate) {
        reportRows.push({
          job,
          clientName,
          dateReceived,
          recruitersInvolved,
          jobCandidates: jobCandidatesInRange,
          joinedCandidatesInRangeCount
        });
      }
    });

    reportRows.sort((a, b) => new Date(b.job.createdAt || 0).getTime() - new Date(a.job.createdAt || 0).getTime());

    const totals = reportRows.reduce((acc, row) => {
      acc.positions += (Number(row.job.noOfPositions) || 0);
      acc.uploads += row.jobCandidates.length;
      acc.Joined = (acc.Joined || 0) + (row.joinedCandidatesInRangeCount || 0);

      ["New", "Shortlisted", "Interviewed", "Selected", "Hold"].forEach(status => {
        const count = row.jobCandidates.filter((c: any) => c.status === status).length;
        acc[status] = (acc[status] || 0) + count;
      });

      acc.rejectByMentor = (acc.rejectByMentor || 0) + row.jobCandidates.filter((c: any) => c.status === "Rejected" && c.rejectedBy === "Mentor").length;
      acc.rejectByClient = (acc.rejectByClient || 0) + row.jobCandidates.filter((c: any) => c.status === "Rejected" && c.rejectedBy === "Client").length;
      acc.dropByMentor = (acc.dropByMentor || 0) + row.jobCandidates.filter((c: any) => c.status === "Dropped" && c.droppedBy === "Mentor").length;
      acc.dropByClient = (acc.dropByClient || 0) + row.jobCandidates.filter((c: any) => c.status === "Dropped" && c.droppedBy === "Client").length;

      return acc;
    }, { positions: 0, uploads: 0, New: 0, Shortlisted: 0, Interviewed: 0, Selected: 0, Joined: 0, Hold: 0, rejectByMentor: 0, rejectByClient: 0, dropByMentor: 0, dropByClient: 0 } as Record<string, number>);

    return { reportRows, totals };
  }, [scopedJobs, scopedCandidates, clients, users, clientSearch, recruiterSearch, jobSearch, startDate, endDate, selectedFilters]);

  const dashboardStats = useMemo(() => {
    const { totals, reportRows } = clientJobReportData;
    const activeJobs = reportRows.filter(row => row.job.status === "Open").length;

    return {
      totalCandidates: totals.uploads || 0,
      activeJobs,
      totalPositions: totals.positions || 0,
      remainingPositions: (totals.positions || 0) - (totals.Joined || 0),
      newCandidates: totals.New || 0,
      shortlistedCandidates: totals.Shortlisted || 0,
      interviewedCandidates: totals.Interviewed || 0,
      selectedCandidates: totals.Selected || 0,
      joinedCandidates: totals.Joined || 0,
      holdCandidates: totals.Hold || 0,
    };
  }, [clientJobReportData]);

  const openCandidatePopup = (jobTitle: string, clientName: string, status: string | "Total", jobCandidates: any[]) => {
    setCandidatePopupData({
      title: `${jobTitle} - ${status} Candidates`,
      clientName: clientName,
      candidates: jobCandidates
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-700";
      case "Shortlisted": return "bg-orange-100 text-orange-700";
      case "Interviewed": return "bg-purple-100 text-purple-700";
      case "Selected": return "bg-green-100 text-green-700";
      case "Joined": return "bg-emerald-100 text-emerald-700 font-bold";
      case "Hold": return "bg-amber-100 text-amber-700";
      case "Rejected": return "bg-red-100 text-red-700";
      case "Dropped": return "bg-gray-100 text-gray-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const FilterDropdown = ({ column, options, align = 'left' }: { column: string, options: string[], align?: 'left' | 'right' }) => {
    if (openFilter !== column) return null;

    const filteredOptions = options.filter(opt =>
      opt.toLowerCase().includes(filterSearch.toLowerCase())
    );

    return (
      <div className={`absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden font-normal text-slate-700 ${align === 'right' ? 'right-0' : 'left-0'}`}>
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              autoFocus
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto p-2">
          <button
            onClick={() => {
              if (selectedFilters[column]?.length === options.length) {
                clearFilter(column);
              } else {
                setSelectedFilters(prev => ({ ...prev, [column]: options }));
              }
            }}
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center justify-between group"
          >
            <span>Select All</span>
            {selectedFilters[column]?.length === options.length && <Check size={12} className="text-indigo-600" />}
          </button>
          <div className="h-px bg-slate-100 my-1" />
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <button
                key={opt}
                onClick={() => toggleFilterValue(column, opt)}
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center justify-between group"
              >
                <span className="truncate pr-4">{opt}</span>
                {selectedFilters[column]?.includes(opt) && <Check size={12} className="text-indigo-600 flex-shrink-0" />}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-slate-400 text-xs italic">No options found</div>
          )}
        </div>
        <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-between">
          <button onClick={() => clearFilter(column)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">Clear</button>
          <button onClick={() => setOpenFilter(null)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">Apply</button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">Reports</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Detailed performance and requirement analysis</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex gap-1.5 sm:gap-2 justify-center sm:justify-start">
            {['T', 'Y', 'W', 'L'].map(shortcut => (
              <button
                key={shortcut}
                onClick={() => applyDateShortcut(shortcut)}
                className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all text-slate-600 hover:text-slate-900 shadow-sm"
              >
                {shortcut}
              </button>
            ))}
          </div>
          <div className="h-[1px] w-full sm:h-6 sm:w-[1px] bg-slate-100"></div>
          <div className="flex flex-col xs:flex-row items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 flex-1">
              <CalendarCheck size={16} className="text-indigo-500 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm font-semibold focus:ring-0 cursor-pointer p-0"
              />
            </div>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden xs:block">to</div>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm font-semibold focus:ring-0 cursor-pointer p-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
        {[
          { label: "Total Positions", value: dashboardStats.totalPositions, icon: Briefcase, color: "blue", path: "/Manager/jobs" },
          { label: "Positions Left", value: dashboardStats.remainingPositions, icon: Briefcase, color: "emerald", path: "/Manager/jobs" },
          { label: "Active Jobs", value: dashboardStats.activeJobs, icon: CalendarCheck, color: "amber", path: "/Manager/jobs" },
          { label: "New", value: dashboardStats.newCandidates, icon: UserPlus, color: "blue", path: "/Manager/candidates" },
          { label: "Screen", value: dashboardStats.shortlistedCandidates, icon: ClipboardCheck, color: "orange", path: "/Manager/candidates" },
          { label: "Interviewed", value: dashboardStats.interviewedCandidates, icon: Clock, color: "purple", path: "/Manager/candidates" },
          { label: "Selected", value: dashboardStats.selectedCandidates, icon: CheckCircle, color: "green", path: "/Manager/candidates" },
          { label: "Joined", value: dashboardStats.joinedCandidates, icon: Users, color: "emerald", path: "/Manager/candidates" }
        ].map((stat, i) => (
          <div
            key={i}
            onClick={() => navigate(stat.path)}
            className="bg-white rounded-xl shadow-sm p-5 sm:p-6 flex justify-between items-center hover:shadow-md transition-all border border-slate-100 cursor-pointer group"
          >
            <div>
              <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">{stat.label}</p>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-slate-800">{stat.value}</h2>
            </div>
            <div className={`p-2.5 sm:p-3 rounded-xl transition-colors ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' :
                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' :
                  stat.color === 'amber' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' :
                    stat.color === 'orange' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-100' :
                      stat.color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100' :
                        'bg-green-50 text-green-600 group-hover:bg-green-100'
              }`}>
              <stat.icon size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Client Job Report</h2>
              <p className="text-xs text-slate-500 mt-1">Breakdown of metrics per job requirement</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Job Title..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Recruiter..."
                value={recruiterSearch}
                onChange={(e) => setRecruiterSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
          <table className="w-full text-sm text-left min-w-[2000px]">
            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-[30]">
              <tr>
                <th className="py-3 px-6 min-w-[150px] relative">
                  <div className="flex items-center justify-between">
                    <span>Date Received</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'date' ? null : 'date'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.date?.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.date?.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown column="date" options={Array.from(new Set(scopedJobs.map(j => formatDate(j.createdAt)))).sort()} />
                </th>
                <th className="py-3 px-6 min-w-[200px] relative">
                  <div className="flex items-center justify-between">
                    <span>Client</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'client' ? null : 'client'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.client?.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.client?.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown column="client" options={Array.from(new Set(scopedJobs.map(j => clients.find(c => (c._id === (typeof j.clientId === 'object' ? j.clientId?._id : j.clientId)))?.companyName || "Unknown"))).sort()} />
                </th>
                <th className="py-3 px-6 min-w-[200px] relative">
                  <div className="flex items-center justify-between">
                    <span>Job Title</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'job' ? null : 'job'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.job?.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.job?.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown column="job" options={Array.from(new Set(scopedJobs.map(j => j.title))).sort()} />
                </th>
                <th className="py-3 px-6 min-w-[150px] relative">
                  <div className="flex items-center justify-between">
                    <span>Recruiter</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'recruiter' ? null : 'recruiter'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.recruiter?.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.recruiter?.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="recruiter"
                    options={Array.from(new Set(scopedJobs.flatMap(j => (j.assignedRecruiters || []).map((r: any) => users.find(u => u._id === (typeof r === 'object' ? r._id : r))?.name)).filter(Boolean) as string[])).sort()}
                  />
                </th>
                <th className="py-3 px-4 text-center font-bold bg-slate-100/50">Total Positions</th>
                <th className="py-3 px-4 text-center font-bold bg-amber-50/50">Positions Left</th>
                <th className="py-3 px-4 text-center font-bold bg-blue-50/50 font-bold">Total Lineups</th>
                <th className="py-3 px-4 text-center">New</th>
                <th className="py-3 px-4 text-center">Screen</th>
                <th className="py-3 px-4 text-center bg-red-50 text-red-700">Reject by Mentor</th>
                <th className="py-3 px-4 text-center">Interviewed</th>
                <th className="py-3 px-4 text-center">Selected</th>
                <th className="py-3 px-4 text-center font-bold bg-indigo-50/50 text-indigo-700 font-bold">Joined</th>
                <th className="py-3 px-4 text-center">Hold</th>
                <th className="py-3 px-4 text-center bg-red-50 text-red-800">Reject by Client</th>
                <th className="py-3 px-4 text-center bg-gray-100/50">Drop by Mentor</th>
                <th className="py-3 px-4 text-center bg-slate-50">Drop by Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientJobReportData.reportRows.map((row, idx) => {
                const positions = Number(row.job.noOfPositions) || 0;
                const left = positions - (row.joinedCandidatesInRangeCount || 0);

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-slate-500">{row.dateReceived}</td>
                    <td className="py-4 px-6 font-medium text-slate-800">{row.clientName}</td>
                    <td className="py-4 px-6 font-medium text-slate-800">{row.job.title}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {row.recruitersInvolved.map((r: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium border border-slate-200">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-700">{positions}</td>
                    <td className="py-4 px-4 text-center font-bold text-amber-600">{left}</td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => openCandidatePopup(row.job.title, row.clientName, "Total", row.jobCandidates)}
                        className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:scale-110 shadow-sm"
                      >
                        {row.jobCandidates.length}
                      </button>
                    </td>
                    {["New", "Shortlisted"].map(status => {
                      const list = row.jobCandidates.filter((c: any) => c.status === (status === "Shortlisted" ? "Shortlisted" : status));
                      return (
                        <td key={status} className="py-4 px-4 text-center text-slate-600 font-medium">
                          <button onClick={() => openCandidatePopup(row.job.title, row.clientName, status === "Shortlisted" ? "Screen" : status, list)} className="hover:underline">
                            {list.length}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-4 px-4 text-center">
                      {(() => {
                        const mentorRejected = row.jobCandidates.filter((c: any) => c.status === "Rejected" && c.rejectedBy === "Mentor");
                        const count = mentorRejected.length;
                        return (
                          <button
                            disabled={count === 0}
                            onClick={() => openCandidatePopup(row.job.title, row.clientName, "Reject by Mentor", mentorRejected)}
                            className={`px-2 py-0.5 rounded-full text-xs font-bold min-w-[32px] transition-all shadow-sm ${count > 0 ? "bg-red-50 text-red-600 border border-red-100 hover:scale-110" : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                          >
                            {count}
                          </button>
                        );
                      })()}
                    </td>
                    {["Interviewed", "Selected"].map(status => {
                      const list = row.jobCandidates.filter((c: any) => c.status === status);
                      return (
                        <td key={status} className="py-4 px-4 text-center text-slate-600 font-medium">
                          <button onClick={() => openCandidatePopup(row.job.title, row.clientName, status, list)} className="hover:underline">
                            {list.length}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-4 px-4 text-center">
                      <button
                        disabled={row.joinedCandidatesInRangeCount === 0}
                        onClick={() => openCandidatePopup(row.job.title, row.clientName, "Joined", row.jobCandidates.filter((c: any) => c.status === "Joined"))}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold min-w-[32px] transition-all shadow-sm ${row.joinedCandidatesInRangeCount > 0 ? "bg-indigo-50 text-indigo-700 border border-indigo-100 hover:scale-110" : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                      >
                        {row.joinedCandidatesInRangeCount}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-600 font-medium">{row.jobCandidates.filter((c: any) => c.status === "Hold").length}</td>
                    <td className="py-4 px-4 text-center">
                      {(() => {
                        const clientRejected = row.jobCandidates.filter((c: any) => c.status === "Rejected" && c.rejectedBy === "Client");
                        const count = clientRejected.length;
                        return (
                          <button
                            disabled={count === 0}
                            onClick={() => openCandidatePopup(row.job.title, row.clientName, "Reject by Client", clientRejected)}
                            className={`px-2 py-0.5 rounded-full text-xs font-bold min-w-[32px] transition-all shadow-sm ${count > 0 ? "bg-red-50 text-red-700 border border-red-100 hover:scale-110" : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                          >
                            {count}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {(() => {
                        const mentorDropped = row.jobCandidates.filter((c: any) => c.status === "Dropped" && c.droppedBy === "Mentor");
                        const count = mentorDropped.length;
                        return (
                          <button
                            disabled={count === 0}
                            onClick={() => openCandidatePopup(row.job.title, row.clientName, "Drop by Mentor", mentorDropped)}
                            className={`px-2 py-0.5 rounded-full text-xs font-bold min-w-[32px] transition-all shadow-sm ${count > 0 ? "bg-gray-100 text-gray-700 border border-gray-200 hover:scale-110" : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                          >
                            {count}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {(() => {
                        const clientDropped = row.jobCandidates.filter((c: any) => c.status === "Dropped" && c.droppedBy === "Client");
                        const count = clientDropped.length;
                        return (
                          <button
                            disabled={count === 0}
                            onClick={() => openCandidatePopup(row.job.title, row.clientName, "Drop by Client", clientDropped)}
                            className={`px-2 py-0.5 rounded-full text-xs font-bold min-w-[32px] transition-all shadow-sm ${count > 0 ? "bg-slate-50 text-slate-600 border border-slate-200 hover:scale-110" : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                          >
                            {count}
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-200 sticky bottom-0 z-10 shadow-sm">
                <td colSpan={4} className="py-4 px-6 text-right text-slate-800 uppercase tracking-wider text-xs">Total</td>
                <td className="py-4 px-6 text-center text-slate-800">{clientJobReportData.totals.positions}</td>
                <td className="py-4 px-6 text-center text-slate-800">
                  {(clientJobReportData.totals.positions || 0) - (clientJobReportData.totals.Joined || 0)}
                </td>
                <td className="py-4 px-4 text-center text-slate-800">{clientJobReportData.totals.uploads}</td>
                <td className="py-4 px-4 text-center text-slate-800">{clientJobReportData.totals.New}</td>
                <td className="py-4 px-4 text-center text-slate-800">{clientJobReportData.totals.Shortlisted}</td>
                <td className="py-4 px-4 text-center text-red-600 font-bold">{clientJobReportData.totals.rejectByMentor}</td>
                <td className="py-4 px-4 text-center text-slate-800">{clientJobReportData.totals.Interviewed}</td>
                <td className="py-4 px-4 text-center text-slate-800">{clientJobReportData.totals.Selected}</td>
                <td className="py-4 px-4 text-center text-slate-800 font-bold">{clientJobReportData.totals.Joined}</td>
                <td className="py-4 px-4 text-center text-slate-800">{clientJobReportData.totals.Hold}</td>
                <td className="py-4 px-4 text-center text-red-700 font-bold">{clientJobReportData.totals.rejectByClient}</td>
                <td className="py-4 px-4 text-center text-gray-600 font-bold">{clientJobReportData.totals.dropByMentor || 0}</td>
                <td className="py-4 px-4 text-center text-slate-500 font-bold">{clientJobReportData.totals.dropByClient || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Details Popup */}
      <AnimatePresence>
        {candidatePopupData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-none md:rounded-xl shadow-xl w-full h-full md:h-auto md:max-w-4xl md:max-h-[80vh] flex flex-col"
            >
              <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base md:text-xl font-bold text-slate-800 truncate">{candidatePopupData.title}</h2>
                  <p className="text-xs md:text-sm font-semibold text-indigo-600 truncate">Client: {candidatePopupData.clientName}</p>
                </div>
                <button
                  onClick={() => setCandidatePopupData(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0 ml-2"
                >
                  <X size={20} className="text-slate-500 md:w-6 md:h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 md:p-6">
                {(() => {
                  const hasStatusDetails = candidatePopupData.candidates.some((c: any) =>
                    (c.status === "Interviewed" && c.interviewStage) ||
                    (c.status === "Selected" && (c.selectionDate || c.expectedJoiningDate || c.joiningDate)) ||
                    (c.status === "Joined" && c.joiningDate) ||
                    (c.status === "Dropped" && (c.droppedReason || c.droppedBy))
                  );

                  return (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                        <tr>
                          <th className="py-3 px-4 text-center">Source Date</th>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Recruiter</th>
                          <th className="py-3 px-4">Status</th>
                          {hasStatusDetails && <th className="py-3 px-4">Status Details</th>}
                          <th className="py-3 px-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {candidatePopupData.candidates.length > 0 ? (
                          candidatePopupData.candidates.map((c: any, i: number) => {
                            const dynamicKeys = Object.keys(c.dynamicFields || {});
                            const nameKey = dynamicKeys.find(k => k.toLowerCase().includes("name")) || dynamicKeys[0];
                            const phoneKey = dynamicKeys.find(k => k.toLowerCase().includes("phone")) || dynamicKeys[1];

                            const creatorId = typeof c.createdBy === 'object' ? c.createdBy?._id : c.createdBy;
                            const creatorName = users.find(u => u._id === creatorId)?.name || "Unknown";

                            const droppedEntry = Array.isArray(c.statusHistory)
                              ? c.statusHistory.find((h: any) => h.status === "Dropped")
                              : null;
                            const droppedComment = droppedEntry?.comment || "";

                            const rejectedEntry = Array.isArray(c.statusHistory)
                              ? c.statusHistory.find((h: any) => h.status === "Rejected")
                              : null;
                            const rejectedComment = rejectedEntry?.comment || "";
                            const rejectionReason = rejectedEntry?.rejectionReason || c.rejectionReason;

                            return (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 text-slate-600 text-center">{formatDate(c.createdAt)}</td>
                                <td className="py-3 px-4 font-medium text-slate-800">{c.dynamicFields?.[nameKey] || "N/A"}</td>
                                <td className="py-3 px-4 text-slate-600">{c.dynamicFields?.[phoneKey] || "N/A"}</td>
                                <td className="py-3 px-4 text-slate-600 font-medium">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-medium border border-slate-200">
                                    {creatorName}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(c.status)}`}>
                                    {c.status === "Rejected" ? `Rejected (${c.rejectedBy || "Unknown"})` : c.status}
                                  </span>
                                </td>
                                {hasStatusDetails && (
                                  <td className="py-3 px-4 text-slate-600">
                                    {c.status === "Interviewed" && c.interviewStage && (
                                      <div className="text-xs font-semibold">Stage: {c.interviewStage}</div>
                                    )}
                                    {c.status === "Selected" && (
                                      <div className="text-xs space-y-1">
                                        {c.selectionDate && <div><span className="font-semibold">Selected:</span> {formatDate(c.selectionDate)}</div>}
                                        {(c.expectedJoiningDate || c.joiningDate) && <div><span className="font-semibold">Joining:</span> {formatDate(c.expectedJoiningDate || c.joiningDate)}</div>}
                                      </div>
                                    )}
                                    {c.status === "Joined" && c.joiningDate && (
                                      <div className="text-xs font-semibold">Joined: {formatDate(c.joiningDate)}</div>
                                    )}
                                    {c.status === "Rejected" && (rejectionReason || c.rejectedBy) && (
                                      <div className="text-xs space-y-1">
                                        {rejectionReason && <div><span className="font-semibold text-red-600">Reas:</span> {rejectionReason}</div>}
                                        {c.rejectedBy && <div><span className="font-semibold">By:</span> {c.rejectedBy}</div>}
                                      </div>
                                    )}
                                    {c.status === "Dropped" && (droppedComment || c.droppedReason || c.droppedBy) && (
                                      <div className="text-xs space-y-1">
                                        {(droppedComment || c.droppedReason) && <div><span className="font-semibold text-red-600">Reas:</span> {droppedComment || c.droppedReason}</div>}
                                        {c.droppedBy && <div><span className="font-semibold">By:</span> {c.droppedBy}</div>}
                                      </div>
                                    )}
                                  </td>
                                )}
                                <td className="py-3 px-4 text-slate-600">
                                  <div className="max-w-[200px] truncate" title={c.status === "Dropped" ? droppedComment || c.droppedReason || c.notes : c.status === "Rejected" ? rejectedComment || c.notes : c.notes}>
                                    {c.status === "Dropped" ? (
                                      <span>{droppedComment || c.droppedReason || c.notes || <span className="text-slate-400">-</span>}</span>
                                    ) : c.status === "Rejected" ? (
                                      <span>{rejectedComment || c.notes || <span className="text-slate-400">-</span>}</span>
                                    ) : (
                                      <span>{c.notes || <span className="text-slate-400">-</span>}</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={hasStatusDetails ? 7 : 6} className="py-8 text-center text-slate-500 font-medium italic">No candidates found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  );
                })()}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setCandidatePopupData(null)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
