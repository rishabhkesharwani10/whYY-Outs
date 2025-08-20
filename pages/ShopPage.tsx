

import React, { useState, useMemo } from 'react';
import { NAVIGATION_CATEGORIES, SMART_SUGGESTIONS } from '../constants.ts';
import { useProducts } from '../hooks/useProducts.ts';
import ProductCard from '../components/ProductCard.tsx';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import Icon from '../components/Icon.tsx';
import BackButton from '../components/BackButton.tsx';

const ShopPage: React.FC = () => {
  const { products } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState(1500);
  const [otherFilters, setOtherFilters] = useState<{ [key: string]: string[] }>({});
  const [sortBy, setSortBy] = useState('popularity');

  const currentCategory = useMemo(() => {
    return NAVIGATION_CATEGORIES.find(c => c.id === selectedCategory);
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
  
  const resetFilters = () => {
    setPriceRange(1500);
    setOtherFilters({});
    setSortBy('popularity');
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
    resetFilters();
  };
  
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Search Query Filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Category Filter
    if (selectedCategory) {
      filtered = filtered.filter(p => p.categoryId === selectedCategory);
    }

    // Price Filter
    filtered = filtered.filter(p => p.price <= priceRange);
    
    // Other Filters (Size, Color, Material)
    Object.entries(otherFilters).forEach(([filterId, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(p => {
          if (filterId === 'size' && p.sizes) {
            return values.some(v => p.sizes?.includes(v));
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
        filtered.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'popularity':
      default:
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, priceRange, otherFilters, sortBy]);

  const Sidebar = () => (
    <aside className="w-full lg:w-1/4 xl:w-1/5 p-6 bg-black/20 border border-brand-gold/10 rounded-lg h-fit">
      <h2 className="font-serif text-2xl text-brand-gold mb-6">Categories</h2>
      <nav className="space-y-2">
        {NAVIGATION_CATEGORIES.map(cat => (
          <div key={cat.id}>
            <button
              onClick={() => handleCategorySelect(cat.id)}
              className={`w-full text-left font-semibold flex justify-between items-center py-2 px-2 rounded transition-colors ${selectedCategory === cat.id ? 'bg-brand-gold/10 text-brand-gold' : 'hover:bg-brand-gold/5'}`}
            >
              {cat.name}
              <Icon name="chevron-down" className={`w-5 h-5 transition-transform ${selectedCategory === cat.id ? 'rotate-180' : ''}`} />
            </button>
            {selectedCategory === cat.id && (
              <div className="pl-4 mt-2 space-y-1">
                {cat.subCategories.map(sub => (
                  <button key={sub.id} className={`block w-full text-left py-1 px-2 text-sm rounded text-brand-light/80 hover:text-white`}>
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      {currentCategory && (
        <div className="mt-8 pt-6 border-t border-brand-gold/20">
            <h3 className="font-serif text-xl text-brand-gold mb-4">Filters</h3>
            {/* Price */}
            <div className="mb-6">
                 <h4 className="font-semibold text-brand-light uppercase tracking-wider text-sm mb-3">Price</h4>
                 <input type="range" min="0" max="1500" value={priceRange} onChange={e => setPriceRange(Number(e.target.value))} className="w-full" />
                 <div className="text-sm text-brand-light/80 text-center mt-1">Up to ${priceRange}</div>
            </div>
            {/* Other Filters */}
            {currentCategory.filters && currentCategory.filters.map(filter => (
                <div key={filter.id} className="mb-6">
                    <h4 className="font-semibold text-brand-light uppercase tracking-wider text-sm mb-3">{filter.name}</h4>
                     <div className="space-y-2">
                        {filter.options?.map(opt => (
                            <label key={opt.value} className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" className="form-checkbox" checked={(otherFilters[filter.id] || []).includes(opt.value)} onChange={() => handleOtherFilterToggle(filter.id, opt.value)} />
                                <span className="text-brand-light/90">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      )}
    </aside>
  );

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <Sidebar />
          <div className="w-full lg:w-3/4 xl:w-4/5">
            {/* Search and Sort */}
            <div className="bg-black/20 border border-brand-gold/10 rounded-lg p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-auto flex-grow">
                <input
                  type="text"
                  placeholder="Search in this category..."
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

            {/* AI Smart Suggestions */}
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
            
            {/* Product Grid */}
            <div className="border-t border-brand-gold/10 pt-6">
              <p className="text-sm text-brand-light/70 mb-4">{filteredAndSortedProducts.length} products found.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShopPage;