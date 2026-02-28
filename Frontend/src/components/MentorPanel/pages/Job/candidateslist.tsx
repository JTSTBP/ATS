import {
  Users,
  Eye,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Download,
  X,
  Trash2,
  Share2,
  Mail,
  Phone,
  Link,
  MessageSquare,
  ChevronDown,
  Search,
  CalendarCheck,
  FileText,
} from "lucide-react";
import { getImageUrl, getFilePreviewUrl } from "../../../../utils/imageUtils";
import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthProvider";
import { useCandidateContext } from "../../../../context/CandidatesProvider";
import { useUserContext } from "../../../../context/UserProvider";
import { useParams, useLocation, useNavigate } from "react-router-dom";


import { toast } from "react-toastify";
import { formatDate } from "../../../../utils/dateUtils";
import { StatusUpdateModal } from "../../../Common/StatusUpdateModal";
import { handleFileDownload } from "../../../../utils/downloadUtils";

// interface Candidate {
//   id: string;
//   name: string;
//   status: string;
//   tags: string[];
//   education: string;
//   location: string;
//   prevLocation: string;
//   keySkills: string[];
//   experience: string;
//   appliedDate: string;
//   shortlisted: boolean;
// }

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
        className={`w-full p-2 border border-gray-300 rounded-lg bg-gray-50 flex justify-between items-center focus:ring-2 focus:ring-blue-500 transition-all ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
      >
        <span className={`text-sm ${selectedOption && selectedOption.value !== 'all' ? "text-gray-800 font-medium" : "text-gray-500"}`}>
          {selectedOption && selectedOption.value !== 'all' ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`px - 3 py - 2 hover: bg - blue - 50 cursor - pointer text - sm transition - colors ${value === opt.value ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'} `}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400 text-xs italic">No matching results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CandidatesList = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // const [viewMode, setViewMode] = useState<"grid" | "list">("list"); // Unused
  const [sortBy, setSortBy] = useState("Relevance");
  const [showCount] = useState("40"); // setShowCount unused
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [filteredList, setFilteredList] = useState([]);
  const [statusFilter, setStatusFilter] = useState(location.state?.status || "all");
  const [interviewStageFilter, setInterviewStageFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [fullFilteredList, setFullFilteredList] = useState([]);
  const [previewResumeUrl, setPreviewResumeUrl] = useState<string | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPocs, setSelectedPocs] = useState<string[]>([]);
  const [emailCandidates, setEmailCandidates] = useState<any[]>([]);
  const [joinStartDate, setJoinStartDate] = useState("");
  const [joinEndDate, setJoinEndDate] = useState("");
  const [selectStartDate, setSelectStartDate] = useState("");
  const [selectEndDate, setSelectEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("all");


  // Status Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'reject' | 'statusChange' | 'shortlist' | 'commentOnly';
    candidateId: string;
    newStatus: string;
    interviewStage?: string;
    currentJoiningDate?: string;
    currentSelectionDate?: string;
    currentExpectedJoiningDate?: string;
    rejectedBy?: string;
    droppedBy?: string;
    stageNameForHistory?: string;
    nextStageName?: string;
  } | null>(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const { user } = useAuth();
  const {
    updateStatus,
    candidates,
    fetchCandidatesByJob,
    loading,
    deleteCandidate,
    addComment,
  } = useCandidateContext();

  const { users } = useUserContext();

  // 1️⃣ Fetch all candidates on load
  useEffect(() => {
    if (id) fetchCandidatesByJob(id);
  }, [id]);

  useEffect(() => {
    if (!candidates || !users || !user || !id) return;

    let filtered;

    // Admin and Manager see all candidates for the job
    if (user.designation === "Admin" || user.designation === "Manager") {
      filtered = candidates.filter((c) => (c.jobId as any)?._id === id);
    } else {
      // Other roles see candidates created by them or their reporting users
      const reportingUsers = users.filter((u) => (u?.reporter as any)?._id === user._id);
      const reportingUserIds = reportingUsers.map((u) => u._id);

      filtered = candidates.filter(
        (c) =>
          ((c.createdBy as any)?._id === user._id ||
            reportingUserIds.includes((c.createdBy as any)?._id)) &&
          (c.jobId as any)?._id === id
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => {
        const s = c.status?.toLowerCase();
        const f = statusFilter.toLowerCase();
        return s === f;
      });
    }

    // Interview Stage Filter
    if (statusFilter === "Interviewed" && interviewStageFilter !== "all") {
      filtered = filtered.filter(
        (c) => (c as any).interviewStage === interviewStageFilter
      );
    }

    // Joining Date Filter
    if (statusFilter === "Joined" && (joinStartDate || joinEndDate)) {
      filtered = filtered.filter((c) => {
        if (!c.joiningDate) return false;
        const jDate = new Date(c.joiningDate);
        if (joinStartDate && jDate < new Date(joinStartDate)) return false;
        if (joinEndDate) {
          const end = new Date(joinEndDate);
          end.setHours(23, 59, 59, 999);
          if (jDate > end) return false;
        }
        return true;
      });
    }

    // Selection Date Filter
    if (statusFilter === "Selected" && (selectStartDate || selectEndDate)) {
      filtered = filtered.filter((c) => {
        if (!c.selectionDate) return false;
        const sDate = new Date(c.selectionDate);
        if (selectStartDate && sDate < new Date(selectStartDate)) return false;
        if (selectEndDate) {
          const end = new Date(selectEndDate);
          end.setHours(23, 59, 59, 999);
          if (sDate > end) return false;
        }
        return true;
      });
    }


    // Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => {
        const name = (c.dynamicFields?.candidateName || "").toLowerCase();
        const email = (c.dynamicFields?.[Object.keys(c.dynamicFields || {}).find(k => k.toLowerCase().includes("email")) || ""] || "").toLowerCase();
        const phone = (c.dynamicFields?.[Object.keys(c.dynamicFields || {}).find(k => k.toLowerCase().includes("phone")) || ""] || "").toLowerCase();
        const skills = (c.dynamicFields?.keySkills || "").toLowerCase();
        return name.includes(lowerSearch) || email.includes(lowerSearch) || phone.includes(lowerSearch) || skills.includes(lowerSearch);
      });
    }

    // Recruiter Filter
    if (recruiterFilter !== "all") {
      filtered = filtered.filter((c) => (c.createdBy as any)?._id === recruiterFilter);
    }

    // Sorting
    if (sortBy === "Name") {
      filtered = filtered.sort((a, b) =>
        (a.dynamicFields?.candidateName || "").localeCompare(
          b.dynamicFields?.candidateName || ""
        )
      );
    } else if (sortBy === "Date") {
      filtered = filtered.sort(
        (a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
      );
    }

    // Save full filtered list before pagination
    setFullFilteredList(filtered as any);
  }, [candidates, users, user, id, statusFilter, sortBy, interviewStageFilter, joinStartDate, joinEndDate, selectStartDate, selectEndDate, searchTerm, recruiterFilter]);


  useEffect(() => {
    const itemsPerPage = parseInt(showCount);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    setFilteredList(fullFilteredList.slice(startIndex, endIndex));
  }, [fullFilteredList, currentPage, showCount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy, showCount, interviewStageFilter]);

  useEffect(() => {
    setSelectedCandidates([]); // clear selection when list changes (e.g., different job or filters)
  }, [filteredList]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (shareMenuOpen && !target.closest(".share-menu-container")) {
        setShareMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [shareMenuOpen]);

  const handleDelete = async (candidateId: string) => {
    if (!user?._id) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this candidate?"
    );
    if (!confirmDelete) return;

    const success = await deleteCandidate(candidateId, user._id);

    if (success) {
      toast.success("Candidate deleted successfully");
    } else {
      toast.error("Failed to delete candidate");
    }
  };

  // Select or deselect all visible candidates (filteredList)
  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredList.length) {
      setSelectedCandidates([]); // unselect all
    } else {
      setSelectedCandidates(filteredList.map((c: any) => c._id)); // select visible ones
    }
  };

  const toggleCandidate = (id: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };
  const totalPages = Math.ceil(fullFilteredList.length / parseInt(showCount));

  const goNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const goPrev = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleRejectCandidate = (candidateId: string) => {
    if (!user?._id) return;
    const candidate = candidates.find(c => c._id === candidateId);
    setPendingAction({
      type: 'reject',
      candidateId,
      newStatus: 'Rejected',
      interviewStage: candidate?.interviewStage,
      rejectedBy: candidate?.status === "Interviewed" ? "Client" : "Mentor",
      stageNameForHistory: candidate?.status === "Interviewed" ? candidate.interviewStage : undefined
    });
    setStatusModalOpen(true);
  };

  const confirmStatusAction = async (comment: string, joiningDate?: string, offerLetter?: File, selectionDate?: string, expectedJoiningDate?: string, rejectedBy?: string, offeredCTC?: string, rejectionReason?: string) => {
    if (!pendingAction) return;

    if (pendingAction.type === 'reject' || pendingAction.type === 'statusChange') {
      // Determine if this is a drop or reject
      const droppedByValue = pendingAction.newStatus === "Dropped" ? pendingAction.droppedBy : undefined;
      const rejectedByValue = pendingAction.newStatus === "Rejected" ? pendingAction.rejectedBy : undefined;

      const success = await updateStatus(
        pendingAction.candidateId,
        rejectedBy ? "Rejected" : pendingAction.newStatus, // If rejectedBy from modal is present during interview update
        user?._id || "",
        pendingAction.interviewStage,
        undefined, // stageStatus will be handled by onConfirm arguments
        undefined, // stageNotes will be handled by onConfirm arguments
        comment,
        joiningDate,
        offerLetter,
        selectionDate,
        expectedJoiningDate,
        rejectedBy || rejectedByValue,
        offeredCTC,
        droppedByValue,
        rejectionReason,
        pendingAction.stageNameForHistory
      );

      if (success) {
        toast.success(`Candidate status updated to ${pendingAction.newStatus} `);
        if (id) fetchCandidatesByJob(id);
        if (selectedCandidate && selectedCandidate._id === pendingAction.candidateId) {
          setSelectedCandidate(null);
        }
      } else {
        toast.error("Failed to update status");
      }
    } else if (pendingAction.type === 'commentOnly') {
      const success = await addComment(
        pendingAction.candidateId,
        user?._id || "",
        comment
      );

      if (success) {
        toast.success("Comment added successfully");
        if (id) fetchCandidatesByJob(id);
      } else {
        toast.error("Failed to add comment");
      }
    } else if (pendingAction.type === 'shortlist') {
      // Handle bulk shortlist if needed, or single
      // For now assuming single for consistency with other parts or loop in the caller
      // But wait, the shortlist button was bulk. The dropdown is single.
      // Let's keep shortlist button as is for now if it's bulk, or update it to loop?
      // The user said "not asking the commant after changing status".
      // The shortlist button is a bulk action. Bulk actions with comments are tricky.
      // Let's focus on the single status change dropdown first.
    }

    setStatusModalOpen(false);
    setPendingAction(null);
  };

  const onMoveToNextClick = (candidate: any) => {
    if (!user?._id || !candidate) return;

    const jobStages = (candidate.jobId as any)?.stages || [];
    const currentStageIndex = jobStages.findIndex((s: any) => s.name === candidate.interviewStage);
    const nextStage = jobStages[currentStageIndex + 1];

    if (nextStage) {
      setPendingAction({
        type: 'statusChange',
        candidateId: candidate._id,
        newStatus: 'Interviewed',
        interviewStage: nextStage.name,
        stageNameForHistory: candidate.interviewStage,
        nextStageName: nextStage.name
      });
      setStatusModalOpen(true);
    } else {
      // Last stage completed -> Selected
      setPendingAction({
        type: 'statusChange',
        candidateId: candidate._id,
        newStatus: 'Selected',
        interviewStage: candidate.interviewStage,
        stageNameForHistory: candidate.interviewStage
      });
      setStatusModalOpen(true);
    }
  };

  // Extract stages from the first candidate (assuming all are for the same job)
  const jobStages =
    candidates && candidates.length > 0 && (candidates[0].jobId as any)?.stages
      ? (candidates[0].jobId as any).stages
      : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Stage Selection Modal Overlay Removed in favor of StatusUpdateModal */}

      {/* Email Selection Modal */}
      {showEmailModal && emailCandidates.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Share {emailCandidates.length} Candidate
                {emailCandidates.length > 1 ? "s" : ""} via Email
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select Client POCs to CC in the email:
            </p>

            <div className="mb-6 max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
              {emailCandidates[0]?.jobId?.clientId?.pocs?.length > 0 ? (
                emailCandidates[0].jobId.clientId.pocs.map((poc: any) => (
                  poc ? (
                    <label
                      key={poc._id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPocs.includes(poc.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPocs([...selectedPocs, poc.email]);
                          } else {
                            setSelectedPocs(
                              selectedPocs.filter((email) => email !== poc.email)
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {poc.name}
                        </div>
                        <div className="text-xs text-gray-500">{poc.email}</div>
                      </div>
                    </label>
                  ) : null
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  No Client POCs found for this job.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!user?.email || !user?.appPassword) {
                    toast.error(
                      "Please configure your App Password in your Profile settings first."
                    );
                    return;
                  }

                  if (selectedPocs.length === 0) {
                    toast.error("Please select at least one recipient.");
                    return;
                  }

                  try {
                    const response = await fetch(
                      `${API_BASE_URL} /api/CandidatesJob / send - email`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          senderEmail: user.email,
                          appPassword: user.appPassword,
                          recipientEmails: selectedPocs,
                          ccEmails: [],
                          candidateIds: emailCandidates.map((c) => c._id),
                        }),
                      }
                    );

                    const data = await response.json();

                    if (data.success) {
                      toast.success("Email sent successfully!");
                      setShowEmailModal(false);
                    } else {
                      toast.error(data.message || "Failed to send email.");
                    }
                  } catch (error) {
                    console.error("Error sending email:", error);
                    toast.error("An error occurred while sending the email.");
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Preview Modal */}
      {previewResumeUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Resume Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFileDownload(previewResumeUrl, "Resume")}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPreviewResumeUrl(null)}
                  className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
              <iframe
                src={previewResumeUrl}
                className="w-full h-full rounded-xl border border-gray-200 bg-white shadow-sm"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-medium self-start lg:self-auto"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm sm:text-base">Back to Jobs</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-2xl lg:ml-8">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              <div className="sm:w-64">
                <SearchableSelect
                  options={[
                    { value: "all", label: "All Recruiters" },
                    ...Array.from(new Set(candidates
                      .filter(c => (c.jobId as any)?._id === id)
                      .map(c => ({
                        value: (c.createdBy as any)?._id,
                        label: (c.createdBy as any)?.name
                      }))
                      .filter(r => {
                        if (!r.value || !r.label) return false;
                        const recruiterUser = users.find(u => u._id === r.value);
                        return recruiterUser && !recruiterUser.isDisabled;
                      })
                      .map(r => JSON.stringify(r))
                    )).map(rJson => JSON.parse(rJson))
                  ]}
                  value={recruiterFilter}
                  onChange={(val) => setRecruiterFilter(val)}
                  placeholder="Select Recruiter"
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 sm:gap-4 lg:gap-8 border-b border-gray-100 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { id: 'all', label: 'All responses' },
              { id: 'New', label: 'New' },
              { id: 'Shortlisted', label: 'Shortlisted' },
              { id: 'Interviewed', label: 'Interviewed' },
              { id: 'Selected', label: 'Selected' },
              { id: 'Joined', label: 'Joined' },
              { id: 'Rejected', label: 'Rejected' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setInterviewStageFilter("all");
                }}
                className={`px-3 sm:px-1 py-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap relative ${statusFilter === tab.id
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                {tab.label}
                {statusFilter === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${statusFilter === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                  {statusFilter === tab.id ? fullFilteredList.length : candidates.filter(c => {
                    const cid = (c.jobId as any)?._id || c.jobId;
                    if (cid !== id) return false;
                    if (tab.id === 'all') return true;
                    return c.status === tab.id;
                  }).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* INTERVIEW STAGE SUB-FILTERS */}
      {statusFilter === "Interviewed" && jobStages.length > 0 && (
        <div className="bg-gray-50 border-b">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3 overflow-x-auto">
            <button
              onClick={() => setInterviewStageFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${interviewStageFilter === "all"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
            >
              All Stages
            </button>
            {jobStages.map((stage: any) => (
              <button
                key={stage._id}
                onClick={() => setInterviewStageFilter(stage.name)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${interviewStageFilter === stage.name
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
              >
                {stage.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-800 font-extrabold">{filteredList.length}</span> candidates
            </div>

            <div className="flex lg:hidden items-center gap-2">
              <button onClick={goPrev} disabled={currentPage === 1} className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-bold font-mono">{currentPage}/{totalPages || 1}</span>
              <button onClick={goNext} disabled={currentPage === totalPages} className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
              >
                <option value="Relevance">Relevance</option>
                <option value="Date">Date</option>
                <option value="Name">Name</option>
              </select>
            </div>

            {(statusFilter === "Joined" || statusFilter === "Selected") && (
              <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                <CalendarCheck size={14} className="text-blue-500" />
                <input
                  type="date"
                  value={statusFilter === "Joined" ? joinStartDate : selectStartDate}
                  onChange={(e) => statusFilter === "Joined" ? setJoinStartDate(e.target.value) : setSelectStartDate(e.target.value)}
                  className="bg-transparent text-[10px] font-bold text-gray-700 focus:outline-none min-w-[100px]"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={statusFilter === "Joined" ? joinEndDate : selectEndDate}
                  onChange={(e) => statusFilter === "Joined" ? setJoinEndDate(e.target.value) : setSelectEndDate(e.target.value)}
                  className="bg-transparent text-[10px] font-bold text-gray-700 focus:outline-none min-w-[100px]"
                />
                {(joinStartDate || joinEndDate || selectStartDate || selectEndDate) && (
                  <button
                    onClick={() => {
                      setJoinStartDate(""); setJoinEndDate("");
                      setSelectStartDate(""); setSelectEndDate("");
                    }}
                    className="p-1 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            <div className="hidden lg:flex items-center gap-3">
              <button disabled={currentPage === 1} onClick={goPrev} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30">
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                <span className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                  {currentPage}
                </span>
                <span className="text-gray-400 text-[10px] font-bold uppercase px-1">of</span>
                <span className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-500 rounded-lg text-xs font-bold border border-gray-100">
                  {totalPages || 1}
                </span>
              </div>
              <button disabled={currentPage === totalPages} onClick={goNext} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        <div className="bg-white border border-gray-100 rounded-2xl mb-6 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4">
            <label className="flex items-center gap-3 cursor-pointer group shrink-0 bg-gray-50/50 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none">
              <input
                type="checkbox"
                checked={filteredList.length > 0 && selectedCandidates.length === filteredList.length}
                onChange={handleSelectAll}
                className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 uppercase tracking-widest">Select All</span>
            </label>

            <div className="h-px sm:h-6 sm:w-px bg-gray-100" />

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={async () => {
                  if (!user?._id || selectedCandidates.length === 0) return;
                  for (const cid of selectedCandidates) await updateStatus(cid, "Shortlisted", user._id);
                  toast.success(`${selectedCandidates.length} shortlisted`);
                  if (id) fetchCandidatesByJob(id);
                  setSelectedCandidates([]);
                }}
                disabled={selectedCandidates.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <UserCheck size={16} /> Shortlist
              </button>

              <button
                onClick={async () => {
                  if (!user?._id || selectedCandidates.length === 0) return;
                  if (!window.confirm(`Reject ${selectedCandidates.length}?`)) return;
                  for (const cid of selectedCandidates) await updateStatus(cid, "Rejected", user._id);
                  toast.success(`${selectedCandidates.length} rejected`);
                  if (id) fetchCandidatesByJob(id);
                  setSelectedCandidates([]);
                }}
                disabled={selectedCandidates.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <X size={16} /> Reject
              </button>

              <button
                onClick={() => {
                  if (selectedCandidates.length === 0) return;
                  const selectedObjs = filteredList.filter((c: any) => selectedCandidates.includes(c._id));
                  setEmailCandidates(selectedObjs);
                  setSelectedPocs([]);
                  setShowEmailModal(true);
                }}
                disabled={selectedCandidates.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <Share2 size={16} /> Share
              </button>

              <button
                onClick={() => {
                  if (selectedCandidates.length === 0) return;
                  const withResume = filteredList.filter((c: any) => selectedCandidates.includes(c._id) && c.resumeUrl);
                  if (withResume.length === 0) { toast.error("No resumes"); return; }
                  withResume.forEach((c: any) => {
                    const link = document.createElement("a");
                    link.href = getImageUrl(c.resumeUrl);
                    link.download = `${c.dynamicFields?.candidateName || "candidate"} _resume.pdf`;
                    link.click();
                  });
                }}
                disabled={selectedCandidates.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <Download size={16} /> Resume
              </button>

              <button
                onClick={async () => {
                  if (!user?._id || selectedCandidates.length === 0) return;
                  if (!window.confirm(`Delete ${selectedCandidates.length}?`)) return;
                  for (const cid of selectedCandidates) await deleteCandidate(cid, user._id);
                  toast.success(`${selectedCandidates.length} deleted`);
                  if (id) fetchCandidatesByJob(id);
                  setSelectedCandidates([]);
                }}
                disabled={selectedCandidates.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-md border border-gray-200">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 font-medium">Fetching candidates...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-md border border-gray-200">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No candidates found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No candidates match your current filters. Try adjusting your
                search or filters.
              </p>
            </div>
          ) : (
            filteredList.map((candidate: any) => (
              <div
                key={candidate._id}
                className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />

                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  {/* Selection & Avatar */}
                  <div className="flex items-center gap-4 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate._id)}
                      onChange={() => toggleCandidate(candidate._id)}
                      className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                    />
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center text-blue-700 font-extrabold shadow-sm border border-blue-100">
                      {candidate.dynamicFields?.candidateName?.substring(0, 2).toUpperCase() || "NA"}
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3
                            className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            {candidate.dynamicFields?.candidateName || "Unnamed Candidate"}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${candidate.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {candidate.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-400">
                          {candidate.dynamicFields?.Email && (
                            <div className="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => window.location.href = `mailto:${candidate.dynamicFields.Email}`}>
                              <Mail size={12} />
                              <span className="truncate max-w-[150px]">{candidate.dynamicFields.Email}</span>
                            </div>
                          )}
                          {candidate.dynamicFields?.Phone && (
                            <div className="flex items-center gap-1.5 hover:text-green-600 transition-colors cursor-pointer" onClick={() => window.location.href = `tel:${candidate.dynamicFields.Phone}`}>
                              <Phone size={12} />
                              <span>{candidate.dynamicFields.Phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Action Badges */}
                        {candidate.interviewStage && (
                          <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">
                            Stage: {candidate.interviewStage}
                          </div>
                        )}
                        {candidate.joiningDate && (
                          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">
                            Joined: {formatDate(candidate.joiningDate)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Tags/Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: 'Skills', value: candidate.dynamicFields?.Skills },
                        { label: 'Experience', value: candidate.dynamicFields?.Experience ? `${candidate.dynamicFields.Experience} Years` : null },
                        { label: 'Current Company', value: candidate.dynamicFields?.currentCompany },
                        { label: 'Upload Date', value: candidate.createdAt ? formatDate(candidate.createdAt) : null },
                        { label: 'Recruiter', value: candidate.createdBy?.name || "System" }
                      ].filter(f => f.value).map((field, idx) => (
                        <div key={idx} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{field.label}</p>
                          <p className="text-xs font-bold text-gray-700 truncate">{field.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex sm:flex-col lg:flex-row items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <button
                      onClick={() => {
                        setPendingAction({ type: 'commentOnly', candidateId: candidate._id, newStatus: candidate.status });
                        setStatusModalOpen(true);
                      }}
                      className="flex-1 sm:flex-none p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 shadow-sm sm:shadow-none"
                    >
                      <MessageSquare size={18} />
                    </button>

                    <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                      <select
                        value={candidate.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          const currentStatus = candidate.status || "New";

                          let droppedByVal = undefined;
                          if (newStatus === "Dropped") {
                            if (currentStatus === "Shortlisted") droppedByVal = "Mentor";
                            else if (["Interviewed", "Selected", "Joined"].includes(currentStatus)) droppedByVal = "Client";
                          }

                          let rejectedByVal = undefined;
                          if (newStatus === "Rejected") {
                            if (currentStatus === "Shortlisted") rejectedByVal = "Mentor";
                            else if (currentStatus === "Interviewed") rejectedByVal = "Client";
                          }

                          if (newStatus.startsWith("MOVE_TO_")) {
                            const nextStageName = newStatus.replace("MOVE_TO_", "");
                            setPendingAction({
                              type: 'statusChange',
                              candidateId: candidate._id,
                              newStatus: 'Interviewed',
                              interviewStage: nextStageName,
                              stageNameForHistory: candidate.interviewStage,
                              nextStageName: nextStageName
                            });
                            setStatusModalOpen(true);
                            return;
                          }

                          setPendingAction({
                            type: 'statusChange',
                            candidateId: candidate._id,
                            newStatus: newStatus,
                            interviewStage: candidate.interviewStage,
                            currentJoiningDate: candidate.joiningDate,
                            currentSelectionDate: candidate.selectionDate,
                            currentExpectedJoiningDate: candidate.expectedJoiningDate,
                            rejectedBy: rejectedByVal,
                            droppedBy: droppedByVal,
                            stageNameForHistory: (newStatus === "Selected" || newStatus === "Rejected") ? candidate.interviewStage : undefined
                          });
                          setStatusModalOpen(true);
                        }}
                        className="w-full px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                      >
                        {candidate.status === "Selected" ? (
                          <>
                            <option value="Selected">Selected</option>
                            <option value="Joined">Joined</option>
                            <option value="Hold">Hold</option>
                            <option value="Dropped">Dropped</option>
                          </>
                        ) : candidate.status === "Joined" ? (
                          <>
                            <option value="Joined">Joined</option>
                            <option value="Dropped">Dropped</option>
                          </>
                        ) : candidate.status === "Interviewed" ? (
                          <>
                            <option value="Interviewed">{candidate.interviewStage || "Interviewed"}</option>
                            {(() => {
                              const jobStages = (candidate.jobId as any)?.stages || [];
                              const currentStageIndex = jobStages.findIndex((s: any) => s.name === candidate.interviewStage);
                              const nextStage = jobStages[currentStageIndex + 1];
                              if (nextStage) {
                                return (
                                  <option value={`MOVE_TO_${nextStage.name}`} className="font-bold text-blue-600">
                                    Move to {nextStage.name}
                                  </option>
                                );
                              } else {
                                return <option value="Selected">Selected</option>;
                              }
                            })()}
                          </>
                        ) : (
                          <>
                            <option value="New">New</option>
                            <option value="Shortlisted">Shortlist</option>
                            <option value="Interviewed">Interview</option>
                            <option value="Selected">Selected</option>
                            <option value="Joined">Joined</option>
                            <option value="Rejected">Rejected</option>
                            {["Shortlisted", "Interviewed", "Dropped"].includes(candidate.status || "") && (
                              <option value="Dropped">Dropped</option>
                            )}
                            <option value="Hold">Hold</option>
                          </>
                        )}
                      </select>

                      {candidate.status === "Interviewed" && (
                        <button
                          onClick={() => onMoveToNextClick(candidate)}
                          className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
                        >
                          <ChevronRight size={12} strokeWidth={3} />
                          {(() => {
                            const jobStages = (candidate.jobId as any)?.stages || [];
                            const currentStageIndex = jobStages.findIndex((s: any) => s.name === candidate.interviewStage);
                            const nextStage = jobStages[currentStageIndex + 1];
                            return nextStage ? `Next: ${nextStage.name}` : "Process Selection";
                          })()}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(candidate._id)}
                      className="flex-1 sm:flex-none p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm sm:shadow-none"
                    >
                      <Trash2 size={18} />
                    </button>

                    <button
                      onClick={() => {
                        setEmailCandidates([candidate]);
                        setSelectedPocs([]);
                        setShowEmailModal(true);
                      }}
                      className="flex-1 sm:flex-none p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 shadow-sm sm:shadow-none"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 text-xl sm:text-2xl font-black border border-blue-100">
                  {selectedCandidate.dynamicFields?.candidateName?.substring(0, 2).toUpperCase() || "NA"}
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                    {selectedCandidate.dynamicFields?.candidateName || "Candidate Details"}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 uppercase tracking-widest">
                      {selectedCandidate.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {selectedCandidate._id.substring(18)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors group"
              >
                <X size={24} className="text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>

            {/* Modal Body Start */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-8">
                  <section>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Candidate Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(selectedCandidate.dynamicFields || {}).map(([key, value]) => (
                        <div key={key} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                          <p className="text-sm font-bold text-slate-700 break-words">{String(value) || "--"}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Activity Log (Combined Status History & Comments) */}
                  <section>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Activity Log
                    </h3>
                    <div className="space-y-4">
                      {[...(selectedCandidate.statusHistory || []), ...(selectedCandidate.comments || []), ...(selectedCandidate.interviewStageHistory || [])]
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((item: any, idx) => (
                          <div key={idx} className="relative pl-6 pb-6 last:pb-0">
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100" />
                            <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full border-2 border-white bg-slate-300" />

                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-900">
                                {item.stageName ? `Interview Stage: ${item.stageName}` : item.status ? `Status changed to ${item.status}` : 'Comment added'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">{formatDate(item.timestamp)}</span>
                            </div>
                            <p className="text-xs text-slate-500 italic">
                              {item.rejectionReason ? `Reason: ${item.rejectionReason}` : (item.comment || item.text || item.notes)}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                              By {item.updatedBy?.name || item.author?.name || "System"}
                            </p>
                          </div>
                        ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Meta & Links */}
                <div className="space-y-6">
                  <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100/50">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Meta Info</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Source Job</p>
                        <p className="text-sm font-bold text-slate-700">{selectedCandidate.jobId?.title || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Added By</p>
                        <p className="text-sm font-bold text-slate-700">{selectedCandidate.createdBy?.name || "System"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedCandidate.resumeUrl && (
                      <button
                        onClick={() => setPreviewResumeUrl(getFilePreviewUrl(selectedCandidate.resumeUrl))}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                      >
                        <Eye size={16} /> Preview Resume
                      </button>
                    )}
                    {selectedCandidate.linkedinUrl && (
                      <a
                        href={selectedCandidate.linkedinUrl}
                        target="_blank"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all"
                      >
                        <Link size={16} /> LinkedIn Profile
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-all order-2 sm:order-1"
              >
                Close
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 order-1 sm:order-2">
                <button
                  onClick={() => handleRejectCandidate(selectedCandidate._id)}
                  className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-100 transition-all border border-red-100"
                >
                  Reject Candidate
                </button>
                <button
                  onClick={() => onMoveToNextClick(selectedCandidate)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  Move to Next Stage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Preview Modal */}
      {previewResumeUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText size={20} />
                </div>
                <h3 className="text-sm sm:text-lg font-black text-slate-900 uppercase tracking-widest">Resume Preview</h3>
              </div>
              <button
                onClick={() => setPreviewResumeUrl(null)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe
                src={previewResumeUrl}
                className="w-full h-full border-none"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}

      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setPendingAction(null);
        }}
        onConfirm={confirmStatusAction}
        newStatus={pendingAction?.newStatus || ""}
        isCommentOnly={pendingAction?.type === 'commentOnly'}
        candidateName={
          pendingAction?.candidateId
            ? (fullFilteredList.find((c: any) => c._id === pendingAction.candidateId) as any)?.dynamicFields?.candidateName
            : ""
        }
        currentJoiningDate={pendingAction?.currentJoiningDate}
        currentSelectionDate={pendingAction?.currentSelectionDate}
        currentExpectedJoiningDate={pendingAction?.currentExpectedJoiningDate}
        droppedBy={pendingAction?.droppedBy}
        currentRejectedBy={pendingAction?.rejectedBy}
        stageNameForHistory={pendingAction?.stageNameForHistory}
        nextStageName={pendingAction?.nextStageName}
      />
    </div>
  );
};

export default CandidatesList;
