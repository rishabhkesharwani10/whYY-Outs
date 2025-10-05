import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabase.ts';
import type { AuthenticatedUser, Seller } from '../types.ts';
import Icon from '../components/Icon.tsx';
import BottomNav from '../components/BottomNav.tsx';

const EditProfilePage: React.FC = () => {
    const { user, updateUser, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const redirectState = location.state as { message?: string; missingFields?: string[] } | null;

    const [formData, setFormData] = useState<Partial<AuthenticatedUser>>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [locationMessage, setLocationMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // State for bank details (for sellers only)
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');

    // This effect initializes form data from session storage or the user object
    useEffect(() => {
        const loadProfileData = async () => {
            if (user) {
                try {
                    const savedStateJSON = sessionStorage.getItem('editProfileFormData');
                    if (savedStateJSON) {
                        setFormData(JSON.parse(savedStateJSON));
                    } else {
                        // Initialize from user object if no saved state
                        setFormData({
                            fullName: user.fullName || '', phone: user.phone || '',
                            addressLine1: user.addressLine1 || '', addressLine2: user.addressLine2 || '',
                            city: user.city || '', state: user.state || '', country: user.country || 'India',
                            zip: user.zip || '', gender: user.gender,
                            ...(user.role === 'seller' && {
                                businessName: (user as Seller).businessName || '', panNumber: (user as Seller).panNumber || '',
                                gstNumber: (user as Seller).gstNumber || '', registrationNumber: (user as Seller).registrationNumber || '',
                            })
                        });
                    }
                } catch (e) { console.error("Failed to parse saved profile data", e); }
                
                setAvatarPreview(user.avatar_url || null);

                // Fetch bank details if the user is a seller
                if (user.role === 'seller') {
                    const { data } = await supabase
                        .from('seller_bank_details')
                        .select('bank_name, account_number, ifsc_code')
                        .eq('seller_id', user.id)
                        .single();
                    if (data) {
                        setBankName(data.bank_name || '');
                        setAccountNumber(data.account_number || '');
                        setIfscCode(data.ifsc_code || '');
                    }
                }
            }
        };
        loadProfileData();
    }, [user]);

    // This effect saves any form changes to session storage
    useEffect(() => {
        if (Object.keys(formData).length > 0) { // Don't save empty initial state before user loads
            sessionStorage.setItem('editProfileFormData', JSON.stringify(formData));
        }
    }, [formData]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        // The "Select..." option has a value of `''`, which is not a valid gender type.
        // We convert it to `undefined` to match the `AuthenticatedUser` type.
        if (id === 'gender') {
            setFormData(prev => ({
                ...prev,
                gender: value === '' ? undefined : (value as AuthenticatedUser['gender'])
            }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAutofillLocation = () => {
        setIsLocating(true);
        setLocationMessage(null);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setLocationMessage({ text: 'Location found. Fetching address...', type: 'success' });
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                    if (!response.ok) throw new Error('Failed to fetch address details.');
                    
                    const data = await response.json();
                    if (data.error) throw new Error(data.error);

                    const { address } = data;
                    const newAddress = {
                        addressLine1: `${address.road || ''}${address.house_number ? ' ' + address.house_number : ''}`.trim(),
                        addressLine2: address.suburb || '',
                        city: address.city || address.town || address.village || '',
                        state: address.state || '',
                        zip: address.postcode || '',
                        country: address.country || '',
                    };
                    
                    setFormData(prev => ({ ...prev, ...newAddress }));
                    setLocationMessage({ text: 'Address auto-filled successfully!', type: 'success' });
                    
                } catch (err: any) {
                    console.error("Reverse geocoding error:", err);
                    setLocationMessage({ text: 'Error: Could not determine address.', type: 'error' });
                } finally {
                    setIsLocating(false);
                    setTimeout(() => setLocationMessage(null), 4000);
                }
            },
            (err) => {
                let errorMessage = 'Could not get your location.';
                if (err.code === 1) { // PERMISSION_DENIED
                  errorMessage = 'Location permission was denied.';
                }
                setLocationMessage({ text: `Error: ${errorMessage}`, type: 'error' });
                setIsLocating(false);
                setTimeout(() => setLocationMessage(null), 4000);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
    
        if (!formData.phone || !formData.gender) {
            setError('Phone number and Gender are required fields.');
            return;
        }
    
        setIsSubmitting(true);
        setMessage('');
        setError('');
    
        try {
            // Step 1: Handle avatar upload
            let avatar_url = user.avatar_url;
            if (avatarFile) {
                const filePath = `avatars/${user.id}/${Date.now()}-${avatarFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('user-avatars')
                    .upload(filePath, avatarFile, { upsert: true });
    
                if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);
    
                const { data } = supabase.storage.from('user-avatars').getPublicUrl(filePath);
                avatar_url = data.publicUrl;
            }
    
            // Step 2: Update main user profile
            const { error: updateError } = await updateUser({ ...formData, avatar_url });
            if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);
    
            // Step 3: Update seller bank details (if applicable)
            if (user.role === 'seller') {
                const { error: bankError } = await supabase
                    .from('seller_bank_details')
                    .upsert({
                        seller_id: user.id,
                        bank_name: bankName,
                        account_number: accountNumber,
                        ifsc_code: ifscCode,
                        updated_at: new Date().toISOString(),
                    });
    
                if (bankError) throw new Error(`Bank details update failed: ${bankError.message}`);
            }
            
            // Success
            setMessage('Profile updated successfully!');
            setAvatarFile(null);
            sessionStorage.removeItem('editProfileFormData');
            setTimeout(() => {
                navigate('/profile');
            }, 1500);
    
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
          <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative">
            <Header />
            <main className="flex-grow flex items-center justify-center">
              <div className="flex items-center gap-3 text-brand-gold">
                <div className="w-8 h-8 border-2 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin"></div>
                <span>Loading profile...</span>
              </div>
            </main>
            <Footer />
          </div>
        );
    }

    if (!user) {
        // This case is unlikely if using a ProtectedRoute, but it's a good safeguard.
        return null;
    }
    
    const formInputClass = "mt-1 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
    const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

    return (
        <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-12">
                <div className="mb-8">
                    <BackButton fallback="/profile" />
                </div>
                <div className="max-w-4xl mx-auto bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg p-6 sm:p-8">
                    {redirectState?.message && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-4 rounded-lg mb-6">
                            <p className="font-bold">{redirectState.message}</p>
                            {redirectState.missingFields && redirectState.missingFields.length > 0 && (
                                <p className="text-sm mt-2">Missing fields: {redirectState.missingFields.join(', ')}</p>
                            )}
                        </div>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-8">
                            {/* Avatar Section */}
                            <div>
                                <h2 className="font-serif text-2xl text-brand-gold mb-4">Profile Picture</h2>
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-full bg-brand-dark border-2 border-brand-gold/50 flex items-center justify-center overflow-hidden">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Icon name="user" className="w-12 h-12 text-brand-gold/50" />
                                        )}
                                    </div>
                                    <input type="file" id="avatar" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    <label htmlFor="avatar" className="cursor-pointer font-sans text-sm tracking-widest px-6 py-2.5 border border-brand-gold/50 text-brand-light/80 hover:bg-brand-gold/10 hover:text-white transition-colors duration-300 uppercase">
                                        Upload Image
                                    </label>
                                </div>
                            </div>
                            
                            {/* Personal Details */}
                            <div>
                                <h2 className="font-serif text-2xl text-brand-gold mb-4">Personal Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="fullName" className={formLabelClass}>Full Name</label>
                                        <input type="text" id="fullName" value={formData.fullName || ''} onChange={handleInputChange} className={formInputClass} required />
                                    </div>
                                    <div>
                                        <label htmlFor="phone" className={formLabelClass}>Phone</label>
                                        <input type="tel" id="phone" value={formData.phone || ''} onChange={handleInputChange} className={formInputClass} required />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className={formLabelClass}>Email (read-only)</label>
                                        <input type="email" id="email" value={user?.email || ''} readOnly className={`${formInputClass} bg-black/40 cursor-not-allowed`} />
                                    </div>
                                     <div>
                                        <label htmlFor="gender" className={formLabelClass}>Gender</label>
                                        <select id="gender" value={formData.gender || ''} onChange={handleInputChange} className={formInputClass} required>
                                            <option value="">Select...</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                            <option value="prefer_not_to_say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-serif text-2xl text-brand-gold">Shipping Address</h2>
                                    {user?.role !== 'admin' && (
                                        <button
                                            type="button"
                                            onClick={handleAutofillLocation}
                                            disabled={isLocating}
                                            className="flex items-center gap-2 font-sans text-xs tracking-widest px-4 py-1.5 border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10 transition-colors duration-300 uppercase disabled:opacity-50"
                                        >
                                            {isLocating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Locating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Icon name="map-pin" className="w-4 h-4" />
                                                    <span>Use Current Location</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                {locationMessage && <p className={`text-center text-sm mb-4 ${locationMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{locationMessage.text}</p>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2"><label htmlFor="addressLine1" className={formLabelClass}>Address Line 1</label><input type="text" id="addressLine1" value={formData.addressLine1 || ''} onChange={handleInputChange} className={formInputClass}/></div>
                                    <div className="md:col-span-2"><label htmlFor="addressLine2" className={formLabelClass}>Address Line 2</label><input type="text" id="addressLine2" value={formData.addressLine2 || ''} onChange={handleInputChange} className={formInputClass}/></div>
                                    <div><label htmlFor="city" className={formLabelClass}>City</label><input type="text" id="city" value={formData.city || ''} onChange={handleInputChange} className={formInputClass}/></div>
                                    <div><label htmlFor="state" className={formLabelClass}>State</label><input type="text" id="state" value={formData.state || ''} onChange={handleInputChange} className={formInputClass}/></div>
                                    <div><label htmlFor="zip" className={formLabelClass}>Pincode</label><input type="text" id="zip" value={formData.zip || ''} onChange={handleInputChange} className={formInputClass}/></div>
                                    <div><label htmlFor="country" className={formLabelClass}>Country</label><input type="text" id="country" value={formData.country || ''} onChange={handleInputChange} className={formInputClass}/></div>
                                </div>
                            </div>
                            
                            {/* Business & Bank Details for Seller */}
                            {user.role === 'seller' && (
                                <>
                                    <div>
                                        <h2 className="font-serif text-2xl text-brand-gold mb-4">Business Details</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="businessName" className={formLabelClass}>Business Name</label>
                                                <input type="text" id="businessName" value={(formData as Seller).businessName || ''} onChange={handleInputChange} className={formInputClass} />
                                            </div>
                                            <div>
                                                <label htmlFor="panNumber" className={formLabelClass}>PAN</label>
                                                <input type="text" id="panNumber" value={(formData as Seller).panNumber || ''} onChange={handleInputChange} className={formInputClass} />
                                            </div>
                                            <div>
                                                <label htmlFor="gstNumber" className={formLabelClass}>GSTIN</label>
                                                <input type="text" id="gstNumber" value={(formData as Seller).gstNumber || ''} onChange={handleInputChange} className={formInputClass} />
                                            </div>
                                            <div>
                                                <label htmlFor="registrationNumber" className={formLabelClass}>Registration No.</label>
                                                <input type="text" id="registrationNumber" value={(formData as Seller).registrationNumber || ''} onChange={handleInputChange} className={formInputClass} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="font-serif text-2xl text-brand-gold mb-4">Bank Details for Payouts</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="bankName" className={formLabelClass}>Bank Name</label>
                                                <input type="text" id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} className={formInputClass} />
                                            </div>
                                            <div>
                                                <label htmlFor="accountNumber" className={formLabelClass}>Account Number</label>
                                                <input type="text" id="accountNumber" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className={formInputClass} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label htmlFor="ifscCode" className={formLabelClass}>IFSC Code</label>
                                                <input type="text" id="ifscCode" value={ifscCode} onChange={e => setIfscCode(e.target.value.toUpperCase())} className={formInputClass} />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Submission */}
                            <div className="pt-4 border-t border-brand-gold/20">
                                {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                                {message && <p className="text-green-400 text-center mb-4">{message}</p>}
                                <button type="submit" disabled={isSubmitting} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark transition-colors duration-300 uppercase disabled:opacity-50 flex justify-center items-center">
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
            <BottomNav />
        </div>
    );
};

export default EditProfilePage;