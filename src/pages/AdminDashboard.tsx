import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getUserById } from '../api/user';
import { getUserIdFromToken, removeToken, isAdmin } from '../utils/auth';
import { User } from '../api/types';
import { useTheme } from '../context/ThemeContext';
import ObjectManager from '../components/admin/ObjectManager';
import TypeManager from '../components/admin/TypeManager';
import AliasManager from '../components/admin/AliasManager';
import RelationManager from '../components/admin/RelationManager';

const AdminDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'objects' | 'types' | 'aliases' | 'relations'>('objects');
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
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Logo" className="w-8 h-8" />
            <h1 className="text-xl font-bold text-wyt-primary">WytNet Admin</h1>
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
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-50">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Exit Admin
                </button>
                <div className="h-px bg-gray-100 dark:bg-slate-700 my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          onTabChange={setActiveTab} 
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-slate-950/30">
          <div className="max-w-7xl mx-auto p-10">
            <header className="mb-10 flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none mb-3">
                  {activeTab} <span className="text-indigo-600 block text-sm font-black tracking-[0.3em] mt-2">Management Suite</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest opacity-60">
                  WytNet Core System • {new Date().toLocaleDateString()}
                </p>
              </div>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-gray-100/50 dark:border-slate-700/50 overflow-hidden transition-colors">
              {activeTab === 'objects' && <ObjectManager />}
              {activeTab === 'types' && <TypeManager />}
              {activeTab === 'aliases' && <AliasManager />}
              {activeTab === 'relations' && <RelationManager />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
