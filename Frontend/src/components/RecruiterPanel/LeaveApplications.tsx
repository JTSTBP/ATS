import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import Toast from "../RecruiterPanel/Toast";
import { useUserContext } from "../../context/UserProvider";
import { useAuth } from "../../context/AuthProvider";
import { formatDate } from "../../utils/dateUtils";

export default function LeaveApplications() {
  const { leaves, applyLeave, fetchAllLeaves, deleteLeave, bulkDeleteLeaves } = useUserContext();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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

  // 🔹 Load ALL leaves from backend (Recruiter View)
  useEffect(() => {
    fetchAllLeaves();
  }, []);

  const handleRefresh = () => {
    fetchAllLeaves();
    setToast({ message: "Refreshed data", type: "success" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    await applyLeave({ ...submissionData, user: user?._id || "", reporter: submissionData.reporter || "" });

    // Assuming success if no error thrown
    setToast({
      message: "Leave application submitted successfully!",
      type: "success",
    });
    setIsModalOpen(false);
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
    fetchAllLeaves(); // refresh list
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'pending') return "bg-yellow-100 text-yellow-700";
    if (normalizedStatus === 'approved') return "bg-green-100 text-green-700";
    if (normalizedStatus === 'rejected') return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const calculateDays = (application: any) => {
    if (application.leaveCategory === "Half Day") return 0.5;
    const start = new Date(application.fromDate);
    const end = new Date(application.toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };
  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredLeaves.map((l) => l._id));
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



  // Filter to show only current user's leaves
  const userLeaves = leaves.filter((l) => {
    // Check if leave belongs to current user
    const leaveUserId = typeof l.user === 'object' ? l.user?._id : l.user;
    return leaveUserId === user?._id;
  });

  const stats = {
    pending: userLeaves.filter((l) => l.status?.toLowerCase() === "pending").length,
    approved: userLeaves.filter((l) => l.status?.toLowerCase() === "approved").length,
    rejected: userLeaves.filter((l) => l.status?.toLowerCase() === "rejected").length,
  };

  const filteredLeaves = statusFilter
    ? userLeaves.filter((l) => l.status?.toLowerCase() === statusFilter.toLowerCase())
    : userLeaves;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
            My Leave Applications
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Apply for leave and track your applications
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 sm:p-3 bg-white text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Apply for Leave</span>
            <span className="xs:hidden">Apply</span>
          </button>
        </div>
      </div>

      {/* Stats - Now CLICKABLE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {[
          { label: "Pending", color: "yellow", count: stats.pending, status: "Pending" },
          { label: "Approved", color: "green", count: stats.approved, status: "Approved" },
          { label: "Rejected", color: "red", count: stats.rejected, status: "Rejected" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            onClick={() => setStatusFilter(statusFilter === s.status ? null : s.status)}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 sm:p-6 cursor-pointer hover:shadow-lg transition-all ${statusFilter === s.status ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl sm:text-3xl font-bold text-${s.color}-600`}>
                  {s.count}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">{s.label}</p>
              </div>
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-${s.color}-100 flex items-center justify-center`}
              >
                <Calendar size={20} className={`sm:w-6 sm:h-6 text-${s.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leave History */}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
            My Applications
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {statusFilter ? `Showing ${filteredLeaves.length} ${statusFilter.toLowerCase()} ` : `Total: ${filteredLeaves.length} `}
            {filteredLeaves.length === 1 ? "application" : "applications"}
            {statusFilter && <button onClick={() => setStatusFilter(null)} className="ml-2 text-blue-600 hover:text-blue-700 text-xs font-medium">Clear filter</button>}
          </p>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Calendar size={40} className="sm:w-12 sm:h-12 mx-auto text-slate-300 mb-3 sm:mb-4" />
            <p className="text-slate-500 text-base sm:text-lg">No leave applications found</p>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Click "Refresh" to check for new data
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredLeaves.length && filteredLeaves.length > 0}
                        onChange={handleSelectAll}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Date Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Reason
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLeaves.map((application, index) => (
                    <motion.tr
                      key={application._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(application._id)}
                          onChange={() => handleToggleSelection(application._id)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">
                          {application.leaveType || "Leave"}
                        </div>
                        <div className="text-xs text-slate-500">
                          Applied: {application.appliedDate ? formatDate(application.appliedDate) : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex flex-col">
                          <span>{formatDate(application.fromDate)}</span>
                          <span className="text-xs text-slate-400">to</span>
                          <span>{formatDate(application.toDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                        {calculateDays(application)}{" "}
                        {calculateDays(application) === 1
                          ? "day"
                          : calculateDays(application) === 0.5
                            ? "day"
                            : "days"}
                        {application.leaveCategory === "Half Day" && (
                          <div className="mt-1 text-[10px] bg-indigo-50 text-indigo-600 w-fit px-2 py-0.5 rounded-md border border-indigo-100 uppercase">
                            {application.halfDayPeriod}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-sm text-slate-700 max-w-xs truncate"
                          title={application.reason}
                        >
                          {application.reason}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {application.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleIndividualDelete(application._id)}
                          disabled={isDeleting}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                          title="Delete Application"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-slate-200">
              {filteredLeaves.map((application, index) => (
                <motion.div
                  key={application._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-slate-800 mb-1">
                        {application.leaveType || "Leave"}
                      </div>
                      <div className="text-xs text-slate-500">
                        Applied: {application.appliedDate ? formatDate(application.appliedDate) : "N/A"}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={14} />
                      <span>
                        {formatDate(application.fromDate)} →{" "}
                        {formatDate(application.toDate)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      Duration:{" "}
                      <span className="font-medium">
                        {calculateDays(application)}{" "}
                        days
                        {application.leaveCategory === "Half Day" && (
                          <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 uppercase">
                            {application.halfDayPeriod}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                      <div className="font-medium text-slate-600 mb-1">
                        Reason:
                      </div>
                      {application.reason}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-800">
                  Apply for Leave
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Leave Type
                  </label>
                  <select
                    value={formData.leaveType}
                    onChange={(e) =>
                      setFormData({ ...formData, leaveType: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm sm:text-base"
                  >
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="First Half">First Half</option>
                        <option value="Second Half">Second Half</option>
                      </select>
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm sm:text-base"
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
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm sm:text-base"
                        required={formData.leaveCategory === "Full Day"}
                      />
                    </motion.div>
                  )}
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Apply To (Reporting Person)
                  </label>
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
                </div> */}


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
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg resize-none text-sm sm:text-base"
                    placeholder="Enter reason for leave"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-sm sm:text-base font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base font-medium"
                  >
                    Submit Application
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
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </motion.div >
  );
}
