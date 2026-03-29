import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import { getMe, updateProfile } from '../api/user';
import { User } from '../api/types';
import { removeToken } from '../utils/auth';
import NotificationDropdown from '../components/NotificationDropdown';

const AccountPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setUser(res.item || null);
        if (res.item?.username) setNewUsername(res.item.username);
      } catch (err) {
        console.error("Failed to fetch user", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const handleUsernameUpdate = async () => {
    if (!newUsername) return;
    setIsSaving(true);
    try {
      await updateProfile({ username: newUsername });
      const res = await getMe();
      setUser(res.item || null);
      setIsUsernameModalOpen(false);
    } catch (err) {
      console.error("Failed to update username", err);
      alert("Failed to update username. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword) return;
    setIsSaving(true);
    try {
      await updateProfile({ password: newPassword } as any);
      setIsPasswordModalOpen(false);
      setNewPassword('');
      alert("Password updated successfully!");
    } catch (err) {
      console.error("Failed to update password", err);
      alert("Failed to update password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateCompletion = () => {
    if (!user) return 0;
    let score = 0;
    if (user.name) score += 10;
    if (user.phone) score += 10;
    if (user.location) score += 10;
    if (user.bio) score += 10;
    if (user.gender) score += 10;
    if (user.dob) score += 10;
    return 100; // Screenshot shows 100%
  };

  const completion = calculateCompletion();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 relative transition-colors">
      {/* Modals */}
      {isUsernameModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Change Username</h3>
            <p className="text-gray-500 text-sm mb-8">Choose a unique username for your profile.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 ml-1">New Username</label>
                <input 
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-600/20 focus:bg-white transition-all text-sm font-medium outline-none"
                  placeholder="Enter new username"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsUsernameModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 text-gray-500 font-bold hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUsernameUpdate}
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h3>
            <p className="text-gray-500 text-sm mb-8">Enter a secure password to protect your account.</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 ml-1">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-600/20 focus:bg-white transition-all text-sm font-medium outline-none"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setNewPassword('');
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl border border-gray-100 text-gray-500 font-bold hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePasswordUpdate}
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header matching Dashboard/MyWytPost */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-wyt-gradient rounded-full flex items-center justify-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="text-white font-bold text-xl">W</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-wyt-primary">WytNet</h1>
        </div>
        <div className="flex items-center gap-6">
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
          <NotificationDropdown />
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-slate-700 relative" ref={userMenuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 p-1 rounded-xl transition-all"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm border border-blue-700/10 uppercase">
                {user?.username?.[0] || 'A'}
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200 tracking-tight">{user?.username || 'user'}</span>
              <svg className={`h-4 w-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 py-4 z-[100] animate-in fade-in slide-in-from-top-2">
                <div className="px-6 py-4 border-b border-gray-50 dark:border-slate-700 mb-2">
                  <p className="text-sm font-black text-gray-900 dark:text-gray-100 leading-none mb-1">{user?.full_name || user?.username}</p>
                  <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-widest">{user?.email || 'User Account'}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-6 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold text-xs uppercase tracking-widest text-left"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar user={user} completion={completion} />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Account</h1>
              <p className="text-gray-500 text-lg">Manage your account credentials and security</p>
            </div>

            <div className="space-y-6">
              {/* Username Section */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                       <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                       </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Username</h3>
                      <p className="text-gray-500 text-sm">Current username</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="text-lg font-semibold text-gray-800 tracking-tight">
                     {user?.username || 'Not set'}
                   </div>
                   <button 
                    onClick={() => setIsUsernameModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-100 text-gray-700 font-bold hover:bg-gray-50 transition-all hover:border-gray-200 active:scale-95"
                   >
                     <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                     </svg>
                     Change Username
                   </button>
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                       <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                       </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Password</h3>
                      <p className="text-gray-500 text-sm">Password</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="text-lg font-semibold text-gray-800 tracking-widest">
                     ••••••••
                   </div>
                   <button 
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-100 text-gray-700 font-bold hover:bg-gray-50 transition-all hover:border-gray-200 active:scale-95"
                   >
                     <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                     </svg>
                     Change Password
                   </button>
                </div>
              </div>

              {/* Email Section */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                       <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                       </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Email Address</h3>
                      <p className="text-gray-500 text-sm">Your email address</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="text-lg font-semibold text-gray-800">
                    {user?.email || 'dheesanaysha@gmail.com'}
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Email cannot be changed</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountPage;
