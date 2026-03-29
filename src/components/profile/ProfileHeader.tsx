import React from 'react';

interface ProfileHeaderProps {
  completion: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ completion, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'wishlist', label: 'Wish List' },
    { id: 'personal', label: 'Personal' },
    { id: 'education', label: 'Education' },
    { id: 'works', label: 'Works' },
    { id: 'socials', label: 'Socials' },
    { id: 'interests', label: 'Interests' }
  ];

  return (
    <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-[28px] font-bold text-[#0D1B3E] mb-1">My Profile</h2>
          <p className="text-gray-400 text-[13px] font-medium tracking-wide">Manage your personal information and settings</p>
        </div>
        <div className="text-right">
          <div className="flex flex-col items-end">
             <span className="text-[22px] font-black text-[#0D1B3E] leading-none mb-1">{completion}%</span>
             <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Complete</span>
          </div>
        </div>
      </div>

      <div className="h-1.5 w-full bg-gray-50 rounded-full my-8 overflow-hidden">
        <div 
          className="h-full bg-[#0D1B3E] rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${completion}%` }}
        ></div>
      </div>

      <div className="flex items-center gap-12 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-5 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-[#0D1B3E]' : 'text-gray-300 hover:text-gray-500'}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D1B3E] rounded-full animate-in fade-in zoom-in duration-300"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileHeader;
