import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface Notification {
  id: string;
  title: string;
  description?: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
  category: 'like' | 'join' | 'message' | 'mention' | 'task' | 'points' | 'system' | 'learning' | 'creation' | 'social';
  actionUrl?: string;
  timestamp: number;
  sound?: boolean;
}

// 标记通知为已读 - 使用后端 API
const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('标记通知已读失败:', error);
    return false;
  }
};

// 标记所有通知为已读 - 使用后端 API
const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('标记所有通知已读失败:', error);
    return false;
  }
};

export interface NotificationSettings {
  enableSound: boolean;
  enableDesktop: boolean;
  maxNotifications: number;
  notificationTypes: {
    [key in Notification['category']]: boolean;
  };
}

interface NotificationPanelProps {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  unreadCount: number;
  isDark: boolean;
  onClose: () => void;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
}

export default function NotificationPanel({
  notifications,
  setNotifications,
  unreadCount,
  isDark,
  onClose,
  notificationSettings,
  setNotificationSettings
}: NotificationPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = React.useState(false);
  const [notificationFilter, setNotificationFilter] = React.useState<'all' | 'unread' | 'info' | 'success' | 'warning' | 'error' | 'like' | 'join' | 'message' | 'mention' | 'task' | 'points' | 'social' | 'activity' | 'system'>('all');

  // 过滤通知
  const filteredNotifications = React.useMemo(() => {
    let result = [...notifications];
    
    if (notificationFilter === 'unread') {
      result = result.filter(n => !n.read);
    } else if (notificationFilter === 'social') {
      result = result.filter(n => (['like', 'join', 'mention', 'social'] as string[]).includes(n.category));
    } else if (notificationFilter === 'activity') {
      result = result.filter(n => (['task', 'points', 'learning', 'creation'] as string[]).includes(n.category));
    } else if (notificationFilter === 'system') {
      result = result.filter(n => (['system', 'warning', 'info'] as string[]).includes(n.category) || n.type === 'warning');
    } else if (notificationFilter === 'message') {
      result = result.filter(n => n.category === 'message');
    }
    
    return result;
  }, [notifications, notificationFilter]);

  const filterOptions = [
    { value: 'all', label: t('notification.types.all') },
    { value: 'unread', label: t('notification.types.unread') },
    { value: 'system', label: t('notification.types.system') },
    { value: 'social', label: t('notification.types.social') },
    { value: 'activity', label: t('notification.types.task') },
    { value: 'message', label: t('notification.types.message') },
  ];

  return (
    <div className={`absolute right-0 mt-2 w-[360px] sm:w-[400px] rounded-2xl shadow-2xl ring-1 transition-all duration-300 transform origin-top-right ${isDark ? 'bg-[#1e232e] ring-gray-700' : 'bg-white ring-gray-200'} z-[100] overflow-hidden`} role="dialog" aria-label={t('header.viewNotifications')}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-bold text-base flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('header.notifications')}
            {unreadCount > 0 && (
              <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                {unreadCount}
              </span>
            )}
          </h3>
          
          <div className="flex items-center space-x-1">
             <button
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              onClick={async () => {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                await markAllNotificationsAsRead();
              }}
              title={t('header.markAllAsRead')}
            >
              <i className="fas fa-check-double text-xs"></i>
            </button>
            <button
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              onClick={() => setNotifications([])}
              title={t('header.clearAll')}
            >
              <i className="fas fa-trash-alt text-xs"></i>
            </button>
            <button
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              onClick={() => setShowSettings(!showSettings)}
              title={t('header.settings')}
            >
              <i className={`fas fa-cog text-xs ${showSettings ? 'animate-spin' : ''}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs - Clean Text Tabs */}
      <div className={`px-2 pt-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex space-x-4 overflow-x-auto pb-0 px-2 scrollbar-hide">
          {filterOptions.map(filter => (
            <button
              key={filter.value}
              onClick={() => setNotificationFilter(filter.value as any)}
              className={`pb-2 text-xs font-medium whitespace-nowrap transition-colors relative ${
                notificationFilter === filter.value 
                  ? (isDark ? 'text-blue-400' : 'text-blue-600') 
                  : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
              }`}
            >
              {filter.label}
              {notificationFilter === filter.value && (
                <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`}></span>
              )}
            </button>
          ))}
        </div>
      </div>

      
      {/* Notification List */}
      <ul className="max-h-[400px] overflow-y-auto overscroll-contain">
        {filteredNotifications.length === 0 ? (
          <li className={`flex flex-col items-center justify-center py-12 px-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <i className="fas fa-bell-slash text-2xl opacity-50"></i>
            </div>
            <p className="text-sm font-medium">{t('notification.empty')}</p>
            <p className="text-xs opacity-60 mt-1">{t('notification.emptyDesc')}</p>
          </li>
        ) : (
          filteredNotifications.map(n => (
            <li key={n.id} className={`border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-gray-50'}`}>
              <button
                onClick={async () => {
                  // 先更新本地状态
                  setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                  // 调用 API 标记为已读
                  if (!n.read) {
                    await markNotificationAsRead(n.id);
                  }
                  if (n.actionUrl) {
                    navigate(n.actionUrl);
                    onClose();
                  }
                }}
                className={`w-full text-left px-5 py-4 flex items-start space-x-4 transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 relative group
                  ${!n.read ? (isDark ? 'bg-blue-500/5' : 'bg-blue-50/30') : ''}
                `}
              >
                {!n.read && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                )}
                
                {/* Icon */}
                <div className={`flex-shrink-0 mt-0.5`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                    n.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                    n.type === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                    n.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                    'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    <i className={`fas ${
                      n.category === 'like' ? 'fa-heart' : 
                      n.category === 'join' ? 'fa-user-plus' : 
                      n.category === 'message' ? 'fa-envelope' : 
                      n.category === 'mention' ? 'fa-at' : 
                      n.category === 'task' ? 'fa-tasks' : 
                      n.category === 'points' ? 'fa-coins' : 
                      n.type === 'success' ? 'fa-check' : 
                      n.type === 'info' ? 'fa-info' : 
                      n.type === 'warning' ? 'fa-exclamation' : 
                      'fa-times'
                    }`}></i>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className={`text-sm font-bold truncate pr-2 ${isDark ? 'text-gray-200' : 'text-gray-900'} ${!n.read ? '' : 'font-medium'}`}>
                      {n.title}
                    </h4>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      {n.time}
                    </span>
                  </div>
                  
                  {n.description && (
                    <p className={`text-xs leading-relaxed line-clamp-2 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {n.description}
                    </p>
                  )}
                  
                  {/* Footer Tags */}
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {n.category === 'like' && t('notification.types.like')}
                      {n.category === 'join' && t('notification.types.join')}
                      {n.category === 'message' && t('notification.types.message')}
                      {n.category === 'mention' && t('notification.types.mention')}
                      {n.category === 'task' && t('notification.types.task')}
                      {n.category === 'points' && t('notification.types.points')}
                      {n.category === 'system' && t('notification.types.system')}
                      {n.category === 'learning' && t('notification.types.learning')}
                      {n.category === 'creation' && t('notification.types.creation')}
                      {n.category === 'social' && t('notification.types.social')}
                    </span>
                    
                    {!n.read && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm"></span>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
