import { Activity } from 'lucide-react';

export const ActivityLog = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Activity Log</h2>
        <p className="text-gray-600">Track all system activities</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Activity className="w-16 h-16 text-gray-400" />
          <p className="text-gray-600 text-lg">No activities yet</p>
          <p className="text-gray-500 text-sm">Activity logs will appear here</p>
        </div>
      </div>
    </div>
  );
};
