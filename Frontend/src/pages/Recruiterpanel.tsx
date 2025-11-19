import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/RecruiterPnel/Sidebar';
import Navbar from '../components/RecruiterPnel/Navbar';
import {
  LayoutDashboard,
  Upload,
  Users,
  FileText,
  Calendar,
  X,
  Menu,
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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const menuItems = [
    { path: "/Recruiter", label: "Dashboard", icon: LayoutDashboard },
    { path: "/Recruiter/upload-cv", label: "Upload CV", icon: Upload },
    { path: "/Recruiter/candidates", label: "My Candidates", icon: Users },
    { path: "/Recruiter/reports", label: "Reports", icon: FileText },
    {
      path: "/Recruiter/leave-applications",
      label: "Leave Applications",
      icon: Calendar,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} menuItems={menuItems} />

      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-64' : 'ml-0'
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
