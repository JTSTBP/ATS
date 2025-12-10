import {
    createContext,
    useContext,
    useState,
    ReactNode,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface Session {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        designation: string;
    };
    date: string;
    loginTime: string;
    logoutTime?: string;
    totalHours: string;
    status: "Present" | "Absent" | "Half Day" | "Leave";
    notes?: string;
    createdBy?: {
        _id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface SessionFormData {
    user: string;
    date: string;
    loginTime: string;
    logoutTime?: string;
    status: "Present" | "Absent" | "Half Day" | "Leave";
    notes?: string;
    createdBy?: string;
}

interface SessionContextType {
    sessions: Session[];
    loading: boolean;
    fetchSessions: (filters?: {
        startDate?: string;
        endDate?: string;
        userId?: string;
        status?: string;
    }) => Promise<void>;
    fetchSessionsByUser: (userId: string) => Promise<void>;
    createSession: (sessionData: SessionFormData) => Promise<boolean>;
    updateSession: (id: string, sessionData: Partial<SessionFormData>) => Promise<boolean>;
    deleteSession: (id: string) => Promise<boolean>;
    getStats: (filters?: {
        userId?: string;
        startDate?: string;
        endDate?: string;
    }) => Promise<any>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch all sessions with optional filters
    const fetchSessions = async (filters?: {
        startDate?: string;
        endDate?: string;
        userId?: string;
        status?: string;
    }) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters?.startDate) params.append("startDate", filters.startDate);
            if (filters?.endDate) params.append("endDate", filters.endDate);
            if (filters?.userId) params.append("userId", filters.userId);
            if (filters?.status) params.append("status", filters.status);

            const res = await axios.get(`${API_BASE_URL}/api/sessions?${params.toString()}`);
            setSessions(res.data);
        } catch (err: any) {
            toast.error("Failed to load sessions");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch sessions for a specific user
    const fetchSessionsByUser = async (userId: string) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/sessions/user/${userId}`);
            setSessions(res.data);
        } catch (err: any) {
            toast.error("Failed to load user sessions");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Create new session
    const createSession = async (sessionData: SessionFormData) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/api/sessions`, sessionData);
            setSessions((prev) => [res.data.session, ...prev]);
            toast.success("Session created successfully!");
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Error creating session");
            return false;
        }
    };

    // Update session
    const updateSession = async (id: string, sessionData: Partial<SessionFormData>) => {
        try {
            const res = await axios.put(`${API_BASE_URL}/api/sessions/${id}`, sessionData);
            setSessions((prev) =>
                prev.map((session) => (session._id === id ? res.data.session : session))
            );
            toast.success("Session updated successfully!");
            return true;
        } catch (err: any) {
            toast.error("Failed to update session");
            return false;
        }
    };

    // Delete session
    const deleteSession = async (id: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/sessions/${id}`);
            setSessions((prev) => prev.filter((session) => session._id !== id));
            toast.success("Session deleted successfully!");
            return true;
        } catch (err: any) {
            toast.error("Failed to delete session");
            return false;
        }
    };

    // Get session statistics
    const getStats = async (filters?: {
        userId?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        try {
            const params = new URLSearchParams();
            if (filters?.userId) params.append("userId", filters.userId);
            if (filters?.startDate) params.append("startDate", filters.startDate);
            if (filters?.endDate) params.append("endDate", filters.endDate);

            const res = await axios.get(`${API_BASE_URL}/api/sessions/stats?${params.toString()}`);
            return res.data;
        } catch (err: any) {
            toast.error("Failed to load statistics");
            console.error(err);
            return null;
        }
    };

    return (
        <SessionContext.Provider
            value={{
                sessions,
                loading,
                fetchSessions,
                fetchSessionsByUser,
                createSession,
                updateSession,
                deleteSession,
                getStats,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

// Custom hook for easy access
export const useSessionContext = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSessionContext must be used inside a SessionProvider");
    }
    return context;
};
