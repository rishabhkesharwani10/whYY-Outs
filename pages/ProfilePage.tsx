import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import Icon from '../components/Icon.tsx';
import BackButton from '../components/BackButton.tsx';
import type { Seller } from '../types.ts';
import BottomNav from '../components/BottomNav.tsx';

const ProfilePage: React.FC = () => {
  const { user, logout, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

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
      return <span className="text-brand-light/70">No address provided.</span>;
    }

    return (
      <>
        {addressLine1 && <p>{addressLine1}</p>}
        {addressLine2 && <p>{addressLine2}</p>}
        {(city || state || zip) && <p>{city}{city && state && ', '}{state} - {zip}</p>}
        {country && <p>{country}</p>}
      </>
    );
  };
  
  const displayGender = (gender: string | undefined) => {
    if (!gender || gender === '') return 'Not provided';
    if (gender === 'prefer_not_to_say') return 'Prefer not to say';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
    if (!value) return null;
    const displayValue = value === 'Not provided' ? <span className="text-brand-light/60">{value}</span> : value;
    return (
        <div>
            <p className="text-sm font-semibold text-brand-gold uppercase tracking-wider">{label}</p>
            <p className="text-brand-light/90 mt-1 break-words">{displayValue}</p>
        </div>
    );
  };


  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-12">
        <div className="mb-8">
          <BackButton />
        </div>
        <div className="w-full max-w-4xl mx-auto bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-6 sm:p-8">
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
            <div className="w-full">
              <h1 className="font-serif text-3xl sm:text-4xl text-brand-light">{user.fullName}</h1>
              <p className="text-brand-light/70 mt-2">Welcome to your personal dashboard.</p>
              
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4 justify-center sm:justify-start">
                 <Link to="/edit-profile" className="text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold/50 text-brand-light/80 hover:bg-brand-gold/10 hover:text-white transition-colors duration-300 uppercase">
                    Edit Profile
                  </Link>
                  {user.role === 'seller' ? (
                    <Link to="/seller-dashboard" className="text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold/50 text-brand-light/80 hover:bg-brand-gold/10 hover:text-white transition-colors duration-300 uppercase">
                      Dashboard
                    </Link>
                  ) : (
                    <Link to="/order-history" className="text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold/50 text-brand-light/80 hover:bg-brand-gold/10 hover:text-white transition-colors duration-300 uppercase">
                      Order History
                    </Link>
                  )}
                  <Link to="/my-queries" className="text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold/50 text-brand-light/80 hover:bg-brand-gold/10 hover:text-white transition-colors duration-300 uppercase">
                    My Queries
                  </Link>
                  {user.role === 'customer' &&
                    <Link to="/wishlist" className="text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
                      My Wishlist
                    </Link>
                  }
                  {isAdmin && (
                    <Link to="/admin" className="text-center font-sans text-sm tracking-widest px-8 py-3 border border-yellow-400 bg-yellow-400 text-brand-dark hover:bg-yellow-500 transition-colors duration-300 uppercase font-bold">
                      Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="font-sans text-sm tracking-widest px-8 py-3 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10 hover:text-white transition-colors duration-300 uppercase">
                    Logout
                  </button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-brand-gold/20 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-left">
              <DetailItem label="Email" value={user.email} />
              <DetailItem label="Phone" value={user.phone || 'Not provided'} />
              <DetailItem label="Gender" value={displayGender(user.gender)} />
              <div className="sm:col-span-2">
                  <DetailItem label="Address" value={renderAddress()} />
              </div>
              {user.role === 'seller' && (
                  <>
                      <div className="sm:col-span-2 border-t border-brand-gold/20 pt-6">
                          <h2 className="font-serif text-2xl text-brand-gold mb-4">Business Details</h2>
                      </div>
                      <DetailItem label="Business Name" value={(user as Seller).businessName || 'Not provided'} />
                      <DetailItem label="PAN" value={(user as Seller).panNumber || 'Not provided'} />
                      <DetailItem label="GSTIN" value={(user as Seller).gstNumber || 'Not provided'} />
                      <DetailItem label="Reg. Number" value={(user as Seller).registrationNumber || 'Not provided'} />
                  </>
              )}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default ProfilePage;