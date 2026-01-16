import { useState, useContext, useEffect, useMemo, useCallback, memo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { AuthContext } from '@/contexts/authContext'
import { toast } from 'sonner'
import { markPrefetched, isPrefetched } from '@/services/prefetch'
import { throttle } from '@/utils/performance'
import clsx from 'clsx'
import { TianjinImage } from './TianjinStyleComponents'
import useLanguage from '@/contexts/LanguageContext'
import { useTranslation } from 'react-i18next'

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
      { id: 'n1', title: '新消息', description: '您有一条新的私信', time: '刚刚', read: false, type: 'info', category: 'message', timestamp: now },
      { id: 'n2', title: '系统通知', description: '新功能已上线，快来体验', time: '1 小时前', read: false, type: 'success', category: 'system', timestamp: now - 3600000 },
      { id: 'n3', title: '作品点赞', description: '您的作品获得了新的点赞', time: '2 小时前', read: false, type: 'success', category: 'like', timestamp: now - 7200000 },
      { id: 'n4', title: '新成员加入', description: '张三加入了您的创作群', time: '30 分钟前', read: false, type: 'info', category: 'join', timestamp: now - 1800000 },
      { id: 'n5', title: '@提及通知', description: '王五在评论中@了您', time: '3 小时前', read: true, type: 'info', category: 'mention', timestamp: now - 10800000 },
      { id: 'n6', title: '任务完成', description: '您的创作任务已完成', time: '4 小时前', read: true, type: 'success', category: 'task', timestamp: now - 14400000 },
      { id: 'n7', title: '积分增加', description: '您获得了50积分奖励', time: '5 小时前', read: false, type: 'success', category: 'points', timestamp: now - 18000000 },
      { id: 'n8', title: '上传失败', description: '作品上传失败，请重试', time: '6 小时前', read: false, type: 'error', category: 'creation', timestamp: now - 21600000 },
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
      logoText: '坊',
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
            src={user.avatar}
            alt={user.username || '用户'}
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

  // 处理语音搜索
  const handleVoiceSearch = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('您的浏览器不支持语音搜索功能')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)

    recognition.onstart = () => {
      toast.info('正在倾听...')
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setSearch(transcript)
      setIsListening(false)
      toast.success(`识别结果: ${transcript}`)
    }

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      setIsListening(false)
      if (event.error !== 'no-speech') {
        toast.error('语音识别失败，请重试')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [])

  // 处理搜索
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) {
      toast.warning('请输入搜索关键词')
      return
    }
    const encodedSearch = encodeURIComponent(search.trim())
    navigate(`/explore?search=${encodedSearch}`)
    setSearch('')
    setShowSearch(false)
  }, [search, navigate])

  // 预取路由 - 使用防抖和空闲回调，避免阻塞点击事件
  const prefetchRoute = useCallback((path: string) => {
    // 仅预加载高频访问路由，减少预加载数量
    const highFrequencyRoutes = ['/', '/explore', '/tools', '/neo', '/wizard'];
    if (path === location.pathname || isPrefetched(path) || !highFrequencyRoutes.includes(path)) return
    
    // 只在浏览器空闲时进行预取，避免阻塞点击事件
    const idleCallback = (window as any).requestIdleCallback || ((fn: Function) => setTimeout(fn, 100))
    
    idleCallback(() => {
      markPrefetched(path)
    })
  }, [location.pathname])

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
          'sticky top-0 z-40 border-b py-1.5 px-3 transition-all duration-300 ease-in-out',
          isDark ? 'bg-gray-800/95 backdrop-blur-2xl border-gray-700 shadow-lg' : 
          theme === 'pink' ? 'bg-pink-100/95 backdrop-blur-2xl border-pink-200 shadow-lg' : 
          'bg-white/95 backdrop-blur-2xl border-gray-200 shadow-lg'
        )} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="relative flex items-center touch-none">
            <button
              onClick={() => setShowSearch(false)}
              className={clsx(
                'mr-3 p-2 rounded-full transition-all duration-300 hover:scale-110',
                isDark ? 'text-gray-300 hover:bg-gray-800' : 
                theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                'text-gray-700 hover:bg-gray-200'
              )}
              aria-label="关闭搜索"
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
                      aria-label="语音搜索"
                    >
                      <i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                    </button>
                  </div>
                </form>
          </div>
        </div>
      ) : (
        <div className={clsx(
          'sticky top-0 z-40 border-b py-1.5 px-3 transition-all duration-300 ease-in-out',
          isDark ? 'bg-gray-800/95 backdrop-blur-2xl border-gray-700 shadow-lg' : 
          theme === 'pink' ? 'bg-pink-100/95 backdrop-blur-2xl border-pink-200 shadow-lg' : 
          'bg-white/95 backdrop-blur-2xl border-gray-200 shadow-lg'
        )} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between touch-none">
            {/* Logo 和菜单按钮 - 左侧紧凑布局 */}
            <div className="flex items-center">
              {/* 菜单按钮 - 增强交互效果 */}
              <button
                onClick={() => setShowSidebarDrawer(true)}
                className={clsx(
                  'w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95 mr-2',
                  isDark ? 'text-gray-500 hover:bg-gray-700' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label="打开侧边栏"
              >
                <i className="fas fa-bars text-base"></i>
              </button>
              <NavLink
                to="/"
                onTouchStart={() => prefetchRoute('/')}
                className={clsx(
                  'flex items-center gap-1.5 transition-all duration-300 hover:scale-105 active:scale-95 group',
                  isDark ? 'text-white' : 
                  theme === 'pink' ? 'text-pink-900' : 
                  'text-gray-900'
                )}
              >
                <div className={clsx(
                  'w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 hover:scale-110 group-hover:shadow-xl',
                  `bg-gradient-to-br ${themeStyles.logoBackground}`,
                  'relative overflow-hidden'
                )}>
                  <span className="text-base font-extrabold z-10 transform transition-transform duration-300 group-hover:scale-125">{themeStyles.logoText}</span>
                  <div className={clsx(
                    'absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300',
                    `bg-gradient-to-tr from-white to-transparent`
                  )}></div>
                </div>
                <span className="ml-1 text-lg font-extrabold tracking-tight align-baseline bg-clip-text text-transparent bg-gradient-to-r"
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
            <div className="flex items-center space-x-1.5">
              {/* 搜索按钮 */}
              <button
                onClick={() => setShowSearch(true)}
                className={clsx(
                  'w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95',
                  isDark ? 'text-gray-500 hover:bg-gray-700' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label="搜索"
              >
                <i className="fas fa-search text-base"></i>
              </button>
              
              {/* 通知按钮 - 优化通知徽章 */}
              <button
                className={clsx(
                  'w-9 h-9 flex items-center justify-center rounded-full relative transition-all duration-300 hover:scale-110 active:scale-95',
                  isDark ? 'text-gray-500 hover:bg-gray-700' : 
                  theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                  'text-gray-700 hover:bg-gray-200'
                )}
                aria-label="通知"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="fas fa-bell text-base"></i>
                {unreadNotificationCount > 0 && (
                  <span className={clsx(
                    'absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-white text-[10px] font-bold transition-all duration-300 animate-bounce',
                    isDark ? 'bg-blue-500 shadow-lg' : 
                    theme === 'pink' ? 'bg-pink-500 shadow-lg' : 
                    'bg-orange-500 shadow-lg'
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
                  <div className={`relative w-full max-w-xs rounded-xl shadow-2xl ring-2 overflow-hidden pointer-events-auto ${isDark ? 'bg-gray-800 ring-gray-700' : theme === 'pink' ? 'bg-white ring-pink-300' : 'bg-white ring-gray-300'}`} role="dialog" aria-label="通知列表">
                    {/* 通知列表头部 */}
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between bg-gradient-to-r ${isDark ? 'from-gray-800 to-gray-900' : theme === 'pink' ? 'from-pink-50 to-white' : 'from-gray-50 to-white'}`}>
                      <h4 className="font-medium flex items-center">
                        <i className="fas fa-bell mr-2 text-blue-500"></i>
                        通知
                        <span className="ml-2 text-xs font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}">({unreadNotificationCount} 未读)</span>
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-300 ${isDark ? 'bg-gray-700 text-white hover:bg-blue-900/50 hover:text-blue-400' : 'bg-gray-100 text-gray-900 hover:bg-blue-50 hover:text-blue-700'}`}
                          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
                          <i className="fas fa-check-double mr-1"></i>
                          全部已读
                        </button>
                        <button
                          className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-300 ${isDark ? 'bg-gray-700 text-white hover:bg-red-900/50 hover:text-red-400' : 'bg-gray-100 text-gray-900 hover:bg-red-50 hover:text-red-700'}`}
                          onClick={() => setNotifications([])}>
                          <i className="fas fa-trash mr-1"></i>
                          清空
                        </button>
                        <button
                          className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-300 ${isDark ? 'bg-gray-700 text-white hover:bg-purple-900/50 hover:text-purple-400' : 'bg-gray-100 text-gray-900 hover:bg-purple-50 hover:text-purple-700'}`}
                          onClick={() => setShowSettings(!showSettings)}>
                          <i className="fas fa-cog mr-1"></i>
                          设置
                        </button>
                      </div>
                    </div>

                    {/* 通知设置面板 */}
                    {showSettings && (
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                        <h4 className="font-medium mb-3 flex items-center">
                          <i className="fas fa-sliders-h mr-2 text-purple-500"></i>
                          通知设置
                        </h4>
                        
                        {/* 基本设置 */}
                        <div className="space-y-4">
                          {/* 声音提醒 */}
                          <div className="flex items-center justify-between">
                            <label className="text-sm flex items-center">
                              <i className="fas fa-volume-up mr-2 text-gray-500"></i>
                              声音提醒
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={notificationSettings.enableSound} 
                                onChange={(e) => setNotificationSettings(prev => ({ ...prev, enableSound: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className={`w-11 h-6 rounded-full transition-all duration-300 peer ${notificationSettings.enableSound ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                              <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-5`}></span>
                            </label>
                          </div>
                          
                          {/* 桌面通知 */}
                          <div className="flex items-center justify-between">
                            <label className="text-sm flex items-center">
                              <i className="fas fa-desktop mr-2 text-gray-500"></i>
                              桌面通知
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={notificationSettings.enableDesktop} 
                                onChange={(e) => setNotificationSettings(prev => ({ ...prev, enableDesktop: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className={`w-11 h-6 rounded-full transition-all duration-300 peer ${notificationSettings.enableDesktop ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                              <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-5`}></span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 通知过滤标签 */}
                    <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-x-auto whitespace-nowrap`}>
                      <div className="flex space-x-2">
                        {[
                          { value: 'all', label: '全部', icon: 'fa-inbox' },
                          { value: 'unread', label: '未读', icon: 'fa-envelope-open-text' },
                          { value: 'like', label: '点赞', icon: 'fa-heart' },
                          { value: 'message', label: '私信', icon: 'fa-envelope' },
                          { value: 'mention', label: '@提及', icon: 'fa-at' },
                          { value: 'task', label: '任务', icon: 'fa-tasks' },
                          { value: 'points', label: '积分', icon: 'fa-coins' },
                        ].map(filter => (
                          <button
                            key={filter.value}
                            onClick={() => setNotificationFilter(filter.value as any)}
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center transition-all duration-300 ${notificationFilter === filter.value ? 
                              (isDark ? 'bg-blue-900/50 text-blue-400 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-300') : 
                              (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}
                          >
                            <i className={`fas ${filter.icon} mr-1.5 text-xs`}></i>
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 通知列表内容 */}
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredNotifications.length === 0 ? (
                        <div className="p-4 text-center">
                          <i className="fas fa-bell-slash text-3xl text-gray-400 mb-2"></i>
                          <p className="text-sm text-gray-500">暂无通知</p>
                          <p className="text-xs text-gray-400 mt-1">当有新通知时，会在这里显示</p>
                        </div>
                      ) : (
                        filteredNotifications.map((notification) => (
                          <div key={notification.id} className={`p-4 border-b last:border-b-0 transition-all duration-200 hover:bg-opacity-90 ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'} ${!notification.read ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : ''}`}>
                            <div className="flex items-start gap-3">
                              {/* 通知图标 - 根据分类显示不同图标 */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
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
                                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{notification.time}</span>
                                </div>
                                <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'} mt-1 line-clamp-2`}>{notification.description}</p>
                                {/* 通知分类标签 */}
                                <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                  {notification.category === 'like' && '点赞'}
                                  {notification.category === 'join' && '新成员'}
                                  {notification.category === 'message' && '私信'}
                                  {notification.category === 'mention' && '@提及'}
                                  {notification.category === 'task' && '任务'}
                                  {notification.category === 'points' && '积分'}
                                  {notification.category === 'system' && '系统'}
                                  {notification.category === 'learning' && '学习'}
                                  {notification.category === 'creation' && '创作'}
                                  {notification.category === 'social' && '社交'}
                                </span>
                              </div>
                              {/* 未读指示器 */}
                              {!notification.read && (
                                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'} mt-1.5 animate-ping`}></span>
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
                <div className="relative group">
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
                      onTouchStart={() => prefetchRoute('/dashboard')}
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
                      数据分析
                    </NavLink>
                    <NavLink
                      to="/drafts"
                      onTouchStart={() => prefetchRoute('/drafts')}
                      className={clsx(
                        'block px-4 py-3 text-sm transition-all duration-200 hover:translate-x-1',
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 
                        theme === 'pink' ? 'text-pink-900 hover:bg-pink-200' : 
                        'text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <i className="fas fa-file-alt mr-3"></i>
                      草稿箱
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
                      我的收藏
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
                      onTouchStart={() => prefetchRoute('/membership')}
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
                      onTouchStart={() => prefetchRoute('/create')}
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
                          toast.success('退出登录成功')
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
          'absolute left-0 top-0 bottom-0 w-[85.71%] overflow-y-auto transform transition-transform duration-300 ease-in-out',
          showSidebarDrawer ? 'translate-x-0' : '-translate-x-full',
          isDark ? 'bg-[#0b0e13] text-white' : 
          theme === 'pink' ? 'bg-pink-50 text-pink-900' : 
          'bg-white text-gray-900',
          'z-50 shadow-2xl'
        )} style={{ width: '85.71%' }}>
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
              <span className="ml-2 text-lg font-bold">津脉智坊</span>
            </div>
            <button
              onClick={() => setShowSidebarDrawer(false)}
              className={clsx(
                'p-2 rounded-full transition-colors duration-200',
                isDark ? 'text-gray-300 hover:bg-gray-800' : 
                theme === 'pink' ? 'text-pink-700 hover:bg-pink-200' : 
                'text-gray-700 hover:bg-gray-200'
              )}
              aria-label="关闭侧边栏"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
          
          {/* 主题切换快捷入口 */}
          <div className={clsx('p-3 rounded-lg transition-all duration-300', isDark ? 'bg-gray-800' : theme === 'pink' ? 'bg-pink-100' : 'bg-gray-100')}>
            <h3 className={clsx('text-xs font-semibold mb-2 uppercase tracking-wider', isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-700' : 'text-gray-600')}>{t('header.toggleTheme')}</h3>
            <div className="grid grid-cols-4 gap-2">
              {availableThemes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    toast.success(`已切换到${themeOption.label}主题`);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${theme === themeOption.value ? (isDark ? 'bg-blue-600 text-white' : theme === 'pink' ? 'bg-pink-500 text-white' : 'bg-orange-500 text-white') : (isDark ? 'bg-gray-700 hover:bg-gray-600' : theme === 'pink' ? 'bg-pink-200 hover:bg-pink-300' : 'bg-gray-200 hover:bg-gray-300')}`}
                  title={themeOption.label}
                >
                  <i className={`${themeOption.icon} text-lg mb-1`}></i>
                  <span className="text-xs">{themeOption.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 语言切换快捷入口 */}
          <div className={clsx('p-3 rounded-lg transition-all duration-300', isDark ? 'bg-gray-800' : theme === 'pink' ? 'bg-pink-100' : 'bg-gray-100')}>
            <h3 className={clsx('text-xs font-semibold mb-2 uppercase tracking-wider', isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-700' : 'text-gray-600')}>{t('common.language')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    changeLanguage(lang.code);
                    toast.success(`已切换到${lang.name}`);
                  }}
                  className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${currentLanguage === lang.code ? (isDark ? 'bg-blue-600 text-white' : theme === 'pink' ? 'bg-pink-500 text-white' : 'bg-orange-500 text-white') : (isDark ? 'bg-gray-700 hover:bg-gray-600' : theme === 'pink' ? 'bg-pink-200 hover:bg-pink-300' : 'bg-gray-200 hover:bg-gray-300')}`}
                  title={lang.name}
                >
                  <span className="text-xs">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 导航菜单 */}
          <nav className="p-3 space-y-4">
            {/* 常用功能 */}
            <div>
              <h3 className={clsx('text-xs font-semibold mb-2 uppercase tracking-wider', isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-700' : 'text-gray-600')}>{t('sidebar.commonFunctions')}</h3>
              <div className="grid grid-cols-3 gap-2">
                <NavLink to="/" title="首页" onTouchStart={() => prefetchRoute('/')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-home text-lg mb-1"></i>
                  <span className="text-xs">{t('common.home')}</span>
                </NavLink>
                <NavLink to="/explore" title="探索作品" onTouchStart={() => prefetchRoute('/explore')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-compass text-lg mb-1"></i>
                  <span className="text-xs">{t('common.explore')}</span>
                </NavLink>
                <NavLink to="/particle-art" title="粒子艺术" onTouchStart={() => prefetchRoute('/particle-art')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-palette text-lg mb-1"></i>
                  <span className="text-xs">{t('common.particleArt')}</span>
                </NavLink>
                <NavLink to="/create" title="创作中心" onTouchStart={() => prefetchRoute('/create')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-tools text-lg mb-1"></i>
                  <span className="text-xs">{t('common.create')}</span>
                </NavLink>
                <NavLink to="/neo" title="灵感引擎" onTouchStart={() => prefetchRoute('/neo')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-bolt text-lg mb-1"></i>
                  <span className="text-xs">{t('common.neo')}</span>
                </NavLink>
              </div>
            </div>

            {/* 共创功能 */}
            <div>
              <h3 className={clsx('text-sm font-semibold mb-3 uppercase tracking-wider', isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-700' : 'text-gray-600')}>{t('sidebar.coCreation')}</h3>
              <div className="grid grid-cols-3 gap-3">
                <NavLink to="/wizard" title="共创向导" onTouchStart={() => prefetchRoute('/wizard')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-hat-wizard text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.coCreationGuide')}</span>
                </NavLink>
                <NavLink to="/square" title="共创广场" onTouchStart={() => prefetchRoute('/square')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-th-large text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.coCreationSquare')}</span>
                </NavLink>
                <NavLink to="/community?context=cocreation&tab=joined" title="共创社群" onTouchStart={() => prefetchRoute('/community')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-user-friends text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.coCreationCommunity')}</span>
                </NavLink>
                <NavLink to="/community?context=creator" title="创作者社区" onTouchStart={() => prefetchRoute('/community')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-users text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.creatorCommunity')}</span>
                </NavLink>
              </div>
            </div>

            {/* 天津特色 */}
            <div>
              <h3 className={clsx('text-sm font-semibold mb-3 uppercase tracking-wider', isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-700' : 'text-gray-600')}>{t('sidebar.tianjinFeatures')}</h3>
              <div className="grid grid-cols-3 gap-3">
                <NavLink to="/tianjin" end title="天津特色专区" onTouchStart={() => prefetchRoute('/tianjin')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-landmark text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.tianjinSpecialZone')}</span>
                </NavLink>
                <NavLink to="/tianjin/map" title="天津地图" onTouchStart={() => prefetchRoute('/tianjin/map')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-map-marked-alt text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.tianjinMap')}</span>
                </NavLink>
                <NavLink to="/events" title="文化活动" onTouchStart={() => prefetchRoute('/events')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-calendar-alt text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.culturalActivities')}</span>
                </NavLink>
              </div>
            </div>

            {/* 更多服务 */}
            <div>
              <h3 className={clsx('text-sm font-semibold mb-3 uppercase tracking-wider', isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-700' : 'text-gray-600')}>{t('sidebar.moreServices')}</h3>
              <div className="grid grid-cols-3 gap-3">
                <NavLink to="/leaderboard" title="人气榜" onTouchStart={() => prefetchRoute('/leaderboard')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-chart-line text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.popularityRanking')}</span>
                </NavLink>
                <NavLink to="/games" title="趣味游戏" onTouchStart={() => prefetchRoute('/games')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-gamepad text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.funGames')}</span>
                </NavLink>
                <NavLink to="/knowledge" title="文化知识库" onTouchStart={() => prefetchRoute('/knowledge')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-book text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.culturalKnowledge')}</span>
                </NavLink>
                <NavLink to="/lab" title="新窗口实验室" onTouchStart={() => prefetchRoute('/lab')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-window-restore text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.newWindowLab')}</span>
                </NavLink>
                <NavLink to="/points-mall" title="积分商城" onTouchStart={() => prefetchRoute('/points-mall')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-gift text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.pointsMall')}</span>
                </NavLink>
                <NavLink to="/business" title="商业合作" onTouchStart={() => prefetchRoute('/business')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-handshake text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.businessCooperation')}</span>
                </NavLink>
                <NavLink to="/developers" title="开发者" onTouchStart={() => prefetchRoute('/developers')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-code text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.developers')}</span>
                </NavLink>
                <NavLink to="/membership" title="会员中心" onTouchStart={() => prefetchRoute('/membership')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-crown text-xl mb-1"></i>
                  <span className="text-xs">{t('header.membershipCenter')}</span>
                </NavLink>
                <NavLink to="/about" title="关于我们" onTouchStart={() => prefetchRoute('/about')} className={({ isActive }) => `${isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-900' : 'text-gray-900'} flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 ${isActive ? (isDark ? 'bg-gray-800 text-white' : theme === 'pink' ? 'bg-pink-100 font-semibold' : 'bg-gray-100 font-semibold') : (isDark ? 'hover:bg-gray-800' : theme === 'pink' ? 'hover:bg-pink-100' : 'hover:bg-gray-100')}`} onClick={() => setShowSidebarDrawer(false)}>
                  <i className="fas fa-info-circle text-xl mb-1"></i>
                  <span className="text-xs">{t('sidebar.aboutUs')}</span>
                </NavLink>
              </div>
            </div>
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
        isDark ? 'bg-gray-900/95 backdrop-blur-xl ring-1 ring-gray-800/70 py-2 shadow-xl' : 
        theme === 'pink' ? 'bg-gradient-to-t from-white/98 to-white/80 backdrop-blur-2xl ring-1 ring-pink-300/80 py-2 shadow-[0_-2px_20px_rgba(236,72,153,0.15),0_0_30px_rgba(236,72,153,0.1)]' : 
        'bg-white/95 backdrop-blur-xl ring-1 ring-gray-200/70 py-2 shadow-2xl'
      )} style={{ paddingBottom: 'env(safe-area-inset-bottom)', transform: showMobileNav ? 'translateY(0)' : 'translateY(100%)' }}>
        <ul className={clsx(
          'grid grid-cols-5',
          isDark ? 'text-xs px-1 py-1' : 'text-xs px-1 py-1'
        )}>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/" 
              onTouchStart={() => prefetchRoute('/')}
              aria-label="首页"
              className="flex-1"
              end
            >
              {({ isActive }) => {
                const baseClass = clsx(
                  'flex flex-col items-center justify-center transition-all duration-300 ease-in-out relative group transform-gpu',
                  isDark ? 'py-0' : 'py-0.5'
                );
                const iconColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-700' : 'text-gray-900') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-400' : 'text-gray-600');
                const textColor = isActive ? (isDark ? 'text-white font-semibold' : theme === 'pink' ? 'text-pink-800 font-bold' : 'text-gray-900 font-semibold') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-500' : 'text-gray-600');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-400 via-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125 active:scale-95')}>
                      <i className={clsx("fas fa-home transition-all duration-300", isDark ? "text-sm" : "text-lg")} style={{ color: iconColor, textShadow: isActive && theme === 'pink' ? '0 0 10px rgba(236, 72, 153, 0.3)' : 'none' }}></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`, theme === 'pink' ? 'shadow-md shadow-pink-300/50' : '')}></span>
                          <div className={clsx('absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500/70' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-[-2px] font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)} style={{ color: textColor, textShadow: isActive && theme === 'pink' ? '0 0 6px rgba(236, 72, 153, 0.2)' : 'none', writingMode: 'horizontal-tb', textOrientation: 'initial' }}>{t('common.home')}</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/explore"
              onTouchStart={() => prefetchRoute('/explore')}
              aria-label="探索"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = clsx(
                  'flex flex-col items-center justify-center transition-all duration-300 ease-in-out relative group transform-gpu',
                  isDark ? 'py-0' : 'py-0.5'
                );
                const iconColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-700' : 'text-gray-900') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-400' : 'text-gray-600');
                const textColor = isActive ? (isDark ? 'text-white font-semibold' : theme === 'pink' ? 'text-pink-800 font-bold' : 'text-gray-900 font-semibold') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-500' : 'text-gray-600');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-400 via-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125 active:scale-95')}>
                      <i className={clsx("fas fa-compass transition-all duration-300", isDark ? "text-sm" : "text-lg")} style={{ color: iconColor, textShadow: isActive && theme === 'pink' ? '0 0 10px rgba(236, 72, 153, 0.3)' : 'none' }}></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`, theme === 'pink' ? 'shadow-md shadow-pink-300/50' : '')}></span>
                          <div className={clsx('absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500/70' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-[-2px] font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)} style={{ color: textColor, textShadow: isActive && theme === 'pink' ? '0 0 6px rgba(236, 72, 153, 0.2)' : 'none', writingMode: 'horizontal-tb', textOrientation: 'initial' }}>{t('common.explore')}</span>
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
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = clsx(
                  'flex flex-col items-center justify-center transition-all duration-300 ease-in-out relative group transform-gpu',
                  isDark ? 'py-0' : 'py-0.5'
                );
                const iconClass = isActive ? 'scale-130 text-opacity-100' : 'scale-120 text-opacity-100';
                const textClass = isActive ? 'font-bold opacity-100 scale-105' : 'font-bold opacity-100 scale-100';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-400 via-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                const bgColor = isDark ? 'bg-blue-600' : theme === 'pink' ? 'bg-gradient-to-br from-pink-500 to-rose-500' : 'bg-orange-600';
                const hoverBgColor = isDark ? 'hover:bg-blue-700' : theme === 'pink' ? 'hover:bg-gradient-to-br from-pink-600 to-rose-600' : 'hover:bg-orange-700';
                const pulseColor = isDark ? 'bg-blue-500/30' : theme === 'pink' ? 'bg-pink-400/40' : 'bg-orange-500/30';
                const glowColor = isDark ? 'bg-blue-600/20' : theme === 'pink' ? 'bg-pink-500/30' : 'bg-orange-600/20';
                
                return (
                  <div className={clsx(baseClass)}>
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
                        isDark ? 'w-8 h-8 -mt-1' : 'w-10 h-10',
                        `${bgColor} ${hoverBgColor}`,
                        theme === 'pink' ? 'shadow-xl shadow-pink-300/50 ring-2 ring-pink-400/30' : 'shadow-lg'
                      )}>
                        <i className={clsx("fas fa-plus font-bold text-white transition-all duration-300", isDark ? "text-sm" : "text-lg")} style={{ textShadow: theme === 'pink' ? '0 0 15px rgba(255, 255, 255, 0.5)' : 'none' }}></i>
                      </div>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-[-2px] font-bold transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)} style={{ color: isDark ? 'text-white' : theme === 'pink' ? 'text-pink-800' : 'text-gray-900', textShadow: isActive && theme === 'pink' ? '0 0 6px rgba(236, 72, 153, 0.2)' : 'none', writingMode: 'horizontal-tb', textOrientation: 'initial' }}>{t('common.create')}</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/community?context=cocreation&tab=joined"
              onTouchStart={() => prefetchRoute('/community')}
              aria-label="社群"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = clsx(
                  'flex flex-col items-center justify-center transition-all duration-300 ease-in-out relative group transform-gpu',
                  isDark ? 'py-0' : 'py-0.5'
                );
                const iconColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-700' : 'text-gray-900') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-400' : 'text-gray-600');
                const textColor = isActive ? (isDark ? 'text-white font-semibold' : theme === 'pink' ? 'text-pink-800 font-bold' : 'text-gray-900 font-semibold') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-500' : 'text-gray-600');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125 active:scale-95')}>
                      <i className={clsx("fas fa-comments transition-all duration-300", isDark ? "text-sm" : "text-lg")} style={{ color: iconColor, textShadow: isActive && theme === 'pink' ? '0 0 10px rgba(236, 72, 153, 0.3)' : 'none' }}></i>
                      {/* 未读消息指示器 */}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold z-10">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-[-2px] font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)} style={{ color: textColor, textShadow: isActive && theme === 'pink' ? '0 0 6px rgba(236, 72, 153, 0.2)' : 'none', writingMode: 'horizontal-tb', textOrientation: 'initial' }}>{t('common.community')}</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/tianjin"
              onTouchStart={() => prefetchRoute('/tianjin')}
              aria-label="天津特色专区"
              className="flex-1"
            >
              {({ isActive }) => {
                const baseClass = clsx(
                  'flex flex-col items-center justify-center transition-all duration-300 ease-in-out relative group transform-gpu',
                  isDark ? 'py-0' : 'py-0.5'
                );
                const iconColor = isActive ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-700' : 'text-gray-900') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-400' : 'text-gray-600');
                const textColor = isActive ? (isDark ? 'text-white font-semibold' : theme === 'pink' ? 'text-pink-900 font-semibold' : 'text-gray-900 font-semibold') : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-gray-500' : 'text-gray-600');
                const iconClass = isActive ? 'scale-125 text-opacity-100' : 'scale-100 text-opacity-70';
                const textClass = isActive ? 'font-semibold opacity-100 scale-105' : 'opacity-60 scale-95';
                const gradientClass = isDark ? 'from-blue-400 to-purple-500' : theme === 'pink' ? 'from-pink-500 to-rose-500' : 'from-red-500 to-orange-500';
                
                return (
                  <div className={clsx(baseClass)}>
                    <div className={clsx('relative transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1) transform', iconClass, 'group-hover:scale-125 active:scale-95')}>
                      <i className={clsx("fas fa-landmark transition-all duration-300", isDark ? "text-sm" : "text-lg")} style={{ color: iconColor, textShadow: isActive && theme === 'pink' ? '0 0 10px rgba(236, 72, 153, 0.3)' : 'none' }}></i>
                      {isActive && (
                        <>
                          <span className={clsx('absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-full h-0.5 rounded-full', `bg-gradient-to-r ${gradientClass}`)}></span>
                          <div className={clsx('absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full animate-ping', 
                            isDark ? 'bg-blue-400' : theme === 'pink' ? 'bg-pink-500' : 'bg-orange-500')}></div>
                        </>
                      )}
                    </div>
                    <span className={clsx('mt-[-2px] font-medium transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)', textClass)} style={{ color: textColor, textShadow: isActive && theme === 'pink' ? '0 0 6px rgba(236, 72, 153, 0.2)' : 'none', writingMode: 'horizontal-tb', textOrientation: 'initial' }}>天津特色专区</span>
                  </div>
                );
              }}
            </NavLink>
          </li>
        </ul>
      </nav>
      
      {/* PWA状态指示器 - 暂时隐藏 */}
      {/* <PWAStatusIndicator position="bottom-right" /> */}
      
      {/* PWA安装按钮 */}
      <div className="fixed bottom-20 right-4 z-40">
        <PWAInstallButton 
          hideFixedButton={false}
          forceShow={true}
        />
      </div>
    </div>
    )
  })

export default MobileLayout;