// import { motion, AnimatePresence } from "framer-motion";
// import { Calendar, Plus, X } from "lucide-react";
// import { useState } from "react";
// import Toast from "../RecruiterPnel/Toast";
// import { useUserContext } from "../../context/UserProvider";

// interface LeaveApplication {
//   id: string;
//   leaveType: string;
//   fromDate: string;
//   toDate: string;
//   reason: string;
//   status: "Pending" | "Approved" | "Rejected";
//   appliedDate: string;
// }

// const initialLeaveApplications: LeaveApplication[] = [
//   {
//     id: "1",
//     leaveType: "Sick Leave",
//     fromDate: "2025-11-15",
//     toDate: "2025-11-17",
//     reason: "Seasonal flu and need rest to recover",
//     status: "Approved",
//     appliedDate: "2025-11-01",
//   },
//   {
//     id: "2",
//     leaveType: "Casual Leave",
//     fromDate: "2025-11-20",
//     toDate: "2025-11-21",
//     reason: "Personal family matter",
//     status: "Pending",
//     appliedDate: "2025-11-02",
//   },
//   {
//     id: "3",
//     leaveType: "Earned Leave",
//     fromDate: "2025-11-25",
//     toDate: "2025-11-30",
//     reason: "Vacation with family",
//     status: "Rejected",
//     appliedDate: "2025-11-03",
//   },
// ];

// const leaveTypes = [
//   "Sick Leave",
//   "Casual Leave",
//   "Earned Leave",
//   "Maternity Leave",
//   "Paternity Leave",
//   "Unpaid Leave",
// ];

// export default function LeaveApplications() {

//    const { leaves, applyLeave, updateLeaveStatus, fetchLeaves } =
//      useUserContext();
//   const [leaveApplications, setLeaveApplications] = useState<
//     LeaveApplication[]
//   >(initialLeaveApplications);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [toast, setToast] = useState<{
//     message: string;
//     type: "success" | "error";
//   } | null>(null);

//   const [formData, setFormData] = useState({
//     leaveType: "Sick Leave",
//     fromDate: "",
//     toDate: "",
//     reason: "",
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     if (new Date(formData.toDate) < new Date(formData.fromDate)) {
//       setToast({
//         message: "End date cannot be before start date",
//         type: "error",
//       });
//       return;
//     }

//     const newApplication: LeaveApplication = {
//       id: Date.now().toString(),
//       leaveType: formData.leaveType,
//       fromDate: formData.fromDate,
//       toDate: formData.toDate,
//       reason: formData.reason,
//       status: "Pending",
//       appliedDate: new Date().toISOString().split("T")[0],
//     };

//     setLeaveApplications([newApplication, ...leaveApplications]);
//     setToast({
//       message: "Leave application submitted successfully!",
//       type: "success",
//     });
//     setIsModalOpen(false);
//     setFormData({
//       leaveType: "Sick Leave",
//       fromDate: "",
//       toDate: "",
//       reason: "",
//     });
//   };

//   const getStatusColor = (status: LeaveApplication["status"]) => {
//     const colors = {
//       Pending: "bg-yellow-100 text-yellow-700",
//       Approved: "bg-green-100 text-green-700",
//       Rejected: "bg-red-100 text-red-700",
//     };
//     return colors[status];
//   };

//   const calculateDays = (from: string, to: string) => {
//     const start = new Date(from);
//     const end = new Date(to);
//     const diffTime = Math.abs(end.getTime() - start.getTime());
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
//     return diffDays;
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });
//   };

