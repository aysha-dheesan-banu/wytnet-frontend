import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getInteractions, createInteraction } from '../api/interaction';
import { getUserIdFromToken, removeToken } from '../utils/auth';
import { getPosts } from '../api/post';
import { getUserById } from '../api/user';
import { Post, Interaction, User } from '../api/types';
import { useTheme } from '../context/ThemeContext';
import NotificationDropdown from '../components/NotificationDropdown';

const Chat: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [post, setPost] = useState<Post | null>(location.state?.post || null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(location.state?.responder || null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'HISTORY'>('CHAT');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const currentUserId = getUserIdFromToken();

  const matchPostId = location.state?.matchPostId;

  const fetchData = async () => {
    try {
      if (!currentUserId) return;
      
      const [postsRes, interactionsRes] = await Promise.all([
        getPosts(),
        getInteractions()
      ]);

      const allPosts = postsRes.items || [];
      const allInteractionsGlobal = interactionsRes.items || [];
      
      let foundPost = post;
      if (!foundPost) {
        foundPost = allPosts.find(p => {
          const s = (p.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return s === slug || p.id === slug || p.id === location.state?.id;
        }) || null;
        setPost(foundPost);
      }

      if (foundPost) {
        // Aggregate interactions from BOTH matching posts
        const postInteractions = allInteractionsGlobal.filter(i => 
          i.post_id === foundPost?.id || (matchPostId && i.post_id === matchPostId)
        ).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        setInteractions(postInteractions);

        if (!otherUser || !otherUser.username) {
           let partnerId: string | null = null;
           if (currentUserId === foundPost.user_id) {
             const latestPartnerMsg = postInteractions.find(i => i.user_id !== currentUserId);
             if (latestPartnerMsg) partnerId = latestPartnerMsg.user_id;
           } else {
             partnerId = foundPost.user_id;
           }

           if (partnerId) {
             const interactionPartner = postInteractions.find(i => i.user_id === partnerId && i.user?.username);
             if (interactionPartner && interactionPartner.user) {
               setOtherUser(interactionPartner.user as User);
             } else {
               const partnerProfileRes = await getUserById(partnerId);
               if (partnerProfileRes.item) {
                 setOtherUser(partnerProfileRes.item as User);
               }
             }
           }
        }
      }

      if (currentUserId && !currentUser) {
        const userData = await getUserById(currentUserId);
        if (userData.item) setCurrentUser(userData.item as User);
      }
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [slug, post?.id, matchPostId]);

  useEffect(() => {
    if (activeTab === 'CHAT' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [interactions, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !post || !currentUserId || sending) return;

    setSending(true);
    try {
      // Determine which post_id to send to. 
      // If we are responding to a Match, it's best to keep the message on the 'target' post (the one we clicked Chat on)
      const res = await createInteraction({
        post_id: post.id,
        user_id: currentUserId,
        action_type: 'CHAT',
        content: message.trim(),
      });
      if (res.item) {
        // Add locally formatted interaction to avoid delay
        setInteractions(prev => [...prev, res.item as Interaction]);
        setMessage('');
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const chatMessages = interactions.filter(i => i.action_type === 'CHAT' || i.action_type === 'RESPONSE');

  const getOtherName = () => {
    if (otherUser?.username) return otherUser.username;
    if (post && post.user_id !== currentUserId && post.user?.username) return post.user.username;
    return 'user';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
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

      <div className="flex flex-1 overflow-hidden justify-center py-4 bg-gray-50">
        <main className="w-full max-w-5xl flex flex-col bg-white rounded-[32px] border border-gray-100 shadow-2xl shadow-indigo-50/50 overflow-hidden relative">
          {(!post && loading) ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header matching Image 2 perfectly */}
              <div className="p-4 border-b border-gray-50 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  {/* Avatar: Soft rounded square square from Reference */}
                  <div className="w-11 h-11 bg-blue-50 rounded-[14px] flex items-center justify-center text-blue-500 font-bold shrink-0 shadow-sm border border-blue-100/30 text-lg">
                    {otherUser?.username?.[0]?.toUpperCase() || post?.user?.username?.[0]?.toUpperCase() || 'H'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[15px] text-gray-900 truncate leading-tight">{post?.title || 'Loading...'}</h3>
                    <p className="text-[10px] text-gray-400 font-medium tracking-tight mt-0.5">
                      Responder: {getOtherName()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase tracking-[0.1em] px-1 transition-colors">BLOCK</button>
                  <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-all border border-gray-100 group">
                    <span className="group-hover:scale-110 transition-transform">✕</span>
                  </button>
                </div>
              </div>

              {/* Tabs with switcher */}
              <div className="flex px-4 pt-4 gap-8 border-b border-gray-50 shrink-0">
                 <button 
                  onClick={() => setActiveTab('CHAT')}
                  className={`pb-3 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all relative ${activeTab === 'CHAT' ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-500'}`}
                 >
                   <span className="text-sm">💬</span> CHAT
                   {activeTab === 'CHAT' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>}
                 </button>
                 <button 
                  onClick={() => setActiveTab('HISTORY')}
                  className={`pb-3 font-bold text-[10px] uppercase tracking-widest flex items-center transition-all relative ${activeTab === 'HISTORY' ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-500'}`}
                 >
                   HISTORY
                   {activeTab === 'HISTORY' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>}
                 </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col custom-scrollbar">
                {activeTab === 'CHAT' ? (
                  <div className="flex-1 flex flex-col h-full">
                    <div className="flex justify-center mb-8">
                       <span className="text-[8px] bg-slate-50 text-slate-300 tracking-tighter px-3 py-1 rounded-full uppercase font-black">Today</span>
                    </div>
                    {chatMessages.length > 0 ? (
                      <div className="flex flex-col space-y-6 min-h-0">
                        {chatMessages.map((msg) => {
                          const isMine = msg.user_id === currentUserId;
                          return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <div className="max-w-[70%] group">
                                <div className={`p-4 rounded-[28px] text-[13px] font-medium shadow-sm border ${isMine ? 'bg-indigo-600 text-white border-transparent rounded-br-none shadow-indigo-100' : 'bg-gray-50 text-gray-700 border-gray-100 rounded-bl-none'}`}>
                                  {msg.content}
                                </div>
                                <div className={`mt-1.5 flex items-center gap-1.5 text-[9px] text-gray-400 font-bold ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  {isMine && <span className="opacity-40 text-[7px] border border-gray-200 rounded-full px-1">👁️</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30">
                         <span className="text-4xl mb-4">💬</span>
                         <p className="text-[10px] font-black uppercase tracking-widest">No messages yet</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                ) : (
                  /* HISTORY VIEW matching Image 3 */
                  <div className="flex flex-col gap-4 py-4">
                    {chatMessages.length > 0 ? (
                      [...chatMessages].reverse().map((msg) => (
                        <div key={msg.id} className="bg-gray-50/50 p-5 rounded-[20px] border border-gray-100 shadow-sm">
                           <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mb-2 flex justify-between items-center">
                              <span>{new Date(msg.created_at).toLocaleString([], { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-[7px] bg-white px-2 py-0.5 rounded-full border border-gray-100">{msg.user?.username || (msg.user_id === currentUserId ? currentUser?.username : (otherUser?.username || 'user'))}</span>
                           </p>
                           <p className="text-[13px] text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="flex-col items-center justify-center py-20 opacity-30">
                        <p className="text-[10px] font-black uppercase tracking-widest">History is empty</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-50 shrink-0">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2 h-14 bg-white rounded-[28px] px-2 border border-gray-100 shadow-sm group transition-all">
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a message..."
                    disabled={sending || !currentUserId}
                    className="flex-1 h-full bg-transparent border-none outline-none pl-6 text-sm font-medium text-gray-900 placeholder:text-gray-400"
                  />
                  <div className="flex items-center gap-1 mr-1">
                    <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-400 transition-colors">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button 
                      type="submit"
                      disabled={sending || !message.trim() || !currentUserId}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${message.trim() ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-gray-200'}`}
                    >
                      <svg className="h-5 w-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                  </div>
                </form>
                <div className="mt-3 flex items-center justify-center gap-1.5 opacity-20 select-none">
                  <span className="text-[9px]">🔒</span>
                  <p className="text-[7px] text-gray-400 font-bold uppercase tracking-[0.2em]">End-to-end encrypted</p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;
