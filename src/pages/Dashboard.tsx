import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import RightBar from '../components/RightBar';
import PostCard from '../components/PostCard';
import NewPostModal from '../components/NewPostModal';
import { getPosts } from '../api/post';
import { getUserById } from '../api/user';
import { getUserIdFromToken } from '../utils/auth';
import { getUserFavorites } from '../api/favorite';
import { getUserFollowing } from '../api/follow';
import { Post, User, Favorite, Follow } from '../api/types';

const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [userFollows, setUserFollows] = useState<Follow[]>([]);
  const [userFavs, setUserFavs] = useState<Favorite[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userId = getUserIdFromToken();
      const [postsData, followsData, favsData] = await Promise.all([
        getPosts(),
        userId ? getUserFollowing(userId).catch(() => ({ items: [] })) : { items: [] },
        userId ? getUserFavorites(userId).catch(() => ({ items: [] })) : { items: [] }
      ]);

      const rawPosts = postsData.items || [];
      setUserFollows(followsData.items as Follow[] || []);
      setUserFavs(favsData.items as Favorite[] || []);

      if (userId) {
        getUserById(userId).then(userData => setUser(userData.item as User)).catch(console.error);
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
      }));

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

  const filteredPosts = posts.filter(post => {
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
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-wyt-gradient rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">W</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-wyt-primary">WytNet</h1>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
          <div className="relative">
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">99+</span>
            </button>
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="font-medium">{user?.username || 'Aysha'}</span>
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar user={user} />
        
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Welcome Banner */}
          <section className="bg-wyt-card-gradient rounded-2xl p-8 mb-6 flex items-center gap-8 text-white relative shadow-lg shadow-indigo-200">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-800/50 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/20">
                {user?.username?.[0]?.toLowerCase() || 'a'}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-1">Welcome back, {user?.username || 'Aysha'} ✨</h2>
              <p className="text-white/80 mb-6">Connect with the community!</p>
              <div className="w-full max-w-2xl">
                <div className="flex justify-between text-xs mb-2">
                  <span></span>
                  <span className="font-bold">100% profile</span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full">
                  <div className="h-full bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </section>

          {/* Navigation & Filters */}
          <section className="bg-white rounded-2xl border border-gray-100 p-2 mb-6 shadow-sm">
            <div className="flex gap-2">
              {['All', 'Needs', 'Offers', 'Following', 'Favorites'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-semibold transition-all ${activeTab === tab ? 'text-wyt-primary border-b-2 border-wyt-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          {/* Search and Filter Bar */}
          <section className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm flex items-center gap-4">
            <div className="relative flex-1">
              <svg className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <input className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-wyt-primary/20 transition-all text-sm" placeholder="Search by post" type="text"/>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-wyt-primary text-white rounded-xl">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:border-gray-300">
                Filters
              </button>
            </div>
          </section>

          {/* Feed Container */}
          <section className="space-y-6">
            {loading ? (
              <p className="text-center py-20 text-gray-500">Loading posts...</p>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onDelete={fetchData} 
                  currentUserId={user?.id || null}
                  initialIsFollowing={userFollows.some(f => f.following_id === post.user_id)}
                  initialIsLiked={userFavs.some(f => f.post_id === post.id)}
                />
              ))
            ) : (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg">No {activeTab.toLowerCase()} found.</p>
              </div>
            )}
          </section>
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
