// src/pages/ActivityLogs.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useUserContext } from "../../context/UserProvider";

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
    <div className="p-6 bg-gray-100 min-h-screen mt-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Activity Logs</h2>

        {/* Date Filter Inputs - Hide if external props provided */}
        {!externalStartDate && !externalEndDate && (
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded p-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded p-2 text-sm"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-auto shadow-lg rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Target</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredlogs.length > 0 ? (
              filteredlogs.map((log) => (
                <tr key={log._id} className="border-b hover:bg-gray-50">
                  {/* USER */}
                  <td className="p-3">{log.userId?.name || "Unknown User"}</td>

                  {/* ACTION */}
                  <td className="p-3">{log.action}</td>

                  {/* DESCRIPTION */}
                  <td className="p-3">{log.description}</td>

                  {/* TARGET MODEL */}
                  <td className="p-3">
                    {log.targetModel === "CandidateByJob" && (
                      <span className="text-blue-700 font-semibold">
                        {log.targetId?.dynamicFields?.candidateName ||
                          "Candidate"}
                      </span>
                    )}

                    {log.targetModel === "Job" && (
                      <span className="text-green-700 font-semibold">
                        {log.targetId?.title || "Job"}
                      </span>
                    )}

                    {log.targetModel === "LeaveApplication" && (
                      <span className="text-purple-700 font-semibold">
                        Leave Request ({log.targetId?.leaveType})
                      </span>
                    )}

                    {!log.targetModel && "—"}
                  </td>

                  {/* DATE */}
                  <td className="p-3 text-gray-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-5 text-center text-gray-500">
                  No activity logs found for the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogs;
