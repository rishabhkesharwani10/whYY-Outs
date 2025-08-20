import React, { useState, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import { useProducts } from '../hooks/useProducts.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { NAVIGATION_CATEGORIES } from '../constants.ts';
import type { Product } from '../types.ts';
import { supabase } from '../supabase.ts';
import Icon from '../components/Icon.tsx';

const AddProductPage: React.FC = () => {
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();
  const { addProduct } = useProducts();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adminMode = location.state?.adminMode || false;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [categoryId, setCategoryId] = useState(NAVIGATION_CATEGORIES[0]?.id || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [features, setFeatures] = useState('');
  const [sizes, setSizes] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploadStatus('');
    setIsUploading(true);

    if (!user) {
      setError('You must be logged in to add a product.');
      setIsUploading(false);
      return;
    }
    if (!name || !description || !price || !categoryId || !features || !imageFile) {
      setError('Please fill out all required fields and upload an image.');
      setIsUploading(false);
      return;
    }

    try {
      setUploadStatus('Uploading image...');
      const filePath = `public/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      setUploadStatus('Finalizing product...');
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      const imageUrl = publicUrlData.publicUrl;

      const productData: Omit<Product, 'id' | 'rating' | 'reviewCount'> = {
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        image: imageUrl,
        images: [],
        categoryId,
        features: features.split('\n').filter(f => f.trim() !== ''),
        sizes: sizes.split(',').map(s => s.trim()).filter(s => s !== ''),
        sellerId: user.id,
      };
      
      const { data: newProduct, error: addError } = await addProduct(productData);
      
      if (addError) {
          throw addError;
      } else if (newProduct) {
          if (adminMode) {
            // Redirect to the new edit page for admins
            navigate(`/admin/products/edit/${newProduct.id}`);
          } else {
            // Keep original flow for sellers
            navigate('/seller-dashboard');
          }
      } else {
          // Fallback in case newProduct is null without an error
          navigate(adminMode ? '/admin/products' : '/seller-dashboard');
      }
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
        setIsUploading(false);
        setUploadStatus('');
    }
  };
  
  const formInputClass = "mt-2 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
  const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-8">
          <BackButton />
        </div>
        <div className="max-w-3xl mx-auto bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-8">
          <h1 className="font-serif text-4xl text-brand-light mb-2">Add a New Product</h1>
          <p className="text-brand-light/70 mb-8">Fill out the details below to list your item for sale.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className={formLabelClass}>Product Name</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={formInputClass} placeholder="e.g. Classic Leather Wallet"/>
            </div>

            <div>
              <label htmlFor="description" className={formLabelClass}>Description</label>
              <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={4} className={formInputClass} placeholder="A detailed description of your product."/>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className={formLabelClass}>Price ($)</label>
                <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" className={formInputClass} placeholder="99.99"/>
              </div>
              <div>
                <label htmlFor="originalPrice" className={formLabelClass}>Original Price (Optional)</label>
                <input type="number" id="originalPrice" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} min="0" step="0.01" className={formInputClass} placeholder="129.99"/>
              </div>
            </div>

            <div>
                <label htmlFor="category" className={formLabelClass}>Category</label>
                <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} required className={formInputClass}>
                    {NAVIGATION_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

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
                        Upload Image
                    </button>
                </div>
            </div>

            <div>
              <label htmlFor="features" className={formLabelClass}>Features (One per line)</label>
              <textarea id="features" value={features} onChange={e => setFeatures(e.target.value)} required rows={4} className={formInputClass} placeholder="100% Genuine Leather\nHand-stitched\nMultiple Card Slots"/>
            </div>

            <div>
              <label htmlFor="sizes" className={formLabelClass}>Sizes (Comma-separated, optional)</label>
              <input type="text" id="sizes" value={sizes} onChange={e => setSizes(e.target.value)} className={formInputClass} placeholder="S, M, L, XL"/>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="pt-4">
              <button type="submit" disabled={isUploading} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center">
                {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-3"></div>
                      <span>{uploadStatus || 'Processing...'}</span>
                    </>
                  ) : (
                    'Add Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddProductPage;