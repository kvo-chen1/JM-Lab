import { useState, useContext, useEffect, useMemo, useCallback, memo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { AuthContext } from '@/contexts/authContext'
import { toast } from 'sonner'
import { markPrefetched, isPrefetched } from '@/services/prefetch'
import { componentPreloader } from '@/utils/performanceOptimization.tsx'
import { throttle } from '@/utils/performance'
import clsx from 'clsx'
import { TianjinImage } from './TianjinStyleComponents'
import useLanguage from '@/contexts/LanguageContext'
import { useTranslation } from 'react-i18next'
import { navigationGroups, bottomNavItems } from '@/config/navigationConfig'
import { navItemIdToTranslationKey, navGroupIdToTranslationKey } from '@/utils/navigationUtils'
import {
  ANIMATION_VARIANTS,
  INTERACTION_VARIANTS,
  getResponsiveDuration,
  getResponsiveDelay
} from '@/config/animationConfig'
import {
  useScreenReader,
  createAriaAttributes,
  useHighContrast,
  useReducedMotion
} from '@/utils/accessibility'

import PWAInstallButton from './PWAInstallButton'

// 响应式动画速度控制
const useResponsiveAnimation = () => {
  const [isMobile, setIsMobile] = useState(true);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 根据设备类型返回动画持续时间
  const getDuration = (defaultDuration: number) => {
    return getResponsiveDuration(defaultDuration, isMobile, isTablet);
  };

  // 根据设备类型返回动画延迟时间
  const getDelay = (defaultDelay: number) => {
    return getResponsiveDelay(defaultDelay, isMobile, isTablet);
  };

  return { isMobile, isTablet, getDuration, getDelay };
};

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
  const { getDuration, getDelay } = useResponsiveAnimation()
  
  // 无障碍功能
  const { announce } = useScreenReader()
  const { isHighContrast, highContrastClasses } = useHighContrast()
  const { prefersReducedMotion, motionSafeClasses } = useReducedMotion()
  
  const [showMobileNav, setShowMobileNav] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false)
  const [showNavbar, setShowNavbar] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
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
  const [notifications, setNotifications] = useState<Notification[]>([])

  // 未读通知数量
  const unreadNotificationCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  
  // 监听用户变化，根据用户类型加载通知数据
  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    // 无论用户类型，都使用模拟数据，避免API调用失败导致页面加载问题
    const now = Date.now()
    setNotifications([
      { id: 'n1', title: t('notification.newMessage'), description: t('notification.newMessageDesc'), time: t('notification.justNow'), read: false, type: 'info', category: 'message', timestamp: now },
      { id: 'n2', title: t('notification.systemNotification'), description: t('notification.systemNotificationDesc'), time: `1 ${t('notification.hoursAgo')}`, read: false, type: 'success', category: 'system', timestamp: now - 3600000 },
      { id: 'n3', title: t('notification.workLiked'), description: t('notification.workLikedNewDesc'), time: `2 ${t('notification.hoursAgo')}`, read: false, type: 'success', category: 'like', timestamp: now - 7200000 },
      { id: 'n4', title: t('notification.newMember'), description: t('notification.newMemberDesc'), time: `30 ${t('notification.minutesAgo')}`, read: false, type: 'info', category: 'join', timestamp: now - 1800000 },
      { id: 'n5', title: t('notification.mention'), description: t('notification.mentionDesc'), time: `3 ${t('notification.hoursAgo')}`, read: true, type: 'info', category: 'mention', timestamp: now - 10800000 },
      { id: 'n6', title: t('notification.taskCompleted'), description: t('notification.taskCompletedDesc'), time: `4 ${t('notification.hoursAgo')}`, read: true, type: 'success', category: 'task', timestamp: now - 14400000 },
      { id: 'n7', title: t('notification.pointsAdded'), description: t('notification.pointsAddedDesc'), time: `5 ${t('notification.hoursAgo')}`, read: false, type: 'success', category: 'points', timestamp: now - 18000000 },
      { id: 'n8', title: t('notification.uploadFailed'), description: t('notification.uploadFailedDesc'), time: `6 ${t('notification.hoursAgo')}`, read: false, type: 'error', category: 'creation', timestamp: now - 21600000 },
    ])
  }, [user, t]);

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

  /* 移除本地存储同步
  // 保存通知到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error)
    }
  }, [notifications])
  */

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
        'w-8 h-8 min-w-[32px] min-h-[32px] aspect-square flex-shrink-0 rounded-full overflow-hidden border-2 shadow-md transition-all duration-300 hover:ring-2 relative',
        isDark ? 'border-gray-700 hover:ring-blue-500' : 
        theme === 'pink' ? 'border-pink-300 hover:ring-pink-500' : 
        'border-gray-300 hover:ring-orange-500'
      )}>
        {showImage ? (
          <img
            key={user?.avatar} // 添加 key 确保 URL 变化时重新渲染 img 标签
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
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 100)
      // 计算滚动进度
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const progress = scrollHeight > 0 ? (currentScrollY / scrollHeight) * 100 : 0
      setScrollProgress(progress)
      
      // 导航栏滚动隐藏/显示逻辑
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // 向下滚动且超过100px，隐藏导航栏
        setShowNavbar(false)
      } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
        // 向上滚动或在顶部，显示导航栏
        setShowNavbar(true)
      }
      setLastScrollY(currentScrollY)
    }, 100), // 100ms 内最多执行一次
    [lastScrollY]
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
    navigate(`/search?query=${encodedSearch}`)
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
      themeStyles.background,
      highContrastClasses,
      motionSafeClasses
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
          'fixed top-0 left-0 right-0 z-60 border-b py-2 px-3 transition-all duration-300 ease-in-out',
          isDark ? 'bg-gray-900/98 backdrop-blur-xl border-gray-800 shadow-xl' : 
          theme === 'pink' ? 'bg-pink-50/98 backdrop-blur-xl border-pink-200 shadow-xl' : 
          'bg-white/98 backdrop-blur-xl border-gray-200 shadow-xl'
        )} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="relative flex items-center">
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
                        isDark ? 'bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500/50' : 
                        theme === 'pink' ? 'bg-white text-pink-900 placeholder-pink-700 focus:ring-pink-500/50' : 
                        'bg-white text-gray-900 placeholder-gray-700 focus:ring-orange-500/50'
                      )}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
                      <i className={clsx(
                        'fas fa-search',
                        isDark ? 'text-gray-600' : 
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
      ) : (location.pathname !== '/' && !location.pathname.match(/^\/(square|post|work)\/[^/]+$/) && !location.pathname.startsWith('/mobile-work-detail')) && (
        <div className={clsx(
          'sticky top-0 z-60 transition-all duration-300 ease-in-out py-1.5 px-2',
          isDark ? 'bg-gray-800/95 backdrop-blur-2xl border-b border-gray-700 shadow-lg' : 
          theme === 'pink' ? 'bg-pink-100/95 backdrop-blur-2xl border-b border-pink-200 shadow-lg' : 
          'bg-white/95 backdrop-blur-2xl border-b border-gray-200 shadow-lg'
        )} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between">
            {/* Logo - 左侧 */}
            <div className="flex items-center flex-1 min-w-0 mr-0.5">
              <NavLink
                to="/"
                onTouchStart={() => prefetchRoute('home')}
                className={clsx(
                  'hidden sm:flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 group min-w-0',
                  isDark ? 'text-white' : 
                  theme === 'pink' ? 'text-pink-900' : 
                  'text-gray-900'
                )}
              >
                <div className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-lg transition-all duration-300 hover:scale-105 group-hover:shadow-xl flex-shrink-0',
                  `bg-gradient-to-br ${themeStyles.gradient}`,
                  'relative overflow-hidden ring-2 ring-white/30'
                )}>
                  <span className="text-sm font-extrabold z-10 transform transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">{themeStyles.logoText}</span>
                  {/* 顶部高光 */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
                  {/* 底部反光 */}
                  <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-black/20 to-transparent"></div>
                </div>
                <span className="text-sm font-bold tracking-tight align-baseline bg-clip-text text-transparent bg-gradient-to-r truncate max-w-[120px] xs:max-w-none"
                  style={{ 
                    backgroundImage: isDark ? 'linear-gradient(to right, #60a5fa, #a78bfa)' : 
                                     theme === 'pink' ? 'linear-gradient(to right, #ec4899, #f472b6)' : 
                                     'linear-gradient(to right, #f97316, #fb923c)',
                    backgroundSize: '200% 200%',
                    transition: 'background-position 0.3s ease'
                  }} onMouseEnter={(e) => e.currentTarget.style.backgroundPosition = '100% 0'} onMouseLeave={(e) => e.currentTarget.style.backgroundPosition = '0 0'}>
                  {t('common.appName')}
                </span>
              </NavLink>
            </div>
            

          </div>
        </div>
      )}
      
      {/* 侧边栏抽屉 - z-index 设为 100 以覆盖所有内容 */}
      <div className={`fixed inset-0 z-[100] transform transition-all duration-300 ease-in-out ${showSidebarDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* 遮罩层 */}
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowSidebarDrawer(false)}
        />
        {/* 抽屉内容 - 从屏幕最顶部开始 (top-0) */}
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
            <div className="flex items-center gap-2">
              <div className={clsx(
                'w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-md',
                `bg-gradient-to-br ${themeStyles.gradient}`,
                'relative overflow-hidden ring-1 ring-white/20'
              )}>
                <span className="text-sm font-extrabold z-10 drop-shadow-sm">{themeStyles.logoText}</span>
                {/* 顶部高光 */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"></div>
                {/* 底部反光 */}
                <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-black/10 to-transparent"></div>
              </div>
              {/* 应用名称多语言显示 */}
              <span className="text-lg font-bold">{t('common.appName')}</span>
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
                    {t(navGroupIdToTranslationKey[group.id] || group.title)}
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
                          <span className="flex-1 transition-all duration-200 text-sm">{t(navItemIdToTranslationKey[item.id] || item.label)}</span>
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

            {/* 用户菜单分组 - 已登录状态 */}
            {isAuthenticated && (
              <div className="rounded-lg overflow-hidden">
                <button
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2.5 transition-all duration-200',
                    'min-h-[44px]',
                    isDark ? 'bg-gray-800/50 hover:bg-gray-800' :
                    theme === 'pink' ? 'bg-pink-50 hover:bg-pink-100' :
                    'bg-gray-50 hover:bg-gray-100'
                  )}
                  onClick={() => setExpandedGroup(expandedGroup === 'user' ? null : 'user')}
                >
                  <h3 className={clsx('text-sm font-semibold uppercase tracking-wider flex items-center',
                    isDark ? 'text-gray-300' : theme === 'pink' ? 'text-pink-700' : 'text-gray-600')}>
                    <i className={`fas fa-chevron-down mr-1.5 text-xs transition-transform duration-300 ${expandedGroup === 'user' ? 'transform rotate-180' : ''}`}></i>
                    {user?.username || t('header.profile')}
                  </h3>
                  <span className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    isDark ? 'bg-gray-700 text-gray-300' :
                    theme === 'pink' ? 'bg-pink-200 text-pink-800' :
                    'bg-gray-200 text-gray-700'
                  )}>
                    8
                  </span>
                </button>

                {expandedGroup === 'user' && (
                  <div className="overflow-hidden transition-all duration-300 ease-in-out">
                    <div className="space-y-1 p-1.5">
                      <NavLink
                        to="/dashboard"
                        onTouchStart={() => prefetchRoute('dashboard')}
                        className={({ isActive }) => clsx(
                          'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px]',
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
                        <i className="fas fa-user mr-2.5 text-base"></i>
                        <span className="flex-1 text-sm">{t('header.profile')}</span>
                      </NavLink>
                      <NavLink
                        to="/analytics"
                        onTouchStart={() => prefetchRoute('/analytics')}
                        className={({ isActive }) => clsx(
                          'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px]',
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
                        <i className="fas fa-chart-bar mr-2.5 text-base"></i>
                        <span className="flex-1 text-sm">{t('header.analytics')}</span>
                      </NavLink>
                      <NavLink
                        to="/drafts"
                        onTouchStart={() => prefetchRoute('drafts')}
                        className={({ isActive }) => clsx(
                          'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px]',
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
                        <i className="fas fa-file-alt mr-2.5 text-base"></i>
                        <span className="flex-1 text-sm">{t('common.drafts')}</span>
                      </NavLink>
                      <NavLink
                        to="/collections"
                        onTouchStart={() => prefetchRoute('/collections')}
                        className={({ isActive }) => clsx(
                          'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px]',
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
                        <i className="fas fa-heart mr-2.5 text-base"></i>
                        <span className="flex-1 text-sm">{t('header.myCollection')}</span>
                      </NavLink>
                      <NavLink
                        to="/membership"
                        onTouchStart={() => prefetchRoute('membership')}
                        className={({ isActive }) => clsx(
                          'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px]',
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
                        <i className="fas fa-crown mr-2.5 text-base"></i>
                        <span className="flex-1 text-sm">{t('header.membershipCenter')}</span>
                      </NavLink>
                      <NavLink
                        to="/settings"
                        onTouchStart={() => prefetchRoute('/settings')}
                        className={({ isActive }) => clsx(
                          'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px]',
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
                        <i className="fas fa-cog mr-2.5 text-base"></i>
                        <span className="flex-1 text-sm">{t('header.settings')}</span>
                      </NavLink>
                      <button
                        onClick={() => {
                          setShowSidebarDrawer(false);
                          window.location.href = '/landing.html';
                        }}
                        className={clsx(
                          'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px] w-full text-left',
                          isDark ? 'text-gray-300 hover:bg-gray-800' :
                          theme === 'pink' ? 'text-pink-900 hover:bg-pink-50' :
                          'text-gray-900 hover:bg-gray-50'
                        )}
                      >
                        <i className="fas fa-home mr-2.5 text-base"></i>
                        <span className="flex-1 text-sm">{t('header.backToOfficialWebsite')}</span>
                      </button>
                      <div className={clsx(
                        'border-t my-1',
                        isDark ? 'border-gray-700' :
                        theme === 'pink' ? 'border-pink-200' :
                        'border-gray-200'
                      )}></div>
                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                          setShowSidebarDrawer(false);
                          toast.success(t('toast.logoutSuccess'));
                        }}
                        className={clsx(
                          'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px] w-full text-left',
                          isDark ? 'text-red-400 hover:bg-gray-800' :
                          theme === 'pink' ? 'text-red-700 hover:bg-pink-50' :
                          'text-red-700 hover:bg-gray-50'
                        )}
                      >
                        <i className="fas fa-sign-out-alt mr-2.5 text-base"></i>
                        <span className="flex-1 text-sm">{t('header.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 未登录状态 - 显示登录入口 */}
            {!isAuthenticated && (
              <NavLink
                to="/login"
                onTouchStart={() => prefetchRoute('/login')}
                className={({ isActive }) => clsx(
                  'flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px]',
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
                <i className="fas fa-sign-in-alt mr-2.5 text-base"></i>
                <span className="flex-1 text-sm">{t('header.login')}</span>
              </NavLink>
            )}
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
      
      {/* 底部导航栏 - 移动端专属 */}
      <nav 
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-40 border-t px-2 py-1 md:hidden',
          isDark ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800 shadow-lg' : 
          theme === 'pink' ? 'bg-pink-100/95 backdrop-blur-xl border-pink-200 shadow-lg' : 
          'bg-white/95 backdrop-blur-xl border-gray-200 shadow-lg'
        )} 
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-end justify-around">
          {bottomNavItems.map((item) => {
            const isAIAssistantButton = item.id === 'ai-assistant';
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onTouchStart={() => prefetchRoute(item.id)}
                className={({ isActive }) => clsx(
                  'flex flex-col items-center justify-end px-1 py-1 flex-1 group',
                  isActive
                    ? (isDark ? 'text-white' : theme === 'pink' ? 'text-pink-600' : 'text-red-600')
                    : (isDark ? 'text-gray-400' : theme === 'pink' ? 'text-pink-700' : 'text-gray-700')
                )}
                end={item.path === '/'}
                aria-label={item.label}
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={clsx(
                        'w-7 h-7 flex items-center justify-center rounded-full relative',
                        isActive && (
                          isDark ? 'bg-red-900/30' :
                          theme === 'pink' ? 'bg-pink-200' :
                          'bg-red-100'
                        )
                      )}
                    >
                      <i className={clsx(item.icon, "text-base")}></i>
                      {isActive && (
                        <div
                          className={clsx(
                            'absolute -bottom-0.5 w-1 h-1 rounded-full',
                            isDark ? 'bg-white' :
                            theme === 'pink' ? 'bg-pink-600' :
                            'bg-red-600'
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={clsx(
                        'text-[10px] font-medium mt-0.5 block text-center whitespace-nowrap',
                        isActive && (
                          isDark ? 'text-white font-semibold' :
                          theme === 'pink' ? 'text-pink-600 font-semibold' :
                          'text-red-600 font-semibold'
                        )
                      )}
                    >{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
      
      {/* PWA状态指示器 - 暂时隐藏 */}
      {/* <PWAStatusIndicator position="bottom-right" /> */}
      
      {/* PWA安装按钮已移动到个人中心 */}
    </div>
    )
  })

export default MobileLayout;
