

import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BottomNav from '../components/BottomNav.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useProducts } from '../hooks/useProducts.ts';
import { NAVIGATION_CATEGORIES, SHOP_BY_GOAL } from '../constants.ts';
import Icon from '../components/Icon.tsx';
import ProductCard from '../components/ProductCard.tsx';

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

const FlashDealsLoggedIn: React.FC<{ product: any }> = ({ product }) => {
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

const PersonalizedForYou: React.FC<{ product: any }> = ({ product }) => (
  <div className="h-full group relative bg-black/40 border border-brand-gold/20 rounded-2xl p-6 flex flex-col backdrop-blur-sm shadow-2xl shadow-brand-gold/10 overflow-hidden">
      <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500"/>
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-transparent"></div>
      <div className="relative z-10 flex flex-col flex-grow justify-between">
          <div>
              <h3 className="font-serif text-2xl text-brand-gold-light">Because You'll Love</h3>
              <p className="text-white mt-2 text-lg font-semibold">{product.name}</p>
          </div>
          <div className="flex items-center justify-between mt-4">
              <p className="text-2xl font-bold text-white">${product.price.toFixed(2)}</p>
              <button className="text-xs font-bold text-brand-gold hover:underline">Why was this recommended?</button>
          </div>
      </div>
  </div>
);

const CategoryHub: React.FC = () => (
  <section className="py-12">
    <h2 className="font-serif text-3xl text-center text-brand-light mb-8 tracking-wider">Interactive Category Hub</h2>
    <div className="flex space-x-4 overflow-x-auto pb-4 px-4 sm:px-6 lg:px-8 -mx-4 sm:-mx-6 lg:-mx-8" style={{ scrollbarWidth: 'none' }}>
      {NAVIGATION_CATEGORIES.map(cat => (
        <ReactRouterDOM.Link 
          to="/shop" 
          key={cat.id} 
          className="group flex-shrink-0 flex flex-col items-center justify-center space-y-3 p-4 w-32 bg-black/40 border border-brand-gold/20 rounded-2xl backdrop-blur-sm hover:border-brand-gold hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-gold/10 transition-all duration-300 text-center"
        >
          <img src={cat.image} alt={cat.name} className="w-20 h-20 rounded-full object-cover border-2 border-brand-gold/30 group-hover:border-brand-gold transition-all duration-300" />
          <span className="font-medium text-sm text-brand-light/80 group-hover:text-white transition-colors duration-300">{cat.name}</span>
        </ReactRouterDOM.Link>
      ))}
    </div>
  </section>
);

const ShopByGoal: React.FC = () => (
  <section className="py-12">
    <h2 className="font-serif text-3xl text-center text-brand-light mb-8 tracking-wider">Shop by Goal</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {SHOP_BY_GOAL.map(goal => (
        <div key={goal.name} className="group relative rounded-2xl overflow-hidden aspect-square border-2 border-brand-gold/20 hover:border-brand-gold transition-all duration-300">
          <img src={goal.image} alt={goal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
            <Icon name={goal.icon as any} className="w-8 h-8 text-brand-gold-light mb-2"/>
            <h3 className="font-bold text-lg">{goal.name}</h3>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const DealBrain: React.FC = () => (
    <div className="h-full bg-gradient-to-br from-brand-gold-dark/40 to-brand-dark/40 p-6 rounded-2xl border border-brand-gold/20 flex flex-col items-center justify-center text-center">
        <h3 className="font-serif text-2xl text-brand-gold-light">DealBrain™ HQ</h3>
        <p className="text-brand-light/80 mt-2">Auto-applied best offer:</p>
        <p className="text-white text-xl font-bold mt-2">15% OFF on HDFC Cards</p>
        <p className="text-xs text-brand-light/60 mt-1">Best Effective Price Guaranteed</p>
        <button className="mt-4 font-sans text-xs tracking-widest px-6 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-all duration-300 uppercase font-bold rounded-md">
            View All Offers
        </button>
    </div>
);

const LiveShoppingLoggedIn: React.FC = () => (
  <div className="h-full group relative aspect-square md:aspect-auto bg-gray-800 rounded-2xl overflow-hidden border-2 border-brand-gold/20 hover:border-brand-gold transition-all duration-300 cursor-pointer">
    <img src={`https://picsum.photos/seed/live_main/600/600`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Live Shopping" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
    <div className="absolute top-4 left-4 flex gap-2 items-center">
      <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
        <Icon name="live" className="w-3 h-3"/> LIVE
      </div>
    </div>
    <div className="absolute bottom-4 left-4 right-4 text-white">
      <h3 className="text-lg font-bold">Latest Tech Trends</h3>
      <p className="text-xs text-brand-light/80">Join now for exclusive deals!</p>
    </div>
  </div>
);

const AIPilotFAB: React.FC = () => (
  <button className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-16 h-16 bg-gradient-to-br from-brand-gold to-brand-gold-dark rounded-full shadow-2xl shadow-brand-gold/40 flex items-center justify-center text-brand-dark z-50 hover:scale-110 transition-transform">
      <Icon name="sparkles" className="w-8 h-8"/>
  </button>
);

const LoggedInHomePage: React.FC = () => {
  const { user } = useAuth();
  const { products } = useProducts();

  if (!user || products.length === 0) {
    return (
      <div className="bg-brand-dark min-h-screen flex items-center justify-center">
        <p className="text-brand-gold animate-pulse">Loading Your Personal Dashboard...</p>
      </div>
    );
  }
  
  const flashDealProduct = products[4];
  const recommendedProduct = products[2];

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen font-sans relative overflow-x-hidden page-fade-in">
      <div className="absolute inset-0 bg-grid-gold opacity-5 z-0"></div>
      <Header />
      <main className="pb-24 md:pb-8 pt-28 space-y-12">
        <WelcomeUser name={user.fullName} />
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[22rem]">
                {flashDealProduct && <FlashDealsLoggedIn product={flashDealProduct} />}
                {recommendedProduct && <PersonalizedForYou product={recommendedProduct} />}
            </div>
        </section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <CategoryHub />
          <ShopByGoal />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DealBrain />
            <LiveShoppingLoggedIn />
          </div>
        </div>
      </main>
      <AIPilotFAB />
      <Footer />
      <BottomNav />
    </div>
  );
};

// ==================================================================
// PublicHomePage - The premium landing page for new visitors
// ==================================================================

const heroSlides = [
    {
        image: 'https://picsum.photos/seed/hero1/1920/1080',
        title: "Why go out?",
        subtitle: "Whyyouts delivers everything at your door.",
        cta: 'Explore All Products',
        link: '/shop'
    },
    {
        image: 'https://picsum.photos/seed/hero2/1920/1080',
        title: 'Luxury Fashion Collection',
        subtitle: 'Discover the latest trends from top designers.',
        cta: 'Shop Fashion',
        link: '/shop'
    },
    {
        image: 'https://picsum.photos/seed/hero3/1920/1080',
        title: 'Next-Gen Electronics',
        subtitle: 'Unbeatable prices on the latest gadgets.',
        cta: 'Discover Tech',
        link: '/shop'
    },
];

const HeroSlider: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 7000);
        return () => clearTimeout(timer);
    }, [currentSlide]);

    return (
        <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden text-white">
            {heroSlides.map((slide, index) => (
                <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent"></div>
                </div>
            ))}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-wider leading-tight animate-fade-in-down" style={{animationDelay: '0.5s'}}>
                    {heroSlides[currentSlide].title}
                </h1>
                <p className="mt-4 text-lg md:text-xl max-w-2xl text-brand-light/90 animate-fade-in-up" style={{animationDelay: '1s'}}>
                    {heroSlides[currentSlide].subtitle}
                </p>
                <ReactRouterDOM.Link to={heroSlides[currentSlide].link} className="mt-8 font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase animate-fade-in-up" style={{animationDelay: '1.5s'}}>
                    {heroSlides[currentSlide].cta}
                </ReactRouterDOM.Link>
            </div>
        </section>
    );
};

const SmartCategories: React.FC = () => (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-serif text-3xl text-center text-brand-light mb-8 tracking-wider">Smart Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {NAVIGATION_CATEGORIES.map(cat => (
                <ReactRouterDOM.Link to="/shop" key={cat.id} className="group flex flex-col items-center justify-center space-y-3 p-4 bg-black/40 border border-brand-gold/20 rounded-2xl backdrop-blur-sm hover:border-brand-gold hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-gold/10 transition-all duration-300 text-center">
                    <img src={cat.image} alt={cat.name} className="w-20 h-20 rounded-full object-cover border-2 border-brand-gold/30 group-hover:border-brand-gold transition-all duration-300" />
                    <span className="font-medium text-sm text-brand-light/80 group-hover:text-white transition-colors duration-300">{cat.name}</span>
                </ReactRouterDOM.Link>
            ))}
        </div>
    </section>
);

const ProductSlider: React.FC<{ title: string; products: any[] }> = ({ title, products }) => {
    const scrollContainer = useRef<HTMLDivElement>(null);
    const scroll = (scrollOffset: number) => {
        if(scrollContainer.current) {
            scrollContainer.current.scrollLeft += scrollOffset;
        }
    };
    return (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex justify-between items-center mb-8">
                <h2 className="font-serif text-3xl text-brand-light tracking-wider">{title}</h2>
                <div className="flex space-x-2">
                    <button onClick={() => scroll(-300)} className="p-2 rounded-full border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10"><Icon name="chevron-left" /></button>
                    <button onClick={() => scroll(300)} className="p-2 rounded-full border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10"><Icon name="chevron-right" /></button>
                </div>
            </div>
            <div ref={scrollContainer} className="flex space-x-6 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth' }}>
                {products.map(p => <div key={p.id} className="w-64 flex-shrink-0"><ProductCard product={p} /></div>)}
            </div>
        </section>
    );
};


const PublicHomePage: React.FC = () => {
    const { products } = useProducts();
    const recommendedProducts = products.slice(0, 8);

    return (
        <div className="bg-brand-dark text-brand-light min-h-screen font-sans relative overflow-x-hidden page-fade-in">
            <Header />
            <main className="pb-24 md:pb-8">
                <HeroSlider />
                <SmartCategories />
                <ProductSlider title="Recommended For You" products={recommendedProducts} />
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