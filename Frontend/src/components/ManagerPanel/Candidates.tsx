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
import { CandidateForm } from "../MentorPanel/pages/CandidatesForm";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useAuth } from "../../context/AuthProvider";
import { StatusUpdateModal } from "../Common/StatusUpdateModal";

export const ManagerCandidates = () => {
  const { user } = useAuth();
  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL;

  const {
    updateStatus,
    paginatedCandidates,
    pagination,
    fetchPaginatedCandidatesByUser,
    loading
  } = useCandidateContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    candidateId: string;
    newStatus: string;
    interviewStage?: string;
    currentJoiningDate?: string;
    currentSelectionDate?: string;
    currentExpectedJoiningDate?: string;
  } | null>(null);

  const handleStatusChange = (
    candidateId: string,
    newStatus: string,
    interviewStage?: string,
    currentJoiningDate?: string,
    currentSelectionDate?: string,
    currentExpectedJoiningDate?: string
  ) => {
    setPendingStatusChange({
      candidateId,
      newStatus,
      interviewStage,
      currentJoiningDate,
      currentSelectionDate,
      currentExpectedJoiningDate
    });
    setStatusModalOpen(true);
  };

  const confirmStatusChange = async (comment: string, joiningDate?: string, offerLetter?: File, selectionDate?: string, expectedJoiningDate?: string) => {
    if (!pendingStatusChange) return;

    await updateStatus(
      pendingStatusChange.candidateId,
      pendingStatusChange.newStatus,
      user?._id || "",
      undefined, // interviewStage
      undefined, // stageStatus
      undefined, // stageNotes
      comment,
      joiningDate,
      offerLetter,
      selectionDate,
      expectedJoiningDate
    );

    if (user?._id) {
      fetchPaginatedCandidatesByUser(user._id, pagination.currentPage, 10, {
        search: debouncedSearch,
        status: statusFilter
      });
    }
    setStatusModalOpen(false);
    setPendingStatusChange(null);
  };

  // 1️⃣ Fetch candidates on load and when filters change
  useEffect(() => {
    if (user?._id) {
      fetchPaginatedCandidatesByUser(user._id, 1, 10, {
        search: debouncedSearch,
        status: statusFilter
      });
    }
  }, [user, debouncedSearch, statusFilter, showForm]);

  const handlePageChange = (newPage: number) => {
    if (user?._id && newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPaginatedCandidatesByUser(user._id, newPage, 10, {
        search: debouncedSearch,
        status: statusFilter
      });
    }
  };

  const handleEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCandidate(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure to delete?")) return;
    console.log("Delete not implemented for", id);
    // Implement delete logic if needed
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Candidates</h2>
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

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-3 bg-white p-4 rounded-xl shadow-md border border-gray-200 overflow-x-auto">
        {[
          "all",
          "New",
          "Shortlisted",
          "Interviewed",
          "Selected",
          "Joined",
          "Rejected",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-lg text-sm font-medium capitalize whitespace-nowrap
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
              {paginatedCandidates.map((candidate: any) => (
                <tr key={candidate._id} className="hover:bg-gray-50 transition">
                  {/* NAME */}
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {candidate.dynamicFields?.candidateName || "-"}
                  </td>

                  {/* CONTACT */}
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
                      {/* JOINING DATE */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          {candidate.joiningDate ? new Date(candidate.joiningDate).toLocaleDateString() : "-"}
                          {/* Edit Button for Joined Details */}
                          <button
                            onClick={() => handleStatusChange(candidate._id, "Joined", undefined, candidate.joiningDate)}
                            className="p-1 hover:bg-gray-100 rounded text-blue-600"
                            title="Edit Joining Details"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* OFFER LETTER */}
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
                      {/* SELECTION DATE */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          {candidate.selectionDate ? new Date(candidate.selectionDate).toLocaleDateString() : "-"}
                          {/* Edit Button for Selection Details */}
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

                      {/* EXPECTED JOINING DATE */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {candidate.expectedJoiningDate ? new Date(candidate.expectedJoiningDate).toLocaleDateString() : "-"}
                      </td>
                    </>
                  )}



                  {/* RESUME */}
                  <td className="px-6 py-4">
                    {candidate.resumeUrl ? (
                      <a
                        href={`${API_BASE_URL}${candidate.resumeUrl}`} // prepend backend URL
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
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {candidate.createdBy?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {candidate.createdBy?.reporter?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <select
                      value={candidate.status || "New"}
                      onChange={(e) =>
                        handleStatusChange(candidate._id || "", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="New">New</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interviewed">Interviewed</option>
                      <option value="Selected">Selected</option>
                      <option value="Joined">Joined</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    {candidate.status === "Interviewed" && candidate.interviewStage && (
                      <div className="mt-2 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200 text-center">
                        {candidate.interviewStage}
                      </div>
                    )}
                    {candidate.status === "Joined" && candidate.joiningDate && (
                      <p className="text-[10px] text-green-600 mt-1 font-medium">
                        Joined: {new Date(candidate.joiningDate).toLocaleDateString()}
                      </p>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 flex space-x-2">
                    <button
                      onClick={() => handleEdit(candidate)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(candidate._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Start Pagination Controls */}
        {pagination.totalCandidates > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCandidates)} of {pagination.totalCandidates} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition
                  ${pagination.currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm"
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
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
                          ? "bg-orange-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
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
      {paginatedCandidates.length === 0 && !loading && (
        <div className="bg-white rounded-xl p-12 text-center shadow-md border">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No candidates found
          </h3>
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
