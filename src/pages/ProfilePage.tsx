import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Sidebar from '../components/Sidebar';
import RightBar from '../components/RightBar';
import { getMe } from '../api/user';
import { getWishlist } from '../api/wishlist';
import { getEducation } from '../api/education';
import { getWorks } from '../api/work';
import { getSocials } from '../api/socials';
import { getInterests } from '../api/interests';
import { User, WishlistItem, Education, Work, Social, Interest } from '../api/types';
import { calculateProfileCompletion } from '../utils/profileUtils';
import {
  ProfileHeader,
  WishlistTab,
  PersonalTab,
  EducationTab,
  WorkTab,
  SocialTab,
  InterestTab
} from '../components/profile';

const ProfilePage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [socials, setSocials] = useState<Social[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);

  const [activeTab, setActiveTab] = useState('wishlist');
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      const [userRes, wishRes, eduRes, workRes, socialRes, interestRes] = await Promise.all([
        getMe().catch(err => { console.error("getMe failed", err); return { item: null }; }),
        getWishlist().catch(() => ({ items: [] })),
        getEducation().catch(() => ({ items: [] })),
        getWorks().catch(() => ({ items: [] })),
        getSocials().catch(() => ({ items: [] })),
        getInterests().catch(() => ({ items: [] })),
      ]);

      setUser(userRes.item || null);
      setWishlist(Array.isArray(wishRes.items) ? wishRes.items : []);
      setEducation(Array.isArray(eduRes.items) ? eduRes.items : []);
      setWorks(Array.isArray(workRes.items) ? workRes.items : []);
      setSocials(Array.isArray(socialRes.items) ? socialRes.items : []);
      setInterests(Array.isArray(interestRes.items) ? interestRes.items : []);
    } catch (err) {
      console.error("Profile load failed", err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const completion = calculateProfileCompletion(user, wishlist, education, works, socials, interests);

  // Removed blocking loading UI

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
          <Logo size="md" />
        </div>
        <button
          onClick={toggleTheme}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {theme === 'light' ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          )}
        </button>
      </header>

      <div className="flex flex-1">
        <Sidebar user={user} completion={completion} />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4">
            <ProfileHeader completion={completion} activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="mt-8">
              {activeTab === 'wishlist' && <WishlistTab items={wishlist} onRefresh={fetchAll} />}
              {activeTab === 'personal' && <PersonalTab user={user} onRefresh={fetchAll} />}
              {activeTab === 'education' && <EducationTab items={education} onRefresh={fetchAll} />}
              {activeTab === 'works' && <WorkTab items={works} onRefresh={fetchAll} />}
              {activeTab === 'socials' && <SocialTab items={socials} onRefresh={fetchAll} />}
              {activeTab === 'interests' && <InterestTab items={interests} onRefresh={fetchAll} />}
            </div>
          </div>
        </main>

        <RightBar onNewPost={() => { }} needsCount={0} offersCount={0} />
      </div>
    </div>
  );
};

export default ProfilePage;
