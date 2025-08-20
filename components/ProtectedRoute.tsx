import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <ReactRouterDOM.Navigate to="/login" replace />;
  }

  return <ReactRouterDOM.Outlet />;
};

export default ProtectedRoute;