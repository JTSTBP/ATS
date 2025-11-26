

import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/RecruiterPanel/Sidebar";
import Navbar from "../components/RecruiterPanel/Navbar";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Briefcase,
  Calendar,
  Building2,
  UserCircle,
} from "lucide-react";

export default function ManagerPanel() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const menuItems = [
    { path: "/Manager/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/Manager/jobs", label: "Jobs", icon: Briefcase },
    { path: "/Manager/candidates", label: "Candidates", icon: Users },
    { path: "/Manager/applications", label: "Applications", icon: FileText },
    {
      path: "/Manager/leave-applications",
      label: "Leave Applications",
      icon: Calendar,
    },
    { path: "/Manager/clients", label: "Clients", icon: Building2 },
    { path: "/Manager/reports", label: "Reports", icon: BarChart3 },
    { path: "/Manager/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        menuItems={menuItems}
      />

      <div
        className={`transition-all duration-300 ${isSidebarOpen ? "lg:ml-64" : "ml-0"
          }`}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
