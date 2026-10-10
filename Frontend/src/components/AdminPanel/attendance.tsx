import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Calendar,
    Clock,
    Users,
    ChevronDown,
    ChevronUp,
    Mail,
    Send,
    Eye,
    X,
    Loader2,
    Filter,
    Search,
    Smartphone,
    Monitor,
} from "lucide-react";
import { formatDate, formatTime } from "../../utils/dateUtils";
import { getImageUrl } from "../../utils/imageUtils";
import Toast from "../RecruiterPanel/Toast";
import { useAuth } from "../../context/AuthProvider";

interface Session {
    sessionId: string;
    loginTime: string;
    logoutTime?: string;
    duration: string;
    isActive: boolean;
    deviceType?: "Phone" | "System";
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
const ATTENDANCE_SENDER_EMAIL = import.meta.env.VITE_ATTENDANCE_SENDER_EMAIL || "";
const ATTENDANCE_DEFAULT_RECEIVER_EMAIL = import.meta.env.VITE_ATTENDANCE_DEFAULT_RECEIVER_EMAIL || "";
type AttendanceStatus = AttendanceRecord["status"] | "";
type QuickDateFilter = "thisMonth" | "lastMonth" | null;

interface AttendanceFilters {
    searchTerm: string;
    selectedUser: string;
    selectedRole: string;
    startDate: string;
    endDate: string;
    statusFilter: AttendanceStatus;
}

const formatLocalDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getQuickDateRange = (filter: Exclude<QuickDateFilter, null>) => {
    const today = new Date();

    if (filter === "thisMonth") {
        return {
            startDate: formatLocalDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
            endDate: formatLocalDateInput(today),
        };
    }

    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    return {
        startDate: formatLocalDateInput(previousMonth),
        endDate: formatLocalDateInput(previousMonthEnd),
    };
};

const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        return hours * 60 + minutes;
    }
    return 0;
};

