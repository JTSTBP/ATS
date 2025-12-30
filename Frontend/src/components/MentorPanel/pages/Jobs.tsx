import { useEffect, useState } from "react";
import {
  Plus,
  Briefcase,
  Search,
} from "lucide-react";
import { JobForm } from "./JobForm";
import { useJobContext } from "../../../context/DataProvider";
import { JobDetailsModal } from "./JobDetailedView";
import { useAuth } from "../../../context/AuthProvider";
import JobCard from "./Job/listjobs";

import { useUserContext } from "../../../context/UserProvider";
import { formatDate } from "../../../utils/dateUtils";

interface JobType {
  _id: string;
  title: string;
  description?: string;
  department?: string;
  location?: string | { name: string }[];
  employmentType?: string;
  noOfPositions?: number;
  status?: string;
  candidateCount?: number;
  newResponses?: number;
  shortlisted?: number;
  createdAt?: string;
  CreatedBy?: { _id: string; name: string } | string;
  clientId?: { _id: string; companyName: string; logo?: string };
}

import { useNavigate } from "react-router-dom";

interface JobsManagerProps {
  initialFormOpen?: boolean;
  onFormClose?: () => void;
  initialSearchTerm?: string;
  onNavigateToCandidates?: (jobTitle: string) => void;
}

export const JobsManager = ({
  initialFormOpen = false,
  onFormClose,
  initialSearchTerm = "",
  onNavigateToCandidates,
}: JobsManagerProps = {}) => {
  // console.log("JobsManager rendered. onNavigateToCandidates defined:", !!onNavigateToCandidates);
  /* New Pagination Logic */
  const {
    paginatedJobs,
    pagination,
    fetchPaginatedJobs,
    loading,
    deleteJob
  } = useJobContext();

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavigateToCandidates = (jobTitle: string) => {
    if (onNavigateToCandidates) {
      onNavigateToCandidates(jobTitle);
    } else {
      const basePath = user?.designation === "Manager" ? "/Manager" : "/Mentor";
      navigate(
        `${basePath}/candidates?jobTitle=${encodeURIComponent(jobTitle)}`
      );
    }
  };

  const [showForm, setShowForm] = useState(initialFormOpen);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<JobType | null>(null);

  // Simulated user permissions
  const canManageJobs = true;

  // Replaces the old useEffect(fetchJobs)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPaginatedJobs(currentPage, limit, {
        search: searchTerm,
        status: filterStatus,
        userId: user?._id || "",
        role: user?.designation || ""
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, filterStatus, user]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    if (initialFormOpen) setShowForm(true);
  }, [initialFormOpen]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    await deleteJob(id, user?._id || "");
    // Refresh current page
    fetchPaginatedJobs(currentPage, limit, {
      search: searchTerm,
      status: filterStatus,
      userId: user?._id || "",
      role: user?.designation || ""
    });
  };

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingJob(null);
    if (onFormClose) onFormClose();
    // Refresh to reflect changes
    fetchPaginatedJobs(currentPage, limit, {
      search: searchTerm,
      status: filterStatus,
      userId: user?._id || "",
      role: user?.designation || ""
    });
  };

  /* REMOVED: OLD Client-Side filteredJobs logic */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Job Openings
          </h2>
          <p className="text-gray-600">Manage job postings and openings</p>
        </div>
        {canManageJobs && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Post New Job</span>
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs by title, department, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          paginatedJobs.map((job) => (
            <JobCard
              key={job._id}
              id={job._id}
              title={job.title}
              location={
                Array.isArray(job.location)
                  ? job.location.map((loc: any) => loc.name).join(", ")
                  : job.location || "—"
              }
              client={
                job.clientId
                  ? {
                    companyName: job.clientId.companyName,
                    logo: job.clientId.logo,
                  }
                  : undefined
              }
              tags={[job.department, job.employmentType, job.status].filter(
                Boolean
              )}
              totalResponses={job.candidateCount || 0}
              newResponses={job.newResponses || 0}
              shortlisted={job.shortlisted || 0}
              postedBy={typeof job.CreatedBy === 'object' && job.CreatedBy ? job.CreatedBy.name : "You"}
              positions={job.noOfPositions}
              postedDate={
                job.createdAt
                  ? formatDate(job.createdAt)
                  : "N/A"
              }
              onView={() => setSelectedJob(job as any)}
              onEdit={() => handleEdit(job)}
              onDelete={() => handleDelete(job._id as string)}
              onRefresh={() => {
                fetchPaginatedJobs(currentPage, limit, {
                  search: searchTerm,
                  status: filterStatus,
                  userId: user?._id || "",
                  role: user?.designation || ""
                });
              }}
              onNavigateToCandidates={handleNavigateToCandidates}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <div className="p-4 flex items-center justify-between bg-white rounded-xl shadow-md border border-gray-200">
        <div className="text-sm text-slate-500">
          Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination?.totalJobs || 0)} of {pagination?.totalJobs || 0} jobs
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 bg-slate-100 rounded">
            Page {currentPage} of {pagination?.totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(pagination?.totalPages || 1, p + 1))}
            disabled={currentPage === (pagination?.totalPages || 1)}
            className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* No Results */}
      {paginatedJobs.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-md border border-gray-200">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No jobs found
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Get started by posting a new job"}
          </p>
        </div>
      )}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {/* Job Form */}
      {showForm && <JobForm job={editingJob} onClose={handleCloseForm} />}
    </div>
  );
};
