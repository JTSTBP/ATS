

type MenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
};

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
  menuItems: MenuItem[];
};
export const Sidebar = ({ activePage, onNavigate, menuItems }: SidebarProps) => {


  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-[calc(100vh-4rem)] flex-shrink-0">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
