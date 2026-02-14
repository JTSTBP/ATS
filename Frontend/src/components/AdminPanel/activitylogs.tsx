import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useUserContext } from "../../context/UserProvider";
import { ClipboardCheck, X } from "lucide-react";

interface Log {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  description: string;
  targetModel?: string;
  targetId?: any;
  createdAt: string;
}

const ActivityLogs = ({ externalStartDate, externalEndDate }: { externalStartDate?: string; externalEndDate?: string }) => {
  const { user, getactivitylog } = useAuth();
  const { fetchallCandidates } = useCandidateContext();
  const { users } = useUserContext();
  const [logs, setLogs] = useState<Log[]>([]);
  const [filteredlogs, setFilteredLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filter state (internal)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const activeStartDate = externalStartDate || startDate;
  const activeEndDate = externalEndDate || endDate;

  useEffect(() => {
    fetchallCandidates();
  }, [user]);

  const fetchLogs = async () => {
    try {
      const res = await getactivitylog();
      console.log(res, "rrr");
      setLogs(res || []); // SAFE
    } catch (err) {
      console.error("Error loading logs", err);
      setLogs([]); // prevent crash
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!logs || !users || !user) return;

    // STEP 1: Direct reportees
    const directReportees = users.filter((u) => u?.reporter?._id === user._id);

    let allReporteeIds = directReportees.map((u) => u._id);

    // STEP 2: If Manager → include second-level reportees
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

    // STEP 3: User's own activity logs
    const myLogs = logs.filter((log) => log?.userId?._id === user._id);

    let allowedLogs;

    // STEP 4: Admin → sees ALL logs
    if (user.designation === "Admin") {
      allowedLogs = logs;
    } else {
      // Others → only their reportees
      allowedLogs = logs.filter((log) =>
        allReporteeIds.includes(log?.userId?._id)
      );
    }

    // STEP 5: Always include user's own logs and remove duplicates
    let finalLogs = [...allowedLogs, ...myLogs].filter(
      (v, i, arr) => arr.findIndex((x) => x._id === v._id) === i
    );

    // STEP 6: Date Filtering
    if (activeStartDate) {
      finalLogs = finalLogs.filter(
        (log) => new Date(log.createdAt) >= new Date(activeStartDate || "")
      );
    }
    if (activeEndDate) {
      // Set end date to end of day for inclusive comparison
      const end = new Date(activeEndDate || "");
      end.setHours(23, 59, 59, 999);
      finalLogs = finalLogs.filter(
        (log) => new Date(log.createdAt) <= end
      );
    }

    setFilteredLogs(finalLogs);
  }, [logs, users, user, activeStartDate, activeEndDate]);

  console.log(filteredlogs, "filteredlogs", logs, "logs");
  if (loading)
    return <p className="text-center mt-5">Loading Activity Logs...</p>;

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Activity Logs</h2>
          <p className="text-sm text-slate-500 font-medium">Track system activities and user actions</p>
        </div>

        {/* Date Filter Inputs - Hide if external props provided */}
        {!externalStartDate && !externalEndDate && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-bold text-slate-400 uppercase">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
              />
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2 px-2 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
              <span className="text-xs font-bold text-slate-400 uppercase">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors ml-auto sm:ml-0"
                title="Clear Filters"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-10">
              <tr>
                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">User</th>
                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Action</th>
                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Description</th>
                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Target</th>
                <th className="py-4 px-6 text-xs uppercase tracking-wider font-black text-slate-500">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredlogs.length > 0 ? (
                filteredlogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors group">
                    {/* USER */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {log.userId?.name?.charAt(0) || "U"}
                        </div>
                        <div className="font-bold text-slate-700">{log.userId?.name || "Unknown User"}</div>
                      </div>
                    </td>

                    {/* ACTION */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                        {log.action}
                      </span>
                    </td>

                    {/* DESCRIPTION */}
                    <td className="py-4 px-6 text-slate-600 font-medium">{log.description}</td>

                    {/* TARGET MODEL */}
                    <td className="py-4 px-6">
                      {log.targetModel === "CandidateByJob" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {log.targetId?.dynamicFields?.candidateName || "Candidate"}
                        </span>
                      )}

                      {log.targetModel === "Job" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          {log.targetId?.title || "Job"}
                        </span>
                      )}

                      {log.targetModel === "LeaveApplication" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Leave Request ({log.targetId?.leaveType})
                        </span>
                      )}

                      {!log.targetModel && <span className="text-slate-400">-</span>}
                    </td>

                    {/* DATE */}
                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <ClipboardCheck className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="font-bold text-lg text-slate-600">No activity logs found</p>
                      <p className="text-sm">Try adjusting your date filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
