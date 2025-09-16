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
import AddProductPage from './pages/AddProductPage.tsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.tsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.tsx';
import AdminEditProductPage from './pages/admin/AdminEditProductPage.tsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.tsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.tsx';
import AdminCouponsPage from './pages/admin/AdminCouponsPage.tsx';
import AdminReturnsPage from './pages/admin/AdminReturnsPage.tsx';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage.tsx';
import AdminRevenuePage from './pages/admin/AdminRevenuePage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import AICopilotModal from './components/AICopilotModal.tsx';
import AIPilotFAB from './components/AIPilotFAB.tsx';
import WishlistPage from './pages/WishlistPage.tsx';
import { useCart } from './hooks/useCart.ts';
import Icon from './components/Icon.tsx';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.tsx';
import TermsOfUsePage from './pages/TermsOfUsePage.tsx';
import ReturnPolicyPage from './pages/ReturnPolicyPage.tsx';
import SecurityPolicyPage from './pages/SecurityPolicyPage.tsx';
import AboutUsPage from './pages/AboutUsPage.tsx';

// Seller Pages
import SellerDashboardPage from './pages/SellerDashboardPage.tsx';
import SellerProductsPage from './pages/SellerProductsPage.tsx';
import SellerEditProductPage from './pages/SellerEditProductPage.tsx';
import SellerOrdersPage from './pages/SellerOrdersPage.tsx';
import SellerPayoutsPage from './pages/SellerPayoutsPage.tsx';
import SellerReturnsPage from './pages/SellerReturnsPage.tsx';


interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const success = type === 'success';
  const bgColor = success ? 'bg-green-600/90' : 'bg-red-600/90';
  const borderColor = success ? 'border-green-400' : 'border-red-400';
  const title = success ? "Success" : "Notice";

  return (
    <div
      className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 w-80 max-w-[90vw] p-4 rounded-lg shadow-2xl z-[100] border ${borderColor} ${bgColor} backdrop-blur-sm text-white page-fade-in`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {success && <Icon name="check" className="w-5 h-5 mt-0.5 text-white flex-shrink-0" />}
        <div className="flex-grow">
          <p className="font-bold">{title}</p>
          <p className="text-sm mt-1">{message}</p>
          {success && (
            <ReactRouterDOM.Link
              to="/cart"
              onClick={onClose}
              className="inline-block mt-2 text-sm font-bold underline hover:text-brand-gold-light"
            >
              View Cart &rarr;
            </ReactRouterDOM.Link>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white flex-shrink-0 -mt-1 -mr-1 p-1"
          aria-label="Close notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};


const ToastContainer: React.FC = () => {
    const { toast, hideToast } = useCart();
    if (!toast) return null;
    return <Toast message={toast.message} type={toast.type} onClose={hideToast} />;
};


const App: React.FC = () => {
  const { loading } = useAuth();

  // Show a global loading spinner while the initial authentication check is running.
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <ReactRouterDOM.Routes>
        {/* Public Routes */}
        <ReactRouterDOM.Route path="/" element={<HomePage />} />
        <ReactRouterDOM.Route path="/login" element={<LoginPage />} />
        <ReactRouterDOM.Route path="/register" element={<RegisterPage />} />
        <ReactRouterDOM.Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <ReactRouterDOM.Route path="/shop" element={<ShopPage />} />
        <ReactRouterDOM.Route path="/product/:productId" element={<ProductDetailPage />} />
        <ReactRouterDOM.Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <ReactRouterDOM.Route path="/terms-of-use" element={<TermsOfUsePage />} />
        <ReactRouterDOM.Route path="/return-policy" element={<ReturnPolicyPage />} />
        <ReactRouterDOM.Route path="/security-policy" element={<SecurityPolicyPage />} />
        <ReactRouterDOM.Route path="/about-us" element={<AboutUsPage />} />
        
        {/* Protected Routes */}
        <ReactRouterDOM.Route element={<ProtectedRoute />}>
          <ReactRouterDOM.Route path="/cart" element={<CartPage />} />
          <ReactRouterDOM.Route path="/checkout" element={<CheckoutPage />} />
          <ReactRouterDOM.Route path="/profile" element={<ProfilePage />} />
          <ReactRouterDOM.Route path="/edit-profile" element={<EditProfilePage />} />
          <ReactRouterDOM.Route path="/order-history" element={<OrderHistoryPage />} />
          <ReactRouterDOM.Route path="/order/:orderId" element={<OrderDetailPage />} />
          <ReactRouterDOM.Route path="/wishlist" element={<WishlistPage />} />
        </ReactRouterDOM.Route>

        {/* Seller-only Protected Routes */}
        <ReactRouterDOM.Route element={<SellerProtectedRoute />}>
          <ReactRouterDOM.Route path="/seller-dashboard" element={<SellerDashboardPage />} />
          <ReactRouterDOM.Route path="/seller/products" element={<SellerProductsPage />} />
          <ReactRouterDOM.Route path="/add-product" element={<AddProductPage />} />
          <ReactRouterDOM.Route path="/seller/products/edit/:productId" element={<SellerEditProductPage />} />
          <ReactRouterDOM.Route path="/seller/orders" element={<SellerOrdersPage />} />
          <ReactRouterDOM.Route path="/seller/payouts" element={<SellerPayoutsPage />} />
          <ReactRouterDOM.Route path="/seller/returns" element={<SellerReturnsPage />} />
        </ReactRouterDOM.Route>

        {/* Admin-only Protected Routes */}
        <ReactRouterDOM.Route element={<AdminProtectedRoute />}>
          <ReactRouterDOM.Route path="/admin" element={<AdminDashboardPage />} />
          <ReactRouterDOM.Route path="/admin/products" element={<AdminProductsPage />} />
          <ReactRouterDOM.Route path="/admin/products/edit/:productId" element={<AdminEditProductPage />} />
          <ReactRouterDOM.Route path="/admin/users" element={<AdminUsersPage />} />
          <ReactRouterDOM.Route path="/admin/orders" element={<AdminOrdersPage />} />
          <ReactRouterDOM.Route path="/admin/coupons" element={<AdminCouponsPage />} />
          <ReactRouterDOM.Route path="/admin/returns" element={<AdminReturnsPage />} />
          <ReactRouterDOM.Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <ReactRouterDOM.Route path="/admin/revenue" element={<AdminRevenuePage />} />
        </ReactRouterDOM.Route>

        <ReactRouterDOM.Route path="*" element={<NotFoundPage />} />
      </ReactRouterDOM.Routes>
      <div className="print:hidden">
        <ToastContainer />
        <AICopilotModal />
        <AIPilotFAB />
      </div>
    </>
  );
};

export default App;