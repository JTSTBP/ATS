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
import { useUserContext } from "../../context/UserProvider";
import { useAuth } from "../../context/AuthProvider";
import { StatusUpdateModal } from "../Common/StatusUpdateModal";

export const ManagerCandidates = () => {
  const { user } = useAuth();
  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL;

  const { updateStatus, candidates, fetchCandidatesByUser, loading } =
    useCandidateContext();
  const { users } = useUserContext();

  const [filteredList, setFilteredList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    candidateId: string;
    newStatus: string;
  } | null>(null);

  const handleStatusChange = (candidateId: string, newStatus: string) => {
    setPendingStatusChange({ candidateId, newStatus });
    setStatusModalOpen(true);
  };

  const confirmStatusChange = async (comment: string) => {
    if (!pendingStatusChange) return;

    await updateStatus(
      pendingStatusChange.candidateId,
      pendingStatusChange.newStatus,
      user?._id || "",
      undefined, // interviewStage
      undefined, // stageStatus
      undefined, // stageNotes
      comment // comment
    );

    if (user?._id) await fetchCandidatesByUser(user._id);
    setStatusModalOpen(false);
    setPendingStatusChange(null);
  };

  // 1️⃣ Fetch all candidates on load
  useEffect(() => {
    if (user?._id) fetchCandidatesByUser(user._id);
  }, [user, showForm]);

  // 2️⃣ Filter candidates based on your rules
  useEffect(() => {
    if (!candidates || !user) return;

    // 🔸 Get list of users who report to current user
    const reportingUsers = users.filter((u) => u?.reporter?._id === user._id);

    const reportingUserIds = reportingUsers.map((u) => u._id);

    const filtered = candidates.filter(
      (c) =>
        c.createdBy?._id === user._id ||
        reportingUserIds.includes(c.createdBy?._id)
    );

    setFilteredList(filtered);
  }, [candidates, users, user]);

  // 3️⃣ Search filter
  const searchedCandidates = filteredList.filter((candidate) => {
    const name = candidate.dynamicFields?.candidateName?.toLowerCase() || "";
    const email = candidate.dynamicFields?.Email?.toLowerCase() || "";
    const phone = candidate.dynamicFields?.Phone?.toLowerCase() || "";
    const skills = candidate.dynamicFields?.Skills?.toLowerCase() || "";
    const job = candidate.jobId?.title?.toLowerCase() || "";
    const status = candidate.status?.toLowerCase() || "";

    // 🔥 1. STATUS FILTER
    if (statusFilter !== "all" && status !== statusFilter.toLowerCase()) {
      return false;
    }

    // 🔎 2. SEARCH FILTER
    if (
      name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm.toLowerCase()) ||
      skills.includes(searchTerm.toLowerCase()) ||
      job.includes(searchTerm.toLowerCase())
    ) {
      return true;
    }

    return false;
  });

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCandidate(null);
  };

  const handleDelete = (id) => {
    if (!confirm("Are you sure to delete?")) return;
  };


  if (loading)
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

      <div className="flex gap-3 bg-white p-4 rounded-xl shadow-md border border-gray-200">
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

      {/* Table */}
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
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Experience
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Skills
                </th>
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
                  Status
                </th>

                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {searchedCandidates.map((candidate) => (
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

                  {/* EXPERIENCE */}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {candidate.dynamicFields?.Experience
                      ? `${candidate.dynamicFields.Experience} years`
                      : "-"}
                  </td>

                  {/* SKILLS */}
                  <td className="px-6 py-4">
                    {candidate.dynamicFields?.Skills ? (
                      <div className="flex flex-wrap gap-1">
                        {candidate.dynamicFields.Skills.split(",").map(
                          (skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {skill.trim()}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No Skills</span>
                    )}
                  </td>

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
                    {candidate.jobId.title || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {candidate.createdBy.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <select
                      value={candidate.status || "New"}
                      onChange={(e) =>
                        handleStatusChange(candidate._id, e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="New">New</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Interviewed">Interviewed</option>
                      <option value="Selected">Selected</option>
                      <option value="Joined">Joined</option>
                      <option value="Rejected">Rejected</option>
                    </select>
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
      </div>

      {/* Empty UI */}
      {searchedCandidates.length === 0 && (
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
        candidateName={searchedCandidates.find((c) => c._id === pendingStatusChange?.candidateId)?.dynamicFields?.candidateName}
      />
    </div>
  );
};
