import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useCart } from '../hooks/useCart.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useOrders } from '../hooks/useOrders.ts';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import type { Order } from '../types.ts';
import Icon from '../components/Icon.tsx';

const CheckoutPage: React.FC = () => {
  const { cartItems, totalPrice, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const { addOrder } = useOrders();
  const navigate = ReactRouterDOM.useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState(user?.pincode || '');

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        alert("You must be logged in to place an order.");
        return;
    }

    setIsProcessing(true);
    
    const newOrder: Omit<Order, 'id'> = {
        userId: user.id,
        items: cartItems,
        totalPrice,
        orderDate: new Date().toISOString(),
        status: 'Processing',
        shippingAddress: { fullName, address, city, zip },
        trackingNumber: `TRK${Date.now()}`
    };

    const { error } = await addOrder(newOrder);
    if (error) {
      alert('There was an error placing your order. Please try again.');
      setIsProcessing(false);
    } else {
      clearCart();
      alert(`Order placed successfully! Thank you for shopping with whYYOuts.`);
      navigate('/order-history');
    }
  };
  
  const formInputClass = "mt-1 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
  const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

  if (itemCount === 0 && !isProcessing) {
     return (
        <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
            <Header />
            <main className="flex-grow flex items-center justify-center">
                <div className="text-center p-12">
                    <h1 className="text-2xl font-bold font-serif text-brand-light">Your cart is empty.</h1>
                    <p className="mt-2 text-brand-light/70">Please add items to your cart before proceeding to checkout.</p>
                    <ReactRouterDOM.Link to="/shop" className="mt-8 inline-block font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
                        Back to Shop
                    </ReactRouterDOM.Link>
                </div>
            </main>
            <Footer />
        </div>
    );
  }

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8"><BackButton /></div>
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg p-6 space-y-8">
                <div>
                    <h2 className="font-serif text-2xl text-brand-light mb-4">Shipping Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="fullName" className={formLabelClass}>Full Name</label>
                            <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className={formInputClass} />
                        </div>
                        <div>
                            <label htmlFor="address" className={formLabelClass}>Address</label>
                            <input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} required className={formInputClass} />
                        </div>
                        <div>
                            <label htmlFor="city" className={formLabelClass}>City</label>
                            <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} required className={formInputClass} />
                        </div>
                        <div>
                            <label htmlFor="zip" className={formLabelClass}>Pincode / ZIP</label>
                            <input type="text" id="zip" value={zip} onChange={e => setZip(e.target.value)} required className={formInputClass} />
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="font-serif text-2xl text-brand-light mb-4">Payment Method</h2>
                    <div className="space-y-4">
                        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-brand-gold bg-brand-gold/10' : 'border-brand-gold/30'}`}>
                            <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="form-radio bg-black/20 border-brand-gold/50 text-brand-gold focus:ring-brand-gold"/>
                            <span className="ml-4 font-semibold">Credit/Debit Card</span>
                        </label>
                        {/* More payment options could be added here */}
                    </div>
                </div>
            </div>

            <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg p-6 h-fit">
                <h2 className="font-serif text-2xl text-brand-light mb-4">Order Summary</h2>
                <div className="space-y-4">
                    {cartItems.map(item => (
                        <div key={item.cartItemId} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-md object-cover" />
                                <div>
                                    <p className="text-brand-light font-semibold">{item.name}</p>
                                    <p className="text-brand-light/70">Qty: {item.quantity}</p>
                                </div>
                            </div>
                            <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
                <div className="border-t border-brand-gold/20 my-4"></div>
                <div className="space-y-2 text-brand-light/90">
                    <div className="flex justify-between"><span>Subtotal</span><span>${totalPrice.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
                    <div className="border-t border-brand-gold/20 my-2"></div>
                    <div className="flex justify-between font-bold text-lg text-brand-light"><span>Total</span><span>${totalPrice.toFixed(2)}</span></div>
                </div>
                <button type="submit" disabled={isProcessing} className="mt-6 w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed">
                    {isProcessing ? 'Processing...' : `Place Order`}
                </button>
            </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
