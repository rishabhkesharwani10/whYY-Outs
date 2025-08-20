import React from 'react';
import AdminLayout from '../../components/AdminLayout.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

const AdminUsersPage: React.FC = () => {
    const { allUsers } = useAuth();
    
    return (
        <AdminLayout>
            <div className="page-fade-in">
                <h1 className="font-serif text-4xl text-brand-light">Manage Users</h1>
                <p className="text-brand-light/70 mt-1">Viewing all {allUsers.length} registered users.</p>
                
                <div className="bg-black/30 border border-brand-gold/20 rounded-lg overflow-x-auto mt-6">
                    <table className="w-full text-left min-w-[640px]">
                        <thead className="bg-black/50 border-b border-brand-gold/20">
                            <tr>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">User</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Email</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Role</th>
                                <th className="p-4 text-sm font-semibold uppercase tracking-wider">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-gold/20">
                            {allUsers.map(user => (
                                <tr key={user.id} className="hover:bg-brand-gold/5">
                                    <td className="p-4 font-semibold text-brand-light">{user.fullName || 'N/A'}</td>
                                    <td className="p-4">{user.email}</td>
                                    <td className="p-4 capitalize">
                                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${user.role === 'seller' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{user.role}</span>
                                    </td>
                                    <td className="p-4 text-sm text-brand-light/70">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsersPage;