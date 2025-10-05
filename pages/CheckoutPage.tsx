import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartState, useCartActions } from '../hooks/useCart.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useOrders } from '../hooks/useOrders.ts';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import type { Order, OrderItem } from '../types.ts';
import Icon from '../components/Icon.tsx';
import { supabase } from '../supabase.ts';
import { ADMIN_USER_ID } from '../constants.ts';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = 'rzp_live_RMZDZHJlb9ehyI'; // Public live key

type PaymentMethod = 'cod' | 'razorpay';

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

const CheckoutPage: React.FC = () => {
  const { cartItems, subtotal, gstAmount, gstPercentage, platformFee, shippingFee, grandTotal, itemCount, couponCode, couponDiscount, couponMessage } = useCartState();
  const { clearCart, setShippingFee, applyCoupon, removeCoupon } = useCartActions();
  const { user, updateUser } = useAuth();
  const { addOrder } = useOrders();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  const initialAddress = useMemo(() => {
    try {
      const saved = sessionStorage.getItem('checkoutAddress');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Could not parse saved checkout address", e); }
    return {
        fullName: user?.fullName || '', phone: user?.phone || '',
        addressLine1: user?.addressLine1 || '', addressLine2: user?.addressLine2 || '',
        city: user?.city || '', state: user?.state || '', country: user?.country || 'India', zip: user?.zip || '',
    };
  }, [user]);

  const [fullName, setFullName] = useState(initialAddress.fullName);
  const [phone, setPhone] = useState(initialAddress.phone);
  const [addressLine1, setAddressLine1] = useState(initialAddress.addressLine1);
  const [addressLine2, setAddressLine2] = useState(initialAddress.addressLine2);
  const [city, setCity] = useState(initialAddress.city);
  const [state, setState] = useState(initialAddress.state);
  const [country, setCountry] = useState(initialAddress.country);
  const [zip, setZip] = useState(initialAddress.zip);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
  const [couponInput, setCouponInput] = useState('');
  const [shippingSettings, setShippingSettings] = useState({ discount: 0, baseFee: 0, codFee: 15 });

  useEffect(() => {
    const fetchShippingSettings = async () => {
        const { data } = await supabase.from('site_settings').select('global_shipping_discount_percentage, base_shipping_fee, cod_fee').single();
        if (data) {
            setShippingSettings({
                discount: data.global_shipping_discount_percentage || 0,
                baseFee: data.base_shipping_fee || 0,
                codFee: data.cod_fee || 15,
            });
        }
    };
    fetchShippingSettings();
  }, []);

  useEffect(() => {
    const codFee = paymentMethod === 'cod' ? shippingSettings.codFee : 0;
    const totalBaseFee = shippingSettings.baseFee + codFee;
    const discountedFee = totalBaseFee * (1 - (shippingSettings.discount / 100));
    setShippingFee(discountedFee);
  }, [paymentMethod, setShippingFee, shippingSettings]);
  
  useEffect(() => {
    // Clear shipping fee on unmount
    return () => {
      setShippingFee(0);
    };
  }, [setShippingFee]);

  // Persist address changes to session storage
  useEffect(() => {
    const address = { fullName, phone, addressLine1, addressLine2, city, state, country, zip };
    sessionStorage.setItem('checkoutAddress', JSON.stringify(address));
  }, [fullName, phone, addressLine1, addressLine2, city, state, country, zip]);


  const handleApplyCoupon = async () => {
    if (couponInput.trim()) {
        await applyCoupon(couponInput.trim());
    }
  };
  
  const createOrder = async (method: Order['paymentMethod'], paymentId?: string) => {
    if (!user) return;
    setIsProcessing(true);
    setOrderError(null);

    const orderItems: OrderItem[] = cartItems.map(item => ({
      productId: item.id, name: item.name, price: item.price, quantity: item.quantity,
      image: item.image, sellerId: item.sellerId, sellerBusinessName: item.sellerBusinessName,
      selectedSize: item.selectedSize, selectedColor: item.selectedColor, returnDays: item.returnDays,
    }));

    const newOrderData: Omit<Order, 'id'> = {
        userId: user.id, items: orderItems, subtotal: subtotal, gst: gstAmount, platformFee: platformFee,
        shippingFee: shippingFee, totalPrice: grandTotal, orderDate: new Date().toISOString(), status: 'Processing',
        shippingAddress: { fullName, phone, addressLine1, addressLine2, city, state, country, zip },
        shippingTrackingNumber: `TRK${Date.now()}`, paymentId: paymentId || method, paymentMethod: method,
        couponCode: couponCode || undefined, couponDiscount: couponDiscount || undefined,
    };

    const { data: newOrder, error } = await addOrder(newOrderData);

    if (error) {
        let userFriendlyMessage = 'There was an error placing your order. Please check your details and try again.';
        console.error("Order placement error:", error);
        setOrderError(userFriendlyMessage);
        setIsProcessing(false);
    } else if (newOrder) {
        // --- Secure Notification Logic ---
        const notificationPromises = [];

        // 1. Notify customer (direct insert is OK as user owns the row)
        notificationPromises.push(supabase.from('notifications').insert({
            user_id: newOrder.userId,
            order_id: newOrder.id,
            message: `Your order #${newOrder.id.substring(0, 8)} has been placed successfully!`,
        }));

        // 2. Group items by seller and notify each seller
        const sellerItemsMap = new Map<string, OrderItem[]>();
        newOrder.items.forEach(item => {
            if (item.sellerId !== ADMIN_USER_ID) { // Don't notify admin as a seller
                const items = sellerItemsMap.get(item.sellerId) || [];
                items.push(item);
                sellerItemsMap.set(item.sellerId, items);
            }
        });

        for (const [sellerId, items] of sellerItemsMap.entries()) {
            const message = `You have a new order (#${newOrder.id.substring(0, 8)}) for ${items.length} product(s).`;
            notificationPromises.push(createNotification(sellerId, newOrder.id, message));
        }

        // 3. Notify admin
        if (ADMIN_USER_ID) {
            const message = `Order #${newOrder.id.substring(0, 8)} has been placed and requires processing.`;
            notificationPromises.push(createNotification(ADMIN_USER_ID, newOrder.id, message));
        }

        // Wait for all notifications to be processed
        await Promise.all(notificationPromises);

        // --- Post-Notification Logic ---
        const addressChanged = 
            user.fullName !== fullName || user.phone !== phone || user.addressLine1 !== addressLine1 ||
            (user.addressLine2 || '') !== (addressLine2 || '') || user.city !== city ||
            user.state !== state || user.country !== country || user.zip !== zip;

        if (addressChanged) {
            await updateUser({ fullName, phone, addressLine1, addressLine2, city, state, country, zip });
        }
        
        await clearCart();
        sessionStorage.removeItem('checkoutAddress');
        navigate(`/order/${newOrder.id}`, { replace: true, state: { fromCheckout: true } });
    }
    // No need to set isProcessing to false here as we navigate away on success
  };

  const handleRazorpayPayment = () => {
    if (!user) {
      setOrderError('You must be logged in to complete the payment.');
      return;
    }
    setIsProcessing(true);

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(grandTotal * 100), // amount in the smallest currency unit (paisa)
      currency: "INR",
      name: "whYYOuts",
      description: `Order for ${itemCount} item(s)`,
      image: "/favicon.svg",
      handler: async (response: any) => {
        await createOrder('Razorpay', response.razorpay_payment_id);
      },
      prefill: {
        name: fullName,
        email: user.email,
        contact: phone,
      },
      notes: {
        address: `${addressLine1}, ${city}`,
      },
      theme: {
        color: "#BFA181",
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          setOrderError('Payment was cancelled.');
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error("Razorpay Error:", e);
      setOrderError("Could not initiate payment. Please try again or select another method.");
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    if (paymentMethod === 'cod') {
        createOrder('Cash on Delivery');
    } else if (paymentMethod === 'razorpay') {
        handleRazorpayPayment();
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
                    <Link to="/shop" className="mt-8 inline-block font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
                        Back to Shop
                    </Link>
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
        <div className="mb-8"><BackButton fallback="/cart" /></div>
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg p-6 space-y-8">
                <div>
                    <h2 className="font-serif text-2xl text-brand-light mb-4">Shipping Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label htmlFor="fullName" className={formLabelClass}>Full Name</label><input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className={formInputClass} /></div>
                        <div><label htmlFor="phone" className={formLabelClass}>Phone Number</label><input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className={formInputClass} /></div>
                        <div className="md:col-span-2"><label htmlFor="addressLine1" className={formLabelClass}>Address Line 1</label><input type="text" id="addressLine1" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} required className={formInputClass} placeholder="House No., Building, Street, Area"/></div>
                        <div className="md:col-span-2"><label htmlFor="addressLine2" className={formLabelClass}>Address Line 2 (Optional)</label><input type="text" id="addressLine2" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} className={formInputClass} placeholder="Apartment, suite, unit, etc."/></div>
                        <div><label htmlFor="city" className={formLabelClass}>City</label><input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} required className={formInputClass} /></div>
                        <div><label htmlFor="state" className={formLabelClass}>State / Province</label><input type="text" id="state" value={state} onChange={e => setState(e.target.value)} required className={formInputClass} /></div>
                        <div><label htmlFor="zip" className={formLabelClass}>Pincode / ZIP</label><input type="text" id="zip" value={zip} onChange={e => setZip(e.target.value)} required className={formInputClass} /></div>
                        <div><label htmlFor="country" className={formLabelClass}>Country</label><input type="text" id="country" value={country} onChange={e => setCountry(e.target.value)} required className={formInputClass} /></div>
                    </div>
                </div>
                <div>
                    <h2 className="font-serif text-2xl text-brand-light mb-4">Payment Method</h2>
                    <div className="space-y-4">
                        <div onClick={() => setPaymentMethod('razorpay')} className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'bg-brand-gold/10 border-brand-gold' : 'border-brand-gold/20 hover:border-brand-gold/50'}`}>
                            <div className="flex items-center"><Icon name="secure-payment" className="w-6 h-6 mr-3 text-brand-gold" /><span className="font-semibold">Razorpay</span></div>
                            <p className="text-xs text-brand-light/70 mt-1 ml-9">Credit/Debit Card, UPI, Netbanking, Wallets.</p>
                        </div>
                        <div onClick={() => setPaymentMethod('cod')} className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'bg-brand-gold/10 border-brand-gold' : 'border-brand-gold/20 hover:border-brand-gold/50'}`}>
                            <div className="flex items-center"><Icon name="wallet" className="w-6 h-6 mr-3 text-brand-gold" /><span className="font-semibold">Cash on Delivery</span></div>
                            <p className="text-xs text-brand-light/70 mt-1 ml-9">Pay with cash upon delivery. A ₹{shippingSettings.codFee} fee will be applied.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg p-6 h-fit">
                <h2 className="font-serif text-2xl text-brand-light mb-4">Order Summary</h2>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {cartItems.map(item => (
                        <div key={item.cartItemId} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3"><img src={item.image} alt={item.name} className="w-12 h-12 rounded-md object-cover" /><div><p className="text-brand-light font-semibold">{item.name}</p><p className="text-brand-light/70">Qty: {item.quantity}</p></div></div><p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
                <div className="border-t border-brand-gold/20 my-4"></div>
                
                <div className="mb-4">
                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="coupon-checkout" 
                        value={couponInput} 
                        onChange={(e) => setCouponInput(e.target.value)} 
                        placeholder="Coupon Code" 
                        className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold" 
                        disabled={!!couponCode}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); }}}
                      />
                      <button type="button" onClick={handleApplyCoupon} className="px-4 py-2 text-sm font-semibold bg-brand-gold/20 border border-brand-gold/50 text-brand-gold rounded-md hover:bg-brand-gold/30 transition-colors disabled:opacity-50" disabled={!!couponCode || !couponInput.trim()}>
                        Apply
                      </button>
                  </div>
                </div>
                {couponMessage && <p className={`text-xs mb-2 ${couponMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{couponMessage.text}</p>}

                <div className="space-y-2 text-brand-light/90">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>GST ({gstPercentage}%)</span><span>₹{gstAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Platform Fee</span><span>₹{platformFee.toFixed(2)}</span></div>
                    {couponCode && (<div className="flex justify-between items-center text-green-400"><span>Discount ({couponCode})</span><div className='flex items-center'><span>- ₹{couponDiscount.toFixed(2)}</span><button onClick={removeCoupon} className="text-xs text-red-400 hover:underline ml-2 p-1">[Remove]</button></div></div>)}
                    <div className="flex justify-between"><span>Shipping</span><span>{shippingFee > 0 ? `₹${shippingFee.toFixed(2)}` : 'Free'}</span></div>
                    <div className="border-t border-brand-gold/20 my-2"></div>
                    <div className="flex justify-between font-bold text-lg text-brand-light"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
                </div>
                 {orderError && (<div className="mt-4 text-center text-red-400 bg-red-500/10 p-3 rounded-md text-sm"><p>{orderError}</p></div>)}
                <button type="submit" disabled={isProcessing} className="mt-6 w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed">
                    {isProcessing ? 'Processing...' : (paymentMethod === 'cod' ? `Place Order` : `Pay ₹${grandTotal.toFixed(2)}`)}
                </button>
            </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;