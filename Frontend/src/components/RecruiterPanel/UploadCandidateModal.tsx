import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Upload, FileText, CheckCircle } from "lucide-react";
import { Job } from "../../context/DataProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useAuth } from "../../context/AuthProvider";
import { toast } from "react-toastify";

interface UploadCandidateModalProps {
    job: Job;
    onClose: () => void;
}

export default function UploadCandidateModal({ job, onClose }: UploadCandidateModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
    const { createCandidate } = useCandidateContext();
    const { user } = useAuth();

    // Dynamic candidate details state
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});

    // Initialize form data based on job.candidateFields
    useEffect(() => {
        const initialData: Record<string, any> = {};
        job.candidateFields?.forEach(field => {
            initialData[field.name] = "";
        });
        setFormData(initialData);

        const initialScreening: Record<string, string> = {};
        job.screeningQuestions?.forEach((q, index) => {
            initialScreening[`question_${index}`] = "";
        });
        setScreeningAnswers(initialScreening);
    }, [job]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate file type - allow PDF and Word Documents
            const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
            const allowedExtensions = ['pdf', 'doc', 'docx'];

            if (!allowedExtensions.includes(fileExtension || '')) {
                alert('Only PDF and Word documents (.doc, .docx) are allowed for resume uploads.');
                e.target.value = ''; // Clear the input
                return;
            }

            // Validate file size (5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB. Please upload a smaller file.");
                e.target.value = ""; // Clear selection
                return;
            }

            setFile(selectedFile);
            setUploadStatus("idle");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selectedFile = e.dataTransfer.files[0];

            // Validate file type - allow PDF and Word Documents
            const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
            const allowedExtensions = ['pdf', 'doc', 'docx'];

            if (!allowedExtensions.includes(fileExtension || '')) {
                alert('Only PDF and Word documents (.doc, .docx) are allowed for resume uploads.');
                return;
            }

            // Validate file size (5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB. Please upload a smaller file.");
                return;
            }

            setFile(selectedFile);
            setUploadStatus("idle");
        }
    };

    const handleInputChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleScreeningChange = (key: string, value: string) => {
        setScreeningAnswers(prev => ({ ...prev, [key]: value }));
    };

    const handleUpload = async () => {
        if (!file) return;

        // Validate required fields
        const missingFields = job.candidateFields?.filter(field => field.required && !formData[field.name]);
        if (missingFields && missingFields.length > 0) {
            alert(`Please fill in all required fields: ${missingFields.map(f => f.name).join(", ")}`);
            return;
        }

        setUploading(true);

        try {
            const payload = {
                jobId: job._id as string,
                createdBy: user?._id || "",
                dynamicFields: { ...formData, ...screeningAnswers },
                linkedinUrl: formData.linkedinUrl || "",
                portfolioUrl: formData.portfolioUrl || "",
                notes: formData.notes || "",
            };

            const result = await createCandidate(payload, file);

            if (result) {
                setUploadStatus("success");
            } else {
                setUploadStatus("error");
            }
        } catch (error) {
            console.error("Upload error:", error);
            setUploadStatus("error");
            toast.error("Failed to upload candidate");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                    <div>
                        <h3 className="font-bold text-slate-800">Upload Candidate</h3>
                        <p className="text-xs text-slate-500 mt-0.5">For: {job.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {uploadStatus === "success" ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-2">Upload Successful!</h4>
                            <p className="text-slate-600 mb-6">
                                The candidate has been successfully added to this position.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* File Upload Section */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 mb-6 ${isDragging
                                    ? "border-blue-500 bg-blue-50"
                                    : file
                                        ? "border-blue-200 bg-blue-50/30"
                                        : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                                    }`}
                            >
                                <input
                                    type="file"
                                    id="cv-upload"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {file ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <FileText size={20} className="text-blue-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-slate-800 text-sm">{file.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFile(null)}
                                            className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label htmlFor="cv-upload" className="cursor-pointer flex flex-col items-center">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                                            <Upload size={24} className="text-slate-400" />
                                        </div>
                                        <p className="font-medium text-slate-700 mb-1">
                                            Click to upload CV or drag and drop
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            PDF, DOC, DOCX (Max 5MB)
                                        </p>
                                    </label>
                                )}
                            </div>

                            {/* Dynamic Candidate Details Form */}
                            <div className="space-y-4 mb-6">
                                <h4 className="font-semibold text-slate-800 text-sm mb-3">Candidate Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {job.candidateFields?.map((field) => (
                                        <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                            <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                                {field.name} {field.required && <span className="text-red-500">*</span>}
                                            </label>
                                            {field.type === 'select' ? (
                                                <select
                                                    value={formData[field.name] || ""}
                                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                                >
                                                    <option value="">Select {field.name}</option>
                                                    {field.options?.map((opt, idx) => (
                                                        <option key={idx} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'textarea' ? (
                                                <textarea
                                                    value={formData[field.name] || ""}
                                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                    placeholder={`Enter ${field.name}`}
                                                    rows={3}
                                                />
                                            ) : (
                                                <input
                                                    type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                                                    value={formData[field.name] || ""}
                                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                    placeholder={`Enter ${field.name}`}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Screening Questions Section */}
                            {job.screeningQuestions && job.screeningQuestions.length > 0 && (
                                <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
                                    <h4 className="font-semibold text-slate-800 text-sm mb-3">Screening Questions</h4>
                                    <div className="space-y-4">
                                        {job.screeningQuestions.map((question, index) => (
                                            <div key={index}>
                                                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                                    {question}
                                                </label>
                                                <textarea
                                                    value={screeningAnswers[`question_${index}`] || ""}
                                                    onChange={(e) => handleScreeningChange(`question_${index}`, e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                    placeholder="Candidate's answer..."
                                                    rows={2}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className={`w-full mt-2 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${!file || uploading
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Upload Candidate
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
