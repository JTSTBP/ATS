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
import { useCandidateContext } from "../../../context/CandidatesProvider"; // Added
import { JobDetailsModal } from "./JobDetailedView";
import { useAuth } from "../../../context/AuthProvider";
import JobCard from "./Job/listjobs";
import { useClientsContext } from "../../../context/ClientsProvider"; // Added

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
  interviewed?: number;
  selected?: number;
  joined?: number;
  createdAt?: string;
  CreatedBy?: { _id: string; name: string } | string;
  clientId?: { _id: string; companyName: string; logo?: string };
}

import { useNavigate } from "react-router-dom";

interface JobsManagerProps {
  initialFormOpen?: boolean;
  onFormClose?: () => void;
  initialSearchTerm?: string;
}

export const JobsManager = ({
  initialFormOpen = false,
  onFormClose,
  initialSearchTerm = "",
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
  const { clients, fetchClients } = useClientsContext(); // Added
  const { candidates, fetchallCandidates } = useCandidateContext(); // Get all candidates

  const { user } = useAuth();

  // Fetch candidates and users for stats calculation
  useEffect(() => {
    fetchallCandidates();
    fetchUsers();
    fetchClients();
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
      const creatorId = job.CreatedBy?._id || job.CreatedBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    const scopedCandidates = candidates.filter((c: any) => {
      const creatorId = c.createdBy?._id || c.createdBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    return { scopedJobs, scopedCandidates };
  }, [user, jobs, candidates, users]);

  const { scopedJobs, scopedCandidates } = scopedData;






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

  // Calculate Stats
  const stats = useMemo(() => {
    // Apply filters to scopedJobs for stats calculation
    const filteredJobsForStats = scopedJobs.filter((job: any) => {
      // 1. Status Filter (mirroring server logic)
      if (filterStatus !== "all" && job.status !== filterStatus) return false;

      // 2. Search Filter (Title, Dept, Location, Employment Type)
      if (searchTerm) {
        const searchRegex = new RegExp(searchTerm, "i");
        const locationMatch = Array.isArray(job.location)
          ? job.location.some((loc: any) => searchRegex.test(loc.name))
          : searchRegex.test(job.location || "");

        const basicMatch = searchRegex.test(job.title || "") ||
          searchRegex.test(job.department || "") ||
          searchRegex.test(job.employmentType || "");

        if (!basicMatch && !locationMatch) return false;
      }

      // 3. Client Search Filter
      if (clientSearchTerm) {
        const clientSearchRegex = new RegExp(clientSearchTerm, "i");
        if (!clientSearchRegex.test(job.clientId?.companyName || "")) return false;
      }

      return true;
    });

    const filteredJobIds = new Set(filteredJobsForStats.map(j => j._id));

    // Filtered candidates for these jobs
    const filteredCandidatesForStats = scopedCandidates.filter((c: any) => {
      const jobId = c.jobId?._id || c.jobId;
      return filteredJobIds.has(jobId);
    });

    const openJobsInFiltered = filteredJobsForStats.filter(j => j.status === 'Open');
    const openJobIdsInFiltered = new Set(openJobsInFiltered.map(j => (j._id || "").toString()));

    const getCandidateJobId = (c: any) => {
      const jid = c.jobId?._id || c.jobId;
      return jid ? String(jid) : null;
    };

    const isOpenJobCandidate = (c: any) => {
      const jid = getCandidateJobId(c);
      return jid && openJobIdsInFiltered.has(jid);
    };

    // 1. Active Jobs (Open jobs in the filtered set)
    const activeJobsCount = openJobsInFiltered.length;

    // 2. Active Clients (Unique clients linked to Open jobs in the filtered set)
    const uniqueClientIds = new Set(
      openJobsInFiltered
        .map(j => {
          const cid = j.clientId;
          if (!cid) return null;
          return typeof cid === "object" && cid._id ? cid._id : String(cid);
        })
        .filter(Boolean)
    );
    const activeClientsCount = uniqueClientIds.size;

    // 3. Positions Left (Calculated for Open jobs in the filtered set: sum(positions) - sum(joined))
    const totalPositions = openJobsInFiltered.reduce((sum, job) => sum + (Number(job.noOfPositions) || 0), 0);
    const joinedCount = scopedCandidates.filter(c =>
      c.status === "Joined" && isOpenJobCandidate(c)
    ).length;
    const positionsLeftCount = Math.max(0, totalPositions - joinedCount);

    return {
      activeJobs: activeJobsCount,
      activeClients: activeClientsCount,
      positionsLeft: positionsLeftCount
    };
  }, [scopedJobs, scopedCandidates, searchTerm, clientSearchTerm, filterStatus]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
            Open Requirements
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage requirement postings and openings</p>
        </div>
        {canManageJobs && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition shadow-md hover:shadow-orange-200/50 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Post New Requirement</span>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Active Clients */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 flex justify-between items-center group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-blue-600 transition-colors">Active Clients</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">{stats.activeClients}</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 sm:p-4 rounded-2xl group-hover:bg-blue-100 transition-colors">
            <Users size={24} />
          </div>
        </div>

        {/* Positions Left */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 flex justify-between items-center group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-emerald-600 transition-colors">Positions Left</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">{stats.positionsLeft}</h3>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 sm:p-4 rounded-2xl group-hover:bg-emerald-100 transition-colors">
            <CalendarCheck size={24} />
          </div>
        </div>

        {/* Active Requirements (Jobs) */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 flex justify-between items-center group hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-amber-600 transition-colors">Active Requirements</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800">{stats.activeJobs}</h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 sm:p-4 rounded-2xl group-hover:bg-amber-100 transition-colors">
            <Briefcase size={24} />
          </div>
        </div>
      </div>


      {/* Search + Filter */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by title, dept, loc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all bg-gray-50/50 font-medium"
            />
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by client name..."
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all bg-gray-50/50 font-medium"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all bg-gray-50/50 font-bold text-gray-700 cursor-pointer outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Requirement Cards */}
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
              interviewed={job.interviewed || 0}
              selected={job.selected || 0}
              joined={job.joined || 0}
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
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Showing <span className="text-gray-700 font-extrabold">{((currentPage - 1) * limit) + 1}</span> to <span className="text-gray-700 font-extrabold">{Math.min(currentPage * limit, pagination?.totalJobs || 0)}</span> of <span className="text-gray-700 font-extrabold">{pagination?.totalJobs || 0}</span> requirements
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all border
              ${currentPage === 1
                ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 shadow-sm"
              }
            `}
          >
            Prev
          </button>
          <div className="flex items-center gap-1">
            <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold border border-orange-100">
              {currentPage}
            </span>
            <span className="text-gray-400 text-[10px] font-bold uppercase px-1">of</span>
            <span className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold border border-gray-100">
              {pagination?.totalPages || 1}
            </span>
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(pagination?.totalPages || 1, p + 1))}
            disabled={currentPage === (pagination?.totalPages || 1)}
            className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all border
              ${currentPage === (pagination?.totalPages || 1)
                ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 shadow-sm"
              }
            `}
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
            No requirements found
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Get started by posting a new requirement"}
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
