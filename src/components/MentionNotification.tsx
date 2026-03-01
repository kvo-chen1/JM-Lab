/**
 * @提及通知组件
 * 显示@提及通知列表
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AtSign, 
  MessageSquare, 
  FileText, 
  MessageCircle, 
  Check, 
  CheckCheck,
  X,
  Bell
} from 'lucide-react';
import { mentionService, MentionNotification as MentionNotificationType } from '@/services/mentionService';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/authContext';
import { formatDistanceToNow } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';

interface MentionNotificationListProps {
  onClose?: () => void;
}

export const MentionNotificationList: React.FC<MentionNotificationListProps> = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentions, setMentions] = useState<MentionNotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // 加载@提及列表
  const loadMentions = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [mentionsData, count] = await Promise.all([
        mentionService.getUserMentions(user.id, activeTab === 'unread', 20),
        mentionService.getUnreadMentionCount(user.id),
      ]);
      setMentions(mentionsData);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading mentions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activeTab]);

  // 标记为已读
  const handleMarkAsRead = async (mentionId: string) => {
    if (!user?.id) return;

    try {
      await mentionService.markMentionAsRead(mentionId, user.id);
      setMentions(prev =>
        prev.map(m =>
          m.id === mentionId ? { ...m, notificationRead: true } : m
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking mention as read:', error);
    }
  };

  // 标记全部已读
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await mentionService.markAllMentionsAsRead(user.id);
      setMentions(prev =>
        prev.map(m => ({ ...m, notificationRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all mentions as read:', error);
    }
  };

  // 处理点击提及
  const handleMentionClick = (mention: MentionNotificationType) => {
    // 标记为已读
    if (!mention.notificationRead) {
      handleMarkAsRead(mention.id);
    }

    // 跳转到相关内容
    let path = '/';
    switch (mention.mentionType) {
      case 'post':
        path = `/community/${mention.communityId}/post/${mention.contentId}`;
        break;
      case 'comment':
      case 'reply':
        path = `/community/${mention.communityId}/post/${mention.contentId}?comment=true`;
        break;
      case 'chat':
        path = `/chat/${mention.contentId}`;
        break;
    }

    navigate(path);
    onClose?.();
  };

  // 获取提及类型图标
  const getMentionIcon = (type: MentionNotificationType['mentionType']) => {
    switch (type) {
      case 'post':
        return <FileText className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      case 'reply':
        return <MessageCircle className="w-4 h-4" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <AtSign className="w-4 h-4" />;
    }
  };

  // 获取提及类型文本
  const getMentionTypeText = (type: MentionNotificationType['mentionType']) => {
    switch (type) {
      case 'post':
        return '帖子';
      case 'comment':
        return '评论';
      case 'reply':
        return '回复';
      case 'chat':
        return '聊天';
      default:
        return '提及';
    }
  };

  // 订阅实时@提及
  useEffect(() => {
    if (!user?.id) return;

    loadMentions();

    // 订阅新的@提及
    const unsubscribe = mentionService.subscribeToMentions(user.id, (newMention) => {
      setMentions(prev => [newMention, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, loadMentions]);

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            @提及
            {unreadCount > 0 && (
              <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                ({unreadCount} 未读)
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="p-2 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              title="全部标记为已读"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'unread'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          未读
          {unreadCount > 0 && (
            <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 提及列表 */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mentions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AtSign className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              {activeTab === 'unread' ? '没有未读的@提及' : '暂无@提及'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {mentions.map((mention, index) => (
              <motion.div
                key={mention.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleMentionClick(mention)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                  mention.notificationRead
                    ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                <Avatar
                  src={mention.senderAvatar}
                  alt={mention.senderUsername}
                  size="medium"
                >
                  {mention.senderUsername[0]?.toUpperCase()}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {mention.senderUsername}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      {getMentionIcon(mention.mentionType)}
                      {getMentionTypeText(mention.mentionType)}
                    </span>
                    {!mention.notificationRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {mention.contentPreview || '提到了你'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(mention.createdAt)}
                    {mention.communityName && (
                      <span className="ml-2">在 {mention.communityName}</span>
                    )}
                  </p>
                </div>
                {!mention.notificationRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(mention.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="标记为已读"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// 简化的@提及通知徽章组件
export const MentionNotificationBadge: React.FC = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadUnreadCount = async () => {
      try {
        const count = await mentionService.getUnreadMentionCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread mention count:', error);
      }
    };

    loadUnreadCount();

    // 订阅新的@提及
    const unsubscribe = mentionService.subscribeToMentions(user.id, () => {
      setUnreadCount(prev => prev + 1);
    });

    // 定期刷新未读数量
    const interval = setInterval(loadUnreadCount, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user?.id]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        <AtSign className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50">
            <MentionNotificationList onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default MentionNotificationList;
