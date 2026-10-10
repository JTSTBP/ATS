import { motion } from "framer-motion";
import { X, MapPin, Briefcase, DollarSign, Calendar, User, Layers, FileText, CheckCircle2, Download, Eye } from "lucide-react";
import { Job } from "../../context/DataProvider";
import { downloadFile, getFilePreviewUrl } from "../../utils/imageUtils";

interface JobPreviewModalProps {
    job: Job;
    onClose: () => void;
}



export default function JobPreviewModal({ job, onClose }: JobPreviewModalProps) {
    if (!job) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-white sticky top-0 z-10">
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-blue-700">{job.title}</h2>

                        <div className="flex flex-wrap gap-3 text-sm">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                                <MapPin size={14} />
                                <span>
                                    {Array.isArray(job.location)
                                        ? job.location.map((l: any) => l.name).join(", ")
                                        : typeof job.location === "object" && job.location !== null
                                            ? (job.location as any).name || "Unknown"
                                            : job.location || "Unknown"}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                                <Briefcase size={14} />
                                <span>{job.employmentType}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full font-medium">
                                <Layers size={14} />
                                <span>{job.department || job.industry || "Industry N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                                <Calendar size={14} />
                                <span>{job.status}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 bg-slate-50/50">

                    {/* Salary & Experience Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 text-orange-500 mb-2 font-medium">
                                <DollarSign size={18} />
                                <span>Salary Range</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800">
                                {job.salary ? `${job.salary.min}-${job.salary.max} ${job.salary.currency}` : "Not specified"}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 text-blue-500 mb-2 font-medium">
                                <Calendar size={18} />
                                <span>Experience</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800">
                                {job.experience ? `${job.experience.min}-${job.experience.max} ${job.experience.unit}` : "Not specified"}
                            </p>
                        </div>
                    </div>

                    {/* Client & Company */}
                    {/* Client & Company */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 text-indigo-500 mb-2 font-medium">
                                <User size={18} />
                                <span>Client</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800">{job.client || "Not Specified"}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 text-indigo-500 mb-2 font-medium">
                                <Briefcase size={18} />
                                <span>Company</span>
                            </div>
                            <p className="text-lg font-bold text-slate-800">{job.companyName || "Not Specified"}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="text-pink-500" size={20} />
                            <h3 className="text-lg font-bold text-slate-800">Description</h3>
                        </div>
                        <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                            {job.description}
                        </div>
                    </section>

                    {/* Requirements */}
                    {job.requirements && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="text-orange-500" size={20} />
                                <h3 className="text-lg font-bold text-slate-800">Requirements</h3>
                            </div>
                            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
                                {job.requirements}
                            </div>
                        </section>
                    )}

                    {/* Key Skills */}
                    {job.keySkills && job.keySkills.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Briefcase className="text-purple-500" size={20} />
                                <h3 className="text-lg font-bold text-slate-800">Key Skills</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {job.keySkills.map((skill: string, index: number) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Created By */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <User className="text-blue-500" size={20} />
                            <h3 className="text-lg font-bold text-slate-800">Created By</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <p className="font-medium text-slate-800">
                                {typeof job.CreatedBy === 'object' ? job.CreatedBy?.name : "Unknown User"}
                            </p>
                            <p className="text-sm text-slate-500">
                                {typeof job.CreatedBy === 'object' ? (job.CreatedBy as any).email : ""}
                            </p>
                        </div>
                    </section>

                    {/* Job Description Document */}
                    {(job as any).jdFile && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="text-blue-500" size={20} />
                                <h3 className="text-lg font-bold text-slate-800">Job Description Document</h3>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate" title={(job as any).jdFileName || "Job_Description.pdf"}>
                                            {(job as any).jdFileName || "Job_Description.pdf"}
                                        </p>
                                        <p className="text-xs text-blue-600 font-medium">Job Description attached</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => window.open(getFilePreviewUrl((job as any).jdFile), "_blank")}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-50 transition"
                                    >
                                        <Eye size={14} /> Preview
                                    </button>
                                    <button
                                        onClick={() => downloadFile((job as any).jdFile, (job as any).jdFileName || `${job.title || "Job"}_JD.pdf`)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                                    >
                                        <Download size={14} /> Download JD
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Hiring Stages */}
                    {job.stages && job.stages.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <Layers className="text-red-500" size={20} />
                                <h3 className="text-lg font-bold text-slate-800">Hiring Stages</h3>
                            </div>
                            <div className="space-y-2">
                                {job.stages.map((stage, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm text-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        <span className="font-medium">{stage.name}</span>
                                        <span className="text-slate-400">–</span>
                                        <span className="text-slate-500">{stage.responsible}</span>
                                        {stage.mandatory && (
                                            <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">
                                                Mandatory
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Candidate Fields */}
                    {job.candidateFields && job.candidateFields.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="text-yellow-500" size={20} />
                                <h3 className="text-lg font-bold text-slate-800">Candidate Fields</h3>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                                {job.candidateFields.map((field, index) => (
                                    <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1" />
                                        <span className="font-medium">{field.name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                </div>
            </motion.div>
        </div>
    );
}
