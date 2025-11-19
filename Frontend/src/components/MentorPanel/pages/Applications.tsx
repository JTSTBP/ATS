import { FileText, Plus } from "lucide-react";

export const ApplicationsManager = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Applications
          </h2>
          <p className="text-gray-600">Manage job applications</p>
        </div>
        {/* <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition">
          <Plus className="w-5 h-5" />
          <span>New Application</span>
        </button> */}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <FileText className="w-16 h-16 text-gray-400" />
          <p className="text-gray-600 text-lg">No applications yet</p>
          <p className="text-gray-500 text-sm">Applications will appear here</p>
        </div>
      </div>
    </div>
  );
};
