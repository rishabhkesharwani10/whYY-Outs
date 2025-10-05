import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import BackButton from '../components/BackButton.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabase.ts';
import type { ContactMessage } from '../types.ts';
import BottomNav from '../components/BottomNav.tsx';

const mapSupabaseMessage = (msg: any): ContactMessage => ({
  id: msg.id,
  name: msg.name,
  email: msg.email,
  subject: msg.subject,
  message: msg.message,
  userId: msg.user_id,
  createdAt: msg.created_at,
  status: msg.status,
  replyMessage: msg.reply_message,
  repliedAt: msg.replied_at,
});

const QueryDetailModal: React.FC<{ query: ContactMessage, onClose: () => void }> = ({ query, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-2xl p-6 page-fade-in relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-brand-light/70 hover:text-white">&times;</button>
                <h2 className="font-serif text-2xl text-brand-gold mb-4 flex-shrink-0">Query Details</h2>
                
                <div className="overflow-y-auto pr-4 -mr-4 flex-grow">
                    <div className="bg-black/20 p-4 rounded-lg mb-4 border border-brand-gold/10">
                        <p className="text-sm font-semibold text-brand-light mb-1">Subject: {query.subject}</p>
                        <p className="text-xs text-brand-light/60">You sent this on {new Date(query.createdAt).toLocaleString()}</p>
                        <p className="text-brand-light/90 mt-3 whitespace-pre-wrap">{query.message}</p>
                    </div>
                    
                    {query.status === 'closed' && query.replyMessage ? (
                        <div>
                            <h3 className="text-lg font-semibold text-brand-gold-light mt-4">Admin Reply</h3>
                            <div className="bg-brand-gold/5 p-4 rounded-lg mt-2 border border-brand-gold/10">
                                <p className="text-xs text-brand-light/60">Replied on {new Date(query.repliedAt!).toLocaleString()}</p>
                                <p className="text-brand-light/90 mt-3 whitespace-pre-wrap">{query.replyMessage}</p>
                            </div>
                        </div>
                    ) : (
                         <p className="text-center text-sm text-yellow-400/80 mt-4">An admin has not replied to this query yet.</p>
                    )}
                </div>

                <div className="flex-shrink-0 mt-6 pt-4 border-t border-brand-gold/20 flex justify-end">
                    <button onClick={onClose} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Close</button>
                </div>
            </div>
        </div>
    );
};

const MyQueriesPage: React.FC = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<ContactMessage | null>(null);

  const fetchQueries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
        const { data, error: fetchError } = await supabase
            .from('contact_messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        if (fetchError) throw fetchError;
        setQueries(data ? data.map(mapSupabaseMessage) : []);
    } catch (err: any) {
        setError("Failed to load your queries. Please try again.");
        console.error(err);
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    fetchQueries(); // Initial fetch

    const channel = supabase
        .channel(`my-queries-for-${user.id}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'contact_messages', filter: `user_id=eq.${user.id}`},
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newQuery = mapSupabaseMessage(payload.new);
                    setQueries(currentQueries => [newQuery, ...currentQueries]);
                } else if (payload.eventType === 'UPDATE') {
                    const updatedQuery = mapSupabaseMessage(payload.new);
                    setQueries(currentQueries => 
                        currentQueries.map(q => q.id === updatedQuery.id ? updatedQuery : q)
                    );
                }
            }
        )
        .subscribe();

    // Cleanup subscription on component unmount
    return () => {
        supabase.removeChannel(channel);
    };
  }, [user, fetchQueries]);
  
  const getStatusClass = (status: 'open' | 'closed') => {
    return status === 'open' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400';
  };

  return (
    <>
        <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-12">
                <div className="mb-8">
                <BackButton fallback="/profile" />
                </div>
                <h1 className="font-serif text-4xl text-brand-light mb-2">My Queries</h1>
                <p className="text-brand-light/70 mb-8">View your message history with our support team.</p>

                <div className="bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg shadow-brand-gold/10 p-6">
                {loading ? (
                    <p className="text-center p-8">Loading your queries...</p>
                ) : error ? (
                    <p className="text-center p-8 text-red-400">{error}</p>
                ) : queries.length > 0 ? (
                    <div className="space-y-4">
                    {queries.map(query => (
                        <button
                            key={query.id}
                            onClick={() => setSelectedQuery(query)}
                            className="w-full text-left flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-brand-gold/20 rounded-lg hover:bg-brand-gold/5 transition-colors"
                        >
                        <div className="mb-2 sm:mb-0">
                            <h2 className="font-bold text-lg text-brand-light">{query.subject}</h2>
                            <p className="text-sm text-brand-light/70">Submitted on: {new Date(query.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(query.status)}`}>
                            {query.status}
                        </span>
                        </button>
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                    <h2 className="text-xl font-semibold text-brand-light">No queries found.</h2>
                    <p className="text-brand-light/70 mt-2">You haven't sent us any messages yet.</p>
                    <Link to="/contact-us" className="mt-8 inline-block font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
                        Contact Us
                    </Link>
                    </div>
                )}
                </div>
            </main>
            <Footer />
            <BottomNav />
        </div>
        {selectedQuery && <QueryDetailModal query={selectedQuery} onClose={() => setSelectedQuery(null)} />}
    </>
  );
};

export default MyQueriesPage;