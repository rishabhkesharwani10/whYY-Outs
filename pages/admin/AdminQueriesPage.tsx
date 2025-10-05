import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import BackButton from '../../components/BackButton.tsx';
import { supabase } from '../../supabase.ts';
import type { ContactMessage } from '../../types.ts';

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

const ReplyModal: React.FC<{ query: ContactMessage, onClose: () => void }> = ({ query, onClose }) => {
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!replyMessage.trim()) {
            setError('Reply message cannot be empty.');
            return;
        }
        setIsSubmitting(true);
        setError('');

        const { error: updateError } = await supabase
            .from('contact_messages')
            .update({
                status: 'closed',
                reply_message: replyMessage,
                replied_at: new Date().toISOString()
            })
            .eq('id', query.id);

        if (updateError) {
            setError('Failed to send reply. Please try again.');
            console.error(updateError);
        } else {
            // In a real app, an email would be triggered here via a Supabase Edge Function.
            // The UI will update via the real-time subscription, so we just need to close the modal.
            onClose();
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-2xl p-6 page-fade-in relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-brand-light/70 hover:text-white">&times;</button>
                <h2 className="font-serif text-2xl text-brand-gold mb-4 flex-shrink-0">Replying to {query.name}</h2>
                
                <div className="overflow-y-auto pr-4 -mr-4 flex-grow">
                    <div className="bg-black/20 p-4 rounded-lg mb-4 border border-brand-gold/10">
                        <p className="text-sm font-semibold text-brand-light mb-1">Subject: {query.subject}</p>
                        <p className="text-xs text-brand-light/60">From: {query.email} on {new Date(query.createdAt).toLocaleString()}</p>
                        <p className="text-brand-light/90 mt-3 whitespace-pre-wrap">{query.message}</p>
                    </div>
                    
                    {query.status === 'closed' ? (
                        <div>
                            <h3 className="text-lg font-semibold text-brand-gold-light mt-4">Your Reply</h3>
                            <div className="bg-brand-gold/5 p-4 rounded-lg mt-2 border border-brand-gold/10">
                                <p className="text-xs text-brand-light/60">Replied on {new Date(query.repliedAt!).toLocaleString()}</p>
                                <p className="text-brand-light/90 mt-3 whitespace-pre-wrap">{query.replyMessage}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="replyMessage" className="block text-sm font-medium text-brand-gold mb-2">Your Reply</label>
                            <textarea id="replyMessage" value={replyMessage} onChange={e => setReplyMessage(e.target.value)} rows={6} className="w-full bg-black/50 border border-brand-gold/30 rounded-md py-2 px-3 text-sm" />
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 mt-6 pt-4 border-t border-brand-gold/20">
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button onClick={onClose} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-light/50 text-brand-light/80 hover:bg-brand-light/10">Close</button>
                        {query.status === 'open' && (
                            <button onClick={handleSubmit} disabled={isSubmitting} className="font-sans text-sm tracking-widest px-6 py-2 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark disabled:opacity-50">
                                {isSubmitting ? 'Sending...' : 'Send Reply & Close'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminQueriesPage: React.FC = () => {
    const [queries, setQueries] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');
    const [selectedQuery, setSelectedQuery] = useState<ContactMessage | null>(null);

    const fetchQueries = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
            if (fetchError) throw fetchError;
            setQueries(data ? data.map(mapSupabaseMessage) : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueries();

        const channel = supabase
            .channel('admin-queries-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contact_messages' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newQuery = mapSupabaseMessage(payload.new);
                        setQueries(currentQueries => [newQuery, ...currentQueries]);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedQuery = mapSupabaseMessage(payload.new);
                        setQueries(currentQueries => 
                            currentQueries.map(q => q.id === updatedQuery.id ? updatedQuery : q)
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setQueries(currentQueries => currentQueries.filter(q => q.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchQueries]);

    const filteredQueries = useMemo(() => {
        if (filter === 'all') return queries;
        return queries.filter(q => q.status === filter);
    }, [queries, filter]);
    
    const getStatusClass = (status: 'open' | 'closed') => {
        return status === 'open' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400';
    };

    const FilterButton: React.FC<{ value: typeof filter, label: string }> = ({ value, label }) => {
        const isActive = filter === value;
        return (
            <button
                onClick={() => setFilter(value)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${isActive ? 'bg-brand-gold text-brand-dark font-semibold' : 'bg-black/40 text-brand-light/70 hover:bg-brand-gold/10'}`}
            >
                {label}
            </button>
        );
    };

    return (
        <AdminLayout>
            <div className="page-fade-in">
                <div className="mb-6"><BackButton fallback="/admin" /></div>
                <h1 className="font-serif text-4xl text-brand-light">Customer Queries</h1>
                <p className="text-brand-light/70 mt-1">Review and respond to messages from the Contact Us page.</p>

                <div className="my-6 flex items-center gap-2">
                    <FilterButton value="open" label="Open" />
                    <FilterButton value="closed" label="Closed" />
                    <FilterButton value="all" label="All" />
                </div>
                
                <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto">
                    <table className="w-full text-left min-w-[720px]">
                        <thead className="bg-black/50 border-b border-brand-gold/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">From</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Subject</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Date</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-8">Loading queries...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={5} className="text-center p-8 text-red-400">{error}</td></tr>
                            ) : filteredQueries.length > 0 ? (
                                filteredQueries.map(query => (
                                    <tr key={query.id} className="hover:bg-brand-gold/5">
                                        <td className="p-4">
                                            <p className="font-semibold">{query.name}</p>
                                            <p className="text-xs text-brand-light/60">{query.email}</p>
                                        </td>
                                        <td className="p-4 text-sm">{query.subject}</td>
                                        <td className="p-4 text-sm">{new Date(query.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(query.status)}`}>{query.status}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => setSelectedQuery(query)} className="text-sm font-semibold text-brand-gold hover:underline">
                                                {query.status === 'open' ? 'View & Reply' : 'View'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="text-center p-16 text-brand-light/70">No queries found for this filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedQuery && <ReplyModal query={selectedQuery} onClose={() => setSelectedQuery(null)} />}
        </AdminLayout>
    );
};

export default AdminQueriesPage;