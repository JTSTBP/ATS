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
  reporter?: string;
  createdAt: string;
  isAdmin: boolean;
}

interface UserFormData {
  name: string;
  email: string;
  designation: string;
  password?: string;
  reporter?: string;
  isAdmin: boolean;
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
  addUser: (userData: UserFormData) => Promise<void>;
  updateUser: (id: string, userData: UserFormData) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // 🔹 Leaves
  leaves: Leave[];
  fetchLeaves: () => Promise<void>;
  applyLeave: (leaveData: LeaveFormData) => Promise<void>;
  updateLeaveStatus: (
    id: string,
    status: "Approved" | "Rejected"
  ) => Promise<void>;
}

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL;
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
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
      const res = await axios.post(`${API_BASE_URL}/api/users`, userData);
      setUsers((prev) => [...prev, res.data]);
      toast.success("User added successfully!");
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error adding user");
      return false;
    }
  };

  const updateUser = async (id: string, userData: UserFormData) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/users/${id}`, userData);

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
      toast.success("User deleted successfully!");
      return true;
    } catch (err) {
      toast.error("Failed to delete user");
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
      const res = await axios.put(`${API_BASE_URL}/api/leaves/${id}/status`, {
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
  console.log(leaves, "leaves");
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
