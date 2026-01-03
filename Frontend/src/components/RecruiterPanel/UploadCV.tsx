import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useJobContext, Job } from "../../context/DataProvider";
import { useAuth } from "../../context/AuthProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import JobOpeningCard from "./JobOpeningCard";
import { Search, Filter, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";

// Re-export JobOpening for compatibility if needed by other components
export type JobOpening = Job;

export default function UploadCV() {
  const {
    paginatedJobs,
    fetchPaginatedAssignedJobs,
    pagination,
    loading: jobsLoading
  } = useJobContext();
  const { candidates, fetchCandidatesByUser } = useCandidateContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (user?._id) {
      // Fetch Candidates (Keep this for candidate counts)
      // Note: If candidate count is huge, this is inefficient, but out of scope to fix now.
      fetchCandidatesByUser(user._id);

      // Fetch Paginated Jobs
      fetchPaginatedAssignedJobs(
        user._id,
        1,
        10, // Limit
        {
          search: debouncedSearch,
          status: statusFilter
        }
      );
    }
  }, [user, debouncedSearch, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (user?._id && newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPaginatedAssignedJobs(
        user._id,
        newPage,
        10,
        {
          search: debouncedSearch,
          status: statusFilter
        }
      );
    }
  };

  const getCandidateCount = (jobId: string) => {
    if (!candidates) return 0;
    return candidates.filter(
      (c) => {
        const cJobId = c.jobId && typeof c.jobId === 'object' ? c.jobId._id : c.jobId;
        const cCreatedBy = c.createdBy && typeof c.createdBy === 'object' ? c.createdBy._id : c.createdBy;
        return cJobId === jobId && cCreatedBy === user?._id;
      }
    ).length;
  };

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
      {paginatedJobs.length === 0 && !jobsLoading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-1">
            No jobs found
          </h3>
          <p className="text-slate-500">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedJobs.map((job) => (
              <JobOpeningCard
                key={job._id}
                job={job}
                onPreview={handlePreview}
                onUploadCandidate={handleUpload}
                candidateCount={getCandidateCount(job._id || "")}
                showUploadButton={true}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalJobs > 0 && (
            <div className="flex items-center justify-between p-4 mt-6 border-t border-slate-200 bg-white rounded-xl">
              <div className="text-sm text-slate-500">
                Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalJobs)} of {pagination.totalJobs} jobs
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition
                    ${pagination.currentPage === 1
                      ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
                    }
                    `}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition
                            ${pagination.currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                          }
                        `}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition
                    ${pagination.currentPage === pagination.totalPages
                      ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
                    }
                    `}
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {/* Removed UploadCandidateModal */}
      </AnimatePresence>


    </motion.div>
  );
}
