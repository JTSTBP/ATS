import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Check, Users, Briefcase, CalendarCheck, X, UserPlus, ClipboardCheck, Clock, CheckCircle, Building2 } from "lucide-react";
import { useUserContext } from "../../context/UserProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useClientsContext } from "../../context/ClientsProvider";
import { useJobContext } from "../../context/DataProvider";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "../../utils/dateUtils";
import { getStatusTimestamp } from "../../utils/statusUtils";

export default function ReportsTab() {
  const { users, fetchUsers } = useUserContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { clients, fetchClients } = useClientsContext();
  const { jobs, fetchJobs } = useJobContext();
  const navigate = useNavigate();
  const [candidatePopupData, setCandidatePopupData] = useState<{ title: string, clientName: string, status: string, jobTitle: string, candidates: any[] } | null>(null);

  // Global date filter - filters JOBS rows only by Date Received (job.createdAt)
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Local candidate filter for Client Job Report table
  // mode: 'none' | 'total' | 'status' | 'both'
  const [cjrCandFilterMode, setCjrCandFilterMode] = useState<'none' | 'total' | 'status' | 'both'>('none');
  const [cjrCandStartDate, setCjrCandStartDate] = useState('');
  const [cjrCandEndDate, setCjrCandEndDate] = useState('');

  // Local candidate filter for Daily Lineup table
  const [dlCandFilterMode, setDlCandFilterMode] = useState<'none' | 'total' | 'status' | 'both'>('none');
  const [dlCandStartDate, setDlCandStartDate] = useState('');
  const [dlCandEndDate, setDlCandEndDate] = useState('');

  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    date: [],
    client: [],
    job: [],
    recruiter: [],
    total: [],
    daily_req: [],
    daily_source: [],
    daily_recruiter: [],
    daily_client: [],
    daily_job: [],
    daily_total: []
  });
  const [filterSearch, setFilterSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [recruiterSearch, setRecruiterSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [dailyReportsSearch, setDailyReportsSearch] = useState({
    client: "",
    recruiter: "",
    job: ""
  });

  useEffect(() => {
    fetchUsers();
    fetchallCandidates();
    fetchClients();
    fetchJobs();
  }, []);

  // Helper: check if a date falls within the global (job row) date range
  const isWithinGlobalRange = (dateString: string | undefined | null) => {
    if (!startDate && !endDate) return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    if (start && end) return date >= start && date <= end;
    if (start) return date >= start;
    if (end) return date <= end;
    return true;
  };

  // Helper: check if a date falls within a custom local date range (for candidates)
  const isWithinCustomRange = (dateString: string | undefined | null, rangeStart: string, rangeEnd: string) => {
    if (!rangeStart && !rangeEnd) return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    const start = rangeStart ? new Date(rangeStart) : null;
    const end = rangeEnd ? new Date(rangeEnd) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    if (start && end) return date >= start && date <= end;
    if (start) return date >= start;
    if (end) return date <= end;
    return true;
  };

  // Helper: get all candidates for a given status, optionally date-filtered by status timestamp
  const getStatusCandidates = (jobCandidates: any[], status: string, filterMode: 'none' | 'total' | 'status' | 'both', candStart: string, candEnd: string) => {
    const applyStatusFilter = filterMode === 'status' || filterMode === 'both';
    return jobCandidates.filter((c: any) => {
      if (c.status !== status) return false;
      if (!applyStatusFilter) return true;
      const ts = getStatusTimestamp(c, status, status === 'Joined' ? c.joiningDate : status === 'Selected' ? c.selectionDate : undefined);
      return isWithinCustomRange(ts, candStart, candEnd);
    });
  };

  // Helper: get candidates for Rejected/Dropped with a by-field qualifier
  const getSpecialStatusCandidates = (jobCandidates: any[], mainStatus: string, byField: string, byValue: string, filterMode: 'none' | 'total' | 'status' | 'both', candStart: string, candEnd: string) => {
    const applyStatusFilter = filterMode === 'status' || filterMode === 'both';
    return jobCandidates.filter((c: any) => {
      if (c.status !== mainStatus) return false;

      // 1. If explicit field is available, use it
      const explicitBy = c[byField];
      if (explicitBy) {
        if (explicitBy !== byValue) return false;
      } else {
        // 2. If not available, infer from statusHistory
        const history = c.statusHistory || [];
        const hasInterviewed = history.some((h: any) => h.status === 'Interviewed');
        const hasShortlisted = history.some((h: any) => h.status === 'Shortlisted');

        if (byValue === 'Client') {
          // Attributed to Client if they reached Interviewed stage
          if (!hasInterviewed) return false;
        } else if (byValue === 'Mentor') {
          // Attributed to Mentor if they only reached Shortlisted (and not Interviewed)
          if (hasInterviewed || !hasShortlisted) return false;
        } else {
          return false;
        }
      }

      if (!applyStatusFilter) return true;
      const ts = getStatusTimestamp(c, mainStatus);
      return isWithinCustomRange(ts, candStart, candEnd);
    });
  };

  // Helper: get total candidates, optionally filtered by candidate upload date
  const getTotalCandidates = (jobCandidates: any[], filterMode: 'none' | 'total' | 'status' | 'both', candStart: string, candEnd: string) => {
    const applyTotalFilter = filterMode === 'total' || filterMode === 'both';
    if (!applyTotalFilter) return jobCandidates;
    return jobCandidates.filter((c: any) => isWithinCustomRange(c.createdAt, candStart, candEnd));
  };

  // 1. Base Client Job Report Data
  // Global date filter applies to JOBS only (by Date Received). All candidates are lifetime.
  const baseClientJobRows = useMemo(() => {
    const rows: any[] = [];

    const getCandidateJobId = (c: any) => {
      const jid = c.jobId?._id || c.jobId;
      return jid ? String(jid) : null;
    };

    jobs.forEach(job => {
      if (job.status !== "Open") return;
      // Global date filter: show row only if job was created in the global date range
      if (job.createdAt && !isWithinGlobalRange(job.createdAt)) return;

      // ALL candidates for this job (lifetime) - no date filter here
      const jobId = job._id ? String(job._id) : null;
      const jobCandidates = jobId ? candidates.filter(c => getCandidateJobId(c) === jobId) : [];

      const jClientId = typeof job.clientId === 'object' ? job.clientId?._id : job.clientId;
      const client = clients.find(c => c._id === jClientId);
      const clientName = client?.companyName || "Unknown";
      const dateReceived = job.createdAt ? formatDate(job.createdAt) : "N/A";

      const assignedRecruiterIds = Array.isArray(job.assignedRecruiters)
        ? job.assignedRecruiters.map((r: any) => typeof r === 'object' ? r._id : r)
        : [];

      const recruitersInvolved = assignedRecruiterIds
        .map(recruiterId => users.find(u => u._id === recruiterId)?.name)
        .filter(Boolean) as string[];

      rows.push({
        job,
        clientName,
        dateReceived,
        recruitersInvolved,
        jobCandidates, // lifetime candidates
      });
    });

    rows.sort((a, b) => new Date(b.job.createdAt || 0).getTime() - new Date(a.job.createdAt || 0).getTime());
    return rows;
  }, [jobs, candidates, clients, users, startDate, endDate]);

  const clientJobReportData = useMemo(() => {
    const reportRows = baseClientJobRows.filter(row => {
      const matchesDate = selectedFilters.date.length > 0 ? selectedFilters.date.includes(row.dateReceived) : true;
      const matchesClient = selectedFilters.client.length > 0 ? selectedFilters.client.includes(row.clientName) : true;
      const matchesJob = selectedFilters.job.length > 0 ? selectedFilters.job.includes(row.job.title) : true;
      const matchesRecruiter = selectedFilters.recruiter.length > 0 ? row.recruitersInvolved.some((r: string) => selectedFilters.recruiter.includes(r)) : true;
      const filteredTotal = getTotalCandidates(row.jobCandidates, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
      const matchesTotal = selectedFilters.total.length > 0 ? selectedFilters.total.includes(filteredTotal.length.toString()) : true;

      // When local filter is active with dates set, hide rows where the relevant count is 0
      let matchesLocalFilter = true;
      const hasCjrDates = cjrCandStartDate || cjrCandEndDate;
      if (cjrCandFilterMode !== 'none' && hasCjrDates) {
        if (cjrCandFilterMode === 'total') {
          matchesLocalFilter = filteredTotal.length > 0;
        } else if (cjrCandFilterMode === 'status') {
          const allStatusCount = [
            ...getStatusCandidates(row.jobCandidates, 'New', cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate),
            ...getStatusCandidates(row.jobCandidates, 'Shortlisted', cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate),
            ...getStatusCandidates(row.jobCandidates, 'Interviewed', cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate),
            ...getStatusCandidates(row.jobCandidates, 'Selected', cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate),
            ...getStatusCandidates(row.jobCandidates, 'Joined', cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate),
            ...getStatusCandidates(row.jobCandidates, 'Hold', cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate),
            ...getSpecialStatusCandidates(row.jobCandidates, 'Dropped', 'droppedBy', 'Mentor', cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate),
            ...getSpecialStatusCandidates(row.jobCandidates, 'Dropped', 'droppedBy', 'Client', cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate),
            ...getSpecialStatusCandidates(row.jobCandidates, 'Rejected', 'rejectedBy', 'Mentor', cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate),
            ...getSpecialStatusCandidates(row.jobCandidates, 'Rejected', 'rejectedBy', 'Client', cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate),
          ];
          matchesLocalFilter = allStatusCount.length > 0;
        } else if (cjrCandFilterMode === 'both') {
          matchesLocalFilter = filteredTotal.length > 0;
        }
      }

      const matchesClientSearch = clientSearch ? row.clientName.toLowerCase().includes(clientSearch.toLowerCase()) : true;
      const matchesRecruiterSearch = recruiterSearch ? row.recruitersInvolved.some((r: string) => r.toLowerCase().includes(recruiterSearch.toLowerCase())) : true;
      const matchesJobSearch = jobSearch ? row.job.title.toLowerCase().includes(jobSearch.toLowerCase()) : true;

      return matchesDate && matchesClient && matchesJob && matchesRecruiter && matchesTotal && matchesLocalFilter && matchesClientSearch && matchesRecruiterSearch && matchesJobSearch;
    });

    const totals = reportRows.reduce((acc, row) => {
      acc.positions += (Number(row.job.noOfPositions) || 0);
      acc.uploads += getTotalCandidates(row.jobCandidates, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      acc.New = (acc.New || 0) + getStatusCandidates(row.jobCandidates, "New", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      acc.Shortlisted = (acc.Shortlisted || 0) + getStatusCandidates(row.jobCandidates, "Shortlisted", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      acc.Screen = (acc.Screen || 0) +
        ["Screen", "Screened"].reduce((s, st) => s + getStatusCandidates(row.jobCandidates, st, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length, 0);
      acc.Interviewed = (acc.Interviewed || 0) + getStatusCandidates(row.jobCandidates, "Interviewed", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      acc.Selected = (acc.Selected || 0) + getStatusCandidates(row.jobCandidates, "Selected", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      acc.Joined = (acc.Joined || 0) + getStatusCandidates(row.jobCandidates, "Joined", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      acc.Hold = (acc.Hold || 0) + getStatusCandidates(row.jobCandidates, "Hold", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      acc.rejectByMentor = (acc.rejectByMentor || 0) + getSpecialStatusCandidates(row.jobCandidates, "Rejected", "rejectedBy", "Mentor", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      acc.rejectByClient = (acc.rejectByClient || 0) + getSpecialStatusCandidates(row.jobCandidates, "Rejected", "rejectedBy", "Client", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      acc.dropByMentor = (acc.dropByMentor || 0) + getSpecialStatusCandidates(row.jobCandidates, "Dropped", "droppedBy", "Mentor", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      acc.dropByClient = (acc.dropByClient || 0) + getSpecialStatusCandidates(row.jobCandidates, "Dropped", "droppedBy", "Client", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length;
      return acc;
    }, { positions: 0, uploads: 0, rejectByMentor: 0, rejectByClient: 0, dropByMentor: 0, dropByClient: 0, New: 0, Screen: 0, Shortlisted: 0, Interviewed: 0, Selected: 0, Joined: 0, Hold: 0 } as Record<string, number>);

    return { reportRows, totals };
  }, [baseClientJobRows, selectedFilters, clientSearch, recruiterSearch, jobSearch, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate]);

  const getClientJobOptions = (column: string) => {
    const relevantRows = baseClientJobRows.filter(row => {
      if (column !== 'date' && selectedFilters.date.length > 0 && !selectedFilters.date.includes(row.dateReceived)) return false;
      if (column !== 'client' && selectedFilters.client.length > 0 && !selectedFilters.client.includes(row.clientName)) return false;
      if (column !== 'job' && selectedFilters.job.length > 0 && !selectedFilters.job.includes(row.job.title)) return false;
      if (column !== 'recruiter' && selectedFilters.recruiter.length > 0 && !row.recruitersInvolved.some((r: string) => selectedFilters.recruiter.includes(r))) return false;
      const filteredTotal = getTotalCandidates(row.jobCandidates, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
      if (column !== 'total' && selectedFilters.total.length > 0 && !selectedFilters.total.includes(filteredTotal.length.toString())) return false;
      if (clientSearch && !row.clientName.toLowerCase().includes(clientSearch.toLowerCase())) return false;
      if (recruiterSearch && !row.recruitersInvolved.some((r: string) => r.toLowerCase().includes(recruiterSearch.toLowerCase()))) return false;
      if (jobSearch && !row.job.title.toLowerCase().includes(jobSearch.toLowerCase())) return false;
      return true;
    });

    let options: string[] = [];
    switch (column) {
      case 'date':
        options = Array.from(new Set(relevantRows.map(r => r.dateReceived))).sort();
        break;
      case 'client':
        options = Array.from(new Set(relevantRows.map(r => r.clientName))).sort();
        break;
      case 'job':
        options = Array.from(new Set(relevantRows.map(r => r.job.title))).sort();
        break;
      case 'recruiter':
        const allRecruiters = relevantRows.flatMap(r => r.recruitersInvolved);
        options = Array.from(new Set(allRecruiters)).sort();
        break;
      case 'total':
        options = Array.from(new Set(relevantRows.map(r => getTotalCandidates(r.jobCandidates, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate).length.toString()))).sort((a, b) => parseInt(a) - parseInt(b));
        break;
    }
    return options;
  };

  // 2. Base Daily Lineup Data
  // Global date filter applies to the candidate UPLOAD date (sourceDate = day they were added)
  const baseDailyLineupRows = useMemo(() => {
    const rows: any[] = [];
    const openJobIds = new Set(jobs.filter(j => j.status === "Open").map(job => String(job._id)));

    const getCandidateJobId = (c: any) => {
      const jid = c.jobId?._id || c.jobId;
      return jid ? String(jid) : null;
    };

    const isOpenJobCandidate = (c: any) => {
      const jid = getCandidateJobId(c);
      return jid && openJobIds.has(jid);
    };

    const recruiters = users.filter(u => u.designation?.toLowerCase().includes("recruiter") || u.isAdmin);

    recruiters.forEach(recruiter => {
      // Global date filter on candidate upload date (createdAt)
      const recruiterCandidates = candidates.filter(c => {
        const cCreatorId = typeof c.createdBy === 'object' ? (c.createdBy as any)?._id : c.createdBy;
        return cCreatorId === recruiter._id && isWithinGlobalRange(c.createdAt) && isOpenJobCandidate(c);
      });

      const lineupKeys = Array.from(new Set(recruiterCandidates.map(c => {
        const date = formatDate(c.createdAt || "");
        const jobId = getCandidateJobId(c);
        return `${jobId}|${date}`;
      })));

      lineupKeys.forEach(key => {
        const [jobId, sourceDate] = key.split('|');
        if (!jobId || jobId === 'undefined') return;

        const job = jobs.find(j => String(j._id) === jobId);
        if (!job || job.status !== "Open") return;

        const jClientId = typeof job.clientId === 'object' ? (job.clientId as any)?._id : job.clientId;
        const client = clients.find(c => jClientId === c._id);
        const clientName = client?.companyName || "Unknown";
        const jobCandidates = recruiterCandidates.filter(c => {
          const cJobId = getCandidateJobId(c);
          const cDate = formatDate(c.createdAt || "");
          return cJobId === jobId && cDate === sourceDate;
        });
        const jobDate = job.createdAt ? formatDate(job.createdAt) : "N/A";

        if (jobCandidates.length > 0) {
          rows.push({
            recruiter,
            job,
            clientName,
            dateReceived: jobDate,
            sourceDate,
            jobCandidates
          });
        }
      });
    });

    return rows;
  }, [users, candidates, jobs, clients, startDate, endDate]);

  // Daily Lineup Filtered Data (with local candidate filter support)
  const dailyLineupReportData = useMemo(() => {
    const reportRows = baseDailyLineupRows.filter(row => {
      const matchesReq = selectedFilters.daily_req.length > 0 ? selectedFilters.daily_req.includes(row.dateReceived) : true;
      const matchesSource = selectedFilters.daily_source.length > 0 ? selectedFilters.daily_source.includes(row.sourceDate) : true;
      const matchesRecruiter = selectedFilters.daily_recruiter.length > 0 ? selectedFilters.daily_recruiter.includes(row.recruiter.name) : true;
      const matchesClient = selectedFilters.daily_client.length > 0 ? selectedFilters.daily_client.includes(row.clientName) : true;
      const matchesJob = selectedFilters.daily_job.length > 0 ? selectedFilters.daily_job.includes(row.job.title) : true;
      const filteredTotal = getTotalCandidates(row.jobCandidates, dlCandFilterMode, dlCandStartDate, dlCandEndDate);
      const matchesTotal = selectedFilters.daily_total.length > 0 ? selectedFilters.daily_total.includes(filteredTotal.length.toString()) : true;

      // When local filter is active with dates set, hide rows where the relevant count is 0
      let matchesLocalFilter = true;
      const hasDlDates = dlCandStartDate || dlCandEndDate;
      if (dlCandFilterMode !== 'none' && hasDlDates) {
        if (dlCandFilterMode === 'total') {
          matchesLocalFilter = filteredTotal.length > 0;
        } else if (dlCandFilterMode === 'status') {
          const allStatusCount = [
            ...getStatusCandidates(row.jobCandidates, 'New', dlCandFilterMode, dlCandStartDate, dlCandEndDate),
            ...getStatusCandidates(row.jobCandidates, 'Shortlisted', dlCandFilterMode, dlCandStartDate, dlCandEndDate),
            ...getStatusCandidates(row.jobCandidates, 'Interviewed', dlCandFilterMode, dlCandStartDate, dlCandEndDate),
            ...getStatusCandidates(row.jobCandidates, 'Selected', dlCandFilterMode, dlCandStartDate, dlCandEndDate),
            ...getStatusCandidates(row.jobCandidates, 'Joined', dlCandFilterMode, dlCandStartDate, dlCandEndDate),
            ...getStatusCandidates(row.jobCandidates, 'Hold', dlCandFilterMode, dlCandStartDate, dlCandEndDate),
            ...getSpecialStatusCandidates(row.jobCandidates, 'Dropped', 'droppedBy', 'Mentor', dlCandFilterMode, dlCandStartDate, dlCandEndDate),
            ...getSpecialStatusCandidates(row.jobCandidates, 'Dropped', 'droppedBy', 'Client', dlCandFilterMode, dlCandStartDate, dlCandEndDate),
            ...getSpecialStatusCandidates(row.jobCandidates, 'Rejected', 'rejectedBy', 'Mentor', dlCandFilterMode, dlCandStartDate, dlCandEndDate),
            ...getSpecialStatusCandidates(row.jobCandidates, 'Rejected', 'rejectedBy', 'Client', dlCandFilterMode, dlCandStartDate, dlCandEndDate),
          ];
          matchesLocalFilter = allStatusCount.length > 0;
        } else if (dlCandFilterMode === 'both') {
          matchesLocalFilter = filteredTotal.length > 0;
        }
      }

      const matchesClientSearch = dailyReportsSearch.client ? row.clientName.toLowerCase().includes(dailyReportsSearch.client.toLowerCase()) : true;
      const matchesRecruiterSearch = dailyReportsSearch.recruiter ? row.recruiter.name.toLowerCase().includes(dailyReportsSearch.recruiter.toLowerCase()) : true;
      const matchesJobSearch = dailyReportsSearch.job ? row.job.title.toLowerCase().includes(dailyReportsSearch.job.toLowerCase()) : true;

      return matchesReq && matchesRecruiter && matchesClient && matchesJob && matchesTotal && matchesLocalFilter && matchesSource && matchesClientSearch && matchesRecruiterSearch && matchesJobSearch;
    });

    const totals = reportRows.reduce((acc, row) => {
      acc.positions += (Number(row.job.noOfPositions) || 0);
      acc.uploads += getTotalCandidates(row.jobCandidates, dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      acc.New = (acc.New || 0) + getStatusCandidates(row.jobCandidates, "New", dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      acc.Shortlisted = (acc.Shortlisted || 0) + getStatusCandidates(row.jobCandidates, "Shortlisted", dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      acc.Screen = (acc.Screen || 0) +
        ["Screen", "Screened"].reduce((s, st) => s + getStatusCandidates(row.jobCandidates, st, dlCandFilterMode, dlCandStartDate, dlCandEndDate).length, 0);
      acc.Interviewed = (acc.Interviewed || 0) + getStatusCandidates(row.jobCandidates, "Interviewed", dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      acc.Selected = (acc.Selected || 0) + getStatusCandidates(row.jobCandidates, "Selected", dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      acc.Joined = (acc.Joined || 0) + getStatusCandidates(row.jobCandidates, "Joined", dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      acc.Hold = (acc.Hold || 0) + getStatusCandidates(row.jobCandidates, "Hold", dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      acc.rejectByMentor = (acc.rejectByMentor || 0) + getSpecialStatusCandidates(row.jobCandidates, "Rejected", "rejectedBy", "Mentor", dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      acc.rejectByClient = (acc.rejectByClient || 0) + getSpecialStatusCandidates(row.jobCandidates, "Rejected", "rejectedBy", "Client", dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      acc.dropByMentor = (acc.dropByMentor || 0) + getSpecialStatusCandidates(row.jobCandidates, "Dropped", "droppedBy", "Mentor", dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      acc.dropByClient = (acc.dropByClient || 0) + getSpecialStatusCandidates(row.jobCandidates, "Dropped", "droppedBy", "Client", dlCandFilterMode, dlCandStartDate, dlCandEndDate).length;
      return acc;
    }, { positions: 0, uploads: 0, rejectByMentor: 0, rejectByClient: 0, dropByMentor: 0, dropByClient: 0, New: 0, Screen: 0, Shortlisted: 0, Interviewed: 0, Selected: 0, Joined: 0, Hold: 0 } as Record<string, number>);

    return { reportRows, totals };
  }, [baseDailyLineupRows, selectedFilters, dailyReportsSearch, dlCandFilterMode, dlCandStartDate, dlCandEndDate]);

  const getDailyLineupOptions = (column: string) => {
    const relevantRows = baseDailyLineupRows.filter(row => {
      if (column !== 'daily_req' && selectedFilters.daily_req.length > 0 && !selectedFilters.daily_req.includes(row.dateReceived)) return false;
      if (column !== 'daily_source' && selectedFilters.daily_source.length > 0 && !selectedFilters.daily_source.includes(row.sourceDate)) return false;
      if (column !== 'daily_recruiter' && selectedFilters.daily_recruiter.length > 0 && !selectedFilters.daily_recruiter.includes(row.recruiter.name)) return false;
      if (column !== 'daily_client' && selectedFilters.daily_client.length > 0 && !selectedFilters.daily_client.includes(row.clientName)) return false;
      if (column !== 'daily_job' && selectedFilters.daily_job.length > 0 && !selectedFilters.daily_job.includes(row.job.title)) return false;
      const filteredTotal = getTotalCandidates(row.jobCandidates, dlCandFilterMode, dlCandStartDate, dlCandEndDate);
      if (column !== 'daily_total' && selectedFilters.daily_total.length > 0 && !selectedFilters.daily_total.includes(filteredTotal.length.toString())) return false;
      return true;
    });

    let options: string[] = [];
    switch (column) {
      case 'daily_req':
        options = Array.from(new Set(relevantRows.map(r => r.dateReceived))).sort();
        break;
      case 'daily_source':
        options = Array.from(new Set(relevantRows.map(r => r.sourceDate))).sort();
        break;
      case 'daily_recruiter':
        options = Array.from(new Set(relevantRows.map(r => r.recruiter.name))).sort();
        break;
      case 'daily_client':
        options = Array.from(new Set(relevantRows.map(r => r.clientName))).sort();
        break;
      case 'daily_job':
        options = Array.from(new Set(relevantRows.map(r => r.job.title))).sort();
        break;
      case 'daily_total':
        options = Array.from(new Set(relevantRows.map(r => getTotalCandidates(r.jobCandidates, dlCandFilterMode, dlCandStartDate, dlCandEndDate).length.toString()))).sort((a, b) => parseInt(a) - parseInt(b));
        break;
    }
    return options;
  };

  // Calculate statistics (Dashboard Style) - Mixed Global and Filtered
  const dashboardStats = useMemo(() => {
    // 1. Global (System Status) Statistics - Always based on current Open jobs
    const openJobs = jobs.filter(j => j.status === "Open");
    const activeJobs = openJobs.length;
    const openJobIds = new Set(openJobs.map(job => job._id?.toString()).filter(Boolean) as string[]);

    const getCandidateJobId = (c: any) => {
      const jid = c.jobId?._id || c.jobId;
      return jid ? String(jid) : null;
    };

    const isOpenJobCandidate = (c: any) => {
      const jid = getCandidateJobId(c);
      return jid && openJobIds.has(jid);
    };

    // Active Clients: unique clients who have at least one open job
    const activeClientIds = new Set(
      openJobs
        .map(j => {
          const cid = j.clientId;
          if (!cid) return null;
          return typeof cid === "object" && cid._id ? cid._id : String(cid);
        })
        .filter(Boolean)
    );
    const activeClients = activeClientIds.size;

    // Positions Left: total noOfPositions from Open jobs minus joined count from those jobs
    const totalPositionsGlobal = openJobs.reduce((sum, j) => sum + (Number(j.noOfPositions) || 0), 0);
    const totalJoinedInOpenJobs = candidates.filter(c =>
      c.status === "Joined" && isOpenJobCandidate(c)
    ).length;
    const remainingPositions = Math.max(0, totalPositionsGlobal - totalJoinedInOpenJobs);

    // 2. Activity Statistics - Based on filtered table data (date range applied)
    // To match dashboard perfectly:
    const newCandidates = candidates.filter(c =>
      (c.status || "New") === "New" && isWithinGlobalRange(getStatusTimestamp(c, "New") || "") && isOpenJobCandidate(c)
    ).length;

    const shortlistedCandidates = candidates.filter(c =>
      ["Screen", "Screened", "Shortlisted"].includes(c.status || "") &&
      isWithinGlobalRange(getStatusTimestamp(c, ["Screen", "Screened", "Shortlisted"]) || "") &&
      isOpenJobCandidate(c)
    ).length;

    const interviewedCandidates = candidates.filter(c =>
      (c.status || "") === "Interviewed" && isWithinGlobalRange(getStatusTimestamp(c, "Interviewed") || "") && isOpenJobCandidate(c)
    ).length;

    const activeCandidates = newCandidates + shortlistedCandidates + interviewedCandidates;

    const holdCandidates = candidates.filter(c =>
      c.status === "Hold" && isWithinGlobalRange(getStatusTimestamp(c, "Hold") || "") && isOpenJobCandidate(c)
    ).length;

    // Selection/Join counts based on their specific event dates (from GLOBAL candidates)
    const selectedCandidates = candidates.filter(c =>
      c.status === "Selected" && isWithinGlobalRange(getStatusTimestamp(c, "Selected", c.selectionDate) || "") && isOpenJobCandidate(c)
    ).length;

    const joinedCandidates = candidates.filter(c =>
      c.status === "Joined" && isWithinGlobalRange(getStatusTimestamp(c, "Joined", c.joiningDate) || "")
    ).length;

    return {
      activeCandidates,
      activeJobs,
      activeClients,
      remainingPositions,
      newCandidates,
      shortlistedCandidates,
      interviewedCandidates,
      selectedCandidates,
      joinedCandidates,
      holdCandidates,
    };
  }, [jobs, candidates, clientJobReportData, startDate, endDate]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-700 border border-blue-200";
      case "Shortlisted": return "bg-orange-100 text-orange-700 border border-orange-200";
      case "Interviewed": return "bg-purple-100 text-purple-700 border border-purple-200";
      case "Selected": return "bg-green-100 text-green-700 border border-green-200";
      case "Joined": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Hold": return "bg-amber-100 text-amber-700 border border-amber-200";
      case "Rejected": return "bg-red-100 text-red-700 border border-red-200";
      case "Dropped": return "bg-gray-100 text-gray-700 border border-gray-200";
      default: return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };



  const openCandidatePopup = (jobTitle: string, clientName: string, status: string | "Total", jobCandidates: any[]) => {
    setCandidatePopupData({
      title: `${jobTitle} - ${status} Candidates`,
      clientName: clientName,
      status: status,
      jobTitle: jobTitle,
      candidates: jobCandidates
    });
  };

  const closeCandidatePopup = () => setCandidatePopupData(null);

  const toggleFilterValue = (column: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[column] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [column]: updated };
    });
  };

  const clearFilter = (column: string) => {
    setSelectedFilters(prev => ({ ...prev, [column]: [] }));
  };



  const FilterDropdown = ({ column, options, align = 'left' }: { column: string, options: string[], align?: 'left' | 'right' }) => {
    if (openFilter !== column) return null;

    const filteredOptions = options.filter(opt =>
      opt.toLowerCase().includes(filterSearch.toLowerCase())
    );

    return (
      <div className={`absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden font-normal text-slate-700 ${align === 'right' ? 'right-0' : 'left-0'}`}>
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              autoFocus
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto p-2">
          <button
            onClick={() => {
              if (selectedFilters[column].length === options.length) {
                clearFilter(column);
              } else {
                setSelectedFilters(prev => ({ ...prev, [column]: options }));
              }
            }}
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center justify-between group"
          >
            <span>Select All</span>
            {selectedFilters[column].length === options.length && <Check size={12} className="text-indigo-600" />}
          </button>
          <div className="h-px bg-slate-100 my-1" />
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => (
              <button
                key={opt}
                onClick={() => toggleFilterValue(column, opt)}
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center justify-between group"
              >
                <span className="truncate pr-2">{opt}</span>
                {selectedFilters[column].includes(opt) && <Check size={12} className="text-indigo-600" />}
              </button>
            ))
          ) : (
            <div className="px-2 py-4 text-center text-xs text-slate-400">No options found</div>
          )}
        </div>
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-between gap-2">
          <button
            onClick={() => clearFilter(column)}
            className="flex-1 px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:text-red-600 uppercase tracking-wider"
          >
            Clear
          </button>
          <button
            onClick={() => setOpenFilter(null)}
            className="flex-1 px-2 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="text-slate-800 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Reports & Insights</h1>
          <p className="text-sm md:text-base text-slate-500 mt-2 font-medium">
            Real-time system overview and detailed performance metrics.
          </p>
        </div>

        {/* Top Date Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 flex-1 px-2">
            <div className="flex flex-col w-full">
              <label className="text-[10px] uppercase text-slate-400 font-bold ml-1 mb-0.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm font-bold border-none focus:ring-0 text-slate-700 bg-transparent p-1 w-full"
              />
            </div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-100"></div>
          <div className="flex items-center gap-3 flex-1 px-2">
            <div className="flex flex-col w-full">
              <label className="text-[10px] uppercase text-slate-400 font-bold ml-1 mb-0.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm font-bold border-none focus:ring-0 text-slate-700 bg-transparent p-1 w-full"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all h-full self-stretch sm:self-auto flex items-center justify-center"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid (Dashboard Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-10">
        {/* Active Clients */}
        <div
          onClick={() => navigate("/Admin/clients")}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5 flex justify-between items-start transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider group-hover:text-purple-600 transition-colors">
              Active Clients
            </p>
            <h2 className="text-3xl font-black mt-2 text-slate-800 tracking-tight">
              {dashboardStats.activeClients}
            </h2>
            <p className="text-[10px] text-slate-400 mt-1">Clients with open jobs</p>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
            <Building2 size={24} />
          </div>
        </div>

        {/* Positions Left */}
        <div
          onClick={() => navigate("/Admin/jobs")}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5 flex justify-between items-start transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider group-hover:text-amber-600 transition-colors">
              Positions Left
            </p>
            <h2 className="text-3xl font-black mt-2 text-slate-800 tracking-tight">
              {dashboardStats.remainingPositions}
            </h2>
            <p className="text-[10px] text-slate-400 mt-1">Open positions – joined</p>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
            <Briefcase size={24} />
          </div>
        </div>

        {/* Active Requirements (Active Jobs) */}
        <div
          onClick={() => navigate("/Admin/jobs")}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5 flex justify-between items-start transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
              Active Requirements
            </p>
            <h2 className="text-3xl font-black mt-2 text-slate-800 tracking-tight">
              {dashboardStats.activeJobs}
            </h2>
            <p className="text-[10px] text-slate-400 mt-1">Jobs with Open status</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
            <CalendarCheck size={24} />
          </div>
        </div>

        {/* Active Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5 flex justify-between items-start transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
              Active Candidates
            </p>
            <h2 className="text-3xl font-black mt-2 text-slate-800 tracking-tight">
              {dashboardStats.activeCandidates}
            </h2>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
            <Users size={24} />
          </div>
        </div>

        {/* New Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5 flex justify-between items-start transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider group-hover:text-sky-600 transition-colors">
              New
            </p>
            <h2 className="text-3xl font-black mt-2 text-slate-800 tracking-tight">
              {dashboardStats.newCandidates}
            </h2>
          </div>
          <div className="bg-sky-50 text-sky-600 p-3 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
            <UserPlus size={24} />
          </div>
        </div>

        {/* Shortlisted Candidates (Screen) */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5 flex justify-between items-start transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider group-hover:text-orange-600 transition-colors">
              Screen
            </p>
            <h2 className="text-3xl font-black mt-2 text-slate-800 tracking-tight">
              {dashboardStats.shortlistedCandidates}
            </h2>
          </div>
          <div className="bg-orange-50 text-orange-600 p-3 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
            <ClipboardCheck size={24} />
          </div>
        </div>

        {/* Interviewed Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5 flex justify-between items-start transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
              Interviewed
            </p>
            <h2 className="text-3xl font-black mt-2 text-slate-800 tracking-tight">
              {dashboardStats.interviewedCandidates}
            </h2>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
            <Clock size={24} />
          </div>
        </div>

        {/* Selected Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5 flex justify-between items-start transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider group-hover:text-green-600 transition-colors">
              Selected
            </p>
            <h2 className="text-3xl font-black mt-2 text-slate-800 tracking-tight">
              {dashboardStats.selectedCandidates}
            </h2>
          </div>
          <div className="bg-green-50 text-green-600 p-3 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Joined Candidates */}
        <div
          onClick={() => navigate("/Admin/candidates")}
          className="bg-white rounded-2xl shadow-sm hover:shadow-md p-5 flex justify-between items-start transition-all border border-slate-100 cursor-pointer group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
              Joined
            </p>
            <h2 className="text-3xl font-black mt-2 text-slate-800 tracking-tight">
              {dashboardStats.joinedCandidates}
            </h2>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
            <Users size={24} />
          </div>
        </div>
      </div>


      {/* Client Job Report Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Client Job Report</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Overview of requirement status by client</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-auto md:min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full text-slate-600"
              />
              {clientSearch && (
                <button
                  onClick={() => setClientSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="relative group w-full sm:w-auto md:min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Recruiter..."
                value={recruiterSearch}
                onChange={(e) => setRecruiterSearch(e.target.value)}
                className="pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full text-slate-600"
              />
              {recruiterSearch && (
                <button
                  onClick={() => setRecruiterSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="relative group w-full sm:w-auto md:min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Job Title..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full text-slate-600"
              />
              {jobSearch && (
                <button
                  onClick={() => setJobSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Local Candidate Date Filter for Client Job Report */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter Candidate Counts By Date:</span>
          <select
            value={cjrCandFilterMode}
            onChange={e => {
              setCjrCandFilterMode(e.target.value as 'none' | 'total' | 'status' | 'both');
              if (e.target.value === 'none') { setCjrCandStartDate(''); setCjrCandEndDate(''); }
            }}
            className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="none">None (Lifetime Data)</option>
            <option value="total">Total (by Upload Date)</option>
            <option value="status">Status Columns (by Status Change Date)</option>
            <option value="both">Both (Total + Status Columns)</option>
          </select>
          {cjrCandFilterMode !== 'none' && (
            <>
              <input
                type="date"
                value={cjrCandStartDate}
                onChange={e => setCjrCandStartDate(e.target.value)}
                className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={cjrCandEndDate}
                onChange={e => setCjrCandEndDate(e.target.value)}
                className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                onClick={() => { setCjrCandFilterMode('none'); setCjrCandStartDate(''); setCjrCandEndDate(''); }}
                className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                Clear
              </button>
            </>
          )}
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[600px] min-h-[300px] md:min-h-[450px] custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse min-w-[1500px]">
            <thead className="bg-slate-50/50 text-slate-700 font-semibold sticky top-0 z-[30] backdrop-blur-sm">
              <tr>
                <th className="py-4 px-6 min-w-[150px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span>Date Received</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'date' ? null : 'date'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.date.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.date.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="date"
                    options={getClientJobOptions('date')}
                  />
                </th>
                <th className="py-4 px-6 min-w-[180px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span>Client Name</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'client' ? null : 'client'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.client.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.client.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="client"
                    options={getClientJobOptions('client')}
                  />
                </th>
                <th className="py-4 px-6 min-w-[180px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span>Job Title</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'job' ? null : 'job'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.job.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.job.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="job"
                    options={getClientJobOptions('job')}
                  />
                </th>
                <th className="py-4 px-6 min-w-[80px] text-[10px] uppercase tracking-widest font-black text-slate-400 text-center">
                  <span>Pos</span>
                </th>

                <th className="py-4 px-6 min-w-[180px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span>Assigned Recruiters</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'recruiter' ? null : 'recruiter'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.recruiter.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.recruiter.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="recruiter"
                    options={getClientJobOptions('recruiter')}
                    align="right"
                  />
                </th>
                <th className="py-4 px-4 text-center min-w-[100px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <span>Total</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'total' ? null : 'total'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.total.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.total.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="total"
                    options={getClientJobOptions('total')}
                    align="right"
                  />
                </th>
                <th className="py-4 px-4 text-center text-blue-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">New</th>
                <th className="py-4 px-4 text-center text-orange-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Screen</th>
                <th className="py-4 px-4 text-center text-gray-400 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Drop (M)</th>
                <th className="py-4 px-4 text-center text-red-400 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Rej (M)</th>
                <th className="py-4 px-4 text-center text-purple-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Int</th>
                <th className="py-4 px-4 text-center text-green-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Sel</th>
                <th className="py-4 px-4 text-center text-emerald-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Join</th>
                <th className="py-4 px-4 text-center text-amber-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Hold</th>
                <th className="py-4 px-4 text-center text-slate-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Drop (C)</th>
                <th className="py-4 px-4 text-center text-red-700 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Rej (C)</th>


              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const { reportRows, totals } = clientJobReportData;

                if (reportRows.length === 0) {
                  return (
                    <tr>
                      <td colSpan={16} className="py-20 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                            <Filter className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="font-bold text-lg text-slate-600">No job report data found</p>
                          <p className="text-sm">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <>
                    {reportRows.map((row, i) => (
                      <tr key={`${row.job._id}-${i}`} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-6 text-slate-600 text-xs font-bold">{row.dateReceived}</td>
                        <td className="py-4 px-6 font-bold text-slate-700 text-xs">{row.clientName}</td>
                        <td className="py-4 px-6 text-slate-700 font-bold text-xs">{row.job.title}</td>
                        <td className="py-4 px-6 text-slate-600 text-center text-xs font-bold">{row.job.noOfPositions || '-'}</td>
                        <td className="py-4 px-6 text-slate-600">
                          <div className="flex flex-wrap gap-1">
                            {row.recruitersInvolved.map((r: string) => (
                              <span key={r} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200">{r}</span>
                            ))}
                            {row.recruitersInvolved.length === 0 && <span className="text-slate-400 text-[10px] italic">No recruiters assigned</span>}
                          </div>
                        </td>
                        {/* Total Uploads Column */}
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const filtered = getTotalCandidates(row.jobCandidates, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
                            const count = filtered.length;
                            return (
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, "Total Uploads", filtered)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border min-w-[32px] transition-all ${count > 0
                                  ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300 transform hover:scale-105"
                                  : "bg-slate-50 text-slate-300 border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            );
                          })()}
                        </td>
                        {/* New and Screen Columns */}
                        {["New", "Shortlisted"].map(status => {
                          const statusCandidates = getStatusCandidates(row.jobCandidates, status, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
                          const count = statusCandidates.length;
                          return (
                            <td key={status} className="py-4 px-4 text-center">
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, status, statusCandidates)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? `${getStatusColor(status)} hover:scale-110 shadow-sm border border-transparent`
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            </td>
                          );
                        })}
                        {/* Dropped by Mentor Column */}
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const mentorDropped = getSpecialStatusCandidates(row.jobCandidates, "Dropped", "droppedBy", "Mentor", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
                            const count = mentorDropped.length;
                            return (
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, "Drop by Mentor", mentorDropped)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? "bg-gray-100 text-gray-700 border border-gray-200 hover:scale-110 hover:bg-gray-200"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            );
                          })()}
                        </td>
                        {/* Reject by Mentor Column */}
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const mentorRejected = getSpecialStatusCandidates(row.jobCandidates, "Rejected", "rejectedBy", "Mentor", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
                            const count = mentorRejected.length;
                            return (
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, "Reject by Mentor", mentorRejected)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? "bg-red-50 text-red-600 border border-red-200 hover:scale-110 hover:bg-red-100"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            );
                          })()}
                        </td>
                        {/* Interviewed Column */}
                        {["Interviewed"].map(status => {
                          const statusCandidates = getStatusCandidates(row.jobCandidates, status, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
                          const count = statusCandidates.length;
                          return (
                            <td key={status} className="py-4 px-4 text-center">
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, status, statusCandidates)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? `${getStatusColor(status)} hover:scale-110 shadow-sm border border-transparent`
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            </td>
                          );
                        })}
                        {/* Selected + Joined Columns */}
                        {["Selected", "Joined"].map(status => {
                          const statusCandidates = getStatusCandidates(row.jobCandidates, status, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
                          const count = statusCandidates.length;
                          return (
                            <td key={status} className="py-4 px-4 text-center">
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, status, statusCandidates)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? `${getStatusColor(status)} hover:scale-110 shadow-sm border border-transparent`
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            </td>
                          );
                        })}
                        {/* Hold Column */}
                        {["Hold"].map(status => {
                          const statusCandidates = getStatusCandidates(row.jobCandidates, status, cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
                          const count = statusCandidates.length;
                          return (
                            <td key={status} className="py-4 px-4 text-center">
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, status, statusCandidates)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? `${getStatusColor(status)} hover:scale-110 shadow-sm border border-transparent`
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            </td>
                          );
                        })}
                        {/* Dropped by Client Column */}
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const clientDropped = getSpecialStatusCandidates(row.jobCandidates, "Dropped", "droppedBy", "Client", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
                            const count = clientDropped.length;
                            return (
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, "Drop by Client", clientDropped)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? "bg-slate-100 text-slate-600 border border-slate-200 hover:scale-110 hover:bg-slate-200"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            );
                          })()}
                        </td>
                        {/* Reject by Client Column */}
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const clientRejected = getSpecialStatusCandidates(row.jobCandidates, "Rejected", "rejectedBy", "Client", cjrCandFilterMode, cjrCandStartDate, cjrCandEndDate);
                            const count = clientRejected.length;
                            return (
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, "Reject by Client", clientRejected)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? "bg-red-50 text-red-600 border border-red-200 hover:scale-110 hover:bg-red-100"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            );
                          })()}
                        </td>

                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200 sticky bottom-0 z-10 shadow-sm">
                      <td colSpan={3} className="py-4 px-6 text-right text-slate-500 uppercase tracking-widest text-[10px]">Total</td>
                      <td className="py-4 px-6 text-center text-slate-800 text-xs">{totals.positions}</td>
                      <td className="py-4 px-6"></td>
                      <td className="py-4 px-4 text-center text-slate-800 text-xs">{totals.uploads}</td>
                      {["New", "Shortlisted"].map(status => (
                        <td key={status} className="py-4 px-4 text-center text-slate-800 text-xs">
                          {totals[status] || 0}
                        </td>
                      ))}
                      <td className="py-4 px-4 text-center text-gray-600 font-bold text-xs">{totals.dropByMentor || 0}</td>
                      <td className="py-4 px-4 text-center text-red-600 font-bold text-xs">{totals.rejectByMentor}</td>
                      <td className="py-4 px-4 text-center text-slate-800 text-xs">{totals.Interviewed || 0}</td>
                      {["Selected", "Joined", "Hold"].map(status => (
                        <td key={status} className="py-4 px-4 text-center text-slate-800 text-xs">
                          {totals[status] || 0}
                        </td>
                      ))}
                      <td className="py-4 px-4 text-center text-slate-500 font-bold text-xs">{totals.dropByClient || 0}</td>
                      <td className="py-4 px-4 text-center text-red-700 font-bold text-xs">{totals.rejectByClient}</td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>


      {/* Daily Lineup Reports */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Daily Lineup Report</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Recruiter performance by job</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-auto md:min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Client..."
                value={dailyReportsSearch.client}
                onChange={(e) => setDailyReportsSearch(prev => ({ ...prev, client: e.target.value }))}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full text-slate-600"
              />
            </div>
            <div className="relative group w-full sm:w-auto md:min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Recruiter..."
                value={dailyReportsSearch.recruiter}
                onChange={(e) => setDailyReportsSearch(prev => ({ ...prev, recruiter: e.target.value }))}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full text-slate-600"
              />
            </div>
            <div className="relative group w-full sm:w-auto md:min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search Job Title..."
                value={dailyReportsSearch.job}
                onChange={(e) => setDailyReportsSearch(prev => ({ ...prev, job: e.target.value }))}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Local Candidate Date Filter for Daily Lineup */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter Candidate Counts By Date:</span>
          <select
            value={dlCandFilterMode}
            onChange={e => {
              setDlCandFilterMode(e.target.value as 'none' | 'total' | 'status' | 'both');
              if (e.target.value === 'none') { setDlCandStartDate(''); setDlCandEndDate(''); }
            }}
            className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="none">None (Lifetime Data)</option>
            <option value="total">Total (by Upload Date)</option>
            <option value="status">Status Columns (by Status Change Date)</option>
            <option value="both">Both (Total + Status Columns)</option>
          </select>
          {dlCandFilterMode !== 'none' && (
            <>
              <input
                type="date"
                value={dlCandStartDate}
                onChange={e => setDlCandStartDate(e.target.value)}
                className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={dlCandEndDate}
                onChange={e => setDlCandEndDate(e.target.value)}
                className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                onClick={() => { setDlCandFilterMode('none'); setDlCandStartDate(''); setDlCandEndDate(''); }}
                className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                Clear
              </button>
            </>
          )}
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[600px] min-h-[300px] md:min-h-[450px] custom-scrollbar">

          <table className="w-full text-sm text-left border-collapse min-w-[1500px]">
            <thead className="bg-slate-50/50 text-slate-700 font-semibold sticky top-0 z-[30] backdrop-blur-sm">
              <tr>
                <th className="py-4 px-6 min-w-[180px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span>Req Date</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_req' ? null : 'daily_req'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_req.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.daily_req.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_req"
                    options={getDailyLineupOptions('daily_req')}
                  />
                </th>
                <th className="py-4 px-6 min-w-[180px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span>Source Date</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_source' ? null : 'daily_source'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_source.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.daily_source.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_source"
                    options={getDailyLineupOptions('daily_source')}
                  />
                </th>
                <th className="py-4 px-6 min-w-[150px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span>Recruiter</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_recruiter' ? null : 'daily_recruiter'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_recruiter.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.daily_recruiter.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_recruiter"
                    options={getDailyLineupOptions('daily_recruiter')}
                  />
                </th>
                <th className="py-4 px-6 min-w-[180px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span>Client Name</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_client' ? null : 'daily_client'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_client.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.daily_client.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_client"
                    options={getDailyLineupOptions('daily_client')}
                  />
                </th>
                <th className="py-4 px-6 min-w-[180px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span>Job Title</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_job' ? null : 'daily_job'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_job.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.daily_job.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_job"
                    options={getDailyLineupOptions('daily_job')}
                  />
                </th>
                <th className="py-4 px-4 text-center min-w-[100px] relative text-[10px] uppercase tracking-widest font-black text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <span>Total</span>
                    <button
                      onClick={() => { setOpenFilter(openFilter === 'daily_total' ? null : 'daily_total'); setFilterSearch(""); }}
                      className={`p-1 rounded hover:bg-slate-200 transition-colors ${selectedFilters.daily_total.length > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}
                    >
                      <Filter size={12} fill={selectedFilters.daily_total.length > 0 ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <FilterDropdown
                    column="daily_total"
                    options={getDailyLineupOptions('daily_total')}
                    align="right"
                  />
                </th>
                <th className="py-4 px-4 text-center text-blue-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">New</th>
                <th className="py-4 px-4 text-center text-orange-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Screen</th>
                <th className="py-4 px-4 text-center text-gray-400 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Drop (M)</th>
                <th className="py-4 px-4 text-center text-red-400 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Rej (M)</th>
                <th className="py-4 px-4 text-center text-purple-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Int</th>
                <th className="py-4 px-4 text-center text-green-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Sel</th>
                <th className="py-4 px-4 text-emerald-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Join</th>
                <th className="py-4 px-4 text-center text-amber-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Hold</th>
                <th className="py-4 px-4 text-center text-slate-600 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Drop (C)</th>
                <th className="py-4 px-4 text-center text-red-700 min-w-[80px] text-[10px] uppercase tracking-widest font-black">Rej (C)</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const { reportRows, totals } = dailyLineupReportData;
                console.log(reportRows)

                if (reportRows.length === 0) {
                  return (
                    <tr>
                      <td colSpan={16} className="py-20 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                            <Filter className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="font-bold text-lg text-slate-600">No daily report data found</p>
                          <p className="text-sm">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <>
                    {reportRows.map((row: any, i: number) => (
                      <tr key={`${row.job._id}-${row.recruiter._id}-${row.sourceDate}-${i}`} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-6 text-slate-600 text-xs font-bold">{row.dateReceived}</td>
                        <td className="py-4 px-6 text-slate-600 text-xs font-bold">{row.sourceDate}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                              {row?.recruiter?.name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-slate-700 font-bold text-xs">{row?.recruiter?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-700 text-xs">{row.clientName}</td>
                        <td className="py-4 px-6 text-slate-700 font-bold text-xs">{row.job.title}</td>

                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const filtered = getTotalCandidates(row.jobCandidates, dlCandFilterMode, dlCandStartDate, dlCandEndDate);
                            const count = filtered.length;
                            return (
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, "Total Lineups", filtered)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border min-w-[32px] transition-all ${count > 0
                                  ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 hover:border-slate-300 transform hover:scale-105"
                                  : "bg-slate-50 text-slate-300 border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            );
                          })()}
                        </td>

                        {["New", "Shortlisted"].map(status => {
                          const statusCandidates = getStatusCandidates(row.jobCandidates, status, dlCandFilterMode, dlCandStartDate, dlCandEndDate);
                          const count = statusCandidates.length;
                          return (
                            <td key={status} className="py-4 px-4 text-center">
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, status, statusCandidates)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? `${getStatusColor(status)} hover:scale-110 shadow-sm border border-transparent`
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            </td>
                          );
                        })}
                        {/* Dropped by Mentor Column */}
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const mentorDropped = getSpecialStatusCandidates(row.jobCandidates, "Dropped", "droppedBy", "Mentor", dlCandFilterMode, dlCandStartDate, dlCandEndDate);
                            const count = mentorDropped.length;
                            return (
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, "Drop by Mentor", mentorDropped)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? "bg-gray-100 text-gray-700 border border-gray-200 hover:scale-110 hover:bg-gray-200"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            );
                          })()}
                        </td>
                        {/* Reject by Mentor Column */}
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const mentorRejected = getSpecialStatusCandidates(row.jobCandidates, "Rejected", "rejectedBy", "Mentor", dlCandFilterMode, dlCandStartDate, dlCandEndDate);
                            const count = mentorRejected.length;
                            return (
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, "Reject by Mentor", mentorRejected)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? "bg-red-50 text-red-600 border border-red-200 hover:scale-110 hover:bg-red-100"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            );
                          })()}
                        </td>

                        {["Interviewed"].map(status => {
                          const statusCandidates = getStatusCandidates(row.jobCandidates, status, dlCandFilterMode, dlCandStartDate, dlCandEndDate);
                          const count = statusCandidates.length;
                          return (
                            <td key={status} className="py-4 px-4 text-center">
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, status, statusCandidates)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? `${getStatusColor(status)} hover:scale-110 shadow-sm border border-transparent`
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            </td>
                          );
                        })}
                        {["Selected", "Joined", "Hold"].map(status => {
                          const statusCandidates = getStatusCandidates(row.jobCandidates, status, dlCandFilterMode, dlCandStartDate, dlCandEndDate);
                          const count = statusCandidates.length;
                          return (
                            <td key={status} className="py-4 px-4 text-center">
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, status, statusCandidates)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? `${getStatusColor(status)} hover:scale-110 shadow-sm border border-transparent`
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            </td>
                          );
                        })}
                        {/* Dropped by Client Column */}
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const clientDropped = getSpecialStatusCandidates(row.jobCandidates, "Dropped", "droppedBy", "Client", dlCandFilterMode, dlCandStartDate, dlCandEndDate);
                            const count = clientDropped.length;
                            return (
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, "Drop by Client", clientDropped)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? "bg-slate-100 text-slate-600 border border-slate-200 hover:scale-110 hover:bg-slate-200"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const clientRejected = getSpecialStatusCandidates(row.jobCandidates, "Rejected", "rejectedBy", "Client", dlCandFilterMode, dlCandStartDate, dlCandEndDate);
                            const count = clientRejected.length;
                            return (
                              <button
                                disabled={count === 0}
                                onClick={() => openCandidatePopup(row.job.title, row.clientName, "Reject by Client", clientRejected)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold min-w-[32px] transition-all ${count > 0
                                  ? "bg-red-50 text-red-600 border border-red-100 hover:scale-110"
                                  : "bg-slate-50 text-slate-300 border border-slate-100 cursor-default"}`}
                              >
                                {count}
                              </button>
                            );
                          })()}
                        </td>

                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200 sticky bottom-0 z-10 shadow-sm">
                      <td colSpan={5} className="py-4 px-6 text-right text-slate-500 uppercase tracking-widest text-[10px]">Total</td>
                      <td className="py-4 px-4 text-center text-slate-800 text-xs">{totals.uploads}</td>
                      {["New", "Shortlisted"].map(status => (
                        <td key={status} className="py-4 px-4 text-center text-slate-800 text-xs text-xs">
                          {totals[status] || 0}
                        </td>
                      ))}
                      <td className="py-4 px-4 text-center text-gray-600 font-bold text-xs">{totals.dropByMentor || 0}</td>
                      <td className="py-4 px-4 text-center text-red-600 font-bold text-xs">{totals.rejectByMentor}</td>
                      <td className="py-4 px-4 text-center text-slate-800 text-xs">{totals.Interviewed || 0}</td>
                      {["Selected", "Joined", "Hold"].map(status => (
                        <td key={status} className="py-4 px-4 text-center text-slate-800 text-xs">
                          {totals[status] || 0}
                        </td>
                      ))}
                      <td className="py-4 px-4 text-center text-slate-500 font-bold text-xs">{totals.dropByClient || 0}</td>
                      <td className="py-4 px-4 text-center text-red-700 font-bold text-xs">{totals.rejectByClient}</td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>


      {/* Candidate Details Popup */}
      <AnimatePresence>
        {
          candidatePopupData && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-h-[85vh] md:max-w-5xl flex flex-col overflow-hidden"
              >
                <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mb-1">
                      {candidatePopupData.status} Candidates
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      {candidatePopupData.jobTitle} • <span className="text-indigo-600 font-bold">{candidatePopupData.clientName}</span>
                    </p>
                  </div>
                  <button
                    onClick={closeCandidatePopup}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-0 md:p-2 custom-scrollbar bg-slate-50/50">
                  {(() => {
                    const hasStatusDetails = candidatePopupData.candidates.some((c: any) =>
                      (c.status === "Interviewed" && c.interviewDate) ||
                      (c.status === "Selected" && c.selectionDate) ||
                      (c.status === "Joined" && c.joiningDate) ||
                      (c.status === "Rejected" && c.rejectedBy) ||
                      (c.status === "Dropped" && c.droppedBy)
                    );

                    return (
                      <div className="md:rounded-xl overflow-hidden border-y md:border border-slate-200 bg-white m-0 md:m-4 shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
                            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-10 shadow-sm">
                              <tr>
                                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Source Date</th>
                                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Name</th>
                                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Phone</th>
                                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Recruiter</th>
                                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Status</th>
                                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Status Updated</th>
                                {hasStatusDetails && <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Status Details</th>}
                                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500 min-w-[200px]">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {candidatePopupData.candidates.map((candidate: any, index: number) => {
                                const creatorId = typeof candidate.createdBy === 'object' ? candidate.createdBy?._id : candidate.createdBy;
                                const creatorName = (typeof candidate.createdBy === 'object' && candidate.createdBy?.name)
                                  ? candidate.createdBy.name
                                  : (users.find(u => u._id === creatorId)?.name || 'Unknown');
                                return (
                                  <tr key={index} className="hover:bg-slate-50 transition-colors group">
                                    <td className="py-4 px-6 text-slate-600 text-xs font-bold whitespace-nowrap">{candidate.createdAt ? formatDate(candidate.createdAt) : '-'}</td>
                                    <td className="py-4 px-6 font-bold text-slate-700">{candidate.dynamicFields?.candidateName || '-'}</td>
                                    <td className="py-4 px-6 text-slate-600 font-mono text-xs">{candidate.dynamicFields?.Phone || '-'}</td>
                                    <td className="py-4 px-6">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        {creatorName}
                                      </span>
                                    </td>
                                    <td className="py-4 px-6">
                                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${(() => {
                                        switch (candidate.status) {
                                          case 'New': return 'bg-blue-50 text-blue-700 border-blue-200';
                                          case 'Shortlisted': return 'bg-orange-50 text-orange-700 border-orange-200';
                                          case 'Interviewed': return 'bg-purple-50 text-purple-700 border-purple-200';
                                          case 'Selected': return 'bg-green-50 text-green-700 border-green-200';
                                          case 'Joined': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                          case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
                                          default: return 'bg-slate-100 text-slate-700 border-slate-200';
                                        }
                                      })()}`}>
                                        {candidate.status}
                                      </span>
                                    </td>
                                    <td className="py-4 px-6 text-slate-600 text-xs font-bold whitespace-nowrap">
                                      {(() => {
                                        const ts = getStatusTimestamp(candidate, candidate.status, candidate.status === 'Joined' ? candidate.joiningDate : candidate.status === 'Selected' ? candidate.selectionDate : undefined);
                                        return ts ? formatDate(ts) : '-';
                                      })()}
                                    </td>
                                    {hasStatusDetails && (
                                      <td className="py-4 px-6 text-xs space-y-1">
                                        {candidate.status === 'Interviewed' && (
                                          <div className="flex flex-col gap-1">
                                            <span className="font-bold text-slate-700">R{candidate.interviewRound}</span>
                                            <span className="text-slate-500">{candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString() : '-'}</span>
                                          </div>
                                        )}
                                        {candidate.status === 'Selected' && (
                                          <div className="flex flex-col gap-1">
                                            <span className="font-bold text-slate-700">Select: {candidate.selectionDate ? new Date(candidate.selectionDate).toLocaleDateString() : '-'}</span>
                                          </div>
                                        )}
                                        {candidate.status === 'Joined' && (
                                          <div className="flex flex-col gap-1">
                                            <span className="font-bold text-slate-700">Join: {candidate.joiningDate ? new Date(candidate.joiningDate).toLocaleDateString() : '-'}</span>
                                          </div>
                                        )}
                                        {candidate.status === 'Rejected' && (
                                          <div className="flex flex-col gap-1">
                                            <span className="font-bold text-red-600">By {candidate.rejectedBy}</span>
                                            <span className="text-slate-500 italic">{candidate.rejectionReason}</span>
                                          </div>
                                        )}
                                        {candidate.status === 'Dropped' && (
                                          <div className="flex flex-col gap-1">
                                            <span className="font-bold text-slate-600">By {candidate.droppedBy}</span>
                                            <span className="text-slate-500 italic">{candidate.notes || '-'}</span>
                                          </div>
                                        )}
                                      </td>
                                    )}
                                    <td className="py-4 px-6 text-slate-500 text-xs italic max-w-[250px] truncate" title={candidate.notes}>
                                      {candidate.notes || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button
                    onClick={closeCandidatePopup}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >
    </div >
  );
}
