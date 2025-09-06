import React, { useState, useEffect, useMemo } from 'react';
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
import ProductDetailSkeleton from '../components/skeletons/ProductDetailSkeleton.tsx';
import { supabase } from '../supabase.ts';
import type { Review } from '../types.ts';
import StarInput from '../components/StarInput.tsx';
import LazyImage from '../components/LazyImage.tsx';

const SpecItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-brand-gold uppercase tracking-wider">{label}</p>
    <p className="font-semibold text-brand-light/90">{value}</p>
  </div>
);

const ProductDetailPage: React.FC = () => {
  const { productId } = ReactRouterDOM.useParams<{ productId: string }>();
  const { products, loading: productsLoading } = useProducts();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();

  const [added, setAdded] = useState(false);
  const product = products.find(p => p.id === productId);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  // State for reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const availableColors = useMemo(() => {
    if (product && product.color) {
      return product.color.split(',').map(c => c.trim());
    }
    return [];
  }, [product]);

  const validation = useMemo(() => {
    if (!product) return { isValid: false, message: 'Product not loaded.' };

    const { categoryId, sizes } = product;
    const hasSizes = sizes && sizes.length > 0;
    const hasMultipleColors = availableColors.length > 1;

    if (categoryId === 'fashion') {
        if (hasSizes && !selectedSize) return { isValid: false, message: 'Please select a size for this item.' };
        if (hasMultipleColors && !selectedColor) return { isValid: false, message: 'Please select a color for this item.' };
    }

    if (categoryId === 'electronics') {
        if (hasMultipleColors && !selectedColor) return { isValid: false, message: 'Please select a color for this item.' };
    }
    
    // Quantity is always valid as it defaults to 1. No check needed for 'grocery' or 'electronics' quantity.
    return { isValid: true, message: '' };
  }, [product, selectedSize, selectedColor, availableColors]);

  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0);
      setSelectedSize(undefined); // Reset size selection when product changes
      setQuantity(1); // Reset quantity
      setActiveTab('description'); // Reset tab

      if (availableColors.length === 1) {
        setSelectedColor(availableColors[0]);
      } else {
        setSelectedColor(undefined);
      }
    }
  }, [product, availableColors]);
  
  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) return;
      setLoadingReviews(true);
      setUserHasReviewed(false);

      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (reviewError) {
        console.error("Error fetching reviews:", reviewError);
        setLoadingReviews(false);
        return;
      }
      if (!reviewData || reviewData.length === 0) {
        setReviews([]);
        setLoadingReviews(false);
        return;
      }

      const userIds = [...new Set(reviewData.map(r => r.user_id))];
      if (user && userIds.includes(user.id)) {
        setUserHasReviewed(true);
      }

      const { data: customerProfiles } = await supabase.from('customers').select('id, full_name').in('id', userIds);
      const { data: sellerProfiles } = await supabase.from('sellers').select('id, full_name').in('id', userIds);

      const profilesMap = new Map<string, string>();
      customerProfiles?.forEach(p => profilesMap.set(p.id, p.full_name));
      sellerProfiles?.forEach(p => profilesMap.set(p.id, p.full_name));

      const combinedReviews: Review[] = reviewData.map(review => ({
        id: review.id,
        productId: review.product_id,
        userId: review.user_id,
        reviewerName: profilesMap.get(review.user_id) || 'Anonymous',
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
      }));
      
      setReviews(combinedReviews);
      setLoadingReviews(false);
    };

    fetchReviews();
  }, [productId, user]);
  
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !productId) return;
    if (newRating === 0) {
      setReviewError("Please select a star rating.");
      return;
    }
    setIsSubmittingReview(true);
    setReviewError('');

    const { data, error } = await supabase
      .from('reviews')
      .insert({ product_id: productId, user_id: user.id, rating: newRating, comment: newComment })
      .select().single();

    if (error) {
      console.error("Error submitting review:", error);
      setReviewError(error.message.includes('duplicate key') ? "You have already reviewed this product." : "Failed to submit review.");
    } else if (data) {
      const newReview: Review = {
        id: data.id, productId: data.product_id, userId: data.user_id,
        reviewerName: user.fullName, rating: data.rating, comment: data.comment, createdAt: data.created_at,
      };
      setReviews(prev => [newReview, ...prev]);
      setUserHasReviewed(true);
      setNewRating(0);
      setNewComment('');
    }
    setIsSubmittingReview(false);
  };

  if (productsLoading) {
    return (
        <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32 page-fade-in">
                <div className="mb-8"><BackButton fallback="/shop" /></div>
                <ProductDetailSkeleton />
            </main>
            <Footer />
        </div>
    );
  }

  if (!product) {
    return <NotFoundPage />;
  }
  
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!validation.isValid) {
      // Button is disabled, so this path is unlikely, but it's a good safeguard.
      // The tooltip on the disabled button provides non-intrusive feedback.
      return;
    }
    
    const success = addToCart(product, quantity, selectedSize, selectedColor);

    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const allImages = [product.image, ...product.images].filter(Boolean);
  const isSizeRequired = !!product.sizes && product.sizes.length > 0;
  const inStock = product.stockQuantity === undefined || product.stockQuantity > 0;
  const isSizeMandatory = product.categoryId === 'fashion' && isSizeRequired;
  const isButtonDisabled = !inStock || added || !validation.isValid;

  const handlePrevImage = () => setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  const handleNextImage = () => setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  
  const TabButton: React.FC<{ tabName: string; children: React.ReactNode }> = ({ tabName, children }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-6 py-3 font-semibold text-sm uppercase tracking-wider transition-colors duration-300 relative ${activeTab === tabName ? 'text-brand-gold' : 'text-brand-light/70 hover:text-white'}`}
    >
      {children}
      {activeTab === tabName && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-gold"></div>}
    </button>
  );

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8"><BackButton fallback="/shop" /></div>
        <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-4 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            
            {/* Image Carousel */}
            <div className="lg:col-span-2">
              <div className="relative group aspect-square w-full overflow-hidden rounded-lg bg-black/20">
                  <LazyImage 
                    key={allImages[currentImageIndex]}
                    src={allImages[currentImageIndex]} 
                    alt={`${product.name} image ${currentImageIndex + 1}`} 
                    className="w-full h-full object-contain transition-opacity duration-300 page-fade-in"
                  />
                  <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Previous image"><Icon name="chevron-left" className="w-6 h-6" /></button>
                  <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Next image"><Icon name="chevron-right" className="w-6 h-6" /></button>
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-2 mt-4">
              {allImages.map((img, index) => (
                <button 
                  key={index} 
                  onClick={() => setCurrentImageIndex(index)} 
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${currentImageIndex === index ? 'border-brand-gold' : 'border-transparent hover:border-brand-gold/50'}`} 
                  aria-label={`View image ${index + 1}`}
                >
                  <LazyImage 
                    src={img} 
                    alt={`${product.name} thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col lg:col-span-3">
                {product.brand && <p className="text-brand-gold uppercase tracking-widest text-sm font-semibold">{product.brand}</p>}
                <h1 className="text-3xl lg:text-4xl font-bold font-serif text-brand-light mt-1">{product.name}</h1>
                <div className="flex items-center mt-3 gap-4"><StarRating rating={product.rating} /><a href="#reviews" className="text-sm text-brand-light/70 hover:underline">({product.reviewCount} reviews)</a></div>
                <div className="flex items-baseline mt-4"><span className="text-4xl font-bold text-brand-light">₹{product.price.toFixed(2)}</span>{product.originalPrice && (<span className="text-lg text-brand-light/60 line-through ml-3">₹{product.originalPrice.toFixed(2)}</span>)}</div>
                
                <div className="mt-6 space-y-4 border-t border-brand-gold/20 pt-6">
                    {product.stockQuantity !== undefined && (
                        <div>
                            <p className="text-sm text-brand-gold uppercase tracking-wider">Availability</p>
                            <p className={`font-semibold ${product.stockQuantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {product.stockQuantity > 0 ? `In Stock (${product.stockQuantity} available)` : 'Out of Stock'}
                            </p>
                        </div>
                    )}
                     {product.returnPolicy && (
                        <div>
                            <p className="text-sm text-brand-gold uppercase tracking-wider">Return Policy</p>
                            <p className="font-semibold text-brand-light/90">{product.returnPolicy}</p>
                        </div>
                    )}
                </div>

                {availableColors.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-md font-semibold text-brand-gold tracking-wider uppercase">
                      Color: <span className="text-brand-light/90 font-normal capitalize">{selectedColor || 'Please select'}</span>
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {availableColors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-brand-dark ring-brand-gold border-brand-dark' : 'border-brand-light/30'}`}
                          style={{ backgroundColor: color.toLowerCase() }}
                          aria-label={`Select color ${color}`}
                        >
                          {selectedColor === color && <Icon name="check" className="w-5 h-5 text-white mix-blend-difference" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isSizeRequired && (
                  <div className="mt-6">
                    <h3 className="text-md font-semibold text-brand-gold tracking-wider uppercase">
                      Select Size {isSizeMandatory ? '' : '(optional)'}:
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-3">
                      {product.sizes?.map(size => (
                        <button key={size} onClick={() => setSelectedSize(size)} className={`font-sans px-4 py-2 border rounded-md transition-colors duration-200 ${selectedSize === size ? 'bg-brand-gold text-brand-dark border-brand-gold' : 'border-brand-gold/50 text-brand-light hover:bg-brand-gold/20'}`}>{size}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                    <h3 className="text-md font-semibold text-brand-gold tracking-wider uppercase">Quantity:</h3>
                    <div className="flex items-center border border-brand-gold/50 rounded-md w-fit mt-3">
                        <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 text-brand-gold hover:bg-brand-gold/10" aria-label="Decrease quantity">
                            <Icon name="minus" className="w-4 h-4" />
                        </button>
                        <span className="px-6 font-semibold text-lg" aria-live="polite">{quantity}</span>
                        <button type="button" onClick={() => setQuantity(q => (product.maxOrderQuantity ? Math.min(product.maxOrderQuantity, q + 1) : q + 1))} className="p-3 text-brand-gold hover:bg-brand-gold/10" aria-label="Increase quantity">
                            <Icon name="plus" className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                <div className="mt-auto pt-8 flex items-stretch gap-4">
                  <button 
                    onClick={handleAddToCart} 
                    disabled={isButtonDisabled} 
                    title={!validation.isValid ? validation.message : (!inStock ? 'Out of Stock' : '')}
                    className={`flex-grow font-sans text-base font-bold tracking-wider px-6 py-3 border transition-colors duration-300 uppercase rounded-md flex items-center justify-center ${added ? 'bg-green-500 border-green-500 text-white' : 'border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark'} ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {added ? 'Added!' : (!inStock ? 'Out of Stock' : 'Add to Cart')}
                  </button>
                  <WishlistButton productId={product.id} className="flex-shrink-0 w-14 border border-brand-gold/50 rounded-md"/>
                </div>
            </div>
            </div>
            
            <div id="reviews" className="mt-12 border-t border-brand-gold/20">
                <div className="border-b border-brand-gold/20 flex items-center">
                    <TabButton tabName="description">Description</TabButton>
                    <TabButton tabName="features">Features</TabButton>
                    <TabButton tabName="specifications">Specifications</TabButton>
                    <TabButton tabName="reviews">Reviews ({reviews.length})</TabButton>
                </div>
                <div className="py-6 min-h-[200px]">
                    {activeTab === 'description' && (<p className="text-brand-light/80 leading-relaxed">{product.description}</p>)}
                    {activeTab === 'features' && product.features && product.features.length > 0 && (<ul className="space-y-2">{product.features.map((feature, index) => (<li key={index} className="flex items-center gap-3"><Icon name="check" className="w-5 h-5 text-brand-gold" /><span>{feature}</span></li>))}</ul>)}
                    {activeTab === 'specifications' && (
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
                            {product.deliveryEstimate && <SpecItem label="Delivery Estimate" value={product.deliveryEstimate} />}
                        </div>
                    )}
                    {activeTab === 'reviews' && (
                        <div>
                            {isAuthenticated && !userHasReviewed && (
                                <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-black/30 rounded-lg border border-brand-gold/20">
                                    <h3 className="font-serif text-xl text-brand-gold mb-4">Write Your Review</h3>
                                    {reviewError && <p className="text-red-400 mb-4">{reviewError}</p>}
                                    <div className="mb-4">
                                        <p className="text-sm text-brand-gold uppercase tracking-wider mb-2">Your Rating</p>
                                        <StarInput rating={newRating} setRating={setNewRating} />
                                    </div>
                                    <div>
                                        <label htmlFor="comment" className="text-sm text-brand-gold uppercase tracking-wider mb-2 block">Your Comment</label>
                                        <textarea
                                            id="comment"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Share your thoughts about the product..."
                                            className="w-full bg-black/50 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                                            rows={4}
                                        />
                                    </div>
                                    <button type="submit" disabled={isSubmittingReview} className="mt-4 font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase disabled:opacity-50">
                                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            )}
                            {isAuthenticated && userHasReviewed && (
                                <div className="mb-6 text-center text-green-400 bg-green-500/10 p-4 rounded-md">
                                    <p>Thank you for your review!</p>
                                </div>
                            )}

                            {loadingReviews ? (
                                <p>Loading reviews...</p>
                            ) : reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {reviews.map(review => (
                                        <div key={review.id} className="border-b border-brand-gold/20 pb-4 last:border-b-0">
                                            <div className="flex items-center mb-2">
                                                <StarRating rating={review.rating} className="w-4 h-4" />
                                                <p className="ml-3 font-semibold text-brand-light">{review.reviewerName}</p>
                                            </div>
                                            <p className="text-xs text-brand-light/70 mb-2">
                                                Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-brand-light/90 leading-relaxed">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-brand-light/70">No reviews yet. Be the first one to review!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;