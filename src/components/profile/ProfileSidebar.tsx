import React from 'react';
import { User } from '../../api/types';

interface ProfileSidebarProps {
  user: User | null;
  completion: number;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ user, completion }) => {
  return (
    <div className="bg-wyt-card-gradient rounded-[32px] p-8 text-white shadow-xl shadow-indigo-100/50 sticky top-24">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-blue-900/40 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/20 shadow-lg text-white/90 uppercase">
             {user?.name?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-indigo-800 flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-1 tracking-tight">{user?.name || user?.full_name || 'User'}</h3>
        <p className="text-white/60 text-sm mb-8 font-medium">@{user?.username || 'username'}</p>

        <div className="w-full space-y-4">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
            <span>Profile Progress</span>
            <span className="text-white">{completion}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
             <div 
              className="h-full bg-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(52,211,153,0.6)]" 
              style={{ width: `${completion}%` }}
             ></div>
          </div>
        </div>

        <div className="mt-10 w-full pt-10 border-t border-white/10 space-y-6">
           <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                 <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="text-left">
                 <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Account Type</div>
                 <div className="text-xs font-bold">Standard User</div>
              </div>
           </div>
           
           <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                 <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="text-left">
                 <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Location</div>
                 <div className="text-xs font-bold">{user?.location || 'Not set'}</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
