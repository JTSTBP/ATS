import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle, UploadCloud, FileText, Download, Trash2, Eye } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { downloadFile, getFilePreviewUrl } from "../../../utils/imageUtils";

import {
  Box,
  Typography,
  Card,
  Button,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Checkbox,
  Tooltip,
  ListItemText,
  Switch,
  FormControlLabel,
  OutlinedInput,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../context/AuthProvider";
import { useUserContext } from "../../../context/UserProvider";
import { useJobContext } from "../../../context/DataProvider";
import LocationInput from "./data/locations";
import IndustryInput from "./data/Industry";
import { SearchableClientSelect } from "./SearchableClientSelect";
import { useClientsContext } from "../../../context/ClientsProvider";
import { ClientForm } from "./Clients/ClientForm";

type Job = {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  department: string;
  location: any[];
  employmentType: string;
  noOfPositions?: number;
  status: string;
  keySkills?: string[];
  salary?: { min: string; max: string; currency: string };
  experience?: { min: string; max: string; unit: string };
  industry?: string;
  functionalArea?: string;
  education?: string[];
  requirements?: string;
  recruiterDetails?: { name: string; email: string; phone: string };
  brandingOptions?: { isFeatured: boolean; isHighlighted: boolean };
  screeningQuestions?: string[];
  teamMembers?: string[];
  stages: { name: string; responsible: string; mandatory?: boolean }[];
  assignedRecruiters?: (string | { _id: string; name: string })[];
  assignedMentors?: (string | { _id: string; name: string })[];
  leadRecruiter?: string | { _id: string; name: string };
  candidateFields: {
    id: string;
    name: string;
    type: string;
    required: boolean;
    fixed: boolean;
    options?: string[];
  }[];
  CreatedBy?: string;
  UpdatedBy?: string;
  clientId?: string;
  communicationTemplates?: { channel: "EMAIL" | "WHATSAPP"; label: string; subject: string; body: string }[];
  jdFile?: string;
  jdFileName?: string;
};

type JobFormProps = {
  job: Job | null;
  onClose: () => void;
};

const createTemplateSet = (channel: "EMAIL" | "WHATSAPP", offset = 0) => {
  const steps = [
    { label: "Job opportunity", subject: "{{jobTitle}} opportunity at {{companyName}}", message: "I am reaching out about the {{jobTitle}} opportunity at {{companyName}} in {{location}}. Please let me know if you would be interested in discussing the role." },
    { label: "First follow-up", subject: "Following up on the {{jobTitle}} opportunity", message: "I wanted to follow up on the {{jobTitle}} opportunity at {{companyName}}. Have you had a chance to consider it? I would be happy to share more details." },
    { label: "Availability", subject: "A quick conversation about {{jobTitle}}", message: "Would you be available for a brief conversation about the {{jobTitle}} role at {{companyName}}? Please share a convenient date and time to connect." },
    { label: "Interest check", subject: "Are you interested in the {{jobTitle}} role?", message: "I am checking whether you would like to explore the {{jobTitle}} opportunity at {{companyName}}. Please let me know your interest or if you have any questions." },
    { label: "Final follow-up", subject: "Final follow-up: {{jobTitle}} at {{companyName}}", message: "This is my final follow-up about the {{jobTitle}} opportunity at {{companyName}}. If you are interested, please reply and we can discuss the next steps. Thank you for your time." },
  ];
  return steps.map((step, index) => ({
    channel,
    label: `${channel === "EMAIL" ? "Email" : "WhatsApp"} ${offset + index + 1}: ${step.label}`,
    subject: channel === "EMAIL" ? step.subject : "",
    body: channel === "EMAIL"
      ? `Hi {{candidateName}},\n\n${step.message}\n\nRegards,\n{{recruiterName}}`
      : `Hi {{candidateName}}, ${step.message} — {{recruiterName}}`,
  }));
};

const getUserReferenceId = (value: string | { _id: string } | null | undefined): string =>
  typeof value === "string" ? value : value?._id || "";

export const JobForm = ({ job, onClose }: JobFormProps) => {
  const [step, setStep] = useState(1);
  const totalSteps = 8;
  const { users } = useUserContext();
  const { user } = useAuth();
  const { clients, fetchClients } = useClientsContext();
  const [showClientForm, setShowClientForm] = useState(false);
  const [jdFileToUpload, setJdFileToUpload] = useState<File | null>(null);
  const [removeExistingJd, setRemoveExistingJd] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setJdFileToUpload(file);
      setRemoveExistingJd(false);
    }
  };

  const [formData, setFormData] = useState<Job>({
    title: "",
    description: "",
    department: "",
    location: [] as any[],
    employmentType: "Full-time",
    noOfPositions: 1,
    status: "Open",
    keySkills: [] as string[],
    salary: { min: "", max: "", currency: "INR" },
    experience: { min: "", max: "", unit: "years" },
    industry: "",
    functionalArea: "",
    education: [] as string[],
    requirements: "",

    stages: [{ name: "", responsible: "Recruiter", mandatory: true }],
    screeningQuestions: [] as string[],
    teamMembers: [] as string[],
    assignedRecruiters: [] as any[],
    assignedMentors: [] as any[],
    leadRecruiter: "",
    candidateFields: [
      {
        id: uuidv4(),
        name: "candidateName",
        type: "text",
        required: true,
        fixed: true,
        options: [],
      },
      {
        id: uuidv4(),
        name: "Email",
        type: "email",
        required: true,
        fixed: true,
        options: [],
      },
      {
        id: uuidv4(),
        name: "Phone",
        type: "tel",
        required: true,
        fixed: true,
        options: [],
      },
      {
        id: uuidv4(),
        name: "currentCompany",
        type: "text",
        required: false,
        fixed: false,
        options: [],
      },
      {
        id: uuidv4(),
        name: "Skills",
        type: "tags",
        required: false,
        fixed: false,
        options: [],
      },
      {
        id: uuidv4(),
        name: "Experience",
        type: "number",
        required: false,
        fixed: false,
        options: [],
      },
      {
        id: uuidv4(),
        name: "currentCTC",
        type: "number",
        required: false,
        fixed: false,
        options: [],
      },
      {
        id: uuidv4(),
        name: "expectedCTC",
        type: "number",
        required: false,
        fixed: false,
        options: [],
      },
      {
        id: uuidv4(),
        name: "noticePeriod",
        type: "text",
        required: false,
        fixed: false,
        options: [],
      },
      {
        id: uuidv4(),
        name: "currentLocation",
        type: "text",
        required: false,
        fixed: false,
        options: [],
      },
      {
        id: uuidv4(),
        name: "preferredLocation",
        type: "text",
        required: false,
        fixed: false,
        options: [],
      },
    ],
    clientId: "",
  });

  // Filter only users whose designation is 'Recruiter'
  const getAllowedRecruiters = (loggedUser: any, allUsers: any[]) => {
    const designation = loggedUser?.designation?.toLowerCase();

    const isReportee = (u: any, parentId: string) => {
      if (!parentId) return false;
      const pidStr = String(parentId);
      const isDirect = String(u?.reporter?._id || u?.reporter) === pidStr;
      const isSecondary = Array.isArray(u?.secondary_managers) && 
        u.secondary_managers.some((sm: any) => String(sm?._id || sm) === pidStr);
      return isDirect || isSecondary;
    };

    // 1️⃣ ADMIN → all active recruiters
    if (designation === "admin") {
      return allUsers.filter(u => u.designation?.toLowerCase() === "recruiter" && !u.isDisabled);
    }

    // 2️⃣ MENTOR → only active recruiters directly under this mentor
    if (designation === "mentor") {
      return allUsers.filter(
        (u) =>
          u.designation?.toLowerCase() === "recruiter" &&
          isReportee(u, loggedUser._id) &&
          !u.isDisabled
      );
    }

    // 3️⃣ MANAGER → active recruiters under all mentors reporting to this manager + direct recruiter reports
    if (designation === "manager") {
      const mentors = allUsers.filter(
        (u) =>
          u.designation?.toLowerCase() === "mentor" &&
          isReportee(u, loggedUser._id)
      );

      const mentorIds = mentors.map((m) => m._id);

      const recruiters = allUsers.filter(
        (u) =>
          u.designation?.toLowerCase() === "recruiter" &&
          (mentorIds.some(mId => isReportee(u, mId)) || isReportee(u, loggedUser._id)) &&
          !u.isDisabled
      );

      return recruiters;
    }

    // 4️⃣ Recruiter → sees only themselves (if active)
    return allUsers.filter((u) => u._id === loggedUser._id && !u.isDisabled);
  };
  const recruiterUsers = getAllowedRecruiters(user, users);
  // Filter only users whose designation is 'Mentor'
  const getAllowedMentors = (loggedUser: any, allUsers: any[]) => {
    const designation = loggedUser?.designation?.toLowerCase();

    const isReportee = (u: any, parentId: string) => {
      const isDirect = u?.reporter?._id === parentId || u?.reporter === parentId;
      const isSecondary = Array.isArray(u?.secondary_managers) && 
        u.secondary_managers.some((sm: any) => (sm?._id || sm) === parentId);
      return isDirect || isSecondary;
    };

    // 1️⃣ ADMIN → all active mentors
    if (designation === "admin") {
      return allUsers.filter(u => u.designation?.toLowerCase() === "mentor" && !u.isDisabled);
    }

    // 2️⃣ MANAGER → only active mentors directly reporting to this manager
    if (designation === "manager") {
      return allUsers.filter(
        (u) =>
          u.designation?.toLowerCase() === "mentor" &&
          isReportee(u, loggedUser._id) &&
          !u.isDisabled
      );
    }

    // 3️⃣ MENTOR/RECRUITER → typically don't allocate to other mentors, but if they do, show only themselves if they are a mentor
    return allUsers.filter(
      (u) =>
        u.designation?.toLowerCase() === "mentor" &&
        u._id === loggedUser._id &&
        !u.isDisabled
    );
  };
  const mentorUsers = getAllowedMentors(user, users);

  const getUserName = (uVal: any) => {
    if (!uVal) return "—";
    if (typeof uVal === "object" && uVal.name) return uVal.name;
    const found = users?.find((u: any) => u._id === uVal || u.id === uVal);
    return found ? found.name : String(uVal);
  };

  const getClientName = (cVal: any) => {
    if (!cVal) return "—";
    if (typeof cVal === "object" && cVal.clientName) return cVal.clientName;
    const found = clients?.find((c: any) => c._id === cVal || c.id === cVal);
    return found ? found.clientName : "—";
  };


  console.log(recruiterUsers, "recruiterUsers", users);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { fetchJobs } = useJobContext();

  // clients are loaded from ClientsProvider context (app-level, no extra fetch needed)

  const addStage = () => {
    setFormData((prev) => ({
      ...prev,
      stages: [...prev.stages, { name: "", responsible: "Recruiter" }],
    }));
  };

  const removeStage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index),
    }));
  };

  const updateStage = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) =>
        i === index ? { ...stage, [field]: value } : stage
      ),
    }));
  };

  const moveStageUp = (index: number) => {
    if (index === 0) return;
    setFormData((prev) => {
      const newStages = [...prev.stages];
      [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]];
      return { ...prev, stages: newStages };
    });
  };

  const moveStageDown = (index: number) => {
    if (index === formData.stages.length - 1) return;
    setFormData((prev) => {
      const newStages = [...prev.stages];
      [newStages[index + 1], newStages[index]] = [newStages[index], newStages[index + 1]];
      return { ...prev, stages: newStages };
    });
  };

  // Candidate Fields Management Functions
  const addCandidateField = () => {
    setFormData((prev) => ({
      ...prev,
      candidateFields: [
        ...prev.candidateFields,
        {
          id: uuidv4(),
          name: "New Field",
          type: "text",
          required: false,
          fixed: false,
          options: [],
        },
      ],
    }));
  };

  const removeCandidateField = (fieldId: string) => {
    setFormData((prev) => ({
      ...prev,
      candidateFields: prev.candidateFields.filter(
        (field) => field.fixed || field.id !== fieldId
      ),
    }));
  };

  const updateCandidateField = (id: string, key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      candidateFields: prev.candidateFields.map((f) =>
        f.id === id ? { ...f, [key]: value } : f
      ),
    }));
  };

  useEffect(() => {
    if (job) setFormData({
      ...job,
      assignedRecruiters: (job.assignedRecruiters || []).filter(reference => Boolean(getUserReferenceId(reference))),
      assignedMentors: (job.assignedMentors || []).filter(reference => Boolean(getUserReferenceId(reference))),
      leadRecruiter: getUserReferenceId(job.leadRecruiter),
    });
  }, [job]);


  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Job Title is required";
    if (!formData.description?.trim()) return "Job Description is required";
    if (!formData.salary?.min) return "Minimum Salary is required";
    if (!formData.salary?.max) return "Maximum Salary is required";
    if (!formData.salary?.currency) return "Currency is required";
    if (!formData.requirements?.trim()) return "Requirements are required";
    if (!formData.keySkills || formData.keySkills.length === 0) return "At least one Key Skill is required";
    if (!formData.assignedRecruiters || formData.assignedRecruiters.length === 0) return "At least one Recruiter or Mentor must be assigned";
    if (!formData.leadRecruiter) return "Lead Person Responsible is required";
    if (!formData.stages || formData.stages.length === 0) return "At least one Interview Stage is required";
    if (formData.stages.some(stage => !stage.name.trim())) return "All Interview Stages must have a name";
    if ((formData.communicationTemplates || []).some(t => !t.label.trim() || !t.body.trim() || (t.channel === "EMAIL" && !t.subject.trim()))) return "Complete the name, message and email subject for every template";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const url = job
        ? `${import.meta.env.VITE_BACKEND_URL}/api/jobs/${job._id}`
        : `${import.meta.env.VITE_BACKEND_URL}/api/jobs`;

      const method = job ? "PUT" : "POST";
      const payload = job
        ? { ...formData, UpdatedBy: user?._id }
        : { ...formData, CreatedBy: user?._id };

      let body: any;
      let headers: Record<string, string> = {};

      if (jdFileToUpload || removeExistingJd) {
        const formDataPayload = new FormData();
        formDataPayload.append("jobData", JSON.stringify(payload));
        if (jdFileToUpload) {
          formDataPayload.append("jdFile", jdFileToUpload);
        }
        if (removeExistingJd) {
          formDataPayload.append("removeJdFile", "true");
        }
        body = formDataPayload;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(payload);
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to save job");

      // ✅ Save data & close popup only on success
      fetchJobs();
      onClose(); // <-- close only after successful save
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transition-all">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-2">
          <h3 className="text-xl font-semibold text-gray-800">
            {job ? "Edit Requirement" : "Post New Requirement"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1 - Basic Info */}
          {step === 1 && (
            <>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Basic Information
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirement Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirement Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Describe the role..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
                <SearchableClientSelect
                  clients={clients}
                  value={formData.clientId || ""}
                  onChange={(clientId) =>
                    setFormData({ ...formData, clientId })
                  }
                  onAddClient={() => setShowClientForm(true)}
                  placeholder="Select Client (Optional)"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IndustryInput
                    value={formData.department} // string now
                    onChange={(newIndustry: any) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: newIndustry,
                      }))
                    }
                  />

                  <Grid size={{ xs: 12 }}>
                    <LocationInput
                      value={formData.location as any}
                      onChange={(newLocation: any) => {
                        setFormData((prev) => ({
                          ...prev,
                          location: newLocation,
                        }))
                      }}
                      label="Location"
                      placeholder="Type city name to search..."
                    />
                  </Grid>
                </div>
                <div className="mt-4">
                  <TextField
                    fullWidth
                    type="number"
                    label="No. of Positions"
                    variant="outlined"
                    value={formData.noOfPositions}
                    onChange={(e) =>
                      setFormData({ ...formData, noOfPositions: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                {/* Job Description File Upload */}
                <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50/60 hover:bg-gray-50 transition-colors mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Job Description (JD) Document
                      <span className="text-xs text-gray-400 font-normal">(Optional — PDF, DOC, DOCX, TXT)</span>
                    </label>
                    {(formData.jdFile || jdFileToUpload) && !removeExistingJd && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        JD Attached
                      </span>
                    )}
                  </div>

                  {/* If an existing file exists and has not been marked for removal or replaced */}
                  {formData.jdFile && !removeExistingJd && !jdFileToUpload && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate" title={formData.jdFileName || "Job_Description.pdf"}>
                            {formData.jdFileName || "Job_Description.pdf"}
                          </p>
                          <p className="text-xs text-green-600 font-medium">Currently attached document</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => window.open(getFilePreviewUrl(formData.jdFile), "_blank")}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="Preview document in new tab"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadFile(formData.jdFile, formData.jdFileName || `${formData.title || "job"}_JD.pdf`)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                          title="Download document"
                        >
                          <Download size={16} />
                        </button>
                        <label
                          htmlFor="jd-file-replace"
                          className="px-2 py-1 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition cursor-pointer text-xs font-semibold border border-gray-200"
                          title="Replace document"
                        >
                          Replace
                        </label>
                        <input
                          id="jd-file-replace"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.rtf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <button
                          type="button"
                          onClick={() => setRemoveExistingJd(true)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Remove document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* If a new file is chosen */}
                  {jdFileToUpload && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate" title={jdFileToUpload.name}>
                            {jdFileToUpload.name}
                          </p>
                          <p className="text-xs text-blue-600 font-medium">
                            {(jdFileToUpload.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <label
                          htmlFor="jd-file-change"
                          className="text-xs text-blue-600 hover:underline cursor-pointer font-medium px-2 py-1"
                        >
                          Change
                        </label>
                        <input
                          id="jd-file-change"
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.rtf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <button
                          type="button"
                          onClick={() => setJdFileToUpload(null)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Empty state / drop area when no file is active */}
                  {(!formData.jdFile || removeExistingJd) && !jdFileToUpload && (
                    <div>
                      <label
                        htmlFor="jd-file-input"
                        className="flex flex-col items-center justify-center py-4 px-3 border border-gray-200 border-dashed rounded-lg bg-white hover:bg-blue-50/40 hover:border-blue-400 cursor-pointer transition-all text-center group"
                      >
                        <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors mb-1" />
                        <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600">
                          Click to browse or drag & drop Job Description file
                        </span>
                        <span className="text-[11px] text-gray-400 mt-0.5">
                          PDF, DOC, DOCX, TXT (Max 15MB)
                        </span>
                      </label>
                      <input
                        id="jd-file-input"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.rtf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      {removeExistingJd && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-center justify-between">
                          <span>⚠️ Previous document will be removed upon saving.</span>
                          <button
                            type="button"
                            onClick={() => setRemoveExistingJd(false)}
                            className="text-blue-600 underline font-semibold ml-2"
                          >
                            Undo
                          </button>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 2 - Salary & Experience */}
          {step === 2 && (
            <>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Salary & Experience
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Salary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={formData.salary?.min}
                    required
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salary: { ...formData.salary!, min: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Salary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={formData.salary?.max}
                    required
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salary: { ...formData.salary!, max: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.salary?.currency}
                    required
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salary: { ...formData.salary!, currency: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <input
                  type="number"
                  placeholder="Min Experience"
                  value={formData.experience?.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience: {
                        ...formData.experience!,
                        min: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Max Experience"
                  value={formData.experience?.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience: {
                        ...formData.experience!,
                        max: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <select
                  value={formData.experience?.unit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience: {
                        ...formData.experience!,
                        unit: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </>
          )}

          {/* Step 3 - Requirements & Skills */}
          {step === 3 && (
            <>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Skills & Requirements <span className="text-red-500">*</span>
              </h4>
              <textarea
                placeholder="Requirements"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
              />
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Key Skills <span className="text-red-500">*</span>
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Press Enter after each skill to add it.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {formData.keySkills?.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          keySkills: (prev.keySkills || []).includes(skill)
                            ? (prev.keySkills || []).filter((s) => s !== skill)
                            : [...(prev.keySkills || []), skill],
                        }))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <input
                type="text"
                placeholder="Type a skill and press Enter"
                className="w-full px-4 py-2 border rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = e.currentTarget.value.trim();
                    if (value) {
                      setFormData((prev) => ({
                        ...prev,
                        keySkills: [...(prev.keySkills || []), value],
                      }));
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
            </>
          )}

          {step === 3 && <section className="mt-5 space-y-3 rounded-xl border p-4">
            <h4 className="font-semibold">Email & WhatsApp follow-up templates</h4>
            <p className="text-sm text-gray-500">The candidate profile name is filled automatically wherever you use {"{{candidateName}}"} in the subject or message. Each click adds five ready-to-edit templates, which run in order for each channel. Personalise with {"{{candidateName}}, {{jobTitle}}, {{companyName}}, {{location}}, {{recruiterName}}"}.</p>
            {(["EMAIL", "WHATSAPP"] as const).map(channel => <div key={channel} className="space-y-3">
              <button type="button" className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700" onClick={() => setFormData(prev => ({ ...prev, communicationTemplates: [...(prev.communicationTemplates || []), ...createTemplateSet(channel, (prev.communicationTemplates || []).filter(template => template.channel === channel).length)] }))}>Add 5 {channel === "EMAIL" ? "email" : "WhatsApp"} templates</button>
              {(formData.communicationTemplates || []).map((template, index) => template.channel === channel && <div key={index} className="space-y-2 rounded-lg border p-3">
                {(["label", ...(channel === "EMAIL" ? ["subject"] : []), "body"] as ("label" | "subject" | "body")[]).map(field => <TextField key={field} fullWidth required label={field === "label" ? "Template name" : field === "subject" ? "Email subject" : "Message"} multiline={field === "body"} minRows={field === "body" ? 3 : undefined} value={template[field]} onChange={event => setFormData(prev => ({ ...prev, communicationTemplates: (prev.communicationTemplates || []).map((item, i) => i === index ? { ...item, [field]: event.target.value } : item) }))} />)}
                <button type="button" className="mr-3 text-sm text-blue-700" onClick={() => setFormData(prev => ({ ...prev, communicationTemplates: (prev.communicationTemplates || []).map((item, i) => i === index ? { ...item, body: `${item.body}{{candidateName}}` } : item) }))}>Insert profile name</button>
                <button type="button" className="text-sm text-red-600" onClick={() => setFormData(prev => ({ ...prev, communicationTemplates: (prev.communicationTemplates || []).filter((_, i) => i !== index) }))}>Remove template</button>
              </div>)}
            </div>)}
          </section>}

          {/* Step 4 - Recruiter & Branding */}
          {step === 4 && (
            <>
              <Grid size={12}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 3, mt: 3, color: "#1e293b" }}
                >
                  Recruiter Assignment
                </Typography>
              </Grid>

              {/* Assign Recruiters */}
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel id="assignedRecruiters-label">
                    Assign Recruiters
                  </InputLabel>
                  <Select
                    labelId="assignedRecruiters-label"
                    multiple
                    value={
                      formData.assignedRecruiters?.filter(id => {
                        const userId = getUserReferenceId(id);
                        return recruiterUsers.some(u => u._id === userId);
                      }).map(id => getUserReferenceId(id)) || []
                    }
                    onChange={(e) => {
                      const selectedRecruiterIds = e.target.value as string[];
                      setFormData((prev) => ({
                        ...prev,
                        assignedRecruiters: selectedRecruiterIds,
                        leadRecruiter: selectedRecruiterIds.includes(getUserReferenceId(prev.leadRecruiter))
                          ? prev.leadRecruiter
                          : "",
                      }));
                    }}
                    input={<OutlinedInput label="Assign Recruiters" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((id) => {
                          const recruiter = recruiterUsers.find((u) => u._id === id);
                          return (
                            <Chip
                              key={id}
                              label={recruiter?.name || id}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {recruiterUsers?.map((recruiter) => (
                      <MenuItem key={recruiter._id} value={recruiter._id}>
                        <Checkbox checked={formData.assignedRecruiters?.some(id => (getUserReferenceId(id)) === recruiter._id)} />
                        <ListItemText primary={recruiter.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Assign Mentors (Allocate to Mentors) */}
              {(user?.designation?.toLowerCase() === "admin" || user?.designation?.toLowerCase() === "manager") && (
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel id="assignedMentors-label">
                      Assign Mentors (Job Allocation)
                    </InputLabel>
                    <Select
                      labelId="assignedMentors-label"
                      multiple
                      value={
                        formData.assignedMentors?.map(id => getUserReferenceId(id)) || []
                      }
                      onChange={(e) => {
                        const selectedMentorIds = e.target.value as string[];
                        setFormData((prev) => ({
                          ...prev,
                          assignedMentors: selectedMentorIds,
                        }));
                      }}
                      input={<OutlinedInput label="Assign Mentors (Job Allocation)" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected.map((id) => {
                            const mentor = mentorUsers.find((u) => u._id === id);
                            return (
                              <Chip
                                key={id}
                                label={mentor?.name || id}
                                size="small"
                                color="primary"
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {mentorUsers?.map((mentor) => (
                        <MenuItem key={mentor._id} value={mentor._id}>
                          <Checkbox checked={formData.assignedMentors?.some(id => (getUserReferenceId(id)) === mentor._id)} />
                          <ListItemText primary={mentor.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}


              {/* Lead Person Responsible */}
              <Grid size={12}>
                <FormControl fullWidth disabled={!formData.assignedRecruiters || formData.assignedRecruiters.length === 0}>
                  <InputLabel>Lead Person Responsible</InputLabel>
                  <Select
                    value={
                      getUserReferenceId(formData.leadRecruiter)
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        leadRecruiter: e.target.value,
                      }))
                    }
                    input={<OutlinedInput label="Lead Person Responsible" />}
                  >
                    {formData.assignedRecruiters?.map((id) => {
                      const userId = getUserReferenceId(id);
                      const assignedUser = [...(recruiterUsers || []), ...(mentorUsers || []), ...(users || [])].find((u) => u._id === userId);
                      return (
                        <MenuItem key={userId} value={userId}>
                          {assignedUser?.name || userId}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          {/* interview stage */}
          {step === 5 && (
            <>
              {/* Interview Stages */}
              <Grid size={12}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 3, mt: 3, color: "#1e293b" }}
                >
                  Interview Stages Setup <span className="text-red-500">*</span>
                </Typography>
              </Grid>

              {formData.stages.map((stage, index) => (
                <Grid size={12} key={index}>
                  <Card
                    sx={{
                      p: 2,
                      mb: 2,
                      border: "1px solid #e2e8f0",
                      position: "relative",
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      {/* Drag and Move Buttons */}
                      <Grid size={{ xs: 12, sm: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <DragIcon sx={{ color: "#94a3b8", cursor: "grab" }} />
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.25,
                            }}
                          >
                            <Tooltip title="Move Up">
                              <IconButton
                                size="small"
                                onClick={() => moveStageUp(index)}
                                disabled={index === 0}
                                sx={{ p: 0.25 }}
                              >
                                <ArrowUpIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Move Down">
                              <IconButton
                                size="small"
                                onClick={() => moveStageDown(index)}
                                disabled={index === formData.stages.length - 1}
                                sx={{ p: 0.25 }}
                              >
                                <ArrowDownIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Stage Name */}
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label={`Stage ${index + 1} Name`}
                          value={stage.name}
                          onChange={(e) =>
                            updateStage(index, "name", e.target.value)
                          }
                          placeholder="e.g., Technical Round"
                        />
                      </Grid>

                      {/* Responsible Dropdown */}
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth>
                          <InputLabel>Responsible</InputLabel>
                          <Select
                            value={stage.responsible}
                            label="Responsible"
                            onChange={(e) =>
                              updateStage(index, "responsible", e.target.value)
                            }
                          >
                            <MenuItem value="Recruiter">Recruiter</MenuItem>
                            <MenuItem value="Mentor">Mentor</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Mandatory Switch */}
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={stage.mandatory}
                              onChange={(e) =>
                                updateStage(
                                  index,
                                  "mandatory",
                                  e.target.checked
                                )
                              }
                              color="primary"
                            />
                          }
                          label="Mandatory"
                        />
                      </Grid>

                      {/* Delete Button */}
                      <Grid size={{ xs: 12, sm: 1 }}>
                        <Tooltip title="Delete Stage">
                          <IconButton
                            color="error"
                            onClick={() => removeStage(index)}
                            disabled={formData.stages.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              ))}

              {/* Add New Stage Button */}
              <Grid size={12}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addStage}
                  sx={{ mt: 1 }}
                >
                  Add Interview Stage
                </Button>
              </Grid>
            </>
          )}

          {step === 6 && (
            <>
              {/* Candidate Form Setup */}
              <Grid size={12}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 3, mt: 3, color: "#1e293b" }}
                >
                  Candidate Form Setup (Dynamic Fields)
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: "#64748b" }}>
                  Define mandatory fields recruiters must fill while uploading
                  CVs for this job.
                </Typography>
              </Grid>

              {formData.candidateFields.map((field, index) => (
                <Grid size={12} key={index}>
                  <Card
                    sx={{
                      p: 2,
                      mb: 2,
                      border: field.fixed
                        ? "1px solid #10b981"
                        : "1px solid #e2e8f0",
                      backgroundColor: field.fixed ? "#f0fdf4" : "white",
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      {/* Field Name */}
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="Field Name"
                          value={field.name}
                          onChange={(e) =>
                            updateCandidateField(
                              field.id,
                              "name",
                              e.target.value
                            )
                          }
                          disabled={field.fixed}
                          variant={field.fixed ? "filled" : "outlined"}
                        />
                      </Grid>

                      {/* Field Type */}
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControl fullWidth disabled={field.fixed}>
                          <InputLabel>Field Type</InputLabel>
                          <Select
                            value={field.type}
                            label="Field Type"
                            onChange={(e) =>
                              updateCandidateField(
                                field.id,
                                "type",
                                e.target.value
                              )
                            }
                            variant={field.fixed ? "filled" : "outlined"}
                          >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="tel">Phone</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="tags">Tags/Skills</MenuItem>
                            <MenuItem value="textarea">Long Text</MenuItem>
                            <MenuItem value="select">Dropdown</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Required Checkbox */}
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.required}
                              onChange={(e) =>
                                updateCandidateField(
                                  field.id,
                                  "required",
                                  e.target.checked
                                )
                              }
                              disabled={field.fixed && field.required}
                            />
                          }
                          label="Required"
                        />
                      </Grid>

                      {/* Delete / Fixed Label */}
                      <Grid size={{ xs: 12, sm: 2 }}>
                        {!field.fixed && (
                          <IconButton
                            color="error"
                            onClick={() => removeCandidateField(field.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                        {field.fixed && (
                          <Chip
                            label="Fixed"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Grid>
                    </Grid>

                    {/* Dropdown Options if type = select */}
                    {field.type === "select" && (
                      <Grid size={12} sx={{ mt: 2 }}>
                        <TextField
                          fullWidth
                          label="Dropdown Options (comma separated)"
                          value={field.options?.join(", ") || ""}
                          onChange={(e) =>
                            updateCandidateField(
                              field.id,
                              "options",
                              e.target.value.split(",").map((opt) => opt.trim())
                            )
                          }
                        />
                      </Grid>
                    )}
                  </Card>
                </Grid>
              ))}

              {/* Add Field Button */}
              <Grid size={12}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addCandidateField}
                  sx={{ mt: 1 }}
                >
                  Add Custom Field
                </Button>
              </Grid>
            </>
          )}

          {/* Step 5 - Screening & Team */}
          {step === 7 && (
            <>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Screening Questions
              </h4>

              <p className="text-sm text-gray-600 mb-2">
                Select from pre-defined questions or add your own custom
                questions below.
              </p>

              {/* Pre-defined questions */}
              <div className="space-y-2 mb-4">
                {[
                  "Why are you interested in this role?",
                  "What is your notice period?",
                  "What are your salary expectations?",
                  "Do you have experience with remote work?",
                  "Are you legally authorized to work in this country?",
                ].map((q) => (
                  <label
                    key={q}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={formData.screeningQuestions?.includes(q)}
                      onChange={() => {
                        setFormData((prev) => ({
                          ...prev,
                          screeningQuestions: (prev.screeningQuestions || []).includes(q)
                            ? (prev.screeningQuestions || []).filter((ques) => ques !== q)
                            : [...(prev.screeningQuestions || []), q],
                        }));
                      }}
                    />
                    {q}
                  </label>
                ))}
              </div>

              {/* Add custom question */}
              <div className="flex gap-2 items-center mb-4">
                <input
                  type="text"
                  placeholder="Add custom question..."
                  id="customQuestion"
                  className="flex-1 px-3 py-2 border rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = e.currentTarget.value.trim();
                      if (value) {
                        setFormData((prev) => ({
                          ...prev,
                          screeningQuestions: [
                            ...(prev.screeningQuestions || []),
                            value,
                          ],
                        }));
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-green-600 text-white rounded-lg"
                  onClick={() => {
                    const input = document.getElementById(
                      "customQuestion"
                    ) as HTMLInputElement;
                    const value = input.value.trim();
                    if (value) {
                      setFormData((prev) => ({
                        ...prev,
                        screeningQuestions: [
                          ...(prev.screeningQuestions || []),
                          value,
                        ],
                      }));
                      input.value = "";
                    }
                  }}
                >
                  Add
                </button>
              </div>

              {/* Display selected questions */}
              <div className="flex flex-wrap gap-2">
                {formData.screeningQuestions?.map((q, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span>{q}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          screeningQuestions: (prev.screeningQuestions || []).filter((_, i) => i !== index),
                        }))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {formData.screeningQuestions?.length === 0 && (
                  <p className="text-gray-500 text-sm">
                    No questions added yet.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Step 8 - Review */}
          {step === 8 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    Review Your Job Details
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Please review all details before creating or updating the job post.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                  Status: {formData.status || "Open"}
                </span>
              </div>

              <div className="rounded-xl border p-4">
                <h5 className="font-semibold">Follow-up templates</h5>
                {(formData.communicationTemplates || []).map((t, i) => <div key={i} className="mt-2 text-sm"><b>{t.channel}: {t.label}</b>{t.subject && <p>{t.subject}</p>}<p className="whitespace-pre-wrap text-gray-600">{t.body}</p></div>)}
                {!formData.communicationTemplates?.length && <p className="text-sm text-gray-500">No templates configured.</p>}
              </div>
              {/* Grid Layout of Clean Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* 1. Basic Info Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                    Basic Information
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Job Title:</span>
                      <span className="font-semibold text-gray-900 text-right">{formData.title || "—"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Client:</span>
                      <span className="font-semibold text-blue-600 text-right">{getClientName(formData.clientId)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Department:</span>
                      <span className="font-semibold text-gray-900 text-right">{formData.department || "—"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Employment Type:</span>
                      <span className="font-semibold text-gray-900 text-right">{formData.employmentType || "—"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Open Positions:</span>
                      <span className="font-semibold text-gray-900 text-right">{formData.noOfPositions || 1}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Location:</span>
                      <span className="font-semibold text-gray-900 text-right">
                        {Array.isArray(formData.location) && formData.location.length > 0
                          ? formData.location.join(", ")
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Compensation & Requirements */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                    Requirements & Compensation
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Experience:</span>
                      <span className="font-semibold text-gray-900 text-right">
                        {formData.experience?.min || 0} - {formData.experience?.max || 0} {formData.experience?.unit || "years"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Salary Range:</span>
                      <span className="font-semibold text-emerald-600 text-right">
                        {formData.salary?.currency || "INR"} {formData.salary?.min || "0"} - {formData.salary?.max || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Industry:</span>
                      <span className="font-semibold text-gray-900 text-right">{formData.industry || "—"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Functional Area:</span>
                      <span className="font-semibold text-gray-900 text-right">{formData.functionalArea || "—"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Education:</span>
                      <span className="font-semibold text-gray-900 text-right">
                        {Array.isArray(formData.education) && formData.education.length > 0
                          ? formData.education.join(", ")
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Team Assignment */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                    Team & Role Assignment
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500 font-medium">Lead Recruiter:</span>
                      <span className="font-semibold text-gray-900">{getUserName(formData.leadRecruiter)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block mb-1">Assigned Recruiters:</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(formData.assignedRecruiters) && formData.assignedRecruiters.length > 0 ? (
                          formData.assignedRecruiters.map((r: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-semibold border border-blue-100">
                              {getUserName(r)}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block mb-1">Assigned Mentors:</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(formData.assignedMentors) && formData.assignedMentors.length > 0 ? (
                          formData.assignedMentors.map((m: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[11px] font-semibold border border-purple-100">
                              {getUserName(m)}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Hiring Pipeline (Stages) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
                    Hiring Pipeline Stages ({formData.stages?.length || 0})
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    {Array.isArray(formData.stages) && formData.stages.length > 0 ? (
                      formData.stages.map((stage: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                          <span className="font-semibold text-gray-800">
                            {idx + 1}. {stage.name || `Stage ${idx + 1}`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                            {stage.responsible || "Recruiter"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>

              </div>

              {/* 5. Key Skills */}
              {Array.isArray(formData.keySkills) && formData.keySkills.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Required Key Skills
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.keySkills.map((skill: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Candidate Form Fields & Screening Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Candidate Form Fields
                  </h5>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {Array.isArray(formData.candidateFields) && formData.candidateFields.length > 0 ? (
                      formData.candidateFields.map((field: any, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 bg-white text-gray-700 rounded-md border border-slate-200 text-xs font-medium">
                          {field.name} {field.required ? <span className="text-red-500">*</span> : ""}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Screening Questions ({formData.screeningQuestions?.length || 0})
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    {Array.isArray(formData.screeningQuestions) && formData.screeningQuestions.length > 0 ? (
                      formData.screeningQuestions.map((q: string, idx: number) => (
                        <div key={idx} className="text-gray-700 bg-white p-2 rounded-lg border border-slate-200">
                          {idx + 1}. {q}
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400">No custom screening questions added.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 7. JD File Attachment */}
              {(jdFileToUpload || formData.jdFileName || formData.jdFile) && (
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-blue-900">
                      Job Description File: {jdFileToUpload ? jdFileToUpload.name : (formData.jdFileName || "Attached Document")}
                    </span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous
              </button>
            ) : (
              <div></div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setStep(step === totalSteps ? 1 : totalSteps);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg"
            >
              {step === totalSteps ? "Go to First Step" : "Go to Final Step"}
            </button>

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-70 transition-all font-bold shadow-md shadow-green-100"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? "Saving..." : job ? "Update Job" : "Post Job"}
                {!loading && <CheckCircle className="w-4 h-4" />}
              </button>
            )}
          </div>
        </form>
      </div >

      {/* Client Form Modal */}
      {
        showClientForm && (
          <ClientForm
            onClose={() => setShowClientForm(false)}
            onSuccess={() => {
              fetchClients();
              setShowClientForm(false);
            }}
            initialData={null}
          />
        )
      }
    </div >
  );
};
