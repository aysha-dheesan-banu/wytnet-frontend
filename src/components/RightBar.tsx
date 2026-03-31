import React from 'react';

interface RightBarProps {
  onNewPost: () => void;
  needsCount: number;
  offersCount: number;
}

const RightBar: React.FC<RightBarProps> = ({ onNewPost, needsCount, offersCount }) => {
  return (
    <aside className="w-72 bg-[#f8fafc] dark:bg-slate-900 p-5 shrink-0 h-screen sticky top-[64px] transition-colors" data-purpose="widgets-column">
      {/* Live Feed Widget */}
      <section className="bg-[#4F46E5] dark:bg-indigo-600 rounded-[2rem] p-7 text-white mb-6 shadow-2xl shadow-indigo-100/50 dark:shadow-indigo-900/20 overflow-hidden relative" data-purpose="live-feed">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-7 opacity-60 uppercase tracking-[0.2em] text-[10px] font-black">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
            </svg>
            Live Feed
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur-md rounded-[1.5rem] p-5 text-center border border-white/10 shadow-inner">
              <div className="text-3xl font-bold mb-0.5 tracking-tighter">{needsCount}</div>
              <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">Needs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-[1.5rem] p-5 text-center border border-white/10 shadow-inner">
              <div className="text-3xl font-bold mb-0.5 tracking-tighter">{offersCount}</div>
              <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">Offers</div>
            </div>
          </div>

          <button
            onClick={onNewPost}
            className="w-full bg-white dark:bg-slate-100 text-[#4F46E5] py-4.5 rounded-xl font-bold flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-all shadow-xl shadow-indigo-900/10 active:scale-[0.98] text-sm group"
          >
            <div className="w-4 h-4 bg-indigo-50 dark:bg-indigo-100 rounded flex items-center justify-center text-[#4F46E5] group-hover:scale-110 transition-transform">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
              </svg>
            </div>
            New Post
          </button>
        </div>
      </section>

      {/* Tip Widget */}
      <section className="bg-[#FFFBEB] dark:bg-slate-800 rounded-[1.5rem] p-6 border border-amber-100/50 dark:border-slate-700 shadow-sm" data-purpose="tip-box">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-sm shadow-amber-200/50">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1zM9 19h6v1H9v-1z"></path>
            </svg>
          </div>
          <span className="font-black text-amber-800 dark:text-amber-400 uppercase text-[9px] tracking-[0.2em] opacity-80">Tip</span>
        </div>
        <p className="text-[12px] text-amber-900/60 dark:text-amber-200/60 leading-relaxed font-medium">
          Be specific in your posts to get better matches from the community.
        </p>
      </section>
    </aside>
  );
};

export default RightBar;
