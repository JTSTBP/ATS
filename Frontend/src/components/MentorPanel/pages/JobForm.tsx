import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

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
};

type JobFormProps = {
  job: Job | null;
  onClose: () => void;
};

export const JobForm = ({ job, onClose }: JobFormProps) => {
  const [step, setStep] = useState(1);
  const totalSteps = 8;
  const { users } = useUserContext();
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [showClientForm, setShowClientForm] = useState(false);

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
    ],
    clientId: "",
  });

  // Filter only users whose designation is 'Recruiter'
  const getAllowedRecruiters = (loggedUser: any, allUsers: any[]) => {
    const designation = loggedUser?.designation?.toLowerCase();

    // 1️⃣ ADMIN → all recruiters
    if (designation === "admin") {
      return allUsers.filter(u => u.designation?.toLowerCase() === "recruiter");
    }

    // 2️⃣ MENTOR → only recruiters directly under this mentor
    if (designation === "mentor") {
      return allUsers.filter(
        (u) =>
          u.designation?.toLowerCase() === "recruiter" &&
          (u.reporter?._id === loggedUser._id || u.reporter === loggedUser._id)
      );
    }

    // 3️⃣ MANAGER → recruiters under all mentors reporting to this manager
    if (designation === "manager") {
      const mentors = allUsers.filter(
        (u) =>
          u.designation?.toLowerCase() === "mentor" &&
          (u.reporter?._id === loggedUser._id || u.reporter === loggedUser._id)
      );

      const mentorIds = mentors.map((m) => m._id);

      const recruiters = allUsers.filter(
        (u) =>
          u.designation?.toLowerCase() === "recruiter" &&
          mentorIds.includes(u.reporter?._id || u.reporter)
      );

      return recruiters;
    }

    // 4️⃣ Recruiter → sees only themselves
    return allUsers.filter((u) => u._id === loggedUser._id);
  };
  const recruiterUsers = getAllowedRecruiters(user, users);


  console.log(recruiterUsers, "recruiterUsers", users);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { fetchJobs } = useJobContext();

  // Fetch clients function (can be reused)
  const fetchClients = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clients`);
      const data = await response.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

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
        (field) => field.id !== fieldId && !field.fixed
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
    if (job) setFormData(job);
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
    if (!formData.assignedRecruiters || formData.assignedRecruiters.length === 0) return "At least one Recruiter must be assigned";
    if (!formData.stages || formData.stages.length === 0) return "At least one Interview Stage is required";
    if (formData.stages.some(stage => !stage.name.trim())) return "All Interview Stages must have a name";
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

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
            {job ? "Edit Job" : "Post New Job"}
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
                    Job Title <span className="text-red-500">*</span>
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
                    Job Description <span className="text-red-500">*</span>
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
                <div className="grid grid-cols-2 gap-4">
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
              </div>
            </>
          )}

          {/* Step 2 - Salary & Experience */}
          {step === 2 && (
            <>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Salary & Experience
              </h4>
              <div className="grid grid-cols-3 gap-4">
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

              <div className="grid grid-cols-3 gap-4 mt-4">
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

              {/* Assign Multiple Recruiters */}
              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel id="assignedRecruiters-label">
                    Assigned Recruiters <span className="text-red-500">*</span>
                  </InputLabel>
                  <Select
                    labelId="assignedRecruiters-label"
                    multiple
                    value={
                      formData.assignedRecruiters?.map((r) =>
                        typeof r === "object" ? r._id : r
                      ) || []
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      // Always store only the IDs (strings)
                      const selectedIds = (value as any[]).map((v: any) =>
                        typeof v === "object" ? v?._id : v
                      );
                      setFormData((prev) => ({
                        ...prev,
                        assignedRecruiters: selectedIds,
                        leadRecruiter: selectedIds.includes(prev.leadRecruiter)
                          ? prev.leadRecruiter
                          : "",
                      }));
                    }}
                    input={<OutlinedInput label="Assigned Recruiters" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((id) => {
                          // First try to find in recruiterUsers, then in all users
                          const recruiter =
                            recruiterUsers?.find((u) => u._id === id) ||
                            users?.find((u) => u._id === id);

                          return (
                            <Chip
                              key={id}
                              label={recruiter?.name || `User ${id.substring(0, 8)}...`}
                              size="small"
                              color={
                                formData.leadRecruiter === id
                                  ? "primary"
                                  : "default"
                              }
                              variant={
                                formData.leadRecruiter === id
                                  ? "filled"
                                  : "outlined"
                              }
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {recruiterUsers?.map((recruiter) => (
                      <MenuItem key={recruiter._id} value={recruiter._id}>
                        <Checkbox
                          checked={formData.assignedRecruiters?.some(
                            (r) =>
                              (typeof r === "object" ? r._id : r) ===
                              recruiter._id
                          )}
                        />
                        <ListItemText primary={recruiter.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Lead Recruiter */}
              <Grid size={12}>
                <FormControl
                  fullWidth
                  disabled={(formData.assignedRecruiters || []).length === 0
                  }
                >
                  <InputLabel>Lead Recruiter</InputLabel>
                  <Select
                    value={
                      typeof formData.leadRecruiter === "object"
                        ? formData.leadRecruiter._id
                        : formData.leadRecruiter || ""
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        leadRecruiter:
                          typeof e.target.value === "object"
                            ? (e.target.value as any)?._id
                            : e.target.value,
                      }))
                    }
                  >
                    {(formData.assignedRecruiters || []).map((r) => {
                      const id = typeof r === "object" ? r._id : r;
                      const recruiter = recruiterUsers?.find(
                        (u: any) => u?._id === id
                      ) || users?.find((u) => u._id === id);
                      return (
                        <MenuItem key={id} value={id}>
                          {recruiter?.name ||
                            (typeof r === "object" ? r.name : String(r))}
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

          {/* Step 6 - Review */}
          {step === 8 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Review Your Job Details
              </h4>

              <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-3">
                {Object.entries(formData)
                  .filter(
                    ([key]) =>
                      !["_id", "id", "CreatedBy", "UpdatedBy", "__v"].includes(
                        key
                      )
                  )
                  .map(([key, value]) => (
                    <div key={key}>
                      <div className="font-semibold text-gray-700 capitalize mb-1">
                        {key.replace(/([A-Z])/g, " $1")}
                      </div>

                      {/* Candidate Fields - Custom Render */}
                      {key === "candidateFields" && Array.isArray(value) ? (
                        <div className="ml-4 space-y-1">
                          {value.length === 0 ? (
                            <div className="text-gray-500">—</div>
                          ) : (
                            value.map((field: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 text-gray-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                <span>{field.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        /* Default Rendering for other fields */
                        <>
                          {/* Primitive values */}
                          {typeof value !== "object" || value === null ? (
                            <div className="text-gray-800">
                              {value === "" || value === null ? "—" : String(value)}
                            </div>
                          ) : null}

                          {/* Arrays */}
                          {Array.isArray(value) && (
                            <div className="ml-4 space-y-1">
                              {value.length === 0 ? (
                                <div className="text-gray-500">—</div>
                              ) : (
                                value.map((item, index) => (
                                  <div
                                    key={index}
                                    className="border p-2 rounded bg-white"
                                  >
                                    {typeof item === "object" ? (
                                      Object.entries(item)
                                        .filter(
                                          ([k]) =>
                                            ![
                                              "_id",
                                              "id",
                                              "CreatedBy",
                                              "UpdatedBy",
                                              "__v",
                                            ].includes(k)
                                        )
                                        .map(([k, v]) => (
                                          <div key={k} className="flex">
                                            <span className="w-32 font-medium capitalize">
                                              {k.replace(/([A-Z])/g, " $1")}:
                                            </span>
                                            <span>{String(v)}</span>
                                          </div>
                                        ))
                                    ) : (
                                      <span>{String(item)}</span>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* Nested Objects */}
                          {!Array.isArray(value) &&
                            typeof value === "object" &&
                            value !== null && (
                              <div className="ml-4 space-y-1">
                                {Object.entries(value)
                                  .filter(
                                    ([subKey]) =>
                                      ![
                                        "_id",
                                        "id",
                                        "CreatedBy",
                                        "UpdatedBy",
                                        "__v",
                                      ].includes(subKey)
                                  )
                                  .map(([subKey, subValue]) => (
                                    <div key={subKey} className="flex">
                                      <span className="w-32 font-medium capitalize">
                                        {subKey.replace(/([A-Z])/g, " $1")}:
                                      </span>
                                      <span>
                                        {subValue === "" || subValue === null
                                          ? "—"
                                          : String(subValue)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  ))}
              </div>
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
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : job ? "Update Job" : "Post Job"}
                <CheckCircle className="w-4 h-4 ml-1" />
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
