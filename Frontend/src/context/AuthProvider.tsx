// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   ReactNode,
// } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";

// interface User {
//   _id: string;
//   name: string;
//   email: string;
//   designation: string;
//   isAdmin: boolean;
//   createdAt: string;
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   login: (email: string, password: string) => Promise<boolean>;
//   logout: () => void;
//   setUser: (user: User | null) => void;
//   isAuthenticated: boolean;
// }

// const API_BASE_URL =
//   import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(false);

//   // Restore user from localStorage on refresh
//   useEffect(() => {
//     const savedUser = localStorage.getItem("user");
//     const token = localStorage.getItem("token");
//     if (savedUser && token) {
//       setUser(JSON.parse(savedUser));
//       axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//     }
//   }, []);

//   // 🔹 LOGIN FUNCTION
//   const login = async (email: string, password: string): Promise<boolean> => {
//     try {
//       setLoading(true);
//       const res = await axios.post(`${API_BASE_URL}/auth/login`, {
//         email,
//         password,
//       });

//       if (res.data.success) {
//         const userData = res.data.user;
//         const token = res.data.token;

//         // Save user & token
//         setUser(userData);
//         localStorage.setItem("user", JSON.stringify(userData));
//         localStorage.setItem("token", token);

//         // Attach token to all requests
//         axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

//         toast.success("Login successful!");
//         return true;
//       } else {
//         toast.error(res.data.message || "Invalid credentials");
//         return false;
//       }
//     } catch (err: any) {
//       toast.error(err.response?.data?.message || "Login failed");
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🔹 LOGOUT FUNCTION
//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//     delete axios.defaults.headers.common["Authorization"];
//     toast.info("Logged out successfully");
//   };

//   return (
//     <AuthContext.Provider
//       value={{ user, loading, login, logout, setUser, isAuthenticated: !!user }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook for easy access
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used inside an AuthProvider");
//   return context;
// };
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  designation: 'Admin' | 'Recruiter' | 'Manager' | 'Mentor';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const mockUsers = [
      { id: '1', email: 'admin@company.com', password: 'admin123', name: 'Admin User', designation: 'Admin' as const },
      { id: '2', email: 'recruiter@company.com', password: 'recruiter123', name: 'Recruiter User', designation: 'Recruiter' as const },
      { id: '3', email: 'manager@company.com', password: 'manager123', name: 'Manager User', designation: 'Manager' as const },
      { id: '4', email: 'mentor@company.com', password: 'mentor123', name: 'Mentor User', designation: 'Mentor' as const },
    ];

    const foundUser = mockUsers.find(u => u.email === email && u.password === password);

    if (foundUser) {
      const userData = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        designation: foundUser.designation,
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
