import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { updatePost, uploadImage } from '../api/post';
import { searchObjects, getObjects } from '../api/object';
import { WytObject, Post } from '../api/types';

interface EditPostModalProps {
  post: Post;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  post_type: 'NEED' | 'OFFER';
  object_id?: string;
  object_name: string;
  location: string;
  title: string;
  description: string;
  validity_days: number;
  allow_like: boolean;
  allow_comment: boolean;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, onClose, onSuccess }) => {
  // Calculate Restricted Mode
  const createdAt = new Date(post.created_at);
  const now = new Date();
  const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  const hasInteractions = (post.like_count || 0) > 0 || (post.comment_count || 0) > 0;
  const isRestricted = diffMinutes > 5 || hasInteractions;

  const [formData, setFormData] = useState<FormData>({
    post_type: post.post_type,
    object_id: post.object_id || '',
    object_name: '',
    location: post.location,
    title: post.title,
    description: post.description || '',
    validity_days: 30,
    allow_like: post.allow_like !== false,
    allow_comment: post.allow_comment !== false
  });

  const [objectQuery, setObjectQuery] = useState('');
  const [objectResults, setObjectResults] = useState<WytObject[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(post.image_url || null);

  useEffect(() => {
    const fetchObjectName = async () => {
      try {
        const res = await getObjects(0, 100);
        const obj = res.items?.find(item => item.id === post.object_id);
        if (obj) {
          setFormData(prev => ({ ...prev, object_name: obj.name }));
          setObjectQuery(obj.name);
        }
      } catch (err) {
        console.error('Failed to fetch object name:', err);
      }
    };
    fetchObjectName();
  }, [post.object_id]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!isRestricted && objectQuery.length >= 2) {
        try {
          const data = await searchObjects(objectQuery);
          setObjectResults(data.items || []);
          setShowDropdown(true);
        } catch (error) {
          console.error('Search failed:', error);
        }
      } else {
        setObjectResults([]);
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [objectQuery, isRestricted]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRestricted) return;
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let imageUrl = post.image_url;
    if (selectedFile && !isRestricted) {
      try {
        const uploadRes = await uploadImage(selectedFile);
        imageUrl = uploadRes.item?.url || imageUrl;
      } catch (error: any) {
        console.error('Image upload failed:', error);
        toast.error(`Image upload failed: ${error.message || 'Check your Supabase Storage policies.'}`);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await updatePost(post.id, {
        post_type: isRestricted ? post.post_type : formData.post_type,
        object_id: isRestricted ? post.object_id : formData.object_id,
        location: isRestricted ? post.location : formData.location,
        title: formData.title,
        description: formData.description,
        image_url: imageUrl || undefined,
        allow_like: formData.allow_like,
        allow_comment: formData.allow_comment
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update post:', error);
      toast.error('Failed to update post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in zoom-in fade-in duration-300 border border-white/20">
        <div className="p-8 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-20">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Post</h2>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-1">Update your intent details below.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-95 text-gray-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="px-8 pb-10">
          {isRestricted && (
            <div className="bg-[#FFF9EB] border border-[#FFE7A3] rounded-3xl p-6 mb-8 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[#FFE7A3] shrink-0 shadow-sm">
                <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h4 className="text-amber-900 font-bold text-[13px] uppercase tracking-widest mb-1.5">Restricted Edit Mode</h4>
                <p className="text-amber-800/70 text-sm font-semibold leading-relaxed">
                  This post is older than 5 minutes or already has interactions. To maintain platform trust, you can no longer change its core details (Entity, Location, Image, Type). You can only update the Title, Description, Validity, and Post Interactions.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-12 items-start">
            {/* Left Column: Image & Interactions */}
            <div className="space-y-8">
              <div>
                <div
                  onClick={() => !isRestricted && fileInputRef.current?.click()}
                  className={`border-4 border-dashed rounded-[2.5rem] h-40 flex flex-col items-center justify-center transition-all overflow-hidden relative group ${isRestricted ? 'border-gray-50 bg-gray-50/50 cursor-default' : 'border-gray-100 bg-gray-50/30 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50'}`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isRestricted} />
                  {previewUrl ? (
                    <>
                      <img src={previewUrl.startsWith('data:') || previewUrl.startsWith('blob:') || previewUrl.startsWith('http') ? previewUrl : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${previewUrl.startsWith('/') ? '' : '/'}${previewUrl}`} alt="Preview" className="w-full h-full object-cover" />
                      {!isRestricted && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white font-bold text-sm uppercase tracking-widest">Change Image</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <svg className="h-16 w-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">No image attached</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100/50">
                <h3 className="text-indigo-900 font-bold text-[11px] uppercase tracking-widest mb-6">Post Interactions</h3>
                <p className="text-[10px] text-gray-400 font-medium mb-6">Choose what other users can do on your post.</p>
                <div className="space-y-4">
                  {[
                    { key: 'allow_like', label: 'Allow Like', icon: '❤️' },
                    { key: 'allow_comment', label: 'Allow Comment', icon: '💬' }
                  ].map(interaction => (
                    <label key={interaction.key} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{interaction.icon}</span>
                        <span className="text-sm font-semibold text-gray-700">{interaction.label}</span>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData[interaction.key as keyof FormData] as boolean}
                          onChange={(e) => setFormData(prev => ({ ...prev, [interaction.key]: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="space-y-8">
              <div className="flex bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100">
                <button
                  type="button"
                  disabled={isRestricted}
                  onClick={() => setFormData(prev => ({ ...prev, post_type: 'NEED' }))}
                  className={`flex-1 py-4 rounded-[1.2rem] text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${formData.post_type === 'NEED' ? 'bg-white text-emerald-600 shadow-xl shadow-emerald-100/50 border border-emerald-50' : 'text-gray-400 opacity-60'}`}
                >
                  <span className="text-xl">🙋‍♀️</span> I NEED
                </button>
                <button
                  type="button"
                  disabled={isRestricted}
                  onClick={() => setFormData(prev => ({ ...prev, post_type: 'OFFER' }))}
                  className={`flex-1 py-4 rounded-[1.2rem] text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${formData.post_type === 'OFFER' ? 'bg-white text-blue-600 shadow-xl shadow-blue-100/50 border border-blue-50' : 'text-gray-400 opacity-60'}`}
                >
                  <span className="text-xl">📦</span> I Offer
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Post title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-gray-900"
                  placeholder="Enter a descriptive title..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-gray-900 min-h-[120px] resize-none"
                  placeholder="Tell others more about what you need or offer..."
                />
              </div>

              <div className="relative" ref={searchRef}>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">What are you looking for? *</label>
                <div className="relative">
                  {isRestricted ? (
                    <div className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center gap-4 text-gray-400 font-semibold">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                      {formData.object_name || 'Item specified'}
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={objectQuery}
                        onChange={(e) => setObjectQuery(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-gray-900 placeholder:text-gray-300"
                        placeholder="Search for an entity..."
                      />
                      {showDropdown && objectResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-3xl shadow-2xl border border-gray-50 z-50 overflow-hidden animate-in slide-in-from-top-4 duration-200">
                          {objectResults.map(obj => (
                            <div
                              key={obj.id}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, object_id: obj.id, object_name: obj.name }));
                                setObjectQuery(obj.name);
                                setShowDropdown(false);
                              }}
                              className="px-6 py-4 hover:bg-indigo-50 cursor-pointer text-sm font-semibold text-gray-700 transition-colors border-b border-gray-50 last:border-none"
                            >
                              {obj.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Where is this? *</label>
                {isRestricted ? (
                  <div className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center gap-4 text-gray-400 font-semibold">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {formData.location}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-gray-900"
                    placeholder="e.g. Madurai"
                  />
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all transform active:scale-[0.98]"
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
