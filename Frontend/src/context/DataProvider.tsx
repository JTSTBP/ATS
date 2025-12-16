import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL;
const API_URL = `${API_BASE_URL}/api/jobs`;

export type Job = {
  _id?: string;
  title: string;
  description: string;
  department: string;
  location: string;
  employmentType: string;
  status: string;
  keySkills?: string[];
  salary?: { min: string; max: string; currency: string };
  experience?: { min: string; max: string; unit: string };
  industry?: string;
  functionalArea?: string;
  education?: string[];
  requirements?: string;
  recruiterDetails?: { name: string; email: string; phone: string };
  brandingOptions?: { isFeatured: boolean; isHighlighted: boolean };
  screeningQuestions?: string[];
  teamMembers?: string[];
  assignedRecruiters?: string[];
  leadRecruiter?: string;
  createdAt?: string;
  clientId?: any;
  CreatedBy?: any;
  candidateFields?: any[];
};

type JobContextType = {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  fetchJobs: () => Promise<void>;
  fetchJobById: (id: string) => Promise<Job | null>;
  createJob: (jobData: Job) => Promise<Job | null>;
  updateJob: (id: string, jobData: Job) => Promise<Job | null>;
  deleteJob: (id: string) => Promise<boolean>;
  jobsByUser: Job[];
  fetchJobsByCreator: (userId: string) => Promise<void>;
  assignedJobs: Job[];
  fetchAssignedJobs: (recruiterId: string) => Promise<void>;
};

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobsByUser, setJobsByUser] = useState<Job[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<Job[]>([]);

  // 🔹 Fetch all jobs
  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data.success) setJobs(data.jobs);
      else throw new Error(data.message || "Failed to fetch jobs");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch single job
  const fetchJobById = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}`);
      const data = await res.json();
      if (data.success) return data.job;
      throw new Error(data.message);
    } catch (err) {
      console.error("Failed to fetch job:", err);
      return null;
    }
  };

  // 🔹 Create a job
  const createJob = async (jobData: Job) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create job");
      setJobs((prev) => [data.job, ...prev]);
      toast.success("Job created successfully!");
      return data.job;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to create job");
      return null;
    }
  };

  // 🔹 Update a job
  const updateJob = async (id: string, jobData: Job) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update job");
      setJobs((prev) => prev.map((job) => (job._id === id ? data.job : job)));
      toast.success("Job updated successfully!");
      return data.job;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to update job");
      return null;
    }
  };

  // 🔹 Delete a job
  const deleteJob = async (id: string, role: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}/${role}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete job");
      setJobs((prev) => prev.filter((job) => job._id !== id));
      toast.success(data.message || "Job deleted successfully!");
      return true;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to delete job");
      return false;
    }
  };

  const fetchJobsByCreator = async (userId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/createdby/${userId}`);
      setJobsByUser(data.jobs || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setJobsByUser([]);
      } else {
        setError("Failed to fetch jobs by user");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch jobs assigned to a recruiter
  const fetchAssignedJobs = async (recruiterId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/assigned/${recruiterId}`);
      const data = await res.json();
      if (data.success) {
        setAssignedJobs(data.jobs);
      } else {
        setAssignedJobs([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch assigned jobs:", err);
      setAssignedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <JobContext.Provider
      value={{
        jobs,
        loading,
        error,
        fetchJobs,
        fetchJobById,
        createJob,
        updateJob,
        deleteJob,
        jobsByUser,
        fetchJobsByCreator,
        assignedJobs,
        fetchAssignedJobs,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

// 🔹 Custom hook for using the context
export const useJobContext = () => {
  const context = useContext(JobContext);
  if (!context)
    throw new Error("useJobContext must be used within a JobProvider");
  return context;
};
