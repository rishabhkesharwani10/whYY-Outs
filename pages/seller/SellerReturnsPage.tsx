
import React from 'react';
import SellerLayout from '../../components/SellerLayout.tsx';
import type { ReturnRequest } from '../../types.ts';

// NOTE: This is mock data. In a real application, you would fetch this from your database.
const MOCK_RETURNS: ReturnRequest[] = [
    { id: 'ret_1', orderId: 'ord-123-abc', productName: 'Classic Leather Wallet', reason: 'Item not as described', status: 'Pending', requestedAt: '2024-07-20T14:00:00Z' },
    { id: 'ret_2', orderId: 'ord-456-def', productName: 'Smart Home Hub', reason: 'Defective item', status: 'Approved', requestedAt: '2024-07-18T09:30:00Z' },
    { id: 'ret_3', orderId: 'ord-789-ghi', productName: 'Designer Sunglasses', reason: 'Changed my mind', status: 'Rejected', requestedAt: '2024-07-17T18:45:00Z' },
];

const SellerReturnsPage: React.FC = () => {
    
    const getStatusClass = (status: 'Pending' | 'Approved' | 'Rejected') => {
        switch (status) {
          case 'Pending': return 'bg-yellow-500/20 text-yellow-400';
          case 'Approved': return 'bg-green-500/20 text-green-400';
          case 'Rejected': return 'bg-red-500/20 text-red-400';
        }
    };

    return (
        <SellerLayout>
            <div className="page-fade-in">
                <h1 className="font-serif text-4xl text-brand-light">Manage Returns</h1>
                <p className="text-brand-light/70 mt-1">Review and process customer return requests.</p>
                
                <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto mt-6">
                    <table className="w-full text-left min-w-[720px]">
                        <thead className="bg-black/50 border-b border-brand-gold/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Order ID</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Product</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Reason</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Date</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {MOCK_RETURNS.map(ret => (
                                <tr key={ret.id} className="hover:bg-brand-gold/5">
                                    <td className="p-4 font-mono text-xs">#{ret.orderId}</td>
                                    <td className="p-4 font-semibold">{ret.productName}</td>
                                    <td className="p-4 text-sm">{ret.reason}</td>
                                    <td className="p-4 text-sm">{new Date(ret.requestedAt).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(ret.status)}`}>{ret.status}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-sm font-semibold text-brand-gold hover:underline">Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {MOCK_RETURNS.length === 0 && (
                        <div className="text-center py-16">
                            <h3 className="text-xl font-semibold text-brand-light">No return requests.</h3>
                        </div>
                    )}
                </div>
            </div>
        </SellerLayout>
    );
};

export default SellerReturnsPage;
