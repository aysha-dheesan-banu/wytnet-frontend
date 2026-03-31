import React, { useState } from 'react';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (postData: any) => void;
    isLoading?: boolean;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        post_type: 'NEED',
        status: 'ACTIVE',
        is_public: true
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(formData);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Create WytPost</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Post content to the community board</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-400">
                            <span className="material-icons">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Post Type</label>
                                <select
                                    value={formData.post_type}
                                    onChange={e => setFormData({ ...formData, post_type: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                                >
                                    <option value="NEED">I Need (Request)</option>
                                    <option value="OFFER">I Offer (Provision)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Visibility</label>
                                <select
                                    value={formData.is_public ? 'public' : 'private'}
                                    onChange={e => setFormData({ ...formData, is_public: e.target.value === 'public' })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                                >
                                    <option value="public">Public Wall</option>
                                    <option value="private">Private Draft</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                                placeholder="e.g. Need a Python Developer"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Content / Description</label>
                            <textarea
                                required
                                rows={4}
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white resize-none"
                                placeholder="Describe your need or offer in detail..."
                            />
                        </div>

                        <div className="flex gap-3 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 bg-gray-50 dark:bg-slate-900 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isLoading ? 'Posting...' : 'Create Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
