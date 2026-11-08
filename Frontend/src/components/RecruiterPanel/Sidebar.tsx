import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X } from "lucide-react";
import { preloadPanelRoute } from "../../utils/preloadPanelRoute";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  menuItems: { path: string; label: string; icon: any }[];
}



export default function Sidebar({ isOpen, toggleSidebar, menuItems }: SidebarProps) {
  return (
    <>
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full w-64 bg-[#f0f0ff] text-slate-900 border-r border-indigo-100 z-40 overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-indigo-100">
          <div><p className="text-[10px] tracking-widest text-emerald-700">● RECRUITMENT OPS</p><h2 className="text-base font-semibold mt-2">Jobs Territory ATS</h2><p className="text-xs text-slate-500 mt-1">Recruiter workspace</p></div>
          <button
            onClick={toggleSidebar}
            aria-label="Close navigation"
            className="lg:hidden text-slate-500 hover:text-indigo-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/Recruiter'}
                    onMouseEnter={() => preloadPanelRoute(item.path)}
                    onFocus={() => preloadPanelRoute(item.path)}
                    onTouchStart={() => preloadPanelRoute(item.path)}
                    onClick={() => {
                      if (window.innerWidth < 1024) toggleSidebar();
                      // Reset Job filters when navigating via main sidebar
                      sessionStorage.removeItem('ats_jobs_searchTerm');
                      sessionStorage.removeItem('ats_jobs_clientSearchTerm');
                      sessionStorage.removeItem('ats_jobs_filterStatus');
                      sessionStorage.removeItem('ats_jobs_currentPage');
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 text-[13px] rounded-lg transition-all duration-200 ${isActive
                        ? "bg-indigo-700 text-white shadow-sm"
                        : "text-slate-700 hover:bg-indigo-100 hover:text-indigo-900"
                      }`
                    }
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </motion.aside>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
}
