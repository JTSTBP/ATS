
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

type Candidate = {
  _id?: string;
  full_name: string;
  email: string;
  phone: string;
  location?: string;
  experience_years?: number;
  current_company?: string;
  skills?: string[];
  linkedin_url?: string;
  notes?: string;
  cv_filename?: string;
  cv_url?: string;
  status?: string;
};

export const CandidatesManager = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] =
    useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ==================== FETCH ====================
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/candidates`);
      const data = await res.json();
      setCandidates(data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // ==================== DELETE ====================
  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm("Are you sure you want to delete this candidate?"))
      return;
    try {
      await fetch(`${API_BASE}/api/candidates/${id}`, { method: "DELETE" });
      setCandidates((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      console.error("Error deleting candidate:", error);
    }
  };

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCandidate(null);
  };

  // ==================== SAVE (CREATE/UPDATE) ====================
  const handleSave = async (formData: any, cvFile: File | null) => {
    try {
      const form = new FormData();

      // ⭐ Append STATUS FIRST
      if (formData.status) {
        form.append("status", formData.status);
      }

      // ⭐ Append other fields (except status)
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "status") {
          form.append(key, value as string);
        }
      });

      // ⭐ CV file
      if (cvFile) {
        form.append("cv", cvFile);
      }

      let url = `${API_BASE}/api/candidates`;
      let method = "POST";

      if (editingCandidate && editingCandidate._id) {
        url = `${API_BASE}/api/candidates/${editingCandidate._id}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        body: form,
      });

      const savedCandidate = await res.json();

      if (method === "POST") {
        setCandidates((prev) => [savedCandidate, ...prev]);
      } else {
        setCandidates((prev) =>
          prev.map((c) =>
            c._id === savedCandidate._id ? savedCandidate : c
          )
        );
      }

      handleCloseForm();
    } catch (error) {
      console.error("Error saving candidate:", error);
    }
  };

  // ==================== SEARCH FILTER ====================
  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.phone?.includes(searchTerm) ||
      candidate.skills?.some((s) =>
        s.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // ==================== LOADING UI ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // ==================== UI ====================
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
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
                  CV
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {candidate.full_name}
                      </p>
                      {candidate.current_company && (
                        <p className="text-sm text-gray-600">
                          {candidate.current_company}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {candidate.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {candidate.phone}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    {candidate.experience_years
                      ? `${candidate.experience_years} years`
                      : "N/A"}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills?.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}

                      {(candidate.skills?.length || 0) > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{(candidate.skills?.length || 0) - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {candidate.cv_url ? (
                      <a
                        href={`${API_BASE}${candidate.cv_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        View CV
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">No CV</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(candidate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(candidate._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredCandidates.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-md border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No candidates found
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? "Try adjusting your search"
              : "Get started by adding a new candidate"}
          </p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <CandidateForm
          candidate={editingCandidate}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
