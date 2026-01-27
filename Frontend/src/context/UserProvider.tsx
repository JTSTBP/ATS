import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface User {
  _id: string;
  name: string;
  email: string;
  designation: string;
  reporter?: {
    _id: string;
    name: string;
    designation: string;
  };
  createdAt: string;
  isAdmin: boolean;
  personalEmail?: string;
  phoneNumber?: {
    personal: string;
    official: string;
  };
  dateOfJoining?: string;
  dateOfBirth?: string;
  appPassword?: string;
  isDisabled: boolean;
}

interface UserFormData {
  name: string;
  email: string;
  designation: string;
  password?: string;
  reporter?: string;
  isAdmin: boolean;
  personalEmail?: string;
  phoneNumber?: {
    personal: string;
    official: string;
  };
  dateOfJoining?: string;
  dateOfBirth?: string;
  appPassword?: string;
  isDisabled?: boolean;
}

interface Leave {
  _id: string;
  userId: string;
  name: string;
  designation: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedAt: string;
  role: string;
}

interface LeaveFormData {
  user: string;
  fromDate: string;
  toDate: string;
  reason: string;
  reporter: string;
}

interface UserContextType {
  users: User[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
  addUser: (userData: UserFormData) => Promise<boolean>;
  updateUser: (id: string, userData: UserFormData) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;

  // 🔹 Leaves
  leaves: Leave[];
  fetchAllLeaves: () => Promise<void>;
  fetchLeaves: (userId: string) => Promise<void>;
  applyLeave: (leaveData: LeaveFormData) => Promise<boolean>;
  updateLeaveStatus: (
    id: string,
    status: "Approved" | "Rejected",
    role: string
  ) => Promise<boolean>;

  // 🔹 Pagination
  paginatedUsers: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
  };
  fetchPaginatedUsers: (
    page: number,
    limit: number,
    search?: string,
    role?: string,
    isAdmin?: string
  ) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<boolean>;
}

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL;
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);

  // Attach token if exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // ======================
  // 🔹 USER MANAGEMENT
  // ======================
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/users`);
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: UserFormData) => {
    try {
      await axios.post(`${API_BASE_URL}/api/users`, userData);
      await fetchUsers(); // Fetch fresh list to get populated fields
      toast.success("User added successfully!");
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error adding user");
      return false;
    }
  };

  const updateUser = async (id: string, userData: UserFormData) => {
    try {
      await axios.put(`${API_BASE_URL}/api/users/${id}`, userData);

      await fetchUsers();
      toast.success("User updated successfully!");
      return true;
    } catch (err) {
      toast.error("Failed to update user");
      return false;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`);
      setUsers((prev) => prev.filter((user) => user._id !== id));
      setPaginatedUsers((prev) => prev.filter((user) => user._id !== id));
      toast.success("User deleted successfully!");
      return true;
    } catch (err) {
      toast.error("Failed to delete user");
      return false;
    }
  };

  const fetchPaginatedUsers = async (
    page: number,
    limit: number,
    search = "",
    role = "",
    isAdmin = ""
  ) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/users`, {
        params: { page, limit, search, role, isAdmin },
      });

      setPaginatedUsers(res.data.users);
      setPagination({
        currentPage: res.data.currentPage,
        totalPages: res.data.totalPages,
        totalUsers: res.data.totalUsers,
      });
    } catch (err) {
      toast.error("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/users/${id}/toggle-status`);
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === id ? { ...u, isDisabled: res.data.isDisabled } : u))
        );
        setPaginatedUsers((prev) =>
          prev.map((u) => (u._id === id ? { ...u, isDisabled: res.data.isDisabled } : u))
        );
        toast.success(res.data.message);
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.msg || "Failed to toggle user status");
      return false;
    }
  };

  // ======================
  // 🔹 LEAVE MANAGEMENT
  // ======================
  const fetchAllLeaves = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/api/leaves`);
      setLeaves(res.data);
    } catch (err) {
      toast.error("Failed to load leaves");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async (userId: string) => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/api/leaves/user/${userId}`);
      setLeaves(res.data);
    } catch (err) {
      toast.error("Failed to load leaves");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyLeave = async (leaveData: LeaveFormData) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/leaves/apply`,
        leaveData
      );
      console.log(res, "hhhh");
      setLeaves((prev) => [...prev, res.data]);
      toast.success("Leave applied successfully!");
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply leave");
      return false;
    }
  };

  const updateLeaveStatus = async (
    id: string,
    status: "Approved" | "Rejected",
    role: string
  ) => {
    try {
      await axios.put(`${API_BASE_URL}/api/leaves/${id}/status`, {
        status,
        role,
      });

      toast.success(`Leave ${status.toLowerCase()}!`);
      return true;
    } catch (err) {
      toast.error("Failed to update leave status");
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <UserContext.Provider
      value={{
        users,
        loading,
        fetchUsers,
        addUser,
        updateUser,
        deleteUser,
        leaves,
        fetchAllLeaves,
        fetchLeaves,
        applyLeave,
        updateLeaveStatus,
        paginatedUsers,
        pagination,
        fetchPaginatedUsers,
        toggleUserStatus,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for easy access
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used inside a UserProvider");
  }
  return context;
};
