
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  invert?: boolean; // when true, show children only for NOT authenticated users
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, invert = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-[80vh]">Loading...</div>;
  }

  // Inverted route: show children only to non-authenticated users
  if (invert) {
    if (user) {
      // Redirect logged-in users to a sensible location
      if (isAdmin) return <Navigate to="/admin" replace />;
      return <Navigate to="/user-profile" replace />;
    }

    return <>{children}</>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;