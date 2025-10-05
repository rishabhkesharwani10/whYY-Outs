import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.tsx';

// Static imports for components used across routes or in suspense fallback
import ProtectedRoute from './components/ProtectedRoute.tsx';
import SellerProtectedRoute from './components/SellerProtectedRoute.tsx';
import AdminProtectedRoute from './components/AdminProtectedRoute.tsx';
import LoadingSpinner from './components/LoadingSpinner.tsx';
import AICopilotModal from './components/AICopilotModal.tsx';
import AIPilotFAB from './components/AIPilotFAB.tsx';
import { useToast } from './hooks/useToast.ts';
import Icon from './components/Icon.tsx';
import TopProgressBar from './components/TopProgressBar.tsx';
import { useNavigationProgress } from './context/NavigationProgressContext.tsx';
import MandatoryLocationModal from './components/MandatoryLocationModal.tsx';
import { useStories } from './hooks/useStories.ts';
import StoryViewer from './components/StoryViewer.tsx';


// Lazy load all pages for code-splitting and performance
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.tsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.tsx'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage.tsx'));
const ShopPage = lazy(() => import('./pages/ShopPage.tsx'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.tsx'));
const CartPage = lazy(() => import('./pages/CartPage.tsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.tsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.tsx'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage.tsx'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage.tsx'));
const WishlistPage = lazy(() => import('./pages/WishlistPage.tsx'));
const MyQueriesPage = lazy(() => import('./pages/MyQueriesPage.tsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'));

// Legal & Info Pages
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.tsx'));
const TermsOfUsePage = lazy(() => import('./pages/TermsOfUsePage.tsx'));
const ReturnPolicyPage = lazy(() => import('./pages/ReturnPolicyPage.tsx'));
const SecurityPolicyPage = lazy(() => import('./pages/SecurityPolicyPage.tsx'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage.tsx'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage.tsx'));
const ShippingPolicyPage = lazy(() => import('./pages/ShippingPolicyPage.tsx'));
const ContactUsPage = lazy(() => import('./pages/ContactUsPage.tsx'));

// Seller Pages
const SellerDashboardPage = lazy(() => import('./pages/seller/SellerDashboardPage.tsx'));
const SellerProductsPage = lazy(() => import('./pages/seller/SellerProductsPage.tsx'));
const SellerAddProductPage = lazy(() => import('./pages/seller/AddProductPage.tsx'));
const SellerEditProductPage = lazy(() => import('./pages/seller/SellerEditProductPage.tsx'));
const SellerOrdersPage = lazy(() => import('./pages/seller/SellerOrdersPage.tsx'));
const SellerPayoutsPage = lazy(() => import('./pages/seller/SellerPayoutsPage.tsx'));
const SellerReturnsPage = lazy(() => import('./pages/seller/SellerReturnsPage.tsx'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.tsx'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage.tsx'));
const AdminAddProductPage = lazy(() => import('./pages/admin/AdminAddProductPage.tsx'));
const AdminEditProductPage = lazy(() => import('./pages/admin/AdminEditProductPage.tsx'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.tsx'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage.tsx'));
const AdminCouponsPage = lazy(() => import('./pages/admin/AdminCouponsPage.tsx'));
const AdminReturnsPage = lazy(() => import('./pages/admin/AdminReturnsPage.tsx'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage.tsx'));
const AdminRevenuePage = lazy(() => import('./pages/admin/AdminRevenuePage.tsx'));
const AdminPayoutsPage = lazy(() => import('./pages/admin/AdminPayoutsPage.tsx'));
const AdminQueriesPage = lazy(() => import('./pages/admin/AdminQueriesPage.tsx'));
const AdminStoriesPage = lazy(() => import('./pages/admin/AdminStoriesPage.tsx'));


interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const ToastComponent: React.FC<ToastProps> = ({ message, type, onClose }) => {
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
            <Link
              to="/cart"
              onClick={onClose}
              className="inline-block mt-2 text-sm font-bold underline hover:text-brand-gold-light"
            >
              View Cart &rarr;
            </Link>
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
const Toast = React.memo(ToastComponent);


const ToastContainer: React.FC = () => {
    const { toast, hideToast } = useToast();
    if (!toast) return null;
    return <Toast message={toast.message} type={toast.type} onClose={hideToast} />;
};


const App: React.FC = () => {
  const { loading, user, isAuthenticated, authEvent } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { start, finish } = useNavigationProgress();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const prevIsAuthenticated = useRef(isAuthenticated);
  const { isViewerOpen } = useStories();

  useEffect(() => {
    // This effect runs whenever isAuthenticated or user changes.
    // It checks if a user just logged in (transition from false to true).
    if (!prevIsAuthenticated.current && isAuthenticated && user) {
      // Check if the user's profile is missing essential address details.
      // Do not show for admin user as they do not have a shipping profile.
      if (user.role !== 'admin' && !user.addressLine1 && !user.zip) {
        setShowLocationModal(true);
      }
    }
    // Update the ref to the current value for the next render.
    prevIsAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, user]);

  // This effect listens for the PASSWORD_RECOVERY event from Supabase Auth.
  // When it occurs, it means the user has clicked the reset link and has a
  // valid session, so we redirect them to the password update page.
  useEffect(() => {
    if (authEvent === 'PASSWORD_RECOVERY') {
        navigate('/update-password', { replace: true });
    }
  }, [authEvent, navigate]);


  useEffect(() => {
    start();
    const timer = setTimeout(() => {
      finish();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname, start, finish]);

  // Show a global loading spinner while the initial authentication check is running.
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <TopProgressBar />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-use" element={<TermsOfUsePage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/security-policy" element={<SecurityPolicyPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/help-center" element={<HelpCenterPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/contact-us" element={<ContactUsPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/edit-profile" element={<EditProfilePage />} />
            <Route path="/order-history" element={<OrderHistoryPage />} />
            <Route path="/order/:orderId" element={<OrderDetailPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/my-queries" element={<MyQueriesPage />} />
          </Route>

          {/* Seller-only Protected Routes */}
          <Route element={<SellerProtectedRoute />}>
            <Route path="/seller-dashboard" element={<SellerDashboardPage />} />
            <Route path="/seller/products" element={<SellerProductsPage />} />
            <Route path="/seller/add-product" element={<SellerAddProductPage />} />
            <Route path="/seller/products/edit/:productId" element={<SellerEditProductPage />} />
            <Route path="/seller/orders" element={<SellerOrdersPage />} />
            <Route path="/seller/payouts" element={<SellerPayoutsPage />} />
            <Route path="/seller/returns" element={<SellerReturnsPage />} />
          </Route>

          {/* Admin-only Protected Routes */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/add-product" element={<AdminAddProductPage />} />
            <Route path="/admin/products/edit/:productId" element={<AdminEditProductPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/coupons" element={<AdminCouponsPage />} />
            <Route path="/admin/returns" element={<AdminReturnsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/revenue" element={<AdminRevenuePage />} />
            <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
            <Route path="/admin/queries" element={<AdminQueriesPage />} />
            <Route path="/admin/stories" element={<AdminStoriesPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <div className="print:hidden">
        <ToastContainer />
        <AICopilotModal />
        <AIPilotFAB />
        {showLocationModal && <MandatoryLocationModal onClose={() => setShowLocationModal(false)} />}
        {isViewerOpen && <StoryViewer />}
      </div>
    </>
  );
};

export default App;
