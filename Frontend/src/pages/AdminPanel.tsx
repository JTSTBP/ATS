
import { useState, useEffect } from "react";
import PanelOutlet from "../components/PanelOutlet";
import { useAuth } from "../context/AuthProvider";
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
  FileSpreadsheet,

  Building2,
  Database,
  ClipboardCheck,
  History,
  MailCheck,
  MessageSquareMore,
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

  const { user } = useAuth();

  const allMenuItems = [
    { path: "/Admin", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Finance"] },
    { path: "/admin/users", label: "Manage Users", icon: Users, roles: ["Admin"] },
    { path: "/Admin/candidates", label: "Candidates", icon: Users, roles: ["Admin", "Finance"] },
    { path: "/Admin/jobs", label: "Requirements", icon: Briefcase, roles: ["Admin"] },
    { path: "/Admin/follow-ups", label: "Follow-ups", icon: MessageSquareMore, roles: ["Admin"] },
    { path: "/Admin/clients", label: "Clients", icon: Building2, roles: ["Admin", "Finance"] },
    {
      path: "/Admin/leaveApplications",
      label: "Leave Applications",
      icon: Calendar,
      roles: ["Admin", "Finance"]
    },
    { path: "/Admin/attendance", label: "Attendance", icon: ClipboardCheck, roles: ["Admin", "Finance"] },
    { path: "/Admin/finance", label: "Finance", icon: DollarSign, roles: ["Admin", "Finance"] },
    { path: "/Admin/statements-upload", label: "Statements Upload", icon: FileSpreadsheet, roles: ["Admin", "Finance"] },
    { path: "/Admin/return-invoices", label: "Return Invoices", icon: DollarSign, roles: ["Admin", "Finance"] },
    { path: "/Admin/reports", label: "Reports", icon: FileText, roles: ["Admin"] },
    { path: "/Admin/analytics", label: "Analytics", icon: BarChart3, roles: ["Admin"] },
    { path: "/Admin/activity", label: "Activity Logs", icon: ClipboardList, roles: ["Admin"] },
    { path: "/Admin/candidate-activity-timeline", label: "Candidate Activity Timeline", icon: History, roles: ["Admin"] },
    { path: "/Admin/ceo-daily-report-settings", label: "CEO Daily Report Settings", icon: MailCheck, roles: ["Admin"] },
    // Talent Database
    { path: "/Admin/talent-database", label: "Talent Database", icon: Database, roles: ["Admin", "Finance"] },

  ];

  const menuItems = allMenuItems.filter(item =>
    user?.designation === 'Finance'
      ? item.roles.includes("Finance")
      : true // Admin sees everything (or default)
  );

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
          <PanelOutlet />
        </main>
      </div>
    </div>
  );
}
