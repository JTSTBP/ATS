import { BarChart3 } from 'lucide-react';

export const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Reports</h2>
        <p className="text-gray-600">View recruitment analytics and reports</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <BarChart3 className="w-16 h-16 text-gray-400" />
          <p className="text-gray-600 text-lg">No data available</p>
          <p className="text-gray-500 text-sm">Reports will be generated when data is available</p>
        </div>
      </div>
    </div>
  );
};
