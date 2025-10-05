import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import Icon from './Icon.tsx';

const MandatoryLocationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [status, setStatus] = useState<'idle' | 'requesting' | 'fetching' | 'error' | 'success'>('idle');
    const [error, setError] = useState('');
    const { updateUser } = useAuth();

    const handleAllowLocation = () => {
        setStatus('requesting');
        setError('');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setStatus('fetching');
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                    if (!response.ok) throw new Error('Failed to fetch address details from the server.');
                    
                    const data = await response.json();
                    if (data.error) throw new Error(data.error);

                    const { address } = data;
                    const addressUpdate = {
                        addressLine1: `${address.road || ''}${address.house_number ? ' ' + address.house_number : ''}`.trim(),
                        addressLine2: `${address.suburb || ''}`,
                        city: address.city || address.town || address.village || '',
                        state: address.state || '',
                        zip: address.postcode || '',
                        country: address.country || '',
                        latitude,
                        longitude,
                    };
                    
                    await updateUser(addressUpdate);
                    setStatus('success');
                    setTimeout(onClose, 2000);

                } catch (err: any) {
                    console.error("Reverse geocoding error:", err.message || err);
                    setError('Could not determine address from location. You can add it manually later in your profile.');
                    setStatus('error');
                }
            },
            (err) => {
                let errorMessage = 'Could not get your location. Please check your browser or device settings.';
                if (err.code === 1) { // PERMISSION_DENIED
                  errorMessage = 'Location permission denied. You can enable it in your browser settings and try again, or skip for now.';
                }
                setError(errorMessage);
                setStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };
    
    const renderContent = () => {
        switch (status) {
            case 'requesting':
                return (
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-brand-light/80">Waiting for location permission...</p>
                        <p className="text-sm text-brand-light/60">Please check your browser prompt.</p>
                    </div>
                );
            case 'fetching':
                return (
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-brand-light/80">Finding your address...</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center">
                        <Icon name="map-pin" className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-red-400">Location Error</h3>
                        <p className="mt-2 text-brand-light/80 text-sm">{error}</p>
                        <div className="flex justify-center gap-4 mt-6">
                            <button onClick={onClose} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Skip for Now</button>
                            <button onClick={handleAllowLocation} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark">Try Again</button>
                        </div>
                    </div>
                );
            case 'success':
                 return (
                    <div className="text-center">
                        <Icon name="check" className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-green-400">Address Updated!</h3>
                        <p className="mt-2 text-brand-light/80">Your profile has been updated with your location.</p>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <>
                        <Icon name="map-pin" className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                        <h2 className="font-serif text-2xl text-brand-light text-center mb-2">Verify Your Location</h2>
                        <p className="text-center text-brand-light/70 mb-6">To complete your profile, please allow location access to autofill your shipping address.</p>
                        <div className="flex flex-col gap-4">
                            <button onClick={handleAllowLocation} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark transition-colors duration-300 uppercase">
                                Allow Location Access
                            </button>
                            <button onClick={onClose} className="text-sm text-brand-light/60 hover:text-white">Skip for now</button>
                        </div>
                    </>
                );
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[101] flex items-center justify-center p-4 print:hidden">
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-md p-8 page-fade-in relative">
                {renderContent()}
            </div>
        </div>
    );
};

export default MandatoryLocationModal;
