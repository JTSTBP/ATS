import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Check, Users, Briefcase, CalendarCheck, X, UserPlus, ClipboardCheck, Clock, CheckCircle } from "lucide-react";
import { useUserContext } from "../../context/UserProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useClientsContext } from "../../context/ClientsProvider";
import { useJobContext } from "../../context/DataProvider";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "../../utils/dateUtils";

export default function ReportsTab() {
  const { users, fetchUsers } = useUserContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { clients, fetchClients } = useClientsContext();
  const { jobs, fetchJobs } = useJobContext();
  const navigate = useNavigate();
  const [candidatePopupData, setCandidatePopupData] = useState<{ title: string, clientName: string, candidates: any[] } | null>(null);

  // Default to current month
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    date: [],
    client: [],
    job: [],
    recruiter: [],
    total: [],
    daily_req: [],
    daily_recruiter: [],
    daily_client: [],
    daily_job: [],
    daily_total: []
  });
  const [filterSearch, setFilterSearch] = useState("");
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

  // Calculate statistics (Dashboard Style)
  const dashboardStats = useMemo(() => {
    // Filter functions
    const filterByDate = (dateString: string | undefined) => {
      if (!startDate && !endDate) return true;
      return dateString ? isWithinDateRange(dateString) : false;
    };

    // Filter data based on selected date range
    const filteredJobs = jobs.filter((j) => filterByDate(j.createdAt));
    const filteredCandidates = candidates.filter((c) => filterByDate(c.createdAt));

    const totalCandidates = filteredCandidates.length;
    const activeJobs = filteredJobs.filter((j) => j.status === "Open").length;

    // Status-specific counts
    const newCandidates = filteredCandidates.filter((c) => c.status === "New").length;
    const shortlistedCandidates = filteredCandidates.filter((c) => c.status === "Shortlisted").length;
    const interviewedCandidates = filteredCandidates.filter((c) => c.status === "Interviewed").length;
    const selectedCandidates = filteredCandidates.filter((c) => c.status === "Selected").length;
    const joinedCandidates = filteredCandidates.filter((c) => c.status === "Joined").length;

    // Calculate Total Positions and Remaining
    const totalPositions = filteredJobs.reduce((sum, j) => sum + (Number(j.noOfPositions) || 0), 0);

    // Count joined per job to get remaining positions
    const joinedPerJob = candidates.reduce((acc, c) => {
      if (c.status === "Joined") {
        // Handle both populated object and ID string
        const jid = typeof c.jobId === 'object' && c.jobId !== null
          ? String((c.jobId as any)._id)
          : String(c.jobId);
        acc[jid] = (acc[jid] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalJoinedForFilteredJobs = filteredJobs.reduce((sum, j) => {
      const jid = String(j._id);
      return sum + (joinedPerJob[jid] || 0);
    }, 0);

    const remainingPositions = totalPositions - totalJoinedForFilteredJobs;

    return {
      totalCandidates,
      activeJobs,
      totalPositions,
      remainingPositions,
      newCandidates,
      shortlistedCandidates,
      interviewedCandidates,
      selectedCandidates,
      joinedCandidates,
    };
  }, [jobs, candidates, startDate, endDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-700 border border-blue-200";
      case "Shortlisted": return "bg-orange-100 text-orange-700 border border-orange-200";
      case "Interviewed": return "bg-purple-100 text-purple-700 border border-purple-200";
      case "Selected": return "bg-green-100 text-green-700 border border-green-200";
      case "Joined": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Rejected": return "bg-red-100 text-red-700 border border-red-200";
      case "Dropped": return "bg-gray-100 text-gray-700 border border-gray-200";
      default: return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };



  const openCandidatePopup = (jobTitle: string, clientName: string, status: string | "Total", jobCandidates: any[]) => {
    setCandidatePopupData({
      title: `${jobTitle} - ${status} Candidates`,
      clientName: clientName,
      candidates: jobCandidates
    });
  };

  const applyDateShortcut = (shortcut: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    let end = new Date(today);

    if (shortcut === 'T') {
      // Today is default
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
              if (selectedFilters[column].length === options.length) {
                clearFilter(column);
              } else {
                setSelectedFilters(prev => ({ ...prev, [column]: options }));
              }
            }}
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center justify-between group"
          >
            <span>Select All</span>
            {selectedFilters[column].length === options.length && <Check size={12} className="text-indigo-600" />}
          </button>
          <div className="h-px bg-slate-100 my-1" />
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <button
                key={opt}
                onClick={() => toggleFilterValue(column, opt)}
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center justify-between group"
              >
                <span className="truncate pr-2">{opt}</span>
                {selectedFilters[column].includes(opt) && <Check size={12} className="text-indigo-600" />}
              </button>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-xs text-slate-400">No options found</div>
          )}
        </div>
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-between gap-2">
          <button
            onClick={() => clearFilter(column)}
            className="flex-1 px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-red-600 uppercase tracking-wider"
          >
            Clear
          </button>
          <button
            onClick={() => setOpenFilter(null)}
            className="flex-1 px-2 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="text-slate-800 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Reports & Insights</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">
            Real-time system overview and detailed reports.
          </p>
        </div>

        {/* Top Date Filter */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow border border-slate-200">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent p-1"
            />
          </div>
          <span className="text-slate-400">-</span>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm border-none focus:ring-0 text-slate-700 bg-transparent p-1"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {/* Stats Grid (Dashboard Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
        {/* Total Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-indigo-600 transition-colors">
              Total Candidates
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {dashboardStats.totalCandidates}
            </h2>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
            <Users size={24} />
          </div>
        </div>

        {/* Total Positions */}
        <div
          onClick={() => navigate("/Admin/jobs")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-blue-600 transition-colors">
              Total Positions
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {dashboardStats.totalPositions}
            </h2>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
            <Briefcase size={24} />
          </div>
        </div>

        {/* Positions Left */}
        <div
          onClick={() => navigate("/Admin/jobs")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-emerald-600 transition-colors">
              Positions Left
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {dashboardStats.remainingPositions}
            </h2>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
            <Briefcase size={24} />
          </div>
        </div>

        {/* Active Jobs */}
        <div
          onClick={() => navigate("/Admin/jobs")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-amber-600 transition-colors">
              Active Jobs
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {dashboardStats.activeJobs}
            </h2>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-100 transition-colors">
            <CalendarCheck size={24} />
          </div>
        </div>

        {/* New Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-blue-600 transition-colors">
              New
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {dashboardStats.newCandidates}
            </h2>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
            <UserPlus size={24} />
          </div>
        </div>

        {/* Shortlisted Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-orange-600 transition-colors">
              Screen
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {dashboardStats.shortlistedCandidates}
            </h2>
          </div>
          <div className="bg-orange-50 text-orange-600 p-3 rounded-xl group-hover:bg-orange-100 transition-colors">
            <ClipboardCheck size={24} />
          </div>
        </div>

        {/* Interviewed Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-purple-600 transition-colors">
              Interviewed
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {dashboardStats.interviewedCandidates}
            </h2>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-xl group-hover:bg-purple-100 transition-colors">
            <Clock size={24} />
          </div>
        </div>

        {/* Selected Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-green-600 transition-colors">
              Selected
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {dashboardStats.selectedCandidates}
            </h2>
          </div>
          <div className="bg-green-50 text-green-600 p-3 rounded-xl group-hover:bg-green-100 transition-colors">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Joined Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-sm font-medium group-hover:text-emerald-600 transition-colors">
              Joined
            </p>
            <h2 className="text-3xl font-bold mt-1 text-slate-800">
              {dashboardStats.joinedCandidates}
            </h2>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
            <Users size={24} />
          </div>
        </div>
      </div>


      {/* Client Job Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <div className="mb-4">
            <h2 className="text-base md:text-lg font-bold text-slate-800">Client Job Report</h2>
            <p className="text-xs md:text-sm text-slate-500">Overview of requirement status by client</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full">
            <div className="relative group w-full md:w-auto md:flex-1 md:max-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full"
              />
            </div>
            <div className="relative group w-full md:w-auto md:flex-1 md:max-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Recruiter..."
                value={recruiterSearch}
                onChange={(e) => setRecruiterSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full"
              />
            </div>
            <div className="relative group w-full md:w-auto md:flex-1 md:max-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Job Title..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] min-h-[300px] md:min-h-[450px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-[30]">
              <tr>
                <th className="py-3 px-6 min-w-[150px] relative">
                  <div className="flex items-center justify-between">
                    <span>Date Received</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'date' ? null : 'date'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.date.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.date.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="date"
                    options={Array.from(new Set(jobs.map(j => formatDate(j.createdAt)))).sort()}
                  />
                </th>
                <th className="py-3 px-6 min-w-[200px] relative">
                  <div className="flex items-center justify-between">
                    <span>Client Name</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'client' ? null : 'client'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.client.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.client.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="client"
                    options={Array.from(new Set(clients.map(c => c.companyName))).sort()}
                  />
                </th>
                <th className="py-3 px-6 min-w-[200px] relative">
                  <div className="flex items-center justify-between">
                    <span>Job Title</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'job' ? null : 'job'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.job.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.job.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="job"
                    options={Array.from(new Set(jobs.map(j => j.title))).sort()}
                  />
                </th>
                <th className="py-3 px-6 min-w-[100px]">
                  <span>Positions</span>
                </th>

                <th className="py-3 px-6 min-w-[200px] relative">
                  <div className="flex items-center justify-between">
                    <span>Assigned Recruiters</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'recruiter' ? null : 'recruiter'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.recruiter.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.recruiter.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="recruiter"
                    options={Array.from(new Set(users.filter(u => u.designation?.toLowerCase().includes("recruiter") || u.isAdmin).map(u => u.name))).sort()}
                    align="right"
                  />
                </th>
                <th className="py-3 px-4 text-center min-w-[100px] relative">
                  <div className="flex items-center justify-center gap-2">
                    <span>Total Lineups</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'total' ? null : 'total'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.total.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.total.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="total"
                    options={Array.from(new Set(jobs.map(j => {
                      const jobCandidates = candidates.filter(can => {
                        const canJobId = typeof can.jobId === 'object' ? (can.jobId as any)?._id : can.jobId;
                        return canJobId === j._id;
                      });
                      return jobCandidates.length.toString();
                    }))).sort((a, b) => parseInt(a) - parseInt(b))}
                    align="right"
                  />
                </th>
                <th className="py-3 px-4 text-center text-blue-600 min-w-[80px]">New</th>
                <th className="py-3 px-4 text-center text-orange-600 min-w-[80px]">Screen</th>
                <th className="py-3 px-4 text-center text-purple-600 min-w-[80px]">Interviewed</th>
                <th className="py-3 px-4 text-center text-green-600 min-w-[80px]">Selected</th>
                <th className="py-3 px-4 text-center text-emerald-600 min-w-[80px]">Joined</th>
                <th className="py-3 px-4 text-center text-red-600 min-w-[80px]">Rejected</th>
                <th className="py-3 px-4 text-center text-gray-600 min-w-[80px]">Dropped</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const reportRows: any[] = [];

                jobs.forEach(job => {
                  const jobCandidates = candidates.filter(c => {
                    const cJobId = typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
                    return cJobId === job._id && (c.createdAt ? isWithinDateRange(c.createdAt) : true);
                  });

                  const jClientId = typeof job.clientId === 'object' ? job.clientId?._id : job.clientId;
                  const client = clients.find(c => c._id === jClientId);
                  const clientName = client?.companyName || "Unknown";
                  const dateReceived = job.createdAt ? formatDate(job.createdAt) : "N/A";

                  // Get assigned recruiters from the job itself
                  const assignedRecruiterIds = Array.isArray(job.assignedRecruiters)
                    ? job.assignedRecruiters.map((r: any) => typeof r === 'object' ? r._id : r)
                    : [];

                  const recruitersInvolved = assignedRecruiterIds
                    .map(recruiterId => users.find(u => u._id === recruiterId)?.name)
                    .filter(Boolean) as string[];

                  const matchesDate = selectedFilters.date.length > 0 ? selectedFilters.date.includes(dateReceived) : true;
                  const matchesClient = selectedFilters.client.length > 0 ? selectedFilters.client.includes(clientName) : true;
                  const matchesJob = selectedFilters.job.length > 0 ? selectedFilters.job.includes(job.title) : true;
                  const matchesRecruiter = selectedFilters.recruiter.length > 0 ? recruitersInvolved.some(r => selectedFilters.recruiter.includes(r)) : true;
                  const matchesTotal = selectedFilters.total.length > 0 ? selectedFilters.total.includes(jobCandidates.length.toString()) : true;

                  const matchesClientSearch = clientSearch ? clientName.toLowerCase().includes(clientSearch.toLowerCase()) : true;
                  const matchesRecruiterSearch = recruiterSearch ? recruitersInvolved.some(r => r.toLowerCase().includes(recruiterSearch.toLowerCase())) : true;
                  const matchesJobSearch = jobSearch ? job.title.toLowerCase().includes(jobSearch.toLowerCase()) : true;
                  const matchesGlobalDate = job.createdAt ? isWithinDateRange(job.createdAt) : true;

                  if (matchesDate && matchesClient && matchesJob && matchesRecruiter && matchesTotal && matchesClientSearch && matchesRecruiterSearch && matchesJobSearch && matchesGlobalDate) {
                    reportRows.push({
                      job,
                      clientName,
                      dateReceived,
                      recruitersInvolved,
                      jobCandidates
                    });
                  }
                });

                if (reportRows.length === 0) {
                  return (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500">
                        No job report data found for the selected criteria.
                      </td>
                    </tr>
                  );
                }

                // Sort by date (newest first)
                reportRows.sort((a, b) => new Date(b.job.createdAt || 0).getTime() - new Date(a.job.createdAt || 0).getTime());

                const totals = reportRows.reduce((acc, row) => {
                  acc.positions += (Number(row.job.noOfPositions) || 0);
                  acc.uploads += row.jobCandidates.length;
                  ["New", "Shortlisted", "Interviewed", "Selected", "Joined", "Rejected", "Dropped"].forEach(status => {
                    const count = row.jobCandidates.filter((c: any) => c.status === status).length;
                    acc[status] = (acc[status] || 0) + count;
                  });
                  return acc;
                }, { positions: 0, uploads: 0 } as Record<string, number>);

                return (
                  <>
                    {reportRows.map((row, i) => (
                      <tr key={`${row.job._id}-${i}`} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 text-slate-600">{row.dateReceived}</td>
                        <td className="py-4 px-6 font-medium text-slate-800">{row.clientName}</td>
                        <td className="py-4 px-6 text-slate-700 font-medium">{row.job.title}</td>
                        <td className="py-4 px-6 text-slate-600 text-center">{row.job.noOfPositions || '-'}</td>
                        <td className="py-4 px-6 text-slate-600">
                          <div className="flex flex-wrap gap-1">
                            {row.recruitersInvolved.map((r: string) => (
                              <span key={r} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] border border-slate-200">{r}</span>
                            ))}
                            {row.recruitersInvolved.length === 0 && <span className="text-slate-400 text-xs italic">No recruiters assigned</span>}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            disabled={row.jobCandidates.length === 0}
                            onClick={() => openCandidatePopup(row.job.title, row.clientName, "Total Uploads", row.jobCandidates)}
                            className={`px-2 py-0.5 rounded-full text-xs font-bold border min-w-[32px] transition-all ${row.jobCandidates.length > 0
                              ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                              : "bg-slate-50 text-slate-300 border-slate-100 cursor-default"}`}
                          >
                            {row.jobCandidates.length}
                          </button>
                        </td>
                        {["New", "Shortlisted", "Interviewed", "Selected", "Joined", "Rejected", "Dropped"].map(status => {
                          const statusCandidates = row.jobCandidates.filter((c: any) => c.status === status);
                          const count = statusCandidates.length;
                          return (
                            <td key={status} className="py-4 px-4 text-center">
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, status, statusCandidates)}
                                className={`px-2 py-0.5 rounded-full text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? `${getStatusColor(status)} hover:scale-110`
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-200 sticky bottom-0 z-10 shadow-sm">
                      <td colSpan={3} className="py-4 px-6 text-right text-slate-800 uppercase tracking-wider text-xs">Total</td>
                      <td className="py-4 px-6 text-center text-slate-800">{totals.positions}</td>
                      <td className="py-4 px-6"></td>
                      <td className="py-4 px-4 text-center text-slate-800">{totals.uploads}</td>
                      {["New", "Shortlisted", "Interviewed", "Selected", "Joined", "Rejected", "Dropped"].map(status => (
                        <td key={status} className="py-4 px-4 text-center text-slate-800">
                          {totals[status] || 0}
                        </td>
                      ))}
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>


      {/* Daily Lineup Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <div className="mb-4">
            <h2 className="text-base md:text-lg font-bold text-slate-800">Daily Lineup Reports</h2>
            <p className="text-xs md:text-sm text-slate-500">Recruiter performance breakdown by job</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-full md:w-auto justify-center sm:justify-start">
              {['T', 'Y', 'W', 'L'].map(s => (
                <button
                  key={s}
                  onClick={() => applyDateShortcut(s)}
                  className="w-9 h-9 md:w-7 md:h-7 flex items-center justify-center text-xs md:text-[10px] font-bold rounded-md hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-500 hover:text-indigo-600"
                  title={s === 'T' ? 'Today' : s === 'Y' ? 'Yesterday' : s === 'W' ? 'This Week' : 'Last Week'}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-full md:max-w-md">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none text-slate-600 w-full"
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none text-slate-600 w-full"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="text-slate-400 hover:text-red-500 transition-colors self-center p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] min-h-[300px] md:min-h-[450px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-[30]">
              <tr>
                <th className="py-3 px-6 min-w-[200px] relative">
                  <div className="flex items-center justify-between">
                    <span>Requirement Received</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_req' ? null : 'daily_req'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_req.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.daily_req.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_req"
                    options={Array.from(new Set(jobs.map(j => formatDate(j.createdAt)))).sort()}
                  />
                </th>
                <th className="py-3 px-6 min-w-[200px] relative">
                  <div className="flex items-center justify-between">
                    <span>Recruiter Name</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_recruiter' ? null : 'daily_recruiter'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_recruiter.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.daily_recruiter.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_recruiter"
                    options={Array.from(new Set(users.filter(u => u.designation?.toLowerCase().includes("recruiter") || u.isAdmin).map(u => u.name))).sort()}
                  />
                </th>
                <th className="py-3 px-6 min-w-[200px] relative">
                  <div className="flex items-center justify-between">
                    <span>Client Name</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_client' ? null : 'daily_client'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_client.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.daily_client.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_client"
                    options={Array.from(new Set(clients.map(c => c.companyName))).sort()}
                  />
                </th>
                <th className="py-3 px-6 min-w-[200px] relative">
                  <div className="flex items-center justify-between">
                    <span>Job Title</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_job' ? null : 'daily_job'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_job.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.daily_job.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_job"
                    options={Array.from(new Set(jobs.map(j => j.title))).sort()}
                    align="right"
                  />
                </th>
                <th className="py-3 px-6 min-w-[100px]">
                  <span>Positions</span>
                </th>
                <th className="py-3 px-4 text-center min-w-[120px] relative">
                  <div className="flex items-center justify-center gap-2">
                    <span>Total Lineups</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_total' ? null : 'daily_total'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_total.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={14} fill={selectedFilters.daily_total.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_total"
                    options={Array.from(new Set(candidates.map(c => {
                      const creatorId = typeof c.createdBy === 'object' ? (c.createdBy as any)?._id : c.createdBy;
                      return candidates.filter(can => {
                        const canCreatorId = typeof can.createdBy === 'object' ? (can.createdBy as any)?._id : can.createdBy;
                        return canCreatorId === creatorId;
                      }).length.toString();
                    }))).sort((a, b) => parseInt(a) - parseInt(b))}
                    align="right"
                  />
                </th>
                <th className="py-3 px-4 text-center text-blue-600 min-w-[80px]">New</th>
                <th className="py-3 px-4 text-center text-orange-600 min-w-[80px]">Screen</th>
                <th className="py-3 px-4 text-center text-purple-600 min-w-[80px]">Interviewed</th>
                <th className="py-3 px-4 text-center text-green-600 min-w-[80px]">Selected</th>
                <th className="py-3 px-4 text-center text-emerald-600 min-w-[80px]">Joined</th>
                <th className="py-3 px-4 text-center text-red-600 min-w-[80px]">Rejected</th>
                <th className="py-3 px-4 text-center text-gray-600 min-w-[80px]">Dropped</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const recruiters = users.filter(u => u.designation?.toLowerCase().includes("recruiter") || u.isAdmin);

                const reportRows: any[] = [];

                recruiters.forEach(recruiter => {
                  const recruiterCandidates = candidates.filter(c => {
                    const cCreatorId = typeof c.createdBy === 'object' ? (c.createdBy as any)?._id : c.createdBy;
                    return cCreatorId === recruiter._id && (c.createdAt ? isWithinDateRange(c.createdAt) : true);
                  });

                  const jobIds = Array.from(new Set(recruiterCandidates.map(c => {
                    return typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
                  })));

                  jobIds.forEach(jobId => {
                    if (!jobId) return;
                    const job = jobs.find(j => j._id === jobId);
                    if (!job) return;

                    const jClientId = typeof job.clientId === 'object' ? (job.clientId as any)?._id : job.clientId;
                    const client = clients.find(c => jClientId === c._id);
                    const clientName = client?.companyName || "Unknown";
                    const jobCandidates = recruiterCandidates.filter(c => {
                      const cJobId = typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
                      return cJobId === jobId;
                    });
                    const jobDate = job.createdAt ? formatDate(job.createdAt) : "N/A";

                    const matchesReq = selectedFilters.daily_req.length > 0 ? selectedFilters.daily_req.includes(jobDate) : true;
                    const matchesRecruiter = selectedFilters.daily_recruiter.length > 0 ? selectedFilters.daily_recruiter.includes(recruiter.name) : true;
                    const matchesClient = selectedFilters.daily_client.length > 0 ? selectedFilters.daily_client.includes(clientName) : true;
                    const matchesJob = selectedFilters.daily_job.length > 0 ? selectedFilters.daily_job.includes(job.title) : true;
                    const matchesTotal = selectedFilters.daily_total.length > 0 ? selectedFilters.daily_total.includes(jobCandidates.length.toString()) : true;

                    if (matchesReq && matchesRecruiter && matchesClient && matchesJob && matchesTotal) {
                      reportRows.push({
                        recruiter,
                        job,
                        clientName,
                        jobDate,
                        jobCandidates
                      });
                    }
                  });
                });

                if (reportRows.length === 0) {
                  return (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500">
                        No lineup data found for the selected criteria.
                      </td>
                    </tr>
                  );
                }

                const totals = reportRows.reduce((acc, row) => {
                  acc.positions += (Number(row.job.noOfPositions) || 0);
                  acc.uploads += row.jobCandidates.length;
                  ["New", "Shortlisted", "Interviewed", "Selected", "Joined", "Rejected", "Dropped"].forEach(status => {
                    const count = row.jobCandidates.filter((c: any) => c.status === status).length;
                    acc[status] = (acc[status] || 0) + count;
                  });
                  return acc;
                }, { positions: 0, uploads: 0 } as Record<string, number>);

                return (
                  <>
                    {reportRows.map((row, i) => (
                      <tr key={`${row.job._id}-${row.recruiter._id}-${i}`} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 text-slate-600">{row.jobDate}</td>
                        <td className="py-4 px-6 font-medium text-slate-800">{row.recruiter.name}</td>
                        <td className="py-4 px-6 text-slate-600">{row.clientName}</td>
                        <td className="py-4 px-6 text-slate-600 max-w-[200px] truncate" title={row.job.title}>{row.job.title}</td>
                        <td className="py-4 px-6 text-center text-slate-600">{row.job.noOfPositions || '-'}</td>
                        <td className="py-4 px-4 text-center">
                          <button
                            disabled={row.jobCandidates.length === 0}
                            onClick={() => openCandidatePopup(row.job.title, row.clientName, "Total Uploads", row.jobCandidates)}
                            className={`px-2 py-0.5 rounded-full text-xs font-bold border min-w-[32px] transition-all ${row.jobCandidates.length > 0
                              ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                              : "bg-slate-50 text-slate-300 border-slate-100 cursor-default"}`}
                          >
                            {row.jobCandidates.length}
                          </button>
                        </td>
                        {["New", "Shortlisted", "Interviewed", "Selected", "Joined", "Rejected", "Dropped"].map(status => {
                          const statusCandidates = row.jobCandidates.filter((c: any) => c.status === status);
                          const count = statusCandidates.length;
                          return (
                            <td key={status} className="py-4 px-4 text-center">
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, status, statusCandidates)}
                                className={`px-2 py-0.5 rounded-full text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? `${getStatusColor(status)} hover:scale-110`
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-200 sticky bottom-0 z-10 shadow-sm">
                      <td colSpan={4} className="py-4 px-6 text-right text-slate-800 uppercase tracking-wider text-xs">Total</td>
                      <td className="py-4 px-6 text-center text-slate-800">{totals.positions}</td>
                      <td className="py-4 px-4 text-center text-slate-800">{totals.uploads}</td>
                      {["New", "Shortlisted", "Interviewed", "Selected", "Joined", "Rejected", "Dropped"].map(status => (
                        <td key={status} className="py-4 px-4 text-center text-slate-800">
                          {totals[status] || 0}
                        </td>
                      ))}
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div >


      {/* Candidate Details Popup */}
      <AnimatePresence>
        {
          candidatePopupData && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-none md:rounded-xl shadow-xl w-full h-full md:h-auto md:max-w-4xl md:max-h-[80vh] flex flex-col"
              >
                <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base md:text-xl font-bold text-slate-800 truncate">
                      {candidatePopupData.title}
                    </h2>
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
                    // Check if any candidate has status details worth showing
                    const hasStatusDetails = candidatePopupData.candidates.some((c: any) =>
                      (c.status === "Interviewed" && c.interviewStage) ||
                      (c.status === "Selected" && (c.selectionDate || c.expectedJoiningDate || c.joiningDate)) ||
                      (c.status === "Joined" && c.joiningDate)
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

                              const creatorId = typeof c.createdBy === 'object' ? c.createdBy._id : c.createdBy;
                              const creatorName = users.find(u => u._id === creatorId)?.name || "Unknown";

                              return (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="py-3 px-4 text-slate-600 text-center">{formatDate(c.createdAt)}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{c.dynamicFields?.[nameKey] || "N/A"}</td>
                                  <td className="py-3 px-4 text-slate-600">{c.dynamicFields?.[phoneKey] || "N/A"}</td>
                                  <td className="py-3 px-4 text-slate-600">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-medium border border-slate-200">
                                      {creatorName}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(c.status)}`}>
                                      {c.status}
                                    </span>
                                  </td>
                                  {hasStatusDetails && (
                                    <td className="py-3 px-4 text-slate-600">
                                      {c.status === "Interviewed" && c.interviewStage && (
                                        <div className="text-xs">
                                          <span className="font-semibold">Stage:</span> {c.interviewStage}
                                        </div>
                                      )}
                                      {c.status === "Selected" && (
                                        <div className="text-xs space-y-1">
                                          {c.selectionDate && (
                                            <div>
                                              <span className="font-semibold">Selected:</span> {formatDate(c.selectionDate)}
                                            </div>
                                          )}
                                          {(c.expectedJoiningDate || c.joiningDate) && (
                                            <div>
                                              <span className="font-semibold">Joining:</span> {formatDate(c.expectedJoiningDate || c.joiningDate)}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {c.status === "Joined" && c.joiningDate && (
                                        <div className="text-xs">
                                          <span className="font-semibold">Joined:</span> {formatDate(c.joiningDate)}
                                        </div>
                                      )}
                                      {!((c.status === "Interviewed" && c.interviewStage) || c.status === "Selected" || (c.status === "Joined" && c.joiningDate)) && (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>
                                  )}
                                  <td className="py-3 px-4 text-slate-600">
                                    <div className="max-w-[200px] truncate" title={c.notes}>
                                      {c.notes || <span className="text-slate-400">-</span>}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={hasStatusDetails ? 7 : 6} className="py-8 text-center text-slate-500">
                                No candidates found.
                              </td>
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
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >
    </div >
  );
}
