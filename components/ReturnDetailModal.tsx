import React from 'react';
import type { ReturnRequest, ShippingAddress } from '../types.ts';
import Icon from './Icon.tsx';

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; }> = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold text-brand-gold uppercase tracking-wider">{label}</p>
        <div className="text-brand-light/90 mt-1">{value || <span className="text-brand-light/50">Not Provided</span>}</div>
    </div>
);

const AddressDisplay: React.FC<{ address?: ShippingAddress }> = ({ address }) => {
    if (!address) return <span className="text-brand-light/50">Not Provided</span>;
    return (
        <>
            <p>{address.addressLine1}</p>
            {address.addressLine2 && <p>{address.addressLine2}</p>}
            <p>{address.city}, {address.state} - {address.zip}</p>
            <p>{address.country}</p>
        </>
    );
};

const ReturnDetailModal: React.FC<{ request: ReturnRequest, onClose: () => void }> = ({ request, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-2xl p-6 page-fade-in relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-brand-light/70 hover:text-white">&times;</button>
                <h2 className="font-serif text-2xl text-brand-gold mb-4 flex-shrink-0">Return Request Details</h2>
                
                <div className="overflow-y-auto pr-4 -mr-4 flex-grow space-y-6">
                    {/* Product Info */}
                    <div className="flex items-start gap-4">
                        <img src={request.productImage} alt={request.productName} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-lg text-brand-light">{request.productName}</p>
                            <p className="text-xs text-brand-light/60">Order: #{request.orderId.substring(0,8)}</p>
                            <p className="text-xs text-brand-light/60">Requested on: {new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <DetailItem label="Reason for Return" value={request.reason} />
                    {request.statusReason && <DetailItem label="Reason for Status" value={request.statusReason} />}

                    {/* Customer Info */}
                    <div className="border-t border-brand-gold/20 pt-4">
                        <h3 className="font-serif text-xl text-brand-gold-light mb-3">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label="Name" value={request.customerName} />
                            <DetailItem label="Phone" value={request.customerDetails?.phone} />
                            <div className="md:col-span-2">
                                <DetailItem label="Shipping Address (for pickup)" value={<AddressDisplay address={request.customerDetails?.shippingAddress} />} />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex-shrink-0 mt-6 pt-4 border-t border-brand-gold/20 flex justify-end">
                    <button onClick={onClose} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Close</button>
                </div>
            </div>
        </div>
    );
};

export default ReturnDetailModal;