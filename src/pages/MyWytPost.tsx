import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RightBar from '../components/RightBar';
import { getPosts, deletePost } from '../api/post';
import EditPostModal from '../components/EditPostModal';
import NotificationDropdown from '../components/NotificationDropdown';
import { getInteractions } from '../api/interaction';
import { getUserIdFromToken, removeToken } from '../utils/auth';
import { getUserById } from '../api/user';
import { Post, Interaction, User } from '../api/types';
import { useTheme } from '../context/ThemeContext';

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) {
     if (date.getDate() === now.getDate()) return 'Today';
     return `${diffInHours}h ago`;
  }
  if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate() - 1) return 'Yesterday';
  return `${diffInDays}d ago`;
};

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

const MyWytPost: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(location.state?.user || null);
  const [usersCache, setUsersCache] = useState<Record<string, User>>({});
  const [matches, setMatches] = useState<{ myPost: Post, matchedPosts: Post[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'matches' | 'responses' | 'completed'>(location.state?.activeTab || 'matches');
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [subTab, setSubTab] = useState<string>('');
  const [expandedPosts, setExpandedPosts] = useState<string[]>([]);
  const [completedDealMap, setCompletedDealMap] = useState<Record<string, { partnerId?: string, date: string }>>(() => {
    const saved = localStorage.getItem('wytnet_completed_posts');
    return saved ? JSON.parse(saved) : {};
  });
  const [confirmModal, setConfirmModal] = useState<{ postId: string, partnerId?: string } | null>(null);
  const [completedSearch, setCompletedSearch] = useState('');
  const [filterPostId, setFilterPostId] = useState<string | null>(location.state?.filterPostId || null);

  useEffect(() => {
    localStorage.setItem('wytnet_completed_posts', JSON.stringify(completedDealMap));
  }, [completedDealMap]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const toggleExpand = (postId: string) => {
    setExpandedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
  };

  const computeMatches = async (allPosts: Post[], currentUserId: string) => {
    const myPostsList = allPosts.filter(p => p.user_id === currentUserId && !completedDealMap[p.id]);
    const result: { myPost: Post, matchedPosts: Post[] }[] = [];
    const neededUserIds = new Set<string>();

    myPostsList.forEach(myPost => {
      const matched = allPosts.filter(p => 
        p.user_id !== currentUserId &&
        !completedDealMap[p.id] &&
        p.object_id === myPost.object_id &&
        (
          (myPost.post_type === 'NEED' && p.post_type === 'OFFER') ||
          (myPost.post_type === 'OFFER' && p.post_type === 'NEED')
        )
      );

      if (matched.length > 0) {
        result.push({ myPost, matchedPosts: matched });
        matched.forEach(m => neededUserIds.add(m.user_id));
      }
    });

    setMatches(result);

    const missingIds = Array.from(neededUserIds).filter(id => !usersCache[id]);
    if (missingIds.length > 0) {
      try {
        const fetched = await Promise.all(missingIds.map(id => getUserById(id)));
        const newCache = { ...usersCache };
        fetched.forEach(res => {
          if (res.item) newCache[(res.item as User).id] = res.item as User;
        });
        setUsersCache(newCache);
      } catch (err) {
        console.error('Failed to fetch match profiles:', err);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentId = getUserIdFromToken();
      const [postsData, interactionsData] = await Promise.all([
        getPosts(),
        getInteractions()
      ]);

      const allPosts = postsData.items || [];
      const allInteractions = interactionsData.items || [];
      setPosts(allPosts);
      setInteractions(allInteractions);

      if (currentId) {
        const currentUserData = await getUserById(currentId);
        const user = currentUserData.item as User;
        setCurrentUser(user);
        await computeMatches(allPosts, currentId);
        
        const partnerIds = new Set<string>();
        allInteractions.forEach(i => {
           if (i.user_id !== currentId) partnerIds.add(i.user_id);
           const p = allPosts.find(post => post.id === i.post_id);
           if (p && p.user_id !== currentId) partnerIds.add(p.user_id);
        });

        const missingIds = Array.from(partnerIds).filter(id => !usersCache[id]);
        if (missingIds.length > 0) {
          const fetchedUsers = await Promise.all(missingIds.map(id => getUserById(id)));
          const newCache = { ...usersCache };
          fetchedUsers.forEach(res => {
            if (res.item) newCache[(res.item as User).id] = res.item as User;
          });
          setUsersCache(prev => ({ ...prev, ...newCache }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [username]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenPostId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
        setMenuOpenPostId(null);
      } catch (err) {
        console.error('Failed to delete post:', err);
        alert('Failed to delete post.');
      }
    }
  };

  const currentId = getUserIdFromToken();
  const activePosts = posts.filter(p => !completedDealMap[p.id]);
  const myActivePosts = activePosts.filter(p => currentId && p.user_id === currentId);

  const allMatchedPostIds = new Set(matches.flatMap(m => m.matchedPosts.map(p => p.id)));

  const responsesByPost = interactions.reduce((acc, i) => {
    const postObj = myActivePosts.find(p => p.id === i.post_id);
    if (postObj && i.user_id !== currentId) {
      if (!acc[i.post_id]) acc[i.post_id] = {};
      if (!acc[i.post_id][i.user_id]) acc[i.post_id][i.user_id] = [];
      acc[i.post_id][i.user_id].push(i);
    }
    return acc;
  }, {} as Record<string, Record<string, Interaction[]>>);

  const responsePosts = Object.keys(responsesByPost).map(pid => posts.find(p => p.id === pid)).filter(Boolean) as Post[];

  const myRepliesGrouped = interactions.reduce((acc, i) => {
    if (allMatchedPostIds.has(i.post_id)) return acc;
    if (completedDealMap[i.post_id]) return acc;

    if ((i.action_type === 'CHAT' || i.action_type === 'RESPONSE') && (currentId ? i.user_id === currentId : false) && !myActivePosts.some(p => p.id === i.post_id)) {
      if (!acc[i.post_id] || new Date(i.created_at) > new Date(acc[i.post_id].created_at)) acc[i.post_id] = i;
    }
    return acc;
  }, {} as Record<string, Interaction>);

  const myReplies = Object.values(myRepliesGrouped);

  const completedPosts = posts.filter(p => 
    completedDealMap[p.id] && 
    (completedSearch ? p.title.toLowerCase().includes(completedSearch.toLowerCase()) : true)
  ).sort((a,b) => 
    new Date(completedDealMap[b.id].date).getTime() - new Date(completedDealMap[a.id].date).getTime()
  );

  const expiredPosts = posts.filter(p => 
    p.user_id === currentId && 
    p.valid_until && 
    new Date(p.valid_until) < new Date() &&
    !completedDealMap[p.id]
  );
  const expiredCount = expiredPosts.length;

  const getProfileCompletion = (user: User | null) => {
    if (!user) return 0;
    const fields: (keyof User)[] = ['full_name', 'phone', 'location', 'bio', 'gender', 'dob', 'marital_status', 'mother_tongue', 'languages', 'avatar_url'];
    const filled = fields.filter(f => user[f] && String(user[f]).trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };
  const completion = getProfileCompletion(currentUser);

  const handleCompleteConfirm = () => {
    if (confirmModal) {
      setCompletedDealMap(prev => ({
        ...prev,
        [confirmModal.postId]: { partnerId: confirmModal.partnerId, date: new Date().toISOString() }
      }));
      setConfirmModal(null);
      // Navigate to completed tab
      setActiveTab('completed');
    }
  };

  const MatchAccordion: React.FC<{ match: { myPost: Post, matchedPosts: Post[] } }> = ({ match }) => {
    const isExpanded = expandedPosts.includes(match.myPost.id);
    const matchCount = match.matchedPosts.length;

    return (
      <div className="mb-2 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:border-purple-100">
        <div 
          onClick={() => toggleExpand(match.myPost.id)}
          className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${isExpanded ? 'bg-purple-600' : 'hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-5 flex-1 min-w-0">
             <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${isExpanded ? 'bg-purple-500/20 border-white/20 text-white' : 'bg-purple-50 border-white text-purple-500 shadow-sm'}`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
             </div>
             <div className="min-w-0">
               <h3 className={`font-bold text-[13px] truncate mb-0.5 ${isExpanded ? 'text-white' : 'text-gray-900'}`}>{match.myPost.title}</h3>
               <p className={`text-[10px] font-black uppercase tracking-widest ${isExpanded ? 'text-white/70' : 'text-gray-300'}`}>
                 {matchCount} {matchCount === 1 ? 'MATCH' : 'MATCHES'} • POST BY YOU
               </p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={(e) => { e.stopPropagation(); setConfirmModal({ postId: match.myPost.id }); }}
              className={`flex items-center gap-2 text-[10px] font-bold px-4 py-2 rounded-lg border-2 transition-all ${isExpanded ? 'bg-white text-purple-600 border-white shadow-lg' : 'bg-white text-purple-600 border-purple-50 shadow-sm hover:border-purple-100'}`}
             >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white bg-purple-600`}><svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                Complete Requirement
                <svg className={`h-3 w-3 ml-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
             </button>
          </div>
        </div>

        {isExpanded && (
          <div className="bg-white border-t border-purple-100/50">
            {match.matchedPosts.map(post => {
              const partner = usersCache[post.user_id];
              const matchInteractions = interactions.filter(i => 
                (i.post_id === post.id || i.post_id === match.myPost.id) && 
                (i.user_id === currentId || i.user_id === post.user_id) &&
                match.myPost.object_id === post.object_id
              );
              const latestI = matchInteractions.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

              return (
                <div key={post.id} className="flex items-center justify-between p-5 border-b border-gray-50 last:border-none group">
                   <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                           <span className="text-[13px] font-bold text-gray-800 line-clamp-1">{post.title}</span>
                           {latestI && <span className="text-[10px] text-gray-300 font-medium">{formatTimeAgo(latestI.created_at)}</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                          POST BY {partner?.username || 'user'} • {post.post_type.toLowerCase()} - match
                        </p>
                        {latestI ? (
                          <p className="text-[11px] text-gray-500 font-medium truncate mb-1.5 italic">
                            {latestI.user_id === currentId ? 'Your message: ' : `${partner?.username || 'user'}: `}{latestI.content}
                          </p>
                        ) : (
                          <span className="text-[9px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded font-black uppercase tracking-tighter">No interaction yet</span>
                        )}
                      </div>
                   </div>
                   <button 
                    onClick={() => {
                      const slug = (post.title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      navigate(`/wytpost/chat/${slug}`, { state: { post, id: post.id, responder: partner, matchPostId: match.myPost.id } });
                    }}
                    className="bg-indigo-600 text-white text-[11px] font-bold px-6 py-2 rounded-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                   >
                     {latestI ? 'Open Chat' : 'Chat'}
                   </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const ResponseAccordion: React.FC<{ post: Post; responders: Record<string, Interaction[]> }> = ({ post, responders }) => {
    const responderCount = Object.keys(responders).length;
    const isExpanded = expandedPosts.includes(post.id);

    return (
      <div className="mb-2 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:border-indigo-100">
        <div 
          onClick={() => toggleExpand(post.id)}
          className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-600' : 'hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-5 flex-1 min-w-0">
             <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${isExpanded ? 'bg-indigo-500/20 border-white/20 text-white' : 'bg-blue-50 border-white text-blue-500 shadow-sm'}`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
             </div>
             <div className="min-w-0">
               <h3 className={`font-bold text-[13px] truncate mb-0.5 ${isExpanded ? 'text-white' : 'text-gray-900'}`}>{post.title}</h3>
               <p className={`text-[10px] font-black uppercase tracking-widest ${isExpanded ? 'text-white/70' : 'text-gray-300'}`}>
                 {responderCount} {responderCount === 1 ? 'RESPONSE' : 'RESPONSES'}
               </p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={(e) => { e.stopPropagation(); setConfirmModal({ postId: post.id }); }}
              className={`flex items-center gap-2 text-[10px] font-bold px-4 py-2 rounded-lg border-2 transition-all ${isExpanded ? 'bg-white text-indigo-600 border-white shadow-lg' : 'bg-white text-indigo-600 border-indigo-50 shadow-sm hover:border-indigo-100'}`}
             >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white bg-indigo-600`}><svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                Complete Requirement
                <svg className={`h-3 w-3 ml-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
             </button>
          </div>
        </div>

        {isExpanded && (
          <div className="bg-white border-t border-indigo-100/50">
            {Object.keys(responders).map(uid => {
              const userInCache = usersCache[uid];
              const partnerInteractions = responders[uid];
              const latestInteraction = partnerInteractions.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

              return (
                <div key={uid} className="flex items-center justify-between p-5 border-b border-gray-50 last:border-none group">
                   <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 font-bold shrink-0 border-2 border-white shadow-sm overflow-hidden text-sm uppercase">
                         {userInCache?.username?.[0] || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                           <span className="text-[13px] font-bold text-gray-800">{userInCache?.username || 'user'}</span>
                           <span className="text-[10px] text-gray-300 font-medium">{formatTimeAgo(latestInteraction.created_at)}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium truncate mb-1">{latestInteraction.content}</p>
                        {/* Status Label from Image 2 */}
                        <span className="text-[9px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded font-black uppercase tracking-tighter">Completed</span>
                      </div>
                   </div>
                   <button 
                    onClick={() => {
                      const slug = (post.title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      navigate(`/wytpost/chat/${slug}`, { state: { post, id: post.id, responder: userInCache } });
                    }}
                    className="bg-indigo-600 text-white text-[11px] font-bold px-6 py-2 rounded-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                   >Chat</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const InteractionItem: React.FC<{ interaction: Interaction; post?: Post; isReply?: boolean }> = ({ interaction, post, isReply }) => {
    const timeAgo = formatTimeAgo(interaction.created_at);
    const partnerId = isReply ? post?.user_id : interaction.user_id;
    const partner = partnerId ? usersCache[partnerId] : null;

    return (
      <div className="flex items-center justify-between py-5 border-b border-gray-100 group hover:bg-gray-50/50 transition-colors px-4 -mx-4 rounded-xl">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 font-bold shrink-0 border-2 border-white shadow-sm overflow-hidden text-sm uppercase">
             {partner?.username?.[0] || 'U'}
          </div>
          <div>
            <h4 className="font-bold text-[13px] text-gray-900 leading-none mb-1">{post?.title || 'Interaction'}</h4>
            <p className="text-[11px] text-gray-400 font-medium mb-1">{timeAgo}</p>
            <p className="text-[11px] text-gray-500 font-medium truncate mb-1.5">
              {isReply ? `Your message: ${interaction.content}` : `${partner?.username || 'user'}: ${interaction.content}`}
            </p>
            <span className="bg-indigo-50 text-indigo-500 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Waiting for reply</span>
          </div>
        </div>
        <button 
          onClick={() => {
            const slug = (post?.title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            navigate(`/wytpost/chat/${slug}`, { state: { post, id: post?.id, responder: partner } });
          }}
          className="bg-indigo-600 text-white text-[11px] font-bold px-4 py-2 rounded-lg shadow-md shadow-indigo-100 focus:outline-none"
        >Open Chat</button>
      </div>
    );
  };

  const CompletedItem: React.FC<{ post: Post }> = ({ post }) => {
    const deal = completedDealMap[post.id];
    const isExpanded = expandedPosts.includes(post.id);
    const finishDate = new Date(deal.date).toLocaleDateString();

    const historyInteractions = interactions.filter(i => 
       i.post_id === post.id && 
       (deal.partnerId ? (i.user_id === deal.partnerId || i.user_id === currentId) : true)
    ).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return (
      <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm transition-all hover:border-emerald-100 mb-2">
         <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 mb-0.5">{post.title}</h4>
                <p className="text-[11px] text-gray-400 font-medium">Finished {finishDate}</p>
              </div>
            </div>
            <button 
              onClick={() => toggleExpand(post.id)}
              className="text-[10px] font-bold text-gray-400 hover:text-gray-900 flex items-center gap-2 transition-colors uppercase tracking-widest px-4 py-2"
            >
               {isExpanded ? 'Hide History' : 'View History'}
            </button>
         </div>

         {isExpanded && (
           <div className="px-6 pb-8 bg-slate-50/30 border-t border-gray-50">
             <div className="mt-8 max-w-2xl mx-auto space-y-6">
                {historyInteractions.map(i => {
                  const isMine = i.user_id === currentId;
                  const partner = usersCache[i.user_id];
                  return (
                    <div key={i.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%] flex items-start gap-2">
                         {!isMine && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase shrink-0">{partner?.username?.[0] || 'U'}</div>}
                         <div className="group">
                           <div className={`p-4 rounded-[20px] text-[13px] font-medium ${isMine ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100 shadow-md' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none shadow-sm'}`}>
                             {i.content}
                           </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
             </div>
           </div>
         )}
      </div>
    );
  };

  const clearFilter = () => {
    setFilterPostId(null);
  };

  const filteredMatches = filterPostId 
    ? matches.filter(m => m.myPost.id === filterPostId)
    : matches;

  const filteredResponsePosts = filterPostId
    ? responsePosts.filter(p => p.id === filterPostId)
    : responsePosts;

  const filteredMyReplies = filterPostId
    ? myReplies.filter(r => r.post_id === filterPostId)
    : myReplies;

  const filteringPost = filterPostId ? posts.find(p => p.id === filterPostId) : null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shrink-0 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-wyt-gradient rounded-full flex items-center justify-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="text-white font-bold text-xl">W</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-wyt-primary">WytNet</h1>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleTheme}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {theme === 'light' ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            )}
          </button>
          <NotificationDropdown />
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-slate-700 relative" ref={userMenuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 p-1 rounded-xl transition-all"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm border border-blue-700/10 uppercase">
                {currentUser?.username?.[0] || 'A'}
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200 tracking-tight">{currentUser?.username || 'user'}</span>
              <svg className={`h-4 w-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 py-4 z-[100] animate-in fade-in slide-in-from-top-2">
                <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 mb-2">
                  <p className="text-sm font-black text-gray-900 dark:text-gray-100 leading-none mb-1">{currentUser?.full_name || currentUser?.username}</p>
                  <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-widest">{currentUser?.email || 'User Account'}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-6 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold text-xs uppercase tracking-widest text-left"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar user={currentUser} completion={completion} />
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <section className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] rounded-[2.5rem] p-10 mb-8 flex items-center gap-10 text-white relative shadow-2xl shadow-indigo-100/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/20 shadow-2xl text-white uppercase overflow-hidden">
                {currentUser?.username?.[0] || 'A'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 border-4 border-[#4F46E5] rounded-full shadow-lg"></div>
            </div>
            <div className="flex-1 relative z-10">
              <h2 className="text-3xl font-bold mb-2 tracking-tight">Welcome back, {currentUser?.username || 'aysha'} ✨</h2>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Your marketplace dashboard is ready</p>
            </div>
          </section>

          <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-gray-100 dark:border-slate-700 p-6 shadow-2xl shadow-indigo-50/30 transition-colors">
            <div className="flex items-center gap-4 mb-10 bg-gray-50/50 dark:bg-slate-900/50 p-2 rounded-[2rem] border border-gray-100/50 dark:border-slate-700/50 w-fit">
              {[
                { id: 'posts', label: 'My Posts', count: myActivePosts.length },
                { id: 'matches', label: 'Matches', count: matches.length },
                { id: 'responses', label: 'Responses', count: responsePosts.length + myReplies.length },
                { id: 'completed', label: 'Completed', count: completedPosts.length }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSubTab('');
                  }}
                  className={`flex items-center gap-3 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-100/50 scale-[1.02]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${activeTab === tab.id ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-gray-200/50 dark:bg-slate-800 text-gray-400'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filterPostId && filteringPost && (
              <div className="mb-8 p-6 bg-blue-50/80 backdrop-blur-sm border border-blue-100 rounded-[2rem] flex items-center justify-between shadow-sm shadow-blue-100/50 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.15em] mb-0.5">Filtering Results For</p>
                    <h4 className="text-sm font-bold text-blue-900 line-clamp-1">{filteringPost.post_type} {filteringPost.title}</h4>
                  </div>
                </div>
                <button 
                  onClick={clearFilter}
                  className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm hover:bg-blue-600 hover:text-white transition-all cursor-pointer group"
                >
                  <svg className="h-3 w-3 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Clear Filter
                </button>
              </div>
            )}

            <div className="min-h-[400px]">
              {loading && !posts.length ? (
                <div className="flex flex-col items-center justify-center py-24 whitespace-nowrap">
                   <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refreshing Dashboard...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activeTab === 'posts' && (
                    <div className="space-y-4">
                      {myActivePosts.length > 0 ? (
                        myActivePosts.map(post => {
                          const postMatches = matches.find(m => m.myPost.id === post.id)?.matchedPosts.length || 0;
                          const postResponses = Object.keys(responsesByPost[post.id] || {}).length;
                          const postComments = interactions.filter(i => i.post_id === post.id && i.action_type === 'COMMENT').length;
                          const postLikes = 0; // Totals not available in current API
                          
                          const timeAgo = formatTimeAgo(post.created_at);
                          
                          // Icon logic based on type or content (simplified for now)
                          const getIcon = (title: string) => {
                            if (title.toLowerCase().includes('coffee')) return (
                              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100/50">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16.72 11.06A5 5 0 0115 20H5a5 5 0 01-5-5 5 5 0 014.12-4.94A10.89 10.89 0 010 8a10 10 0 0120 0 10.89 10.89 0 01-.12 2.06 5 5 0 01-3.16 1zM5 18a3 3 0 100-6 3 3 0 000 6z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </div>
                            );
                            if (title.toLowerCase().includes('pen')) return (
                              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100/50">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </div>
                            );
                            return (
                              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shadow-sm border border-green-100/50">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </div>
                            );
                          };

                          return (
                            <div key={post.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all group relative">
                              <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-6">
                                  {getIcon(post.title)}
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${post.post_type === 'NEED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {post.post_type}
                                      </span>
                                      <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        {timeAgo}
                                      </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{post.title}</h3>
                                    <p className="text-[13px] text-gray-400 font-medium italic">"{post.description || 'No description'}"</p>
                                  </div>
                                </div>
                                <div className="relative" ref={menuOpenPostId === post.id ? menuRef : null}>
                                  <button 
                                    onClick={() => setMenuOpenPostId(menuOpenPostId === post.id ? null : post.id)}
                                    className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all"
                                  >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                  </button>

                                  {menuOpenPostId === post.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in duration-200 origin-top-right">
                                      <button 
                                        onClick={() => {
                                          setEditingPost(post);
                                          setIsEditModalOpen(true);
                                          setMenuOpenPostId(null);
                                        }}
                                        className="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                      >
                                        Edit Post
                                      </button>
                                      <button 
                                        onClick={() => handleDeletePost(post.id)}
                                        className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-between"
                                      >
                                        Delete
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                      </button>
                                      <button 
                                        onClick={() => {
                                          navigate('/dashboard', { state: { highlightedPostId: post.id } });
                                        }}
                                        className="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
                                      >
                                        View Post
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-8 pt-6 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-gray-400 hover:text-red-500 cursor-pointer transition-colors group/stat">
                                  <svg className="h-4 w-4 transform group-hover/stat:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                  <span className="text-[10px] font-black uppercase tracking-widest">{postLikes}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors group/stat">
                                  <svg className="h-4 w-4 transform group-hover/stat:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                  <span className="text-[10px] font-black uppercase tracking-widest">{postComments}</span>
                                </div>
                                <div 
                                  onClick={() => { setActiveTab('matches'); setFilterPostId(post.id); window.scrollTo(0,0); }}
                                  className="flex items-center gap-2 cursor-pointer hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors group/stat"
                                >
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] group-hover/stat:underline">{postMatches} Matches</span>
                                </div>
                                <div 
                                  onClick={() => { setActiveTab('responses'); setFilterPostId(post.id); window.scrollTo(0,0); }}
                                  className="flex items-center gap-2 cursor-pointer hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors group/stat"
                                >
                                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] group-hover/stat:underline">{postResponses} Responses</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-40 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                          <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No matching posts</p>
                        </div>
                      )}
                      
                      {expiredCount > 0 && (
                        <div className="mt-12 flex justify-center pb-6">
                          <div className="bg-red-50 text-red-500 px-6 py-2.5 rounded-full border border-red-100/50 shadow-sm flex items-center gap-2 animate-bounce cursor-pointer hover:bg-red-100 transition-all">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{expiredCount} Expired Posts</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'matches' && (
                    <div className="space-y-2">
                       {filteredMatches.length > 0 ? (
                        filteredMatches.map(m => (
                          <MatchAccordion key={m.myPost.id} match={m} />
                        ))
                      ) : (
                        <div className="text-center py-40 flex flex-col items-center gap-4 opacity-30">
                             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-4xl">🔎</div>
                             <p className="text-xs font-black uppercase tracking-widest">No matches found</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'responses' && (
                    <div className="space-y-4">
                      {!filterPostId && (
                        <div className="flex gap-4 mb-6 px-1">
                          <button onClick={() => setSubTab('')} className={`text-[10px] font-black uppercase tracking-tighter px-4 py-2.5 rounded-xl transition-all shadow-sm ${subTab === '' ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-gray-100 text-gray-400'}`}>My Post Responses {responsePosts.length}</button>
                          <button onClick={() => setSubTab('replies')} className={`text-[10px] font-black uppercase tracking-tighter px-4 py-2.5 rounded-xl transition-all shadow-sm ${subTab === 'replies' ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-gray-100 text-gray-400'}`}>My Replies {myReplies.length}</button>
                        </div>
                      )}

                      {subTab === '' ? (
                        filteredResponsePosts.length > 0 ? (
                          filteredResponsePosts.map(post => (
                            <ResponseAccordion key={post.id} post={post} responders={responsesByPost[post.id]} />
                          ))
                        ) : (
                          <div className="text-center py-40 flex flex-col items-center gap-4 opacity-30">
                             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-4xl">📭</div>
                             <p className="text-xs font-black uppercase tracking-widest">No responses found</p>
                          </div>
                        )
                      ) : (
                        filteredMyReplies.length > 0 ? (
                          filteredMyReplies.map(reply => (
                            <InteractionItem key={reply.id} interaction={reply} post={posts.find(p => p.id === reply.post_id)} isReply />
                          ))
                        ) : (
                          <div className="text-center py-20 text-gray-300 font-bold text-xs font-black uppercase tracking-widest">No replies yet</div>
                        )
                      )}
                    </div>
                  )}

                  {activeTab === 'completed' && (
                    <div className="space-y-4">
                      <div className="mb-8 p-1 flex items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                            <h3 className="text-xl font-bold text-gray-900">Completed Requirements 👏</h3>
                         </div>
                         <div className="relative flex-1 max-w-sm">
                            <svg className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <input 
                              type="text" 
                              value={completedSearch}
                              onChange={(e) => setCompletedSearch(e.target.value)}
                              placeholder="Search completed deals..."
                              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all text-xs font-medium outline-none"
                            />
                         </div>
                      </div>

                      {completedSearch && (
                        <div className="px-1 mb-6 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Filtering results for:</span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50 flex items-center gap-2">
                                {completedSearch}
                                <button onClick={() => setCompletedSearch('')} className="hover:text-emerald-800 transition-colors">✕</button>
                              </span>
                           </div>
                           <button onClick={() => setCompletedSearch('')} className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest">Clear Filter</button>
                        </div>
                      )}

                      {completedPosts.length > 0 ? (
                        completedPosts.map(post => (
                          <CompletedItem key={post.id} post={post} />
                        ))
                      ) : (
                        <div className="text-center py-40 flex flex-col items-center gap-5">
                          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-3xl">🗃️</div>
                          <p className="text-xs font-black text-gray-300 uppercase tracking-widest">
                            {completedSearch ? 'No completed deals match your search' : "No active deals — here are the requirements you've completed!"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        <RightBar onNewPost={() => {}} needsCount={activePosts.filter(p => p.post_type === 'NEED').length} offersCount={activePosts.filter(p => p.post_type === 'OFFER').length} />
      </div>

      {confirmModal && (
        <ConfirmationModal 
          onClose={() => setConfirmModal(null)} 
          onConfirm={handleCompleteConfirm} 
        />
      )}

      {isEditModalOpen && editingPost && (
        <EditPostModal 
          post={editingPost}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPost(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingPost(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default MyWytPost;
