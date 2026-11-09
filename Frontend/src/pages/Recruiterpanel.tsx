import { useState, useEffect } from "react";
import '../components/RecruiterPanel/Dashboard.css';
import PanelOutlet from "../components/PanelOutlet";
import Sidebar from "../components/RecruiterPanel/Sidebar";
import Navbar from "../components/RecruiterPanel/Navbar";
import { LayoutDashboard, Briefcase, Users, FileText, Calendar, Database, MessageSquareMore } from "lucide-react";

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
    { path: "/Recruiter/upload-cv", label: "My Requirements", icon: Briefcase },
    { path: "/Recruiter/candidates", label: "My Candidates", icon: Users },
    { path: "/Recruiter/follow-ups", label: "Candidate Sourcing", icon: MessageSquareMore },
    { path: "/Recruiter/reports", label: "Reports", icon: FileText },
    { path: "/Recruiter/leave-applications", label: "Leave Applications", icon: Calendar },
    { path: "/Recruiter/talent-database", label: "Talent Database", icon: Database }
  ];

  return (
    <div className="recruiter-shell min-h-screen">
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

        <main className="p-3 sm:p-5 lg:p-6 min-w-0">
          <PanelOutlet />
        </main>
      </div>
    </div>
  );
}
