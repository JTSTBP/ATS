import { motion } from "framer-motion";
import { Briefcase, MapPin, Users, Upload, Target } from "lucide-react";
import { JobOpening } from "../pages/UploadCV";

interface JobOpeningCardProps {
  job: JobOpening;
  onUploadCandidate: (job: JobOpening) => void;
  candidateCount: number;
}

 const statusColors: Record<string, string> = {
   Open: "bg-green-100 text-green-700",
   Closed: "bg-red-100 text-red-700",
   "On Hold": "bg-yellow-100 text-yellow-700",
 };


export default function JobOpeningCard({
  job,
  onUploadCandidate,
  candidateCount,
}: JobOpeningCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
    >
      {/* <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
          <Briefcase className="text-blue-600" size={24} />
        </div>
        {candidateCount > 0 && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            {candidateCount} {candidateCount === 1 ? "Candidate" : "Candidates"}
          </span>
        )}
      </div> */}

      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
          <Briefcase className="text-blue-600" size={24} />
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            statusColors[job.status]
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
              : job.location}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users size={16} />
          <span>{job.employmentType}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Target size={16} />
          <span>
            {job.openPositions}{" "}
            {job.openPositions === 1 ? "position" : "positions"}
          </span>
        </div>
      </div>

      <button
        onClick={() => onUploadCandidate(job)}
        className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <Upload size={18} />
        Upload Candidate
      </button>
    </motion.div>
  );
}
