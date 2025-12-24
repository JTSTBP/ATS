import { motion } from "framer-motion";
import { Briefcase, MapPin, Users, Upload, Target } from "lucide-react";
import { JobOpening } from "./UploadCV";

interface JobOpeningCardProps {
  job: JobOpening;
  onUploadCandidate: (job: JobOpening) => void;
  onPreview?: (job: JobOpening) => void;
  candidateCount: number;
  showUploadButton?: boolean;
}

const statusColors: Record<string, string> = {
  Open: "bg-green-100 text-green-700",
  Closed: "bg-red-100 text-red-700",
  "On Hold": "bg-yellow-100 text-yellow-700",
};


export default function JobOpeningCard({
  job,
  onUploadCandidate,
  onPreview,
  candidateCount,
  showUploadButton = true,
}: JobOpeningCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        {/* <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
          <Briefcase className="text-blue-600" size={24} />
        </div> */}
        {candidateCount > 0 && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full absolute right-6 top-6">
            {candidateCount} {candidateCount === 1 ? "Candidate" : "Candidates"}
          </span>
        )}
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center bg-white">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.companyName || job.client || "Company"}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {(job.companyName || job.client || job.department || "C").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status]
            }`}
        >
          {job.status}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-slate-800 mb-2">{job.title}</h3>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Briefcase size={16} />
          <span>{job.department}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin size={16} />
          <span>
            {Array.isArray(job.location)
              ? job.location.map((loc: any) => loc.name).join(", ")
              : typeof job.location === "object" && job.location !== null
                ? job.location.name || "Unknown"
                : job.location}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users size={16} />
          <span>{job.employmentType}</span>
        </div>
        {(job.noOfPositions || job.openPositions) > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Target size={16} />
            <span>
              {job.noOfPositions || job.openPositions}{" "}
              {(job.noOfPositions || job.openPositions) === 1 ? "position" : "positions"}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            console.log("Preview button clicked in card");
            onPreview && onPreview(job);
          }}
          className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center justify-center gap-2"
        >
          PREVIEW
        </button>
        {showUploadButton && (
          <button
            onClick={() => onUploadCandidate(job)}
            className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            UPLOAD
          </button>
        )}
      </div>
    </motion.div>
  );
}
