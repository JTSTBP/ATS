import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/RecruiterPnel/Sidebar";
import Navbar from "../components/RecruiterPnel/Navbar";
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
  MessageSquare,
  Activity,
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
    { path: "/Mentor/jobs", label: "Jobs", icon: Briefcase },
    { path: "/Mentor/candidates", label: "Candidates", icon: Users },
    { path: "/Mentor/applications", label: "Applications", icon: FileText },
    {
      path: "/Mentor/leaveapplications",
      label: "Leave Applications",
      icon: Calendar,
    },
    { path: "/Mentor/feedback", label: "Feedback", icon: MessageSquare },
    { path: "/Mentor/reports", label: "Reports", icon: BarChart3 },
    { path: "/Mentor/activity", label: "Activity Log", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        menuItems={menuItems}
      />

      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-64" : "ml-0"
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
