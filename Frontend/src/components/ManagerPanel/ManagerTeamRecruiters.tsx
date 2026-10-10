import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthProvider";
import { useUserContext } from "../../context/UserProvider";
import axios from "axios";
import {
    Search,
    Users,
    Mail,
    Phone,
    Building2,
    Calendar,
    EyeOff,
    Check,
    Loader2,
    Briefcase,
    ChevronDown,
    ChevronUp,
    UserCheck,
    ChevronRight,
    ShieldCheck,
    UsersRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Recruiter {
    _id: string;
    name: string;
    email: string;
    designation: string;
    phone?: string;
    department?: string;
    dateOfJoining?: string;
    joinDate?: string;
    profilePhoto?: string;
    isDisabled?: boolean;
}

interface Mentor {
    _id: string;
    name: string;
    email: string;
    designation: string;
    phone?: string;
    department?: string;
    dateOfJoining?: string;
    joinDate?: string;
    profilePhoto?: string;
    isDisabled?: boolean;
}

interface AssignedJob {
    _id: string;
    title: string;
    status?: string;
    clientId?: { companyName?: string };
}

interface TeamGroup {
    id: string;
    title: string;
    subtitle: string;
    isDirect: boolean;
    mentor?: Mentor;
    recruiters: Recruiter[];
}

const avatarColors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-sky-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
];

const getAvatarColor = (name: string) =>
    avatarColors[name.charCodeAt(0) % avatarColors.length];

