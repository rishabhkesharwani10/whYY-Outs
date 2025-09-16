
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BottomNav from '../components/BottomNav.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useProducts } from '../hooks/useProducts.ts';
import { NAVIGATION_CATEGORIES } from '../constants.ts';
import Icon from '../components/Icon.tsx';
import HomeContentSkeleton from '../components/skeletons/HomeContentSkeleton.tsx';

// ==================================================================
// LoggedInHomePage - The AI Dashboard for authenticated users
// ==================================================================

const WelcomeUser: React.FC<{ name: string }> = ({ name }) => (
  <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 className="font-serif text-3xl md:text-4xl text-brand-light">
      Welcome back, <span className="text-brand-gold-light">{name.split(' ')[0]}</span> 👋
    </h1>
    <p className="text-brand-light/70 mt-2">Ready to shop smarter?</p>
  </section>
);

const FlashDeals: React.FC<{ product: any }> = ({ product }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 3, minutes: 45, seconds: 12 });
  const discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else if (minutes > 0) { minutes--; seconds = 59; } 
        else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full bg-black/40 border border-brand-gold/20 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-sm shadow-2xl shadow-brand-gold/10">
      <div>
        <div className="flex justify-between items-center">
          <h3 className="font-serif text-2xl text-brand-gold">Flash Sale</h3>
          <div className="text-xs font-bold bg-brand-gold text-brand-dark px-2 py-1 rounded">{discountPercentage}% OFF</div>
        </div>
        <p className="text-brand-light/80 mt-2 text-lg font-semibold">{product.name}</p>
      </div>
      <div className="flex justify-center gap-3 my-4">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="text-center">
            <div className="text-2xl font-bold p-2 bg-black/30 rounded-lg w-14">{String(value).padStart(2, '0')}</div>
            <div className="text-[10px] uppercase tracking-widest mt-1">{unit}</div>
          </div>
        ))}
      </div>
      <ReactRouterDOM.Link to={`/product/${product.id}`} className="w-full text-center font-sans text-sm tracking-widest px-6 py-2.5 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-all duration-300 uppercase font-bold rounded-md">
        Shop Now
      </ReactRouterDOM.Link>
    </div>
  );
};

const CategoryHub: React.FC = () => (
  <section className="py-12">
    <h2 className="font-serif text-3xl text-center text-brand-light mb-8 tracking-wider">Interactive Category Hub</h2>
    <div className="flex space-x-4 overflow-x-auto pb-4 px-4 sm:px-6 lg:px-8 -mx-4 sm:-mx-6 lg:-mx-8" style={{ scrollbarWidth: 'none' }}>
      {NAVIGATION_CATEGORIES.map(cat => (
        <ReactRouterDOM.Link 
          to="/shop" 
          key={cat.id} 
          state={{ category: cat.id }}
          className="group flex-shrink-0 flex flex-col items-center justify-center space-y-3 p-4 w-32 bg-black/40 border border-brand-gold/20 rounded-2xl backdrop-blur-sm hover:border-brand-gold hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-gold/10 transition-all duration-300 text-center"
        >
          <img src={cat.image} alt={cat.name} className="w-20 h-20 rounded-full object-cover border-2 border-brand-gold/30 group-hover:border-brand-gold transition-all duration-300" />
          <span className="font-medium text-sm text-brand-light/80 group-hover:text-white transition-colors duration-300">{cat.name}</span>
        </ReactRouterDOM.Link>
      ))}
    </div>
  </section>
);

const LoggedInHomePage: React.FC = () => {
  const { user } = useAuth();
  const { products, loading } = useProducts();
  const navigate = ReactRouterDOM.useNavigate();

  useEffect(() => {
    if (user && user.role === 'seller') {
      navigate('/seller-dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (!user || (user && user.role === 'seller')) {
    return (
      <div className="bg-brand-dark min-h-screen flex items-center justify-center">
        <p className="text-brand-gold animate-pulse">Loading Your Personal Dashboard...</p>
      </div>
    );
  }
  
  const flashDealProduct = !loading && products.length > 4 ? products[4] : (products.length > 1 ? products[1] : null);

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen font-sans relative overflow-x-hidden">
      <div className="absolute inset-0 bg-grid-gold opacity-5 z-0"></div>
      <Header />
      <main className="pb-24 md:pb-8 pt-28 space-y-12 page-fade-in">
        <WelcomeUser name={user.fullName} />
        {loading ? <HomeContentSkeleton /> : (
            <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto h-[22rem]">
                    {flashDealProduct && <FlashDeals product={flashDealProduct} />}
                </div>
            </section>
        )}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <CategoryHub />
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

// ==================================================================
// PublicHomePage - The welcome page for guests
// ==================================================================
const WelcomePublic: React.FC = () => (
  <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 className="font-serif text-3xl md:text-4xl text-brand-light">
      Welcome to <span className="text-brand-gold-light">whYYOuts</span> ✨
    </h1>
    <p className="text-brand-light/70 mt-2">The future of premium shopping awaits.</p>
  </section>
);

const PublicHomePage: React.FC = () => {
  const { products, loading } = useProducts();
  
  const flashDealProduct = !loading && products.length > 4 ? products[4] : (products.length > 1 ? products[1] : null);

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen font-sans relative overflow-x-hidden">
      <div className="absolute inset-0 bg-grid-gold opacity-5 z-0"></div>
      <Header />
      <main className="pb-24 md:pb-8 pt-28 space-y-12 page-fade-in">
        <WelcomePublic />
        {loading ? <HomeContentSkeleton /> : (
            <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto h-[22rem]">
                    {flashDealProduct && <FlashDeals product={flashDealProduct} />}
                </div>
            </section>
        )}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <CategoryHub />
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};


// ==================================================================
// Main HomePage Component - The Router
// ==================================================================

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <LoggedInHomePage /> : <PublicHomePage />;
};

export default HomePage;
