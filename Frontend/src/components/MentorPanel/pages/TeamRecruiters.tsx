import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../../context/AuthProvider";
import { useUserContext } from "../../../context/UserProvider";
import axios from "axios";
import { Search, Users, Mail, Phone, Building2, Calendar, EyeOff, Check, Loader2 } from "lucide-react";
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

export default function TeamRecruiters() {
    const { user } = useAuth();
    const { toggleUserStatus } = useUserContext();
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchRecruiters = async () => {
        if (!user?._id) return;
        try {
            setLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/users?reporter=${user._id}&role=Recruiter`
            );
            const data = Array.isArray(res.data) ? res.data : res.data.users ?? [];
            setRecruiters(data);
        } catch (err) {
            console.error("Failed to fetch recruiters:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecruiters();
    }, [user?._id]);

    const handleToggleStatus = async (id: string) => {
        setTogglingId(id);
        const success = await toggleUserStatus(id);
        if (success) {
            setRecruiters(prev =>
                prev.map(r => r._id === id ? { ...r, isDisabled: !r.isDisabled } : r)
            );
        }
        setTogglingId(null);
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return recruiters.filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                (r.department ?? "").toLowerCase().includes(q)
        );
    }, [recruiters, search]);

    const formatDate = (date?: string) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

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

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="text-blue-600" size={28} />
                        My Recruiters
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Recruiters reporting directly to you
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
                        placeholder="Search by name, email, department..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                    />
                </div>
            </div>

            {/* Stats badge */}
            <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border border-blue-100">
                    <Users size={12} />
                    {recruiters.length} Recruiter{recruiters.length !== 1 ? "s" : ""} in your team
                </span>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <p className="text-slate-500 text-sm font-medium">Loading recruiters...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all duration-300">
                    <Users size={40} className="text-slate-200 mb-3" />
                    <p className="text-slate-500 font-semibold text-base">
                        {search ? "No recruiters match your search." : "No recruiters assigned to you."}
                    </p>
                    <p className="text-slate-400 text-sm mt-1 text-center max-w-[280px]">
                        {search
                            ? "Try a different keyword."
                            : "Recruiters with you as their reporter will appear here."}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-slate-50/50 text-[10px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Recruiter</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Date of Joining</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                <AnimatePresence mode="popLayout">
                                    {filtered.map((recruiter) => (
                                        <motion.tr
                                            key={recruiter._id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-slate-50/50 transition-all group"
                                        >
                                            {/* Avatar + Name */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200 ${getAvatarColor(recruiter.name)}`}
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
                                                    <span className="flex items-center gap-2 text-slate-600 group-hover:text-blue-600 transition-colors">
                                                        <Mail size={13} className="text-slate-400" />
                                                        <a
                                                            href={`mailto:${recruiter.email}`}
                                                            className="hover:underline truncate max-w-[180px]"
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

                                            {/* Joining Date */}
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-2 text-slate-600 font-medium">
                                                    <Calendar size={13} className="text-slate-400" />
                                                    {formatDate(recruiter.dateOfJoining ?? recruiter.joinDate)}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${recruiter.isDisabled
                                                    ? "bg-rose-50 text-rose-600 border-rose-100"
                                                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${recruiter.isDisabled ? "bg-rose-500" : "bg-emerald-500"}`} />
                                                    {recruiter.isDisabled ? "Inactive" : "Active"}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleToggleStatus(recruiter._id)}
                                                    disabled={togglingId === recruiter._id}
                                                    className={`p-2.5 rounded-xl transition-all duration-200 transform active:scale-95 ${recruiter.isDisabled
                                                        ? "text-emerald-500 hover:bg-emerald-50 border border-transparent hover:border-emerald-100"
                                                        : "text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                                                        }`}
                                                    title={recruiter.isDisabled ? "Enable Recruiter" : "Disable Recruiter"}
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

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>Team Management</span>
                        <span>
                            Showing {filtered.length} of {recruiters.length} recruiter
                            {recruiters.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
