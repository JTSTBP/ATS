
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/RecruiterPanel/Sidebar";
import Navbar from "../components/RecruiterPanel/Navbar";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Calendar,
  ClipboardList,
  Briefcase,
  DollarSign,
} from "lucide-react";

export default function AdminLayout() {
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
    { path: "/Admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/users", label: "Manage Users", icon: Users },
    { path: "/Admin/candidates", label: "Candidates", icon: Users },
    { path: "/Admin/jobs", label: "Jobs", icon: Briefcase },
    {
      path: "/Admin/leaveApplications",
      label: "Leave Applications",
      icon: Calendar,
    },


    { path: "/Admin/finance", label: "Finance", icon: DollarSign },
    { path: "/Admin/reports", label: "Reports", icon: FileText },
    { path: "/Admin/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/Admin/tasks", label: "Task Management", icon: ClipboardList },


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
