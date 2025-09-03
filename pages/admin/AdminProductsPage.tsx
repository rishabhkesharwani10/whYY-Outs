
import React, { useState, useEffect, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout.tsx';
import { supabase } from '../../supabase.ts';
import type { Product } from '../../types.ts';
import Icon from '../../components/Icon.tsx';

// Helper to map Supabase product (snake_case) to our app's Product type (camelCase)
const mapSupabaseProduct = (product: any): Product => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  originalPrice: product.original_price,
  rating: product.rating,
  reviewCount: product.review_count,
  image: product.image,
  images: product.images,
  categoryId: product.category_id,
  features: product.features,
  sizes: product.sizes,
  sellerId: product.seller_id,
});

const AdminProductsPage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [productsPerPage] = useState(10);
    const [totalProducts, setTotalProducts] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        const from = (page - 1) * productsPerPage;
        const to = from + productsPerPage - 1;

        let query = supabase
            .from('products')
            .select('*', { count: 'exact' });
        
        if (searchTerm) {
            query = query.ilike('name', `%${searchTerm}%`);
        }

        query = query.order('created_at', { ascending: false }).range(from, to);

        const { data, error: fetchError, count } = await query;

        if (fetchError) {
            console.error("Error fetching products", fetchError);
            setError(fetchError.message);
        } else if (data) {
            setProducts(data.map(mapSupabaseProduct));
            setTotalProducts(count || 0);
        }
        setLoading(false);

    }, [page, productsPerPage, searchTerm]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDelete = async (product: Product) => {
        if (window.confirm(`Are you sure you want to permanently delete "${product.name}"?\nThis action cannot be undone.`)) {
            // First, delete the associated image from storage.
            if (product.image) {
                try {
                    const BUCKET_NAME = 'product-images';
                    const imageUrl = new URL(product.image);
                    const pathSegments = imageUrl.pathname.split('/');
                    const bucketIndex = pathSegments.indexOf(BUCKET_NAME);

                    if (bucketIndex !== -1) {
                        const filePath = decodeURIComponent(pathSegments.slice(bucketIndex + 1).join('/'));
                        if (filePath) {
                            const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
                            if (storageError && storageError.message !== 'The resource was not found') {
                                console.error(`Error deleting product image: ${filePath}`, storageError);
                                // Non-blocking error, alert user but proceed.
                                alert(`Could not delete the product image, but will proceed to delete the product record. Error: ${storageError.message}`);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing or deleting product image:', e);
                    // This is a blocking error if we can't parse the URL.
                    alert('An error occurred while handling the product image. The product will not be deleted. Check console for details.');
                    return; 
                }
            }

            // Then, permanently delete the product from the database.
            const { error: dbError } = await supabase.from('products').delete().eq('id', product.id);
            if (dbError) {
                alert(`Failed to delete product. \n\nError: ${dbError.message}\n\nThis may be due to Row Level Security (RLS) policies. Please ensure admins have DELETE permissions on the 'products' table.`);
            } else {
                // If the deleted product was the last one on the current page (and it's not the first page), go back one page.
                if (products.length === 1 && page > 1) {
                    setPage(page - 1);
                } else {
                    // Otherwise, just refetch the current page to reflect the deletion.
                    fetchProducts();
                }
            }
        }
    };

    const totalPages = Math.ceil(totalProducts / productsPerPage);

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
                    placeholder="Search products by name..."
                    value={searchTerm}
                    onChange={e => {
                        setPage(1);
                        setSearchTerm(e.target.value);
                    }}
                    className="w-full bg-black/30 border border-brand-gold/30 rounded-md py-2 px-4 mb-6 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md mb-6">
                        <p className="font-bold">Could not load products</p>
                        <p className="text-sm mt-1">{error}</p>
                        <p className="text-xs mt-2 text-red-400/70">This is often caused by a missing Row Level Security (RLS) policy on the 'products' table in your Supabase project.</p>
                    </div>
                )}

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
                        {loading ? (
                           <tbody>
                                <tr>
                                    <td colSpan={4} className="text-center p-16 text-brand-light/70">
                                        <div className="w-8 h-8 border-2 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-4">Loading products...</p>
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody className="divide-y divide-brand-gold/20">
                                {products.map(product => (
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
                                        <td className="p-4 text-right space-x-4">
                                            <button onClick={() => navigate(`/admin/products/edit/${product.id}`)} className="text-sm font-semibold text-brand-gold hover:underline">Edit</button>
                                            <button onClick={() => handleDelete(product)} className="text-sm font-semibold text-red-500 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </table>
                </div>

                {!loading && !error && totalProducts > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                        <p className="text-sm text-brand-light/70">
                            Showing <span className="font-bold">{((page - 1) * productsPerPage) + 1}</span> to <span className="font-bold">{Math.min(page * productsPerPage, totalProducts)}</span> of <span className="font-bold">{totalProducts}</span> products
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-md border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <Icon name="chevron-left" className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-semibold px-2">Page {page} of {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-md border border-brand-gold/50 text-brand-gold hover:bg-brand-gold/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <Icon name="chevron-right" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminProductsPage;