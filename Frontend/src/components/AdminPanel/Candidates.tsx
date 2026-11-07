import "./candidate-design.css";
import { candidatePresentation } from "../../utils/candidatePresentation";
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
    ChevronDown,
    MessageSquare,
    FileText,
    X,
    Download,
    UserCheck,
    Briefcase,
    CalendarDays,
    MapPin,
    Clock3,
    BadgeCheck,
} from "lucide-react";
import { CandidateForm } from "../MentorPanel/pages/CandidatesForm";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useJobContext } from "../../context/DataProvider";
import { useAuth } from "../../context/AuthProvider";
import { toast } from "react-toastify";
import { useSearchParams, useNavigate } from "react-router-dom";
import { StatusUpdateModal } from "../Common/StatusUpdateModal";
import { CommentModal } from "../Common/CommentModal";
import { formatDate } from "../../utils/dateUtils";
import { getFilePreviewUrl, isWordDocument } from "../../utils/imageUtils";


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
            <button type="button" aria-expanded={isOpen} aria-label={placeholder} disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full p-2 border border-gray-300 rounded-lg bg-gray-50 flex justify-between items-center focus:ring-2 focus:ring-blue-500 transition-all ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    }`}
            >
                <span className={`text-sm ${selectedOption && selectedOption.value !== 'all' ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                    {selectedOption && selectedOption.value !== 'all' ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
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
                                <button type="button"
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${value === opt.value ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-700'}`}
                                >
                                    {opt.label}
                                </button>
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

export const AdminCandidates = ({ initialJobTitleFilter = "all", initialFormOpen = false }: { initialJobTitleFilter?: string, initialFormOpen?: boolean }) => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
  const navigate = useNavigate();

    const {
        updateStatus,
        paginatedCandidates,
        pagination,
        statusCounts,
        fetchPaginatedCandidates,
        loading,
        deleteCandidate,
    } = useCandidateContext();
    const allCandidates = paginatedCandidates;
    const { jobs } = useJobContext();

    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(initialFormOpen);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [filterClient, setFilterClient] = useState("all");
    const [filterJobTitle, setFilterJobTitle] = useState(initialJobTitleFilter);
    const [filterJobStatus, setFilterJobStatus] = useState("all");
    const [filterRecruiter, setFilterRecruiter] = useState("all");
    const [filterReporter, setFilterReporter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [joinStartDate, setJoinStartDate] = useState("");
    const [joinEndDate, setJoinEndDate] = useState("");
    const [selectStartDate, setSelectStartDate] = useState("");
    const [selectEndDate, setSelectEndDate] = useState("");


    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [clients, setClients] = useState<any[]>([]);
    const [mentors, setMentors] = useState<any[]>([]);

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

    // 1️⃣ Fetch all candidates and clients on load
    // 1️⃣ Fetch data (clients & initial candidates)
    useEffect(() => {
        // Fetch clients
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clients`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.clients) {
                    setClients(data.clients);
                }
            })
            .catch(err => console.error('Error fetching clients:', err));

        // Fetch users (mentors)
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter or show all users? Usually, reporters are Mentors or Managers.
                    // For now, let's show all users as options to be safe, or just mentors.
                    // User request says "Reportees column filteration", which filters by the reporter's name.
                    setMentors(data);
                }
            })
            .catch(err => console.error('Error fetching mentors:', err));
    }, []);

    // 2️⃣ Fetch Paginated Candidates when filters/page change
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log("🚀 Frontend Fetching Candidates:", {
                page: currentPage,
                limit,
                search: searchTerm,
                status: statusFilter,
                client: filterClient,
                jobTitle: filterJobTitle,
                reporterId: filterReporter,
                recruiterId: filterRecruiter,
                jobStatus: filterJobStatus
            });
            fetchPaginatedCandidates(currentPage, limit, {
                search: searchTerm,
                status: statusFilter,
                client: filterClient,
                jobTitle: filterJobTitle,
                reporterId: filterReporter,
                recruiterId: filterRecruiter,
                jobStatus: filterJobStatus,
                startDate,
                endDate,
                joinStartDate,
                joinEndDate,
                selectStartDate,
                selectEndDate
            });

        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [currentPage, limit, searchTerm, statusFilter, filterClient, filterJobTitle, filterReporter, filterRecruiter, filterJobStatus, user, showForm, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate, fetchPaginatedCandidates]);


    // Reset page to 1 on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, filterClient, filterJobTitle, filterReporter, filterRecruiter, filterJobStatus, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate]);


    // 3️⃣ Get unique job titles from JOBS CONTEXT instead of candidates (since candidates are paginated)
    const uniqueJobTitles = Array.from(
        new Set(
            (jobs || []).map((j: any) => j.title).filter(Boolean)
        )
    ).sort();




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

        const success = await deleteCandidate(candidateId, user?._id || "");

        if (success) {
            toast.success("Candidate deleted successfully");
        } else {
            toast.error("Failed to delete candidate");
        }
    };

    // Status Change Modal State
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        candidateId: string;
        newStatus: string;
        interviewStage?: string;
        currentJoiningDate?: string;
        currentSelectionDate?: string;
        currentExpectedJoiningDate?: string;
        currentRejectedBy?: string;
        currentCTC?: string;
        droppedBy?: string;
        stageNameForHistory?: string;
        nextStageName?: string;
        rejectedBy?: string;
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
        droppedBy?: string,
        stageNameForHistory?: string,
        nextStageName?: string,
        rejectedBy?: string
    ) => {
        setPendingStatusChange({
            candidateId,
            newStatus,
            interviewStage,
            currentJoiningDate,
            currentSelectionDate,
            currentExpectedJoiningDate,
            droppedBy,
            stageNameForHistory,
            nextStageName,
            rejectedBy
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
        setIsLoading(true);
        try {
            if (pendingStatusChange) {
                const updatedCandidate = await updateStatus(
                    pendingStatusChange.candidateId,
                    stageStatus === "Rejected" ? "Rejected" : pendingStatusChange.newStatus,
                    user._id, // Role parameter now passes user._id
                    pendingStatusChange.interviewStage,
                    stageStatus as any,
                    stageNotes,
                    comment,
                    joiningDate,
                    offerLetter,
                    selectionDate,
                    expectedJoiningDate,
                    rejectedBy || pendingStatusChange.rejectedBy, // This is coming from the modal's onConfirm
                    offeredCTC,
                    pendingStatusChange.droppedBy, // This comes from pendingStatusChange
                    rejectionReason,
                    stageNameForHistory // Pass stage name for history
                );

                if (updatedCandidate) {
                    toast.success("Status updated successfully");
                    fetchPaginatedCandidates(currentPage, limit, {
                        search: searchTerm,
                        status: statusFilter,
                        client: filterClient,
                        jobTitle: filterJobTitle,
                        reporterId: filterReporter,
                        recruiterId: filterRecruiter,
                        jobStatus: filterJobStatus,
                        startDate,
                        endDate,
                        joinStartDate,
                        joinEndDate,
                        selectStartDate,
                        selectEndDate
                    });
                }
            }
            setStatusModalOpen(false);
            setPendingStatusChange(null);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };



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
        <div className="admin-candidate-design space-y-5">
            {/* Header */}
            <div className="candidate-command flex flex-wrap items-center gap-3">
                <div className="mr-auto">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Candidates (Admin View)</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Manage all candidate profiles and CVs</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md w-full sm:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Candidate</span>
                </button>
        <button
          onClick={() => navigate('/Admin/upload-source-candidate')}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-50 text-blue-700 text-white rounded-xl font-bold hover:bg-blue-100 transition shadow-md hover:shadow-indigo-200/50 w-full sm:w-auto"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Source Candidate</span>
        </button>
            </div>

            {/* Search + Filters */}
            <div className="candidate-filter-panel bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-200 space-y-4 sm:space-y-6">
                {/* Search Bar Row */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone, or skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    />
                </div>

                {/* Filters Grid Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</label>
                        <SearchableSelect
                            options={[
                                { value: 'all', label: 'All Clients' },
                                ...clients.map(c => ({ value: c.companyName, label: c.companyName }))
                            ]}
                            value={filterClient}
                            onChange={(val) => setFilterClient(val)}
                            placeholder="Select Client"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</label>
                        <SearchableSelect
                            options={[
                                { value: 'all', label: 'All Designations' },
                                ...uniqueJobTitles.map(t => ({ value: t, label: t }))
                            ]}
                            value={filterJobTitle}
                            onChange={(val) => setFilterJobTitle(val)}
                            placeholder="Select Designation"
                        />
                    </div>


                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mentor</label>
                        <SearchableSelect
                            options={[
                                { value: 'all', label: 'All Mentors' },
                                ...mentors.filter(m => m.name && ["Mentor", "Manager", "Admin"].includes(m.designation)).map(m => ({ value: m._id, label: m.name }))
                            ]}
                            value={filterReporter}
                            onChange={(val) => setFilterReporter(val)}
                            placeholder="Select Mentor"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Job Status</label>
                        <SearchableSelect
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'Open', label: 'Open' },
                                { value: 'Closed', label: 'Closed' },
                                { value: 'Hold', label: 'Hold' }
                            ]}
                            value={filterJobStatus}
                            onChange={(val) => setFilterJobStatus(val)}
                            placeholder="Job Status"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recruiter</label>
                        <SearchableSelect
                            options={[
                                { value: 'all', label: 'All Recruiters' },
                                ...mentors.filter(m => m.name).map(m => ({ value: m._id, label: m.name }))
                            ]}
                            value={filterRecruiter}
                            onChange={(val) => setFilterRecruiter(val)}
                            placeholder="Select Recruiter"
                        />
                    </div>


                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">To Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">Join To</label>
                                <input
                                    type="date"
                                    value={joinEndDate}
                                    onChange={(e) => setJoinEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">Select To</label>
                                <input
                                    type="date"
                                    value={selectEndDate}
                                    onChange={(e) => setSelectEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex items-end">
                        {(startDate || endDate || joinStartDate || joinEndDate || selectStartDate || selectEndDate || filterClient !== "all" || filterJobTitle !== "all" || filterReporter !== "all" || filterRecruiter !== "all" || filterJobStatus !== "all" || searchTerm || statusFilter !== "all") ? (
                            <button
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                    setJoinStartDate("");
                                    setJoinEndDate("");
                                    setSelectStartDate("");
                                    setSelectEndDate("");
                                    setFilterReporter("all");
                                    setFilterRecruiter("all");
                                    setFilterJobStatus("all");
                                    setFilterClient("all");
                                    setFilterJobTitle("all");
                                    setSearchTerm("");
                                    setStatusFilter("all");
                                }}
                                className="w-full px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
                            >
                                Clear All
                            </button>
                        ) : (
                            <div className="w-full h-9"></div>
                        )}
                    </div>

                </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="candidate-status-panel bg-white">
                <div className="candidate-status-tabs">
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
                            aria-pressed={statusFilter === status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium capitalize transition-colors
                            ${statusFilter === status
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                }
                            `}
                        >
                            {status === "all" ? "All" : status === "Not responding" ? "Not Responding" : status}
                            {statusCounts && (status === "all" || statusCounts[status] > 0) && <span className="candidate-status-count">{(statusCounts[status] || 0).toLocaleString("en-US")}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <section className="candidate-profile-list" aria-label="Candidate profiles" aria-busy={loading}>
                {loading ? <div role="status" className="p-12 text-center text-slate-500">Loading candidate profiles...</div> : allCandidates.map((candidate: any) => {
                    const profile = candidatePresentation(candidate);
                    return (
                    <article key={candidate._id} className="candidate-profile-card">
                        <div className="candidate-card-top">
                            <div className="candidate-card-top-left">
                                <span className="candidate-card-date"><CalendarDays aria-hidden="true" />{candidate.createdAt ? formatDate(candidate.createdAt) : "—"}</span>
                                <span className={`candidate-requirement-badge ${candidate.jobId?.status === "Closed" ? "is-closed" : ""}`}><span />{candidate.jobId?.status || "Open"} Requirement</span>
                                <span className="candidate-stage-badge">{profile.stage}</span>
                            </div>
                            <div className="candidate-card-top-right">
                                <span className="candidate-match-badge" title={profile.aiMatch === null ? "AI match score is not available for this candidate" : "AI match score"}><BadgeCheck aria-hidden="true" />{profile.aiMatch === null ? "—" : `${profile.aiMatch}%`} AI Match</span>
                                <span className="candidate-requirement-id">Req ID: #{profile.requirementId}</span>
                            </div>
                        </div>
                        <div className="candidate-card-body">
                            <div className="candidate-card-person">
                                <div className="candidate-avatar" aria-hidden="true">{profile.initials}</div>
                                <div className="candidate-card-identity">
                                    <div className="candidate-name-row"><h3>{profile.name}</h3><span className="candidate-location"><MapPin aria-hidden="true" />{profile.location}</span></div>
                                    <div className="candidate-contact-row">
                                        {profile.email ? <a href={`mailto:${profile.email}`}><Mail aria-hidden="true" />{profile.email}</a> : <span><Mail aria-hidden="true" />No Email</span>}
                                        <span className="candidate-contact-separator" aria-hidden="true">•</span>
                                        <span><Phone aria-hidden="true" />{profile.phone || "No Phone"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="candidate-role-summary">
                                <div className="candidate-summary-line"><span>Client:</span><strong>{candidate.jobId?.clientId?.companyName || "—"}</strong></div>
                                <div className="candidate-summary-line candidate-summary-role"><span>Role:</span><strong title={candidate.jobId?.title}>{candidate.jobId?.title || "—"}</strong></div>
                                <div className="candidate-summary-metrics"><span>CTC: <strong>{profile.ctc}</strong></span><i aria-hidden="true">•</i><span>Notice: <strong>{profile.notice}</strong></span><i aria-hidden="true">•</i><span>Exp: <strong>{profile.experience}</strong></span></div>
                            </div>
                            <div className="candidate-card-controls">
                                        <div data-label="Resume" className="candidate-card-resume">
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
                                        </div>

                                        <div data-label="Status" className="candidate-card-status">
                                            <select
                                                aria-label={`Status for ${profile.name}`}
                                                style={{ width: `${Math.max(76, (candidate.status || "New").length * 7 + 32)}px` }}
                                                value={candidate.status || "New"}
                                                onChange={(e) => {
                                                    const newStatus = e.target.value;
                                                    let droppedByVal = undefined;
                                                    let interviewStageVal = undefined;
                                                    let stageNameForHistoryVal = undefined;
                                                    let nextStageNameVal = undefined;

                                                    // Interview Stage Logic
                                                    if (candidate.status === "Interviewed") {
                                                        const jobStages = candidate.jobId?.stages || [];
                                                        const currentStageName = candidate.interviewStage;
                                                        const currentStageIndex = jobStages.findIndex((s: any) => s.name === currentStageName);

                                                        // Handle "Move to Next Stage" (Logic disguised as status change or custom action)
                                                        // Actually, we need to detect if they selected a "Next Stage" option from the dropdown
                                                        // But HTML select only holds values.
                                                        // Let's check if the selected value is actually a stage name prefixed

                                                        if (newStatus.startsWith("MOVE_TO_")) {
                                                            const nextStageName = newStatus.replace("MOVE_TO_", "");
                                                            // We are staying in "Interviewed" status, but changing stage
                                                            handleStatusChange(
                                                                candidate._id || "",
                                                                "Interviewed", // Status remains Interviewed
                                                                nextStageName, // New Interview Stage
                                                                undefined, undefined, undefined, undefined,
                                                                currentStageName, // Stage we are completing
                                                                nextStageName // Name for UI
                                                            );
                                                            return;
                                                        }

                                                        if (newStatus === "Selected") {
                                                            // Completing the last stage
                                                            stageNameForHistoryVal = currentStageName;
                                                        } else if (newStatus === "Rejected") {
                                                            stageNameForHistoryVal = currentStageName;
                                                        }
                                                    }


                                                    // Determine roles based on current status
                                                    const currentStatus = candidate.status || "New";
                                                    if (newStatus === "Dropped") {
                                                        if (["Interviewed", "Selected", "Joined"].includes(currentStatus)) droppedByVal = "Client";
                                                        else droppedByVal = "Admin";
                                                    }

                                                    let rejectedByVal = undefined;
                                                    if (newStatus === "Rejected") {
                                                        rejectedByVal = currentStatus === "Interviewed" ? "Client" : "Admin";
                                                    }

                                                    // Auto-select first interview stage for New -> Interviewed
                                                    if (newStatus === "Interviewed" && currentStatus !== "Interviewed" && candidate.jobId?.stages?.length > 0) {
                                                        interviewStageVal = candidate.jobId.stages[0].name;
                                                    }

                                                    handleStatusChange(
                                                        candidate._id || "",
                                                        newStatus,
                                                        interviewStageVal,
                                                        candidate.joiningDate,
                                                        candidate.selectionDate,
                                                        candidate.expectedJoiningDate,
                                                        droppedByVal,
                                                        stageNameForHistoryVal,
                                                        undefined,
                                                        rejectedByVal
                                                    );
                                                }}
                                                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 max-w-[150px]"
                                            >
                                                {/* Logic for Candidates ALREADY in Interviewed Status */}
                                                {candidate.status === "Interviewed" ? (
                                                    <>
                                                        <option value="Interviewed">
                                                            {candidate.interviewStage || "Interviewed"}
                                                        </option>

                                                        {(() => {
                                                            const jobStages = candidate.jobId?.stages || [];
                                                            const currentStageIndex = jobStages.findIndex((s: any) => s.name === candidate.interviewStage);
                                                            const nextStage = jobStages[currentStageIndex + 1];

                                                            if (nextStage) {
                                                                return (
                                                                    <option value={`MOVE_TO_${nextStage.name}`} className="font-bold text-blue-600">
                                                                        Move to {nextStage.name}
                                                                    </option>
                                                                );
                                                            } else {
                                                                // Last Stage - Show Selected
                                                                return <option value="Selected">Selected</option>;
                                                            }
                                                        })()}

                                                        <option value="Rejected">Rejected</option>
                                                        <option value="Hold">Hold</option>
                                                        <option value="Not responding">Not responding</option>
                                                        <option value="Dropped">Dropped</option>

                                                        {/* Fallback/History options if needed, or just keep strict */}
                                                    </>
                                                ) : (
                                                    // Standard Options for other statuses
                                                    <>
                                                        {candidate.status === "Selected" ? (
                                                            <>
                                                                <option value="Selected">Selected</option>
                                                                <option value="Joined">Joined</option>
                                                                <option value="Rejected">Rejected</option>
                                                                <option value="Hold">Hold</option>
                                                                <option value="Not responding">Not responding</option>
                                                                <option value="Dropped">Dropped</option>
                                                            </>
                                                        ) : candidate.status === "Joined" ? (
                                                            <>
                                                                <option value="Joined">Joined</option>
                                                                <option value="Rejected">Rejected</option>
                                                                <option value="Dropped">Dropped</option>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <option value="New">New</option>
                                                                <option value="Shortlisted">Shortlisted</option>
                                                                <option value="Interviewed">Interviewed</option>
                                                                <option value="Selected">Selected</option>
                                                                <option value="Joined">Joined</option>
                                                                <option value="Rejected">Rejected</option>
                                                                <option value="Hold">Hold</option>
                                                                <option value="Not responding">Not responding</option>
                                                                <option value="Dropped">Dropped</option>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </select>
                                            {candidate.status === "Interviewed" && candidate.interviewStage && (
                                                <div className="mt-2 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200 text-center">
                                                    {candidate.interviewStage}
                                                </div>
                                            )}
                                            {candidate.status === "Joined" && candidate.joiningDate && (
                                                <p className="text-[10px] text-green-600 mt-1 font-medium">
                                                    Joined: {formatDate(candidate.joiningDate)}
                                                </p>
                                            )}
                                        </div>
                                        <div data-label="Actions" className="candidate-card-actions">
                                            <button
                                                onClick={() => handleEdit(candidate)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() =>
                                                    setCommentModal({
                                                        candidateId: candidate._id,
                                                        candidateName: profile.name,
                                                        comments: candidate.comments || [],
                                                    })
                                                }
                                                className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg relative"
                                                title="Comments"
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
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                            </div>
                        </div>
                                        {statusFilter === "Joined" && (
                                            <>
                                                {/* OFFER LETTER */}
                                                <div data-label="Offer letter" className="candidate-cell candidate-cell-11 px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                                    {candidate.offerLetter ? (
                                                        <a
                                                            href={getFilePreviewUrl(candidate.offerLetter)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline flex items-center"
                                                        >
                                                            <Upload className="w-4 h-4 mr-1" /> {isWordDocument(candidate.offerLetter) ? 'Download' : 'View'}
                                                        </a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </div>
                                                {/* JOINING DATE */}
                                                <div data-label="Joining date" className="candidate-cell candidate-cell-12 px-6 py-4 text-sm text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        {candidate.joiningDate ? formatDate(candidate.joiningDate) : "-"}
                                                        {/* Edit Button for Joined Details */}
                                                        <button
                                                            onClick={() => handleStatusChange(candidate._id, "Joined", undefined, candidate.joiningDate)}
                                                            className="p-1 hover:bg-gray-100 rounded text-blue-600"
                                                            title="Edit Joining Details"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>


                                            </>
                                        )}


                                        {statusFilter === "Selected" && (
                                            <>
                                                {/* SELECTION DATE */}
                                                <div data-label="Selection date" className="candidate-cell candidate-cell-13 px-6 py-4 text-sm text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        {candidate.selectionDate ? formatDate(candidate.selectionDate) : "-"}
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
                                                </div>

                                                {/* EXPECTED JOINING DATE */}
                                                <div data-label="Expected joining date" className="candidate-cell candidate-cell-14 px-6 py-4 text-sm text-gray-700">
                                                    {candidate.expectedJoiningDate ? formatDate(candidate.expectedJoiningDate) : "-"}
                                                </div>
                                            </>
                                        )}


                        <div className="candidate-card-footer">
                            <div className="candidate-footer-details">
                                <span>Recruiter: <strong>{candidate.createdBy?.name || "—"}</strong></span><i aria-hidden="true">•</i>
                                <span>Mentor: <strong>{candidate.createdBy?.reporter?.name || "—"}</strong></span><i aria-hidden="true">•</i>
                                <span className="candidate-footer-remarks" title={candidate.notes}>Remarks: <strong>{candidate.notes ? `"${candidate.notes}"` : "—"}</strong></span>
                                {candidate.status === "Rejected" && candidate.rejectionReason && <span className="text-red-600">Reason: {candidate.rejectionReason}</span>}
                            </div>
                            <span className="candidate-last-action"><Clock3 aria-hidden="true" />Last action: {profile.lastAction}</span>
                        </div>
                    </article>
                ); })}
            </section>

            {/* Pagination Controls */}
            <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-b-xl shadow-md border-x border-b border-gray-200 -mt-2 mb-6">
                <div className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
                    Showing {pagination.totalCandidates ? ((currentPage - 1) * limit) + 1 : 0} to {Math.min(currentPage * limit, pagination.totalCandidates)} of {pagination.totalCandidates} candidates
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-500">Rows per page
                    <select aria-label="Rows per page" value={limit} onChange={e => { setLimit(Number(e.target.value)); setCurrentPage(1); }} className="rounded border border-slate-200 p-1">
                        {[10, 25, 50].map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                </label>
                <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>

                    <div className="flex items-center gap-1">
                        <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-50 text-orange-600 rounded-lg text-xs sm:text-sm font-semibold">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage >= pagination.totalPages}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
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
                            {searchTerm || filterClient !== "all" || filterJobTitle !== "all" || statusFilter !== "all" || startDate || endDate
                                ? "No candidates match your current filters. Try adjusting your search or filters."
                                : "Get started by adding your first candidate to the system."}
                        </p>
                    </div>
                )
            }

            {/* Form conditionally rendered at top level now */}

            <StatusUpdateModal
                isOpen={statusModalOpen}
                onClose={() => {
                    setStatusModalOpen(false);
                    setPendingStatusChange(null);
                }}
                onConfirm={confirmStatusChange}
                isLoading={isLoading}
                newStatus={pendingStatusChange?.newStatus || ""}
                candidateName={paginatedCandidates.find((c: any) => c._id === pendingStatusChange?.candidateId)?.dynamicFields?.candidateName}
                currentJoiningDate={pendingStatusChange?.currentJoiningDate}
                currentSelectionDate={pendingStatusChange?.currentSelectionDate}
                currentExpectedJoiningDate={pendingStatusChange?.currentExpectedJoiningDate}
                droppedBy={pendingStatusChange?.droppedBy}
                currentRejectedBy={pendingStatusChange?.rejectedBy}
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
        </div >
    );
};
