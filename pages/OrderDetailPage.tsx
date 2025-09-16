import React, { useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import Icon from '../components/Icon.tsx';
import { useOrders } from '../hooks/useOrders.ts';
import { useReturns } from '../hooks/useReturns.ts';
import type { OrderItem, ReturnRequest } from '../types.ts';
import NotFoundPage from './NotFoundPage.tsx';

const ReturnModal: React.FC<{ item: OrderItem; orderId: string; onClose: () => void; }> = ({ item, orderId, onClose }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { createReturnRequest } = useReturns();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Please provide a reason for the return.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        
        const { error: requestError } = await createReturnRequest(orderId, item.productId, reason);

        if (requestError) {
            setError(requestError.message || 'Failed to submit return request.');
        } else {
            onClose();
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[101] flex items-center justify-center p-4 print:hidden">
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-md p-6 page-fade-in relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-brand-light/70 hover:text-white">&times;</button>
                <h2 className="font-serif text-2xl text-brand-gold mb-4">Request a Return</h2>
                <div className="flex items-center gap-4 mb-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
                    <div>
                        <p className="font-semibold text-brand-light">{item.name}</p>
                        <p className="text-sm text-brand-light/70">Qty: {item.quantity}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="reason" className="block text-sm font-medium text-brand-gold mb-2">Reason for Return</label>
                    <textarea
                        id="reason"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        required
                        rows={4}
                        className="w-full bg-black/50 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        placeholder="e.g., The item arrived damaged."
                    />
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark disabled:opacity-50">
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CancelOrderModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean; error: string; }> = ({ isOpen, onClose, onConfirm, isLoading, error }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[101] flex items-center justify-center p-4 print:hidden" aria-modal="true" role="dialog">
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-md p-6 page-fade-in relative">
                <h2 className="font-serif text-2xl text-brand-gold mb-4">Confirm Cancellation</h2>
                {error ? (
                    <div className="text-center">
                        <p className="text-red-400 bg-red-500/10 p-4 rounded-md mb-4">{error}</p>
                        <button onClick={onClose} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Close</button>
                    </div>
                ) : (
                    <>
                        <p className="text-brand-light/80 mb-6">Are you sure you want to cancel this order? This action cannot be undone.</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={onClose} disabled={isLoading} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10 disabled:opacity-50">Keep Order</button>
                            <button onClick={onConfirm} disabled={isLoading} className="font-sans text-sm tracking-widest px-6 py-2 border border-red-500 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                                {isLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const OrderTracker: React.FC<{ status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' }> = ({ status }) => {
    const statuses = ['Processing', 'Shipped', 'Delivered'];
    const currentIndex = statuses.indexOf(status);

    if (status === 'Cancelled') {
        return (
            <div className="text-center py-6 border-y border-brand-gold/20 my-8">
                <p className="font-serif text-2xl text-red-400">Order Cancelled</p>
            </div>
        )
    }

    return (
        <div className="flex justify-between items-center px-4 md:px-8 py-6 border-y border-brand-gold/20 my-8">
            {statuses.map((s, index) => (
                <React.Fragment key={s}>
                    <div className="flex flex-col items-center text-center w-24">
                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${index <= currentIndex ? 'bg-brand-gold text-brand-dark border-brand-gold' : 'border-brand-gold/30 text-brand-gold'}`}>
                            {index <= currentIndex ? <Icon name="check" className="w-6 h-6" /> : <Icon name="truck" className="w-6 h-6" />}
                        </div>
                        <p className={`mt-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-500 ${index <= currentIndex ? 'text-brand-gold' : 'text-brand-light/50'}`}>{s}</p>
                    </div>
                    {index < statuses.length - 1 && (
                        <div className={`flex-grow h-1 mx-4 rounded transition-colors duration-500 ${index < currentIndex ? 'bg-brand-gold' : 'bg-brand-gold/30'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

const OrderDetailPage: React.FC = () => {
    const { orderId } = ReactRouterDOM.useParams<{ orderId: string }>();
    const { orders, updateOrderStatus, loading: ordersLoading } = useOrders();
    const { returnRequests, loading: returnsLoading } = useReturns();
    
    const [returnModalItem, setReturnModalItem] = useState<OrderItem | null>(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');

    const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId]);

    const handleConfirmCancel = async () => {
        if (!order) return;
        setIsCancelling(true);
        setCancelError('');
        try {
            const { error } = await updateOrderStatus(order.id, 'Cancelled');
            if (error) throw error;
            setIsCancelModalOpen(false);
        } catch (err: any) {
            setCancelError(`Failed to cancel order: ${err.message}.`);
        } finally {
            setIsCancelling(false);
        }
    };
    
    const handleOpenCancelModal = () => {
        setCancelError('');
        setIsCancelModalOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const getItemReturnRequest = (productId: string): ReturnRequest | undefined => {
        return returnRequests.find(req => req.orderId === orderId && req.productId === productId);
    };

    if (ordersLoading || returnsLoading) {
        return <div className="bg-brand-dark min-h-screen flex items-center justify-center text-brand-gold">Loading Order Details...</div>
    }

    if (!order) {
        return <NotFoundPage />;
    }

    return (
        <>
            {/* --- ON-SCREEN UI (completely hidden on print) --- */}
            <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in print:hidden">
                <Header />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
                    <div className="mb-8"><BackButton fallback="/order-history" /></div>

                    <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg p-6 md:p-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 pb-6 border-b border-brand-gold/20">
                            <div>
                                <Icon name="logo" className="w-40 h-12" />
                                <p className="text-brand-light/70 mt-2">Order Invoice</p>
                            </div>
                            <div className="text-left sm:text-right mt-4 sm:mt-0">
                                <h2 className="font-serif text-3xl text-brand-light">Order #{order.id.substring(0, 8)}</h2>
                                <p className="text-brand-light/70">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                                {order.shippingTrackingNumber && <p className="text-sm text-brand-light/70">Tracking: {order.shippingTrackingNumber}</p>}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-4 pb-4 border-b border-brand-gold/20">
                            <div>
                                <h3 className="font-serif text-xl text-brand-gold mb-2">Shipped To</h3>
                                <address className="not-italic text-brand-light/90">
                                    <strong>{order.shippingAddress.fullName}</strong><br />
                                    {order.shippingAddress.addressLine1}<br />
                                    {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}<br/>
                                    {order.shippingAddress.phone}
                                </address>
                            </div>
                            <div className="md:text-right">
                                <h3 className="font-serif text-xl text-brand-gold mb-2">Payment Details</h3>
                                <p className="text-brand-light/90"><strong>Method:</strong> {order.paymentMethod}</p>
                                <p className="text-brand-light/90"><strong>Payment ID:</strong> <span className="font-mono text-sm">{order.paymentId}</span></p>
                            </div>
                        </div>
                        
                        <OrderTracker status={order.status} />
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-brand-gold/20">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold uppercase tracking-wider">Item</th>
                                        <th className="p-3 text-sm font-semibold uppercase tracking-wider text-right">Price</th>
                                        <th className="p-3 text-sm font-semibold uppercase tracking-wider text-center">Qty</th>
                                        <th className="p-3 text-sm font-semibold uppercase tracking-wider text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-gold/20">
                                    {order.items.map(item => {
                                        const returnRequest = getItemReturnRequest(item.productId);
                                        return (
                                            <tr key={item.productId}>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-4">
                                                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md hidden sm:block" />
                                                        <div>
                                                            <ReactRouterDOM.Link to={`/product/${item.productId}`} className="font-semibold text-brand-light hover:text-brand-gold">
                                                                {item.name}
                                                            </ReactRouterDOM.Link>
                                                             {returnRequest && <div className="mt-1 text-xs text-yellow-400">Return Request: {returnRequest.status}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right font-mono">₹{item.price.toFixed(2)}</td>
                                                <td className="p-3 text-center font-mono">{item.quantity}</td>
                                                <td className="p-3 text-right font-mono font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end mt-6">
                            <div className="w-full max-w-sm space-y-2 text-brand-light/90">
                                <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">₹{order.subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>GST</span><span className="font-mono">₹{order.gst.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Shipping</span><span className="font-mono">₹{order.shippingFee.toFixed(2)}</span></div>
                                {order.couponDiscount && <div className="flex justify-between text-green-400"><span>Discount ({order.couponCode})</span><span className="font-mono">- ₹{order.couponDiscount.toFixed(2)}</span></div>}
                                <div className="border-t border-brand-gold/20 my-2"></div>
                                <div className="flex justify-between font-bold text-xl text-brand-light"><span>TOTAL</span><span className="font-mono">₹{order.totalPrice.toFixed(2)}</span></div>
                            </div>
                        </div>
                        
                        <div className="mt-10 pt-6 border-t border-brand-gold/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                {order.status === 'Processing' && <button onClick={handleOpenCancelModal} className="font-sans text-sm tracking-widest px-6 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors uppercase">Cancel Order</button>}
                                {order.status === 'Delivered' && <p className="text-sm text-green-400">This order has been delivered.</p>}
                            </div>
                            <button onClick={handlePrint} className="flex items-center gap-2 font-sans text-sm tracking-widest px-6 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors uppercase">
                               <Icon name="print" className="w-5 h-5"/> Print Invoice
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
                
                {returnModalItem && <ReturnModal item={returnModalItem} orderId={order.id} onClose={() => setReturnModalItem(null)} />}
                <CancelOrderModal
                    isOpen={isCancelModalOpen}
                    onClose={() => setIsCancelModalOpen(false)}
                    onConfirm={handleConfirmCancel}
                    isLoading={isCancelling}
                    error={cancelError}
                />
            </div>

            {/* --- PRINT-ONLY RECEIPT (only visible on print) --- */}
            <div className="hidden print:block printable-receipt">
                <div className="text-center my-2">
                    <h1 className="text-lg font-bold uppercase">whYYOuts</h1>
                    <p className="text-xs">Thank you for your order!</p>
                </div>
                <p className="text-center text-xs">****************************************</p>
                <div className="space-y-0.5 text-xs my-2">
                    <p><strong>Order:</strong> #{order.id.substring(0, 8)}</p>
                    <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                    <p><strong>To:</strong> {order.shippingAddress.fullName}</p>
                    <p><strong>Payment:</strong> {order.paymentMethod}</p>
                </div>
                <p className="text-center text-xs">****************************************</p>
                <div className="my-2">
                    {order.items.map(item => (
                        <div key={item.productId} className="text-xs mb-1">
                            <p className="font-bold">{item.name}</p>
                            <div className="flex justify-between">
                                <p className="pl-2">{item.quantity} x ₹{item.price.toFixed(2)}</p>
                                <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-center text-xs">----------------------------------------</p>
                <div className="space-y-0.5 text-xs my-2">
                    <div className="flex justify-between"><span>Subtotal:</span><span>₹{order.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>GST:</span><span>₹{order.gst.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Shipping:</span><span>₹{order.shippingFee.toFixed(2)}</span></div>
                    {order.couponDiscount && (
                        <div className="flex justify-between"><span>Discount:</span><span>- ₹{order.couponDiscount.toFixed(2)}</span></div>
                    )}
                </div>
                <p className="text-center text-xs">----------------------------------------</p>
                <div className="flex justify-between font-bold text-sm my-2">
                    <span>TOTAL:</span><span>₹{order.totalPrice.toFixed(2)}</span>
                </div>
                <p className="text-center text-xs">****************************************</p>
                <div className="text-center text-xs mt-2">
                    <p>All prices in INR. This is not a tax invoice.</p>
                    <p>www.whyyouts.com</p>
                </div>
            </div>
        </>
    );
};

export default OrderDetailPage;