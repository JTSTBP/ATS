import axios from "axios";
import React, { createContext, useContext, useState } from "react";
import { toast } from "react-toastify";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL;
const API_URL = `${API_BASE_URL}/api/CandidatesJob`;

type Candidate = {
  _id?: string;
  jobId: string;
  createdBy: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  notes?: string;
  status?: string;
  dynamicFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  interviewStage?: string;
};

type CandidateContextType = {
  candidates: Candidate[];
  loading: boolean;
  error: string | null;
  fetchCandidatesByJob: (jobId: string) => Promise<void>;
  fetchallCandidates: () => Promise<void>;
  fetchCandidatesByUser: (userId: string) => Promise<void>;
  fetchPaginatedCandidatesByUser: (
    userId: string,
    page: number,
    limit: number,
    filters?: {
      search?: string;
      status?: string;
    }
  ) => Promise<void>;
  fetchRoleBasedCandidates: (userId: string, designation: string, page: number, limit: number, filters?: any) => Promise<void>;
  createCandidate: (data: Candidate, file?: File) => Promise<Candidate | null>;
  updateCandidate: (
    id: string,
    data: Candidate,
    file?: File
  ) => Promise<Candidate | null>;
  deleteCandidate: (id: string, role: string) => Promise<boolean>;
  updateStatus: (
    id: string,
    status: string,
    role: string,
    interviewStage?: string,
    stageStatus?: "Selected" | "Rejected",
    stageNotes?: string,
    comment?: string
  ) => Promise<Candidate | null>;

  // 🔹 Pagination
  paginatedCandidates: Candidate[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCandidates: number;
  };
  fetchPaginatedCandidates: (
    page: number,
    limit: number,
    filters?: {
      search?: string;
      status?: string;
      client?: string;
      jobTitle?: string;
      stage?: string;
    }
  ) => Promise<void>;
};

const CandidateContext = createContext<CandidateContextType | undefined>(
  undefined
);

