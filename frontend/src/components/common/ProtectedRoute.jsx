import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Verifying session..." />;
  }

  if (!isAuthenticated) {
    if (allowedRoles.includes('DRIVER')) {
      return <Navigate to="/login?role=driver" replace />;
    }
    return <Navigate to="/login?role=passenger" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    if (user?.role === 'DRIVER') return <Navigate to="/driver/dashboard" replace />;
    return <Navigate to="/passenger/search" replace />;
  }

  return children;
};
