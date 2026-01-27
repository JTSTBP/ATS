
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Briefcase, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useAuth } from "../../context/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useJobContext } from "../../context/DataProvider";
import CandidateModal from "./CandidateModal";
import { StatusUpdateModal } from "../Common/StatusUpdateModal";
import { formatDate } from "../../utils/dateUtils";

export default function Candidates() {
  const {
    paginatedCandidates,
    fetchRoleBasedCandidates,
    pagination,
    updateStatus,
    loading
  } = useCandidateContext();
  const { user } = useAuth();
  const { jobs, fetchJobs } = useJobContext();
  const [searchParams] = useSearchParams();

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Status Filter
  const urlStatus = searchParams.get('status');
  const [statusFilter, setStatusFilter] = useState(urlStatus || "All Status");

  // Other Filters
  const urlJobTitle = searchParams.get('jobTitle');
  const [jobTitleFilter, setJobTitleFilter] = useState(urlJobTitle || "All");
  const [clientFilter, setClientFilter] = useState("");
  const [joinStartDate, setJoinStartDate] = useState("");
  const [joinEndDate, setJoinEndDate] = useState("");
  const [selectStartDate, setSelectStartDate] = useState("");
  const [selectEndDate, setSelectEndDate] = useState("");


  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    candidateId: string;
    newStatus: string;
    currentJoiningDate?: string;
    currentSelectionDate?: string;
    currentExpectedJoiningDate?: string;
  } | null>(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update Status Filter from URL
  useEffect(() => {
    if (urlStatus) setStatusFilter(urlStatus);
    if (urlJobTitle) setJobTitleFilter(urlJobTitle);
  }, [urlStatus, urlJobTitle]);

  // Fetch Candidates (Server Side)
  useEffect(() => {
    if (user?._id) {
      // Fetch Jobs for Dropdowns
      fetchJobs();

      // Fetch Paginated Candidates
      fetchRoleBasedCandidates(
        user._id,
        user.designation || "Recruiter", // Default to Recruiter if missing
        1, // Reset to page 1 on filter change
        10,
        {
          search: debouncedSearch,
          status: statusFilter === "All Status" ? undefined : statusFilter,
          client: clientFilter,
          jobTitle: jobTitleFilter === "All" ? undefined : jobTitleFilter,
          joinStartDate,
          joinEndDate,
          selectStartDate,
          selectEndDate
        }
      );
    }
  }, [user, debouncedSearch, statusFilter, clientFilter, jobTitleFilter, joinStartDate, joinEndDate, selectStartDate, selectEndDate]);




  // Handle Page Change
  const handlePageChange = (newPage: number) => {
    if (user?._id && newPage >= 1 && newPage <= pagination.totalPages) {
      fetchRoleBasedCandidates(
        user._id,
        user.designation || "Recruiter",
        newPage,
        10,
        {
          search: debouncedSearch,
          status: statusFilter === "All Status" ? undefined : statusFilter,
          client: clientFilter,
          jobTitle: jobTitleFilter === "All" ? undefined : jobTitleFilter,
          joinStartDate,
          joinEndDate,
          selectStartDate,
          selectEndDate
        }
      );
    }
  };




  const handleStatusChange = (
    candidateId: string,
    newStatus: string,
    currentJoiningDate?: string,
    currentSelectionDate?: string,
    currentExpectedJoiningDate?: string
  ) => {
    setPendingStatusChange({
      candidateId,
      newStatus,
      currentJoiningDate,
      currentSelectionDate,
      currentExpectedJoiningDate
    });
    setStatusModalOpen(true);
  };

  const confirmStatusChange = async (comment: string, joiningDate?: string, offerLetter?: File, selectionDate?: string, expectedJoiningDate?: string, rejectedBy?: string) => {
    if (!pendingStatusChange) return;

    await updateStatus(
      pendingStatusChange.candidateId,
      pendingStatusChange.newStatus,
      user?._id || "",
      undefined, // interviewStage
      undefined, // stageStatus
      undefined, // stageNotes
      comment, // comment
      joiningDate,
      offerLetter,
      selectionDate,
      expectedJoiningDate,
      rejectedBy
    );

    // Refetch current page after update
    if (user?._id) {
      fetchRoleBasedCandidates(
        user._id,
        user.designation || "Recruiter",
        pagination.currentPage, // Stay on current page
        10,
        {
          search: debouncedSearch,
          status: statusFilter === "All Status" ? undefined : statusFilter,
          client: clientFilter,
          jobTitle: jobTitleFilter === "All" ? undefined : jobTitleFilter,
          joinStartDate,
          joinEndDate,
          selectStartDate,
          selectEndDate

        }
      );
    }

    setStatusModalOpen(false);
    setPendingStatusChange(null);
  };

  // 📋 Get Unique Job Titles from JOBS Context (not candidate list)
  const uniqueJobTitles = useMemo(() => {
    // Only show jobs this recruiter has access to (which they seemingly do via fetchJobs)
    // Or simpler: Extract from fetched jobs
    const titles = new Set<string>();
    jobs.forEach((j) => titles.add(j.title));
    return Array.from(titles);
  }, [jobs]);

  // 🏢 Get Unique Clients from JOBS Context
  const uniqueClients = useMemo(() => {
    const clients = new Set<string>();
    jobs.forEach((j) => {
      if (j.clientId?.companyName) clients.add(j.clientId.companyName);
    });
    return Array.from(clients).sort();
  }, [jobs]);


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          List of All Candidates
        </h1>
        <p className="text-slate-600 mb-8">
          Manage and track your candidate pipeline
        </p>

        <div className="bg-white/80 backdrop-blur-xl shadow-xl border border-slate-200 rounded-2xl overflow-hidden">
          {/* 🔍 Top Controls */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search Box */}
              <div className="md:col-span-4 relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                />
              </div>

              {/* Filters */}
              <div className="md:col-span-8 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={jobTitleFilter}
                    onChange={(e) => setJobTitleFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm appearance-none cursor-pointer"
                  >
                    <option value="All">All Jobs</option>
                    {uniqueJobTitles.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm appearance-none cursor-pointer"
                  >
                    <option value="">All Clients</option>
                    {uniqueClients.map((client) => (
                      <option key={client} value={client}>
                        {client}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-400"></div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm appearance-none cursor-pointer"
                  >
                    <option>All Status</option>
                    <option>Shortlisted</option>
                    <option>Interview</option>
                    <option>Under Review</option>
                    <option>New</option>
                    <option>Rejected</option>
                    <option>Selected</option>
                    <option>Joined</option>
                    <option>Hold</option>
                  </select>
                </div>

                {statusFilter === "Joined" && (
                  <>
                    <div className="relative flex-1">
                      <input
                        type="date"
                        value={joinStartDate}
                        onChange={(e) => setJoinStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                        title="Joining Date From"
                      />
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="date"
                        value={joinEndDate}
                        onChange={(e) => setJoinEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                        title="Joining Date To"
                      />
                    </div>
                  </>
                )}

                {statusFilter === "Selected" && (
                  <>
                    <div className="relative flex-1">
                      <input
                        type="date"
                        value={selectStartDate}
                        onChange={(e) => setSelectStartDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                        title="Selection Date From"
                      />
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="date"
                        value={selectEndDate}
                        onChange={(e) => setSelectEndDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                        title="Selection Date To"
                      />
                    </div>
                  </>
                )}

                {(joinStartDate || joinEndDate || selectStartDate || selectEndDate) && (
                  <button
                    onClick={() => {
                      setJoinStartDate("");
                      setJoinEndDate("");
                      setSelectStartDate("");
                      setSelectEndDate("");
                    }}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 📊 Candidates Grid */}
          <div className="p-6 bg-slate-50/50 min-h-[400px]">
            {loading ? (
              <div className="flex justify-center py-12">
                <p>Loading candidates...</p>
              </div>
            ) : paginatedCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No candidates found</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Try adjusting your filters or search query to find what's you're looking for.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="bg-slate-100 rounded-xl border border-slate-200 p-4 hidden md:block">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Name</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Company</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</p>
                    </div>
                  </div>
                </div>

                {paginatedCandidates.map((candidate, index) => {
                  // 🧠 Smart Field Mapping
                  const dynamicKeys = Object.keys(candidate.dynamicFields || {});

                  // 1. Find Name (look for 'name' in key, or take first key)
                  const nameKey = dynamicKeys.find(k => k.toLowerCase().includes("name")) || dynamicKeys[0];
                  const nameValue = candidate.dynamicFields?.[nameKey] || "Unknown Candidate";

                  // 2. Find Email field
                  const emailKey = dynamicKeys.find(k => k.toLowerCase().includes("email"));
                  const emailValue = (emailKey && candidate.dynamicFields?.[emailKey]) || "--";

                  // 3. Find Phone field
                  const phoneKey = dynamicKeys.find(k => k.toLowerCase().includes("phone"));
                  const phoneValue = (phoneKey && candidate.dynamicFields?.[phoneKey]) || "--";

                  // 4. Find Company field
                  let companyKey = dynamicKeys.find(k => k.toLowerCase() === "current company");
                  if (!companyKey) companyKey = dynamicKeys.find(k => k.toLowerCase() === "company");
                  if (!companyKey) companyKey = dynamicKeys.find(k => k.toLowerCase().includes("company"));

                  const companyValue = (companyKey && candidate.dynamicFields?.[companyKey]) || (candidate as any).currentCompany || "Not Specified";

                  // Safe Access to Job Title and Client (might be populated objects)
                  const jobTitle = (candidate.jobId as any)?.title || "No Job Title";
                  // Note: The new endpoint returns jobId as object with clientId as object.

                  return (
                    <motion.div
                      key={candidate._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setIsModalOpen(true);
                      }}
                      className="relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 group cursor-pointer"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">

                        {/* Col 1: Avatar & Name (Span 3) */}
                        <div className="col-span-12 md:col-span-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                            {(nameValue as string).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-base leading-tight truncate" title={nameValue}>
                              {nameValue}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <Briefcase size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{jobTitle}</span>
                            </p>
                          </div>
                        </div>

                        {/* Col 2: Company Name (Span 2) */}
                        <div className="col-span-12 md:col-span-2 min-w-0">
                          <p className="text-sm text-slate-700 font-medium truncate" title={companyValue}>
                            {companyValue}
                          </p>
                        </div>

                        {/* Col 3: Email (Span 3) */}
                        <div className="col-span-12 md:col-span-3 min-w-0">
                          <p className="text-sm text-slate-700 font-medium truncate" title={emailValue}>
                            {emailValue}
                          </p>
                        </div>

                        {/* Col 4: Phone (Span 2) */}
                        <div className="col-span-12 md:col-span-2 min-w-0">
                          <p className="text-sm text-slate-700 font-medium truncate" title={phoneValue}>
                            {phoneValue}
                          </p>
                        </div>

                        {/* Col 5: Status (Span 2) - Read Only */}
                        <div className="col-span-12 md:col-span-2 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={candidate.status || "New"}
                            onChange={(e) => handleStatusChange(
                              candidate._id || "",
                              e.target.value,
                              candidate.joiningDate,
                              candidate.selectionDate,
                              candidate.expectedJoiningDate
                            )}
                            className={`w-full px-2 py-1.5 rounded-lg text-xs font-medium border outline-none cursor-pointer appearance-none ${candidate.status === "New"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : (candidate.status === "Interview" || candidate.status === "Interviewed")
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : candidate.status === "Shortlisted"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : candidate.status === "Rejected"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : candidate.status === "Selected"
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                      : (candidate.status === "Hired" || candidate.status === "Joined")
                                        ? "bg-teal-50 text-teal-700 border-teal-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                          >
                            <option value="New">New</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interviewed">Interviewed</option>
                            <option value="Selected">Selected</option>
                            <option value="Joined">Joined</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Hold">Hold</option>
                          </select>
                          {candidate.status === "Joined" && candidate.joiningDate && (
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <p className="text-[10px] text-teal-600 font-medium whitespace-nowrap">
                                Joined: {formatDate(candidate.joiningDate)}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(candidate._id || "", "Joined", candidate.joiningDate);
                                }}
                                className="text-teal-600 hover:text-teal-800"
                                title="Edit Joining Date"
                              >
                                <Filter size={10} className="inline" /> {/* Using Filter as Edit icon placeholder since Edit isn't imported here? Wait, let me check imports. */}
                              </button>
                            </div>
                          )}
                          {candidate.status === "Selected" && candidate.selectionDate && (
                            <div className="flex flex-col items-center mt-0.5 space-y-0.5">
                              <div className="flex items-center justify-center gap-1">
                                <p className="text-[10px] text-indigo-600 font-medium whitespace-nowrap">
                                  Selected: {formatDate(candidate.selectionDate)}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(candidate._id || "", "Selected", undefined, candidate.selectionDate, candidate.expectedJoiningDate);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800"
                                  title="Edit Selection Date"
                                >
                                  <Briefcase size={10} className="inline" /> {/* Placeholder icon */}
                                </button>
                              </div>
                              {candidate.expectedJoiningDate && (
                                <p className="text-[10px] text-indigo-500 font-medium whitespace-nowrap">
                                  Exp. Join: {formatDate(candidate.expectedJoiningDate)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalCandidates > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-500">
                  Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCandidates)} of {pagination.totalCandidates} candidates
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition
                            ${pagination.currentPage === 1
                        ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                        : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
                      }`}
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
                      }`}
                  >
                    Next
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </motion.div >

      <AnimatePresence>
        {isModalOpen && selectedCandidate && (
          <CandidateModal
            job={
              // If jobId is populated object, use it. If string, find in jobs.
              (typeof selectedCandidate.jobId === 'object' ? selectedCandidate.jobId : jobs.find(j => j._id === selectedCandidate.jobId)) || {} as any
            }
            candidate={selectedCandidate}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedCandidate(null);
            }}
            onSave={() => {
              setIsModalOpen(false);
              setSelectedCandidate(null);
              // Refetch current page
              if (user?._id) {
                fetchRoleBasedCandidates(
                  user._id,
                  user.designation || "Recruiter",
                  pagination.currentPage,
                  10,
                  {
                    search: debouncedSearch,
                    status: statusFilter === "All Status" ? undefined : statusFilter,
                    client: clientFilter,
                    jobTitle: jobTitleFilter === "All" ? undefined : jobTitleFilter
                  }
                );
              }
            }}
          />
        )}
      </AnimatePresence>

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
    </>
  );
}
