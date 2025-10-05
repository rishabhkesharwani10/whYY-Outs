

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import { useProducts } from '../../hooks/useProducts.ts';
import { useOrders } from '../../hooks/useOrders.ts';
import StatCard from '../../components/StatCard.tsx';
import { supabase } from '../../supabase.ts';
import Icon from '../../components/Icon.tsx';

const SiteSettingsCard: React.FC = () => {
    const [settings, setSettings] = useState({
        shippingDiscount: 0,
        gstPercentage: 18,
        baseShippingFee: 0,
        codFee: 15,
        pamphletTextLine1: '',
        pamphletTextLine2: '',
        pamphletBackgroundImage: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('site_settings').select('*').single();
            if (data) {
                setSettings({
                    shippingDiscount: data.global_shipping_discount_percentage || 0,
                    gstPercentage: data.gst_percentage || 18,
                    baseShippingFee: data.base_shipping_fee || 0,
                    codFee: data.cod_fee || 15,
                    pamphletTextLine1: data.pamphlet_text_line_1 || '',
                    pamphletTextLine2: data.pamphlet_text_line_2 || '',
                    pamphletBackgroundImage: data.pamphlet_background_image || '',
                });
                setImagePreview(data.pamphlet_background_image || null);
            } else if (error && error.code !== 'PGRST116') {
                console.error("Error fetching site settings:", error);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setImagePreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };


    const handleSave = async () => {
        let imageUrl = settings.pamphletBackgroundImage;

        if (imageFile) {
            const filePath = `public/site-assets/pamphlet-bg-${Date.now()}`;
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, imageFile, { upsert: true });

            if (uploadError) {
                setMessage(`Image upload failed: ${uploadError.message}`);
                setTimeout(() => setMessage(''), 3000);
                return;
            }

            const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
            imageUrl = publicUrlData.publicUrl;
        }

        const { error } = await supabase.from('site_settings').upsert({ 
            id: 1, 
            global_shipping_discount_percentage: settings.shippingDiscount,
            gst_percentage: settings.gstPercentage,
            base_shipping_fee: settings.baseShippingFee,
            cod_fee: settings.codFee,
            pamphlet_text_line_1: settings.pamphletTextLine1,
            pamphlet_text_line_2: settings.pamphletTextLine2,
            pamphlet_background_image: imageUrl,
        }).select();

        if (error) {
            setMessage('Error saving settings.');
            console.error(error);
        } else {
            setMessage('Settings saved successfully!');
            setSettings(prev => ({ ...prev, pamphletBackgroundImage: imageUrl }));
            setImageFile(null);
        }
        setTimeout(() => setMessage(''), 3000);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const numValue = Number(value);
        
        if (['shippingDiscount', 'gstPercentage'].includes(id)) {
             setSettings(prev => ({ ...prev, [id]: Math.max(0, Math.min(100, numValue)) }));
        } else if (['baseShippingFee', 'codFee'].includes(id)) {
             setSettings(prev => ({ ...prev, [id]: Math.max(0, numValue) }));
        } else {
             setSettings(prev => ({ ...prev, [id]: value }));
        }
    };

    return (
        <div className="bg-black/30 border border-brand-gold/20 rounded-lg p-6">
            <h2 className="font-serif text-2xl text-brand-light mb-4">Site Settings</h2>
            {loading ? <p>Loading settings...</p> : (
                <div className="space-y-6 divide-y divide-brand-gold/10">
                    <div className="space-y-4 pt-4 first:pt-0">
                        <h3 className="font-serif text-xl text-brand-gold">Financials</h3>
                        <div>
                            <label htmlFor="shippingDiscount" className="block text-sm font-medium text-brand-gold">Global Shipping Discount (%)</label>
                            <p className="text-xs text-brand-light/60 mb-2">Apply a site-wide percentage discount on all shipping fees.</p>
                            <input type="number" id="shippingDiscount" value={settings.shippingDiscount} onChange={handleInputChange} min="0" max="100" className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="baseShippingFee" className="block text-sm font-medium text-brand-gold">Base Shipping Fee (₹)</label>
                            <p className="text-xs text-brand-light/60 mb-2">Set a standard shipping fee for all orders.</p>
                            <input type="number" id="baseShippingFee" value={settings.baseShippingFee} onChange={handleInputChange} min="0" className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="codFee" className="block text-sm font-medium text-brand-gold">Cash on Delivery Fee (₹)</label>
                            <p className="text-xs text-brand-light/60 mb-2">Set the fee for Cash on Delivery orders.</p>
                            <input type="number" id="codFee" value={settings.codFee} onChange={handleInputChange} min="0" className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm" />
                        </div>
                        <div>
                            <label htmlFor="gstPercentage" className="block text-sm font-medium text-brand-gold">GST Percentage (%)</label>
                            <p className="text-xs text-brand-light/60 mb-2">Set the GST rate applied to the subtotal of all orders.</p>
                            <input type="number" id="gstPercentage" value={settings.gstPercentage} onChange={handleInputChange} min="0" max="100" className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm" />
                        </div>
                    </div>

                    <div className="space-y-4 pt-6">
                        <h3 className="font-serif text-xl text-brand-gold">Homepage Pamphlet</h3>
                         <div>
                            <label htmlFor="pamphletTextLine1" className="block text-sm font-medium text-brand-gold">Text Line 1</label>
                            <input type="text" id="pamphletTextLine1" value={settings.pamphletTextLine1} onChange={handleInputChange} className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm mt-1" />
                        </div>
                         <div>
                            <label htmlFor="pamphletTextLine2" className="block text-sm font-medium text-brand-gold">Text Line 2</label>
                            <input type="text" id="pamphletTextLine2" value={settings.pamphletTextLine2} onChange={handleInputChange} className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm mt-1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-gold">Background Image</label>
                            <div className="mt-2 flex items-center gap-4">
                                <img src={imagePreview || 'https://via.placeholder.com/150'} alt="Pamphlet background preview" className="w-32 h-20 object-cover rounded-md bg-black/50" />
                                <input type="file" id="pamphletImage" onChange={handleImageChange} accept="image/*" className="block w-full text-sm text-brand-light/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-gold/10 file:text-brand-gold hover:file:bg-brand-gold/20" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6">
                        <button onClick={handleSave} className="w-full font-sans text-sm tracking-widest px-8 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors">
                            Save All Settings
                        </button>
                        {message && <p className="text-green-400 text-sm text-center mt-2 animate-pulse">{message}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};


const AdminDashboardPage: React.FC = () => {
    const { products } = useProducts();
    const { orders } = useOrders();
    const [userCount, setUserCount] = useState(0);
    
    useEffect(() => {
        const fetchUserCount = async () => {
            const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
            const { count: sellerCount } = await supabase.from('sellers').select('*', { count: 'exact', head: true });
            setUserCount((customerCount || 0) + (sellerCount || 0));
        }
        fetchUserCount();
    }, []);

    return (
        <AdminLayout>
            <div className="page-fade-in">
                <h1 className="font-serif text-4xl text-brand-light">Admin Dashboard</h1>
                <p className="text-brand-light/70 mt-1">Overview of your e-commerce platform.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    <StatCard title="Total Products" value={products.length.toString()} icon="category" link="/admin/products" />
                    <StatCard title="Total Orders" value={orders.length.toString()} icon="cart" link="/admin/orders" />
                    <StatCard title="Total Users" value={userCount.toString()} icon="user" link="/admin/users" />
                </div>

                <div className="mt-8">
                    <SiteSettingsCard />
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboardPage;
