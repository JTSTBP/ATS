


import { FileText, Users, BarChart3, AlertTriangle } from "lucide-react";

export default function ReportsTab() {
  return (
    <div className="text-slate-800">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reports & Insights</h1>
        <p className="text-slate-500 mt-1">
          View activity logs, performance summaries, and system reports.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center hover:shadow-lg transition">
          <div>
            <p className="text-slate-500 text-sm">Total Reports Generated</p>
            <h2 className="text-3xl font-semibold mt-1">152</h2>
          </div>
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <FileText size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center hover:shadow-lg transition">
          <div>
            <p className="text-slate-500 text-sm">Recruitment Reports</p>
            <h2 className="text-3xl font-semibold mt-1">87</h2>
          </div>
          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <Users size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center hover:shadow-lg transition">
          <div>
            <p className="text-slate-500 text-sm">Performance Reports</p>
            <h2 className="text-3xl font-semibold mt-1">43</h2>
          </div>
          <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
            <BarChart3 size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center hover:shadow-lg transition">
          <div>
            <p className="text-slate-500 text-sm">Pending Issues</p>
            <h2 className="text-3xl font-semibold mt-1">22</h2>
          </div>
          <div className="bg-red-100 text-red-600 p-3 rounded-lg">
            <AlertTriangle size={28} />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Reports</h2>

        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="py-3 px-4 text-left">Report Name</th>
              <th className="py-3 px-4 text-left">Category</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t hover:bg-slate-50">
              <td className="py-3 px-4">Recruitment Efficiency Q3</td>
              <td className="py-3 px-4">Recruitment</td>
              <td className="py-3 px-4">15 Oct 2025</td>
              <td className="py-3 px-4 text-green-600">Completed</td>
            </tr>
            <tr className="border-t hover:bg-slate-50">
              <td className="py-3 px-4">System Access Logs</td>
              <td className="py-3 px-4">Security</td>
              <td className="py-3 px-4">10 Oct 2025</td>
              <td className="py-3 px-4 text-yellow-600">In Progress</td>
            </tr>
            <tr className="border-t hover:bg-slate-50">
              <td className="py-3 px-4">Admin Activity Audit</td>
              <td className="py-3 px-4">Compliance</td>
              <td className="py-3 px-4">08 Oct 2025</td>
              <td className="py-3 px-4 text-green-600">Completed</td>
            </tr>
            <tr className="border-t hover:bg-slate-50">
              <td className="py-3 px-4">Recruiter Weekly Summary</td>
              <td className="py-3 px-4">Performance</td>
              <td className="py-3 px-4">05 Oct 2025</td>
              <td className="py-3 px-4 text-red-600">Pending Review</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
