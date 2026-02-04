import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Award,
  Trash2,
  Check,
  Settings,
  ChevronRight,
  Inbox
} from 'lucide-react';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system' | 'achievement';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  sender?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

const notificationConfig = {
  like: {
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: '点赞',
  },
  comment: {
    icon: MessageCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: '评论',
  },
  follow: {
    icon: UserPlus,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: '关注',
  },
  system: {
    icon: Bell,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: '系统',
  },
  achievement: {
    icon: Award,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: '成就',
  },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default function Notifications() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else {
      loadNotifications();
    }
  }, [isAuthenticated, user, navigate]);

  // 加载通知
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/notifications?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0 && Array.isArray(data.data)) {
          setNotifications(data.data.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })));
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 标记为已读
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/user/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // 标记所有为已读
  const markAllAsRead = async () => {
    try {
      await fetch('/api/user/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/user/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // 删除选中的通知
  const deleteSelected = async () => {
    try {
      await Promise.all(
        Array.from(selectedNotifications).map(id => 
          fetch(`/api/user/notifications/${id}`, { method: 'DELETE' })
        )
      );
      setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error('Failed to delete selected:', error);
    }
  };

  // 切换选择
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  // 过滤通知
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>加载中...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-8 h-8 text-red-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">消息中心</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                您有 {unreadCount} 条未读消息
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedNotifications.size > 0 && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                删除选中
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                全部已读
              </button>
            )}
            <Link
              to="/settings"
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 标签切换 */}
      <motion.div 
        className={`mb-6 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'all'
                ? `${isDark ? 'bg-gray-700 text-white' : 'bg-white text-red-600 shadow-md'}`
                : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            全部消息
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
              {notifications.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'unread'
                ? `${isDark ? 'bg-gray-700 text-white' : 'bg-white text-red-600 shadow-md'}`
                : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            未读消息
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {/* 通知列表 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => {
                const config = notificationConfig[notification.type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative p-4 rounded-xl transition-all cursor-pointer ${
                      notification.read
                        ? isDark ? 'bg-gray-800' : 'bg-white'
                        : isDark ? 'bg-gray-700/50 border-l-4 border-red-500' : 'bg-red-50 border-l-4 border-red-500'
                    } ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        navigate(notification.actionUrl);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* 选择框 */}
                      <div 
                        className="pt-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelection(notification.id);
                        }}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedNotifications.has(notification.id)
                            ? 'bg-red-500 border-red-500'
                            : isDark ? 'border-gray-600' : 'border-gray-300'
                        }`}>
                          {selectedNotifications.has(notification.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* 图标 */}
                      <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                                {config.label}
                              </span>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              )}
                            </div>
                            <h3 className={`font-medium ${notification.read ? '' : 'text-red-600 dark:text-red-400'}`}>
                              {notification.title}
                            </h3>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatRelativeTime(notification.timestamp)}
                            </p>
                          </div>

                          {/* 发送者头像 */}
                          {notification.sender && (
                            <img
                              src={notification.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.sender.username}`}
                              alt={notification.sender.username}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                            title="标记为已读"
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                        {notification.actionUrl && (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-center py-16 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Inbox className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {activeTab === 'unread' ? '没有未读消息' : '暂无消息'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {activeTab === 'unread' 
                ? '您已阅读所有消息' 
                : '当有新消息时，会显示在这里'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
