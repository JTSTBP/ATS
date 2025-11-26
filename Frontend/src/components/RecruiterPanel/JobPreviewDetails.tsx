import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    MapPin,
    Briefcase,
    DollarSign,
    Calendar,
    User,
    Layers,
    Users,
    FileText,
    CheckCircle2,
} from "lucide-react";
import { useJobContext, Job } from "../../context/DataProvider";

export default function JobPreviewDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { jobs, fetchJobs } = useJobContext();
    const [job, setJob] = useState<Job | null>(null);

    useEffect(() => {
        if (jobs.length === 0) {
            fetchJobs();
        }
    }, [jobs.length, fetchJobs]);

    useEffect(() => {
        if (id && jobs.length > 0) {
            const foundJob = jobs.find((j) => j._id === id);
            setJob(foundJob || null);
        }
    }, [id, jobs]);

    if (!job) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-slate-500">Loading job details...</p>
            </div>
        );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header / Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Job Details</h1>
            <p className="text-slate-500 text-sm">Previewing job posting</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Job Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-blue-700">
                  {job.title}
                </h2>

                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                    <MapPin size={14} />
                    <span>
                      {Array.isArray(job.location)
                        ? job.location.map((l: any) => l.name).join(", ")
                        : typeof job.location === "object" &&
                          job.location !== null
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
                    <span>
                      {job.department || job.industry || "Industry N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                    <Calendar size={14} />
                    <span>{job.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Salary & Experience Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-orange-500 mb-2 font-medium">
                  <DollarSign size={18} />
                  <span>Salary Range</span>
                </div>
                <p className="text-lg font-bold text-slate-800">
                  {job.salary
                    ? `${job.salary.min}-${job.salary.max} ${job.salary.currency}`
                    : "Not specified"}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-blue-500 mb-2 font-medium">
                  <Calendar size={18} />
                  <span>Experience</span>
                </div>
                <p className="text-lg font-bold text-slate-800">
                  {job.experience
                    ? `${job.experience.min}-${job.experience.max} ${job.experience.unit}`
                    : "Not specified"}
                </p>
              </div>
            </div>

            {/* Client & Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-indigo-500 mb-2 font-medium">
                  <User size={18} />
                  <span>Client</span>
                </div>
                <p className="text-lg font-bold text-slate-800">
                  {job.client || "Not Specified"}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-indigo-500 mb-2 font-medium">
                  <Briefcase size={18} />
                  <span>Company</span>
                </div>
                <p className="text-lg font-bold text-slate-800">
                  {job.companyName || "Not Specified"}
                </p>
              </div>
            </div>

            {/* Description */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="text-pink-500" size={20} />
                <h3 className="text-lg font-bold text-slate-800">
                  Description
                </h3>
              </div>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                {job.description}
              </div>
            </section>

            {/* Requirements */}
            {job.requirements && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="text-orange-500" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Requirements
                  </h3>
                </div>
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {job.requirements}
                </div>
              </section>
            )}

            {/* Key Skills */}
            {job.keySkills && job.keySkills.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="text-purple-500" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Key Skills
                  </h3>
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
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="font-medium text-slate-800">
                  {typeof job.CreatedBy === "object"
                    ? job.CreatedBy?.name
                    : "Unknown User"}
                </p>
                <p className="text-sm text-slate-500">
                  {typeof job.CreatedBy === "object"
                    ? (job.CreatedBy as any).email
                    : ""}
                </p>
              </div>
            </section>

            {/* Hiring Stages */}
            {job.stages && job.stages.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="text-red-500" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Hiring Stages
                  </h3>
                </div>
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {job.stages.map((stage, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span className="font-medium">{stage.name}</span>
                      <span className="text-slate-400">–</span>
                      <span className="text-slate-500">
                        {stage.responsible}
                      </span>
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

            {/* Lead Recruiter */}
            {job.leadRecruiter && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <User className="text-blue-500" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Lead Recruiter
                  </h3>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="font-medium text-slate-800">
                    {typeof job.leadRecruiter === "object"
                      ? (job.leadRecruiter as any).name
                      : "Lead Recruiter"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {typeof job.leadRecruiter === "object"
                      ? (job.leadRecruiter as any).email
                      : ""}
                  </p>
                </div>
              </section>
            )}

            {/* Assigned Recruiters */}
            {job.assignedRecruiters && job.assignedRecruiters.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="text-green-500" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Assigned Recruiters
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.assignedRecruiters.map(
                    (recruiter: any, index: number) => (
                      <div
                        key={index}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-100"
                      >
                        <p className="font-medium text-slate-800">
                          {typeof recruiter === "object"
                            ? recruiter.name
                            : "Recruiter"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {typeof recruiter === "object" ? recruiter.email : ""}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}
            {/* Screening Questions */}
            {job.screeningQuestions && job.screeningQuestions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-teal-500" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Screening Questions
                  </h3>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  {job.screeningQuestions.map(
                    (question: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1" />
                        <span>{question}</span>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* Candidate Fields */}
            {job.candidateFields && job.candidateFields.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-yellow-500" size={20} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Candidate Fields
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.candidateFields.map((field, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-100"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-800">
                          {field.name}
                        </h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">
                          Type:{" "}
                          <span className="font-medium text-slate-700">
                            {field.type}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Required:{" "}
                          <span
                            className={`font-medium ${
                              field.required ? "text-red-600" : "text-slate-700"
                            }`}
                          >
                            {field.required ? "Yes" : "No"}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </motion.div>
    );
}
