// FIX: Provide full implementation for EditProfilePage.
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabase.ts';
import type { AuthenticatedUser, Seller } from '../types.ts';

const EditProfilePage: React.FC = () => {
    const { user, updateUser, loading } = useAuth();
    const navigate = ReactRouterDOM.useNavigate();
    
    const [formData, setFormData] = useState<Partial<AuthenticatedUser>>({});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                phone: user.phone || '',
                addressLine1: user.addressLine1 || '',
                addressLine2: user.addressLine2 || '',
                city: user.city || '',
                state: user.state || '',
                country: user.country || 'India',
                zip: user.zip || '',
                gender: user.gender || '',
                ...(user.role === 'seller' && {
                    businessName: (user as Seller).businessName || '',
                    panNumber: (user as Seller).panNumber || '',
                    gstNumber: (user as Seller).gstNumber || '',
                    registrationNumber: (user as Seller).registrationNumber || '',
                })
            });
            setAvatarPreview(user.avatar_url || null);
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
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
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setMessage('');
        setError('');
        
        try {
            let avatar_url = user.avatar_url;
            if (avatarFile) {
                const filePath = `avatars/${user.id}/${Date.now()}-${avatarFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('user-avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('user-avatars').getPublicUrl(filePath);
                avatar_url = data.publicUrl;
            }

            const { error: updateError } = await updateUser({ ...formData, avatar_url });
            
            if (updateError) throw updateError;
            
            setMessage('Profile updated successfully!');
            setTimeout(() => navigate('/profile'), 1500);

        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="bg-brand-dark min-h-screen flex items-center justify-center">
                <p className="text-brand-gold animate-pulse">Loading Profile...</p>
            </div>
        );
    }
    
    const formInputClass = "mt-1 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
    const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

    return (
        <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
                <div className="mb-8"><BackButton fallback="/profile" /></div>
                <div className="max-w-2xl mx-auto bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg p-8">
                    <h1 className="font-serif text-4xl text-brand-light mb-2">Edit Profile</h1>
                    <p className="text-brand-light/70 mb-8">Update your personal and business information.</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <img src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.fullName}&background=1a1a1a&color=bfa181&size=128`} alt="Avatar Preview" className="w-32 h-32 rounded-full object-cover border-2 border-brand-gold" />
                            <input type="file" id="avatar" onChange={handleFileChange} accept="image/*" className="hidden" />
                            <label htmlFor="avatar" className="cursor-pointer text-sm text-brand-gold hover:underline">Change Photo</label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label htmlFor="fullName" className={formLabelClass}>Full Name</label><input type="text" id="fullName" value={formData.fullName || ''} onChange={handleInputChange} required className={formInputClass} /></div>
                            <div><label htmlFor="phone" className={formLabelClass}>Phone</label><input type="tel" id="phone" value={formData.phone || ''} onChange={handleInputChange} className={formInputClass} /></div>
                        </div>

                        <div>
                            <label htmlFor="gender" className={formLabelClass}>Gender</label>
                            <select id="gender" value={formData.gender || ''} onChange={handleInputChange} className={formInputClass}>
                                <option value="">Select...</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                        </div>
                        
                        <div className="border-t border-brand-gold/20 pt-6">
                            <h2 className="font-serif text-xl text-brand-gold mb-4">Shipping Address</h2>
                            <div className="space-y-4">
                                <div><label htmlFor="addressLine1" className={formLabelClass}>Address Line 1</label><input type="text" id="addressLine1" value={formData.addressLine1 || ''} onChange={handleInputChange} className={formInputClass} /></div>
                                <div><label htmlFor="addressLine2" className={formLabelClass}>Address Line 2 (Optional)</label><input type="text" id="addressLine2" value={formData.addressLine2 || ''} onChange={handleInputChange} className={formInputClass} /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label htmlFor="city" className={formLabelClass}>City</label><input type="text" id="city" value={formData.city || ''} onChange={handleInputChange} className={formInputClass} /></div>
                                    <div><label htmlFor="state" className={formLabelClass}>State</label><input type="text" id="state" value={formData.state || ''} onChange={handleInputChange} className={formInputClass} /></div>
                                    <div><label htmlFor="zip" className={formLabelClass}>Pincode / ZIP</label><input type="text" id="zip" value={formData.zip || ''} onChange={handleInputChange} className={formInputClass} /></div>
                                    <div><label htmlFor="country" className={formLabelClass}>Country</label><input type="text" id="country" value={formData.country || ''} onChange={handleInputChange} className={formInputClass} /></div>
                                </div>
                            </div>
                        </div>

                        {user.role === 'seller' && (
                           <div className="border-t border-brand-gold/20 pt-6">
                            <h2 className="font-serif text-xl text-brand-gold mb-4">Business & Tax Information</h2>
                            <div className="space-y-4">
                                <div><label htmlFor="businessName" className={formLabelClass}>Business Name</label><input type="text" id="businessName" value={(formData as Seller).businessName || ''} onChange={handleInputChange} required className={formInputClass} /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div><label htmlFor="panNumber" className={formLabelClass}>PAN Number</label><input type="text" id="panNumber" value={(formData as Seller).panNumber || ''} onChange={handleInputChange} required className={formInputClass} /></div>
                                  <div><label htmlFor="gstNumber" className={formLabelClass}>GST Number (Optional)</label><input type="text" id="gstNumber" value={(formData as Seller).gstNumber || ''} onChange={handleInputChange} className={formInputClass} /></div>
                                </div>
                                <div><label htmlFor="registrationNumber" className={formLabelClass}>Business Reg. No. (Optional)</label><input type="text" id="registrationNumber" value={(formData as Seller).registrationNumber || ''} onChange={handleInputChange} className={formInputClass} /></div>
                            </div>
                           </div>
                        )}
                        
                        {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-md">{error}</p>}
                        {message && <p className="text-green-400 text-sm text-center bg-green-500/10 p-3 rounded-md">{message}</p>}

                        <button type="submit" disabled={isSubmitting} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase disabled:opacity-50">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default EditProfilePage;