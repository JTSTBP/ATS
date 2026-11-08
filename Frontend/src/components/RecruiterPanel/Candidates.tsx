import CandidateProfileCard, { CandidateStatusTabs } from '../Common/CandidateProfileCard';
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Upload,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useAuth } from "../../context/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useJobContext } from "../../context/DataProvider";
import CandidateModal from "./CandidateModal";
import { StatusUpdateModal } from "../Common/StatusUpdateModal";
import { CommentModal } from "../Common/CommentModal";
import { formatDate } from "../../utils/dateUtils";
import { getFilePreviewUrl, isWordDocument } from "../../utils/imageUtils";
import { toast } from "react-toastify";

// 🔹 Searchable Select Component
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const myRef = useState(() => ({ current: null as HTMLDivElement | null }))[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (myRef.current && !myRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [myRef]);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={myRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2 border border-slate-200 rounded-lg bg-white flex justify-between items-center focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
      >
        <span className={`text-sm ${selectedOption && selectedOption.value !== 'all' && selectedOption.value !== 'All Status' && selectedOption.value !== 'All' ? "text-slate-800 font-medium" : "text-slate-400"}`}>
          {selectedOption && selectedOption.value !== 'all' && selectedOption.value !== 'All Status' && selectedOption.value !== 'All' ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${value === opt.value ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-700'}`}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs italic">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Candidates() {
  const {
    statusCounts,
    paginatedCandidates,
    fetchRoleBasedCandidates,
    pagination,
    loading
  } = useCandidateContext();
  const { user } = useAuth();
  const { jobs, fetchJobs } = useJobContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
  const [statusLoading, setStatusLoading] = useState(false);

  // Comment Modal State
  const [commentModal, setCommentModal] = useState<{ candidateId: string; candidateName: string; comments: any[] } | null>(null);

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
        user.designation || "Recruiter",
        1,
        10,
        {
          search: debouncedSearch,
          status: statusFilter === "All Status" ? undefined : statusFilter,
          client: clientFilter === "" ? undefined : clientFilter,
          jobTitle: jobTitleFilter === "All" ? undefined : jobTitleFilter,
          startDate,
          endDate,
          joinStartDate,
          joinEndDate,
          selectStartDate,
          selectEndDate
        }
      );
    }
  }, [user, debouncedSearch, statusFilter, clientFilter, jobTitleFilter, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate, fetchJobs, fetchRoleBasedCandidates]);

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
          client: clientFilter === "" ? undefined : clientFilter,
          jobTitle: jobTitleFilter === "All" ? undefined : jobTitleFilter,
          startDate,
          endDate,
          joinStartDate,
          joinEndDate,
          selectStartDate,
          selectEndDate
        }
      );
    }
  };

  const confirmStatusChange = async (comment: string, joiningDate?: string, offerLetter?: File, selectionDate?: string, expectedJoiningDate?: string, rejectedBy?: string, ctc?: string, rejectionReason?: string) => {
    if (!pendingStatusChange || !user?._id) return;

    setStatusLoading(true);
    try {
      const result = await useCandidateContext().updateStatus(
        pendingStatusChange.candidateId,
        pendingStatusChange.newStatus,
        user.designation || "Recruiter",
        undefined, // interviewStage
        undefined, // stageStatus
        undefined, // stageNotes
        comment,
        joiningDate,
        offerLetter,
        selectionDate,
        expectedJoiningDate,
        rejectedBy,
        ctc,
        undefined, // droppedBy
        rejectionReason
      );

      if (result) {
        setStatusModalOpen(false);
        setPendingStatusChange(null);
        // Refresh list
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
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  // 📋 Get Unique Job Titles from JOBS Context
  const uniqueJobTitles = useMemo(() => {
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
      <motion.div className="admin-candidate-design role-candidate-design"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 leading-tight">
              Candidates
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Manage and track your candidate pipeline
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/Recruiter/upload-source-candidate")}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md hover:shadow-emerald-200/50 font-semibold"
            >
              <Upload size={20} />
              <span>Upload Source Candidate</span>
            </button>
          </div>
        </div>

        <div className="candidate-list-shell">
          {/* 🔍 Top Controls */}
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/30">
            <div className="space-y-6">
              {/* Search Bar Row */}
              <div className="relative group">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all text-sm font-medium"
                />
              </div>

              {/* Filters Grid Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 font-mono">Client</label>
                  <SearchableSelect
                    options={[
                      { value: '', label: 'All Clients' },
                      ...uniqueClients.map(c => ({ value: c, label: c }))
                    ]}
                    value={clientFilter}
                    onChange={(val) => setClientFilter(val)}
                    placeholder="All Clients"
                  />
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 font-mono">Designation</label>
                  <SearchableSelect
                    options={[
                      { value: 'All', label: 'All Designations' },
                      ...uniqueJobTitles.map(t => ({ value: t, label: t }))
                    ]}
                    value={jobTitleFilter}
                    onChange={(val) => setJobTitleFilter(val)}
                    placeholder="All Designations"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 font-mono">Upload From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 font-mono">Upload To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all font-medium"
                  />
                </div>
              </div>

              {/* Status Tabs Row (Direct Filtration) */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 font-mono">Status Filter</label>
                <CandidateStatusTabs value={statusFilter} onChange={status => { setStatusFilter(status);  }} counts={statusCounts} allValue="All Status" />
              </div>
            </div>

            {/* Conditional Date Filters Row */}
            {(statusFilter === "Joined" || statusFilter === "Selected") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 animate-in fade-in slide-in-from-top-2 duration-300 mt-6 px-1">
                {statusFilter === "Joined" && (
                  <>
                    <div className="lg:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest ml-1 font-mono">Joined From</label>
                      <input
                        type="date"
                        value={joinStartDate}
                        onChange={(e) => setJoinStartDate(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-teal-100 rounded-xl bg-teal-50/30 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 shadow-sm transition-all font-medium"
                      />
                    </div>
                    <div className="lg:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest ml-1 font-mono">Joined To</label>
                      <input
                        type="date"
                        value={joinEndDate}
                        onChange={(e) => setJoinEndDate(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-teal-100 rounded-xl bg-teal-50/30 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 shadow-sm transition-all font-medium"
                      />
                    </div>
                  </>
                )}
                {statusFilter === "Selected" && (
                  <>
                    <div className="lg:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest ml-1 font-mono">Selected From</label>
                      <input
                        type="date"
                        value={selectStartDate}
                        onChange={(e) => setSelectStartDate(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-indigo-100 rounded-xl bg-indigo-50/30 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all font-medium"
                      />
                    </div>
                    <div className="lg:col-span-3 space-y-1.5">
                      <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest ml-1 font-mono">Selected To</label>
                      <input
                        type="date"
                        value={selectEndDate}
                        onChange={(e) => setSelectEndDate(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-indigo-100 rounded-xl bg-indigo-50/30 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm transition-all font-medium"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reset Filters Row */}
            {(searchTerm || clientFilter || jobTitleFilter !== "All" || statusFilter !== "All Status" || startDate || endDate || joinStartDate || joinEndDate || selectStartDate || selectEndDate) && (
              <div className="flex justify-end pt-4 border-t border-slate-100/50 mt-4">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setClientFilter("");
                    setJobTitleFilter("All");
                    setStatusFilter("All Status");
                    setStartDate("");
                    setEndDate("");
                    setJoinStartDate("");
                    setJoinEndDate("");
                    setSelectStartDate("");
                    setSelectEndDate("");
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 hover:text-slate-800 transition-all shadow-sm border border-slate-200"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* 📊 Candidates Table */}
          <div className="candidate-list-content">
            {loading ? (
              <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : paginatedCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No candidates found</h3>
                <p className="text-slate-500 max-w-sm mx-auto p-4">
                  Adjust your filters or search query to see results.
                </p>
              </div>
            ) : (
              <section className="candidate-profile-list" aria-label="Candidate profiles" aria-busy={loading}>{paginatedCandidates.map((candidate) => {
                    return (
                      <CandidateProfileCard key={candidate._id} candidate={candidate}
onOpen={() => { setSelectedCandidate(candidate); setIsModalOpen(true); }}
resume={<>{candidate.resumeUrl ? (
                            <a
                              href={getFilePreviewUrl(candidate.resumeUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Optional: Show toast for Word docs preview
                                if (candidate.resumeUrl && isWordDocument(candidate.resumeUrl)) {
                                  toast.info("Opening Word document preview");
                                }
                              }}
                            >
                              <Upload size={14} />
                              {isWordDocument(candidate.resumeUrl) ? 'Download Resume' : 'View Resume'}
                            </a>
                          ) : (
                            <span className="text-slate-300 text-xs font-medium">No Resume</span>
                          )}</>}
status={<><div
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border text-center whitespace-nowrap inline-block min-w-[100px] ${candidate.status === "New" ? "bg-blue-50 text-blue-700 border-blue-100" :
                              candidate.status === "Interviewed" ? "bg-purple-50 text-purple-700 border-purple-100" :
                                candidate.status === "Shortlisted" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                  candidate.status === "Rejected" ? "bg-red-50 text-red-700 border-red-100" :
                                    candidate.status === "Selected" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                      candidate.status === "Joined" ? "bg-teal-50 text-teal-700 border-teal-100" :
                                        candidate.status === "Dropped" ? "bg-orange-50 text-orange-700 border-orange-100" :
                                          "bg-slate-50 text-slate-700 border-slate-100"
                              }`}
                          >
                            {candidate.status || "New"}
                          </div></>}
actions={<><button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCommentModal({
                                candidateId: candidate._id as string,
                                candidateName: (candidate.dynamicFields as any)?.[Object.keys(candidate.dynamicFields || {}).find((k) => k.toLowerCase().includes("name")) || ""] || "Candidate",
                                comments: (candidate as any).comments || [],
                              });
                            }}
                            className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-700 transition relative"
                            title="Add / View Comments"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {(candidate as any).comments?.length > 0 && <span className="absolute -top-1 -right-1 rounded-full bg-orange-500 px-1 text-[9px] text-white">{(candidate as any).comments.length}</span>}
                          </button></>}
details={<>{statusFilter === "Joined" && (
                          <>
                            <div className="candidate-extra-field" data-label="Offer letter">
                              {(candidate as any).offerLetter ? (
                                <a
                                  href={getFilePreviewUrl((candidate as any).offerLetter)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={isWordDocument((candidate as any).offerLetter)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg text-xs font-bold hover:bg-teal-100 transition-colors border border-teal-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if ((candidate as any).offerLetter && isWordDocument((candidate as any).offerLetter)) {
                                      toast.info("File is downloaded");
                                    }
                                  }}
                                >
                                  <Upload size={14} />
                                  {isWordDocument((candidate as any).offerLetter) ? 'Download' : 'View'}
                                </a>
                              ) : "--"}
                            </div>
                            <div className="candidate-extra-field" data-label="Joining date">
                              {(candidate as any).joiningDate ? formatDate((candidate as any).joiningDate) : "--"}
                            </div>
                          </>
                        )}
{statusFilter === "Selected" && (
                          <>
                            <div className="candidate-extra-field" data-label="Selection date">
                              {(candidate as any).selectionDate ? formatDate((candidate as any).selectionDate) : "--"}
                            </div>
                            <div className="candidate-extra-field" data-label="Expected joining date">
                              {(candidate as any).expectedJoiningDate ? formatDate((candidate as any).expectedJoiningDate) : "--"}
                            </div>
                          </>
                        )}</>}
/>
                    );
                  })}</section>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.totalCandidates > 0 && (
            <div className="px-4 py-4 sm:px-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono text-center sm:text-left">
                Showing {((pagination.currentPage - 1) * 10) + 1} - {Math.min(pagination.currentPage * 10, pagination.totalCandidates)} of {pagination.totalCandidates} candidates
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className={`p-2 rounded-xl transition-all ${pagination.currentPage === 1 ? "text-gray-200 cursor-not-allowed" : "text-gray-600 hover:bg-white hover:shadow-md active:scale-95 border border-gray-200"
                    }`}
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1.5 overflow-x-auto sm:overflow-visible max-w-[200px] sm:max-w-none px-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) pageNum = i + 1;
                    else if (pagination.currentPage <= 3) pageNum = i + 1;
                    else if (pagination.currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                    else pageNum = pagination.currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all shrink-0 ${pagination.currentPage === pageNum ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-gray-500 border border-gray-100 hover:border-blue-300 active:scale-95"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className={`p-2 rounded-xl transition-all ${pagination.currentPage === pagination.totalPages ? "text-gray-200 cursor-not-allowed" : "text-gray-600 hover:bg-white hover:shadow-md active:scale-95 border border-gray-200"
                    }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && selectedCandidate && (
          <CandidateModal
            job={
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
        isLoading={statusLoading}
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
    </>
  );
}
