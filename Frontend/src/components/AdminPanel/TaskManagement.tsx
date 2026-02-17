import { useState, useEffect } from "react";
import { useSessionContext } from "../../context/SessionProvider";
import { useUserContext } from "../../context/UserProvider";
import {
    Plus,
    Search,
    Filter,
    X,
    Edit2,
    Trash2,
    Calendar,
    Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "../../utils/dateUtils";

export default function TaskManagement() {
    const { sessions, loading, fetchSessions, createSession, updateSession, deleteSession } =
        useSessionContext();
    const { users, fetchUsers } = useUserContext();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        user: "",
        date: new Date().toISOString().split("T")[0],
        loginTime: "",
        logoutTime: "",
        status: "Present" as "Present" | "Absent" | "Half Day" | "Leave",
        notes: "",
    });

    useEffect(() => {
        fetchSessions();
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const success = await createSession(formData);
            if (success) {
                setShowAddModal(false);
                setFormData({
                    user: "",
                    date: new Date().toISOString().split("T")[0],
                    loginTime: "",
                    logoutTime: "",
                    status: "Present",
                    notes: "",
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSession) {
            setIsSubmitting(true);
            try {
                const success = await updateSession(selectedSession._id, {
                    loginTime: formData.loginTime,
                    logoutTime: formData.logoutTime,
                    status: formData.status,
                    notes: formData.notes,
                });
                if (success) {
                    setShowEditModal(false);
                    setSelectedSession(null);
                }
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this session?")) {
            await deleteSession(id);
        }
    };

    const openEditModal = (session: any) => {
        setSelectedSession(session);
        setFormData({
            user: session.user._id,
            date: new Date(session.date).toISOString().split("T")[0],
            loginTime: session.loginTime,
            logoutTime: session.logoutTime || "",
            status: session.status,
            notes: session.notes || "",
        });
        setShowEditModal(true);
    };

    const filteredSessions = sessions.filter((session) => {
        // Defensive check: Ensure session and session.user exist
        if (!session || !session.user) return false;

        // Exclude Admin users
        if (session.user.designation === "Admin") return false;

        const matchesSearch = session.user.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || session.status === statusFilter;
        const matchesDate =
            !dateFilter ||
            new Date(session.date).toISOString().split("T")[0] === dateFilter;
        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Present":
                return "bg-green-100 text-green-700";
            case "Absent":
                return "bg-red-100 text-red-700";
            case "Half Day":
                return "bg-orange-100 text-orange-700";
            case "Leave":
                return "bg-blue-100 text-blue-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="text-slate-800 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Task Management</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1">
                        Track user sessions and attendance
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Session
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="Search by user name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                            size={20}
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="">All Status</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Leave">Leave</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <Calendar
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                            size={20}
                        />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                                    Date
                                </th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                                    User
                                </th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                                    Login Time
                                </th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                                    Logout Time
                                </th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                                    Total Hours
                                </th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                                    Status
                                </th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500">
                                        Loading sessions...
                                    </td>
                                </tr>
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500">
                                        No sessions found
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((session) => (
                                    <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6 text-sm text-slate-800">
                                            {formatDate(session.date)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">
                                                    {session.user?.name || "Unknown User"}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {session.user?.designation || "N/A"}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600">
                                            {session.loginTime}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-slate-600">
                                            {session.logoutTime || "-"}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium text-slate-800">
                                            {session.totalHours}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                    session.status
                                                )}`}
                                            >
                                                {session.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(session)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(session._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Session Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-md"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">Add New Session</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        User
                                    </label>
                                    <select
                                        value={formData.user}
                                        onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select User</option>
                                        {users
                                            .filter((u) => u.designation !== "Admin")
                                            .map((user) => (
                                                <option key={user._id} value={user._id}>
                                                    {user.name} - {user.designation}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Login Time
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.loginTime}
                                            onChange={(e) =>
                                                setFormData({ ...formData, loginTime: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Logout Time
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.logoutTime}
                                            onChange={(e) =>
                                                setFormData({ ...formData, logoutTime: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as any,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Half Day">Half Day</option>
                                        <option value="Leave">Leave</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Add any notes..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                        {isSubmitting ? "Adding..." : "Add Session"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Session Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-md"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">Edit Session</h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            <form onSubmit={handleEdit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Login Time
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.loginTime}
                                            onChange={(e) =>
                                                setFormData({ ...formData, loginTime: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Logout Time
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.logoutTime}
                                            onChange={(e) =>
                                                setFormData({ ...formData, logoutTime: e.target.value })
                                            }
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as any,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Half Day">Half Day</option>
                                        <option value="Leave">Leave</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Add any notes..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                        {isSubmitting ? "Updating..." : "Update Session"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
