import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Briefcase,
  Search,
  Users,
  CalendarCheck,
} from "lucide-react";
import { JobForm } from "./JobForm";
import { useJobContext } from "../../../context/DataProvider";
import { useClientsContext } from "../../../context/ClientsProvider"; // Added
import { useCandidateContext } from "../../../context/CandidatesProvider"; // Added
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
    deleteJob,
    updateJobStatus,
    jobs
  } = useJobContext();

  const { users, fetchUsers } = useUserContext(); // Added to get reportees for scoping
  const { clients } = useClientsContext(); // Restored
  const { candidates, fetchallCandidates } = useCandidateContext(); // Get all candidates

  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch candidates and users for stats calculation
  useEffect(() => {
    fetchallCandidates();
    fetchUsers();
  }, []);

  // Scoping logic for Stats
  const scopedData = useMemo(() => {
    if (!user || !jobs || !candidates || !users) return { scopedJobs: jobs, scopedCandidates: candidates };

    // Admin sees all
    if (user.designation === "Admin") return { scopedJobs: jobs, scopedCandidates: candidates };

    // Get reportees
    const directReportees = users.filter((u: any) => u?.reporter?._id === user._id || u?.reporter === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);

    if (user.designation === "Manager") {
      directReportees.forEach((mentor: any) => {
        const mentorReportees = users.filter((u: any) => u?.reporter?._id === mentor._id || u?.reporter === mentor._id);
        allReporteeIds = [...allReporteeIds, ...mentorReportees.map((u: any) => u._id)];
      });
    }

    const scopedJobs = jobs.filter((job: any) => {
      const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    const scopedCandidates = candidates.filter((c: any) => {
      const creatorId = c.createdBy?._id || c.createdBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    return { scopedJobs, scopedCandidates };
  }, [user, jobs, candidates, users]);

  const { scopedJobs, scopedCandidates } = scopedData;

  // Calculate Stats
  const stats = useMemo(() => {
    // 1. Active Jobs
    const activeJobsList = scopedJobs.filter(j => j.status === 'Open');
    const activeJobsCount = activeJobsList.length;

    // 2. Active Clients (Clients with at least one Open job)
    const activeClientIds = new Set();
    activeJobsList.forEach(job => {
      if (job.clientId) {
        const cId = typeof job.clientId === 'object' ? (job.clientId as any)._id : job.clientId;
        if (cId) activeClientIds.add(cId);
      }
    });
    const activeClientsCount = activeClientIds.size;

    // 3. Positions Left
    // Sum of noOfPositions for all Active Jobs
    const totalPositions = activeJobsList.reduce((sum, job) => sum + (Number(job.noOfPositions) || 0), 0);

    // Count Joined candidates for these Active Jobs
    const activeJobIds = new Set(activeJobsList.map(j => j._id));
    const joinedCandidatesCount = scopedCandidates.filter(c => {
      if (c.status !== 'Joined') return false;
      const jId = typeof c.jobId === 'object' ? (c.jobId as any)._id : c.jobId;
      return activeJobIds.has(jId);
    }).length;

    const positionsLeftCount = Math.max(0, totalPositions - joinedCandidatesCount);

    return {
      activeJobs: activeJobsCount,
      activeClients: activeClientsCount,
      positionsLeft: positionsLeftCount
    };
  }, [scopedJobs, scopedCandidates]); // Recalculate when scoped data changes



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
  const [clientSearchTerm, setClientSearchTerm] = useState("");

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
        clientSearch: clientSearchTerm,
        status: filterStatus,
        userId: user?._id || "",
        role: user?.designation || ""
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, clientSearchTerm, filterStatus, user]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, clientSearchTerm, filterStatus]);

  useEffect(() => {
    if (initialFormOpen) setShowForm(true);
  }, [initialFormOpen]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    await deleteJob(id, user?._id || "");
    // Refresh current page
    fetchPaginatedJobs(currentPage, limit, {
      search: searchTerm,
      clientSearch: clientSearchTerm,
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
      clientSearch: clientSearchTerm,
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Clients */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1 group-hover:text-blue-600 transition-colors">Active Clients</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.activeClients}</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
            <Users size={24} />
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1 group-hover:text-amber-600 transition-colors">Active Jobs</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.activeJobs}</h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-100 transition-colors">
            <Briefcase size={24} />
          </div>
        </div>

        {/* Positions Left */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1 group-hover:text-emerald-600 transition-colors">Positions Left</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.positionsLeft}</h3>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
            <CalendarCheck size={24} />
          </div>
        </div>
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

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by client name..."
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
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
              status={job.status}
              postedDate={
                job.createdAt
                  ? formatDate(job.createdAt)
                  : "N/A"
              }
              onView={() => setSelectedJob(job as any)}
              onEdit={() => handleEdit(job)}
              onDelete={() => handleDelete(job._id as string)}
              onStatusChange={(id, status) => updateJobStatus(id, status, user?._id || "")}
              onRefresh={() => {
                fetchPaginatedJobs(currentPage, limit, {
                  search: searchTerm,
                  clientSearch: clientSearchTerm,
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
