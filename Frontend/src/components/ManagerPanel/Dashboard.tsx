import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function ManagerDashboard() {
  const stats = [
    {
      name: "Total Candidates",
      value: "124",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "blue",
    },
    {
      name: "Active Applications",
      value: "51",
      change: "+8%",
      trend: "up",
      icon: FileText,
      color: "green",
    },
    {
      name: "Shortlisted",
      value: "28",
      change: "+5%",
      trend: "up",
      icon: CheckCircle,
      color: "purple",
    },
    {
      name: "Pending Reviews",
      value: "15",
      change: "-3%",
      trend: "down",
      icon: Clock,
      color: "orange",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      candidate: "Dr Chaithra Shankar",
      action: "Applied for Senior Dermatologist position",
      time: "2 hours ago",
      status: "new",
    },
    {
      id: 2,
      candidate: "Rajesh Kumar",
      action: "Shortlisted for HR Manager position",
      time: "5 hours ago",
      status: "shortlisted",
    },
    {
      id: 3,
      candidate: "Priya Sharma",
      action: "Interview scheduled",
      time: "1 day ago",
      status: "interview",
    },
    {
      id: 4,
      candidate: "Amit Patel",
      action: "Rejected for Software Engineer position",
      time: "2 days ago",
      status: "rejected",
    },
  ];

  const upcomingInterviews = [
    {
      id: 1,
      candidate: "Sneha Reddy",
      position: "Marketing Manager",
      date: "Today",
      time: "2:00 PM",
    },
    {
      id: 2,
      candidate: "Vikram Singh",
      position: "Sales Executive",
      date: "Tomorrow",
      time: "10:30 AM",
    },
    {
      id: 3,
      candidate: "Meera Nair",
      position: "Product Designer",
      date: "Dec 18",
      time: "3:00 PM",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                {stat.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600 mt-1">{stat.name}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activities
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === "new"
                        ? "bg-blue-500"
                        : activity.status === "shortlisted"
                        ? "bg-green-500"
                        : activity.status === "interview"
                        ? "bg-purple-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        {activity.candidate}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Upcoming Interviews
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">
                    {interview.candidate}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {interview.position}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      {interview.date} at {interview.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-orange-900">Action Required</h3>
            <p className="text-sm text-orange-800 mt-1">
              You have 15 pending candidate reviews and 3 leave applications
              awaiting approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
