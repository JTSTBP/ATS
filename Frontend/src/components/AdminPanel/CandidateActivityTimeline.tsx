import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  History,
  Search,
  UserRound,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL;

type UserNode = {
  _id: string;
  name: string;
  email?: string;
  designation: "Admin" | "Manager" | "Mentor" | "Recruiter" | string;
  role?: string;
  children?: UserNode[];
};

type CandidateSummary = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
  job?: { _id: string; title: string };
  client?: { _id: string; name: string };
  recruiter?: UserNode | null;
  mentor?: UserNode | null;
  manager?: UserNode | null;
};

type TimelineActivity = {
  _id: string;
  timestamp: string;
  actionType: string;
  actionLabel: string;
  title: string;
  description?: string;
  user: UserNode;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
  statusAtPoint?: string;
  job?: { _id: string; title: string } | null;
  client?: { _id: string; name: string } | null;
  candidate?: { _id: string; name: string };
};

type Organization = {
  managers: UserNode[];
  unassignedMentors: UserNode[];
  unassignedRecruiters: UserNode[];
  users: UserNode[];
};

type SelectOption = {
  _id: string;
  name?: string;
  title?: string;
  designation?: string;
};

const actionFilters = [
  ["all", "All Actions"],
  ["candidate_created", "Candidate Created"],
  ["candidate_updated", "Candidate Updated"],
  ["status_changed", "Status Changed"],
  ["assignment_changed", "Assignment Changed"],
  ["interview", "Interview"],
  ["screening", "Screening"],
  ["client_submission", "Client Submission"],
  ["client_feedback", "Client Feedback"],
  ["offer", "Offer"],
  ["joining", "Joining"],
  ["email", "Email"],
  ["comment", "Comment"],
  ["resume", "Resume"],
  ["other", "Other"],
];

const roleIcons: Record<string, string> = {
  Admin: "👑",
  Manager: "👨‍💼",
  Mentor: "👨‍🏫",
  Recruiter: "👤",
};

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

function getDateHeading(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return `TODAY - ${formatDate(value)}`;
  if (sameDay(date, yesterday)) return `YESTERDAY - ${formatDate(value)}`;
  return formatDate(value).toUpperCase();
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "N/A";
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object" && item !== null && "field" in item && "value" in item) {
          return `${String(item.field)}: ${String(item.value ?? "N/A")}`;
        }
        return typeof item === "object" ? JSON.stringify(item) : String(item);
      })
      .join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function groupActivities(activities: TimelineActivity[]) {
  return activities.reduce<Record<string, TimelineActivity[]>>((groups, activity) => {
    const key = new Date(activity.timestamp).toDateString();
    groups[key] = groups[key] || [];
    groups[key].push(activity);
    return groups;
  }, {});
}

