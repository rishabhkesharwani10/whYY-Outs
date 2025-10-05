import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SellerLayout from '../../components/SellerLayout.tsx';
import { useProducts } from '../../hooks/useProducts.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { NAVIGATION_CATEGORIES } from '../../constants.ts';
import type { Product } from '../../types.ts';
import { supabase } from '../../supabase.ts';
import Icon from '../../components/Icon.tsx';
import BackButton from '../../components/BackButton.tsx';
import { useSellerProfileStatus } from '../../hooks/useSellerProfileStatus.ts';
import LoadingSpinner from '../../components/LoadingSpinner.tsx';
import IncompleteProfileModal from '../../components/IncompleteProfileModal.tsx';
import { compressImage } from '../../utils/imageTools.ts';

const mapSupabaseProductToApp = (p: any): Product => ({
  id: p.id, name: p.name, description: p.description, price: p.price, originalPrice: p.original_price, rating: p.rating, reviewCount: p.review_count, image: p.image, images: p.images || [], categoryId: p.category_id, features: p.features || [], sizes: p.sizes || [], sellerId: p.seller_id,
  subCategoryId: p.sub_category_id, brand: p.brand, sku: p.sku, upc: p.upc, modelNumber: p.model_number, videoUrl: p.video_url, costPrice: p.cost_price, stockQuantity: p.stock_quantity, minOrderQuantity: p.min_order_quantity, maxOrderQuantity: p.max_order_quantity, weightKg: p.weight_kg, lengthCm: p.length_cm, widthCm: p.width_cm, heightCm: p.height_cm, deliveryEstimate: p.delivery_estimate, color: p.color, material: p.material, expiryDate: p.expiry_date, returnPolicy: p.return_policy, returnDays: p.return_days, warrantyDetails: p.warranty_details,
});

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-t border-brand-gold/20 pt-6 mt-6 first:mt-0 first:border-t-0 first:pt-0">
    <h2 className="font-serif text-2xl text-brand-gold mb-6">{title}</h2>
    <div className="space-y-6">{children}</div>
  </div>
);

const SellerEditProductPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { updateProduct, deleteProduct } = useProducts();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const { isProfileComplete, loading: profileLoading, missingFields } = useSellerProfileStatus();

    const [formData, setFormData] = useState<Partial<Product>>({});
    const [featuresInput, setFeaturesInput] = useState('');
    const [sizesInput, setSizesInput] = useState('');

    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isActing, setIsActing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    // Effect 1: Fetch the product data from Supabase and check authorization.
    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId || !user) return;
            setLoading(true);
            const { data, error: fetchErr } = await supabase.from('products').select('*').eq('id', productId).single();
            
            if (fetchErr) {
                console.error("Failed to load product data:", fetchErr.message || fetchErr);
                setError("Failed to load product data.");
            } else if (data) {
                if (data.seller_id === user.id) {
                    const fetchedProduct = mapSupabaseProductToApp(data);
                    setProduct(fetchedProduct);
                    setExistingImages([fetchedProduct.image, ...(fetchedProduct.images || [])].filter(Boolean));
                    setIsAuthorized(true);
                } else {
                    setError("You are not authorized to edit this product.");
                    setIsAuthorized(false);
                }
            } else {
                setError("Product not found.");
            }
            setLoading(false);
        }
        if (isProfileComplete) { // Only fetch if profile is complete
            fetchProduct();
        }
    }, [productId, user, isProfileComplete]);

    // Effect 2: Populate the form. Prioritize saved session data, then fall back to fetched product data.
    useEffect(() => {
        if (!product) return;

        try {
            const savedStateJSON = sessionStorage.getItem(`editProductFormData-${product.id}`);
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                setFormData(savedState.formData);
                setFeaturesInput(savedState.featuresInput);
                setSizesInput(savedState.sizesInput);
                return;
            }
        } catch (e) {
            console.error("Failed to parse saved form state", e);
        }

        // Fallback to product data if no valid saved state
        setFormData(product);
        setFeaturesInput(product.features?.join('\n') || '');
        setSizesInput(product.sizes?.join(', ') || '');
    }, [product]);

    // Effect 3: Save any form changes to session storage to prevent data loss.
    useEffect(() => {
        if (product && !loading && isAuthorized) {
            const stateToSave = { formData, featuresInput, sizesInput };
            sessionStorage.setItem(`editProductFormData-${product.id}`, JSON.stringify(stateToSave));
        }
    }, [formData, featuresInput, sizesInput, product, loading, isAuthorized]);

    const subcategories = useMemo(() => {
        const selected = NAVIGATION_CATEGORIES.find(c => c.id === formData.categoryId);
        return selected?.subCategories || [];
    }, [formData.categoryId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numericFields = ['price', 'originalPrice', 'costPrice', 'stockQuantity', 'minOrderQuantity', 'maxOrderQuantity', 'weightKg', 'lengthCm', 'widthCm', 'heightCm', 'returnDays'];
        if (numericFields.includes(name)) {
            setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewImageFiles(prev => [...prev, ...files]);
            files.forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => { setNewImagePreviews(prev => [...prev, reader.result as string]); };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        }
    };
    const handleRemoveExistingImage = (index: number) => setExistingImages(prev => prev.filter((_, i) => i !== index));
    const handleRemoveNewImage = (index: number) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };
    const triggerFileSelect = () => fileInputRef.current?.click();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId || !product || !user) return;
        setIsSubmitting(true);
        setError('');
        setMessage('');
        setUploadStatus('');

        try {
            setUploadStatus(`Compressing ${newImageFiles.length} new image(s)...`);
            const compressedFiles = await Promise.all(newImageFiles.map(file => compressImage(file)));

            setUploadStatus(`Uploading ${compressedFiles.length} new image(s)...`);
            const newImageUrls = await Promise.all(
                compressedFiles.map(async (file) => {
                    const filePath = `public/${user.id}/${Date.now()}-${file.name}`;
                    await supabase.storage.from('product-images').upload(filePath, file);
                    return supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;
                })
            );
            const originalImages = [product.image, ...(product.images || [])].filter(Boolean);
            const imagesToDelete = originalImages.filter(img => !existingImages.includes(img));
            if (imagesToDelete.length > 0) {
                setUploadStatus('Deleting old images...');
                const BUCKET_NAME = 'product-images';
                const pathsToDelete = imagesToDelete.map(url => new URL(url).pathname.split(`/${BUCKET_NAME}/`)[1]);
                await supabase.storage.from(BUCKET_NAME).remove(pathsToDelete);
            }

            setUploadStatus('Finalizing product...');
            const finalImageUrls = [...existingImages, ...newImageUrls];
            if (finalImageUrls.length === 0) throw new Error("Product must have at least one image.");
            
            const [mainImage, ...otherImages] = finalImageUrls;

            const productData: Partial<Product> = {
                ...formData,
                image: mainImage,
                images: otherImages,
                features: featuresInput.split('\n').filter(f => f.trim() !== ''),
                sizes: sizesInput.split(',').map(s => s.trim()).filter(s => s !== ''),
                expiryDate: formData.expiryDate || undefined,
            };

            const { error: updateError } = await updateProduct(productId, productData);
            if (updateError) throw updateError;
            
            sessionStorage.removeItem(`editProductFormData-${productId}`);
            setMessage('Product updated successfully!');
            setNewImageFiles([]);
            setNewImagePreviews([]);
            setTimeout(() => setMessage(''), 3000);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
            setUploadStatus('');
        }
    };

    const handleDelete = async () => {
      if (product && window.confirm(`PERMANENTLY DELETE "${product.name}"? This action cannot be undone.`)) {
            setIsActing(true);
            const { error: deleteError } = await deleteProduct(product);
            if (deleteError) {
                setError(deleteError.message || 'Failed to delete product.');
                setIsActing(false);
            } else {
                sessionStorage.removeItem(`editProductFormData-${product.id}`);
                navigate('/seller/products');
            }
        }
    };

    if (loading || profileLoading) {
        return (
            <SellerLayout>
                <div className="flex justify-center items-center h-full">
                    <LoadingSpinner />
                </div>
            </SellerLayout>
        );
    }

    if (!isProfileComplete) {
        return (
            <SellerLayout>
                <IncompleteProfileModal
                    isOpen={true}
                    onClose={() => navigate('/seller/products')}
                    missingFields={missingFields}
                />
            </SellerLayout>
        );
    }

    if (!isAuthorized) { return <SellerLayout><div className="text-center p-8"><p className="text-red-500">{error}</p><BackButton fallback="/seller/products" /></div></SellerLayout>; }
    if (!product) { return <SellerLayout><div className="text-center p-8"><p className="text-brand-light/70">Product not found.</p><BackButton fallback="/seller/products" /></div></SellerLayout>; }


    const formInputClass = "mt-2 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
    const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

    return (
        <SellerLayout>
            <div className="page-fade-in">
                <div className="mb-6"><BackButton fallback="/seller/products" /></div>
                <div className="max-w-4xl mx-auto bg-black/30 border border-brand-gold/20 rounded-lg shadow-lg p-8">
                    <h1 className="font-serif text-4xl text-brand-light mb-2">Edit Product</h1>
                    <p className="text-brand-light/70 mb-8 truncate">Updating "{product.name}"</p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <FormSection title="Basic Product Information">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div><label htmlFor="name" className={formLabelClass}>Product Name</label><input type="text" id="name" name="name" value={formData.name || ''} onChange={handleInputChange} required className={formInputClass} /></div>
                              <div><label htmlFor="brand" className={formLabelClass}>Brand</label><input type="text" id="brand" name="brand" value={formData.brand || ''} onChange={handleInputChange} className={formInputClass} /></div>
                              <div><label htmlFor="categoryId" className={formLabelClass}>Category</label><select id="categoryId" name="categoryId" value={formData.categoryId || ''} onChange={handleInputChange} required className={formInputClass}>{NAVIGATION_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                              {subcategories.length > 0 && <div><label htmlFor="subCategoryId" className={formLabelClass}>Subcategory</label><select id="subCategoryId" name="subCategoryId" value={formData.subCategoryId || ''} onChange={handleInputChange} required className={formInputClass}>{subcategories.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>}
                          </div>
                          <div><label htmlFor="description" className={formLabelClass}>Description</label><textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} required rows={4} className={formInputClass} /></div>
                      </FormSection>

                      <FormSection title="Product Identification">{/* SKU, UPC, Model */}<div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div><label htmlFor="sku" className={formLabelClass}>SKU</label><input type="text" id="sku" name="sku" value={formData.sku || ''} onChange={handleInputChange} className={formInputClass} /></div><div><label htmlFor="upc" className={formLabelClass}>UPC/GTIN</label><input type="text" id="upc" name="upc" value={formData.upc || ''} onChange={handleInputChange} className={formInputClass} /></div><div><label htmlFor="modelNumber" className={formLabelClass}>Model Number</label><input type="text" id="modelNumber" name="modelNumber" value={formData.modelNumber || ''} onChange={handleInputChange} className={formInputClass} /></div></div></FormSection>

                      <FormSection title="Media">
                        <div>
                            <label className={formLabelClass}>Product Images (First is main)</label>
                            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {existingImages.map((img, index) => (
                                    <div key={`existing-${index}`} className="relative aspect-square group">
                                        <img src={img} alt={`Existing image ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                        <button type="button" onClick={() => handleRemoveExistingImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ))}
                                {newImagePreviews.map((preview, index) => (
                                    <div key={`new-${index}`} className="relative aspect-square group">
                                        <img src={preview} alt={`New preview ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                        <button type="button" onClick={() => handleRemoveNewImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove new image">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={triggerFileSelect} className="aspect-square w-full rounded-md bg-black/20 border-2 border-dashed border-brand-gold/30 flex flex-col items-center justify-center text-brand-light/50 hover:border-brand-gold hover:text-brand-light transition-colors">
                                    <Icon name="plus" className="w-8 h-8" /><span className="text-xs mt-1">Add Image</span>
                                </button>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" multiple />
                        </div>
                         <div>
                            <label htmlFor="videoUrl" className={formLabelClass}>Video URL (Optional)</label>
                            <input type="url" id="videoUrl" name="videoUrl" value={formData.videoUrl || ''} onChange={handleInputChange} className={formInputClass} placeholder="https://youtube.com/watch?v=..."/>
                        </div>
                      </FormSection>
                      
                      <FormSection title="Pricing & Stock">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div>
                              <label htmlFor="price" className={formLabelClass}>Selling Price (₹)</label>
                              <input type="number" id="price" name="price" value={formData.price || ''} onChange={handleInputChange} required min="0" step="0.01" className={formInputClass}/>
                            </div>
                            <div>
                              <label htmlFor="originalPrice" className={formLabelClass}>MRP / List Price (₹)</label>
                              <input type="number" id="originalPrice" name="originalPrice" value={formData.originalPrice || ''} onChange={handleInputChange} min="0" step="0.01" className={formInputClass} />
                            </div>
                            <div>
                              <label htmlFor="costPrice" className={formLabelClass}>Cost Price (₹)</label>
                              <input type="number" id="costPrice" name="costPrice" value={formData.costPrice || ''} onChange={handleInputChange} min="0" step="0.01" className={formInputClass} />
                            </div>
                             <div>
                              <label htmlFor="stockQuantity" className={formLabelClass}>Available Stock</label>
                              <input type="number" id="stockQuantity" name="stockQuantity" value={formData.stockQuantity || ''} onChange={handleInputChange} min="0" step="1" className={formInputClass} />
                            </div>
                            <div>
                              <label htmlFor="minOrderQuantity" className={formLabelClass}>Min Order Qty</label>
                              <input type="number" id="minOrderQuantity" name="minOrderQuantity" value={formData.minOrderQuantity || ''} onChange={handleInputChange} min="1" step="1" className={formInputClass} />
                            </div>
                            <div>
                              <label htmlFor="maxOrderQuantity" className={formLabelClass}>Max Order Qty</label>
                              <input type="number" id="maxOrderQuantity" name="maxOrderQuantity" value={formData.maxOrderQuantity || ''} onChange={handleInputChange} min="1" step="1" className={formInputClass} />
                            </div>
                        </div>
                      </FormSection>
                      
                      <FormSection title="Shipping & Logistics">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div><label htmlFor="weightKg" className={formLabelClass}>Weight (kg)</label><input type="number" id="weightKg" name="weightKg" value={formData.weightKg || ''} onChange={handleInputChange} className={formInputClass} /></div>
                              <div><label htmlFor="lengthCm" className={formLabelClass}>Length (cm)</label><input type="number" id="lengthCm" name="lengthCm" value={formData.lengthCm || ''} onChange={handleInputChange} className={formInputClass} /></div>
                              <div><label htmlFor="widthCm" className={formLabelClass}>Width (cm)</label><input type="number" id="widthCm" name="widthCm" value={formData.widthCm || ''} onChange={handleInputChange} className={formInputClass} /></div>
                              <div><label htmlFor="heightCm" className={formLabelClass}>Height (cm)</label><input type="number" id="heightCm" name="heightCm" value={formData.heightCm || ''} onChange={handleInputChange} className={formInputClass} /></div>
                          </div>
                           <div><label htmlFor="deliveryEstimate" className={formLabelClass}>Delivery Estimate</label><input type="text" id="deliveryEstimate" name="deliveryEstimate" value={formData.deliveryEstimate || ''} onChange={handleInputChange} className={formInputClass} placeholder="e.g., 3-5 business days"/></div>
                      </FormSection>
                      
                      <FormSection title="Attributes & Features">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div><label htmlFor="color" className={formLabelClass}>Color</label><input type="text" id="color" name="color" value={formData.color || ''} onChange={handleInputChange} className={formInputClass} /></div>
                              <div><label htmlFor="material" className={formLabelClass}>Material / Fabric</label><input type="text" id="material" name="material" value={formData.material || ''} onChange={handleInputChange} className={formInputClass} /></div>
                          </div>
                          <div><label htmlFor="sizesInput" className={formLabelClass}>Sizes (Comma-separated)</label><input type="text" id="sizesInput" name="sizesInput" value={sizesInput} onChange={e => setSizesInput(e.target.value)} className={formInputClass} placeholder="S, M, L, XL" /></div>
                          <div><label htmlFor="featuresInput" className={formLabelClass}>Features (One per line)</label><textarea id="featuresInput" name="featuresInput" value={featuresInput} onChange={e => setFeaturesInput(e.target.value)} required rows={4} className={formInputClass} /></div>
                      </FormSection>

                      <FormSection title="Compliance & Warranty">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label htmlFor="returnPolicy" className={formLabelClass}>Return Policy Description</label>
                                <input type="text" id="returnPolicy" name="returnPolicy" value={formData.returnPolicy || ''} onChange={handleInputChange} className={formInputClass} placeholder="e.g., 14-Day Returns"/>
                              </div>
                              <div>
                                <label htmlFor="returnDays" className={formLabelClass}>Return Window (in days)</label>
                                <input type="number" id="returnDays" name="returnDays" value={formData.returnDays || ''} onChange={handleInputChange} className={formInputClass} placeholder="e.g., 14" min="0" />
                              </div>
                              <div>
                                <label htmlFor="expiryDate" className={formLabelClass}>Expiry Date (if applicable)</label>
                                <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className={formInputClass} />
                              </div>
                              <div className="md:col-span-2">
                                <label htmlFor="warrantyDetails" className={formLabelClass}>Warranty Details</label>
                                <input type="text" id="warrantyDetails" name="warrantyDetails" value={formData.warrantyDetails || ''} onChange={handleInputChange} className={formInputClass} placeholder="e.g., 1 Year Manufacturer Warranty"/>
                              </div>
                          </div>
                      </FormSection>

                        <div className="pt-4 space-y-4">
                            {error && <p className="text-red-400 text-center">{error}</p>}
                            {message && <p className="text-green-400 text-center">{message}</p>}
                            <button type="submit" disabled={isSubmitting || isActing} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark transition-colors duration-300 uppercase disabled:opacity-50">
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                             <div className="border-t border-brand-gold/20 pt-4">
                                <h3 className="font-serif text-lg text-red-500/80 mb-2">Danger Zone</h3>
                                <button type="button" onClick={handleDelete} disabled={isActing || isSubmitting} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors duration-300 uppercase disabled:opacity-50">
                                    {isActing ? 'Deleting...' : 'Delete Product'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </SellerLayout>
    );
};

export default SellerEditProductPage;