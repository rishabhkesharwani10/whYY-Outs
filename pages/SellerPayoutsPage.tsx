
import React, { useState, useEffect } from 'react';
import SellerLayout from '../components/SellerLayout.tsx';
import type { Payout, SellerBankDetails } from '../types.ts';
import { supabase } from '../supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import BackButton from '../components/BackButton.tsx';

// NOTE: Payout history is now empty by default. In a real application, a backend process
// would generate these records based on sales and transfer them to the seller's bank.
const MOCK_PAYOUTS: Payout[] = [];

const SellerPayoutsPage: React.FC = () => {
    const { user } = useAuth();
    const [bankDetails, setBankDetails] = useState<Partial<SellerBankDetails>>({});
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBankDetails = async () => {
            if (!user) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('seller_bank_details')
                .select('*')
                .eq('seller_id', user.id)
                .single();
            
            if (data) {
                setBankDetails(data);
            } else if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
                console.error("Error fetching bank details:", error);
            }
            setLoading(false);
        };
        fetchBankDetails();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBankDetails(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setMessage('');

        const { error } = await supabase
            .from('seller_bank_details')
            .upsert({
                seller_id: user.id,
                bank_name: bankDetails.bank_name,
                account_number: bankDetails.account_number,
                ifsc_code: bankDetails.ifsc_code,
                updated_at: new Date().toISOString(),
            });

        if (error) {
            setMessage('Error: Could not save details.');
            console.error(error);
        } else {
            setMessage('Payout information saved successfully!');
        }
        
        setIsSubmitting(false);
        setTimeout(() => setMessage(''), 3000);
    };

    const getStatusClass = (status: 'Completed' | 'Processing') => {
        return status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400';
    };

    const formInputClass = "mt-2 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
    const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

    return (
        <SellerLayout>
            <div className="page-fade-in">
                <div className="mb-6">
                    <BackButton fallback="/seller-dashboard" />
                </div>
                <h1 className="font-serif text-4xl text-brand-light">Payouts</h1>
                <p className="text-brand-light/70 mt-1">Manage your bank details and view payout history.</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-1">
                        <div className="bg-black/30 border border-brand-gold/20 rounded-lg p-6">
                            <h2 className="font-serif text-2xl text-brand-light mb-4">Bank Details</h2>
                            {loading ? <p>Loading details...</p> : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="bank_name" className={formLabelClass}>Bank Name</label>
                                        <input type="text" id="bank_name" value={bankDetails.bank_name || ''} onChange={handleChange} required className={formInputClass} />
                                    </div>
                                    <div>
                                        <label htmlFor="account_number" className={formLabelClass}>Account Number</label>
                                        <input type="text" id="account_number" value={bankDetails.account_number || ''} onChange={handleChange} required className={formInputClass} />
                                    </div>
                                    <div>
                                        <label htmlFor="ifsc_code" className={formLabelClass}>IFSC Code</label>
                                        <input type="text" id="ifsc_code" value={bankDetails.ifsc_code || ''} onChange={handleChange} required className={formInputClass} />
                                    </div>
                                    <button type="submit" disabled={isSubmitting} className="w-full mt-4 font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase disabled:opacity-50">
                                        {isSubmitting ? 'Saving...' : 'Save Details'}
                                    </button>
                                    {message && <p className="text-green-400 text-sm text-center mt-4">{message}</p>}
                                </form>
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                         <div className="bg-black/30 border border-brand-gold/20 rounded-lg p-6">
                            <h2 className="font-serif text-2xl text-brand-light mb-4">Payout History</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead className="border-b border-brand-gold/20">
                                        <tr>
                                            <th className="p-3 text-sm font-semibold uppercase tracking-wider">Date</th>
                                            <th className="p-3 text-sm font-semibold uppercase tracking-wider">Amount</th>
                                            <th className="p-3 text-sm font-semibold uppercase tracking-wider">Status</th>
                                            <th className="p-3 text-sm font-semibold uppercase tracking-wider">Transaction ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-gold/20">
                                        {MOCK_PAYOUTS.length > 0 ? (
                                            MOCK_PAYOUTS.map(payout => (
                                                <tr key={payout.id}>
                                                    <td className="p-3">{new Date(payout.date).toLocaleDateString()}</td>
                                                    <td className="p-3 font-bold text-brand-gold-light">₹{payout.amount.toFixed(2)}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(payout.status)}`}>{payout.status}</span>
                                                    </td>
                                                    <td className="p-3 font-mono text-xs">{payout.transactionId}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center p-16">
                                                    <p className="text-brand-light/70">No payout history found.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SellerLayout>
    );
};

export default SellerPayoutsPage;
