import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useJobContext, Job } from "../../context/DataProvider";
import { useAuth } from "../../context/AuthProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import JobOpeningCard from "./JobOpeningCard";
import { Search, Filter, Briefcase } from "lucide-react";



// Re-export JobOpening for compatibility if needed by other components
export type JobOpening = Job;

export default function UploadCV() {
  const { assignedJobs, fetchAssignedJobs } = useJobContext();
  const { candidates, fetchCandidatesByUser } = useCandidateContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (user?._id) {
      fetchAssignedJobs(user._id);
      fetchCandidatesByUser(user._id);
    }
  }, [user]);

  const getCandidateCount = (jobId: string) => {
    if (!candidates) return 0;
    return candidates.filter(
      (c) => (typeof c.jobId === 'object' ? c.jobId._id : c.jobId) === jobId &&
        (typeof c.createdBy === 'object' ? c.createdBy._id : c.createdBy) === user?._id
    ).length;
  };

  const filteredJobs = assignedJobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePreview = (job: Job) => {
    navigate(`/Recruiter/job-preview/${job._id}`);
  };

  const handleUpload = (job: Job) => {
    navigate(`/Recruiter/upload-candidate/${job._id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">My Jobs</h1>
        <p className="text-slate-600">
          Manage your job openings and upload candidates directly.
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
            {assignedJobs.length === 0 ? "Loading jobs..." : "No jobs found"}
          </h3>
          <p className="text-slate-500">
            {assignedJobs.length === 0 ? "Please wait while we fetch your jobs" : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobOpeningCard
              key={job._id}
              job={job}
              onPreview={handlePreview}
              onUploadCandidate={handleUpload}
              candidateCount={getCandidateCount(job._id)}
              showUploadButton={true}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {/* Removed UploadCandidateModal */}
      </AnimatePresence>


    </motion.div>
  );
}
