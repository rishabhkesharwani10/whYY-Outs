import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAVIGATION_CATEGORIES, SMART_SUGGESTIONS } from '../constants.ts';
import ProductCard from '../components/ProductCard.tsx';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import Icon from '../components/Icon.tsx';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton.tsx';
import type { Filter, FilterOption, Product } from '../types.ts';
import { supabase } from '../supabase.ts';
import { useProducts } from '../hooks/useProducts.ts';

const PRODUCTS_PER_PAGE = 8;

const PRODUCT_QUERY_FIELDS = `
    id, name, description, price, original_price, rating, review_count, image, images, category_id,
    sub_category_id, features, sizes, seller_id, brand, sku, upc, model_number, video_url, cost_price,
    stock_quantity, min_order_quantity, max_order_quantity, weight_kg, length_cm, width_cm, height_cm,
    delivery_estimate, color, material, expiry_date, return_policy, return_days, warranty_details, created_at,
    sellers(business_name)
`;

// Helper to map Supabase product (snake_case) to our app's Product type (camelCase)
const mapSupabaseProduct = (product: any): Product => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  originalPrice: product.original_price,
  rating: product.rating,
  reviewCount: product.review_count,
  image: product.image,
  images: product.images,
  categoryId: product.category_id,
  features: product.features,
  sizes: product.sizes,
  sellerId: product.seller_id,
  sellerBusinessName: product.sellers?.business_name,
  subCategoryId: product.sub_category_id,
  brand: product.brand,
  sku: product.sku,
  upc: product.upc,
  modelNumber: product.model_number,
  videoUrl: product.video_url,
  costPrice: product.cost_price,
  stockQuantity: product.stock_quantity,
  minOrderQuantity: product.min_order_quantity,
  maxOrderQuantity: product.max_order_quantity,
  weightKg: product.weight_kg,
  lengthCm: product.length_cm,
  widthCm: product.width_cm,
  heightCm: product.height_cm,
  deliveryEstimate: product.delivery_estimate,
  color: product.color,
  material: product.material,
  expiryDate: product.expiry_date,
  returnPolicy: product.return_policy,
  returnDays: product.return_days,
  warrantyDetails: product.warranty_details,
  createdAt: product.created_at,
});


const getInitialFilters = () => {
    try {
        const saved = sessionStorage.getItem('shopPageFilters');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (typeof parsed === 'object' && parsed !== null) {
                return {
                    searchQuery: parsed.searchQuery || '',
                    selectedCategory: parsed.selectedCategory || null,
                    priceRange: typeof parsed.priceRange === 'number' ? parsed.priceRange : 150000,
                    otherFilters: parsed.otherFilters || {},
                    sortBy: parsed.sortBy || 'popularity',
                    // FIX: Ensure visualSearchProductIds from sessionStorage is either an array or null to prevent type errors.
                    visualSearchProductIds: Array.isArray(parsed.visualSearchProductIds) ? parsed.visualSearchProductIds : null,
                    selectedSellerId: parsed.selectedSellerId || null,
                };
            }
        }
    } catch (error) {
        console.error("Failed to parse filters from sessionStorage", error);
    }
    return {
        searchQuery: '',
        selectedCategory: null,
        priceRange: 150000,
        otherFilters: {},
        sortBy: 'popularity',
        visualSearchProductIds: null,
        selectedSellerId: null,
    };
};

// Haversine formula to calculate distance between two points on Earth
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d; // Distance in km
}


const ShopPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lastRefreshed } = useProducts();
  
  // State for main (paginated) products
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // State for prioritized nearby products
  const [nearbyProducts, setNearbyProducts] = useState<Product[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(() => getInitialFilters().searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => getInitialFilters().selectedCategory);
  const [priceRange, setPriceRange] = useState(() => getInitialFilters().priceRange);
  const [otherFilters, setOtherFilters] = useState<{ [key: string]: string[] }>(() => getInitialFilters().otherFilters);
  const [sortBy, setSortBy] = useState(() => getInitialFilters().sortBy);
  const [visualSearchProductIds, setVisualSearchProductIds] = useState<string[] | null>(() => getInitialFilters().visualSearchProductIds);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(() => getInitialFilters().selectedSellerId);
  const [sellerInfo, setSellerInfo] = useState<{ name: string } | null>(null);

  // Location-related state
  const [locationState, setLocationState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  const [nearbySellerIds, setNearbySellerIds] = useState<Set<string> | null>(null);


  useEffect(() => {
    setLocationState({ status: 'loading', message: 'Detecting your location...' });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationState({ status: 'loading', message: 'Finding nearby sellers...' });
        
        const { data: sellers, error } = await supabase.rpc('get_sellers_with_location');

        if (error || !sellers) {
          console.error("Error fetching sellers:", error?.message || JSON.stringify(error));
          setLocationState({ status: 'error', message: 'Could not fetch local seller data. Please try again later.' });
          setNearbySellerIds(new Set());
          return;
        }

        const nearbyIds = new Set<string>();
        for (const seller of sellers as any[]) {
          if (seller.latitude && seller.longitude) {
            const distance = getDistance(latitude, longitude, seller.latitude, seller.longitude);
            if (distance <= 1) { // 1 km radius
              nearbyIds.add(seller.id);
            }
          }
        }
        
        setNearbySellerIds(nearbyIds);
        if (nearbyIds.size > 0) {
            setLocationState({ status: 'success', message: `Found ${nearbyIds.size} local sellers! Their products are featured below.` });
        } else {
            setLocationState({ status: 'success', message: 'No local sellers found within 1km.' });
        }
        setTimeout(() => setLocationState(prev => ({ ...prev, message: '' })), 5000); // Hide message after 5s
      },
      (error) => {
        let message = 'Could not get location. Showing all products.';
        if(error.code === 1) message = 'Location access denied. Showing all products.';
        setLocationState({ status: 'error', message });
        setNearbySellerIds(new Set()); // Ensure it's not null to trigger fetches
        setTimeout(() => setLocationState(prev => ({ ...prev, message: '' })), 5000); // Hide message after 5s
      },
      { timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  useEffect(() => {
    const fetchSellerInfo = async () => {
        if (selectedSellerId) {
            const { data, error } = await supabase.from('sellers').select('business_name').eq('id', selectedSellerId).single();
            if (data) {
                setSellerInfo({ name: data.business_name });
            } else {
                setSellerInfo(null);
            }
        } else {
            setSellerInfo(null);
        }
    };
    fetchSellerInfo();
  }, [selectedSellerId]);

  useEffect(() => {
    const filtersToSave = {
        searchQuery,
        selectedCategory,
        priceRange,
        otherFilters,
        sortBy,
        visualSearchProductIds,
        selectedSellerId,
    };
    sessionStorage.setItem('shopPageFilters', JSON.stringify(filtersToSave));
  }, [searchQuery, selectedCategory, priceRange, otherFilters, sortBy, visualSearchProductIds, selectedSellerId]);

  const resetFilters = () => {
    setPriceRange(150000);
    setOtherFilters({});
    setSortBy('popularity');
    setSearchQuery('');
    setVisualSearchProductIds(null);
    setSelectedSellerId(null);
  }

  useEffect(() => {
    if (location.state) {
        if (location.state.searchQuery) {
            setSearchQuery(location.state.searchQuery);
            setSelectedCategory(null);
            setVisualSearchProductIds(null);
            setSelectedSellerId(null);
        } else if (location.state.category) {
            setSelectedCategory(location.state.category);
            setSearchQuery('');
            setVisualSearchProductIds(null);
            setSelectedSellerId(null);
        } else if (location.state.visualSearchResults) {
            setVisualSearchProductIds(location.state.visualSearchResults);
            setSearchQuery('');
            setSelectedCategory(null);
            setSelectedSellerId(null);
        } else if (location.state.sellerId) {
            setSelectedSellerId(location.state.sellerId);
            setSearchQuery('');
            setSelectedCategory(null);
            setVisualSearchProductIds(null);
        }
        // Clear state to prevent it from re-applying on refresh
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const buildQuery = useCallback(() => {
    let query = supabase.from('products').select(PRODUCT_QUERY_FIELDS, { count: 'exact' });

    // Apply primary filters
    if (selectedSellerId) query = query.eq('seller_id', selectedSellerId);
    else if (visualSearchProductIds) {
      // FIX: The `visualSearchProductIds` can come from `location.state` which is of type `unknown`.
      // Added an `Array.isArray` check to ensure we can safely access the `length` property.
      if (Array.isArray(visualSearchProductIds) && visualSearchProductIds.length > 0) {
        query = query.in('id', visualSearchProductIds);
      } else {
        query = query.eq('id', 'impossible-uuid-to-get-zero-results'); // Return no results for empty/invalid visual search
      }
    } else {
        if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
        if (selectedCategory) query = query.eq('category_id', selectedCategory);
    }
    query = query.lte('price', priceRange);
    Object.entries(otherFilters).forEach(([key, values]) => {
        if (values.length > 0) {
            if (key === 'size') query = query.contains('sizes', values);
            else query = query.in(key, values);
        }
    });

    // Apply sorting
    if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
    else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
    else if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else query = query.order('review_count', { ascending: false }); // popularity

    return query;
  }, [searchQuery, selectedCategory, priceRange, otherFilters, sortBy, visualSearchProductIds, selectedSellerId]);


  const fetchNearbyProducts = useCallback(async () => {
      if (!nearbySellerIds || nearbySellerIds.size === 0) {
          setNearbyProducts([]);
          setLoadingNearby(false);
          return;
      }

      setLoadingNearby(true);
      let query = buildQuery();
      query = query.in('seller_id', Array.from(nearbySellerIds)).limit(8);

      const { data, error: fetchError } = await query;
      if (fetchError) {
          console.error("Error fetching nearby products:", fetchError.message);
      } else if (data) {
          setNearbyProducts(data.map(mapSupabaseProduct));
      }
      setLoadingNearby(false);

  }, [nearbySellerIds, buildQuery]);

  const fetchProducts = useCallback(async (reset = false) => {
      setLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const from = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;

      let query = buildQuery();
      
      // Exclude nearby sellers from this main query if they exist
      if (nearbySellerIds && nearbySellerIds.size > 0) {
        query = query.not('seller_id', 'in', `(${Array.from(nearbySellerIds).join(',')})`);
      }

      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;
      
      if (fetchError) {
          console.error("Error fetching products:", fetchError.message);
          setError(fetchError.message);
      } else if (data) {
          const mappedProducts = data.map(mapSupabaseProduct);
          if (reset) {
              setProducts(mappedProducts);
              setPage(1);
          } else {
              setProducts(prev => [...prev, ...mappedProducts]);
          }
          setTotalCount(count || 0);
          setHasMore(data.length === PRODUCTS_PER_PAGE);
      }
      setLoading(false);

  }, [page, buildQuery, nearbySellerIds]);
  
  // Effect to reset and fetch when filters change or when a global refresh is triggered
  useEffect(() => {
    // This effect runs once the location detection is complete (nearbySellerIds is not null)
    if (nearbySellerIds !== null) {
        fetchNearbyProducts();
        fetchProducts(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, priceRange, otherFilters, sortBy, visualSearchProductIds, selectedSellerId, nearbySellerIds, lastRefreshed]);

  const loadMore = () => {
    if (!loading && hasMore) {
        setPage(prev => prev + 1);
    }
  };
  
  // Effect to load more when page changes
  useEffect(() => {
    if (page > 1) {
        fetchProducts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);


  const availableFilters = useMemo(() => {
    const categoryDetails = NAVIGATION_CATEGORIES.find(c => c.id === selectedCategory);
    return categoryDetails?.filters || [];
  }, [selectedCategory]);


  const handleOtherFilterToggle = (filterId: string, value: string) => {
    setOtherFilters(prev => {
      const currentValues = prev[filterId] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterId]: newValues };
    });
  };
  
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(prev => (prev === categoryId ? null : categoryId));
    setOtherFilters({});
    setSearchQuery('');
    setVisualSearchProductIds(null);
    setSelectedSellerId(null);
  };
  
  const CategorySelector = () => (
    <div className="flex items-center space-x-2 overflow-x-auto pb-4 -mx-4 px-4">
       <button
        onClick={() => handleCategorySelect(null)}
        className={`flex-shrink-0 px-5 py-2.5 font-sans text-sm font-semibold rounded-full transition-colors duration-300 ${!selectedCategory && visualSearchProductIds === null && !selectedSellerId ? 'bg-brand-gold text-brand-dark' : 'bg-black/40 text-brand-light hover:bg-brand-gold/20'}`}
      >
        All Products
      </button>
      {NAVIGATION_CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => handleCategorySelect(cat.id)}
          className={`flex-shrink-0 px-5 py-2.5 font-sans text-sm font-semibold rounded-full transition-colors duration-300 ${selectedCategory === cat.id ? 'bg-brand-gold text-brand-dark' : 'bg-black/40 text-brand-light hover:bg-brand-gold/20'}`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
  
  const FilterPanel = () => (
    <aside className="w-full lg:w-1/4 xl:w-1/5 p-6 bg-black/20 border border-brand-gold/10 rounded-lg h-fit flex-shrink-0">
        <h3 className="font-serif text-xl text-brand-gold mb-4">Filters</h3>
        <div className="mb-6">
             <h4 className="font-semibold text-brand-light uppercase tracking-wider text-sm mb-3">Price</h4>
             <input type="range" min="0" max="150000" value={priceRange} onChange={e => setPriceRange(Number(e.target.value))} className="w-full" />
             <div className="text-sm text-brand-light/80 text-center mt-1">Up to ₹{priceRange.toLocaleString('en-IN')}</div>
        </div>
        {availableFilters.map(filter => (
            <div key={filter.id} className="mb-6">
                <h4 className="font-semibold text-brand-light uppercase tracking-wider text-sm mb-3">{filter.name}</h4>
                 <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filter.options?.map(opt => (
                        <label key={opt.value} className="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" className="form-checkbox" checked={(otherFilters[filter.id] || []).includes(opt.value)} onChange={() => handleOtherFilterToggle(filter.id, opt.value)} />
                            <span className="text-brand-light/90">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        ))}
    </aside>
  );

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
        {visualSearchProductIds === null && !selectedSellerId && <CategorySelector />}
        
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <FilterPanel />

          <div className="w-full">
            <div className="bg-black/20 border border-brand-gold/10 rounded-lg p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-auto flex-grow">
                <input
                  type="text"
                  placeholder={`Search in ${NAVIGATION_CATEGORIES.find(c=>c.id === selectedCategory)?.name || 'all products'}...`}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setVisualSearchProductIds(null); setSelectedSellerId(null); }}
                  className="w-full bg-black/50 border border-brand-gold/30 rounded-full py-2 pl-10 pr-4 text-brand-light placeholder-brand-light/50 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-light/50" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-brand-light/70">Sort by:</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-black/50 border border-brand-gold/30 rounded-full py-2 px-4 text-brand-light focus:outline-none focus:ring-1 focus:ring-brand-gold">
                  <option value="popularity">Popularity</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">New Arrivals</option>
                </select>
              </div>
            </div>
            
            {locationState.status !== 'idle' && locationState.message && (
              <div className={`p-3 rounded-lg mb-6 text-center text-sm transition-opacity duration-300 ${locationState.status === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-brand-gold/10 border border-brand-gold/20 text-brand-gold-light'}`}>
                {locationState.status === 'loading' ? (
                  <span className="animate-pulse">{locationState.message}</span>
                ) : (
                  <span>{locationState.message}</span>
                )}
              </div>
            )}

            {selectedSellerId && sellerInfo && (
                <div className="bg-brand-gold/10 border border-brand-gold/20 p-4 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-brand-gold-light text-sm font-semibold">Showing products from "{sellerInfo.name}".</p>
                    <button onClick={resetFilters} className="text-sm font-bold text-brand-gold hover:underline flex-shrink-0">Clear Filter</button>
                </div>
            )}

            {visualSearchProductIds !== null && (
              <div className="bg-brand-gold/10 border border-brand-gold/20 p-4 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                  {/* FIX: Safely check if visualSearchProductIds is an array and has items before rendering content based on its length. */}
                  {Array.isArray(visualSearchProductIds) && visualSearchProductIds.length > 0 ? (
                      <p className="text-brand-gold-light text-sm font-semibold">Showing results for your visual search.</p>
                  ) : (
                      <p className="text-brand-gold-light text-sm font-semibold">We couldn't find any items matching your image.</p>
                  )}
                  <button onClick={resetFilters} className="text-sm font-bold text-brand-gold hover:underline flex-shrink-0">Clear Search</button>
              </div>
            )}

            {/* Nearby Products Section */}
            {!loadingNearby && nearbyProducts.length > 0 && (
                <div className="mb-8">
                    <h2 className="font-serif text-2xl text-brand-gold mb-4 flex items-center gap-2">
                        <Icon name="map-pin" className="w-5 h-5"/> From Sellers Near You
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {nearbyProducts.map(product => (
                            <ProductCard key={`nearby-${product.id}`} product={product} />
                        ))}
                    </div>
                </div>
            )}
            
            <div className="border-t border-brand-gold/10 pt-6">
               <h2 className="font-serif text-2xl text-brand-gold mb-4">All Products</h2>
              <p className="text-sm text-brand-light/70 mb-4 h-5">
                {(!loading || products.length > 0) && `Showing ${products.length} of ${totalCount} products.`}
              </p>
              {error ? (
                  <div className="text-center py-12 sm:col-span-2 md:col-span-3 xl:col-span-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xl font-semibold text-red-400">Failed to Load Products</p>
                    <p className="text-brand-light/70 mt-2">{error}</p>
                  </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading && products.length === 0 ? (
                        Array.from({ length: 8 }).map((_, index) => (
                          <ProductCardSkeleton key={index} />
                        ))
                    ) : (
                      <>
                        {products.length > 0 ? (
                            products.map(product => (
                              <ProductCard key={product.id} product={product} />
                            ))
                        ) : (
                          <div className="text-center py-12 sm:col-span-2 md:col-span-3 xl:col-span-4">
                            <p className="text-brand-light/70">No other products match your criteria.</p>
                            <button onClick={resetFilters} className="mt-4 text-brand-gold font-semibold hover:underline">Clear Filters</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {hasMore && !loading && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={loadMore}
                            className="font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase"
                        >
                            Load More
                        </button>
                    </div>
                  )}
                  {loading && products.length > 0 && <div className="mt-8 text-center text-brand-gold animate-pulse">Loading more products...</div>}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShopPage;