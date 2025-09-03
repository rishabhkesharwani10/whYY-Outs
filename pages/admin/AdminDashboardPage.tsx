
import React from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useProducts } from '../../hooks/useProducts.ts';
import { useOrders } from '../../hooks/useOrders.ts';
import StatCard from '../../components/StatCard.tsx';

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
                    <StatCard title="Total Products" value={products.length.toString()} icon="category" link="/admin/products" />
                    <StatCard title="Total Orders" value={orders.length.toString()} icon="cart" link="/admin/orders" />
                    <StatCard title="Total Users" value={allUsers.length.toString()} icon="user" link="/admin/users" />
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboardPage;