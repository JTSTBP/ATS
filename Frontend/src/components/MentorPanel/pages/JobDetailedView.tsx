
import { X, Briefcase, Layers, Calendar, User, Building, FileText, Download, Eye } from "lucide-react";
import { useState } from "react";
import { downloadFile, getFilePreviewUrl } from "../../../utils/imageUtils";

export const JobDetailsModal = ({
  job,
  onClose,
}: {
  job: any;
  onClose: () => void;
}) => {
  const [showFullDesc, setShowFullDesc] = useState(false);
  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto scroll-smooth custom-scroll">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-5 border-b pb-3">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
            {job.title}
          </h2>
          <div className="flex flex-wrap gap-2 mt-3 text-sm">
            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full shadow-sm">
              {/* <MapPin className="w-4 h-4" /> {job.location || "N/A"} */}
              <div>
                {Array.isArray(job.location)
                  ? job.location
                    .map((loc: any) => `${loc.name}, ${loc.state}`)
                    .join(", ")
                  : typeof job.location === "object"
                    ? `${job.location.name}, ${job.location.state}`
                    : job.location}
              </div>
            </span>
            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full shadow-sm">
              <Briefcase className="w-4 h-4" /> {job.employmentType || "N/A"}
            </span>
            <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full shadow-sm">
              <Layers className="w-4 h-4" /> {job.department || "N/A"}
            </span>
            <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full shadow-sm">
              <Calendar className="w-4 h-4" /> {job.status || "N/A"}
            </span>
          </div>
        </div>

        {/* Salary & Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-gray-700">
          <div className="p-4 rounded-xl bg-gray-50 shadow-sm">
            <p className="text-gray-500 text-sm">💰 Salary Range</p>
            <p className="font-semibold mt-1">
              {job.salary
                ? `${job.salary.min}–${job.salary.max} ${job.salary.currency}`
                : "Not specified"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 shadow-sm">
            <p className="text-gray-500 text-sm">📅 Experience</p>
            <p className="font-semibold mt-1">
              {job.experience
                ? `${job.experience.min}–${job.experience.max} ${job.experience.unit}`
                : "Not specified"}
            </p>
          </div>
        </div>

        {/* Description */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            📝 Description
          </h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {showFullDesc
              ? job.description
              : job.description.slice(0, 400) +
              (job.description.length > 400 ? "..." : "")}
          </p>
          {job.description.length > 400 && (
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-indigo-600 text-sm mt-2 hover:underline font-medium"
            >
              {showFullDesc ? "Show Less" : "Show More"}
            </button>
          )}
        </section>

        {/* Requirements */}
        {job.requirements && (
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              📋 Requirements
            </h3>
            <div className="p-4 bg-gray-50 rounded-xl shadow-sm">
              <p className="text-gray-700 whitespace-pre-line">
                {job.requirements}
              </p>
            </div>
          </section>
        )}

        {/* Key Skills */}
        {job.keySkills && job.keySkills.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🧠 Key Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.keySkills.map((s: string, i: number) => (
                <span
                  key={i}
                  className="bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full shadow-sm hover:bg-indigo-200 transition"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Job Description Document */}
        {job.jdFile && (
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Job Description Document
            </h3>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate" title={job.jdFileName || "Job_Description.pdf"}>
                    {job.jdFileName || "Job_Description.pdf"}
                  </p>
                  <p className="text-xs text-blue-600">Job Description attached</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => window.open(getFilePreviewUrl(job.jdFile), "_blank")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-50 transition"
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  onClick={() => downloadFile(job.jdFile, job.jdFileName || `${job.title || "Job"}_JD.pdf`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                >
                  <Download size={14} /> Download JD
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Created By */}
        {job.CreatedBy && (
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Created By
            </h3>
            <div className="p-4 border rounded-xl bg-gray-50 shadow-sm">
              <p className="font-medium text-gray-800">
                {typeof job.CreatedBy === "object"
                  ? job.CreatedBy.name || "Unknown User"
                  : job.CreatedBy}
              </p>
              {typeof job.CreatedBy === "object" && job.CreatedBy.email && (
                <p className="text-sm text-gray-600">{job.CreatedBy.email}</p>
              )}
            </div>
          </section>
        )}

        {/* Client Details */}
        {job.clientId && (
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" /> Client
            </h3>
            <div className="p-4 border rounded-xl bg-gray-50 shadow-sm">
              <p className="font-medium text-gray-800">
                {typeof job.clientId === "object"
                  ? job.clientId.companyName || "Unknown Client"
                  : "Client ID: " + job.clientId}
              </p>
              {typeof job.clientId === "object" && job.clientId.websiteUrl && (
                <a
                  href={job.clientId.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {job.clientId.websiteUrl}
                </a>
              )}
            </div>
          </section>
        )}

        {/* Screening Questions */}
        {job.screeningQuestions && job.screeningQuestions.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ❓ Screening Questions
            </h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              {job.screeningQuestions.map((q: string, i: number) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Hiring Stages */}
        {job.stages && job.stages.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              🚀 Hiring Stages
            </h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              {job.stages.map((st: any, i: number) => (
                <li key={i}>
                  <span className="font-medium">{st.name}</span> –{" "}
                  {st.responsible}
                  {st.mandatory && (
                    <span className="text-red-500 text-sm ml-2">
                      (Mandatory)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {Object.keys(job.mentorAssignments || {}).length > 0 && <section className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-800">Mentor team assignments</h3>
          <div className="grid gap-3 sm:grid-cols-2">{Object.entries(job.mentorAssignments || {}).map(([mentorId, value]) => {
            const assignment = value as any;
            const mentor = assignment.mentorId?.name || job.assignedMentors?.find((item: any) => item?._id === mentorId)?.name || "Mentor";
            return <div key={mentorId} className="rounded-xl border border-gray-200 bg-slate-50 p-4"><h4 className="font-semibold text-gray-900">{mentor}</h4><p className="mt-2 text-sm text-gray-600">Lead recruiter: <span className="font-semibold text-gray-900">{assignment.leadRecruiter?.name || "Not assigned"}</span></p><p className="mt-2 text-sm text-gray-600">Recruiters: {(assignment.assignedRecruiters || []).map((recruiter: any) => recruiter?.name).filter(Boolean).join(", ") || "Not assigned"}</p></div>;
          })}</div>
        </section>}

        {/* Lead Recruiter */}
        {job.leadRecruiter && (
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Lead Recruiter
            </h3>
            <div className="p-4 border rounded-xl bg-gray-50 shadow-sm">
              <p className="font-medium text-gray-800">
                {job.leadRecruiter.name}
              </p>
              <p className="text-sm text-gray-600">{job.leadRecruiter.email}</p>
            </div>
          </section>
        )}

        {/* Assigned Recruiters */}
        {job.assignedRecruiters && job.assignedRecruiters.length > 0 && (
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" /> Assigned Recruiters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.assignedRecruiters.map((rec: any, i: number) => (
                <div
                  key={i}
                  className="p-4 border rounded-xl bg-gray-50 shadow-sm hover:shadow-md transition"
                >
                  <p className="font-medium text-gray-800">{rec.name}</p>
                  <p className="text-sm text-gray-600">{rec.email}</p>
                </div>
              ))}
            </div>
          </section>
        )}


      </div>

      {/* Animation & Scrollbar */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          .custom-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(99, 102, 241, 0.4);
            border-radius: 4px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background-color: rgba(99, 102, 241, 0.6);
          }
        `}
      </style>
    </div>
  );
};