export default function Attendance() {
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState<AttendanceStatus>("");
    const [activeQuickDateFilter, setActiveQuickDateFilter] = useState<QuickDateFilter>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);

    const { user } = useAuth();
    const senderName = user?.name || "Jobs Territory";
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [receiverName, setReceiverName] = useState("Admin");
    const [receiverEmail, setReceiverEmail] = useState(ATTENDANCE_DEFAULT_RECEIVER_EMAIL);
    const [emailSubject, setEmailSubject] = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSentStatus, setEmailSentStatus] = useState<"idle" | "sending" | "sent">("idle");
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Get unique users for filter dropdown
    const uniqueUsers = useMemo(
        () => Array.from(new Map(attendanceData.map((record) => [record.user._id, record.user])).values()),
        [attendanceData]
    );

    const uniqueRoles = useMemo(() => availableRoles, [availableRoles]);

    const currentFilters = useMemo<AttendanceFilters>(
        () => ({
            searchTerm,
            selectedUser,
            selectedRole,
            startDate,
            endDate,
            statusFilter,
        }),
        [endDate, searchTerm, selectedRole, selectedUser, startDate, statusFilter]
    );

    const serverFilters = useMemo<AttendanceFilters>(
        () => ({
            searchTerm: "",
            selectedUser,
            selectedRole,
            startDate,
            endDate,
            statusFilter: "",
        }),
        [endDate, selectedRole, selectedUser, startDate]
    );

    const fetchAttendanceData = useCallback(async (filters: AttendanceFilters) => {
        try {
            setLoading(true);
            setErrorMessage("");
            const params: Record<string, string> = {};

            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.selectedUser) params.userId = filters.selectedUser;
            if (filters.selectedRole) params.designation = filters.selectedRole;

            const response = await axios.get(`${API_URL}/api/attendance/report`, {
                params,
            });

            if (response.data.success) {
                const records: AttendanceRecord[] = response.data.data;
                setAttendanceData(records);
                setAvailableRoles((currentRoles) =>
                    Array.from(
                        new Set([
                            ...currentRoles,
                            ...records
                                .map((record) => record.user.designation)
                                .filter((designation): designation is string => Boolean(designation)),
                        ])
                    ).sort((a, b) => a.localeCompare(b))
                );
            } else {
                setErrorMessage(response.data.message || "Unable to fetch attendance data.");
            }
        } catch (error) {
            console.error("Error fetching attendance data:", error);
            setErrorMessage("Unable to fetch attendance data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    const filterData = () => {
        let filtered = [...attendanceData];
        const normalizedSearch = searchTerm.trim().toLowerCase();

        // Search filter
        if (normalizedSearch) {
            filtered = filtered.filter(
                (record) =>
                    record.user.name.toLowerCase().includes(normalizedSearch) ||
                    record.user.email.toLowerCase().includes(normalizedSearch) ||
                    record.user.designation.toLowerCase().includes(normalizedSearch)
            );
        }

        // Role filter safeguard; backend also applies this.
        if (selectedRole) {
            filtered = filtered.filter((record) => record.user.designation === selectedRole);
        }

        // Status filter
        if (statusFilter) {
            filtered = filtered.filter((record) => record.status === statusFilter);
        }

        setFilteredData(filtered);
    };

    useEffect(() => {
        fetchAttendanceData(serverFilters);
    }, [serverFilters, fetchAttendanceData]);

    useEffect(() => {
        filterData();
    }, [attendanceData, searchTerm, selectedRole, statusFilter]);

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

    const getMonthName = (monthIndex: number) => {
        const stdMonths = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        return stdMonths[monthIndex];
    };

    const generateDefaultSubject = (start: string, end: string) => {
        if (start && end) {
            const sDate = new Date(start);
            const eDate = new Date(end);
            const isStartOfFirst = sDate.getDate() === 1;
            const lastDayOfMonth = new Date(eDate.getFullYear(), eDate.getMonth() + 1, 0).getDate();
            const isEndOfMonth = eDate.getDate() === lastDayOfMonth;
            const isSameMonth = sDate.getMonth() === eDate.getMonth() && sDate.getFullYear() === eDate.getFullYear();

            if (isStartOfFirst && isEndOfMonth && isSameMonth) {
                return `Monthly Attendance Report – ${getMonthName(sDate.getMonth())} ${sDate.getFullYear()}`;
            } else {
                const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const startDay = String(sDate.getDate()).padStart(2, "0");
                const startMonth = months[sDate.getMonth()];
                const startYear = sDate.getFullYear();
                const endDay = String(eDate.getDate()).padStart(2, "0");
                const endMonth = months[eDate.getMonth()];
                const endYear = eDate.getFullYear();
                return `Attendance Report – ${startDay} ${startMonth} ${startYear} to ${endDay} ${endMonth} ${endYear}`;
            }
        } else {
            const today = new Date();
            return `Monthly Attendance Report – ${getMonthName(today.getMonth())} ${today.getFullYear()}`;
        }
    };

    const handleOpenEmailModal = () => {
        const defaultSubject = generateDefaultSubject(startDate, endDate);
        setEmailSubject(defaultSubject);
        setEmailSentStatus("idle");
        setErrorMessage("");
        setEmailModalOpen(true);
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receiverEmail.trim()) {
            setErrorMessage("Receiver email is required.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(receiverEmail.trim())) {
            setErrorMessage("Please enter a valid receiver email address.");
            return;
        }

        try {
            setSendingEmail(true);
            setEmailSentStatus("sending");
            setErrorMessage("");

            const userIds = selectedUser ? [selectedUser] : [];
            const filters = {
                searchTerm,
                statusFilter
            };

            const payload = {
                receiverName: receiverName.trim(),
                receiverEmail: receiverEmail.trim(),
                subject: emailSubject.trim(),
                startDate,
                endDate,
                role: selectedRole || "all",
                userIds,
                filters
            };

            const response = await axios.post(`${API_URL}/api/attendance/send-report-email`, payload);

            if (response.data.success) {
                setEmailSentStatus("sent");
                setToast({ message: "Attendance report email sent successfully!", type: "success" });
                setTimeout(() => {
                    setEmailModalOpen(false);
                    setReceiverEmail(ATTENDANCE_DEFAULT_RECEIVER_EMAIL);
                    setReceiverName("Admin");
                }, 1000);
            } else {
                setErrorMessage(response.data.message || "Failed to send email.");
                setEmailSentStatus("idle");
            }
        } catch (error: any) {
            console.error("Error sending email:", error);
            const msg = error.response?.data?.message || "Failed to send email. Please try again.";
            setErrorMessage(msg);
            setEmailSentStatus("idle");
        } finally {
            setSendingEmail(false);
        }
    };

    const localStats = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        let summaryRecords = [...attendanceData];

        if (normalizedSearch) {
            summaryRecords = summaryRecords.filter(
                (record) =>
                    record.user.name.toLowerCase().includes(normalizedSearch) ||
                    record.user.email.toLowerCase().includes(normalizedSearch) ||
                    record.user.designation.toLowerCase().includes(normalizedSearch)
            );
        }

        if (selectedRole) {
            summaryRecords = summaryRecords.filter((record) => record.user.designation === selectedRole);
        }

        if (summaryRecords.length === 0) {
            return {
                reportingPeriod: "N/A",
                totalEmployees: 0,
                employeesWithAttendance: 0,
                totalWorkingDays: 0,
                averageAttendance: 0,
                totalWorkingHours: "0h 00m",
                employeeSummaries: []
            };
        }

        const getDateOnly = (dateValue: string | Date) => {
            const date = new Date(dateValue);
            if (Number.isNaN(date.getTime())) return null;
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        };

        const getInputDateOnly = (dateValue: string) => {
            if (!dateValue) return null;
            const [year, month, day] = dateValue.split("-").map(Number);
            if (!year || !month || !day) return getDateOnly(dateValue);
            return new Date(year, month - 1, day);
        };

        const isSunday = (dateValue: string | Date) => {
            const date = getDateOnly(dateValue);
            return date ? date.getDay() === 0 : false;
        };

        const countWorkingDaysExcludingSundays = (start: Date | null, end: Date | null) => {
            if (!start || !end || start > end) return 0;
            let workingDays = 0;
            const cursor = new Date(start);
            while (cursor <= end) {
                if (cursor.getDay() !== 0) {
                    workingDays++;
                }
                cursor.setDate(cursor.getDate() + 1);
            }
            return workingDays;
        };

        const userMap: Record<string, { user: any; records: AttendanceRecord[] }> = {};
        summaryRecords.forEach(record => {
            const userId = record.user._id;
            if (!userMap[userId]) {
                userMap[userId] = {
                    user: record.user,
                    records: []
                };
            }
            userMap[userId].records.push(record);
        });

        const sortedRecords = [...summaryRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const periodStartDate = startDate
            ? getInputDateOnly(startDate)
            : sortedRecords.length > 0
                ? getDateOnly(sortedRecords[0].date)
                : null;
        const periodEndDate = endDate
            ? getInputDateOnly(endDate)
            : sortedRecords.length > 0
                ? getDateOnly(sortedRecords[sortedRecords.length - 1].date)
                : null;
        const totalWorkingDaysCount = countWorkingDaysExcludingSundays(periodStartDate, periodEndDate);

        const summaries = Object.values(userMap).map(({ user, records }) => {
            const nonSundayRecords = records.filter((record) => !isSunday(record.date));
            const workingDays = totalWorkingDaysCount;
            let presentDays = 0;
            let halfDays = 0;
            let totalLoginSessions = 0;
            let totalWorkedMinutes = 0;

            nonSundayRecords.forEach(record => {
                if (record.status === "Present") {
                    presentDays++;
                } else if (record.status === "Half Day") {
                    halfDays++;
                }

                totalLoginSessions += record.sessions ? record.sessions.length : 0;

                let dayMinutes = 0;
                if (record.sessions) {
                    record.sessions.forEach(session => {
                        if (session.loginTime && session.logoutTime && !session.isActive) {
                            const loginMin = parseTimeToMinutes(session.loginTime);
                            const logoutMin = parseTimeToMinutes(session.logoutTime);
                            if (logoutMin > loginMin) {
                                dayMinutes += (logoutMin - loginMin);
                            }
                        }
                    });
                }
                totalWorkedMinutes += dayMinutes;
            });

            const totalDaysWorked = presentDays + halfDays;
            const absentDays = Math.max(0, totalWorkingDaysCount - presentDays - halfDays);
            const averageMinutesPerPresentDay = totalDaysWorked > 0
                ? Math.round(totalWorkedMinutes / totalDaysWorked)
                : 0;

            return {
                user,
                records,
                workingDays,
                totalDaysWorked,
                presentDays,
                absentDays,
                halfDays,
                totalLoginSessions,
                totalWorkedMinutes,
                averageMinutesPerPresentDay
            };
        });

        const totalEmployeesCount = uniqueUsers.length;
        const employeesWithAttendanceCount = Object.keys(userMap).length;

        const overallTotalMinutes = summaries.reduce((sum, emp) => sum + emp.totalWorkedMinutes, 0);
        const totalWorkingHoursStr = `${Math.floor(overallTotalMinutes / 60).toLocaleString()} hrs`;

        let totalEmployeePresentDays = 0;
        let totalEmployeeWorkingDays = 0;
        summaries.forEach(emp => {
            totalEmployeePresentDays += emp.presentDays + (emp.halfDays * 0.5);
            totalEmployeeWorkingDays += emp.workingDays;
        });
        const avgAttendancePercent = totalEmployeeWorkingDays > 0
            ? Math.round((totalEmployeePresentDays / totalEmployeeWorkingDays) * 100)
            : 0;

        const formatPeriodDate = (dStr: string) => {
            if (!dStr) return "";
            const date = new Date(dStr);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`;
        };

        let reportingPeriod = "N/A";
        if (startDate && endDate) {
            reportingPeriod = `${formatPeriodDate(startDate)} – ${formatPeriodDate(endDate)}`;
        } else if (filteredData.length > 0) {
            const sortedTemp = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            reportingPeriod = `${formatPeriodDate(sortedTemp[0].date)} – ${formatPeriodDate(sortedTemp[sortedTemp.length - 1].date)}`;
        }

        return {
            reportingPeriod,
            totalEmployees: totalEmployeesCount,
            employeesWithAttendance: employeesWithAttendanceCount,
            totalWorkingDays: totalWorkingDaysCount,
            averageAttendance: avgAttendancePercent,
            totalWorkingHours: totalWorkingHoursStr,
            employeeSummaries: summaries
        };
    }, [attendanceData, endDate, searchTerm, selectedRole, startDate, uniqueUsers]);

    const handleApplyFilters = () => {
        fetchAttendanceData(currentFilters);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSelectedUser("");
        setSelectedRole("");
        setStartDate("");
        setEndDate("");
        setStatusFilter("");
        setActiveQuickDateFilter(null);
    };

    const handleQuickDateFilter = (filter: Exclude<QuickDateFilter, null>) => {
        const range = getQuickDateRange(filter);

        setStartDate(range.startDate);
        setEndDate(range.endDate);
        setActiveQuickDateFilter(filter);
    };

    const handleDateChange = (field: "startDate" | "endDate", value: string) => {
        setActiveQuickDateFilter(null);
        if (field === "startDate") {
            setStartDate(value);
            return;
        }
        setEndDate(value);
    };

    return (
        <div className="w-full max-w-full space-y-4 sm:space-y-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Attendance Management</h1>
                    <p className="mt-1 text-sm text-gray-600 sm:text-base">
                        Track and manage employee attendance with detailed session logs
                    </p>
                </div>
                <button
                    onClick={handleOpenEmailModal}
                    disabled={filteredData.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 sm:w-auto"
                >
                    <Mail className="w-4 h-4" />
                    Send Email
                </button>
            </div>

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {errorMessage}
                </div>
            )}

            {/* Filters */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
                    {/* Search */}
                    <div className="relative min-w-0 sm:col-span-2 xl:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full min-w-0 rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* User Filter */}
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Users</option>
                        {uniqueUsers.map((user) => (
                            <option key={user._id} value={user._id}>
                                {user.name}
                            </option>
                        ))}
                    </select>

                    {/* Role Filter */}
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Roles</option>
                        {uniqueRoles.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>

                    {/* Start Date */}
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleDateChange("startDate", e.target.value)}
                        className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />

                    {/* End Date */}
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleDateChange("endDate", e.target.value)}
                        className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus)}
                        className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Leave">Leave</option>
                    </select>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <button
                        onClick={() => handleQuickDateFilter("thisMonth")}
                        className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors sm:w-auto sm:py-1.5 ${
                            activeQuickDateFilter === "thisMonth"
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => handleQuickDateFilter("lastMonth")}
                        className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors sm:w-auto sm:py-1.5 ${
                            activeQuickDateFilter === "lastMonth"
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        Last Month
                    </button>
                    <button
                        onClick={handleApplyFilters}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto"
                    >
                        Apply Filters
                    </button>
                    <button
                        onClick={handleClearFilters}
                        className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 sm:w-auto"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-sm text-gray-600">Total Records</p>
                            <p className="text-xl font-bold text-gray-900 sm:text-2xl">{filteredData.length}</p>
                        </div>
                        <Users className="h-7 w-7 flex-shrink-0 text-blue-600 sm:h-8 sm:w-8" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-sm text-gray-600">Present</p>
                            <p className="text-xl font-bold text-green-600 sm:text-2xl">
                                {filteredData.filter((r) => r.status === "Present").length}
                            </p>
                        </div>
                        <Calendar className="h-7 w-7 flex-shrink-0 text-green-600 sm:h-8 sm:w-8" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-sm text-gray-600">Half Day</p>
                            <p className="text-xl font-bold text-yellow-600 sm:text-2xl">
                                {filteredData.filter((r) => r.status === "Half Day").length}
                            </p>
                        </div>
                        <Clock className="h-7 w-7 flex-shrink-0 text-yellow-600 sm:h-8 sm:w-8" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-sm text-gray-600">Absent</p>
                            <p className="text-xl font-bold text-red-600 sm:text-2xl">
                                {filteredData.filter((r) => r.status === "Absent").length}
                            </p>
                        </div>
                        <Calendar className="h-7 w-7 flex-shrink-0 text-red-600 sm:h-8 sm:w-8" />
                    </div>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                {loading && filteredData.length > 0 && (
                    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] flex items-start justify-center pt-20">
                        <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white px-4 py-3 shadow-sm">
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            <span className="text-sm font-medium text-gray-700">Refreshing attendance list...</span>
                        </div>
                    </div>
                )}
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[860px] lg:min-w-[1000px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                                    Employee
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                                    Date
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                                    First Login
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                                    Last Logout
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                                    Total Hours
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                                    Sessions
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                                    Status
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Loading attendance list...</p>
                                                <p className="text-xs text-gray-500 mt-1">Please wait while records are fetched.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No attendance records found
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((record) => (
                                    <Fragment key={record._id}>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        {record.user.profilePhoto ? (
                                                            <img
                                                                className="h-10 w-10 rounded-full object-cover"
                                                                src={getImageUrl(record.user.profilePhoto)}
                                                                alt={record.user.name}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                                                {record.user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-3 min-w-0 sm:ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {record.user.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {record.user.designation}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:px-6">
                                                {formatDate(record.date)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:px-6">
                                                {formatTime(record.firstLogin)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:px-6">
                                                {record.lastLogout ? formatTime(record.lastLogout) : (
                                                    <span className="text-green-600 font-medium">Active</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 sm:px-6">
                                                {record.totalWorkingHours}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:px-6">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {record.sessions.length} session{record.sessions.length !== 1 ? "s" : ""}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                        record.status
                                                    )}`}
                                                >
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:px-6">
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
                                                <td colSpan={8} className="bg-gray-50 px-0 py-4 sm:px-6">
                                                    <div className="space-y-2">
                                                        <h4 className="font-semibold text-gray-900 mb-3 px-4 sm:px-0">
                                                            Session Details
                                                        </h4>
                                                        <div className="w-full overflow-x-auto">
                                                            <table className="min-w-[620px] divide-y divide-gray-200">
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
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                                            Device
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
                                                                                {formatTime(session.loginTime)}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                                                {session.logoutTime ? formatTime(session.logoutTime) : (
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
                                                                            <td className="px-4 py-2 text-sm">
                                                                                <div className="flex items-center gap-2 text-gray-600">
                                                                                    {session.deviceType === "Phone" ? (
                                                                                        <>
                                                                                            <Smartphone className="w-4 h-4 text-orange-500" />
                                                                                            <span className="text-xs font-medium">Phone</span>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <Monitor className="w-4 h-4 text-blue-500" />
                                                                                            <span className="text-xs font-medium">System</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
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
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Email Modal */}
            {emailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-2 backdrop-blur-sm sm:p-4 lg:items-center">
                    <div className="my-2 flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl sm:my-8 sm:max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-4 text-white sm:px-6">
                            <div className="flex min-w-0 items-center gap-2">
                                <Mail className="h-5 w-5 flex-shrink-0 text-blue-400" />
                                <h3 className="truncate text-base font-bold sm:text-lg">Send Attendance Report Email</h3>
                            </div>
                            <button
                                onClick={() => setEmailModalOpen(false)}
                                className="flex-shrink-0 text-slate-400 transition-colors hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex min-h-0 flex-grow flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
                            {/* Left Side: Form & Settings */}
                            <form onSubmit={handleSendEmail} className="w-full flex-shrink-0 space-y-5 border-gray-200 p-4 sm:p-6 lg:w-1/2 lg:overflow-y-auto lg:border-r">
                                {errorMessage && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                                        {errorMessage}
                                    </div>
                                )}

                                {/* Sender Details */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-700 border-b border-gray-100 pb-1 uppercase tracking-wider">Sender Details</h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Sender Name</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={senderName}
                                                className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Sender Email</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={ATTENDANCE_SENDER_EMAIL}
                                                className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Receiver Details */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-700 border-b border-gray-100 pb-1 uppercase tracking-wider">Receiver Details</h4>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Receiver Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Admin"
                                                value={receiverName}
                                                onChange={(e) => setReceiverName(e.target.value)}
                                                className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Receiver Email <span className="text-red-500">*</span></label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="e.g. receiver@example.com"
                                                value={receiverEmail}
                                                onChange={(e) => setReceiverEmail(e.target.value)}
                                                className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Report Parameters & Subject */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-700 border-b border-gray-100 pb-1 uppercase tracking-wider">Report Details</h4>
                                    
                                    <div className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm sm:grid-cols-2">
                                        <div>
                                            <span className="text-xs text-gray-500 block">Report Month / Period</span>
                                            <span className="font-semibold text-slate-800">{localStats.reportingPeriod}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">Selected Role</span>
                                            <span className="font-semibold text-slate-800">{selectedRole || "All Roles"}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">Employees Included</span>
                                            <span className="font-semibold text-slate-800">{localStats.employeesWithAttendance} / {localStats.totalEmployees}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">Working Days</span>
                                            <span className="font-semibold text-slate-800">{localStats.totalWorkingDays} days</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Email Subject</label>
                                        <input
                                            type="text"
                                            value={emailSubject}
                                            onChange={(e) => setEmailSubject(e.target.value)}
                                            className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Modal Controls */}
                                <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:flex lg:flex-wrap">
                                    <button
                                        type="submit"
                                        disabled={sendingEmail || emailSentStatus === "sent"}
                                        className="flex min-w-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 lg:flex-1"
                                    >
                                        {emailSentStatus === "sending" ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin font-semibold mr-1" />
                                                Sending...
                                            </>
                                        ) : emailSentStatus === "sent" ? (
                                            <>
                                                <Send className="w-4 h-4 mr-1" />
                                                Email Sent
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-1" />
                                                Send Email
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="flex min-w-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 transition-all hover:bg-slate-200 lg:hidden"
                                    >
                                        <Eye className="w-4 h-4" />
                                        {showPreview ? "Hide Preview" : "Preview Email"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setEmailModalOpen(false)}
                                        className="rounded-lg bg-gray-200 px-4 py-2.5 font-semibold text-gray-700 transition-all hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>

                            {/* Right Side: Preview Pane (Visible on lg or if showPreview is true) */}
                            <div className={`w-full bg-slate-100 p-4 sm:p-6 lg:w-1/2 lg:flex-col lg:overflow-hidden ${showPreview ? 'flex flex-col' : 'hidden lg:flex'}`}>
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3 flex-shrink-0">
                                    <h4 className="flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 sm:text-sm">
                                        <Eye className="w-4 h-4 text-blue-600" />
                                        <span className="truncate">Email Design Live Preview</span>
                                    </h4>
                                    <span className="ml-2 flex-shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">Responsive View</span>
                                </div>

                                {/* Preview Wrapper simulating an email client view */}
                                <div className="min-h-[360px] flex-grow overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-800 shadow-inner sm:p-4">
                                    <div className="border border-slate-100 rounded overflow-hidden max-w-[650px] mx-auto bg-white">
                                        {/* Sim Header */}
                                        <div className="bg-[#1e3a8a] text-white p-4 text-center border-b-4 border-blue-600">
                                            <h2 className="text-lg font-bold m-0 tracking-wide">Jobs Territory</h2>
                                            <p className="text-blue-300 text-xs m-1">Attendance Management System</p>
                                        </div>

                                        {/* Sim Content */}
                                        <div className="p-4 space-y-4 leading-relaxed text-xs sm:text-sm">
                                            <p>Hello {receiverName || "Admin"},</p>
                                            <p>Please find below the attendance summary for <strong>{localStats.reportingPeriod}</strong>.</p>

                                            {/* Overall Stats Table */}
                                            <h5 className="text-[#1e3a8a] font-bold border-b border-gray-200 pb-1 mb-2 mt-4 text-sm">Overall Summary</h5>
                                            <table className="w-full border-collapse border border-gray-200 text-xs text-left mb-4">
                                                <tbody>
                                                    <tr>
                                                        <td className="p-2 border border-gray-200 font-semibold bg-slate-50 w-2/5">Reporting Period</td>
                                                        <td className="p-2 border border-gray-200">{localStats.reportingPeriod}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-2 border border-gray-200 font-semibold bg-slate-50">Total Employees</td>
                                                        <td className="p-2 border border-gray-200">{localStats.totalEmployees}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-2 border border-gray-200 font-semibold bg-slate-50">Employees with Attendance</td>
                                                        <td className="p-2 border border-gray-200">{localStats.employeesWithAttendance}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-2 border border-gray-200 font-semibold bg-slate-50">Scheduled Workdays</td>
                                                        <td className="p-2 border border-gray-200">{localStats.totalWorkingDays}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-2 border border-gray-200 font-semibold bg-slate-50">Average Attendance</td>
                                                        <td className="p-2 border border-gray-200 font-bold text-green-600">{localStats.averageAttendance}%</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-2 border border-gray-200 font-semibold bg-slate-50">Total Working Hours</td>
                                                        <td className="p-2 border border-gray-200 font-bold">{localStats.totalWorkingHours}</td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            {/* Employee Summary Table */}
                                            <h5 className="text-[#1e3a8a] font-bold border-b border-gray-200 pb-1 mb-2 mt-6 text-sm">Employee Summary</h5>
                                            <div className="overflow-x-auto w-full border border-gray-200 rounded mb-4">
                                                <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                                                    <thead>
                                                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-gray-200">
                                                            <th className="p-2">Employee</th>
                                                            <th className="p-2">Role</th>
                                                            <th className="p-2 text-right">Scheduled Workdays</th>
                                                            <th className="p-2 text-right">Attended Days</th>
                                                            <th className="p-2 text-right">Present Days</th>
                                                            <th className="p-2 text-right">Half Days</th>
                                                            <th className="p-2 text-right">Absent Days</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {localStats.employeeSummaries.map((emp: any) => (
                                                            <tr key={emp.user._id}>
                                                                <td className="p-2 font-medium">{emp.user.name}</td>
                                                                <td className="p-2 text-slate-500">{emp.user.designation}</td>
                                                                <td className="p-2 text-right">{emp.workingDays}</td>
                                                                <td className="p-2 text-right font-semibold text-slate-800">{emp.totalDaysWorked}</td>
                                                                <td className="p-2 text-right text-green-600 font-semibold">{emp.presentDays}</td>
                                                                <td className="p-2 text-right text-blue-600 font-semibold">{emp.halfDays}</td>
                                                                <td className="p-2 text-right text-red-500 font-semibold">{emp.absentDays}</td>
                                                            </tr>
                                                        ))}
                                                        {localStats.employeeSummaries.length === 0 && (
                                                            <tr>
                                                                <td colSpan={7} className="p-3 text-center text-gray-400">No data</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Detailed User Section */}
                                            <h5 className="text-[#1e3a8a] font-bold border-b border-gray-200 pb-1 mb-2 mt-6 text-sm">Detailed User Attendance Logs</h5>
                                            <div className="space-y-4">
                                                {localStats.employeeSummaries.map((emp: any) => (
                                                    <div key={emp.user._id} className="bg-slate-50 border border-gray-200 rounded p-3">
                                                        <div className="border-b border-gray-300 pb-1 mb-2">
                                                            <strong className="text-[#1e3a8a] text-xs">{emp.user.name}</strong>
                                                            <span className="text-slate-400 text-[10px] ml-2 font-medium">({emp.user.designation})</span>
                                                        </div>
                                                        <table className="w-full text-[10px] border-collapse text-left">
                                                            <thead>
                                                                <tr className="text-slate-500 font-medium border-b border-gray-200">
                                                                    <th className="p-1">Date</th>
                                                                    <th className="p-1 text-center">First Login</th>
                                                                    <th className="p-1 text-center">Last Logout</th>
                                                                    <th className="p-1 text-right">Worked</th>
                                                                    <th className="p-1 text-center">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-100">
                                                                {emp.records.slice(0, 3).map((rec: any) => {
                                                                    const date = new Date(rec.date);
                                                                    const dateStr = `${String(date.getDate()).padStart(2, "0")} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()]}`;
                                                                    let recordMin = 0;
                                                                    if (rec.sessions) {
                                                                        rec.sessions.forEach((s: any) => {
                                                                            if (s.loginTime && s.logoutTime && !s.isActive) {
                                                                                const loginMin = parseTimeToMinutes(s.loginTime);
                                                                                const logoutMin = parseTimeToMinutes(s.logoutTime);
                                                                                if (logoutMin > loginMin) {
                                                                                    recordMin += (logoutMin - loginMin);
                                                                                }
                                                                            }
                                                                        });
                                                                    }
                                                                    return (
                                                                        <tr key={rec._id}>
                                                                            <td className="p-1">{dateStr}</td>
                                                                            <td className="p-1 text-center">{rec.firstLogin || "-"}</td>
                                                                            <td className="p-1 text-center">{rec.lastLogout || "-"}</td>
                                                                            <td className="p-1 text-right font-semibold">{Math.floor(recordMin / 60)}h {String(recordMin % 60).padStart(2, "0")}m</td>
                                                                            <td className="p-1 text-center font-bold text-blue-600">{rec.status}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                {emp.records.length > 3 && (
                                                                    <tr>
                                                                        <td colSpan={5} className="p-1 text-center text-slate-400 italic">
                                                                            + {emp.records.length - 3} more daily logs
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sim Footer */}
                                        <div className="bg-slate-50 p-3 border-t border-gray-200 text-center text-[10px] text-slate-400">
                                            <p className="m-0">This is an automated attendance report. Do not reply directly to this email.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success/Error Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
