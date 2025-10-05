

import React, { useState, useEffect, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BottomNav from '../components/BottomNav.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { NAVIGATION_CATEGORIES } from '../constants.ts';
import Icon from '../components/Icon.tsx';
import HomeContentSkeleton from '../components/skeletons/HomeContentSkeleton.tsx';
import { supabase } from '../supabase.ts';
import StoryReel from '../components/StoryReel.tsx';
import { useStories } from '../hooks/useStories.ts';
import type { Product } from '../types.ts';
import LazyImage from '../components/LazyImage.tsx';

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
  warrantyDetails: product.warranty_details,
  createdAt: product.created_at,
});


// ==================================================================
// LoggedInHomePage - The AI Dashboard for authenticated users
// ==================================================================

const WelcomeUser: React.FC<{ name: string }> = memo(({ name }) => (
  <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 className="font-serif text-3xl md:text-4xl text-brand-light">
      Welcome back, <span className="text-brand-gold-light">{name.split(' ')[0]}</span> 👋
    </h1>
    <p className="text-brand-light/70 mt-2">Ready to shop smarter?</p>
  </section>
));

const FlashDeals: React.FC<{ product: any }> = memo(({ product }) => {
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
      <Link to={`/product/${product.id}`} className="w-full text-center font-sans text-sm tracking-widest px-6 py-2.5 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-all duration-300 uppercase font-bold rounded-md">
        Shop Now
      </Link>
    </div>
  );
});

const CategoryHub: React.FC = memo(() => (
  <section className="py-12">
    <h2 className="font-serif text-3xl text-center text-brand-light mb-8 tracking-wider">Interactive Category Hub</h2>
    <div className="flex space-x-4 overflow-x-auto pb-4 px-4 sm:px-6 lg:px-8 -mx-4 sm:-mx-6 lg:-mx-8" style={{ scrollbarWidth: 'none' }}>
      {NAVIGATION_CATEGORIES.map(cat => (
        <Link 
          to="/shop" 
          key={cat.id} 
          state={{ category: cat.id }}
          className="group flex-shrink-0 flex flex-col items-center justify-center space-y-3 p-4 w-32 bg-black/40 border border-brand-gold/20 rounded-2xl backdrop-blur-sm hover:border-brand-gold hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-gold/10 transition-all duration-300 text-center"
        >
          <LazyImage src={cat.image} alt={cat.name} className="w-20 h-20 rounded-full object-cover border-2 border-brand-gold/30 group-hover:border-brand-gold transition-all duration-300" />
          <span className="font-medium text-sm text-brand-light/80 group-hover:text-white transition-colors duration-300">{cat.name}</span>
        </Link>
      ))}
    </div>
  </section>
));

const LoggedInHomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pamphletData, setPamphletData] = useState({
      line1: 'Ab Kareda Apna Pasndida Seller Se Product',
      line2: 'Wobhi Kam Damo me',
      bgImage: 'https://picsum.photos/seed/market/800/400'
  });
  const [pamphletLoading, setPamphletLoading] = useState(true);
  const [flashDealProduct, setFlashDealProduct] = useState<Product | null>(null);
  const [dealsLoading, setDealsLoading] = useState(true);

  useEffect(() => {
    const fetchDeal = async () => {
        setDealsLoading(true);
        const { data } = await supabase.from('products').select(`*, sellers(business_name)`).not('original_price', 'is', null).gt('original_price', 0).limit(1).single();
        if (data) {
            setFlashDealProduct(mapSupabaseProduct(data));
        }
        setDealsLoading(false);
    };
    fetchDeal();
  }, []);

  useEffect(() => {
    const fetchPamphletData = async () => {
        setPamphletLoading(true);
        const { data } = await supabase.from('site_settings').select('pamphlet_text_line_1, pamphlet_text_line_2, pamphlet_background_image').single();
        if (data) {
            setPamphletData({
                line1: data.pamphlet_text_line_1 || 'Ab Kareda Apna Pasndida Seller Se Product',
                line2: data.pamphlet_text_line_2 || 'Wobhi Kam Damo me',
                bgImage: data.pamphlet_background_image || 'https://picsum.photos/seed/market/800/400'
            });
        }
        setPamphletLoading(false);
    };

    fetchPamphletData();

    const channel = supabase
        .channel('site-settings-pamphlet-change-loggedin')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'id=eq.1' },
            (payload) => {
                const newData = payload.new;
                if (newData) {
                    setPamphletData({
                        line1: newData.pamphlet_text_line_1 || 'Ab Kareda Apna Pasndida Seller Se Product',
                        line2: newData.pamphlet_text_line_2 || 'Wobhi Kam Damo me',
                        bgImage: newData.pamphlet_background_image || 'https://picsum.photos/seed/market/800/400'
                    });
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

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
  
  const loading = dealsLoading || pamphletLoading;
  
  return (
    <div className="bg-brand-dark text-brand-light min-h-screen font-sans relative overflow-x-hidden flex flex-col">
      <div className="absolute inset-0 bg-grid-gold opacity-5 z-0"></div>
      <Header />
      <main className="flex-grow pb-24 md:pb-8 pt-28 space-y-12 page-fade-in">
        <WelcomeUser name={user.fullName} />
        <StoryReel />
        {loading ? <HomeContentSkeleton /> : (
            <>
                <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto h-[22rem]">
                        <LocalSellerPamphlet data={pamphletData} />
                    </div>
                </section>
                {flashDealProduct && (
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-3xl mx-auto h-[22rem]">
                            <FlashDeals product={flashDealProduct} />
                        </div>
                    </section>
                )}
            </>
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
const WelcomePublic: React.FC = memo(() => (
  <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 className="font-serif text-3xl md:text-4xl text-brand-light">
      Welcome to <span className="text-brand-gold-light">whYYOuts</span> ✨
    </h1>
    <p className="text-brand-light/70 mt-2">The future of premium shopping awaits.</p>
  </section>
));

const LocalSellerPamphlet: React.FC<{ data: { line1: string, line2: string, bgImage: string } }> = memo(({ data }) => {
    const navigate = useNavigate();
    const { stories, openStoryViewer } = useStories();

    const handleExploreClick = () => {
        if (stories.length > 0) {
            openStoryViewer(0);
        } else {
            // Fallback behavior if there are no stories
            navigate('/shop');
        }
    };

    return (
        <div style={{ backgroundImage: `url('${data.bgImage}')` }} className="h-full bg-cover bg-center border border-brand-gold/20 rounded-2xl shadow-2xl shadow-brand-gold/10 relative">
            <div className="absolute inset-0 bg-brand-dark/70 rounded-2xl"></div>
            <div className="relative h-full flex flex-col justify-center items-center text-center p-8">
                <p className="font-serif text-3xl md:text-4xl text-brand-gold-light leading-tight">
                    {data.line1}
                </p>
                <p className="font-serif text-4xl md:text-5xl text-white font-bold mt-2">
                    {data.line2}
                </p>
                <button 
                    onClick={handleExploreClick}
                    className="mt-8 font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-all duration-300 uppercase font-bold rounded-md"
                >
                    Explore Local Stories
                </button>
            </div>
        </div>
    );
});

const PublicHomePage: React.FC = () => {
  const [pamphletData, setPamphletData] = useState({
      line1: 'Ab Kareda Apna Pasndida Seller Se Product',
      line2: 'Wobhi Kam Damo me',
      bgImage: 'https://picsum.photos/seed/market/800/400'
  });
  const [pamphletLoading, setPamphletLoading] = useState(true);
  const [flashDealProduct, setFlashDealProduct] = useState<Product | null>(null);
  const [dealsLoading, setDealsLoading] = useState(true);


  useEffect(() => {
    const fetchDeal = async () => {
        setDealsLoading(true);
        const { data } = await supabase.from('products').select(`*, sellers(business_name)`).not('original_price', 'is', null).gt('original_price', 0).limit(1).single();
        if (data) {
            setFlashDealProduct(mapSupabaseProduct(data));
        }
        setDealsLoading(false);
    };
    fetchDeal();
  }, []);

  useEffect(() => {
    const fetchPamphletData = async () => {
        setPamphletLoading(true);
        const { data } = await supabase.from('site_settings').select('pamphlet_text_line_1, pamphlet_text_line_2, pamphlet_background_image').single();
        if (data) {
            setPamphletData({
                line1: data.pamphlet_text_line_1 || 'Ab Kareda Apna Pasndida Seller Se Product',
                line2: data.pamphlet_text_line_2 || 'Wobhi Kam Damo me',
                bgImage: data.pamphlet_background_image || 'https://picsum.photos/seed/market/800/400'
            });
        }
        setPamphletLoading(false);
    };

    fetchPamphletData();

    const channel = supabase
        .channel('site-settings-pamphlet-change')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'id=eq.1' },
            (payload) => {
                const newData = payload.new;
                if (newData) {
                    setPamphletData({
                        line1: newData.pamphlet_text_line_1 || 'Ab Kareda Apna Pasndida Seller Se Product',
                        line2: newData.pamphlet_text_line_2 || 'Wobhi Kam Damo me',
                        bgImage: newData.pamphlet_background_image || 'https://picsum.photos/seed/market/800/400'
                    });
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  const loading = dealsLoading || pamphletLoading;
  
  return (
    <div className="bg-brand-dark text-brand-light min-h-screen font-sans relative overflow-x-hidden flex flex-col">
      <div className="absolute inset-0 bg-grid-gold opacity-5 z-0"></div>
      <Header />
      <main className="flex-grow pb-24 md:pb-8 pt-28 space-y-12 page-fade-in">
        <WelcomePublic />
        <StoryReel />
        
        {loading ? <HomeContentSkeleton /> : (
            <>
                <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto h-[22rem]">
                        <LocalSellerPamphlet data={pamphletData} />
                    </div>
                </section>
                {flashDealProduct && (
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-3xl mx-auto h-[22rem]">
                            <FlashDeals product={flashDealProduct} />
                        </div>
                    </section>
                )}
            </>
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
