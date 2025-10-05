import React, { useState, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useOrders } from '../hooks/useOrders.ts';
import type { Order, OrderItem, ReturnRequest } from '../types.ts';
import NotFoundPage from './NotFoundPage.tsx';
import Icon from '../components/Icon.tsx';
import { useReturns } from '../hooks/useReturns.ts';

const ReturnRequestModal: React.FC<{ orderId: string; item: OrderItem; onClose: () => void; }> = ({ orderId, item, onClose }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [otherReason, setOtherReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const { createReturnRequest } = useReturns();

    const returnReasons = [
        "Item is defective or not working",
        "Received the wrong item",
        "Item doesn't match the description or photos",
        "Size/fit issue",
        "Arrived too late",
        "No longer needed",
        "Other",
    ];

    const handleSubmit = async () => {
        const finalReason = selectedReason === 'Other' ? otherReason.trim() : selectedReason;
        
        if (!finalReason) {
            setMessage('Please select a reason for the return.');
            return;
        }
        setIsSubmitting(true);
        const { data, error } = await createReturnRequest(orderId, item.productId, finalReason);
        setIsSubmitting(false);

        if (error) {
            setMessage('Failed to create return request. Please try again.');
            console.error(error);
        } else if (data) {
            setMessage('Return request submitted successfully.');
            setTimeout(() => onClose(), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-brand-light/70 hover:text-white">&times;</button>
                <h2 className="font-serif text-2xl text-brand-gold mb-4">Request Return</h2>
                <div className="flex items-center gap-4 mb-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                    <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-brand-light/70">Qty: {item.quantity}</p>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-gold mb-2">Reason for Return</label>
                    <div className="space-y-3">
                        {returnReasons.map(reason => (
                            <label key={reason} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="return-reason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="form-radio"
                                />
                                <span className="text-brand-light/90">{reason}</span>
                            </label>
                        ))}
                    </div>

                    {selectedReason === 'Other' && (
                        <div className="mt-4 transition-all duration-300">
                             <label htmlFor="otherReason" className="block text-sm font-medium text-brand-gold mb-2">Please provide more details</label>
                            <textarea
                                id="otherReason"
                                value={otherReason}
                                onChange={e => setOtherReason(e.target.value)}
                                rows={3}
                                className="w-full bg-black/50 border border-brand-gold/30 rounded-md py-2 px-3"
                                placeholder="Explain the issue..."
                            />
                        </div>
                    )}
                </div>
                {message && <p className={`text-sm mt-4 text-center ${message.startsWith('Failed') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} disabled={isSubmitting} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark disabled:opacity-50">
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isAdmin } = useAuth();
  const { orders, loading, updateOrderStatus } = useOrders();
  const location = useLocation();
  const [isCancelling, setIsCancelling] = useState(false);
  const [returnModalItem, setReturnModalItem] = useState<OrderItem | null>(null);
  const { returnRequests } = useReturns();

  const order = useMemo(() => orders.find(o => o.id === orderId), [orders, orderId]);
  const showSuccessBanner = location.state?.fromCheckout;

  const isAuthorizedToView = useMemo(() => {
    if (!user || !order) return false;
    if (isAdmin) return true; // Admins can see everything
    if (order.userId === user.id) return true; // Customer who placed the order can see it
    if (user.role === 'seller') {
        // Seller can see the order if it contains at least one of their items
        return order.items.some(item => item.sellerId === user.id);
    }
    return false;
  }, [user, order, isAdmin]);

  const handleCancelOrder = async () => {
    if (order && window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
        setIsCancelling(true);
        await updateOrderStatus(order.id, 'Cancelled');
        setIsCancelling(false);
    }
  };
  
  const isReturnEligible = (item: OrderItem): boolean => {
    if (!order || !order.deliveryDate || typeof item.returnDays !== 'number' || item.returnDays < 0) {
        return false;
    }
    const deliveryDate = new Date(order.deliveryDate);
    const returnDeadline = new Date(deliveryDate);
    returnDeadline.setDate(deliveryDate.getDate() + item.returnDays);
    returnDeadline.setHours(23, 59, 59, 999); // Set to end of the last day for an inclusive window
    const now = new Date();
    return now <= returnDeadline;
  };

  const getDaysLeftToReturn = (item: OrderItem, order: Order): number => {
    if (!order.deliveryDate || typeof item.returnDays !== 'number' || item.returnDays < 0) {
        return 0;
    }
    const deliveryDate = new Date(order.deliveryDate);
    const returnDeadline = new Date(deliveryDate);
    returnDeadline.setDate(deliveryDate.getDate() + item.returnDays);
    returnDeadline.setHours(23, 59, 59, 999);
    const now = new Date();
    const diffTime = returnDeadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getReturnStatusForItem = (productId: string) => {
    if (!order) return null;
    const request = returnRequests.find(r => r.orderId === order.id && r.productId === productId);
    return request ? request.status : null;
  };


  if (loading) {
    return (
        <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans">
            <Header />
            <main className="flex-grow flex items-center justify-center">
                <p>Loading order details...</p>
            </main>
            <Footer />
        </div>
    );
  }

  if (!order || !isAuthorizedToView) {
    return <NotFoundPage />;
  }

  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-500/20 text-yellow-400';
      case 'Shipped': return 'bg-blue-500/20 text-blue-400';
      case 'Delivered': return 'bg-green-500/20 text-green-400';
      case 'Cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };
  
  const getReturnStatusClass = (status: ReturnRequest['status'] | null) => {
    if (!status) return '';
    switch(status) {
      case 'Pending': return 'text-yellow-400';
      case 'Approved': return 'text-green-400';
      case 'Rejected': return 'text-red-400';
      default: return '';
    }
  };

  const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
      <div className="bg-black/20 p-6 rounded-lg">
          <h2 className="font-serif text-xl text-brand-gold mb-4">{title}</h2>
          <div className="space-y-2 text-sm">{children}</div>
      </div>
  );

  const Receipt: React.FC<{ order: Order }> = ({ order }) => (
    <div className="hidden print:block printable-receipt">
        <h1 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '12pt', fontWeight: 'bold' }}>whYYOuts</h1>
        <p style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '8pt' }}>https://www.whyyouts.com/</p>
        <p>Order ID: {order.id.substring(0,8)}</p>
        <p>Date: {new Date(order.orderDate).toLocaleString()}</p>
        <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
        <table style={{ width: '100%', fontSize: '8pt' }}>
            <thead>
                <tr>
                    <th style={{ textAlign: 'left' }}>Item</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                </tr>
            </thead>
            <tbody>
                {order.items.map((item, i) => (
                    <tr key={i}>
                        <td>{item.name}</td>
                        <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
        <table style={{ width: '100%', fontSize: '8pt' }}>
             <tbody>
                <tr><td>Subtotal:</td><td style={{ textAlign: 'right' }}>₹{order.subtotal.toFixed(2)}</td></tr>
                {order.couponDiscount && <tr><td>Discount:</td><td style={{ textAlign: 'right' }}>- ₹{order.couponDiscount.toFixed(2)}</td></tr>}
                <tr><td>Shipping:</td><td style={{ textAlign: 'right' }}>₹{order.shippingFee.toFixed(2)}</td></tr>
                <tr><td>GST:</td><td style={{ textAlign: 'right' }}>₹{order.gst.toFixed(2)}</td></tr>
                <tr><td style={{fontWeight: 'bold'}}>Total:</td><td style={{ textAlign: 'right', fontWeight: 'bold'}}>₹{order.totalPrice.toFixed(2)}</td></tr>
             </tbody>
        </table>
        <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
        <p style={{ textAlign: 'center', fontSize: '8pt', margin: '10px 0 0 0' }}>Thank you for your purchase!</p>
    </div>
  );

  return (
    <>
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in print:hidden">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <BackButton fallback={isAdmin ? "/admin/orders" : "/order-history"} />
        </div>

        {showSuccessBanner && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 p-4 rounded-lg mb-6 text-center">
                <p className="font-bold">Thank you! Your order has been placed successfully.</p>
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h1 className="font-serif text-3xl text-brand-light">Order #{order.id.substring(0, 8)}</h1>
                <p className="text-brand-light/70 mt-1">Placed on {new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => window.print()} className="p-2 text-brand-light/70 hover:text-white" aria-label="Print receipt">
                    <Icon name="print" className="w-5 h-5"/>
                </button>
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${getStatusClass(order.status)}`}>{order.status}</span>
                {order.status === 'Processing' && user?.id === order.userId && (
                    <button 
                        onClick={handleCancelOrder} 
                        disabled={isCancelling}
                        className="font-sans text-sm tracking-widest px-4 py-1.5 border border-red-500/50 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                        {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                )}
            </div>
        </div>
        
        <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg p-6">
            <h2 className="font-serif text-xl text-brand-gold mb-4">Items in this order</h2>
            <div className="space-y-6">
                {order.items.map((item, index) => {
                    const returnStatus = getReturnStatusForItem(item.productId);
                    const isEligible = isReturnEligible(item);
                    const daysLeft = isEligible ? getDaysLeftToReturn(item, order) : 0;
                    return (
                        <div key={index} className="flex flex-col sm:flex-row justify-between items-start border-b border-brand-gold/10 pb-4 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-4">
                                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                                <div>
                                    <Link to={`/product/${item.productId}`} className="font-semibold text-brand-light hover:text-brand-gold">{item.name}</Link>
                                    <p className="text-sm text-brand-light/70">Qty: {item.quantity} &times; ₹{item.price.toFixed(2)}</p>
                                    {item.sellerBusinessName && <p className="text-xs text-brand-light/60">Sold by: {item.sellerBusinessName}</p>}
                                    {item.selectedSize && <p className="text-xs text-brand-light/60">Size: {item.selectedSize}</p>}
                                </div>
                            </div>
                            <div className="flex flex-col items-end mt-4 sm:mt-0">
                                <p className="font-bold text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                                 {order.status === 'Delivered' && !isAdmin && (
                                    <>
                                        {returnStatus ? (
                                             <p className={`text-sm mt-2 font-semibold ${getReturnStatusClass(returnStatus)}`}>
                                                Return Request: {returnStatus}
                                            </p>
                                        ) : isEligible ? (
                                            <div className="text-right mt-2">
                                                <button onClick={() => setReturnModalItem(item)} className="text-sm text-brand-gold hover:underline">Request Return</button>
                                                <p className="text-xs text-brand-light/60">({daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to return)</p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-brand-light/60 mt-2">Return Window Closed</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <DetailSection title="Shipping Address">
                <p className="font-semibold">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
                <p>Phone: {order.shippingAddress.phone}</p>
            </DetailSection>

            <DetailSection title="Payment Details">
                <p className="flex justify-between"><span>Method:</span> <span className="font-semibold">{order.paymentMethod}</span></p>
                <p className="flex justify-between"><span>Payment ID:</span> <span className="font-mono text-xs">{order.paymentId.substring(0, 15)}...</span></p>
            </DetailSection>

            <DetailSection title="Order Summary">
                <p className="flex justify-between"><span>Subtotal:</span> <span>₹{order.subtotal.toFixed(2)}</span></p>
                <p className="flex justify-between"><span>GST:</span> <span>₹{order.gst.toFixed(2)}</span></p>
                <p className="flex justify-between"><span>Platform Fee:</span> <span>₹{order.platformFee.toFixed(2)}</span></p>
                <p className="flex justify-between"><span>Shipping:</span> <span>₹{order.shippingFee.toFixed(2)}</span></p>
                {order.couponDiscount && (
                    <p className="flex justify-between text-green-400"><span>Discount ({order.couponCode}):</span> <span>- ₹{order.couponDiscount.toFixed(2)}</span></p>
                )}
                <div className="border-t border-brand-gold/20 my-2"></div>
                <p className="flex justify-between font-bold text-lg"><span>Total:</span> <span>₹{order.totalPrice.toFixed(2)}</span></p>
            </DetailSection>
        </div>

      </main>
      <Footer />
    </div>
    {returnModalItem && <ReturnRequestModal orderId={order.id} item={returnModalItem} onClose={() => setReturnModalItem(null)} />}
    <Receipt order={order} />
    </>
  );
};

export default OrderDetailPage;