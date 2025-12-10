import React, { useEffect, useRef, useState } from "react";
import { useJobContext } from "../../../context/DataProvider";
import { useAuth } from "../../../context/AuthProvider";
import { useCandidateContext } from "../../../context/CandidatesProvider";
import { toast } from "react-toastify";
import { Upload } from "lucide-react";
import { useUserContext } from "../../../context/UserProvider";

export const CandidateForm = ({ isOpen, onClose, candidate }) => {
  const { jobs, fetchJobs } = useJobContext();
  const { user } = useAuth();
  const { users } = useUserContext();
  const { createCandidate, updateCandidate } = useCandidateContext();
  const fileInputRef = useRef(null);

  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const [formData, setFormData] = useState({
    jobId: "",
    createdBy: user?._id,
    dynamicFields: {},
    linkedinUrl: "",
    portfolioUrl: "",
    notes: "",
    resumeUrl: "",
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  // Initialize form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (candidate) {
      // Find the full job object from jobs list
      const jobObj = jobs.find(
        (j) => j._id === candidate.jobId._id || j._id === candidate.jobId
      );
      setSelectedJob(jobObj || null);

      // Merge job's candidateFields with existing values
      const dynamicFields = {};
      jobObj?.candidateFields?.forEach((field) => {
        if (field.name) {
          dynamicFields[field.name] =
            candidate.dynamicFields?.[field.name] || "";
        }
      });

      setFormData({
        jobId: jobObj?._id || candidate.jobId,
        createdBy: candidate.createdBy?._id || user?._id,
        dynamicFields,
        linkedinUrl: candidate.linkedinUrl || "",
        portfolioUrl: candidate.portfolioUrl || "",
        notes: candidate.notes || "",
        resumeUrl: candidate.resumeUrl || "",
      });
    } else {
      // CREATE MODE
      setSelectedJob(null);
      setFormData({
        jobId: "",
        createdBy: user?._id,
        dynamicFields: {},
        linkedinUrl: "",
        portfolioUrl: "",
        notes: "",
        resumeUrl: "",
      });
    }
  }, [isOpen, candidate, jobs, user?._id]);

  let filteredJobs;

  if (user.designation === "Admin") {
    filteredJobs = jobs;
  } else if (user.designation === "Manager") {
    // 1. Find all reporting users
    const reportingUsers = users.filter((u) => u?.reporter?._id === user._id);

    // Extract reporting user IDs
    const reportingUserIds = reportingUsers.map((u) => u._id);

    // 2. Filter jobs created by manager OR reporting users
    filteredJobs = jobs.filter((job) => {
      const createdById = job?.CreatedBy?._id || job?.CreatedBy;

      return createdById === user._id || reportingUserIds.includes(createdById);
    });
  } else {
    // 👉 Your existing filter
    filteredJobs = jobs.filter(
      (job) => job?.CreatedBy === user._id || job?.CreatedBy?._id === user._id
    );
  }

  const handleJobChange = (e) => {
    const jobId = e.target.value;
    const jobObj = jobs.find((j) => j._id === jobId) || null;
    setSelectedJob(jobObj);

    setFormData((prev) => ({
      ...prev,
      jobId,
      dynamicFields: jobObj
        ? jobObj.candidateFields.reduce((acc, field) => {
          if (field.name) {
            // Keep existing value if editing, else initialize empty
            acc[field.name] = candidate?.dynamicFields?.[field.name] || "";
          }
          return acc;
        }, {})
        : {},
    }));
  };

  const handleDynamicFieldChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      dynamicFields: { ...prev.dynamicFields, [fieldName]: value },
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeFile(file);
    setFormData((prev) => ({ ...prev, resumeUrl: file.name }));
  };

  const renderDynamicField = (field) => {
    if (!field.name) return null;

    const value = formData.dynamicFields[field.name] || "";

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "number":
        return (
          <input
            type={field.type}
            className="w-full p-2 border rounded-lg"
            value={value}
            required={field.required}
            onChange={(e) =>
              handleDynamicFieldChange(field.name, e.target.value)
            }
          />
        );

      case "longtext":
        return (
          <textarea
            className="w-full p-2 border rounded-lg"
            value={value}
            required={field.required}
            rows={3}
            onChange={(e) =>
              handleDynamicFieldChange(field.name, e.target.value)
            }
          />
        );

      case "select":
        return (
          <select
            className="w-full p-2 border rounded-lg"
            value={value}
            required={field.required}
            onChange={(e) =>
              handleDynamicFieldChange(field.name, e.target.value)
            }
          >
            <option value="">Select</option>
            {field.options?.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        );

      case "tags":
        return (
          <input
            type="text"
            className="w-full p-2 border rounded-lg"
            placeholder="Comma separated values"
            required={field.required}
            value={value}
            onChange={(e) =>
              handleDynamicFieldChange(field.name, e.target.value)
            }
          />
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let result;
    if (candidate?._id) {
      result = await updateCandidate(candidate._id, formData, resumeFile);
    } else {
      result = await createCandidate(formData, resumeFile);
    }

    if (result) {
      toast.success(candidate ? "Candidate updated!" : "Candidate created!");
      setSelectedJob(null);
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"></div>
      <div className="fixed inset-0 flex justify-center items-center z-50 animate-fadeIn">
        <div className="bg-white w-[90%] md:w-[600px] max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl relative">
          <button
            className="absolute top-3 right-3 text-gray-600 hover:text-black text-2xl"
            onClick={onClose}
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold mb-4 text-center">
            Candidate Application Form
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Job Selection */}
            <div>
              <h3 className="font-semibold mb-2 text-lg">Job Details</h3>
              <label>Select Job Role</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={formData.jobId}
                onChange={handleJobChange}
                required
              >
                <option value="">Select Job</option>
                {filteredJobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Fields */}
            {selectedJob?.candidateFields?.length > 0 && (
              <div className="border p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">
                  {selectedJob.title} Specific Fields
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedJob.candidateFields.map((field) => (
                    <div key={field.id || field.name}>
                      <label className="block mb-1 text-sm font-medium">
                        {field.name}{" "}
                        {field.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      {renderDynamicField(field)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Details */}
            <div>
              <h3 className="font-semibold mb-2 text-lg">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    className="w-full p-2 border rounded-lg"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedinUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, linkedinUrl: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Portfolio / Website
                  </label>
                  <input
                    type="url"
                    className="w-full p-2 border rounded-lg"
                    placeholder="https://yourportfolio.com"
                    value={formData.portfolioUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, portfolioUrl: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Add any notes..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Resume Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium">Resume / CV</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-100 rounded-lg"
                  >
                    Upload Resume
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {formData.resumeUrl && (
                    <span className="text-green-600 text-sm">
                      Resume uploaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4 hover:bg-blue-700 transition"
            >
              Submit Application
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .animate-fadeIn {
          animation: fadeIn .25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};
