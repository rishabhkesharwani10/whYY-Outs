
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerLayout from '../../components/SellerLayout.tsx';
import BackButton from '../../components/BackButton.tsx';
import { useProducts } from '../../hooks/useProducts.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { NAVIGATION_CATEGORIES } from '../../constants.ts';
import type { Product } from '../../types.ts';
import { supabase } from '../../supabase.ts';
import Icon from '../../components/Icon.tsx';
import { useSellerProfileStatus } from '../../hooks/useSellerProfileStatus.ts';
import LoadingSpinner from '../../components/LoadingSpinner.tsx';

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-t border-brand-gold/20 pt-6 mt-6 first:mt-0 first:border-t-0 first:pt-0">
    <h2 className="font-serif text-2xl text-brand-gold mb-6">{title}</h2>
    <div className="space-y-6">{children}</div>
  </div>
);

const SellerAddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { addProduct } = useProducts();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isProfileComplete, loading: profileLoading, missingFields } = useSellerProfileStatus();

  const getInitialState = (key: string, defaultValue: any) => {
    try {
      const saved = sessionStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const initialFormData = {
    name: '', description: '', price: undefined, originalPrice: undefined,
    categoryId: NAVIGATION_CATEGORIES[0]?.id || '', subCategoryId: '', brand: '',
    sku: '', upc: '', modelNumber: '', videoUrl: '', costPrice: undefined,
    stockQuantity: undefined, minOrderQuantity: 1, maxOrderQuantity: undefined,
    weightKg: undefined, lengthCm: undefined, widthCm: undefined, heightCm: undefined,
    deliveryEstimate: '', color: '', material: '', expiryDate: '', returnPolicy: '',
    warrantyDetails: '', features: [], sizes: [],
  };

  const [formData, setFormData] = useState<Partial<Product>>(() => getInitialState('sellerAddProductFormData', initialFormData));
  const [featuresInput, setFeaturesInput] = useState<string>(() => sessionStorage.getItem('sellerAddProductFeaturesInput') || '');
  const [sizesInput, setSizesInput] = useState<string>(() => sessionStorage.getItem('sellerAddProductsizesInput') || '');
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
      if (user?.role === 'seller' && !profileLoading && !isProfileComplete) {
          navigate('/edit-profile', { 
              replace: true,
              state: { 
                  message: 'Please complete your profile before adding products.',
                  missingFields: missingFields 
              } 
          });
      }
  }, [user, profileLoading, isProfileComplete, navigate, missingFields]);

  useEffect(() => { sessionStorage.setItem('sellerAddProductFormData', JSON.stringify(formData)); }, [formData]);
  useEffect(() => { sessionStorage.setItem('sellerAddProductFeaturesInput', featuresInput); }, [featuresInput]);
  useEffect(() => { sessionStorage.setItem('sellerAddProductsizesInput', sizesInput); }, [sizesInput]);


  const subcategories = useMemo(() => {
    const selected = NAVIGATION_CATEGORIES.find(c => c.id === formData.categoryId);
    return selected?.subCategories || [];
  }, [formData.categoryId]);
  
  useEffect(() => {
    if (subcategories.length > 0 && !subcategories.find(sc => sc.id === formData.subCategoryId)) {
      setFormData(prev => ({ ...prev, subCategoryId: subcategories[0].id }));
    } else if (subcategories.length === 0) {
      setFormData(prev => ({ ...prev, subCategoryId: '' }));
    }
  }, [subcategories, formData.subCategoryId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['price', 'originalPrice', 'costPrice', 'stockQuantity', 'minOrderQuantity', 'maxOrderQuantity', 'weightKg', 'lengthCm', 'widthCm', 'heightCm'];
    if (numericFields.includes(name)) {
      setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);
      files.forEach((file: File) => {
          const reader = new FileReader();
          reader.onloadend = () => { setImagePreviews(prev => [...prev, reader.result as string]); };
          reader.readAsDataURL(file);
      });
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const clearSavedState = () => {
    sessionStorage.removeItem('sellerAddProductFormData');
    sessionStorage.removeItem('sellerAddProductFeaturesInput');
    sessionStorage.removeItem('sellerAddProductsizesInput');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploadStatus('');
    setIsUploading(true);

    if (!user) { setError('You must be logged in.'); setIsUploading(false); return; }
    if (!formData.name || !formData.description || !formData.price || !formData.categoryId || imageFiles.length === 0) {
      setError('Please fill out all required fields: Name, Description, Price, Category, and at least one Image.');
      setIsUploading(false);
      return;
    }

    try {
      setUploadStatus(`Uploading ${imageFiles.length} image(s)...`);
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const filePath = `public/${user.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
          return publicUrlData.publicUrl;
        })
      );
      
      setUploadStatus('Finalizing product...');
      const [mainImage, ...otherImages] = imageUrls;

      const productData: Omit<Product, 'id' | 'rating' | 'reviewCount'> = {
        ...formData,
        name: formData.name!,
        description: formData.description!,
        categoryId: formData.categoryId!,
        price: formData.price!,
        image: mainImage,
        images: otherImages,
        features: featuresInput.split('\n').filter(f => f.trim() !== ''),
        sizes: sizesInput.split(',').map(s => s.trim()).filter(s => s !== ''),
        sellerId: user.id,
        expiryDate: formData.expiryDate || undefined,
      };
      
      const { error: addError } = await addProduct(productData);
      
      if (addError) throw addError;
      clearSavedState();
      
      navigate('/seller/products');
      
    } catch (err: any) {
        setError(`Failed to add product: ${err.message}.`);
        setIsUploading(false);
        setUploadStatus('');
    }
  };
  
  const formInputClass = "mt-2 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
  const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

  if (user?.role === 'seller' && (profileLoading || !isProfileComplete)) {
      return (
          <SellerLayout>
            <LoadingSpinner />
          </SellerLayout>
      );
  }

  return (
    <SellerLayout>
      <div className="page-fade-in">
        <div className="mb-8">
          <BackButton fallback='/seller/products' />
        </div>
        <div className="max-w-4xl mx-auto bg-black/30 border border-brand-gold/20 rounded-lg shadow-lg p-8">
          <h1 className="font-serif text-4xl text-brand-light mb-2">Add a New Product</h1>
          <p className="text-brand-light/70 mb-8">Fill out the details below to list your item for sale.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormSection title="Basic Product Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className={formLabelClass}>Product Name / Title</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className={formInputClass} />
                </div>
                <div>
                  <label htmlFor="brand" className={formLabelClass}>Brand / Manufacturer</label>
                  <input type="text" id="brand" name="brand" value={formData.brand} onChange={handleInputChange} className={formInputClass} />
                </div>
                <div>
                  <label htmlFor="categoryId" className={formLabelClass}>Category</label>
                  <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleInputChange} required className={formInputClass}>
                    {NAVIGATION_CATEGORIES.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
                {subcategories.length > 0 && (
                  <div>
                    <label htmlFor="subCategoryId" className={formLabelClass}>Subcategory</label>
                    <select id="subCategoryId" name="subCategoryId" value={formData.subCategoryId} onChange={handleInputChange} required className={formInputClass}>
                      {subcategories.map(sub => (<option key={sub.id} value={sub.id}>{sub.name}</option>))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="description" className={formLabelClass}>Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} required rows={4} className={formInputClass} />
              </div>
            </FormSection>

            <FormSection title="Product Identification">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="sku" className={formLabelClass}>SKU</label>
                        <input type="text" id="sku" name="sku" value={formData.sku || ''} onChange={handleInputChange} className={formInputClass} />
                    </div>
                    <div>
                        <label htmlFor="upc" className={formLabelClass}>UPC/GTIN</label>
                        <input type="text" id="upc" name="upc" value={formData.upc || ''} onChange={handleInputChange} className={formInputClass} />
                    </div>
                    <div>
                        <label htmlFor="modelNumber" className={formLabelClass}>Model Number</label>
                        <input type="text" id="modelNumber" name="modelNumber" value={formData.modelNumber || ''} onChange={handleInputChange} className={formInputClass} />
                    </div>
                </div>
            </FormSection>

            <FormSection title="Media">
              <div>
                  <label className={formLabelClass}>Product Images (First is main)</label>
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square group transition-transform duration-300 hover:scale-105">
                              <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                              <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 leading-none opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
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
                    <div><label htmlFor="expiryDate" className={formLabelClass}>Expiry Date (if applicable)</label><input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate || ''} onChange={handleInputChange} className={formInputClass} /></div>
                    <div><label htmlFor="returnPolicy" className={formLabelClass}>Return Policy</label><input type="text" id="returnPolicy" name="returnPolicy" value={formData.returnPolicy || ''} onChange={handleInputChange} className={formInputClass} placeholder="e.g., 14-Day Returns"/></div>
                </div>
                <div><label htmlFor="warrantyDetails" className={formLabelClass}>Warranty Details</label><input type="text" id="warrantyDetails" name="warrantyDetails" value={formData.warrantyDetails || ''} onChange={handleInputChange} className={formInputClass} placeholder="e.g., 1 Year Manufacturer Warranty"/></div>
            </FormSection>

            {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-md">{error}</p>}

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isUploading} 
                className={`w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center ${isUploading ? 'animate-subtle-pulse' : ''}`}
              >
                {isUploading ? (<><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-3"></div><span>{uploadStatus || 'Processing...'}</span></>) : ('Add Product')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerAddProductPage;
