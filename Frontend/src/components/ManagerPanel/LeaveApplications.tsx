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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leave Applications</h1>
        <p className="text-gray-600 mt-1">
          Review and manage employee leave requests
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-600">
                {pendingCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending Approval</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-600">
                {
                  leaveApplications.filter((app) => app.status === "Approved")
                    .length
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">Approved</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-600">
                {
                  leaveApplications.filter((app) => app.status === "Rejected")
                    .length
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">Rejected</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              All Leave Applications
            </h2>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                All
              </button>
              <button className="px-3 py-1.5 text-sm border border-yellow-300 bg-yellow-50 rounded-lg text-yellow-700">
                Pending
              </button>
              <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Approved
              </button>
              <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Rejected
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {leaveApplications.map((application) => (
            <div key={application.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.employeeName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>{application.employeeId}</span>
                      <span>•</span>
                      <span>{application.department}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(application.status)}
              </div>

              <div className="grid grid-cols-2 gap-6 mb-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Leave Type</div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.leaveType}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Duration</div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.startDate} to {application.endDate} (
                        {application.days} days)
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Reason</div>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {application.reason}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Applied on {application.appliedDate}
                  </div>
                </div>
              </div>

              {application.status === "Pending" && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
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
