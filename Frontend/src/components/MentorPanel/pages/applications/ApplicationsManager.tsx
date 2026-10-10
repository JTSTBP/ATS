
import { useState, useEffect } from "react";
import { Search, FileText } from "lucide-react";
import { ApplicationCard } from "./ApplicationCard";
import { useAuth } from "../../../../context/AuthProvider";
import { useUserContext } from "../../../../context/UserProvider";
import { useCandidateContext } from "../../../../context/CandidatesProvider";

export const ApplicationsManager = () => {
  const { user } = useAuth();
  const { candidates, fetchallCandidates } = useCandidateContext();
  const { users } = useUserContext();

  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("all");
  const [filterJobTitle, setFilterJobTitle] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    fetchallCandidates();

    // Fetch all clients from API
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clients`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.clients) {
          setClients(data.clients);
        }
      })
      .catch(err => console.error('Error fetching clients:', err));
  }, [user]);

  useEffect(() => {
    if (!candidates || !users || !user) return;

    const directReportees = users.filter((u: any) => u?.reporter?._id === user._id);
    let allReporteeIds = directReportees.map((u: any) => u._id);

    if (user.designation === "Manager") {
      directReportees.forEach((mentor: any) => {
        const mentorReportees = users.filter(
          (u: any) => u?.reporter?._id === mentor._id
        );
        allReporteeIds = [
          ...allReporteeIds,
          ...mentorReportees.map((u: any) => u._id),
        ];
      });
    }

    const filtered = candidates.filter(
      (c: any) =>
        c.createdBy?._id === user._id ||
        allReporteeIds.includes(c.createdBy?._id)
    );

    setFilteredApplications(filtered);
  }, [candidates, users, user]);

  const uniqueJobTitles = Array.from(
    new Set(
      filteredApplications
        .map((app) => app.jobId?.title)
        .filter(Boolean)
    )
  ).sort();

  const finalApplications = filteredApplications.filter((app) => {
    const matchesSearch =
      app.dynamicFields?.candidateName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      app.jobId?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || app.status === filterStatus;

    const matchesClient =
      filterClient === "all" ||
      app.jobId?.clientId?.companyName === filterClient;

    const matchesJobTitle =
      filterJobTitle === "all" ||
      app.jobId?.title === filterJobTitle;

    return matchesSearch && matchesStatus && matchesClient && matchesJobTitle;
  });

  const groupedByStatus = {
    New: finalApplications.filter((a) => a.status === "New"),
    Shortlisted: finalApplications.filter((a) => a.status === "Shortlisted"),
    Interviewed: finalApplications.filter((a) => a.status === "Interviewed"),
    Selected: finalApplications.filter((a) => a.status === "Selected"),
    Joined: finalApplications.filter((a) => a.status === "Joined"),
    Rejected: finalApplications.filter((a) => a.status === "Rejected"),
  };

  const sortedGroups = Object.entries(groupedByStatus).sort((a, b) => {
    const countA = a[1].length;
    const countB = b[1].length;
    return sortOrder === "desc" ? countB - countA : countA - countB;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Applications
          </h2>
          <p className="text-gray-600">
            Track candidate applications through the pipeline
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by candidate name or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">All Clients</option>
            {clients.map((client: any) => (
              <option key={client._id} value={client.companyName}>
                {client.companyName}
              </option>
            ))}
          </select>

          <select
            value={filterJobTitle}
            onChange={(e) => setFilterJobTitle(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">All Job Titles</option>
            {uniqueJobTitles.map((title: any) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interviewed">Interviewed</option>
            <option value="Selected">Selected</option>
            <option value="Joined">Joined</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="desc">High → Low</option>
            <option value="asc">Low → High</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sortedGroups.map(([status, apps]) => {
          const statusColors: Record<string, string> = {
            New: "from-yellow-400 to-yellow-500",
            Shortlisted: "from-blue-400 to-blue-500",
            Interviewed: "from-cyan-400 to-cyan-500",
            Selected: "from-purple-400 to-purple-500",
            Joined: "from-green-400 to-green-500",
            Rejected: "from-red-400 to-red-500",
          };

          return (
            <div
              key={status}
              className="bg-gray-50 rounded-xl p-4 border border-gray-200"
            >
              <div
                className={`bg-gradient-to-r ${statusColors[status]} text-white px-4 py-3 rounded-lg mb-4`}
              >
                <h3 className="font-bold text-lg">{status}</h3>
                <p className="text-sm opacity-90">{apps.length} applications</p>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {apps.map((app: any) => (
                  <ApplicationCard key={app._id} application={app} />
                ))}

                {apps.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No applications</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
