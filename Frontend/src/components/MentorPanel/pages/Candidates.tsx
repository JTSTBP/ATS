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
import { CandidateForm } from "./CandidatesForm";
import { useCandidateContext } from "../../../context/CandidatesProvider";
import { useUserContext } from "../../../context/UserProvider";
import { useJobContext } from "../../../context/DataProvider";
import { useAuth } from "../../../context/AuthProvider";
import { toast } from "react-toastify";

import { useSearchParams } from "react-router-dom";

export const CandidatesManager = ({ initialJobTitleFilter = "all", initialFormOpen = false }: { initialJobTitleFilter?: string, initialFormOpen?: boolean }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL;

  const {
    updateStatus,
    candidates,
    fetchCandidatesByUser,
    fetchallCandidates,
    loading,
    deleteCandidate,
  } = useCandidateContext();
  const { users } = useUserContext();
  const { jobs } = useJobContext();

  const [filteredList, setFilteredList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(initialFormOpen);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterClient, setFilterClient] = useState("all");
  const [filterJobTitle, setFilterJobTitle] = useState(initialJobTitleFilter);
  const [filterStage, setFilterStage] = useState("all");
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

  // 1️⃣ Fetch all candidates and clients on load
  useEffect(() => {
    fetchallCandidates();

    // Fetch all clients from API
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clients`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.clients) {
          setClients(data.clients);
        }
      })
      .catch(err => console.error('Error fetching clients:', err));
  }, [user, showForm]);

  // 2️⃣ Filter candidates based on your rules
  useEffect(() => {
    if (!candidates || !user) return;

    // 🔥 Role-Based User Visibility (Same logic you wanted)
    const designation = user?.designation?.toLowerCase();

    let allowedUserIds: string[] = [];

    // 1️⃣ ADMIN → sees all candidates
    if (designation === "admin") {
      allowedUserIds = users.map((u) => u._id);
    }

    // 2️⃣ RECRUITER → only sees their own candidates
    else if (designation === "recruiter") {
      allowedUserIds = [user._id];
    }

    // 3️⃣ MENTOR → sees self + all recruiters directly reporting to mentor
    else if (designation === "mentor") {
      const recruiters = users.filter(
        (u) =>
          u.designation?.toLowerCase() === "recruiter" &&
          (u.reporter?._id === user._id || u.reporter === user._id)
      );

      allowedUserIds = [
        user._id,
        ...recruiters.map((r) => r._id),
      ];
    }

    // 4️⃣ MANAGER → sees self + mentors + all recruiters under those mentors
    else if (designation === "manager") {
      // Step A: Mentors reporting to manager
      const mentors = users.filter(
        (u) =>
          u.designation?.toLowerCase() === "mentor" &&
          (u.reporter?._id === user._id || u.reporter === user._id)
      );

      const mentorIds = mentors.map((m) => m._id);

      // Step B: Recruiters reporting to those mentors
      const recruiters = users.filter(
        (u) =>
          u.designation?.toLowerCase() === "recruiter" &&
          mentorIds.includes(u.reporter?._id || u.reporter)
      );

      allowedUserIds = [
        user._id,
        ...mentorIds,
        ...recruiters.map((r) => r._id),
      ];
    }


    // 🔸 Step 3: Get IDs of jobs where user is assigned or lead
    const assignedJobIds = Array.isArray(jobs)
      ? jobs
        .filter((job) => {
          const isLead =
            (typeof job.leadRecruiter === "object"
              ? job.leadRecruiter?._id
              : job.leadRecruiter) === user._id;
          const isAssigned = job.assignedRecruiters?.some((r) =>
            (typeof r === "object" ? r._id : r) === user._id
          );
          return isLead || isAssigned;
        })
        .map((job) => job._id)
      : [];

    const filtered = candidates.filter((c) => {
      const createdById = c?.createdBy?._id;

      return (
        allowedUserIds.includes(createdById) ||
        assignedJobIds.includes(c.jobId?._id || c.jobId)
      );
    });

    setFilteredList(filtered);
  }, [candidates, users, user, jobs]);

  // 3️⃣ Get unique job titles from filtered candidates
  const uniqueJobTitles = Array.from(
    new Set(
      filteredList
        .map((c) => c.jobId?.title)
        .filter(Boolean)
    )
  ).sort();

  // 3.5️⃣ Get available stages for the selected job
  const availableStages =
    filterJobTitle !== "all" && Array.isArray(jobs)
      ? jobs.find((j) => j.title === filterJobTitle)?.stages || []
      : [];

  // 4️⃣ Search + Client + Job Title filter
  const searchedCandidates = filteredList.filter((candidate) => {
    const name = candidate.dynamicFields?.candidateName?.toLowerCase() || "";
    const email = candidate.dynamicFields?.Email?.toLowerCase() || "";
    const phone = candidate.dynamicFields?.Phone?.toLowerCase() || "";
    const skills = candidate.dynamicFields?.Skills?.toLowerCase() || "";
    const job = candidate.jobId?.title?.toLowerCase() || "";
    const status = candidate.status?.toLowerCase() || "";
    const clientName = candidate.jobId?.clientId?.companyName || "";

    // 🔥 1. STATUS FILTER
    if (statusFilter !== "all" && status !== statusFilter.toLowerCase()) {
      return false;
    }

    // 🔥 2. CLIENT FILTER
    if (filterClient !== "all" && clientName !== filterClient) {
      return false;
    }

    // 🔥 3. JOB TITLE FILTER
    if (filterJobTitle !== "all" && candidate.jobId?.title !== filterJobTitle) {
      return false;
    }

    // 🔥 4. STAGE FILTER
    if (filterStage !== "all" && candidate.interviewStage !== filterStage) {
      return false;
    }

    // 🔎 4. SEARCH FILTER
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
  console.log(searchedCandidates, "searchedCandidates")

  const handleDelete = async (candidateId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this candidate?"
    );
    if (!confirmDelete) return;

    const success = await deleteCandidate(candidateId, user?._id);

    if (success) {
      toast.success("Candidate deleted successfully");
    } else {
      toast.error("Failed to delete candidate");
    }
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

      {/* Search + Filters */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Clients</option>
            {clients.map((client: any) => (
              <option key={client._id} value={client.companyName}>
                {client.companyName}
              </option>
            ))}
          </select>

          <select
            value={filterJobTitle}
            onChange={(e) => setFilterJobTitle(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Job Titles</option>
            {uniqueJobTitles.map((title: any) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>

          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            disabled={filterJobTitle === "all"}
            className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${filterJobTitle === "all" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
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
      </div>

      {/* Status Filter Buttons */}
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
                      onChange={async (e) => {
                        await updateStatus(
                          candidate._id,
                          e.target.value,
                          user?._id
                        );
                        await fetchallCandidates();
                      }}
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
        <div className="bg-white rounded-xl p-12 text-center shadow-md border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No candidates found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm || filterClient !== "all" || filterJobTitle !== "all" || statusFilter !== "all"
              ? "No candidates match your current filters. Try adjusting your search or filters."
              : "Get started by adding your first candidate to the system."}
          </p>
        </div>
      )}

      {/* Form */}
      <CandidateForm
        isOpen={showForm}
        onClose={handleCloseForm}
        candidate={editingCandidate}
      />
    </div>
  );
};
