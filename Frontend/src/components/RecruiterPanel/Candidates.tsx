import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Download, MoreVertical, Briefcase, Users, ChevronRight } from "lucide-react";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useAuth } from "../../context/AuthProvider";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useJobContext } from "../../context/DataProvider";
import * as XLSX from "xlsx";
import CandidateModal from "./CandidateModal";

export default function Candidates() {
  const { candidates, fetchCandidatesByUser, updateStatus, loading } = useCandidateContext();
  const { user } = useAuth();
  const { jobs, fetchJobs } = useJobContext();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");


  // Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (user?._id) {
      // Fetch all candidates to ensure data visibility
      fetchCandidatesByUser(user._id);
      fetchJobs(); // Ensure jobs are loaded for the modal
    }
  }, [user]);

  const [companyFilter, setCompanyFilter] = useState("");

  // Get status from URL query parameter or default to "All Status"
  const urlStatus = searchParams.get('status');
  const [statusFilter, setStatusFilter] = useState(urlStatus || "All Status");

  // Get jobTitle from URL query parameter or default to "All"
  const urlJobTitle = searchParams.get('jobTitle');
  const [jobTitleFilter, setJobTitleFilter] = useState(urlJobTitle || "All");

  // Update filters when URL changes
  useEffect(() => {
    if (urlStatus) setStatusFilter(urlStatus);
    if (urlJobTitle) setJobTitleFilter(urlJobTitle);
  }, [urlStatus, urlJobTitle]);

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

  // 🔍 Filter Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate: any) => {
      // Job Title Filter
      const matchesJobTitle =
        jobTitleFilter === "All" ||
        candidate.jobId?.title === jobTitleFilter;

      // Company Filter (checking multiple potential fields)
      // Company Filter (checking multiple potential fields)
      const matchesCompany =
        companyFilter === "" ||
        (() => {
          // Check currentCompany
          if (candidate.currentCompany?.toLowerCase().includes(companyFilter.toLowerCase())) return true;

          // Check dynamic fields
          if (candidate.dynamicFields) {
            return Object.keys(candidate.dynamicFields).some(key =>
              key.toLowerCase().includes('company') &&
              candidate.dynamicFields[key]?.toLowerCase().includes(companyFilter.toLowerCase())
            );
          }
          return false;
        })();

      // Status Filter
      const matchesStatus =
        statusFilter === "All Status" ||
        candidate.status === statusFilter ||
        // Handle fuzzy matching for legacy/backend status variations
        (statusFilter === "Interview" && (candidate.status === "Interview" || candidate.status === "Interviewed")) ||
        (statusFilter === "Hired" && (candidate.status === "Hired" || candidate.status === "Joined" || candidate.status === "Offer" || candidate.status === "Selected"));

      return matchesJobTitle && matchesCompany && matchesStatus;
    });
  }, [candidates, jobTitleFilter, companyFilter, statusFilter]);

  // 📋 Get Unique Job Titles for Dropdown
  const uniqueJobTitles = useMemo(() => {
    const titles = new Set<string>();
    candidates.forEach((c: any) => {
      if (c.jobId?.title) titles.add(c.jobId.title);
    });
    return Array.from(titles);
  }, [candidates]);

  // 🏢 Get Unique Companies for Dropdown
  const uniqueCompanies = useMemo(() => {
    const companies = new Set<string>();
    candidates.forEach((c: any) => {
      // Check currentCompany field
      if (c.currentCompany) {
        companies.add(c.currentCompany);
      }

      // Check dynamicFields for any field containing "company"
      if (c.dynamicFields) {
        Object.keys(c.dynamicFields).forEach((key) => {
          if (key.toLowerCase().includes('company') && c.dynamicFields[key]) {
            companies.add(c.dynamicFields[key]);
          }
        });
      }
    });
    return Array.from(companies).sort();
  }, [candidates]);

  if (loading) return <p>Loading...</p>;

  return (
    <>
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
          {/* 🔍 Top Controls */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search Box */}
              <div className="md:col-span-4 relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm"
                />
              </div>

              {/* Filters */}
              <div className="md:col-span-8 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={jobTitleFilter}
                    onChange={(e) => setJobTitleFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm appearance-none cursor-pointer"
                  >
                    <option value="All">All Jobs</option>
                    {uniqueJobTitles.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm appearance-none cursor-pointer"
                  >
                    <option value="">All Companies</option>
                    {uniqueCompanies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-400"></div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm appearance-none cursor-pointer"
                  >
                    <option>All Status</option>
                    <option>Shortlisted</option>
                    <option>Interview</option>
                    <option>Under Review</option>
                    <option>New</option>
                    <option>Rejected</option>
                    <option>Selected</option>
                    <option>Hired</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 📊 Candidates Grid */}
          <div className="p-6 bg-slate-50/50 min-h-[400px]">
            {filteredCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No candidates found</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Try adjusting your filters or search query to find what's you're looking for.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="bg-slate-100 rounded-xl border border-slate-200 p-4 hidden md:block">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Name</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Company</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</p>
                    </div>
                  </div>
                </div>

                {filteredCandidates.map((candidate, index) => {
                  // 🧠 Smart Field Mapping
                  const dynamicKeys = Object.keys(candidate.dynamicFields || {});

                  // 1. Find Name (look for 'name' in key, or take first key)
                  const nameKey = dynamicKeys.find(k => k.toLowerCase().includes("name")) || dynamicKeys[0];
                  const nameValue = candidate.dynamicFields?.[nameKey] || "Unknown Candidate";

                  // 2. Find Email field
                  const emailKey = dynamicKeys.find(k => k.toLowerCase().includes("email"));
                  const emailValue = candidate.dynamicFields?.[emailKey] || "--";

                  // 3. Find Phone field
                  const phoneKey = dynamicKeys.find(k => k.toLowerCase().includes("phone"));
                  const phoneValue = candidate.dynamicFields?.[phoneKey] || "--";

                  // 4. Find Company field
                  let companyKey = dynamicKeys.find(k => k.toLowerCase() === "current company");
                  if (!companyKey) companyKey = dynamicKeys.find(k => k.toLowerCase() === "company");
                  if (!companyKey) companyKey = dynamicKeys.find(k => k.toLowerCase().includes("company"));

                  const companyValue = (companyKey && candidate.dynamicFields?.[companyKey]) || (candidate as any).currentCompany || "Not Specified";

                  return (
                    <motion.div
                      key={candidate._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setIsModalOpen(true);
                      }}
                      className="relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 group cursor-pointer"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">

                        {/* Col 1: Avatar & Name (Span 3) */}
                        <div className="col-span-12 md:col-span-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                            {(nameValue as string).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-base leading-tight truncate" title={nameValue}>
                              {nameValue}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <Briefcase size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{(candidate.jobId as any)?.title || "No Job Title"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Col 2: Company Name (Span 2) */}
                        <div className="col-span-12 md:col-span-2 min-w-0">
                          <p className="text-sm text-slate-700 font-medium truncate" title={companyValue}>
                            {companyValue}
                          </p>
                        </div>

                        {/* Col 3: Email (Span 3) */}
                        <div className="col-span-12 md:col-span-3 min-w-0">
                          <p className="text-sm text-slate-700 font-medium truncate" title={emailValue}>
                            {emailValue}
                          </p>
                        </div>

                        {/* Col 4: Phone (Span 2) */}
                        <div className="col-span-12 md:col-span-2 min-w-0">
                          <p className="text-sm text-slate-700 font-medium truncate" title={phoneValue}>
                            {phoneValue}
                          </p>
                        </div>

                        {/* Col 5: Status (Span 2) - Read Only */}
                        <div className="col-span-12 md:col-span-2 min-w-0">
                          <span
                            className={`inline-block px-3 py-1.5 rounded-full text-xs font-medium border ${candidate.status === "New"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : candidate.status === "Interview"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : candidate.status === "Shortlisted"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : candidate.status === "Rejected"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : candidate.status === "Selected"
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                      : candidate.status === "Hired"
                                        ? "bg-teal-50 text-teal-700 border-teal-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                          >
                            {candidate.status || "New"}
                          </span>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </motion.div >

      <AnimatePresence>
        {isModalOpen && selectedCandidate && (
          <CandidateModal
            job={
              // If jobId is populated object, use it. If string, find in jobs.
              (typeof selectedCandidate.jobId === 'object' ? selectedCandidate.jobId : jobs.find(j => j._id === selectedCandidate.jobId)) || {} as any
            }
            candidate={selectedCandidate}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedCandidate(null);
            }}
            onSave={() => {
              setIsModalOpen(false);
              setSelectedCandidate(null);
              fetchallCandidates(); // Refresh list
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
