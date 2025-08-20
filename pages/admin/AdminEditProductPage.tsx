import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout.tsx';
import { useProducts } from '../../hooks/useProducts.ts';
import { NAVIGATION_CATEGORIES } from '../../constants.ts';
import BackButton from '../../components/BackButton.tsx';
import type { Product } from '../../types.ts';
import { supabase } from '../../supabase.ts';
import Icon from '../../components/Icon.tsx';

const AdminEditProductPage: React.FC = () => {
    const { productId } = ReactRouterDOM.useParams<{ productId: string }>();
    const navigate = ReactRouterDOM.useNavigate();
    const { products, updateProduct, deleteProduct } = useProducts();
    const product = products.find(p => p.id === productId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        categoryId: '',
        features: '',
        sizes: '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isActing, setIsActing] = useState(false); // For delete action

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description,
                price: String(product.price),
                originalPrice: String(product.originalPrice || ''),
                categoryId: product.categoryId,
                features: product.features.join('\n'),
                sizes: product.sizes?.join(', ') || '',
            });
            setImagePreview(product.image);
        }
    }, [product]);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setNewImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    
    const triggerFileSelect = () => {
      fileInputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId) return;

        setIsSubmitting(true);
        setError('');
        setMessage('');

        try {
            let imageUrl = product?.image;

            if (newImageFile) {
                const filePath = `public/${Date.now()}-${newImageFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, newImageFile);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);
                
                imageUrl = publicUrlData.publicUrl;
            }

            const productData: Partial<Product> = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
                categoryId: formData.categoryId,
                image: imageUrl,
                features: formData.features.split('\n').filter(f => f.trim() !== ''),
                sizes: formData.sizes.split(',').map(s => s.trim()).filter(s => s !== ''),
            };

            const { error: updateError } = await updateProduct(productId, productData);

            if (updateError) {
                throw updateError;
            } else {
                setMessage('Product updated successfully!');
                 setTimeout(() => setMessage(''), 3000);
            }

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (product && window.confirm(`PERMANENTLY DELETE "${product.name}"? This action cannot be undone.`)) {
            setIsActing(true);
            setError('');
            setMessage('');
            const { error: deleteError } = await deleteProduct(product);
            if (deleteError) {
                setError(deleteError.message || 'Failed to permanently delete product.');
                setIsActing(false);
            } else {
                setMessage('Product deleted successfully.');
                setTimeout(() => navigate('/admin/products'), 1500);
            }
        }
    };

    if (products.length > 0 && !product) {
        return <AdminLayout><div>Product not found.</div></AdminLayout>;
    }
    
    if (!product) {
        return <AdminLayout><div>Loading product...</div></AdminLayout>;
    }

    const formInputClass = "mt-2 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
    const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

    return (
        <AdminLayout>
            <div className="page-fade-in">
                <div className="mb-6">
                    <BackButton fallback="/admin/products" />
                </div>
                <div className="max-w-3xl mx-auto bg-black/30 border border-brand-gold/20 rounded-lg shadow-lg p-8">
                    <h1 className="font-serif text-4xl text-brand-light mb-2">Edit Product</h1>
                    <p className="text-brand-light/70 mb-8">Make changes to "{product.name}".</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className={formLabelClass}>Main Image</label>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="w-24 h-24 rounded-md bg-black/20 border border-brand-gold/30 flex items-center justify-center overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Product preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Icon name="camera" className="w-8 h-8 text-brand-light/50" />
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                                <button type="button" onClick={triggerFileSelect} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-gold/50 text-brand-light/80 hover:bg-brand-gold/10 hover:text-white transition-colors duration-300 uppercase">
                                    Change Image
                                </button>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="name" className={formLabelClass}>Product Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={formInputClass} />
                        </div>
                        <div>
                            <label htmlFor="description" className={formLabelClass}>Description</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={4} className={formInputClass} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="price" className={formLabelClass}>Price ($)</label>
                                <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" className={formInputClass} />
                            </div>
                            <div>
                                <label htmlFor="originalPrice" className={formLabelClass}>Original Price (Optional)</label>
                                <input type="number" id="originalPrice" name="originalPrice" value={formData.originalPrice} onChange={handleChange} min="0" step="0.01" className={formInputClass} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="categoryId" className={formLabelClass}>Category</label>
                            <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required className={formInputClass}>
                                {NAVIGATION_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="features" className={formLabelClass}>Features (One per line)</label>
                            <textarea id="features" name="features" value={formData.features} onChange={handleChange} required rows={4} className={formInputClass} />
                        </div>
                        <div>
                            <label htmlFor="sizes" className={formLabelClass}>Sizes (Comma-separated)</label>
                            <input type="text" id="sizes" name="sizes" value={formData.sizes} onChange={handleChange} className={formInputClass} />
                        </div>


                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {message && <p className="text-green-400 text-sm text-center">{message}</p>}

                        <div className="pt-4 space-y-4">
                           <button type="submit" disabled={isSubmitting || isActing} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                            <div className="border-t border-brand-gold/20 pt-4">
                                 <h3 className="font-serif text-lg text-brand-gold mb-2">Danger Zone</h3>
                                 <button type="button" onClick={handleDelete} disabled={isActing} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed">
                                     {isActing ? 'Deleting...' : 'Delete Product'}
                                 </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminEditProductPage;