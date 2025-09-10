import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSpinner } from './Spinner';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  allowedRoles = [], 
  redirectTo = '/login',
  requireAuth = true
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <PageSpinner text="Checking authentication..." />;
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If no role restrictions, allow access for authenticated users
  if (!requiredRole && allowedRoles.length === 0) {
    return children;
  }

  // Check specific role requirement
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user's role is in allowed roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // All checks passed, render children
  return children;
};

// Higher-order component for role-based protection
export const withRoleProtection = (Component, requiredRole) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Specific role-based route components
export const CitizenRoute = ({ children }) => (
  <ProtectedRoute requiredRole="citizen">
    {children}
  </ProtectedRoute>
);

export const ResponderRoute = ({ children }) => (
  <ProtectedRoute requiredRole="responder">
    {children}
  </ProtectedRoute>
);

export const HospitalRoute = ({ children }) => (
  <ProtectedRoute requiredRole="hospital">
    {children}
  </ProtectedRoute>
);

// Multiple roles allowed
export const StaffRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['responder', 'hospital']}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
