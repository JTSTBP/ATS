

import { Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md border-b border-slate-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            {user?.designation === "Recruiter"
              ? "Recruiter Portal"
              : user?.designation === "Manager"
                ? "Manager Portal"
                : user?.designation === "Mentor"
                  ? "Mentor Portal"
                  : "Finance Portal"}
          </h1>
        </div>

        <div className="flex items-center gap-3 relative">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-700">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500">
              {user?.designation || "Staff"}
            </p>
          </div>

          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
          >
            <User size={20} className="text-white" />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-14 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <p className="font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-sm text-slate-600">{user?.email}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {user?.designation}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                >
                  <LogOut size={18} />
                  <span className="font-medium">Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          className="fixed inset-0 z-40"
        />
      )}
    </nav>
  );
}
