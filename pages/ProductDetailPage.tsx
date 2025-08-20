

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.ts';
import StarRating from '../components/StarRating.tsx';
import { useCart } from '../hooks/useCart.ts';
import NotFoundPage from './NotFoundPage.tsx';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';

const ProductDetailPage: React.FC = () => {
  const { productId } = ReactRouterDOM.useParams<{ productId: string }>();
  const { products } = useProducts();
  const { addToCart } = useCart();

  const [added, setAdded] = useState(false);
  const product = products.find(p => p.id === productId);

  const [mainImage, setMainImage] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (product) {
      setMainImage(product.image);
      setSelectedSize(undefined); // Reset size selection when product changes
    }
  }, [product]);

  if (products.length > 0 && !product) {
    return <NotFoundPage />;
  }

  if (!product) {
    return (
        <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative">
            <Header />
            <main className="flex-grow flex items-center justify-center">
                <p>Loading product...</p>
            </main>
            <Footer />
        </div>
    );
  }
  
  const handleAddToCart = () => {
    if (product.sizes && !selectedSize) {
      alert('Please select a size.');
      return;
    }
    addToCart(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const allImages = [product.image, ...product.images];
  const isSizeRequired = !!product.sizes && product.sizes.length > 0;

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <BackButton fallback="/shop" />
        </div>
        <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div>
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg mb-4">
                <img src={mainImage} alt={product.name} className="w-full h-full object-cover"/>
                </div>
                <div className="flex space-x-2">
                {allImages.map((img, index) => (
                    <button 
                    key={index} 
                    onClick={() => setMainImage(img)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${mainImage === img ? 'border-brand-gold' : 'border-transparent hover:border-brand-gold/50'}`}
                    >
                    <img src={img} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                    </button>
                ))}
                </div>
            </div>

            {/* Product Info */}
            <div>
                <h1 className="text-3xl font-bold font-serif text-brand-light">{product.name}</h1>
                <div className="flex items-center mt-2">
                <StarRating rating={product.rating} />
                <span className="text-sm text-brand-light/70 ml-3">({product.reviewCount} reviews)</span>
                </div>
                <div className="flex items-baseline mt-4">
                <span className="text-3xl font-bold text-brand-light">${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                    <span className="text-lg text-brand-light/60 line-through ml-3">${product.originalPrice.toFixed(2)}</span>
                )}
                </div>
                
                <p className="mt-4 text-brand-light/80">{product.description}</p>
                
                {isSizeRequired && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-brand-gold tracking-wider uppercase">Size:</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {product.sizes?.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`font-sans px-4 py-2 border rounded-md transition-colors duration-200 ${selectedSize === size ? 'bg-brand-gold text-brand-dark border-brand-gold' : 'border-brand-gold/50 text-brand-light hover:bg-brand-gold/20'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                <h3 className="text-lg font-semibold text-brand-gold tracking-wider uppercase">Features:</h3>
                <ul className="list-disc list-inside mt-2 text-brand-light/80 space-y-1">
                    {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                    ))}
                </ul>
                </div>

                <div className="mt-8">
                <button 
                    onClick={handleAddToCart}
                    disabled={isSizeRequired && !selectedSize}
                    className={`w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold transition-colors duration-300 uppercase ${added ? 'bg-brand-gold text-brand-dark' : 'text-brand-gold hover:bg-brand-gold hover:text-brand-dark'} ${isSizeRequired && !selectedSize ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {added ? 'Added!' : 'Add to Cart'}
                </button>
                </div>
            </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;