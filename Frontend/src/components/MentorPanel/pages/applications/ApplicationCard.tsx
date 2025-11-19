import { User, Briefcase } from "lucide-react";

// Local type definitions (replace Supabase types)
type Application = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  priority: string;
  interview_date?: string | null;
  interview_notes?: string | null;
};

type Job = {
  id: string;
  title: string;
  department: string;
};

type Candidate = {
  id: string;
  full_name: string;
  email: string;
};

type ApplicationCardProps = {
  application: Application & { job: Job; candidate: Candidate };
  onStatusUpdate?: (id: string, status: string) => void;
};

export const ApplicationCard = ({
  application,
  onStatusUpdate,
}: ApplicationCardProps) => {
  const statuses = [
    "Screening",
    "Shortlisted",
    "Interview",
    "Offer",
    "Hired",
    "Rejected",
  ];

  const priorityColors: Record<string, string> = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <User className="w-4 h-4 text-gray-600" />
            <h4 className="font-semibold text-gray-800">
              {application.candidate.full_name}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <Briefcase className="w-3 h-3 text-gray-500" />
            <p className="text-sm text-gray-600">{application.job.title}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            priorityColors[application.priority]
          }`}
        >
          {application.priority}
        </span>

        {application.interview_date && (
          <span className="text-xs text-gray-500">
            {new Date(application.interview_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {onStatusUpdate && (
        <select
          value={application.status}
          onChange={(e) => onStatusUpdate(application.id, e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      )}

      {application.interview_notes && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
          {application.interview_notes}
        </p>
      )}
    </div>
  );
};
