import { useState, useEffect, useMemo } from "react";
import { Plus, X, Search, Users, Mail, Phone, Edit, MessageSquare, Briefcase, Location, Trash2, UserCheck, ChevronLeft, ChevronRight, FileText, Download, Upload } from "lucide-react";

import { CandidateForm } from "./CandidatesForm";
import { StatusUpdateModal } from "../../Common/StatusUpdateModal";
import { CommentModal } from "../../Common/CommentModal";
import { useCandidateContext } from "../../../context/CandidatesProvider";
import { useJobContext } from "../../../context/DataProvider";
import { useUserContext } from "../../../context/UserProvider";
import { useAuth } from "../../../context/AuthProvider";
import { toast } from "react-toastify";
import { formatDate } from "../../../utils/dateUtils";
import { getFilePreviewUrl, isWordDocument } from "../../../utils/imageUtils";


import { useSearchParams, useNavigate } from "react-router-dom";

export const CandidatesManager = ({ initialJobTitleFilter = "all", initialFormOpen = false }: { initialJobTitleFilter?: string, initialFormOpen?: boolean }) => {
  const navigate = useNavigate();

  const { user } = useAuth();
  const [searchParams] = useSearchParams();


  const {
    updateStatus,
    paginatedCandidates,
    pagination,
    fetchRoleBasedCandidates,
    loading,
    deleteCandidate,
  } = useCandidateContext();
  const { users, fetchUsers } = useUserContext();
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
  const [filterRecruiter, setFilterRecruiter] = useState("all");
  const teamRecruiters = useMemo(() => {
    if (!user?._id || !Array.isArray(users)) return [];

    const isReportee = (candidateUser: any, parentId: string) => {
      const reporterId = candidateUser?.reporter?._id || candidateUser?.reporter;
      const secondaryManagers = Array.isArray(candidateUser?.secondary_managers)
        ? candidateUser.secondary_managers
        : [];
      return (
        String(reporterId || "") === String(parentId) ||
        secondaryManagers.some((manager: any) => String(manager?._id || manager) === String(parentId))
      );
    };

    const activeUsers = users.filter((candidateUser: any) => !candidateUser.isDisabled);

    if (user.designation === "Manager") {
      const managerMentors = activeUsers.filter((candidateUser: any) => (
        candidateUser.designation === "Mentor" && isReportee(candidateUser, user._id)
      ));
      const mentorIds = new Set(managerMentors.map((mentor: any) => String(mentor._id)));
      return activeUsers
        .filter((candidateUser: any) => (
          candidateUser.designation === "Recruiter" &&
          (isReportee(candidateUser, user._id) || Array.from(mentorIds).some((mentorId) => isReportee(candidateUser, mentorId)))
        ))
        .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")));
    }

    return activeUsers
      .filter((candidateUser: any) => (
        candidateUser.designation === "Recruiter" && isReportee(candidateUser, user._id)
      ))
      .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [user?._id, user?.designation, users]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (filterRecruiter === "all") return;
    const recruiterStillAvailable = teamRecruiters.some((recruiter: any) => String(recruiter._id) === String(filterRecruiter));
    if (!recruiterStillAvailable) {
      setFilterRecruiter("all");
    }
  }, [filterRecruiter, teamRecruiters]);

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
    droppedBy?: string;
    stageNameForHistory?: string;
    nextStageName?: string;
  } | null>(null);

  // Comment Modal State
  const [commentModal, setCommentModal] = useState<{ candidateId: string; candidateName: string; comments: any[] } | null>(null);
  const [previewResumeUrl, setPreviewResumeUrl] = useState<string | null>(null);
  const [selectedCandidateForPreview, setSelectedCandidateForPreview] = useState<any>(null);

  const handleStatusChange = (
    candidateId: string,
    newStatus: string,
    interviewStage?: string,
    currentJoiningDate?: string,
    currentSelectionDate?: string,
    currentExpectedJoiningDate?: string,
    currentRejectedBy?: string,
    droppedBy?: string,
    stageNameForHistory?: string,
    nextStageName?: string
  ) => {
    setPendingStatusChange({
      candidateId,
      newStatus,
      interviewStage,
      currentJoiningDate,
      currentSelectionDate,
      currentExpectedJoiningDate,
      currentRejectedBy,
      droppedBy,
      stageNameForHistory,
      nextStageName
    });
    setStatusModalOpen(true);
  };

  const confirmStatusChange = async (
    comment: string,
    joiningDate?: string,
    offerLetter?: File,
    selectionDate?: string,
    expectedJoiningDate?: string,
    rejectedBy?: string,
    offeredCTC?: string,
    rejectionReason?: string,
    stageNameForHistory?: string,
    stageStatus?: string,
    stageNotes?: string
  ) => {
    if (!pendingStatusChange) return;

    // Determine if this is a drop or reject
    const droppedByValue = pendingStatusChange.newStatus === "Dropped" ? pendingStatusChange.droppedBy : undefined;
    const rejectedByValue = (pendingStatusChange.newStatus === "Rejected" || stageStatus === "Rejected") ? rejectedBy : undefined;

    await updateStatus(
      pendingStatusChange.candidateId,
      stageStatus === "Rejected" ? "Rejected" : pendingStatusChange.newStatus,
      user?._id || "",
      pendingStatusChange.interviewStage,
      stageStatus as any,
      stageNotes,
      comment,
      joiningDate,
      offerLetter,
      selectionDate,
      expectedJoiningDate,
      rejectedByValue,
      offeredCTC,
      droppedByValue,
      rejectionReason,
      stageNameForHistory
    );

    if (user?._id && user?.designation) {
      fetchRoleBasedCandidates(user._id, user.designation, currentPage, limit, {
        search: searchTerm,
        status: statusFilter,
        client: filterClient,
        jobTitle: filterJobTitle,
        startDate,
        endDate,
        joinStartDate,
        joinEndDate,
        selectStartDate,
        selectEndDate,
        recruiterId: filterRecruiter
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
        selectEndDate,
        recruiterId: filterRecruiter
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [user?._id, user?.designation, currentPage, searchTerm, statusFilter, filterClient, filterJobTitle, filterStage, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate, filterRecruiter, showForm, fetchRoleBasedCandidates]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, filterClient, filterJobTitle, filterStage, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate, filterRecruiter]);

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
        selectEndDate,
        recruiterId: filterRecruiter
      });
    }
  };


  // Get unique job titles from JOBS context for the filter dropdown
  // This replaces the old logic that derived it from loaded candidates (which we don't have all of now)
  const uniqueJobTitles = Array.isArray(jobs)
    ? Array.from(new Set(jobs.map((j) => j.title).filter(Boolean))).sort()
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
          selectEndDate,
          recruiterId: filterRecruiter
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

  if (showForm) {
    return (
      <CandidateForm
        isOpen={showForm}
        onClose={handleCloseForm}
        candidate={editingCandidate}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">Candidates (Mentor View)</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage candidate profiles and CVs</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate("/Mentor/upload-source-candidate")}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-emerald-700 transition shadow-md hover:shadow-emerald-200/50 w-full sm:w-auto"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Source Candidate</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition shadow-md hover:shadow-orange-200/50 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
        {/* Search Bar Row */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all bg-gray-50/50 font-medium text-sm"
          />
        </div>

        {/* Filters Grid Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Recruiter</label>
            <select
              value={filterRecruiter}
              onChange={(e) => setFilterRecruiter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-semibold text-gray-700"
            >
              <option value="all">All Recruiters</option>
              {teamRecruiters.map((rec: any) => (
                <option key={rec._id} value={rec._id}>
                  {rec.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Client</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-semibold text-gray-700"
            >
              <option value="all">All Clients</option>
              {clients.map((client: any) => (
                <option key={client._id} value={client.companyName}>
                  {client.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Designation</label>
            <select
              value={filterJobTitle}
              onChange={(e) => setFilterJobTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-semibold text-gray-700"
            >
              <option value="all">All Designations</option>
              {uniqueJobTitles.map((title: any) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>


          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center block">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-semibold text-gray-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center block">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-semibold text-gray-700"
            />
          </div>

          <div className="flex items-end">
            {(startDate || endDate || joinStartDate || joinEndDate || selectStartDate || selectEndDate || filterClient !== "all" || filterJobTitle !== "all" || filterStage !== "all" || filterRecruiter !== "all" || searchTerm || statusFilter !== "all") ? (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setJoinStartDate("");
                  setJoinEndDate("");
                  setSelectStartDate("");
                  setSelectEndDate("");
                  setFilterClient("all");
                  setFilterJobTitle("all");
                  setFilterStage("all");
                  setFilterRecruiter("all");
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition text-xs font-bold uppercase tracking-wider"
              >
                Clear All
              </button>
            ) : (
              <div className="w-full h-9 hidden xl:block"></div>
            )}
          </div>
        </div>

        {(statusFilter === "Joined" || statusFilter === "Selected") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
            {statusFilter === "Joined" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Join From</label>
                  <input
                    type="date"
                    value={joinStartDate}
                    onChange={(e) => setJoinStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-semibold text-gray-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Join To</label>
                  <input
                    type="date"
                    value={joinEndDate}
                    onChange={(e) => setJoinEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-semibold text-gray-700"
                  />
                </div>
              </>
            )}

            {statusFilter === "Selected" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select From</label>
                  <input
                    type="date"
                    value={selectStartDate}
                    onChange={(e) => setSelectStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-semibold text-gray-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select To</label>
                  <input
                    type="date"
                    value={selectEndDate}
                    onChange={(e) => setSelectEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-semibold text-gray-700"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status Filter Buttons */}
      <div className="flex gap-2 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide pb-2 sm:pb-4 -mx-4 px-4 sm:mx-0 sm:px-4">
        {[
          "all",
          "New",
          "Shortlisted",
          "Interviewed",
          "Selected",
          "Joined",
          "Rejected",
          "Dropped",
          "Hold",
          "Not responding",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border
              ${statusFilter === status
                ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-100"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:border-orange-300 hover:bg-white hover:text-orange-600"
              }
            `}
          >
            {status === "all" ? "All Status" : status === "Shortlisted" ? "Screen" : status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1400px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Name
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Identifier
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Contact
                </th>
                {statusFilter === "Joined" && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Joining Date
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Offer Letter
                    </th>
                  </>
                )}

                {statusFilter === "Selected" && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Selection Date
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Expected Joining Date
                    </th>
                  </>
                )}

                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Resume
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Client
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Designation
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Upload Date
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Created By
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Mentor
                </th>

                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Remarks
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                    <td colSpan={14} className="px-6 py-8 text-center">
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
                    <td className="px-6 py-4 text-sm text-gray-700">{candidate.candidateId || candidate._id}</td>

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
                            {candidate.joiningDate ? formatDate(candidate.joiningDate) : "-"}
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
                              href={getFilePreviewUrl(candidate.offerLetter)}
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
                            {candidate.selectionDate ? formatDate(candidate.selectionDate) : "-"}
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
                          {candidate.expectedJoiningDate ? formatDate(candidate.expectedJoiningDate) : "-"}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4">
                      {candidate.resumeUrl ? (
                        <button
                          onClick={() => {
                            const url = getFilePreviewUrl(candidate.resumeUrl);
                            if (isWordDocument(candidate.resumeUrl)) {
                              toast.info("File is downloaded");
                              window.open(url, "_blank");
                            } else {
                              setSelectedCandidateForPreview(candidate);
                              setPreviewResumeUrl(url);
                            }
                          }}
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Resume
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No Resume</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {candidate.jobId?.clientId?.companyName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {candidate.jobId?.title || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {candidate.createdAt ? formatDate(candidate.createdAt) : "-"}
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
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          let droppedByVal = undefined;
                          if (newStatus === "Dropped") {
                            if (["Interviewed", "Selected", "Joined"].includes(candidate.status || "")) droppedByVal = "Client";
                            else droppedByVal = "Mentor";
                          }

                          let rejectedByVal = undefined;
                          if (newStatus === "Rejected") {
                            rejectedByVal = candidate.status === "Interviewed" ? "Client" : "Mentor";
                          }

                          let targetInterviewStage = candidate.interviewStage;
                          let nextStageName = undefined;

                          if (newStatus === "Interviewed" && !targetInterviewStage) {
                            const job = jobs.find(j => j._id === (candidate.jobId?._id || candidate.jobId));
                            const jobStages = job?.stages || [];
                            if (jobStages.length > 0) {
                              targetInterviewStage = jobStages[0].name;
                              nextStageName = jobStages[0].name;
                            }
                          }

                          handleStatusChange(
                            candidate._id || "",
                            newStatus,
                            targetInterviewStage,
                            candidate.joiningDate,
                            candidate.selectionDate,
                            candidate.expectedJoiningDate,
                            rejectedByVal,
                            droppedByVal,
                            undefined,
                            nextStageName
                          );
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500"
                      >
                        {candidate.status === "Selected" ? (
                          <>
                            <option value="Selected">Selected</option>
                            <option value="Joined">Joined</option>
                            <option value="Hold">Hold</option>
                            <option value="Dropped">Dropped</option>
                            <option value="Not responding">Not responding</option>
                          </>
                        ) : candidate.status === "Joined" ? (
                          <>
                            <option value="Joined">Joined</option>
                            <option value="Dropped">Dropped</option>
                            <option value="Not responding">Not responding</option>
                          </>
                        ) : (
                          <>
                            <option value="New">New</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interviewed">Interviewed</option>
                            <option value="Selected">Selected</option>
                            <option value="Joined">Joined</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Dropped">Dropped</option>
                            <option value="Hold">Hold</option>
                            <option value="Not responding">Not responding</option>
                          </>
                        )}
                      </select>
                      {candidate.status === "Interviewed" && candidate.interviewStage && (
                        <div className="mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 text-center uppercase tracking-wider">
                          {candidate.interviewStage}
                        </div>
                      )}
                      {candidate.status === "Joined" && candidate.joiningDate && (
                        <p className="text-[10px] text-green-600 mt-1 font-medium">
                          Joined: {formatDate(candidate.joiningDate)}
                        </p>
                      )}
                    </td>

                    {/* REMARKS */}
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px]" title={candidate.notes}>
                      {candidate.status === "Rejected" && (
                        <div className="text-xs text-red-600 font-semibold mb-1">
                          Rejected {candidate.rejectedBy ? `By ${candidate.rejectedBy}` : ""}: {candidate.rejectionReason || "N/A"}
                        </div>
                      )}
                      <div className="truncate text-slate-500">
                        {candidate.notes || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4 flex space-x-2">
                      <button
                        onClick={() => handleEdit(candidate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          setCommentModal({
                            candidateId: candidate._id,
                            candidateName: candidate.dynamicFields?.candidateName || "Candidate",
                            comments: candidate.comments || [],
                          })
                        }
                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition relative"
                        title="Add / View Comments"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {candidate.comments?.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                            {candidate.comments.length}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(candidate._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
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
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 gap-4">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-700 font-extrabold">{((currentPage - 1) * limit) + 1}</span> to <span className="text-gray-700 font-extrabold">{Math.min(currentPage * limit, pagination.totalCandidates)}</span> of <span className="text-gray-700 font-extrabold">{pagination.totalCandidates}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all border
                  ${currentPage === 1
                    ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 shadow-sm"
                  }
                `}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </button>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all border
                  ${currentPage === pagination.totalPages
                    ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 shadow-sm"
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
      {
        paginatedCandidates.length === 0 && (
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
        )
      }

      {/* Form */}
      {/* Form rendered conditionally at top level */}

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
        droppedBy={pendingStatusChange?.droppedBy}
        currentRejectedBy={pendingStatusChange?.currentRejectedBy}
        stageNameForHistory={pendingStatusChange?.stageNameForHistory}
        nextStageName={pendingStatusChange?.nextStageName}
      />
      {/* Comment Modal */}
      {commentModal && (
        <CommentModal
          candidateId={commentModal.candidateId}
          candidateName={commentModal.candidateName}
          existingComments={commentModal.comments}
          onClose={() => setCommentModal(null)}
        />
      )}

      {/* Resume Preview Modal */}
      {previewResumeUrl && selectedCandidateForPreview && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[95vw] h-full sm:h-[95vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:flex-row border border-white/20">
            
            {/* Left Section: Resume View (Main) */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-100 relative group">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-slate-200/50 flex items-center gap-3">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    <FileText size={16} />
                  </div>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest truncate max-w-[200px]">
                    {selectedCandidateForPreview.dynamicFields?.candidateName || "Resume"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setPreviewResumeUrl(null);
                  setSelectedCandidateForPreview(null);
                }}
                className="lg:hidden absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/50 text-slate-500"
              >
                <X size={20} />
              </button>

              <iframe
                src={previewResumeUrl}
                className="w-full h-full border-none"
                title="Resume Preview"
              />
            </div>

            {/* Right Section: Quick Actions Sidebar */}
            <div className="w-full lg:w-[380px] bg-white border-l border-slate-100 flex flex-col h-full shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Candidate Overview</h3>
                <button
                  onClick={() => {
                    setPreviewResumeUrl(null);
                    setSelectedCandidateForPreview(null);
                  }}
                  className="hidden lg:flex p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">
                    {selectedCandidateForPreview.dynamicFields?.candidateName || "Unnamed Candidate"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedCandidateForPreview.status === "Joined" ? "bg-green-100 text-green-700" :
                      selectedCandidateForPreview.status === "Rejected" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {selectedCandidateForPreview.status || "New"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-default">
                      <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors shadow-sm">
                        <Mail size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 truncate">{selectedCandidateForPreview.dynamicFields?.Email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-default">
                      <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors shadow-sm">
                        <Phone size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{selectedCandidateForPreview.dynamicFields?.Phone || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requirement Details</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Position</p>
                    <p className="text-sm font-black text-slate-900 mb-3">{selectedCandidateForPreview.jobId?.title || "N/A"}</p>
                    
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">{selectedCandidateForPreview.jobId?.clientId?.companyName || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-slate-50/30 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleStatusChange(selectedCandidateForPreview._id, "Shortlisted");
                      setPreviewResumeUrl(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
                  >
                    <UserCheck size={16} />
                    Shortlist
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedCandidateForPreview._id, "Rejected");
                      setPreviewResumeUrl(null);
                    }}
                    className="px-6 py-3.5 bg-white border border-red-100 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-50 transition-all active:scale-95"
                  >
                    Reject
                  </button>
                </div>
                
                <a
                  href={previewResumeUrl}
                  onClick={() => {
                    setPreviewResumeUrl(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
                >
                  <Download size={16} />
                  Download Resume
                </a>

                <button
                  onClick={() => {
                    setPreviewResumeUrl(null);
                    setSelectedCandidateForPreview(null);
                  }}
                  className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
