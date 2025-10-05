

import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col items-center justify-center text-center font-sans p-4 page-fade-in">
      <h1 className="text-6xl font-extrabold text-brand-gold font-serif">404</h1>
      <h2 className="mt-4 text-3xl font-bold text-brand-light font-serif">Page Not Found</h2>
      <p className="mt-2 text-brand-light/70">Sorry, the page you are looking for does not exist.</p>
      <Link 
        to="/" 
        className="mt-8 inline-block font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase"
      >
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFoundPage;