import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import Icon from '../components/Icon.tsx';
import BackButton from '../components/BackButton.tsx';
import type { Seller } from '../types.ts';

const ProfilePage: React.FC = () => {
  const { user, logout, isAdmin, loading } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading || !user) {
    // This guard prevents crashes by showing a loading state until the user object is fully available.
    return (
      <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="flex items-center gap-3 text-brand-gold">
            <div className="w-8 h-8 border-2 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin"></div>
            <span>Loading user profile...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const renderAddress = () => {
    const { addressLine1, addressLine2, city, state, zip, country } = user;
    const hasAddress = addressLine1 || city || zip || country;

    if (!hasAddress) {
      return <span className="text-brand-light/90">No address provided.</span>;
    }

    return (
      <div className="text-brand-light/90">
        {addressLine1 && <p>{addressLine1}</p>}
        {addressLine2 && <p>{addressLine2}</p>}
        {(city || state || zip) && <p>{city}{city && state && ', '}{state} - {zip}</p>}
        {country && <p>{country}</p>}
      </div>
    );
  };
  
  const displayGender = (gender: string | undefined) => {
    if (!gender) return 'Not provided';
    if (gender === 'prefer_not_to_say') return 'Prefer not to say';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };


  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <BackButton />
        </div>
        <div className="w-full max-w-2xl mx-auto bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="flex-shrink-0 mb-6 sm:mb-0 sm:mr-8">
              {user.avatar_url ? (
                 <img src={user.avatar_url} alt="Profile" className="w-32 h-32 rounded-full object-cover border-2 border-brand-gold" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-brand-gold/10 border-2 border-brand-gold flex items-center justify-center">
                    <Icon name="user" className="w-16 h-16 text-brand-gold" />
                </div>
              )}
            </div>
            <div>
              <h1 className="font-serif text-4xl text-brand-light">{user.fullName}</h1>
              <p className="text-brand-light/70 mt-2">Welcome to your personal dashboard.</p>
              
              <div className="mt-6 border-t border-brand-gold/20 pt-6 space-y-4 text-left">
                <div className="flex items-start">
                  <span className="font-semibold text-brand-gold w-28 flex-shrink-0">Email:</span>
                  <span className="text-brand-light/90">{user.email}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-brand-gold w-28 flex-shrink-0">Phone:</span>
                  <span className="text-brand-light/90">{user.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-brand-gold w-28 flex-shrink-0">Gender:</span>
                  <span className="text-brand-light/90">{displayGender(user.gender)}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-brand-gold w-28 flex-shrink-0">Address:</span>
                  {renderAddress()}
                </div>
                {user.role === 'seller' && (
                  <>
                    <div className="flex items-start">
                      <span className="font-semibold text-brand-gold w-28 flex-shrink-0">Business Name:</span>
                      <span className="text-brand-light/90">{(user as Seller).businessName || 'Not provided'}</span>
                    </div>
                     <div className="flex items-start">
                      <span className="font-semibold text-brand-gold w-28 flex-shrink-0">PAN:</span>
                      <span className="text-brand-light/90">{(user as Seller).panNumber || 'Not provided'}</span>
                    </div>
                     <div className="flex items-start">
                      <span className="font-semibold text-brand-gold w-28 flex-shrink-0">GSTIN:</span>
                      <span className="text-brand-light/90">{(user as Seller).gstNumber || 'Not provided'}</span>
                    </div>
                     <div className="flex items-start">
                      <span className="font-semibold text-brand-gold w-28 flex-shrink-0">Reg. Number:</span>
                      <span className="text-brand-light/90">{(user as Seller).registrationNumber || 'Not provided'}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4">
                 <ReactRouterDOM.Link to="/edit-profile" className="text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold/50 text-brand-light/80 hover:bg-brand-gold/10 hover:text-white transition-colors duration-300 uppercase">
                    Edit Profile
                  </ReactRouterDOM.Link>
                  <ReactRouterDOM.Link to="/order-history" className="text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold/50 text-brand-light/80 hover:bg-brand-gold/10 hover:text-white transition-colors duration-300 uppercase">
                    Order History
                  </ReactRouterDOM.Link>
                   <ReactRouterDOM.Link to="/wishlist" className="text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
                    My Wishlist
                  </ReactRouterDOM.Link>
                  {isAdmin && (
                    <ReactRouterDOM.Link to="/admin" className="text-center font-sans text-sm tracking-widest px-8 py-3 border border-yellow-400 bg-yellow-400 text-brand-dark hover:bg-yellow-500 transition-colors duration-300 uppercase font-bold">
                      Admin Panel
                    </ReactRouterDOM.Link>
                  )}
                  <button onClick={handleLogout} className="font-sans text-sm tracking-widest px-8 py-3 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10 hover:text-white transition-colors duration-300 uppercase">
                    Logout
                  </button>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;