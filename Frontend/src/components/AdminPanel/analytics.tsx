// import { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// export default function AnalyticsTab() {
//   const [data, setData] = useState<any[]>([]);

//   useEffect(() => {
//     axios
//       .get(`${API_BASE_URL}/admin/analytics`)
//       .then((res) => setData(res.data));
//   }, []);

//   return (
//     <div className="p-8 bg-slate-50 min-h-screen">
//       <h1 className="text-3xl font-bold text-slate-800 mb-8">Analytics</h1>

//       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
//         <h2 className="text-lg font-semibold mb-4 text-slate-700">
//           Jobs Created vs CVs Uploaded
//         </h2>
//         <div className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={data}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="jobs" fill="#3b82f6" name="Jobs Created" />
//               <Bar dataKey="cvs" fill="#22c55e" name="CVs Uploaded" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// }


import { Users, LineChart, BarChart3, TrendingUp } from "lucide-react";

export default function AnalyticsTab() {
  return (
    <div className="text-slate-800">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics Overview</h1>
        <p className="text-slate-500 mt-1">
          Gain insights into user activity, recruitment performance, and growth
          trends.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center hover:shadow-md transition">
          <div>
            <p className="text-slate-500 text-sm">Total Active Users</p>
            <h2 className="text-3xl font-semibold mt-1">1,248</h2>
          </div>
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <Users size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center hover:shadow-md transition">
          <div>
            <p className="text-slate-500 text-sm">Monthly Growth</p>
            <h2 className="text-3xl font-semibold mt-1">+12.4%</h2>
          </div>
          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <TrendingUp size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center hover:shadow-md transition">
          <div>
            <p className="text-slate-500 text-sm">Reports Generated</p>
            <h2 className="text-3xl font-semibold mt-1">392</h2>
          </div>
          <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
            <BarChart3 size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center hover:shadow-md transition">
          <div>
            <p className="text-slate-500 text-sm">System Health</p>
            <h2 className="text-3xl font-semibold mt-1 text-green-600">
              Stable
            </h2>
          </div>
          <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
            <LineChart size={28} />
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-3">
            User Growth (Last 6 Months)
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            Track how user registrations and active users have grown month over
            month.
          </p>

          {/* Chart Placeholder */}
          <div className="border border-dashed border-slate-300 rounded-lg h-64 flex items-center justify-center text-slate-400">
            📈 User Growth Chart (Coming Soon)
          </div>
        </div>

        {/* Right Chart */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-3">
            Recruitment Performance
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            Overview of CV uploads, shortlisting rate, and hires for the past
            quarter.
          </p>

          {/* Chart Placeholder */}
          <div className="border border-dashed border-slate-300 rounded-lg h-64 flex items-center justify-center text-slate-400">
            📊 Recruitment Performance Graph (Coming Soon)
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow rounded-xl p-6 mt-8">
        <h2 className="text-lg font-semibold mb-3">
          Top Performing Recruiters
        </h2>
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Candidates Added</th>
              <th className="py-3 px-4 text-left">Shortlisted</th>
              <th className="py-3 px-4 text-left">Hired</th>
              <th className="py-3 px-4 text-left">Success Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t hover:bg-slate-50">
              <td className="py-3 px-4">Aarav Patel</td>
              <td className="py-3 px-4">84</td>
              <td className="py-3 px-4">58</td>
              <td className="py-3 px-4">21</td>
              <td className="py-3 px-4 text-green-600 font-medium">72%</td>
            </tr>
            <tr className="border-t hover:bg-slate-50">
              <td className="py-3 px-4">Sarah Khan</td>
              <td className="py-3 px-4">67</td>
              <td className="py-3 px-4">42</td>
              <td className="py-3 px-4">19</td>
              <td className="py-3 px-4 text-green-600 font-medium">69%</td>
            </tr>
            <tr className="border-t hover:bg-slate-50">
              <td className="py-3 px-4">Ravi Mehta</td>
              <td className="py-3 px-4">54</td>
              <td className="py-3 px-4">33</td>
              <td className="py-3 px-4">14</td>
              <td className="py-3 px-4 text-green-600 font-medium">61%</td>
            </tr>
            <tr className="border-t hover:bg-slate-50">
              <td className="py-3 px-4">Fatima Noor</td>
              <td className="py-3 px-4">48</td>
              <td className="py-3 px-4">28</td>
              <td className="py-3 px-4">12</td>
              <td className="py-3 px-4 text-green-600 font-medium">58%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
