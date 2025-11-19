

import { useState } from "react";
import { Plus, X, Search, Edit, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserContext } from "../../context/UserProvider";

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useUserContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    password: "",
    reporter: "",
    isAdmin: false,
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      designation: "",
      password: "",
      reporter: "",
      isAdmin: false,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editUserId) {
        const success = await updateUser(editUserId, formData);
        if (success) {
          setShowModal(false);
          setEditUserId(null);
          resetForm();
        }
      } else {
        const success = await addUser(formData);
        if (success) {
          setShowModal(false);
          resetForm();
        }
      }
    } catch (err) {
      console.error("Error while saving user:", err);
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      name: user.name,
      email: user.email,
      designation: user.designation,
      password: "",
      reporter: user.reporter || "",
      isAdmin: user.isAdmin,
    });
    setEditUserId(user._id);
    setShowModal(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or designation..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              className="absolute left-3 top-2.5 text-slate-500"
            />
          </div>

          <button
            onClick={() => {
              setEditUserId(null);
              setFormData({
                name: "",
                email: "",
                designation: "",
                password: "",
                reporter: "",
                isAdmin: false,
              });
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Designation</th>
              <th className="py-3 px-4 text-left">Reporter</th>
              <th className="py-3 px-4 text-left">Admin</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className="border-t hover:bg-slate-50">
                <td className="py-3 px-4">{user.name}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">{user.designation}</td>
                <td className="py-3 px-4">{user.reporter?.name || "—"}</td>
                <td className="py-3 px-4">{user.isAdmin ? "Yes" : "No"}</td>
                <td className="py-3 px-4 flex gap-3">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:underline"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => deleteUser(user._id)}
                    className="text-red-600 hover:underline"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 text-slate-500 hover:text-slate-800"
              >
                <X size={22} />
              </button>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                {editUserId ? "Edit User" : "Add New User"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg"
                />
                {/* Email */}
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg"
                />
                {/* Designation */}
                <select
                  name="designation"
                  required
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg"
                >
                  <option value="">Select Designation</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Manager">Manager</option>
                </select>
                {/* Reporter */}
                <select
                  name="reporter"
                  value={formData.reporter}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-lg"
                >
                  <option value="">Select Reporter</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} — {u.designation}
                    </option>
                  ))}
                </select>
                {/* Password */}
                {!editUserId && (
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded-lg"
                  />
                )}
                {/* Admin checkbox */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={handleChange}
                  />
                  Make Admin
                </label>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                >
                  {editUserId ? "Update User" : "Add User"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
