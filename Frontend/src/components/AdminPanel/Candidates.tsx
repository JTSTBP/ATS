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
} from "lucide-react";
import { CandidateForm } from "../MentorPanel/pages/CandidatesForm";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useJobContext } from "../../context/DataProvider";
import { useAuth } from "../../context/AuthProvider";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { StatusUpdateModal } from "../Common/StatusUpdateModal";
import { formatDate } from "../../utils/dateUtils";
import { getImageUrl, getFilePreviewUrl, isWordDocument } from "../../utils/imageUtils";


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

export const AdminCandidates = ({ initialJobTitleFilter = "all", initialFormOpen = false }: { initialJobTitleFilter?: string, initialFormOpen?: boolean }) => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    const {
        updateStatus,
        paginatedCandidates,
        pagination,
        fetchPaginatedCandidates,
        loading,
        deleteCandidate,
    } = useCandidateContext();
    const { jobs } = useJobContext();

    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(initialFormOpen);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [filterClient, setFilterClient] = useState("all");
    const [filterJobTitle, setFilterJobTitle] = useState(initialJobTitleFilter);
    const [filterJobStatus, setFilterJobStatus] = useState("all");
    const [filterReporter, setFilterReporter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [joinStartDate, setJoinStartDate] = useState("");
    const [joinEndDate, setJoinEndDate] = useState("");
    const [selectStartDate, setSelectStartDate] = useState("");
    const [selectEndDate, setSelectEndDate] = useState("");


    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

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

    // Enforce "Joined" status for Finance users
    useEffect(() => {
        if (user?.designation === 'Finance') {
            setStatusFilter("Joined");
        }
    }, [user]);

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
                jobStatus: filterJobStatus
            });
            fetchPaginatedCandidates(currentPage, limit, {
                search: searchTerm,
                status: statusFilter,
                client: filterClient,
                jobTitle: filterJobTitle,
                reporterId: filterReporter,
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
    }, [currentPage, searchTerm, statusFilter, filterClient, filterJobTitle, filterReporter, filterJobStatus, user, showForm, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate, fetchPaginatedCandidates]);


    // Reset page to 1 on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, filterClient, filterJobTitle, filterReporter, filterJobStatus, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate]);


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
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        candidateId: string;
        newStatus: string;
        interviewStage?: string;
        currentJoiningDate?: string;
        currentSelectionDate?: string;
        currentExpectedJoiningDate?: string;
        droppedBy?: string;
    } | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const handleStatusChange = (
        candidateId: string,
        newStatus: string,
        interviewStage?: string,
        currentJoiningDate?: string,
        currentSelectionDate?: string,
        currentExpectedJoiningDate?: string,
        droppedBy?: string
    ) => {
        setPendingStatusChange({
            candidateId,
            newStatus,
            interviewStage,
            currentJoiningDate,
            currentSelectionDate,
            currentExpectedJoiningDate,
            droppedBy
        });
        setStatusModalOpen(true);
    };

    const confirmStatusChange = async (comment: string, joiningDate?: string, offerLetter?: File, selectionDate?: string, expectedJoiningDate?: string, rejectedBy?: string, offeredCTC?: string, rejectionReason?: string) => {
        if (!pendingStatusChange) return;

        // Determine if this is a drop or reject
        const isDropped = pendingStatusChange.newStatus === "Dropped";
        const droppedByValue = isDropped ? pendingStatusChange.droppedBy : undefined;
        const rejectedByValue = !isDropped ? rejectedBy : undefined;

        await updateStatus(
            pendingStatusChange.candidateId,
            pendingStatusChange.newStatus,
            user?._id || "",
            pendingStatusChange.interviewStage, // interviewStage
            undefined, // stageStatus
            undefined, // stageNotes
            comment, // comment
            joiningDate,
            offerLetter,
            selectionDate,
            expectedJoiningDate,
            rejectedByValue,
            offeredCTC,
            droppedByValue,
            rejectionReason
        );

        // Optimistic update or refetch
        fetchPaginatedCandidates(currentPage, limit, {
            search: searchTerm,
            status: statusFilter,
            client: filterClient,
            jobTitle: filterJobTitle,
            reporterId: filterReporter,
            jobStatus: filterJobStatus,
            startDate,
            endDate,
            joinStartDate,
            joinEndDate,
            selectStartDate,
            selectEndDate
        });
        setStatusModalOpen(false);
        setPendingStatusChange(null);
    };



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Candidates (Admin View)</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Manage all candidate profiles and CVs</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-md w-full sm:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Candidate</span>
                </button>
            </div>

            {/* Search + Filters */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-200 space-y-4 sm:space-y-6">
                {/* Search Bar Row */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone, or skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm sm:text-base"
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
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reportees</label>
                        <SearchableSelect
                            options={[
                                { value: 'all', label: 'All Mentors' },
                                ...mentors.filter(m => m.name).map(m => ({ value: m._id, label: m.name }))
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
                        {(startDate || endDate || joinStartDate || joinEndDate || selectStartDate || selectEndDate || filterClient !== "all" || filterJobTitle !== "all" || filterReporter !== "all" || filterJobStatus !== "all" || searchTerm || statusFilter !== "all") ? (
                            <button
                                onClick={() => {
                                    setStartDate("");
                                    setEndDate("");
                                    setJoinStartDate("");
                                    setJoinEndDate("");
                                    setSelectStartDate("");
                                    setSelectEndDate("");
                                    setFilterReporter("all");
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
            {user?.designation !== 'Finance' && (
                <div className="bg-white p-2 sm:p-4 rounded-xl shadow-md border border-gray-200">
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 whitespace-nowrap scrollbar-hide">
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
                        ].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium capitalize transition-colors
                                ${statusFilter === status
                                        ? "bg-orange-600 text-white shadow-sm"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                    }
                                `}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Name
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Contact
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Client
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Designation
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Upload Date
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Requirement Status
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Resume
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Created By
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Reportees
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Status
                                </th>
                                {statusFilter === "Joined" && (
                                    <>
                                        <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                            Offer Letter
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                            Joining Date
                                        </th>
                                    </>
                                )}
                                {statusFilter === "Selected" && (
                                    <>
                                        <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                            Selection Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                            Expected Joining Date
                                        </th>
                                    </>
                                )}
                                <th className="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                                    Remarks
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold whitespace-nowrap">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedCandidates.map((candidate: any) => (
                                    <tr key={candidate._id} className="hover:bg-gray-50 transition">
                                        {/* NAME */}
                                        <td className="px-6 py-4 font-semibold text-gray-800 whitespace-nowrap">
                                            {candidate.dynamicFields?.candidateName || "-"}
                                        </td>

                                        {/* CONTACT */}
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                            <div className="flex items-center mb-1">
                                                <Mail className="w-4 h-4 mr-2" />
                                                {candidate.dynamicFields?.Email || "No Email"}
                                            </div>
                                            <div className="flex items-center">
                                                <Phone className="w-4 h-4 mr-2" />
                                                {candidate.dynamicFields?.Phone || "No Phone"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                            {candidate.jobId?.clientId?.companyName || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                            {candidate.jobId?.title || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                            {candidate.createdAt ? formatDate(candidate.createdAt) : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${candidate.jobId?.status === 'Open' ? 'bg-green-100 text-green-700' :
                                                candidate.jobId?.status === 'Closed' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {candidate.jobId?.status || "Open"}
                                            </span>
                                        </td>


                                        {/* RESUME */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {candidate.resumeUrl ? (
                                                <a
                                                    href={getFilePreviewUrl(candidate.resumeUrl)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    download={isWordDocument(candidate.resumeUrl)}
                                                    className="flex items-center text-blue-600"
                                                >
                                                    <Upload className="w-4 h-4 mr-1" />
                                                    {isWordDocument(candidate.resumeUrl) ? 'Download Resume' : 'View Resume'}
                                                </a>

                                            ) : (
                                                <span className="text-gray-400 text-sm">No Resume</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                            {candidate.createdBy?.name || "-"}-
                                            {candidate.createdBy?.designation}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                            {candidate.createdBy?.reporter?.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                            <select
                                                value={candidate.status || "New"}
                                                onChange={(e) => {
                                                    const newStatus = e.target.value;
                                                    let droppedByVal = undefined;
                                                    if (newStatus === "Dropped") {
                                                        if (candidate.status === "Shortlisted") {
                                                            droppedByVal = "Mentor";
                                                        } else if (candidate.status === "Interviewed") {
                                                            droppedByVal = "Client";
                                                        } else {
                                                            droppedByVal = "Mentor";
                                                        }
                                                    }
                                                    handleStatusChange(candidate._id || "", newStatus, undefined, candidate.joiningDate, candidate.selectionDate, candidate.expectedJoiningDate, droppedByVal);
                                                }}
                                                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500"
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
                                        </td>
                                        {statusFilter === "Joined" && (
                                            <>
                                                {/* OFFER LETTER */}
                                                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                                    {candidate.offerLetter ? (
                                                        <a
                                                            href={getFilePreviewUrl(candidate.offerLetter)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            download={isWordDocument(candidate.offerLetter)}
                                                            className="text-blue-600 hover:underline flex items-center"
                                                        >
                                                            <Upload className="w-4 h-4 mr-1" /> {isWordDocument(candidate.offerLetter) ? 'Download' : 'View'}
                                                        </a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                                {/* JOINING DATE */}
                                                <td className="px-6 py-4 text-sm text-gray-700">
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
                                                </td>


                                            </>
                                        )}


                                        {statusFilter === "Selected" && (
                                            <>
                                                {/* SELECTION DATE */}
                                                <td className="px-6 py-4 text-sm text-gray-700">
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
                                                </td>

                                                {/* EXPECTED JOINING DATE */}
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {candidate.expectedJoiningDate ? formatDate(candidate.expectedJoiningDate) : "-"}
                                                </td>
                                            </>
                                        )}

                                        {/* REMARKS */}
                                        <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate whitespace-nowrap" title={candidate.notes}>
                                            {candidate.status === "Rejected" && candidate.rejectionReason && (
                                                <div className="text-xs text-red-600 font-semibold mb-1">
                                                    Reason: {candidate.rejectionReason}
                                                </div>
                                            )}
                                            {candidate.notes || "-"}
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="px-6 py-4 flex space-x-2 whitespace-nowrap">
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* Pagination Controls */}
            <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-b-xl shadow-md border-x border-b border-gray-200 -mt-2 mb-6">
                <div className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.totalCandidates)} of {pagination.totalCandidates} candidates
                </div>
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
                        disabled={currentPage === pagination.totalPages}
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

            {/* Form */}
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
                candidateName={paginatedCandidates.find((c: any) => c._id === pendingStatusChange?.candidateId)?.dynamicFields?.candidateName}
                currentJoiningDate={pendingStatusChange?.currentJoiningDate}
                currentSelectionDate={pendingStatusChange?.currentSelectionDate}
                currentExpectedJoiningDate={pendingStatusChange?.currentExpectedJoiningDate}
                droppedBy={pendingStatusChange?.droppedBy}
            />
        </div >
    );
};
