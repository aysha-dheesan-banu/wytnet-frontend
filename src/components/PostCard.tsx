import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Post, Interaction, User } from '../api/types';
import { createInteraction, getInteractions, getInteractionsByPost } from '../api/interaction';
import { incrementPostView } from '../api/post';
import { getUserById } from '../api/user';
import { createFollow, deleteFollow } from '../api/follow';
import { createFavorite } from '../api/favorite';
import ViewPostModal from './ViewPostModal';

interface PostCardProps {
  post: Post;
  currentUserId: string | null;
  initialIsFollowing: boolean;
  initialFollowId?: string;
  initialIsLiked: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  initialIsFollowing,
  initialFollowId,
  initialIsLiked
}) => {
  const navigate = useNavigate();
  const { id, content, created_at, user, image_url, user_id, post_type, title, description, location } = post;

  const [following, setFollowing] = useState(initialIsFollowing);
  const [followId, setFollowId] = useState<string | undefined>(initialFollowId);
  const [liked, setLiked] = useState(initialIsLiked);
  const [imgError, setImgError] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Interaction[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showFollowMenu, setShowFollowMenu] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [viewCount, setViewCount] = useState(post.view_count || 0);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const viewCounted = useRef(false);

  const fetchComments = async () => {
    try {
      const data = await getInteractions();
      const allInteractions = data.items || [];
      const postComments = allInteractions.filter(i => i.post_id === id && i.action_type === 'COMMENT');

      const enrichedComments = await Promise.all(
        postComments.map(async (c) => {
          const u = await getUserById(c.user_id).catch(() => ({ item: { username: 'User' } }));
          return { ...c, user: u.item as User };
        })
      );

      setComments(enrichedComments);
    } catch (error) {
      console.error('Fetch comments failed:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [id]);

  useEffect(() => {
    if (post.view_count !== undefined) {
      setViewCount(post.view_count);
    }
  }, [post.view_count, id]);

  useEffect(() => {
    if (id && !viewCounted.current) {
      viewCounted.current = true;

      // Optimistic update
      setViewCount(prev => prev + 1);

      // Attempt server update - Try both patterns for robustness
      incrementPostView(id).then(res => {
        if (res.item && typeof res.item.view_count === 'number') {
          setViewCount(res.item.view_count);
        }
      }).catch(() => {
        // Fallback: Some backends increment on a single item fetch
        import('../api/post').then(({ getPostById }) => {
          getPostById(id).then(res => {
            if (res.item && typeof res.item.view_count === 'number') {
              setViewCount(res.item.view_count);
            }
          });
        });
      });
    }
  }, [id]);

  const handleCommentToggle = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    try {
      const currentUserData = currentUserId ? await getUserById(currentUserId).catch(() => null) : null;

      const res = await createInteraction({
        post_id: id,
        user_id: currentUserId,
        action_type: 'COMMENT',
        content: newComment.trim(),
      });

      if (res.item) {
        const enrichedNewComment = {
          ...res.item,
          user: currentUserData?.item as User || { username: 'You' } as User
        };
        setComments(prev => [...prev, enrichedNewComment as Interaction]);
      }

      setNewComment('');
    } catch (error) {
      console.error('Add comment failed:', error);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!currentUserId || following) return;
      const res = await createFollow(user_id, currentUserId);
      setFollowId(res.item?.id);
      setFollowing(true);
    } catch (error) {
      console.error('Follow failed:', error);
    }
  };

  const handleUnfollow = async () => {
    if (!followId) return;
    try {
      await deleteFollow(followId);
      setFollowing(false);
      setFollowId(undefined);
      setShowUnfollowModal(false);
      setShowFollowMenu(false);
    } catch (error) {
      console.error('Unfollow failed:', error);
      alert('Failed to unfollow user. Please try again.');
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!currentUserId || liked) return;
      await createFavorite(id, currentUserId);
      setLiked(true);
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleAction = async (type: 'NEED' | 'OFFER') => {
    if (!currentUserId) {
      navigate('/');
      return;
    }

    // Match exactly the reference URL slug format
    const slug = (title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/wytpost/chat/${slug}`, { state: { post, id } });

    try {
      // Background check for existing responses to prevent duplicates
      const interactionsData = await getInteractionsByPost(id);
      const existingResponses = (interactionsData.items || []).filter(
        i => i.user_id === currentUserId && i.action_type === 'RESPONSE'
      );

      // Create RESPONSE only if it doesn't exist
      if (existingResponses.length === 0) {
        await createInteraction({
          post_id: id,
          user_id: currentUserId,
          action_type: 'RESPONSE',
          content: `${type} intent`,
        });
      }
    } catch (error) {
      console.error('Background action failed:', error);
    }
  };

  return (
    <article className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-100/50 dark:group-hover:bg-indigo-900/20 transition-colors"></div>
      <div className="p-1 pb-1">
        <div className="flex items-start justify-between mb-2">
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
          <div className="flex items-center gap-2 relative">
            <button
              onClick={handleFollow}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-semibold transition-all ${following ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-gray-200 bg-white text-gray-600 hover:border-wyt-primary hover:text-wyt-primary'}`}
            >
              {following ? '✓ Following' : '+ Follow'}
            </button>

            {following && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFollowMenu(!showFollowMenu); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>

                {showFollowMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[60] animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowUnfollowModal(true); setShowFollowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-all text-left"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Unfollow
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 mb-2">
          <div className="flex-1 flex flex-col justify-between min-h-[80px] cursor-pointer" onClick={() => setIsViewModalOpen(true)}>
            <div>
              <h5 className="text-base font-bold mb-1 text-gray-900 leading-snug hover:text-indigo-600 transition-colors">{title}</h5>
              <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2">{description || content || 'No description provided'}</p>
            </div>

            <div className="flex items-center gap-5 mt-2 pt-2 border-t border-gray-50">
              <button
                onClick={handleLike}
                disabled={post.allow_like === false}
                className={`flex items-center gap-1.5 text-[11px] transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500 hover:scale-110 active:scale-90'} ${post.allow_like === false ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                title={post.allow_like === false ? "Likes are disabled for this post" : ""}
              >
                <span className="text-base">{liked ? '❤️' : '♡'}</span>
                <span>Like {post.like_count || (liked ? 1 : 0)}</span>
              </button>
              <button
                onClick={handleCommentToggle}
                disabled={post.allow_comment === false}
                className={`flex items-center gap-1.5 transition-colors text-[11px] ${showComments ? 'text-wyt-primary' : 'text-gray-400 hover:text-wyt-primary hover:scale-110 active:scale-90'} ${post.allow_comment === false ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                title={post.allow_comment === false ? "Comments are disabled for this post" : ""}
              >
                <span className="text-base">💬</span>
                <span>Comment {post.comment_count || 0}</span>
              </button>
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                <span className="text-base">👁️</span>
                <span>Views {viewCount}</span>
              </div>
              <button
                disabled={post.allow_share === false}
                className={`flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors text-[11px] ${post.allow_share === false ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                title={post.allow_share === false ? "Sharing is disabled for this post" : ""}
              >
                <span className="text-base">🔗</span>
                <span>Share</span>
              </button>
            </div>
          </div>

          {image_url && !imgError && (
            <div className="w-[120px] h-[80px] shrink-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm self-start">
              <img
                src={image_url.startsWith('http') ? image_url : `http://localhost:8000/${image_url}`}
                alt="Post"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          )}
        </div>

        <button
          onClick={() => handleAction(post_type === 'NEED' ? 'OFFER' : 'NEED')}
          disabled={post.allow_response === false}
          className={`w-full text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] text-sm ${post_type === 'NEED' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-50' : 'bg-wyt-primary hover:bg-indigo-700 shadow-indigo-100'} ${post.allow_response === false ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
          title={post.allow_response === false ? "Responses are disabled for this post" : ""}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          {post_type === 'NEED' ? 'I Offer' : 'I Need'}
        </button>

        {showComments && (
          <div className="mt-6 space-y-4 border-t border-gray-50 pt-6 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0 border border-white shadow-sm overflow-hidden">
                    {comment.user?.avatar_url ? (
                      <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      comment.user?.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-slate-900 truncate">{comment.user?.username || 'User'}</span>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 opacity-40">
                  <span className="text-3xl mb-2">💬</span>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">No comments yet</p>
                </div>
              )}
            </div>

            <form onSubmit={handleAddComment} className="relative mt-4 flex items-center gap-3 bg-white border border-slate-200 rounded-[20px] p-2 pl-4 shadow-sm focus-within:border-wyt-primary focus-within:ring-4 focus-within:ring-wyt-primary/5 transition-all">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-slate-900 placeholder:text-slate-400 py-1"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-wyt-primary text-white flex items-center justify-center transition-all hover:bg-slate-900 active:scale-90 disabled:opacity-30 disabled:grayscale"
                disabled={!newComment.trim()}
              >
                <svg className="h-4 w-4 transform rotate-45 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Unfollow Confirmation Modal */}
      {showUnfollowModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowUnfollowModal(false)}></div>
          <div className="relative bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-100">
              <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Unfollow User?</h3>
            <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed px-4">
              Are you sure you want to stop following <span className="text-slate-900 font-bold">@{user?.username || 'this user'}</span>?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowUnfollowModal(false)}
                className="py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
              >
                No, Cancel
              </button>
              <button
                onClick={handleUnfollow}
                className="py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95"
              >
                Yes, Unfollow
              </button>
            </div>
          </div>
        </div>
      )}

      {isViewModalOpen && (
        <ViewPostModal
          post={post}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
    </article>
  );
};

export default PostCard;
