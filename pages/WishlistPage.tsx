import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist.ts';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import ProductCard from '../components/ProductCard.tsx';
import Icon from '../components/Icon.tsx';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton.tsx';

const WishlistPage: React.FC = () => {
  const { wishlistItems, loading } = useWishlist();

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <BackButton fallback="/profile" />
        </div>
        <h1 className="font-serif text-4xl text-brand-light mb-2">My Wishlist</h1>
        
        {loading ? (
           <p className="text-brand-light/70 mb-8 animate-pulse">Loading your saved items...</p>
        ) : (
          <p className="text-brand-light/70 mb-8">
            {wishlistItems.length > 0
              ? `You have ${wishlistItems.length} item(s) saved.`
              : 'Your saved items will appear here.'}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-brand-gold/20 rounded-lg">
             <Icon name="wishlist" className="w-16 h-16 mx-auto text-brand-light/40" />
            <h2 className="mt-6 text-2xl font-semibold text-brand-light">Your Wishlist is Empty</h2>
            <p className="mt-2 text-brand-light/70">
              Looks like you haven't saved any items yet.
            </p>
            <Link
              to="/shop"
              className="mt-8 inline-block font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase"
            >
              Explore Products
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;