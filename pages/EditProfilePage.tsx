

import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { User } from '../types.ts';
import Icon from '../components/Icon.tsx';

const EditProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [message, setMessage] = useState('');
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url || '');
      setAddress(user.address || '');
      setPincode(user.pincode || '');
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleLocationAccess = () => {
    if (navigator.geolocation) {
      setLocationMessage('Fetching location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would use a reverse geocoding API here.
          // For this demo, we'll simulate the result.
          setLocationMessage('Location fetched! (Simulated)');
          setAddress('1600 Amphitheatre Parkway, Mountain View, CA');
          setPincode('94043');
          setTimeout(() => setLocationMessage(''), 2000);
        },
        (error) => {
          setLocationMessage(`Error: ${error.message}`);
          setTimeout(() => setLocationMessage(''), 3000);
        }
      );
    } else {
      setLocationMessage('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedData: Partial<User> = {
      fullName,
      phone,
      address,
      pincode,
      avatar_url: avatarUrl,
    };

    await updateUser(updatedData);
    setMessage('Profile updated successfully!');
    
    setTimeout(() => {
      navigate('/profile');
    }, 1500);
  };

  if (!user) {
    return null; // Or a loading spinner, but ProtectedRoute should prevent this
  }
  
  const formInputClass = "mt-1 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
  const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <BackButton fallback="/profile" />
        </div>
        <div className="max-w-2xl mx-auto bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-8">
          <h1 className="font-serif text-4xl text-brand-light mb-2">Edit Profile</h1>
          <p className="text-brand-light/70 mb-8">Update your personal information.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
               <img 
                 src={avatarUrl || `https://ui-avatars.com/api/?name=${fullName}&background=BFA181&color=101010&size=128`} 
                 alt="Profile Preview" 
                 className="w-32 h-32 rounded-full object-cover border-2 border-brand-gold"
               />
               <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
               <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="font-sans text-xs tracking-widest px-4 py-2 border border-brand-gold/50 text-brand-light/80 hover:bg-brand-gold/10 hover:text-white transition-colors duration-300 uppercase"
                >
                  Change Photo
                </button>
            </div>

            <div>
              <label htmlFor="fullName" className={formLabelClass}>Full Name</label>
              <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className={formInputClass} />
            </div>
            <div>
              <label htmlFor="email" className={formLabelClass}>Email (cannot be changed)</label>
              <input type="email" id="email" value={user.email} disabled className={`${formInputClass} bg-black/40 cursor-not-allowed`} />
            </div>
            <div>
              <label htmlFor="phone" className={formLabelClass}>Phone Number</label>
              <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className={formInputClass} />
            </div>

            {/* Address Section */}
            <div className="border-t border-brand-gold/20 pt-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-serif text-brand-gold">Address Details</h2>
                    <button type="button" onClick={handleLocationAccess} className="flex items-center gap-2 text-sm text-brand-gold hover:text-white transition-colors">
                        <Icon name="map-pin" className="w-4 h-4" /> Use My Location
                    </button>
                </div>
                {locationMessage && <p className="text-sm text-center text-brand-gold-light">{locationMessage}</p>}
                <div>
                  <label htmlFor="address" className={formLabelClass}>Address</label>
                  <textarea id="address" name="address" value={address} onChange={e => setAddress(e.target.value)} required rows={3} className={formInputClass} placeholder="123 Main St, Anytown, USA"></textarea>
                </div>
                <div>
                  <label htmlFor="pincode" className={formLabelClass}>Pincode / ZIP</label>
                  <input type="text" id="pincode" name="pincode" value={pincode} onChange={e => setPincode(e.target.value)} required className={formInputClass} />
                </div>
            </div>

            {message && <p className="text-green-400 text-sm text-center">{message}</p>}

            <div className="pt-4">
              <button type="submit" className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditProfilePage;