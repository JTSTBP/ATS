import { Outlet } from 'react-router-dom';
import ManagerSidebar from './ManagerSidebar';

export default function ManagerLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
