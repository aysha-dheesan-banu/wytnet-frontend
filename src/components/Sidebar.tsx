import React from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '../api/types';

interface SidebarProps {
  user: User | null;
  completion?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ user, completion = 0 }) => {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col p-4 shrink-0 h-screen sticky top-[64px] transition-colors" data-purpose="main-navigation">
      {/* Profile Preview Card */}
      <div className="bg-[#4F46E5] rounded-[2rem] p-8 text-white text-center mb-8 relative overflow-hidden shadow-xl shadow-indigo-100/50" data-purpose="user-mini-profile">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-4 border-2 border-white/20 shadow-inner backdrop-blur-sm">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <h3 className="font-bold text-xl tracking-tight mb-1">{user?.full_name || user?.name || user?.username || 'User'}</h3>
          <p className="text-xs text-white/60 mb-6 font-medium">@{user?.username?.toLowerCase() || 'user'}</p>
          <div className="text-left space-y-2">
            <div className="flex justify-between items-end text-[10px] uppercase font-black tracking-[0.1em] opacity-80">
              <span className="text-white/70">Profile</span>
              <span className="text-white">{completion}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                style={{ width: `${completion}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <nav className="space-y-1 mb-8">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive ? 'text-wyt-primary bg-indigo-50 dark:bg-indigo-900/40 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          WytWall
        </NavLink>
      </nav>

      <div className="px-4 mb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account</span>
      </div>
      <nav className="space-y-1">
        <NavLink 
          to={user?.username ? `/u/${user.username}/wytpost` : '#'} 
          state={{ user }}
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'text-wyt-primary bg-indigo-50 dark:bg-indigo-900/40' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          My WytPost
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'text-wyt-primary bg-indigo-50 dark:bg-indigo-900/40' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          My Profile
        </NavLink>
        <NavLink 
          to={user?.username ? `/u/${user.username}/account` : '#'} 
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'text-wyt-primary bg-indigo-50 dark:bg-indigo-900/40' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          My Account
        </NavLink>
      </nav>

      <div className="mt-auto pt-4 text-center">
        <p className="text-[10px] text-gray-400">© 2024 WytNet</p>
      </div>
    </aside>
  );
};

export default Sidebar;
