import React, { useState } from 'react';
import { Post } from '../api/types';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  currentUserId: string | null;
  initialIsFollowing: boolean;
  initialIsLiked: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onDelete, 
  currentUserId, 
  initialIsFollowing, 
  initialIsLiked 
}) => {
  const { id, content, created_at, user, image_url, user_id, post_type, title, description, location } = post;
  
  const [following, setFollowing] = useState(initialIsFollowing);
  const [liked, setLiked] = useState(initialIsLiked);
  const [imgError, setImgError] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const { deletePost } = await import('../api/post');
        await deletePost(id);
        onDelete?.();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!currentUserId || following) return;
      const { createFollow } = await import('../api/follow');
      await createFollow(user_id, currentUserId);
      setFollowing(true);
      onDelete?.(); 
    } catch (error) {
      console.error('Follow failed:', error);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!currentUserId || liked) return;
      const { createFavorite } = await import('../api/favorite');
      await createFavorite(id, currentUserId);
      setLiked(true);
      onDelete?.();
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  return (
    <article className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6" data-purpose="post-card">
      <div className="p-6 pb-4">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-wyt-primary font-bold text-base">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-gray-900">{user?.username || 'User'}</h4>
                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${post_type === 'NEED' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                  I {post_type === 'NEED' ? 'Need' : 'Offer'}
                </span>
                <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase">Active</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">📍 {location}</span>
                <span className="flex items-center gap-1">📅 {new Date(created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUserId !== user_id && (
              <button 
                onClick={handleFollow}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-semibold transition-all ${following ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-gray-200 bg-white text-gray-600 hover:border-wyt-primary hover:text-wyt-primary'}`}
              >
                {following ? '✓ Following' : '+ Follow'}
              </button>
            )}
            {currentUserId === user_id && (
              <button onClick={handleDelete} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">🗑️</button>
            )}
          </div>
        </div>

        {/* Side-by-Side Content */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 flex flex-col justify-between min-h-[100px]">
            <div>
              <h5 className="text-lg font-bold mb-1 text-gray-900 leading-snug">{title}</h5>
              <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{description || content || 'No description provided'}</p>
            </div>
            
            {/* Interactions Bar */}
            <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-50">
              <button onClick={handleLike} className={`flex items-center gap-1.5 text-[11px] transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                <span className="text-base">{liked ? '❤️' : '♡'}</span>
                <span>Like {liked ? 1 : 0}</span>
              </button>
              <button className="flex items-center gap-1.5 text-gray-400 hover:text-wyt-primary transition-colors text-[11px]">
                <span className="text-base">💬</span>
                <span>Comment 0</span>
              </button>
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                <span className="text-base">👁️</span>
                <span>18</span>
              </div>
              <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors text-[11px]">
                <span className="text-base">🔗</span>
                <span>Share</span>
              </button>
            </div>
          </div>

          {image_url && !imgError && (
            <div className="w-[140px] h-[100px] shrink-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm self-start">
              <img 
                src={image_url.startsWith('http') ? image_url : `http://localhost:8000/${image_url}`} 
                alt="Post" 
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button className={`w-full text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] text-sm ${post_type === 'NEED' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-50' : 'bg-wyt-primary hover:bg-indigo-700 shadow-indigo-100'}`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          {post_type === 'NEED' ? 'I Offer' : 'I Need'}
        </button>
      </div>
    </article>
  );
};

export default PostCard;
