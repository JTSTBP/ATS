import axios from "axios";
import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "react-toastify";

console.log("CandidatesProvider module initiating...");

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL;
const API_URL = `${API_BASE_URL}/api/CandidatesJob`;

type Candidate = {
  _id?: string;
  jobId: string | any;
  createdBy: string | any;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  notes?: string;
  status?: string;
  dynamicFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  interviewStage?: string;
  joiningDate?: string;
  selectionDate?: string;
  expectedJoiningDate?: string;
  interviewStageHistory?: Array<{
    stageName: string;
    status: "Selected" | "Rejected";
    notes?: string;
    updatedBy: string | any;
    timestamp: string;
  }>;
  statusHistory?: Array<{
    status: string;
    comment?: string;
    joiningDate?: string;
    rejectionReason?: string;
    updatedBy: string | any;
    timestamp: string;
  }>;
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
      startDate?: string;
      endDate?: string;
      joinStartDate?: string;
      joinEndDate?: string;
      selectStartDate?: string;
      selectEndDate?: string;
      reporterId?: string;
      jobStatus?: string;
    }
  ) => Promise<void>;
  fetchRoleBasedCandidates: (
    userId: string,
    designation: string,
    page: number,
    limit: number,
    filters?: {
      search?: string;
      status?: string;
      client?: string;
      jobTitle?: string;
      stage?: string;
      startDate?: string;
      endDate?: string;
      joinStartDate?: string;
      joinEndDate?: string;
      selectStartDate?: string;
      selectEndDate?: string;
      reporterId?: string;
      jobStatus?: string;
    }
  ) => Promise<void>;


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
    comment?: string,
    joiningDate?: string,
    offerLetter?: File,
    selectionDate?: string,
    expectedJoiningDate?: string,
    rejectedBy?: string,
    offeredCTC?: string,
    droppedBy?: string,
    rejectionReason?: string
  ) => Promise<Candidate | null>;
  addComment: (candidateId: string, authorId: string, text: string) => Promise<boolean>;

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
      startDate?: string;
      endDate?: string;
      joinStartDate?: string;
      joinEndDate?: string;
      selectStartDate?: string;
      selectEndDate?: string;
      reporterId?: string;
      jobStatus?: string;
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

  const fetchPaginatedCandidates = useCallback(async (
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
  }, []);

  /* 
   * Fetch Role-Based Candidates with Pagination
   */
  const fetchRoleBasedCandidates = useCallback(async (
    userId: string,
    designation: string,
    page: number,
    limit: number,
    filters: any = {}
  ) => {
    setLoading(true);
    console.log("🚀 Frontend Fetching Role-Based Candidates:", { userId, designation, page, limit, filters });
    try {
      const params = {
        userId,
        designation,
        page,
        limit,
        ...filters
      };

      const { data } = await axios.get(`${API_URL}/role-based-candidates`, { params });
      console.log("✅ API Response for role-based candidates:", data);

      if (data.success) {
        setPaginatedCandidates(data.candidates);
        setPagination({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalCandidates: data.totalCandidates
        });
      } else {
        throw new Error(data.message || "Failed to load candidates");
      }
    } catch (err: any) {
      console.error("❌ Error in fetchRoleBasedCandidates:", err);
      setError(err.message);
      toast.error(`Failed to load candidates: ${err.response?.data?.message || err.message || 'Connection Error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPaginatedCandidatesByUser = useCallback(async (
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
  }, []);

  const fetchallCandidates = useCallback(async () => {
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
  }, []);

  // Fetch candidates by jobId
  const fetchCandidatesByJob = useCallback(async (jobId: string) => {
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
  }, []);

  const fetchCandidatesByUser = useCallback(async (userId: string) => {
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
  }, []);

  const createCandidate = useCallback(async (candidate: any, file?: File) => {
    try {
      const formData = new FormData();

      // 🔹 FIX: Extract ID if they are populated objects
      const jobId = typeof candidate.jobId === 'object' && candidate.jobId !== null ? candidate.jobId._id : candidate.jobId;
      const createdBy = typeof candidate.createdBy === 'object' && candidate.createdBy !== null ? candidate.createdBy._id : candidate.createdBy;

      // Append all normal fields
      if (jobId) formData.append("jobId", jobId);
      if (createdBy) formData.append("createdBy", createdBy);
      formData.append("linkedinUrl", candidate.linkedinUrl || "");
      formData.append("portfolioUrl", candidate.portfolioUrl || "");
      formData.append("notes", candidate.notes || "");
      formData.append("dynamicFields", JSON.stringify(candidate.dynamicFields || {}));

      // Append file
      if (file) {
        formData.append("resume", file);
      }

      const { data } = await axios.post(API_URL, formData, {
        // headers: { "Content-Type": "multipart/form-data" }, // Let axios set boundary automatically
      });

      if (data.success) {
        toast.success("Candidate created successfully!");

        // ✅ Update state arrays to reflect the new candidate immediately
        const newCandidate = data.candidate;
        setCandidates((prev) => [newCandidate, ...prev]); // Add to beginning for newest first
        setPaginatedCandidates((prev) => [newCandidate, ...prev]);

        return newCandidate;
      }

      return null;
    } catch (err: any) {
      console.error("Error creating candidate full response:", err.response?.data);
      console.error("Error creating candidate:", err);

      // Extract error message from backend response
      const serverData = err.response?.data;
      const errorMessage = typeof serverData?.message === 'string'
        ? serverData.message
        : (typeof serverData?.message === 'object' ? JSON.stringify(serverData.message) : "Failed to create candidate");

      toast.error(errorMessage);

      // If there's duplicate candidate info, show additional details
      if (serverData?.duplicateCandidate) {
        const duplicate = serverData.duplicateCandidate;
        toast.info(`Existing candidate: ${duplicate.name || 'Unknown'}`);
      }

      return null;
    }
  }, []);

  // Update
  const updateCandidate = useCallback(async (id: string, updated: any, file?: File) => {
    try {
      const formData = new FormData();

      // 🔹 FIX: Extract ID if they are populated objects
      const jobId = typeof updated.jobId === 'object' && updated.jobId !== null ? updated.jobId._id : updated.jobId;
      const createdBy = typeof updated.createdBy === 'object' && updated.createdBy !== null ? updated.createdBy._id : updated.createdBy;

      // Append all normal fields
      if (jobId) formData.append("jobId", jobId);
      if (createdBy) formData.append("createdBy", createdBy);
      formData.append("linkedinUrl", updated.linkedinUrl || "");
      formData.append("portfolioUrl", updated.portfolioUrl || "");
      formData.append("notes", updated.notes || "");
      formData.append("dynamicFields", JSON.stringify(updated.dynamicFields || {}));

      // Append file if provided
      if (file) {
        formData.append("resume", file);
      }

      const { data } = await axios.put(`${API_URL}/${id}`, formData, {
        // headers: { "Content-Type": "multipart/form-data" },
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
      console.error("Error updating candidate full response:", err.response?.data);
      console.error("Error updating candidate:", err);

      // Extract error message from backend response
      const serverData = err.response?.data;
      const errorMessage = typeof serverData?.message === 'string'
        ? serverData.message
        : (typeof serverData?.message === 'object' ? JSON.stringify(serverData.message) : "Failed to update candidate");

      toast.error(errorMessage);

      // If there's duplicate candidate info, show additional details
      if (serverData?.duplicateCandidate) {
        const duplicate = serverData.duplicateCandidate;
        toast.info(`Existing candidate: ${duplicate.name || 'Unknown'}`);
      }

      return null;
    }
  }, []);

  // Delete
  const deleteCandidate = useCallback(async (id: string, role: string) => {
    try {
      console.log(role, "ooo");
      const { data } = await axios.delete(`${API_URL}/${id}/${role}`);
      if (data.success) {
        // ✅ Update both state arrays to reflect deletion immediately
        setCandidates((prev) => prev.filter((c) => c._id !== id));
        setPaginatedCandidates((prev) => prev.filter((c) => c._id !== id));
        return true;
      }
      throw new Error("Failed to delete");
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // Update Status
  const updateStatus = useCallback(async (
    id: string,
    status: string,
    role: string,
    interviewStage?: string,
    stageStatus?: "Selected" | "Rejected",
    stageNotes?: string,
    comment?: string,
    joiningDate?: string,
    offerLetter?: File,
    selectionDate?: string,
    expectedJoiningDate?: string,
    rejectedBy?: string,
    offeredCTC?: string,
    droppedBy?: string,
    rejectionReason?: string
  ) => {
    try {
      // Use FormData if there's a file to upload
      const formData = new FormData();
      formData.append("status", status);
      formData.append("role", role);

      if (interviewStage) formData.append("interviewStage", interviewStage);
      if (stageStatus) formData.append("stageStatus", stageStatus);
      if (stageNotes) formData.append("stageNotes", stageNotes);
      if (comment) formData.append("comment", comment);
      if (joiningDate) formData.append("joiningDate", joiningDate);
      if (offerLetter) formData.append("offerLetter", offerLetter);
      if (selectionDate) formData.append("selectionDate", selectionDate);
      if (expectedJoiningDate) formData.append("expectedJoiningDate", expectedJoiningDate);
      if (rejectedBy) formData.append("rejectedBy", rejectedBy);
      if (offeredCTC) formData.append("offeredCTC", offeredCTC);
      if (droppedBy) formData.append("droppedBy", droppedBy);
      if (rejectionReason) formData.append("rejectionReason", rejectionReason);

      const { data } = await axios.patch(`${API_URL}/${id}/status`, formData, {
        // headers: { "Content-Type": "multipart/form-data" }
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
  }, []);

  const addComment = useCallback(async (candidateId: string, authorId: string, text: string) => {
    try {
      const { data } = await axios.post(`${API_URL}/${candidateId}/comments`, {
        text,
        authorId
      });
      if (data.success) {
        setCandidates((prev) =>
          prev.map((c) => (c._id === candidateId ? data.candidate : c))
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error adding comment:", err);
      return false;
    }
  }, []);

  const contextValue = React.useMemo(() => ({
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
    addComment,
    paginatedCandidates,
    pagination,
    fetchPaginatedCandidates,
    fetchPaginatedCandidatesByUser,
    fetchRoleBasedCandidates,
  }), [
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
    addComment,
    paginatedCandidates,
    pagination,
    fetchPaginatedCandidates,
    fetchPaginatedCandidatesByUser,
    fetchRoleBasedCandidates,
  ]);

  return (
    <CandidateContext.Provider value={contextValue}>
      {children}
    </CandidateContext.Provider>
  );
};

export const useCandidateContext = () => {
  const context = useContext(CandidateContext);
  console.log("CandidateContext check:", !!context);
  if (!context)
    throw new Error(
      "useCandidateContext must be used within a CandidateProvider"
    );
  return context;
};
