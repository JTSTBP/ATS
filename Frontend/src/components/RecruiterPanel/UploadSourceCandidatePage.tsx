import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useJobContext } from "../../context/DataProvider";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Upload, FileText, CheckCircle, XCircle, 
  User, Briefcase, Award, Calendar, Plus, Trash2, Tag, Loader2 
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

interface ParsedCandidateData {
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  location: string | null;
  skills: string[];
  education: string | null;
  experience: string | null;
  workHistory: string | null;
  currentCompany: string | null;
  previousCompanies: string[];
  designation: string | null;
  certifications: string[];
  linkedinProfile: string | null;
  noticePeriod: string | null;
  expectedSalary: string | null;
}

export default function UploadSourceCandidatePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { jobs, loading: contextJobsLoading } = useJobContext();

  const [activeJobId, setActiveJobId] = useState<string>("");

  // Job opening details
  const [jobTitle, setJobTitle] = useState<string>("");
  const [jobLoading, setJobLoading] = useState<boolean>(true);

  // Existing source candidates for duplicate check
  const [existingCandidates, setExistingCandidates] = useState<any[]>([]);

  // Upload/Parse state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [parsing, setParsing] = useState<boolean>(false);

  
  // Parsed and editable candidate data
  const [candidateData, setCandidateData] = useState<ParsedCandidateData>({
    name: "",
    email: "",
    phoneNumber: "",
    location: "",
    skills: [],
    education: "",
    experience: "",
    workHistory: "",
    currentCompany: "",
    previousCompanies: [],
    designation: "",
    certifications: [],
    linkedinProfile: "",
    noticePeriod: "",
    expectedSalary: ""
  });
  
  const [resumeFileUrl, setResumeFileUrl] = useState<string>("");
  
  // Custom input state for tag lists
  const [skillInput, setSkillInput] = useState<string>("");
  const [prevCompanyInput, setPrevCompanyInput] = useState<string>("");
  const [certInput, setCertInput] = useState<string>("");

  // Step and Save state
  const [step, setStep] = useState<"upload" | "edit" | "success">("upload");
  const [saving, setSaving] = useState<boolean>(false);

  // Determine the correct back path based on active role/panel
  const getBackPath = () => {
    if (pathname.includes("/Admin")) return "/Admin/candidates";
    if (pathname.includes("/Mentor")) return "/Mentor/candidates";
    if (pathname.includes("/Manager")) return "/Manager/candidates";
    return "/Recruiter/upload-cv";
  };

  // Set active jobId from route parameter if available
  useEffect(() => {
    if (jobId) {
      setActiveJobId(jobId);
    } else {
      setJobLoading(false);
    }
  }, [jobId]);

  // Fetch job title and candidates when activeJobId changes
  useEffect(() => {
    if (!activeJobId) {
      setJobTitle("");
      setExistingCandidates([]);
      return;
    }

    const fetchJobDetails = async () => {
      setJobLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/jobs/${activeJobId}`);
        if (response.data?.success) {
          setJobTitle(response.data.job?.title || "Job Requirement");
        }
      } catch (err) {
        console.error("Error fetching job details", err);
        setJobTitle("Requirement Details");
      } finally {
        setJobLoading(false);
      }
    };

    const fetchExistingCandidates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/source-candidates?jobId=${activeJobId}`);
        if (res.data?.success) {
          setExistingCandidates(res.data.candidates || []);
        }
      } catch (err) {
        console.error("Error fetching existing source candidates", err);
      }
    };

    fetchJobDetails();
    fetchExistingCandidates();
  }, [activeJobId]);

  // Dropzone drag-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext || "")) {
      toast.error("Invalid file format. Please upload PDF, DOC, or DOCX");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must not exceed 5MB");
      return;
    }
    setFile(selectedFile);
  };

  // Perform upload and trigger parsing API
  const handleUploadAndParse = async () => {
    if (!file || !activeJobId) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      // Step 1: Upload the file
      const uploadRes = await axios.post(`${API_BASE_URL}/api/source-candidates/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (uploadRes.data?.success) {
        const uploadedUrl = uploadRes.data.fileUrl;
        const mimeType = uploadRes.data.mimeType;
        setResumeFileUrl(uploadedUrl);
        setUploading(false);
        setParsing(true);

        // Step 2: Parse the file
        const parseRes = await axios.post(`${API_BASE_URL}/api/source-candidates/parse`, {
          fileUrl: uploadedUrl,
          mimeType: mimeType
        });

        if (parseRes.data?.success) {
          const parsed = parseRes.data.data;
          
          setCandidateData({
            name: parsed.name && parsed.name.trim() ? parsed.name : file.name.replace(/\.[^/.]+$/, ""),
            email: parsed.email || "",
            phoneNumber: parsed.phoneNumber || "",
            location: parsed.location || "",
            skills: parsed.skills || [],
            education: parsed.education || "",
            experience: parsed.experience || "",
            workHistory: parsed.workHistory || "",
            currentCompany: parsed.currentCompany || "",
            previousCompanies: parsed.previousCompanies || [],
            designation: parsed.designation || "",
            certifications: parsed.certifications || [],
            linkedinProfile: parsed.linkedinProfile || "",
            noticePeriod: parsed.noticePeriod || "",
            expectedSalary: parsed.expectedSalary || ""
          });

          toast.success("Resume parsed successfully!");
          setStep("edit");
        } else {
          toast.warn("Parsing succeeded, but returned no structured data.");
          setStep("edit");
        }
      } else {
        throw new Error(uploadRes.data?.message || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Resume upload/parsing failed. Please try again.");
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  // Form field modification handler
  const handleInputChange = (field: keyof ParsedCandidateData, value: any) => {
    setCandidateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Skill tags management
  const addSkill = () => {
    if (skillInput.trim() && !candidateData.skills.includes(skillInput.trim())) {
      handleInputChange("skills", [...candidateData.skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    const updated = candidateData.skills.filter((_, i) => i !== index);
    handleInputChange("skills", updated);
  };

  // Previous Companies tags management
  const addPrevCompany = () => {
    if (prevCompanyInput.trim() && !candidateData.previousCompanies.includes(prevCompanyInput.trim())) {
      handleInputChange("previousCompanies", [...candidateData.previousCompanies, prevCompanyInput.trim()]);
      setPrevCompanyInput("");
    }
  };

  const removePrevCompany = (index: number) => {
    const updated = candidateData.previousCompanies.filter((_, i) => i !== index);
    handleInputChange("previousCompanies", updated);
  };

  // Certifications tags management
  const addCert = () => {
    if (certInput.trim() && !candidateData.certifications.includes(certInput.trim())) {
      handleInputChange("certifications", [...candidateData.certifications, certInput.trim()]);
      setCertInput("");
    }
  };

  const removeCert = (index: number) => {
    const updated = candidateData.certifications.filter((_, i) => i !== index);
    handleInputChange("certifications", updated);
  };

  // Validation before Save
  const validateForm = () => {
    const { name, email, phoneNumber } = candidateData;
    if (!name?.trim() && !email?.trim() && !phoneNumber?.trim()) {
      toast.error("Please provide at least one core detail: Name, Email, or Phone Number");
      return false;
    }

    // Email: must have localpart@domain.TLD where TLD is at least 2 letters
    if (email && email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
        toast.error("Please enter a valid email address (e.g. name@gmail.com)");
        return false;
      }
    }

    // Phone: exactly 10 digits (strip spaces/dashes before checking)
    if (phoneNumber && phoneNumber.trim()) {
      const cleaned = phoneNumber.replace(/[\s\-().+]/g, "");
      if (!/^\d{10}$/.test(cleaned)) {
        toast.error("Phone number must be exactly 10 digits");
        return false;
      }
    }

    return true;
  };

  // Save Sourced Candidate
  const handleSaveCandidate = async () => {
    if (!validateForm() || !activeJobId) return;

    // Duplicate validation based on email and phone number
    const email = candidateData.email?.trim();
    const phone = candidateData.phoneNumber?.trim();
    if (email && existingCandidates.some(c => c.email?.trim() === email)) {
      toast.error("A candidate with this email already exists for this requirement.");
      return;
    }
    if (phone && existingCandidates.some(c => c.phoneNumber?.trim() === phone)) {
      toast.error("A candidate with this phone number already exists for this requirement.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...candidateData,
        requirementId: activeJobId,
        resumeFileUrl
      };

      const res = await axios.post(`${API_BASE_URL}/api/source-candidates/save`, payload);

      if (res.data?.success) {
        toast.success("Sourced candidate saved successfully!");
        setStep("success");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save candidate details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Clear/Reset state
  const resetUpload = () => {
    setFile(null);
    setResumeFileUrl("");
    setCandidateData({
      name: "",
      email: "",
      phoneNumber: "",
      location: "",
      skills: [],
      education: "",
      experience: "",
      workHistory: "",
      currentCompany: "",
      previousCompanies: [],
      designation: "",
      certifications: [],
      linkedinProfile: "",
      noticePeriod: "",
      expectedSalary: ""
    });
    setStep("upload");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(getBackPath())}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Upload Source Candidate
          </h1>
          <p className="text-slate-500 mt-1">
            Requirement: {jobLoading ? "Loading..." : <span className="font-semibold text-blue-600">{jobTitle || "None Selected"}</span>}
          </p>
        </div>
      </div>

      {/* Job Selector (Visible if jobId is not in route params) */}
      {!jobId && step === "upload" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Briefcase className="text-blue-600" size={20} />
            Select Job Requirement
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Please choose the job requirement you want to add candidate(s) to before uploading their resume.
          </p>
          <div className="relative">
            <select
              value={activeJobId}
              onChange={(e) => setActiveJobId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition appearance-none cursor-pointer"
            >
              <option value="">-- Select a Requirement --</option>
              {jobs
                .filter((job) => job.status === "Open")
                .map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} {job.clientId?.companyName ? `(${job.clientId.companyName})` : ""}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {!jobId && step === "upload" && jobs.filter(job => job.status === "Open").length === 0 && !contextJobsLoading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-2xl flex gap-3 items-start shadow-sm mb-6">
          <XCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-sm">No Active Requirements Found</h4>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              There are currently no active open requirements to upload candidates to. Please create or open a requirement first.
            </p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Upload View */}
        {step === "upload" && (
          <motion.div
            key="upload-step"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Drag & Drop Card */}
            <div className="lg:col-span-2">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`min-h-[360px] border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/70 scale-[1.02]"
                    : file
                    ? "border-emerald-400 bg-emerald-50/20"
                    : "border-slate-300 hover:border-slate-400 bg-white shadow-sm"
                }`}
              >
                <input
                  type="file"
                  id="resume-file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={!activeJobId}
                />

                {!activeJobId ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                      <Briefcase size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-500 mb-2">
                      Select a requirement first
                    </h3>
                    <p className="text-sm text-slate-400 max-w-sm">
                      Before uploading a resume, you must select the job requirement from the dropdown above.
                    </p>
                  </div>
                ) : !file ? (
                  <label htmlFor="resume-file" className="cursor-pointer group flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-100 group-hover:scale-110 transition-all shadow-sm">
                      <Upload size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">
                      Upload candidate resume
                    </h3>
                    <p className="text-sm text-slate-400 max-w-sm mb-4">
                      Drag and drop your file here, or click to browse files from your computer.
                    </p>
                    <span className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition shadow-sm">
                      Select Resume
                    </span>
                    <p className="text-xs text-slate-400 mt-4">
                      Supported formats: PDF, DOC, DOCX (Max 5MB)
                    </p>
                  </label>
                ) : (
                  <div className="flex flex-col items-center w-full max-w-md">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                      <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1 truncate w-full px-4 text-center">
                      {file.name}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>

                    <div className="flex gap-4 w-full">
                      <button
                        onClick={() => setFile(null)}
                        disabled={uploading}
                        className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-2xl text-sm transition"
                      >
                        Remove
                      </button>
                      <button
                        onClick={handleUploadAndParse}
                        disabled={uploading}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl text-sm transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Uploading...
                          </>
                        ) : (
                          "Upload & Parse"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instruction Panel */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  How it works
                </h3>
                <ul className="space-y-4">
                  <li className="flex gap-3 items-start">
                    <div className="w-6 h-6 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Upload Resume</p>
                      <p className="text-xs text-slate-400 mt-0.5">Select the PDF or Word document of the candidate.</p>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-6 h-6 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">AI Parsing</p>
                      <p className="text-xs text-slate-400 mt-0.5">Our parser will scan the resume and extract contact details, skills, and experience history.</p>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-6 h-6 bg-blue-50 text-blue-600 font-bold rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Review & Save</p>
                      <p className="text-xs text-slate-400 mt-0.5">Correct any mismatched fields, add missing items, and save the candidate directly to the requirement.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 mt-6">
                <p className="text-xs font-semibold text-amber-800">
                  Validation Note
                </p>
                <p className="text-[11px] text-amber-600 mt-1 leading-relaxed">
                  Only at least one of Name, Email, or Phone number is mandatory. All other parsed details are optional to allow flexibility for incomplete resumes.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 1.5: Parsing/Extracting View */}
        {parsing && (
          <motion.div
            key="parsing-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[400px] text-center"
          >
            <div className="relative flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
              <FileText className="absolute text-blue-600 animate-pulse" size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">
              Extracting candidate details...
            </h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Please wait while our parsing engine reads the resume content and populates the profile fields.
            </p>
          </motion.div>
        )}

        {/* Step 2: Form Edit View */}
        {step === "edit" && (
          <motion.div
            key="edit-step"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Alert banner for verification */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-5 py-4 rounded-2xl flex gap-3 items-start shadow-sm">
              <CheckCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-semibold text-sm">Resume parsed successfully!</h4>
                <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                  Please review the extracted information below. Correct any mistakes or add missing details manually before saving.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Candidate Profile Review</span>
                <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-semibold">
                  Source: Resume Upload
                </span>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                {/* Core Personal Details */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={candidateData.name || ""}
                        onChange={e => handleInputChange("name", e.target.value)}
                        placeholder="Enter full name"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={candidateData.email || ""}
                        onChange={e => handleInputChange("email", e.target.value)}
                        placeholder="Enter email address"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={candidateData.phoneNumber || ""}
                        onChange={e => handleInputChange("phoneNumber", e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Current Location
                      </label>
                      <input
                        type="text"
                        value={candidateData.location || ""}
                        onChange={e => handleInputChange("location", e.target.value)}
                        placeholder="e.g. Pune, India"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        LinkedIn Profile
                      </label>
                      <input
                        type="text"
                        value={candidateData.linkedinProfile || ""}
                        onChange={e => handleInputChange("linkedinProfile", e.target.value)}
                        placeholder="e.g. https://www.linkedin.com/in/username"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Work History */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-400" />
                    Employment & Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Current Designation
                      </label>
                      <input
                        type="text"
                        value={candidateData.designation || ""}
                        onChange={e => handleInputChange("designation", e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Current Company
                      </label>
                      <input
                        type="text"
                        value={candidateData.currentCompany || ""}
                        onChange={e => handleInputChange("currentCompany", e.target.value)}
                        placeholder="e.g. Acme Corporation"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Total Experience
                      </label>
                      <input
                        type="text"
                        value={candidateData.experience || ""}
                        onChange={e => handleInputChange("experience", e.target.value)}
                        placeholder="e.g. 5 years"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Expected Salary / CTC
                      </label>
                      <input
                        type="text"
                        value={candidateData.expectedSalary || ""}
                        onChange={e => handleInputChange("expectedSalary", e.target.value)}
                        placeholder="e.g. 15 LPA"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Notice Period
                      </label>
                      <input
                        type="text"
                        value={candidateData.noticePeriod || ""}
                        onChange={e => handleInputChange("noticePeriod", e.target.value)}
                        placeholder="e.g. 30 Days"
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Work Experience History Summary
                      </label>
                      <textarea
                        value={candidateData.workHistory || ""}
                        onChange={e => handleInputChange("workHistory", e.target.value)}
                        placeholder="Summary of previous work experience history..."
                        rows={3}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* List items (Previous companies, skills, education, certs) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Skills Section */}
                  <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-1.5">
                      <Tag size={14} className="text-slate-400" />
                      Skills
                    </label>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
                        placeholder="Add skill tag..."
                        className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                      />
                      <button
                        onClick={addSkill}
                        className="p-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-100 transition"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-1">
                      {candidateData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 border border-blue-100 text-blue-700 shadow-sm"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(index)}
                            className="text-blue-500 hover:text-blue-800 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                      ))}
                      {candidateData.skills.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No skills added.</span>
                      )}
                    </div>
                  </div>

                  {/* Previous Companies Section */}
                  <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-slate-400" />
                      Previous Companies
                    </label>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={prevCompanyInput}
                        onChange={e => setPrevCompanyInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addPrevCompany())}
                        placeholder="Add previous company..."
                        className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                      />
                      <button
                        onClick={addPrevCompany}
                        className="p-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-100 transition"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-1">
                      {candidateData.previousCompanies.map((company, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 shadow-sm"
                        >
                          {company}
                          <button
                            onClick={() => removePrevCompany(index)}
                            className="text-slate-500 hover:text-slate-800 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                      ))}
                      {candidateData.previousCompanies.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No previous companies listed.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Education and Certifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Education details */}
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      Education
                    </h3>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                        Education Details
                      </label>
                      <textarea
                        value={candidateData.education || ""}
                        onChange={e => handleInputChange("education", e.target.value)}
                        placeholder="e.g. B.Tech in Computer Science from IIT Bombay"
                        rows={5}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Certifications details */}
                  <div>
                    <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                      <Award size={16} className="text-slate-400" />
                      Certifications
                    </h3>
                    <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={certInput}
                          onChange={e => setCertInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCert())}
                          placeholder="Add certification..."
                          className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
                        />
                        <button
                          onClick={addCert}
                          className="p-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-100 transition"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto p-1">
                        {candidateData.certifications.map((cert, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50/50 border border-emerald-100 text-emerald-800 shadow-sm"
                          >
                            <span className="truncate pr-4">{cert}</span>
                            <button
                              onClick={() => removeCert(index)}
                              className="text-emerald-500 hover:text-emerald-800 transition shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        {candidateData.certifications.length === 0 && (
                          <span className="text-xs text-slate-400 italic">No certifications added.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="border-t border-slate-100 px-6 py-5 bg-slate-50 flex justify-between items-center">
                <button
                  type="button"
                  onClick={resetUpload}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-sm transition"
                >
                  Clear & Re-upload
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(getBackPath())}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCandidate}
                    disabled={saving}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-green-600/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Save Candidate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Success View */}
        {step === "success" && (
          <motion.div
            key="success-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-lg"
          >
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle size={36} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              Sourced Candidate Saved!
            </h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              The resume and candidate details have been successfully saved into our sourced candidate database for this requirement.
            </p>

            <div className="space-y-3">
              <button
                onClick={resetUpload}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-blue-600/25"
              >
                Upload Another Candidate
              </button>
              <button
                onClick={() => navigate(getBackPath())}
                className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-sm transition"
              >
                Go Back to Requirements
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
