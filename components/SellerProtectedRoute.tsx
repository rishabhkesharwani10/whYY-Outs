
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

const SellerProtectedRoute: React.FC = () => {
  const { isAuthenticated, user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-brand-dark min-h-screen flex items-center justify-center">
        <p className="text-brand-gold animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow access if the user is a seller OR an admin
  if (user?.role !== 'seller' && !isAdmin) {
    return <Navigate to="/shop" replace />;
  }

  return <Outlet />;
};

export default SellerProtectedRoute;