import EmailConnection from "./EmailConnection";
import "./FollowUps.css";
import { useAuth } from "../../context/AuthProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle,
  Copy,
  ExternalLink,
  Eye,
  Pencil,
  Mail,
  MessageCircle,
  Phone,
  Play,
  RefreshCw,
  Search,
  Send,
  Square,
  Upload,
  Trash2,
  Users,
  X,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${API_BASE_URL}/api/recruiter/follow-ups`;

const CANDIDATE_STATUSES = ["Not interested", "Wrong number", "No answer", "Busy", "Lineup"];

const CALL_STATUSES = ["Connected", "No Answer", "Busy", "Switched Off", "Not Reachable", "Call Back Later"];
const CALL_OUTCOMES = [
  "Interested",
  "Not Interested",
  "Call Back",
  "Need More Information",
  "Interview Interested",
  "Salary Issue",
  "Location Issue",
  "Notice Period Issue",
  "Wrong Number",
  "Other",
];
const FOLLOW_UP_TYPES = ["Call", "Email", "WhatsApp", "Interview Reminder", "JD Sharing", "General Follow-up", "Joining Reminder", "Custom"];
const EMAIL_CATEGORIES = ["No Answer", "Call Back", "Job Opportunity", "JD Sharing", "Interested Candidate", "Interview Reminder", "Interview Follow-up", "Offer Follow-up", "Joining Reminder", "Custom"];
const WHATSAPP_CATEGORIES = ["No Answer", "Job Opportunity", "JD Sharing", "Call Back", "Interview Reminder", "Follow-up", "Joining Reminder", "Custom"];

const todayDate = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";
const toDateTimeLocal = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Cancelled: "bg-slate-50 text-slate-600 border-slate-200",
    Overdue: "bg-red-50 text-red-700 border-red-100",
    Open: "bg-green-50 text-green-700 border-green-100",
    Draft: "bg-blue-50 text-blue-700 border-blue-100",
    Ready: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Active: "bg-indigo-50 text-indigo-700 border-indigo-100",
    Empty: "bg-slate-50 text-slate-600 border-slate-200",
    Stopped: "bg-red-50 text-red-700 border-red-100",
    generated: "bg-blue-50 text-blue-700 border-blue-100",
    reviewed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    scheduled: "bg-indigo-50 text-indigo-700 border-indigo-100",
    sent: "bg-green-50 text-green-700 border-green-100",
    failed: "bg-red-50 text-red-700 border-red-100",
    stopped: "bg-red-50 text-red-700 border-red-100",
  };
  return `inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || "bg-blue-50 text-blue-700 border-blue-100"}`;
}



function ModalShell({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4">
      <div className="followups-modal max-h-[94dvh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-6">
          <h3 className="min-w-0 break-words font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="max-h-[calc(94dvh-80px)] overflow-auto overscroll-contain p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function FollowUps() {
  const { user } = useAuth();
  const isAdmin = user?.designation === "Admin";
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const showDuplicateDetails = ["Admin", "Manager"].includes(user?.designation || "");
  const [requirements, setRequirements] = useState<any[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<any | null>(null);
  const [requirementDetails, setRequirementDetails] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState("");
  const [search, setSearch] = useState("");
  const requirementRequestId = useRef(0);
  const [status, setStatus] = useState("all");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState<any>({});
  const [modal, setModal] = useState<"" | "candidate" | "call" | "followup" | "email" | "whatsapp">("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [candidateForm, setCandidateForm] = useState<any>({
    candidateName: "",
    email: "",
    phone: "",
    resume: null,
  });
  const [callForm, setCallForm] = useState<any>({
    callDate: todayDate(),
    callTime: nowTime(),
    status: "Connected",
    outcome: "Interested",
    notes: "",
    scheduleFollowUp: false,
    nextFollowUpDate: "",
    nextFollowUpTime: "10:00",
    followUpType: "Call",
    followUpRemarks: "",
  });
  const [followUpForm, setFollowUpForm] = useState<any>({
    type: "Call",
    dueDate: todayDate(),
    dueTime: "10:00",
    notes: "",
  });
  const [composer, setComposer] = useState<any>({
    category: "No Answer",
    recipient: "",
    subject: "",
    body: "",
    htmlBody: "",
  });
  const [draftStudio, setDraftStudio] = useState<any>({
    id: "",
    status: "Empty",
    sent: 0,
    drafts: [],
  });
  const [draftSaving, setDraftSaving] = useState("");

  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [duplicateModalCandidate, setDuplicateModalCandidate] = useState<any | null>(null);
  const [candidateFilter, setCandidateFilter] = useState<"all" | "duplicates" | "mine">("all");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState("all");
  const [candidateDateFrom, setCandidateDateFrom] = useState("");
  const [candidateDateTo, setCandidateDateTo] = useState("");

  const [lineupCandidate, setLineupCandidate] = useState<any>(null);
  const [lineupFields, setLineupFields] = useState<any[]>([]);
  const [lineupValues, setLineupValues] = useState<Record<string, any>>({});
  const [lineupErrors, setLineupErrors] = useState<string[]>([]);

  const selectedCandidateId = selectedCandidate?._id;

  useEffect(() => {
    if (modal !== "candidate" || !selectedRequirement) {
      setDuplicateCheckLoading(false);
      setDuplicateWarning(null);
      return;
    }
    const email = candidateForm.email?.trim();
    const phone = candidateForm.phone?.trim();
    if (!email && !phone) {
      setDuplicateCheckLoading(false);
      setDuplicateWarning(null);
      return;
    }

    const controller = new AbortController();
    setDuplicateWarning(null);
    const timer = setTimeout(async () => {
      try {
        setDuplicateCheckLoading(true);
        const { data } = await axios.get(
          `${API_URL}/requirements/${selectedRequirement._id}/candidates/check-duplicate`,
          { params: { email, phone, ...(editingCandidate ? { candidateId: editingCandidate._id } : {}) }, signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        if (data.hasDuplicate || data.canAdd === false) {
          setDuplicateWarning(data);
        } else {
          setDuplicateWarning(null);
        }
      } catch {
        // ignore check error
      } finally {
        if (!controller.signal.aborted) setDuplicateCheckLoading(false);
      }
    }, 350);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [candidateForm.email, candidateForm.phone, modal, selectedRequirement, editingCandidate]);

  const loadRequirements = async (signal?: AbortSignal) => {
    const requestId = ++requirementRequestId.current;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/requirements`, { params: { search: search.trim(), status, location: location.trim(), limit: 50 }, signal });
      if (!signal?.aborted && requestId === requirementRequestId.current) setRequirements(data.requirements || []);
    } catch (error: any) {
      if (!axios.isCancel(error) && !signal?.aborted && requestId === requirementRequestId.current) toast.error(error.response?.data?.message || "Failed to load follow-up requirements");
    } finally {
      if (!signal?.aborted && requestId === requirementRequestId.current) setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/summary`);
      setSummary(data.summary || {});
    } catch {
      setSummary({});
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Invalidate earlier results as soon as the filters change.
    requirementRequestId.current += 1;
    setLoading(true);
    const timer = setTimeout(() => loadRequirements(controller.signal), 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, status, location]);

  const openRequirement = async (requirement: any, preserveContext = false) => {
    if (!preserveContext) {
      setSelectedRequirement(requirement);
      setSelectedCandidateIds([]);
      setCandidateStatusFilter("all");
      setCandidateDateFrom("");
      setCandidateDateTo("");
      setActiveTab("Overview");
      setSelectedCandidate(null);
    }
    setLoading(true);
    try {
      const [detailsRes, candidatesRes, followUpsRes] = await Promise.all([
        axios.get(`${API_URL}/requirements/${requirement._id}`),
        axios.get(`${API_URL}/requirements/${requirement._id}/candidates`),
        axios.get(`${API_URL}/follow-ups`, { params: { requirementId: requirement._id } }),
      ]);
      setRequirementDetails(detailsRes.data.requirement);
      const refreshedCandidates = candidatesRes.data.candidates || [];
      setCandidates(refreshedCandidates);
      if (preserveContext) {
        setSelectedCandidate((current: any) => current ? refreshedCandidates.find((item: any) => item._id === current._id) || current : current);
        setDuplicateModalCandidate((current: any) => current ? refreshedCandidates.find((item: any) => item._id === current._id) || current : current);
      }
      setFollowUps(followUpsRes.data.followUps || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to open requirement");
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrent = async () => {
    if (selectedRequirement) await openRequirement(selectedRequirement, true);
    else await loadRequirements();
    await loadSummary();
  };

  const openCandidateContext = async (candidate: any, nextModal: typeof modal = "") => {
    setSelectedCandidate(candidate);
    setComposer((prev: any) => ({ ...prev, recipient: candidate.email || candidate.phone || "" }));
    try {
      const [callsRes, activityRes] = await Promise.all([
        axios.get(`${API_URL}/candidates/${candidate._id}/calls`),
        axios.get(`${API_URL}/candidates/${candidate._id}/activity`),
      ]);
      setCalls(callsRes.data.calls || []);
      setActivity(activityRes.data.activities || []);
    } catch {
      setCalls([]);
      setActivity([]);
    }
    if (nextModal) setModal(nextModal);
  };

  const visibleFollowUps = useMemo(() => {
    if (!selectedRequirement) return followUps;
    return followUps.filter((item) => item.requirementId?._id === selectedRequirement._id || item.requirementId === selectedRequirement._id);
  }, [followUps, selectedRequirement]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      if (candidateStatusFilter !== "all" && (candidate.status || "Sourced") !== candidateStatusFilter) return false;
      if (candidateFilter === "duplicates" && !candidate.isDuplicate) return false;
      if (candidateFilter === "mine" && !candidate.isOwner) return false;
      if (candidateDateFrom || candidateDateTo) {
        const addedAt = new Date(candidate.createdAt);
        if (Number.isNaN(addedAt.getTime())) return false;
        const addedDate = `${addedAt.getFullYear()}-${String(addedAt.getMonth() + 1).padStart(2, "0")}-${String(addedAt.getDate()).padStart(2, "0")}`;
        if (candidateDateFrom && addedDate < candidateDateFrom) return false;
        if (candidateDateTo && addedDate > candidateDateTo) return false;
      }
      if (candidateSearch.trim()) {
        const query = candidateSearch.toLowerCase();
        const matchName = String(candidate.name || "").toLowerCase().includes(query);
        const matchEmail = String(candidate.email || "").toLowerCase().includes(query);
        const matchPhone = String(candidate.phone || "").toLowerCase().includes(query);
        const matchRecruiter = String(candidate.addedBy?.name || "").toLowerCase().includes(query);
        const matchCompany = String(candidate.currentCompany || "").toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchPhone && !matchRecruiter && !matchCompany) {
          return false;
        }
      }
      return true;
    });
  }, [candidates, candidateFilter, candidateSearch, candidateDateFrom, candidateDateTo, candidateStatusFilter]);

  const resetCandidateForm = () => {
    setEditingCandidate(null);
    setCandidateForm({
      candidateName: "",
      email: "",
      phone: "",
      resume: null,
    });
    setDuplicateWarning(null);
  };

  const addCandidate = async () => {
    if (!selectedRequirement) return;
    setSaving("candidate");
    try {
      const formData = new FormData();
      Object.entries(candidateForm).forEach(([key, value]: any) => {
        if (key === "resume" && value) formData.append("resume", value);
        else if (key !== "resume") formData.append(key, value || "");
      });
      const { data } = editingCandidate
        ? await axios.patch(`${API_URL}/candidates/${editingCandidate._id}`, formData)
        : await axios.post(`${API_URL}/requirements/${selectedRequirement._id}/candidates`, formData);
      if (editingCandidate) {
        toast.success("Candidate updated successfully");
      } else if (data.isDuplicate) {
        toast.info(showDuplicateDetails ? data.message || "Candidate profile added" : "Candidate added — Duplicate");
      } else {
        toast.success(data.message || "Candidate added successfully");
      }
      setModal("");
      resetCandidateForm();
      await refreshCurrent();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (editingCandidate ? "Failed to update candidate" : "Failed to add candidate"));
    } finally {
      setSaving("");
    }
  };

  const logCall = async () => {
    if (!selectedCandidateId) return;
    setSaving("call");
    try {
      await axios.post(`${API_URL}/candidates/${selectedCandidateId}/calls`, callForm);
      toast.success("Call logged");
      setModal("");
      await refreshCurrent();
      await openCandidateContext(selectedCandidate);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to log call");
    } finally {
      setSaving("");
    }
  };

  const createFollowUp = async () => {
    if (!selectedCandidateId) return;
    setSaving("followup");
    try {
      await axios.post(`${API_URL}/candidates/${selectedCandidateId}/follow-ups`, followUpForm);
      toast.success("Follow-up created");
      setModal("");
      await refreshCurrent();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create follow-up");
    } finally {
      setSaving("");
    }
  };

  const updateFollowUp = async (id: string, payload: any) => {
    setSaving(id);
    try {
      await axios.patch(`${API_URL}/${id}`, payload);
      toast.success("Follow-up updated");
      await refreshCurrent();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update follow-up");
    } finally {
      setSaving("");
    }
  };

  const generateTemplates = async (channel: "email" | "whatsapp") => {
    if (!selectedCandidateId) return;
    setSaving(`${channel}-generate`);
    try {
      const { data } = await axios.post(`${API_URL}/candidates/${selectedCandidateId}/${channel}/generate`, { category: composer.category });
      setTemplates(data.templates || []);
      setSelectedTemplate(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to generate ${channel} templates`);
    } finally {
      setSaving("");
    }
  };

  const useTemplate = (template: any) => {
    setSelectedTemplate(template);
    setComposer((prev: any) => ({
      ...prev,
      subject: template.subject || prev.subject,
      body: template.body || "",
      htmlBody: template.htmlBody || "",
      recipient: prev.recipient || (modal === "email" ? selectedCandidate?.email : selectedCandidate?.phone) || "",
    }));
  };

  const sendMessage = async (channel: "email" | "whatsapp") => {
    if (!selectedCandidateId) return;
    setSaving(`${channel}-send`);
    try {
      const idempotencyKey = `${channel}-${selectedCandidateId}-${Date.now()}`;
      await axios.post(`${API_URL}/candidates/${selectedCandidateId}/${channel}/send`, {
        ...composer,
        idempotencyKey,
      });
      toast.success(channel === "email" ? "Email sent" : "WhatsApp message sent");
      setModal("");
      setTemplates([]);
      await refreshCurrent();
    } catch (error: any) {
      const data = error.response?.data || {};
      if (channel === "whatsapp" && data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        toast.info("WhatsApp is not connected for direct sending. Opened WhatsApp with the message pre-filled.");
      } else {
        toast.error(data.message || data.code || `Failed to send ${channel}`);
      }
    } finally {
      setSaving("");
    }
  };

  const loadDraftStudio = async (candidateId = selectedCandidateId) => {
    if (!candidateId) return;
    setDraftSaving("load");
    try {
      const { data } = await axios.get(`${API_URL}/candidates/${candidateId}/draft-studio?channel=${activeTab === "WhatsApp" ? "whatsapp" : "email"}`);
      setDraftStudio(data.sequence || { id: "", status: "Empty", sent: 0, drafts: [] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load draft studio");
      setDraftStudio({ id: "", status: "Empty", sent: 0, drafts: [] });
    } finally {
      setDraftSaving("");
    }
  };

  const openEmailStudio = async (candidate: any) => {
    await openCandidateContext(candidate);
    setActiveTab("Emails");
  };

  const startEmailSequence = async () => {
    if (!selectedCandidateId) return;
    setDraftSaving("start");
    try {
      await axios.post(`${API_URL}/candidates/${selectedCandidateId}/draft-studio/start?channel=${activeTab === "WhatsApp" ? "whatsapp" : "email"}`, { sequenceId: draftStudio.id });
      await loadDraftStudio();
      await refreshCurrent();
      toast.success("Sequence scheduled");
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.code || "Failed to send sequence");
      await loadDraftStudio();
    } finally {
      setDraftSaving("");
    }
  };

  const stopEmailSequence = async () => {
    if (!selectedCandidateId || !draftStudio.id) return;
    setDraftSaving("stop");
    try {
      await axios.post(`${API_URL}/candidates/${selectedCandidateId}/draft-studio/stop?channel=${activeTab === "WhatsApp" ? "whatsapp" : "email"}`, { sequenceId: draftStudio.id, reason: "manual_stop" });
      await loadDraftStudio();
      toast.success("Sequence stopped");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to stop sequence");
    } finally {
      setDraftSaving("");
    }
  };

  const clearEmailSequence = async () => {
    if (!selectedCandidateId || !draftStudio.id) return;
    setDraftSaving("clear");
    try {
      await axios.delete(`${API_URL}/candidates/${selectedCandidateId}/draft-studio?channel=${activeTab === "WhatsApp" ? "whatsapp" : "email"}`, {
        data: { sequenceId: draftStudio.id },
      });
      await loadDraftStudio();
      toast.success("Sequence cleared");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to clear email drafts");
    } finally {
      setDraftSaving("");
    }
  };

  const updateCandidateStatus = async (candidate: any, status: string) => {
    setSaving(`status-${candidate._id}`);
    try {
      await axios.patch(`${API_URL}/candidates/${candidate._id}/status`, { status });
      setCandidates(prev => prev.map(item => item._id === candidate._id ? { ...item, status } : item));
      setSelectedCandidate((current: any) => current?._id === candidate._id ? { ...current, status } : current);
      toast.success("Candidate status updated");
    } catch (error: any) { toast.error(error.response?.data?.message || "Failed to update status"); }
    finally { setSaving(""); }
  };

  const openLineup = async (candidate: any) => {
    setSaving(`lineup-${candidate._id}`);
    try {
      const { data } = await axios.get(`${API_URL}/candidates/${candidate._id}/lineup`);
      setLineupFields(data.fields || []);
      setLineupValues(data.values || {});
      setLineupErrors([]);
      setLineupCandidate(candidate);
    } catch (error: any) { toast.error(error.response?.data?.message || "Failed to load required fields"); }
    finally { setSaving(""); }
  };

  const convertToLineup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lineupCandidate) return;
    setSaving("convert-lineup");
    setLineupErrors([]);
    try {
      await axios.post(`${API_URL}/candidates/${lineupCandidate._id}/lineup`, { dynamicFields: lineupValues });
      const id = lineupCandidate._id;
      setLineupCandidate(null);
      setCandidates(prev => prev.filter(candidate => candidate._id !== id));
      setSelectedCandidate((current: any) => current?._id === id ? null : current);
      setSelectedCandidateIds(prev => prev.filter(candidateId => candidateId !== id));
      toast.success("Converted to lineup and moved to the normal candidates list");
      await refreshCurrent();
    } catch (error: any) {
      setLineupErrors(error.response?.data?.errors || [error.response?.data?.message || "Failed to convert candidate"]);
    } finally { setSaving(""); }
  };

  const deleteCandidates = async (ids: string[]) => {
    if (!isAdmin || !selectedRequirement || !ids.length) return;
    if (!window.confirm(`Delete ${ids.length === 1 ? "this candidate" : `${ids.length} candidates`} and their calls, follow-ups and communication records? This cannot be undone.`)) return;
    setSaving("delete-candidates");
    try {
      await axios.delete(`${API_URL}/requirements/${selectedRequirement._id}/candidates`, { data: { candidateIds: ids } });
      setSelectedCandidateIds(prev => prev.filter(id => !ids.includes(id)));
      setSelectedCandidate((current: any) => current && ids.includes(current._id) ? null : current);
      setDuplicateModalCandidate(null);
      toast.success("Candidates deleted");
      await refreshCurrent();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete candidates");
    } finally { setSaving(""); }
  };

  const RequirementList = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Follow-ups</h1>
          <p className="text-sm text-slate-500">Manage candidate calls, email, WhatsApp and scheduled follow-ups.</p>
        </div>
        <button onClick={refreshCurrent} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Today's Follow-ups", summary.todays],
          ["Overdue", summary.overdue],
          ["Pending Calls", summary.pendingCalls],
          ["Pending Emails", summary.pendingEmails],
          ["Pending WhatsApp", summary.pendingWhatsApp],
          ["Completed Today", summary.completedToday],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{Number(value || 0)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requirement title..." aria-label="Search requirement title" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500">
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Inactive">Inactive</option>
          </select>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500">Loading requirements...</div>
        ) : requirements.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500">No accessible requirements found.</div>
        ) : requirements.map((requirement) => (
          <div key={requirement._id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">{requirement.title}</h2>
                  <span className={statusBadge(requirement.status)}>{requirement.status}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-600">{requirement.company}</p>
                <p className="mt-2 text-sm text-slate-500">{[requirement.location, requirement.experience, requirement.salary, requirement.employmentType].filter(Boolean).join(" | ")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(requirement.keySkills || []).slice(0, 8).map((skill: string) => (
                    <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 lg:min-w-[330px]">
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-lg font-black text-slate-900">{requirement.noOfPositions}</p>
                  <p className="text-[11px] font-bold uppercase text-slate-400">Openings</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-lg font-black text-slate-900">{requirement.candidateCount}</p>
                  <p className="text-[11px] font-bold uppercase text-slate-400">Candidates</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <p className="text-lg font-black text-amber-700">{requirement.pendingFollowUpsCount}</p>
                  <p className="text-[11px] font-bold uppercase text-amber-600">Pending</p>
                </div>
                <button onClick={() => openRequirement(requirement)} className="col-span-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const Overview = () => {
    const detail = requirementDetails || {};
    const summary = detail.summary || selectedRequirement || {};
    const facts = [
      ["Company", summary.company], ["Location", summary.location],
      ["Employment type", detail.employmentType || summary.employmentType],
      ["Open positions", detail.noOfPositions > 0 ? detail.noOfPositions : ""],
      ["Experience", detail.experience?.min || detail.experience?.max ? summary.experience : ""], ["Salary range", detail.salary?.min || detail.salary?.max ? summary.salary : ""],
      ["Department", detail.department], ["Industry", detail.industry],
      ["Functional area", detail.functionalArea],
      ["Education", (detail.education || []).join(", ")],
    ];
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div><h2 className="text-xl font-bold text-slate-900">Requirement details</h2><p className="mt-1 text-sm text-slate-500">{summary.title || selectedRequirement?.title}</p></div>
          <span className={statusBadge(summary.status)}>{summary.status || "Open"}</span>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "" && !["N/A", "Not specified"].includes(String(value))).map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-900">{String(value)}</dd></div>)}
        </dl>
        {(detail.keySkills || summary.keySkills || []).length > 0 && <section><h3 className="font-bold text-slate-900">Key skills</h3><div className="mt-3 flex flex-wrap gap-2">{(detail.keySkills || summary.keySkills || []).map((skill: string) => <span key={skill} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{skill}</span>)}{!(detail.keySkills || summary.keySkills || []).length && <p className="text-sm text-slate-500">Not specified</p>}</div></section>}
        {[["Job description", detail.description], ["Requirements", detail.requirements]].filter(([, text]) => text?.trim()).map(([label, text]) => <section key={label}><h3 className="font-bold text-slate-900">{label}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{text || "Not specified"}</p></section>)}
        {detail.stages?.length > 0 && <section><h3 className="font-bold text-slate-900">Hiring stages</h3><ol className="mt-3 flex flex-wrap gap-2">{detail.stages.map((stage: any, index: number) => <li key={index} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">{index + 1}. {stage.name || "Interview"}</li>)}</ol></section>}
        {detail.screeningQuestions?.length > 0 && <section><h3 className="font-bold text-slate-900">Screening questions</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">{detail.screeningQuestions.map((question: string, index: number) => <li key={index}>{question}</li>)}</ul></section>}
      </div>
    );
  };

  const CandidatesTable = () => (
    <div className="space-y-4">
      {isAdmin && activeTab === "Candidates" && <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" aria-label="Select all visible candidates" checked={filteredCandidates.length > 0 && filteredCandidates.every(candidate => selectedCandidateIds.includes(candidate._id))} onChange={event => setSelectedCandidateIds(prev => event.target.checked ? Array.from(new Set([...prev, ...filteredCandidates.map(candidate => candidate._id)])) : prev.filter(id => !filteredCandidates.some(candidate => candidate._id === id)))} />Select visible candidates ({selectedCandidateIds.length} selected)</label><button disabled={!selectedCandidateIds.length || saving === "delete-candidates"} onClick={() => deleteCandidates(selectedCandidateIds)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Delete selected</button></div>}
      {/* Filters and search toolbar */}
      <div className="followups-candidate-filters flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCandidateFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              candidateFilter === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Candidates ({candidates.length})
          </button>
          {showDuplicateDetails && <button
            onClick={() => setCandidateFilter("duplicates")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              candidateFilter === "duplicates"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            <AlertTriangle size={13} />
            Duplicates ({candidates.filter((c) => c.isDuplicate).length})
          </button>}
          <button
            onClick={() => setCandidateFilter("mine")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              candidateFilter === "mine"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            }`}
          >
            My Added ({candidates.filter((c) => c.isOwner).length})
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={candidateSearch}
            onChange={(e) => setCandidateSearch(e.target.value)}
            placeholder="Search candidate, phone, or added by..."
            className="w-full xl:w-72 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="followups-date-toolbar flex flex-wrap items-end justify-between gap-3">
        <div className="followups-date-fields flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-slate-500">Status<select aria-label="Filter candidate status" value={candidateStatusFilter} onChange={event => setCandidateStatusFilter(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"><option value="all">All statuses</option><option value="Sourced">Sourced</option>{CANDIDATE_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-500">Added from<input type="date" value={candidateDateFrom} max={candidateDateTo || undefined} onChange={event => setCandidateDateFrom(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700" /></label>
          <label className="text-xs font-semibold text-slate-500">Added to<input type="date" value={candidateDateTo} min={candidateDateFrom || undefined} onChange={event => setCandidateDateTo(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700" /></label>
          {(candidateDateFrom || candidateDateTo) && <button type="button" onClick={() => { setCandidateDateFrom(""); setCandidateDateTo(""); }} className="py-2 text-xs text-slate-500 hover:underline">Clear dates</button>}
        </div>
        {activeTab === "Candidates" && <button type="button" onClick={() => { resetCandidateForm(); setModal("candidate"); }} className="followups-add-candidate bg-transparent p-0 text-sm font-semibold text-blue-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">+ Add candidate</button>}
      </div>
      <div className="overflow-x-auto">
        <table role="table" className="followups-candidate-table w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Added By</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Call</th>
              <th className="px-4 py-3">Follow-up status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCandidates.map((candidate) => (
              <tr
                key={candidate._id}
                className={`transition-colors ${
                  candidate.isDuplicate ? "bg-amber-50/25 hover:bg-amber-50/50" : "hover:bg-slate-50"
                }`}
              >
                <td data-label="Candidate" className="px-4 py-3">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    {isAdmin && activeTab === "Candidates" && <input type="checkbox" aria-label={`Select ${candidate.name}`} checked={selectedCandidateIds.includes(candidate._id)} onChange={event => setSelectedCandidateIds(prev => event.target.checked ? [...prev, candidate._id] : prev.filter(id => id !== candidate._id))} />}
                    <span>{candidate.name}</span>
                    {candidate.resumeUrl && (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-0.5 font-semibold"
                      >
                        Resume <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  {candidate.isDuplicate && showDuplicateDetails && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {candidate.isOriginal ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                          <AlertTriangle size={10} /> Original (1st Added)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-purple-100/80 px-2 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200">
                          <Copy size={10} /> Duplicate Profile
                        </span>
                      )}
                      <button
                        onClick={() => setDuplicateModalCandidate(candidate)}
                        className="inline-flex items-center gap-1 rounded bg-white hover:bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 shadow-2xs"
                        title="Compare all matching duplicate profiles"
                      >
                        <Users size={10} /> {candidate.duplicateCount} Profiles
                      </button>
                    </div>
                  )}
                </td>
                <td data-label="Contact" className="px-4 py-3 text-slate-600">
                  <div className="font-medium text-slate-800">{candidate.email || "-"}</div>
                  <div className="text-xs text-slate-500">{candidate.phone || "-"}</div>
                </td>
                <td data-label="Added by" className="px-4 py-3">
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <span>{candidate.addedBy?.name || "Unknown"}</span>
                    {candidate.isOwner && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {candidate.addedBy?.designation || "Recruiter"} • {formatDate(candidate.createdAt)}
                  </div>
                  {showDuplicateDetails && candidate.isDuplicate && !candidate.isOriginal && candidate.originalAddedBy && (
                    <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                      Orig: {candidate.originalAddedBy.name} ({formatDate(candidate.originalAddedBy.createdAt)})
                    </div>
                  )}
                </td>
                <td data-label="Profile status" className="px-4 py-3">
                  <select aria-label={`Status for ${candidate.name}`} value={candidate.status || "Sourced"} disabled={Boolean(saving)} onChange={event => updateCandidateStatus(candidate, event.target.value)} className="max-w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700"><option value="Sourced" disabled>Sourced</option>{CANDIDATE_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select>
                </td>
                <td data-label="Last call" className="px-4 py-3 text-xs">
                  {candidate.lastCall ? (
                    <div>
                      <span className="font-bold text-slate-700">{candidate.lastCall.status}</span>
                      <span className="text-slate-400 block">{formatDate(candidate.lastCall.callDate)}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td data-label="Follow-up status" className="px-4 py-3 text-xs">
                  {candidate.nextFollowUp || candidate.latestFollowUp ? (() => {
                    const followUp = candidate.nextFollowUp || candidate.latestFollowUp;
                    return <span className={statusBadge(followUp.status)}>{followUp.status}</span>;
                  })() : <span className="text-slate-400">No follow-ups</span>}
                </td>
                <td data-label="Actions" className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button type="button" title="Edit" aria-label={`Edit ${candidate.name}`} disabled={Boolean(saving)} onClick={() => { setEditingCandidate(candidate); setCandidateForm({ candidateName: candidate.name || "", email: candidate.email || "", phone: candidate.phone || "", resume: null }); setDuplicateWarning(null); setModal("candidate"); }} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"><Pencil size={16} /></button>
                    <button disabled={Boolean(saving)} onClick={() => openLineup(candidate)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50">{saving === `lineup-${candidate._id}` ? "Loading..." : "Convert to lineup"}</button>
                    {isAdmin && activeTab === "Candidates" && <button title="Delete candidate" aria-label={`Delete ${candidate.name}`} disabled={saving === "delete-candidates"} onClick={() => deleteCandidates([candidate._id])} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} /></button>}
                    {showDuplicateDetails && candidate.isDuplicate && (
                      <button
                        onClick={() => setDuplicateModalCandidate(candidate)}
                        className="rounded-lg p-2 text-amber-700 hover:bg-amber-100"
                        title="View duplicate profiles comparison"
                      >
                        <Copy size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => openCandidateContext(candidate, "call")}
                      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                      title="Call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={() => openEmailStudio(candidate)}
                      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                      title="Email"
                    >
                      <Mail size={16} />
                    </button>
                    <button
                      onClick={() => {
                        openCandidateContext(candidate, "whatsapp");
                        setComposer((p: any) => ({ ...p, recipient: candidate.phone || "" }));
                      }}
                      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                      title="WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      onClick={() => openCandidateContext(candidate, "followup")}
                      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                      title="Follow-up"
                    >
                      <CalendarClock size={16} />
                    </button>
                    <button
                      onClick={() => {
                        openCandidateContext(candidate);
                        setActiveTab("Activity");
                      }}
                      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                      title="View Activity"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCandidates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {candidateFilter === "duplicates"
                    ? "No duplicate profiles found for this requirement."
                    : candidateSearch || candidateStatusFilter !== "all" || candidateDateFrom || candidateDateTo
                    ? "No candidates match the selected filters."
                    : "No candidates added yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const FollowUpsTable = () => (
    <div className="overflow-x-auto">
      <table role="table" className="followups-action-table w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Candidate</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Remarks</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visibleFollowUps.map((item) => (
            <tr key={item._id} className="hover:bg-slate-50">
              <td data-label="Candidate" className="px-4 py-3 font-bold">{item.candidateId?.name || item.candidateId?.dynamicFields?.candidateName || item.candidateId?.dynamicFields?.CandidateName || "Candidate"}</td>
              <td data-label="Type" className="px-4 py-3">{item.type}</td>
              <td data-label="Due" className="px-4 py-3">{formatDate(item.dueDate)} {item.dueTime}</td>
              <td data-label="Status" className="px-4 py-3"><span className={statusBadge(item.status)}>{item.status}</span></td>
              <td data-label="Remarks" className="px-4 py-3 max-w-xs whitespace-pre-wrap break-words">{item.notes || "-"}</td>
              <td data-label="Actions" className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" title="Call" aria-label={`Call ${item.candidateId?.name || "candidate"}`} disabled={!item.candidateId} onClick={() => {
                    const id = typeof item.candidateId === "string" ? item.candidateId : item.candidateId?._id;
                    const candidate = candidates.find(profile => profile._id === id) || (typeof item.candidateId === "object" ? { ...item.candidateId, phone: item.candidateId.phoneNumber || "" } : null);
                    if (candidate) openCandidateContext(candidate, "call");
                    else toast.error("Candidate profile is no longer available");
                  }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"><Phone size={16} /><span className="hidden md:inline">Call</span></button>
                  <button disabled={saving === item._id || ["Completed", "Cancelled"].includes(item.status)} onClick={() => updateFollowUp(item._id, { status: "Completed" })} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Complete"><CheckCircle size={16} /></button>
                  <button disabled={saving === item._id || ["Completed", "Cancelled"].includes(item.status)} onClick={() => updateFollowUp(item._id, { status: "Cancelled" })} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Cancel"><X size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
          {visibleFollowUps.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No follow-ups found.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const ActivityList = () => (
    <div className="space-y-4">
      {!selectedCandidate && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Select a candidate and click View to see activity.</p>}
      {selectedCandidate && activity.map((item) => (
        <div key={item._id} className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-slate-900">{item.description || item.module || item.action}</p>
              <p className="mt-1 text-xs text-slate-500">{item.userId?.name || "Unknown"} - {item.userId?.designation || ""}</p>
              {item.metadata && <p className="mt-2 text-xs text-slate-500">{item.metadata.notes || item.metadata.comment || item.metadata.subject || ""}</p>}
            </div>
            <span className="text-xs font-bold text-slate-400">{formatDateTime(item.createdAt)}</span>
          </div>
        </div>
      ))}
      {selectedCandidate && activity.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No activity yet.</p>}
    </div>
  );

  useEffect(() => {
    if (selectedCandidateId && ["Emails", "WhatsApp"].includes(activeTab)) loadDraftStudio(selectedCandidateId);
  }, [activeTab, selectedCandidateId]);

  const EmailStudio = () => {
    const isWhatsApp = activeTab === "WhatsApp";
    const channelActivity = activity.filter(item => String(item.module || "").toLowerCase().includes(isWhatsApp ? "whatsapp" : "email") || String(item.actionType || "").toLowerCase().includes(isWhatsApp ? "whatsapp" : "email"));
    const preview = draftStudio.drafts.length ? draftStudio.drafts : (draftStudio.templates || []);
    const canStart = (draftStudio.templates || []).length > 0 && !["Active", "Completed"].includes(draftStudio.status);
    const canClear = Boolean(draftStudio.id);
    const showStopStep = draftStudio.status === "Active";
    return (
      <div className="space-y-5">
        {!isWhatsApp && <EmailConnection />}
        <div className="followups-studio-heading flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold text-slate-900">{isWhatsApp ? "WhatsApp studio" : "Email draft studio"}</h2><label className="text-sm font-semibold text-slate-600">Candidate <select value={selectedCandidateId || ""} onChange={event => { const candidate = candidates.find(item => item._id === event.target.value); if (candidate) openCandidateContext(candidate); else setSelectedCandidate(null); }} className="ml-2 rounded-lg border border-slate-200 px-3 py-2"><option value="">Select candidate</option>{candidates.map(candidate => <option key={candidate._id} value={candidate._id}>{candidate.name} — {(isWhatsApp ? candidate.phone : candidate.email) || "No contact"}</option>)}</select></label></div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {!selectedCandidate ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <h3 className="font-black text-slate-900">{isWhatsApp ? "WhatsApp templates" : "Email drafts"}</h3>
                  <p className="mt-1 text-sm text-slate-600">Select a candidate to start a sequence using the templates saved with this requirement.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">{selectedCandidate.name}</h3>
                        <span className={statusBadge(draftStudio.status)}>{draftStudio.status}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{draftStudio.sent || 0} sent</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{(isWhatsApp ? selectedCandidate.phone : selectedCandidate.email) || "No contact"} • {selectedRequirement?.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={clearEmailSequence}
                        disabled={Boolean(draftSaving) || !canClear}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        <X size={16} /> Clear
                      </button>
                      {!showStopStep && (
                        <button
                          onClick={startEmailSequence}
                          disabled={Boolean(draftSaving) || !canStart}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          <Play size={16} /> Start sequence
                        </button>
                      )}
                      {showStopStep && (
                        <button
                          onClick={stopEmailSequence}
                          disabled={Boolean(draftSaving) || !draftStudio.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          <Square size={15} /> Stop
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {draftSaving === "load" ? (
                  <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">Loading draft studio...</div>
                ) : preview.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="font-black text-slate-900">No sequence yet</p>
                    <p className="mt-1 text-sm text-slate-500">Add templates when creating or editing this requirement to start a sequence.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {preview.map((draft: any, index: number) => (
                      <div key={draft._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-black text-white">{isWhatsApp ? "WhatsApp" : "Email"} {index + 1}</span>
                            <span className={statusBadge(draft.status)}>{draft.status}</span>
                            {draft.scheduledAt && draft.status !== "sent" && <span className="text-xs font-bold text-blue-600">Scheduled {formatDateTime(draft.scheduledAt)}</span>}
                            {draft.sentAt && <span className="text-xs font-bold text-slate-400">{formatDateTime(draft.sentAt)}</span>}
                          </div>

                        </div>
                        {!isWhatsApp && <input
                          value={draft.subject || ""}
                          readOnly
                          disabled={draft.status === "sent"}
                          className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50"
                        />}
                        <label className="mb-3 block">
                          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Send date and time</span>
                          <input
                            type="datetime-local"
                            value={toDateTimeLocal(draft.scheduledAt)}
                            readOnly
                            disabled={draft.status === "sent"}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 disabled:bg-slate-50"
                          />
                        </label>
                        <textarea
                          value={draft.body || ""}
                          readOnly
                          disabled={draft.status === "sent"}
                          rows={8}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-700 outline-none focus:border-blue-500 disabled:bg-slate-50"
                        />
                        {draft.errorMessage && <p className="mt-2 text-xs font-semibold text-red-600">{draft.errorMessage}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-black text-slate-900">Sequence controls</h3>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-slate-500">Status</span><b>{draftStudio.status}</b></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Drafts</span><b>{preview.length}</b></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Submitted</span><b>{draftStudio.sent || 0}</b></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Recipient</span><b className="text-right">{(isWhatsApp ? selectedCandidate?.phone : selectedCandidate?.email) || "-"}</b></div>
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <b>Stop behavior</b>
              <p className="mt-1">Stop marks only unsent drafts as stopped. Messages already submitted through the provider cannot be recalled.</p>
            </div>
            {selectedCandidate && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-black text-slate-900">Recent activity</h3>
                <div className="mt-3 space-y-3">
                  {channelActivity.slice(0, 5).map((item) => (
                    <div key={item._id} className="border-b border-slate-100 pb-2 last:border-0">
                      <p className="text-xs font-bold text-slate-800">{item.description || item.module || item.action}</p>
                      <p className="text-[11px] text-slate-400">{formatDateTime(item.createdAt)}</p>
                    </div>
                  ))}
                  {channelActivity.length === 0 && <p className="text-sm text-slate-500">No {isWhatsApp ? "WhatsApp" : "email"} activity yet.</p>}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  };

  const DetailView = () => (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button aria-label="Back to requirements" onClick={() => { setSelectedRequirement(null); setRequirementDetails(null); }} className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{selectedRequirement?.title}</h1>
            <p className="text-sm text-slate-500">{selectedRequirement?.company} | {selectedRequirement?.location}</p>
          </div>
        </div>

      </div>

      <div className="followups-tab-bar rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:gap-1.5">
          {["Overview", "Candidates", "Call Tracking", "Emails", "WhatsApp", "Follow-ups", "Activity"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? "page" : undefined} className={`min-h-11 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors sm:text-center ${activeTab === tab ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-6">
        {activeTab === "Overview" && Overview()}
        {activeTab === "Candidates" && CandidatesTable()}
        {activeTab === "Call Tracking" && (
          <div className="space-y-4">
            {CandidatesTable()}
            {selectedCandidate && calls.map((call) => (
              <div key={call._id} className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
                <b>{call.status}</b> - {call.outcome} on {formatDate(call.callDate)} {call.callTime}
                <p className="text-slate-500">{call.notes}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === "Follow-ups" && FollowUpsTable()}
        {activeTab === "Emails" && EmailStudio()}
        {activeTab === "WhatsApp" && EmailStudio()}
        {activeTab === "Activity" && ActivityList()}
      </div>
    </div>
  );

  return (
    <div className="followups-page min-w-0">
      {selectedRequirement ? DetailView() : RequirementList()}

      {lineupCandidate && <ModalShell title={`Convert to lineup — ${lineupCandidate.name}`} onClose={() => { if (saving !== "convert-lineup") setLineupCandidate(null); }}>
        <form onSubmit={convertToLineup} className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">Complete the required fields marked * and review the profile. Converting moves this profile into the requirement's normal candidate list and removes it from the sourced list.</p>
          {lineupErrors.length > 0 && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{lineupErrors.map((error, index) => <p key={index}>{error}</p>)}</div>}
          <div className="grid gap-4 sm:grid-cols-2">{lineupFields.map(field => <label key={field.name} className={`block text-sm font-semibold text-slate-600 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
            {field.name.replace(/([a-z])([A-Z])/g, "$1 $2")}{field.required ? " *" : ""}
            {field.type === "select" ? <select required={field.required} value={lineupValues[field.name] || ""} onChange={event => setLineupValues(prev => ({ ...prev, [field.name]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="">Select {field.name}</option>{(field.options || []).map((option: string) => <option key={option}>{option}</option>)}</select>
              : field.type === "textarea" ? <textarea required={field.required} rows={3} value={lineupValues[field.name] || ""} onChange={event => setLineupValues(prev => ({ ...prev, [field.name]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              : <input type={["email", "tel", "number", "date"].includes(field.type) ? field.type : "text"} step={field.type === "number" ? "any" : undefined} required={field.required} placeholder={field.type === "tags" ? "Separate values with commas" : undefined} value={lineupValues[field.name] ?? ""} onChange={event => setLineupValues(prev => ({ ...prev, [field.name]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />}
          </label>)}</div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={saving === "convert-lineup"} onClick={() => setLineupCandidate(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={saving === "convert-lineup"} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving === "convert-lineup" ? "Converting..." : "Convert to lineup"}</button></div>
        </form>
      </ModalShell>}

      {modal === "candidate" && (
        <ModalShell
          title={editingCandidate ? "Edit Candidate" : "Add Candidate"}
          onClose={() => {
            setModal("");
            setTemplates([]);
            setDuplicateWarning(null);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["candidateName", "Candidate Name *"],
              ["email", "Email *"],
              ["phone", "Phone Number *"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-bold text-slate-600">{label}</span>
                <input
                  value={candidateForm[key] || ""}
                  onChange={(e) => setCandidateForm({ ...candidateForm, [key]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </label>
            ))}
            <label className="block md:col-span-2">
              <span className="text-xs font-bold text-slate-600">{editingCandidate ? "Replace CV/Resume (optional)" : "CV/Resume *"}</span>
              {editingCandidate && <p className="mt-1 text-xs text-slate-500">Leave empty to keep the current resume.</p>}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setCandidateForm({ ...candidateForm, resume: e.target.files?.[0] || null })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            {/* Duplicate checking status & warning */}
            {duplicateCheckLoading && (
              <div className="md:col-span-2 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <RefreshCw className="animate-spin text-blue-600" size={13} />
                <span>Checking if this candidate email or phone already exists in the system...</span>
              </div>
            )}

            {duplicateWarning?.canAdd === false && <p role="alert" className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{duplicateWarning.message}</p>}
            {showDuplicateDetails && duplicateWarning?.hasDuplicate && duplicateWarning?.duplicateSource !== "normal" && (
              <div className="md:col-span-2 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-black text-amber-900 text-sm">
                        Existing Candidate Profile Detected!
                      </p>
                      <p className="text-amber-800 mt-0.5">
                        This candidate profile already exists in the system. You can still add it to your follow-up list — both profiles will be preserved and linked.
                      </p>
                    </div>

                    <div className="space-y-1.5 rounded-lg bg-white/90 p-2.5 border border-amber-200/60 divide-y divide-slate-100">
                      {duplicateWarning.duplicates.map((dup: any) => (
                        <div key={dup._id} className="pt-1.5 first:pt-0">
                          <div className="flex items-center justify-between font-semibold text-slate-800">
                            <span>
                              Added by: <strong className="text-blue-700">{dup.addedBy?.name || "Unknown"}</strong> ({dup.addedBy?.designation || "Recruiter"})
                            </span>
                            <span className="text-slate-400 font-normal">{formatDate(dup.createdAt)}</span>
                          </div>
                          <div className="text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>Job: <strong>{dup.requirementTitle}</strong></span>
                            {dup.isSameRequirement && (
                              <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800">
                                This Requirement
                              </span>
                            )}
                            {dup.isSameRecruiter && dup.isSameRequirement && (
                              <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-800">
                                You already added this profile
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>


                  </div>
                </div>
              </div>
            )}

            <button
              disabled={saving === "candidate" || duplicateWarning?.canAdd === false}
              onClick={addCandidate}
              className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              <Upload size={16} />{" "}
              {saving === "candidate"
                ? "Saving..."
                : editingCandidate ? "Save changes"
                : duplicateWarning?.hasDuplicate
                ? "Add Candidate (Duplicate Profile)"
                : "Add Candidate"}
            </button>
          </div>
        </ModalShell>
      )}

      {showDuplicateDetails && duplicateModalCandidate && (
        <ModalShell
          title={`Duplicate Profiles Comparison - ${duplicateModalCandidate.name}`}
          onClose={() => setDuplicateModalCandidate(null)}
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900">
              <p className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
                <AlertTriangle size={16} /> Matching Profile Group ({[duplicateModalCandidate, ...(duplicateModalCandidate.duplicateProfiles || [])].length} Total Profiles)
              </p>
              <p className="mt-1 text-amber-700">
                These profiles share the same email (<strong>{duplicateModalCandidate.email || "-"}</strong>) or phone (<strong>{duplicateModalCandidate.phone || "-"}</strong>). Both original and duplicate creators are detailed below.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[duplicateModalCandidate, ...(duplicateModalCandidate.duplicateProfiles || [])]
                .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((profile: any, idx: number) => {
                  const isFirst = idx === 0;
                  const isCurrentCard = profile._id === duplicateModalCandidate._id;
                  return (
                    <div
                      key={profile._id}
                      className={`rounded-xl border p-4 shadow-xs transition-all ${
                        isCurrentCard
                          ? "border-blue-400 bg-blue-50/30 ring-2 ring-blue-500/20"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-base">{profile.name}</h4>
                            {isFirst ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                Original (1st Added)
                              </span>
                            ) : (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-200">
                                Duplicate #{idx}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Added: <strong>{formatDateTime(profile.createdAt)}</strong>
                          </p>
                        </div>
                        {isCurrentCard && (
                          <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div className="rounded-lg bg-slate-50 p-2.5">
                          <p className="font-bold text-slate-400 uppercase text-[10px]">Created By</p>
                          <p className="font-black text-slate-900 text-sm mt-0.5">
                            {profile.addedBy?.name || "Unknown"}
                            {profile.isOwner && <span className="ml-1.5 text-blue-600 font-bold">(You)</span>}
                          </p>
                          <p className="text-slate-500">{profile.addedBy?.email || "-"} • {profile.addedBy?.designation || "Recruiter"}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-slate-50 p-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Requirement</p>
                            <p className="font-semibold text-slate-800 truncate" title={profile.requirementTitle || selectedRequirement?.title}>
                              {profile.requirementTitle || selectedRequirement?.title || "-"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                            <p className="font-semibold text-slate-800">{profile.status || "Sourced"}</p>
                          </div>
                        </div>

                        {(profile.nextFollowUp || profile.latestFollowUp) && <div className="rounded-lg border border-slate-200 p-3"><p className="mb-2 font-bold text-slate-500">Follow-up status</p><span className={statusBadge((profile.nextFollowUp || profile.latestFollowUp).status)}>{(profile.nextFollowUp || profile.latestFollowUp).status}</span><p className="mt-2 font-semibold">{(profile.nextFollowUp || profile.latestFollowUp).type}</p><p className="text-slate-500">Due {formatDate((profile.nextFollowUp || profile.latestFollowUp).dueDate)} {(profile.nextFollowUp || profile.latestFollowUp).dueTime}</p>{(profile.nextFollowUp || profile.latestFollowUp).completedAt && <p className="mt-1 text-emerald-700">Completed {formatDateTime((profile.nextFollowUp || profile.latestFollowUp).completedAt)}</p>}</div>}
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span className="font-medium text-slate-400">Email:</span>
                            <span className="font-semibold text-slate-800">{profile.email || "-"}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span className="font-medium text-slate-400">Phone:</span>
                            <span className="font-semibold text-slate-800">{profile.phone || "-"}</span>
                          </div>
                          {profile.resumeUrl && (
                            <div className="flex justify-between items-center pt-1">
                              <span className="font-medium text-slate-400">CV/Resume:</span>
                              <a
                                href={profile.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                              >
                                View Resume <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          ID: {profile._id?.slice(-6)}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              openCandidateContext(profile, "call");
                              setDuplicateModalCandidate(null);
                            }}
                            className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700"
                          >
                            Log Call
                          </button>
                          <button
                            onClick={() => {
                              openCandidateContext(profile, "followup");
                              setDuplicateModalCandidate(null);
                            }}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 py-1 text-xs font-bold text-white"
                          >
                            Follow-up
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </ModalShell>
      )}

      {modal === "call" && selectedCandidate && (
        <ModalShell title={`Log Call - ${selectedCandidate.name}`} onClose={() => { setModal(""); setTemplates([]); }}>
          {selectedCandidate.phone ? <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-blue-50 p-3"><span className="text-sm font-semibold text-slate-700">{selectedCandidate.phone}</span><a href={`tel:${String(selectedCandidate.phone).replace(/[^+0-9]/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"><Phone size={16} />Call now</a></div> : <p className="mb-4 text-sm text-slate-500">No phone number available for this candidate.</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <input type="date" value={callForm.callDate} onChange={(e) => setCallForm({ ...callForm, callDate: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input type="time" value={callForm.callTime} onChange={(e) => setCallForm({ ...callForm, callTime: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <select value={callForm.status} onChange={(e) => setCallForm({ ...callForm, status: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{CALL_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={callForm.outcome} onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{CALL_OUTCOMES.map((item) => <option key={item}>{item}</option>)}</select>
            <textarea value={callForm.notes} onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })} placeholder="Notes" rows={3} className="md:col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <label className="md:col-span-2 flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={callForm.scheduleFollowUp} onChange={(e) => setCallForm({ ...callForm, scheduleFollowUp: e.target.checked })} /> Schedule Follow-up
            </label>
            {callForm.scheduleFollowUp && (
              <>
                <label className="md:col-span-2 block"><span className="text-sm font-semibold text-slate-700">Follow-up remarks (optional)</span><textarea value={callForm.followUpRemarks} onChange={(e) => setCallForm({ ...callForm, followUpRemarks: e.target.value })} rows={3} placeholder="Add context or instructions for this follow-up" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <select value={callForm.followUpType} onChange={(e) => setCallForm({ ...callForm, followUpType: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{FOLLOW_UP_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={callForm.nextFollowUpDate} onChange={(e) => setCallForm({ ...callForm, nextFollowUpDate: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input type="time" value={callForm.nextFollowUpTime} onChange={(e) => setCallForm({ ...callForm, nextFollowUpTime: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </>
            )}
            <button disabled={saving === "call"} onClick={logCall} className="md:col-span-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving === "call" ? "Saving..." : "Save Call"}</button>
          </div>
        </ModalShell>
      )}

      {modal === "followup" && selectedCandidate && (
        <ModalShell title={`Create Follow-up - ${selectedCandidate.name}`} onClose={() => { setModal(""); setTemplates([]); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <select value={followUpForm.type} onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{FOLLOW_UP_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={followUpForm.dueDate} onChange={(e) => setFollowUpForm({ ...followUpForm, dueDate: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <input type="time" value={followUpForm.dueTime} onChange={(e) => setFollowUpForm({ ...followUpForm, dueTime: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <label className="md:col-span-2 block"><span className="text-sm font-semibold text-slate-700">Remarks (optional)</span><textarea value={followUpForm.notes} onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })} rows={3} placeholder="Add context or instructions for this follow-up" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <button disabled={saving === "followup"} onClick={createFollowUp} className="md:col-span-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving === "followup" ? "Saving..." : "Create Follow-up"}</button>
          </div>
        </ModalShell>
      )}

      {(modal === "email" || modal === "whatsapp") && selectedCandidate && (
        <ModalShell title={`${modal === "email" ? "Email" : "WhatsApp"} - ${selectedCandidate.name}`} onClose={() => { setModal(""); setTemplates([]); }}>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <select value={composer.category} onChange={(e) => setComposer({ ...composer, category: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {(modal === "email" ? EMAIL_CATEGORIES : WHATSAPP_CATEGORIES).map((item) => <option key={item}>{item}</option>)}
              </select>
              <button onClick={() => generateTemplates(modal as any)} disabled={saving.includes("generate")} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Load job templates</button>
            </div>
            {templates.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {templates.map((template) => (
                  <div key={template.label} className={`rounded-lg border p-3 ${selectedTemplate?.label === template.label ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}>
                    <p className="font-black text-slate-900">{template.label}</p>
                    <p className="mt-2 line-clamp-4 text-xs text-slate-500">{template.body}</p>
                    <button onClick={() => useTemplate(template)} className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50">Use Template</button>
                  </div>
                ))}
              </div>
            )}
            <input value={composer.recipient} onChange={(e) => setComposer({ ...composer, recipient: e.target.value })} placeholder={modal === "email" ? "Recipient email" : "Recipient phone"} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            {modal === "email" && <input value={composer.subject} onChange={(e) => setComposer({ ...composer, subject: e.target.value })} placeholder="Subject" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />}
            <textarea value={composer.body} onChange={(e) => setComposer({ ...composer, body: e.target.value })} placeholder="Message body" rows={8} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <button disabled={saving.includes("send")} onClick={() => sendMessage(modal as any)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
              <Send size={16} /> {saving.includes("send") ? "Sending..." : "Send"}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
