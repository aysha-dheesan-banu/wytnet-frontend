import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RightBar from '../components/RightBar';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import NewPostModal from '../components/NewPostModal';
import NotificationDropdown from '../components/NotificationDropdown';
import Logo from '../components/Logo';
import { getPosts } from '../api/post';
import { getUserById } from '../api/user';
import { getUserIdFromToken, removeToken, isAdmin } from '../utils/auth';
import { getUserFavorites } from '../api/favorite';
import { getUserFollowing } from '../api/follow';
import { getWishlist } from '../api/wishlist';
import { getEducation } from '../api/education';
import { getWorks } from '../api/work';
import { getSocials } from '../api/socials';
import { getInterests } from '../api/interests';
import { calculateProfileCompletion } from '../utils/profileUtils';
import { Post, User, Favorite, Follow, WishlistItem, Education, Work, Social, Interest } from '../api/types';
import { useTheme } from '../context/ThemeContext';

const Dashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [userFollows, setUserFollows] = useState<Follow[]>([]);
  const [userFavs, setUserFavs] = useState<Favorite[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [completion, setCompletion] = useState<number>(0);
  const filterRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  const fetchData = async () => {
    // setLoading(true);
    try {
      const userId = getUserIdFromToken();
      const [postsData, followsData, favsData, wishRes, eduRes, workRes, socialRes, interestRes] = await Promise.all([
        getPosts(),
        userId ? getUserFollowing(userId).catch(() => ({ items: [] })) : { items: [] },
        userId ? getUserFavorites(userId).catch(() => ({ items: [] })) : { items: [] },
        getWishlist().catch(() => ({ items: [] })),
        getEducation().catch(() => ({ items: [] })),
        getWorks().catch(() => ({ items: [] })),
        getSocials().catch(() => ({ items: [] })),
        getInterests().catch(() => ({ items: [] })),
      ]);

      const rawPosts = postsData.items || [];
      setUserFollows(followsData.items as Follow[] || []);
      setUserFavs(favsData.items as Favorite[] || []);

      if (userId) {
        getUserById(userId).then(userData => {
          const u = userData.item as User;
          setUser(u);
          const comp = calculateProfileCompletion(
            u,
            wishRes.items as WishlistItem[],
            eduRes.items as Education[],
            workRes.items as Work[],
            socialRes.items as Social[],
            interestRes.items as Interest[]
          );
          setCompletion(comp);
        }).catch(console.error);
      }

      const uniqueUserIds = [...new Set(rawPosts.map(post => post.user_id))];
      const usersData = await Promise.all(
        uniqueUserIds.map(id => getUserById(id).catch(() => ({ item: { username: 'User' } as User })))
      );

      const userMap: Record<string, User> = {};
      uniqueUserIds.forEach((id, index) => {
        userMap[id] = usersData[index].item as User;
      });

      const enrichedPosts = rawPosts.map(post => ({
        ...post,
        user: userMap[post.user_id]
      })).sort((a: Post, b: Post) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(enrichedPosts);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  const filteredPosts = posts.filter(post => {
    // Universal Filter: Exclude completed and expired posts
    const savedCompleted = localStorage.getItem('wytnet_completed_posts');
    const completedIds = savedCompleted ? Object.keys(JSON.parse(savedCompleted)) : [];
    if (completedIds.includes(post.id)) return false;

    // Expiry Filter
    if (post.valid_until && new Date(post.valid_until) < new Date()) return false;

    // Privacy Filter: Only show public posts on the WytWall
    if (post.is_public === false) return false;

    // Search Filter
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Location Filter
    if (locationQuery && post.location && !post.location.toLowerCase().includes(locationQuery.toLowerCase())) {
      return false;
    }

    if (activeTab === 'Needs') return post.post_type === 'NEED';
    if (activeTab === 'Offers') return post.post_type === 'OFFER';
    if (activeTab === 'Following') return userFollows.some(f => f.following_id === post.user_id);
    if (activeTab === 'Favorites') return userFavs.some(f => f.post_id === post.id);
    return true;
  });

  const needsCount = filteredPosts.filter(p => p.post_type === 'NEED').length;
  const offersCount = filteredPosts.filter(p => p.post_type === 'OFFER').length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
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
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold uppercase">
                {(user?.full_name || user?.username)?.[0] || 'A'}
              </div>
              <span className="font-medium dark:text-gray-200">{user?.full_name || user?.username || 'User'}</span>
              <svg className={`h-4 w-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 py-4 z-[100] animate-in fade-in slide-in-from-top-2">
                <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 mb-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none mb-1">{user?.full_name || user?.username}</p>
                  <p className="text-[10px] font-semibold text-gray-400 truncate uppercase tracking-widest">{user?.email || 'User Account'}</p>
                </div>
                {isAdmin() && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full flex items-center gap-3 px-6 py-3 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all font-semibold text-xs uppercase tracking-widest text-left"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-6 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-semibold text-xs uppercase tracking-widest text-left"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar user={user} completion={completion} />

        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full">
            {/* Welcome Banner */}
            <section className="bg-wyt-card-gradient rounded-2xl p-6 mb-6 flex items-center gap-8 text-white relative shadow-lg shadow-indigo-200">
              <div className="relative">
                <div className="w-16 h-16 bg-blue-800/50 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/20 uppercase">
                  {(user?.full_name || user?.username)?.[0] || 'A'}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-0.5">Welcome back, {user?.full_name || user?.username || 'User'} ✨</h2>
                <p className="text-white/80 mb-4 text-sm">Connect with the community!</p>
                <div className="w-full max-w-2xl">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span></span>
                    <span className="font-semibold">{completion}% profile</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full">
                    <div className="h-full bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" style={{ width: `${completion}%` }}></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Navigation & Filters */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-2 mb-6 shadow-sm transition-colors">
              <div className="flex gap-2">
                {['All', 'Needs', 'Offers', 'Following', 'Favorites'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 font-semibold transition-all rounded-xl ${activeTab === tab ? 'text-wyt-primary bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </section>

            {/* Search and Filter Bar */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-2 mb-6 shadow-sm flex items-center gap-4 transition-colors">
              <div className="relative flex-1">
                <svg className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <input
                  className="w-full pl-12 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-wyt-primary/20 transition-all text-sm outline-none text-gray-700 dark:text-gray-200"
                  placeholder="Search by post title..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 relative">
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:border-gray-300 dark:hover:border-slate-600 transition-all ${isFilterOpen ? 'border-wyt-primary ring-2 ring-wyt-primary/10' : ''}`}
                  >
                    Filters
                  </button>

                  {isFilterOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-5 z-[60] animate-in fade-in zoom-in duration-200 origin-top-right">
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Filter by Location</p>
                      <div className="relative">
                        <svg className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <input
                          type="text"
                          placeholder="Enter city or region..."
                          value={locationQuery}
                          onChange={(e) => setLocationQuery(e.target.value)}
                          autoFocus
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-wyt-primary/20 outline-none transition-all text-gray-700 dark:text-gray-200"
                        />
                      </div>
                      {locationQuery && (
                        <button
                          onClick={() => setLocationQuery('')}
                          className="mt-4 text-xs text-wyt-primary font-semibold hover:underline"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Feed Container */}
            <section className="space-y-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id || null}
                    initialIsFollowing={userFollows.some(f => f.following_id === post.user_id)}
                    initialFollowId={userFollows.find(f => f.following_id === post.user_id)?.id}
                    initialIsLiked={userFavs.some(f => f.post_id === post.id)}
                  />
                ))
              ) : loading ? (
                <div className="space-y-4">
                  <PostSkeleton />
                  <PostSkeleton />
                  <PostSkeleton />
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                  <p className="text-gray-400 font-medium">No posts found for this category.</p>
                </div>
              )}
            </section>
          </div>
        </main>

        <RightBar
          onNewPost={() => setIsModalOpen(true)}
          needsCount={needsCount}
          offersCount={offersCount}
        />
      </div>

      {isModalOpen && (
        <NewPostModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
