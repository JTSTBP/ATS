

import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Briefcase,
  MapPin,
  Building,
  DollarSign,
  Search,
  Eye,
} from "lucide-react";
import { JobForm } from "./JobForm";
import { useJobContext } from "../../../context/DataProvider";
import {JobDetailsModal}  from "./JobDetailedView";
import { useAuth } from "../../../context/AuthProvider";
import JobCard from "./Job/listjobs";

interface JobsManagerProps {
  initialFormOpen?: boolean;
  onFormClose?: () => void;
}

export const JobsManager = ({
  initialFormOpen = false,
  onFormClose,
}: JobsManagerProps = {}) => {
  const { jobs, loading, fetchJobs, createJob, updateJob, deleteJob } =
    useJobContext();
  const { user } = useAuth();


  const [showForm, setShowForm] = useState(initialFormOpen);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Simulated user permissions (you can adjust or remove)
  const canManageJobs = true;

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (initialFormOpen) setShowForm(true);
  }, [initialFormOpen]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    await deleteJob(id);
  };

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingJob(null);
    if (onFormClose) onFormClose();
  };


  const filteredJobs = jobs.filter((job) => {
    // Only show jobs created by the logged-in user
    const isCreatedByUser =
      job?.CreatedBy === user._id || job?.CreatedBy?._id === user._id;

 const locationNames = Array.isArray(job.location)
   ? job.location.map((loc) => loc.name.toLowerCase()).join(" ")
   : job.location?.toLowerCase() || "";

 const matchesSearch =
   job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
   job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
   locationNames.includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || job.status === filterStatus;

    return isCreatedByUser && matchesSearch && matchesStatus;
  });


  const statusColors: Record<string, string> = {
    Open: "bg-green-100 text-green-700",
    Closed: "bg-red-100 text-red-700",
    "On Hold": "bg-yellow-100 text-yellow-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition shadow-md"
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        {filteredJobs.map((job) => (
          <JobCard
            key={job._id}
            id={job._id}
            title={job.title}
            location={
              Array.isArray(job.location)
                ? job.location.map((loc) => loc.name).join(", ")
                : job.location || "—"
            }
            tags={[job.department, job.employmentType, job.status].filter(
              Boolean
            )}
            totalResponses={job.candidateCount || 0}
            newResponses={job.newResponses || 0}
            shortlisted={job.shortlisted || 0}
            postedBy={job.CreatedBy?.name || "You"}
            postedDate={
              job.createdAt
                ? new Date(job.createdAt).toLocaleDateString()
                : "N/A"
            }
            onView={() => setSelectedJob(job)}
            onEdit={() => handleEdit(job)}
            onDelete={() => handleDelete(job._id)}
            onRefresh={() => fetchJobs()}
            onMore={(id) => {
              /* optional: open dropdown / context menu */
            }}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredJobs.length === 0 && (
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
