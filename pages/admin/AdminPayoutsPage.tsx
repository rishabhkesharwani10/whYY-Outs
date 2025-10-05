import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout.tsx';
import BackButton from '../../components/BackButton.tsx';
import { supabase } from '../../supabase.ts';
import type { Payout, SellerBankDetails } from '../../types.ts';

interface PayoutRequest extends Payout {
    seller: {
        id: string;
        fullName: string;
        businessName?: string;
        seller_bank_details: SellerBankDetails[];
    };
}

const createNotification = async (userId: string, orderId: string, message: string) => {
    try {
        const { error } = await supabase.from('notifications').insert({
            user_id: userId,
            order_id: orderId,
            message: message,
        });
        if (error) throw error;
    } catch (err) {
        console.error(`Failed to create notification for user ${userId}:`, err);
    }
};

const PayoutDetailsModal: React.FC<{ request: PayoutRequest; onClose: () => void; onConfirm: () => void; }> = ({ request, onClose, onConfirm }) => {
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const bankDetails = request.seller.seller_bank_details?.[0];

    const handleSubmitApproval = async () => {
        if (request.status !== 'Processing') return;
        if (!transactionId.trim()) {
            setError('Transaction ID is required to approve a payout.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        const { error: updateError } = await supabase
            .from('payouts')
            .update({ status: 'Completed', transaction_id: transactionId.trim() })
            .eq('id', request.id);
        
        if (updateError) {
            setError(updateError.message);
            setIsSubmitting(false);
            return;
        }

        const message = `Your payout of ₹${request.amount.toFixed(2)} has been completed.`;
        await createNotification(request.seller_id, request.id, message);
        
        onConfirm();
        onClose();
    };

    const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; }> = ({ label, value }) => (
        <div>
            <p className="text-xs font-semibold text-brand-gold uppercase tracking-wider">{label}</p>
            <div className="text-brand-light/90 mt-1">{value || <span className="text-brand-light/50">Not Provided</span>}</div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-lg p-6 page-fade-in relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-brand-light/70 hover:text-white">&times;</button>
                <h2 className="font-serif text-2xl text-brand-gold mb-4 flex-shrink-0">Payout Details</h2>
                
                <div className="overflow-y-auto pr-2 -mr-4 flex-grow space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Seller" value={request.seller.fullName} />
                        <DetailItem label="Business Name" value={request.seller.businessName} />
                        <DetailItem label="Amount" value={<span className="font-bold text-lg text-brand-gold-light">₹{request.amount.toFixed(2)}</span>} />
                        <DetailItem label="Status" value={request.status} />
                    </div>

                    <div className="border-t border-brand-gold/20 pt-4">
                        <h3 className="font-serif text-xl text-brand-gold-light mb-3">Bank Details for Transfer</h3>
                        {bankDetails ? (
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem label="Bank Name" value={bankDetails.bank_name} />
                                <DetailItem label="Account Number" value={<span className="font-mono">{bankDetails.account_number}</span>} />
                                <DetailItem label="IFSC Code" value={<span className="font-mono">{bankDetails.ifsc_code}</span>} />
                            </div>
                        ) : (
                            <p className="text-yellow-400">Seller has not provided their bank details.</p>
                        )}
                    </div>

                    {request.status === 'Processing' && (
                        <div className="border-t border-brand-gold/20 pt-4">
                             <h3 className="font-serif text-xl text-green-400 mb-3">Approve Payout</h3>
                             <div>
                                <label htmlFor="transactionId" className="block text-sm font-medium text-brand-gold mb-2">Transaction ID / Reference No.</label>
                                <p className="text-xs text-brand-light/60 mb-2">Enter the reference number after completing the bank transfer.</p>
                                <input id="transactionId" value={transactionId} onChange={e => setTransactionId(e.target.value)} required className="w-full bg-black/50 border border-brand-gold/30 rounded-md py-2 px-3" />
                             </div>
                             {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 mt-6 pt-4 border-t border-brand-gold/20 flex justify-end gap-4">
                    <button onClick={onClose} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Close</button>
                    {request.status === 'Processing' && (
                         <button onClick={handleSubmitApproval} disabled={isSubmitting} className="font-sans text-sm tracking-widest px-6 py-2 border bg-green-500 border-green-500 text-brand-dark disabled:opacity-50">
                            {isSubmitting ? 'Confirming...' : 'Confirm & Approve'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const AdminPayoutsPage: React.FC = () => {
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'Processing' | 'Completed' | 'All'>('Processing');
    const [modalRequest, setModalRequest] = useState<PayoutRequest | null>(null);

    const fetchPayouts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Step 1: Fetch payouts and basic seller info
            let query = supabase.from('payouts').select(`
                *,
                seller:sellers(id, full_name, business_name)
            `).order('requested_at', { ascending: false });
    
            if (filter !== 'All') {
                query = query.eq('status', filter);
            }
            
            const { data: payoutsData, error: payoutsError } = await query;
            if (payoutsError) throw payoutsError;
    
            if (!payoutsData || payoutsData.length === 0) {
                setPayouts([]);
                setLoading(false);
                return;
            }
    
            // Step 2: Extract seller IDs to fetch their bank details
            const sellerIds = [...new Set(payoutsData.map(p => p.seller?.id).filter(Boolean))];
    
            if (sellerIds.length === 0) {
                 const mappedDataWithoutBankDetails = payoutsData.map(p => ({
                    ...p,
                    seller: p.seller ? {
                        id: p.seller.id,
                        fullName: p.seller.full_name,
                        businessName: p.seller.business_name,
                        seller_bank_details: []
                    } : {
                        id: p.seller_id,
                        fullName: 'Deleted Seller',
                        businessName: 'N/A',
                        seller_bank_details: []
                    }
                }));
                setPayouts(mappedDataWithoutBankDetails as PayoutRequest[]);
                setLoading(false);
                return;
            }
            
            // Step 3: Fetch bank details for all relevant sellers in one go
            const { data: bankDetailsData, error: bankDetailsError } = await supabase
                .from('seller_bank_details')
                .select('*')
                .in('seller_id', sellerIds);
    
            if (bankDetailsError) throw bankDetailsError;
    
            // Step 4: Create a map for easy lookup and merge the data
            const bankDetailsMap = new Map<string, SellerBankDetails>();
            bankDetailsData.forEach(bd => bankDetailsMap.set(bd.seller_id, bd));
    
            const mappedData = payoutsData.map(p => {
                 const bankDetails = p.seller && bankDetailsMap.has(p.seller.id) ? [bankDetailsMap.get(p.seller.id)!] : [];
                 return {
                    ...p,
                    seller: p.seller ? {
                        id: p.seller.id,
                        fullName: p.seller.full_name,
                        businessName: p.seller.business_name,
                        seller_bank_details: bankDetails
                    } : {
                        id: p.seller_id,
                        fullName: 'Deleted Seller',
                        businessName: 'N/A',
                        seller_bank_details: []
                    }
                 };
            });
            
            setPayouts(mappedData as PayoutRequest[] || []);
    
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while fetching payouts.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchPayouts();
    }, [fetchPayouts]);
    
    const getStatusClass = (status: 'Completed' | 'Processing') => {
        return status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400';
    };

    const FilterButton: React.FC<{ value: typeof filter, label: string }> = ({ value, label }) => {
        const isActive = filter === value;
        return (
            <button
                onClick={() => setFilter(value)}
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
                <h1 className="font-serif text-4xl text-brand-light">Manage Payouts</h1>
                <p className="text-brand-light/70 mt-1">Review and process seller payout requests.</p>
                
                <div className="my-6 flex items-center gap-2">
                    <FilterButton value="Processing" label="Pending" />
                    <FilterButton value="Completed" label="Completed" />
                    <FilterButton value="All" label="All" />
                </div>
                
                <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto">
                    <table className="w-full text-left min-w-[720px]">
                        <thead className="bg-black/50 border-b border-brand-gold/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Seller</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Date</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Amount</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Transaction ID</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center p-8">Loading...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={6} className="text-center p-8 text-red-400">{error}</td></tr>
                            ) : payouts.length > 0 ? (
                                payouts.map(payout => (
                                    <tr key={payout.id} className="hover:bg-brand-gold/5">
                                        <td className="p-4">
                                            <p className="font-semibold">{payout.seller.fullName}</p>
                                            <p className="text-xs text-brand-light/60">{payout.seller.businessName}</p>
                                        </td>
                                        <td className="p-4 text-sm">{new Date(payout.requested_at).toLocaleDateString()}</td>
                                        <td className="p-4 font-bold text-lg text-brand-gold-light">₹{payout.amount.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(payout.status)}`}>{payout.status}</span>
                                        </td>
                                        <td className="p-4 font-mono text-xs">{payout.transaction_id || 'N/A'}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => setModalRequest(payout)} className="text-sm font-semibold text-blue-400 hover:underline">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="text-center p-16 text-brand-light/70">No payout requests found for this filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {modalRequest && <PayoutDetailsModal request={modalRequest} onClose={() => setModalRequest(null)} onConfirm={() => { fetchPayouts(); }} />}
        </AdminLayout>
    );
};

export default AdminPayoutsPage;