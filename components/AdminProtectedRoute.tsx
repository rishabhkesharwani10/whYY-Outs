import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

const AdminProtectedRoute: React.FC = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-brand-dark min-h-screen flex items-center justify-center">
        <p className="text-brand-gold animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <ReactRouterDOM.Navigate to="/login" replace />;
  }

  return <ReactRouterDOM.Outlet />;
};

export default AdminProtectedRoute;