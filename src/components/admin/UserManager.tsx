import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, deleteUser, createUser } from '../../api/user';
import { User } from '../../api/types';
import ConfirmModal from './ConfirmModal';
import CreateUserModal from './CreateUserModal';
import { useNavigate } from 'react-router-dom';

interface UserManagerProps {
    createTrigger: number;
    onTriggerHandled?: () => void;
}

const UserManager: React.FC<UserManagerProps> = ({ createTrigger, onTriggerHandled }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [confirmDeleteState, setConfirmDeleteState] = useState<{ isOpen: boolean; id: string | null; name: string }>({
        isOpen: false,
        id: null,
        name: ''
    });

    // Watch for external create trigger
    useEffect(() => {
        if (createTrigger > 0) {
            setIsCreateModalOpen(true);
            onTriggerHandled?.();
        }
    }, [createTrigger, onTriggerHandled]);

    const { data: userRes, isLoading: loading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => getUsers(0, 100)
    });
    const users = (userRes?.items || []) as User[];

    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setIsCreateModalOpen(false);
        },
        onError: (err: any) => {
            alert(err?.response?.data?.detail || 'Error creating user');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setConfirmDeleteState({ isOpen: false, id: null, name: '' });
        },
        onError: () => {
            alert('Error deleting user');
        }
    });

    const handleCreate = (userData: any) => {
        createMutation.mutate(userData);
    };

    const handleDelete = (id: string, name: string) => {
        setConfirmDeleteState({ isOpen: true, id, name });
    };

    const handleConfirmDelete = () => {
        if (confirmDeleteState.id) {
            deleteMutation.mutate(confirmDeleteState.id);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = [
        { label: 'Total Users', value: users.length, icon: 'group', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Administrators', value: users.filter(u => u.is_superuser).length, icon: 'admin_panel_settings', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Active Status', value: users.filter(u => u.is_active).length, icon: 'person_outline', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Verified', value: users.length, icon: 'verified', color: 'text-orange-600', bg: 'bg-orange-50' }, // Placeholder
    ];

    return (
        <div className="p-8">
            {/* Header with Refresh */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="material-icons text-indigo-600">group</span>
                        All Users
                    </h1>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Manage user accounts and permissions</p>
                </div>
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                    <span className="material-icons text-sm">refresh</span>
                    Refresh
                </button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="p-6 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                        <div className={`w-12 h-12 ${stat.bg} dark:bg-slate-900 rounded-xl flex items-center justify-center ${stat.color}`}>
                            <span className="material-icons">{stat.icon}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{stat.value}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                        />
                        <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                    </div>
                </div>
            </div>

            {/* Redesigned Table */}
            <div className="overflow-x-auto rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                <table className="w-full text-left font-sans">
                    <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-indigo-50/50 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Loading Users...</span>
                                </div>
                            </td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-400 uppercase text-[10px] font-bold tracking-widest italic">No matching users</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-[10px] font-black uppercase border border-white/10 overflow-hidden">
                                                {user.username?.[0] || 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase leading-none mb-0.5">{user.full_name || user.username}</span>
                                                <span className="text-[9px] text-gray-400 font-bold lowercase leading-none">{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.is_superuser ? (
                                            <span className="px-2.5 py-1 bg-indigo-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest leading-none">Admin</span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-gray-400 text-white rounded-full text-[8px] font-black uppercase tracking-widest leading-none">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{user.is_active ? 'Active' : 'Banned'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 pr-2">
                                            <button onClick={() => navigate(`/u/${user.username}`)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-lg transition-all" title="View Profile">
                                                <span className="material-icons text-lg">visibility</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id, user.username!)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Delete User"
                                            >
                                                <span className="material-icons text-lg">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onConfirm={handleCreate}
                isLoading={createMutation.isPending}
            />

            <ConfirmModal
                isOpen={confirmDeleteState.isOpen}
                onClose={() => setConfirmDeleteState({ ...confirmDeleteState, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="Delete User Account?"
                message={`Are you sure you want to permanently delete "${confirmDeleteState.name}"? This action cannot be undone.`}
                confirmText="Yes, Delete User"
                isDestructive={true}
            />
        </div>
    );
};

export default UserManager;