//   const stats = {
//     pending: leaveApplications.filter((app) => app.status === "Pending").length,
//     approved: leaveApplications.filter((app) => app.status === "Approved")
//       .length,
//     rejected: leaveApplications.filter((app) => app.status === "Rejected")
//       .length,
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="pb-8"
//     >
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-slate-800 mb-2">
//             My Leave Applications
//           </h1>
//           <p className="text-slate-600">
//             Apply for leave and track your applications
//           </p>
//         </div>
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
//         >
//           <Plus size={20} />
//           Apply for Leave
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//           className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
//         >
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-3xl font-bold text-yellow-600">
//                 {stats.pending}
//               </p>
//               <p className="text-sm text-slate-600 mt-1">Pending</p>
//             </div>
//             <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
//               <Calendar size={24} className="text-yellow-600" />
//             </div>
//           </div>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//           className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
//         >
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-3xl font-bold text-green-600">
//                 {stats.approved}
//               </p>
//               <p className="text-sm text-slate-600 mt-1">Approved</p>
//             </div>
//             <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
//               <Calendar size={24} className="text-green-600" />
//             </div>
//           </div>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//           className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
//         >
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-3xl font-bold text-red-600">
//                 {stats.rejected}
//               </p>
//               <p className="text-sm text-slate-600 mt-1">Rejected</p>
//             </div>
//             <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
//               <Calendar size={24} className="text-red-600" />
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//         <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
//           <h2 className="text-xl font-semibold text-slate-800">
//             Leave History
//           </h2>
//           <p className="text-sm text-slate-600 mt-1">
//             Total: {leaveApplications.length}{" "}
//             {leaveApplications.length === 1 ? "application" : "applications"}
//           </p>
//         </div>

//         {leaveApplications.length === 0 ? (
//           <div className="p-12 text-center">
//             <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
//             <p className="text-slate-500 text-lg">No leave applications yet</p>
//             <p className="text-slate-400 text-sm mt-2">
//               Click "Apply for Leave" to submit your first request
//             </p>
//           </div>
//         ) : (
//           <>
//             <div className="hidden lg:block overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-slate-50 border-b border-slate-200">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                       Leave Type
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                       From Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                       To Date
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                       Duration
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                       Reason
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
//                       Status
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-200">
//                   {leaveApplications.map((application, index) => (
//                     <motion.tr
//                       key={application.id}
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       transition={{ delay: index * 0.05 }}
//                       className="hover:bg-slate-50 transition-colors"
//                     >
//                       <td className="px-6 py-4">
//                         <div className="font-medium text-slate-800">
//                           {application.leaveType}
//                         </div>
//                         <div className="text-xs text-slate-500">
//                           Applied: {formatDate(application.appliedDate)}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-700">
//                         {formatDate(application.fromDate)}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-700">
//                         {formatDate(application.toDate)}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-slate-700">
//                         {calculateDays(
//                           application.fromDate,
//                           application.toDate
//                         )}{" "}
//                         {calculateDays(
//                           application.fromDate,
//                           application.toDate
//                         ) === 1
//                           ? "day"
//                           : "days"}
//                       </td>
//                       <td className="px-6 py-4">
//                         <div
//                           className="text-sm text-slate-700 max-w-xs truncate"
//                           title={application.reason}
//                         >
//                           {application.reason}
//                         </div>
//                       </td>
//                       <td className="px-6 py-4">
//                         <span
//                           className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
//                             application.status
//                           )}`}
//                         >
//                           {application.status}
//                         </span>
//                       </td>
//                     </motion.tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             <div className="lg:hidden divide-y divide-slate-200">
//               {leaveApplications.map((application, index) => (
//                 <motion.div
//                   key={application.id}
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   transition={{ delay: index * 0.05 }}
//                   className="p-4 hover:bg-slate-50 transition-colors"
//                 >
//                   <div className="flex items-start justify-between mb-3">
//                     <div>
//                       <div className="font-medium text-slate-800 mb-1">
//                         {application.leaveType}
//                       </div>
//                       <div className="text-xs text-slate-500">
//                         Applied: {formatDate(application.appliedDate)}
//                       </div>
//                     </div>
//                     <span
//                       className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
//                         application.status
//                       )}`}
//                     >
//                       {application.status}
//                     </span>
//                   </div>

