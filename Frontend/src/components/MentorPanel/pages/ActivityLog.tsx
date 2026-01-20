import { useState, useMemo } from 'react';
import { Activity } from "lucide-react";
import ActivityLogs from "../../AdminPanel/activitylogs";

export const ActivityLog = () => {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let i = 0; i < 5; i++) {
      result.push(currentYear - i);
    }
    return result;
  }, []);

  // --- Calculate Date Props for ActivityLogs ---
  const { externalStartDate, externalEndDate } = useMemo(() => {
    if (selectedMonth === null || selectedYear === null) return { externalStartDate: undefined, externalEndDate: undefined };

    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);

    return {
      externalStartDate: start.toISOString().split('T')[0],
      externalEndDate: end.toISOString().split('T')[0]
    };
  }, [selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Activity Logs</h2>
          <p className="text-gray-500">Track all actions performed by you and your team.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-400 uppercase mb-1">Year</label>
            <select
              value={selectedYear === null ? "" : selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === "" ? null : Number(e.target.value))}
              className="bg-gray-50 border-none text-gray-700 text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
            >
              <option value="">All</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-400 uppercase mb-1">Month</label>
            <select
              value={selectedMonth === null ? "" : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === "" ? null : Number(e.target.value))}
              className="bg-gray-50 border-none text-gray-700 text-sm font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 block p-2 transition-all"
            >
              <option value="">All</option>
              {months.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </div>
          {(selectedMonth !== null || selectedYear !== null) && (
            <button
              onClick={() => {
                setSelectedMonth(null);
                setSelectedYear(null);
              }}
              className="mt-5 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <ActivityLogs externalStartDate={externalStartDate} externalEndDate={externalEndDate} />
      </div>
    </div>
  );
};
