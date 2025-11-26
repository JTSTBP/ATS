import { useEffect, useState } from 'react';
import {
  Download,
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../context/AuthProvider";
import { useUserContext } from "../../context/UserProvider";
import { useCandidateContext } from "../../context/CandidatesProvider";
import { useJobContext } from "../../context/DataProvider";

export default function ManagerReports() {
  const { user } = useAuth();
  const { users } = useUserContext();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { jobs, fetchJobs } = useJobContext();

  const [metrics, setMetrics] = useState([
    { name: "Total Applications", value: "0", change: "0%", period: "vs last month", icon: FileText, color: "blue" },
    { name: "Candidates Hired", value: "0", change: "0%", period: "vs last month", icon: CheckCircle, color: "green" },
    { name: "Active Positions", value: "0", change: "0%", period: "vs last month", icon: Users, color: "purple" },
    { name: "Rejection Rate", value: "0%", change: "0%", period: "vs last month", icon: Calendar, color: "orange" },
  ]);

  const [hiringFunnel, setHiringFunnel] = useState<any[]>([]);
  const [topPositions, setTopPositions] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchJobs();
    fetchallCandidates();
  }, []);

  useEffect(() => {
    if (!user || !jobs || !candidates || !users) return;

    // --- 1. Filter Logic (Manager + Reportees) ---
    let filteredJobs = [];
    const directReportees = users.filter((u: any) => u?.reporter?._id === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);

    // Get indirect reportees
    directReportees.forEach((mentor: any) => {
      const mentorReportees = users.filter(
        (u: any) => u?.reporter?._id === mentor._id
      );
      allReporteeIds = [
        ...allReporteeIds,
        ...mentorReportees.map((u: any) => u._id),
      ];
    });

    // Filter jobs
    filteredJobs = jobs.filter((job: any) => {
      const creatorId = typeof job.CreatedBy === 'object' ? job.CreatedBy?._id : job.CreatedBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    // Filter candidates
    const filteredCandidates = candidates.filter((c: any) => {
      const creatorId = c.createdBy?._id || c.createdBy;
      return creatorId === user._id || allReporteeIds.includes(creatorId);
    });

    // --- 2. Calculate Metrics ---
    const totalApplications = filteredCandidates.length;
    const hiredCount = filteredCandidates.filter((c: any) => ['Selected', 'Joined'].includes(c.status)).length;
    const activePositions = filteredJobs.filter((j: any) => j.status === 'Open').length;
    const rejectedCount = filteredCandidates.filter((c: any) => c.status === 'Rejected').length;
    const rejectionRate = totalApplications > 0 ? Math.round((rejectedCount / totalApplications) * 100) : 0;

    setMetrics([
      { name: "Total Applications", value: totalApplications.toString(), change: "+0%", period: "vs last month", icon: FileText, color: "blue" },
      { name: "Candidates Hired", value: hiredCount.toString(), change: "+0%", period: "vs last month", icon: CheckCircle, color: "green" },
      { name: "Active Positions", value: activePositions.toString(), change: "+0%", period: "vs last month", icon: Users, color: "purple" },
      { name: "Rejection Rate", value: `${rejectionRate}%`, change: "+0%", period: "vs last month", icon: Calendar, color: "orange" },
    ]);

    // --- 3. Hiring Funnel ---
    const funnelCounts = {
      New: filteredCandidates.filter((c: any) => c.status === 'New').length,
      Shortlisted: filteredCandidates.filter((c: any) => c.status === 'Shortlisted').length,
      Interviewed: filteredCandidates.filter((c: any) => c.status === 'Interviewed').length,
      Selected: filteredCandidates.filter((c: any) => c.status === 'Selected').length,
      Joined: filteredCandidates.filter((c: any) => c.status === 'Joined').length,
    };

    setHiringFunnel([
      { stage: "New", count: funnelCounts.New, percentage: totalApplications > 0 ? Math.round((funnelCounts.New / totalApplications) * 100) : 0 },
      { stage: "Shortlisted", count: funnelCounts.Shortlisted, percentage: totalApplications > 0 ? Math.round((funnelCounts.Shortlisted / totalApplications) * 100) : 0 },
      { stage: "Interviewed", count: funnelCounts.Interviewed, percentage: totalApplications > 0 ? Math.round((funnelCounts.Interviewed / totalApplications) * 100) : 0 },
      { stage: "Selected", count: funnelCounts.Selected, percentage: totalApplications > 0 ? Math.round((funnelCounts.Selected / totalApplications) * 100) : 0 },
      { stage: "Joined", count: funnelCounts.Joined, percentage: totalApplications > 0 ? Math.round((funnelCounts.Joined / totalApplications) * 100) : 0 },
    ]);

    // --- 4. Top Positions ---
    const jobStats: Record<string, { title: string, applications: number, hired: number }> = {};

    filteredCandidates.forEach((c: any) => {
      const jobId = typeof c.jobId === 'object' ? c.jobId?._id : c.jobId;
      const jobTitle = typeof c.jobId === 'object' ? c.jobId?.title : jobs.find((j: any) => j._id === jobId)?.title || 'Unknown Job';

      if (!jobStats[jobId]) {
        jobStats[jobId] = { title: jobTitle, applications: 0, hired: 0 };
      }
      jobStats[jobId].applications++;
      if (['Selected', 'Joined'].includes(c.status)) {
        jobStats[jobId].hired++;
      }
    });

    const sortedPositions = Object.values(jobStats)
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5)
      .map(p => ({ position: p.title, applications: p.applications, hired: p.hired }));

    setTopPositions(sortedPositions);

    // --- 5. Monthly Trends (Last 6 Months) ---
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const trendData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonth - i);
      const monthIdx = d.getMonth();
      const year = d.getFullYear();
      const monthName = months[monthIdx];

      const candidatesInMonth = filteredCandidates.filter((c: any) => {
        const cDate = new Date(c.createdAt || c.updatedAt); // Fallback if createdAt missing
        return cDate.getMonth() === monthIdx && cDate.getFullYear() === year;
      });

      const hiredInMonth = candidatesInMonth.filter((c: any) => ['Selected', 'Joined'].includes(c.status)).length;

      trendData.push({
        month: monthName,
        applications: candidatesInMonth.length,
        hired: hiredInMonth
      });
    }
    setMonthlyData(trendData);

  }, [user, jobs, candidates, users]);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">
            Analyze hiring metrics and performance
          </p>
        </div>
        {/* <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="w-4 h-4" />
          Export Report
        </button> */}
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
              {/* <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                <TrendingUp className="w-4 h-4" />
                {metric.change}
              </div> */}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {metric.value}
            </div>
            <div className="text-sm text-gray-600">{metric.name}</div>
            {/* <div className="text-xs text-gray-500 mt-1">{metric.period}</div> */}
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
              {hiringFunnel.map((stage) => (
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
              {topPositions.length > 0 ? (
                topPositions.map((position) => (
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
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">No data available</div>
              )}
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
                              width: `${data.applications > 0 ? (data.applications / 50) * 100 : 0}%`, // Scaled for visibility
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
                            style={{ width: `${data.hired > 0 ? (data.hired / 10) * 100 : 0}%` }} // Scaled for visibility
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
