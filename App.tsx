
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from './context/AuthContext.tsx';

// Static imports for stability
import ProtectedRoute from './components/ProtectedRoute.tsx';
import SellerProtectedRoute from './components/SellerProtectedRoute.tsx';
import AdminProtectedRoute from './components/AdminProtectedRoute.tsx';
import LoadingSpinner from './components/LoadingSpinner.tsx';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import ShopPage from './pages/ShopPage.tsx';
import ProductDetailPage from './pages/ProductDetailPage.tsx';
import CartPage from './pages/CartPage.tsx';
import CheckoutPage from './pages/CheckoutPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import EditProfilePage from './pages/EditProfilePage.tsx';
import OrderHistoryPage from './pages/OrderHistoryPage.tsx';
import OrderDetailPage from './pages/OrderDetailPage.tsx';
import SellerDashboardPage from './pages/SellerDashboardPage.tsx';
import AddProductPage from './pages/AddProductPage.tsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.tsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.tsx';
import AdminEditProductPage from './pages/admin/AdminEditProductPage.tsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.tsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';

const App: React.FC = () => {
  const { loading } = useAuth();

  // Show a global loading spinner while the initial authentication check is running.
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ReactRouterDOM.Routes>
      {/* Public Routes */}
      <ReactRouterDOM.Route path="/" element={<HomePage />} />
      <ReactRouterDOM.Route path="/login" element={<LoginPage />} />
      <ReactRouterDOM.Route path="/register" element={<RegisterPage />} />
      <ReactRouterDOM.Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Protected Routes */}
      <ReactRouterDOM.Route element={<ProtectedRoute />}>
        <ReactRouterDOM.Route path="/shop" element={<ShopPage />} />
        <ReactRouterDOM.Route path="/product/:productId" element={<ProductDetailPage />} />
        <ReactRouterDOM.Route path="/cart" element={<CartPage />} />
        <ReactRouterDOM.Route path="/checkout" element={<CheckoutPage />} />
        <ReactRouterDOM.Route path="/profile" element={<ProfilePage />} />
        <ReactRouterDOM.Route path="/edit-profile" element={<EditProfilePage />} />
        <ReactRouterDOM.Route path="/order-history" element={<OrderHistoryPage />} />
        <ReactRouterDOM.Route path="/order/:orderId" element={<OrderDetailPage />} />
      </ReactRouterDOM.Route>

      {/* Seller-only Protected Routes */}
      <ReactRouterDOM.Route element={<SellerProtectedRoute />}>
        <ReactRouterDOM.Route path="/seller-dashboard" element={<SellerDashboardPage />} />
        <ReactRouterDOM.Route path="/add-product" element={<AddProductPage />} />
      </ReactRouterDOM.Route>

      {/* Admin-only Protected Routes */}
      <ReactRouterDOM.Route element={<AdminProtectedRoute />}>
        <ReactRouterDOM.Route path="/admin" element={<AdminDashboardPage />} />
        <ReactRouterDOM.Route path="/admin/products" element={<AdminProductsPage />} />
        <ReactRouterDOM.Route path="/admin/products/edit/:productId" element={<AdminEditProductPage />} />
        <ReactRouterDOM.Route path="/admin/users" element={<AdminUsersPage />} />
        <ReactRouterDOM.Route path="/admin/orders" element={<AdminOrdersPage />} />
      </ReactRouterDOM.Route>

      <ReactRouterDOM.Route path="*" element={<NotFoundPage />} />
    </ReactRouterDOM.Routes>
  );
};

export default App;
