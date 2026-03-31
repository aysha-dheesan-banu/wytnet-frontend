import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, deletePost, createPost } from '../../api/post';
import { Post } from '../../api/types';
import ConfirmModal from './ConfirmModal';
import CreatePostModal from './CreatePostModal';

interface PostManagerProps {
    createTrigger: number;
    onTriggerHandled?: () => void;
}

const PostManager: React.FC<PostManagerProps> = ({ createTrigger, onTriggerHandled }) => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [confirmDeleteState, setConfirmDeleteState] = useState<{ isOpen: boolean; id: string | null; title: string }>({
        isOpen: false,
        id: null,
        title: ''
    });

    // Watch for external create trigger
    useEffect(() => {
        if (createTrigger > 0) {
            setIsCreateModalOpen(true);
            onTriggerHandled?.();
        }
    }, [createTrigger, onTriggerHandled]);

    const { data: postRes, isLoading: loading } = useQuery({
        queryKey: ['admin-posts'],
        queryFn: () => getPosts()
    });
    const posts = (postRes?.items || []) as Post[];

    const createMutation = useMutation({
        mutationFn: createPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
            setIsCreateModalOpen(false);
        },
        onError: (err: any) => {
            alert(err?.response?.data?.detail || 'Error creating post');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deletePost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
            setConfirmDeleteState({ isOpen: false, id: null, title: '' });
        },
        onError: () => {
            alert('Error deleting post');
        }
    });

    const handleCreate = (postData: any) => {
        createMutation.mutate(postData);
    };

    const handleDelete = (id: string, title: string) => {
        setConfirmDeleteState({ isOpen: true, id, title });
    };

    const handleConfirmDelete = () => {
        if (confirmDeleteState.id) {
            deleteMutation.mutate(confirmDeleteState.id);
        }
    };

    const filteredPosts = posts.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.content?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = [
        { label: 'Total', value: posts.length, icon: 'article', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active', value: posts.filter(p => !p.valid_until || new Date(p.valid_until) > new Date()).length, icon: 'check_circle', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Needs', value: posts.filter(p => p.post_type === 'NEED').length, icon: 'shopping_basket', color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Offers', value: posts.filter(p => p.post_type === 'OFFER').length, icon: 'local_offer', color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Responses', value: posts.reduce((acc, p) => acc + (p.comment_count || 0), 0), icon: 'chat_bubble', color: 'text-rose-600', bg: 'bg-rose-50' }
    ];

    return (
        <div className="p-8">
            {/* Header with Refresh */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="material-icons text-indigo-600">article</span>
                        All Posts
                    </h1>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Manage and moderate WytWall posts</p>
                </div>
                <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-posts'] })}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                    <span className="material-icons text-sm">refresh</span>
                    Refresh
                </button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4">
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
                            placeholder="Search posts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                        />
                        <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <span className="material-icons text-sm">search</span>
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <select className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none">
                            <option>Type</option>
                        </select>
                        <select className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none">
                            <option>Status</option>
                        </select>
                        <select className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none">
                            <option>Category</option>
                        </select>
                        <button className="p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors">
                            <span className="material-icons text-sm">tune</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Redesigned Table */}
            <div className="overflow-x-auto rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                <table className="w-full text-left font-sans">
                    <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Eng.</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Public</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                        {loading ? (
                            <tr><td colSpan={9} className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-indigo-50/50 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Loading Posts...</span>
                                </div>
                            </td></tr>
                        ) : filteredPosts.length === 0 ? (
                            <tr><td colSpan={9} className="px-6 py-20 text-center text-gray-400 uppercase text-[10px] font-bold tracking-widest italic">No matching posts</td></tr>
                        ) : (
                            filteredPosts.map(post => (
                                <tr key={post.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-all group">
                                    <td className="px-6 py-4">
                                        {post.post_type === 'OFFER' ? (
                                            <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest leading-none">Offer</span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-indigo-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest leading-none">Need</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Concept</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] text-gray-900 dark:text-gray-100 font-bold max-w-[250px] leading-relaxed">
                                            {post.title || post.content}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-[10px] font-black uppercase border border-white/10 overflow-hidden">
                                                {post.user?.username?.[0] || post.owner_id?.substring(0, 1) || 'A'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase leading-none mb-0.5">{post.user?.full_name || post.user?.username || 'User'}</span>
                                                <span className="text-[9px] text-gray-400 font-bold lowercase leading-none">{post.user?.email || 'no-email@wytnet.com'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' })}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <span className="material-icons text-sm">favorite_border</span>
                                            <span className="material-icons text-sm">chat_bubble_outline</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-10 h-5 bg-indigo-600 rounded-full relative p-0.5 shadow-inner">
                                            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest leading-none">Active</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDelete(post.id, post.title!)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                            <span className="material-icons">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onConfirm={handleCreate}
                isLoading={createMutation.isPending}
            />

            <ConfirmModal
                isOpen={confirmDeleteState.isOpen}
                onClose={() => setConfirmDeleteState({ ...confirmDeleteState, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="Permanently Delete Post?"
                message={`Are you sure you want to remove the post "${confirmDeleteState.title}"? This will hide it from all users and remove it from the knowledge graph.`}
                confirmText="Yes, Delete Post"
                isDestructive={true}
            />
        </div>
    );
};

export default PostManager;
