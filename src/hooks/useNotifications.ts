import { useState, useEffect, useCallback } from 'react';
import { getPosts } from '../api/post';
import { getInteractions } from '../api/interaction';
import { getUserIdFromToken } from '../utils/auth';
import { AppNotification } from '../api/types';

const READ_NOTIFICATIONS_KEY = 'wytnet_read_notifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const getReadNotifications = useCallback(() => {
    const saved = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) as string[] : [];
  }, []);

  const saveReadNotification = useCallback((id: string) => {
    const current = getReadNotifications();
    if (!current.includes(id)) {
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...current, id]));
    }
  }, [getReadNotifications]);

  const fetchNotifications = useCallback(async () => {
    const currentUserId = getUserIdFromToken();
    if (!currentUserId) return;

    try {
      const [postsData, interactionsData] = await Promise.all([
        getPosts(),
        getInteractions()
      ]);

      const allPosts = postsData.items || [];
      const allInteractions = interactionsData.items || [];
      const readIds = getReadNotifications();

      const newNotifications: AppNotification[] = [];

      // 1. Check for Expired Posts
      const expiredPosts = allPosts.filter(p => 
        p.user_id === currentUserId && 
        p.valid_until && 
        new Date(p.valid_until) < new Date()
      );

      expiredPosts.forEach(post => {
        const id = `expired_${post.id}`;
        newNotifications.push({
          id,
          type: 'POST_EXPIRED',
          title: 'Post Expired',
          description: `Your post "${post.title}" has expired. You can renew it from your dashboard.`,
          timestamp: post.valid_until || post.created_at,
          is_read: readIds.includes(id),
          post_id: post.id
        });
      });

      // 2. Check for New Matches
      // Simple match logic: same object_id, opposite post_type
      const myPosts = allPosts.filter(p => p.user_id === currentUserId);
      myPosts.forEach(myPost => {
        const matches = allPosts.filter(p => 
          p.user_id !== currentUserId && 
          p.object_id === myPost.object_id && 
          p.post_type !== myPost.post_type
        );

        matches.forEach(match => {
          const id = `match_${myPost.id}_${match.id}`;
          newNotifications.push({
            id,
            type: 'NEW_MATCH',
            title: 'New Match Found!',
            description: `We found a potential match for your post: "${myPost.title}".`,
            timestamp: match.created_at,
            is_read: readIds.includes(id),
            post_id: myPost.id,
            data: { match_post_id: match.id }
          });
        });
      });

      // 3. Check for New Conversations/Chats
      const chatInteractions = allInteractions.filter(i => {
        if (i.user_id === currentUserId) return false;
        if (i.action_type !== 'CHAT' && i.action_type !== 'RESPONSE') return false;
        
        const post = allPosts.find(p => p.id === i.post_id);
        if (!post) return false;

        // Condition 1: It's my post (someone is responding to me)
        if (post.user_id === currentUserId) return true;

        // Condition 2: I am already part of this conversation (someone replied to a thread I'm in)
        const iAmInvolved = allInteractions.some(prev_i => 
          prev_i.post_id === i.post_id && prev_i.user_id === currentUserId
        );
        
        return iAmInvolved;
      });

      chatInteractions.forEach(interaction => {
        const id = `chat_${interaction.id}`;
        const post = allPosts.find(p => p.id === interaction.post_id);
        newNotifications.push({
          id,
          type: 'NEW_CHAT',
          title: 'New Conversation Started!',
          description: `Someone is interested in your post: "${post?.title || 'your post'}".`,
          timestamp: interaction.created_at,
          is_read: readIds.includes(id),
          post_id: interaction.post_id,
          user_id: interaction.user_id,
          data: { content: interaction.content }
        });
      });

      // Sort by timestamp descending
      const sorted = newNotifications.sort((a,b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(sorted);
      setUnreadCount(sorted.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [getReadNotifications]);

  const markAsRead = useCallback((id: string) => {
    saveReadNotification(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [saveReadNotification]);

  const markAllAsRead = useCallback(() => {
    notifications.forEach(n => {
      if (!n.is_read) saveReadNotification(n.id);
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [notifications, saveReadNotification]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
};
