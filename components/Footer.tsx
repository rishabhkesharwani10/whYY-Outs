
import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.tsx';
import { SITE_MAP_WITH_ROUTES } from '../constants.ts';

const Footer: React.FC = () => {
  const TrustBadge = ({ icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 border-2 border-brand-gold/30 text-brand-gold">
        <Icon name={icon} className="w-6 h-6"/>
      </div>
      <div>
        <h4 className="font-bold text-brand-light">{title}</h4>
        {subtitle && <p className="text-xs text-brand-light/60">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <footer className="bg-black/50 border-t border-brand-gold/10 font-sans z-10">
      <div className="container mx-auto px-6 lg:px-8 pt-12 pb-28 md:pb-12 text-brand-light">
        
        {/* Trust & Support Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-brand-gold/10">
          <TrustBadge icon="user" title="24x7 Support" subtitle="Get help when you need it" />
          <TrustBadge icon="offer" title="Easy Returns" subtitle="Hassle-free return policy" />
          <TrustBadge icon="truck" title="Fastest Delivery" subtitle="Guaranteed on-time delivery" />
          <TrustBadge icon="secure-payment" title="100% secure transactions" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-12">
          {/* About Section */}
          <div className="lg:col-span-1 space-y-4">
            <Icon name="logo" className="w-32 h-10" />
            <p className="text-sm text-brand-light/70">
              The future of premium online shopping. Why go out? whYYOuts delivers everything at your door.
            </p>
          </div>

          {/* Links Sections */}
          {Object.entries(SITE_MAP_WITH_ROUTES).map(([title, items]) => (
            <div key={title}>
              <h3 className="uppercase tracking-widest text-brand-gold/80 font-semibold text-sm mb-4">{title}</h3>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item.name}>
                    <Link to={item.to} className="text-sm text-brand-light/70 hover:text-white transition-colors duration-300">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-brand-gold/10 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <p className="text-xs text-brand-light/60 mb-4 md:mb-0">
            © {new Date().getFullYear()} whYYOuts. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="https://www.instagram.com/whyyouts?igsh=ajFnMXdmeWhlejFy" target="_blank" rel="noopener noreferrer" className="text-brand-light/60 hover:text-white transition-colors duration-300">Instagram</a>
            <a href="https://www.facebook.com/share/1CTRqgVikA/" target="_blank" rel="noopener noreferrer" className="text-brand-light/60 hover:text-white transition-colors duration-300">Facebook</a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="text-brand-light/60 hover:text-white transition-colors duration-300">Pinterest</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);