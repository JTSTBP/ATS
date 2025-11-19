import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'Recruiter' | 'Manager' | 'HR'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.designation)) {
    if (user.designation === 'Recruiter') {
      return <Navigate to="/Recruiter" replace />;
    } else if (user.designation === 'Manager') {
      return <Navigate to="/Manager" replace />;
    } else {
      return <Navigate to="/hr" replace />;
    }
  }

  return <>{children}</>;
}
