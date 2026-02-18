import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/RecruiterPanel/Sidebar";
import Navbar from "../components/RecruiterPanel/Navbar";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  Shield,
  X,
  Briefcase,
  Calendar,
  Activity,
  Building2,
  UserCircle,
} from "lucide-react";

export default function MentorLayout() {
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
    { path: "/Mentor/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/Mentor/jobs", label: "Requirements", icon: Briefcase },
    { path: "/Mentor/candidates", label: "Candidates", icon: Users },
    { path: "/Mentor/applications", label: "Applications", icon: FileText },
    {
      path: "/Mentor/leaveapplications",
      label: "Leave Applications",
      icon: Calendar,
    },
    { path: "/Mentor/clients", label: "Clients", icon: Building2 },
    { path: "/Mentor/reports", label: "Reports", icon: BarChart3 },
    { path: "/Mentor/activity", label: "Activity Log", icon: Activity },
    { path: "/Mentor/profile", label: "Profile", icon: UserCircle },
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
