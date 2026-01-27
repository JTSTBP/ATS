import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useJobContext, Job } from "../../context/DataProvider";
import JobOpeningCard from "./JobOpeningCard";
import { Search, Filter, Briefcase } from "lucide-react";

export default function JobPreviewPage() {
    const { jobs, fetchJobs } = useJobContext();
    const navigate = useNavigate();
    // const [selectedJobForPreview, setSelectedJobForPreview] = useState<Job | null>(null); // Removed
    const [searchTerm, setSearchTerm] = useState("");
    const [clientSearch, setClientSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    useEffect(() => {
        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter((job) => {
        const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.department?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClient = !clientSearch || (
            typeof job.clientId === 'object' &&
            job.clientId?.companyName?.toLowerCase().includes(clientSearch.toLowerCase())
        );
        const matchesStatus = statusFilter === "All" || job.status === statusFilter;
        return matchesSearch && matchesClient && matchesStatus;
    });

    const handlePreview = (job: Job) => {
        navigate(`/Recruiter/job-preview/${job._id}`);
    };

    // No upload handler needed for this page

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Preview</h1>
                <p className="text-slate-600">
                    Review job details and requirements.
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search jobs by title or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by client name..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white"
                    >
                        <option value="All">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                </div>
            </div>

            {/* Job Grid */}
            {filteredJobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-1">
                        {jobs.length === 0 ? "Loading jobs..." : "No jobs found"}
                    </h3>
                    <p className="text-slate-500">
                        {jobs.length === 0 ? "Please wait while we fetch your jobs" : "Try adjusting your search or filters."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <JobOpeningCard
                            key={job._id}
                            job={job}
                            onPreview={handlePreview}
                            onUploadCandidate={() => { }}
                            candidateCount={0}
                            showUploadButton={false}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {/* Removed JobPreviewModal */}
            </AnimatePresence>
        </motion.div>
    );
}
