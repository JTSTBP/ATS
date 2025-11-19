import { useState, useEffect } from "react";
import { Plus, Search, FileText } from "lucide-react";
import { ApplicationForm } from "./ApplicationForm";
import { ApplicationCard } from "./ApplicationCard";
import { applicationsAPI } from "../../../../services/api";

type Application = {
  id: string;
  status: string;
  created_at: string;
  job: Job;
  candidate: Candidate;
};

type Job = {
  id: string;
  title: string;
  department?: string;
};

type Candidate = {
  id: string;
  full_name: string;
  email: string;
};

export const ApplicationsManager = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<Application | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  // ✅ Real API fetch logic
  const fetchApplications = async () => {
    try {
      setLoading(true);

      const data = await applicationsAPI.getAll();

      console.log("Fetched applications:", data);

      setApplications(data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update status in backend
  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await applicationsAPI.update(id, { status: newStatus });

      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleEdit = (application: Application) => {
    setEditingApplication(application);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingApplication(null);
  };

  const handleSave = () => {
    fetchApplications();
    handleCloseForm();
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.candidate?.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      app.job?.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || app.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const groupedByStatus = {
    Screening: filteredApplications.filter((a) => a.status === "Screening"),
    Shortlisted: filteredApplications.filter((a) => a.status === "Shortlisted"),
    Interview: filteredApplications.filter((a) => a.status === "Interview"),
    Offer: filteredApplications.filter((a) => a.status === "Offer"),
    Hired: filteredApplications.filter((a) => a.status === "Hired"),
    Rejected: filteredApplications.filter((a) => a.status === "Rejected"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Screening">Screening</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(groupedByStatus).map(([status, apps]) => {
          const statusColors: Record<string, string> = {
            Screening: "from-yellow-400 to-yellow-500",
            Shortlisted: "from-blue-400 to-blue-500",
            Interview: "from-cyan-400 to-cyan-500",
            Offer: "from-purple-400 to-purple-500",
            Hired: "from-green-400 to-green-500",
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
                {apps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onStatusUpdate={handleStatusUpdate}
                    onEdit={() => handleEdit(app)}
                  />
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

      {showForm && (
        <ApplicationForm
          application={editingApplication}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
