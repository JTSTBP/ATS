// import { useState, useEffect } from "react";
// import { X } from "lucide-react";

// type Job = {
//   id?: string;
//   title: string;
//   description: string;
//   department: string;
//   location: string;
//   employment_type: string;
//   status: string;
//   requirements?: string;
//   salary_range?: string;
// };

// type JobFormProps = {
//   job: Job | null;
//   onClose: () => void;
//   onSave: (formData: Job) => void; // return form data to parent
// };

// export const JobForm = ({ job, onClose, onSave }: JobFormProps) => {
//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     department: "",
//     location: "",
//     employment_type: "Full-time",
//     status: "Open",
//     requirements: "",
//     salary_range: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (job) {
//       setFormData({
//         title: job.title,
//         description: job.description,
//         department: job.department,
//         location: job.location,
//         employment_type: job.employment_type,
//         status: job.status,
//         requirements: job.requirements || "",
//         salary_range: job.salary_range || "",
//       });
//     }
//   }, [job]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       onSave(formData);
//     } catch (err) {
//       setError("Failed to save job");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//         <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
//           <h3 className="text-2xl font-bold text-gray-800">
//             {job ? "Edit Job" : "Post New Job"}
//           </h3>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-lg transition"
//           >
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-4">
//           {error && (
//             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
//               {error}
//             </div>
//           )}

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Job Title
//             </label>
//             <input
//               type="text"
//               value={formData.title}
//               onChange={(e) =>
//                 setFormData({ ...formData, title: e.target.value })
//               }
//               required
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="e.g., Senior Software Engineer"
//             />
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Department
//               </label>
//               <input
//                 type="text"
//                 value={formData.department}
//                 onChange={(e) =>
//                   setFormData({ ...formData, department: e.target.value })
//                 }
//                 required
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="e.g., Engineering"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Location
//               </label>
//               <input
//                 type="text"
//                 value={formData.location}
//                 onChange={(e) =>
//                   setFormData({ ...formData, location: e.target.value })
//                 }
//                 required
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="e.g., New York, NY"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Employment Type
//               </label>
//               <select
//                 value={formData.employment_type}
//                 onChange={(e) =>
//                   setFormData({ ...formData, employment_type: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               >
//                 <option value="Full-time">Full-time</option>
//                 <option value="Part-time">Part-time</option>
//                 <option value="Contract">Contract</option>
//                 <option value="Internship">Internship</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Status
//               </label>
//               <select
//                 value={formData.status}
//                 onChange={(e) =>
//                   setFormData({ ...formData, status: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               >
//                 <option value="Open">Open</option>
//                 <option value="Closed">Closed</option>
//                 <option value="On Hold">On Hold</option>
//               </select>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Salary Range (Optional)
//             </label>
//             <input
//               type="text"
//               value={formData.salary_range}
//               onChange={(e) =>
//                 setFormData({ ...formData, salary_range: e.target.value })
//               }
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="e.g., $80,000 - $120,000"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Description
//             </label>
//             <textarea
//               value={formData.description}
//               onChange={(e) =>
//                 setFormData({ ...formData, description: e.target.value })
//               }
//               required
//               rows={4}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="Describe the role and responsibilities..."
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Requirements
//             </label>
//             <textarea
//               value={formData.requirements}
//               onChange={(e) =>
//                 setFormData({ ...formData, requirements: e.target.value })
//               }
//               rows={4}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="List qualifications and requirements..."
//             />
//           </div>

//           <div className="flex justify-end space-x-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition disabled:opacity-50"
//             >
//               {loading ? "Saving..." : job ? "Update Job" : "Post Job"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  TablePagination,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Fab,
  Alert,
  Snackbar,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Drawer,
  AppBar,
  Toolbar,
  Badge,
  Tab,
  Tabs,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Switch,
  CircularProgress,
  FormControlLabel,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  DragIndicator as DragIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../context/AuthProvider";
import { useUserContext } from "../../../context/UserProvider";

type Job = {
  id?: string;
  title: string;
  description: string;
  department: string;
  location: string;
  employmentType: string;
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
};

