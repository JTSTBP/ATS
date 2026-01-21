import { useEffect, useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle, XCircle, UserPlus, ClipboardCheck, Clock } from 'lucide-react';
import { useAuth } from '../../../context/AuthProvider';
import { useUserContext } from '../../../context/UserProvider';
import { useCandidateContext } from '../../../context/CandidatesProvider';
import { useJobContext } from '../../../context/DataProvider';

type ReportStats = {
    totalCandidates: number;
    new: number;
    shortlisted: number;
    interviewed: number;
    selected: number;
    joined: number;
    rejected: number;
};

type JobPerformance = {
    id: string;
    title: string;
    totalCandidates: number;
    activePipeline: number;
    hired: number;
    status: string;
};

export const MentorReports = () => {
    const { user } = useAuth();
    const { users } = useUserContext();
    const { candidates, fetchallCandidates } = useCandidateContext();
    const { jobs, fetchJobs } = useJobContext();

    const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const result = [];
        for (let i = 0; i < 5; i++) {
            result.push(currentYear - i);
        }
        return result;
    }, []);

    const [stats, setStats] = useState<ReportStats>({
        totalCandidates: 0,
        new: 0,
        shortlisted: 0,
        interviewed: 0,
        selected: 0,
        joined: 0,
        rejected: 0,
    });

    const [jobPerformance, setJobPerformance] = useState<JobPerformance[]>([]);

    useEffect(() => {
        fetchJobs();
        fetchallCandidates();
    }, []);

    useEffect(() => {
        if (!user || !jobs || !candidates || !users) return;

        // --- 1. Filter Logic (Same as Dashboard) ---
        const isWithinSelectedMonth = (dateString: string) => {
            if (selectedMonth === null || selectedYear === null) return true;
            const date = new Date(dateString);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        };

        const directReportees = users.filter((u: any) => u?.reporter?._id === user._id);
        let allReporteeIds = directReportees.map((u: any) => u._id);

        if (user.designation === "Manager") {
            directReportees.forEach((mentor: any) => {
                const mentorReportees = users.filter(
                    (u: any) => u?.reporter?._id === mentor._id
                );
                allReporteeIds = [
                    ...allReporteeIds,
                    ...mentorReportees.map((u: any) => u._id),
                ];
            });
        }

        const filteredJobs = jobs.filter((job: any) => {
            const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
            const isCreatorAllowed = creatorId === user._id || allReporteeIds.includes(creatorId);
            return isCreatorAllowed && isWithinSelectedMonth(job.createdAt);
        });

        const filteredCandidates = candidates.filter((c: any) => {
            const creatorId = c.createdBy?._id || c.createdBy;
            const isCreatorAllowed = creatorId === user._id || allReporteeIds.includes(creatorId);
            return isCreatorAllowed && isWithinSelectedMonth(c.createdAt);
        });

        // --- 2. Calculate Overall Stats ---
        setStats({
            totalCandidates: filteredCandidates.length,
            new: filteredCandidates.filter((c: any) => c.status === 'New').length,
            shortlisted: filteredCandidates.filter((c: any) => c.status === 'Shortlisted').length,
            interviewed: filteredCandidates.filter((c: any) => c.status === 'Interviewed').length,
            selected: filteredCandidates.filter((c: any) => c.status === 'Selected').length,
            joined: filteredCandidates.filter((c: any) => c.status === 'Joined').length,
            rejected: filteredCandidates.filter((c: any) => c.status === 'Rejected').length,
        });

        // --- 3. Calculate Job Performance ---
        const performanceData = filteredJobs.map((job: any) => {
            const jobCandidates = filteredCandidates.filter((c: any) =>
                (typeof c.jobId === 'object' ? c.jobId?._id : c.jobId) === job._id
            );

            return {
                id: job._id,
                title: job.title,
                totalCandidates: jobCandidates.length,
                activePipeline: jobCandidates.filter((c: any) => ['New', 'Shortlisted', 'Interviewed'].includes(c.status)).length,
                hired: jobCandidates.filter((c: any) => ['Selected', 'Joined'].includes(c.status)).length,
                status: job.status
            };
        });

        setJobPerformance(performanceData);

    }, [user, jobs, candidates, users, selectedMonth, selectedYear]);

    const funnelData = [
        { label: 'New', value: stats.new, color: 'bg-yellow-400', width: '100%' },
        { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-blue-400', width: '80%' },
        { label: 'Interviewed', value: stats.interviewed, color: 'bg-cyan-400', width: '60%' },
        { label: 'Selected', value: stats.selected, color: 'bg-purple-400', width: '40%' },
        { label: 'Joined', value: stats.joined, color: 'bg-green-400', width: '30%' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Reports & Analytics</h2>
                    <p className="text-gray-600">Detailed insights into recruitment performance</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1">Year</label>
                        <select
                            value={selectedYear === null ? "" : selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value === "" ? null : Number(e.target.value))}
                            className="bg-gray-50 border-none text-gray-700 text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
                        >
                            <option value="">All</option>
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1">Month</label>
                        <select
                            value={selectedMonth === null ? "" : selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value === "" ? null : Number(e.target.value))}
                            className="bg-gray-50 border-none text-gray-700 text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
                        >
                            <option value="">All</option>
                            {months.map((month, index) => (
                                <option key={month} value={index}>{month}</option>
                            ))}
                        </select>
                    </div>
                    {(selectedMonth !== null || selectedYear !== null) && (
                        <button
                            onClick={() => {
                                setSelectedMonth(null);
                                setSelectedYear(null);
                            }}
                            className="mt-5 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <UserPlus className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">New</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.new}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-50 p-3 rounded-lg">
                            <ClipboardCheck className="w-6 h-6 text-orange-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Screen</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.shortlisted}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <Clock className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Interviewed</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.interviewed}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-50 p-3 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Selected</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.selected}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-emerald-50 p-3 rounded-lg">
                            <Users className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Joined</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.joined}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Total Hired</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.selected + stats.joined}</h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-red-100 p-3 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Rejected</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.rejected}</h3>
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
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="flex items-center space-x-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-gray-600" />
                        <h3 className="text-xl font-bold text-gray-800">Job Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3">Job Title</th>
                                    <th className="px-4 py-3 text-center">Candidates</th>
                                    <th className="px-4 py-3 text-center">Active</th>
                                    <th className="px-4 py-3 text-center">Hired</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobPerformance.length > 0 ? (
                                    jobPerformance.map((job) => (
                                        <tr key={job.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{job.title}</td>
                                            <td className="px-4 py-3 text-center">{job.totalCandidates}</td>
                                            <td className="px-4 py-3 text-center text-blue-600 font-medium">{job.activePipeline}</td>
                                            <td className="px-4 py-3 text-center text-green-600 font-medium">{job.hired}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs ${job.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
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
