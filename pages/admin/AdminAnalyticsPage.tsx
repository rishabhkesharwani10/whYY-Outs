import React, { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import BackButton from '../../components/BackButton.tsx';
import { useOrders } from '../../hooks/useOrders.ts';
import { useProducts } from '../../hooks/useProducts.ts';
import { useReturns } from '../../hooks/useReturns.ts';
import StatCard from '../../components/StatCard.tsx';
import type { Order, Product, Customer, Seller } from '../../types.ts';
import Icon from '../../components/Icon.tsx';
import { ADMIN_USER_ID } from '../../constants.ts';
import { supabase } from '../../supabase.ts';

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-black/30 border border-brand-gold/20 rounded-lg p-6">
        <h2 className="font-serif text-2xl text-brand-light mb-4">{title}</h2>
        <div>{children}</div>
    </div>
);

const AdminAnalyticsPage: React.FC = () => {
    const { orders, loading: ordersLoading } = useOrders();
    const { products, loading: productsLoading } = useProducts();
    const { returnRequests, loading: returnsLoading } = useReturns();
    const [allUsers, setAllUsers] = useState<(Customer | Seller)[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);

    useEffect(() => {
        const fetchAllUsers = async () => {
            setUsersLoading(true);
            const { data: customers } = await supabase.from('customers').select('*');
            const { data: sellers } = await supabase.from('sellers').select('*');
            const all = [
                ...(customers || []).map(c => ({ ...c, fullName: c.full_name, createdAt: c.created_at, role: 'customer' as const })),
                ...(sellers || []).map(s => ({ ...s, fullName: s.full_name, createdAt: s.created_at, role: 'seller' as const }))
            ];
            setAllUsers(all);
            setUsersLoading(false);
        };
        fetchAllUsers();
    }, []);

    const loading = ordersLoading || productsLoading || usersLoading || returnsLoading;

    const analyticsData = useMemo(() => {
        const recognizableOrders = orders.filter(order => {
            const isCod = order.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'cod';
            const isPrepaid = order.paymentMethod === 'Razorpay' || order.paymentMethod === 'razorpay';
            if (isCod) {
                return order.status === 'Delivered';
            }
            if (isPrepaid) {
                return ['Processing', 'Shipped', 'Delivered'].includes(order.status);
            }
            return false;
        });
        
        const deliveredOrders = orders.filter(o => o.status === 'Delivered');

        // Revenue calculations based on recognizable orders
        let grossGst = recognizableOrders.reduce((sum, order) => sum + order.gst, 0);
        let grossPlatformFee = recognizableOrders.reduce((sum, order) => sum + order.platformFee, 0);
        let grossShippingFee = recognizableOrders.reduce((sum, order) => sum + order.shippingFee, 0);
        let grossAdminProfit = recognizableOrders.reduce((sum, order) => {
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

        // Calculate deductions from approved returns
        const approvedReturns = returnRequests.filter(req => req.status === 'Approved');
        
        approvedReturns.forEach(ret => {
            const originalOrder = orders.find(o => o.id === ret.orderId);
            const returnedItem = originalOrder?.items.find(i => i.productId === ret.productId);

            if (originalOrder && returnedItem) {
                if (originalOrder.subtotal > 0) {
                    const itemValue = returnedItem.price * returnedItem.quantity;
                    const ratio = itemValue / originalOrder.subtotal;

                    grossGst -= originalOrder.gst * ratio;
                    grossPlatformFee -= originalOrder.platformFee * ratio;
                    
                    if (returnedItem.sellerId === ADMIN_USER_ID) {
                        const product = products.find(p => p.id === returnedItem.productId);
                        if (product && typeof product.costPrice === 'number') {
                            const profitOnItem = (returnedItem.price - product.costPrice) * returnedItem.quantity;
                            grossAdminProfit -= profitOnItem;
                        }
                    }
                }
            }
        });
        
        const totalRevenue = grossGst + grossPlatformFee + grossShippingFee + grossAdminProfit;

        // User calculations
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newUsers = allUsers.filter(u => u.createdAt && new Date(u.createdAt) > oneWeekAgo).length;
        const customerCount = allUsers.filter(u => u.role === 'customer').length;
        const sellerCount = allUsers.filter(u => u.role === 'seller').length;

        // Sales data for chart (last 7 days) from DELIVERED orders for accuracy
        const salesByDay: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            salesByDay[d.toISOString().split('T')[0]] = 0;
        }
        deliveredOrders.forEach(order => {
            const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
            if (salesByDay[orderDate] !== undefined) {
                salesByDay[orderDate] += order.totalPrice;
            }
        });

        // Top selling products from DELIVERED orders
        const productSales: { [key: string]: { product: Product, quantity: number } } = {};
        deliveredOrders.forEach(order => {
            order.items.forEach(item => {
                const existing = productSales[item.productId];
                const productInfo = products.find(p => p.id === item.productId);
                if (productInfo) {
                    if (existing) {
                        existing.quantity += item.quantity;
                    } else {
                        productSales[item.productId] = { product: productInfo, quantity: item.quantity };
                    }
                }
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return {
            totalRevenue,
            totalOrders: orders.length,
            totalUsers: allUsers.length,
            totalProducts: products.length,
            newUsers,
            conversionRate: 2.78, // Mocked data as we don't track visits
            customerCount,
            sellerCount,
            salesByDay: Object.entries(salesByDay).map(([date, total]) => ({ date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), total })),
            topProducts,
        };
    }, [orders, products, allUsers, returnRequests]);

    return (
        <AdminLayout>
            <div className="page-fade-in">
                <div className="mb-6"><BackButton fallback="/admin" /></div>
                <h1 className="font-serif text-4xl text-brand-light">Platform Analytics</h1>
                <p className="text-brand-light/70 mt-1">A high-level overview of your platform's performance.</p>

                {loading ? <p className="mt-8 text-center">Calculating metrics...</p> : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                            <StatCard title="Total Revenue" value={analyticsData.totalRevenue.toFixed(2)} prefix="₹" icon="wallet" />
                            <StatCard title="Total Orders" value={analyticsData.totalOrders.toString()} icon="cart" />
                            <StatCard title="Total Users" value={analyticsData.totalUsers.toString()} icon="user" />
                            <StatCard title="Total Products" value={analyticsData.totalProducts.toString()} icon="category" />
                            <StatCard title="New Users (7d)" value={analyticsData.newUsers.toString()} icon="user" />
                            <StatCard title="Conversion Rate" value={analyticsData.conversionRate.toFixed(2) + '%'} icon="analytics" />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                            <div className="lg:col-span-2">
                                <ChartCard title="Sales (Last 7 Days)">
                                    <div className="flex justify-between items-end h-64 border-b-2 border-brand-gold/20 pb-4">
                                        {analyticsData.salesByDay.map(({ date, total }) => {
                                            const maxSales = Math.max(...analyticsData.salesByDay.map(d => d.total));
                                            const height = maxSales > 0 ? (total / maxSales) * 100 : 0;
                                            return (
                                                <div key={date} className="flex flex-col items-center justify-end h-full w-full group">
                                                    <div className="text-xs font-bold text-brand-gold-light mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        ₹{total.toFixed(0)}
                                                    </div>
                                                    <div
                                                        className="w-4/5 bg-gradient-to-t from-brand-gold/70 to-brand-gold-light/70 rounded-t-md group-hover:from-brand-gold group-hover:to-brand-gold-light transition-all"
                                                        style={{ height: `${height}%` }}
                                                        title={`₹${total.toFixed(2)}`}
                                                    ></div>
                                                    <p className="text-xs text-brand-light/70 mt-2">{date}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ChartCard>
                            </div>

                             <div>
                                <ChartCard title="User Roles">
                                    <div className="flex flex-col items-center justify-center h-64 gap-6">
                                        <div
                                            className="w-40 h-40 rounded-full flex items-center justify-center"
                                            style={{ background: `conic-gradient(#D7C0A5 0% ${analyticsData.customerCount / analyticsData.totalUsers * 100}%, #A7825D ${analyticsData.customerCount / analyticsData.totalUsers * 100}% 100%)` }}
                                        >
                                           <div className="w-24 h-24 bg-brand-dark rounded-full flex flex-col items-center justify-center">
                                                <span className="font-bold text-2xl">{analyticsData.totalUsers}</span>
                                                <span className="text-xs text-brand-light/60">Total Users</span>
                                           </div>
                                        </div>
                                        <div className="flex gap-6 text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#D7C0A5]"></div>
                                                <span>Customers ({analyticsData.customerCount})</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 <div className="w-3 h-3 rounded-full bg-[#A7825D]"></div>
                                                <span>Sellers ({analyticsData.sellerCount})</span>
                                            </div>
                                        </div>
                                    </div>
                                </ChartCard>
                            </div>
                        </div>

                        <div className="mt-8">
                            <ChartCard title="Top Selling Products">
                                <div className="space-y-4">
                                {analyticsData.topProducts.map(({ product, quantity }, index) => (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-black/20 rounded-md">
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-lg text-brand-gold/80 w-6">#{index + 1}</span>
                                            <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold text-brand-light">{product.name}</p>
                                                <p className="text-xs text-brand-light/60">ID: {product.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-brand-gold-light text-lg">{quantity}</p>
                                            <p className="text-xs text-brand-light/60">Units Sold</p>
                                        </div>
                                    </div>
                                ))}
                                {analyticsData.topProducts.length === 0 && <p className="text-center py-8 text-brand-light/70">No sales data from delivered orders yet.</p>}
                                </div>
                            </ChartCard>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminAnalyticsPage;
