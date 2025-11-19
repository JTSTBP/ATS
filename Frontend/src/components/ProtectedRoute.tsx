import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"Recruiter" | "Manager" | "HR" | "Admin" | "Mentor">;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  // 🔥 1. Wait until AuthProvider loads user from localStorage
  if (loading) {
    return null; // or spinner
  }

  // 🔥 2. If still not authenticated → send to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🔥 3. Role restriction check
  if (allowedRoles && user && !allowedRoles.includes(user.designation)) {
    // redirect to correct panel based on role
    return <Navigate to={`/${user.designation}`} replace />;
  }

  return <>{children}</>;
}
