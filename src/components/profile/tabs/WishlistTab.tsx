import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { WishlistItem, Post, Interaction } from '../../../api/types';
import { deleteWishlistItem, updateWishlistItem, createWishlistItem, getWishlistMatches } from '../../../api/wishlist';
import { getInteractions } from '../../../api/interaction';
import { getUserIdFromToken } from '../../../utils/auth';

interface WishlistTabProps {
  items: WishlistItem[];
  onRefresh: () => void;
}

const ConfirmationModal: React.FC<{ onClose: () => void, onConfirm: () => void }> = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-8 transform transition-all animate-in fade-in zoom-in duration-200">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Complete this requirement?</h2>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">
        This will mark the requirement as completed and move it to your history. Other users will no longer be able to see it.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl border border-gray-100 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors"
        >Cancel</button>
        <button
          onClick={onConfirm}
          className="px-6 py-2.5 rounded-xl bg-[#00A389] text-white text-sm font-bold hover:bg-[#008F78] transition-colors shadow-lg shadow-emerald-100"
        >Yes, Complete it</button>
      </div>
    </div>
  </div>
);

const UserAvatar: React.FC<{ user?: any }> = ({ user }) => {
  const [error, setError] = React.useState(false);
  const avatarUrl = user?.avatar_url || user?.profile_picture_url;
  const isPlaceholder = !avatarUrl || avatarUrl.includes('example.com') || avatarUrl === '0' || avatarUrl === 'null' || avatarUrl === 'None';

  if (isPlaceholder || error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-indigo-600 font-black text-xs bg-indigo-50 uppercase">
        {(user?.username || user?.full_name || 'U').charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
};

const WishlistTab: React.FC<WishlistTabProps> = ({ items, onRefresh }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'MY_WISHES' | 'MATCHES'>('MY_WISHES');
  const [filter, setFilter] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<WishlistItem>>({
    status: 'ONGOING',
    is_public: true,
    steps: []
  });
  const [newStep, setNewStep] = useState('');
  const [saving, setSaving] = useState(false);
  const [matches, setMatches] = useState<Post[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [selectedWishForMatches, setSelectedWishForMatches] = useState<WishlistItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredItems = items.filter(item => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const handleEdit = (item: WishlistItem) => {
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      target_date: item.target_date,
      status: item.status,
      is_public: item.is_public,
      steps: item.steps || []
    });
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this wish?')) {
      try {
        await deleteWishlistItem(id);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleStatus = async (item: WishlistItem) => {
    try {
      const newStatus = item.status === 'COMPLETED' ? 'ONGOING' : 'COMPLETED';
      const updatedSteps = item.steps?.map(s => ({ ...s, is_completed: newStatus === 'COMPLETED' })) || [];
      await updateWishlistItem(item.id, { status: newStatus as any, steps: updatedSteps });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteConfirm = async () => {
    if (confirmModal) {
      try {
        await updateWishlistItem(confirmModal, { status: 'COMPLETED' });
        setConfirmModal(null);
        onRefresh();
        setActiveTab('MY_WISHES');
        setFilter('COMPLETED');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleStep = async (item: WishlistItem, stepIndex: number) => {
    try {
      const updatedSteps = [...(item.steps || [])];
      updatedSteps[stepIndex].is_completed = !updatedSteps[stepIndex].is_completed;
      const allDone = updatedSteps.every(s => s.is_completed);
      const newStatus = allDone ? 'COMPLETED' : 'ONGOING';
      await updateWishlistItem(item.id, { steps: updatedSteps, status: newStatus as any });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStep = () => {
    if (!newStep.trim()) return;
    setFormData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), { title: newStep, is_completed: false }]
    }));
    setNewStep('');
  };

  const handleCreate = async () => {
    if (!formData.title) return;
    setSaving(true);
    try {
      const currentId = getUserIdFromToken();
      if (!currentId) {
        toast.error('Please log in to add a wish.');
        return;
      }
      const payload: any = {
        title: formData.title,
        is_public: formData.is_public,
        status: formData.status || 'ONGOING',
        steps: formData.steps || []
      };
      if (formData.description?.trim()) payload.description = formData.description;
      if (formData.category?.trim()) payload.category = formData.category;
      if (formData.target_date) {
        const d = new Date(formData.target_date);
        if (!isNaN(d.getTime())) payload.target_date = d.toISOString();
      }

      if (editingId) {
        await updateWishlistItem(editingId, payload);
        toast.success('Wish updated successfully!');
      } else {
        await createWishlistItem(payload);
        toast.success('Wish added successfully!');
      }

      setIsAdding(false);
      setEditingId(null);
      setFormData({ status: 'ONGOING', is_public: true, steps: [] });
      onRefresh();
    } catch (err: any) {
      console.error('Wishlist save failed:', err);
      toast.error('Failed to save wish.');
    } finally {
      setSaving(false);
    }
  };

  const fetchMatches = async (wish: WishlistItem) => {
    setSelectedWishForMatches(wish);
    setLoadingMatches(true);
    try {
      const [matchesRes, interactionsRes] = await Promise.all([
        getWishlistMatches(wish.id),
        getInteractions()
      ]);
      if (matchesRes.items) setMatches(matchesRes.items);
      if (interactionsRes.items) setInteractions(interactionsRes.items);
      setActiveTab('MATCHES');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleOpenChat = (post: Post) => {
    const slug = (post.title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/wytpost/chat/${slug}`, {
      state: {
        post,
        id: post.id,
        responder: post.user,
        matchPostId: selectedWishForMatches?.post_id || selectedWishForMatches?.id
      }
    });
  };

  return (
    <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">My Wish List</h3>
          <p className="text-gray-400 text-xs text-medium">Track your goals step by step — your wish is someone's opportunity!</p>
        </div>
        {!isAdding && activeTab === 'MY_WISHES' && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ status: 'ONGOING', is_public: true, steps: [] });
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Add Wish
          </button>
        )}
        {activeTab === 'MATCHES' && (
          <button
            onClick={() => setActiveTab('MY_WISHES')}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
          >
            ← Back to Wishes
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-gray-50/50 rounded-[24px] p-8 border-2 border-dashed border-indigo-100 mb-8 animate-in zoom-in duration-300">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Wish Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="I want to learn..."
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell us why..."
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600/20 shadow-sm outline-none font-medium text-[13px] h-24 resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. Learning, Career"
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Target Date</label>
              <input
                type="date"
                value={formData.target_date ? new Date(formData.target_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                className="w-full px-5 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-indigo-600/20 shadow-sm outline-none font-bold text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Steps to Achieve</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  placeholder="Add a step..."
                  className="flex-1 px-5 py-3 bg-white border border-gray-100 rounded-xl outline-none font-medium text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStep()}
                />
                <button onClick={handleAddStep} className="px-4 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm">+</button>
              </div>
              <div className="space-y-2">
                {formData.steps?.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-50 text-xs font-bold text-gray-600">
                    <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px]">{idx + 1}</span>
                    {step.title}
                    <button onClick={() => setFormData(prev => ({ ...prev, steps: prev.steps?.filter((_, i) => i !== idx) }))} className="ml-auto text-red-300 hover:text-red-500">×</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Visibility</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, is_public: true }))}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${formData.is_public ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-400 border border-gray-100'}`}
                >Public</button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, is_public: false }))}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${!formData.is_public ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-400 border border-gray-100'}`}
                >Private</button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ status: 'ONGOING', is_public: true, steps: [] });
              }}
              className="px-6 py-2.5 rounded-xl text-gray-400 font-bold text-sm hover:bg-white transition-all"
            >Cancel</button>
            <button
              onClick={handleCreate}
              disabled={saving || !formData.title}
              className="px-10 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40"
            >
              {saving ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save Changes' : 'Create Wish')}
            </button>
          </div>
        </div>
      ) : activeTab === 'MY_WISHES' ? (
        <>
          <div className="flex gap-4 mb-8">
            {['ALL', 'ONGOING', 'COMPLETED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`flex gap-2 items-center px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
              >
                {f === 'ONGOING' && <span className="inline-block w-2.5 h-2.5 bg-blue-400 rounded-full border border-white"></span>}
                {f === 'COMPLETED' && <span className="inline-block w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white"></span>}
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/50 rounded-[24px] border-2 border-dashed border-gray-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">✨</div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-300">No wishes found in this category</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} className={`p-6 rounded-[24px] border-2 transition-all group ${item.status === 'COMPLETED' ? 'bg-emerald-50/10 border-emerald-100/50' : 'bg-white border-gray-100 hover:border-indigo-200'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${item.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-200 text-white shadow-sm' : 'bg-blue-50 border-blue-200 text-blue-500'}`}>
                        {item.status === 'COMPLETED' ? (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                      </div>
                      <h4 className="text-[15px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 transition-all">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-400 font-medium mb-6 ml-10">"{item.description || 'I am interested in learning this'}"</p>

                  <div className="flex items-center gap-6 ml-10">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-lg font-black uppercase tracking-tight">{item.category || 'Learning'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                      <svg className="h-4 w-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {item.target_date ? new Date(item.target_date).toLocaleDateString() : 'Ongoing'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-tight ${item.is_public ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${item.is_public ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                        {item.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`text-[10px] px-4 py-1.5 rounded-xl font-black uppercase tracking-widest transition-all ${item.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>
                      {item.status || 'Ongoing'}
                    </button>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 cursor-pointer hover:text-indigo-600" onClick={() => fetchMatches(item)}>
                      Matches
                    </div>
                  </div>

                  {item.steps && item.steps.length > 0 && (
                    <div className="mt-6 ml-10 grid grid-cols-1 gap-2">
                      {item.steps.map((step, idx) => (
                        <div key={idx} onClick={() => handleToggleStep(item, idx)} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${step.is_completed ? 'bg-emerald-50/30 border-emerald-100/50 text-emerald-700' : 'bg-gray-50/30 border-gray-100 text-gray-400 hover:border-indigo-100'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${step.is_completed ? 'bg-emerald-500 border-emerald-200 text-white' : 'border-gray-300'}`}>
                            {step.is_completed && <svg className="h-2 w-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <span className="text-[11px] font-bold tracking-tight">{step.title}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.status === 'COMPLETED' ? (
                    <div className="mt-6 ml-10 h-1.5 w-full bg-emerald-100/30 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-full animate-in slide-in-from-left duration-1000"></div>
                    </div>
                  ) : (
                    <div className="mt-6 ml-10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-indigo-600">{Math.round((item.steps?.filter(s => s.is_completed).length || 0) / (item.steps?.length || 1) * 100)}% Complete</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${(item.steps?.filter(s => s.is_completed).length || 0) / (item.steps?.length || 1) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">🤝</div>
            <div>
              <h4 className="text-sm font-bold text-indigo-900">Recommended Matches</h4>
              <p className="text-xs text-indigo-600/60 font-medium">We found these people who can help you achieve your goals!</p>
            </div>
          </div>

          {loadingMatches ? (
            <div className="py-20 text-center"><p className="text-xs font-black uppercase tracking-widest text-gray-300 animate-pulse">Finding your matches...</p></div>
          ) : matches.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-[24px] border-2 border-dashed border-gray-100">
              <p className="text-xs font-black uppercase tracking-widest text-gray-300">No matches found yet. Try making your wish more descriptive!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-indigo-600 rounded-[24px] overflow-hidden shadow-xl shadow-indigo-100/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-8 py-6 flex items-center justify-between text-white border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm shadow-inner transition-transform">⚡</div>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight">{selectedWishForMatches?.title}</h3>
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{matches.length} {matches.length === 1 ? 'MATCH' : 'MATCHES'} • POST BY YOU</p>
                    </div>
                  </div>
                  <button
                    onClick={() => selectedWishForMatches && setConfirmModal(selectedWishForMatches.id)}
                    className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all shadow-lg active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    Complete Requirement
                  </button>
                </div>

                <div className="p-4 bg-gray-50/50">
                  <div className="space-y-3">
                    {matches.map(post => {
                      const currentId = getUserIdFromToken();
                      const matchInteractions = interactions.filter(i =>
                        (i.post_id === post.id || i.post_id === selectedWishForMatches?.id || i.post_id === selectedWishForMatches?.post_id) &&
                        (i.user_id === currentId || i.user_id === post.user_id)
                      );
                      const latestI = matchInteractions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                      return (
                        <div key={post.id} className="p-5 bg-white rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-black uppercase tracking-widest bg-gray-100 px-2 py-1 rounded text-gray-400">Match found</span>
                          </div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-50 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center">
                                <UserAvatar user={post.user} />
                              </div>
                              <div>
                                <h4 className="text-[14px] font-black text-gray-900 leading-none mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">I offer {post.title}</h4>
                                <p className="text-[9px] font-black text-indigo-600/70 uppercase tracking-widest">
                                  POST BY {post.user?.username || 'ANONYMOUS'} • OFFER - MATCH
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenChat(post)}
                              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                            >
                              {latestI ? 'Open Chat' : 'Chat'}
                            </button>
                          </div>
                          <div className="pl-13 border-l-2 border-gray-50 ml-5">
                            {latestI ? (
                              <p className="text-[11px] text-gray-500 font-bold mb-1 leading-relaxed italic">
                                <span className="text-gray-900">{latestI.user_id === currentId ? 'Your message' : (post.user?.username || 'user')}</span>: {latestI.content}
                              </p>
                            ) : (
                              <p className="text-[11px] text-gray-400 font-bold mb-1 leading-relaxed">
                                No interaction yet
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 font-medium line-clamp-2 italic">"{post.description || 'No additional details provided'}"</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {confirmModal && (
        <ConfirmationModal
          onClose={() => setConfirmModal(null)}
          onConfirm={handleCompleteConfirm}
        />
      )}
    </div>
  );
};

export default WishlistTab;
