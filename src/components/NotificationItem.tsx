import React from 'react';
import { AppNotification } from '../api/types';

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onClick: (notification: AppNotification) => void;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead, onClick }) => {
  const isRead = notification.is_read;

  const getIcon = () => {
    switch (notification.type) {
      case 'POST_EXPIRED':
        return (
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/50">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        );
      case 'NEW_CHAT':
        return (
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100/50">
             <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        );
      case 'NEW_MATCH':
        return (
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100/50">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        );
    }
  };

  return (
    <div 
      onClick={() => onClick(notification)}
      className={`p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-800 last:border-none relative group ${!isRead ? 'bg-indigo-50/30' : ''}`}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className={`text-[13px] font-bold truncate ${!isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
            {notification.title}
          </h4>
          {!isRead && (
             <button 
              onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-indigo-100 rounded-full text-indigo-500"
              title="Mark as read"
             >
               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
             </button>
          )}
        </div>
        <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-snug mb-1 line-clamp-2">
          {notification.description}
        </p>
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">
          {formatTimeAgo(notification.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default NotificationItem;
