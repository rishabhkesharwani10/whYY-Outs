import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCartState, useCartActions } from '../hooks/useCart.ts';
import Icon from '../components/Icon.tsx';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import type { CartItem } from '../types.ts';

interface CartItemRowProps {
  item: CartItem;
  onRemove: (cartItemId: string) => void;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  isUpdating: boolean;
  isRemoving: boolean;
  priceFlashId: string | null;
}

const CartItemRow = React.memo<CartItemRowProps>(({ item, onRemove, onUpdateQuantity, isUpdating, isRemoving, priceFlashId }) => {
  return (
    <div 
      className={`flex flex-col sm:flex-row items-center justify-between border-b border-brand-gold/20 pb-6 last:border-b-0 transition-all duration-300 ease-out ${isRemoving ? 'opacity-0 -translate-x-full max-h-0 py-0 border-none' : 'max-h-96'}`}
      style={{ transitionProperty: 'opacity, transform, max-height, padding, border' }}
    >
      <div className="flex items-center mb-4 sm:mb-0 w-full sm:w-auto">
        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg mr-4"/>
        <div>
          <Link to={`/product/${item.id}`} className="text-lg font-semibold text-brand-light hover:text-brand-gold">{item.name}</Link>
          {item.sellerBusinessName && (
            <p className="text-brand-light/70 text-sm mt-1">
              Sold by: {item.sellerBusinessName}
            </p>
          )}
          {item.selectedSize && <p className="text-brand-light/70 text-sm mt-1">Size: {item.selectedSize}</p>}
          {item.selectedColor && (
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="text-brand-light/70">Color: {item.selectedColor}</span>
              <div className="w-4 h-4 rounded-full border border-brand-light/50" style={{ backgroundColor: item.selectedColor.toLowerCase() }}></div>
            </div>
          )}
          <p className="text-brand-light/70 text-sm">Price: ₹{item.price.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-brand-gold/50 rounded-md">
          <button onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)} disabled={isUpdating} className="p-2 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50"><Icon name="minus" className="w-4 h-4" /></button>
          <span className="px-4 font-semibold w-12 text-center">
            {isUpdating ? <div className="w-4 h-4 mx-auto border-2 border-brand-gold/50 border-t-brand-gold rounded-full animate-spin"></div> : item.quantity}
          </span>
          <button onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)} disabled={isUpdating} className="p-2 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50"><Icon name="plus" className="w-4 h-4" /></button>
        </div>
        <p className={`text-lg font-bold w-24 text-right transition-colors duration-500 ${priceFlashId === item.cartItemId ? 'text-brand-gold' : ''}`}>₹{(item.price * item.quantity).toFixed(2)}</p>
        <button onClick={() => onRemove(item.cartItemId)} className="text-brand-light/70 hover:text-red-500 transition-colors"><Icon name="trash" className="w-5 h-5"/></button>
      </div>
    </div>
  );
});


const CartPage: React.FC = () => {
  const { cartItems, itemCount, subtotal, gstAmount, gstPercentage, platformFee, grandTotal, couponCode, couponDiscount, couponMessage, updatingItemId } = useCartState();
  const { removeFromCart, updateQuantity, applyCoupon, removeCoupon } = useCartActions();
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [priceFlashId, setPriceFlashId] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState(() => sessionStorage.getItem('cartCouponInput') || '');

  useEffect(() => {
    sessionStorage.setItem('cartCouponInput', couponInput);
  }, [couponInput]);

  const handleRemove = useCallback((cartItemId: string) => {
    setRemovingItemId(cartItemId);
    setTimeout(() => {
      removeFromCart(cartItemId);
      setRemovingItemId(null);
    }, 300);
  }, [removeFromCart]);
  
  const handleUpdateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    await updateQuantity(cartItemId, quantity);
    setPriceFlashId(cartItemId);
    setTimeout(() => setPriceFlashId(null), 500);
  }, [updateQuantity]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
      e.preventDefault();
      if (couponInput.trim()) {
          await applyCoupon(couponInput.trim());
          setCouponInput('');
          sessionStorage.removeItem('cartCouponInput');
      }
  }

  if (itemCount === 0) {
    return (
      <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-12">
            <h1 className="text-3xl font-bold font-serif text-brand-light">Your Cart is Empty</h1>
            <p className="mt-2 text-brand-light/70">Looks like you haven't added anything to your cart yet.</p>
            <Link to="/shop" className="mt-8 inline-block font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
              Start Shopping
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
        <div className="mb-8">
          <BackButton fallback="/shop" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-6">
            <h1 className="text-2xl font-bold font-serif text-brand-light mb-6">Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})</h1>
            <div className="space-y-6">
              {cartItems.map(item => (
                <CartItemRow
                  key={item.cartItemId}
                  item={item}
                  onRemove={handleRemove}
                  onUpdateQuantity={handleUpdateQuantity}
                  isUpdating={updatingItemId === item.cartItemId}
                  isRemoving={removingItemId === item.cartItemId}
                  priceFlashId={priceFlashId}
                />
              ))}
            </div>
          </div>
          
          <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-6 h-fit">
            <h2 className="text-xl font-bold font-serif text-brand-light mb-4">Order Summary</h2>
            
            <form onSubmit={handleApplyCoupon} className="mb-4">
              <label htmlFor="coupon" className="text-sm font-medium text-brand-gold">Have a Coupon?</label>
              <div className="flex gap-2 mt-1">
                  <input
                      type="text"
                      id="coupon"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter coupon code"
                      className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      disabled={!!couponCode}
                  />
                  <button type="submit" className="px-4 py-2 text-sm font-semibold bg-brand-gold/20 border border-brand-gold/50 text-brand-gold rounded-md hover:bg-brand-gold/30 transition-colors disabled:opacity-50" disabled={!!couponCode}>
                      Apply
                  </button>
              </div>
            </form>
            {couponMessage && <p className={`text-xs mt-2 ${couponMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{couponMessage.text}</p>}

            <div className="space-y-2 text-brand-light/90 mt-4">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>GST ({gstPercentage}%)</span><span>₹{gstAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Platform Fee</span><span>₹{platformFee.toFixed(2)}</span></div>
               {couponCode && (
                <div className="flex justify-between items-center text-green-400">
                  <span>Discount ({couponCode})</span>
                  <div className="flex items-center">
                    <span>- ₹{couponDiscount.toFixed(2)}</span>
                    <button onClick={removeCoupon} className="text-xs text-red-400 hover:underline ml-2 p-1">[Remove]</button>
                  </div>
                </div>
              )}
              <div className="flex justify-between"><span>Shipping</span><span className="text-brand-light/70">Calculated at checkout</span></div>
              <div className="border-t border-brand-gold/20 my-2"></div>
              <div className="flex justify-between font-bold text-lg text-brand-light"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
            </div>
            <Link to="/checkout" className="mt-6 block w-full text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;