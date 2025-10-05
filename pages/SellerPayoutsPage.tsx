import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerLayout from '../components/SellerLayout.tsx';
import type { Payout, SellerBankDetails, Seller } from '../types.ts';
import { supabase } from '../supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import BackButton from '../components/BackButton.tsx';
import { useSellerData } from '../hooks/useSellerData.ts';
import StatCard from '../components/StatCard.tsx';
import Icon from '../components/Icon.tsx';
import { useSellerProfileStatus } from '../hooks/useSellerProfileStatus.ts';
import { ADMIN_USER_ID } from '../constants.ts';

const BankDetailsModal: React.FC<{
    onClose: () => void;
    initialDetails: Partial<SellerBankDetails>;
    onSaveSuccess: () => void;
}> = ({ onClose, initialDetails, onSaveSuccess }) => {
    const { user } = useAuth();
    const [bankName, setBankName] = useState(initialDetails.bank_name || '');
    const [accountNumber, setAccountNumber] = useState(initialDetails.account_number || '');
    const [ifscCode, setIfscCode] = useState(initialDetails.ifsc_code || '');
    const [isSaving, setIsSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setModalError('Authentication error. Please log in again.');
            return;
        }
        if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
            setModalError('All fields are required.');
            return;
        }

        setIsSaving(true);
        setModalError('');

        const { error } = await supabase.from('seller_bank_details').upsert({
            seller_id: user.id,
            bank_name: bankName,
            account_number: accountNumber,
            ifsc_code: ifscCode.toUpperCase(),
            updated_at: new Date().toISOString(),
        });
        
        setIsSaving(false);
        if (error) {
            console.error("Error saving bank details:", error);
            setModalError('Failed to save details. Please try again.');
        } else {
            onSaveSuccess();
            onClose();
        }
    };

    const formInputClass = "block w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold";
    const formLabelClass = "block text-sm font-medium text-brand-gold mb-1";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-md p-6 page-fade-in relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-brand-light/70 hover:text-white" aria-label="Close">&times;</button>
                <h2 className="font-serif text-2xl text-brand-gold mb-4">Update Bank Details</h2>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="bankName" className={formLabelClass}>Bank Name</label>
                        <input type="text" id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} required className={formInputClass} />
                    </div>
                    <div>
                        <label htmlFor="accountNumber" className={formLabelClass}>Account Number</label>
                        <input type="text" id="accountNumber" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required className={formInputClass} />
                    </div>
                    <div>
                        <label htmlFor="ifscCode" className={formLabelClass}>IFSC Code</label>
                        <input type="text" id="ifscCode" value={ifscCode} onChange={e => setIfscCode(e.target.value)} required className={formInputClass} />
                    </div>
                    {modalError && <p className="text-red-400 text-sm mt-2">{modalError}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Cancel</button>
                        <button type="submit" disabled={isSaving} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const SellerPayoutsPage: React.FC = () => {
    const { user } = useAuth();
    const { totalRevenue } = useSellerData();
    const navigate = useNavigate();

    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [bankDetails, setBankDetails] = useState<Partial<SellerBankDetails>>({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [isBankDetailsModalOpen, setIsBankDetailsModalOpen] = useState(false);

    const { isProfileComplete, missingFields, loading: profileLoading } = useSellerProfileStatus();
    const canRequestPayouts = isProfileComplete;

    const fetchPayoutsAndBankDetails = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError('');

        try {
            const { data: payoutsData, error: payoutsError } = await supabase
                .from('payouts')
                .select('*')
                .eq('seller_id', user.id)
                .order('requested_at', { ascending: false });
            
            if (payoutsError) throw payoutsError;
            setPayouts(payoutsData || []);
            
            const { data: bankData, error: bankError } = await supabase
                .from('seller_bank_details')
                .select('*')
                .eq('seller_id', user.id)
                .single();
            
            if (bankError && bankError.code !== 'PGRST116') throw bankError;
            if (bankData) setBankDetails(bankData);

        } catch (err: any) {
            console.error("Error fetching payout data:", err.message || JSON.stringify(err));
            setError('Failed to load your payout information. Please ensure your database is set up correctly and try again.');
        } finally {
            setLoading(false);
        }
    }, [user]);
    
    useEffect(() => {
        fetchPayoutsAndBankDetails();
    }, [fetchPayoutsAndBankDetails]);
    
    const { payoutsToDate, availableForPayout, pendingPayouts } = useMemo(() => {
        const completedAmount = payouts
            .filter(p => p.status === 'Completed')
            .reduce((sum, p) => sum + p.amount, 0);
        
        const processingAmount = payouts
            .filter(p => p.status === 'Processing')
            .reduce((sum, p) => sum + p.amount, 0);
        
        return {
            payoutsToDate: completedAmount,
            pendingPayouts: processingAmount,
            availableForPayout: totalRevenue - completedAmount - processingAmount
        };
    }, [payouts, totalRevenue]);

    const handleRequestPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        const amount = parseFloat(payoutAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }
        if (amount > availableForPayout) {
            setError('Requested amount exceeds available balance.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setMessage('');

        const { data: newPayout, error: insertError } = await supabase.from('payouts').insert({
            seller_id: user.id,
            amount: amount,
            status: 'Processing',
        }).select().single();

        if (insertError) {
            setError('Failed to submit payout request. Please try again.');
            console.error(insertError);
        } else if (newPayout) {
            setMessage('Payout request submitted successfully!');
            setPayoutAmount('');
            
            // Notify admin about the new request
            if (ADMIN_USER_ID) {
                try {
                    const sellerName = (user as Seller).businessName || user.fullName;
                    const { error: notificationError } = await supabase.from('notifications').insert({
                        user_id: ADMIN_USER_ID,
                        order_id: newPayout.id, // Re-using order_id for context
                        message: `${sellerName} has requested a payout of ₹${amount.toFixed(2)}.`,
                    });
                    if (notificationError) throw notificationError;
                } catch (notificationError) {
                    console.error("Failed to create admin payout notification:", notificationError);
                    // Don't block user flow, just log it.
                }
            }
            
            await fetchPayoutsAndBankDetails(); // Refresh data
        }

        setIsSubmitting(false);
        setTimeout(() => {
            setMessage('');
            setError('');
        }, 4000);
    };

    const getStatusClass = (status: 'Completed' | 'Processing') => {
        return status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400';
    };

    return (
        <SellerLayout>
            <div className="page-fade-in">
                <div className="mb-6"><BackButton fallback="/seller-dashboard" /></div>
                <h1 className="font-serif text-4xl text-brand-light">Payouts</h1>
                <p className="text-brand-light/70 mt-1">Manage your earnings and payout history.</p>

                {(!canRequestPayouts && !profileLoading) && (
                    <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-6 rounded-lg space-y-3">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Icon name="wallet" className="w-5 h-5"/> Action Required: Complete Your Profile</h3>
                        <p className="text-sm">To request payouts, you must provide the following information:</p>
                        <ul className="list-disc list-inside text-sm pl-4">
                            {missingFields.map(field => <li key={field}>{field}</li>)}
                        </ul>
                        <button onClick={() => navigate('/edit-profile')} className="inline-block mt-2 font-bold text-sm bg-yellow-400 text-brand-dark px-4 py-1.5 rounded-md hover:bg-yellow-500 transition-colors">
                            Go to Edit Profile &rarr;
                        </button>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <StatCard title="Total Revenue" value={totalRevenue.toFixed(2)} prefix="₹" icon="wallet" />
                    <StatCard title="Available for Payout" value={Math.max(0, availableForPayout).toFixed(2)} prefix="₹" icon="check" />
                    <StatCard title="Pending Payouts" value={pendingPayouts.toFixed(2)} prefix="₹" icon="refresh" />
                    <StatCard title="Completed Payouts" value={payoutsToDate.toFixed(2)} prefix="₹" icon="truck" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-1 space-y-8">
                        <div className={`bg-black/30 border border-brand-gold/20 rounded-lg p-6 transition-opacity ${!canRequestPayouts ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h2 className="font-serif text-2xl text-brand-light mb-4">Request Payout</h2>
                            <form onSubmit={handleRequestPayout} className="space-y-4">
                                <div>
                                    <label htmlFor="payoutAmount" className="block text-sm font-medium text-brand-gold mb-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-light/70">₹</span>
                                        <input
                                            type="number" id="payoutAmount" value={payoutAmount}
                                            onChange={e => setPayoutAmount(e.target.value)}
                                            placeholder="0.00" min="0.01" step="0.01"
                                            max={availableForPayout > 0 ? availableForPayout.toFixed(2) : '0'}
                                            required
                                            className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 pl-7 pr-16 text-sm"
                                        />
                                        <button type="button" onClick={() => setPayoutAmount(availableForPayout > 0 ? availableForPayout.toFixed(2) : '0')} className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-brand-gold hover:underline">
                                            MAX
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" disabled={isSubmitting || availableForPayout <= 0 || !canRequestPayouts} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors uppercase disabled:opacity-50">
                                    {isSubmitting ? 'Requesting...' : 'Request Payout'}
                                </button>
                                {message && <p className="text-green-400 text-sm text-center mt-2">{message}</p>}
                                {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
                            </form>
                        </div>

                         <div className="bg-black/30 border border-brand-gold/20 rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-serif text-2xl text-brand-light">Bank Details</h2>
                                <button onClick={() => setIsBankDetailsModalOpen(true)} className="text-sm font-semibold text-brand-gold hover:underline">Update</button>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div><p className="text-xs text-brand-gold uppercase tracking-wider">Bank</p><p className="font-semibold">{bankDetails.bank_name || 'Not Provided'}</p></div>
                                <div><p className="text-xs text-brand-gold uppercase tracking-wider">Account No.</p><p className="font-semibold font-mono tracking-wider">{bankDetails.account_number ? `**** **** ${bankDetails.account_number.slice(-4)}` : 'Not Provided'}</p></div>
                                <div><p className="text-xs text-brand-gold uppercase tracking-wider">IFSC</p><p className="font-semibold font-mono">{bankDetails.ifsc_code || 'Not Provided'}</p></div>
                            </div>
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
                                        {loading ? (
                                            <tr><td colSpan={4} className="text-center p-16 text-brand-light/70">Loading history...</td></tr>
                                        ) : payouts.length > 0 ? (
                                            payouts.map(payout => (
                                                <tr key={payout.id}>
                                                    <td className="p-3">{new Date(payout.requested_at).toLocaleDateString()}</td>
                                                    <td className="p-3 font-bold text-brand-gold-light">₹{payout.amount.toFixed(2)}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(payout.status)}`}>{payout.status}</span>
                                                    </td>
                                                    <td className="p-3 font-mono text-xs">{payout.transaction_id || 'N/A'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="text-center p-16"><p className="text-brand-light/70">No payout history found.</p></td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isBankDetailsModalOpen && (
                <BankDetailsModal 
                    onClose={() => setIsBankDetailsModalOpen(false)}
                    initialDetails={bankDetails}
                    onSaveSuccess={fetchPayoutsAndBankDetails}
                />
            )}
        </SellerLayout>
    );
};

export default SellerPayoutsPage;