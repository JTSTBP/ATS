
import { ReactNode, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import Navbar from "../components/Navbar";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Activity,
  Calendar,
  Building2,
} from "lucide-react";

type MainLayoutProps = {
  children: ReactNode;
  onNavigate: (page: string) => void;
  activePage: string;
};

export const MainLayout = ({
  children,
  onNavigate,
  activePage,
}: MainLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "jobs",
      label: "Requirements",
      icon: Briefcase,
      color: "from-green-500 to-green-600",
    },
    {
      id: "candidates",
      label: "Candidates",
      icon: Users,
      color: "from-orange-500 to-orange-600",
    },
    {
      id: "applications",
      label: "Applications",
      icon: FileText,
      color: "from-cyan-500 to-cyan-600",
    },
    {
      id: "leaveapplications",
      label: "Leave Applications",
      icon: Calendar,
      color: "from-pink-500 to-pink-600",
    },
    {
      id: "clients",
      label: "Clients",
      icon: Building2,
      color: "from-indigo-500 to-indigo-600",
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: MessageSquare,
      color: "from-pink-500 to-pink-600",
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "activity",
      label: "Activity Log",
      icon: Activity,
      color: "from-teal-500 to-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ✅ Pass toggleSidebar to Navbar */}
      <Navbar toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden">
        {/* ✅ Sidebar visibility controlled by state */}
        <div
          className={`transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <Sidebar
            activePage={activePage}
            onNavigate={onNavigate}
            menuItems={menuItems}
          />
        </div>

        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
