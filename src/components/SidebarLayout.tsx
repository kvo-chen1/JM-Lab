import { useEffect, useMemo, useRef, useState, useContext, memo, useCallback } from 'react'
import { TianjinImage } from '@/components/TianjinStyleComponents'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { AuthContext } from '@/contexts/authContext'
import { markPrefetched, isPrefetched } from '@/services/prefetch'
import ErrorFeedback from '@/components/ErrorFeedback'
import { toast } from 'sonner'
import CreatorDashboard from './CreatorDashboard'
import useLanguage from '@/contexts/LanguageContext'
import { useTranslation } from 'react-i18next'
import { navigationGroups } from '@/config/navigationConfig'
import ThemePreviewModal from './ThemePreviewModal'
import SearchBar, { SearchSuggestion } from '@/components/SearchBar'
import searchService from '@/services/searchService'
import PWAInstallButton from '@/components/PWAInstallButton'
import { playNotificationSound, sendDesktopNotification, requestDesktopNotificationPermission } from '../utils/notificationUtils'

interface SidebarLayoutProps {
  children: React.ReactNode
}

export default memo(function SidebarLayout({ children }: SidebarLayoutProps) {
  const { theme = 'light', isDark = false, toggleTheme = () => {}, setTheme = () => {} } = useTheme()
  const { isAuthenticated, user, logout, updateUser } = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [isMounted, setIsMounted] = useState(false)
  // 初始化默认值，确保服务器端和客户端渲染一致
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [hovered, setHovered] = useState<boolean>(false)
  const [width, setWidth] = useState<number>(180)
  // 添加固定状态
  const [isPinned, setIsPinned] = useState<boolean>(false)
  // 自动收缩定时器引用
  const interactionTimeout = useRef<NodeJS.Timeout | null>(null)
  
  // 在客户端挂载后从localStorage加载保存的状态
  useEffect(() => {
    // 只在客户端环境中执行
    if (typeof localStorage === 'undefined') return
    
    setIsMounted(true)
    
    // 从localStorage读取保存的折叠状态
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsed) {
      setCollapsed(JSON.parse(savedCollapsed))
    }
    
    // 从localStorage读取保存的固定状态
    const savedPinned = localStorage.getItem('sidebarPinned')
    if (savedPinned) {
      setIsPinned(JSON.parse(savedPinned))
    }
    
    // 从localStorage读取保存的宽度
    const savedWidth = localStorage.getItem('sidebarWidth')
    if (savedWidth) {
      setWidth(Math.min(Math.max(parseInt(savedWidth), 180), 320))
    }
  }, [])
  const dragging = useRef(false)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [search, setSearch] = useState('')
  const [showThemeModal, setShowThemeModal] = useState(false)
  
  // 保存折叠状态到localStorage
  useEffect(() => {
    // 只在客户端环境中访问localStorage
    if (typeof localStorage === 'undefined') return
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed))
  }, [collapsed])
  
  // 保存固定状态到localStorage
  useEffect(() => {
    // 只在客户端环境中访问localStorage
    if (typeof localStorage === 'undefined') return
    localStorage.setItem('sidebarPinned', JSON.stringify(isPinned))
  }, [isPinned])
  // 初始化最近搜索为[]，确保服务器端和客户端渲染一致
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  // 在客户端挂载后从localStorage加载最近搜索
  useEffect(() => {
    // 只在客户端环境中访问localStorage
    if (typeof localStorage === 'undefined') return
    
    try {
      const s = localStorage.getItem('recentSearches')
      if (s) {
        setRecentSearches(JSON.parse(s))
      }
    } catch {
      // 忽略错误
    }
  }, [])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([])
  
  // 处理搜索输入变化，生成搜索建议
  const handleSearchChange = (value: string) => {
    setSearch(value)
    
    if (value.trim()) {
      // 使用搜索服务生成搜索建议
      const generatedSuggestions = searchService.generateSuggestions(value)
      setSearchSuggestions(generatedSuggestions)
      setShowSearchDropdown(true)
    } else {
      setSearchSuggestions([])
      setShowSearchDropdown(false)
    }
  }
  
  // 处理搜索建议选择
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearch(suggestion.text)
    setShowSearchDropdown(false)
    
    // 使用搜索服务生成重定向URL
    const url = searchService.generateRedirectUrl(suggestion.text, suggestion.type)
    navigate(url)
    
    // 跟踪搜索事件
    searchService.trackSearchEvent({
      query: suggestion.text,
      resultType: suggestion.type,
      clicked: true,
      timestamp: Date.now()
    })
    
    // 更新最近搜索
    setRecentSearches((prev) => {
      const next = [suggestion.text, ...prev.filter((x) => x !== suggestion.text)].slice(0, 6)
      try { localStorage.setItem('recentSearches', JSON.stringify(next)) } catch {}
      return next
    })
  }  
  // 中文注释：处理搜索框聚焦和失焦事件
  useEffect(() => {
    // 只在浏览器环境中添加事件监听
    if (typeof document === 'undefined') return
    
    const handleClickOutside = (e: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container')
      if (searchContainer && !searchContainer.contains(e.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  // 中文注释：通知数据类型与状态管理
  interface Notification {
    id: string
    title: string
    description?: string
    time: string
    read: boolean
    type: 'success' | 'info' | 'warning' | 'error'
    category: 'like' | 'join' | 'message' | 'mention' | 'task' | 'points' | 'system' | 'learning' | 'creation' | 'social'
    actionUrl?: string
    timestamp: number
    sound?: boolean
  }
  const [showNotifications, setShowNotifications] = useState(false)
  // 中文注释：滚动超过一定距离后显示“回到顶部”悬浮按钮，提升长页可用性
  const [showBackToTop, setShowBackToTop] = useState(false)
  // 中文注释：快捷键提示弹层（提高功能可发现性）
  const [showShortcuts, setShowShortcuts] = useState(false)
  const shortcutsRef = useRef<HTMLDivElement | null>(null)
  // 中文注释：问题反馈弹层显示状态
  const [showFeedback, setShowFeedback] = useState(false)
  // 通知过滤状态
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'info' | 'success' | 'warning' | 'error' | 'like' | 'join' | 'message' | 'mention' | 'task' | 'points' | 'system' | 'learning' | 'creation' | 'social'>('all')

  // 通知设置状态
  interface NotificationSettings {
    enableSound: boolean;
    enableDesktop: boolean;
    maxNotifications: number;
    notificationTypes: {
      [key in Notification['category']]: boolean;
    };
  }

  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const stored = localStorage.getItem('notificationSettings');
      if (stored) return JSON.parse(stored);
    } catch {}
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
  // 语言菜单ref
  const languageRef = useRef<HTMLDivElement | null>(null)
  // 语言菜单状态
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  
  useEffect(() => {
    // 只在浏览器环境中添加事件监听
    if (typeof document === 'undefined') return
    
    const handler = (e: MouseEvent) => {
      if (!shortcutsRef.current) return
      if (!shortcutsRef.current.contains(e.target as Node)) {
        setShowShortcuts(false)
      }
    }
    if (showShortcuts) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShortcuts])
  
  // 点击外部关闭语言菜单
  useEffect(() => {
    // 只在浏览器环境中添加事件监听
    if (typeof document === 'undefined') return
    
    const handler = (e: MouseEvent) => {
      if (!languageRef.current) return
      if (!languageRef.current.contains(e.target as Node)) {
        setShowLanguageMenu(false)
      }
    }
    if (showLanguageMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showLanguageMenu])
  
  const notifRef = useRef<HTMLDivElement | null>(null)
  // 初始化通知状态
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
        }))
      }
    } catch {}
    const now = Date.now()
    return [
      { id: 'n1', title: '欢迎回来', description: '每日签到可领取奖励', time: '刚刚', read: false, type: 'success', category: 'system', timestamp: now },
      { id: 'n2', title: '系统更新', description: '创作中心新增AI文案优化', time: '1 小时前', read: false, type: 'info', category: 'system', timestamp: now - 3600000 },
      { id: 'n3', title: '新教程上线', description: '杨柳青年画入门视频', time: '昨天', read: true, type: 'info', category: 'learning', timestamp: now - 86400000 },
      { id: 'n4', title: '作品点赞', description: '您的作品《天津之眼》获得了10个赞', time: '2 小时前', read: false, type: 'success', category: 'like', timestamp: now - 7200000 },
      { id: 'n5', title: '新成员加入', description: '张三加入了您的创作群', time: '30 分钟前', read: false, type: 'info', category: 'join', timestamp: now - 1800000 },
      { id: 'n6', title: '私信消息', description: '李四给您发了一条私信', time: '1 小时前', read: false, type: 'info', category: 'message', timestamp: now - 3600000 },
      { id: 'n7', title: '@提及通知', description: '王五在评论中@了您', time: '2 小时前', read: false, type: 'info', category: 'mention', timestamp: now - 7200000 },
      { id: 'n8', title: '任务完成', description: '您的创作任务已完成', time: '3 小时前', read: true, type: 'success', category: 'task', timestamp: now - 10800000 },
      { id: 'n9', title: '积分增加', description: '您获得了50积分奖励', time: '4 小时前', read: false, type: 'success', category: 'points', timestamp: now - 14400000 },
      { id: 'n10', title: '系统警告', description: '部分功能暂时不可用', time: '5 小时前', read: true, type: 'warning', category: 'system', timestamp: now - 18000000 },
    ]
  })
  
  // 过滤后的通知
  const filteredNotifications = useMemo(() => {
    let result = [...notifications]
    
    if (notificationFilter === 'unread') {
      result = result.filter(n => !n.read)
    } else if (notificationFilter !== 'all') {
      // 检查是否为类型过滤或分类过滤
      const isTypeFilter = ['info', 'success', 'warning', 'error'].includes(notificationFilter)
      if (isTypeFilter) {
        result = result.filter(n => n.type === notificationFilter)
      } else {
        // 分类过滤
        result = result.filter(n => n.category === notificationFilter)
      }
    }
    
    return result
  }, [notifications, notificationFilter])
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    } catch {}
  }, [notifications])

  // 保存通知设置到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
    } catch {}
  }, [notificationSettings])
  useEffect(() => {
    // 只在浏览器环境中添加事件监听
    if (typeof document === 'undefined') return
    
    const handler = (e: MouseEvent) => {
      if (!notifRef.current) return
      if (!notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifications])

  // 中文注释：用户头像菜单相关状态与引用
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  // 中文注释：点击外部关闭用户菜单
  useEffect(() => {
    // 只在浏览器环境中添加事件监听
    if (typeof document === 'undefined') return
    
    const handler = (e: MouseEvent) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUserMenu])
  // 中文注释：处理更换头像文件上传
  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result || '')
      if (url) {
        updateUser({ avatar: url })
      }
    }
    reader.readAsDataURL(file)
    setShowUserMenu(false)
    e.target.value = ''
  }

  // 中文注释：侧边栏最小宽度从 200px 调整为 180px，使默认更紧凑
  const minW = 180
  const maxW = 320

  const onMouseDown = () => {
    // 只在浏览器环境中执行
    if (typeof document === 'undefined') return
    
    dragging.current = true
    document.body.style.cursor = 'col-resize'
  }

  // 移除路由预加载逻辑，减少不必要的资源加载
  // 预加载会增加内存消耗和网络请求，对于低性能设备来说可能会导致卡顿
  // 导航跳转速度的提升应该通过优化组件渲染和减少不必要的资源加载来实现
  const prefetchRoute = useCallback((path: string, ttlMs = 60000) => {
    // 直接返回，不执行任何预加载逻辑
    return;
  }, [])

  // 移除空闲时预加载逻辑，减少不必要的资源加载
  // useEffect(() => {
  //   const idle = (window as any).requestIdleCallback || ((fn: Function) => setTimeout(fn, 500))
  //   idle(() => prefetchRoute('/wizard', 300000))
  //   return () => {
  //     // 中文注释：兼容不同idle实现，简单清理
  //   }
  // }, [])

  useEffect(() => {
    // 只在浏览器环境中添加事件监听
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || collapsed) return
      const next = Math.min(Math.max(width + e.movementX, minW), maxW)
      setWidth(next)
      localStorage.setItem('sidebarWidth', String(next))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = 'default'
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [width, collapsed])

  // 添加通知动画效果
  const [newNotification, setNewNotification] = useState<Notification | null>(null)
  


  // 添加新通知的函数
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'time' | 'timestamp'>) => {
    // 检查是否允许该类型通知
    if (!notificationSettings.notificationTypes[notification.category]) {
      return;
    }
    
    const now = Date.now()
    const newNotif: Notification = {
      ...notification,
      id: `n${now}`,
      read: false,
      time: '刚刚',
      timestamp: now,
      sound: notification.sound ?? true,
    }
    
    setNotifications(prev => [newNotif, ...prev].slice(0, notificationSettings.maxNotifications))
    setNewNotification(newNotif)
    
    // 播放通知声音
    if (notificationSettings.enableSound && newNotif.sound) {
      playNotificationSound(notification.category);
    }
    
    // 发送桌面通知
    if (notificationSettings.enableDesktop) {
      requestDesktopNotificationPermission().then(granted => {
        if (granted) {
          sendDesktopNotification(newNotif.title, {
            body: newNotif.description || '',
            tag: newNotif.id,
          });
        }
      });
    }
    
    // 3秒后清除新通知标记
    setTimeout(() => {
      setNewNotification(null)
    }, 3000)
  }, [notificationSettings])

  useEffect(() => {
    // 只在浏览器环境中添加事件监听
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement && (document.activeElement as HTMLElement).tagName) || ''
      const isTyping = ['INPUT', 'TEXTAREA'].includes(tag)
      
      // 全局快捷键
      if (e.key === 't') {
        toggleTheme()
      }
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      }

      
      // 添加快捷键提示
      if (e.key === '?') {
        e.preventDefault()
        setShowShortcuts(v => !v)
        return
      }
      
      // 添加通知快捷键
      if (e.key === 'n' && !isTyping) {
        e.preventDefault()
        setShowNotifications(v => !v)
      }
      
      // ESC 键关闭各种弹出内容
      if (e.key === 'Escape') {
        if (showNotifications) setShowNotifications(false)
        if (showShortcuts) setShowShortcuts(false)
        if (showFeedback) setShowFeedback(false)
        if (showUserMenu) setShowUserMenu(false)
        if (showSearchDropdown) setShowSearchDropdown(false)
        // 移除对showLanguageDropdown的依赖，避免初始化顺序问题
        // if (showLanguageDropdown) setShowLanguageDropdown(false)
      }
      
      if (!isTyping) {
        const map: Record<string, string> = {
          '1': '/',
          '2': '/explore',
          '3': '/create',
          '4': '/neo',
          '5': '/wizard',
          '6': '/square',
          '7': '/knowledge',
          '8': '/tianjin',
          '9': '/leaderboard',
          '0': '/about',
        }
        const dest = map[e.key]
        if (dest) {
          prefetchRoute(dest)
          navigate(dest)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleTheme, showNotifications, showShortcuts, showFeedback, showUserMenu, showSearchDropdown, prefetchRoute, navigate, setCollapsed])

  // 中文注释：当滚动距离超过 480px 时展示“回到顶部”按钮
  useEffect(() => {
    // 只在浏览器环境中添加事件监听
    if (typeof window === 'undefined') return
    
    const onScroll = () => {
      const y = window.scrollY
      setShowBackToTop(y > 480)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 防抖函数
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 中文注释：暗色主题下的导航项采用白色文字，提升对比度和可读性
  // 统一导航项高度和内边距，避免激活时布局变化
  const navItemClass = useMemo(() => (
    `${isDark ? 'text-white hover:bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'} flex items-center px-3 py-2 rounded-lg transition-all duration-200`
  ), [isDark])

  // 中文注释：主题激活态使用CSS变量，确保主题变化时样式同步更新
  // 优化激活状态样式，确保不影响整体布局
  const activeClass = useMemo(() => (
    `${isDark ? 'bg-[var(--bg-tertiary)] text-white ring-1 ring-[var(--accent-red)] shadow-[var(--shadow-md)]' : 'bg-gradient-to-r from-red-50 to-red-100 text-[var(--text-primary)] border-b-2 border-red-600 font-semibold shadow-sm relative overflow-hidden group active-nav-item'} border-t border-transparent`
  ), [isDark])

  const { t } = useTranslation()
  const { currentLanguage, changeLanguage, languages } = useLanguage()
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

  // 导航项ID到翻译键名的映射
  const navItemIdToTranslationKey: Record<string, string> = {
    // 核心导航
    'home': 'sidebar.home',
    'explore': 'sidebar.exploreWorks',
    'create': 'sidebar.creationCenter',
    'inspiration': 'sidebar.inspirationEngine',
    'knowledge': 'sidebar.culturalKnowledge',
    
    // 创作工具
    'tools': 'sidebar.creativeTools',
    
    // 共创功能
    'guide': 'sidebar.coCreationGuide',
    'square': 'sidebar.coCreationSquare',
    'community': 'sidebar.coCreationCommunity',
    'creator-community': 'sidebar.creatorCommunity',
    
    // 天津特色
    'tianjin': 'sidebar.tianjinSpecialZone',
    'tianjin-map': 'sidebar.tianjinMap',
    'events': 'sidebar.culturalActivities',
    'news': 'sidebar.culturalNews',
    
    // 更多服务
    'particle-art': 'sidebar.particleArt',
    'leaderboard': 'sidebar.popularityRanking',
    'games': 'sidebar.funGames',
    'lab': 'sidebar.newWindowLab',
    'points-mall': 'sidebar.pointsMall',
    'brand': 'sidebar.brandCooperation',
    'about': 'sidebar.aboutUs'
  }

  // 导航分组ID到翻译键名的映射
  const navGroupIdToTranslationKey: Record<string, string> = {
    'core': 'sidebar.commonFunctions',
    'cocreation': 'sidebar.coCreation',
    'tianjin': 'sidebar.tianjinFeatures',
    'more': 'sidebar.moreServices'
  }

  const title = useMemo(() => {
    const p = location.pathname
    if (p === '/') return t('common.home')
    if (p.startsWith('/explore')) return t('common.explore')
    if (p.startsWith('/tools')) return t('sidebar.creativeTools')
    if (p.startsWith('/about')) return t('common.about')
    if (p.startsWith('/knowledge')) return t('sidebar.culturalKnowledge')
    if (p.startsWith('/tianjin/map')) return t('sidebar.tianjinMap')
    if (p.startsWith('/tianjin')) return t('sidebar.tianjinSpecialZone')
    if (p.startsWith('/square')) return t('sidebar.coCreationSquare')
    if (p.startsWith('/community')) {
      const sp = new URLSearchParams(location.search)
      const ctx = sp.get('context')
      return ctx === 'cocreation' ? t('sidebar.coCreationCommunity') : t('sidebar.creatorCommunity')
    }
    if (p.startsWith('/brand')) return t('sidebar.brandCooperation')
    if (p.startsWith('/dashboard')) return t('common.dashboard')
    if (p.startsWith('/create')) return t('sidebar.creationCenter')
    if (p.startsWith('/drafts')) return t('common.drafts')
    if (p.startsWith('/generate')) return t('common.aiGenerationEngine')
    if (p.startsWith('/neo')) return t('sidebar.inspirationEngine')
    if (p.startsWith('/lab')) return t('sidebar.newWindowLab')
    if (p.startsWith('/wizard')) return t('sidebar.coCreationGuide')
    if (p.startsWith('/admin')) return t('common.adminConsole')
    return t('common.appName')
  }, [location.pathname, location.search, t])

  const onSearchSubmit = useCallback(() => {
    if (!search.trim()) return
    const q = search.trim()
    
    // 使用搜索服务分类查询
    const classification = searchService.classifyQuery(q)
    
    // 根据分类结果进行导航
    if (classification.suggestedResults.length === 1 && classification.confidence > 0.9) {
      // 高置信度的单一结果，直接导航到对应页面
      const suggestion = classification.suggestedResults[0]
      const url = searchService.generateRedirectUrl(suggestion.text, suggestion.type)
      navigate(url)
    } else {
      // 多结果或低置信度，导航到搜索结果页面
      navigate(`/search?query=${encodeURIComponent(q)}`)
    }
    
    // 跟踪搜索事件
    searchService.trackSearchEvent({
      query: q,
      resultType: classification.primaryType,
      clicked: false,
      timestamp: Date.now()
    })
    
    // 更新最近搜索
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 6)
      try { localStorage.setItem('recentSearches', JSON.stringify(next)) } catch {}
      return next
    })
    
    setShowSearchDropdown(false)
  }, [search, navigate])

  // 防抖的预加载函数
  const debouncedPrefetch = useCallback(debounce((path: string) => {
    prefetchRoute(path)
  }, 200), [prefetchRoute])

  // 中文注释：根据查询参数精确判断当前激活的社群类型，避免两个导航同时高亮
  const isCommunityActive = (ctx: 'cocreation' | 'creator') => {
    const sp = new URLSearchParams(location.search)
    return location.pathname.startsWith('/community') && sp.get('context') === ctx
  }

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gradient-to-br from-[#0b0e13] via-[#0e1218] to-[#0b0e13] text-gray-100' : theme === 'pink' ? 'bg-gradient-to-br from-[#fff0f5] via-[#ffe4ec] to-[#fff0f5] text-gray-900' : 'bg-white text-gray-900'}`}>
      {/* 仅在桌面端显示侧边栏 */}
      <aside 
        className={`hidden md:flex flex-col ${isDark ? 'bg-[#10151d]/95 backdrop-blur-sm border-gray-800' : theme === 'pink' ? 'bg-white/90 backdrop-blur-sm border-pink-200' : 'bg-white border-gray-200'} border-r relative ring-1 z-10 ${isDark ? 'ring-gray-800' : theme === 'pink' ? 'ring-pink-200' : 'ring-gray-200'}`} 
        onMouseEnter={() => {
          setHovered(true);
          setCollapsed(false);
          // 清除任何待处理的定时器
          if (interactionTimeout.current) {
            clearTimeout(interactionTimeout.current);
            interactionTimeout.current = null;
          }
        }}
        onMouseLeave={() => {
          setHovered(false);
          // 固定状态下不禁用自动收缩
          if (!isPinned) {
            // 设置定时器，2秒后自动收缩
            interactionTimeout.current = setTimeout(() => {
              setCollapsed(true);
            }, 2000);
          }
        }}
        style={{ width: (collapsed && !hovered && !isPinned) ? 72 : width, transition: 'width 0.2s ease-in-out' }}
      >
        <div className={`px-4 py-3 flex items-center justify-between rounded-lg transition-colors group ${isDark ? 'hover:bg-gray-800/60' : theme === 'pink' ? 'hover:bg-pink-50' : 'hover:bg-gray-50'}`}>
          <div className="flex items-center space-x-2">
            <span className={`font-extrabold bg-gradient-to-r ${isDark ? 'from-red-400 to-rose-500' : 'from-red-600 to-rose-500'} bg-clip-text text-transparent tracking-tight`}>津脉</span>
            {(!collapsed || hovered) && <span className={`font-bold ${isDark ? 'text-white' : ''}`}>智坊</span>}
          </div>
          <div className="flex items-center space-x-1">
            {/* 固定/收缩按钮 */}
            <button
              className={`p-2 rounded-lg ring-1 transition-all ${isDark ? 'hover:bg-gray-800/70 ring-gray-800 hover:ring-2' : 'hover:bg-gray-100 ring-gray-200 hover:ring-2'} hover:shadow-sm ${isPinned ? 'ring-blue-500' : ''}`}
              onClick={() => {
                const newPinnedState = !isPinned;
                setIsPinned(newPinnedState);
                if (newPinnedState) {
                  // 固定时展开导航栏
                  setCollapsed(false);
                } else {
                  // 取消固定时立即收缩
                  setCollapsed(true);
                  // 清除任何待处理的定时器
                  if (interactionTimeout.current) {
                    clearTimeout(interactionTimeout.current);
                    interactionTimeout.current = null;
                  }
                }
              }}
              aria-label={isPinned ? '收缩侧边栏' : '固定侧边栏'}
              title={isPinned ? '收缩侧边栏' : '固定侧边栏'}
            >
              <i className={`fas ${isPinned ? 'fa-thumbtack rotate-45 text-blue-500' : 'fa-thumbtack'} ${isDark ? 'text-white' : 'text-gray-500'} transition-transform group-hover:scale-110`}></i>
            </button>

          </div>
        </div>

        <nav className="px-2 pt-2 pb-4 space-y-4">
          {navigationGroups.map((group) => (
            <div key={group.id} className={`rounded-lg ${isDark ? 'bg-[#1a1f2e]/50 backdrop-blur-sm' : 'bg-gray-50'} p-3 transition-all duration-300`}>
              {(!collapsed || hovered || isPinned) && (
                <h3 className={`text-xs font-semibold mb-2 uppercase tracking-wider ${isDark ? 'text-blue-400' : 'text-blue-600'} flex items-center transition-all duration-300 ease-in-out opacity-100`}>
                  <span className="mr-2 w-1.5 h-1.5 rounded-full bg-current"></span>
                  {t(navGroupIdToTranslationKey[group.id] || group.id)}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink 
                    key={item.id}
                    to={`${item.path}${item.search || ''}`}
                    title={collapsed && !hovered && !isPinned ? t(navItemIdToTranslationKey[item.id] || item.id) : undefined} 
                    onMouseEnter={() => debouncedPrefetch(item.path)} 
                    className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : ''} relative overflow-hidden group ${(collapsed && !hovered && !isPinned) ? 'justify-center px-2 py-2.5' : ''}`}
                  > 
                    <i className={`fas ${item.icon} ${(collapsed && !hovered && !isPinned) ? 'mr-0' : 'mr-2'} transition-all duration-300 group-hover:scale-110 group-hover:rotate-5`}></i>
                    {(!collapsed || hovered || isPinned) && <span className="transition-all duration-300 ease-in-out opacity-100">{t(navItemIdToTranslationKey[item.id] || item.id)}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* 中文注释：侧栏保留预留的社群模块占位，后续再完善 */}

        {/* 中文注释：原侧边栏底部“主题切换”入口移除，改在首页右下角提供统一入口 */}

        {!collapsed && (
          <div
            onMouseDown={onMouseDown}
            className={`absolute top-0 right-0 h-full w-1 cursor-col-resize ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
          />
        )}
      </aside>
      {/* 中文注释：恢复点击自动收起功能，但优化实现方式避免跳动 */}
      <div 
        className="flex-1 min-w-0 md:pb-0 pt-0 flex flex-col overflow-y-auto relative z-10"
        onClick={(e) => {
          // 确保点击的不是内部的可交互元素
          const target = e.target as HTMLElement;
          // 只在点击主内容区域且非固定状态时收起侧边栏，不拦截导航链接等可交互元素
          if (!isPinned && !collapsed && !target.closest('button, input, a, [role="menu"], [role="dialog"], nav, [data-discover="true"]')) {
            setCollapsed(true);
          }
        }}
      >
        {/* 中文注释：暗色头部采用半透明背景与毛玻璃，弱化硬边 */}
        <header className={`sticky top-0 z-40 ${isDark ? 'bg-[#0b0e13]/80 backdrop-blur-sm' : theme === 'pink' ? 'bg-white/80 backdrop-blur-sm' : 'bg-white'} border-b ${isDark ? 'border-gray-800' : theme === 'pink' ? 'border-pink-200' : 'border-gray-200'} px-4 py-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                onClick={() => setCollapsed(!collapsed)}
                aria-label="切换侧边栏"
              >
                <i className="fas fa-bars"></i>
              </button>
              <h2 className="text-lg font-bold">{title}</h2>
            </div>
            <div className="flex items-center space-x-3">
              {/* 中文注释：搜索框 - 使用增强的SearchBar组件 */}
              <div className="relative search-container max-w-md flex-shrink-0">
                <SearchBar
                  search={search}
                  setSearch={handleSearchChange}
                  showSuggest={showSearchDropdown}
                  setShowSuggest={setShowSearchDropdown}
                  suggestions={searchSuggestions}
                  isDark={isDark}
                  onSearch={onSearchSubmit}
                  onSuggestionSelect={handleSuggestionSelect}
                />
              </div>
              {/* 主题切换按钮 */}
              <button
                onClick={() => setShowThemeModal(true)}
                className={`p-2 rounded-lg transition-all duration-300 flex items-center ${isDark ? 'bg-gray-800 hover:bg-gray-700 ring-1 ring-gray-700 text-gray-100 hover:ring-gray-600' : theme === 'pink' ? 'bg-pink-50 hover:bg-pink-100 ring-1 ring-pink-200 text-pink-800 hover:ring-pink-300' : 'bg-white hover:bg-gray-50 ring-1 ring-gray-200 text-gray-900 hover:ring-gray-300'}`}
                aria-label={t('header.toggleTheme')}
                title={t('header.toggleTheme')}
              >
                <i className={`fas ${theme === 'dark' ? 'fa-sun' : theme === 'light' ? 'fa-moon' : theme === 'pink' ? 'fa-heart' : 'fa-circle-half-stroke'} transition-transform duration-300 hover:scale-110`}></i>
              </button>
              
              {/* 语言切换器 */}
              <div className="relative">
                <button
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'} flex items-center space-x-1`}
                  aria-label={t('common.language')}
                  onClick={() => setShowLanguageDropdown(v => !v)}
                  title={t('common.language')}
                >
                  <i className="fas fa-globe"></i>
                  <span>{currentLanguage.toUpperCase()}</span>
                  <i className={`fas fa-chevron-down transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`}></i>
                </button>
                {showLanguageDropdown && (
                  <div className={`absolute right-0 mt-2 w-32 rounded-xl shadow-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`} role="menu" aria-label={t('common.language')}>
                    <ul className="py-1">
                      {languages.map(lang => (
                        <li key={lang.code}>
                          <button
                            className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${currentLanguage === lang.code ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 font-semibold') : ''}`}
                            onClick={() => {
                              changeLanguage(lang.code)
                              setShowLanguageDropdown(false)
                            }}
                            role="menuitem"
                          >
                            {lang.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* 中文注释：快捷键提示入口 */}
              <div className="relative" ref={shortcutsRef}>
                <button
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                  aria-label="查看快捷键"
                  aria-expanded={showShortcuts}
                  onClick={() => setShowShortcuts(v => !v)}
                  title="快捷键提示"
                >
                  <i className="fas fa-keyboard"></i>
                </button>
                {showShortcuts && (
                  <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`} role="dialog" aria-label={t('header.shortcuts')}>
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <span className="font-medium">{t('header.shortcuts')}</span>
                      <button className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`} onClick={() => setShowShortcuts(false)}>{t('header.close')}</button>
                    </div>
                    <ul className="px-4 py-2 text-sm space-y-1">
                      <li className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>/ 聚焦搜索</li>
                      <li className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>T 切换主题</li>

                      <li className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>1–0 快速导航（首页至关于）</li>
                      <li className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>移动端：下滑隐藏底部导航</li>
                    </ul>
                  </div>
                )}
              </div>
              {/* 中文注释：问题反馈入口 */}
              <button
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                aria-label="问题反馈"
                title="问题反馈"
                onClick={() => setShowFeedback(true)}
              >
                <i className="fas fa-bug"></i>
              </button>

              <button
                title="分享"
                aria-label="分享当前页面"
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 ring-1 ring-gray-700' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                onClick={() => {
                  try {
                    const url = window.location.href
                    if (navigator.share && window.isSecureContext) {
                      navigator.share({
                        title: document.title,
                        url: url
                      })
                    } else {
                      navigator.clipboard.writeText(url)
                      toast.success('分享链接已复制到剪贴板')
                    }
                  } catch {
                    toast.error('分享失败，请重试')
                  }
                }}
              >
                <i className="fas fa-share-nodes"></i>
              </button>
              <div className="relative" ref={notifRef}>
                <button
                  className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 hover:bg-gray-700 hover:ring-blue-500' : 'bg-white/70 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-blue-500'} hover:shadow-md relative`}
                  aria-label="通知"
                  aria-expanded={showNotifications}
                  onClick={() => setShowNotifications(v => !v)}
                  title={`${unreadCount > 0 ? `${unreadCount} 条未读通知` : '查看通知'}`}
                >
                  <i className="fas fa-bell transition-transform duration-300 hover:scale-110"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-96 rounded-2xl shadow-xl ring-1 transition-all duration-300 transform scale-100 opacity-100 translate-y-0 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'} z-50`} role="dialog" aria-label="通知列表">
                    <div className={`px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <i className="fas fa-bell text-lg"></i>
                          </span>
                          <div>
                            <h3 className="font-bold text-lg flex items-center">
                              通知
                              <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                {unreadCount} 未读
                              </span>
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                              共 {notifications.length} 条通知
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <button
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-sm ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
                          <i className="fas fa-check-double mr-1"></i>
                          全部已读
                        </button>
                        <button
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-sm ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                          onClick={() => setNotifications([])}>
                          <i className="fas fa-trash mr-1"></i>
                          清空
                        </button>
                        <button
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-sm ${isDark ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
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
                        
                        {/* 通知类型设置 */}
                        <div className="mt-4">
                          <h5 className="text-sm font-medium mb-3 text-gray-500">通知类型</h5>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {Object.entries(notificationSettings.notificationTypes).map(([type, enabled]) => (
                              <div key={type} className="flex items-center justify-between">
                                <label className="text-sm flex items-center">
                                  <i className={`fas ${type === 'like' ? 'fa-heart' : type === 'join' ? 'fa-user-plus' : type === 'message' ? 'fa-envelope' : type === 'mention' ? 'fa-at' : type === 'task' ? 'fa-tasks' : type === 'points' ? 'fa-coins' : type === 'system' ? 'fa-cog' : type === 'learning' ? 'fa-book' : type === 'creation' ? 'fa-paint-brush' : 'fa-users'} mr-2 text-gray-500`}></i>
                                  {type === 'like' && '点赞'}
                                  {type === 'join' && '新成员'}
                                  {type === 'message' && '私信'}
                                  {type === 'mention' && '@提及'}
                                  {type === 'task' && '任务'}
                                  {type === 'points' && '积分'}
                                  {type === 'system' && '系统'}
                                  {type === 'learning' && '学习'}
                                  {type === 'creation' && '创作'}
                                  {type === 'social' && '社交'}
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={enabled} 
                                    onChange={(e) => setNotificationSettings(prev => ({
                                      ...prev,
                                      notificationTypes: {
                                        ...prev.notificationTypes,
                                        [type]: e.target.checked
                                      }
                                    }))}
                                    className="sr-only peer"
                                  />
                                  <div className={`w-11 h-6 rounded-full transition-all duration-300 peer ${enabled ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                                  <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 peer-checked:translate-x-5`}></span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 通知过滤标签 */}
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-x-auto whitespace-nowrap`}>
                      <div className="flex space-x-2">
                        {[
                          // 基础过滤
                          { value: 'all', label: '全部', icon: 'fa-inbox' },
                          { value: 'unread', label: '未读', icon: 'fa-envelope-open-text' },
                          // 类型过滤
                          { value: 'success', label: '成功', icon: 'fa-check-circle' },
                          { value: 'info', label: '信息', icon: 'fa-info-circle' },
                          { value: 'warning', label: '警告', icon: 'fa-exclamation-triangle' },
                          { value: 'error', label: '错误', icon: 'fa-times-circle' },
                          // 分类过滤
                          { value: 'like', label: '点赞', icon: 'fa-heart' },
                          { value: 'join', label: '新成员', icon: 'fa-user-plus' },
                          { value: 'message', label: '私信', icon: 'fa-envelope' },
                          { value: 'mention', label: '@提及', icon: 'fa-at' },
                          { value: 'task', label: '任务', icon: 'fa-tasks' },
                          { value: 'points', label: '积分', icon: 'fa-coins' },
                        ].map(filter => (
                          <button
                            key={filter.value}
                            onClick={() => setNotificationFilter(filter.value as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center transition-all duration-300 transform hover:scale-105 ${notificationFilter === filter.value ? 
                              (isDark ? 'bg-blue-900/50 text-blue-400 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-300') : 
                              (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}
                          >
                            <i className={`fas ${filter.icon} mr-1.5 text-xs`}></i>
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <ul className="max-h-96 overflow-auto">
                      {filteredNotifications.length === 0 ? (
                        <li className={`${isDark ? 'text-gray-400' : 'text-gray-500'} px-4 py-16 text-center`}>
                          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 transition-all duration-300 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                            <i className="fas fa-bell-slash text-5xl opacity-40"></i>
                          </div>
                          <h4 className="text-lg font-medium mb-3">暂无通知</h4>
                          <p className="text-sm opacity-75 max-w-xs mx-auto">当有新通知时，会在这里显示</p>
                        </li>
                      ) : (
                        filteredNotifications.map(n => (
                          <li key={n.id}>
                            <button
                              onClick={() => {
                                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                                // 如果有跳转链接，处理跳转
                                if (n.actionUrl) {
                                  navigate(n.actionUrl)
                                  setShowNotifications(false)
                                }
                              }}
                              className={`w-full text-left px-5 py-5 flex items-start space-x-4 transition-all duration-300 transform hover:translate-x-1 ${isDark ? 'hover:bg-gray-700/80' : 'hover:bg-gray-50'} ${newNotification?.id === n.id ? 'animate-pulse bg-opacity-90' : ''} ${!n.read ? `${isDark ? 'bg-blue-900/20 border-l-4 border-blue-500 shadow-lg shadow-blue-900/10' : 'bg-blue-50 border-l-4 border-blue-500 shadow-lg shadow-blue-100'}` : ''} active:scale-95`}
                            >
                              {/* 通知图标 - 根据分类显示不同图标 */}
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} text-lg ${newNotification?.id === n.id ? 'scale-110' : ''}`}>
                                <i className={`fas ${n.category === 'like' ? 'fa-heart text-red-500' : 
                                                n.category === 'join' ? 'fa-user-plus text-green-500' : 
                                                n.category === 'message' ? 'fa-envelope text-blue-500' : 
                                                n.category === 'mention' ? 'fa-at text-purple-500' : 
                                                n.category === 'task' ? 'fa-tasks text-green-600' : 
                                                n.category === 'points' ? 'fa-coins text-yellow-500' : 
                                                n.type === 'success' ? 'fa-check-circle text-green-500' : 
                                                n.type === 'info' ? 'fa-info-circle text-blue-500' : 
                                                n.type === 'warning' ? 'fa-exclamation-triangle text-yellow-500' : 
                                                'fa-times-circle text-red-500'}`}></i>
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <h4 className={`text-base font-medium truncate ${!n.read ? 'font-semibold' : ''} ${newNotification?.id === n.id ? 'text-blue-600 dark:text-blue-400' : ''}`}>{n.title}</h4>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} transition-all duration-300`}>
                                    {n.time}
                                  </span>
                                </div>
                                {n.description && (
                                  <p className={`mt-2 text-sm leading-relaxed line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{n.description}</p>
                                )}
                                <div className="flex items-center justify-between mt-3">
                                  {/* 通知分类标签 - 显示完整分类 */}
                                  <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} ${newNotification?.id === n.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : ''}`}>
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
                                  {/* 未读指示器 */}
                                  {!n.read && (
                                    <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'} animate-pulse`}></span>
                                  )}
                                </div>
                              </div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* 好友管理按钮 */}
              <NavLink
                to="/friends"
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-gray-800/70 ring-1 ring-gray-700 hover:bg-gray-700 hover:ring-blue-500' : 'bg-white/70 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-blue-500'} hover:shadow-md`}
                aria-label="好友管理"
                title="好友管理"
              >
                <i className="fas fa-users transition-transform duration-300 hover:scale-110"></i>
              </NavLink>
              
              {/* 创作者仪表盘 */}
              <CreatorDashboard />
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    className="flex items-center space-x-2"
                    aria-label="用户菜单"
                    aria-expanded={showUserMenu}
                    onClick={() => setShowUserMenu(v => !v)}
                  >
                    {user?.avatar && user.avatar.trim() ? (
                      <div className="relative h-8 w-8 rounded-full">
                        <img 
                          src={user.avatar} 
                          alt={user?.username || '用户头像'} 
                          className="h-full w-full rounded-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const defaultAvatar = document.createElement('div');
                              defaultAvatar.className = `absolute inset-0 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`;
                              defaultAvatar.textContent = user?.username?.charAt(0) || 'U';
                              parent.appendChild(defaultAvatar);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-blue-600' : 'bg-orange-500'}`}>
                        {user?.username?.charAt(0) || 'U'}
                      </div>
                    )}
                  </button>
                  {showUserMenu && (
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg ring-1 ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`} role="menu" aria-label="用户菜单">
                      <div className="px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                        <p className="text-sm">{user?.username}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                      </div>
                      <ul className="py-1">
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/dashboard') }}>{t('header.profile')}</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/analytics') }}>{t('header.analytics')}</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/membership') }}>{t('header.membershipCenter')}</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/collection') }}>{t('header.myCollection')}</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/drafts') }}>{t('common.drafts')}</button>
                        </li>
                        <li>
                          <button className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); navigate('/settings') }}>{t('header.settings')}</button>
                        </li>
                        <li>
                          <PWAInstallButton asMenuItem isDark={isDark} />
                        </li>
                        <li className="border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} mt-2">
                          <button className={`w-full text-left px-4 py-2 text-red-600 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`} onClick={() => { setShowUserMenu(false); logout() }}>{t('header.logout')}</button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink to="/login" className={`px-3 py-1 rounded-md ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'}`}>
                  {t('header.login')}
                </NavLink>
              )}
            </div>
          </div>
        </header>
        <ThemePreviewModal
          isOpen={showThemeModal}
          onClose={() => setShowThemeModal(false)}
          onSelectTheme={(selectedTheme) => {
            setTheme(selectedTheme);
            setShowThemeModal(false);
          }}
          currentTheme={theme}
        />
        {children}
        {/* 中文注释：全局“回到顶部”悬浮按钮（自适应暗色/浅色主题） */}
        {showBackToTop && (
          <button
            aria-label="回到顶部"
            title="回到顶部"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed right-4 bottom-6 z-40 p-3 rounded-full shadow-lg ring-1 transition-colors ${isDark ? 'bg-gray-800 text-white ring-gray-700 hover:bg-gray-700' : theme === 'pink' ? 'bg-white text-gray-900 ring-pink-200 hover:bg-pink-50' : 'bg-white text-gray-900 ring-gray-200 hover:bg-gray-50'}`}
          >
            <i className="fas fa-arrow-up"></i>
          </button>
        )}

        {showFeedback && (
          <ErrorFeedback onClose={() => setShowFeedback(false)} autoShow={true} />
        )}
      </div>
    </div>
  )
})