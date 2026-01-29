import { useState, useEffect } from "react";
import axios from "axios";
import {
    Calendar,
    Clock,
    Users,
    ChevronDown,
    ChevronUp,
    Download,
    Filter,
    Search,
} from "lucide-react";
import { formatDate } from "../../utils/dateUtils";

interface Session {
    sessionId: string;
    loginTime: string;
    logoutTime?: string;
    duration: string;
    isActive: boolean;
}

interface AttendanceRecord {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        designation: string;
        profilePhoto?: string;
    };
    date: string;
    sessions: Session[];
    totalWorkingHours: string;
    firstLogin: string;
    lastLogout?: string;
    status: "Present" | "Absent" | "Half Day" | "Leave";
    createdAt: string;
    updatedAt: string;
}

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function Attendance() {
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Get unique users for filter dropdown
    const uniqueUsers = Array.from(
        new Map(attendanceData.map((record) => [record.user._id, record.user])).values()
    );

    useEffect(() => {
        fetchAttendanceData();
    }, []);

    useEffect(() => {
        filterData();
    }, [attendanceData, searchTerm, selectedUser, startDate, endDate, statusFilter]);

    const fetchAttendanceData = async () => {
        try {
            setLoading(true);
            const params: any = {};

            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (selectedUser) params.userId = selectedUser;

            const response = await axios.get(`${API_URL}/api/attendance/report`, {
                params,
            });

            if (response.data.success) {
                setAttendanceData(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching attendance data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let filtered = [...attendanceData];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (record) =>
                    record.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    record.user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter) {
            filtered = filtered.filter((record) => record.status === statusFilter);
        }

        setFilteredData(filtered);
    };

    const toggleRow = (recordId: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(recordId)) {
            newExpandedRows.delete(recordId);
        } else {
            newExpandedRows.add(recordId);
        }
        setExpandedRows(newExpandedRows);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Present":
                return "bg-green-100 text-green-800";
            case "Absent":
                return "bg-red-100 text-red-800";
            case "Half Day":
                return "bg-yellow-100 text-yellow-800";
            case "Leave":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Using global formatDate from utils

    const exportToCSV = () => {
        const headers = [
            "Name",
            "Email",
            "Date",
            "First Login",
            "Last Logout",
            "Total Hours",
            "Sessions",
            "Status",
        ];

        const rows = filteredData.map((record) => [
            record.user.name,
            record.user.email,
            formatDate(record.date),
            record.firstLogin || "-",
            record.lastLogout || "-",
            record.totalWorkingHours,
            record.sessions.length,
            record.status,
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_report_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    const handleApplyFilters = () => {
        fetchAttendanceData();
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedUser("");
        setStartDate("");
        setEndDate("");
        setStatusFilter("");
        fetchAttendanceData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading attendance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
                    <p className="text-gray-600 mt-1">
                        Track and manage employee attendance with detailed session logs
                    </p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* User Filter */}
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Users</option>
                        {uniqueUsers.map((user) => (
                            <option key={user._id} value={user._id}>
                                {user.name}
                            </option>
                        ))}
                    </select>

                    {/* Start Date */}
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* End Date */}
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Status</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Leave">Leave</option>
                    </select>
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleApplyFilters}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Apply Filters
                    </button>
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Records</p>
                            <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Present</p>
                            <p className="text-2xl font-bold text-green-600">
                                {filteredData.filter((r) => r.status === "Present").length}
                            </p>
                        </div>
                        <Calendar className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Half Day</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {filteredData.filter((r) => r.status === "Half Day").length}
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Absent</p>
                            <p className="text-2xl font-bold text-red-600">
                                {filteredData.filter((r) => r.status === "Absent").length}
                            </p>
                        </div>
                        <Calendar className="w-8 h-8 text-red-600" />
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    First Login
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Logout
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Hours
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sessions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No attendance records found
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((record) => (
                                    <>
                                        <tr
                                            key={record._id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        {record.user.profilePhoto ? (
                                                            <img
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                src={`${API_URL}/${record.user.profilePhoto}`}
                                                                alt={record.user.name}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                                                {record.user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {record.user.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {record.user.designation}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(record.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {record.firstLogin || "-"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {record.lastLogout || (
                                                    <span className="text-green-600 font-medium">Active</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {record.totalWorkingHours}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {record.sessions.length} session{record.sessions.length !== 1 ? "s" : ""}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                        record.status
                                                    )}`}
                                                >
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => toggleRow(record._id)}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    {expandedRows.has(record._id) ? (
                                                        <>
                                                            <ChevronUp className="w-4 h-4" />
                                                            Hide
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4" />
                                                            View
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Session Details */}
                                        {expandedRows.has(record._id) && (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-4 bg-gray-50">
                                                    <div className="space-y-2">
                                                        <h4 className="font-semibold text-gray-900 mb-3">
                                                            Session Details
                                                        </h4>
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                            Session #
                                                                        </th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                            Login Time
                                                                        </th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                            Logout Time
                                                                        </th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                            Duration
                                                                        </th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                            Status
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {record.sessions.map((session, index) => (
                                                                        <tr key={session.sessionId}>
                                                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                                                Session {index + 1}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                                                {session.loginTime}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                                                {session.logoutTime || (
                                                                                    <span className="text-green-600 font-medium">
                                                                                        Active
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                                                                {session.duration}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm">
                                                                                {session.isActive ? (
                                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                                        Active
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                                        Completed
                                                                                    </span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
