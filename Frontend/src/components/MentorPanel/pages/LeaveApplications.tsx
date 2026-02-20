import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle, XCircle, Plus, X, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useUserContext } from "../../../context/UserProvider";
import { useAuth } from "../../../context/AuthProvider";

export default function MentorLeaveApplications() {
  const { leaves, fetchAllLeaves, updateLeaveStatus, applyLeave, users } =
    useUserContext();
  const { user } = useAuth();

  const [userLeaves, setUserLeaves] = useState<any[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("team"); // "team" or "mine"

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Apply modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [formData, setFormData] = useState({
    user: user?._id || "",
    leaveType: "Sick Leave",
    leaveCategory: "Full Day",
    halfDayPeriod: "First Half",
    fromDate: "",
    toDate: "",
    reason: "",
    reporter: user?.reporter?._id || "",
  });

  const leaveTypes = [
    "Sick Leave",
    "Casual Leave",

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
      (leave: any) => leave.user?._id === user._id
    );

    // Step 4: If Admin → show ALL leaves
    let reporteesLeaves;

    if (user?.designation === "Admin") {
      reporteesLeaves = leaves; // ADMIN CAN SEE ALL
    } else {
      reporteesLeaves = leaves.filter((leave: any) =>
        allReporteeIds.includes(leave.user?._id)
      );
    }

    setUserLeaves(userOwnLeaves);
    setFilteredLeaves(reporteesLeaves);
  }, [leaves, users, user, fetchAllLeaves]);

  const calculateDays = (application: any) => {
    if (application.leaveCategory === "Half Day") return 0.5;
    if (!application.fromDate || !application.toDate) return 0;
    const s = new Date(application.fromDate).getTime();
    const e = new Date(application.toDate).getTime();
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
      leaveCategory: "Full Day",
      halfDayPeriod: "First Half",
      fromDate: "",
      toDate: "",
      reason: "",
      reporter: user?.reporter?._id || "",
    });

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();

    const submissionData = { ...formData };
    if (formData.leaveCategory === "Half Day") {
      submissionData.toDate = formData.fromDate;
    }

    if (new Date(submissionData.toDate) < new Date(submissionData.fromDate)) {
      setToast({
        message: "End date cannot be before start date",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await applyLeave(submissionData);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-amber-100 text-amber-700",
      Approved: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(displayList.map((l) => l._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleIndividualDelete = async (leaveId: string) => {
    if (!window.confirm("Are you sure you want to delete this leave application? This action cannot be undone.")) return;

    setIsDeleting(true);
    const success = await deleteLeave(leaveId, user?._id || "");
    if (success) {
      await fetchAllLeaves();
    }
    setIsDeleting(false);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected leave applications? This action cannot be undone.`)) return;

    setIsDeleting(true);
    const success = await bulkDeleteLeaves(selectedIds, user?._id || "");
    if (success) {
      setSelectedIds([]);
      await fetchAllLeaves();
    }
    setIsDeleting(false);
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 leading-tight">
            Leave Management
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">View and manage leave applications</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "team"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Team
            </button>

            {user?.designation !== "Admin" && (
              <button
                onClick={() => setActiveTab("mine")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "mine"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                My Leaves
              </button>
            )}
          </div>

          {user?.designation !== "Admin" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 text-white flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
            >
              <Plus size={18} /> Apply Leave
            </button>
          )}
        </div>
      </div>

      {/* Summary Boxes */}
      {activeTab === "team" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Clock size={24} className="text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">
                  {pendingCount}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <CheckCircle size={24} className="text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">
                  {approvedCount}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Approved</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 group hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <XCircle size={24} className="text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">
                  {rejectedCount}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {displayList.length > 0 && (
              <input
                type="checkbox"
                checked={selectedIds.length === displayList.length && displayList.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            )}
            <h2 className="text-xl font-bold text-gray-800">
              {user?.designation === "Admin"
                ? "All Leave Applications"
                : activeTab === "mine"
                  ? "My Leave Requests"
                  : "Team Leave Applications"}
            </h2>
          </div>
          <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {displayList.length} Total
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          {displayList.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">No leave applications found.</p>
            </div>
          )}

          {displayList.map((application: any, index: number) => {
            const days = calculateDays(application);
            const statusColor = getStatusColor(application.status);

            return (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-4 sm:p-6 hover:bg-gray-50/50 transition-colors ${selectedIds.includes(application._id) ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(application._id)}
                      onChange={() => handleToggleSelection(application._id)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-start sm:items-center">
                    <div className="col-span-12 sm:col-span-4 flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {application.user?.name?.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {application.user?.name}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                          {application.user?.designation || "No Designation"}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-4 flex flex-wrap items-center gap-3 sm:gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Leave Type</span>
                        <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                          {application.leaveType}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Duration</span>
                        <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                          <Calendar size={14} className="text-blue-500" /> {days} {days === 1 ? 'day' : days === 0.5 ? 'day' : 'days'}
                          {application.leaveCategory === "Half Day" && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 uppercase">
                              {application.halfDayPeriod}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-4 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full">
                      <div className="text-sm font-bold text-gray-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 sm:w-fit">
                        {application.fromDate?.split("T")[0]}
                        <span className="mx-2 text-blue-300">→</span>
                        {application.toDate?.split("T")[0]}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColor}`}
                        >
                          {application.status}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {activeTab === "team" && application.status === "Pending" && (
                            <>
                              <button
                                onClick={async () => {
                                  await updateLeaveStatus(
                                    application._id,
                                    "Approved",
                                    user?._id || ""
                                  );
                                  await fetchAllLeaves();
                                }}
                                className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all border border-green-100"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>

                              <button
                                onClick={async () => {
                                  await updateLeaveStatus(
                                    application._id,
                                    "Rejected",
                                    user?._id || ""
                                  );
                                  await fetchAllLeaves();
                                }}
                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleIndividualDelete(application._id)}
                            disabled={isDeleting}
                            className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-slate-100 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {application.reason && (
                      <div className="col-span-12 mt-2 bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-200 w-full">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 font-mono">Reason</p>
                        <p className="text-sm text-gray-600 italic leading-relaxed">"{application.reason}"</p>
                      </div>
                    )}
                  </div>
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
                      Leave Category
                    </label>
                    <select
                      value={formData.leaveCategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          leaveCategory: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="Full Day">Full Day</option>
                      <option value="Half Day">Half Day</option>
                    </select>
                  </div>

                  {formData.leaveCategory === "Half Day" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Half Day Period
                      </label>
                      <select
                        value={formData.halfDayPeriod}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            halfDayPeriod: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      >
                        <option value="First Half">First Half</option>
                        <option value="Second Half">Second Half</option>
                      </select>
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {formData.leaveCategory === "Half Day" ? "Date" : "From Date"}
                    </label>
                    <input
                      type="date"
                      value={formData.fromDate}
                      onChange={(e) =>
                        setFormData({ ...formData, fromDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  {formData.leaveCategory === "Full Day" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={formData.toDate}
                        onChange={(e) =>
                          setFormData({ ...formData, toDate: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </motion.div>
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
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2 font-bold transition-all"
                  >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] w-full max-w-2xl px-4"
          >
            <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-6 backdrop-blur-xl bg-opacity-95">
              <div className="flex items-center gap-4 pl-4 border-l-2 border-blue-500">
                <div className="text-2xl font-black">{selectedIds.length}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Applications Selected</div>
              </div>

              <div className="flex items-center gap-2 pr-2">
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  CLEAR ALL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 p-4 rounded-md shadow-2xl z-[100] ${toast.type === "success"
            ? "bg-green-600 text-white"
            : "bg-red-600 text-white"
            }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>{toast.message}</div>
            <button onClick={() => setToast(null)} className="font-bold">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
