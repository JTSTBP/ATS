import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CandidateForm } from "./CandidatesForm";
import { StatusUpdateModal } from "../../Common/StatusUpdateModal";
import { useCandidateContext } from "../../../context/CandidatesProvider";
import { useJobContext } from "../../../context/DataProvider";
import { useAuth } from "../../../context/AuthProvider";
import { toast } from "react-toastify";

import { useSearchParams } from "react-router-dom";

export const CandidatesManager = ({ initialJobTitleFilter = "all", initialFormOpen = false }: { initialJobTitleFilter?: string, initialFormOpen?: boolean }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL;

  const {
    updateStatus,
    paginatedCandidates,
    pagination,
    fetchRoleBasedCandidates,
    loading,
    deleteCandidate,
  } = useCandidateContext();
  // const { users } = useUserContext();
  const { jobs } = useJobContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(initialFormOpen);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterClient, setFilterClient] = useState("all");
  const [filterJobTitle, setFilterJobTitle] = useState(initialJobTitleFilter);
  const [filterStage, setFilterStage] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [joinStartDate, setJoinStartDate] = useState("");
  const [joinEndDate, setJoinEndDate] = useState("");
  const [selectStartDate, setSelectStartDate] = useState("");
  const [selectEndDate, setSelectEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [clients, setClients] = useState<any[]>([]);



  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    candidateId: string;
    newStatus: string;
    interviewStage?: string;
    currentJoiningDate?: string;
    currentSelectionDate?: string;
    currentExpectedJoiningDate?: string;
    currentRejectedBy?: string;
  } | null>(null);

  const handleStatusChange = (
    candidateId: string,
    newStatus: string,
    interviewStage?: string,
    currentJoiningDate?: string,
    currentSelectionDate?: string,
    currentExpectedJoiningDate?: string,
    currentRejectedBy?: string
  ) => {
    setPendingStatusChange({
      candidateId,
      newStatus,
      interviewStage,
      currentJoiningDate,
      currentSelectionDate,
      currentExpectedJoiningDate,
      currentRejectedBy
    });
    setStatusModalOpen(true);
  };

  const confirmStatusChange = async (comment: string, joiningDate?: string, offerLetter?: File, selectionDate?: string, expectedJoiningDate?: string, rejectedBy?: string) => {
    if (!pendingStatusChange) return;

    await updateStatus(
      pendingStatusChange.candidateId,
      pendingStatusChange.newStatus,
      user?._id || "",
      pendingStatusChange.interviewStage,
      undefined,
      undefined,
      comment,
      joiningDate,
      offerLetter,
      selectionDate,
      expectedJoiningDate,
      rejectedBy
    );

    if (user?._id && user?.designation) {
      fetchRoleBasedCandidates(user._id, user.designation, currentPage, limit, {
        search: searchTerm,
        status: statusFilter,
        client: filterClient,
        jobTitle: filterJobTitle,
        stage: filterStage,
        startDate,
        endDate,
        joinStartDate,
        joinEndDate,
        selectStartDate,
        selectEndDate
      });
    }

    setStatusModalOpen(false);
    setPendingStatusChange(null);
  };

  useEffect(() => {
    const jobTitleFromUrl = searchParams.get("jobTitle");
    if (jobTitleFromUrl) {
      setFilterJobTitle(jobTitleFromUrl);
    } else if (initialJobTitleFilter && initialJobTitleFilter !== "all") {
      setFilterJobTitle(initialJobTitleFilter);
    }

    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [initialJobTitleFilter, searchParams]);

  // Fetch Paginated Candidates when filters/page change
  useEffect(() => {
    if (!user?._id || !user?.designation) return;

    const timer = setTimeout(() => {
      fetchRoleBasedCandidates(user._id, user.designation, currentPage, limit, {
        search: searchTerm,
        status: statusFilter,
        client: filterClient,
        jobTitle: filterJobTitle,
        stage: filterStage,
        startDate,
        endDate,
        joinStartDate,
        joinEndDate,
        selectStartDate,
        selectEndDate
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [user?._id, user?.designation, currentPage, searchTerm, statusFilter, filterClient, filterJobTitle, filterStage, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate, showForm, fetchRoleBasedCandidates]);

  // Reset page to 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, filterClient, filterJobTitle, filterStage, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate]);

  useEffect(() => {
    // Fetch all clients from API
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clients`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.clients) {
          setClients(data.clients);
        }
      })
      .catch(err => console.error('Error fetching clients:', err));
  }, []);


  const handlePageChange = (newPage: number) => {
    if (user?._id && user?.designation && newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      fetchRoleBasedCandidates(user._id, user.designation, newPage, limit, {
        search: searchTerm,
        status: statusFilter,
        client: filterClient,
        jobTitle: filterJobTitle,
        stage: filterStage,
        startDate,
        endDate,
        joinStartDate,
        joinEndDate,
        selectStartDate,
        selectEndDate
      });
    }
  };


  // Get unique job titles from JOBS context for the filter dropdown
  // This replaces the old logic that derived it from loaded candidates (which we don't have all of now)
  const uniqueJobTitles = Array.isArray(jobs)
    ? Array.from(new Set(jobs.map((j) => j.title).filter(Boolean))).sort()
    : [];

  // Get available stages for the selected job
  const availableStages =
    filterJobTitle !== "all" && Array.isArray(jobs)
      ? jobs.find((j) => j.title === filterJobTitle)?.stages || []
      : [];


  const handleEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCandidate(null);
  };

  const handleDelete = async (candidateId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this candidate?"
    );
    if (!confirmDelete) return;

    const success = await deleteCandidate(candidateId, user?.designation || "Mentor");

    if (success) {
      toast.success("Candidate deleted successfully");
      if (user?._id && user?.designation) {
        fetchRoleBasedCandidates(user._id, user.designation, currentPage, limit, {
          search: searchTerm,
          status: statusFilter,
          client: filterClient,
          jobTitle: filterJobTitle,
          stage: filterStage,
          startDate,
          endDate,
          joinStartDate,
          joinEndDate,
          selectStartDate,
          selectEndDate
        });
      }
    } else {
      toast.error("Failed to delete candidate");
    }
  };

  if (loading && !paginatedCandidates.length)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Candidates (Mentor View)</h2>
          <p className="text-gray-600">Manage candidate profiles and CVs</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span>Add Candidate</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 space-y-4">
        {/* Search Bar Row */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filters Grid Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-sm"
            >
              <option value="all">All Clients</option>
              {clients.map((client: any) => (
                <option key={client._id} value={client.companyName}>
                  {client.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Title</label>
            <select
              value={filterJobTitle}
              onChange={(e) => setFilterJobTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-sm"
            >
              <option value="all">All Job Titles</option>
              {uniqueJobTitles.map((title: any) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              disabled={filterJobTitle === "all"}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm ${filterJobTitle === "all" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-50"
                }`}
            >
              <option value="all">All Stages</option>
              {availableStages.map((stage: any, index: number) => (
                <option key={index} value={stage.name}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
            />
          </div>

          {statusFilter === "Joined" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">Join From</label>
                <input
                  type="date"
                  value={joinStartDate}
                  onChange={(e) => setJoinStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">Join To</label>
                <input
                  type="date"
                  value={joinEndDate}
                  onChange={(e) => setJoinEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
                />
              </div>
            </>
          )}

          {statusFilter === "Selected" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">Select From</label>
                <input
                  type="date"
                  value={selectStartDate}
                  onChange={(e) => setSelectStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">Select To</label>
                <input
                  type="date"
                  value={selectEndDate}
                  onChange={(e) => setSelectEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            {(startDate || endDate || joinStartDate || joinEndDate || selectStartDate || selectEndDate) ? (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setJoinStartDate("");
                  setJoinEndDate("");
                  setSelectStartDate("");
                  setSelectEndDate("");
                }}
                className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
              >
                Reset Dates
              </button>
            ) : (
              <div className="w-full h-9"></div>
            )}
          </div>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex gap-3 bg-white p-4 rounded-xl shadow-md border border-gray-200">
        {[
          "all",
          "New",
          "Shortlisted",
          "Interviewed",
          "Selected",
          "Joined",
          "Rejected",
          "Dropped",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-lg text-sm font-medium capitalize
              ${statusFilter === status
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-700"
              }
            `}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto whitespace-nowrap">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Contact
                </th>
                {statusFilter === "Joined" && (
                  <>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Joining Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Offer Letter
                    </th>
                  </>
                )}

                {statusFilter === "Selected" && (
                  <>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Selection Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Expected Joining Date
                    </th>
                  </>
                )}

                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Resume
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Reportees
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((candidate: any) => (
                  <tr key={candidate._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {candidate.dynamicFields?.candidateName || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center mb-1">
                        <Mail className="w-4 h-4 mr-2" />
                        {candidate.dynamicFields?.Email || "No Email"}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {candidate.dynamicFields?.Phone || "No Phone"}
                      </div>
                    </td>

                    {statusFilter === "Joined" && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            {candidate.joiningDate ? new Date(candidate.joiningDate).toLocaleDateString() : "-"}
                            <button
                              onClick={() => handleStatusChange(candidate._id || "", "Joined", undefined, candidate.joiningDate)}
                              className="p-1 hover:bg-gray-100 rounded text-blue-600"
                              title="Edit Joining Details"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {candidate.offerLetter ? (
                            <a
                              href={`${API_BASE_URL}${candidate.offerLetter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              <Upload className="w-4 h-4 mr-1" /> View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </>
                    )}

                    {statusFilter === "Selected" && (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            {candidate.selectionDate ? new Date(candidate.selectionDate).toLocaleDateString() : "-"}
                            <button
                              onClick={() => handleStatusChange(
                                candidate._id,
                                "Selected",
                                undefined,
                                undefined,
                                candidate.selectionDate,
                                candidate.expectedJoiningDate
                              )}
                              className="p-1 hover:bg-gray-100 rounded text-blue-600"
                              title="Edit Selection Details"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {candidate.expectedJoiningDate ? new Date(candidate.expectedJoiningDate).toLocaleDateString() : "-"}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4">
                      {candidate.resumeUrl ? (
                        <a
                          href={`${API_BASE_URL}${candidate.resumeUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600"
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          View Resume
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No Resume</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {candidate.jobId?.title || "-"}
                      {candidate.jobId?.clientId?.companyName && (
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-tight">
                          {candidate.jobId?.clientId?.companyName}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>
                        {candidate.createdBy?.name || "-"}
                        {candidate.createdBy?.designation && (
                          <p className="text-[10px] text-gray-400 font-medium">
                            {candidate.createdBy.designation}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {candidate.createdBy?.reporter?.name || "-"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      <select
                        value={candidate.status || "New"}
                        onChange={(e) => handleStatusChange(candidate._id || "", e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="New">New</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interviewed">Interviewed</option>
                        <option value="Selected">Selected</option>
                        <option value="Joined">Joined</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Dropped">Dropped</option>
                      </select>
                      {candidate.status === "Interviewed" && candidate.interviewStage && (
                        <div className="mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 text-center uppercase tracking-wider">
                          {candidate.interviewStage}
                        </div>
                      )}
                      {candidate.status === "Joined" && candidate.joiningDate && (
                        <p className="text-[10px] text-green-600 mt-1 font-medium">
                          Joined: {new Date(candidate.joiningDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 flex space-x-2">
                      <button
                        onClick={() => handleEdit(candidate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(candidate._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Simplified Pagination Controls */}
        {pagination.totalCandidates > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.totalCandidates)} of {pagination.totalCandidates} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition
                  ${currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm"
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition
                  ${currentPage === pagination.totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm"
                  }
                `}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
        {/* End Pagination Controls */}

      </div>

      {/* Empty UI */}
      {paginatedCandidates.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-md border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No candidates found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm || filterClient !== "all" || filterJobTitle !== "all" || statusFilter !== "all"
              ? "No candidates match your current filters. Try adjusting your search or filters."
              : "Get started by adding your first candidate to the system."}
          </p>
        </div>
      )}

      {/* Form */}
      <CandidateForm
        isOpen={showForm}
        onClose={handleCloseForm}
        candidate={editingCandidate}
      />

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={confirmStatusChange}
        newStatus={pendingStatusChange?.newStatus || ""}
        candidateName={paginatedCandidates.find((c: any) => c._id === pendingStatusChange?.candidateId)?.dynamicFields?.candidateName}
        currentJoiningDate={pendingStatusChange?.currentJoiningDate}
        currentSelectionDate={pendingStatusChange?.currentSelectionDate}
        currentExpectedJoiningDate={pendingStatusChange?.currentExpectedJoiningDate}
      />
    </div>
  );
};
