import { useEffect, useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle, UserPlus, ClipboardCheck, Clock, Search, X, Filter } from 'lucide-react';
import { useAuth } from '../../../context/AuthProvider';
import { useUserContext } from '../../../context/UserProvider';
import { useCandidateContext } from '../../../context/CandidatesProvider';
import { useJobContext } from '../../../context/DataProvider';
import { useClientsContext } from '../../../context/ClientsProvider';
import { formatDate } from '../../../utils/dateUtils';
import { getStatusTimestamp } from '../../../utils/statusUtils';

type ReportStats = {
    totalCandidates: number;
    new: number;
    shortlisted: number;
    interviewed: number;
    selected: number;
    joined: number;
};

type JobPerformance = {
    id: string;
    title: string;
    totalCandidates: number;
    activePipeline: number;
    status: string;
};

export const MentorReports = () => {
    const { user } = useAuth();
    const { users } = useUserContext();
    const { candidates, fetchallCandidates } = useCandidateContext();
    const { jobs, fetchJobs } = useJobContext();
    const { clients, fetchClients } = useClientsContext();

    // --- Search & Filter States for Recruiter Performance ---
    const [recruiterSearch, setRecruiterSearch] = useState("");
    const [clientSearch, setClientSearch] = useState("");
    const [jobSearch, setJobSearch] = useState("");
    const [candidatePopupData, setCandidatePopupData] = useState<{ title: string, clientName: string, candidates: any[] } | null>(null);

    // --- 1. Date Range Filter Setup ---
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });

    const filterByRange = (dateString: string | null | undefined, start: string, end: string) => {
        if (!start && !end) return true; // Show overall data if no range
        if (!dateString) return false;
        const date = new Date(dateString);
        date.setHours(0, 0, 0, 0);
        const s = start ? new Date(start) : new Date(0);
        s.setHours(0, 0, 0, 0);
        const e = end ? new Date(end) : new Date(8640000000000000);
        e.setHours(23, 59, 59, 999);
        return date >= s && date <= e;
    };

    const [stats, setStats] = useState<ReportStats>({
        totalCandidates: 0,
        new: 0,
        shortlisted: 0,
        interviewed: 0,
        selected: 0,
        joined: 0,
    });

    const [jobPerformance, setJobPerformance] = useState<JobPerformance[]>([]);

    useEffect(() => {
        fetchJobs();
        fetchallCandidates();
        fetchClients();
    }, []);

    useEffect(() => {
        if (!user || !jobs || !candidates || !users) return;

        // --- 2. Filter Logic (Consistant with Dashboard) ---
        const directReportees = users.filter((u: any) => (u?.reporter?._id || u?.reporter) === user._id);
        let allReporteeIds = directReportees.map((u: any) => u._id);

        // Get 2nd level reportees
        directReportees.forEach((reportee: any) => {
            const childReportees = users.filter((u: any) => (u?.reporter?._id || u?.reporter) === reportee._id);
            allReporteeIds = [...allReporteeIds, ...childReportees.map((u: any) => u._id)];
        });

        const scopedJobs = jobs.filter((job: any) => {
            const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
            const assignedMentors = Array.isArray(job.assignedMentors)
                ? job.assignedMentors.map((m: any) => (typeof m === 'object' ? m._id : m))
                : [];
            const assignedRecruiters = Array.isArray(job.assignedRecruiters)
                ? job.assignedRecruiters.map((r: any) => (typeof r === 'object' ? r._id : r))
                : job.assignedRecruiter
                    ? [typeof job.assignedRecruiter === 'object' ? job.assignedRecruiter._id : job.assignedRecruiter]
                    : [];

            const isCreatorOrReportee = creatorId === user._id || allReporteeIds.includes(creatorId);
            const isAssignedMentor = assignedMentors.includes(user._id);
            const isAssignedRecruiter = assignedRecruiters.some((id: string) => id === user._id || allReporteeIds.includes(id));

            return isCreatorOrReportee || isAssignedMentor || isAssignedRecruiter;
        });

        const openJobs = scopedJobs.filter((j: any) => j.status === 'Open');
        const openJobIds = new Set(openJobs.map((job: any) => (job._id || "").toString()));

        const isOpenJobCandidate = (c: any) => {
            const jid = c.jobId?._id || c.jobId;
            return jid && openJobIds.has(String(jid));
        };

        const scopedCandidates = candidates.filter((c: any) => {
            const creatorId = c.createdBy?._id || c.createdBy;
            return creatorId === user._id || allReporteeIds.includes(creatorId);
        });

        // Filter candidates by DATE RANGE + OPEN JOBS (for general stats)
        const candidatesInRange = scopedCandidates.filter(c =>
            filterByRange(getStatusTimestamp(c, (c.status as string) || "New") || null, startDate, endDate) && isOpenJobCandidate(c)
        );

        // --- 3. Calculate Overall Stats ---
        setStats({
            totalCandidates: candidatesInRange.length,
            new: scopedCandidates.filter((c: any) =>
                c.status === 'New' &&
                filterByRange(getStatusTimestamp(c, 'New'), startDate, endDate) &&
                isOpenJobCandidate(c)
            ).length,
            shortlisted: scopedCandidates.filter((c: any) =>
                c.status && ['Shortlisted', 'Screen', 'Screened'].includes(c.status) &&
                filterByRange(getStatusTimestamp(c, ['Shortlisted', 'Screen', 'Screened']), startDate, endDate) &&
                isOpenJobCandidate(c)
            ).length,
            interviewed: scopedCandidates.filter((c: any) =>
                c.status === 'Interviewed' &&
                filterByRange(getStatusTimestamp(c, 'Interviewed'), startDate, endDate) &&
                isOpenJobCandidate(c)
            ).length,
            selected: scopedCandidates.filter((c: any) =>
                c.status === 'Selected' &&
                filterByRange(getStatusTimestamp(c, 'Selected', c.selectionDate), startDate, endDate) &&
                isOpenJobCandidate(c)
            ).length,
            joined: scopedCandidates.filter((c: any) =>
                c.status === 'Joined' &&
                filterByRange(getStatusTimestamp(c, 'Joined', c.joiningDate), startDate, endDate) &&
                isOpenJobCandidate(c)
            ).length,
        });

        // --- 4. Calculate Job Performance (within range, open jobs only) ---
        const performanceData = openJobs.map((job: any) => {
            const jobCandidates = scopedCandidates.filter((c: any) =>
                (typeof c.jobId === 'object' ? c.jobId?._id : c.jobId)?.toString() === job._id?.toString()
            );

            // totalCandidates: count candidates whose CURRENT status was set within the date range
            const totalInRange = jobCandidates.filter((c: any) => {
                const statusTs =
                    c.status === 'Joined'
                        ? getStatusTimestamp(c, 'Joined', c.joiningDate)
                        : c.status === 'Selected'
                            ? getStatusTimestamp(c, 'Selected', c.selectionDate)
                            : getStatusTimestamp(c, c.status);
                return filterByRange(statusTs || c.createdAt, startDate, endDate);
            }).length;

            // activePipeline: New/Shortlisted/Interviewed whose status was set within range
            const activeInRange = jobCandidates.filter((c: any) => {
                if (!['New', 'Shortlisted', 'Screen', 'Screened', 'Interviewed'].includes(c.status)) return false;
                const statusTs = getStatusTimestamp(c, c.status);
                return filterByRange(statusTs || c.createdAt, startDate, endDate);
            }).length;

            return {
                id: job._id,
                title: job.title,
                totalCandidates: totalInRange,
                activePipeline: activeInRange,
                status: job.status
            };
        });

        setJobPerformance(performanceData);

    }, [user, jobs, candidates, users, startDate, endDate]);

    const funnelData = [
        { label: 'New', value: stats.new, color: 'bg-yellow-400', width: '100%' },
        { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-blue-400', width: '80%' },
        { label: 'Interviewed', value: stats.interviewed, color: 'bg-cyan-400', width: '60%' },
        { label: 'Selected', value: stats.selected, color: 'bg-purple-400', width: '40%' },
        { label: 'Joined', value: stats.joined, color: 'bg-green-400', width: '30%' },
    ];

    const recruiterPerformanceReportData = useMemo(() => {
        if (!user || !users || !candidates || !jobs || !clients) {
            return { reportRows: [], totals: { lineupsSubmitted: 0, target: 0, closureCount: 0 } };
        }

        const directReportees = users.filter((u: any) => (u?.reporter?._id || u?.reporter) === user._id);
        let allReporteeIds = directReportees.map((u: any) => u._id);

        directReportees.forEach((reportee: any) => {
            const childReportees = users.filter((u: any) => (u?.reporter?._id || u?.reporter) === reportee._id);
            allReporteeIds = [...allReporteeIds, ...childReportees.map((u: any) => u._id)];
        });

        const scopedCandidates = candidates.filter((c: any) => {
            const creatorId = c.createdBy?._id || c.createdBy;
            return creatorId === user._id || allReporteeIds.includes(creatorId);
        });

        const scopedJobs = jobs.filter((job: any) => {
            const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
            const assignedMentors = Array.isArray(job.assignedMentors)
                ? job.assignedMentors.map((m: any) => (typeof m === 'object' ? m._id : m))
                : [];
            const assignedRecruiters = Array.isArray(job.assignedRecruiters)
                ? job.assignedRecruiters.map((r: any) => (typeof r === 'object' ? r._id : r))
                : job.assignedRecruiter
                    ? [typeof job.assignedRecruiter === 'object' ? job.assignedRecruiter._id : job.assignedRecruiter]
                    : [];

            const isCreatorOrReportee = creatorId === user._id || allReporteeIds.includes(creatorId);
            const isAssignedMentor = assignedMentors.includes(user._id);
            const isAssignedRecruiter = assignedRecruiters.some((id: string) => id === user._id || allReporteeIds.includes(id));

            return isCreatorOrReportee || isAssignedMentor || isAssignedRecruiter;
        });

        const scopedJobIds = new Set(scopedJobs.map((j: any) => (j._id || "").toString()));

        const groups: Record<string, {
            date: string;
            recruiterId: string;
            recruiterName: string;
            clientId: string;
            clientName: string;
            jobId: string;
            position: string;
            candidates: any[];
        }> = {};

        scopedCandidates.forEach((candidate) => {
            if (!candidate.createdAt) return;

            if (!filterByRange(candidate.createdAt, startDate, endDate)) return;

            const jId = typeof candidate.jobId === 'object' ? candidate.jobId?._id : candidate.jobId;
            if (!jId || !scopedJobIds.has(String(jId))) return;

            const job = jobs.find((j: any) => String(j._id) === String(jId));
            if (!job) return;

            const dateStr = formatDate(candidate.createdAt);

            const creatorId = typeof candidate.createdBy === 'object' ? candidate.createdBy?._id : candidate.createdBy;
            if (!creatorId) return;
            const recruiterObj = users.find((u: any) => u._id === creatorId);
            const recruiterName = recruiterObj?.name || "Unknown";

            const position = job.title || "Unknown";

            const jClientId = typeof job.clientId === 'object' ? job.clientId?._id : job.clientId;
            const client = clients.find((c: any) => c._id === jClientId);
            const clientName = client?.companyName || "Unknown";
            const clientId = client?._id || "unknown";

            const key = `${dateStr}|${creatorId}|${jId}`;

            if (!groups[key]) {
                groups[key] = {
                    date: dateStr,
                    recruiterId: creatorId,
                    recruiterName,
                    clientId,
                    clientName,
                    jobId: jId,
                    position,
                    candidates: []
                };
            }
            groups[key].candidates.push(candidate);
        });

        const rows = Object.values(groups).map((group) => {
            const lineupsSubmitted = group.candidates.length;
            const target = 5;

            const closureCandidates = group.candidates.filter(c => c.status === "Selected" || c.status === "Joined");
            const closureCount = closureCandidates.length;

            const recruiterObj = users.find((u: any) => u._id === group.recruiterId);
            const dateOfJoining = recruiterObj?.dateOfJoining ? formatDate(recruiterObj.dateOfJoining) : "-";

            return {
                ...group,
                lineupsSubmitted,
                target,
                closureCount,
                closureCandidates,
                dateOfJoining
            };
        });

        const filteredRows = rows.filter((row) => {
            const matchesRecruiter = recruiterSearch ? row.recruiterName.toLowerCase().includes(recruiterSearch.toLowerCase()) : true;
            const matchesClient = clientSearch ? row.clientName.toLowerCase().includes(clientSearch.toLowerCase()) : true;
            const matchesJob = jobSearch ? row.position.toLowerCase().includes(jobSearch.toLowerCase()) : true;
            return matchesRecruiter && matchesClient && matchesJob;
        });

        const sortedRows = filteredRows.sort((a, b) => {
            return new Date(b.candidates[0].createdAt).getTime() - new Date(a.candidates[0].createdAt).getTime();
        });

        const totals = sortedRows.reduce((acc, row) => {
            acc.lineupsSubmitted += row.lineupsSubmitted;
            acc.closureCount += row.closureCount;
            acc.target += row.target;
            return acc;
        }, { lineupsSubmitted: 0, closureCount: 0, target: 0 });

        return { reportRows: sortedRows, totals };
    }, [candidates, users, jobs, clients, user, startDate, endDate, recruiterSearch, clientSearch, jobSearch]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 leading-tight">Reports & Analytics</h2>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">Detailed insights into recruitment performance</p>
                </div>

                <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                    <div className="flex flex-col min-w-[140px] flex-1 sm:flex-none">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Upload From</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-50 border border-gray-100 text-gray-700 text-sm font-bold rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block w-full p-2.5 transition-all outline-none cursor-pointer"
                        />
                    </div>
                    <div className="flex flex-col min-w-[140px] flex-1 sm:flex-none">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Upload To</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-50 border border-gray-100 text-gray-700 text-sm font-bold rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block w-full p-2.5 transition-all outline-none cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setStartDate("");
                            setEndDate("");
                        }}
                        className="px-4 py-2.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all border border-red-100 h-[42px]"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-blue-50 p-2.5 rounded-xl group-hover:bg-blue-100 transition-colors">
                            <UserPlus className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">New</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">{stats.new}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-orange-50 p-2.5 rounded-xl group-hover:bg-orange-100 transition-colors">
                            <ClipboardCheck className="w-5 h-5 text-orange-500" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Screen</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">{stats.shortlisted}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-purple-50 p-2.5 rounded-xl group-hover:bg-purple-100 transition-colors">
                            <Clock className="w-5 h-5 text-purple-500" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Interview</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">{stats.interviewed}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-green-50 p-2.5 rounded-xl group-hover:bg-green-100 transition-colors">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Select</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">{stats.selected}</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="bg-emerald-50 p-2.5 rounded-xl group-hover:bg-emerald-100 transition-colors">
                            <Users className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Joined</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">{stats.joined}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recruitment Funnel */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <div className="flex items-center space-x-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-gray-600" />
                        <h3 className="text-xl font-bold text-gray-800">Recruitment Funnel</h3>
                    </div>
                    <div className="space-y-4">
                        {funnelData.map((stage) => (
                            <div key={stage.label} className="relative">
                                <div className="flex justify-between items-center mb-1 z-10 relative">
                                    <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                                    <span className="text-sm font-bold text-gray-800">{stage.value}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-r-lg h-8 relative overflow-hidden">
                                    <div
                                        className={`absolute top-0 left-0 h-full ${stage.color} opacity-20`}
                                        style={{ width: stage.width }} // Visual funnel shape
                                    ></div>
                                    <div
                                        className={`absolute top-0 left-0 h-full ${stage.color}`}
                                        style={{ width: `${stats.totalCandidates > 0 ? (stage.value / stats.totalCandidates) * 100 : 0}%` }} // Actual data width
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Job Performance Table */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center space-x-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                        <h3 className="text-xl font-bold text-gray-800">Job Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Job Title</th>
                                    <th className="px-4 py-3 text-center">Candidates</th>
                                    <th className="px-4 py-3 text-center">Active</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium text-gray-600">
                                {jobPerformance.length > 0 ? (
                                    jobPerformance.map((job) => (
                                        <tr key={job.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-4 text-gray-900 font-bold">{job.title}</td>
                                            <td className="px-4 py-4 text-center">{job.totalCandidates}</td>
                                            <td className="px-4 py-4 text-center text-blue-600 font-bold">{job.activePipeline}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${job.status === 'Open' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'
                                                    }`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-gray-400 italic">
                                            No job data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recruiter Performance Report */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Recruiter Performance Report</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono mt-1">Breakdown by Recruiter, Client, and Position</p>
                        </div>
                    </div>

                    {/* Search Filters Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="relative group">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Recruiter..."
                                value={recruiterSearch}
                                onChange={(e) => setRecruiterSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
                            />
                        </div>
                        <div className="relative group">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Client..."
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
                            />
                        </div>
                        <div className="relative group">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Position..."
                                value={jobSearch}
                                onChange={(e) => setJobSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-sm text-left min-w-[900px]">
                        <thead className="bg-gray-50/50 text-gray-500 font-bold border-b border-gray-100">
                            <tr>
                                <th className="py-4 px-6 uppercase tracking-widest text-[10px] font-mono">Date</th>
                                <th className="py-4 px-6 uppercase tracking-widest text-[10px] font-mono">Recruiter Name</th>
                                <th className="py-4 px-6 uppercase tracking-widest text-[10px] font-mono">Client</th>
                                <th className="py-4 px-6 uppercase tracking-widest text-[10px] font-mono">Position</th>
                                <th className="py-4 px-4 text-center uppercase tracking-widest text-[10px] font-mono">Lineups Submitted</th>
                                <th className="py-4 px-4 text-center uppercase tracking-widest text-[10px] font-mono">Target</th>
                                <th className="py-4 px-4 text-center uppercase tracking-widest text-[10px] font-mono">Closure</th>
                                <th className="py-4 px-6 uppercase tracking-widest text-[10px] font-mono">Date of Joining</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                            {recruiterPerformanceReportData.reportRows.length > 0 ? (
                                recruiterPerformanceReportData.reportRows.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 text-xs text-gray-500">{row.date}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                    {row.recruiterName.charAt(0)}
                                                </div>
                                                <span className="text-gray-900 font-bold">{row.recruiterName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-700">{row.clientName}</td>
                                        <td className="py-4 px-6 text-gray-700 font-bold">{row.position}</td>
                                        <td className="py-4 px-4 text-center">
                                            <button
                                                onClick={() => setCandidatePopupData({
                                                    title: `${row.position} - Lineups Submitted`,
                                                    clientName: row.clientName,
                                                    candidates: row.candidates
                                                })}
                                                className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:scale-105 transition-all"
                                            >
                                                {row.lineupsSubmitted}
                                            </button>
                                        </td>
                                        <td className="py-4 px-4 text-center text-gray-500 font-bold">{row.target}</td>
                                        <td className="py-4 px-4 text-center">
                                            <button
                                                disabled={row.closureCount === 0}
                                                onClick={() => setCandidatePopupData({
                                                    title: `${row.position} - Closures`,
                                                    clientName: row.clientName,
                                                    candidates: row.closureCandidates
                                                })}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border min-w-[32px] transition-all ${row.closureCount > 0
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:scale-105 cursor-pointer"
                                                    : "bg-gray-50 text-gray-300 border-gray-100 cursor-default"}`}
                                            >
                                                {row.closureCount}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-xs text-gray-500">{row.dateOfJoining}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-400 italic">
                                        No performance data found for the selected criteria.
                                    </td>
                                </tr>
                            )}

                            {/* Total Row */}
                            {recruiterPerformanceReportData.reportRows.length > 0 && (
                                <tr className="bg-gray-50 font-bold border-t border-gray-200 sticky bottom-0 z-10 shadow-sm">
                                    <td colSpan={4} className="py-4 px-6 text-right text-gray-500 uppercase tracking-widest text-[10px]">Total</td>
                                    <td className="py-4 px-4 text-center text-blue-600 text-xs font-bold">
                                        {recruiterPerformanceReportData.totals.lineupsSubmitted}
                                    </td>
                                    <td className="py-4 px-4 text-center text-gray-700 text-xs font-bold">
                                        {recruiterPerformanceReportData.totals.target}
                                    </td>
                                    <td className="py-4 px-4 text-center text-emerald-600 text-xs font-bold">
                                        {recruiterPerformanceReportData.totals.closureCount}
                                    </td>
                                    <td className="py-4 px-6"></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Candidate Details Popup Modal */}
            {candidatePopupData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden border border-gray-100">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{candidatePopupData.title}</h3>
                                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">Client: {candidatePopupData.clientName}</p>
                            </div>
                            <button
                                onClick={() => setCandidatePopupData(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                                    <tr>
                                        <th className="py-3 px-4">Candidate Name</th>
                                        <th className="py-3 px-4">Contact</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-center">Joining Date</th>
                                        <th className="py-3 px-4 text-center">Selection Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                                    {candidatePopupData.candidates.length > 0 ? (
                                        candidatePopupData.candidates.map((candidate: any, idx: number) => {
                                            const name = candidate.dynamicFields?.candidateName || candidate.name || "N/A";
                                            const email = candidate.dynamicFields?.Email || candidate.email || "N/A";
                                            const phone = candidate.dynamicFields?.Phone || candidate.phone || "N/A";
                                            return (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-4 font-bold text-gray-800">{name}</td>
                                                    <td className="py-4 px-4 text-xs">
                                                        <div>{email}</div>
                                                        <div>{phone}</div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            candidate.status === 'Selected' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                            candidate.status === 'Joined' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                            candidate.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                            'bg-blue-50 text-blue-700 border border-blue-100'
                                                        }`}>
                                                            {candidate.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center text-xs text-gray-500">{candidate.joiningDate ? formatDate(candidate.joiningDate) : "-"}</td>
                                                    <td className="py-4 px-4 text-center text-xs text-gray-500">{candidate.selectionDate ? formatDate(candidate.selectionDate) : "-"}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-gray-400 italic">No candidates found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <button
                                onClick={() => setCandidatePopupData(null)}
                                className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold transition shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
