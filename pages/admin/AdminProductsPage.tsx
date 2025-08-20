import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout.tsx';
import { useProducts } from '../../hooks/useProducts.ts';

const AdminProductsPage: React.FC = () => {
    const { products, deleteProduct } = useProducts();
    const navigate = ReactRouterDOM.useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = async (productId: string, productName: string) => {
        if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
            await deleteProduct(productId);
        }
    };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <AdminLayout>
            <div className="page-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="font-serif text-4xl text-brand-light">Manage Products</h1>
                        <p className="text-brand-light/70 mt-1">View, add, edit, or delete products.</p>
                    </div>
                    <button
                        onClick={() => navigate('/add-product', { state: { adminMode: true } })}
                        className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark transition-colors duration-300 uppercase rounded-md"
                    >
                        Add Product
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-black/30 border border-brand-gold/30 rounded-md py-2 px-4 mb-6 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />

                <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto">
                    <table className="w-full text-left min-w-[640px]">
                        <thead className="bg-black/50 border-b border-brand-gold/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Product</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Price</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Category</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-brand-gold/5">
                                    <td className="p-4 flex items-center gap-4">
                                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-brand-light">{product.name}</p>
                                            <p className="text-xs text-brand-light/60">ID: {product.id.substring(0, 8)}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">${product.price.toFixed(2)}</td>
                                    <td className="p-4 capitalize">{product.categoryId}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => navigate(`/admin/products/edit/${product.id}`)} className="text-sm font-semibold text-brand-gold hover:underline mr-4">Edit</button>
                                        <button onClick={() => handleDelete(product.id, product.name)} className="text-sm font-semibold text-red-500 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminProductsPage;