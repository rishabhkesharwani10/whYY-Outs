import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { NAVIGATION_CATEGORIES, SMART_SUGGESTIONS } from '../constants.ts';
import { useProducts } from '../hooks/useProducts.ts';
import ProductCard from '../components/ProductCard.tsx';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import Icon from '../components/Icon.tsx';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton.tsx';
import type { Filter, FilterOption, Product } from '../types.ts';

const PRODUCTS_PER_PAGE = 8;

const ShopPage: React.FC = () => {
  const { products, loading } = useProducts();
  const location = ReactRouterDOM.useLocation();
  const navigate = ReactRouterDOM.useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState(150000); // Increased max range
  const [otherFilters, setOtherFilters] = useState<{ [key: string]: string[] }>({});
  const [sortBy, setSortBy] = useState('popularity');
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  useEffect(() => {
    if (location.state) {
        if (location.state.searchQuery) {
            setSearchQuery(location.state.searchQuery);
            setSelectedCategory(null); // Search all categories by default
        } else if (location.state.category) {
            setSelectedCategory(location.state.category);
            setSearchQuery(''); // Clear search when filtering by category
        }
        // Clear state to prevent it from re-applying on refresh
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [searchQuery, selectedCategory, priceRange, otherFilters, sortBy]);

  const currentCategoryDetails = useMemo(() => {
    return NAVIGATION_CATEGORIES.find(c => c.id === selectedCategory);
  }, [selectedCategory]);

  const availableFilters = useMemo(() => {
    const filters: Filter[] = [];
    const categoryProducts = selectedCategory ? products.filter(p => p.categoryId === selectedCategory) : products;

    const getUniqueOptions = (key: keyof Product): FilterOption[] => {
        const values = new Set(categoryProducts.map(p => p[key]).filter(val => typeof val === 'string' && val.trim() !== ''));
        return Array.from(values).sort().map(value => ({ value: value as string, label: value as string }));
    };

    const brandOptions = getUniqueOptions('brand');
    if (brandOptions.length > 0) {
        filters.push({ id: 'brand', name: 'Brand', type: 'checkbox', options: brandOptions });
    }

    const colorOptions = getUniqueOptions('color');
    if (colorOptions.length > 0) {
        filters.push({ id: 'color', name: 'Color', type: 'checkbox', options: colorOptions });
    }

    const materialOptions = getUniqueOptions('material');
    if (materialOptions.length > 0) {
        filters.push({ id: 'material', name: 'Material', type: 'checkbox', options: materialOptions });
    }
    
    // Preserve any hardcoded filters from constants for specific categories (like 'size' for 'fashion')
    const hardcodedFilters = NAVIGATION_CATEGORIES.find(c => c.id === selectedCategory)?.filters || [];
    filters.push(...hardcodedFilters);

    return filters;
  }, [products, selectedCategory]);


  const handleOtherFilterToggle = (filterId: string, value: string) => {
    setOtherFilters(prev => {
      const currentValues = prev[filterId] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterId]: newValues };
    });
  };
  
  const resetFilters = () => {
    setPriceRange(150000);
    setOtherFilters({});
    setSortBy('popularity');
    setSearchQuery('');
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(prev => (prev === categoryId ? null : categoryId));
    resetFilters();
  };
  
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];
    
    // Category Filter
    if (selectedCategory) {
      filtered = filtered.filter(p => p.categoryId === selectedCategory);
    }
    
    // Search Query Filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price Filter
    filtered = filtered.filter(p => p.price <= priceRange);
    
    // Other Dynamic Filters (Size, Brand, Color, Material)
    Object.entries(otherFilters).forEach(([filterId, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(p => {
          if (filterId === 'size' && p.sizes) {
            return values.some(v => p.sizes?.includes(v));
          }
          if (filterId === 'brand' && p.brand) {
            return values.includes(p.brand);
          }
           if (filterId === 'color' && p.color) {
            return values.includes(p.color);
          }
           if (filterId === 'material' && p.material) {
            return values.includes(p.material);
          }
          return false;
        });
      }
    });

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // Assuming newer products have higher (or lexicographically larger) IDs
        filtered.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'popularity':
      default:
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, priceRange, otherFilters, sortBy]);

  const visibleProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(0, visibleCount);
  }, [filteredAndSortedProducts, visibleCount]);
  
  const CategorySelector = () => (
    <div className="flex items-center space-x-2 overflow-x-auto pb-4 -mx-4 px-4">
       <button
        onClick={() => handleCategorySelect(null)}
        className={`flex-shrink-0 px-5 py-2.5 font-sans text-sm font-semibold rounded-full transition-colors duration-300 ${!selectedCategory ? 'bg-brand-gold text-brand-dark' : 'bg-black/40 text-brand-light hover:bg-brand-gold/20'}`}
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
        <CategorySelector />
        
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          <FilterPanel />

          <div className="w-full">
            <div className="bg-black/20 border border-brand-gold/10 rounded-lg p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-auto flex-grow">
                <input
                  type="text"
                  placeholder={`Search in ${currentCategoryDetails?.name || 'all products'}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
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

            {selectedCategory && SMART_SUGGESTIONS[selectedCategory] && (
              <div className="mb-6">
                <h3 className="font-serif text-xl text-brand-gold mb-3 flex items-center gap-2"><Icon name="sparkles" className="w-5 h-5"/> Smart Suggestions</h3>
                <div className="flex gap-3 flex-wrap">
                  {SMART_SUGGESTIONS[selectedCategory].map(sug => (
                    <button key={sug.name} className="flex items-center gap-2 bg-black/40 border border-brand-gold/20 rounded-full px-4 py-2 text-sm text-brand-light/90 hover:bg-brand-gold/10 hover:border-brand-gold/50 transition-colors">
                      <Icon name={sug.icon} className="w-4 h-4"/> {sug.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-t border-brand-gold/10 pt-6">
              <p className="text-sm text-brand-light/70 mb-4 h-5">
                {!loading && `Showing ${visibleProducts.length} of ${filteredAndSortedProducts.length} products.`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 8 }).map((_, index) => (
                      <ProductCardSkeleton key={index} />
                    ))
                ) : (
                  <>
                    {visibleProducts.length > 0 ? (
                        visibleProducts.map(product => (
                          <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                      <div className="text-center py-12 sm:col-span-2 md:col-span-3 xl:col-span-4">
                        <p className="text-brand-light/70">No products match your criteria.</p>
                        <button onClick={resetFilters} className="mt-4 text-brand-gold font-semibold hover:underline">Clear Filters</button>
                      </div>
                    )}
                  </>
                )}
              </div>
              {!loading && visibleCount < filteredAndSortedProducts.length && (
                <div className="mt-8 text-center">
                    <button
                        onClick={() => setVisibleCount(prev => prev + PRODUCTS_PER_PAGE)}
                        className="font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase"
                    >
                        Load More
                    </button>
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

export default ShopPage;