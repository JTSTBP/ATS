import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  FileText,
} from "lucide-react";

export default function ManagerLeaveAppl() {
  const leaveApplications = [
    {
      id: 1,
      employeeName: "Rajesh Kumar",
      employeeId: "EMP001",
      department: "Engineering",
      leaveType: "Sick Leave",
      startDate: "2025-12-20",
      endDate: "2025-12-22",
      days: 3,
      reason: "Medical treatment required",
      status: "Pending",
      appliedDate: "2025-12-15",
    },
    {
      id: 2,
      employeeName: "Priya Sharma",
      employeeId: "EMP002",
      department: "HR",
      leaveType: "Casual Leave",
      startDate: "2025-12-18",
      endDate: "2025-12-19",
      days: 2,
      reason: "Personal work",
      status: "Approved",
      appliedDate: "2025-12-14",
    },
    {
      id: 3,
      employeeName: "Amit Patel",
      employeeId: "EMP003",
      department: "Sales",
      leaveType: "Privilege Leave",
      startDate: "2025-12-25",
      endDate: "2025-12-31",
      days: 7,
      reason: "Family vacation",
      status: "Pending",
      appliedDate: "2025-12-13",
    },
    {
      id: 4,
      employeeName: "Sneha Reddy",
      employeeId: "EMP004",
      department: "Marketing",
      leaveType: "Sick Leave",
      startDate: "2025-12-16",
      endDate: "2025-12-17",
      days: 2,
      reason: "Fever and cold",
      status: "Rejected",
      appliedDate: "2025-12-12",
    },
    {
      id: 5,
      employeeName: "Vikram Singh",
      employeeId: "EMP005",
      department: "Operations",
      leaveType: "Casual Leave",
      startDate: "2025-12-21",
      endDate: "2025-12-21",
      days: 1,
      reason: "Personal appointment",
      status: "Pending",
      appliedDate: "2025-12-11",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const pendingCount = leaveApplications.filter(
    (app) => app.status === "Pending"
  ).length;

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">Leave Applications</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Review and manage employee leave requests
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600">
                {pendingCount}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wider mt-1">Pending Approval</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {
                  leaveApplications.filter((app) => app.status === "Approved")
                    .length
                }
              </div>
              <div className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wider mt-1">Approved</div>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-red-600">
                {
                  leaveApplications.filter((app) => app.status === "Rejected")
                    .length
                }
              </div>
              <div className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wider mt-1">Rejected</div>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">
              All Leave Applications
            </h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0">
              <button className="whitespace-nowrap px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-all">
                All
              </button>
              <button className="whitespace-nowrap px-4 py-2 text-xs font-bold border border-yellow-200 bg-yellow-50 rounded-lg text-yellow-700 shadow-sm">
                Pending
              </button>
              <button className="whitespace-nowrap px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-all">
                Approved
              </button>
              <button className="whitespace-nowrap px-4 py-2 text-xs font-bold border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-all">
                Rejected
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {leaveApplications.map((application) => (
            <div key={application.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div className="flex items-center sm:items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0 border border-blue-100">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      {application.employeeName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                      <span>{application.employeeId}</span>
                      <span className="hidden xs:inline">•</span>
                      <span>{application.department}</span>
                    </div>
                  </div>
                </div>
                <div className="self-start">
                  {getStatusBadge(application.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div className="flex items-start gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Leave Type</div>
                      <div className="text-sm font-bold text-gray-700 mt-0.5">
                        {application.leaveType}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration</div>
                      <div className="text-sm font-bold text-gray-700 mt-0.5">
                        {application.startDate} to {application.endDate}
                        <span className="ml-1 text-blue-600">({application.days} days)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                    <span>Reason</span>
                    <span className="text-[10px] normal-case font-medium">Applied on {application.appliedDate}</span>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed font-medium">
                    {application.reason}
                  </div>
                </div>
              </div>

              {application.status === "Pending" && (
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 pt-4 border-t border-gray-100">
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-xs font-bold shadow-md shadow-green-100 transition-all">
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-xs font-bold shadow-md shadow-red-100 transition-all">
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button className="flex-1 px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-white hover:text-gray-900 text-xs font-bold transition-all">
                    View Details
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
