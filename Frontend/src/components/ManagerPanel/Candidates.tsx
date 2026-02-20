import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  Search,
  Upload,
  ChevronDown,
  FileText,
  X,
  Clock,
} from "lucide-react";
import { getFilePreviewUrl } from "../../utils/imageUtils";
import { formatDate } from "../../utils/dateUtils";
import { CandidateForm } from "../MentorPanel/pages/CandidatesForm";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useJobContext } from "../../context/DataProvider";
import { useAuth } from "../../context/AuthProvider";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { StatusUpdateModal } from "../Common/StatusUpdateModal";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2 border border-gray-300 rounded-lg bg-gray-50 flex justify-between items-center focus:ring-2 focus:ring-orange-500 transition-all ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
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
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
                  className={`px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm transition-colors ${value === opt.value ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-700'}`}
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

export const ManagerCandidates = ({ initialJobTitleFilter = "all", initialFormOpen = false }: { initialJobTitleFilter?: string, initialFormOpen?: boolean }) => {
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

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clients`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.clients) {
          setClients(data.clients);
        }
      })
      .catch(err => console.error('Error fetching clients:', err));
  }, []);

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

  const handleEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCandidate(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this candidate?")) {
      await deleteCandidate(id, user!._id);
      fetchRoleBasedCandidates(user!._id, user!.designation, currentPage, limit, {
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

  const handleStatusChange = (
    candidateId: string,
    newStatus: string,
    interviewStage?: string,
    currentJoiningDate?: string,
    currentSelectionDate?: string,
    currentExpectedJoiningDate?: string,
    rejectedBy?: string,
    droppedBy?: string,
    stageNameForHistory?: string,
    nextStageName?: string
  ) => {
    const needsModal = ["Interviewed", "Selected", "Joined", "Rejected", "Dropped"].includes(newStatus);

    if (needsModal) {
      setPendingStatusChange({
        candidateId,
        newStatus,
        interviewStage,
        currentJoiningDate,
        currentSelectionDate,
        currentExpectedJoiningDate,
        currentRejectedBy: rejectedBy,
        droppedBy,
        stageNameForHistory,
        nextStageName
      });
      setStatusModalOpen(true);
    } else {
      confirmStatusWithoutModal(candidateId, newStatus);
    }
  };

  const confirmStatusWithoutModal = async (candidateId: string, status: string) => {
    try {
      await updateStatus(
        candidateId,
        status,
        user!._id,
        undefined, // interviewStage
        undefined, // stageStatus
        undefined, // stageNotes
        undefined, // comment
        undefined, // joiningDate
        undefined, // offerLetter
        undefined, // selectionDate
        undefined, // expectedJoiningDate
        undefined, // rejectedBy
        undefined, // offeredCTC
        undefined, // droppedBy
        undefined  // rejectionReason
      );
      toast.success(`Status updated to ${status}`);
      fetchRoleBasedCandidates(user!._id, user!.designation, currentPage, limit, {
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
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
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

    try {
      // Determine if this is a drop or reject
      const droppedByValue = pendingStatusChange.newStatus === "Dropped" ? pendingStatusChange.droppedBy : undefined;
      const rejectedByValue = (pendingStatusChange.newStatus === "Rejected" || stageStatus === "Rejected") ? rejectedBy : undefined;

      await updateStatus(
        pendingStatusChange.candidateId,
        stageStatus === "Rejected" ? "Rejected" : pendingStatusChange.newStatus,
        user!._id,
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
      toast.success(`Status updated to ${pendingStatusChange.newStatus}`);
      setStatusModalOpen(false);
      setPendingStatusChange(null);
      fetchRoleBasedCandidates(user!._id, user!.designation, currentPage, limit, {
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
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const clientOptions = [
    { value: "all", label: "All Clients" },
    ...clients.map(c => ({ value: c._id, label: c.companyName }))
  ];

  const jobOptions = [
    { value: "all", label: "All Job Titles" },
    ...jobs
      .filter(j => filterClient === "all" || (typeof j.clientId === 'object' ? j.clientId?._id : j.clientId) === filterClient)
      .map(j => ({ value: j.title, label: j.title }))
  ];

  const selectedJob = jobs.find(j => j.title === filterJobTitle);
  const availableStages = selectedJob?.stages || [];
  const stageOptions = [
    { value: "all", label: "All Stages" },
    ...availableStages.map((s: any) => ({ value: s.name, label: s.name }))
  ];

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">Candidates</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Manage and track your candidate pipeline</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all shadow-md hover:shadow-orange-200/50 font-semibold w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Add Candidate</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8 transition-all hover:shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search</label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Client</label>
            <SearchableSelect
              options={clientOptions}
              value={filterClient}
              onChange={(val) => { setFilterClient(val); setFilterJobTitle("all"); setCurrentPage(1); }}
              placeholder="All Clients"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Designation</label>
            <SearchableSelect
              options={jobOptions}
              value={filterJobTitle}
              onChange={(val) => { setFilterJobTitle(val); setFilterStage("all"); setCurrentPage(1); }}
              placeholder="All Designations"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Interview Stage</label>
            <SearchableSelect
              options={stageOptions}
              value={filterStage}
              onChange={(val) => { setFilterStage(val); setCurrentPage(1); }}
              placeholder="All Stages"
              disabled={filterJobTitle === "all"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mt-6 pt-6 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Upload From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 text-sm outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Upload To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 text-sm outline-none"
            />
          </div>

          {statusFilter === "Joined" && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Join From</label>
                <input
                  type="date"
                  value={joinStartDate}
                  onChange={(e) => setJoinStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 text-sm outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Join To</label>
                <input
                  type="date"
                  value={joinEndDate}
                  onChange={(e) => setJoinEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 text-sm outline-none"
                />
              </div>
            </>
          )}

          {statusFilter === "Selected" && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Select From</label>
                <input
                  type="date"
                  value={selectStartDate}
                  onChange={(e) => setSelectStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 text-sm outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Select To</label>
                <input
                  type="date"
                  value={selectEndDate}
                  onChange={(e) => setSelectEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 text-sm outline-none"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            {(startDate || endDate || joinStartDate || joinEndDate || selectStartDate || selectEndDate || filterClient !== "all" || filterJobTitle !== "all" || filterStage !== "all" || searchTerm) ? (
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
                  setSearchTerm("");
                }}
                className="w-full h-[38px] px-4 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-all text-sm font-bold flex items-center justify-center gap-2"
              >
                <X size={14} /> Reset Filters
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        {["all", "New", "Shortlisted", "Interviewed", "Selected", "Joined", "Rejected", "Dropped", "Hold"].map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${statusFilter === status
              ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
          >
            {status === "all" ? "All Status" : status === "Shortlisted" ? "Screen" : status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative mb-6 sm:mb-8">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1200px]">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4">Recruiter</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4">Resume</th>
                <th className="px-6 py-4">Status</th>
                {statusFilter === "Joined" && (
                  <>
                    <th className="px-6 py-4">Offer Letter</th>
                    <th className="px-6 py-4">Joining Date</th>
                  </>
                )}
                {statusFilter === "Selected" && (
                  <>
                    <th className="px-6 py-4">Selection Date</th>
                    <th className="px-6 py-4">Exp. Joining Date</th>
                  </>
                )}
                <th className="px-6 py-4">Remarks</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCandidates.length > 0 ? (
                paginatedCandidates.map((candidate: any) => {
                  const dynamicKeys = Object.keys(candidate.dynamicFields || {});
                  const nameKey = dynamicKeys.find(k => k.toLowerCase().includes("name")) || dynamicKeys[0];
                  const emailKey = dynamicKeys.find(k => k.toLowerCase().includes("email")) || dynamicKeys[1];
                  const phoneKey = dynamicKeys.find(k => k.toLowerCase().includes("phone")) || dynamicKeys[2];

                  return (
                    <tr key={candidate._id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">{candidate.dynamicFields[nameKey] || "N/A"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Mail size={12} /> {candidate.dynamicFields[emailKey] || "N/A"}</span>
                          <span className="flex items-center gap-1"><Phone size={12} /> {candidate.dynamicFields[phoneKey] || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-indigo-500 font-medium">{candidate.jobId?.clientId?.companyName || "N/A"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">{candidate.jobId?.title || "N/A"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{candidate.createdAt ? formatDate(candidate.createdAt) : "-"}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {candidate.createdBy?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[10px] font-medium">
                        {candidate.createdBy?.reporter?.name || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {candidate.resumeUrl ? (
                          <a
                            href={getFilePreviewUrl(candidate.resumeUrl)}
                            target="_blank"
                            className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center justify-center w-fit"
                            title="View Resume"
                          >
                            <FileText size={16} />
                          </a>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <select
                            value={candidate.status || "New"}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              let droppedByVal = undefined;
                              if (newStatus === "Dropped") {
                                if (candidate.status === "Shortlisted") droppedByVal = "Manager";
                                else if (["Interviewed", "Selected", "Joined"].includes(candidate.status || "")) droppedByVal = "Client";
                              }

                              let rejectedByVal = undefined;
                              if (newStatus === "Rejected") {
                                if (candidate.status === "Shortlisted") rejectedByVal = "Manager";
                                else if (candidate.status === "Interviewed") rejectedByVal = "Client";
                              }

                              handleStatusChange(
                                candidate._id,
                                newStatus,
                                candidate.interviewStage,
                                candidate.joiningDate,
                                candidate.selectionDate,
                                candidate.expectedJoiningDate,
                                rejectedByVal,
                                droppedByVal
                              );
                            }}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold focus:ring-2 focus:ring-orange-500/20"
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
                            ) : (
                              <>
                                <option value="New">New</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Interviewed">Interviewed</option>
                                <option value="Selected">Selected</option>
                                <option value="Joined">Joined</option>
                                {["Shortlisted", "Interviewed", "Rejected", "Dropped"].includes(candidate.status || "") && (
                                  <option value="Rejected">Rejected</option>
                                )}
                                {(candidate.status === "Shortlisted" || candidate.status === "Interviewed" || candidate.status === "Dropped") && (
                                  <option value="Dropped">Dropped</option>
                                )}
                                <option value="Hold">Hold</option>
                              </>
                            )}
                          </select>
                          {candidate.status === "Interviewed" && candidate.interviewStage && (
                            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 flex items-center gap-1">
                              <Clock size={10} /> {candidate.interviewStage}
                            </span>
                          )}
                        </div>
                      </td>
                      {statusFilter === "Joined" && (
                        <>
                          <td className="px-6 py-4">
                            {candidate.offerLetter ? (
                              <a
                                href={getFilePreviewUrl(candidate.offerLetter)}
                                target="_blank"
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center w-fit"
                                title="View Offer Letter"
                              >
                                <Upload size={16} />
                              </a>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            <div className="flex items-center gap-2">
                              {candidate.joiningDate ? (candidate.joiningDate.toString().split('T')[0]) : "-"}
                              <button
                                onClick={() => handleStatusChange(candidate._id, "Joined", undefined, candidate.joiningDate)}
                                className="p-1 hover:bg-slate-100 rounded text-indigo-600"
                                title="Edit Joining Details"
                              >
                                <Edit size={12} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                      {statusFilter === "Selected" && (
                        <>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            <div className="flex items-center gap-2">
                              {candidate.selectionDate ? (candidate.selectionDate.toString().split('T')[0]) : "-"}
                              <button
                                onClick={() => handleStatusChange(
                                  candidate._id,
                                  "Selected",
                                  undefined,
                                  undefined,
                                  candidate.selectionDate,
                                  candidate.expectedJoiningDate
                                )}
                                className="p-1 hover:bg-slate-100 rounded text-indigo-600"
                                title="Edit Selection Details"
                              >
                                <Edit size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {candidate.expectedJoiningDate ? (candidate.expectedJoiningDate.toString().split('T')[0]) : "-"}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-slate-600">
                        <div className="max-w-[200px]" title={candidate.notes}>
                          {candidate.status === "Rejected" && candidate.rejectionReason && (
                            <div className="text-[10px] text-red-600 font-bold uppercase mb-0.5">Rejected: {candidate.rejectionReason}</div>
                          )}
                          <div className="truncate text-slate-500">
                            {candidate.notes || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(candidate)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(candidate._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="mx-auto text-slate-200 mb-3" size={48} />
                    <p className="text-slate-500 font-medium">No candidates found for the selected filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing {Math.min(pagination.totalCandidates, (currentPage - 1) * limit + 1)} - {Math.min(pagination.totalCandidates, currentPage * limit)} of {pagination.totalCandidates}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-all text-slate-600 hover:text-slate-900"
            >
              Prev
            </button>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all border ${currentPage === i + 1 ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-100" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  {i + 1}
                </button>
              ))}
              {pagination.totalPages > 5 && <span className="flex items-center text-slate-300 px-1">...</span>}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-all text-slate-600 hover:text-slate-900"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <CandidateForm
        isOpen={showForm}
        onClose={handleCloseForm}
        candidate={editingCandidate}
      />

      <StatusUpdateModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={confirmStatusChange}
        newStatus={pendingStatusChange?.newStatus || ""}
        candidateName={(() => {
          const c = paginatedCandidates.find((cand: any) => cand._id === pendingStatusChange?.candidateId);
          if (!c) return "";
          const dynamicFields = (c as any).dynamicFields || {};
          const nameKey = Object.keys(dynamicFields).find(k => k.toLowerCase().includes("name")) || Object.keys(dynamicFields)[0];
          return dynamicFields[nameKey] || "";
        })()}
        currentJoiningDate={pendingStatusChange?.currentJoiningDate}
        currentSelectionDate={pendingStatusChange?.currentSelectionDate}
        currentExpectedJoiningDate={pendingStatusChange?.currentExpectedJoiningDate}
        droppedBy={pendingStatusChange?.droppedBy}
        currentRejectedBy={pendingStatusChange?.currentRejectedBy}
        stageNameForHistory={pendingStatusChange?.stageNameForHistory}
        nextStageName={pendingStatusChange?.nextStageName}
      />
    </div>
  );
};