//                   <div className="space-y-2 mb-3">
//                     <div className="flex items-center gap-2 text-sm text-slate-600">
//                       <Calendar size={14} />
//                       <span>
//                         {formatDate(application.fromDate)} →{" "}
//                         {formatDate(application.toDate)}
//                       </span>
//                     </div>
//                     <div className="text-sm text-slate-600">
//                       Duration:{" "}
//                       <span className="font-medium">
//                         {calculateDays(
//                           application.fromDate,
//                           application.toDate
//                         )}{" "}
//                         days
//                       </span>
//                     </div>
//                     <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
//                       <div className="font-medium text-slate-600 mb-1">
//                         Reason:
//                       </div>
//                       {application.reason}
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           </>
//         )}
//       </div>

//       <AnimatePresence>
//         {isModalOpen && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//             onClick={() => setIsModalOpen(false)}
//           >
//             <motion.div
//               initial={{ scale: 0.95, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.95, opacity: 0 }}
//               onClick={(e) => e.stopPropagation()}
//               className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
//             >
//               <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50">
//                 <div>
//                   <h2 className="text-2xl font-bold text-slate-800">
//                     Apply for Leave
//                   </h2>
//                   <p className="text-sm text-slate-600 mt-1">
//                     Fill in the details below to submit your leave request
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setIsModalOpen(false)}
//                   className="text-slate-400 hover:text-slate-600 transition-colors"
//                 >
//                   <X size={24} />
//                 </button>
//               </div>

//               <form onSubmit={handleSubmit} className="p-6 space-y-6">
//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-2">
//                     Leave Type <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     value={formData.leaveType}
//                     onChange={(e) =>
//                       setFormData({ ...formData, leaveType: e.target.value })
//                     }
//                     className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                     required
//                   >
//                     {leaveTypes.map((type) => (
//                       <option key={type} value={type}>
//                         {type}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-slate-700 mb-2">
//                       From Date <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="date"
//                       value={formData.fromDate}
//                       onChange={(e) =>
//                         setFormData({ ...formData, fromDate: e.target.value })
//                       }
//                       min={new Date().toISOString().split("T")[0]}
//                       className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                       required
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-slate-700 mb-2">
//                       To Date <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="date"
//                       value={formData.toDate}
//                       onChange={(e) =>
//                         setFormData({ ...formData, toDate: e.target.value })
//                       }
//                       min={
//                         formData.fromDate ||
//                         new Date().toISOString().split("T")[0]
//                       }
//                       className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
//                       required
//                     />
//                   </div>
//                 </div>

//                 {formData.fromDate && formData.toDate && (
//                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                     <p className="text-sm text-blue-800">
//                       <span className="font-semibold">Duration:</span>{" "}
//                       {calculateDays(formData.fromDate, formData.toDate)}{" "}
//                       {calculateDays(formData.fromDate, formData.toDate) === 1
//                         ? "day"
//                         : "days"}
//                     </p>
//                   </div>
//                 )}

//                 <div>
//                   <label className="block text-sm font-medium text-slate-700 mb-2">
//                     Reason <span className="text-red-500">*</span>
//                   </label>
//                   <textarea
//                     value={formData.reason}
//                     onChange={(e) =>
//                       setFormData({ ...formData, reason: e.target.value })
//                     }
//                     rows={4}
//                     className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
//                     placeholder="Please provide a brief reason for your leave request..."
//                     required
//                   />
//                 </div>

//                 <div className="flex gap-3 pt-4">
//                   <button
//                     type="button"
//                     onClick={() => setIsModalOpen(false)}
//                     className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
//                   >
//                     Submit Application
//                   </button>
//                 </div>
//               </form>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {toast && (
//           <Toast
//             message={toast.message}
//             type={toast.type}
//             onClose={() => setToast(null)}
//           />
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }






import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import Toast from "../RecruiterPnel/Toast";
import { useUserContext } from "../../context/UserProvider";
import { useAuth } from "../../context/AuthProvider";

