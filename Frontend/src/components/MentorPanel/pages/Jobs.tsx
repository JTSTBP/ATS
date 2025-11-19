// import { Briefcase, Plus } from 'lucide-react';

// export const JobsManager = () => {

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-2">Jobs</h2>
//           <p className="text-gray-600">Manage job openings</p>
//         </div>
//         <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition">
//           <Plus className="w-5 h-5" />
//           <span>New Job</span>
//         </button>
//       </div>

//       <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
//         <div className="flex flex-col items-center justify-center space-y-4 py-12">
//           <Briefcase className="w-16 h-16 text-gray-400" />
//           <p className="text-gray-600 text-lg">No jobs yet</p>
//           <p className="text-gray-500 text-sm">Create your first job posting to get started</p>
//         </div>
//       </div>
//     </div>
//   );
// };

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Briefcase,
  MapPin,
  Building,
  DollarSign,
  Search,
} from "lucide-react";
import { JobForm } from "./JobForm";

type Job = {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  employment_type: string;
  status: string;
  requirements?: string;
  salary_range?: string;
};

interface JobsManagerProps {
  initialFormOpen?: boolean;
  onFormClose?: () => void;
}

export const JobsManager = ({
  initialFormOpen = false,
  onFormClose,
}: JobsManagerProps = {}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(initialFormOpen);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Simulated user permissions (you can adjust or remove)
  const canManageJobs = true;

  useEffect(() => {
    const savedJobs = localStorage.getItem("jobs");
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialFormOpen) setShowForm(true);
  }, [initialFormOpen]);

  const saveJobsToStorage = (data: Job[]) => {
    localStorage.setItem("jobs", JSON.stringify(data));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    const updatedJobs = jobs.filter((job) => job.id !== id);
    setJobs(updatedJobs);
    saveJobsToStorage(updatedJobs);
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingJob(null);
    if (onFormClose) onFormClose();
  };

  const handleSave = (formData: Omit<Job, "id">) => {
    let updatedJobs;
    if (editingJob) {
      updatedJobs = jobs.map((job) =>
        job.id === editingJob.id ? { ...editingJob, ...formData } : job
      );
    } else {
      const newJob: Job = { ...formData, id: crypto.randomUUID() };
      updatedJobs = [newJob, ...jobs];
    }
    setJobs(updatedJobs);
    saveJobsToStorage(updatedJobs);
    handleCloseForm();
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    Open: "bg-green-100 text-green-700",
    Closed: "bg-red-100 text-red-700",
    "On Hold": "bg-yellow-100 text-yellow-700",
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
            Job Openings
          </h2>
          <p className="text-gray-600">Manage job postings and openings</p>
        </div>
        {canManageJobs && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Post New Job</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs by title, department, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  statusColors[job.status]
                }`}
              >
                {job.status}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {job.title}
            </h3>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Building className="w-4 h-4 mr-2" />
                {job.department}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {job.location}
              </div>
              {job.salary_range && (
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {job.salary_range}
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {job.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                {job.employment_type}
              </span>
              {canManageJobs && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(job)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-md border border-gray-200">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No jobs found
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Get started by posting a new job"}
          </p>
        </div>
      )}

      {showForm && (
        <JobForm
          job={editingJob}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
