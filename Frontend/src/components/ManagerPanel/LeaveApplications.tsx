import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle, XCircle, Plus, X, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useUserContext } from "../../context/UserProvider";
import { useAuth } from "../../context/AuthProvider";

export default function ManagerLeaveApplications() {
  const { leaves, fetchAllLeaves, updateLeaveStatus, applyLeave, users, deleteLeave, bulkDeleteLeaves } =
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

  const leaveTypes = ["Sick Leave", "Casual Leave"];

  useEffect(() => {
    fetchAllLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filter Leaves
  useEffect(() => {
    if (!leaves || !users || !user) return;

    // Direct reportees
    const directReportees = users.filter((u) => u?.reporter?._id === user._id);
    let allReporteeIds = directReportees.map((u) => u._id);

    // If Manager -> include recruiters (2nd-level)
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

    const userOwnLeaves = leaves.filter(
      (leave: any) => (typeof leave.user === 'object' ? leave.user?._id : leave.user) === user._id
    );

    const reporteesLeaves = leaves.filter((leave: any) =>
      allReporteeIds.includes(typeof leave.user === 'object' ? leave.user?._id : leave.user)
    );

    setUserLeaves(userOwnLeaves);
    setFilteredLeaves(reporteesLeaves);
  }, [leaves, users, user]);

  const calculateDays = (application: any) => {
    if (application.leaveCategory === "Half Day") return 0.5;
    if (!application.fromDate || !application.toDate) return 0;
    const s = new Date(application.fromDate).getTime();
    const e = new Date(application.toDate).getTime();
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const pendingCount = filteredLeaves.filter((l) => l.status === "Pending").length;
  const approvedCount = filteredLeaves.filter((l) => l.status === "Approved").length;
  const rejectedCount = filteredLeaves.filter((l) => l.status === "Rejected").length;

  const displayList = activeTab === "team" ? filteredLeaves : userLeaves;

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
      setToast({ message: "End date cannot be before start date", type: "error" });
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
      Pending: "bg-amber-100 text-amber-700 border-amber-200",
      Approved: "bg-green-100 text-green-700 border-green-200",
      Rejected: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
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
      setToast({ message: "Leave application deleted", type: "success" });
      await fetchAllLeaves();
    }
    setIsDeleting(false);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected leave applications? This action cannot be undone.`)) return;
    setIsDeleting(true);
    const success = await bulkDeleteLeaves(selectedIds, user?._id || "");
    if (success) {
      setToast({ message: `${selectedIds.length} applications deleted`, type: "success" });
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
      className="p-4 sm:p-8 bg-slate-50 min-h-screen"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 leading-tight">
            Leave Management
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Review and manage team leave requests</p>
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
            <button
              onClick={() => setActiveTab("mine")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "mine"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              My Leaves
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 text-white flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={18} /> Apply Leave
          </button>
        </div>
      </div>

      {/* Summary Boxes */}
      {activeTab === "team" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[
            { label: "Pending", count: pendingCount, icon: Clock, color: "amber" },
            { label: "Approved", count: approvedCount, icon: CheckCircle, color: "green" },
            { label: "Rejected", count: rejectedCount, icon: XCircle, color: "red" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 flex items-center justify-center group-hover:bg-${stat.color}-100 transition-colors`}>
                  <stat.icon size={24} className={`text-${stat.color}-500`} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-800">{stat.count}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applications list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
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
              {activeTab === "mine" ? "My Leave Requests" : "Team Leave Applications"}
            </h2>
          </div>
          <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
            {displayList.length} Total
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {displayList.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No leave applications found.</p>
            </div>
          ) : (
            displayList.map((application, index) => {
              const days = calculateDays(application);
              const statusColorClass = getStatusColor(application.status);
              return (
                <motion.div
                  key={application._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 sm:p-6 hover:bg-gray-50/50 transition-colors ${selectedIds.includes(application._id) ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(application._id)}
                        onChange={() => handleToggleSelection(application._id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                            {application.user?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{application.user?.name || "User"}</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                              {application.user?.designation || "No Designation"}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColorClass}`}>
                          {application.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                          <p className="text-sm font-bold text-gray-700">
                            {application.fromDate?.split("T")[0]} to {application.toDate?.split("T")[0]}
                            <span className="ml-1 text-blue-600">({days} {days === 1 ? 'day' : 'days'})</span>
                            {application.leaveCategory === "Half Day" && (
                              <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100">
                                {application.halfDayPeriod}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Leave Type</p>
                          <p className="text-sm font-bold text-gray-700">{application.leaveType}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 mb-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reason</p>
                        <p className="text-sm text-gray-700 italic">"{application.reason}"</p>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        {activeTab === "team" && application.status === "Pending" && (
                          <>
                            <button
                              onClick={async () => {
                                await updateLeaveStatus(application._id, "Approved", user?._id || "");
                                await fetchAllLeaves();
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-2"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              onClick={async () => {
                                await updateLeaveStatus(application._id, "Rejected", user?._id || "");
                                await fetchAllLeaves();
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 flex items-center gap-2"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleIndividualDelete(application._id)}
                          disabled={isDeleting}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete Application"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
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
                <h2 className="text-2xl font-bold text-slate-800">Apply for Leave</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={submitLeave} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                    required
                  >
                    {leaveTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Leave Category</label>
                    <select
                      value={formData.leaveCategory}
                      onChange={(e) => setFormData({ ...formData, leaveCategory: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="Full Day">Full Day</option>
                      <option value="Half Day">Half Day</option>
                    </select>
                  </div>
                  {formData.leaveCategory === "Half Day" && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Half Day Period</label>
                      <select
                        value={formData.halfDayPeriod}
                        onChange={(e) => setFormData({ ...formData, halfDayPeriod: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none"
                      required
                    />
                  </div>
                  {formData.leaveCategory === "Full Day" && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
                      <input
                        type="date"
                        value={formData.toDate}
                        onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none"
                        required
                      />
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg resize-none"
                    placeholder="Enter reason for leave"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100">Cancel</button>
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
                <button onClick={() => setSelectedIds([])} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
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
        <div className={`fixed right-6 bottom-6 p-4 rounded-md shadow-2xl z-[100] ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          <div className="flex items-center justify-between gap-4">
            <div>{toast.message}</div>
            <button onClick={() => setToast(null)} className="font-bold"><X size={16} /></button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
  );
}