const getInitials = (name: string) =>
    name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default function ManagerTeamRecruiters() {
    const { user } = useAuth();
    const { toggleUserStatus } = useUserContext();

    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [groups, setGroups] = useState<TeamGroup[]>([]);
    const [directCount, setDirectCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"all" | "mentors" | "recruiters">("all");

    const [recruiterJobs, setRecruiterJobs] = useState<Record<string, AssignedJob[]>>({});
    const [jobsLoading, setJobsLoading] = useState<Record<string, boolean>>({});
    const [expandedJobs, setExpandedJobs] = useState<Record<string, boolean>>({});
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const fetchAssignedJobs = async (recruiterId: string) => {
        if (recruiterJobs[recruiterId] !== undefined) return;
        setJobsLoading((prev) => ({ ...prev, [recruiterId]: true }));
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/jobs/assigned/${recruiterId}`
            );
            setRecruiterJobs((prev) => ({ ...prev, [recruiterId]: res.data?.jobs ?? [] }));
        } catch {
            setRecruiterJobs((prev) => ({ ...prev, [recruiterId]: [] }));
        } finally {
            setJobsLoading((prev) => ({ ...prev, [recruiterId]: false }));
        }
    };

    useEffect(() => {
        if (!user?._id) return;

        const loadAll = async () => {
            setLoading(true);
            try {
                // 1. Fetch recruiters assigned directly to the current logged-in manager
                const directRecRes = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/users?reporter=${user._id}&role=Recruiter`
                );
                const directRecruiters: Recruiter[] = Array.isArray(directRecRes.data)
                    ? directRecRes.data
                    : directRecRes.data.users ?? [];

                // 2. Fetch mentors reporting to the manager
                const mentorsRes = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/users?reporter=${user._id}&role=Mentor`
                );
                const mentorsData: Mentor[] = Array.isArray(mentorsRes.data)
                    ? mentorsRes.data
                    : mentorsRes.data.users ?? [];

                // 3. Fetch recruiters for each mentor
                const mentorGroups = await Promise.all(
                    mentorsData.map(async (mentor) => {
                        try {
                            const recRes = await axios.get(
                                `${import.meta.env.VITE_BACKEND_URL}/api/users?reporter=${mentor._id}&role=Recruiter`
                            );
                            const recruiters: Recruiter[] = Array.isArray(recRes.data)
                                ? recRes.data
                                : recRes.data.users ?? [];
                            return { mentor, recruiters };
                        } catch {
                            return { mentor, recruiters: [] };
                        }
                    })
                );

                const assembledGroups: TeamGroup[] = [];

                if (directRecruiters.length > 0) {
                    assembledGroups.push({
                        id: "direct",
                        title: "Direct Recruiters (Reporting to You)",
                        subtitle: `${directRecruiters.length} Recruiter${directRecruiters.length !== 1 ? "s" : ""} assigned directly to you`,
                        isDirect: true,
                        recruiters: directRecruiters,
                    });
                }

                mentorGroups.forEach(({ mentor, recruiters }) => {
                    assembledGroups.push({
                        id: mentor._id,
                        title: mentor.name,
                        subtitle: `Mentor · ${recruiters.length} Recruiter${recruiters.length !== 1 ? "s" : ""}`,
                        isDirect: false,
                        mentor,
                        recruiters,
                    });
                });

                setMentors(mentorsData);
                setDirectCount(directRecruiters.length);
                setGroups(assembledGroups);

                // Pre-fetch assigned jobs for all recruiters
                assembledGroups
                    .flatMap((g) => g.recruiters)
                    .forEach((r) => fetchAssignedJobs(r._id));
            } catch (err) {
                console.error("Failed to load team:", err);
            } finally {
                setLoading(false);
            }
        };

        loadAll();
    }, [user?._id]);

    const handleToggleStatus = async (id: string, groupId: string) => {
        setTogglingId(id);
        const success = await toggleUserStatus(id);
        if (success) {
            setGroups((prev) =>
                prev.map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              recruiters: g.recruiters.map((r) =>
                                  r._id === id ? { ...r, isDisabled: !r.isDisabled } : r
                              ),
                          }
                        : g
                )
            );
        }
        setTogglingId(null);
    };

    const handleToggleMentorStatus = async (mentorId: string) => {
        setTogglingId(mentorId);
        const success = await toggleUserStatus(mentorId);
        if (success) {
            setMentors((prev) =>
                prev.map((m) =>
                    m._id === mentorId ? { ...m, isDisabled: !m.isDisabled } : m
                )
            );
            setGroups((prev) =>
                prev.map((g) =>
                    g.mentor?._id === mentorId
                        ? { ...g, mentor: { ...g.mentor, isDisabled: !g.mentor.isDisabled } }
                        : g
                )
            );
        }
        setTogglingId(null);
    };

    const toggleJobExpand = (id: string) =>
        setExpandedJobs((prev) => ({ ...prev, [id]: !prev[id] }));

    const toggleSection = (id: string) =>
        setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));

    const allRecruiters = useMemo(() => {
        const map = new Map<string, Recruiter>();
        groups.flatMap((g) => g.recruiters).forEach((r) => map.set(r._id, r));
        return Array.from(map.values());
    }, [groups]);

    const mentorRecruiterCount = useMemo(() => {
        const map: Record<string, number> = {};
        groups.forEach((g) => {
            if (!g.isDirect && g.mentor) {
                map[g.mentor._id] = g.recruiters.length;
            }
        });
        return map;
    }, [groups]);

    const filteredMentors = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return mentors;
        return mentors.filter(
            (m) =>
                m.name.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                (m.department ?? "").toLowerCase().includes(q) ||
                (m.phone ?? "").toLowerCase().includes(q)
        );
    }, [mentors, search]);

    const filteredGroups = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return groups;

        return groups
            .map((g) => ({
                ...g,
                recruiters: g.recruiters.filter(
                    (r) =>
                        r.name.toLowerCase().includes(q) ||
                        r.email.toLowerCase().includes(q) ||
                        (r.department ?? "").toLowerCase().includes(q) ||
                        (r.phone ?? "").toLowerCase().includes(q)
                ),
            }))
            .filter((g) => g.recruiters.length > 0 || g.title.toLowerCase().includes(q));
    }, [groups, search]);

    const totalActiveCount = useMemo(() => {
        const activeMentors = mentors.filter((m) => !m.isDisabled).length;
        const activeRecruiters = allRecruiters.filter((r) => !r.isDisabled).length;
        return activeMentors + activeRecruiters;
    }, [mentors, allRecruiters]);

    const showMentors = activeTab === "all" || activeTab === "mentors";
    const showRecruiters = activeTab === "all" || activeTab === "recruiters";

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <UsersRound className="text-indigo-600" size={28} />
                        Team Management
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage mentors and recruiters across your team
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Search by name, email, dept..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                    />
                </div>
            </div>

            {/* Badges / Metrics */}
            <div className="mb-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border border-indigo-100">
                    <UserCheck size={12} />
                    {mentors.length} Mentor{mentors.length !== 1 ? "s" : ""}
                </span>
                {directCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border border-purple-100">
                        <ShieldCheck size={12} />
                        {directCount} Direct Recruiter{directCount !== 1 ? "s" : ""}
                    </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border border-blue-100">
                    <Users size={12} />
                    {allRecruiters.length} Recruiter{allRecruiters.length !== 1 ? "s" : ""} total
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border border-emerald-100">
                    <Check size={12} />
                    {totalActiveCount} Active Members
                </span>
            </div>

            {/* View Switcher Tabs */}
            <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-3">
                <button
                    onClick={() => setActiveTab("all")}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === "all"
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <UsersRound size={14} />
                    All Members ({mentors.length + allRecruiters.length})
                </button>
                <button
                    onClick={() => setActiveTab("mentors")}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === "mentors"
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <UserCheck size={14} />
                    Mentors ({mentors.length})
                </button>
                <button
                    onClick={() => setActiveTab("recruiters")}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === "recruiters"
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <Users size={14} />
                    Recruiters ({allRecruiters.length})
                </button>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        <p className="text-slate-500 text-sm font-medium">Loading team...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* 1. MENTORS SECTION */}
                    {showMentors && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            {/* Section Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/80 to-blue-50/50 border-b border-indigo-100/60 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                                        <UserCheck size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-bold text-slate-800 text-base">Mentors</h2>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                                {mentors.length}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Mentors reporting directly to you
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                                        {mentors.filter((m) => !m.isDisabled).length} active
                                    </span>
                                </div>
                            </div>

                            {/* Mentors Table or Empty state */}
                            {filteredMentors.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <UserCheck size={36} className="text-slate-200 mb-2" />
                                    <p className="text-slate-500 font-medium text-sm">
                                        {search ? "No mentors match your search." : "No mentors assigned to you."}
                                    </p>
                                    <p className="text-slate-400 text-xs mt-1">
                                        {search ? "Try a different keyword." : "Mentors with you as reporter will appear here."}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left min-w-[900px]">
                                        <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3.5">Mentor</th>
                                                <th className="px-6 py-3.5">Contact</th>
                                                <th className="px-6 py-3.5">Department</th>
                                                <th className="px-6 py-3.5">Date of Joining</th>
                                                <th className="px-6 py-3.5">Recruiters</th>
                                                <th className="px-6 py-3.5 text-center">Status</th>
                                                <th className="px-6 py-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {filteredMentors.map((mentor) => (
                                                <tr
                                                    key={mentor._id}
                                                    className="hover:bg-slate-50/50 transition-all"
                                                >
                                                    {/* Avatar & Name */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm ${getAvatarColor(
                                                                    mentor.name
                                                                )}`}
                                                            >
                                                                {getInitials(mentor.name)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-800 leading-tight truncate">
                                                                    {mentor.name}
                                                                </p>
                                                                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                                                    {mentor.designation || "Mentor"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Contact */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="flex items-center gap-2 text-slate-600">
                                                                <Mail size={13} className="text-slate-400" />
                                                                <a
                                                                    href={`mailto:${mentor.email}`}
                                                                    className="hover:underline hover:text-indigo-600 truncate max-w-[180px]"
                                                                >
                                                                    {mentor.email}
                                                                </a>
                                                            </span>
                                                            {mentor.phone && (
                                                                <span className="flex items-center gap-2 text-slate-500 text-xs">
                                                                    <Phone size={12} className="text-slate-400" />
                                                                    {mentor.phone}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Department */}
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium text-xs">
                                                            <Building2 size={13} className="text-slate-400" />
                                                            {mentor.department || "N/A"}
                                                        </span>
                                                    </td>

                                                    {/* Date of Joining */}
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center gap-2 text-slate-600 font-medium">
                                                            <Calendar size={13} className="text-slate-400" />
                                                            {formatDate(mentor.dateOfJoining ?? mentor.joinDate)}
                                                        </span>
                                                    </td>

                                                    {/* Recruiters Under Mentor */}
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100">
                                                            <Users size={12} />
                                                            {mentorRecruiterCount[mentor._id] ?? 0} Recruiter
                                                            {(mentorRecruiterCount[mentor._id] ?? 0) !== 1 ? "s" : ""}
                                                        </span>
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="px-6 py-4 text-center">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${
                                                                mentor.isDisabled
                                                                    ? "bg-rose-50 text-rose-600 border-rose-100"
                                                                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                            }`}
                                                        >
                                                            <span
                                                                className={`w-1.5 h-1.5 rounded-full ${
                                                                    mentor.isDisabled
                                                                        ? "bg-rose-500"
                                                                        : "bg-emerald-500"
                                                                }`}
                                                            />
                                                            {mentor.isDisabled ? "Inactive" : "Active"}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleToggleMentorStatus(mentor._id)}
                                                            disabled={togglingId === mentor._id}
                                                            className={`p-2.5 rounded-xl transition-all duration-200 transform active:scale-95 ${
                                                                mentor.isDisabled
                                                                    ? "text-emerald-500 hover:bg-emerald-50 border border-transparent hover:border-emerald-100"
                                                                    : "text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                                                            }`}
                                                            title={mentor.isDisabled ? "Enable Mentor" : "Disable Mentor"}
                                                        >
                                                            {togglingId === mentor._id ? (
                                                                <Loader2 size={18} className="animate-spin" />
                                                            ) : mentor.isDisabled ? (
                                                                <Check size={18} />
                                                            ) : (
                                                                <EyeOff size={18} />
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. RECRUITERS SECTION */}
                    {showRecruiters && (
                        <div className="space-y-6">
                            {activeTab === "all" && (
                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Users className="text-indigo-600" size={20} />
                                            Recruiter Teams
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Recruiters reporting directly to you or under mentors
                                        </p>
                                    </div>
                                </div>
                            )}

                            {filteredGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <Users size={36} className="text-slate-200 mb-2" />
                                    <p className="text-slate-500 font-semibold text-base">
                                        {search ? "No recruiters match your search." : "No recruiters assigned."}
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1">
                                        {search ? "Try a different keyword." : "Recruiters reporting directly or via mentors will appear here."}
                                    </p>
                                </div>
                            ) : (
                                filteredGroups.map((group) => {
                                    const isCollapsed = collapsedSections[group.id];
                                    const activeCount = group.recruiters.filter((r) => !r.isDisabled).length;

                                    return (
                                        <div
                                            key={group.id}
                                            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                                        >
                                            {/* Group Header Accordion Button */}
                                            <button
                                                onClick={() => toggleSection(group.id)}
                                                className={`w-full flex items-center justify-between px-6 py-4 transition-colors ${
                                                    group.isDirect
                                                        ? "bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100/70 hover:from-purple-100/60 hover:to-indigo-100/60"
                                                        : "bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100/60 hover:from-indigo-100/60 hover:to-violet-100/60"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm ${
                                                            group.isDirect
                                                                ? "bg-purple-600"
                                                                : getAvatarColor(group.title)
                                                        }`}
                                                    >
                                                        {group.isDirect ? (
                                                            <ShieldCheck size={18} />
                                                        ) : (
                                                            getInitials(group.title)
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-slate-800 text-sm leading-tight">
                                                                {group.title}
                                                            </p>
                                                            {group.isDirect && (
                                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                                                    Direct
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                            {group.subtitle}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                                                        {activeCount} active
                                                    </span>
                                                    {isCollapsed ? (
                                                        <ChevronRight size={16} className="text-slate-400" />
                                                    ) : (
                                                        <ChevronDown size={16} className="text-slate-400" />
                                                    )}
                                                </div>
                                            </button>

                                            {/* Collapsible Table */}
                                            <AnimatePresence initial={false}>
                                                {!isCollapsed && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        style={{ overflow: "hidden" }}
                                                    >
                                                        {group.recruiters.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                                                <Users size={32} className="text-slate-200 mb-2" />
                                                                <p className="text-slate-400 text-sm font-medium">
                                                                    No recruiters in this group
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-left min-w-[900px]">
                                                                    <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100">
                                                                        <tr>
                                                                            <th className="px-6 py-3">Recruiter</th>
                                                                            <th className="px-6 py-3">Contact</th>
                                                                            <th className="px-6 py-3">Department</th>
                                                                            <th className="px-6 py-3">Date of Joining</th>
                                                                            <th className="px-6 py-3">Assigned Jobs</th>
                                                                            <th className="px-6 py-3 text-center">Status</th>
                                                                            <th className="px-6 py-3 text-right">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100 text-sm">
                                                                        <AnimatePresence mode="popLayout">
                                                                            {group.recruiters.map((recruiter) => (
                                                                                <motion.tr
                                                                                    key={recruiter._id}
                                                                                    initial={{ opacity: 0 }}
                                                                                    animate={{ opacity: 1 }}
                                                                                    exit={{ opacity: 0 }}
                                                                                    className="hover:bg-slate-50/50 transition-all"
                                                                                >
                                                                                    {/* Name & Avatar */}
                                                                                    <td className="px-6 py-4">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div
                                                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm ${getAvatarColor(
                                                                                                    recruiter.name
                                                                                                )}`}
                                                                                            >
                                                                                                {getInitials(recruiter.name)}
                                                                                            </div>
                                                                                            <div className="min-w-0">
                                                                                                <p className="font-bold text-slate-800 leading-tight truncate">
                                                                                                    {recruiter.name}
                                                                                                </p>
                                                                                                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                                                                                    ID: {recruiter._id.slice(-6).toUpperCase()}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>

                                                                                    {/* Contact */}
                                                                                    <td className="px-6 py-4">
                                                                                        <div className="flex flex-col gap-1.5">
                                                                                            <span className="flex items-center gap-2 text-slate-600">
                                                                                                <Mail size={13} className="text-slate-400" />
                                                                                                <a
                                                                                                    href={`mailto:${recruiter.email}`}
                                                                                                    className="hover:underline hover:text-indigo-600 truncate max-w-[180px]"
                                                                                                >
                                                                                                    {recruiter.email}
                                                                                                </a>
                                                                                            </span>
                                                                                            {recruiter.phone && (
                                                                                                <span className="flex items-center gap-2 text-slate-500 text-xs">
                                                                                                    <Phone size={12} className="text-slate-400" />
                                                                                                    {recruiter.phone}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>

                                                                                    {/* Department */}
                                                                                    <td className="px-6 py-4">
                                                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium text-xs">
                                                                                            <Building2 size={13} className="text-slate-400" />
                                                                                            {recruiter.department || "N/A"}
                                                                                        </span>
                                                                                    </td>

                                                                                    {/* Date of Joining */}
                                                                                    <td className="px-6 py-4">
                                                                                        <span className="flex items-center gap-2 text-slate-600 font-medium">
                                                                                            <Calendar size={13} className="text-slate-400" />
                                                                                            {formatDate(
                                                                                                recruiter.dateOfJoining ?? recruiter.joinDate
                                                                                            )}
                                                                                        </span>
                                                                                    </td>

                                                                                    {/* Assigned Jobs */}
                                                                                    <td className="px-6 py-4">
                                                                                        {jobsLoading[recruiter._id] ? (
                                                                                            <Loader2 size={14} className="animate-spin text-slate-400" />
                                                                                        ) : (() => {
                                                                                            const jobs = recruiterJobs[recruiter._id] ?? [];
                                                                                            const isExpanded = expandedJobs[recruiter._id];
                                                                                            const PREVIEW = 2;

                                                                                            if (jobs.length === 0) {
                                                                                                return (
                                                                                                    <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs">
                                                                                                        <Briefcase size={13} />
                                                                                                        No jobs
                                                                                                    </span>
                                                                                                );
                                                                                            }

                                                                                            const visible = isExpanded ? jobs : jobs.slice(0, PREVIEW);

                                                                                            return (
                                                                                                <div className="flex flex-col gap-1.5">
                                                                                                    {visible.map((job) => (
                                                                                                        <span
                                                                                                            key={job._id}
                                                                                                            title={
                                                                                                                job.clientId?.companyName
                                                                                                                    ? `Client: ${job.clientId.companyName}`
                                                                                                                    : undefined
                                                                                                            }
                                                                                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border max-w-[180px] truncate ${
                                                                                                                job.status === "Open"
                                                                                                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                                                                                                    : job.status === "Closed"
                                                                                                                    ? "bg-slate-100 text-slate-500 border-slate-200"
                                                                                                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                                                                                            }`}
                                                                                                        >
                                                                                                            <Briefcase size={11} className="flex-shrink-0" />
                                                                                                            <span className="truncate">{job.title}</span>
                                                                                                        </span>
                                                                                                    ))}
                                                                                                    {jobs.length > PREVIEW && (
                                                                                                        <button
                                                                                                            onClick={() => toggleJobExpand(recruiter._id)}
                                                                                                            className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold mt-0.5 transition-colors"
                                                                                                        >
                                                                                                            {isExpanded ? (
                                                                                                                <>
                                                                                                                    <ChevronUp size={12} /> Show less
                                                                                                                </>
                                                                                                            ) : (
                                                                                                                <>
                                                                                                                    <ChevronDown size={12} /> +{jobs.length - PREVIEW} more
                                                                                                                </>
                                                                                                            )}
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })()}
                                                                                    </td>

                                                                                    {/* Status Badge */}
                                                                                    <td className="px-6 py-4 text-center">
                                                                                        <span
                                                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${
                                                                                                recruiter.isDisabled
                                                                                                    ? "bg-rose-50 text-rose-600 border-rose-100"
                                                                                                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                                                            }`}
                                                                                        >
                                                                                            <span
                                                                                                className={`w-1.5 h-1.5 rounded-full ${
                                                                                                    recruiter.isDisabled
                                                                                                        ? "bg-rose-500"
                                                                                                        : "bg-emerald-500"
                                                                                                }`}
                                                                                            />
                                                                                            {recruiter.isDisabled ? "Inactive" : "Active"}
                                                                                        </span>
                                                                                    </td>

                                                                                    {/* Actions */}
                                                                                    <td className="px-6 py-4 text-right">
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                handleToggleStatus(recruiter._id, group.id)
                                                                                            }
                                                                                            disabled={togglingId === recruiter._id}
                                                                                            className={`p-2.5 rounded-xl transition-all duration-200 transform active:scale-95 ${
                                                                                                recruiter.isDisabled
                                                                                                    ? "text-emerald-500 hover:bg-emerald-50 border border-transparent hover:border-emerald-100"
                                                                                                    : "text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                                                                                            }`}
                                                                                            title={
                                                                                                recruiter.isDisabled
                                                                                                    ? "Enable Recruiter"
                                                                                                    : "Disable Recruiter"
                                                                                            }
                                                                                        >
                                                                                            {togglingId === recruiter._id ? (
                                                                                                <Loader2 size={18} className="animate-spin" />
                                                                                            ) : recruiter.isDisabled ? (
                                                                                                <Check size={18} />
                                                                                            ) : (
                                                                                                <EyeOff size={18} />
                                                                                            )}
                                                                                        </button>
                                                                                    </td>
                                                                                </motion.tr>
                                                                            ))}
                                                                        </AnimatePresence>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
