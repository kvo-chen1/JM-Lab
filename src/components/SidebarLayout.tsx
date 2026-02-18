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
import { uploadImage } from '@/services/imageService'
import { supabase } from '@/lib/supabase'

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
import NotificationPanel, { Notification, NotificationSettings } from './NotificationPanel'



interface SidebarLayoutProps {
  children: React.ReactNode
}

export default memo(function SidebarLayout({ children }: SidebarLayoutProps) {
  const { theme = 'light', isDark = false, toggleTheme = () => {}, setTheme = () => {} } = useTheme()
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

  const [showNotifications, setShowNotifications] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  // 中文注释：滚动超过一定距离后显示"回到顶部"悬浮按钮，提升长页可用性
  const [showBackToTop, setShowBackToTop] = useState(false)

  // 中文注释：问题反馈弹层显示状态
  const [showFeedback, setShowFeedback] = useState(false)

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
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  
  // 监听用户变化，根据用户类型加载通知数据
  useEffect(() => {
    console.log('[SidebarLayout] User changed:', user?.id, 'isAuthenticated:', isAuthenticated);
    if (!user) {
      console.log('[SidebarLayout] No user, clearing notifications');
      setNotifications([])
      return
    }

    if (!user.id.startsWith('phone_user_')) {
      console.log('[SidebarLayout] Fetching notifications for user:', user.id);
      const fetchNotifications = async () => {
        try {
          const token = localStorage.getItem('token');
          console.log('[SidebarLayout] Token exists:', !!token);
          // 如果没有 token，不调用需要认证的 API
          if (!token) {
            console.log('[SidebarLayout] No token, skipping notifications fetch');
            setNotifications([]);
            return;
          }
          console.log('[SidebarLayout] Calling /api/notifications...');
          const response = await fetch('/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('[SidebarLayout] Response status:', response.status);
          // 如果返回 401，静默处理，不显示错误
          if (response.status === 401) {
            setNotifications([]);
            return;
          }
          const data = await response.json();
          if (data.code === 0 && data.data && Array.isArray(data.data.list)) {
            // 映射后端通知类型到前端 category
            const mapNotificationType = (type: string): Notification['category'] => {
              const typeMap: Record<string, Notification['category']> = {
                'system': 'system',
                'message': 'message',
                'like': 'like',
                'join': 'join',
                'mention': 'mention',
                'task': 'task',
                'points': 'points',
                'learning': 'learning',
                'creation': 'creation',
                'social': 'social',
                'ranking_published': 'system'
              };
              return typeMap[type] || 'system';
            };

            const mappedNotifications: Notification[] = data.data.list.map((n: any) => {
              // 根据通知类型生成 actionUrl
              let actionUrl: string | undefined;
              // PostgreSQL 返回的 JSONB 字段
              const notificationData = n.data;
              if (notificationData && typeof notificationData === 'object') {
                if (notificationData.event_id) {
                  actionUrl = `/events/${notificationData.event_id}`;
                } else if (notificationData.work_id) {
                  actionUrl = `/works/${notificationData.work_id}`;
                } else if (notificationData.user_id) {
                  actionUrl = `/profile/${notificationData.user_id}`;
                }
              }

              return {
                id: n.id.toString(),
                title: n.title,
                description: n.content,
                time: new Date(n.created_at).toLocaleString(),
                read: n.is_read,
                type: n.type === 'warning' ? 'warning' : n.type === 'success' ? 'success' : 'info',
                category: mapNotificationType(n.type),
                actionUrl,
                timestamp: new Date(n.created_at).getTime(),
                sound: false
              };
            });
            setNotifications(mappedNotifications);
          }
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
        }
      };
      fetchNotifications();
    } else {
       // Phone user: load mock data
       const now = Date.now()
       setNotifications([
        { id: 'n1', title: t('notification.welcome'), description: t('notification.dailyReward'), time: t('notification.justNow'), read: false, type: 'success', category: 'system', timestamp: now },
        { id: 'n2', title: t('notification.systemUpdate'), description: t('notification.systemUpdateDesc'), time: `1 ${t('notification.hoursAgo')}`, read: false, type: 'info', category: 'system', timestamp: now - 3600000 },
        { id: 'n3', title: t('notification.newTutorial'), description: t('notification.newTutorialDesc'), time: t('notification.daysAgo'), read: true, type: 'info', category: 'learning', timestamp: now - 86400000 },
        { id: 'n4', title: t('notification.workLiked'), description: t('notification.workLikedDesc'), time: `2 ${t('notification.hoursAgo')}`, read: false, type: 'success', category: 'like', timestamp: now - 7200000 },
        { id: 'n5', title: t('notification.newMember'), description: t('notification.newMemberDesc'), time: `30 ${t('notification.minutesAgo')}`, read: false, type: 'info', category: 'join', timestamp: now - 1800000 },
        { id: 'n6', title: t('notification.privateMessage'), description: t('notification.privateMessageDesc'), time: `1 ${t('notification.hoursAgo')}`, read: false, type: 'info', category: 'message', timestamp: now - 3600000 },
        { id: 'n7', title: t('notification.mention'), description: t('notification.mentionDesc'), time: `2 ${t('notification.hoursAgo')}`, read: false, type: 'info', category: 'mention', timestamp: now - 7200000 },
        { id: 'n8', title: t('notification.taskCompleted'), description: t('notification.taskCompletedDesc'), time: `3 ${t('notification.hoursAgo')}`, read: true, type: 'success', category: 'task', timestamp: now - 10800000 },
        { id: 'n9', title: t('notification.pointsAdded'), description: t('notification.pointsAddedDesc'), time: `4 ${t('notification.hoursAgo')}`, read: false, type: 'success', category: 'points', timestamp: now - 14400000 },
        { id: 'n10', title: t('notification.systemWarning'), description: t('notification.systemWarningDesc'), time: `5 ${t('notification.hoursAgo')}`, read: true, type: 'warning', category: 'system', timestamp: now - 18000000 },
      ])
    }
  }, [user, t]);

  // 移除本地存储同步，确保数据隔离
  /*
  useEffect(() => {
    debouncedSave('notifications', notifications)
  }, [notifications, debouncedSave])
  */

  // 使用防抖函数保存通知设置
  const debouncedSaveNotificationSettings = useCallback(debounce(() => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    }
  }, 200), [notificationSettings])
  
  // 保存通知设置到本地存储 - 使用防抖函数优化
  useEffect(() => {
    debouncedSaveNotificationSettings()
  }, [notificationSettings, debouncedSaveNotificationSettings])
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

  // 中文注释：侧边栏最小宽度从 200px 调整为 180px，使默认更紧凑
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
      time: t('notification.justNow'),
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
  }, [toggleTheme, showNotifications, showFeedback, showUserMenu, showSearchDropdown, prefetchRoute, navigate, setCollapsed])

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
  const navItemClass = useMemo(() => (
    `${isDark ? 'hover:text-blue-200 hover:bg-blue-800/40 text-[13px]' : 'hover:bg-[var(--bg-hover)]'} flex items-center px-3 py-2 md:py-3 lg:py-2 rounded-lg transition-all duration-200`
  ), [isDark])

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
    
    // 直接跳转到津脉广场（square）并带上搜索关键词
    navigate(`/square?search=${encodeURIComponent(q)}`)
    
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
        style={{ width: collapsed ? 72 : width, transition: 'width 0.2s ease-in-out' }}
        role="navigation"
        aria-label={t('sidebar.navigation')}
      >
        <div className={`px-4 py-3 flex items-center justify-between rounded-lg transition-colors group ${isDark ? 'hover:bg-blue-900/30' : theme === 'pink' ? 'hover:bg-pink-50' : 'hover:bg-gray-50'}`}>
          <div className="flex items-center space-x-2 overflow-hidden">
            {!collapsed && <span className={`font-extrabold bg-gradient-to-r ${isDark ? 'from-blue-400 to-cyan-400' : 'from-red-600 to-rose-500'} bg-clip-text text-transparent tracking-tight whitespace-nowrap`}>{t('common.appNameBrand')}</span>}
            {!collapsed && <span className={`font-bold ${isDark ? 'text-blue-100' : ''} whitespace-nowrap`}>{t('common.appNameProduct')}</span>}
          </div>
          <div className="flex items-center space-x-1">
            {/* 展开/收缩按钮 */}
            <button
              className={`p-2 rounded-lg ring-1 transition-all ${isDark ? 'hover:bg-blue-800/50 ring-blue-500/50 hover:ring-blue-400 hover:ring-2' : 'hover:bg-gray-100 ring-gray-200 hover:ring-2'} hover:shadow-sm ${!collapsed ? (isDark ? 'ring-blue-500' : 'ring-blue-500') : ''}`}
              onClick={() => {
                setCollapsed(!collapsed);
              }}
              aria-label={collapsed ? '展开侧边栏' : '收缩侧边栏'}
              title={collapsed ? '展开侧边栏' : '收缩侧边栏'}
            >
              <i className={`fas ${collapsed ? 'fa-toggle-off' : `fa-toggle-on ${isDark ? 'text-blue-400' : 'text-blue-500'}`} ${isDark ? 'text-blue-200' : 'text-gray-500'} transition-transform group-hover:scale-110`}></i>
            </button>

          </div>
        </div>

        <nav className="px-2 pt-3 pb-4 space-y-3">
          {navigationGroups.map((group) => (
            <motion.div
              key={group.id}
              className={`rounded-xl ${isDark ? 'bg-blue-900/20 backdrop-blur-md border border-blue-500/30' : 'bg-gray-50 border border-gray-100'} p-3 transition-all duration-300 hover:shadow-md dark:hover:shadow-lg hover:shadow-gray-100/50 dark:hover:shadow-blue-900/30`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: getDuration(0.3), delay: getDelay(0.1) }}
            >
              {!collapsed && (
                <motion.h3
                  className={`${isDark ? 'text-[10px] text-blue-300' : 'text-[11px] text-blue-600'} font-semibold mb-2 uppercase tracking-wider flex items-center transition-all duration-300 ease-in-out opacity-100`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: getDuration(0.2), delay: getDelay(0.1) }}
                >
                  <span className="mr-2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="relative overflow-hidden">
                    <span className="relative z-10">{t(navGroupIdToTranslationKey[group.id] || group.title)}</span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-current transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </span>
                </motion.h3>
              )}
              <div className="space-y-1.5">
                {group.items.map((item, index) => (
                  <NavLink 
                    key={item.id}
                    to={`${item.path}${item.search || ''}`}
                    title={collapsed ? item.label : undefined} 
                    onMouseEnter={() => debouncedPrefetch(item.id)} 
                    className={({ isActive }) => `${navItemClass} ${isActive ? activeClass : (isDark ? 'text-[#E2E8F0]' : 'text-gray-700')} relative overflow-hidden group ${collapsed ? 'justify-center px-2 py-2.5' : ''}`}
                    end
                  > 
                    <i className={`fas ${item.icon} ${collapsed ? 'mr-0' : 'mr-3'} transition-all duration-300 group-hover:scale-110 group-hover:rotate-5 text-current`}></i>
                    {!collapsed && (
                      <span 
                        className="transition-all duration-300 ease-in-out opacity-100 truncate font-medium"
                      >
                        {navItemIdToTranslationKey[item.id] ? t(navItemIdToTranslationKey[item.id]) : item.label}
                      </span>
                    )}
                    {item.badge && (
                      <span
                        className={`ml-auto px-2 py-0.5 text-xs rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-red-100 text-red-700'} font-medium`}
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
        {/* 中文注释：暗色头部采用蓝色渐变背景与毛玻璃 */}
        <motion.header
          className={`sticky top-0 z-[60] ${isDark ? 'bg-gradient-to-r from-[#0F172A]/98 via-[#1E3A5F]/95 to-[#0F172A]/98 backdrop-blur-xl text-blue-50 shadow-[0_4px_20px_rgba(59,130,246,0.15)]' : theme === 'pink' ? 'bg-white/80 backdrop-blur-sm' : 'bg-white'} border-b ${isDark ? 'border-blue-500/50' : theme === 'pink' ? 'border-pink-200' : 'border-gray-200'} px-4 py-3`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: getDuration(0.5), delay: getDelay(0.1) }}
          style={{ overflow: 'visible' }}
        >
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3 flex-1 min-w-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: getDuration(0.3), delay: getDelay(0.2) }}
            >
              {/* 中文注释：搜索框 - 使用增强的SearchBar组件 */}
              <motion.div
                className="relative search-container w-full"
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
              className="flex items-center space-x-2 flex-shrink-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: getDuration(0.3), delay: getDelay(0.2) }}
            >
              <div className="flex items-center space-x-3">
              {/* 主题切换按钮 */}
              <motion.div className="relative">
                <motion.button
                  className={`theme-dropdown-button p-2 rounded-lg transition-all duration-300 flex items-center space-x-1 ${
                    isDark ? 'bg-blue-900/50 hover:bg-blue-800/60 ring-1 ring-blue-500/50 text-blue-100 hover:ring-blue-400' :
                    theme === 'blue' ? 'bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200 text-blue-800 hover:ring-blue-300' :
                    theme === 'green' ? 'bg-green-50 hover:bg-green-100 ring-1 ring-green-200 text-green-800 hover:ring-green-300' :
                    theme === 'tianjin' ? 'bg-[#1E5F8E]/10 hover:bg-[#1E5F8E]/20 ring-1 ring-[#1E5F8E]/30 text-[#1E5F8E] hover:ring-[#1E5F8E]/50' :
                    'bg-white hover:bg-gray-50 ring-1 ring-gray-200 text-gray-900 hover:ring-gray-300'
                  }`}
                  aria-label={t('header.toggleTheme')}
                  onClick={() => setShowThemeDropdown(v => !v)}
                  title={t('header.toggleTheme')}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className={`fas ${
                    theme === 'dark' ? 'fa-moon' : 
                    theme === 'light' ? 'fa-sun' : 
                    theme === 'blue' ? 'fa-water' : 
                    theme === 'green' ? 'fa-leaf' : 
                    theme === 'tianjin' ? 'fa-landmark' : 
                    'fa-dungeon'
                  } transition-transform duration-300 hover:scale-110`}></i>
                  <i className={`fas fa-chevron-down transition-transform duration-200 ${showThemeDropdown ? 'rotate-180' : ''}`}></i>
                </motion.button>
                {showThemeDropdown && (
                  <motion.div
                    className={`theme-dropdown-menu absolute right-0 mt-2 w-40 rounded-xl shadow-lg ring-1 z-[100] ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`}
                    role="menu"
                    aria-label={t('header.toggleTheme')}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: getDuration(0.2), delay: getDelay(0.1) }}
                  >
                    <ul className="py-1">
                      {themeConfig.map((themeOption, index) => (
                        <motion.li 
                          key={themeOption.value}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: getDuration(0.1), delay: getDelay(0.05 * index) }}
                        >
                          <button
                            className={`w-full text-left px-4 py-2 flex items-center space-x-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${theme === themeOption.value ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 font-semibold') : ''}`}
                            onClick={() => {
                              setTheme(themeOption.value);
                              setShowThemeDropdown(false);
                            }}
                            role="menuitem"
                          >
                            <i className={themeOption.icon}></i>
                            <span>{themeOption.label}</span>
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
              

              
              {/* 中文注释：问题反馈入口 */}
              <motion.button
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-blue-800/50 ring-1 ring-blue-500/50 text-blue-100 hover:ring-blue-400' : 'hover:bg-gray-50 ring-1 ring-gray-200'}`}
                aria-label={t('header.feedback')}
                title={t('header.feedback')}
                onClick={() => setShowFeedback(true)}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-bug"></i>
              </motion.button>
              {/* 好友管理按钮 */}
              <motion.button
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-blue-900/40 ring-1 ring-blue-500/50 hover:bg-blue-800/50 hover:ring-blue-400 text-blue-100' : 'bg-white/70 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-blue-500'} hover:shadow-md relative`}
                aria-label="好友管理"
                title="好友管理"
                onClick={() => navigate('/friends')}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-user-friends transition-transform duration-300 hover:scale-110"></i>
                {friendRequests && friendRequests.length > 0 && (
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    {friendRequests.length}
                  </motion.span>
                )}
              </motion.button>
              <motion.div className="relative" ref={notifRef}>
                <motion.button
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-blue-900/40 ring-1 ring-blue-500/50 hover:bg-blue-800/50 hover:ring-blue-400 text-blue-100' : 'bg-white/70 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-blue-500'} hover:shadow-md relative`}
                aria-label={t('header.notifications')}
                aria-expanded={showNotifications}
                onClick={() => setShowNotifications(v => !v)}
                title={`${unreadCount > 0 ? t('notification.unreadCount', { count: unreadCount }) : t('notification.view')}`}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-bell transition-transform duration-300 hover:scale-110"></i>
                  {unreadCount > 0 && (
                    <motion.span 
                      className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </motion.button>
                {showNotifications && (
                  <NotificationPanel
                    notifications={notifications}
                    setNotifications={setNotifications}
                    unreadCount={unreadCount}
                    isDark={isDark}
                    onClose={() => setShowNotifications(false)}
                    notificationSettings={notificationSettings}
                    setNotificationSettings={setNotificationSettings}
                  />
                )}
              </motion.div>
              
              {/* 创作者仪表盘 - 已移除 */}
              
              {isAuthenticated ? (
                <motion.div className="relative" ref={userMenuRef}>
                  <motion.button
                    className="flex items-center space-x-2"
                    aria-label="用户菜单"
                    aria-expanded={showUserMenu}
                    onClick={() => setShowUserMenu(v => !v)}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {user?.avatar && user.avatar.trim() ? (
                      <div className="relative h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background ring-primary/50">
                        <img 
                          src={user.avatar} 
                          alt={user?.username || '用户头像'} 
                          className="h-full w-full rounded-full object-cover transition-transform duration-300 hover:scale-110"
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
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${isDark ? 'bg-blue-600' : 'bg-orange-500'} ring-2 ring-offset-2 ring-offset-background ring-primary/50`}>
                        {user?.username?.charAt(0) || 'U'}
                      </div>
                    )}
                  </motion.button>
                  {showUserMenu && (
                    <motion.div
                      className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg ring-1 z-[100] ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-gray-200'}`}
                      role="menu"
                      aria-label="用户菜单"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: getDuration(0.2), delay: getDelay(0.1) }}
                    >
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className="text-sm">{user?.username}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                      </div>
                      <ul className="py-1">
                        {[
                          { label: t('header.profile'), path: '/dashboard' },
                          { label: t('header.analytics'), path: '/analytics' },
                          { label: '我的活动', path: '/my-activities' },
                          { label: t('header.membershipCenter'), path: '/membership' },
                          { label: t('header.myCollection'), path: '/collection' },
                          { label: t('header.backToOfficialWebsite'), path: '/landing.html', isExternal: true },
                          { label: t('common.drafts'), path: '/drafts' },
                          { label: t('header.settings'), path: '/settings' }
                        ].map((item, index) => (
                          <motion.li 
                            key={item.path}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: getDuration(0.1), delay: getDelay(0.05 * index) }}
                          >
                            <button 
                              className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-all duration-200 hover:bg-primary/5 hover:pl-5`}
                              onClick={() => {
                                setShowUserMenu(false);
                                if (item.isExternal) {
                                  window.location.href = item.path;
                                } else {
                                  navigate(item.path);
                                }
                              }}
                            >
                              {item.label}
                            </button>
                          </motion.li>
                        ))}
                        <motion.li
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: getDuration(0.1), delay: getDelay(0.4) }}
                        >
                          <PWAInstallButton asMenuItem isDark={isDark} />
                        </motion.li>
                        <motion.li 
                          className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} mt-2`}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: getDuration(0.1), delay: getDelay(0.45) }}
                        >
                          <button className={`w-full text-left px-4 py-2 text-red-600 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-all duration-200 hover:bg-red-50 hover:pl-5`} onClick={() => { setShowUserMenu(false); logout() }}>{t('header.logout')}</button>
                        </motion.li>
                      </ul>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
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
