import React from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = React.useState(false);
  const [notificationFilter, setNotificationFilter] = React.useState<'all' | 'unread' | 'info' | 'success' | 'warning' | 'error' | 'like' | 'join' | 'message' | 'mention' | 'task' | 'points'>('all');

  // 过滤通知
  const filteredNotifications = React.useMemo(() => {
    let result = [...notifications];
    
    if (notificationFilter === 'unread') {
      result = result.filter(n => !n.read);
    } else if (notificationFilter !== 'all') {
      const isTypeFilter = ['info', 'success', 'warning', 'error'].includes(notificationFilter);
      if (isTypeFilter) {
        result = result.filter(n => n.type === notificationFilter);
      } else {
        result = result.filter(n => n.category === notificationFilter);
      }
    }
    return result;
  }, [notifications, notificationFilter]);

  const filterOptions = [
    { value: 'all', label: '全部', icon: 'fa-home' }, // Changed to Home icon based on screenshot
    { value: 'unread', label: '未读', icon: 'fa-folder' }, // Using Folder for "Unread" or similar concept? Or maybe fa-envelope-open-text
    { value: 'success', label: '成功', icon: 'fa-check-circle' }, // Shield-check? fa-shield-check
    { value: 'info', label: '信息', icon: 'fa-info-circle' },
    { value: 'warning', label: '警告', icon: 'fa-exclamation-triangle' },
    { value: 'like', label: '点赞', icon: 'fa-heart' },
    { value: 'join', label: '新成员', icon: 'fa-user-plus' },
    { value: 'message', label: '私信', icon: 'fa-envelope' },
    { value: 'task', label: '任务', icon: 'fa-list-ul' },
    { value: 'points', label: '积分', icon: 'fa-coins' },
  ];

  return (
    <div className={`absolute right-0 mt-2 w-[380px] sm:w-[440px] rounded-2xl shadow-2xl ring-1 transition-all duration-300 transform origin-top-right ${isDark ? 'bg-[#1e232e] ring-gray-700' : 'bg-white ring-gray-200'} z-50`} role="dialog" aria-label="通知列表">
      {/* Header */}
      <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'} shadow-sm`}>
              <i className="fas fa-bell text-lg"></i>
            </div>
            <div>
              <h3 className={`font-bold text-lg flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                通知
                {unreadCount > 0 && (
                  <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    {unreadCount} 未读
                  </span>
                )}
              </h3>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                共 {notifications.length} 条通知
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <button
            className={`flex-1 text-xs px-3 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center ${isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
            <i className="fas fa-check-double mr-1.5"></i>
            全部已读
          </button>
          <button
            className={`flex-1 text-xs px-3 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
            onClick={() => setNotifications([])}>
            <i className="fas fa-trash-alt mr-1.5"></i>
            清空
          </button>
          <button
            className={`flex-1 text-xs px-3 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center ${isDark ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
            onClick={() => setShowSettings(!showSettings)}>
            <i className={`fas fa-cog mr-1.5 ${showSettings ? 'animate-spin' : ''}`}></i>
            设置
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/80'} animate-fadeIn`}>
          <h4 className={`font-medium mb-3 flex items-center text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            <i className="fas fa-sliders-h mr-2 text-purple-500"></i>
            通知设置
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors">
              <label className={`text-sm flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <i className="fas fa-volume-up mr-2 text-gray-400 w-5 text-center"></i>
                声音提醒
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notificationSettings.enableSound} 
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, enableSound: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className={`w-9 h-5 rounded-full transition-colors peer ${notificationSettings.enableSound ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <span className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4`}></span>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors">
              <label className={`text-sm flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <i className="fas fa-desktop mr-2 text-gray-400 w-5 text-center"></i>
                桌面通知
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notificationSettings.enableDesktop} 
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, enableDesktop: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className={`w-9 h-5 rounded-full transition-colors peer ${notificationSettings.enableDesktop ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <span className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4`}></span>
              </label>
            </div>
          </div>
        </div>
      )}
      
      {/* Filter Tabs - Optimized for clean look (Icons only) */}
      <div className={`px-2 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide px-2">
          {filterOptions.map(filter => (
            <button
              key={filter.value}
              onClick={() => setNotificationFilter(filter.value as any)}
              title={filter.label}
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                notificationFilter === filter.value 
                  ? (isDark ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30') 
                  : (isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700')
              }`}
            >
              <i className={`fas ${filter.icon} text-sm`}></i>
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
            <p className="text-sm font-medium">暂无通知</p>
            <p className="text-xs opacity-60 mt-1">当有新通知时，会在这里显示</p>
          </li>
        ) : (
          filteredNotifications.map(n => (
            <li key={n.id} className={`border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-gray-50'}`}>
              <button
                onClick={() => {
                  setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
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
                      {n.category === 'like' && '点赞'}
                      {n.category === 'join' && '新成员'}
                      {n.category === 'message' && '私信'}
                      {n.category === 'mention' && '@提及'}
                      {n.category === 'task' && '任务'}
                      {n.category === 'points' && '积分'}
                      {n.category === 'system' && '系统'}
                      {n.category === 'learning' && '学习'}
                      {n.category === 'creation' && '创作'}
                      {n.category === 'social' && '社交'}
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
