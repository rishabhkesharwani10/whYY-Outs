

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useProducts } from '../hooks/useProducts.ts';
import ProductCard from '../components/ProductCard.tsx';
import BackButton from '../components/BackButton.tsx';

const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const navigate = ReactRouterDOM.useNavigate();

  const sellerProducts = products.filter(p => p.sellerId === user?.id);

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <BackButton fallback="/profile" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="font-serif text-4xl text-brand-light">Seller Dashboard</h1>
            <p className="text-brand-light/70 mt-1">Manage your products here.</p>
          </div>
          <button 
            onClick={() => navigate('/add-product')} 
            className="w-full sm:w-auto font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark hover:border-brand-gold-dark transition-colors duration-300 uppercase"
          >
            Add New Product
          </button>
        </div>
        
        <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-6">
          <h2 className="text-2xl font-bold font-serif text-brand-light mb-6">Your Product Listings ({sellerProducts.length})</h2>
          {sellerProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {sellerProducts.map(product => (
                <ProductCard key={product.id} product={product} />
                ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-brand-light">You haven't added any products yet.</h3>
              <p className="text-brand-light/70 mt-2">Click 'Add New Product' to get started.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerDashboardPage;