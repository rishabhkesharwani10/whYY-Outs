

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useCart } from '../hooks/useCart.ts';
import Icon from '../components/Icon.tsx';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, itemCount, totalPrice } = useCart();

  if (itemCount === 0) {
    return (
      <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-12">
            <h1 className="text-3xl font-bold font-serif text-brand-light">Your Cart is Empty</h1>
            <p className="mt-2 text-brand-light/70">Looks like you haven't added anything to your cart yet.</p>
            <ReactRouterDOM.Link to="/shop" className="mt-8 inline-block font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
              Start Shopping
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
        <div className="mb-8">
          <BackButton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-6">
            <h1 className="text-2xl font-bold font-serif text-brand-light mb-6">Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})</h1>
            <div className="space-y-6">
              {cartItems.map(item => (
                <div key={item.cartItemId} className="flex flex-col sm:flex-row items-center justify-between border-b border-brand-gold/20 pb-6 last:border-b-0">
                  <div className="flex items-center mb-4 sm:mb-0 w-full sm:w-auto">
                    <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg mr-6"/>
                    <div>
                      <ReactRouterDOM.Link to={`/product/${item.id}`} className="text-lg font-semibold text-brand-light hover:text-brand-gold">{item.name}</ReactRouterDOM.Link>
                      {item.selectedSize && <p className="text-brand-light/70 text-sm mt-1">Size: {item.selectedSize}</p>}
                      <p className="text-brand-light/70 text-sm">Price: ${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border border-brand-gold/50 rounded-md">
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="p-2 text-brand-gold hover:bg-brand-gold/10"><Icon name="minus" className="w-4 h-4" /></button>
                      <span className="px-4 font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="p-2 text-brand-gold hover:bg-brand-gold/10"><Icon name="plus" className="w-4 h-4" /></button>
                    </div>
                    <p className="text-lg font-bold w-24 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.cartItemId)} className="text-brand-light/70 hover:text-red-500 transition-colors"><Icon name="trash" className="w-5 h-5"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-6 h-fit">
            <h2 className="text-xl font-bold font-serif text-brand-light mb-4">Order Summary</h2>
            <div className="space-y-2 text-brand-light/90">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-brand-gold/20 my-2"></div>
              <div className="flex justify-between font-bold text-lg text-brand-light">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <ReactRouterDOM.Link to="/checkout" className="mt-6 block w-full text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
              Proceed to Checkout
            </ReactRouterDOM.Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;