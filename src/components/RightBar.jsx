import React from 'react';

const RightBar = ({ onNewPost, needsCount, offersCount }) => {
  return (
    <aside className="w-80 bg-[#f8fafc] p-6 shrink-0 h-screen sticky top-[64px]" data-purpose="widgets-column">
      {/* Live Feed Widget */}
      <section className="bg-wyt-primary rounded-[2.5rem] p-6 text-white mb-6 shadow-xl shadow-indigo-100 overflow-hidden relative" data-purpose="live-feed">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8 opacity-80 uppercase tracking-widest text-xs font-bold">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            Live Feed
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 text-center">
              <div className="text-4xl font-bold mb-1">{needsCount}</div>
              <div className="text-xs font-medium text-white/70 uppercase tracking-wider">Needs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 text-center">
              <div className="text-4xl font-bold mb-1">{offersCount}</div>
              <div className="text-xs font-medium text-white/70 uppercase tracking-wider">Offers</div>
            </div>
          </div>

          <button 
            onClick={onNewPost}
            className="w-full bg-white text-wyt-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-lg active:scale-[0.98] text-sm"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            New Post
          </button>
        </div>
      </section>

      {/* Tip Widget */}
      <section className="bg-orange-50 rounded-3xl p-6 border border-orange-100" data-purpose="tip-box">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-orange-400">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1zM9 19h6v1H9v-1z"></path>
            </svg>
          </div>
          <span className="font-bold text-orange-800 uppercase text-xs tracking-wider">Tip</span>
        </div>
        <p className="text-sm text-orange-700 leading-relaxed">
          Be specific in your posts to get better matches from the community.
        </p>
      </section>
    </aside>
  );
};

export default RightBar;
