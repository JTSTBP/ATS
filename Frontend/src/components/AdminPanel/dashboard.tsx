// import { useEffect, useState } from "react";
// import axios from "axios";
// import { Users, Briefcase, CalendarCheck, BarChart3 } from "lucide-react";

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// export default function AdminDashboard() {
//   const [stats, setStats] = useState({
//     totalUsers: 0,
//     totalJobs: 0,
//     pendingLeaves: 0,
//     totalCVs: 0,
//   });

//   useEffect(() => {
//     const fetchStats = async () => {
//       const res = await axios.get(`${API_BASE_URL}/admin/dashboard`);
//       setStats(res.data);
//     };
//     fetchStats();
//   }, []);

//   const cards = [
//     {
//       title: "Total Users",
//       value: stats.totalUsers,
//       icon: <Users className="text-blue-600" />,
//     },
//     {
//       title: "Active Jobs",
//       value: stats.totalJobs,
//       icon: <Briefcase className="text-green-600" />,
//     },
//     {
//       title: "Pending Leaves",
//       value: stats.pendingLeaves,
//       icon: <CalendarCheck className="text-yellow-600" />,
//     },
//     {
//       title: "Uploaded CVs",
//       value: stats.totalCVs,
//       icon: <BarChart3 className="text-purple-600" />,
//     },
//   ];

//   return (
//     <div className="p-8 bg-slate-50 min-h-screen">
//       <h1 className="text-3xl font-bold text-slate-800 mb-8">
//         Admin Dashboard
//       </h1>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//         {cards.map((card, idx) => (
//           <div
//             key={idx}
//             className="bg-white shadow-md rounded-2xl p-6 flex items-center justify-between border border-slate-200 hover:shadow-lg transition"
//           >
//             <div>
//               <h2 className="text-2xl font-semibold text-slate-800">
//                 {card.value}
//               </h2>
//               <p className="text-slate-500">{card.title}</p>
//             </div>
//             <div className="bg-slate-100 p-3 rounded-full">{card.icon}</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


import { Users, ShieldCheck, Briefcase, Activity } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="text-slate-800">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">
          Welcome back, Admin! Here’s a quick summary of your portal activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all">
          <div>
            <p className="text-slate-500 text-sm">Total Users</p>
            <h2 className="text-3xl font-semibold mt-1">1,240</h2>
          </div>
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <Users size={28} />
          </div>
        </div>

        {/* Active Admins */}
        <div className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all">
          <div>
            <p className="text-slate-500 text-sm">Active Admins</p>
            <h2 className="text-3xl font-semibold mt-1">12</h2>
          </div>
          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <ShieldCheck size={28} />
          </div>
        </div>

        {/* Recruiters */}
        <div className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all">
          <div>
            <p className="text-slate-500 text-sm">Recruiters</p>
            <h2 className="text-3xl font-semibold mt-1">58</h2>
          </div>
          <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
            <Briefcase size={28} />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition-all">
          <div>
            <p className="text-slate-500 text-sm">Pending Tasks</p>
            <h2 className="text-3xl font-semibold mt-1">23</h2>
          </div>
          <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
            <Activity size={28} />
          </div>
        </div>
      </div>

      {/* Chart / Activity Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Monthly Analytics</h2>
        <p className="text-slate-500 text-sm mb-4">
          You can visualize overall user engagement and recruitment activities
          here.
        </p>

        {/* Chart placeholder */}
        <div className="border border-dashed border-slate-300 rounded-lg h-64 flex items-center justify-center text-slate-400">
          📊 Chart or Graph Area (coming soon)
        </div>
      </div>
    </div>
  );
}