function TreeUser({
  user,
  depth = 0,
  selectedUserId,
  onSelect,
}: {
  user: UserNode;
  depth?: number;
  selectedUserId?: string;
  onSelect: (user: UserNode) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = Boolean(user.children?.length);
  const isSelected = selectedUserId === user._id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
          isSelected ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
        }`}
        style={{ marginLeft: depth * 16 }}
      >
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="grid h-5 w-5 place-items-center rounded text-slate-500"
        >
          {hasChildren ? open ? <ChevronDown size={16} /> : <ChevronRight size={16} /> : null}
        </button>
        <button type="button" onClick={() => onSelect(user)} className="min-w-0 flex-1 text-left">
          <span className="mr-2">{roleIcons[user.designation] || "👤"}</span>
          <span className="font-medium">{user.name}</span>
          <span className="ml-2 text-xs text-slate-500">{user.designation}</span>
        </button>
      </div>
      {open && user.children?.map((child) => (
        <TreeUser
          key={child._id}
          user={child}
          depth={depth + 1}
          selectedUserId={selectedUserId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function CandidateActivityTimeline() {
  const [candidateFilters, setCandidateFilters] = useState({
    search: "",
    jobId: "",
    recruiterId: "",
    mentorId: "",
    managerId: "",
    startDate: "",
    endDate: "",
    actionType: "all",
  });
  const [timelineFilters, setTimelineFilters] = useState({
    role: "All",
    action: "all",
    datePreset: "all",
    startDate: "",
    endDate: "",
    search: "",
    sort: "desc",
    userId: "",
  });
  const [organization, setOrganization] = useState<Organization>({
    managers: [],
    unassignedMentors: [],
    unassignedRecruiters: [],
    users: [],
  });
  const [jobs, setJobs] = useState<SelectOption[]>([]);
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSummary | null>(null);
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<TimelineActivity | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<"candidate" | "date">("candidate");
  const [dateViewDate, setDateViewDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dateViewActivities, setDateViewActivities] = useState<TimelineActivity[]>([]);
  const [loadingDateView, setLoadingDateView] = useState(false);
  const [dateViewFilters, setDateViewFilters] = useState({
    role: "All",
    action: "all",
    search: "",
    userId: "",
  });

  const managers = organization.users.filter((user) => user.designation === "Manager");
  const mentors = organization.users.filter((user) => user.designation === "Mentor");
  const recruiters = organization.users.filter((user) => user.designation === "Recruiter");

  const groupedActivities = useMemo(() => groupActivities(activities), [activities]);

  const updateCandidateFilter = (key: string, value: string) => {
    setCandidateFilters((current) => ({ ...current, [key]: value }));
  };

  const updateTimelineFilter = (key: string, value: string) => {
    setTimelineFilters((current) => {
      const next = { ...current, [key]: value };
      if (key === "datePreset") {
        const today = new Date();
        const toInput = (date: Date) => date.toISOString().slice(0, 10);
        if (value === "today") {
          next.startDate = toInput(today);
          next.endDate = toInput(today);
        } else if (value === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          next.startDate = toInput(yesterday);
          next.endDate = toInput(yesterday);
        } else if (value === "7") {
          const start = new Date();
          start.setDate(today.getDate() - 6);
          next.startDate = toInput(start);
          next.endDate = toInput(today);
        } else if (value === "30") {
          const start = new Date();
          start.setDate(today.getDate() - 29);
          next.startDate = toInput(start);
          next.endDate = toInput(today);
        } else if (value === "all") {
          next.startDate = "";
          next.endDate = "";
        }
      }
      return next;
    });
  };

  const loadOrganization = async () => {
    const response = await axios.get(`${API_URL}/api/activities/organization-tree`);
    setOrganization(response.data.organization);
  };

  const loadJobs = async () => {
    const response = await axios.get(`${API_URL}/api/jobs`);
    const jobList = Array.isArray(response.data) ? response.data : response.data.jobs || [];
    setJobs(jobList);
  };

  const searchCandidates = async () => {
    setLoadingCandidates(true);
    setError("");
    try {
      const response = await axios.get(`${API_URL}/api/activities/candidate-search`, {
        params: candidateFilters,
      });
      setCandidates(response.data.candidates || []);
    } catch {
      setError("Unable to load candidate activity data.");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const loadTimeline = async (candidate: CandidateSummary, overrides = timelineFilters) => {
    setSelectedCandidate(candidate);
    setLoadingTimeline(true);
    setError("");
    try {
      const response = await axios.get(`${API_URL}/api/activities/candidate/${candidate._id}/timeline`, {
        params: overrides,
      });
      setSelectedCandidate(response.data.candidate);
      setActivities(response.data.activities || []);
    } catch {
      setError("Unable to load the selected candidate timeline.");
    } finally {
      setLoadingTimeline(false);
    }
  };

  const loadDateViewTimeline = async () => {
    setLoadingDateView(true);
    setError("");
    try {
      const response = await axios.get(`${API_URL}/api/activities/timeline-by-date`, {
        params: {
          date: dateViewDate,
          ...dateViewFilters,
        },
      });
      setDateViewActivities(response.data.activities || []);
    } catch {
      setError("Unable to load the timeline for the selected date.");
    } finally {
      setLoadingDateView(false);
    }
  };

  useEffect(() => {
    loadOrganization().catch(() => setError("Unable to load organization hierarchy."));
    loadJobs().catch(() => undefined);
    searchCandidates();
  }, []);

  useEffect(() => {
    if (selectedCandidate) {
      loadTimeline(selectedCandidate);
    }
  }, [
    timelineFilters.role,
    timelineFilters.action,
    timelineFilters.startDate,
    timelineFilters.endDate,
    timelineFilters.search,
    timelineFilters.sort,
    timelineFilters.userId,
  ]);

  useEffect(() => {
    if (activeTab === "date") {
      loadDateViewTimeline();
    }
  }, [activeTab, dateViewDate, dateViewFilters.role, dateViewFilters.action, dateViewFilters.search, dateViewFilters.userId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Candidate Activity Timeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search a candidate, then review every recorded action with user, role, time, status, and hierarchy context.
          </p>
        </div>
        <button
          type="button"
          onClick={searchCandidates}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Search size={16} />
          Search Candidates
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex space-x-1 rounded-xl bg-slate-200/60 p-1">
        <button
          onClick={() => setActiveTab("candidate")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${activeTab === "candidate" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-200"}`}
        >
          Candidate View
        </button>
        <button
          onClick={() => setActiveTab("date")}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${activeTab === "date" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-200"}`}
        >
          Date View
        </button>
      </div>

      {activeTab === "candidate" && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-blue-600" />
          <h2 className="font-bold text-slate-800">Find Candidate</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={candidateFilters.search}
            onChange={(event) => updateCandidateFilter("search", event.target.value)}
            placeholder="Search name, email, phone"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <select
            value={candidateFilters.jobId}
            onChange={(event) => updateCandidateFilter("jobId", event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All jobs</option>
            {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
          </select>
          <select
            value={candidateFilters.managerId}
            onChange={(event) => updateCandidateFilter("managerId", event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All managers</option>
            {managers.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
          </select>
          <select
            value={candidateFilters.mentorId}
            onChange={(event) => updateCandidateFilter("mentorId", event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All mentors</option>
            {mentors.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
          </select>
          <select
            value={candidateFilters.recruiterId}
            onChange={(event) => updateCandidateFilter("recruiterId", event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All recruiters</option>
            {recruiters.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
          </select>
          <select
            value={candidateFilters.actionType}
            onChange={(event) => updateCandidateFilter("actionType", event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            {actionFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input
            type="date"
            value={candidateFilters.startDate}
            onChange={(event) => updateCandidateFilter("startDate", event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="date"
            value={candidateFilters.endDate}
            onChange={(event) => updateCandidateFilter("endDate", event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-800">Candidates</h2>
            <p className="text-xs text-slate-500">{candidates.length} result(s)</p>
          </div>
          <div className="max-h-[620px] overflow-auto p-3">
            {loadingCandidates ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : candidates.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
                No candidates found for the selected filters.
              </div>
            ) : (
              <div className="space-y-2">
                {candidates.map((candidate) => (
                  <button
                    key={candidate._id}
                    type="button"
                    onClick={() => loadTimeline(candidate)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedCandidate?._id === candidate._id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{candidate.name}</p>
                        <p className="truncate text-xs text-slate-500">{candidate.email || candidate.phone || "No contact"}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {candidate.status || "New"}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-xs text-slate-500">{candidate.job?.title || "No job linked"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          {!selectedCandidate ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <History className="mx-auto mb-3 text-slate-400" size={36} />
              <h2 className="text-lg font-bold text-slate-800">Select a candidate to open the timeline</h2>
              <p className="mt-1 text-sm text-slate-500">The full activity history and hierarchy view will appear here.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-5">
                  <div className="lg:col-span-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">Candidate</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">{selectedCandidate.name}</h2>
                    <p className="text-sm text-slate-500">{selectedCandidate.email || selectedCandidate.phone || "No contact available"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Job</p>
                    <p className="mt-1 font-semibold text-slate-800">{selectedCandidate.job?.title || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Current Status</p>
                    <p className="mt-1 font-semibold text-blue-700">{selectedCandidate.status || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Client</p>
                    <p className="mt-1 font-semibold text-slate-800">{selectedCandidate.client?.name || "N/A"}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    ["Manager", selectedCandidate.manager?.name],
                    ["Mentor", selectedCandidate.mentor?.name],
                    ["Recruiter", selectedCandidate.recruiter?.name],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                      <p className="mt-1 font-medium text-slate-800">{value || "Unassigned"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Organization</h3>
                    {timelineFilters.userId && (
                      <button
                        type="button"
                        onClick={() => updateTimelineFilter("userId", "")}
                        className="text-xs font-semibold text-blue-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="max-h-[520px] overflow-auto">
                    {organization.managers.map((manager) => (
                      <TreeUser
                        key={manager._id}
                        user={manager}
                        selectedUserId={timelineFilters.userId}
                        onSelect={(user) => updateTimelineFilter("userId", user._id)}
                      />
                    ))}
                    {organization.unassignedMentors.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="mb-2 text-xs font-bold uppercase text-slate-500">Unassigned Mentors</p>
                        {organization.unassignedMentors.map((mentor) => (
                          <TreeUser
                            key={mentor._id}
                            user={mentor}
                            selectedUserId={timelineFilters.userId}
                            onSelect={(user) => updateTimelineFilter("userId", user._id)}
                          />
                        ))}
                      </div>
                    )}
                    {organization.unassignedRecruiters.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="mb-2 text-xs font-bold uppercase text-slate-500">Unassigned Recruiters</p>
                        {organization.unassignedRecruiters.map((recruiter) => (
                          <TreeUser
                            key={recruiter._id}
                            user={recruiter}
                            selectedUserId={timelineFilters.userId}
                            onSelect={(user) => updateTimelineFilter("userId", user._id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </aside>

                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <input
                        value={timelineFilters.search}
                        onChange={(event) => updateTimelineFilter("search", event.target.value)}
                        placeholder="Search timeline"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                      <select
                        value={timelineFilters.role}
                        onChange={(event) => updateTimelineFilter("role", event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        {["All", "Admin", "Manager", "Mentor", "Recruiter"].map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <select
                        value={timelineFilters.action}
                        onChange={(event) => updateTimelineFilter("action", event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        {actionFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <select
                        value={timelineFilters.sort}
                        onChange={(event) => updateTimelineFilter("sort", event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="desc">Newest to Oldest</option>
                        <option value="asc">Oldest to Newest</option>
                      </select>
                      <select
                        value={timelineFilters.datePreset}
                        onChange={(event) => updateTimelineFilter("datePreset", event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="all">All dates</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="custom">Custom range</option>
                      </select>
                      <input
                        type="date"
                        value={timelineFilters.startDate}
                        onChange={(event) => updateTimelineFilter("startDate", event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                      <input
                        type="date"
                        value={timelineFilters.endDate}
                        onChange={(event) => updateTimelineFilter("endDate", event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {loadingTimeline ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className="h-28 animate-pulse rounded-lg bg-slate-100" />
                        ))}
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
                        No recorded activity matches these filters.
                      </div>
                    ) : (
                      <div className="space-y-7">
                        {Object.entries(groupedActivities).map(([dateKey, dayActivities]) => (
                          <div key={dateKey}>
                            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                              <Calendar size={15} />
                              {getDateHeading(dayActivities[0].timestamp)}
                            </div>
                            <div className="space-y-4">
                              {dayActivities.map((activity) => (
                                <button
                                  key={activity._id}
                                  type="button"
                                  onClick={() => setSelectedActivity(activity)}
                                  className="relative w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
                                >
                                  <div className="absolute left-4 top-5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                                  <div className="pl-8">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex min-w-0 items-center gap-2">
                                        <Clock size={15} className="text-slate-400" />
                                        <span className="text-sm font-bold text-slate-800">{formatTime(activity.timestamp)}</span>
                                        <span className="truncate text-sm text-slate-500">
                                          {roleIcons[activity.user?.designation] || "👤"} {activity.user?.name || "Unknown"} - {activity.user?.designation || "User"}
                                        </span>
                                      </div>
                                      <span className="w-fit rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                        {activity.statusAtPoint || selectedCandidate.status || "N/A"}
                                      </span>
                                    </div>
                                    <h3 className="mt-2 font-bold text-slate-900">{activity.title}</h3>
                                    {activity.previousValue || activity.newValue ? (
                                      <p className="mt-2 text-sm text-slate-700">
                                        <span className="rounded bg-slate-100 px-2 py-1">{stringifyValue(activity.previousValue)}</span>
                                        <span className="mx-2 text-slate-400">to</span>
                                        <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">{stringifyValue(activity.newValue)}</span>
                                      </p>
                                    ) : null}
                                    {activity.description && (
                                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">{activity.description}</p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
      </>
      )}

      {activeTab === "date" && (
        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 font-bold text-slate-800">Select Date</h2>
            <input
              type="date"
              value={dateViewDate}
              onChange={(e) => setDateViewDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 mb-6"
            />
            
            <h2 className="mb-4 font-bold text-slate-800">Quick Filters</h2>
            <div className="space-y-3">
               <select
                 value={dateViewFilters.role}
                 onChange={(event) => setDateViewFilters({ ...dateViewFilters, role: event.target.value })}
                 className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
               >
                 {["All", "Admin", "Manager", "Mentor", "Recruiter"].map((role) => (
                   <option key={role} value={role}>{role}</option>
                 ))}
               </select>
               <select
                 value={dateViewFilters.action}
                 onChange={(event) => setDateViewFilters({ ...dateViewFilters, action: event.target.value })}
                 className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
               >
                 {actionFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
               </select>
               <input
                 value={dateViewFilters.search}
                 onChange={(event) => setDateViewFilters({ ...dateViewFilters, search: event.target.value })}
                 placeholder="Search timeline"
                 className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
               />
               <button
                 type="button"
                 onClick={loadDateViewTimeline}
                 className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 mt-2"
               >
                 Apply Filters
               </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
               <Calendar size={15} />
               ACTIONS ON {formatDate(dateViewDate).toUpperCase()}
            </div>
            
            {loadingDateView ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-28 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : dateViewActivities.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
                No recorded activity on {formatDate(dateViewDate)}.
              </div>
            ) : (
              <div className="space-y-4">
                {dateViewActivities.map((activity) => (
                  <button
                    key={activity._id}
                    type="button"
                    onClick={() => setSelectedActivity(activity)}
                    className="relative w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
                  >
                    <div className="absolute left-4 top-5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                    <div className="pl-8">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-2">
                          <Clock size={15} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-800">{formatTime(activity.timestamp)}</span>
                          <span className="truncate text-sm text-slate-500">
                            {roleIcons[activity.user?.designation] || "👤"} {activity.user?.name || "Unknown"} - {activity.user?.designation || "User"}
                          </span>
                        </div>
                        <span className="w-fit rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {activity.statusAtPoint || "N/A"}
                        </span>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <UserRound size={14} className="text-blue-500" />
                        <span className="text-sm font-bold text-blue-700">
                          {activity.candidate?.name || "Unknown Candidate"}
                        </span>
                      </div>
                      
                      <h3 className="mt-2 font-bold text-slate-900">{activity.title}</h3>
                      {activity.previousValue || activity.newValue ? (
                        <p className="mt-2 text-sm text-slate-700">
                          <span className="rounded bg-slate-100 px-2 py-1">{stringifyValue(activity.previousValue)}</span>
                          <span className="mx-2 text-slate-400">to</span>
                          <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">{stringifyValue(activity.newValue)}</span>
                        </p>
                      ) : null}
                      {activity.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{activity.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selectedActivity.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedActivity.actionLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Performed By</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedActivity.user?.name || "Unknown user"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Role</p>
                <p className="mt-1 font-semibold text-slate-900">{selectedActivity.user?.designation || "N/A"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Date</p>
                <p className="mt-1 font-semibold text-slate-900">{formatDate(selectedActivity.timestamp)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Time</p>
                <p className="mt-1 font-semibold text-slate-900">{formatTime(selectedActivity.timestamp)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Previous Value</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{stringifyValue(selectedActivity.previousValue)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">New Value</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{stringifyValue(selectedActivity.newValue)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Job</p>
                <p className="mt-1 font-semibold text-slate-900">{selectedActivity.job?.title || selectedCandidate?.job?.title || "N/A"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Client</p>
                <p className="mt-1 font-semibold text-slate-900">{selectedActivity.client?.name || selectedCandidate?.client?.name || "N/A"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
                <p className="text-xs font-bold uppercase text-slate-500">Comments / Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {selectedActivity.description || stringifyValue(selectedActivity.metadata?.comment || selectedActivity.metadata?.notes || selectedActivity.metadata?.text)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
                <p className="text-xs font-bold uppercase text-slate-500">Metadata</p>
                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                  {JSON.stringify(selectedActivity.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
