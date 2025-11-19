import {
  Mail,
  Share2,
  Trash2,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  MessageSquare,
  Phone,
  X,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Download,
  Star,
  Link,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthProvider";
import { useCandidateContext } from "../../../../context/CandidatesProvider";
import { useUserContext } from "../../../../context/UserProvider";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

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

const CandidatesList = () => {
  const { id } = useParams();
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState("Relevance");
  const [showCount, setShowCount] = useState("40");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [filteredList, setFilteredList] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [fullFilteredList, setFullFilteredList] = useState([]);
  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const { user } = useAuth();
  const {
    updateStatus,
    candidates,
    fetchCandidatesByJob,
    loading,
    deleteCandidate,
  } = useCandidateContext();
  const { users } = useUserContext();

  // 1️⃣ Fetch all candidates on load
  useEffect(() => {
    if (id) fetchCandidatesByJob(id);
  }, [id]);

  useEffect(() => {
    if (!candidates || !users || !user || !id) return;

    const reportingUsers = users.filter((u) => u?.reporter?._id === user._id);
    const reportingUserIds = reportingUsers.map((u) => u._id);

    let filtered = candidates.filter(
      (c) =>
        (c.createdBy?._id === user._id ||
          reportingUserIds.includes(c.createdBy?._id)) &&
        c.jobId?._id === id
    );

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (c) => c.status?.toLowerCase() === statusFilter.toLowerCase()
      );
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
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    // Save full filtered list before pagination
    setFullFilteredList(filtered);
  }, [candidates, users, user, id, statusFilter, sortBy]);

  useEffect(() => {
    const itemsPerPage = parseInt(showCount);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    setFilteredList(fullFilteredList.slice(startIndex, endIndex));
  }, [fullFilteredList, currentPage, showCount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy, showCount]);

  useEffect(() => {
    setSelectedCandidates([]); // clear selection when list changes (e.g., different job or filters)
  }, [filteredList]);

  const handleDelete = async (candidateId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this candidate?"
    );
    if (!confirmDelete) return;

    const success = await deleteCandidate(candidateId);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-8 border-b border-gray-200">
            {/* ALL */}
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-1 py-4 text-sm font-medium ${
                statusFilter === "all"
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
              onClick={() => setStatusFilter("new")}
              className={`px-1 py-4 text-sm font-medium ${
                statusFilter === "new"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              New{" "}
              <span className="ml-1">
                {statusFilter === "new" ? filteredList.length : ""}
              </span>
            </button>

            {/* SHORTLISTED */}
            <button
              onClick={() => setStatusFilter("shortlisted")}
              className={`px-1 py-4 text-sm font-medium ${
                statusFilter === "shortlisted"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Shortlisted{" "}
              <span className="ml-1">
                {statusFilter === "shortlisted" ? filteredList.length : ""}
              </span>
            </button>

            {/* INTERVIEWED */}
            <button
              onClick={() => setStatusFilter("interviewed")}
              className={`px-1 py-4 text-sm font-medium ${
                statusFilter === "interviewed"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Interviewed{" "}
              <span className="ml-1">
                {statusFilter === "interviewed" ? filteredList.length : ""}
              </span>
            </button>

            {/* SELECTED */}
            <button
              onClick={() => setStatusFilter("selected")}
              className={`px-1 py-4 text-sm font-medium ${
                statusFilter === "selected"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Selected{" "}
              <span className="ml-1">
                {statusFilter === "selected" ? filteredList.length : ""}
              </span>
            </button>

            {/* JOINED */}
            <button
              onClick={() => setStatusFilter("joined")}
              className={`px-1 py-4 text-sm font-medium ${
                statusFilter === "joined"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Joined{" "}
              <span className="ml-1">
                {statusFilter === "joined" ? filteredList.length : ""}
              </span>
            </button>

            {/* REJECTED */}
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`px-1 py-4 text-sm font-medium ${
                statusFilter === "rejected"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Rejected{" "}
              <span className="ml-1">
                {statusFilter === "rejected" ? filteredList.length : ""}
              </span>
            </button>
          </div>
        </div>
      </div>
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

            <div className="flex items-center gap-1 border border-gray-300 rounded">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 ${
                  viewMode === "grid"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 ${
                  viewMode === "list"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
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

            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <Share2 className="w-4 h-4" />
              Shortlist
            </button>

            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <span className="text-red-500">⊘</span>
              Reject
            </button>

            {/* <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <Mail className="w-4 h-4" />
              Email
            </button> */}

            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <span>👤</span>
              Download
            </button>

            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredList.map((candidate) => (
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

                        {/* Job Title */}
                        <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded border border-purple-200">
                          {candidate.jobId?.title || "No Job Assigned"}
                        </span>
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
                        <div className="text-xs text-gray-500 mb-1">Skills</div>
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
                          CTC: ₹{candidate.dynamicFields.currentCTC} → Expected:
                          ₹{candidate.dynamicFields.expectedCTC}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM BAR */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <MessageSquare className="w-4 h-4" />
                      Add comment
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        <span>posted by {candidate.createdBy.name}</span> |{" "}
                        {new Date(candidate.createdAt).toLocaleDateString()}
                      </span>

                      {/* Status button */}
                      <select
                        value={candidate.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const success = await updateStatus(
                            candidate._id,
                            newStatus,
                            user?._id
                          );
                          fetchCandidatesByJob(id);

                          success
                            ? toast.success("Status updated")
                            : toast.error("Failed to update");
                        }}
                        className="px-4 py-2 text-sm rounded-xl border border-gray-300 bg-gray-50
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500
             hover:bg-white transition-all shadow-sm"
                      >
                        <option value="new">New</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="selected">Selected</option>
                        <option value="joined">Joined</option>
                        <option value="rejected">Rejected</option>
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
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                    <Share2 className="w-5 h-5" />
                  </button>

                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-50 rounded">
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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

                    {/* Tags */}
                    {selectedCandidate.tags?.map((tag) => (
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
                      {value || "--"}
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
                    <a
                      href={`${API_BASE_URL}${selectedCandidate.resumeUrl}`}
                      target="_blank"
                      className="px-4 py-2 bg-white border rounded-xl shadow hover:bg-gray-50 flex items-center gap-2 transition"
                    >
                      <Link size={16} className="text-blue-600" /> Resume
                    </a>
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

              <button className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition">
                Move to Next Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatesList;
