
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.ts';
import StarRating from '../components/StarRating.tsx';
import { useCart } from '../hooks/useCart.ts';
import NotFoundPage from './NotFoundPage.tsx';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import WishlistButton from '../components/WishlistButton.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import Icon from '../components/Icon.tsx';

const SpecItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-brand-gold uppercase tracking-wider">{label}</p>
    <p className="font-semibold text-brand-light/90">{value}</p>
  </div>
);

const ProductDetailPage: React.FC = () => {
  const { productId } = ReactRouterDOM.useParams<{ productId: string }>();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();

  const [added, setAdded] = useState(false);
  const product = products.find(p => p.id === productId);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0);
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
                <div className="w-8 h-8 border-2 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin"></div>
                <p className="ml-4">Loading product...</p>
            </main>
            <Footer />
        </div>
    );
  }
  
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (product.sizes && !selectedSize) {
      alert('Please select a size.');
      return;
    }
    addToCart(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const allImages = [product.image, ...product.images].filter(Boolean);
  const isSizeRequired = !!product.sizes && product.sizes.length > 0;
  const inStock = product.stockQuantity === undefined || product.stockQuantity > 0;

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <BackButton fallback="/shop" />
        </div>
        <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* START: Enhanced Image Carousel */}
            <div className="flex flex-col gap-4">
                <div className="relative group aspect-square w-full overflow-hidden rounded-lg">
                    <img src={allImages[currentImageIndex]} alt={`${product.name} image ${currentImageIndex + 1}`} className="w-full h-full object-cover transition-transform duration-500 transform group-hover:scale-105"/>
                    <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Previous image">
                        <Icon name="chevron-left" className="w-6 h-6" />
                    </button>
                    <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Next image">
                        <Icon name="chevron-right" className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                    <button 
                    key={index} 
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${currentImageIndex === index ? 'border-brand-gold' : 'border-transparent hover:border-brand-gold/50'}`}
                    aria-label={`View image ${index + 1}`}
                    >
                    <img src={img} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                    </button>
                ))}
                </div>
            </div>
            {/* END: Enhanced Image Carousel */}

            {/* Product Info */}
            <div>
                <h1 className="text-3xl lg:text-4xl font-bold font-serif text-brand-light">{product.name}</h1>
                <div className="flex items-center mt-3">
                    <StarRating rating={product.rating} />
                    <a href="#reviews" className="text-sm text-brand-light/70 ml-3 hover:underline">({product.reviewCount} reviews)</a>
                </div>
                <div className="flex items-baseline mt-4">
                    <span className="text-4xl font-bold text-brand-light">${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                        <span className="text-lg text-brand-light/60 line-through ml-3">${product.originalPrice.toFixed(2)}</span>
                    )}
                </div>
                
                <p className="mt-4 text-brand-light/80 leading-relaxed">{product.description}</p>
                
                {isSizeRequired && (
                  <div className="mt-6">
                    <h3 className="text-md font-semibold text-brand-gold tracking-wider uppercase">Select Size:</h3>
                    <div className="flex flex-wrap gap-3 mt-3">
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
                
                {/* START: Prominent Features Section */}
                {product.features && product.features.length > 0 && (
                  <div className="mt-8 border-t border-brand-gold/20 pt-6">
                      <h3 className="text-md font-semibold text-brand-gold tracking-wider uppercase">Key Features:</h3>
                      <ul className="mt-3 space-y-2">
                          {product.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-3">
                              <Icon name="check" className="w-5 h-5 text-brand-gold" />
                              <span className="text-brand-light/90">{feature}</span>
                          </li>
                          ))}
                      </ul>
                  </div>
                )}
                {/* END: Prominent Features Section */}

                {/* START: Prominent Action Buttons */}
                <div className="mt-8 flex items-stretch gap-4">
                  <button 
                      onClick={handleAddToCart}
                      disabled={!inStock || (isSizeRequired && !selectedSize)}
                      className={`flex-grow font-sans text-lg font-bold tracking-wider px-8 py-4 border transition-colors duration-300 uppercase rounded-md flex items-center justify-center ${added ? 'bg-green-500 border-green-500 text-white' : 'border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark'} ${(!inStock || (isSizeRequired && !selectedSize)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                      {added ? 'Added!' : (!inStock ? 'Out of Stock' : 'Add to Cart')}
                  </button>
                  <WishlistButton 
                    productId={product.id}
                    className="flex-shrink-0 w-16 border border-brand-gold/50 rounded-md"
                  />
                </div>
                {/* END: Prominent Action Buttons */}
            </div>
            </div>
            {/* START: Specifications section */}
            <div className="mt-12 border-t border-brand-gold/20 pt-8">
              <h2 className="font-serif text-2xl text-brand-gold mb-6">Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 text-sm">
                {product.brand && <SpecItem label="Brand" value={product.brand} />}
                {product.modelNumber && <SpecItem label="Model Number" value={product.modelNumber} />}
                {product.sku && <SpecItem label="SKU" value={product.sku} />}
                {product.color && <SpecItem label="Color" value={product.color} />}
                {product.material && <SpecItem label="Material" value={product.material} />}
                {product.stockQuantity !== undefined && <SpecItem label="Availability" value={product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of Stock'} />}
                {product.weightKg && <SpecItem label="Weight" value={`${product.weightKg} kg`} />}
                {product.warrantyDetails && <SpecItem label="Warranty" value={product.warrantyDetails} />}
                {product.returnPolicy && <SpecItem label="Return Policy" value={product.returnPolicy} />}
                {product.deliveryEstimate && <SpecItem label="Delivery" value={product.deliveryEstimate} />}
                {product.upc && <SpecItem label="UPC/GTIN" value={product.upc} />}
                {product.expiryDate && <SpecItem label="Expiry Date" value={new Date(product.expiryDate).toLocaleDateString()} />}
              </div>
            </div>
             {/* END: Specifications section */}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
