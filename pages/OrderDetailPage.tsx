

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import { useOrders } from '../hooks/useOrders.ts';
import NotFoundPage from './NotFoundPage.tsx';
import Icon from '../components/Icon.tsx';

const OrderStatusTracker: React.FC<{ status: 'Processing' | 'Shipped' | 'Delivered' }> = ({ status }) => {
    const statuses = ['Processing', 'Shipped', 'Delivered'];
    const currentStatusIndex = statuses.indexOf(status);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between">
                {statuses.map((s, index) => (
                    <React.Fragment key={s}>
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${index <= currentStatusIndex ? 'bg-brand-gold border-brand-gold text-brand-dark' : 'border-brand-gold/50 bg-black/20 text-brand-light'}`}>
                                {index < currentStatusIndex ? <Icon name="check" className="w-6 h-6"/> : <span>{index + 1}</span>}
                            </div>
                            <p className={`mt-2 text-xs font-semibold uppercase tracking-wider ${index <= currentStatusIndex ? 'text-brand-light' : 'text-brand-light/60'}`}>{s}</p>
                        </div>
                        {index < statuses.length - 1 && (
                            <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${index < currentStatusIndex ? 'bg-brand-gold' : 'bg-brand-gold/50'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};


const OrderDetailPage: React.FC = () => {
    const { orderId } = ReactRouterDOM.useParams<{ orderId: string }>();
    const { orders } = useOrders();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        return <NotFoundPage />;
    }

    const { shippingAddress, items } = order;

    return (
        <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
                <div className="mb-8">
                    <BackButton fallback="/order-history" />
                </div>
                <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-brand-gold/20 pb-6 mb-6">
                        <div>
                            <h1 className="font-serif text-3xl text-brand-light">Order #{order.id.split('-')[1]}</h1>
                            <p className="text-brand-light/70">Placed on {new Date(order.orderDate).toLocaleString()}</p>
                        </div>
                        <p className="font-semibold text-xl text-brand-light mt-4 md:mt-0">Total: ${order.totalPrice.toFixed(2)}</p>
                    </div>

                    <div className="mb-8 p-6 bg-black/20 rounded-lg">
                      <OrderStatusTracker status={order.status} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h2 className="font-serif text-xl text-brand-gold mb-4">Items Ordered</h2>
                            <div className="space-y-4">
                                {items.map(item => (
                                    <div key={item.cartItemId} className="flex items-center">
                                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4"/>
                                        <div>
                                            <p className="font-semibold text-brand-light">{item.name}</p>
                                            <p className="text-sm text-brand-light/70">Qty: {item.quantity} - ${item.price.toFixed(2)} each</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h2 className="font-serif text-xl text-brand-gold mb-4">Shipping Details</h2>
                            <div className="bg-black/20 p-4 rounded-lg space-y-2 text-brand-light/90">
                                <p><span className="font-semibold">Recipient:</span> {shippingAddress.fullName}</p>
                                <p><span className="font-semibold">Address:</span> {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.zip}</p>
                                {order.trackingNumber && <p><span className="font-semibold">Tracking #:</span> {order.trackingNumber}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default OrderDetailPage;