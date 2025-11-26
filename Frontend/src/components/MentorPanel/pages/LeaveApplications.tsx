import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle, XCircle, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useUserContext } from "../../../context/UserProvider";
import { useAuth } from "../../../context/AuthProvider";

export default function MentorLeaveApplications() {
  const { leaves, fetchAllLeaves, updateLeaveStatus, applyLeave, users } =
    useUserContext();
  const { user } = useAuth();

  const [userLeaves, setUserLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState("team"); // "team" or "mine"

  // Apply modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    user: user?._id || "",
    leaveType: "Sick Leave",
    fromDate: "",
    toDate: "",
    reason: "",
    reporter: user?.reporter?._id || "",
  });

  const leaveTypes = [
    "Sick Leave",
    "Casual Leave",
    "Earned Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Unpaid Leave",
  ];

  useEffect(() => {
    fetchAllLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --------------------------------
  // Filter Leaves
  // --------------------------------
  useEffect(() => {
    if (!leaves || !users || !user) return;

    // Step 1: Direct reportees
    const directReportees = users.filter((u) => u?.reporter?._id === user._id);
    let allReporteeIds = directReportees.map((u) => u._id);

    // Step 2: Manager → include recruiters (2nd-level)
    if (user.designation === "Manager") {
      directReportees.forEach((mentor) => {
        const mentorReportees = users.filter(
          (u) => u?.reporter?._id === mentor._id
        );
        allReporteeIds = [
          ...allReporteeIds,
          ...mentorReportees.map((u) => u._id),
        ];
      });
    }

    // Step 3: Only user's own leaves
    const userOwnLeaves = leaves.filter(
      (leave) => leave.user?._id === user._id
    );

    // Step 4: If Admin → show ALL leaves
    let reporteesLeaves;

    if (user.designation === "Admin") {
      reporteesLeaves = leaves; // ADMIN CAN SEE ALL
    } else {
      reporteesLeaves = leaves.filter((leave) =>
        allReporteeIds.includes(leave.user?._id)
      );
    }

    setUserLeaves(userOwnLeaves);
    setFilteredLeaves(reporteesLeaves);
  }, [leaves, users, user]);

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  // --------------------------------
  // Count Boxes (Dynamic)
  // --------------------------------
  const pendingCount = filteredLeaves.filter(
    (l) => l.status === "Pending"
  ).length;
  const approvedCount = filteredLeaves.filter(
    (l) => l.status === "Approved"
  ).length;
  const rejectedCount = filteredLeaves.filter(
    (l) => l.status === "Rejected"
  ).length;

  // Active list based on tab
  const displayList = activeTab === "team" ? filteredLeaves : userLeaves;

  // -----------------------
  // Apply Leave handlers
  // -----------------------
  const resetForm = () =>
    setFormData({
      user: user?._id || "",
      leaveType: "Sick Leave",
      fromDate: "",
      toDate: "",
      reason: "",
      reporter: user?.reporter?._id || "",
    });

  const submitLeave = async (e) => {
    e.preventDefault();

    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      setToast({
        message: "End date cannot be before start date",
        type: "error",
      });
      return;
    }

    try {
      const success = await applyLeave(formData);
      if (success) {
        setToast({ message: "Leave applied successfully", type: "success" });
        setIsModalOpen(false);
        resetForm();
        await fetchAllLeaves();
      } else {
        setToast({ message: "Failed to apply leave", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to apply leave", type: "error" });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-amber-100 text-amber-700",
      Approved: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Leave Management
          </h1>
          <p className="text-slate-600">View and manage leave applications</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("team")}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === "team"
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-slate-700"
              }`}
          >
            Team
          </button>

          {user.designation !== "Admin" && (
            <button
              onClick={() => setActiveTab("mine")}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === "mine"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-700"
                }`}
            >
              My Leaves
            </button>
          )}

          {user.designation !== "Admin" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2"
            >
              <Plus size={16} /> Apply Leave
            </button>
          )}
        </div>
      </div>

      {/* Summary Boxes */}
      {activeTab === "team" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {pendingCount}
                </p>
                <p className="text-sm text-slate-600">Pending Requests</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {approvedCount}
                </p>
                <p className="text-sm text-slate-600">Approved</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {rejectedCount}
                </p>
                <p className="text-sm text-slate-600">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications list */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            {user.designation === "Admin"
              ? "All Leave Applications"
              : activeTab === "mine"
                ? "My Leave Requests"
                : "Team Leave Applications"}
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {displayList.length === 0 && (
            <p className="text-center text-slate-600 py-6">No leaves found.</p>
          )}

          {displayList.map((application, index) => {
            const days = calculateDays(
              application.fromDate,
              application.toDate
            );
            const statusColor = getStatusColor(application.status);

            return (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {application.user?.name?.charAt(0)}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 mb-1">
                        {application.user?.name}
                      </h3>
                      <p className="text-sm text-slate-500 mb-2">
                        {application.user?.designation || "No Designation"}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <span className="font-medium">
                          {application.leaveType}
                        </span>

                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> {days} days
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>{application.fromDate?.split("T")[0]}</span>
                        <span>→</span>
                        <span>{application.toDate?.split("T")[0]}</span>
                      </div>
                    </div>
                  </div>
                  {activeTab === "mine" && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}
                    >
                      {application.status}
                    </span>
                  )}

                  {/* Approve/Reject only for Team Leaves */}
                  {activeTab === "team" && (
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}
                      >
                        {application.status}
                      </span>

                      {application.status === "Pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              await updateLeaveStatus(
                                application._id,
                                "Approved",
                                user._id
                              );
                              await fetchAllLeaves();
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Approve
                          </button>

                          <button
                            onClick={async () => {
                              await updateLeaveStatus(
                                application._id,
                                "Rejected",
                                user._id
                              );
                              await fetchAllLeaves();
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50">
                <h2 className="text-2xl font-bold text-slate-800">
                  Apply for Leave
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={submitLeave} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Leave Type
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) =>
                      setFormData({ ...formData, leaveType: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                    required
                  >
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={formData.fromDate}
                      onChange={(e) =>
                        setFormData({ ...formData, fromDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={formData.toDate}
                      onChange={(e) =>
                        setFormData({ ...formData, toDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Apply To (Reporting Person)
                  </label>
                  {user?.reporter?._id ? (
                    <input
                      type="text"
                      value={user.reporter.name}
                      readOnly
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
                    />
                  ) : (
                    <select
                      value={formData.reporter || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, reporter: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                      required
                    >
                      <option value="">Select Reporting Person</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg resize-none"
                    placeholder="Enter reason for leave"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 p-4 rounded-md ${toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
            }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>{toast.message}</div>
            <button onClick={() => setToast(null)} className="font-bold">
              X
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
