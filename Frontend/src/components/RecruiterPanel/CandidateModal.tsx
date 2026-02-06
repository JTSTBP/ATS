import { motion } from "framer-motion";
import { X, ChevronDown, ChevronUp, Plus, Trash2, Upload } from "lucide-react";
import { useState, useRef } from "react";
import {
  Candidate,
  JobOpening,
  Skill,
  Experience,
  Education,
  Certification,
} from "../pages/UploadCV";
import { useAuth } from "../../context/AuthProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { toast } from "react-toastify";
import { formatDate } from "../../utils/dateUtils";

interface CandidateModalProps {
  job: JobOpening;
  candidate: Candidate | null;
  onClose: () => void;
  onSave: (candidate: Omit<Candidate, "id" | "appliedDate">) => void;
}

export default function CandidateModal({
  job,
  candidate,
  onClose,
  onSave,
}: CandidateModalProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    personal: true,
    dynamic: true, // 👈 new section for dynamic job-based fields
    skills: false,
    experience: false,
    education: false,
    certifications: false,
    additional: false,
    history: false,
  });
  const { user } = useAuth();
  const { createCandidate, updateCandidate } = useCandidateContext();
  const [resumeFile, setResumeFile] = useState(null);


  const [formData, setFormData] = useState<
    Omit<Candidate, "id" | "appliedDate">
  >({
    createdBy: user?._id,

    jobId: candidate?.job_id || job._id,

    dynamicFields: candidate?.dynamicFields || {},
    linkedinUrl: candidate?.linkedinUrl || "",
    portfolioUrl: candidate?.portfolioUrl || "",
    notes: candidate?.notes || "",
    resumeUrl: candidate?.resumeUrl || "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));



  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^\d{10,15}$/.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate Dynamic Fields (Email and Phone)
    if (job.candidateFields) {
      for (const field of job.candidateFields) {
        const value = formData.dynamicFields?.[field.name];
        if (value) {
          if (field.type === 'email' && !validateEmail(value)) {
            toast.error(`Invalid email for ${field.name}`);
            return;
          }
          if (field.type === 'tel' && !validatePhone(value)) {
            toast.error(`Invalid phone number for ${field.name} (must be 10-15 digits)`);
            return;
          }
        }
      }
    }

    let result;
    if (candidate?._id) {
      result = await updateCandidate(candidate._id, formData, resumeFile);
    } else {
      result = await createCandidate(formData, resumeFile);
    }

    if (result) {
      toast.success(candidate ? "Candidate updated!" : "Candidate created!");

      setFormData({
        jobId: "",
        createdBy: user?._id,
        dynamicFields: {},
        linkedinUrl: "",
        portfolioUrl: "",
        notes: "",
        resumeUrl: "",
      });
      onClose();
    } else {
      toast.error("Something went wrong!");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type - only allow PDF
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'docx' || fileExtension === 'doc') {
      toast.error('DOCX files are not supported. Please upload a PDF file only.');
      e.target.value = ''; // Clear the input
      return;
    }

    if (fileExtension !== 'pdf') {
      toast.error('Only PDF files are allowed for resume uploads.');
      e.target.value = ''; // Clear the input
      return;
    }

    setResumeFile(file);
    setFormData((prev) => ({ ...prev, resumeUrl: file.name }));
  };


  // 🔹 Handle dynamic job-specific field change
  const handleDynamicChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      dynamicFields: {
        ...prev.dynamicFields,
        [name]: value,
      },
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">
              {candidate ? "Edit Candidate" : "Add New Candidate"}
            </h2>
            <p className="text-xs md:text-sm text-slate-600 mt-1">
              Position: <span className="font-semibold">{job.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-4">
            {/* ---------- Dynamic Fields Section ---------- */}
            {job.candidateFields?.length > 0 && (
              <Section
                title="Job Specific Fields"
                expanded={expandedSections.dynamic}
                onToggle={() => toggleSection("dynamic")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.candidateFields.map((field) => {
                    const value = formData.dynamicFields?.[field.name] || "";

                    switch (field.type) {
                      case "select":
                        return (
                          <Select
                            key={field.id}
                            label={field.name}
                            required={field.required}
                            value={value}
                            onChange={(e) =>
                              handleDynamicChange(field.name, e.target.value)
                            }
                            options={field.options || []}
                          />
                        );
                      case "tags":
                        return (
                          <Input
                            key={field.id}
                            label={`${field.name} (comma separated)`}
                            value={value}
                            required={field.required}
                            onChange={(e) =>
                              handleDynamicChange(field.name, e.target.value)
                            }
                            placeholder="e.g., React, Node.js, MongoDB"
                          />
                        );
                      default:
                        return (
                          <Input
                            key={field.id}
                            label={field.name}
                            type={field.type}
                            required={field.required}
                            value={value}
                            onChange={(e) =>
                              handleDynamicChange(field.name, e.target.value)
                            }
                          />
                        );
                    }
                  })}
                </div>
              </Section>
            )}
            {/* ---------- Personal Info Section ---------- */}
            <Section
              title="Personal Information"
              expanded={expandedSections.personal}
              onToggle={() => toggleSection("personal")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 🔹 New Inputs Added Below */}
                <Input
                  label="LinkedIn Profile URL"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedinUrl: e.target.value })
                  }
                  placeholder="https://linkedin.com/in/username"
                />
                <Input
                  label="Portfolio / Website URL"
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, portfolioUrl: e.target.value })
                  }
                  placeholder="https://yourportfolio.com"
                />
                <Input
                  label="Current Company"
                  type="text"
                  value={formData.dynamicFields?.["Company"] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dynamicFields: {
                        ...formData.dynamicFields,
                        "Company": e.target.value
                      }
                    })
                  }
                  placeholder="e.g., Google, Microsoft, etc."
                />
                <Input
                  label="Interview Date"
                  type="datetime-local"
                  value={formData.dynamicFields?.["interviewDate"] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dynamicFields: {
                        ...formData.dynamicFields,
                        "interviewDate": e.target.value
                      }
                    })
                  }
                />
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
                <Input
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <Input
                  label="Phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div> */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Add any notes about this candidate..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Resume / CV
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Upload size={18} />
                    Upload Resume
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {formData.resumeUrl && (
                    <span className="text-sm text-green-600 font-medium">
                      Resume uploaded
                    </span>
                  )}
                </div>
              </div>
            </Section>

            {/* ---------- Status History Section ---------- */}
            <Section
              title="Status History"
              expanded={expandedSections.history}
              onToggle={() => toggleSection("history")}
            >
              <div className="space-y-4">
                {candidate?.statusHistory && candidate.statusHistory.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                    {candidate.statusHistory.slice().reverse().map((history: any, index: number) => (
                      <div key={index} className="relative pl-6">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 mb-1">
                              {history.status}
                            </span>
                            <p className="text-sm text-slate-600 mt-1">
                              {history.comment || <span className="italic text-slate-400">No comment provided</span>}
                            </p>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 sm:mt-0 text-right">
                            <p>{formatDate(history.timestamp)}</p>
                            <p>{new Date(history.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-slate-500 font-medium mt-0.5">
                              by {history.updatedBy?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic text-center py-4">
                    No status history available.
                  </p>
                )}
              </div>
            </Section>

            {/* Other existing sections (skills, experience, etc.) */}
            {/* You can keep the rest of your sections here unchanged */}
          </div>

          <div className="px-4 md:px-6 py-3 md:py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {candidate ? "Update Candidate" : "Save Candidate"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- Helper Components ---------------- */
function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
      >
        <h3 className="font-semibold text-slate-800">{title}</h3>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {expanded && <div className="p-4">{children}</div>}
    </div>
  );
}

function Input({
  label,
  required,
  ...props
}: {
  label: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...props}
        required={required}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      />
    </div>
  );
}

function Select({
  label,
  options,
  required,
  ...props
}: {
  label: string;
  options: string[];
  required?: boolean;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        {...props}
        required={required}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
