import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';

const BackButton: React.FC = () => {
  const navigate = ReactRouterDOM.useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center font-sans text-sm tracking-widest text-brand-gold hover:text-brand-gold-light transition-colors duration-300 group"
      aria-label="Go back to the previous page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      BACK
    </button>
  );
};

export default BackButton;