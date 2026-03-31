import React from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '../api/types';


interface SidebarProps {
  user: User | null;
  isAdminView?: boolean;
  activeTab?: string;
  onTabChange?: (tab: any) => void;
  completion?: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  isAdminView = false,
  activeTab,
  onTabChange,
  completion
}) => {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col p-4 shrink-0 h-screen sticky top-[64px] transition-colors" data-purpose="main-navigation">

      {/* Profile Card - High Fidelity UI */}
      {!isAdminView && user && (
        <div className="mx-1 mb-6 bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-100/50 dark:shadow-none relative overflow-hidden group border border-white/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-black mb-3 border-2 border-white/30 shadow-lg group-hover:rotate-6 transition-transform uppercase">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                user.username?.[0] || 'A'
              )}
            </div>
            <h3 className="font-bold text-lg tracking-tight leading-none">{user.full_name || user.username}</h3>
            <p className="text-white/60 text-[10px] font-bold mt-1.5 tracking-widest uppercase">@{user.username.toLowerCase()}</p>

            {/* Completion stats */}
            <div className="w-full mt-5 space-y-2">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
                <span className="flex items-center gap-1.5">
                  PROFILE
                  <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                </span>
                <span className="text-white/90">{completion || 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  style={{ width: `${completion || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="space-y-1 mb-10">
        {!isAdminView ? (
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${isActive ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm border border-indigo-100/50 dark:border-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
            </svg>
            <span className="tracking-tight">WytWall</span>
          </NavLink>
        ) : (
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-indigo-600 font-black uppercase text-[10px] tracking-widest bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
            </svg>
            Back to App
          </NavLink>
        )}
      </nav>

      {!isAdminView && (
        <div className="px-5 mb-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-80">
            Account
          </span>
        </div>
      )}

      {isAdminView && (
        <nav className="space-y-1.5 px-1 mt-6">
          <div className="px-5 mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-80">OVERVIEW</span>
          </div>
          <button
            onClick={() => onTabChange?.('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'overview' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm border border-indigo-100/50' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
          >
            <span className="material-icons text-xl">speed</span>
            <span className="tracking-tight text-sm">Overview</span>
          </button>

          <div className="px-5 mb-3 mt-6">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-80">WYTWALL MANAGEMENT</span>
          </div>
          <button
            onClick={() => onTabChange?.('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm border border-indigo-100/50' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
          >
            <span className="material-icons text-xl">group</span>
            <span className="tracking-tight text-sm">All Users</span>
          </button>

          <button
            onClick={() => onTabChange?.('posts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'posts' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm border border-indigo-100/50' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
          >
            <span className="material-icons text-xl">article</span>
            <span className="tracking-tight text-sm">All Posts</span>
          </button>

          <button
            onClick={() => onTabChange?.('objects-list')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${['objects-list', 'object-types', 'object-aliases', 'object-relations'].includes(activeTab || '') ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm border border-indigo-100/50' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
          >
            <span className="material-icons text-xl">bubble_chart</span>
            <span className="tracking-tight text-sm">All Objects</span>
          </button>



        </nav>
      )}

      {!isAdminView && (
        <nav className="space-y-1.5 px-1">
          <div className="px-5 mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-80">
              Account
            </span>
          </div>
          <NavLink
            to={user?.username ? `/u/${user.username}/wytpost` : '#'}
            state={{ user }}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${isActive ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="tracking-tight">My WytPost</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${isActive ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="tracking-tight">My Profile</span>
          </NavLink>
          <NavLink
            to={user?.username ? `/u/${user.username}/account` : '#'}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${isActive ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span className="tracking-tight">My Account</span>
          </NavLink>
        </nav>
      )}

      <div className={`${!isAdminView && typeof completion === 'number' ? '' : 'mt-auto'} pt-4 text-center pb-2`}>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-40">© 2024 WytNet</p>
      </div>
    </aside>
  );
};

export default Sidebar;
