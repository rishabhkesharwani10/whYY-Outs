import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import BackButton from '../../components/BackButton.tsx';
import { useReturns } from '../../hooks/useReturns.ts';
import type { ReturnRequest } from '../../types.ts';
import ReturnDetailModal from '../../components/ReturnDetailModal.tsx';

const StatusUpdateModal: React.FC<{ request: ReturnRequest; action: 'Approve' | 'Reject'; onClose: () => void; }> = ({ request, action, onClose }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { updateReturnRequestStatus } = useReturns();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await updateReturnRequestStatus(request.id, action === 'Approve' ? 'Approved' : 'Rejected', reason);
        setIsSubmitting(false);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-md p-6 page-fade-in relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-brand-light/70 hover:text-white">&times;</button>
                <h2 className={`font-serif text-2xl mb-4 ${action === 'Approve' ? 'text-green-400' : 'text-red-400'}`}>{action} Return Request</h2>
                <p className="text-sm text-brand-light/80 mb-4">You are about to <span className="font-bold">{action.toLowerCase()}</span> the return for "{request.productName}".</p>
                {action === 'Reject' && (
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-brand-gold mb-2">Reason for Rejection (Optional)</label>
                        <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full bg-black/50 border border-brand-gold/30 rounded-md py-2 px-3" />
                    </div>
                )}
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className={`font-sans text-sm tracking-widest px-6 py-2 border text-brand-dark disabled:opacity-50 ${action === 'Approve' ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500'}`}>
                        {isSubmitting ? 'Confirming...' : `Confirm ${action}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminReturnsPage: React.FC = () => {
    const { returnRequests, loading } = useReturns();
    const [modalState, setModalState] = useState<{ request: ReturnRequest; action: 'Approve' | 'Reject' } | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);

    const getStatusClass = (status: ReturnRequest['status']) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-500/20 text-yellow-400';
            case 'Approved': return 'bg-green-500/20 text-green-400';
            case 'Rejected': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <AdminLayout>
            <div className="page-fade-in">
                <div className="mb-6"><BackButton fallback="/admin" /></div>
                <h1 className="font-serif text-4xl text-brand-light">Manage Returns</h1>
                <p className="text-brand-light/70 mt-1">Review and process all customer return requests.</p>
                
                <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto mt-6">
                    <table className="w-full text-left min-w-[720px]">
                        <thead className="bg-black/50 border-b border-brand-gold/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Product</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Customer</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Date</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-8 text-brand-light/70">Loading requests...</td></tr>
                            ) : returnRequests.length > 0 ? (
                                returnRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-brand-gold/5">
                                        <td className="p-4 flex items-center gap-4">
                                            <img src={req.productImage} alt={req.productName} className="w-12 h-12 object-cover rounded-md" />
                                            <div>
                                                <p className="font-semibold text-brand-light">{req.productName}</p>
                                                <p className="text-xs text-brand-light/60">Order: #{req.orderId.substring(0,8)}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">{req.customerName || 'N/A'}</td>
                                        <td className="p-4">{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(req.status)}`}>{req.status}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setSelectedRequest(req)} className="text-sm font-semibold text-blue-400 hover:underline">View</button>
                                                {req.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => setModalState({ request: req, action: 'Approve' })} className="text-sm font-semibold text-green-400 hover:underline">Approve</button>
                                                        <button onClick={() => setModalState({ request: req, action: 'Reject' })} className="text-sm font-semibold text-red-400 hover:underline">Reject</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="text-center p-16 text-brand-light/70">No return requests found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {modalState && <StatusUpdateModal request={modalState.request} action={modalState.action} onClose={() => setModalState(null)} />}
            {selectedRequest && <ReturnDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
        </AdminLayout>
    );
};

export default AdminReturnsPage;