export const CandidateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [paginatedCandidates, setPaginatedCandidates] = useState<Candidate[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCandidates: 0,
  });

  const fetchPaginatedCandidates = async (
    page: number,
    limit: number,
    filters: any = {}
  ) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...filters
      };

      const { data } = await axios.get(`${API_URL}`, { params });

      if (data.success) {
        setPaginatedCandidates(data.candidates);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalCandidates: data.totalCandidates
        });
      } else {
        throw new Error("Failed to load candidates");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  /* 
   * 🟣 Fetch Role-Based Candidates with Pagination
   */
  const fetchRoleBasedCandidates = async (
    userId: string,
    designation: string,
    page: number,
    limit: number,
    filters: any = {}
  ) => {
    setLoading(true);
    try {
      const params = {
        userId,
        designation,
        page,
        limit,
        ...filters
      };

      const { data } = await axios.get(`${API_URL}/role-based-candidates`, { params });

      if (data.success) {
        setPaginatedCandidates(data.candidates);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalCandidates: data.totalCandidates
        });
      } else {
        throw new Error("Failed to load candidates");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaginatedCandidatesByUser = async (
    userId: string,
    page: number,
    limit: number,
    filters: any = {}
  ) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...filters
      };

      const { data } = await axios.get(`${API_URL}/user/${userId}`, { params });

      if (data.success) {
        setPaginatedCandidates(data.candidates);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalCandidates: data.totalCandidates
        });
      } else {
        throw new Error("Failed to load candidates");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const fetchallCandidates = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}`);
      if (data.success) setCandidates(data.candidates);
      else throw new Error("Failed to load candidates");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Fetch candidates by jobId
  const fetchCandidatesByJob = async (jobId: string) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/job/${jobId}`);
      if (data.success) setCandidates(data.candidates);
      else throw new Error("Failed to load candidates");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidatesByUser = async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/user/${userId}`);
      if (data.success) setCandidates(data.candidates);
      else throw new Error("Failed to load user candidates");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCandidate = async (candidate: any, file?: File) => {
    try {
      const formData = new FormData();

      // Append all normal fields
      formData.append("jobId", candidate.jobId);
      formData.append("createdBy", candidate.createdBy);
      formData.append("linkedinUrl", candidate.linkedinUrl);
      formData.append("portfolioUrl", candidate.portfolioUrl);
      formData.append("notes", candidate.notes);
      formData.append("dynamicFields", JSON.stringify(candidate.dynamicFields));

      // Append file
      if (file) {
        formData.append("resume", file);
      }

      const { data } = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        toast.success("Candidate created successfully!");
        return data.candidate;
      }

      return null;
    } catch (err: any) {
      console.error("Error creating candidate:", err);

      // Extract error message from backend response
      const errorMessage = err.response?.data?.message || "Failed to create candidate";
      toast.error(errorMessage);

      // If there's duplicate candidate info, show additional details
      if (err.response?.data?.duplicateCandidate) {
        const duplicate = err.response.data.duplicateCandidate;
        toast.info(`Existing candidate: ${duplicate.name || 'Unknown'}`);
      }

      return null;
    }
  };

  // 🟡 Update
  const updateCandidate = async (id: string, updated: any, file?: File) => {
    try {
      const formData = new FormData();

      // Append all normal fields
      formData.append("jobId", updated.jobId);
      formData.append("createdBy", updated.createdBy);
      formData.append("linkedinUrl", updated.linkedinUrl);
      formData.append("portfolioUrl", updated.portfolioUrl);
      formData.append("notes", updated.notes);
      formData.append("dynamicFields", JSON.stringify(updated.dynamicFields));

      // Append file if provided
      if (file) {
        formData.append("resume", file);
      }

      const { data } = await axios.put(`${API_URL}/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        setCandidates((prev) =>
          prev.map((c) => (c._id === id ? data.candidate : c))
        );
        toast.success("Candidate updated successfully!");
        return data.candidate;
      }

      return null;
    } catch (err: any) {
      console.error("Error updating candidate:", err);

      // Extract error message from backend response
      const errorMessage = err.response?.data?.message || "Failed to update candidate";
      toast.error(errorMessage);

      // If there's duplicate candidate info, show additional details
      if (err.response?.data?.duplicateCandidate) {
        const duplicate = err.response.data.duplicateCandidate;
        toast.info(`Existing candidate: ${duplicate.name || 'Unknown'}`);
      }

      return null;
    }
  };

  // 🔴 Delete
  const deleteCandidate = async (id: string, role: string) => {
    try {
      console.log(role, "ooo");
      const { data } = await axios.delete(`${API_URL}/${id}/${role}`);
      if (data.success) {
        setCandidates((prev) => prev.filter((c) => c._id !== id));
        return true;
      }
      throw new Error("Failed to delete");
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // 🔵 Update Status
  const updateStatus = async (
    id: string,
    status: string,
    role: string,
    interviewStage?: string,
    stageStatus?: "Selected" | "Rejected",
    stageNotes?: string,
    comment?: string
  ) => {
    try {
      const { data } = await axios.patch(`${API_URL}/${id}/status`, {
        status,
        role,
        interviewStage,
        stageStatus,
        stageNotes,
        comment,
      });
      if (data.success) {
        toast.success("Candidate status updated successfully");
        return data.candidate;
      }
      throw new Error("Failed to update status");
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  return (
    <CandidateContext.Provider
      value={{
        candidates,
        loading,
        error,
        fetchallCandidates,
        fetchCandidatesByJob,
        fetchCandidatesByUser,
        createCandidate,
        updateCandidate,
        deleteCandidate,
        updateStatus,
        paginatedCandidates,
        pagination,
        fetchPaginatedCandidates,
        fetchPaginatedCandidatesByUser,
        fetchRoleBasedCandidates,
      }}
    >
      {children}
    </CandidateContext.Provider>
  );
};

export const useCandidateContext = () => {
  const context = useContext(CandidateContext);
  if (!context)
    throw new Error(
      "useCandidateContext must be used within a CandidateProvider"
    );
  return context;
};
