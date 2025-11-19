import { motion } from "framer-motion";
import { Search, MoreVertical, Link } from "lucide-react";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useAuth } from "../../context/AuthProvider";
import { useEffect, useMemo } from "react";
import { Users } from "lucide-react";

export default function Candidates() {
  const { candidates, fetchCandidatesByUser, loading } = useCandidateContext();
  const { user } = useAuth();
  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (user?._id) fetchCandidatesByUser(user._id);
  }, [user]);

  // 🧠 Collect all dynamic field keys
  const allDynamicKeys = useMemo(() => {
    const keys = new Set<string>();
    candidates.forEach((c) => {
      if (c.dynamicFields) {
        Object.keys(c.dynamicFields).forEach((key) => keys.add(key));
      }
    });
    return Array.from(keys);
  }, [candidates]);

  // ✂️ Show only first 3 dynamic fields
  const visibleDynamicKeys = allDynamicKeys.slice(0, 3);

  if (loading) return <p>Loading...</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-slate-800 mb-2">
        List of All Candidates
      </h1>
      <p className="text-slate-600 mb-8">
        Manage and track your candidate pipeline
      </p>

      <div className="bg-white/80 backdrop-blur-xl shadow-xl border border-slate-200 rounded-2xl overflow-hidden">
        {/* 🔍 Top Controls */}
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search candidates..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <select className="px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
            <option>All Status</option>
            <option>Shortlisted</option>
            <option>Interview</option>
            <option>Under Review</option>
          </select>
        </div>

        {/* 📊 Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Sticky Header */}
            <thead className="bg-gradient-to-r from-slate-100 to-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                {visibleDynamicKeys.map((key) => (
                  <th
                    key={key}
                    className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider text-xs"
                  >
                    {key}
                  </th>
                ))}

                <th className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider text-xs">
                  Created By
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider text-xs">
                  Job Title
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider text-xs">
                  Links
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider text-xs">
                  Status
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider text-xs">
                  Created At
                </th>
           
                <th className="px-6 py-4 text-left font-semibold text-slate-700 uppercase tracking-wider text-xs">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {candidates.map((candidate, index) => (
                <motion.tr
                  key={candidate._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="hover:bg-slate-50/60 transition-all"
                >
                  {visibleDynamicKeys.map((key) => (
                    <td
                      key={key}
                      className="px-6 py-4 text-slate-700 max-w-xs truncate"
                    >
                      {candidate.dynamicFields?.[key] || "--"}
                    </td>
                  ))}

                  <td className="px-6 py-4 font-medium text-slate-800">
                    {candidate.createdBy?.name || "Unknown"}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {candidate.jobId?.title}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2 items-center flex-wrap text-blue-600">
                      {candidate.resumeUrl && (
                        <a
                          href={`${API_BASE_URL}${candidate.resumeUrl}`}
                          target="_blank"
                          className="hover:underline flex items-center gap-1"
                        >
                          <Link size={14} /> Resume
                        </a>
                      )}
                      {candidate.linkedinUrl && (
                        <a
                          href={candidate.linkedinUrl}
                          target="_blank"
                          className="hover:underline flex items-center gap-1"
                        >
                          <Link size={14} /> LinkedIn
                        </a>
                      )}
                      {candidate.portfolioUrl && (
                        <a
                          href={candidate.portfolioUrl}
                          target="_blank"
                          className="hover:underline flex items-center gap-1"
                        >
                          <Link size={14} /> Portfolio
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm
                ${
                  candidate.status === "New"
                    ? "bg-blue-100 text-blue-700"
                    : candidate.status === "Interview"
                    ? "bg-purple-100 text-purple-700"
                    : candidate.status === "Shortlisted"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
                    >
                      {candidate.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {new Date(candidate.createdAt).toLocaleString()}
                  </td>
              

                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {candidates.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-md border">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No candidates found
          </h3>
        </div>
      )}
    </motion.div>
  );
}