type JobFormProps = {
  job: Job | null;
  onClose: () => void;
  onSave: (formData: Job) => void;
};

export const JobForm = ({ job, onClose, onSave }: JobFormProps) => {
  const [step, setStep] = useState(1);
  const totalSteps = 9;
  const { users } = useUserContext();

  const [formData, setFormData] = useState<Job>({
    title: "",
    description: "",
    department: "",
    location: "",
    employmentType: "Full-time",
    status: "Open",
    keySkills: [],
    salary: { min: "", max: "", currency: "USD" },
    experience: { min: "", max: "", unit: "years" },
    industry: "",
    functionalArea: "",
    education: [],
    requirements: "",
    recruiterDetails: { name: "", email: "", phone: "" },
    brandingOptions: { isFeatured: false, isHighlighted: false },
    stages: [{ name: "", responsible: "Recruiter", mandatory: true }],
    screeningQuestions: [],
    teamMembers: [],
    assignedRecruiters: [],
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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addStage = () => {
    setFormData((prev) => ({
      ...prev,
      stages: [...prev.stages, { name: "", responsible: "Recruiter" }],
    }));
  };

  const removeStage = (index) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index),
    }));
  };

  const updateStage = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) =>
        i === index ? { ...stage, [field]: value } : stage
      ),
    }));
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

  const removeCandidateField = (fieldId) => {
    setFormData((prev) => ({
      ...prev,
      candidateFields: prev.candidateFields.filter(
        (field) => field.id !== fieldId && !field.fixed
      ),
    }));
  };

  const updateCandidateField = (id, key, value) => {
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

  const handleNext = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = job
        ? `http://localhost:5000/api/jobs/${job._id}`
        : "http://localhost:5000/api/jobs";

      const method = job ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to save job");

      onSave(data.job);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  console.log(job, "kkkkk");

  const progress = (step / totalSteps) * 100;

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
                <input
                  type="text"
                  placeholder="Job Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <textarea
                  placeholder="Job Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
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
                <input
                  type="number"
                  placeholder="Min Salary"
                  value={formData.salary?.min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary: { ...formData.salary!, min: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Max Salary"
                  value={formData.salary?.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary: { ...formData.salary!, max: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <select
                  value={formData.salary?.currency}
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
                Skills & Requirements
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
                Key Skills
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
                          keySkills: prev.keySkills.filter(
                            (_, i) => i !== index
                          ),
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
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 3, mt: 3, color: "#1e293b" }}
                >
                  Recruiter Assignment
                </Typography>
              </Grid>

              {/* Assign Multiple Recruiters */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assign Recruiters</InputLabel>
                  <Select
                    multiple
                    value={formData.assignedRecruiters || []}
                    onChange={(e) => {
                      const selectedRecruiters = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        assignedRecruiters: selectedRecruiters,
                        leadRecruiter: selectedRecruiters.includes(
                          prev.leadRecruiter
                        )
                          ? prev.leadRecruiter
                          : "",
                      }));
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={value}
                            size="small"
                            color={
                              formData.leadRecruiter === value
                                ? "primary"
                                : "default"
                            }
                            variant={
                              formData.leadRecruiter === value
                                ? "filled"
                                : "outlined"
                            }
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {users?.map((recruiter) => (
                      <MenuItem key={recruiter._id} value={recruiter._id}>
                        <Checkbox
                          checked={
                            formData.assignedRecruiters?.indexOf(
                              recruiter.name
                            ) > -1
                          }
                        />
                        <ListItemText primary={recruiter.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Lead Recruiter */}
              <Grid item xs={12}>
                <FormControl
                  fullWidth
                  disabled={(formData.assignedRecruiters || []).length === 0}
                >
                  <InputLabel>Lead Recruiter</InputLabel>
                  <Select
                    value={formData.leadRecruiter || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        leadRecruiter: e.target.value,
                      }))
                    }
                  >
                    {(formData.assignedRecruiters || []).map(
                      (recruiterName) => (
                        <MenuItem key={recruiterName} value={recruiterName}>
                          {recruiterName}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Branding Options */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 2, mt: 4, color: "#1e293b" }}
                >
                  Branding Options
                </Typography>
                <Box sx={{ display: "flex", gap: 4 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.brandingOptions?.isFeatured || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            brandingOptions: {
                              ...prev.brandingOptions,
                              isFeatured: e.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label="Featured"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          formData.brandingOptions?.isHighlighted || false
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            brandingOptions: {
                              ...prev.brandingOptions,
                              isHighlighted: e.target.checked,
                            },
                          }))
                        }
                      />
                    }
                    label="Highlighted"
                  />
                </Box>
              </Grid>
            </>
          )}
          {/* interview stage */}
          {step === 5 && (
            <>
              {/* Interview Stages */}
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 3, mt: 3, color: "#1e293b" }}
                >
                  Interview Stages Setup
                </Typography>
              </Grid>

              {formData.stages.map((stage, index) => (
                <Grid item xs={12} key={index}>
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
                      <Grid item xs={12} sm={1}>
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
                      <Grid item xs={12} sm={4}>
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
                      <Grid item xs={12} sm={3}>
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
                      <Grid item xs={12} sm={3}>
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
                      <Grid item xs={12} sm={1}>
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
              <Grid item xs={12}>
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
              <Grid item xs={12}>
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
                <Grid item xs={12} key={index}>
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
                      <Grid item xs={12} sm={4}>
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
                      <Grid item xs={12} sm={3}>
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
                      <Grid item xs={12} sm={3}>
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
                      <Grid item xs={12} sm={2}>
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
                      <Grid item xs={12} sx={{ mt: 2 }}>
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
              <Grid item xs={12}>
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
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => ({
                          ...prev,
                          screeningQuestions: checked
                            ? [...(prev.screeningQuestions || []), q]
                            : prev.screeningQuestions.filter(
                                (ques) => ques !== q
                              ),
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
                {formData.screeningQuestions?.map((q, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span>{q}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          screeningQuestions: prev.screeningQuestions.filter(
                            (item) => item !== q
                          ),
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
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          )}
          {/* {step === 8 && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Review Your Job Details
              </h4>

              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-3">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Basic Details
                  </h5>
                  <p>
                    <strong>Job Title:</strong> {formData.title}
                  </p>
                  <p>
                    <strong>Department:</strong> {formData.department}
                  </p>
                  <p>
                    <strong>Location:</strong> {formData.location}
                  </p>
                  <p>
                    <strong>Employment Type:</strong> {formData.employmentType}
                  </p>
                  <p>
                    <strong>Experience Level:</strong> {formData.experience}
                  </p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Job Description
                  </h5>
                  <p className="whitespace-pre-line">{formData.description}</p>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Interview Stages
                  </h5>
                  {formData.stages?.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {formData.stages.map((stage, i) => (
                        <li key={i}>
                          <strong>{stage.name}</strong> — {stage.responsible}{" "}
                          {stage.mandatory ? "(Mandatory)" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No stages added.</p>
                  )}
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Candidate Form Fields
                  </h5>
                  {formData.candidateFields?.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {formData.candidateFields.map((field, i) => (
                        <li key={i}>
                          <strong>{field.name}</strong> — {field.type}
                          {field.required && " (Required)"}
                          {field.type === "select" &&
                            field.options?.length > 0 && (
                              <>
                                <br />
                                <span className="text-gray-600 ml-4">
                                  Options: {field.options.join(", ")}
                                </span>
                              </>
                            )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">
                      No candidate fields defined.
                    </p>
                  )}
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Additional Settings
                  </h5>
                  <p>
                    <strong>Status:</strong> {formData.status}
                  </p>
                  <p>
                    <strong>Visibility:</strong> {formData.visibility}
                  </p>
                  <p>
                    <strong>Created By:</strong> {formData.createdBy}
                  </p>
                </div>
              </div>
            </div>
          )} */}

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
      </div>
    </div>
  );
};
