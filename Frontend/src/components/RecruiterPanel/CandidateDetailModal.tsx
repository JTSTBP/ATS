import React, { useEffect, useState } from "react";
import {
  X,
  Mail,
  Phone,
  Linkedin,
  Clock,
  Briefcase,
  Tag,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Check,
  ExternalLink,
  Award
} from "lucide-react";

import axios from "axios";

interface Education {
  degree?: string;
  institution?: string;
  year?: string | number;
}

interface WorkHistoryItem {
  company?: string;
  role?: string;
  from?: string;
  to?: string;
}

interface Candidate {
  _id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  linkedinProfile?: string;
  designation?: string;
  currentCompany?: string;
  location?: string;
  sourceType?: string;
  sourceIdentifier?: string;
  resumeFileUrl?: string;
  experience?: string;
  noticePeriod?: string;
  expectedSalary?: string;
  skills?: string[];
  workHistory?: WorkHistoryItem[] | string;
  education?: Education | string;
  certifications?: string[];
  previousCompanies?: string[];
  createdAt?: string;
  updatedAt?: string;
  requirementId?: {
    _id: string;
    title: string;
    department?: string;
    status?: string;
  } | string;
}

interface Props {
  candidate: Candidate;
  onClose: () => void;
}

/** Helper to trim leading characters and fallback */
const cleanString = (value?: string, trimChar?: string): string => {
  if (!value) return "-";
  let cleaned = value.trim();
  if (trimChar) {
    while (cleaned.startsWith(trimChar)) {
      cleaned = cleaned.slice(trimChar.length).trim();
    }
  }
  return cleaned || "-";
};

const getInitials = (name?: string): string => {
  if (!name || name === "-") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getCleanLinkedIn = (url?: string): string => {
  if (!url) return "-";
  let cleaned = url.trim();
  // Remove https://, http://, www.
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, "");
  return cleaned;
};

const formatExperience = (exp?: string): string | null => {
  if (!exp || exp === "-") return null;
  let cleaned = exp.trim();
  if (!cleaned.toLowerCase().includes("exp") && !cleaned.toLowerCase().includes("yr")) {
    cleaned = `${cleaned} Yrs exp`;
  }
  return cleaned;
};

const formatNoticePeriod = (notice?: string): string | null => {
  if (!notice || notice === "-") return null;
  let cleaned = notice.trim();
  if (!cleaned.toLowerCase().includes("notice")) {
    cleaned = `${cleaned} notice`;
  }
  return cleaned;
};

const formatExpectedSalary = (salary?: string): string | null => {
  if (!salary || salary === "-") return null;
  let cleaned = salary.trim();
  if (!cleaned.startsWith("₹") && !cleaned.startsWith("$") && !cleaned.toLowerCase().startsWith("rs")) {
    cleaned = `₹ ${cleaned}`;
  }
  if (!cleaned.toLowerCase().includes("ctc") && !cleaned.toLowerCase().includes("lpa")) {
    cleaned = `${cleaned} CTC`;
  }
  return cleaned;
};

export default function CandidateDetailModal({ candidate, onClose }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);

  const [followUps, setFollowUps] = useState<any[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(true);
  const [followUpsError, setFollowUpsError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setFollowUpsLoading(true);
    setFollowUpsError("");
    setFollowUps([]);
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/recruiter/follow-ups/candidates/${candidate._id}/follow-ups`)
      .then(({ data }) => { if (!cancelled) setFollowUps((data.followUps || []).sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())); })
      .catch(() => { if (!cancelled) setFollowUpsError("Unable to load follow-up status. Please reopen the profile to retry."); })
      .finally(() => { if (!cancelled) setFollowUpsLoading(false); });
    return () => { cancelled = true; };
  }, [candidate._id]);

  const designation = cleanString(candidate.designation, "|");
  const phone = cleanString(candidate.phoneNumber, " ");
  const location = candidate.location || "-";
  const sourceBadge = candidate.sourceType || "Resume Upload";
  const initials = getInitials(candidate.name);

  // Subtitle format: Designation · Company · Location
  const subtitleParts = [];
  if (candidate.designation && candidate.designation !== "-" && designation !== "-") {
    subtitleParts.push(designation);
  }
  if (candidate.currentCompany && candidate.currentCompany !== "-") {
    subtitleParts.push(candidate.currentCompany);
  }
  if (candidate.location && candidate.location !== "-") {
    subtitleParts.push(location);
  }
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(" · ") : "-";

  // Badges text
  const noticeText = formatNoticePeriod(candidate.noticePeriod);
  const expText = formatExperience(candidate.experience);
  const salaryText = formatExpectedSalary(candidate.expectedSalary);

  // Check if work history needs collapse/expand
  const workHistoryText = typeof candidate.workHistory === "string"
    ? candidate.workHistory
    : Array.isArray(candidate.workHistory)
      ? candidate.workHistory.map(w => `${w.role || ""} ${w.company || ""}`).join(" ")
      : "";
  const hasLongWorkHistory = workHistoryText.length > 200;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-2 sm:p-4 lg:items-center"
      onClick={handleBackdropClick}
    >
      <div className="my-2 flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-4 lg:max-h-[95vh]">
        {/* Header (Blue Gradient Card) */}
        <div className="relative rounded-t-2xl bg-gradient-to-r from-[#1764ab] to-[#0b5496] p-4 text-white sm:p-6 lg:p-8">
          {/* Close button at top right */}
          <button
            className="absolute right-3 top-3 rounded-full p-2 text-white opacity-80 transition-opacity hover:bg-white/10 hover:opacity-100 sm:right-4 sm:top-4"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="grid gap-5 pr-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8 lg:pr-0">
            {/* Left part: Avatar and details */}
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5 lg:gap-6">
              <div className="flex h-20 w-20 flex-shrink-0 select-none items-center justify-center rounded-full border-4 border-white/20 bg-white text-2xl font-bold text-[#0b5496] shadow-md sm:h-24 sm:w-24 sm:text-3xl">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="break-words text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                  {candidate.name || "-"}
                </h2>
                <p className="mt-2 break-words text-sm font-medium text-blue-100 opacity-90">
                  {subtitle}
                </p>
                {candidate.requirementId && typeof candidate.requirementId === "object" && candidate.requirementId.title && (
                  <p className="mt-2 flex items-start gap-1.5 break-words text-sm font-semibold text-blue-200 opacity-95">
                    <Briefcase size={14} className="mt-0.5 flex-shrink-0" />
                    <span>Job Name: {candidate.requirementId.title} {candidate.requirementId.department ? `(${candidate.requirementId.department})` : ""}</span>
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {noticeText && (
                    <div className="flex items-center space-x-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-white">
                      <Clock size={12} className="opacity-80" />
                      <span>{noticeText}</span>
                    </div>
                  )}
                  {expText && (
                    <div className="flex items-center space-x-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-white">
                      <Briefcase size={12} className="opacity-80" />
                      <span>{expText}</span>
                    </div>
                  )}
                  {salaryText && (
                    <div className="flex items-center space-x-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-white">
                      <span className="text-xs font-semibold leading-none">₹</span>
                      <span>{salaryText.replace("₹", "").trim()}</span>
                    </div>
                  )}
                  <span className="rounded-full bg-[#10b981] px-3.5 py-1 text-xs font-semibold text-white shadow-sm">
                    {sourceBadge}
                  </span>
                </div>
              </div>
            </div>

            {/* Right part: Action Buttons */}
            <div className="z-10 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-36 lg:grid-cols-1">
              <button
                onClick={() => setIsShortlisted(!isShortlisted)}
                className={`flex w-full items-center justify-center space-x-1.5 rounded-lg px-5 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95 ${
                  isShortlisted
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-white text-[#0b5496] hover:bg-blue-50"
                }`}
              >
                {isShortlisted && <Check size={14} />}
                <span>{isShortlisted ? "Shortlisted" : "Shortlist"}</span>
              </button>

              {candidate.resumeFileUrl ? (
                <a
                  href={candidate.resumeFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full rounded-lg border border-white/40 bg-white/10 px-5 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-white hover:text-[#0b5496] active:scale-95"
                >
                  View resume
                </a>
              ) : (
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-center text-sm font-medium text-white/40"
                >
                  No resume
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="grid grid-cols-1 divide-y divide-gray-200 border-b border-gray-200 bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
          {/* Email */}
          <div className="flex min-w-0 items-center justify-start space-x-2.5 px-4 py-3 text-sm sm:px-6 md:justify-center md:py-4">
            <Mail size={16} className="text-[#0b5496] flex-shrink-0" />
            {candidate.email ? (
              <a
                href={`mailto:${candidate.email}`}
                className="text-gray-700 hover:text-[#0b5496] hover:underline transition-colors font-medium break-all"
              >
                {candidate.email}
              </a>
            ) : (
              <span className="text-gray-400 font-medium">-</span>
            )}
          </div>

          {/* Phone */}
          <div className="flex min-w-0 items-center justify-start space-x-2.5 px-4 py-3 text-sm sm:px-6 md:justify-center md:py-4">
            <Phone size={16} className="text-[#0b5496] flex-shrink-0" />
            <span className="text-gray-700 font-medium">{phone !== "-" ? phone : "-"}</span>
          </div>

          {/* LinkedIn */}
          <div className="flex min-w-0 items-center justify-start space-x-2.5 px-4 py-3 text-sm sm:px-6 md:justify-center md:py-4">
            <Linkedin size={16} className="text-[#0b5496] flex-shrink-0" />
            {candidate.linkedinProfile ? (
              <a
                href={candidate.linkedinProfile}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center break-all font-medium text-[#0b5496] transition-colors hover:underline"
              >
                <span>{getCleanLinkedIn(candidate.linkedinProfile)}</span>
                <ExternalLink size={12} className="ml-1 opacity-80 flex-shrink-0" />
              </a>
            ) : (
              <span className="text-gray-400 font-medium">-</span>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <section className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-bold text-slate-900">Follow-up status</h3>
            {followUpsLoading ? <span className="text-sm text-slate-500">Loading...</span> : followUpsError ? <span role="alert" className="text-sm text-red-600">Unable to load status</span> : (() => {
              const current = followUps.filter(item => ["Pending", "Overdue"].includes(item.status)).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] || followUps[0];
              return <span className={`rounded-full px-3 py-1 text-xs font-bold ${current?.status === "Completed" ? "bg-emerald-100 text-emerald-800" : current?.status === "Overdue" ? "bg-red-100 text-red-800" : current?.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{current?.status || "No follow-ups"}</span>;
            })()}
          </section>
          {/* Skills & Education Grid */}
          <div className="grid grid-cols-1 gap-6 border-b border-gray-200 pb-6 md:grid-cols-2 lg:gap-8 lg:pb-8">
            {/* Skills Column */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b5496] mb-4 flex items-center">
                <Tag size={14} className="mr-2 text-[#0b5496]" /> Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills && candidate.skills.length > 0 ? (
                  candidate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3.5 py-1.5 bg-[#eaf2fc] text-[#0b5496] rounded-full text-xs font-semibold border border-[#d5e6f7] hover:bg-[#d5e6f7] transition-all"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm font-medium">N/A</span>
                )}
              </div>
            </div>

            {/* Education Column */}
            <div className="md:pl-6 lg:pl-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b5496] mb-4 flex items-center">
                <GraduationCap size={16} className="mr-2 text-[#0b5496]" /> Education
              </h3>
              {candidate.education ? (
                <div className="space-y-1">
                  {typeof candidate.education === "string" ? (
                    candidate.education.split("\n").map((line, idx) => {
                      const isFirstLine = idx === 0;
                      return (
                        <p
                          key={idx}
                          className={
                            isFirstLine ? "font-semibold text-gray-800 text-base" : "text-gray-500 text-sm"
                          }
                        >
                          {line}
                        </p>
                      );
                    })
                  ) : (
                    <>
                      {candidate.education.degree && (
                        <p className="font-semibold text-gray-800 text-base">
                          {candidate.education.degree}
                        </p>
                      )}
                      {candidate.education.institution && (
                        <p className="text-gray-500 text-sm">
                          {candidate.education.institution}
                        </p>
                      )}
                      {candidate.education.year && (
                        <p className="text-gray-400 text-xs mt-0.5">
                          {candidate.education.year}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <span className="text-gray-400 text-sm font-medium">N/A</span>
              )}
            </div>
          </div>

          {/* Work Summary Card */}
          {candidate.workHistory && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b5496] flex items-center">
                <Briefcase size={14} className="mr-2 text-[#0b5496]" /> Work Summary
              </h3>
              <div
                className={`relative rounded-xl border border-[#E9E6DC] bg-[#FAF9F6] p-4 transition-all duration-300 sm:p-6 ${
                  hasLongWorkHistory && !isExpanded ? "max-h-[160px] overflow-hidden" : ""
                } ${hasLongWorkHistory ? "pb-8" : ""}`}
              >
                <div className="text-gray-700 leading-relaxed text-sm font-normal whitespace-pre-line">
                  {typeof candidate.workHistory === "string" ? (
                    candidate.workHistory
                  ) : Array.isArray(candidate.workHistory) ? (
                    candidate.workHistory.map((job, idx) => (
                      <div key={idx} className="mb-4 last:mb-0">
                        <p className="font-semibold text-gray-800">
                          {job.role} {job.company ? `at ${job.company}` : ""}
                        </p>
                        {(job.from || job.to) && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {job.from || "?"} - {job.to || "Present"}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    "-"
                  )}
                </div>

                {hasLongWorkHistory && !isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#FAF9F6] to-transparent pointer-events-none" />
                )}

                {hasLongWorkHistory && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white border border-[#E9E6DC] rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 hover:shadow-lg transition-all cursor-pointer z-10 focus:outline-none"
                    aria-label={isExpanded ? "Collapse work history" : "Expand work history"}
                  >
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-gray-600" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-600" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Certifications & Previous Companies */}
          {((candidate.certifications && candidate.certifications.length > 0) ||
            (candidate.previousCompanies && candidate.previousCompanies.length > 0)) && (
            <div
              className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8 ${
                candidate.workHistory ? "pt-4" : ""
              }`}
            >
              {/* Certifications */}
              {candidate.certifications && candidate.certifications.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b5496] mb-3 flex items-center">
                    <Award size={14} className="mr-2 text-[#0b5496]" /> Certifications
                  </h3>
                  <ul className="space-y-2">
                    {candidate.certifications.map((cert, i) => (
                      <li key={i} className="flex items-start text-gray-700 text-sm">
                        <Check size={14} className="text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Previous Companies */}
              {candidate.previousCompanies && candidate.previousCompanies.length > 0 && (
                <div className="md:pl-6 lg:pl-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b5496] mb-3 flex items-center">
                    <Briefcase size={14} className="mr-2 text-[#0b5496]" /> Previous Companies
                  </h3>
                  <ul className="space-y-2">
                    {candidate.previousCompanies.map((comp, i) => (
                      <li key={i} className="flex items-start text-gray-700 text-sm">
                        <Briefcase
                          size={14}
                          className="text-[#0b5496] opacity-60 mr-2 mt-0.5 flex-shrink-0"
                        />
                        <span>{comp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
