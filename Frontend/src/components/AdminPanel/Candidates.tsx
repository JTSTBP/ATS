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
} from "lucide-react";
import { CandidateForm } from "../MentorPanel/pages/CandidatesForm";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useJobContext } from "../../context/DataProvider";
import { useAuth } from "../../context/AuthProvider";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { StatusUpdateModal } from "../Common/StatusUpdateModal";

export const AdminCandidates = ({ initialJobTitleFilter = "all", initialFormOpen = false }: { initialJobTitleFilter?: string, initialFormOpen?: boolean }) => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

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
    const [filterStage, setFilterStage] = useState("all");
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
                stage: filterStage
            });
            fetchPaginatedCandidates(currentPage, limit, {
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

        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, statusFilter, filterClient, filterJobTitle, filterStage, user, showForm, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate, fetchPaginatedCandidates]);


    // Reset page to 1 on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, filterClient, filterJobTitle, filterStage, startDate, endDate, joinStartDate, joinEndDate, selectStartDate, selectEndDate]);


    // 3️⃣ Get unique job titles from JOBS CONTEXT instead of candidates (since candidates are paginated)
    const uniqueJobTitles = Array.from(
        new Set(
            (jobs || []).map((j: any) => j.title).filter(Boolean)
        )
    ).sort();

    // 3.5️⃣ Get available stages for the selected job
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
            pendingStatusChange.interviewStage, // interviewStage
            undefined, // stageStatus
            undefined, // stageNotes
            comment, // comment
            joiningDate,
            offerLetter,
            selectionDate,
            expectedJoiningDate
        );

        // Optimistic update or refetch
        fetchPaginatedCandidates(currentPage, limit, {
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
        setStatusModalOpen(false);
        setPendingStatusChange(null);
    };



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Candidates (Admin View)</h2>
                    <p className="text-gray-600">Manage all candidate profiles and CVs</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Candidate</span>
                </button>
            </div>

            {/* Search + Filters */}
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
                            <div className="w-full h-9"></div> // Placeholder to keep height consistent
                        )}
                    </div>

                </div>
            </div>

            {/* Status Filter Buttons */}
            {user?.designation !== 'Finance' && (
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
            )}

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
                                            {candidate.jobId?.clientId?.companyName && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Client: {candidate.jobId?.clientId?.companyName}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {candidate.createdBy?.name || "-"}-
                                            {candidate.createdBy?.designation}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {candidate.createdBy?.reporter?.name}
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-xl shadow-md border-x border-b border-gray-200 -mt-2 mb-6">
                <div className="text-sm text-slate-500">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.totalCandidates)} of {pagination.totalCandidates} candidates
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>

                    <div className="flex items-center gap-1">
                        <span className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                currentJoiningDate={pendingStatusChange?.currentJoiningDate} // Pass currentJoiningDate
                currentSelectionDate={pendingStatusChange?.currentSelectionDate}
                currentExpectedJoiningDate={pendingStatusChange?.currentExpectedJoiningDate}
            />
        </div >
    );
};
