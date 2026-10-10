import { Shield, Lock, UserCog, KeyRound } from "lucide-react";

export default function RolesAndPermissions() {
  const roles = [
    {
      name: "Admin",
      description: "Full access to all modules, users, and reports.",
      permissions: [
        "Manage Users",
        "Access Reports",
        "Edit Settings",
        "View Analytics",
      ],
      color: "text-blue-600 bg-blue-100",
    },
    {
      name: "Recruiter",
      description:
        "Can manage candidates, upload CVs, and view recruitment reports.",
      permissions: ["Upload CVs", "Manage Candidates", "View Reports"],
      color: "text-green-600 bg-green-100",
    },
    {
      name: "Manager",
      description: "Can view reports, approve leaves, and oversee recruiters.",
      permissions: ["Approve Leaves", "View Reports", "Team Oversight"],
      color: "text-orange-600 bg-orange-100",
    },
    {
      name: "Mentor",
      description:
        "Has read-only access to candidate data and performance reports.",
      permissions: ["View Candidates", "View Reports"],
      color: "text-purple-600 bg-purple-100",
    },
    {
      name: "Finance",
      description: "Manage invoices, payments, and financial reports.",
      permissions: ["Create Invoices", "Track Payments", "View Financial Reports"],
      color: "text-rose-600 bg-rose-100",
    },
  ];

  return (
    <div className="text-slate-800">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Roles & Permissions</h1>
        <p className="text-slate-500 mt-1">
          Define and control what each user role can access across the system.
        </p>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white shadow rounded-xl p-5 flex justify-between items-center hover:shadow-md transition">
          <div>
            <p className="text-slate-500 text-sm">Total Roles</p>
            <h2 className="text-3xl font-semibold mt-1">5</h2>
          </div>
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <Shield size={28} />
          </div>
        </div>
        <div className="bg-white shadow rounded-xl p-5 flex justify-between items-center hover:shadow-md transition">
          <div>
            <p className="text-slate-500 text-sm">Permissions</p>
            <h2 className="text-3xl font-semibold mt-1">14</h2>
          </div>
          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <KeyRound size={28} />
          </div>
        </div>
        <div className="bg-white shadow rounded-xl p-5 flex justify-between items-center hover:shadow-md transition">
          <div>
            <p className="text-slate-500 text-sm">Restricted Roles</p>
            <h2 className="text-3xl font-semibold mt-1">2</h2>
          </div>
          <div className="bg-red-100 text-red-600 p-3 rounded-lg">
            <Lock size={28} />
          </div>
        </div>
        <div className="bg-white shadow rounded-xl p-5 flex justify-between items-center hover:shadow-md transition">
          <div>
            <p className="text-slate-500 text-sm">Custom Roles</p>
            <h2 className="text-3xl font-semibold mt-1">1</h2>
          </div>
          <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
            <UserCog size={28} />
          </div>
        </div>
      </div>

      {/* Role Details Table */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Role Details</h2>

        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="py-3 px-4 text-left">Role Name</th>
              <th className="py-3 px-4 text-left">Description</th>
              <th className="py-3 px-4 text-left">Permissions</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.name} className="border-t hover:bg-slate-50">
                <td className="py-3 px-4 font-medium">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${role.color}`}
                  >
                    {role.name}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">{role.description}</td>
                <td className="py-3 px-4">
                  <ul className="list-disc list-inside text-slate-600">
                    {role.permissions.map((perm, i) => (
                      <li key={i}>{perm}</li>
                    ))}
                  </ul>
                </td>
                <td className="py-3 px-4">
                  <button className="text-blue-600 hover:underline font-medium">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
