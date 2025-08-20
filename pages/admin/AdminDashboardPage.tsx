import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useProducts } from '../../hooks/useProducts.ts';
import { useOrders } from '../../hooks/useOrders.ts';
import Icon from '../../components/Icon.tsx';

const StatCard: React.FC<{ title: string, value: number, icon: any, link: string }> = ({ title, value, icon, link }) => (
    <ReactRouterDOM.Link to={link} className="bg-black/30 border border-brand-gold/20 rounded-lg p-6 hover:bg-brand-gold/5 hover:border-brand-gold/40 transition-all">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm uppercase tracking-wider text-brand-light/70">{title}</p>
                <p className="text-4xl font-bold text-brand-light mt-2">{value}</p>
            </div>
            <div className="p-3 bg-brand-gold/10 rounded-md">
                <Icon name={icon} className="w-6 h-6 text-brand-gold" />
            </div>
        </div>
    </ReactRouterDOM.Link>
);


const AdminDashboardPage: React.FC = () => {
    const { allUsers } = useAuth();
    const { products } = useProducts();
    const { orders } = useOrders();
    
    return (
        <AdminLayout>
            <div className="page-fade-in">
                <h1 className="font-serif text-4xl text-brand-light">Admin Dashboard</h1>
                <p className="text-brand-light/70 mt-1">Overview of your e-commerce platform.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    <StatCard title="Total Products" value={products.length} icon="category" link="/admin/products" />
                    <StatCard title="Total Orders" value={orders.length} icon="cart" link="/admin/orders" />
                    <StatCard title="Total Users" value={allUsers.length} icon="user" link="/admin/users" />
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboardPage;