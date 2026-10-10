import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle,
  Eye,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Upload,
  X,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${API_BASE_URL}/api/recruiter/follow-ups`;

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

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Cancelled: "bg-slate-50 text-slate-600 border-slate-200",
    Overdue: "bg-red-50 text-red-700 border-red-100",
    Open: "bg-green-50 text-green-700 border-green-100",
  };
  return `inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status] || "bg-blue-50 text-blue-700 border-blue-100"}`;
}

function valueOrDash(value: any) {
  if (Array.isArray(value)) return value.join(", ") || "-";
  if (value && typeof value === "object") return JSON.stringify(value);
  return value || "-";
}

function ModalShell({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="max-h-[calc(90vh-70px)] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function FollowUps() {
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
  const [status, setStatus] = useState("all");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState<any>({});
  const [modal, setModal] = useState<"" | "candidate" | "call" | "followup" | "email" | "whatsapp">("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

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
  });

  const selectedCandidateId = selectedCandidate?._id;

  const loadRequirements = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/requirements`, { params: { search, status, location, limit: 50 } });
      setRequirements(data.requirements || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load follow-up requirements");
    } finally {
      setLoading(false);
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
    loadRequirements();
    loadSummary();
  }, []);

  const openRequirement = async (requirement: any) => {
    setSelectedRequirement(requirement);
    setActiveTab("Overview");
    setSelectedCandidate(null);
    setLoading(true);
    try {
      const [detailsRes, candidatesRes, followUpsRes] = await Promise.all([
        axios.get(`${API_URL}/requirements/${requirement._id}`),
        axios.get(`${API_URL}/requirements/${requirement._id}/candidates`),
        axios.get(`${API_URL}/follow-ups`, { params: { requirementId: requirement._id } }),
      ]);
      setRequirementDetails(detailsRes.data.requirement);
      setCandidates(candidatesRes.data.candidates || []);
      setFollowUps(followUpsRes.data.followUps || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to open requirement");
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrent = async () => {
    if (selectedRequirement) await openRequirement(selectedRequirement);
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

  const resetCandidateForm = () => setCandidateForm({
    candidateName: "",
    email: "",
    phone: "",
    resume: null,
  });

  const addCandidate = async () => {
    if (!selectedRequirement) return;
    setSaving("candidate");
    try {
      const formData = new FormData();
      Object.entries(candidateForm).forEach(([key, value]: any) => {
        if (key === "resume" && value) formData.append("resume", value);
        else if (key !== "resume") formData.append(key, value || "");
      });
      await axios.post(`${API_URL}/requirements/${selectedRequirement._id}/candidates`, formData);
      toast.success("Candidate added");
      setModal("");
      resetCandidateForm();
      await refreshCurrent();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add candidate");
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
      toast.error(error.response?.data?.message || error.response?.data?.code || `Failed to send ${channel}`);
    } finally {
      setSaving("");
    }
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

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
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
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requirement" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500">
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="Inactive">Inactive</option>
          </select>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          <button onClick={loadRequirements} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Apply</button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500">Loading requirements...</div>
        ) : requirements.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500">No accessible requirements found.</div>
        ) : requirements.map((requirement) => (
          <div key={requirement._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
    const hidden = new Set(["_id", "__v", "summary", "assignedRecruiters", "assignedMentors", "leadRecruiter", "CreatedBy", "UpdatedBy", "candidateFields", "stages", "clientId"]);
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(detail).filter(([key]) => !hidden.has(key)).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{key.replace(/([A-Z])/g, " $1")}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-800">{valueOrDash(value)}</p>
          </div>
        ))}
      </div>
    );
  };

  const CandidatesTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Candidate</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Experience</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Last Call</th>
            <th className="px-4 py-3">Next Follow-up</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {candidates.map((candidate) => (
            <tr key={candidate._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-bold text-slate-900">
                {candidate.name}
                {candidate.resumeUrl && <a href={candidate.resumeUrl} target="_blank" className="ml-2 text-xs text-blue-600">Resume</a>}
              </td>
              <td className="px-4 py-3 text-slate-600">
                <div>{candidate.email || "-"}</div>
                <div className="text-xs text-slate-400">{candidate.phone || "-"}</div>
              </td>
              <td className="px-4 py-3">{candidate.experience || "-"}</td>
              <td className="px-4 py-3">{candidate.currentCompany || "-"}</td>
              <td className="px-4 py-3"><span className={statusBadge(candidate.status)}>{candidate.status}</span></td>
              <td className="px-4 py-3">{candidate.lastCall ? `${candidate.lastCall.status} (${formatDate(candidate.lastCall.callDate)})` : "-"}</td>
              <td className="px-4 py-3">{candidate.nextFollowUp ? `${candidate.nextFollowUp.type} - ${formatDate(candidate.nextFollowUp.dueDate)} ${candidate.nextFollowUp.dueTime}` : "-"}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button onClick={() => openCandidateContext(candidate, "call")} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Call"><Phone size={16} /></button>
                  <button onClick={() => { openCandidateContext(candidate, "email"); setComposer((p: any) => ({ ...p, recipient: candidate.email || "" })); }} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Email"><Mail size={16} /></button>
                  <button onClick={() => { openCandidateContext(candidate, "whatsapp"); setComposer((p: any) => ({ ...p, recipient: candidate.phone || "" })); }} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="WhatsApp"><MessageCircle size={16} /></button>
                  <button onClick={() => openCandidateContext(candidate, "followup")} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Follow-up"><CalendarClock size={16} /></button>
                  <button onClick={() => { openCandidateContext(candidate); setActiveTab("Activity"); }} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="View"><Eye size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
          {candidates.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No candidates added yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const FollowUpsTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Candidate</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visibleFollowUps.map((item) => (
            <tr key={item._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-bold">{item.candidateId?.name || item.candidateId?.dynamicFields?.candidateName || item.candidateId?.dynamicFields?.CandidateName || "Candidate"}</td>
              <td className="px-4 py-3">{item.type}</td>
              <td className="px-4 py-3">{formatDate(item.dueDate)} {item.dueTime}</td>
              <td className="px-4 py-3"><span className={statusBadge(item.status)}>{item.status}</span></td>
              <td className="px-4 py-3 max-w-xs truncate">{item.notes || "-"}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button disabled={saving === item._id} onClick={() => updateFollowUp(item._id, { status: "Completed" })} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" title="Complete"><CheckCircle size={16} /></button>
                  <button disabled={saving === item._id} onClick={() => updateFollowUp(item._id, { status: "Cancelled" })} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Cancel"><X size={16} /></button>
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

  const DetailView = () => (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button onClick={() => { setSelectedRequirement(null); setRequirementDetails(null); }} className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{selectedRequirement?.title}</h1>
            <p className="text-sm text-slate-500">{selectedRequirement?.company} | {selectedRequirement?.location}</p>
          </div>
        </div>
        <button onClick={() => setModal("candidate")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
          <Plus size={16} /> Add Candidate
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {["Overview", "Candidates", "Call Tracking", "Follow-ups", "Emails", "WhatsApp", "Activity"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-lg px-4 py-2 text-sm font-bold ${activeTab === tab ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
        {activeTab === "Emails" && CandidatesTable()}
        {activeTab === "WhatsApp" && CandidatesTable()}
        {activeTab === "Activity" && ActivityList()}
      </div>
    </div>
  );

  return (
    <>
      {selectedRequirement ? DetailView() : RequirementList()}

      {modal === "candidate" && (
        <ModalShell title="Add Candidate" onClose={() => { setModal(""); setTemplates([]); }}>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["candidateName", "Candidate Name *"],
              ["email", "Email *"],
              ["phone", "Phone Number *"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-bold text-slate-600">{label}</span>
                <input value={candidateForm[key] || ""} onChange={(e) => setCandidateForm({ ...candidateForm, [key]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
              </label>
            ))}
            <label className="block md:col-span-2">
              <span className="text-xs font-bold text-slate-600">CV/Resume *</span>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCandidateForm({ ...candidateForm, resume: e.target.files?.[0] || null })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <button disabled={saving === "candidate"} onClick={addCandidate} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
              <Upload size={16} /> {saving === "candidate" ? "Saving..." : "Add Candidate"}
            </button>
          </div>
        </ModalShell>
      )}

      {modal === "call" && selectedCandidate && (
        <ModalShell title={`Log Call - ${selectedCandidate.name}`} onClose={() => { setModal(""); setTemplates([]); }}>
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
            <textarea value={followUpForm.notes} onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })} rows={3} placeholder="Notes" className="md:col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
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
              <button onClick={() => generateTemplates(modal as any)} disabled={saving.includes("generate")} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Generate Templates</button>
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
    </>
  );
}
