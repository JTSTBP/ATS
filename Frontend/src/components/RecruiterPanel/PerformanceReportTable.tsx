import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useCandidateContext } from '../../context/CandidatesProvider';
import { useJobContext } from '../../context/DataProvider';
import { useClientsContext } from '../../context/ClientsProvider';
import { formatDate } from '../../utils/dateUtils';
import { getStatusTimestamp } from '../../utils/statusUtils';

export default function PerformanceReportTable() {
    const { user } = useAuth();
    const { candidates } = useCandidateContext();
    const { jobs } = useJobContext();
    const { clients } = useClientsContext();

    // State for Filters and Popups
    const [candidatePopupData, setCandidatePopupData] = useState<{ title: string, clientName: string, candidates: any[] } | null>(null);
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
        date: [],
        client: [],
        job: [],
        total: [],
    });
    const [filterSearch, setFilterSearch] = useState("");
    const [clientSearch, setClientSearch] = useState("");
    const [jobSearch, setJobSearch] = useState("");
    // When true, status columns (New/Shortlisted/etc.) are counted by status-change timestamp
    // When false (default), they are counted by candidate upload date (createdAt)
    const [filterByStatusDate, setFilterByStatusDate] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "New": return "bg-blue-100 text-blue-700 border border-blue-200";
            case "Shortlisted": return "bg-orange-100 text-orange-700 border border-orange-200";
            case "Interviewed":
            case "Interview": return "bg-purple-100 text-purple-700 border border-purple-200";
            case "Selected":
            case "Offer": return "bg-green-100 text-green-700 border border-green-200";
            case "Joined":
            case "Hired": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
            case "Rejected": return "bg-red-100 text-red-700 border border-red-200";
            case "Dropped": return "bg-gray-100 text-gray-700 border border-gray-200";
            case "Hold": return "bg-amber-100 text-amber-700 border border-amber-200";
            default: return "bg-slate-100 text-slate-700 border border-slate-200";
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

    const isJobAssigned = (job: any) => {
        if (!job.assignedRecruiters) return false;
        if (!Array.isArray(job.assignedRecruiters)) return false;
        return job.assignedRecruiters.some((r: any) => {
            const rId = typeof r === 'object' ? r._id : r;
            return rId === user?._id;
        });
    };

    // Helper: get candidates for Rejected/Dropped with a by-field qualifier
    const getSpecialStatusCandidates = (jobCandidates: any[], mainStatus: string, byValue: 'Manager' | 'Client') => {
        const byField = mainStatus === 'Rejected' ? 'rejectedBy' : 'droppedBy';

        return jobCandidates.filter((c: any) => {
            // Check for both "Rejected" and "Reject" / "Dropped" and "Drop"
            const statusMatch = mainStatus === 'Rejected'
                ? (c.status === 'Rejected' || c.status === 'Reject')
                : (c.status === 'Dropped' || c.status === 'Drop');

            if (!statusMatch) return false;

            // 1. Explicit check (prioritize fields like rejectedBy/droppedBy)
            const explicitBy = c[byField];
            if (explicitBy) {
                // Treat 'Mentor' and 'Manager' as the same for Recruiter/Admin alignment
                if (byValue === 'Manager') {
                    if (explicitBy !== 'Manager' && explicitBy !== 'Mentor') return false;
                } else if (byValue === 'Client') {
                    if (explicitBy !== 'Client') return false;
                }
            } else {
                // 2. Inference check (matching Admin Panel logic)
                const history = c.statusHistory || [];
                const hasInterviewed = history.some((h: any) => (h.status === 'Interviewed' || h.status === 'Interview'));

                if (byValue === 'Client') {
                    // Attributed to Client if they ever reached Interview stage
                    if (!hasInterviewed) return false;
                } else if (byValue === 'Manager') {
                    // Attributed to Manager/Mentor if they were rejected/dropped WITHOUT reaching Interview stage
                    // (Note: removed strict 'hasShortlisted' check to capture immediate rejections)
                    if (hasInterviewed) return false;
                } else {
                    return false;
                }
            }

            if (!filterByStatusDate) return true;
            const ts = getStatusTimestamp(c, mainStatus === 'Rejected' ? ['Rejected', 'Reject'] : ['Dropped', 'Drop']);
            return isWithinDateRange(ts || c.createdAt);
        });
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
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Performance Report</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mt-1">Breakdown by Job and Candidate Status</p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                            {['T', 'Y', 'W', 'L'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => applyDateShortcut(s)}
                                    className="w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-gray-500 hover:text-blue-600"
                                    title={s === 'T' ? 'Today' : s === 'Y' ? 'Yesterday' : s === 'W' ? 'This Week' : 'Last Week'}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono shrink-0">From</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-sm focus:outline-none text-gray-700 w-full font-medium"
                                />
                            </div>
                            <div className="h-px sm:w-px sm:h-4 bg-gray-100" />
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono shrink-0">To</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent text-sm focus:outline-none text-gray-700 w-full font-medium"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(""); setEndDate(""); }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <div className="relative group flex-1">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Client..."
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
                            />
                        </div>
                        <div className="relative group flex-1">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Job Title..."
                                value={jobSearch}
                                onChange={(e) => setJobSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Filter Candidate Counts By Date toggle */}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setFilterByStatusDate(prev => !prev)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${filterByStatusDate
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                }`}
                        >
                            {filterByStatusDate
                                ? <ToggleRight size={16} />
                                : <ToggleLeft size={16} />}
                            Filter Candidate Counts By Date
                        </button>
                        <span className="text-[10px] text-gray-400 font-medium">
                            {filterByStatusDate
                                ? 'Counting candidates by when their status was updated in the selected date range'
                                : 'Counting all candidates regardless of status date (filtered by upload date only)'}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    <div className="min-w-[1200px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 text-gray-500 font-bold border-y border-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-6 relative uppercase tracking-widest text-[10px] font-mono">
                                        <div className="flex items-center justify-between">
                                            <span>Date Created</span>
                                            <button
                                                onClick={() => { setOpenFilter(openFilter === 'date' ? null : 'date'); setFilterSearch(""); }}
                                                className={`p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all ${selectedFilters.date.length > 0 ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-400'}`}
                                            >
                                                <Filter size={14} fill={selectedFilters.date.length > 0 ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <FilterDropdown
                                            column="date"
                                            options={Array.from(new Set(jobs.filter(j => isJobAssigned(j)).map(j => j.createdAt ? formatDate(j.createdAt) : "N/A"))).sort()}
                                        />
                                    </th>
                                    <th className="py-4 px-6 relative uppercase tracking-widest text-[10px] font-mono">
                                        <div className="flex items-center justify-between">
                                            <span>Job Title</span>
                                            <button
                                                onClick={() => { setOpenFilter(openFilter === 'job' ? null : 'job'); setFilterSearch(""); }}
                                                className={`p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all ${selectedFilters.job.length > 0 ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-400'}`}
                                            >
                                                <Filter size={14} fill={selectedFilters.job.length > 0 ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <FilterDropdown
                                            column="job"
                                            options={Array.from(new Set(jobs.filter(j => isJobAssigned(j)).map(j => j.title))).sort()}
                                        />
                                    </th>
                                    <th className="py-4 px-6 relative uppercase tracking-widest text-[10px] font-mono">
                                        <div className="flex items-center justify-between">
                                            <span>Client Name</span>
                                            <button
                                                onClick={() => { setOpenFilter(openFilter === 'client' ? null : 'client'); setFilterSearch(""); }}
                                                className={`p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all ${selectedFilters.client.length > 0 ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-400'}`}
                                            >
                                                <Filter size={14} fill={selectedFilters.client.length > 0 ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <FilterDropdown
                                            column="client"
                                            options={Array.from(new Set(jobs.filter(j => isJobAssigned(j)).map(j => {
                                                const jClientId = typeof j.clientId === 'object' ? (j.clientId as any)?._id : j.clientId;
                                                return clients.find(c => c._id === jClientId)?.companyName || "Unknown"
                                            }))).sort()}
                                        />
                                    </th>
                                    <th className="py-4 px-4 text-center relative uppercase tracking-widest text-[10px] font-mono">
                                        <div className="flex items-center justify-center gap-2">
                                            <span>Total Uploads</span>
                                            <button
                                                onClick={() => { setOpenFilter(openFilter === 'total' ? null : 'total'); setFilterSearch(""); }}
                                                className={`p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all ${selectedFilters.total.length > 0 ? 'text-blue-600 bg-white shadow-sm' : 'text-gray-400'}`}
                                            >
                                                <Filter size={14} fill={selectedFilters.total.length > 0 ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <FilterDropdown
                                            column="total"
                                            options={Array.from(new Set(jobs.filter(j => isJobAssigned(j)).map(j => {
                                                const relevantCandidates = candidates.filter(c => {
                                                    const cJobId = typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
                                                    return cJobId === j._id;
                                                });
                                                return relevantCandidates.length.toString();
                                            }))).sort((a, b) => parseInt(a) - parseInt(b))}
                                        />
                                    </th>
                                    <th className="py-4 px-4 text-center text-blue-600 uppercase tracking-widest text-[10px] font-mono">New</th>
                                    <th className="py-4 px-4 text-center text-orange-600 uppercase tracking-widest text-[10px] font-mono">Shortlisted</th>
                                    <th className="py-4 px-4 text-center text-gray-400 uppercase tracking-widest text-[10px] font-mono whitespace-nowrap">Drop (M)</th>
                                    <th className="py-4 px-4 text-center text-red-400 uppercase tracking-widest text-[10px] font-mono whitespace-nowrap">Rej (M)</th>
                                    <th className="py-4 px-4 text-center text-purple-600 uppercase tracking-widest text-[10px] font-mono whitespace-nowrap">Interview</th>
                                    <th className="py-4 px-4 text-center text-teal-600 uppercase tracking-widest text-[10px] font-mono">Selected</th>
                                    <th className="py-4 px-4 text-center text-emerald-600 uppercase tracking-widest text-[10px] font-mono">Joined</th>
                                    <th className="py-4 px-4 text-center text-amber-600 uppercase tracking-widest text-[10px] font-mono whitespace-nowrap">Hold</th>
                                    <th className="py-4 px-4 text-center text-slate-600 uppercase tracking-widest text-[10px] font-mono whitespace-nowrap">Drop (C)</th>
                                    <th className="py-4 px-4 text-center text-red-700 uppercase tracking-widest text-[10px] font-mono whitespace-nowrap">Rej (C)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(() => {
                                    const reportRows: any[] = [];

                                    // Only show OPEN jobs
                                    const relevantJobs = jobs.filter(job => {
                                        if (job.status !== 'Open') return false;
                                        const isAssigned = isJobAssigned(job);
                                        const hasUploads = candidates.some(c => {
                                            const cJobId = typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
                                            return cJobId === job._id;
                                        });
                                        return isAssigned || hasUploads;
                                    });

                                    relevantJobs.forEach(job => {
                                        const jobDate = job.createdAt ? formatDate(job.createdAt) : "N/A";
                                        // Total uploads row — always filtered by upload date (createdAt)
                                        const jobCandidates = candidates.filter(c => {
                                            const cJobId = typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
                                            return cJobId === job._id && (c.createdAt ? isWithinDateRange(c.createdAt) : true);
                                        });

                                        if (jobCandidates.length === 0 && !isJobAssigned(job)) {
                                            return;
                                        }

                                        const jClientId = typeof job.clientId === 'object' ? (job.clientId as any)?._id : job.clientId;
                                        const client = clients.find(c => c._id === jClientId);
                                        const clientName = client?.companyName || "Unknown";

                                        const matchesDate = selectedFilters.date.length > 0 ? selectedFilters.date.includes(jobDate) : true;
                                        const matchesClient = selectedFilters.client.length > 0 ? selectedFilters.client.includes(clientName) : true;
                                        const matchesJob = selectedFilters.job.length > 0 ? selectedFilters.job.includes(job.title) : true;
                                        const matchesTotal = selectedFilters.total.length > 0 ? selectedFilters.total.includes(jobCandidates.length.toString()) : true;

                                        const matchesClientSearch = clientSearch ? clientName.toLowerCase().includes(clientSearch.toLowerCase()) : true;
                                        const matchesJobSearch = jobSearch ? job.title.toLowerCase().includes(jobSearch.toLowerCase()) : true;

                                        if (matchesDate && matchesClient && matchesJob && matchesTotal && matchesClientSearch && matchesJobSearch) {
                                            reportRows.push({
                                                job,
                                                clientName,
                                                jobDate,
                                                jobCandidates
                                            });
                                        }
                                    });

                                    if (reportRows.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={10} className="py-8 text-center text-slate-500">
                                                    No performance data found for the selected criteria.
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const rows = reportRows.map((row, i) => (
                                        <tr key={`${row.job._id}-${i}`} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 text-slate-600">{row.jobDate}</td>
                                            <td className="py-4 px-6 text-slate-700 font-medium">{row.job.title}</td>
                                            <td className="py-4 px-6 text-slate-600">{row.clientName}</td>
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
                                            {[
                                                { key: "New", statuses: ["New", "Screening", "Under Review"] },
                                                { key: "Shortlisted", statuses: ["Shortlisted", "Screen", "Screened"] },
                                                { key: "Drop (M)", special: true, status: "Dropped", type: "Manager" },
                                                { key: "Rej (M)", special: true, status: "Rejected", type: "Manager" },
                                                { key: "Interviewed", statuses: ["Interview", "Interviewed"] },
                                                { key: "Selected", statuses: ["Selected", "Offer"] },
                                                { key: "Joined", statuses: ["Joined", "Hired"] },
                                                { key: "Hold", statuses: ["Hold"] },
                                                { key: "Drop (C)", special: true, status: "Dropped", type: "Client" },
                                                { key: "Rej (C)", special: true, status: "Rejected", type: "Client" },
                                            ].map(statusGroup => {
                                                // All candidates for this job (not just date-filtered) for status matching
                                                const allJobCandidates = candidates.filter((c: any) => {
                                                    const cJobId = typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
                                                    return cJobId === row.job._id;
                                                });

                                                let statusCandidates: any[] = [];
                                                if ('special' in statusGroup) {
                                                    statusCandidates = getSpecialStatusCandidates(allJobCandidates, statusGroup.status as string, statusGroup.type as any);
                                                } else {
                                                    statusCandidates = allJobCandidates.filter((c: any) => {
                                                        if (!statusGroup.statuses?.includes(c.status)) return false;
                                                        if (!filterByStatusDate) return true;
                                                        // Filter by when this status was actually set
                                                        const ts =
                                                            c.status === 'Joined' ? getStatusTimestamp(c, 'Joined', c.joiningDate)
                                                                : c.status === 'Selected' || c.status === 'Offer' ? getStatusTimestamp(c, 'Selected', c.selectionDate)
                                                                    : getStatusTimestamp(c, c.status);
                                                        return isWithinDateRange(ts || c.createdAt);
                                                    });
                                                }
                                                const count = statusCandidates.length;
                                                return (
                                                    <td key={statusGroup.key} className="py-4 px-4 text-center">
                                                        <button
                                                            disabled={count === 0}
                                                            onClick={() => openCandidatePopup(row.job.title, row.clientName, statusGroup.key, statusCandidates)}
                                                            className={`px-2 py-0.5 rounded-full text-xs font-bold min-w-[32px] transition-all ${count > 0
                                                                ? `${getStatusColor(statusGroup.key === 'Drop (M)' || statusGroup.key === 'Drop (C)' ? 'Dropped' : statusGroup.key === 'Rej (M)' || statusGroup.key === 'Rej (C)' ? 'Rejected' : statusGroup.key)} hover:scale-110`
                                                                : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                                                        >
                                                            {count}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ));

                                    // Calculate totals for the footer row
                                    const totals = {
                                        totalUploads: reportRows.reduce((acc, row) => acc + row.jobCandidates.length, 0),
                                        New: 0,
                                        Shortlisted: 0,
                                        'Drop (M)': 0,
                                        'Rej (M)': 0,
                                        Interviewed: 0,
                                        Selected: 0,
                                        Joined: 0,
                                        Hold: 0,
                                        'Drop (C)': 0,
                                        'Rej (C)': 0,
                                    };

                                    const statusGroups = [
                                        { key: "New", statuses: ["New", "Screening", "Under Review"] },
                                        { key: "Shortlisted", statuses: ["Shortlisted", "Screen", "Screened"] },
                                        { key: "Drop (M)", special: true, status: "Dropped", type: "Manager" },
                                        { key: "Rej (M)", special: true, status: "Rejected", type: "Manager" },
                                        { key: "Interviewed", statuses: ["Interview", "Interviewed"] },
                                        { key: "Selected", statuses: ["Selected", "Offer"] },
                                        { key: "Joined", statuses: ["Joined", "Hired"] },
                                        { key: "Hold", statuses: ["Hold"] },
                                        { key: "Drop (C)", special: true, status: "Dropped", type: "Client" },
                                        { key: "Rej (C)", special: true, status: "Rejected", type: "Client" },
                                    ];

                                    reportRows.forEach(row => {
                                        const jobCandidates = candidates.filter((c: any) => {
                                            const cJobId = typeof c.jobId === 'object' ? (c.jobId as any)?._id : c.jobId;
                                            return cJobId === row.job._id;
                                        });

                                        statusGroups.forEach(group => {
                                            let count = 0;
                                            if ('special' in group) {
                                                count = getSpecialStatusCandidates(jobCandidates, group.status as string, group.type as any).length;
                                            } else {
                                                count = jobCandidates.filter((c: any) => {
                                                    if (!group.statuses?.includes(c.status)) return false;
                                                    if (!filterByStatusDate) return true;
                                                    const ts =
                                                        c.status === 'Joined' ? getStatusTimestamp(c, 'Joined', c.joiningDate)
                                                            : c.status === 'Selected' || c.status === 'Offer' ? getStatusTimestamp(c, 'Selected', c.selectionDate)
                                                                : getStatusTimestamp(c, c.status);
                                                    return isWithinDateRange(ts || c.createdAt);
                                                }).length;
                                            }
                                            (totals as any)[group.key] += count;
                                        });
                                    });

                                    return (
                                        <>
                                            {rows}
                                            {/* Total Row */}
                                            <tr className="bg-slate-50 font-bold border-t border-slate-200 sticky bottom-0 z-10 shadow-sm">
                                                <td colSpan={3} className="py-4 px-6 text-right text-slate-500 uppercase tracking-widest text-[10px]">Total</td>
                                                <td className="py-4 px-4 text-center text-slate-800 text-xs">{totals.totalUploads}</td>
                                                {statusGroups.map(group => (
                                                    <td key={group.key} className="py-4 px-4 text-center text-slate-800 text-xs">
                                                        {(totals as any)[group.key]}
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
            </div>

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
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                                            <tr>
                                                <th className="py-3 px-4">Name</th>
                                                <th className="py-3 px-4">Phone</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4 text-center">Upload Date</th>
                                                <th className="py-3 px-4 text-center">Status Updated On</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {candidatePopupData.candidates.length > 0 ? (
                                                candidatePopupData.candidates.map((c: any, i: number) => {
                                                    const dynamicKeys = Object.keys(c.dynamicFields || {});
                                                    // Try to find name/phone fields smartly
                                                    const nameKey = dynamicKeys.find(k => k.toLowerCase().includes("name"))
                                                        || dynamicKeys.find(k => k.toLowerCase() === "candidate name")
                                                        || "name";

                                                    const phoneKey = dynamicKeys.find(k => k.toLowerCase().includes("phone"))
                                                        || dynamicKeys.find(k => k.toLowerCase().includes("mobile"))
                                                        || "phone";

                                                    const name = c.dynamicFields?.[nameKey] || c.dynamicFields?.name || "N/A";
                                                    const phone = c.dynamicFields?.[phoneKey] || c.dynamicFields?.phone || "N/A";

                                                    return (
                                                        <tr key={i} className="hover:bg-slate-50">
                                                            <td className="py-3 px-4 font-medium text-slate-800">{name}</td>
                                                            <td className="py-3 px-4 text-slate-600">{phone}</td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(c.status)}`}>
                                                                    {c.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-600 text-center">{formatDate(c.createdAt)}</td>
                                                            <td className="py-3 px-4 text-slate-600 text-center">
                                                                {(() => {
                                                                    const ts =
                                                                        c.status === 'Joined' ? getStatusTimestamp(c, 'Joined', c.joiningDate)
                                                                            : c.status === 'Selected' || c.status === 'Offer' ? getStatusTimestamp(c, 'Selected', c.selectionDate)
                                                                                : getStatusTimestamp(c, c.status);
                                                                    return ts ? formatDate(ts) : '—';
                                                                })()}
                                                            </td>
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
            </AnimatePresence>
        </>
    );
}
