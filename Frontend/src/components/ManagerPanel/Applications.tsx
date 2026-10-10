import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function ManagerApplication() {
  const applications = [
    {
      id: 1,
      jobTitle: "Senior Dermatologist",
      candidate: "Dr Chaithra Shankar",
      appliedDate: "2025-10-29",
      status: "Under Review",
      experience: "2 years",
      location: "Bengaluru",
      salary: "12 LPA",
    },
    {
      id: 2,
      jobTitle: "HR Manager",
      candidate: "Rajesh Kumar",
      appliedDate: "2025-10-28",
      status: "Shortlisted",
      experience: "5 years",
      location: "Mumbai",
      salary: "18 LPA",
    },
    {
      id: 3,
      jobTitle: "Software Engineer",
      candidate: "Priya Sharma",
      appliedDate: "2025-10-27",
      status: "Interview Scheduled",
      experience: "3 years",
      location: "Pune",
      salary: "15 LPA",
    },
    {
      id: 4,
      jobTitle: "Marketing Manager",
      candidate: "Amit Patel",
      appliedDate: "2025-10-26",
      status: "Rejected",
      experience: "4 years",
      location: "Delhi",
      salary: "16 LPA",
    },
    {
      id: 5,
      jobTitle: "Sales Executive",
      candidate: "Sneha Reddy",
      appliedDate: "2025-10-25",
      status: "New",
      experience: "1 year",
      location: "Hyderabad",
      salary: "8 LPA",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Under Review":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Shortlisted":
        return "bg-green-50 text-green-700 border-green-200";
      case "Interview Scheduled":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Shortlisted":
        return <CheckCircle className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Applications</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Track and manage all job applications
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            <button className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-200 w-full lg:w-auto">
              <Download className="w-4 h-4" />
              <span>Export Applications</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Candidate
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Job Title
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Experience
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Location
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Expected Salary
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Applied Date
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                        {application.candidate.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {application.candidate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {application.jobTitle}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {application.experience}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {application.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {application.salary}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {application.appliedDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        application.status
                      )}`}
                    >
                      {getStatusIcon(application.status)}
                      {application.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Showing <span className="text-gray-600 font-extrabold">1</span> -{" "}
            <span className="text-gray-600 font-extrabold">5</span> of{" "}
            <span className="text-gray-600 font-extrabold">5</span> Applications
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-white transition-all">
              Previous
            </button>
            <button className="w-9 h-9 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 transition-all">
              1
            </button>
            <button className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-white transition-all">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