export default function LeaveApplications() {
  const { leaves, applyLeave, fetchLeaves, users } = useUserContext();
  const { user } = useAuth();
  const [reportToName, setReportToName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
console.log(leaves,"ll");

  const [formData, setFormData] = useState({
    user: user._id,
    leaveType: "Sick Leave",
    fromDate: "",
    toDate: "",
    reason: "",
    reporter: "",
  });

  const leaveTypes = [
    "Sick Leave",
    "Casual Leave",
    "Earned Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Unpaid Leave",
  ];
  console.log(leaves, "usergiv");

  // 🔹 Load leaves from backend
  useEffect(() => {
    fetchLeaves(user?._id);
    if (user?.reporter?.id && user?.reporter?.name) {
      setReportToName(user.reporter.name);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      setToast({
        message: "End date cannot be before start date",
        type: "error",
      });
      return;
    }

    const success = await applyLeave(formData);

    if (success) {
      setToast({
        message: "Leave application submitted successfully!",
        type: "success",
      });
      setIsModalOpen(false);
      setFormData({
        leaveType: "Sick Leave",
        fromDate: "",
        toDate: "",
        reason: "",
        reporter: "",
      });
      fetchLeaves(user?._id); // refresh leave list
    } else {
      setToast({ message: "Failed to submit leave", type: "error" });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-700",
      Approved: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const calculateDays = (from: string, to: string) => {
    const start = new Date(from);
    const end = new Date(to);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const stats = {
    pending: leaves.filter((l) => l.status === "Pending").length,
    approved: leaves.filter((l) => l.status === "Approved").length,
    rejected: leaves.filter((l) => l.status === "Rejected").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            My Leave Applications
          </h1>
          <p className="text-slate-600">
            Apply for leave and track your applications
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <Plus size={20} />
          Apply for Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Pending", color: "yellow", count: stats.pending },
          { label: "Approved", color: "green", count: stats.approved },
          { label: "Rejected", color: "red", count: stats.rejected },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold text-${s.color}-600`}>
                  {s.count}
                </p>
                <p className="text-sm text-slate-600 mt-1">{s.label}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-full bg-${s.color}-100 flex items-center justify-center`}
              >
                <Calendar size={24} className={`text-${s.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leave History */}
      {/* <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            Leave History
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Total: {leaves.length}{" "}
            {leaves.length === 1 ? "application" : "applications"}
          </p>
        </div>

        {leaves.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No leave applications yet</p>
            <p className="text-slate-400 text-sm mt-2">
              Click "Apply for Leave" to submit your first request
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    From Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    To Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leaves.map((application, index) => (
                  <motion.tr
                    key={application._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-800 font-medium">
                      {application.leaveType || "Leave"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatDate(application.fromDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatDate(application.toDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {calculateDays(application.fromDate, application.toDate)}{" "}
                      days
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {application.reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {application.reporter?.name}
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
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div> */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">
            Leave History
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Total: {leaves.length}{" "}
            {leaves.length === 1 ? "application" : "applications"}
          </p>
        </div>

        {leaves.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No leave applications yet</p>
            <p className="text-slate-400 text-sm mt-2">
              Click "Apply for Leave" to submit your first request
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      From Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      To Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {leaves.map((application, index) => (
                    <motion.tr
                      key={application._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">
                          {application.leaveType}
                        </div>
                        <div className="text-xs text-slate-500">
                          Applied: {formatDate(application.appliedDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatDate(application.fromDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatDate(application.toDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {calculateDays(
                          application.fromDate,
                          application.toDate
                        )}{" "}
                        {calculateDays(
                          application.fromDate,
                          application.toDate
                        ) === 1
                          ? "day"
                          : "days"}
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
                        <div
                          className="text-sm text-slate-700 max-w-xs truncate"
                          title={application.reason}
                        >
                          {application.reporter?.name}
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
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-slate-200">
              {leaves.map((application, index) => (
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
                        {application.leaveType}
                      </div>
                      <div className="text-xs text-slate-500">
                        Applied: {formatDate(application.appliedDate)}
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
                        {calculateDays(
                          application.fromDate,
                          application.toDate
                        )}{" "}
                        days
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
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  {user?.reporter?.id ? (
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
                    onClick={() => setIsModalOpen(false)}
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
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
