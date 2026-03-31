import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Logo from '../components/Logo';
import { getUserById } from '../api/user';
import { getUserIdFromToken, removeToken, isAdmin } from '../utils/auth';
import { User } from '../api/types';
import { useTheme } from '../context/ThemeContext';
import UserManager from '../components/admin/UserManager';
import PostManager from '../components/admin/PostManager';
import ObjectManager from '../components/admin/ObjectManager';
import TypeManager from '../components/admin/TypeManager';
import AliasManager from '../components/admin/AliasManager';
import RelationManager from '../components/admin/RelationManager';
import Overview from '../components/admin/Overview';

const AdminDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts' | 'objects-list' | 'object-types' | 'object-aliases' | 'object-relations'>('overview');
  const [createUserTrigger, setCreateUserTrigger] = useState(0);
  const [createPostTrigger, setCreatePostTrigger] = useState(0);
  const [createObjectTrigger, setCreateObjectTrigger] = useState(0);
  const [createTypeTrigger, setCreateTypeTrigger] = useState(0);
  const [createAliasTrigger, setCreateAliasTrigger] = useState(0);
  const [createRelationTrigger, setCreateRelationTrigger] = useState(0);
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }

    const userId = getUserIdFromToken();
    if (userId) {
      getUserById(userId).then(userData => setUser(userData.item as User)).catch(console.error);
    }
  }, [navigate]);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Logo size="md" />
          </div>
          <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {theme === 'light' ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeWidth="2" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" strokeWidth="2" /></svg>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-all"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase transition-transform active:scale-95 shadow-sm">
                {user?.username?.[0] || 'A'}
              </div>
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-[100] animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium"
                >
                  Exit Admin
                </button>
                <div className="h-px bg-gray-100 dark:bg-slate-700 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          user={user}
          isAdminView={true}
          activeTab={activeTab}
          onTabChange={setActiveTab as any}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-slate-950/30">
          <div className="max-w-7xl mx-auto p-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none mb-3">
                  Admin Management
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest opacity-60">
                  Control Users, Posts, and Knowledge Graph Data
                </p>
              </div>

              {/* Dynamic Action Buttons based on Tab */}
              {activeTab === 'users' && (
                <button
                  onClick={() => setCreateUserTrigger(prev => prev + 1)}
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 shadow-xl shadow-indigo-200 dark:shadow-none"
                >
                  <span className="material-icons text-sm">person_add</span>
                  Add User
                </button>
              )}
              {activeTab === 'objects-list' && (
                <button
                  onClick={() => setCreateObjectTrigger(prev => prev + 1)}
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 shadow-xl shadow-indigo-200 dark:shadow-none"
                >
                  <span className="material-icons text-sm">add</span>
                  Create Object
                </button>
              )}

              {activeTab === 'object-types' && (
                <button
                  onClick={() => setCreateTypeTrigger(prev => prev + 1)}
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 shadow-xl shadow-indigo-200 dark:shadow-none"
                >
                  <span className="material-icons text-sm">add</span>
                  Create Type
                </button>
              )}

              {activeTab === 'object-aliases' && (
                <button
                  onClick={() => setCreateAliasTrigger(prev => prev + 1)}
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 shadow-xl shadow-indigo-200 dark:shadow-none"
                >
                  <span className="material-icons text-sm">add</span>
                  Create Alias
                </button>
              )}

              {activeTab === 'object-relations' && (
                <button
                  onClick={() => setCreateRelationTrigger(prev => prev + 1)}
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 shadow-xl shadow-indigo-200 dark:shadow-none"
                >
                  <span className="material-icons text-sm">add</span>
                  Create Relation
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-gray-100/50 dark:border-slate-700/50 overflow-hidden transition-colors">
              {/* Tab Navigation Area */}
              <div className="px-8 pt-8 border-b border-gray-100 dark:border-slate-700/50 flex flex-wrap items-end gap-8 bg-gray-50/30 dark:bg-slate-900/10">
                {[
                  { id: 'users', label: 'All Users', icon: 'group' },
                  { id: 'posts', label: 'All Posts', icon: 'article' },
                  { id: 'objects-list', label: 'All Objects', icon: 'bubble_chart' },
                  { id: 'object-types', label: 'Object Types', icon: 'category' },
                  { id: 'object-aliases', label: 'Object Aliases', icon: 'label' },
                ].filter(tab => {
                  if (['users', 'posts'].includes(activeTab)) {
                    return tab.id === activeTab;
                  }
                  return ['objects-list', 'object-types', 'object-aliases'].includes(tab.id);
                }).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-4 px-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all relative group ${activeTab === tab.id
                      ? 'text-indigo-600'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                      }`}
                  >
                    <span className="material-icons text-lg">{tab.icon}</span>
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-4px_10px_rgba(79,70,229,0.4)]"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="relative">
                {activeTab === 'overview' && (
                  <Overview />
                )}
                {activeTab === 'users' && (
                  <UserManager
                    createTrigger={createUserTrigger}
                    onTriggerHandled={() => setCreateUserTrigger(0)}
                  />
                )}
                {activeTab === 'posts' && (
                  <PostManager
                    createTrigger={createPostTrigger}
                    onTriggerHandled={() => setCreatePostTrigger(0)}
                  />
                )}
                {activeTab === 'objects-list' && (
                  <ObjectManager
                    createTrigger={createObjectTrigger}
                    onTriggerHandled={() => setCreateObjectTrigger(0)}
                  />
                )}
                {activeTab === 'object-types' && (
                  <TypeManager
                    createTrigger={createTypeTrigger}
                    onTriggerHandled={() => setCreateTypeTrigger(0)}
                  />
                )}
                {activeTab === 'object-aliases' && (
                  <AliasManager
                    createTrigger={createAliasTrigger}
                    onTriggerHandled={() => setCreateAliasTrigger(0)}
                  />
                )}
                {activeTab === 'object-relations' && (
                  <RelationManager
                    createTrigger={createRelationTrigger}
                    onTriggerHandled={() => setCreateRelationTrigger(0)}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
