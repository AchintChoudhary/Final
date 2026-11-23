import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Verifying session..." />;
  }

  if (!isAuthenticated) {
    if (allowedRoles.includes('ADMIN')) {
      return <Navigate to="/admin/login" replace />;
    }
    if (allowedRoles.includes('DRIVER')) {
      return <Navigate to="/driver/login" replace />;
    }
    return <Navigate to="/passenger/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to respective dashboard
    if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'DRIVER') return <Navigate to="/driver/dashboard" replace />;
    return <Navigate to="/passenger/search" replace />;
  }

  return children;
};
