import React, { useState, useEffect } from 'react';
import { Post } from '../api/types';
import { getPostById } from '../api/post';

interface ViewPostModalProps {
    post: Post;
    onClose: () => void;
    onEdit?: (post: Post) => void;
}

const ViewPostModal: React.FC<ViewPostModalProps> = ({ post: initialPost, onClose, onEdit }) => {
    const [post, setPost] = useState<Post>(initialPost);
    useEffect(() => {
        // Fetch latest post data for real counts
        getPostById(initialPost.id).then(res => {
            if (res.item) setPost(res.item);
        });
    }, [initialPost.id]);


    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const cleanContent = (post.description || post.content || "").replace(/^["']|["']$/g, "").trim();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">

                <div className="p-6 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-wyt-primary font-bold overflow-hidden border-2 border-white shadow-sm">
                            {post.user?.avatar_url ? (
                                <img src={post.user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                post.user?.username?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white leading-tight">{post.user?.username || 'User'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(post)}
                                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors text-indigo-600 dark:text-indigo-400"
                                title="Edit Post"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* Post Type Badge */}
                    <div className="mb-4 mt-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${post.post_type === 'NEED' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
                            {post.post_type}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">Post Detail</h2>

                    {/* Metadata */}
                    <div className="space-y-1 mb-6">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            Published on <span className="text-slate-500 dark:text-slate-400">{formatDate(post.created_at)}</span>
                        </p>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            Expires on <span className="text-red-500">{formatDate(post.valid_until)}</span>
                        </p>
                    </div>

                    <div className="bg-[#fff1f2] dark:bg-rose-950/30 rounded-3xl p-6 mb-6 border border-rose-100/50 dark:border-rose-900/20 shadow-sm relative group">
                        <h3 className={`text-lg font-black text-slate-900 dark:text-rose-50 leading-tight ${cleanContent ? 'mb-2' : ''}`}>{post.title}</h3>
                        {cleanContent && (
                            <p className="text-slate-700 dark:text-rose-100 italic font-medium leading-relaxed">
                                {cleanContent}
                            </p>
                        )}
                    </div>

                    {/* Interaction Stats */}
                    <div className="flex items-center gap-6 mb-6 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <span className="text-xl text-slate-300 group-hover:text-red-500 transition-colors">❤️</span>
                            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{post.like_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <span className="text-xl text-slate-300 group-hover:text-indigo-500 transition-colors">💬</span>
                            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{post.comment_count || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewPostModal;
