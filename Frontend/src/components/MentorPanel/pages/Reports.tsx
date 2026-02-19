import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle, XCircle, UserPlus, ClipboardCheck, Clock } from 'lucide-react';
import { useAuth } from '../../../context/AuthProvider';
import { useUserContext } from '../../../context/UserProvider';
import { useCandidateContext } from '../../../context/CandidatesProvider';
import { useJobContext } from '../../../context/DataProvider';
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
            return creatorId === user._id || allReporteeIds.includes(creatorId);
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
            filterByRange(getStatusTimestamp(c, (c.status as string) || "New"), startDate, endDate) && isOpenJobCandidate(c)
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
                ['Shortlisted', 'Screen', 'Screened'].includes(c.status) &&
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

        // --- 4. Calculate Job Performance (within range) ---
        const performanceData = openJobs.map((job: any) => {
            const jobCandidates = scopedCandidates.filter((c: any) =>
                (typeof c.jobId === 'object' ? c.jobId?._id : c.jobId) === job._id
            );

            return {
                id: job._id,
                title: job.title,
                totalCandidates: jobCandidates.filter(c => filterByRange(c.createdAt || getStatusTimestamp(c, jobCandidates.map(jc => jc.status).filter((s): s is string => !!s)), startDate, endDate)).length,
                activePipeline: jobCandidates.filter((c: any) => ['New', 'Shortlisted', 'Interviewed'].includes(c.status)).length,
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
        </div>
    );
};
