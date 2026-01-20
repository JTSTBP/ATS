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
  isAdmin: boolean;
  createdAt: string;
  phone?: string;
  department?: string;
  joinDate?: string;
  profilePhoto?: string;
  reporter?: {
    _id: string;
    name: string;
    email: string;
    designation: string;
  } | null;
  appPassword?: string;
  personalEmail?: string;
  dateOfBirth?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  updateProfile: (userData: FormData | Partial<User>) => Promise<boolean>;
  getactivitylog: () => Promise<any>;
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // start as loading

  // Restore user from localStorage on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    setLoading(false); // 🔥 VERY IMPORTANT
  }, []);

  // 🔹 LOGIN FUNCTION
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      if (res.data.success) {
        const userData = res.data.user;
        const token = res.data.token;

        // Save user & token
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);

        // Attach token to all requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        toast.success("Login successful!");
        return true;
      } else {
        toast.error(res.data.message || "Invalid credentials");
        return false;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getactivitylog = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/auth/activity-logs`,
        {
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${token}`, // add this if your route requires auth
          },
        }
      );

      if (response.data.success) {
        return response.data.logs;
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  // 🔹 UPDATE PROFILE FUNCTION
  const updateProfile = async (
    userData: FormData | Partial<User>
  ): Promise<boolean> => {
    try {
      const config = {
        headers: {
          "Content-Type":
            userData instanceof FormData
              ? "multipart/form-data"
              : "application/json",
        },
      };

      const res = await axios.put(
        `${API_BASE_URL}/api/auth/update-profile`,
        userData,
        config
      );

      if (res.data.success) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        toast.success("Profile updated successfully!");
        return true;
      } else {
        toast.error(res.data.message || "Update failed");
        return false;
      }
    } catch (err: any) {
      console.error("Update profile error:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
      return false;
    }
  };

  // 🔹 LOGOUT FUNCTION
  const logout = async () => {
    try {
      // Call logout API to track attendance
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post(
          `${API_BASE_URL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Error tracking logout:", error);
      // Don't prevent logout if API call fails
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      toast.info("Logged out successfully");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        setUser,
        isAuthenticated: !!user,
        updateProfile,
        getactivitylog,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
};
