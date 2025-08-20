import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Add debug logging
  useEffect(() => {
    console.log('ProtectedRoute - Auth state:', { 
      isAuthenticated,
      user,
      loading,
      path: location.pathname,
      requiredRoles: roles
    });
  }, [isAuthenticated, user, loading, location.pathname, roles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    // Store the attempted URL for redirecting after login
    const redirectTo = location.pathname !== '/staff-login' && location.pathname !== '/manager-login' 
      ? `?redirect=${encodeURIComponent(location.pathname + location.search)}`
      : '';
    
    // Redirect to the appropriate login page based on the current path
    if (location.pathname.startsWith('/staff')) {
      return <Navigate to={`/staff-login${redirectTo}`} state={{ from: location }} replace />;
    } else {
      return <Navigate to={`/manager-login${redirectTo}`} state={{ from: location }} replace />;
    }
  }

  // Check if user has required role
  if (roles.length > 0 && !roles.includes(user?.user_type)) {
    console.log('User does not have required role:', { 
      userType: user?.user_type, 
      requiredRoles: roles 
    });
    
    // Redirect based on user type
    if (user?.user_type === 'STAFF') {
      return <Navigate to="/staff/dashboard" replace />;
    } else if (['ADMIN', 'MANAGER'].includes(user?.user_type)) {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      // Default fallback
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
