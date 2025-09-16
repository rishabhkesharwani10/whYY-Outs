import React, { useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import BackButton from '../../components/BackButton.tsx';
import { useOrders } from '../../hooks/useOrders.ts';
import { useProducts } from '../../hooks/useProducts.ts';
import StatCard from '../../components/StatCard.tsx';

const ADMIN_USER_ID = 'afc27711-62ad-4d3a-a907-c64e054b6b10';

const MOCK_WITHDRAWALS = [
    { id: 'WID_001', date: '2024-05-20', amount: 12500.00, transactionId: 'TXN_ajksd89a7da' },
    { id: 'WID_002', date: '2024-05-12', amount: 8230.50, transactionId: 'TXN_oija7sd6a78' },
    { id: 'WID_003', date: '2024-05-02', amount: 15320.75, transactionId: 'TXN_9879asjkhd' },
];

const AdminRevenuePage: React.FC = () => {
    const { orders } = useOrders();
    const { products } = useProducts();
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawals] = useState(MOCK_WITHDRAWALS);
    const [message, setMessage] = useState('');

    const revenueData = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === 'Delivered');

        const totalGst = deliveredOrders.reduce((sum, order) => sum + order.gst, 0);
        const totalPlatformFee = deliveredOrders.reduce((sum, order) => sum + order.platformFee, 0);
        const totalShippingFee = deliveredOrders.reduce((sum, order) => sum + order.shippingFee, 0);

        const totalAdminProfit = deliveredOrders.reduce((sum, order) => {
            const orderProfit = order.items.reduce((itemSum, item) => {
                if (item.sellerId === ADMIN_USER_ID) {
                    const product = products.find(p => p.id === item.productId);
                    if (product && typeof product.costPrice === 'number') {
                        return itemSum + (item.price - product.costPrice) * item.quantity;
                    }
                }
                return itemSum;
            }, 0);
            return sum + orderProfit;
        }, 0);

        const totalRevenue = totalGst + totalPlatformFee + totalShippingFee + totalAdminProfit;

        const recentEvents = deliveredOrders.slice(0, 10).map(order => {
            const adminProfit = order.items.reduce((itemSum, item) => {
                 if (item.sellerId === ADMIN_USER_ID) {
                    const product = products.find(p => p.id === item.productId);
                    if (product && typeof product.costPrice === 'number') {
                        return itemSum + (item.price - product.costPrice) * item.quantity;
                    }
                }
                return itemSum;
            }, 0);
            return {
                orderId: order.id,
                date: order.orderDate,
                gst: order.gst,
                platformFee: order.platformFee,
                shippingFee: order.shippingFee,
                adminProfit: adminProfit,
                total: order.gst + order.platformFee + order.shippingFee + adminProfit
            };
        });

        return {
            totalRevenue,
            totalGst,
            totalPlatformFee,
            totalShippingFee,
            totalAdminProfit,
            recentEvents
        };
    }, [orders, products]);

    const handleWithdraw = () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            setMessage('Please enter a valid amount.');
            return;
        }
        if (amount > revenueData.totalRevenue) {
            setMessage('Withdrawal amount cannot exceed total revenue.');
            return;
        }
        // Simulate withdrawal
        setMessage(`Successfully withdrew ₹${amount.toFixed(2)}.`);
        setWithdrawAmount('');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <AdminLayout>
            <div className="page-fade-in">
                <div className="mb-6"><BackButton fallback="/admin" /></div>
                <h1 className="font-serif text-4xl text-brand-light">Platform Revenue</h1>
                <p className="text-brand-light/70 mt-1">An overview of your platform's earnings and payouts.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    <StatCard title="Total Platform Revenue" value={revenueData.totalRevenue.toFixed(2)} prefix="₹" icon="wallet" />
                    <StatCard title="Collected GST" value={revenueData.totalGst.toFixed(2)} prefix="₹" icon="analytics" />
                    <StatCard title="Platform Fees" value={revenueData.totalPlatformFee.toFixed(2)} prefix="₹" icon="gem" />
                    <StatCard title="Shipping Profits" value={revenueData.totalShippingFee.toFixed(2)} prefix="₹" icon="truck" />
                    <StatCard title="Admin Product Profit" value={revenueData.totalAdminProfit.toFixed(2)} prefix="₹" icon="category" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-1">
                        <div className="bg-black/30 border border-brand-gold/20 rounded-lg p-6 space-y-4">
                             <h2 className="font-serif text-2xl text-brand-light">Withdraw Funds</h2>
                             <div>
                                <label htmlFor="withdrawAmount" className="text-sm font-medium text-brand-gold">Amount to Withdraw</label>
                                <div className="relative mt-1">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-light/70">₹</span>
                                    <input
                                        type="number"
                                        id="withdrawAmount"
                                        value={withdrawAmount}
                                        onChange={e => setWithdrawAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 pl-7 pr-16 text-sm"
                                    />
                                    <button onClick={() => setWithdrawAmount(revenueData.totalRevenue.toFixed(2))} className="absolute inset-y-0 right-0 px-3 text-xs text-brand-gold hover:underline">All</button>
                                </div>
                             </div>
                             <button onClick={handleWithdraw} className="w-full font-sans text-sm tracking-widest px-8 py-2 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors">Withdraw</button>
                             {message && <p className="text-green-400 text-sm text-center">{message}</p>}
                        </div>
                         <div className="bg-black/30 border border-brand-gold/20 rounded-lg p-6 mt-8">
                            <h2 className="font-serif text-2xl text-brand-light mb-4">Withdrawal History</h2>
                             <div className="overflow-y-auto max-h-96 space-y-3">
                                {withdrawals.map(w => (
                                    <div key={w.id} className="text-sm p-3 bg-black/20 rounded-md">
                                        <div className="flex justify-between font-semibold">
                                            <span>₹{w.amount.toFixed(2)}</span>
                                            <span className="text-brand-light/70">{new Date(w.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-brand-light/50 font-mono mt-1">{w.transactionId}</p>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-black/30 border border-brand-gold/20 rounded-lg p-6">
                            <h2 className="font-serif text-2xl text-brand-light mb-4">Recent Revenue Events</h2>
                             <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead className="border-b border-brand-gold/20">
                                        <tr>
                                            <th className="p-3 text-sm font-semibold uppercase tracking-wider">Order ID</th>
                                            <th className="p-3 text-sm font-semibold uppercase tracking-wider">Date</th>
                                            <th className="p-3 text-sm font-semibold uppercase tracking-wider">Details</th>
                                            <th className="p-3 text-sm font-semibold uppercase tracking-wider text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-gold/20">
                                        {revenueData.recentEvents.map(event => (
                                            <tr key={event.orderId}>
                                                <td className="p-3 font-mono text-xs">#{event.orderId.substring(0,8)}</td>
                                                <td className="p-3 text-sm">{new Date(event.date).toLocaleDateString()}</td>
                                                <td className="p-3 text-xs">
                                                    GST: ₹{event.gst.toFixed(2)}<br/>
                                                    Fee: ₹{event.platformFee.toFixed(2)}<br/>
                                                    Ship: ₹{event.shippingFee.toFixed(2)}<br/>
                                                    Profit: ₹{event.adminProfit.toFixed(2)}
                                                </td>
                                                <td className="p-3 text-sm font-bold text-brand-gold-light text-right">₹{event.total.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
};

export default AdminRevenuePage;