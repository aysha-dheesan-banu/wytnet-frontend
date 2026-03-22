import React from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '../api/types';

interface SidebarProps {
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 shrink-0 h-screen sticky top-[64px]" data-purpose="main-navigation">
      {/* Profile Preview Card */}
      <div className="bg-wyt-gradient rounded-2xl p-6 text-white text-center mb-8 relative overflow-hidden" data-purpose="user-mini-profile">
        <div className="relative z-10">
          <div className="w-16 h-16 bg-blue-800/50 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-3 border-4 border-white/20">
            {user?.username?.[0]?.toLowerCase() || 'a'}
          </div>
          <h3 className="font-bold text-lg">{user?.username || 'Aysha'}</h3>
          <p className="text-xs text-white/80 mb-4">@{user?.username?.toLowerCase() || 'aysha'}</p>
          <div className="text-left">
            <div className="flex justify-between text-[10px] mb-1 uppercase font-bold tracking-wider">
              <span>Profile</span>
              <span>100%</span>
            </div>
            <div className="h-1.5 w-full bg-white/30 rounded-full">
              <div className="h-full bg-white rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <nav className="space-y-1 mb-8">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive ? 'text-wyt-primary bg-indigo-50 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
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
        <NavLink to="/my-posts" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'text-wyt-primary bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          My WytPost
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'text-wyt-primary bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          My Profile
        </NavLink>
      </nav>

      <div className="mt-auto pt-4 text-center">
        <p className="text-[10px] text-gray-400">© 2024 WytNet</p>
      </div>
    </aside>
  );
};

export default Sidebar;
