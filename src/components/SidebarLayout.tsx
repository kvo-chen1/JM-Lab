import { useEffect, useMemo, useRef, useState, useContext, memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { debounce } from '@/lib/utils'
import { TianjinImage } from '@/components/TianjinStyleComponents'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { themeOrder, themeConfig } from '@/config/themeConfig'
import { AuthContext } from '@/contexts/authContext'
import { useFriendContext } from '@/contexts/friendContext'
import { usePrefetch } from '@/hooks/usePrefetch'
import ErrorFeedback from '@/components/ErrorFeedback'
import { toast } from 'sonner'

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
  useKeyboardNavigation,
  useScreenReader,
  createAriaAttributes,
  useHighContrast,
  useReducedMotion
} from '@/utils/accessibility'
import { userService } from '@/services/apiService'
import userStatsService from '@/services/userStatsService'
import { getFollowingList, getFollowersList } from '@/services/postService'
import { uploadImage } from '@/services/imageService'
import { supabase } from '@/lib/supabase'
import supabasePointsService from '@/services/supabasePointsService'
import achievementService from '@/services/achievementService'

// 响应式动画速度控制
const useResponsiveAnimation = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024
      });
    };

    checkDevice();
    const debouncedCheck = debounce(checkDevice, 100);
    window.addEventListener('resize', debouncedCheck);
    return () => window.removeEventListener('resize', debouncedCheck);
  }, []);

  // 根据设备类型返回动画持续时间
  const getDuration = useCallback((defaultDuration: number) => {
    return getResponsiveDuration(defaultDuration, deviceInfo.isMobile, deviceInfo.isTablet);
  }, [deviceInfo]);

  // 根据设备类型返回动画延迟时间
  const getDelay = useCallback((defaultDelay: number) => {
    return getResponsiveDelay(defaultDelay, deviceInfo.isMobile, deviceInfo.isTablet);
  }, [deviceInfo]);

  return { ...deviceInfo, getDuration, getDelay };
};

import SearchBar, { SearchSuggestion } from '@/components/SearchBar'
import searchService from '@/services/searchService'
import PWAInstallButton from '@/components/PWAInstallButton'
import { playNotificationSound, sendDesktopNotification, requestDesktopNotificationPermission } from '../utils/notificationUtils'
import { messageService } from '@/services/messageService'
import { feedService } from '@/services/feedService'



interface SidebarLayoutProps {
  children: React.ReactNode
}

