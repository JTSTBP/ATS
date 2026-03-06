import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthProvider";
import axios from "axios";
import { Search, UserCheck, Mail, Phone, Building2, Calendar } from "lucide-react";

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

export default function MentorsList() {
    const { user } = useAuth();
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user?._id) return;

        const fetchMentors = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/users?reporter=${user._id}&role=Mentor`
                );
                // Handle both array and paginated responses
                const data = Array.isArray(res.data) ? res.data : res.data.users ?? [];
                setMentors(data);
            } catch (err) {
                console.error("Failed to fetch mentors:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMentors();
    }, [user?._id]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return mentors.filter(
            (m) =>
                m.name.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q) ||
                (m.department ?? "").toLowerCase().includes(q)
        );
    }, [mentors, search]);

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
                        <UserCheck className="text-indigo-600" size={28} />
                        My Mentors
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Mentors reporting directly to you
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
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                    />
                </div>
            </div>

            {/* Stats badge */}
            <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border border-indigo-100">
                    <UserCheck size={12} />
                    {mentors.length} Mentor{mentors.length !== 1 ? "s" : ""} in your team
                </span>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-slate-500 text-sm font-medium">Loading mentors...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <UserCheck size={40} className="text-slate-200 mb-3" />
                    <p className="text-slate-500 font-semibold text-base">
                        {search ? "No mentors match your search." : "No mentors assigned to you."}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                        {search
                            ? "Try a different keyword."
                            : "Mentors with you as their reporter will appear here."}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Mentor</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Date of Joining</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filtered.map((mentor) => (
                                    <tr
                                        key={mentor._id}
                                        className="hover:bg-slate-50/70 transition-all group"
                                    >
                                        {/* Avatar + Name */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getAvatarColor(mentor.name)}`}
                                                >
                                                    {getInitials(mentor.name)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 leading-tight">
                                                        {mentor.name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        {mentor.designation}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1.5 text-slate-600">
                                                    <Mail size={12} className="text-slate-400" />
                                                    <a
                                                        href={`mailto:${mentor.email}`}
                                                        className="hover:text-indigo-600 transition-colors truncate max-w-[180px]"
                                                    >
                                                        {mentor.email}
                                                    </a>
                                                </span>
                                                {mentor.phone && (
                                                    <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                        <Phone size={11} className="text-slate-400" />
                                                        {mentor.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Department */}
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1.5 text-slate-600">
                                                <Building2 size={13} className="text-slate-400" />
                                                {mentor.department || "—"}
                                            </span>
                                        </td>

                                        {/* Joining Date */}
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1.5 text-slate-600">
                                                <Calendar size={13} className="text-slate-400" />
                                                {formatDate(mentor.dateOfJoining ?? mentor.joinDate)}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            {mentor.isDisabled ? (
                                                <span className="inline-block bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight border border-red-100">
                                                    Inactive
                                                </span>
                                            ) : (
                                                <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight border border-emerald-100">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 text-right">
                        Showing {filtered.length} of {mentors.length} mentor
                        {mentors.length !== 1 ? "s" : ""}
                    </div>
                </div>
            )}
        </div>
    );
}
