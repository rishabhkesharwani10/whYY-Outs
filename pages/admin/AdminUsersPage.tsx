import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import BackButton from '../../components/BackButton.tsx';
import type { Customer, Seller } from '../../types.ts';
import Icon from '../../components/Icon.tsx';
import { supabase } from '../../supabase.ts';

type User = Customer | Seller;

const UserDetailModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
    
    // Helper component for sections
    const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
        <div className={className}>
            <h3 className="font-serif text-xl text-brand-gold mb-4 pb-2 border-b border-brand-gold/20">{title}</h3>
            <div className="space-y-4">{children}</div>
        </div>
    );
    
    // Helper component for individual detail items
    const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; }> = ({ label, value }) => (
        <div>
            <p className="text-xs font-semibold text-brand-gold uppercase tracking-wider">{label}</p>
            <div className="text-brand-light/90 mt-1">{value || <span className="text-brand-light/50">Not Provided</span>}</div>
        </div>
    );

    const renderAddress = () => {
        const { addressLine1, addressLine2, city, state, zip, country } = user;
        const hasAddress = addressLine1 || city || zip || country;

        if (!hasAddress) {
            return null;
        }

        return (
          <>
            {addressLine1 && <p>{addressLine1}</p>}
            {addressLine2 && <p>{addressLine2}</p>}
            {(city || state || zip) && <p>{city}{city && state && ', '}{state} {zip}</p>}
            {country && <p>{country}</p>}
          </>
        );
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[101] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-2xl p-8 page-fade-in relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 text-brand-light/70 hover:text-white" aria-label="Close user details">&times;</button>
                
                <div className="flex items-center gap-6 mb-8">
                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.fullName}&background=1a1a1a&color=bfa181&size=128`} alt={user.fullName} className="w-20 h-20 rounded-full object-cover border-2 border-brand-gold flex-shrink-0" />
                    <div>
                        <h2 className="font-serif text-4xl text-brand-light">{user.fullName}</h2>
                        <span className={`mt-2 inline-block px-3 py-1 text-xs rounded-full font-semibold ${user.role === 'seller' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{user.role}</span>
                    </div>
                </div>

                <div className="space-y-8">
                    <Section title="Contact Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DetailItem label="User ID" value={<code className="text-sm bg-black/30 px-2 py-1 rounded">{user.id}</code>} />
                            <DetailItem label="Email Address" value={<a href={`mailto:${user.email}`} className="hover:underline">{user.email}</a>} />
                            <DetailItem label="Phone Number" value={user.phone} />
                            <DetailItem label="Joined On" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : undefined} />
                        </div>
                    </Section>

                    <Section title="Shipping Address">
                        <DetailItem label="Primary Address" value={renderAddress()} />
                    </Section>
                    
                    {user.role === 'seller' && (
                        <Section title="Business & Tax Information">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <DetailItem label="Business Name" value={(user as Seller).businessName} />
                                <DetailItem label="PAN Number" value={(user as Seller).panNumber} />
                                <DetailItem label="GST Number" value={(user as Seller).gstNumber} />
                                <DetailItem label="Registration No." value={(user as Seller).registrationNumber} />
                            </div>
                        </Section>
                    )}
                </div>
            </div>
        </div>
    );
};


const AdminUsersPage: React.FC = () => {
    const [allUsers, setAllUsers] = useState<(Customer | Seller)[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'seller'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchAllUsers = async () => {
            setLoading(true);
            const { data: customers } = await supabase.from('customers').select('*');
            const { data: sellers } = await supabase.from('sellers').select('*');
            const all = [
                ...(customers || []).map(c => ({ ...c, fullName: c.full_name, createdAt: c.created_at, role: 'customer' as const })),
                ...(sellers || []).map(s => ({ ...s, fullName: s.full_name, createdAt: s.created_at, role: 'seller' as const }))
            ];
            setAllUsers(all);
            setLoading(false);
        };
        fetchAllUsers();
    }, []);
    
    const filteredUsers = useMemo(() => {
        return allUsers.filter(user => {
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesSearch = searchTerm === '' ||
                user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.role === 'seller' && (user as Seller).businessName?.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesRole && matchesSearch;
        });
    }, [allUsers, searchTerm, roleFilter]);

    const customerCount = useMemo(() => allUsers.filter(u => u.role === 'customer').length, [allUsers]);
    const sellerCount = useMemo(() => allUsers.filter(u => u.role === 'seller').length, [allUsers]);

    const FilterButton: React.FC<{ value: typeof roleFilter, label: string, count: number }> = ({ value, label, count }) => {
        const isActive = roleFilter === value;
        return (
            <button
                onClick={() => setRoleFilter(value)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${isActive ? 'bg-brand-gold text-brand-dark font-semibold' : 'bg-black/40 text-brand-light/70 hover:bg-brand-gold/10'}`}
            >
                {label} <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-brand-dark/20' : 'bg-brand-dark/60'}`}>{count}</span>
            </button>
        );
    };

    return (
        <AdminLayout>
            <div className="page-fade-in">
                <div className="mb-6">
                    <BackButton fallback="/admin" />
                </div>
                <h1 className="font-serif text-4xl text-brand-light">Manage Users</h1>
                <p className="text-brand-light/70 mt-1">Viewing all {allUsers.length} registered users.</p>
                
                 <div className="my-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search by name, email, business..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-black/30 border border-brand-gold/30 rounded-md py-2 pl-10 pr-4 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        />
                         <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-light/50" />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <FilterButton value="all" label="All" count={allUsers.length} />
                        <FilterButton value="customer" label="Customers" count={customerCount} />
                        <FilterButton value="seller" label="Sellers" count={sellerCount} />
                    </div>
                </div>
                
                <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto">
                    <table className="w-full text-left min-w-[720px]">
                        <thead className="bg-black/50 border-b border-brand-gold/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">User</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Role</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Contact</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Joined</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-8">Loading users...</td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-brand-gold/5">
                                    <td className="p-4">
                                        <p className="font-semibold text-brand-light">{user.fullName || 'N/A'}</p>
                                        <p className="text-sm text-brand-light/60">{user.email}</p>
                                    </td>
                                    <td className="p-4 capitalize">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${user.role === 'seller' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{user.role}</span>
                                    </td>
                                    <td className="p-4">{user.phone || 'N/A'}</td>
                                    <td className="p-4 text-sm text-brand-light/70">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => setSelectedUser(user)} className="text-sm font-semibold text-brand-gold hover:underline">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredUsers.length === 0 && !loading && (
                        <p className="text-center p-8 text-brand-light/70">No users match the current filters.</p>
                    )}
                </div>
            </div>
            {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
        </AdminLayout>
    );
};

export default AdminUsersPage;
