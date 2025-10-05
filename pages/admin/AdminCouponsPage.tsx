
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import BackButton from '../../components/BackButton.tsx';
import { useCoupons } from '../../hooks/useCoupons.ts';
import type { Coupon } from '../../types.ts';

const AdminCouponsPage: React.FC = () => {
    const { coupons, loading, error: contextError, addCoupon, toggleCouponActive, deleteCoupon } = useCoupons();
    const [usageFilter, setUsageFilter] = useState<'all' | 'used' | 'unused'>('all');
    
    // Form state
    const [code, setCode] = useState('');
    const [type, setType] = useState<'percentage' | 'flat'>('flat');
    const [value, setValue] = useState<number>(0);
    const [minOrderValue, setMinOrderValue] = useState<number | undefined>(undefined);
    const [expiryDate, setExpiryDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    
    const filteredCoupons = useMemo(() => {
        if (usageFilter === 'used') {
            return coupons.filter(c => (c.usage_count || 0) > 0);
        }
        if (usageFilter === 'unused') {
            return coupons.filter(c => (c.usage_count || 0) === 0);
        }
        return coupons;
    }, [coupons, usageFilter]);

    const handleAddCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        const { error: insertError } = await addCoupon({
            code, type, value, min_order_value: minOrderValue, expiry_date: expiryDate
        });

        if (insertError) {
            setFormError(insertError.message);
        } else {
            setCode('');
            setType('flat');
            setValue(0);
            setMinOrderValue(undefined);
            setExpiryDate('');
        }
        setIsSubmitting(false);
    };

    const handleToggleActive = async (coupon: Coupon) => {
        setFormError(null);
        const { error: updateError } = await toggleCouponActive(coupon);
        if (updateError) {
            setFormError(updateError.message);
        }
    };
    
    const handleDeleteCoupon = async (coupon: Coupon) => {
        if (window.confirm(`Are you sure you want to permanently delete the coupon "${coupon.code}"? This action cannot be undone.`)) {
            setFormError(null);
            const { error: deleteError } = await deleteCoupon(coupon.id);
            if (deleteError) {
                setFormError(deleteError.message);
            }
        }
    };

    const formInputClass = "block w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold";
    const formLabelClass = "block text-sm font-medium text-brand-gold mb-1";
    
    const FilterButton: React.FC<{ value: 'all' | 'used' | 'unused', label: string }> = ({ value, label }) => {
        const isActive = usageFilter === value;
        return (
            <button
                onClick={() => setUsageFilter(value)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${isActive ? 'bg-brand-gold text-brand-dark font-semibold' : 'bg-black/40 text-brand-light/70 hover:bg-brand-gold/10'}`}
            >
                {label}
            </button>
        );
    };

    return (
        <AdminLayout>
            <div className="page-fade-in">
                <div className="mb-6"><BackButton fallback="/admin" /></div>
                <h1 className="font-serif text-4xl text-brand-light">Manage Coupons</h1>
                <p className="text-brand-light/70 mt-1">Create and manage discount codes for your store.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-1 bg-black/30 border border-brand-gold/20 rounded-lg p-6 h-fit">
                        <h2 className="font-serif text-2xl text-brand-gold mb-4">Add New Coupon</h2>
                        <form onSubmit={handleAddCoupon} className="space-y-4">
                            <div>
                                <label htmlFor="code" className={formLabelClass}>Coupon Code</label>
                                <input type="text" id="code" value={code} onChange={e => setCode(e.target.value)} required className={formInputClass} />
                            </div>
                            <div>
                                <label htmlFor="type" className={formLabelClass}>Discount Type</label>
                                <select id="type" value={type} onChange={e => setType(e.target.value as any)} className={formInputClass}>
                                    <option value="flat">Flat Amount</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                            </div>
                             <div>
                                <label htmlFor="value" className={formLabelClass}>Value ({type === 'flat' ? '₹' : '%'})</label>
                                <input type="number" id="value" value={value} onChange={e => setValue(Number(e.target.value))} required min="0" step="0.01" className={formInputClass} />
                            </div>
                            <div>
                                <label htmlFor="minOrderValue" className={formLabelClass}>Min. Order Value (₹, optional)</label>
                                <input type="number" id="minOrderValue" value={minOrderValue || ''} onChange={e => setMinOrderValue(e.target.value ? Number(e.target.value) : undefined)} min="0" className={formInputClass} />
                            </div>
                            <div>
                                <label htmlFor="expiryDate" className={formLabelClass}>Expiry Date (optional)</label>
                                <input type="date" id="expiryDate" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className={formInputClass} />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full mt-2 font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase disabled:opacity-50">
                                {isSubmitting ? 'Adding...' : 'Add Coupon'}
                            </button>
                             {(formError || contextError) && <p className="text-red-400 text-sm mt-2">{formError || contextError}</p>}
                        </form>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <FilterButton value="all" label="All" />
                            <FilterButton value="used" label="Used" />
                            <FilterButton value="unused" label="Unused" />
                        </div>
                        <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto">
                            <table className="w-full text-left min-w-[640px]">
                                 <thead className="bg-black/50 border-b border-brand-gold/20">
                                    <tr>
                                        <th className="p-4 text-sm font-semibold uppercase tracking-wider">Code</th>
                                        <th className="p-4 text-sm font-semibold uppercase tracking-wider">Type</th>
                                        <th className="p-4 text-sm font-semibold uppercase tracking-wider">Value</th>
                                        <th className="p-4 text-sm font-semibold uppercase tracking-wider">Min. Order</th>
                                        <th className="p-4 text-sm font-semibold uppercase tracking-wider">Expires</th>
                                        <th className="p-4 text-sm font-semibold uppercase tracking-wider">Usage</th>
                                        <th className="p-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                 <tbody className="divide-y divide-brand-gold/20">
                                    {loading ? (
                                        <tr><td colSpan={8} className="text-center p-8 text-brand-light/70">Loading...</td></tr>
                                    ) : filteredCoupons.map(coupon => (
                                        <tr key={coupon.id} className="hover:bg-brand-gold/5">
                                            <td className="p-4 font-mono font-semibold">{coupon.code}</td>
                                            <td className="p-4 capitalize">{coupon.type}</td>
                                            <td className="p-4">{coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}</td>
                                            <td className="p-4">{coupon.min_order_value ? `₹${coupon.min_order_value}` : 'None'}</td>
                                            <td className="p-4">{coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'Never'}</td>
                                            <td className="p-4 font-semibold">{coupon.usage_count}</td>
                                            <td className="p-4">
                                                <button onClick={() => handleToggleActive(coupon)} className={`px-3 py-1 text-xs rounded-full font-semibold ${coupon.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {coupon.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDeleteCoupon(coupon)} className="text-sm font-semibold text-red-500 hover:underline">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                 </tbody>
                            </table>
                             {!loading && filteredCoupons.length === 0 && (
                                <p className="text-center p-8 text-brand-light/70">
                                    {usageFilter === 'all' ? 'No coupons found. Add one to get started.' : `No ${usageFilter} coupons found.`}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminCouponsPage;
