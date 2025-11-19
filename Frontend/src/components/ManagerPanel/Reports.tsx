import {
  Download,
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  Calendar,
} from "lucide-react";

export default function ManagerReports() {
  const metrics = [
    {
      name: "Total Applications",
      value: "1,248",
      change: "+18.2%",
      period: "vs last month",
      icon: FileText,
      color: "blue",
    },
    {
      name: "Candidates Hired",
      value: "42",
      change: "+12.5%",
      period: "vs last month",
      icon: CheckCircle,
      color: "green",
    },
    {
      name: "Active Positions",
      value: "28",
      change: "+5.3%",
      period: "vs last month",
      icon: Users,
      color: "purple",
    },
    {
      name: "Avg. Time to Hire",
      value: "18 days",
      change: "-3.2%",
      period: "vs last month",
      icon: Calendar,
      color: "orange",
    },
  ];

  const hiringFunnel = [
    { stage: "Applications Received", count: 1248, percentage: 100 },
    { stage: "Screening", count: 624, percentage: 50 },
    { stage: "First Interview", count: 312, percentage: 25 },
    { stage: "Second Interview", count: 125, percentage: 10 },
    { stage: "Offer Extended", count: 50, percentage: 4 },
    { stage: "Hired", count: 42, percentage: 3.4 },
  ];

  const topPositions = [
    { position: "Software Engineer", applications: 342, hired: 12 },
    { position: "Senior Dermatologist", applications: 156, hired: 8 },
    { position: "HR Manager", applications: 98, hired: 5 },
    { position: "Marketing Manager", applications: 124, hired: 6 },
    { position: "Sales Executive", applications: 218, hired: 11 },
  ];

  const monthlyData = [
    { month: "Jan", applications: 98, hired: 8 },
    { month: "Feb", applications: 112, hired: 9 },
    { month: "Mar", applications: 125, hired: 10 },
    { month: "Apr", applications: 138, hired: 11 },
    { month: "May", applications: 145, hired: 12 },
    { month: "Jun", applications: 156, hired: 13 },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">
            Analyze hiring metrics and performance
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${metric.color}-50`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                <TrendingUp className="w-4 h-4" />
                {metric.change}
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {metric.value}
            </div>
            <div className="text-sm text-gray-600">{metric.name}</div>
            <div className="text-xs text-gray-500 mt-1">{metric.period}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Hiring Funnel
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Application to hire conversion rates
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {hiringFunnel.map((stage, index) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {stage.stage}
                    </span>
                    <span className="text-sm text-gray-600">
                      {stage.count} ({stage.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Positions
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Most applied and hired positions
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topPositions.map((position) => (
                <div
                  key={position.position}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {position.position}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {position.applications} applications
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {position.hired}
                    </div>
                    <div className="text-xs text-gray-500">hired</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Monthly Trends
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Applications and hiring trends over time
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {monthlyData.map((data) => (
              <div key={data.month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 w-12">
                    {data.month}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">
                            Applications
                          </span>
                          <span className="text-xs font-medium text-gray-900">
                            {data.applications}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(data.applications / 200) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Hired</span>
                          <span className="text-xs font-medium text-gray-900">
                            {data.hired}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(data.hired / 20) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Applications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Hired</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
