
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SellerLayout from '../../components/SellerLayout.tsx';
import { useProducts } from '../../hooks/useProducts.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import type { Product } from '../../types.ts';
import BackButton from '../../components/BackButton.tsx';
import { useSellerProfileStatus } from '../../hooks/useSellerProfileStatus.ts';
import IncompleteProfileModal from '../../components/IncompleteProfileModal.tsx';

const SellerProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const { products, deleteProduct } = useProducts();
    const { user } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const { isProfileComplete, missingFields, loading: profileLoading } = useSellerProfileStatus();
    
    const sellerProducts = products.filter(p => p.sellerId === user?.id);

    const handleDelete = async (product: Product) => {
        if (window.confirm(`Are you sure you want to permanently delete "${product.name}"?`)) {
            await deleteProduct(product);
            // The list will update automatically via context subscription
        }
    };

    const handleAddProductClick = () => {
        if (profileLoading) return; // Do nothing while checking
        if (isProfileComplete) {
            navigate('/seller/add-product');
        } else {
            setIsModalOpen(true);
        }
    };
    
    return (
        <SellerLayout>
            <div className="page-fade-in">
                <div className="mb-6">
                    <BackButton fallback="/seller-dashboard" />
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="font-serif text-4xl text-brand-light">Manage Products</h1>
                        <p className="text-brand-light/70 mt-1">View, add, edit, or delete your products.</p>
                    </div>
                    <button
                        onClick={handleAddProductClick}
                        disabled={profileLoading}
                        className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark transition-colors duration-300 uppercase rounded-md disabled:opacity-50"
                    >
                        {profileLoading ? 'Checking...' : 'Add Product'}
                    </button>
                </div>

                <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto">
                    <table className="w-full text-left min-w-[640px]">
                        <thead className="bg-black/50 border-b border-brand-gold/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Product</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Price</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {sellerProducts.map(product => (
                                <tr key={product.id} className="hover:bg-brand-gold/5">
                                    <td className="p-4 flex items-center gap-4">
                                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-brand-light">{product.name}</p>
                                            <p className="text-xs text-brand-light/60 capitalize">{product.categoryId}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 font-semibold">₹{product.price.toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 text-xs rounded-full font-semibold bg-green-500/20 text-green-400">Active</span>
                                    </td>
                                    <td className="p-4 text-right space-x-4">
                                        <Link to={`/seller/products/edit/${product.id}`} className="text-sm font-semibold text-brand-gold hover:underline">Edit</Link>
                                        <button onClick={() => handleDelete(product)} className="text-sm font-semibold text-red-500 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sellerProducts.length === 0 && (
                        <div className="text-center py-16">
                            <h3 className="text-xl font-semibold text-brand-light">You haven't added any products yet.</h3>
                            <p className="text-brand-light/70 mt-2">Click "Add Product" to get started.</p>
                        </div>
                    )}
                </div>
            </div>
            <IncompleteProfileModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                missingFields={missingFields} 
            />
        </SellerLayout>
    );
};

export default SellerProductsPage;
