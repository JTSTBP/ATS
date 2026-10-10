import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import CandidateDetailModal from "./CandidateDetailModal";

/* ----------------------- Types ----------------------- */
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
  skills?: string[];
  currentCompany?: string;
  designation?: string;
  experience?: string;
  location?: string;
  noticePeriod?: string;
  expectedSalary?: string;
  sourceIdentifier?: string;
  sourceType?: string;
  createdAt?: string;
  updatedAt?: string;
  education?: Education | string;
  workHistory?: WorkHistoryItem[] | string;
  previousCompanies?: string[];
  resumeFileUrl?: string;
  requirementId?: {
    _id: string;
    title: string;
    department?: string;
    status?: string;
  } | string;
}

const PAGE_SIZE = 10;

/* ----------------------- Helpers ----------------------- */
function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Active today";
  if (days === 1) return "Active 1 day ago";
  return `Active ${days} days ago`;
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
}

const AVATAR_COLORS = [
  "#4f46e5", "#0891b2", "#0d9488", "#16a34a",
  "#d97706", "#dc2626", "#7c3aed", "#db2777",
];

function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function educationLabel(edu: Education | string | undefined): string {
  if (!edu) return "";
  if (typeof edu === "string") return edu;
  const parts = [edu.degree, edu.institution, edu.year].filter(Boolean);
  return parts.join(" | ");
}

function previousCompanyLabel(c: Candidate): string {
  if (c.previousCompanies && c.previousCompanies.length > 0)
    return c.previousCompanies[0];
  if (c.workHistory) {
    if (typeof c.workHistory === "string") return c.workHistory;
    if (Array.isArray(c.workHistory) && c.workHistory.length > 0)
      return c.workHistory[0].company || "";
  }
  return "";
}

function truncateText(text?: string, maxLen: number = 80): string {
  if (!text) return "";
  const cleaned = text.trim();
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + "..." : cleaned;
}

/* ----------------------- Candidate Card ----------------------- */
function NaukriCandidateCard({
  candidate,
  onView,
}: {
  candidate: Candidate;
  onView: () => void;
}) {
  const bg = avatarColor(candidate._id);
  const prevCompany = previousCompanyLabel(candidate);
  const eduLabel = educationLabel(candidate.education as Education | string);

  const displayName = truncateText(candidate.name || "Unknown", 45);

  const currentJob = candidate.designation
    ? `${candidate.designation}${candidate.currentCompany ? ` at ${candidate.currentCompany}` : ""}`
    : "";
  const currentText = truncateText(currentJob, 100);
  const prevText = truncateText(prevCompany, 100);
  const eduText = truncateText(eduLabel, 100);
  const prefLocationText = truncateText(candidate.location || "", 80);

  return (
    <div className="naukri-card">
      <div className="naukri-card__top">
        {/* Left */}
        <div className="naukri-card__left">
          <h2 className="naukri-card__name" onClick={onView} title={candidate.name}>
            {displayName}
          </h2>
          <div className="naukri-card__meta">
            {candidate.experience && (
              <span className="naukri-card__meta-item" title={candidate.experience}>
                <svg className="naukri-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
                {truncateText(candidate.experience, 25)}
              </span>
            )}
            {candidate.expectedSalary && (
              <span className="naukri-card__meta-item" title={candidate.expectedSalary}>
                <svg className="naukri-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                {truncateText(candidate.expectedSalary, 25)}
              </span>
            )}
            {candidate.location && (
              <span className="naukri-card__meta-item" title={candidate.location}>
                <svg className="naukri-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {truncateText(candidate.location, 35)}
              </span>
            )}
          </div>

          {candidate.designation && (
            <div className="naukri-card__row">
              <span className="naukri-card__label">Current</span>
              <span className="naukri-card__value" title={currentJob}>
                {currentText}
              </span>
            </div>
          )}
          {prevCompany && (
            <div className="naukri-card__row">
              <span className="naukri-card__label">Previous</span>
              <span className="naukri-card__value" title={prevCompany}>
                {prevText}
              </span>
            </div>
          )}
          {eduLabel && (
            <div className="naukri-card__row">
              <span className="naukri-card__label">Education</span>
              <span className="naukri-card__value" title={eduLabel}>
                {eduText}
              </span>
            </div>
          )}
          {candidate.location && (
            <div className="naukri-card__row">
              <span className="naukri-card__label">Pref. location</span>
              <span className="naukri-card__value" title={candidate.location}>
                {prefLocationText}
              </span>
            </div>
          )}
          {candidate.requirementId && typeof candidate.requirementId === "object" && candidate.requirementId.title && (
            <div className="naukri-card__row">
              <span className="naukri-card__label">Job Name</span>
              <span className="naukri-card__value" style={{ fontWeight: 600, color: "#4f46e5" }} title={candidate.requirementId.title}>
                {candidate.requirementId.title} {candidate.requirementId.department ? `(${candidate.requirementId.department})` : ""}
              </span>
            </div>
          )}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="naukri-card__row naukri-card__row--top">
              <span className="naukri-card__label">Key skills</span>
              <div className="naukri-card__skills">
                {candidate.skills.slice(0, 10).map((s) => (
                  <span key={s} className="naukri-skill-tag" title={s}>
                    {truncateText(s, 25)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {candidate.noticePeriod && (
            <div className="naukri-card__row">
              <span className="naukri-card__label">Notice</span>
              <span className="naukri-card__value" title={candidate.noticePeriod}>
                {truncateText(candidate.noticePeriod, 50)}
              </span>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="naukri-card__right">
          <div className="naukri-avatar" style={{ background: bg }}>
            {getInitials(candidate.name)}
          </div>
          <button className="naukri-btn naukri-btn--primary" onClick={onView}>
            View Profile
          </button>
          {candidate.phoneNumber && (
            <button className="naukri-btn naukri-btn--secondary">
              <svg className="naukri-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01-.07 2.13 2 2 0 012 0h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 14.92z" />
              </svg>
              Call candidate
            </button>
          )}
          {candidate.sourceType && (
            <span className="naukri-source-badge">{candidate.sourceType}</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="naukri-card__footer">

        {candidate.resumeFileUrl && (
          <a href={candidate.resumeFileUrl} target="_blank" rel="noreferrer" className="naukri-footer-item naukri-footer-cv">
            CV
          </a>
        )}
        <span className="naukri-footer-item naukri-footer-right">
          Added{" "}
          {candidate.createdAt
            ? new Date(candidate.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : "-"}
        </span>
        <span className="naukri-footer-item naukri-footer-active">
          {timeAgo(candidate.createdAt)}
        </span>
      </div>
    </div>
  );
}

/* ----------------------- Filter Section ----------------------- */
function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="naukri-filter-section">
      <button className="naukri-filter-section__header" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <svg className={`naukri-chevron ${open ? "naukri-chevron--open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      {open && <div className="naukri-filter-section__body">{children}</div>}
    </div>
  );
}

/* ----------------------- Main Page ----------------------- */
export default function TalentDatabasePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [minExp, setMinExp] = useState("");
  const [maxExp, setMaxExp] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [company, setCompany] = useState("");
  const [designation, setDesignation] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [sourceType, setSourceType] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [jobsList, setJobsList] = useState<{ _id: string; title: string; department?: string }[]>([]);
  const [requirementId, setRequirementId] = useState("");

  const locationCounts = [
    { name: "Bengaluru", count: 44 },
    { name: "Pune", count: 9 },
    { name: "Mumbai", count: 5 },
    { name: "Hyderabad", count: 4 },
    { name: "Delhi NCR", count: 3 },
  ];

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCandidates = async (resetPage = false) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(locationFilter.length ? { location: locationFilter } : {}),
        ...(minExp ? { minExp } : {}),
        ...(maxExp ? { maxExp } : {}),
        ...(skills.length ? { skills } : {}),
        ...(company ? { company } : {}),
        ...(designation ? { designation } : {}),
        ...(noticePeriod ? { noticePeriod } : {}),
        ...(sourceType ? { sourceType } : {}),
  
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
        ...(requirementId ? { requirementId } : {}),
      };
      const res = await axios.get("/api/source-candidates", { params });
      if (res.data.success) {
        setCandidates(res.data.candidates);
        setTotalCount(res.data.totalCount ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch sourced candidates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCandidates(true), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, locationFilter, minExp, maxExp, skills, company, designation, noticePeriod, sourceType, fromDate, toDate, requirementId]);

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get("/api/jobs");
        if (res.data.success) {
          setJobsList(res.data.jobs || []);
        }
      } catch (err) {
        console.error("Failed to fetch jobs list for filter", err);
      }
    };
    fetchJobs();
  }, []);

  const toggleLocation = (loc: string) => {
    setLocationFilter((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const addSkill = () => {
    const tag = skillInput.trim();
    if (tag && !skills.includes(tag)) setSkills((s) => [...s, tag]);
    setSkillInput("");
  };

  const clearAll = () => {
    setSearch(""); setLocationFilter([]); setLocationInput("");
    setMinExp(""); setMaxExp(""); setSkills([]); setSkillInput("");
    setCompany(""); setDesignation(""); setNoticePeriod("");
    setSourceType(""); setFromDate(""); setToDate(""); setRequirementId(""); setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <>
      <style>{STYLES}</style>
      <div className="naukri-page">
        {/* Sidebar */}
        <aside className="naukri-sidebar">
          <div className="naukri-sidebar__header">
            <span className="naukri-sidebar__title">Filters</span>
            <button className="naukri-clear-btn" onClick={clearAll}>Clear all</button>
          </div>

          <FilterSection title="Keywords">
            <input type="text" className="naukri-input" placeholder="Skills, companies, roles..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </FilterSection>

          <FilterSection title="Requirement / Job">
            <select
              className="naukri-input text-sm cursor-pointer"
              value={requirementId}
              onChange={(e) => setRequirementId(e.target.value)}
            >
              <option value="">All Jobs</option>
              {jobsList.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title} {j.department ? `(${j.department})` : ""}
                </option>
              ))}
            </select>
          </FilterSection>

          <FilterSection title="Current company" defaultOpen={false}>
            <input type="text" className="naukri-input" placeholder="e.g. Infosys, TCS" value={company} onChange={(e) => setCompany(e.target.value)} />
          </FilterSection>

          <FilterSection title="Designation" defaultOpen={false}>
            <input type="text" className="naukri-input" placeholder="e.g. Software Engineer" value={designation} onChange={(e) => setDesignation(e.target.value)} />
          </FilterSection>

          <FilterSection title={`Location${locationFilter.length ? ` (${locationFilter.length})` : ""}`}>
            <div className="naukri-search-wrap">
              <input type="text" className="naukri-input naukri-input--search" placeholder="Search location" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} />
              <svg className="naukri-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            {locationCounts.filter((l) => l.name.toLowerCase().includes(locationInput.toLowerCase())).map((l) => (
              <label key={l.name} className="naukri-checkbox-row">
                <input type="checkbox" className="naukri-checkbox" checked={locationFilter.includes(l.name)} onChange={() => toggleLocation(l.name)} />
                <span className="naukri-checkbox-label">{l.name}</span>
                <span className="naukri-checkbox-count">{l.count}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Experience (Years)">
            <div className="naukri-exp-row">
              <input type="number" className="naukri-input naukri-input--sm" placeholder="Min" min={0} value={minExp} onChange={(e) => setMinExp(e.target.value)} />
              <span className="naukri-exp-to">to</span>
              <input type="number" className="naukri-input naukri-input--sm" placeholder="Max" min={0} value={maxExp} onChange={(e) => setMaxExp(e.target.value)} />
            </div>
          </FilterSection>

          <FilterSection title="Skills" defaultOpen={false}>
            <div className="naukri-skill-input-row">
              <input type="text" className="naukri-input" placeholder="Add skill" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} />
              <button className="naukri-add-btn" onClick={addSkill}>Add</button>
            </div>
            {skills.length > 0 && (
              <div className="naukri-skill-tags">
                {skills.map((s) => (
                  <span key={s} className="naukri-skill-tag naukri-skill-tag--filter">
                    {s}<button onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}>x</button>
                  </span>
                ))}
              </div>
            )}
          </FilterSection>

          <FilterSection title="Notice Period" defaultOpen={false}>
            {["Immediate", "15 days", "30 days", "60 days", "90 days"].map((np) => (
              <label key={np} className="naukri-checkbox-row">
                <input type="radio" name="noticePeriod" className="naukri-checkbox" checked={noticePeriod === np} onChange={() => setNoticePeriod(noticePeriod === np ? "" : np)} />
                <span className="naukri-checkbox-label">{np}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Source Type" defaultOpen={false}>
            {["Resume Upload", "Manual Entry"].map((st) => (
              <label key={st} className="naukri-checkbox-row">
                <input type="checkbox" className="naukri-checkbox" checked={sourceType === st} onChange={() => setSourceType(sourceType === st ? "" : st)} />
                <span className="naukri-checkbox-label">{st}</span>
              </label>
            ))}
          </FilterSection>

          <FilterSection title="Date Added" defaultOpen={false}>
            <div className="naukri-date-row">
              <label className="naukri-date-label">From</label>
              <input type="date" className="naukri-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <label className="naukri-date-label" style={{ marginTop: 6 }}>To</label>
              <input type="date" className="naukri-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </FilterSection>
        </aside>

        {/* Results */}
        <main className="naukri-results">
          <div className="naukri-results__header">
            <h1 className="naukri-results__title">
              Talent Database
              {totalCount > 0 && <span className="naukri-results__count">&nbsp;— {totalCount} candidates found</span>}
            </h1>
            {loading && <span className="naukri-loading-dot" />}
          </div>

          {locationFilter.length > 0 && (
            <div className="naukri-active-filters">
              {locationFilter.map((l) => (
                <span key={l} className="naukri-active-chip">
                  {l}<button onClick={() => toggleLocation(l)}>x</button>
                </span>
              ))}
            </div>
          )}

          <div className="naukri-card-list">
            {loading && candidates.length === 0 && (
              <div className="naukri-skeleton-list">
                {[1, 2, 3].map((i) => <div key={i} className="naukri-skeleton" />)}
              </div>
            )}
            {!loading && candidates.length === 0 && (
              <div className="naukri-empty">
                <p>No candidates match your filters.</p>
                <button className="naukri-clear-btn" onClick={clearAll}>Clear filters</button>
              </div>
            )}
            {candidates.map((c) => (
              <NaukriCandidateCard key={c._id} candidate={c} onView={() => setSelected(c)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="naukri-pagination">
              <button className="naukri-page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} className={`naukri-page-btn ${page === p ? "naukri-page-btn--active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              {totalPages > 7 && <span className="naukri-page-ellipsis">...</span>}
              <button className="naukri-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>Next</button>
            </div>
          )}
        </main>
      </div>

      {selected && <CandidateDetailModal candidate={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

const STYLES = `
.naukri-page { display:flex; min-height:100vh; background:#f3f4f6; font-family:"Inter","Segoe UI",sans-serif; font-size:13px; color:#1e293b; }

.naukri-sidebar { width:260px; min-width:260px; background:#fff; border-right:1px solid #e2e8f0; height:100vh; overflow-y:auto; position:sticky; top:0; flex-shrink:0; }
.naukri-sidebar::-webkit-scrollbar { width:4px; }
.naukri-sidebar::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }
.naukri-sidebar__header { display:flex; justify-content:space-between; align-items:center; padding:16px 16px 12px; border-bottom:1px solid #e2e8f0; }
.naukri-sidebar__title { font-size:15px; font-weight:700; color:#0f172a; }
.naukri-clear-btn { background:none; border:none; color:#4f46e5; cursor:pointer; font-size:12px; font-weight:600; padding:0; }
.naukri-clear-btn:hover { text-decoration:underline; }

.naukri-filter-section { border-bottom:1px solid #f1f5f9; }
.naukri-filter-section__header { display:flex; justify-content:space-between; align-items:center; width:100%; padding:12px 16px; background:none; border:none; cursor:pointer; font-size:13px; font-weight:600; color:#1e293b; text-align:left; }
.naukri-filter-section__header:hover { background:#f8fafc; }
.naukri-filter-section__body { padding:4px 16px 12px; }
.naukri-chevron { width:14px; height:14px; color:#64748b; transition:transform .2s; }
.naukri-chevron--open { transform:rotate(180deg); }

.naukri-input { width:100%; padding:7px 10px; border:1px solid #cbd5e1; border-radius:5px; font-size:12px; color:#1e293b; background:#f8fafc; box-sizing:border-box; outline:none; transition:border-color .2s; }
.naukri-input:focus { border-color:#4f46e5; background:#fff; }
.naukri-input--sm { width:calc(50% - 14px); }
.naukri-input--search { padding-right:30px; }
.naukri-search-wrap { position:relative; margin-bottom:8px; }
.naukri-search-icon { position:absolute; right:8px; top:50%; transform:translateY(-50%); width:14px; height:14px; color:#94a3b8; pointer-events:none; }

.naukri-checkbox-row { display:flex; align-items:center; gap:8px; padding:5px 0; cursor:pointer; }
.naukri-checkbox { width:14px; height:14px; accent-color:#4f46e5; cursor:pointer; flex-shrink:0; }
.naukri-checkbox-label { flex:1; color:#374151; font-size:12.5px; }
.naukri-checkbox-count { font-size:11px; color:#94a3b8; background:#f1f5f9; padding:1px 6px; border-radius:10px; }

.naukri-exp-row { display:flex; align-items:center; gap:8px; }
.naukri-exp-to { font-size:12px; color:#64748b; flex-shrink:0; }

.naukri-skill-input-row { display:flex; gap:6px; margin-bottom:8px; }
.naukri-add-btn { padding:7px 12px; background:#4f46e5; color:#fff; border:none; border-radius:5px; cursor:pointer; font-size:12px; flex-shrink:0; font-weight:600; }
.naukri-add-btn:hover { background:#4338ca; }
.naukri-skill-tags { display:flex; flex-wrap:wrap; gap:5px; }
.naukri-skill-tag--filter { display:flex; align-items:center; gap:4px; background:#ede9fe; color:#4f46e5; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:500; }
.naukri-skill-tag--filter button { background:none; border:none; cursor:pointer; color:#7c3aed; padding:0; font-size:10px; line-height:1; }

.naukri-date-row { display:flex; flex-direction:column; gap:4px; }
.naukri-date-label { font-size:11px; color:#64748b; font-weight:600; margin-top:4px; }

.naukri-results { flex:1; padding:16px 20px; overflow-y:auto; min-width:0; }
.naukri-results__header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.naukri-results__title { font-size:17px; font-weight:700; color:#0f172a; }
.naukri-results__count { font-size:13px; font-weight:400; color:#64748b; }

.naukri-active-filters { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
.naukri-active-chip { display:inline-flex; align-items:center; gap:5px; background:#ddd6fe; color:#4f46e5; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
.naukri-active-chip button { background:none; border:none; cursor:pointer; color:#7c3aed; font-size:10px; padding:0; line-height:1; }

.naukri-card-list { display:flex; flex-direction:column; gap:12px; }
.naukri-card { background:#fff; border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,.06); transition:box-shadow .2s,border-color .2s; overflow:hidden; }
.naukri-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.1); border-color:#c7d2fe; }
.naukri-card__top { display:flex; gap:12px; padding:16px 16px 10px; }
.naukri-card__left { flex:1; min-width:0; }
.naukri-card__right { display:flex; flex-direction:column; align-items:center; gap:8px; min-width:130px; }
.naukri-card__name { font-size:16px; font-weight:700; color:#1e40af; margin:0 0 6px; cursor:pointer; }
.naukri-card__name:hover { text-decoration:underline; }
.naukri-card__meta { display:flex; flex-wrap:wrap; gap:14px; margin-bottom:10px; }
.naukri-card__meta-item { display:flex; align-items:center; gap:4px; color:#374151; font-size:12.5px; font-weight:500; }
.naukri-icon { width:14px; height:14px; flex-shrink:0; }
.naukri-icon--sm { width:12px; height:12px; }
.naukri-card__row { display:flex; align-items:baseline; gap:6px; margin-bottom:4px; flex-wrap:wrap; }
.naukri-card__row--top { align-items:flex-start; }
.naukri-card__label { min-width:90px; color:#64748b; font-size:12px; flex-shrink:0; }
.naukri-card__value { color:#1e293b; font-size:12.5px; }
.naukri-card__skills { display:flex; flex-wrap:wrap; gap:5px; }
.naukri-skill-tag { background:#f1f5f9; color:#374151; padding:2px 8px; border-radius:4px; font-size:11.5px; border:1px solid #e2e8f0; }

.naukri-avatar { width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:20px; flex-shrink:0; }
.naukri-btn { width:120px; padding:7px 0; border-radius:5px; font-size:12px; font-weight:600; cursor:pointer; border:none; display:flex; align-items:center; justify-content:center; gap:5px; }
.naukri-btn--primary { background:#4f46e5; color:#fff; }
.naukri-btn--primary:hover { background:#4338ca; }
.naukri-btn--secondary { background:#fff; color:#374151; border:1px solid #cbd5e1; }
.naukri-btn--secondary:hover { background:#f8fafc; }
.naukri-source-badge { font-size:10px; font-weight:600; background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; padding:2px 8px; border-radius:20px; text-align:center; }

.naukri-card__footer { display:flex; align-items:center; gap:16px; padding:8px 16px; background:#f8fafc; border-top:1px solid #f1f5f9; flex-wrap:wrap; }
.naukri-footer-item { display:flex; align-items:center; gap:4px; font-size:11.5px; color:#64748b; }
.naukri-footer-cv { color:#4f46e5; text-decoration:none; font-weight:600; }
.naukri-footer-right { margin-left:auto; }
.naukri-footer-active { color:#16a34a; font-weight:600; }

.naukri-pagination { display:flex; justify-content:center; align-items:center; gap:6px; margin-top:24px; padding-bottom:24px; }
.naukri-page-btn { padding:6px 12px; border:1px solid #cbd5e1; border-radius:5px; background:#fff; color:#374151; cursor:pointer; font-size:13px; transition:all .15s; }
.naukri-page-btn:hover:not(:disabled) { background:#ede9fe; border-color:#4f46e5; color:#4f46e5; }
.naukri-page-btn--active { background:#4f46e5; color:#fff; border-color:#4f46e5; font-weight:700; }
.naukri-page-btn:disabled { opacity:.4; cursor:default; }
.naukri-page-ellipsis { color:#94a3b8; font-size:16px; }

.naukri-loading-dot { display:inline-block; width:10px; height:10px; background:#4f46e5; border-radius:50%; animation:naukri-pulse 1s ease-in-out infinite; }
@keyframes naukri-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
.naukri-skeleton-list { display:flex; flex-direction:column; gap:12px; }
.naukri-skeleton { height:180px; background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; border-radius:8px; animation:shimmer 1.4s infinite; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.naukri-empty { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px 20px; color:#94a3b8; font-size:14px; }

/* Responsive adjustments */
@media (max-width: 768px) {
  .naukri-page { flex-direction: column; }
  .naukri-sidebar { width: 100%; min-width: 0; height: auto; border-right: none; border-bottom: 1px solid #e2e8f0; position: relative; overflow-y: auto; max-height: 50vh; }
  .naukri-results { padding: 12px 16px; }
  .naukri-card__top { flex-direction: column; }
  .naukri-card__right { flex-direction: row; flex-wrap: wrap; justify-content: space-between; width: 100%; min-width: 0; gap: 8px; }
  .naukri-card__right .naukri-btn { width: auto; flex: 1; margin: 0 4px; min-width: 90px; }
  .naukri-card__right .naukri-btn--primary, .naukri-card__right .naukri-btn--secondary { flex: unset; }
}
@media (max-width: 480px) {
  .naukri-card__right .naukri-btn { flex: 1 1 45%; margin: 4px 0; }
  .naukri-card__right { justify-content: center; }
  .naukri-sidebar { max-height: 70vh; }
  /* Additional mobile refinements */
  .naukri-card { padding: 12px; }
  .naukri-card__top { gap: 8px; }
  .naukri-card__name { font-size: 14px; }
  .naukri-card__meta-item { font-size: 11px; }
  .naukri-card__label { min-width: 70px; font-size: 11px; }
  .naukri-card__value { font-size: 12px; }
  .naukri-btn { font-size: 11px; padding: 6px 0; }
}
`;
