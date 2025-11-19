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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
}

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

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

  // 🔹 LOGOUT FUNCTION
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, setUser, isAuthenticated: !!user }}
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
