import { useState, useContext, useEffect, useMemo, useCallback, memo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { AuthContext } from '@/contexts/authContext'
import { toast } from 'sonner'
import { markPrefetched, isPrefetched } from '@/services/prefetch'
import { componentPreloader } from '@/utils/performanceOptimization'
import { throttle } from '@/utils/performance'
import clsx from 'clsx'
import { TianjinImage } from './TianjinStyleComponents'
import useLanguage from '@/contexts/LanguageContext'
import { useTranslation } from 'react-i18next'
import { navigationGroups } from '@/config/navigationConfig'

import PWAInstallButton from './PWAInstallButton'

interface MobileLayoutProps {
  children: React.ReactNode
}

const MobileLayout = memo(function MobileLayout({ children }: MobileLayoutProps) {
  const { theme = 'light', isDark = false, toggleTheme = () => {}, setTheme = () => {}, availableThemes = [] } = useTheme()
  const { isAuthenticated, user, logout } = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage, languages } = useLanguage()
  
  const [showMobileNav, setShowMobileNav] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false)
  // 通知数据类型
  type Notification = {
    id: string
    title: string
    description: string
    time: string
    read: boolean
    type: 'success' | 'info' | 'warning' | 'error'
    category: 'like' | 'join' | 'message' | 'mention' | 'task' | 'points' | 'system' | 'learning' | 'creation' | 'social'
    actionUrl?: string
    timestamp: number
    sound?: boolean
  }

  // 通知状态管理
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'info' | 'success' | 'warning' | 'error' | 'like' | 'join' | 'message' | 'mention' | 'task' | 'points' | 'system' | 'learning' | 'creation' | 'social'>('all')
  const [showSettings, setShowSettings] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  // 通知设置状态
  interface NotificationSettings {
    enableSound: boolean;
    enableDesktop: boolean;
    maxNotifications: number;
    notificationTypes: {
      [key in Notification['category']]: boolean;
    };
  }

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem('notificationSettings');
      if (stored) return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
    return {
      enableSound: true,
      enableDesktop: true,
      maxNotifications: 50,
      notificationTypes: {
        like: true,
        join: true,
        message: true,
        mention: true,
        task: true,
        points: true,
        system: true,
        learning: true,
        creation: true,
        social: true,
      },
    };
  });

  // 初始化通知数据
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem('notifications')
      if (stored) {
        const parsed = JSON.parse(stored)
        // 确保所有通知都有完整字段
        return parsed.map((n: any) => ({
          ...n,
          category: n.category || 'system',
          timestamp: n.timestamp || Date.now() - 3600000,
          description: n.description || '',
        }))
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error)
    }
    const now = Date.now()
    // 默认通知数据
    return [
      { id: 'n1', title: t('notification.newMessage'), description: t('notification.newMessageDesc'), time: t('notification.justNow'), read: false, type: 'info', category: 'message', timestamp: now },
      { id: 'n2', title: t('notification.systemNotification'), description: t('notification.systemNotificationDesc'), time: `1 ${t('notification.hoursAgo')}`, read: false, type: 'success', category: 'system', timestamp: now - 3600000 },
      { id: 'n3', title: t('notification.workLiked'), description: t('notification.workLikedNewDesc'), time: `2 ${t('notification.hoursAgo')}`, read: false, type: 'success', category: 'like', timestamp: now - 7200000 },
      { id: 'n4', title: t('notification.newMember'), description: t('notification.newMemberDesc'), time: `30 ${t('notification.minutesAgo')}`, read: false, type: 'info', category: 'join', timestamp: now - 1800000 },
      { id: 'n5', title: t('notification.mention'), description: t('notification.mentionDesc'), time: `3 ${t('notification.hoursAgo')}`, read: true, type: 'info', category: 'mention', timestamp: now - 10800000 },
      { id: 'n6', title: t('notification.taskCompleted'), description: t('notification.taskCompletedDesc'), time: `4 ${t('notification.hoursAgo')}`, read: true, type: 'success', category: 'task', timestamp: now - 14400000 },
      { id: 'n7', title: t('notification.pointsAdded'), description: t('notification.pointsAddedDesc'), time: `5 ${t('notification.hoursAgo')}`, read: false, type: 'success', category: 'points', timestamp: now - 18000000 },
      { id: 'n8', title: t('notification.uploadFailed'), description: t('notification.uploadFailedDesc'), time: `6 ${t('notification.hoursAgo')}`, read: false, type: 'error', category: 'creation', timestamp: now - 21600000 },
    ]
  })
  // 未读通知数量
  const unreadNotificationCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  
  // 过滤后的通知
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];
    
    if (notificationFilter === 'unread') {
      result = result.filter(n => !n.read);
    } else if (notificationFilter !== 'all') {
      // 检查是否为类型过滤或分类过滤
      const isTypeFilter = ['info', 'success', 'warning', 'error'].includes(notificationFilter);
      if (isTypeFilter) {
        result = result.filter(n => n.type === notificationFilter);
      } else {
        // 分类过滤
        result = result.filter(n => n.category === notificationFilter);
      }
    }
    
    return result;
  }, [notifications, notificationFilter]);

  // 保存通知到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error)
    }
  }, [notifications])

  // 保存通知设置到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }, [notificationSettings]);
  
  // 使用 useMemo 优化主题相关的样式计算
  const themeStyles = useMemo(() => {
    return {
      background: isDark ? 'bg-gray-900 text-white' : theme === 'pink' ? 'bg-pink-50 text-pink-900' : 'bg-gray-50 text-gray-900',
      logoBackground: isDark ? 'bg-blue-600' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500',
      logoText: t('common.logoText'),
      gradient: isDark ? 'from-blue-500 to-purple-600' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500'
    }
  }, [theme, isDark])

  // 导航栏头像组件 - 处理图片加载错误
  const NavAvatar = memo(({ user, isDark, theme }: { user: any, isDark: boolean, theme: string }) => {
    const [imgError, setImgError] = useState(false);
    
    // 当头像URL变化时重置错误状态
    useEffect(() => {
      setImgError(false);
    }, [user?.avatar]);

    const showImage = user?.avatar && user.avatar.trim() && !imgError;

    return (
      <div className={clsx(
        'w-8 h-8 rounded-full overflow-hidden border-2 shadow-md transition-all duration-300 hover:ring-2',
        isDark ? 'border-gray-700 hover:ring-blue-500' : 
        theme === 'pink' ? 'border-pink-300 hover:ring-pink-500' : 
        'border-gray-300 hover:ring-orange-500'
      )}>
        {showImage ? (
          <img
            key={user.avatar} // 添加 key 确保 URL 变化时重新渲染 img 标签
            src={user.avatar}
            alt={user.username || t('common.user')}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={clsx(
            'w-full h-full flex items-center justify-center text-white font-bold text-base',
            isDark ? 'bg-blue-600' : 
            theme === 'pink' ? 'bg-pink-500' : 
            'bg-orange-500'
          )}>
            {user?.username?.charAt(0) || 'U'}
          </div>
        )}
      </div>
    );
  });

  // 使用节流优化滚动事件处理
  const handleScroll = useCallback(
    throttle(() => {
      setIsScrolled(window.scrollY > 100)
      // 计算滚动进度
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0
      setScrollProgress(progress)
    }, 100), // 100ms 内最多执行一次
    []
  )

  useEffect(() => {
    // 滚动监听
    window.addEventListener('scroll', handleScroll, { passive: true }) // 添加 passive 选项优化滚动性能
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 页面切换时隐藏搜索框
  useEffect(() => {
    setShowSearch(false)
  }, [location.pathname])

  // 处理语音搜索：使用多语言提示文案
  const handleVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      // 浏览器不支持语音识别时的错误提示
      toast.error(t('toast.browserNotSupportVoice'))
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = currentLanguage === 'en' ? 'en-US' : 'zh-CN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)

    recognition.onstart = () => {
      // 开始监听语音时的提示
      toast.info(t('toast.listening'))
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setSearch(transcript)
      setIsListening(false)
      // 识别成功后展示识别结果
      toast.success(t('toast.voiceResult', { result: transcript }))
    }

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      setIsListening(false)
      if (event.error !== 'no-speech') {
        // 非无语音错误时给出统一错误提示
        toast.error(t('toast.voiceFailed'))
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [t])

  // 处理搜索：为空时给出多语言提示
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) {
      // 搜索关键词为空时的提醒
      toast.warning(t('toast.enterKeyword'))
      return
    }
    const encodedSearch = encodeURIComponent(search.trim())
    navigate(`/explore?search=${encodedSearch}`)
    setSearch('')
    setShowSearch(false)
  }, [search, navigate, t])

  // 预取路由 - 使用组件预加载器
  const prefetchRoute = useCallback((id: string) => {
    componentPreloader.preloadComponents([id]);
  }, [])

  return (
    <div className={clsx(
      'min-h-screen flex flex-col',
      themeStyles.background
    )}>
      {/* 滚动进度指示器 - 优化视觉效果 */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none">
        <div 
          className={clsx(
            'h-full transition-all duration-300 ease-out rounded-full shadow-lg',
            `bg-gradient-to-r ${themeStyles.gradient}`,
            scrollProgress > 0 && `opacity-100`,
            scrollProgress === 0 && `opacity-0`
          )}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      {/* 顶部搜索栏 - 增强视觉层次感 */}
      {showSearch ? (
        <div className={clsx(
          'sticky top-0 z-40 border-b py-1.5 px-2 transition-all duration-300 ease-in-out',
          isDark ? 'bg-gray-800/95 backdrop-blur-2xl border-gray-700 shadow-lg' : 
          theme === 'pink' ? 'bg-pink-100/95 backdrop-blur-2xl border-pink-200 shadow-lg' : 
          'bg-white/95 backdrop-blur-2xl border-gray-200 shadow-lg'
        )} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="relative flex items-center touch-none">
            <button
              onClick={() => setShowSearch(false)}
              className={clsx(
                'mr-2 p-2 rounded-full transition-all duration-300 hover:scale-110',
                isDark ? 'text-gray-300 hover:bg-gray-800' : 
                theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                'text-gray-700 hover:bg-gray-200'
              )}
              aria-label={t('header.close')}
            >
              <i className="fas fa-times text-lg"></i>
            </button>
            <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('header.searchPlaceholder')}
                      className={clsx(
                        'w-full pl-10 pr-14 py-2.5 rounded-full focus:outline-none focus:ring-3 focus:ring-offset-0 transition-all duration-300',
                        isDark ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-blue-500/50' : 
                        theme === 'pink' ? 'bg-pink-200 text-pink-900 placeholder-pink-700 focus:ring-pink-500/50' : 
                        'bg-gray-200 text-gray-900 placeholder-gray-700 focus:ring-orange-500/50'
                      )}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
                      <i className={clsx(
                        'fas fa-search',
                        isDark ? 'text-gray-400' : 
                        theme === 'pink' ? 'text-pink-500' : 
                        'text-orange-500'
                      )}></i>
                    </div>
                    {/* 语音搜索按钮 */}
                    <button
                      type="button"
                      onClick={handleVoiceSearch}
                      className={clsx(
                        'absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all duration-300 hover:scale-110',
                        isListening 
                          ? (isDark ? 'bg-red-500 text-white shadow-lg animate-pulse' : theme === 'pink' ? 'bg-pink-500 text-white shadow-lg animate-pulse' : 'bg-orange-500 text-white shadow-lg animate-pulse')
                          : (isDark ? 'text-gray-300 hover:bg-gray-800' : theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 'text-gray-700 hover:bg-gray-200')
                      )}
                      aria-label={t('mobile.voiceSearch')}
                    >
                      <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                    </button>
                  </div>
                </form>
          </div>
        </div>
      ) : (
        <div className={clsx(
          'sticky top-0 z-40 border-b py-1.5 px-2 transition-all duration-300 ease-in-out',
          isDark ? 'bg-gray-800/95 backdrop-blur-2xl border-gray-700 shadow-lg' : 
          theme === 'pink' ? 'bg-pink-100/95 backdrop-blur-2xl border-pink-200 shadow-lg' : 
          'bg-white/95 backdrop-blur-2xl border-gray-200 shadow-lg'
        )} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between touch-none">
            {/* Logo 和菜单按钮 - 左侧紧凑布局 */}
            <div className="flex items-center flex-1 min-w-0 mr-0.5">
              {/* 菜单按钮 - 增强交互效果 */}
              <button
                onClick={() => setShowSidebarDrawer(true)}
                className={clsx(
                  'w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 mr-0.5 flex-shrink-0',
                  isDark ? 'text-gray-500 hover:bg-gray-700' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label={t('sidebar.expandSidebar')}
              >
                <i className="fas fa-bars text-sm"></i>
              </button>
              <NavLink
                to="/"
                onTouchStart={() => prefetchRoute('home')}
                className={clsx(
                  'flex items-center gap-1 transition-all duration-300 hover:scale-105 active:scale-95 group min-w-0',
                  isDark ? 'text-white' : 
                  theme === 'pink' ? 'text-pink-900' : 
                  'text-gray-900'
                )}
              >
                <div className={clsx(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold shadow-md transition-all duration-300 hover:scale-110 group-hover:shadow-lg flex-shrink-0',
                  `bg-gradient-to-br ${themeStyles.logoBackground}`,
                  'relative overflow-hidden'
                )}>
                  <span className="text-sm font-extrabold z-10 transform transition-transform duration-300 group-hover:scale-125">{themeStyles.logoText}</span>
                  <div className={clsx(
                    'absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300',
                    `bg-gradient-to-tr from-white to-transparent`
                  )}></div>
                </div>
                <span className="ml-0.5 text-sm font-bold tracking-tight align-baseline bg-clip-text text-transparent bg-gradient-to-r truncate max-w-[120px] xs:max-w-none"
                  style={{ 
                    backgroundImage: isDark ? 'linear-gradient(to right, #60a5fa, #a78bfa)' : 
                                     theme === 'pink' ? 'linear-gradient(to right, #ec4899, #f472b6)' : 
                                     'linear-gradient(to right, #f97316, #fb923c)' 
                  }}>
                  {t('common.appName')}
                </span>
              </NavLink>
            </div>
            
            {/* 右侧按钮组 - 向右靠紧 */}
            <div className="flex items-center space-x-0.5 flex-shrink-0">
              {/* 搜索按钮 */}
              <button
                onClick={() => setShowSearch(true)}
                className={clsx(
                  'w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95',
                  isDark ? 'text-gray-500 hover:bg-gray-700' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label={t('common.search')}
              >
                <i className="fas fa-search text-sm"></i>
              </button>
              
              {/* 通知按钮 - 优化通知徽章 */}
              <button
                className={clsx(
                  'w-8 h-8 flex items-center justify-center rounded-full relative transition-all duration-300 hover:scale-110 active:scale-95',
                  isDark ? 'text-gray-500 hover:bg-gray-700' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label={t('header.notifications')}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="fas fa-bell text-sm"></i>
                {unreadNotificationCount > 0 && (
                  <span className={clsx(
                    'absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[9px] font-bold transition-all duration-300 animate-bounce',
                    isDark ? 'bg-blue-500 shadow-md' : 
                    theme === 'pink' ? 'bg-pink-500 shadow-md' : 
                    'bg-orange-500 shadow-md'
                  )}>
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>
              {/* 通知列表下拉 */}
              {showNotifications && (
                <div className="fixed top-0 left-0 w-full h-full z-50 flex justify-end items-start pt-20 px-4 pointer-events-none">
                  {/* 点击外部关闭通知列表 */}
                  <div className="absolute inset-0 bg-black/10 pointer-events-auto" onClick={() => setShowNotifications(false)}></div>
                  <div className={`relative w-full max-w-xs rounded-xl shadow-2xl ring-2 overflow-hidden pointer-events-auto ${isDark ? 'bg-gray-800 ring-gray-700' : theme === 'pink' ? 'bg-white ring-pink-300' : 'bg-white ring-gray-300'}`} role="dialog" aria-label={t('header.viewNotifications')}>
                    {/* 通知列表头部 */}
                    <div className={`px-3 py-2.5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between bg-gradient-to-r ${isDark ? 'from-gray-800 to-gray-900' : theme === 'pink' ? 'from-pink-50 to-white' : 'from-gray-50 to-white'}`}>
                      <h4 className="font-medium flex items-center text-sm">
                        <i className="fas fa-bell mr-1.5 text-blue-500 text-sm"></i>
                        {t('header.notifications')}
                        <span className="ml-1.5 text-[10px] font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}">({unreadNotificationCount} {t('notification.types.unread')})</span>
                      </h4>
                      <div className="flex items-center space-x-1.5">
                        <button
                          className={`text-[10px] px-2.5 py-1 rounded-md transition-all duration-300 ${isDark ? 'bg-gray-700 text-white hover:bg-blue-900/50 hover:text-blue-400' : 'bg-gray-100 text-gray-900 hover:bg-blue-50 hover:text-blue-700'}`}
                          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
                          <i className="fas fa-check-double mr-0.5 text-xs"></i>
                          {t('header.markAllAsRead')}
                        </button>
                        <button
                          className={`text-[10px] px-2.5 py-1 rounded-md transition-all duration-300 ${isDark ? 'bg-gray-700 text-white hover:bg-red-900/50 hover:text-red-400' : 'bg-gray-100 text-gray-900 hover:bg-red-50 hover:text-red-700'}`}
                          onClick={() => setNotifications([])}>
                          <i className="fas fa-trash mr-0.5 text-xs"></i>
                          {t('header.clearAll')}
                        </button>
                        <button
                          className={`text-[10px] px-2.5 py-1 rounded-md transition-all duration-300 ${isDark ? 'bg-gray-700 text-white hover:bg-purple-900/50 hover:text-purple-400' : 'bg-gray-100 text-gray-900 hover:bg-purple-50 hover:text-purple-700'}`}
                          onClick={() => setShowSettings(!showSettings)}>
                          <i className="fas fa-cog mr-0.5 text-xs"></i>
                          {t('header.settings')}
                        </button>
                      </div>
                    </div>

                    {/* 通知设置面板 */}
                    {showSettings && (
                      <div className={`px-3 py-2.5 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                        <h4 className="font-medium mb-2.5 flex items-center text-sm">
                          <i className="fas fa-sliders-h mr-1.5 text-purple-500 text-sm"></i>
                          {t('notification.settings')}
                        </h4>
                        
                        {/* 基本设置 */}
                        <div className="space-y-3">
                          {/* 声音提醒 */}
                          <div className="flex items-center justify-between">
                            <label className="text-sm flex items-center">
                              <i className="fas fa-volume-up mr-1.5 text-gray-500 text-sm"></i>
                              {t('notification.sound')}
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={notificationSettings.enableSound} 
                                onChange={(e) => setNotificationSettings(prev => ({ ...prev, enableSound: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className={`w-10 h-5 rounded-full transition-all duration-300 peer ${notificationSettings.enableSound ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                              <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-5`}></span>
                            </label>
                          </div>
                          
                          {/* 桌面通知 */}
                          <div className="flex items-center justify-between">
                            <label className="text-sm flex items-center">
                              <i className="fas fa-desktop mr-1.5 text-gray-500 text-sm"></i>
                              {t('notification.desktop')}
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={notificationSettings.enableDesktop} 
                                onChange={(e) => setNotificationSettings(prev => ({ ...prev, enableDesktop: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className={`w-10 h-5 rounded-full transition-all duration-300 peer ${notificationSettings.enableDesktop ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                              <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-5`}></span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 通知过滤标签 */}
                    <div className={`px-3 py-1.5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-x-auto whitespace-nowrap`}>
                      <div className="flex space-x-1.5">
                        {[
                          { value: 'all', label: t('notification.types.all'), icon: 'fa-inbox' },
                          { value: 'unread', label: t('notification.types.unread'), icon: 'fa-envelope-open-text' },
                          { value: 'like', label: t('notification.types.like'), icon: 'fa-heart' },
                          { value: 'message', label: t('notification.types.message'), icon: 'fa-envelope' },
                          { value: 'mention', label: t('notification.types.mention'), icon: 'fa-at' },
                          { value: 'task', label: t('notification.types.task'), icon: 'fa-tasks' },
                          { value: 'points', label: t('notification.types.points'), icon: 'fa-coins' },
                        ].map(filter => (
                          <button
                            key={filter.value}
                            onClick={() => setNotificationFilter(filter.value as any)}
                            className={`px-2.5 py-0.75 rounded-full text-[10px] font-medium flex items-center transition-all duration-300 ${notificationFilter === filter.value ? 
                              (isDark ? 'bg-blue-900/50 text-blue-400 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-300') : 
                              (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}
                          >
                            <i className={`fas ${filter.icon} mr-1 text-[9px]`}></i>
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 通知列表内容 */}
                    <div className="max-h-[280px] overflow-y-auto">
                      {filteredNotifications.length === 0 ? (
                        <div className="p-3 text-center">
                          <i className="fas fa-bell-slash text-2xl text-gray-400 mb-1.5"></i>
                          <p className="text-sm text-gray-500">{t('notification.empty')}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{t('notification.emptyDesc')}</p>
                        </div>
                      ) : (
                        filteredNotifications.map((notification) => (
                          <div key={notification.id} className={`p-3 border-b last:border-b-0 transition-all duration-200 hover:bg-opacity-90 ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'} ${!notification.read ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : ''}`}>
                            <div className="flex items-start gap-2.5">
                              {/* 通知图标 - 根据分类显示不同图标 */}
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-base transition-all duration-300 mt-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <i className={`fas ${notification.category === 'like' ? 'fa-heart text-red-500' : 
                                                notification.category === 'join' ? 'fa-user-plus text-green-500' : 
                                                notification.category === 'message' ? 'fa-envelope text-blue-500' : 
                                                notification.category === 'mention' ? 'fa-at text-purple-500' : 
                                                notification.category === 'task' ? 'fa-tasks text-green-600' : 
                                                notification.category === 'points' ? 'fa-coins text-yellow-500' : 
                                                notification.type === 'success' ? 'fa-check-circle text-green-500' : 
                                                notification.type === 'error' ? 'fa-times-circle text-red-500' : 
                                                notification.type === 'warning' ? 'fa-exclamation-triangle text-yellow-500' : 
                                                'fa-info-circle text-blue-500'}`}></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <h4 className={`text-sm font-medium truncate ${!notification.read ? 'font-semibold' : ''}`}>{notification.title}</h4>
                                  <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{notification.time}</span>
                                </div>
                                <p className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-700'} mt-1 line-clamp-2`}>{notification.description}</p>
                                {/* 通知分类标签 */}
                                <span className={`mt-1 inline-block px-1.5 py-0.25 rounded-full text-[10px] ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                  {notification.category === 'like' && t('notification.types.like')}
                                  {notification.category === 'join' && t('notification.types.join')}
                                  {notification.category === 'message' && t('notification.types.message')}
                                  {notification.category === 'mention' && t('notification.types.mention')}
                                  {notification.category === 'task' && t('notification.types.task')}
                                  {notification.category === 'points' && t('notification.types.points')}
                                  {notification.category === 'system' && t('notification.types.system')}
                                  {notification.category === 'learning' && t('notification.types.learning')}
                                  {notification.category === 'creation' && t('notification.types.creation')}
                                  {notification.category === 'social' && t('notification.types.social')}
                                </span>
                              </div>
                              {/* 未读指示器 */}
                              {!notification.read && (
                                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'} mt-2 animate-ping`}></span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 用户菜单 - 增强视觉效果 */}
              {isAuthenticated ? (
                <div className="relative group flex-shrink-0">
                  <button
                    className={clsx(
                      'flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-110 active:scale-95',
                      isDark ? 'text-gray-300 hover:bg-gray-800' : 
                      theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                      'text-gray-700 hover:bg-gray-200'
                    )}
                    aria-label="用户菜单"
                  >
                    <NavAvatar user={user} isDark={isDark} theme={theme} />
                  </button>
                  
                  {/* 下拉菜单 - 优化动画效果 */}
                  <div className={clsx(
                    'absolute right-0 mt-2 w-52 rounded-xl shadow-2xl ring-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2',
                    isDark ? 'bg-gray-800 ring-gray-700' : 
                    theme === 'pink' ? 'bg-pink-100 ring-pink-200' : 
                    'bg-white ring-gray-200'
                  )}>
                    <div className="py-2">
                      <NavLink
                      to="/dashboard"
                      onTouchStart={() => prefetchRoute('dashboard')}
                      className={clsx(
                        'block px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1',
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 
                        theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                        'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <i className="fas fa-user mr-3"></i>
                      {t('header.profile')}
                    </NavLink>
                    <NavLink
                      to="/analytics"
                      onTouchStart={() => prefetchRoute('/analytics')}
                      className={clsx(
                        'block px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1',
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 
                        theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                        'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <i className="fas fa-chart-bar mr-3"></i>
                      {/* 数据分析入口 */}
                      {t('header.analytics')}
                    </NavLink>
                    <NavLink
                      to="/drafts"
                      onTouchStart={() => prefetchRoute('drafts')}
                      className={clsx(
                        'block px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1',
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 
                        theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                        'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <i className="fas fa-file-alt mr-3"></i>
                      {/* 草稿箱入口 */}
                      {t('common.drafts')}
                    </NavLink>
                    <NavLink
                      to="/collections"
                      onTouchStart={() => prefetchRoute('/collections')}
                      className={clsx(
                        'block px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1',
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 
                        theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                        'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <i className="fas fa-heart mr-3"></i>
                      {/* 我的收藏入口 */}
                      {t('header.myCollection')}
                    </NavLink>
                    <button
                      onClick={() => {
                        window.location.href = '/landing.html';
                      }}
                      onTouchStart={() => {
                        window.location.href = '/landing.html';
                      }}
                      className={clsx(
                        'block px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1 w-full text-left',
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 
                        theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                        'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <i className="fas fa-home mr-3"></i>
                      {t('header.backToOfficialWebsite')}
                    </button>
                    <NavLink
                      to="/membership"
                      onTouchStart={() => prefetchRoute('membership')}
                      className={clsx(
                        'block px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1',
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 
                        theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                        'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <i className="fas fa-crown mr-3"></i>
                      {t('header.membershipCenter')}
                    </NavLink>
                    <NavLink
                      to="/create"
                      onTouchStart={() => prefetchRoute('create')}
                      className={clsx(
                        'block px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1',
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 
                        theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                        'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <i className="fas fa-paint-brush mr-3"></i>
                      {t('common.create')}
                    </NavLink>
                    <NavLink
                      to="/settings"
                      onTouchStart={() => prefetchRoute('/settings')}
                      className={clsx(
                        'block px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1',
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 
                        theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                        'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <i className="fas fa-cog mr-3"></i>
                      {t('header.settings')}
                    </NavLink>
                      <div className={clsx(
                        'border-t my-2',
                        isDark ? 'border-gray-700' : 
                        theme === 'pink' ? 'border-pink-200' : 
                        'border-gray-200'
                      )}></div>
                      <button
                        onClick={() => {
                          logout()
                          navigate('/login')
                          toast.success(t('toast.logoutSuccess'))
                        }}
                        className={clsx(
                          'w-full text-left px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1',
                          isDark ? 'text-red-400 hover:bg-gray-700' : 
                          theme === 'pink' ? 'text-red-700 hover:bg-pink-200' : 
                          'text-red-700 hover:bg-gray-100'
                        )}
                      >
                        <i className="fas fa-sign-out-alt mr-3"></i>
                        {t('header.logout')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* 未登录状态 - 显示用户图标 */
                <NavLink
                  to="/login"
                  onTouchStart={() => prefetchRoute('/login')}
                  className={clsx(
                    'flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-110 active:scale-95',
                    isDark ? 'text-gray-300 hover:bg-gray-700' : 
                    theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                    'text-gray-700 hover:bg-gray-200'
                  )}
                  aria-label="登录"
                >
                  <div className={clsx(
                    'w-8 h-8 rounded-full overflow-hidden border-2 shadow-md transition-all duration-300 hover:ring-2',
                    isDark ? 'border-gray-700 hover:ring-blue-500' : 
                    theme === 'pink' ? 'border-pink-300 hover:ring-pink-500' : 
                    'border-gray-300 hover:ring-orange-500'
                  )}>
                    <div className={clsx(
                      'w-full h-full flex items-center justify-center text-white font-bold text-base',
                      isDark ? 'bg-blue-600' : 
                      theme === 'pink' ? 'bg-pink-300' : 
                      'bg-orange-500'
                    )}>
                      用
                    </div>
                  </div>
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 侧边栏抽屉 */}
      <div className={`fixed inset-0 z-50 transform transition-all duration-300 ease-in-out ${showSidebarDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* 遮罩层 */}
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowSidebarDrawer(false)}
        />
        {/* 抽屉内容 */}
          <aside className={clsx(
            'absolute left-0 top-0 bottom-0 overflow-y-auto transform transition-transform duration-300 ease-in-out',
            showSidebarDrawer ? 'translate-x-0' : '-translate-x-full',
            isDark ? 'bg-[#0b0e13] text-white' : 
            theme === 'pink' ? 'bg-pink-50 text-pink-900' : 
            'bg-white text-gray-900',
            'z-50 shadow-2xl',
            // 响应式宽度设计
            'w-[90%] sm:w-[80%] md:w-[70%] lg:w-[60%] xl:w-[50%]'
          )}>
          {/* 抽屉头部 */}
          <div className={clsx(
            'p-3 flex items-center justify-between border-b',
            isDark ? 'border-gray-800' : 
            theme === 'pink' ? 'border-pink-200' : 
            'border-gray-200'
          )}>
            <div className="flex items-center">
              <div className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold',
                themeStyles.logoBackground
              )}>
                {themeStyles.logoText}
              </div>
              {/* 应用名称多语言显示 */}
              <span className="ml-2 text-lg font-bold">{t('common.appName')}</span>
            </div>
            <button
              onClick={() => setShowSidebarDrawer(false)}
              className={clsx(
                'p-2 rounded-full transition-colors duration-200',
                isDark ? 'text-gray-300 hover:bg-gray-800' : 
                theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                'text-gray-700 hover:bg-gray-200'
              )}
              // 关闭侧边栏的无障碍文本
              aria-label={t('sidebar.collapseSidebar')}
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
          
          {/* 主题切换快捷入口 */}
          <div className={clsx('p-2.5 rounded-lg transition-all duration-300', isDark ? 'bg-gray-800' : theme === 'pink' ? 'bg-pink-100' : 'bg-gray-100')}>
            <h3 className={clsx('text-[10px] font-semibold mb-1.5 uppercase tracking-wider', isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-700' : 'text-gray-600')}>{t('header.toggleTheme')}</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {availableThemes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    // 切换主题后的提示
                    toast.success(t('toast.themeSwitched', { theme: themeOption.label }));
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${theme === themeOption.value ? (isDark ? 'bg-blue-600 text-white' : theme === 'pink' ? 'bg-pink-500 text-white' : 'bg-orange-500 text-white') : (isDark ? 'bg-gray-700 hover:bg-gray-600' : theme === 'pink' ? 'bg-pink-200 hover:bg-pink-300' : 'bg-gray-200 hover:bg-gray-300')}`}
                  title={themeOption.label}
                >
                  <i className={`${themeOption.icon} text-base mb-0.5`}></i>
                  <span className="text-[9px]">{themeOption.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 语言切换快捷入口 */}
          <div className={clsx('p-2.5 rounded-lg transition-all duration-300', isDark ? 'bg-gray-800' : theme === 'pink' ? 'bg-pink-100' : 'bg-gray-100')}>
            <h3 className={clsx('text-[10px] font-semibold mb-1.5 uppercase tracking-wider', isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-700' : 'text-gray-600')}>{t('common.language')}</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code);
                    // 切换语言后的提示
                    toast.success(t('toast.languageSwitched', { lang: lang.name }));
                  }}
                  className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${currentLanguage === lang.code ? (isDark ? 'bg-blue-600 text-white' : theme === 'pink' ? 'bg-pink-500 text-white' : 'bg-orange-500 text-white') : (isDark ? 'bg-gray-700 hover:bg-gray-600' : theme === 'pink' ? 'bg-pink-200 hover:bg-pink-300' : 'bg-gray-200 hover:bg-gray-300')}`}
                  title={lang.name}
                >
                  <span className="text-[9px]">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 导航菜单 */}
          <nav className="p-2.5 space-y-3">
            {/* 从导航配置导入分组 */}
            {navigationGroups.map(group => (
              <div key={group.id} className="rounded-lg overflow-hidden">
                {/* 分组标题 - 可点击展开/折叠 */}
                <button
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2.5 transition-all duration-200',
                    'min-h-[44px]', // 确保触摸目标尺寸不小于44px
                    isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 
                    theme === 'pink' ? 'bg-pink-50 hover:bg-pink-100' : 
                    'bg-gray-50 hover:bg-gray-100'
                  )}
                  onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                >
                  <h3 className={clsx('text-sm font-semibold uppercase tracking-wider flex items-center', 
                    isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-700' : 'text-gray-600')}>
                    <i className={`fas fa-chevron-down mr-1.5 text-xs transition-transform duration-300 ${expandedGroup === group.id ? 'transform rotate-180' : ''}`}></i>
                    {group.title}
                  </h3>
                  <span className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    isDark ? 'bg-gray-700 text-gray-300' : 
                    theme === 'pink' ? 'bg-pink-200 text-pink-800' : 
                    'bg-gray-200 text-gray-700'
                  )}>
                    {group.items.length}
                  </span>
                </button>
                
                {/* 分组内容 - 展开/折叠动画 */}
                {expandedGroup === group.id && (
                  <div className="overflow-hidden transition-all duration-300 ease-in-out">
                    <div className="space-y-1 p-1.5">
                      {group.items.map(item => (
                        <NavLink
                          key={item.id}
                          to={item.path + (item.search || '')}
                          title={item.label}
                          onTouchStart={() => prefetchRoute(item.id)}
                          className={({ isActive }) => clsx(
                            'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200',
                            'min-h-[44px]', // 确保触摸目标尺寸不小于44px
                            isActive ? (
                              isDark ? 'bg-blue-900/30 text-blue-400 font-medium' : 
                              theme === 'pink' ? 'bg-pink-100 text-pink-700 font-medium' : 
                              'bg-blue-50 text-blue-700 font-medium'
                            ) : (
                              isDark ? 'text-gray-300 hover:bg-gray-800' : 
                              theme === 'pink' ? 'text-pink-900 hover:bg-pink-50' : 
                              'text-gray-900 hover:bg-gray-50'
                            )
                          )}
                          onClick={() => setShowSidebarDrawer(false)}
                        >
                          <i className={`${item.icon} mr-2.5 text-base transition-transform duration-200 hover:scale-110`}></i>
                          <span className="flex-1 transition-all duration-200 text-sm">{item.label}</span>
                          {item.external && (
                            <i className="fas fa-external-link-alt text-[10px] opacity-50"></i>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>
      </div>
      
      {/* 主内容区 */}
      <main className={clsx(
        'flex-1 overflow-y-auto relative',
        'pb-20', // 统一底部内边距，确保在所有主题下都不会被底部导航栏遮挡
        'min-w-0' // 确保主内容区不会超出容器
      )}>
        {children}
      </main>
      
      {/* 底部导航 - 优化交互体验 */}
      <nav className={clsx(
        'fixed bottom-0 inset-x-0 md:hidden z-20 transform transition-all duration-300 ease-in-out',
        isDark ? 'bg-gray-900/95 backdrop-blur-xl ring-1 ring-gray-800/70 py-0 shadow-xl' : 
        theme === 'pink' ? 'bg-gradient-to-t from-white/98 to-white/80 backdrop-blur-2xl ring-1 ring-pink-300/80 py-0 shadow-[0_-2px_20px_rgba(236,72,153,0.15),0_0_30px_rgba(236,72,153,0.1)]' : 
        'bg-white/95 backdrop-blur-xl ring-1 ring-gray-200/70 py-0 shadow-2xl'
      )} style={{ paddingBottom: 'env(safe-area-inset-bottom)', transform: showMobileNav ? 'translateY(0)' : 'translateY(100%)' }}>
        <ul className={clsx(
          'grid grid-cols-5',
          'py-0 px-0' // 减少内边距，减小导航栏视觉体积
        )}>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/" 
              onTouchStart={() => prefetchRoute('home')}
              aria-label="首页"
              className="flex-1 flex items-center justify-center"
              end
            >
              {({ isActive }) => {
                const baseClass = clsx(
                  'flex flex-col items-center justify-center transition-all duration-300 ease-in-out relative group transform-gpu',
                  'min-h-[44px] px-0', // 确保触摸目标尺寸不小于44px，减少内边距
                  'py-0' // 统一上下内边距
                );
                const iconColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-700' : 'text-gray-900') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-400' : 'text-gray-600');
                const textColor = isActive ? (isDark ? 'text-white font-medium' : theme === 'pink' ? 'text-pink-800 font-semibold' : 'text-gray-900 font-medium') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-500' : 'text-gray-600');
                const iconClass = isActive ? 'scale-115 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-medium opacity-100 scale-100' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-400 via-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, 'cursor-pointer')}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-115 active:scale-95')}>
                      <i className={clsx("fas fa-home transition-all duration-300", "text-xs")} style={{ color: iconColor, textShadow: isActive && theme === 'pink' ? '0 0 6px rgba(236, 72, 153, 0.15)' : 'none' }}></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`, theme === 'pink' ? 'shadow-sm shadow-pink-300/30' : '')}></span>
                          <div className={clsx('absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.25 h-1.25 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500/70' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-[-2px] text-[10px] transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)} style={{ color: textColor, textShadow: isActive && theme === 'pink' ? '0 0 4px rgba(236, 72, 153, 0.15)' : 'none', writingMode: 'horizontal-tb', textOrientation: 'initial' }}>{t('common.home')}</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/explore"
              onTouchStart={() => prefetchRoute('explore')}
              aria-label="探索"
              className="flex-1 flex items-center justify-center"
            >
              {({ isActive }) => {
                const baseClass = clsx(
                  'flex flex-col items-center justify-center transition-all duration-300 ease-in-out relative group transform-gpu',
                  'min-h-[44px] px-0', // 确保触摸目标尺寸不小于44px，减少内边距
                  'py-0' // 统一上下内边距
                );
                const iconColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-700' : 'text-gray-900') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-400' : 'text-gray-600');
                const textColor = isActive ? (isDark ? 'text-white font-medium' : theme === 'pink' ? 'text-pink-800 font-semibold' : 'text-gray-900 font-medium') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-500' : 'text-gray-600');
                const iconClass = isActive ? 'scale-115 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-medium opacity-100 scale-100' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-400 via-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, 'cursor-pointer')}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-115 active:scale-95')}>
                      <i className={clsx("fas fa-compass transition-all duration-300", "text-xs")} style={{ color: iconColor, textShadow: isActive && theme === 'pink' ? '0 0 6px rgba(236, 72, 153, 0.15)' : 'none' }}></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`, theme === 'pink' ? 'shadow-sm shadow-pink-300/30' : '')}></span>
                          <div className={clsx('absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.25 h-1.25 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500/70' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-[-2px] text-[10px] transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)} style={{ color: textColor, textShadow: isActive && theme === 'pink' ? '0 0 4px rgba(236, 72, 153, 0.15)' : 'none', writingMode: 'horizontal-tb', textOrientation: 'initial' }}>{t('common.explore')}</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/create"
              onTouchStart={() => prefetchRoute('/create')}
              aria-label="创作"
              className="flex-1 flex items-center justify-center"
            >
              {({ isActive }) => {
                const baseClass = clsx(
                  'flex flex-col items-center justify-center transition-all duration-300 ease-in-out relative group transform-gpu',
                  'min-h-[44px] px-0', // 确保触摸目标尺寸不小于44px，减少内边距
                  'py-0' // 统一上下内边距
                );
                const iconClass = isActive ? 'scale-120 text-opacity-100' : 'scale-110 text-opacity-100';
                const textClass = isActive ? 'font-bold opacity-100 scale-105' : 'font-bold opacity-100 scale-100';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-400 via-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                const bgColor = isDark ? 'bg-blue-600' : theme === 'pink' ? 'bg-gradient-to-br from-pink-500 to-rose-500' : 'bg-orange-600';
                const hoverBgColor = isDark ? 'hover:bg-blue-700' : theme === 'pink' ? 'hover:bg-gradient-to-br from-pink-600 to-rose-600' : 'hover:bg-orange-700';
                const pulseColor = isDark ? 'bg-blue-500/30' : theme === 'pink' ? 'bg-pink-400/40' : 'bg-orange-500/30';
                const glowColor = isDark ? 'bg-blue-600/20' : theme === 'pink' ? 'bg-pink-500/30' : 'bg-orange-600/20';
                
                return (
                  <div className={clsx(baseClass, 'cursor-pointer')}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-140 active:scale-115')}>
                      {/* 创作按钮特殊效果 - 持续脉动背景 */}
                      <div className={clsx(
                        'absolute inset-0 rounded-full transition-all duration-1000 ease-in-out transform -z-10 animate-pulse',
                        `${pulseColor} scale-130`
                      )}></div>
                      {/* 创作按钮特殊效果 - 环形光晕 */}
                      <div className={clsx(
                        'absolute inset-0 rounded-full transition-all duration-500 ease-in-out transform -z-10',
                        `${glowColor} scale-150`
                      )}></div>
                      <div className={clsx(
                        'rounded-full flex items-center justify-center transition-all duration-400 transform-gpu',
                        isDark ? 'w-6 h-6 -mt-0.5' : 'w-7 h-7', // 进一步减小圆形按钮尺寸
                        `${bgColor} ${hoverBgColor}`,
                        theme === 'pink' ? 'shadow-md shadow-pink-300/30 ring-1 ring-pink-400/20' : 'shadow-sm' // 进一步减小阴影效果
                      )}>
                        <i className={clsx("fas fa-plus font-bold text-white transition-all duration-300", "text-xs")} style={{ textShadow: theme === 'pink' ? '0 0 8px rgba(255, 255, 255, 0.3)' : 'none' }}></i>
                      </div>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-[-2px] text-[10px] font-bold transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)} style={{ color: isDark ? 'text-white' : theme === 'pink' ? 'text-pink-800' : 'text-gray-900', textShadow: isActive && theme === 'pink' ? '0 0 4px rgba(236, 72, 153, 0.15)' : 'none', writingMode: 'horizontal-tb', textOrientation: 'initial' }}>{t('common.create')}</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/community?context=cocreation&tab=joined"
              onTouchStart={() => prefetchRoute('community')}
              aria-label="社群"
              className="flex-1 flex items-center justify-center"
            >
              {({ isActive }) => {
                const baseClass = clsx(
                  'flex flex-col items-center justify-center transition-all duration-300 ease-in-out relative group transform-gpu',
                  'min-h-[44px] px-0', // 确保触摸目标尺寸不小于44px，减少内边距
                  'py-0' // 统一上下内边距
                );
                const iconColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-700' : 'text-gray-900') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-400' : 'text-gray-600');
                const textColor = isActive ? (isDark ? 'text-white font-medium' : theme === 'pink' ? 'text-pink-800 font-semibold' : 'text-gray-900 font-medium') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-500' : 'text-gray-600');
                const iconClass = isActive ? 'scale-115 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-medium opacity-100 scale-100' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, 'cursor-pointer')}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-115 active:scale-95')}>
                      <i className={clsx("fas fa-comments transition-all duration-300", "text-xs")} style={{ color: iconColor, textShadow: isActive && theme === 'pink' ? '0 0 6px rgba(236, 72, 153, 0.15)' : 'none' }}></i>
                      {/* 未读消息指示器 */}
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold z-10">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.25 h-1.25 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-[-2px] text-[10px] font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)} style={{ color: textColor, textShadow: isActive && theme === 'pink' ? '0 0 4px rgba(236, 72, 153, 0.15)' : 'none', writingMode: 'horizontal-tb', textOrientation: 'initial' }}>{t('common.community')}</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/tianjin"
              onTouchStart={() => prefetchRoute('tianjin')}
              aria-label="天津特色专区"
              className="flex-1 flex items-center justify-center"
            >
              {({ isActive }) => {
                const baseClass = clsx(
                  'flex flex-col items-center justify-center transition-all duration-300 ease-in-out relative group transform-gpu',
                  'min-h-[44px] px-0', // 确保触摸目标尺寸不小于44px，减少内边距
                  'py-0' // 统一上下内边距
                );
                const iconColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-700' : 'text-gray-900') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-400' : 'text-gray-600');
                const textColor = isActive ? (isDark ? 'text-white font-medium' : theme === 'pink' ? 'text-pink-900 font-medium' : 'text-gray-900 font-medium') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-gray-500' : 'text-gray-600');
                const iconClass = isActive ? 'scale-115 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-medium opacity-100 scale-100' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass, 'cursor-pointer')}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-115 active:scale-95')}>
                      <i className={clsx("fas fa-landmark transition-all duration-300", "text-xs")} style={{ color: iconColor, textShadow: isActive && theme === 'pink' ? '0 0 6px rgba(236, 72, 153, 0.15)' : 'none' }}></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.25 h-1.25 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-[-2px] text-[10px] font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)} style={{ color: textColor, textShadow: isActive && theme === 'pink' ? '0 0 4px rgba(236, 72, 153, 0.15)' : 'none', writingMode: 'horizontal-tb', textOrientation: 'initial' }}>天津特色专区</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
        </ul>
      </nav>
      
      {/* PWA状态指示器 - 暂时隐藏 */}
      {/* <PWAStatusIndicator position="bottom-right" /> */}
      
      {/* PWA安装按钮已移动到个人中心 */}
    </div>
    )
  })

export default MobileLayout;
