import { useState, useEffect } from "react";
import { FileText, BarChart3, AlertTriangle, X, ChevronRight, Search, Filter, Check } from "lucide-react";
import { useUserContext } from "../../context/UserProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useClientsContext } from "../../context/ClientsProvider";
import { useJobContext } from "../../context/DataProvider";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "../../utils/dateUtils";

export default function ReportsTab() {
  const { users, leaves, fetchUsers, fetchAllLeaves } = useUserContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { clients, fetchClients } = useClientsContext();
  const { jobs, fetchJobs } = useJobContext();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [candidatePopupData, setCandidatePopupData] = useState<{ title: string, clientName: string, candidates: any[] } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
    fetchAllLeaves();
    fetchallCandidates();
    fetchClients();
    fetchJobs();
  }, []);

  const stats = {
    totalUsers: users.length,
    totalCandidates: candidates.length,
    pendingLeaves: leaves.filter((l) => l.status === "Pending").length,
    totalLeaves: leaves.length,
  };

  const reports = [
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-700 border border-blue-200";
      case "Shortlisted": return "bg-orange-100 text-orange-700 border border-orange-200";
      case "Interviewed": return "bg-purple-100 text-purple-700 border border-purple-200";
      case "Selected": return "bg-green-100 text-green-700 border border-green-200";
      case "Joined": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Rejected": return "bg-red-100 text-red-700 border border-red-200";
      default: return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const getReportData = (reportId: string) => {
    switch (reportId) {
      case "pending_leaves":
        return leaves
          .filter((l) => l.status === "Pending")
          .map((l: any) => ({
            col1: l.name || "Unknown",
            col2: l.reason || "N/A",
            col3: `${formatDate(l.fromDate)} - ${formatDate(l.toDate)}`,
            col4: l.reason || "N/A",
            col5: "",
            col6: "",
          }));
      case "users":
        return users.map((u: any) => ({
          col1: u.name,
          col2: u.designation,
          col3: u.email,
          col4: "N/A",
          col5: "",
          col6: "",
        }));
      case "all_leaves":
        return leaves.map((l: any) => ({
          col1: l.name || "Unknown",
          col2: l.reason || "N/A",
          col3: l.status,
          col4: formatDate(l.appliedAt),
          col5: "",
          col6: "",
        }));
      default:
        return [];
    }
  };

  const getHeaders = (reportId: string) => {
    switch (reportId) {
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

  const FilterDropdown = ({ column, options }: { column: string, options: string[] }) => {
    if (openFilter !== column) return null;

    const filteredOptions = options.filter(opt =>
      opt.toLowerCase().includes(filterSearch.toLowerCase())
    );

    return (
      <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden font-normal text-slate-700">
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reports & Insights</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">
          Real-time system overview and detailed reports.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-blue-200"
          >
            <div>
              <p className="text-slate-500 text-sm font-medium">{report.name}</p>
              <h2 className="text-3xl font-bold mt-1 text-slate-800">{report.count}</h2>
            </div>
            <div className={`${report.bgColor} ${report.color} p-3 rounded-lg`}>
              <report.icon size={24} />
            </div>
          </div>
        ))}
      </div>


      {/* Client Job Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Client Job Report</h2>
            <p className="text-sm text-slate-500">Overview of requirement status by client</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-[180px]"
              />
            </div>
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Recruiter..."
                value={recruiterSearch}
                onChange={(e) => setRecruiterSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-[180px]"
              />
            </div>
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Job Title..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-[180px]"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] min-h-[450px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-10">
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
                  />
                </th>
                <th className="py-3 px-4 text-center min-w-[100px] relative">
                  <div className="flex items-center justify-center gap-2">
                    <span>Total</span>
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
                  />
                </th>
                <th className="py-3 px-4 text-center text-blue-600 min-w-[80px]">New</th>
                <th className="py-3 px-4 text-center text-orange-600 min-w-[80px]">Shortlisted</th>
                <th className="py-3 px-4 text-center text-purple-600 min-w-[80px]">Interviewed</th>
                <th className="py-3 px-4 text-center text-green-600 min-w-[80px]">Selected</th>
                <th className="py-3 px-4 text-center text-emerald-600 min-w-[80px]">Joined</th>
                <th className="py-3 px-4 text-center text-red-600 min-w-[80px]">Rejected</th>
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

                  const recruitersInvolved = Array.from(new Set(jobCandidates.map(c => {
                    const creatorId = typeof c.createdBy === 'object' ? (c.createdBy as any)?._id : c.createdBy;
                    return users.find(u => u._id === creatorId)?.name || "Unknown";
                  })));

                  const matchesDate = selectedFilters.date.length > 0 ? selectedFilters.date.includes(dateReceived) : true;
                  const matchesClient = selectedFilters.client.length > 0 ? selectedFilters.client.includes(clientName) : true;
                  const matchesJob = selectedFilters.job.length > 0 ? selectedFilters.job.includes(job.title) : true;
                  const matchesRecruiter = selectedFilters.recruiter.length > 0 ? recruitersInvolved.some(r => selectedFilters.recruiter.includes(r)) : true;
                  const matchesTotal = selectedFilters.total.length > 0 ? selectedFilters.total.includes(jobCandidates.length.toString()) : true;

                  const matchesClientSearch = clientSearch ? clientName.toLowerCase().includes(clientSearch.toLowerCase()) : true;
                  const matchesRecruiterSearch = recruiterSearch ? recruitersInvolved.some(r => r.toLowerCase().includes(recruiterSearch.toLowerCase())) : true;
                  const matchesJobSearch = jobSearch ? job.title.toLowerCase().includes(jobSearch.toLowerCase()) : true;

                  if (matchesDate && matchesClient && matchesJob && matchesRecruiter && matchesTotal && matchesClientSearch && matchesRecruiterSearch && matchesJobSearch) {
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

                return reportRows.map((row, i) => (
                  <tr key={`${row.job._id}-${i}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-slate-600">{row.dateReceived}</td>
                    <td className="py-4 px-6 font-medium text-slate-800">{row.clientName}</td>
                    <td className="py-4 px-6 text-slate-700 font-medium">{row.job.title}</td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {row.recruitersInvolved.map((r: string) => (
                          <span key={r} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] border border-slate-200">{r}</span>
                        ))}
                        {row.recruitersInvolved.length === 0 && <span className="text-slate-400 text-xs italic">No uploads</span>}
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
                    {["New", "Shortlisted", "Interviewed", "Selected", "Joined", "Rejected"].map(status => {
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
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>


      {/* Daily Lineup Reports Table */}
      < div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" >
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Daily Lineup Reports</h2>
            <p className="text-sm text-slate-500">Recruiter performance breakdown by job</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              {['T', 'Y', 'W', 'L'].map(s => (
                <button
                  key={s}
                  onClick={() => applyDateShortcut(s)}
                  className="w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-md hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-500 hover:text-indigo-600"
                  title={s === 'T' ? 'Today' : s === 'Y' ? 'Yesterday' : s === 'W' ? 'This Week' : 'Last Week'}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 flex-1 sm:flex-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm focus:outline-none text-slate-600 w-full sm:w-auto"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm focus:outline-none text-slate-600 w-full sm:w-auto"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] min-h-[450px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-10">
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
                  />
                </th>
                <th className="py-3 px-4 text-center min-w-[120px] relative">
                  <div className="flex items-center justify-center gap-2">
                    <span>Total Uploads</span>
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
                  />
                </th>
                <th className="py-3 px-4 text-center text-blue-600 min-w-[80px]">New</th>
                <th className="py-3 px-4 text-center text-orange-600 min-w-[80px]">Shortlisted</th>
                <th className="py-3 px-4 text-center text-purple-600 min-w-[80px]">Interviewed</th>
                <th className="py-3 px-4 text-center text-green-600 min-w-[80px]">Selected</th>
                <th className="py-3 px-4 text-center text-emerald-600 min-w-[80px]">Joined</th>
                <th className="py-3 px-4 text-center text-red-600 min-w-[80px]">Rejected</th>
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

                return reportRows.map((row, i) => (
                  <tr key={`${row.recruiter._id}-${typeof row.job === 'object' ? row.job._id : row.job}-${i}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-slate-600">{row.jobDate}</td>
                    <td className="py-4 px-6 font-medium text-slate-800">{row.recruiter.name}</td>
                    <td className="py-4 px-6 text-slate-600">{row.clientName}</td>
                    <td className="py-4 px-6 text-slate-700 font-medium">{row.job.title}</td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => openCandidatePopup(row.job.title, row.clientName, "Uploaded", row.jobCandidates)}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200 min-w-[32px] hover:bg-slate-200"
                      >
                        {row.jobCandidates.length}
                      </button>
                    </td>
                    {["New", "Shortlisted", "Interviewed", "Selected", "Joined", "Rejected"].map(status => {
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
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div >

      {/* Available Reports List */}
      < div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" >
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
      </div >

      {/* Report Modal */}
      <AnimatePresence>
        {
          selectedReport && (
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
                            {getHeaders(selectedReport).length > 2 && <td className="py-3 px-4 text-slate-600">{row.col3}</td>}
                            {getHeaders(selectedReport).length > 3 && <td className="py-3 px-4 text-slate-600">{row.col4}</td>}
                            {getHeaders(selectedReport).length > 4 && <td className="py-3 px-4 text-slate-600">{row.col5}</td>}
                            {getHeaders(selectedReport).length > 5 && <td className="py-3 px-4 text-slate-600">{row.col6}</td>}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
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
          )
        }
      </AnimatePresence >

      {/* Candidate Details Popup */}
      <AnimatePresence>
        {
          candidatePopupData && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {candidatePopupData.title}
                    </h2>
                    <p className="text-sm font-semibold text-indigo-600">Client: {candidatePopupData.clientName}</p>
                  </div>
                  <button
                    onClick={() => setCandidatePopupData(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-slate-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-6">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Created By</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Applied On</th>
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
                              <td className="py-3 px-4 text-slate-600 text-center">{formatDate(c.createdAt)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            No candidates found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
