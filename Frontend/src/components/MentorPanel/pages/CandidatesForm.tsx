import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";

type Candidate = {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  location?: string;
  experience_years?: number;
  current_company?: string;
  skills?: string[] | string;
  linkedin_url?: string;
  notes?: string;
  cv_filename?: string;
  status?: string;
};

type CandidateFormProps = {
  candidate: Candidate | null;
  onClose: () => void;
  onSave: (formData: any, cvFile: File | null) => void;
};

export const CandidateForm = ({
  candidate,
  onClose,
  onSave,
}: CandidateFormProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    experience_years: 0,
    current_company: "",
    skills: "",
    linkedin_url: "",
    notes: "",
    status: "Screening",
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (candidate) {
      setFormData({
        full_name: candidate.full_name || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        location: candidate.location || "",
        experience_years: candidate.experience_years || 0,
        current_company: candidate.current_company || "",
        skills: Array.isArray(candidate.skills)
          ? candidate.skills.join(", ")
          : candidate.skills || "",
        linkedin_url: candidate.linkedin_url || "",
        notes: candidate.notes || "",
        status: candidate.status || "Screening",
      });
    }
  }, [candidate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.type.includes("document")) {
        setCvFile(file);
        setError("");
      } else {
        setError("Please upload a PDF or DOC file");
        setCvFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const updatedData = {
        ...formData,
        skills: formData.skills, // IMPORTANT → keep as string
        status: formData.status,
      };

      await onSave(updatedData, cvFile);
    } catch (err) {
      setError("Failed to save candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">
            {candidate ? "Edit Candidate" : "Add New Candidate"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* BASIC INFO */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* CONTACT */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="New York, NY"
              />
            </div>
          </div>

          {/* EXPERIENCE */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience (Years)
              </label>
              <input
                type="number"
                value={formData.experience_years}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experience_years: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Company
              </label>
              <input
                type="text"
                value={formData.current_company}
                onChange={(e) =>
                  setFormData({ ...formData, current_company: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Company Name"
              />
            </div>
          </div>

          {/* SKILLS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) =>
                setFormData({ ...formData, skills: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="React, Node.js, MongoDB"
            />
          </div>

          {/* LINKEDIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={formData.linkedin_url}
              onChange={(e) =>
                setFormData({ ...formData, linkedin_url: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>

          {/* STATUS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Screening">Screening</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* CV UPLOAD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CV (PDF/DOC)
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition">
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Choose File</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {cvFile && (
                <span className="text-sm text-green-600">{cvFile.name}</span>
              )}

              {candidate?.cv_filename && !cvFile && (
                <span className="text-sm text-gray-600">
                  Current: {candidate.cv_filename}
                </span>
              )}
            </div>
          </div>

          {/* NOTES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter notes about the candidate..."
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : candidate
                ? "Update Candidate"
                : "Add Candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
