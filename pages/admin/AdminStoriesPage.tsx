
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import BackButton from '../../components/BackButton.tsx';
import { supabase } from '../../supabase.ts';
import type { Story } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import Icon from '../../components/Icon.tsx';

const AdminStoriesPage: React.FC = () => {
    const { user } = useAuth();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Form state
    const [title, setTitle] = useState('');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fetchStories = useCallback(async () => {
        setLoading(true);
        const { data, error: fetchError } = await supabase.from('stories').select('*').order('created_at', { ascending: false });
        if (fetchError) {
            setError('Failed to fetch stories.');
            console.error(fetchError);
        } else {
            setStories(data as Story[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mediaFile || !user) {
            setError('Please select a media file to upload.');
            return;
        }
        setIsUploading(true);
        setError('');
        setMessage('');

        try {
            const fileExt = mediaFile.name.split('.').pop();
            const filePath = `public/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('stories-media').upload(filePath, mediaFile);
            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage.from('stories-media').getPublicUrl(filePath);

            const { error: insertError } = await supabase.from('stories').insert({
                admin_id: user.id,
                media_url: publicUrlData.publicUrl,
                media_type: mediaFile.type.startsWith('video') ? 'video' : 'image',
                title: title,
                duration_seconds: mediaFile.type.startsWith('video') ? 15 : 7 // default durations
            });
            if (insertError) throw insertError;
            
            setMessage('Story uploaded successfully!');
            setTitle('');
            setMediaFile(null);
            setMediaPreview(null);
            await fetchStories();

        } catch (err: any) {
            setError(`Upload failed: ${err.message}`);
        } finally {
            setIsUploading(false);
            setTimeout(() => { setMessage(''); setError(''); }, 3000);
        }
    };

    const handleDelete = async (story: Story) => {
        if (window.confirm(`Are you sure you want to delete the story "${story.title}"?`)) {
            try {
                // Delete from DB first
                const { error: dbError } = await supabase.from('stories').delete().eq('id', story.id);
                if (dbError) throw dbError;

                // Then delete from storage
                const filePath = new URL(story.media_url).pathname.split('/stories-media/')[1];
                const { error: storageError } = await supabase.storage.from('stories-media').remove([filePath]);
                if (storageError) throw storageError;

                await fetchStories();
            } catch (err: any) {
                setError(`Deletion failed: ${err.message}`);
            }
        }
    };

    return (
        <AdminLayout>
            <div className="page-fade-in">
                <div className="mb-6"><BackButton fallback="/admin" /></div>
                <h1 className="font-serif text-4xl text-brand-light">Manage Stories</h1>
                <p className="text-brand-light/70 mt-1">Add or remove stories from the homepage reel.</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    <div className="lg:col-span-1 bg-black/30 border border-brand-gold/20 rounded-lg p-6 h-fit">
                        <h2 className="font-serif text-2xl text-brand-gold mb-4">Add New Story</h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-gold mb-2">Media (Image or Video)</label>
                                <input type="file" onChange={handleFileChange} accept="image/*,video/mp4" className="block w-full text-sm text-brand-light/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-gold/10 file:text-brand-gold hover:file:bg-brand-gold/20" />
                                {mediaPreview && (
                                    <div className="mt-4">
                                        {mediaFile?.type.startsWith('video') ? (
                                            <video src={mediaPreview} controls className="w-full rounded-md" />
                                        ) : (
                                            <img src={mediaPreview} alt="Preview" className="w-full rounded-md" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-brand-gold mb-2">Title (Optional)</label>
                                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-sm" />
                            </div>
                            <button type="submit" disabled={isUploading} className="w-full mt-2 font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase disabled:opacity-50">
                                {isUploading ? 'Uploading...' : 'Upload Story'}
                            </button>
                            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                            {message && <p className="text-green-400 text-sm mt-2">{message}</p>}
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-black/30 border border-brand-gold/20 rounded-lg p-6">
                        <h2 className="font-serif text-2xl text-brand-light mb-4">Current Stories</h2>
                        {loading ? <p>Loading stories...</p> : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {stories.map(story => (
                                    <div key={story.id} className="relative group aspect-square">
                                        <img src={story.media_type === 'image' ? story.media_url : 'https://via.placeholder.com/150/101010/BFA181?text=Video'} alt={story.title} className="w-full h-full object-cover rounded-md" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                                            <p className="text-xs font-semibold truncate">{story.title || 'Untitled'}</p>
                                            <button onClick={() => handleDelete(story)} className="self-end p-1 bg-red-600 rounded-full text-white">
                                                <Icon name="trash" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                         {!loading && stories.length === 0 && <p className="text-center py-8 text-brand-light/70">No stories have been uploaded yet.</p>}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminStoriesPage;
