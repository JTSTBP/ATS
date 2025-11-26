import { motion } from "framer-motion";
import {
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from "lucide-react";
import { Candidate, JobOpening } from "../pages/UploadCV";
import { useAuth } from "../../context/AuthProvider";

interface CandidateListProps {
  candidates: Candidate[];
  jobs: JobOpening[];
  onView: (candidate: Candidate) => void;
  onEdit: (candidate: Candidate) => void;
  onDelete: (id: string) => void;
}

export default function CandidateList({
  candidates,
  jobs,
  onView,
  onEdit,
  onDelete,
}: CandidateListProps) {
  const getJobTitle = (jobId: string) => {
    return jobs.find((j) => j.id === jobId)?.title || "Unknown Position";
  };
  const { user } = useAuth();


  const getStatusColor = (status: Candidate["status"]) => {
    const colors = {
      New: "bg-blue-100 text-blue-700",
      Screening: "bg-yellow-100 text-yellow-700",
      Interview: "bg-purple-100 text-purple-700",
      Offer: "bg-green-100 text-green-700",
      Hired: "bg-emerald-100 text-emerald-700",
      Rejected: "bg-red-100 text-red-700",
    };
    return colors[status];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800">All Candidates</h2>
        <p className="text-sm text-slate-600 mt-1">
          Total: {candidates.length}{" "}
          {candidates.length === 1 ? "candidate" : "candidates"}
        </p>
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Candidate
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Position Applied
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Experience
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {candidates.map((candidate) => {
              const df = candidate.dynamicFields || {};
              const keys = Object.keys(df);

              // Try to find the most likely "name", "email", "phone" keys dynamically
              const nameKey = keys.find((k) =>
                k.toLowerCase().includes("name")
              );
              const emailKey = keys.find((k) =>
                k.toLowerCase().includes("email")
              );
              const phoneKey = keys.find((k) =>
                k.toLowerCase().includes("phone")
              );
              const expKey = keys.find((k) => k.toLowerCase().includes("exp"));

              const candidateName = df[nameKey || ""] || "Unnamed";
              const email = df[emailKey || ""] || "—";
              const phone = df[phoneKey || ""] || "—";
              const experience = df[expKey || ""] || "—";

              const jobTitle = getJobTitle(candidate.jobId);

              return (
                <motion.tr
                  key={candidate._id || candidate.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {/* Candidate */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold uppercase">
                        {candidateName[0] || "?"}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          {candidateName}
                        </div>
                        <div className="text-sm text-slate-500">{jobTitle}</div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} />
                        <span>{email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone size={14} />
                        <span>{phone}</span>
                      </div>
                    </div>
                  </td>

                  {/* Position */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Briefcase size={16} />
                      {jobTitle}
                    </div>
                  </td>

                  {/* Experience */}
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {experience}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        candidate.status
                      )}`}
                    >
                      {candidate.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(candidate)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEdit(candidate)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit candidate"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this candidate?"
                            )
                          ) {
                            onDelete(candidate._id || candidate.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete candidate"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden divide-y divide-slate-200">
        {candidates.map((candidate) => {
          const df = candidate.dynamicFields || {};
          const keys = Object.keys(df);

          const nameKey = keys.find((k) => k.toLowerCase().includes("name"));
          const emailKey = keys.find((k) => k.toLowerCase().includes("email"));
          const phoneKey = keys.find((k) => k.toLowerCase().includes("phone"));
          const expKey = keys.find((k) => k.toLowerCase().includes("exp"));

          const candidateName = df[nameKey || ""] || "Unnamed";
          const email = df[emailKey || ""] || "—";
          const phone = df[phoneKey || ""] || "—";
          const experience = df[expKey || ""] || "—";
          const jobTitle = getJobTitle(candidate.jobId);

          return (
            <motion.div
              key={candidate._id || candidate.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold uppercase">
                    {candidateName[0] || "?"}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">
                      {candidateName}
                    </div>
                    <div className="text-sm text-slate-500">{jobTitle}</div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    candidate.status
                  )}`}
                >
                  {candidate.status}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} />
                  <span>{email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} />
                  <span>{phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Briefcase size={14} />
                  <span>{jobTitle}</span>
                </div>

                {/* Dynamically show all other available fields */}
                {Object.entries(df)
                  .filter(
                    ([key]) =>
                      !key.toLowerCase().includes("name") &&
                      !key.toLowerCase().includes("email") &&
                      !key.toLowerCase().includes("phone")
                  )
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <span className="font-medium capitalize">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onView(candidate)}
                  className="flex-1 py-2 px-3 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  onClick={() => onEdit(candidate)}
                  className="flex-1 py-2 px-3 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm("Are you sure you want to delete this candidate?")
                    ) {
                      onDelete(candidate._id || candidate.id);
                    }
                  }}
                  className="py-2 px-3 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
