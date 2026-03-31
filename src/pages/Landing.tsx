import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { getPosts } from '../api/post';
import { getUserById } from '../api/user';
import { Post, User } from '../api/types';
import PostSkeleton from '../components/PostSkeleton';

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
};

const Landing: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [usersCache, setUsersCache] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRes = await getPosts();
        const items = postsRes.items || [];
        setPosts(items);

        const userIds = Array.from(new Set(items.map(p => p.user_id)));
        const userPromises = userIds.map(id => getUserById(id));
        const userResponses = await Promise.all(userPromises);

        const newCache: Record<string, User> = {};
        userResponses.forEach(res => {
          if (res.item) {
            newCache[(res.item as User).id] = res.item as User;
          }
        });
        setUsersCache(newCache);
      } catch (err) {
        console.error('Failed to fetch landing data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const goToLogin = () => navigate('/login');

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 font-['Inter'] flex flex-col">
      {/* BEGIN: MainHeader */}
      <header className="bg-white border-b border-gray-100 py-3 px-6 flex justify-between items-center sticky top-0 z-50 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="md" />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
          <button onClick={goToLogin} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
            Login / Join
          </button>
        </div>
      </header>
      {/* END: MainHeader */}

      {/* BEGIN: MainContent */}
      <main className="max-w-[1400px] mx-auto w-full px-6 py-6 grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">

        {/* BEGIN: SidebarLeft (Filters) */}
        <aside className="md:col-span-2 space-y-4">
          <h2 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest pl-1">Filter By Location</h2>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </span>
            <input className="block w-full pl-9 pr-3 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50/50 focus:ring-wyt-purple focus:border-wyt-purple placeholder-gray-400 outline-none" placeholder="City or region..." type="text" />
          </div>
        </aside>

        {/* BEGIN: FeedCenter */}
        <section className="md:col-span-8 space-y-4">
          {/* Feed Header Bar */}
          <div className="bg-wyt-purple rounded-2xl p-1.5 flex items-center gap-3 text-white shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 font-bold px-4 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all cursor-pointer">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path></svg>
              <span className="text-sm">WytWall</span>
            </div>
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center">
                <svg className="h-4 w-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
              </span>
              <input className="block w-full pl-10 pr-4 py-2.5 bg-white/5 border-none rounded-xl text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-white/10 transition-all outline-none" placeholder="Search..." type="text" />
            </div>
            <button onClick={goToLogin} className="bg-white text-wyt-purple font-extrabold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
              <span className="text-lg leading-none">+</span> Add Post
            </button>
          </div>

          {/* Welcome Dashboard */}
          <div className="bg-white border border-gray-50 rounded-[2rem] p-5 shadow-sm flex flex-col md:flex-row items-center gap-5 transition-all hover:shadow-md">
            <div className="bg-gradient-to-br from-indigo-500 to-wyt-purple p-3 rounded-2xl text-white shadow-xl shadow-purple-100">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Welcome to WytWall</h1>
              <p className="text-xs text-gray-500 mt-0.5">Your digital marketplace for opportunities, services, and connections.</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                  Growing Community
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  Verified Users
                </div>
                <div className="flex items-center gap-1.5 text-wyt-purple text-[10px] font-bold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>
                  Smart Matching
                </div>
              </div>
            </div>
          </div>

          {/* Post Feed */}
          {loading && !posts.length ? (
            <div className="flex flex-col gap-4">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map(post => {
                const user = usersCache[post.user_id];
                const typeBg = post.post_type === 'NEED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600';

                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                const rawUrl = post.image_url ? String(post.image_url).trim() : '';
                const invalidValues = ['string', 'none', 'null', 'undefined', '', 'placeholder', 'nan'];
                const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(rawUrl);
                const isUrl = rawUrl.startsWith('http');
                const isPath = rawUrl.includes('/');

                const imageUrl = (rawUrl && !invalidValues.includes(rawUrl.toLowerCase()) && (isUrl || (isPath && hasExtension)))
                  ? (isUrl ? rawUrl : `${baseUrl}/${rawUrl}`)
                  : null;

                return (
                  <article key={post.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-900 rounded-xl flex items-center justify-center text-white font-bold text-xs">
                          {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-xs">{user?.username || 'User'}</h3>
                          <div className="flex items-center gap-2 text-[9px] text-gray-400 font-medium">
                            <span className="flex items-center gap-1">📍 {post.location || 'Anywhere'}</span>
                            <span className="flex items-center gap-1">🕒 {formatTimeAgo(post.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`${typeBg} px-2.5 py-1 rounded-lg text-[8px] font-extrabold uppercase tracking-widest`}>{post.post_type}</span>
                        <span className="bg-gray-50 text-gray-400 px-2.5 py-1 rounded-lg text-[8px] font-extrabold uppercase tracking-widest">Active</span>
                        <button onClick={goToLogin} className="ml-1 text-blue-600 text-[9px] font-bold flex items-center gap-1 border border-blue-100 px-3 py-1 rounded-full hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap">
                          + Follow
                        </button>
                      </div>
                    </div>

                    <div className="pl-0.5 mb-1">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <h4 className="text-base font-extrabold text-gray-900 mb-0.5 leading-tight">{post.title}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{post.description}</p>
                        </div>
                        {imageUrl && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-50 shadow-sm">
                            <img src={imageUrl} alt={post.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-1 pl-0.5">
                      <div className="flex items-center gap-4 text-gray-400 text-[10px] font-semibold">
                        <span className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer transition-all">🤍 {post.like_count || 0}</span>
                        <span className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer transition-all">💬 {post.comment_count || 0}</span>
                        <span className="flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer transition-all">👁️ {post.view_count || 0}</span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-[10px] font-bold">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        Share
                      </button>
                    </div>

                    <button
                      onClick={goToLogin}
                      className="w-full hover:opacity-90 text-white font-bold py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] text-xs bg-[#10b981]"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
                      Login to Respond
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* BEGIN: SidebarRight (CTA) */}
        <aside className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm sticky top-24 text-center">
            <div className="bg-gray-50 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 mb-3 mx-auto">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg>
            </div>
            <h2 className="text-sm font-extrabold text-gray-900 leading-tight">Join and Get WytPass</h2>
            <p className="text-[10px] text-gray-500 mt-1 mb-4 leading-relaxed line-clamp-2 text-center">Sign up today and get your digital WytPass identity.</p>
            <button onClick={goToLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-[10px]">
              Sign Up Free
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
          </div>
        </aside>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <svg className="h-8 w-8" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#5d2999" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" />
              </svg>
              <span className="text-2xl font-extrabold text-blue-600 tracking-tight">WytNet</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your community marketplace. Connect, trade, and build meaningful relationships across the globe.
            </p>
          </div>

          {[
            { title: 'PRODUCT', links: ['WytWall', 'WytPass', 'Get Started'] },
            { title: 'COMMUNITY', links: ['View Posts', 'Join Now', 'Verified Users'] },
            { title: 'COMPANY', links: ['About Us', 'Privacy Policy', 'Terms of Service'] }
          ].map(group => (
            <div key={group.title}>
              <h4 className="text-[10px] font-extrabold text-gray-900 uppercase tracking-[0.2em] mb-6">{group.title}</h4>
              <ul className="space-y-3 text-sm text-gray-500 font-semibold">
                {group.links.map(link => (
                  <li key={link}><a href="#" className="hover:text-indigo-600 transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto border-t border-gray-50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 px-6">
          <p className="text-xs text-gray-400 font-medium">© 2026 WytNet ecosystem. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <span>Powered by</span>
            <span className="text-indigo-600 font-extrabold">WytPass</span>
            <span className="mx-1">•</span>
            <span>Universal Identity System</span>
          </div>
        </div>
      </footer>
      {/* END: MainContent */}
    </div>
  );
};

export default Landing;
