import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import { AppNotification, User } from '../api/types';
import { getUserById } from '../api/user';
import { getUserIdFromToken } from '../utils/auth';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = getUserIdFromToken();
    if (userId) {
      getUserById(userId).then(res => setUser(res.item as User)).catch(console.error);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    setIsOpen(false);

    const username = user?.username || 'user';

    switch (notification.type) {
      case 'POST_EXPIRED':
        navigate(`/u/${username}/wytpost`, { state: { activeTab: 'posts', highlightedPostId: notification.post_id } });
        break;
      case 'NEW_MATCH':
        navigate(`/u/${username}/wytpost`, { state: { activeTab: 'matches', filterPostId: notification.post_id } });
        break;
      case 'NEW_CHAT':
        const slug = (notification.title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        navigate(`/wytpost/chat/${slug}`, { state: { id: notification.post_id, responderId: notification.user_id } });
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black border-2 border-white dark:border-slate-800 animate-in fade-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-96 bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
          <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} NEW
                </span>
              )}
            </h3>
            <button 
              onClick={markAllAsRead}
              className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 transition-all"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Mark all read
            </button>
          </div>

          <div className="max-h-[480px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center opacity-30">
                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-widest">Checking alerts...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onRead={markAsRead}
                  onClick={handleNotificationClick}
                />
              ))
            ) : (
              <div className="p-20 flex flex-col items-center justify-center opacity-30">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4">📭</div>
                <p className="text-[10px] font-black uppercase tracking-widest">No new notifications</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 text-center">
            <button className="text-[10px] font-black text-gray-400 hover:text-gray-600 dark:hover:text-indigo-400 uppercase tracking-[0.2em] transition-all">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
