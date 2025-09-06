import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useProducts } from '../../hooks/useProducts.ts';
import { useOrders } from '../../hooks/useOrders.ts';
import StatCard from '../../components/StatCard.tsx';
import { supabase } from '../../supabase.ts';

const SiteSettingsCard: React.FC = () => {
    const [settings, setSettings] = useState({
        shippingDiscount: 0,
        gstPercentage: 18,
        baseShippingFee: 0,
        codFee: 15,
    });
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
                });
            } else if (error && error.code !== 'PGRST116') {
                console.error("Error fetching site settings:", error);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        const { error } = await supabase.from('site_settings').upsert({ 
            id: 1, 
            global_shipping_discount_percentage: settings.shippingDiscount,
            gst_percentage: settings.gstPercentage,
            base_shipping_fee: settings.baseShippingFee,
            cod_fee: settings.codFee,
        });
        if (error) {
            setMessage('Error saving settings.');
            console.error(error);
        } else {
            setMessage('Settings saved successfully!');
        }
        setTimeout(() => setMessage(''), 3000);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const numValue = Number(value);
        
        if (id === 'shippingDiscount' || id === 'gstPercentage') {
             setSettings(prev => ({ ...prev, [id]: Math.max(0, Math.min(100, numValue)) }));
        } else {
             setSettings(prev => ({ ...prev, [id]: Math.max(0, numValue) }));
        }
    };

    return (
        <div className="bg-black/30 border border-brand-gold/20 rounded-lg p-6">
            <h2 className="font-serif text-2xl text-brand-light mb-4">Site Settings</h2>
            {loading ? <p>Loading settings...</p> : (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="shippingDiscount" className="block text-sm font-medium text-brand-gold">Global Shipping Discount (%)</label>
                        <p className="text-xs text-brand-light/60 mb-2">Apply a site-wide percentage discount on all shipping fees.</p>
                        <input
                            type="number" id="shippingDiscount" value={settings.shippingDiscount}
                            onChange={handleInputChange} min="0" max="100"
                            className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="baseShippingFee" className="block text-sm font-medium text-brand-gold">Base Shipping Fee (₹)</label>
                        <p className="text-xs text-brand-light/60 mb-2">Set a standard shipping fee for all orders.</p>
                        <input
                            type="number" id="baseShippingFee" value={settings.baseShippingFee}
                            onChange={handleInputChange} min="0"
                            className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="codFee" className="block text-sm font-medium text-brand-gold">Cash on Delivery Fee (₹)</label>
                        <p className="text-xs text-brand-light/60 mb-2">Set the fee for Cash on Delivery orders.</p>
                        <input
                            type="number" id="codFee" value={settings.codFee}
                            onChange={handleInputChange} min="0"
                            className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="gstPercentage" className="block text-sm font-medium text-brand-gold">GST Percentage (%)</label>
                        <p className="text-xs text-brand-light/60 mb-2">Set the GST rate applied to the subtotal of all orders.</p>
                        <input
                            type="number" id="gstPercentage" value={settings.gstPercentage}
                            onChange={handleInputChange} min="0" max="100"
                            className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm"
                        />
                    </div>
                    <button onClick={handleSave} className="w-full font-sans text-sm tracking-widest px-8 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors">
                        Save Settings
                    </button>
                    {message && <p className="text-green-400 text-sm text-center mt-2">{message}</p>}
                </div>
            )}
        </div>
    );
};


const AdminDashboardPage: React.FC = () => {
    const { allUsers } = useAuth();
    const { products } = useProducts();
    const { orders } = useOrders();
    
    return (
        <AdminLayout>
            <div className="page-fade-in">
                <h1 className="font-serif text-4xl text-brand-light">Admin Dashboard</h1>
                <p className="text-brand-light/70 mt-1">Overview of your e-commerce platform.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    <StatCard title="Total Products" value={products.length.toString()} icon="category" link="/admin/products" />
                    <StatCard title="Total Orders" value={orders.length.toString()} icon="cart" link="/admin/orders" />
                    <StatCard title="Total Users" value={allUsers.length.toString()} icon="user" link="/admin/users" />
                </div>

                <div className="mt-8">
                    <SiteSettingsCard />
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboardPage;