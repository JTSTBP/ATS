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
  Edit,
  ChevronDown,
  Search,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthProvider";
import { useCandidateContext } from "../../../../context/CandidatesProvider";
import { useUserContext } from "../../../../context/UserProvider";
import { useParams, useLocation, useNavigate } from "react-router-dom";


import { toast } from "react-toastify";
import { formatDate } from "../../../../utils/dateUtils";
import { StatusUpdateModal } from "../../../Common/StatusUpdateModal";

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
                  className={`px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${value === opt.value ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'}`}
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
  const [showStageSelection, setShowStageSelection] = useState(false);
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
    currentJoiningDate?: string;
    currentSelectionDate?: string;
    currentExpectedJoiningDate?: string;
    droppedBy?: string;
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

    // Admin sees all candidates for the job
    if (user.designation === "Admin") {
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
    setPendingAction({ type: 'reject', candidateId, newStatus: 'Rejected' });
    setStatusModalOpen(true);
  };

  const confirmStatusAction = async (comment: string, joiningDate?: string, offerLetter?: File, selectionDate?: string, expectedJoiningDate?: string, rejectedBy?: string, offeredCTC?: string) => {
    if (!pendingAction) return;

    if (pendingAction.type === 'reject' || pendingAction.type === 'statusChange') {
      // Determine if this is a drop or reject
      const isDropped = pendingAction.newStatus === "Dropped";
      const droppedByValue = isDropped ? pendingAction.droppedBy : undefined;
      const rejectedByValue = !isDropped ? rejectedBy : undefined;

      const success = await updateStatus(
        pendingAction.candidateId,
        pendingAction.newStatus,
        user?._id || "",
        undefined,
        undefined,
        undefined,
        comment,
        joiningDate,
        offerLetter,
        selectionDate, // Add selectionDate
        expectedJoiningDate, // Add expectedJoiningDate
        rejectedByValue,
        offeredCTC,
        droppedByValue
      );

      if (success) {
        toast.success(`Candidate status updated to ${pendingAction.newStatus}`);
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

  const onMoveToNextClick = () => {
    if (!user?._id) return;
    if (selectedCandidate?.jobId?.stages?.length > 0) {
      setShowStageSelection(true);
    } else {
      // Fallback logic if no stages defined
      updateStatus(selectedCandidate._id, "Shortlisted", user._id);
      // or just open standard status selector
    }
  };

  // Extract stages from the first candidate (assuming all are for the same job)
  const jobStages =
    candidates && candidates.length > 0 && (candidates[0].jobId as any)?.stages
      ? (candidates[0].jobId as any).stages
      : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Stage Selection Modal Overlay */}
      {showStageSelection && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-2">
              Move to Interview Stage
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Select a stage, status, and add notes for this candidate's
              progression
            </p>

            {/* Stage Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Interview Stage
              </label>
              <div className="space-y-2">
                {selectedCandidate.jobId.stages.map((stage: any) => (
                  stage ? (
                    <button
                      key={stage._id}
                      onClick={() => {
                        // Store selected stage in state
                        const stageInput = document.getElementById(
                          "selected-stage"
                        ) as HTMLInputElement;
                        if (stageInput) stageInput.value = stage.name;

                        // Visual feedback
                        document
                          .querySelectorAll("[data-stage-btn]")
                          .forEach((btn) => {
                            btn.classList.remove(
                              "bg-blue-50",
                              "border-blue-300",
                              "ring-2",
                              "ring-blue-200"
                            );
                            btn.classList.add("bg-white", "border-gray-200");
                          });
                        (document.activeElement as HTMLElement)?.classList.add(
                          "bg-blue-50",
                          "border-blue-300",
                          "ring-2",
                          "ring-blue-200"
                        );
                      }}
                      data-stage-btn
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition flex justify-between items-center"
                    >
                      <span className="font-medium">{stage.name}</span>
                      <span className="text-xs text-gray-500">
                        {stage.responsible}
                      </span>
                    </button>
                  ) : null
                ))}
              </div>
              <input type="hidden" id="selected-stage" />
            </div>

            {/* Status Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stage Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const statusInput = document.getElementById(
                      "selected-status"
                    ) as HTMLInputElement;
                    if (statusInput) statusInput.value = "Selected";

                    // Visual feedback
                    document
                      .getElementById("status-selected")
                      ?.classList.add(
                        "bg-green-50",
                        "border-green-500",
                        "ring-2",
                        "ring-green-200"
                      );
                    document
                      .getElementById("status-rejected")
                      ?.classList.remove(
                        "bg-red-50",
                        "border-red-500",
                        "ring-2",
                        "ring-red-200"
                      );
                  }}
                  id="status-selected"
                  className="px-4 py-3 rounded-lg border-2 border-gray-200 bg-white hover:bg-green-50 hover:border-green-300 transition flex items-center justify-center gap-2 font-medium"
                >
                  <span className="text-green-600">✓</span>
                  Selected
                </button>
                <button
                  onClick={() => {
                    const statusInput = document.getElementById(
                      "selected-status"
                    ) as HTMLInputElement;
                    if (statusInput) statusInput.value = "Rejected";

                    // Visual feedback
                    document
                      .getElementById("status-rejected")
                      ?.classList.add(
                        "bg-red-50",
                        "border-red-500",
                        "ring-2",
                        "ring-red-200"
                      );
                    document
                      .getElementById("status-selected")
                      ?.classList.remove(
                        "bg-green-50",
                        "border-green-500",
                        "ring-2",
                        "ring-green-200"
                      );
                  }}
                  id="status-rejected"
                  className="px-4 py-3 rounded-lg border-2 border-gray-200 bg-white hover:bg-red-50 hover:border-red-300 transition flex items-center justify-center gap-2 font-medium"
                >
                  <span className="text-red-600">✗</span>
                  Rejected
                </button>
              </div>
              <input type="hidden" id="selected-status" />
            </div>

            {/* Notes/Comments */}
            <div className="mb-6">
              <label
                htmlFor="stage-notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notes / Comments
              </label>
              <textarea
                id="stage-notes"
                rows={4}
                placeholder="Add any comments or reasons for this decision..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowStageSelection(false);
                  // Reset form
                  const stageInput = document.getElementById(
                    "selected-stage"
                  ) as HTMLInputElement;
                  const statusInput = document.getElementById(
                    "selected-status"
                  ) as HTMLInputElement;
                  const notesInput = document.getElementById(
                    "stage-notes"
                  ) as HTMLTextAreaElement;
                  if (stageInput) stageInput.value = "";
                  if (statusInput) statusInput.value = "";
                  if (notesInput) notesInput.value = "";
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!user?._id) return;

                  const stageInput = document.getElementById(
                    "selected-stage"
                  ) as HTMLInputElement;
                  const statusInput = document.getElementById(
                    "selected-status"
                  ) as HTMLInputElement;
                  const notesInput = document.getElementById(
                    "stage-notes"
                  ) as HTMLTextAreaElement;

                  const stageName = stageInput?.value;
                  const stageStatus = statusInput?.value as
                    | "Selected"
                    | "Rejected";
                  const stageNotes = notesInput?.value || "";

                  if (!stageName) {
                    toast.error("Please select an interview stage");
                    return;
                  }

                  if (!stageStatus) {
                    toast.error(
                      "Please select a status (Selected or Rejected)"
                    );
                    return;
                  }

                  const success = await updateStatus(
                    selectedCandidate._id,
                    "Interviewed",
                    user._id,
                    stageName,
                    stageStatus,
                    stageNotes
                  );

                  if (success) {
                    toast.success(`Moved to ${stageName} - ${stageStatus}`);
                    if (id) fetchCandidatesByJob(id);
                    setShowStageSelection(false);
                    setSelectedCandidate(null);

                    // Reset form
                    if (stageInput) stageInput.value = "";
                    if (statusInput) statusInput.value = "";
                    if (notesInput) notesInput.value = "";
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Confirm & Move
              </button>
            </div>
          </div>
        </div>
      )}

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
                      `${API_BASE_URL}/api/CandidatesJob/send-email`,
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
                <a
                  href={previewResumeUrl}
                  download
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </a>
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

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Jobs
          </button>

          <div className="flex items-center gap-4 flex-1 max-w-2xl ml-8">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search candidates by name, email, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <div className="w-64">
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
                      // Check if this recruiter is not disabled
                      const recruiterUser = users.find(u => u._id === r.value);
                      return recruiterUser && !recruiterUser.isDisabled;
                    })
                    .map(r => JSON.stringify(r))
                  )).map(rJson => JSON.parse(rJson))
                ]}
                value={recruiterFilter}
                onChange={(val) => setRecruiterFilter(val)}
                placeholder="Select Recruiter"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">

          <div className="flex items-center gap-8 border-b border-gray-200">
            {/* ALL */}
            <button
              onClick={() => {
                setStatusFilter("all");
                setInterviewStageFilter("all");
              }}
              className={`px-1 py-4 text-sm font-medium ${statusFilter === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              All responses{" "}
              <span className="ml-1">
                {statusFilter === "all" ? filteredList.length : ""}
              </span>
            </button>

            {/* NEW */}
            <button
              onClick={() => {
                setStatusFilter("New");
                setInterviewStageFilter("all");
              }}
              className={`px-1 py-4 text-sm font-medium ${statusFilter === "New"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              New{" "}
              <span className="ml-1">
                {statusFilter === "New" ? filteredList.length : ""}
              </span>
            </button>

            {/* SHORTLISTED */}
            <button
              onClick={() => {
                setStatusFilter("Shortlisted");
                setInterviewStageFilter("all");
              }}
              className={`px-1 py-4 text-sm font-medium ${statusFilter === "Shortlisted"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Shortlisted{" "}
              <span className="ml-1">
                {statusFilter === "Shortlisted" ? filteredList.length : ""}
              </span>
            </button>

            {/* INTERVIEWED */}
            <button
              onClick={() => {
                setStatusFilter("Interviewed");
                setInterviewStageFilter("all");
              }}
              className={`px-1 py-4 text-sm font-medium ${statusFilter === "Interviewed"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Interviewed{" "}
              <span className="ml-1">
                {statusFilter === "Interviewed" ? filteredList.length : ""}
              </span>
            </button>

            {/* SELECTED */}
            <button
              onClick={() => {
                setStatusFilter("Selected");
                setInterviewStageFilter("all");
              }}
              className={`px-1 py-4 text-sm font-medium ${statusFilter === "Selected"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Selected{" "}
              <span className="ml-1">
                {statusFilter === "Selected" ? filteredList.length : ""}
              </span>
            </button>

            {/* JOINED */}
            <button
              onClick={() => {
                setStatusFilter("Joined");
                setInterviewStageFilter("all");
              }}
              className={`px-1 py-4 text-sm font-medium ${statusFilter === "Joined"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Joined{" "}
              <span className="ml-1">
                {statusFilter === "Joined" ? filteredList.length : ""}
              </span>
            </button>

            {/* REJECTED */}
            <button
              onClick={() => {
                setStatusFilter("Rejected");
                setInterviewStageFilter("all");
              }}
              className={`px-1 py-4 text-sm font-medium ${statusFilter === "Rejected"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Rejected{" "}
              <span className="ml-1">
                {statusFilter === "Rejected" ? filteredList.length : ""}
              </span>
            </button>
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
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredList.length}</span>{" "}
            responses
          </div>

          <div className="flex items-center gap-6">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Relevance">Relevance</option>
              <option value="Date">Date</option>
              <option value="Name">Name</option>
            </select>

            {statusFilter === "Joined" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={joinStartDate}
                  onChange={(e) => setJoinStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Joining Date From"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={joinEndDate}
                  onChange={(e) => setJoinEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Joining Date To"
                />
              </div>
            )}

            {statusFilter === "Selected" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectStartDate}
                  onChange={(e) => setSelectStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Selection Date From"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={selectEndDate}
                  onChange={(e) => setSelectEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Selection Date To"
                />
              </div>
            )}

            {(joinStartDate || joinEndDate || selectStartDate || selectEndDate) && (
              <button
                onClick={() => {
                  setJoinStartDate("");
                  setJoinEndDate("");
                  setSelectStartDate("");
                  setSelectEndDate("");
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Reset Dates
              </button>
            )}


            <button
              onClick={goPrev}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm text-gray-600">
              Page {currentPage}/{totalPages || 1}
            </span>

            <button
              onClick={goNext}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* <div className="flex items-center gap-1 border border-gray-300 rounded">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 ${viewMode === "grid"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 ${viewMode === "list"
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div> */}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg mb-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  filteredList.length > 0 &&
                  selectedCandidates.length === filteredList.length
                }
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="text-sm text-gray-700">Select all</span>
            </label>

            <button
              onClick={async () => {
                if (!user?._id || selectedCandidates.length === 0) {
                  toast.error("Please select at least one candidate");
                  return;
                }
                for (const candidateId of selectedCandidates) {
                  await updateStatus(candidateId, "Shortlisted", user._id);
                }
                toast.success(
                  `${selectedCandidates.length} candidate(s) shortlisted`
                );
                if (id) fetchCandidatesByJob(id);
                setSelectedCandidates([]);
              }}
              disabled={selectedCandidates.length === 0}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserCheck className="w-4 h-4" />
              Shortlist
            </button>

            <button
              onClick={async () => {
                if (!user?._id || selectedCandidates.length === 0) {
                  toast.error("Please select at least one candidate");
                  return;
                }
                const confirmReject = window.confirm(
                  `Are you sure you want to reject ${selectedCandidates.length} candidate(s)?`
                );
                if (!confirmReject) return;

                for (const candidateId of selectedCandidates) {
                  await updateStatus(candidateId, "Rejected", user._id);
                }
                toast.success(
                  `${selectedCandidates.length} candidate(s) rejected`
                );
                if (id) fetchCandidatesByJob(id);
                setSelectedCandidates([]);
              }}
              disabled={selectedCandidates.length === 0}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-red-500">⊘</span>
              Reject
            </button>

            <button
              onClick={() => {
                if (selectedCandidates.length === 0) {
                  toast.error("Please select at least one candidate");
                  return;
                }
                const selectedObjs = filteredList.filter((c: any) =>
                  selectedCandidates.includes(c._id)
                );
                setEmailCandidates(selectedObjs);
                setSelectedPocs([]);
                setShowEmailModal(true);
              }}
              disabled={selectedCandidates.length === 0}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* <Mail className="w-4 h-4" /> */}
              <Share2 className="w-5 h-5" />
              Email
            </button>

            <button
              onClick={() => {
                if (selectedCandidates.length === 0) {
                  toast.error("Please select at least one candidate");
                  return;
                }
                const candidatesWithResume = filteredList.filter(
                  (c: any) => selectedCandidates.includes(c._id) && c.resumeUrl
                );
                if (candidatesWithResume.length === 0) {
                  toast.error("No resumes available for selected candidates");
                  return;
                }
                candidatesWithResume.forEach((c: any) => {
                  const link = document.createElement("a");
                  link.href = `${API_BASE_URL}${c.resumeUrl}`;
                  link.download = `${c.dynamicFields?.candidateName || "candidate"
                    }_resume.pdf`;
                  link.click();
                });
                toast.success(
                  `Downloading ${candidatesWithResume.length} resume(s)`
                );
              }}
              disabled={selectedCandidates.length === 0}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>👤</span>
              Download
            </button>

            <button
              onClick={async () => {
                if (!user?._id || selectedCandidates.length === 0) {
                  toast.error("Please select at least one candidate");
                  return;
                }
                const confirmDelete = window.confirm(
                  `⚠️ Are you sure you want to delete ${selectedCandidates.length} candidate(s)? This action cannot be undone.`
                );
                if (!confirmDelete) return;

                for (const candidateId of selectedCandidates) {
                  await deleteCandidate(candidateId, user._id);
                }
                toast.success(
                  `${selectedCandidates.length} candidate(s) deleted`
                );
                if (id) fetchCandidatesByJob(id);
                setSelectedCandidates([]);
              }}
              disabled={selectedCandidates.length === 0}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
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
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* LEFT CHECKBOX */}
                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-1 h-12 bg-blue-500 rounded-full"></div>
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate._id)}
                      onChange={() => toggleCandidate(candidate._id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                    />
                  </div>

                  {/* MAIN CONTENT */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      {/* Candidate Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Candidate Name */}
                          <h3
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            {candidate.dynamicFields?.candidateName ||
                              "Unnamed Candidate"}
                          </h3>

                          {/* Status */}
                          <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                            {candidate.status}
                          </span>

                          {/* Joining Date Badge */}
                          {candidate.status === "Joined" && candidate.joiningDate && (
                            <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded border border-green-200 flex items-center gap-1">
                              Joining: {formatDate(candidate.joiningDate)}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  setPendingAction({
                                    type: 'statusChange',
                                    candidateId: candidate._id,
                                    newStatus: 'Joined',
                                    currentJoiningDate: candidate.joiningDate
                                  });
                                  setStatusModalOpen(true);
                                }}
                                className="ml-1 p-0.5 hover:bg-green-200 rounded text-green-800"
                                title="Edit Joining Details"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                          {/* Selection Date Badge */}
                          {candidate.status === "Selected" && candidate.selectionDate && (
                            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded border border-indigo-200 flex items-center gap-1">
                              Selected: {formatDate(candidate.selectionDate)}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingAction({
                                    type: 'statusChange',
                                    candidateId: candidate._id,
                                    newStatus: 'Selected',
                                    currentSelectionDate: candidate.selectionDate,
                                    currentExpectedJoiningDate: candidate.expectedJoiningDate
                                  });
                                  setStatusModalOpen(true);
                                }}
                                className="ml-1 p-0.5 hover:bg-indigo-200 rounded text-indigo-800"
                                title="Edit Selection Details"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </span>
                          )}

                          {/* Expected Joining Date (Optional, shown if Selected) */}
                          {candidate.status === "Selected" && candidate.expectedJoiningDate && (
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded border border-indigo-100 flex items-center gap-1">
                              Exp. Join: {formatDate(candidate.expectedJoiningDate)}
                            </span>
                          )}

                          {/* Interview Stage Badge */}
                          {candidate.status === "Interviewed" &&
                            candidate.interviewStage && (
                              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200">
                                {candidate.interviewStage}
                              </span>
                            )}

                          {/* Job Title */}
                          <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded border border-purple-200">
                            {candidate.jobId?.title || "No Job Assigned"}
                          </span>
                          {candidate.jobId?.clientId?.companyName && (
                            <p className="text-sm text-gray-600 mt-1">
                              Client: {candidate.jobId.clientId.companyName}
                            </p>
                          )}
                        </div>

                        {/* Email + Phone */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                          {candidate.dynamicFields?.Email && (
                            <span className="flex items-center gap-1">
                              📧 {candidate.dynamicFields.Email}
                            </span>
                          )}
                          {candidate.dynamicFields?.Phone && (
                            <span className="flex items-center gap-1">
                              📞 {candidate.dynamicFields.Phone}
                            </span>
                          )}
                          {/* Offer Letter Link */}
                          {candidate.status === "Joined" && candidate.offerLetter && (
                            <a
                              href={`${API_BASE_URL}${candidate.offerLetter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline ml-2"
                            >
                              <Users className="w-4 h-4" /> View Offer Letter
                            </a>
                          )}
                        </div>
                      </div>

                      {/* RIGHT USER ICON + EMAIL */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                          {candidate.dynamicFields?.candidateName
                            ?.substring(0, 2)
                            .toUpperCase() || "NA"}
                        </div>

                        {/* <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                          <Mail className="w-5 h-5" />
                        </button> */}
                      </div>
                    </div>

                    {/* Dynamic Info Section */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-4">
                      {/* Skills */}
                      {candidate.dynamicFields?.Skills && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Skills
                          </div>
                          <div className="text-sm text-gray-900">
                            {candidate.dynamicFields.Skills}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {candidate.dynamicFields?.Experience && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Experience
                          </div>
                          <div className="text-sm text-gray-900">
                            {candidate.dynamicFields.Experience} years
                          </div>
                        </div>
                      )}

                      {/* Current Company */}
                      {candidate.dynamicFields?.currentCompany && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Current Company
                          </div>
                          <div className="text-sm text-gray-900">
                            {candidate.dynamicFields.currentCompany}
                          </div>
                        </div>
                      )}

                      {/* CTC */}
                      {(candidate.dynamicFields?.currentCTC ||
                        candidate.dynamicFields?.expectedCTC) && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">CTC</div>
                            <div className="text-sm text-gray-900">
                              CTC: ₹{candidate.dynamicFields.currentCTC} →
                              Expected: ₹{candidate.dynamicFields.expectedCTC}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* BOTTOM BAR */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setPendingAction({
                            type: 'commentOnly',
                            candidateId: candidate._id,
                            newStatus: candidate.status,
                          });
                          setStatusModalOpen(true);
                        }}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Add comment
                      </button>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          <span>posted by {candidate.createdBy?.name || "Unknown"}</span> |{" "}
                          {formatDate(candidate.createdAt)}
                        </span>

                        {/* Status button */}
                        <select
                          value={candidate.status}
                          onChange={(e) => {
                            if (!user?._id) return;
                            const newStatus = e.target.value;
                            setPendingAction({
                              type: 'statusChange',
                              candidateId: candidate._id,
                              newStatus: newStatus,
                              currentJoiningDate: candidate.joiningDate,
                              currentSelectionDate: candidate.selectionDate,
                              currentExpectedJoiningDate: candidate.expectedJoiningDate,
                              droppedBy: newStatus === 'Dropped'
                                ? (candidate.status === 'Shortlisted' ? 'Mentor' : (candidate.status === 'Interviewed' ? 'Client' : 'Mentor')) // Default to Mentor if neither
                                : undefined
                            });
                            setStatusModalOpen(true);
                          }}
                          className="px-4 py-2 text-sm rounded-xl border border-gray-300 bg-gray-50
               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
               hover:bg-white transition-all shadow-sm"
                        >
                          <option value="New">New</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interviewed">Interviewed</option>
                          <option value="Selected">Selected</option>
                          <option value="Joined">Joined</option>
                          <option value="Rejected">Rejected</option>
                          {(candidate.status === "Shortlisted" || candidate.status === "Interviewed" || candidate.status === "Dropped") && (
                            <option value="Dropped">Dropped</option>
                          )}
                          <option value="Hold">Hold</option>
                        </select>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(candidate._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT ACTION BUTTONS */}
                  <div className="flex flex-col gap-3 pt-1">
                    {/* Share Button with Dropdown */}
                    <div className="relative share-menu-container">
                      <button
                        onClick={() =>
                          setShareMenuOpen(
                            shareMenuOpen === candidate._id
                              ? null
                              : candidate._id
                          )
                        }
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>

                      {/* Share Dropdown Menu */}
                      {shareMenuOpen === candidate._id && (
                        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                          <button
                            onClick={() => {
                              setEmailCandidates([candidate]);
                              setSelectedPocs([]);
                              setShowEmailModal(true);
                              setShareMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Mail className="w-4 h-4 text-blue-600" />
                            Email
                          </button>

                          <button
                            onClick={() => {
                              const details = `Name: ${candidate.dynamicFields?.candidateName}\nEmail: ${candidate.dynamicFields?.Email}\nPhone: ${candidate.dynamicFields?.Phone}\nPosition: ${candidate.jobId?.title}`;
                              navigator.clipboard.writeText(details);
                              toast.success("Details copied to clipboard");
                              setShareMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t"
                          >
                            <Download className="w-4 h-4 text-gray-600" />
                            Copy Details
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Phone Button */}
                    <button
                      onClick={() => {
                        const phone = candidate.dynamicFields?.Phone;
                        if (phone) {
                          window.location.href = `tel:${phone}`;
                        } else {
                          toast.error("No phone number available");
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-50 rounded"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white/95 w-full max-w-4xl my-12 rounded-3xl shadow-2xl border border-gray-200 backdrop-blur-xl">
            {/* ---------- HEADER ---------- */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center text-indigo-600 text-2xl font-bold">
                  {selectedCandidate.dynamicFields?.candidateName
                    ?.substring(0, 2)
                    .toUpperCase()}
                </div>

                {/* Name + Status + Tags */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCandidate.dynamicFields?.candidateName ||
                      "Unknown Candidate"}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {/* Status */}
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-300 shadow-sm">
                      {selectedCandidate.status}
                    </span>

                    {/* Joining Date Badge */}
                    {selectedCandidate.status === "Joined" && selectedCandidate.joiningDate && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-300 shadow-sm">
                        Joining: {formatDate(selectedCandidate.joiningDate)}
                      </span>
                    )}
                    {/* Selection Date Badge */}
                    {selectedCandidate.status === "Selected" && selectedCandidate.selectionDate && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-300 shadow-sm">
                        Selected: {formatDate(selectedCandidate.selectionDate)}
                      </span>
                    )}

                    {/* Expected Joining Date Badge */}
                    {selectedCandidate.status === "Selected" && selectedCandidate.expectedJoiningDate && (
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full border border-indigo-200 shadow-sm">
                        Exp. Join: {formatDate(selectedCandidate.expectedJoiningDate)}
                      </span>
                    )}

                    {/* Interview Stage Badge */}
                    {selectedCandidate.status === "Interviewed" &&
                      selectedCandidate.interviewStage && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-300 shadow-sm">
                          {selectedCandidate.interviewStage}
                        </span>
                      )}

                    {/* Tags */}
                    {selectedCandidate.tags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full border border-purple-300 shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* ---------- BASIC DETAILS GRID ---------- */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b">
              {Object.entries(selectedCandidate.dynamicFields).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="p-4 bg-white shadow-sm rounded-xl border hover:shadow-md transition cursor-default"
                  >
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                      {key}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 break-all">
                      {String(value) || "--"}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* ---------- FIXED DETAILS & LINKS ---------- */}
            <div className="p-6 space-y-8">
              {/* Job and Creator */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
                  <p className="text-xs text-gray-500">Job Title</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedCandidate.jobId?.title || "N/A"}
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm">
                  <p className="text-xs text-gray-500">Created By</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedCandidate.createdBy?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedCandidate.createdBy?.designation}
                  </p>
                </div>
              </div>

              {/* Links */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Links
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedCandidate.resumeUrl && (
                    <button
                      onClick={() =>
                        setPreviewResumeUrl(
                          `${API_BASE_URL}${selectedCandidate.resumeUrl}`
                        )
                      }
                      className="px-4 py-2 bg-white border rounded-xl shadow hover:bg-gray-50 flex items-center gap-2 transition text-blue-600 font-medium"
                    >
                      <Eye className="w-4 h-4" /> Preview Resume
                    </button>
                  )}

                  {selectedCandidate.linkedinUrl && (
                    <a
                      href={selectedCandidate.linkedinUrl}
                      target="_blank"
                      className="px-4 py-2 bg-white border rounded-xl shadow hover:bg-gray-50 flex items-center gap-2 transition"
                    >
                      <Link size={16} className="text-blue-600" /> LinkedIn
                    </a>
                  )}

                  {selectedCandidate.portfolioUrl && (
                    <a
                      href={selectedCandidate.portfolioUrl}
                      target="_blank"
                      className="px-4 py-2 bg-white border rounded-xl shadow hover:bg-gray-50 flex items-center gap-2 transition"
                    >
                      <Link size={16} className="text-blue-600" /> Portfolio
                    </a>
                  )}
                </div>
              </div>

              {/* Interview Stage History */}
              {selectedCandidate.interviewStageHistory &&
                selectedCandidate.interviewStageHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-blue-600">📋</span>
                      Interview Stage History
                    </h3>
                    <div className="space-y-3">
                      {selectedCandidate.interviewStageHistory.map(
                        (history: any, index: number) => (
                          <div
                            key={index}
                            className={`p-4 rounded-xl border-l-4 shadow-sm ${history.status === "Selected"
                              ? "bg-green-50 border-green-500"
                              : "bg-red-50 border-red-500"
                              }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {history.stageName}
                                  </h4>
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${history.status === "Selected"
                                      ? "bg-green-100 text-green-700 border border-green-200"
                                      : "bg-red-100 text-red-700 border border-red-200"
                                      }`}
                                  >
                                    {history.status === "Selected"
                                      ? "✓ Selected"
                                      : "✗ Rejected"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {history.updatedBy?.name || "Unknown"} •{" "}
                                  {new Date(history.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {history.notes && (
                              <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-700 italic">
                                  "{history.notes}"
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Status History */}
              {selectedCandidate.statusHistory &&
                selectedCandidate.statusHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-blue-600">📜</span>
                      Status History
                    </h3>
                    <div className="space-y-3">
                      {selectedCandidate.statusHistory.slice().reverse().map(
                        (history: any, index: number) => (
                          <div
                            key={index}
                            className="p-4 rounded-xl border-l-4 shadow-sm bg-gray-50 border-blue-500"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                    {history.status}
                                  </span>
                                  {history.status === "Joined" && history.joiningDate && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                                      Joining: {formatDate(history.joiningDate)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {history.updatedBy?.name || "Unknown"} •{" "}
                                  {new Date(history.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {history.comment && (
                              <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-700 italic">
                                  "{history.comment}"
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Standalone Comments */}
              {selectedCandidate.comments &&
                selectedCandidate.comments.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-blue-600">💬</span>
                      Comments
                    </h3>
                    <div className="space-y-3">
                      {selectedCandidate.comments.slice().reverse().map(
                        (comm: any, index: number) => (
                          <div
                            key={index}
                            className="p-4 rounded-xl border shadow-sm bg-white"
                          >
                            <p className="text-sm text-gray-700 mb-2">
                              {comm.text}
                            </p>
                            <p className="text-[10px] text-gray-500 text-right">
                              {comm.author?.name || "Unknown"} •{" "}
                              {new Date(comm.timestamp).toLocaleString()}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Notes
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border shadow-sm">
                  {selectedCandidate.notes ? (
                    <p className="text-gray-700 leading-relaxed">
                      {selectedCandidate.notes}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      No notes added
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ---------- FOOTER ---------- */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-3xl">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white shadow-sm"
              >
                Close
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRejectCandidate(selectedCandidate._id)}
                  className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg shadow hover:bg-red-100 transition"
                >
                  Reject
                </button>
                <select
                  value={selectedCandidate.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    let droppedByVal = undefined;
                    if (newStatus === "Dropped") {
                      if (selectedCandidate.status === "Shortlisted") {
                        droppedByVal = "Mentor";
                      } else if (selectedCandidate.status === "Interviewed") {
                        droppedByVal = "Client";
                      } else {
                        droppedByVal = "Mentor"; // Fallback
                      }
                    }

                    setPendingAction({
                      type: 'statusChange',
                      candidateId: selectedCandidate._id,
                      newStatus: newStatus,
                      currentJoiningDate: selectedCandidate.joiningDate,
                      currentSelectionDate: selectedCandidate.selectionDate,
                      currentExpectedJoiningDate: selectedCandidate.expectedJoiningDate,
                      droppedBy: droppedByVal
                    });
                    setStatusModalOpen(true);
                  }}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                     hover:bg-gray-50 transition-all shadow-sm"
                >
                  <option value="New">New</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interviewed">Interviewed</option>
                  <option value="Selected">Selected</option>
                  <option value="Joined">Joined</option>
                  <option value="Rejected">Rejected</option>
                  {(selectedCandidate.status === "Shortlisted" || selectedCandidate.status === "Interviewed" || selectedCandidate.status === "Dropped") && (
                    <option value="Dropped">Dropped</option>
                  )}
                  <option value="Hold">Hold</option>
                </select>
                <button
                  onClick={onMoveToNextClick}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                >
                  Move to Next Stage
                </button>
              </div>
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
      />
    </div>
  );
};

export default CandidatesList;
