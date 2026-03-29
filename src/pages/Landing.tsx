import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../api/post';
import { getUserById } from '../api/user';
import { Post, User } from '../api/types';

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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRes = await getPosts();
        const items = postsRes.items || [];
        setPosts(items);

        // Fetch users for posts to get usernames/avatars
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
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2.5rem', borderBottom: '1px solid #f1f3f7', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/favicon.svg" alt="WytNet Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#5c59f2', letterSpacing: '-0.02em' }}>WytNet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>🌙</button>
          <button onClick={goToLogin} style={{ backgroundColor: '#5c59f2', color: 'white', padding: '0.6rem 1.4rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem' }}>Login / Join</button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, padding: '1.5rem 2.5rem', gap: '2rem' }}>
        {/* Left Sidebar */}
        <aside style={{ width: '240px', flexShrink: 0 }}>
          <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem' }}>Filter by Location</p>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
            <input 
              type="text" 
              placeholder="City or region..." 
              style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', borderRadius: '12px', border: '1px solid #f1f3f7', backgroundColor: '#fcfcfd', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, maxWidth: '800px' }}>
          {/* Dashboard Header */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#5c59f2', borderRadius: '12px', padding: '4px', marginBottom: '1.5rem', color: 'white', fontSize: '0.8rem', fontWeight: '700' }}>
            <div style={{ flex: 1, backgroundColor: '#4739b3', borderRadius: '8px', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✨ WytWall</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span>🔍</span>
                <input placeholder="Search..." style={{ background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.8rem' }} />
              </span>
            </div>
            <button onClick={goToLogin} style={{ padding: '0.6rem 1.2rem', background: 'none', color: 'white' }}>+ Add Post</button>
          </div>

          {/* Welcome Card */}
          <div style={{ backgroundColor: '#fcfcfd', borderRadius: '24px', border: '1px solid #f1f3f7', padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#5c59f2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white' }}>✨</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.4rem' }}>Welcome to WytWall</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.2rem' }}>Your digital marketplace for opportunities, services, and connections.</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>👥 Growing Community</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>✅ Verified Users</span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>⚡ Smart Matching</span>
              </div>
            </div>
          </div>

          {/* Post Feed */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading interesting posts...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {posts.map(post => {
                const user = usersCache[post.user_id];
                const typeColor = post.post_type === 'NEED' ? '#10b981' : '#3b82f6';
                const typeBg = post.post_type === 'NEED' ? '#ecfdf5' : '#eff6ff';

                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                const rawUrl = post.image_url ? String(post.image_url).trim() : '';
                const titleMatch = post.title && rawUrl.toLowerCase() === post.title.trim().toLowerCase();
                const invalidValues = ['string', 'none', 'null', 'undefined', '', 'placeholder', 'nan'];
                const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(rawUrl);
                const isUrl = rawUrl.startsWith('http');
                const isPath = rawUrl.includes('/');
                
                const imageUrl = (rawUrl && !invalidValues.includes(rawUrl.toLowerCase()) && !titleMatch && (isUrl || (isPath && hasExtension)))
                  ? (isUrl ? rawUrl : `${baseUrl}/${rawUrl}`)
                  : null;

                return (
                  <div key={post.id} style={{ backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #f1f3f7', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '12px', 
                          backgroundColor: post.post_type === 'NEED' ? '#7c3aed' : '#ec4899', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: '700', 
                          fontSize: '1rem', 
                          color: 'white' 
                        }}>
                          {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b' }}>{user?.username || 'User'}</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <span style={{ backgroundColor: typeBg, color: typeColor, fontSize: '0.6rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.02em' }}>{post.post_type}</span>
                              <span style={{ backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '0.6rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.02em' }}>ACTIVE</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500', marginTop: '2px' }}>📍 {post.location} • {formatTimeAgo(post.created_at)}</div>
                        </div>
                      </div>
                      <button 
                        onClick={goToLogin} 
                        style={{ 
                          color: '#5c59f2', 
                          backgroundColor: '#f5f3ff', 
                          border: '1px solid #e0e7ff', 
                          padding: '0.4rem 1rem', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: '700', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          cursor: 'pointer' 
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>+</span> Follow
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.2rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.8rem' }}>{post.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>{post.description}</p>
                      </div>
                      
                      {imageUrl && (
                        <div style={{ width: '100px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid #f1f3f7' }}>
                          <img src={imageUrl} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1.2rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>🤍 {post.like_count || 0}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>💬 {post.comment_count || 0}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>👁️ {post.view_count || 0}</span>
                      </div>
                      <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>🔗 Share</span>
                    </div>

                    <button 
                      onClick={goToLogin} 
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem 1.5rem', 
                        backgroundColor: typeColor, 
                        color: 'white', 
                        fontWeight: '700', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px' ,
                        boxShadow: `0 4px 12px -2px ${typeColor}40`,
                        fontSize: '0.9rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                      </svg>
                      Login to Respond
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ backgroundColor: '#fcfcfd', borderRadius: '24px', border: '1px solid #f1f3f7', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '1rem', color: '#94a3b8' }}>👥</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Join and Get WytPass</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.4' }}>Sign up today and get your WytPass identity for all features.</p>
            <button onClick={goToLogin} style={{ width: '100%', padding: '0.9rem', backgroundColor: '#3b82f6', color: 'white', fontWeight: '800', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Sign Up Free ➔
            </button>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer style={{ padding: '4rem 2.5rem', borderTop: '1px solid #f1f3f7', backgroundColor: '#fff', display: 'flex', flexWrap: 'wrap', gap: '4rem' }}>
        <div style={{ maxWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <img src="/favicon.svg" alt="WytNet Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#5c59f2' }}>WytNet</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6' }}>Your community marketplace. Connect, trade, and build meaningful relationships.</p>
          <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#cbd5e0' }}>© 2026 WytNet. All rights reserved.</p>
        </div>
        
        {[
          { title: 'PRODUCT', links: ['WytWall', 'WytPass', 'Get Started'] },
          { title: 'COMMUNITY', links: ['View Posts', 'Join Now'] },
          { title: 'COMPANY', links: ['About Us', 'Privacy Policy', 'Terms of Service'] }
        ].map(group => (
          <div key={group.title}>
            <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#1e293b', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>{group.title}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {group.links.map(link => (
                <span key={link} style={{ fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer' }}>{link}</span>
              ))}
            </div>
          </div>
        ))}
        
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
           <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Powered by <span style={{ color: '#5c59f2', fontWeight: '700' }}>WytPass</span> • Universal Identity & Validation</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