export default memo(function SidebarLayout({ children }: SidebarLayoutProps) {
  const themeContext = useTheme()
  const { theme = 'light', isDark = false, toggleTheme = () => {}, setTheme = () => {} } = themeContext || {}
  const { isAuthenticated, user, logout, updateUser } = useContext(AuthContext)
  const { friendRequests, getFriendRequests } = useFriendContext()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMounted, setIsMounted] = useState(false)
  const { getDuration, getDelay } = useResponsiveAnimation()
  
  // 无障碍功能
  const { announce } = useScreenReader()
  const { isHighContrast, highContrastClasses } = useHighContrast()
  const { prefersReducedMotion, motionSafeClasses } = useReducedMotion()
  
  // 侧边栏容器引用
  const sidebarRef = useRef<HTMLDivElement>(null)
  // 初始化默认值，确保服务器端和客户端渲染一致
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [width, setWidth] = useState<number>(180)
  // 添加固定状态
  const [isPinned, setIsPinned] = useState<boolean>(false)
  // 主题下拉菜单状态
  const [showThemeDropdown, setShowThemeDropdown] = useState<boolean>(false)
  
  // 在客户端挂载后从localStorage加载保存的状态
  useEffect(() => {
    // 只在客户端环境中执行
    if (typeof localStorage === 'undefined') return
    
    setIsMounted(true)
    
    // 从localStorage批量读取保存的状态，减少localStorage操作次数
    try {
      const savedState = localStorage.getItem('sidebarState')
      if (savedState) {
        const state = JSON.parse(savedState)
        if (state.collapsed !== undefined) setCollapsed(state.collapsed)
        if (state.width) setWidth(Math.min(Math.max(state.width, 180), 320))
      }
    } catch (error) {
      console.error('Failed to load sidebar state:', error)
    }
  }, [])

  // 点击外部关闭主题下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const themeButton = document.querySelector('.theme-dropdown-button')
      const themeDropdown = document.querySelector('.theme-dropdown-menu')
      
      if (themeButton && themeDropdown && !themeButton.contains(event.target as Node) && !themeDropdown.contains(event.target as Node)) {
        setShowThemeDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  const dragging = useRef(false)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [search, setSearch] = useState('')
  
  // 使用防抖函数优化localStorage写入
  const debouncedSaveState = useCallback(debounce(() => {
    if (typeof localStorage === 'undefined') return
    try {
      const state = {
        collapsed,
        width
      }
      localStorage.setItem('sidebarState', JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save sidebar state:', error)
    }
  }, 200), [collapsed, width])
  
  // 保存侧边栏状态到localStorage
  useEffect(() => {
    debouncedSaveState()
  }, [collapsed, width, debouncedSaveState])
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
    } else {
      setSearchSuggestions([])
    }
    setShowSearchDropdown(true)
  }

  // 使用防抖函数保存最近搜索
  const saveRecentSearches = useCallback((searches: string[]) => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem('recentSearches', JSON.stringify(searches))
    } catch (error) {
      console.error('Failed to save recent searches:', error)
    }
  }, [])

  // 计算显示的建议列表（包含最近搜索和热门推荐）
  const displaySuggestions = useMemo(() => {
    if (search.trim()) {
      return searchSuggestions;
    }
    
    // 最近搜索
    const recent = recentSearches.map((s, i) => ({
      id: `recent-${i}`,
      text: s,
      type: 'tag' as any,
      icon: 'fas fa-history',
      group: '最近搜索',
      onRemove: (e: any) => {
        e.stopPropagation();
        const newRecent = recentSearches.filter(item => item !== s);
        setRecentSearches(newRecent);
        saveRecentSearches(newRecent);
      }
    }));

    // 如果没有最近搜索，显示热门推荐
    if (recent.length === 0) {
      return [
        { id: 'hot-1', text: '国潮设计', type: 'tag' as any, icon: 'fas fa-fire', group: '为你推荐的点子' },
        { id: 'hot-2', text: '非遗传承', type: 'tag' as any, icon: 'fas fa-fire', group: '为你推荐的点子' },
        { id: 'hot-3', text: 'AI创作', type: 'tag' as any, icon: 'fas fa-fire', group: '为你推荐的点子' },
        { id: 'hot-4', text: '年画', type: 'tag' as any, icon: 'fas fa-fire', group: '为你推荐的点子' }
      ];
    }

    // 组合最近搜索和推荐（如果有空间）
    const recommendations = [
        { id: 'rec-1', text: '插画艺术', type: 'tag' as any, icon: 'fas fa-search', group: 'Pinterest 上的热门' },
        { id: 'rec-2', text: '界面设计', type: 'tag' as any, icon: 'fas fa-search', group: 'Pinterest 上的热门' },
        { id: 'rec-3', text: '摄影技巧', type: 'tag' as any, icon: 'fas fa-search', group: 'Pinterest 上的热门' }
    ];

    return [...recent, ...recommendations];
  }, [search, searchSuggestions, recentSearches, saveRecentSearches]);
  
  // 处理搜索建议选择
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setSearch(suggestion.text)
    setShowSearchDropdown(false)
    
    // 跳转到搜索结果页面
    navigate(`/search?query=${encodeURIComponent(suggestion.text)}`)
    
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
      saveRecentSearches(next)
      return next
    })
  }, [navigate, saveRecentSearches])  
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

  const [showShortcuts, setShowShortcuts] = useState(false)
  // 中文注释：滚动超过一定距离后显示"回到顶部"悬浮按钮，提升长页可用性
  const [showBackToTop, setShowBackToTop] = useState(false)

  // 中文注释：问题反馈弹层显示状态
  const [showFeedback, setShowFeedback] = useState(false)

  // 语言菜单ref
  const languageRef = useRef<HTMLDivElement | null>(null)
  // 语言菜单状态
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  

  
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
  
  // 初始化通知状态 - 从消息服务获取未读数量
  const [unreadCount, setUnreadCount] = useState(0)
  // 消息下拉菜单状态
  const [showMessageDropdown, setShowMessageDropdown] = useState(false)
  const messageDropdownRef = useRef<HTMLDivElement>(null)
  const messageButtonRef = useRef<HTMLButtonElement>(null)

  // 动态下拉菜单状态
  const [showFeedDropdown, setShowFeedDropdown] = useState(false)
  const [followingUsers, setFollowingUsers] = useState<{ id: string; name: string; avatar: string }[]>([])
  const [recentFeeds, setRecentFeeds] = useState<{ id: string; content: string; author: { name: string; avatar: string }; createdAt: string }[]>([])
  const feedDropdownRef = useRef<HTMLDivElement>(null)
  const feedButtonRef = useRef<HTMLButtonElement>(null)

  // 获取动态下拉菜单数据
  useEffect(() => {
    if (showFeedDropdown && user?.id) {
      Promise.all([
        feedService.getFollowingUsers(user.id),
        feedService.getFeeds({ limit: 10, type: 'all' })
      ]).then(([users, feedsData]) => {
        setFollowingUsers(users.slice(0, 5).map(u => ({ id: u.id, name: u.name, avatar: u.avatar })))
        setRecentFeeds(feedsData.feeds.slice(0, 6).map(f => ({
          id: f.id,
          content: f.content?.substring(0, 50) || '',
          author: { name: f.author.name, avatar: f.author.avatar },
          createdAt: f.createdAt
        })))
      }).catch(console.error)
    }
  }, [showFeedDropdown, user?.id])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 关闭消息下拉菜单
      if (
        messageDropdownRef.current &&
        !messageDropdownRef.current.contains(event.target as Node) &&
        messageButtonRef.current &&
        !messageButtonRef.current.contains(event.target as Node)
      ) {
        setShowMessageDropdown(false)
      }
      // 关闭动态下拉菜单
      if (
        feedDropdownRef.current &&
        !feedDropdownRef.current.contains(event.target as Node) &&
        feedButtonRef.current &&
        !feedButtonRef.current.contains(event.target as Node)
      ) {
        setShowFeedDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 监听用户变化，获取未读消息数量
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const count = await messageService.getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();

    // 订阅实时消息更新
    const unsubscribe = messageService.subscribeToMessages(user.id, () => {
      // 新消息到达时增加未读计数
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);



  // 中文注释：用户头像菜单相关状态与引用
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // 用户统计数据
  const [userStats, setUserStats] = useState({
    worksCount: 0,
    followersCount: 0,
    followingCount: 0
  })

  // 用户积分和等级数据
  const [userPoints, setUserPoints] = useState(0)
  const [creatorLevelInfo, setCreatorLevelInfo] = useState<{
    currentLevel: { level: number; name: string; icon: string; minPoints: number; maxPoints: number };
    nextLevel: { level: number; name: string; minPoints: number } | null;
    levelProgress: number;
    pointsToNextLevel: number;
  } | null>(null)

  // 获取用户统计数据和积分数据
  useEffect(() => {
    if (user?.id) {
      // 并行获取关注列表、粉丝列表和作品数量
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      Promise.all([
        getFollowingList().catch(() => []),
        getFollowersList().catch(() => []),
        // 获取作品数量 - 使用较大的limit确保获取所有作品
        token ? fetch(`/api/works?creator_id=${user.id}&limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        // 获取积分数据
        supabasePointsService.getUserBalance(user.id).catch(() => null)
      ]).then(([following, followers, worksResult, pointsBalance]) => {
        // API返回的是data数组，直接使用数组长度
        const worksCount = worksResult?.data?.length || 0;

        setUserStats({
          worksCount: worksCount,
          followersCount: followers.length,
          followingCount: following.length
        })

        // 设置积分数据
        const points = pointsBalance?.balance || 0
        const validPoints = Math.max(0, points)
        setUserPoints(validPoints)
        
        // 更新 achievementService 的积分状态
        achievementService['userPoints'] = validPoints
        
        // 获取等级信息
        const levelInfo = achievementService.getCreatorLevelInfo(user.id)
        setCreatorLevelInfo(levelInfo)
      })
    }
  }, [user?.id])

  // 中文注释：处理退出登录
  const handleLogout = async () => {
    try {
      await logout()
      toast.success(t('header.logoutSuccess') || '退出登录成功')
      navigate('/')
    } catch (error) {
      toast.error(t('header.logoutError') || '退出登录失败')
    }
  }

  // 中文注释：点击外部关闭用户菜单
  useEffect(() => {
    // 只在浏览器环境中添加事件监听
    if (typeof document === 'undefined') return

    const handler = (e: MouseEvent) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
        setShowThemeDropdown(false)
      }
    }
    if (showUserMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUserMenu])
  // 中文注释：处理更换头像文件上传
  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // 1. 上传图片到 Storage
      const avatarUrl = await uploadImage(file);
      
      // 2. 更新后端数据库
      await userService.updateUser({ avatar: avatarUrl });
      
      // 3. 更新 Supabase Auth Metadata
      if (supabase) {
        await supabase.auth.updateUser({
          data: { avatar: avatarUrl }
        });
      }
      
      // 4. 更新本地状态
      updateUser({ avatar: avatarUrl });
      
      toast.success('头像更新成功');
    } catch (error) {
      console.error('更换头像失败:', error);
      toast.error('更换头像失败，请重试');
      
      // 降级处理：如果上传失败，尝试使用 Base64 (仅本地预览，无法持久化)
      const reader = new FileReader()
      reader.onload = () => {
        const url = String(reader.result || '')
        if (url) {
          updateUser({ avatar: url })
          toast.info('已使用本地预览，请检查网络后重试持久化保存');
        }
      }
      reader.readAsDataURL(file)
    }

    setShowUserMenu(false)
    e.target.value = ''
  }

  // 中文注释：侧边栏最小宽度恢复为 180px，但折叠状态更宽
  const minW = 180
  const maxW = 320

  const onMouseDown = () => {
    // 只在浏览器环境中执行
    if (typeof document === 'undefined') return
    
    dragging.current = true
    document.body.style.cursor = 'col-resize'
  }

  // Use prefetch hook
  const { debouncedPrefetch, prefetch: prefetchRoute } = usePrefetch();

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
      // 拖拽时不立即保存，只在拖拽结束后保存
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = 'default'
      // 拖拽结束后保存状态，利用现有的debouncedSaveState逻辑
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [width, collapsed])



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
      
      // 消息中心快捷键
      if (e.key === 'n' && !isTyping) {
        e.preventDefault()
        navigate('/messages')
      }
      
      // ESC 键关闭各种弹出内容
      if (e.key === 'Escape') {
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
          '4': '/create/inspiration',
          '5': '/create/wizard',
          '6': '/square',
          '7': '/tianjin',
          '8': '/leaderboard',
          '9': '/about',
          '0': '/about',
        }
        const dest = map[e.key]
        if (dest) {
          // 简单的路径到ID映射，用于快捷键预加载
          const pathToId: Record<string, string> = {
            '/': 'home',
            '/explore': 'explore',
            '/create': 'create',
            '/create/inspiration': 'neo',
            '/create/wizard': 'wizard',
            '/square': 'square',
            '/tianjin': 'tianjin',
            '/leaderboard': 'leaderboard',
            '/about': 'about'
          }
          const id = pathToId[dest]
          if (id) prefetchRoute(id)
          navigate(dest)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleTheme, showFeedback, showUserMenu, showSearchDropdown, prefetchRoute, navigate, setCollapsed])

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



  // 中文注释：暗色主题下的导航项悬停效果优化，使用蓝色主题
  // 统一导航项高度和内边距，避免激活时布局变化
  // 平板端优化：在平板尺寸(md)下增加垂直内边距(py-3)，提升触摸体验；桌面端(lg)保持原样
  // 折叠状态下使用更紧凑的内边距
  const navItemClass = useMemo(() => (
    `${isDark ? 'hover:text-blue-200 hover:bg-blue-800/40 text-[13px]' : 'hover:bg-[var(--bg-hover)]'} flex items-center rounded-lg transition-all duration-200 ${collapsed ? 'justify-center py-2 px-2' : 'px-3 py-2.5'}`
  ), [isDark, collapsed])

  // 中文注释：主题激活态使用CSS变量，确保主题变化时样式同步更新
  // 优化激活状态样式，暗色主题使用蓝色渐变
  const activeClass = useMemo(() => (
    `${isDark ? 'bg-gradient-to-r from-blue-600/30 via-blue-500/15 to-transparent text-blue-300 border-l-2 border-blue-500 font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gradient-to-r from-red-50 to-red-100 text-[var(--text-primary)] border-b-2 border-red-600 font-semibold shadow-sm relative overflow-hidden group active-nav-item'} border-t border-transparent`
  ), [isDark])





  const title = useMemo(() => {
    const p = location.pathname
    if (p === '/') return t('common.home')
    if (p.startsWith('/explore')) return t('common.explore')

    if (p.startsWith('/about')) return t('common.about')
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
    if (p.startsWith('/create/inspiration')) return t('sidebar.inspirationEngine')

    if (p.startsWith('/wizard')) return t('sidebar.coCreationGuide')
    if (p.startsWith('/admin')) return t('common.adminConsole')
    return t('common.appName')
  }, [location.pathname, location.search, t])

  const onSearchSubmit = useCallback(() => {
    if (!search.trim()) return
    const q = search.trim()
    
    // 跳转到搜索结果页面
    navigate(`/search?query=${encodeURIComponent(q)}`)
    
    // 跟踪搜索事件
    searchService.trackSearchEvent({
      query: q,
      resultType: 'work',
      clicked: false,
      timestamp: Date.now()
    })
    
    // 更新最近搜索
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 6)
      saveRecentSearches(next)
      return next
    })
    
    setShowSearchDropdown(false)
  }, [search, navigate, saveRecentSearches])

  // 中文注释：根据查询参数精确判断当前激活的社群类型，避免两个导航同时高亮
  const isCommunityActive = (ctx: 'cocreation' | 'creator') => {
    const sp = new URLSearchParams(location.search)
    return location.pathname.startsWith('/community') && sp.get('context') === ctx
  }

  return (
    <div className={`flex min-h-screen ${isDark ? 'bg-gradient-to-br from-[#030712] via-[#0F172A] to-[#030712] text-gray-100' : theme === 'pink' ? 'bg-gradient-to-br from-[#fff0f5] via-[#ffe4ec] to-[#fff0f5] text-gray-900' : 'bg-white text-gray-900'} ${highContrastClasses} ${motionSafeClasses}`}>
      {/* 仅在桌面端显示侧边栏 */}
      <aside
        ref={sidebarRef}
        className={`hidden md:flex flex-col ${isDark ? 'bg-gradient-to-b from-[#0F172A] via-[#1E3A5F] to-[#0F172A] backdrop-blur-xl border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : theme === 'pink' ? 'bg-white/90 backdrop-blur-sm border-pink-200' : 'bg-white border-gray-200'} border-r relative ring-1 z-10 ${isDark ? 'ring-blue-500/30' : theme === 'pink' ? 'ring-pink-200' : 'ring-gray-200'}`}
        style={{ width: collapsed ? 80 : width, transition: 'width 0.2s ease-in-out' }}
        role="navigation"
        aria-label={t('sidebar.navigation')}
      >
        <div className={`${collapsed ? 'px-3' : 'px-4'} py-3 flex items-center justify-between rounded-lg transition-colors group ${isDark ? 'hover:bg-blue-900/30' : theme === 'pink' ? 'hover:bg-pink-50' : 'hover:bg-gray-50'}`}>
          <div className="flex items-center space-x-2 overflow-hidden">
            {!collapsed && <span className={`font-extrabold bg-gradient-to-r ${isDark ? 'from-blue-400 to-cyan-400' : 'from-red-600 to-rose-500'} bg-clip-text text-transparent tracking-tight whitespace-nowrap`}>{t('common.appNameBrand')}</span>}
            {!collapsed && <span className={`font-bold ${isDark ? 'text-blue-100' : ''} whitespace-nowrap`}>{t('common.appNameProduct')}</span>}
          </div>
          <div className="flex items-center justify-center">
            {/* 展开/收缩按钮 */}
            <button
              className={`${collapsed ? 'p-3' : 'p-2'} rounded-xl transition-all bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95`}
              onClick={() => {
                setCollapsed(!collapsed);
              }}
              aria-label={collapsed ? '展开侧边栏' : '收缩侧边栏'}
              title={collapsed ? '展开侧边栏' : '收缩侧边栏'}
            >
              <i className={`fas ${collapsed ? 'fa-toggle-off' : 'fa-toggle-on'} text-white ${collapsed ? 'text-xl' : 'text-base'} transition-transform group-hover:scale-110 drop-shadow-sm`}></i>
            </button>

          </div>
        </div>

        <nav className={`px-2 pt-2 pb-4 ${collapsed ? 'space-y-1.5' : 'space-y-3'}`}>
          {navigationGroups.map((group) => (
            <motion.div
              key={group.id}
              className={`rounded-xl ${isDark ? 'bg-blue-900/20 backdrop-blur-md border border-blue-500/30' : 'bg-gray-50 border border-gray-100'} ${collapsed ? 'p-2' : 'p-3'} transition-all duration-300 hover:shadow-md dark:hover:shadow-lg hover:shadow-gray-100/50 dark:hover:shadow-blue-900/30`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: getDuration(0.3), delay: getDelay(0.1) }}
            >
              {!collapsed && (
                <motion.h3
                  className={`${isDark ? 'text-[11px] text-blue-300/80' : 'text-[12px] text-blue-600'} font-medium mb-2.5 flex items-center transition-all duration-300 ease-in-out opacity-100`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: getDuration(0.2), delay: getDelay(0.1) }}
                >
                  <span className="mr-1.5 w-1 h-1 rounded-full bg-blue-400/60"></span>
                  <span className="tracking-wide">{t(navGroupIdToTranslationKey[group.id] || group.title)}</span>
                </motion.h3>
              )}
              <div className={`${collapsed ? 'space-y-1' : 'space-y-1.5'}`}>
                {group.items.map((item, index) => (
                  <NavLink
                    key={item.id}
                    to={`${item.path}${item.search || ''}`}
                    title={collapsed ? item.label : undefined}
                    onMouseEnter={() => debouncedPrefetch(item.id)}
                    className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : (isDark ? 'text-white' : 'text-gray-700')} relative overflow-hidden group ${collapsed ? 'justify-center px-2 py-2' : ''}`}
                    end
                  >
                    <i className={`fas ${item.icon} ${collapsed ? 'mr-0 text-xl' : 'mr-3 text-base'} transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 ${isDark ? 'text-white' : 'text-current'} ${collapsed ? 'w-8' : 'w-5'} text-center flex-shrink-0`}></i>
                    {!collapsed && (
                      <span
                        className="flex-1 transition-all duration-300 ease-in-out opacity-100 truncate font-medium"
                      >
                        {navItemIdToTranslationKey[item.id] ? t(navItemIdToTranslationKey[item.id]) : item.label}
                      </span>
                    )}
                    {item.badge && !collapsed && (
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-red-100 text-red-700'} font-medium`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          ))}
        </nav>

        {/* 中文注释：侧栏保留预留的社群模块占位，后续再完善 */}

        {/* 中文注释：原侧边栏底部“主题切换”入口移除，改在首页右下角提供统一入口 */}

        {!collapsed && (
          <div
            onMouseDown={onMouseDown}
            className={`absolute top-0 right-0 h-full w-1 cursor-col-resize ${isDark ? 'bg-blue-600/50 hover:bg-blue-500' : 'bg-gray-200'}`}
          />
        )}
      </aside>
      {/* 中文注释：恢复点击自动收起功能，但优化实现方式避免跳动 */}
      <div 
        className="flex-1 min-w-0 md:pb-0 pb-16 flex flex-col overflow-y-auto relative z-10"
        onClick={(e) => {
          // 确保点击的不是内部的可交互元素
          const target = e.target as HTMLElement;
          // 只在点击主内容区域且侧边栏展开时收起侧边栏，不拦截导航链接等可交互元素
          if (!collapsed && !target.closest('button, input, a, [role="menu"], [role="dialog"], nav, [data-discover="true"]')) {
            setCollapsed(true);
          }
        }}
      >
        {/* 中文注释：暗色头部采用蓝色渐变背景与毛玻璃 - 在管理后台页面隐藏 */}
        {!location.pathname.startsWith('/admin') && (
        <motion.header
          className={`sticky top-0 z-[60] ${isDark ? 'bg-gradient-to-r from-[#0F172A]/98 via-[#1E3A5F]/95 to-[#0F172A]/98 backdrop-blur-xl text-blue-50 shadow-[0_4px_20px_rgba(59,130,246,0.15)]' : theme === 'pink' ? 'bg-white/80 backdrop-blur-sm' : 'bg-white'} border-b ${isDark ? 'border-blue-500/50' : theme === 'pink' ? 'border-pink-200' : 'border-gray-200'} px-4 py-3`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: getDuration(0.5), delay: getDelay(0.1) }}
          style={{ overflow: 'visible' }}
        >
          <div className="flex items-center justify-end">
            <motion.div 
              className="flex items-center gap-3 flex-1 min-w-0 justify-end"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: getDuration(0.3), delay: getDelay(0.2) }}
            >
              {/* 搜索框 - 靠右对齐 */}
              <motion.div
                className="relative search-container flex-1 w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: getDuration(0.3), delay: getDelay(0.2) }}
                style={{ overflow: 'visible' }}
              >
                <SearchBar
                  search={search}
                  setSearch={handleSearchChange}
                  showSuggest={showSearchDropdown}
                  setShowSuggest={setShowSearchDropdown}
                  suggestions={displaySuggestions}
                  isDark={isDark}
                  onSearch={onSearchSubmit}
                  onSuggestionSelect={handleSuggestionSelect}
                  userId={user?.id || null}
                />
              </motion.div>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-2 flex-shrink-0 ml-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: getDuration(0.3), delay: getDelay(0.2) }}
              style={{ overflow: 'visible' }}
            >
              <div className="flex items-center space-x-3" style={{ overflow: 'visible' }}>
              {/* 用户头像 - B站风格头像覆盖卡片 */}
              {isAuthenticated && (
                <motion.div
                  className="relative cursor-pointer"
                  ref={userMenuRef}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: getDuration(0.3), delay: getDelay(0.3) }}
                  onMouseEnter={() => setShowUserMenu(true)}
                  onMouseLeave={() => setShowUserMenu(false)}
                  onClick={() => {
                    if (!showUserMenu) {
                      navigate('/dashboard')
                    }
                  }}
                >
                  <motion.div
                    className="flex items-center group relative z-10"
                    aria-label="用户菜单"
                    aria-expanded={showUserMenu}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {user?.avatar && user.avatar.trim() ? (
                      <div className={`relative h-14 w-14 rounded-full overflow-hidden transition-all duration-300 ${showUserMenu ? 'shadow-2xl scale-110' : 'group-hover:shadow-xl'}`}>
                        <img 
                          src={user.avatar} 
                          alt={user?.username || '用户头像'} 
                          className="h-full w-full rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const defaultAvatar = document.createElement('div');
                              defaultAvatar.className = `absolute inset-0 rounded-full flex items-center justify-center text-white font-bold text-xl ${isDark ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-orange-400 to-pink-500'}`;
                              defaultAvatar.textContent = user?.username?.charAt(0) || 'U';
                              parent.appendChild(defaultAvatar);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-300 ${showUserMenu ? 'shadow-xl' : 'group-hover:shadow-lg'} ${isDark ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-orange-400 to-pink-500'}`}>
                        {user?.username?.charAt(0) || 'U'}
                      </div>
                    )}
                  </motion.div>
                  {showUserMenu && (
                    <motion.div
                      className={`absolute right-[-120px] top-12 w-72 rounded-2xl shadow-2xl z-[70] ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
                      role="menu"
                      aria-label="用户菜单"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: getDuration(0.2), delay: getDelay(0.1) }}
                      onMouseEnter={() => setShowUserMenu(true)}
                      onMouseLeave={() => setShowUserMenu(false)}
                    >
                      {/* 用户信息区域 */}
                      <div className={`pt-3 pb-3 px-5 text-center border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                        {/* 用户名 */}
                        <h3 className={`font-bold text-base mt-1 mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.username}</h3>
                        
                        {/* 等级进度条 - 使用积分系统 - 点击跳转到成就页面 */}
                        <div
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); navigate('/achievement-museum'); }}
                        >
                          {creatorLevelInfo ? (
                            <>
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${isDark ? 'bg-[#C02C38]/20 text-[#C02C38]' : 'bg-[#C02C38]/10 text-[#C02C38]'}`}>
                                  {creatorLevelInfo.currentLevel.name}
                                </span>
                                <div className={`w-32 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                  <div 
                                    className="h-full bg-gradient-to-r from-[#C02C38] to-[#F59E0B] rounded-full transition-all duration-500"
                                    style={{ width: `${creatorLevelInfo.levelProgress}%` }}
                                  ></div>
                                </div>
                                {creatorLevelInfo.nextLevel && (
                                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {creatorLevelInfo.nextLevel.name}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                当前积分 <span className="font-medium">{userPoints.toLocaleString()}</span>
                                {creatorLevelInfo.nextLevel && (
                                  <>，距离 <span className="text-[#C02C38] font-medium">{creatorLevelInfo.nextLevel.name}</span> 还需 <span className="font-medium">{creatorLevelInfo.pointsToNextLevel}</span> 积分</>
                                )}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${isDark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600'}`}>LV4</span>
                                <div className={`w-32 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                  <div className="h-full w-3/5 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"></div>
                                </div>
                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>LV5</span>
                              </div>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>当前成长6443，距离升级Lv.5还需要4357</p>
                            </>
                          )}
                        </div>
                        
                        {/* 统计数据 */}
                        <div className="flex items-center justify-center gap-8 mt-3 pt-3 border-t border-dashed border-gray-300/30">
                          <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); navigate('/friends'); }}>
                            <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{userStats.followingCount}</p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>关注</p>
                          </div>
                          <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); navigate('/friends'); }}>
                            <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{userStats.followersCount}</p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>粉丝</p>
                          </div>
                          <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); navigate('/dashboard'); }}>
                            <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{userStats.worksCount}</p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>作品</p>
                          </div>
                        </div>
                      </div>

                      {/* 会员推广卡片 */}
                      {user?.membershipStatus === 'active' ? (
                        <div
                          className={`px-3 py-2 mx-3 mt-3 rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 ${isDark ? 'bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/25' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUserMenu(false);
                            navigate('/membership');
                          }}
                        >
                          <p className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                            {user?.membershipLevel === 'vip' ? 'VIP会员' : '高级会员'} 生效中
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>享受专属特权与服务</p>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium transition-all duration-200 ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-white text-amber-600 shadow-sm border border-amber-200'}`}
                            >
                              会员中心
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`px-3 py-2 mx-3 mt-3 rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 ${isDark ? 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-500/25' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUserMenu(false);
                            navigate('/membership');
                          }}
                        >
                          <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>升级会员解锁更多功能</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>享受无限创作与专属特权</p>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium transition-all duration-200 ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-white text-blue-600 shadow-sm border border-blue-200'}`}
                            >
                              立即升级
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 菜单项 */}
                      <ul className="py-2 px-2">
                        {[
                          { label: '个人中心', path: '/dashboard', icon: 'fa-user' },
                          { label: '数据分析', path: '/analytics', icon: 'fa-chart-line' },
                          { label: '设置', path: '/settings', icon: 'fa-cog' }
                        ].map((item, index) => (
                          <motion.li
                            key={item.label}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: getDuration(0.1), delay: getDelay(0.05 * index) }}
                          >
                            <button
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group/item ${isDark ? 'hover:bg-gray-700/50 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowUserMenu(false);
                                navigate(item.path);
                              }}
                            >
                              <i className={`fas ${item.icon} w-5 text-center text-base transition-colors ${isDark ? 'text-gray-400 group-hover/item:text-pink-400' : 'text-gray-400 group-hover/item:text-pink-500'}`}></i>
                              <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                              <i className="fas fa-chevron-right text-xs text-gray-300 group-hover/item:text-gray-400 transition-all transform group-hover/item:translate-x-1"></i>
                            </button>
                          </motion.li>
                        ))}
                        {/* 返回官网 - 跳转到官网落地页 */}
                        <motion.li
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: getDuration(0.1), delay: getDelay(0.15) }}
                        >
                          <button
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group/item ${isDark ? 'hover:bg-gray-700/50 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowUserMenu(false);
                              window.location.href = '/landing.html';
                            }}
                          >
                            <i className={`fas fa-home w-5 text-center text-base transition-colors ${isDark ? 'text-gray-400 group-hover/item:text-pink-400' : 'text-gray-400 group-hover/item:text-pink-500'}`}></i>
                            <span className="flex-1 text-left text-sm font-medium">返回官网</span>
                            <i className="fas fa-chevron-right text-xs text-gray-300 group-hover/item:text-gray-400 transition-all transform group-hover/item:translate-x-1"></i>
                          </button>
                        </motion.li>
                      </ul>

                      {/* 主题切换 */}
                      <div className={isDark ? 'border-t border-gray-700/50 py-1 px-2' : 'border-t border-gray-100 py-1 px-2'}>
                        <button
                          className={isDark ? 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-200 hover:bg-gray-700/50' : 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowThemeDropdown(!showThemeDropdown);
                          }}
                        >
                          <i className="fas fa-moon w-5 text-center text-base text-gray-400"></i>
                          <span className="flex-1 text-left text-sm font-medium">主题: {themeConfig.find(t => t.value === theme)?.label || '浅色'}</span>
                          <i className={showThemeDropdown ? 'fas fa-chevron-down text-xs text-gray-400' : 'fas fa-chevron-right text-xs text-gray-400'}></i>
                        </button>
                        {/* 主题下拉菜单 */}
                        {showThemeDropdown && (
                          <div className={isDark ? 'mt-1 rounded-lg max-h-48 overflow-y-auto bg-gray-900/50 border border-gray-700/50' : 'mt-1 rounded-lg max-h-48 overflow-y-auto bg-gray-50 border border-gray-200'}>
                            <ul className="py-1">
                              {themeConfig.map((themeOption) => (
                                <li key={themeOption.value}>
                                  <button
                                    className={theme === themeOption.value ? (isDark ? 'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors bg-gray-700 text-white' : 'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors bg-gray-200 font-semibold') : (isDark ? 'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-gray-700 text-gray-200' : 'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors hover:bg-gray-100 text-gray-700')}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTheme(themeOption.value);
                                      setShowThemeDropdown(false);
                                    }}
                                  >
                                    <i className={`${themeOption.icon} w-4 text-center`}></i>
                                    <span className="flex-1">{themeOption.label}</span>
                                    {theme === themeOption.value && <i className="fas fa-check text-xs text-green-500"></i>}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {/* 退出登录 */}
                      <div className={`border-t ${isDark ? 'border-gray-700/50' : 'border-gray-100'} py-2 px-2 mb-1`}>
                        <motion.button 
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group/item ${isDark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: getDuration(0.1), delay: getDelay(0.3) }}
                        >
                          <i className="fas fa-sign-out-alt w-5 text-center text-lg"></i>
                          <span className="flex-1 text-left text-sm font-medium">{t('header.logout')}</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              

              
              {/* 问题反馈入口 */}
              <motion.button
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 ${isDark ? 'hover:bg-blue-800/30 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                aria-label={t('header.feedback')}
                title={t('header.feedback')}
                onClick={() => setShowFeedback(true)}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-bug text-lg"></i>
                <span className="text-[10px]">反馈</span>
              </motion.button>
              {/* 好友管理按钮 */}
              <motion.button
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 ${isDark ? 'hover:bg-blue-800/30 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                aria-label="好友"
                title="好友"
                onClick={() => navigate('/friends')}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <i className="fas fa-user-friends text-lg"></i>
                  {friendRequests && friendRequests.length > 0 && (
                    <motion.span
                      className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      {friendRequests.length > 99 ? '99+' : friendRequests.length}
                    </motion.span>
                  )}
                </div>
                <span className="text-[10px]">好友</span>
              </motion.button>

              {/* 动态入口 - 带下拉菜单 */}
              <div 
                className="relative inline-block"
                onMouseEnter={() => {
                  setShowFeedDropdown(true)
                  setShowMessageDropdown(false)
                }}
                onMouseLeave={() => {
                  setTimeout(() => setShowFeedDropdown(false), 200)
                }}
              >
                <motion.button
                  ref={feedButtonRef}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 ${isDark ? 'hover:bg-blue-800/30 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  aria-label="动态"
                  title="查看动态"
                  onClick={() => navigate('/feed')}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fas fa-rss text-lg"></i>
                  <span className="text-[10px]">动态</span>
                </motion.button>

                {/* 动态下拉菜单 - 关注用户 + 最近动态 */}
                {showFeedDropdown && (
                  <motion.div
                    ref={feedDropdownRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`absolute top-full -left-12 mt-2 w-80 rounded-lg shadow-xl z-[100] overflow-hidden ${
                      isDark ? 'bg-[#1a1a2e] border border-gray-700/50' : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* 关注用户 */}
                    <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                      <div className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>关注</div>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {followingUsers.length > 0 ? (
                          followingUsers.map(user => (
                            <button
                              key={user.id}
                              onClick={() => {
                                navigate(`/author/${user.id}`)
                                setShowFeedDropdown(false)
                              }}
                              className="flex-shrink-0 flex flex-col items-center gap-1"
                            >
                              <img
                                src={user.avatar || '/default-avatar.png'}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-transparent hover:border-pink-500 transition-colors"
                              />
                              <span className={`text-xs truncate max-w-[50px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {user.name}
                              </span>
                            </button>
                          ))
                        ) : (
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>暂无关注</span>
                        )}
                      </div>
                    </div>

                    {/* 最近动态 */}
                    <div className="max-h-80 overflow-y-auto">
                      <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                        <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最新动态</div>
                      </div>
                      <div className="py-1">
                        {recentFeeds.length > 0 ? (
                          recentFeeds.map(feed => (
                            <button
                              key={feed.id}
                              onClick={() => {
                                navigate(`/post/${feed.id}`)
                                setShowFeedDropdown(false)
                              }}
                              className={`w-full px-3 py-2 flex items-start gap-2 transition-colors ${
                                isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <img
                                src={feed.author.avatar || '/default-avatar.png'}
                                alt={feed.author.name}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0 text-left">
                                <div className={`text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {feed.author.name}
                                </div>
                                <div className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {feed.content}...
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className={`px-3 py-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            暂无动态
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 查看更多 */}
                    <button
                      onClick={() => {
                        navigate('/feed')
                        setShowFeedDropdown(false)
                      }}
                      className={`w-full py-2 text-center text-sm border-t transition-colors ${
                        isDark
                          ? 'border-gray-700/50 text-gray-400 hover:bg-gray-800/50'
                          : 'border-gray-100 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      查看更多动态 →
                    </button>
                  </motion.div>
                )}
              </div>

              {/* 消息入口 - 带下拉菜单 */}
              <div 
                className="relative inline-block"
                onMouseEnter={() => {
                  setShowMessageDropdown(true)
                  setShowFeedDropdown(false)
                }}
                onMouseLeave={() => {
                  setTimeout(() => setShowMessageDropdown(false), 200)
                }}
              >
                <motion.button
                  ref={messageButtonRef}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 ${isDark ? 'hover:bg-blue-800/30 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  aria-label="消息"
                  title="消息"
                  onClick={() => navigate('/messages')}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="relative">
                    <i className="fas fa-bell text-lg"></i>
                    {unreadCount > 0 && (
                      <motion.span
                        className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </motion.span>
                    )}
                  </div>
                  <span className="text-[10px]">消息</span>
                </motion.button>

                {/* 消息下拉菜单 */}
                {showMessageDropdown && (
                  <motion.div
                    ref={messageDropdownRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={`absolute top-full -left-12 mt-2 w-40 py-2 rounded-lg shadow-xl z-[100] ${
                      isDark
                        ? 'bg-[#1a1a2e] border border-gray-700/50'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* 下拉菜单项 */}
                    <button
                      onClick={() => {
                        navigate('/messages?category=reply')
                        setShowMessageDropdown(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        isDark
                          ? 'text-gray-300 hover:bg-gray-800/50'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      回复我的
                    </button>
                    <button
                      onClick={() => {
                        navigate('/messages?category=mention')
                        setShowMessageDropdown(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        isDark
                          ? 'text-gray-300 hover:bg-gray-800/50'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      @我的
                    </button>
                    <button
                      onClick={() => {
                        navigate('/messages?category=like')
                        setShowMessageDropdown(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        isDark
                          ? 'text-gray-300 hover:bg-gray-800/50'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      收到的赞
                    </button>
                    <button
                      onClick={() => {
                        navigate('/messages?category=system')
                        setShowMessageDropdown(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        isDark
                          ? 'text-gray-300 hover:bg-gray-800/50'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      系统消息
                    </button>
                    <div className={`mx-3 my-1.5 h-px ${isDark ? 'bg-gray-700/50' : 'bg-gray-200'}`} />
                    <button
                      onClick={() => {
                        navigate('/messages')
                        setShowMessageDropdown(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                        isDark
                          ? 'text-gray-300 hover:bg-gray-800/50'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>我的消息</span>
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </motion.div>
                )}
              </div>

              {/* 收藏入口 */}
              <motion.button
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 ${isDark ? 'hover:bg-blue-800/30 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                aria-label="收藏"
                title="收藏"
                onClick={() => navigate('/collection')}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-star text-lg"></i>
                <span className="text-[10px]">收藏</span>
              </motion.button>

              {/* 草稿箱入口 */}
              <motion.button
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 ${isDark ? 'hover:bg-blue-800/30 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                aria-label="草稿箱"
                title="草稿箱"
                onClick={() => navigate('/drafts')}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-file-alt text-lg"></i>
                <span className="text-[10px]">草稿箱</span>
              </motion.button>

              {/* 历史记录入口 */}
              <motion.button
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 ${isDark ? 'hover:bg-blue-800/30 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                aria-label="历史记录"
                title="历史记录"
                onClick={() => navigate('/history')}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-history text-lg"></i>
                <span className="text-[10px]">历史</span>
              </motion.button>

              {/* 我的活动入口 */}
              <motion.button
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 ${isDark ? 'hover:bg-blue-800/30 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                aria-label="我的活动"
                title="我的活动"
                onClick={() => navigate('/my-activities')}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-calendar-alt text-lg"></i>
                <span className="text-[10px]">我的活动</span>
              </motion.button>

              {/* 创作者仪表盘 - 已移除 */}

              {/* 去创作按钮 - 模仿B站投稿按钮 */}
              {isAuthenticated && (
                <motion.button
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#ff6699] hover:bg-[#ff4d88] text-white font-medium text-sm transition-colors duration-200"
                  aria-label="发布"
                  title="发布"
                  onClick={() => navigate('/create')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <i className="fas fa-upload text-sm"></i>
                  <span>发布</span>
                </motion.button>
              )}

              {!isAuthenticated && (
                <NavLink
                  to="/login"
                  className={`px-3 py-1 rounded-md ${isDark ? 'bg-gray-800 ring-1 ring-gray-700 text-white' : 'bg-white ring-1 ring-gray-200 text-gray-900'} transition-all duration-300 hover:bg-primary/10 hover:ring-primary/50 hover:shadow-sm`}
                >
                  {t('header.login')}
                </NavLink>
              )}
              </div>
            </motion.div>
          </div>
          {/* 面包屑导航 */}

        </motion.header>
        )}

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

        {/* 移动端底部导航栏 */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800 z-50">
          <div className="flex justify-around items-center h-16">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => `flex flex-col items-center justify-center px-3 py-2 transition-all ${isActive ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400'}`}
                title={item.label}
              >
                <i className={`fas ${item.icon} text-lg mb-1`}></i>
                <span className="text-xs">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
