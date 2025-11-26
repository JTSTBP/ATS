import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/RecruiterPanel/Sidebar";
import Navbar from "../components/RecruiterPanel/Navbar";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Calendar,
  UserCircle,
  Eye,
} from "lucide-react";

export default function MainLayout() {
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
    { path: "/Recruiter", label: "Dashboard", icon: LayoutDashboard },
    { path: "/Recruiter/upload-cv", label: "My Job", icon: Briefcase },
    { path: "/Recruiter/candidates", label: "My Candidates", icon: Users },
    { path: "/Recruiter/reports", label: "Reports", icon: FileText },
    {
      path: "/Recruiter/leave-applications",
      label: "Leave Applications",
      icon: Calendar,
    },
    { path: "/Recruiter/profile", label: "Profile", icon: UserCircle },
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
