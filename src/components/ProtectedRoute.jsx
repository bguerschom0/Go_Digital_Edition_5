import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();

  // Show a loading state (optional)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If roles are required, check if user has any of the required roles
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      // Redirect to dashboard if user doesn't have the required role
      return <Navigate to="/" replace />;
    }
  }

  // Render children if user is authenticated and has the required role (if specified)
  return children;
};

export default ProtectedRoute;