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
import { userStateService } from '@/services/userStateService'
import { useBrowseHistory } from '@/hooks/useBrowseHistory'
import { useJinbi } from '@/hooks/useJinbi'
import { collectionService, CollectionType, type CollectionItem, type UserCollectionStats } from '@/services/collectionService'
import { draftService, type Draft } from '@/services/draftService'
import { eventParticipationService, type ParticipationDetail, type ParticipationStatus } from '@/services/eventParticipationService'

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
  
  // 津币余额
  const { balance: jinbiBalance } = useJinbi()
  
  // 无障碍功能
  const { announce } = useScreenReader()
  const { isHighContrast, highContrastClasses } = useHighContrast()
  const { prefersReducedMotion, motionSafeClasses } = useReducedMotion()
  
  // 侧边栏容器引用
  const sidebarRef = useRef<HTMLDivElement>(null)
  // 初始化默认值，确保服务器端和客户端渲染一致
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [width, setWidth] = useState<number>(200)
  // 添加固定状态
  const [isPinned, setIsPinned] = useState<boolean>(false)
  // 主题下拉菜单状态
  const [showThemeDropdown, setShowThemeDropdown] = useState<boolean>(false)
  // 悬浮分组状态（用于收起时显示子菜单）
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  
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
        if (state.width) setWidth(Math.min(Math.max(state.width, 200), 320))
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

  // 使用防抖函数保存最近搜索到本地和数据库
  const saveRecentSearches = useCallback((searches: string[]) => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem('recentSearches', JSON.stringify(searches))
      
      // 异步保存到数据库
      userStateService.saveSearchHistory(searches).catch(err => {
        console.error('[SidebarLayout] Failed to save search history to database:', err)
      })
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

  // 创作下拉菜单状态
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)

  // 历史记录下拉菜单状态
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<'all' | 'work' | 'template' | 'post'>('all')
  const { groupedHistory, totalCount, workCount, templateCount, postCount, removeHistory } = useBrowseHistory()

  // 收藏下拉菜单状态
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false)
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'work' | 'template' | 'post' | 'activity'>('all')
  const [collectionStats, setCollectionStats] = useState<UserCollectionStats | null>(null)
  const [recentCollections, setRecentCollections] = useState<CollectionItem[]>([])

  // 草稿箱下拉菜单状态
  const [showDraftDropdown, setShowDraftDropdown] = useState(false)
  const [recentDrafts, setRecentDrafts] = useState<Draft[]>([])

  // 我的活动下拉菜单状态
  const [showActivityDropdown, setShowActivityDropdown] = useState(false)
  const [activityFilter, setActivityFilter] = useState<ParticipationStatus | 'all'>('all')
  const [recentActivities, setRecentActivities] = useState<ParticipationDetail[]>([])

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

  // 获取收藏统计数据和最近收藏
  useEffect(() => {
    if (!isAuthenticated || !showCollectionDropdown) return

    const fetchCollectionData = async () => {
      try {
        // 获取收藏统计
        const stats = await collectionService.getUserCollectionStats()
        setCollectionStats(stats)

        // 获取最近收藏的5条
        const result = await collectionService.getUserCollections({
          type: collectionFilter === 'all' ? 'all' : collectionFilter,
          limit: 5
        })
        setRecentCollections(result.items)
      } catch (error) {
        console.error('获取收藏数据失败:', error)
      }
    }

    fetchCollectionData()
  }, [showCollectionDropdown, collectionFilter, isAuthenticated])

  // 获取最近草稿（草稿数据存储在本地，不需要登录）
  useEffect(() => {
    if (!showDraftDropdown) return

    const fetchDraftData = async () => {
      try {
        const drafts = await draftService.getAllDrafts()
        setRecentDrafts(drafts.slice(0, 5))
      } catch (error) {
        console.error('获取草稿数据失败:', error)
      }
    }

    fetchDraftData()
  }, [showDraftDropdown])

  // 获取用户参与活动
  useEffect(() => {
    if (!isAuthenticated || !showActivityDropdown || !user?.id) return

    const fetchActivityData = async () => {
      try {
        const result = await eventParticipationService.getUserParticipations(
          user.id,
          { status: activityFilter },
          { page: 1, pageSize: 5 }
        )
        setRecentActivities(result.data)
      } catch (error) {
        console.error('获取活动数据失败:', error)
      }
    }

    fetchActivityData()
  }, [showActivityDropdown, activityFilter, isAuthenticated, user?.id])

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
      console.log('[SidebarLayout] Fetching user stats for user:', user.id, user.username);
      
      // 并行获取关注列表、粉丝列表和作品数量
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      Promise.all([
        getFollowingList().catch((err) => {
          console.error('[SidebarLayout] getFollowingList error:', err);
          return [];
        }),
        getFollowersList().catch((err) => {
          console.error('[SidebarLayout] getFollowersList error:', err);
          return [];
        }),
        // 获取作品数量 - 使用较大的limit确保获取所有作品
        token ? fetch(`/api/works?creator_id=${user.id}&limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          if (!res.ok) {
            console.error('[SidebarLayout] Works API error:', res.status, res.statusText);
          }
          return res.ok ? res.json() : { data: [] };
        }).catch((err) => {
          console.error('[SidebarLayout] Works fetch error:', err);
          return { data: [] };
        }) : Promise.resolve({ data: [] }),
        // 获取积分数据
        supabasePointsService.getUserBalance(user.id).catch(() => null)
      ]).then(([following, followers, worksResult, pointsBalance]) => {
        // API返回的是data数组，直接使用数组长度
        const worksCount = worksResult?.data?.length || 0;
        
        console.log('[SidebarLayout] User stats fetched:', {
          followingCount: following.length,
          followersCount: followers.length,
          worksCount: worksCount,
          userId: user.id
        });

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
  const { debouncedPrefetch, prefetchRoute } = usePrefetch();

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
        className={`hidden md:flex flex-col ${isDark ? 'bg-gradient-to-b from-[#0F172A] via-[#1E3A5F] to-[#0F172A] border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : theme === 'pink' ? 'bg-white/90 border-pink-200' : 'bg-white border-gray-200'} border-r relative ring-1 ${isDark ? 'ring-blue-500/30' : theme === 'pink' ? 'ring-pink-200' : 'ring-gray-200'}`}
        style={{ width: collapsed ? 80 : width, transition: 'width 0.2s ease-in-out', overflow: 'visible', zIndex: 9999 }}
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
              className={`${collapsed ? 'w-14 h-14' : 'p-2'} rounded-xl transition-all bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 flex items-center justify-center`}
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

        <nav className={`flex-1 px-2 py-4 ${collapsed ? 'space-y-1' : 'space-y-5'} overflow-y-visible overflow-x-visible`}>
          {navigationGroups.map((group, groupIndex) => (
            <motion.div
              key={group.id}
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: getDuration(0.3), 
                delay: getDelay(groupIndex * 0.05)
              }}
            >
              {collapsed ? (
                // 收起状态：只显示分组图标
                <div 
                  className="relative z-[100]"
                  onMouseEnter={() => setHoveredGroup(group.id)}
                  onMouseLeave={() => setHoveredGroup(null)}
                >
                  <NavLink
                    to={group.items[0]?.path || '/'}
                    className={({ isActive }) => `
                      group relative flex items-center justify-center w-14 h-14 mx-auto rounded-xl transition-all duration-200
                      ${isActive 
                        ? (isDark 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                            : 'bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30')
                        : (isDark 
                            ? 'text-gray-400 hover:bg-white/10 hover:text-white' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <i className={`fas ${group.icon} text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}></i>
                        {/* 分组内有 NEW 标记时显示小红点 */}
                        {group.items.some(item => item.badge) && (
                          <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 border-2 ${isDark ? 'border-[#0F172A]' : 'border-white'}`}></div>
                        )}
                      </>
                    )}
                  </NavLink>
                  
                  {/* 悬浮菜单 */}
                  {hoveredGroup === group.id && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute left-full top-0 z-[9999] min-w-[180px] rounded-xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
                      style={{ left: '56px', top: '0' }}
                    >
                      {/* 分组标题 */}
                      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700 bg-gray-800/80' : 'border-gray-100 bg-gray-50/80'}`}>
                        <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t(navGroupIdToTranslationKey[group.id] || group.title)}
                        </h3>
                      </div>
                      {/* 子菜单项 */}
                      <div className="py-1">
                        {group.items.map((item, itemIndex) => (
                          <NavLink
                            key={item.id}
                            to={`${item.path}${item.search || ''}`}
                            onMouseEnter={() => debouncedPrefetch(item.id)}
                            className={({ isActive }) => `
                              flex items-center px-4 py-2.5 text-sm transition-all duration-150
                              ${isActive 
                                ? (isDark 
                                    ? 'bg-blue-500/20 text-blue-300' 
                                    : 'bg-red-50 text-red-600')
                                : (isDark 
                                    ? 'text-gray-300 hover:bg-white/5 hover:text-white' 
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900')
                              }
                            `}
                          >
                            <i className={`fas ${item.icon} w-5 text-center mr-3 ${({ isActive }: { isActive: boolean }) => isActive ? 'text-current' : 'text-gray-400'}`}></i>
                            <span className="flex-1">{navItemIdToTranslationKey[item.id] ? t(navItemIdToTranslationKey[item.id]) : item.label}</span>
                            {item.badge && (
                              <span className={`
                                ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded
                                ${item.badge === 'NEW' || item.badge === '新'
                                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                                  : (isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-red-100 text-red-600')
                                }
                              `}>
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                // 展开状态：显示分组标题和子项
                <div className="px-2">
                  <motion.div
                    className="flex items-center gap-2 mb-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: getDuration(0.3), delay: getDelay(groupIndex * 0.05) }}
                  >
                    <div className={`w-1 h-4 rounded-full ${isDark ? 'bg-gradient-to-b from-blue-400 to-purple-500' : 'bg-gradient-to-b from-red-500 to-rose-400'}`}></div>
                    <h3 className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t(navGroupIdToTranslationKey[group.id] || group.title)}
                    </h3>
                  </motion.div>
                  <div className="space-y-0.5">
                    {group.items.map((item, itemIndex) => (
                      <NavLink
                        key={item.id}
                        to={`${item.path}${item.search || ''}`}
                        onMouseEnter={() => debouncedPrefetch(item.id)}
                        className={({ isActive }) => `
                          group relative flex items-center rounded-lg transition-all duration-150
                          px-3 py-2
                          ${isActive 
                            ? (isDark 
                                ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/60 text-white shadow-md' 
                                : 'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-md')
                            : (isDark 
                                ? 'text-gray-300 hover:bg-white/5 hover:text-white' 
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')
                          }
                        `}
                        end
                      >
                        {({ isActive }) => (
                          <>
                            <div className={`
                              w-7 h-7 flex items-center justify-center rounded-md mr-2 transition-all duration-150
                              ${isActive ? 'bg-white/20' : 'bg-transparent'}
                            `}>
                              <i className={`fas ${item.icon} text-[13px] ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-current'}`}></i>
                            </div>
                            <span className="flex-1 text-[13px] font-medium">{navItemIdToTranslationKey[item.id] ? t(navItemIdToTranslationKey[item.id]) : item.label}</span>
                            {item.badge && (
                              <motion.span
                                className={`
                                  ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded
                                  ${item.badge === 'NEW' || item.badge === '新'
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                                    : (isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-red-100 text-red-600')
                                  }
                                `}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                              >
                                {item.badge}
                              </motion.span>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
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
        className={`flex-1 min-w-0 flex flex-col relative z-10 ${location.pathname.startsWith('/create/agent') ? 'overflow-hidden' : 'overflow-y-auto md:pb-0 pb-16'}`}
        onClick={(e) => {
          // 确保点击的不是内部的可交互元素
          const target = e.target as HTMLElement;
          // 只在点击主内容区域且侧边栏展开时收起侧边栏，不拦截导航链接等可交互元素
          if (!collapsed && !target.closest('button, input, a, [role="menu"], [role="dialog"], nav, [data-discover="true"]')) {
            setCollapsed(true);
          }
        }}
      >
        {/* 中文注释：暗色头部采用蓝色渐变背景与毛玻璃 - 在管理后台隐藏 */}
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
                  onMouseEnter={() => {
                    setShowUserMenu(true)
                    setShowFeedDropdown(false)
                    setShowMessageDropdown(false)
                    setShowCollectionDropdown(false)
                    setShowHistoryDropdown(false)
                    setShowDraftDropdown(false)
                    setShowCreateDropdown(false)
                    setShowActivityDropdown(false)
                  }}
                  onMouseLeave={() => setShowUserMenu(false)}
                  onClick={() => {
                    navigate('/dashboard')
                    setShowUserMenu(false)
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
                    {(user?.avatar_url || user?.avatar) && (user?.avatar_url || user?.avatar)?.trim() ? (
                      <div className={`relative h-14 w-14 rounded-full overflow-hidden transition-all duration-300 ${showUserMenu ? 'shadow-2xl scale-110' : 'group-hover:shadow-xl'}`}>
                        <img
                          src={user?.avatar_url || user?.avatar}
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
                                当前积分 <span className="font-medium">{(userPoints || 0).toLocaleString()}</span>
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
                        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-dashed border-gray-300/30">
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
                          <div 
                            className="text-center cursor-pointer hover:opacity-80 transition-opacity" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setShowUserMenu(false); 
                              navigate('/jinbi'); 
                            }}
                          >
                            <p className={`font-bold text-lg ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                              {(jinbiBalance?.availableBalance || 0).toLocaleString()}
                            </p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-500/70' : 'text-amber-600/70'}`}>津币</p>
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
                          { label: '我的社交', path: '/friends', icon: 'fa-users' },
                          { label: '原创保护中心', path: '/original-protection', icon: 'fa-shield-alt' },
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

              {/* 动态入口 - 带下拉菜单 */}
              <div 
                className="relative inline-block"
                onMouseEnter={() => {
                  setShowFeedDropdown(true)
                  setShowMessageDropdown(false)
                  setShowCollectionDropdown(false)
                  setShowHistoryDropdown(false)
                  setShowDraftDropdown(false)
                  setShowCreateDropdown(false)
                  setShowActivityDropdown(false)
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
                    onMouseEnter={() => setShowFeedDropdown(true)}
                    onMouseLeave={() => setShowFeedDropdown(false)}
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
                          // 根据ID去重，避免重复显示
                          Array.from(new Map(recentFeeds.map(f => [f.id, f])).values()).map(feed => (
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
                  setShowCollectionDropdown(false)
                  setShowHistoryDropdown(false)
                  setShowDraftDropdown(false)
                  setShowCreateDropdown(false)
                  setShowActivityDropdown(false)
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
                    onMouseEnter={() => setShowMessageDropdown(true)}
                    onMouseLeave={() => setShowMessageDropdown(false)}
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

              {/* 收藏入口 - 带下拉菜单 */}
              <div
                className="relative inline-block"
                onMouseEnter={() => {
                  setShowCollectionDropdown(true)
                  setShowFeedDropdown(false)
                  setShowMessageDropdown(false)
                  setShowHistoryDropdown(false)
                  setShowDraftDropdown(false)
                  setShowCreateDropdown(false)
                  setShowActivityDropdown(false)
                }}
              >
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

                {/* 收藏下拉菜单 */}
                {showCollectionDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onMouseEnter={() => setShowCollectionDropdown(true)}
                    onMouseLeave={() => setShowCollectionDropdown(false)}
                    className={`absolute top-full -left-48 mt-2 w-[420px] rounded-xl shadow-2xl z-[100] overflow-hidden ${
                      isDark
                        ? 'bg-[#1a1a2e] border border-gray-700/50'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* 头部标题和数量 */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-bookmark text-gray-400"></i>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>我的收藏</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        {collectionStats?.total || 0} 条
                      </span>
                    </div>

                    {/* 筛选标签 - 排成一行 */}
                    <div className={`grid grid-cols-5 gap-2 px-4 py-3 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      {[
                        { id: 'all', label: '全部', count: collectionStats?.total || 0, icon: 'fa-th-large' },
                        { id: 'work', label: '作品', count: collectionStats?.squareWork || 0, icon: 'fa-image' },
                        { id: 'template', label: '模板', count: collectionStats?.template || 0, icon: 'fa-layer-group' },
                        { id: 'post', label: '帖子', count: collectionStats?.communityPost || 0, icon: 'fa-comment-alt' },
                        { id: 'activity', label: '活动', count: collectionStats?.activity || 0, icon: 'fa-calendar-alt' }
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setCollectionFilter(filter.id as 'all' | 'work' | 'template' | 'post' | 'activity')}
                          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                            collectionFilter === filter.id
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                                : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                              : isDark
                                ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <i className={`fas ${filter.icon}`}></i>
                          <span>{filter.count}</span>
                        </button>
                      ))}
                    </div>

                    {/* 收藏列表 */}
                    <div className="max-h-[320px] overflow-y-auto">
                      {recentCollections.length === 0 ? (
                        <div className={`px-4 py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <i className="fas fa-bookmark text-3xl mb-2"></i>
                          <p className="text-sm">暂无收藏内容</p>
                        </div>
                      ) : (
                        <div className="py-1">
                          {recentCollections.map((item) => (
                            <div
                              key={item.id}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors group ${
                                isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                              }`}
                            >
                              {/* 缩略图/视频 - 只有有图片时才显示 */}
                              {item.thumbnail && (
                                <div className="relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden">
                                  {item.mediaType === 'video' ? (
                                    <video
                                      src={item.thumbnail}
                                      autoPlay
                                      muted
                                      loop
                                      playsInline
                                      className="w-full h-full object-cover cursor-pointer"
                                      onClick={() => {
                                        navigate(item.link)
                                        setShowCollectionDropdown(false)
                                      }}
                                    />
                                  ) : (
                                    <button
                                      onClick={() => {
                                        navigate(item.link)
                                        setShowCollectionDropdown(false)
                                      }}
                                      className="w-full h-full"
                                    >
                                      <img
                                        src={item.thumbnail}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none'
                                        }}
                                      />
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* 内容 */}
                              <button
                                onClick={() => {
                                  navigate(item.link)
                                  setShowCollectionDropdown(false)
                                }}
                                className="flex-1 min-w-0 text-left"
                              >
                                <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {item.title}
                                </div>
                                <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] mr-2 ${
                                    item.type === CollectionType.SQUARE_WORK
                                      ? isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'
                                      : item.type === CollectionType.TEMPLATE
                                        ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                                        : item.type === CollectionType.COMMUNITY_POST
                                          ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'
                                          : isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    {item.type === CollectionType.SQUARE_WORK ? '作品'
                                      : item.type === CollectionType.TEMPLATE ? '模板'
                                        : item.type === CollectionType.COMMUNITY_POST ? '帖子'
                                          : '活动'}
                                  </span>
                                  <i className="fas fa-user-circle mr-1"></i>
                                  {item.author?.name || '未知作者'}
                                  <span className="mx-1">·</span>
                                  <i className="fas fa-heart text-[10px]"></i> {item.stats.likes}
                                </div>
                              </button>

                              {/* 取消收藏按钮 */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  await collectionService.removeBookmark(item.id, item.type)
                                  // 刷新列表
                                  const result = await collectionService.getUserCollections({
                                    type: collectionFilter === 'all' ? 'all' : collectionFilter,
                                    limit: 5
                                  })
                                  setRecentCollections(result.items)
                                  // 刷新统计
                                  const stats = await collectionService.getUserCollectionStats()
                                  setCollectionStats(stats)
                                }}
                                className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                  isDark ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-200 text-gray-400'
                                }`}
                                title="取消收藏"
                              >
                                <i className="fas fa-trash-alt text-xs"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 底部操作 */}
                    <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      <button
                        onClick={() => {
                          navigate('/collection')
                          setShowCollectionDropdown(false)
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <i className="fas fa-external-link-alt"></i>
                        查看全部
                      </button>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          <i className="fas fa-heart mr-1"></i>
                          {collectionStats?.totalLikes || 0} 点赞
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 草稿箱入口 - 带下拉菜单 */}
              <div
                className="relative inline-block"
                onMouseEnter={() => {
                  setShowDraftDropdown(true)
                  setShowFeedDropdown(false)
                  setShowMessageDropdown(false)
                  setShowCollectionDropdown(false)
                  setShowHistoryDropdown(false)
                  setShowCreateDropdown(false)
                  setShowActivityDropdown(false)
                }}
              >
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

                {/* 草稿箱下拉菜单 */}
                {showDraftDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onMouseEnter={() => setShowDraftDropdown(true)}
                    onMouseLeave={() => setShowDraftDropdown(false)}
                    className={`absolute top-full -left-32 mt-2 w-80 rounded-xl shadow-2xl z-[100] overflow-hidden ${
                      isDark
                        ? 'bg-[#1a1a2e] border border-gray-700/50'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* 头部标题和数量 */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-file-alt text-gray-400"></i>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>草稿箱</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        {recentDrafts.length} 条
                      </span>
                    </div>

                    {/* 草稿列表 */}
                    <div className="max-h-[320px] overflow-y-auto">
                      {recentDrafts.length === 0 ? (
                        <div className={`px-4 py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <i className="fas fa-file-alt text-3xl mb-2"></i>
                          <p className="text-sm">暂无草稿</p>
                        </div>
                      ) : (
                        <div className="py-1">
                          {recentDrafts.map((draft) => (
                            <div
                              key={draft.id}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors group ${
                                isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                              }`}
                            >
                              {/* 图标 */}
                              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                              }`}>
                                <i className="fas fa-file-alt text-blue-500"></i>
                              </div>

                              {/* 内容 */}
                              <button
                                onClick={() => {
                                  navigate(`/create/ai-writer?draft=${draft.id}`)
                                  setShowDraftDropdown(false)
                                }}
                                className="flex-1 min-w-0 text-left"
                              >
                                <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {draft.title || '未命名草稿'}
                                </div>
                                <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] mr-2 ${
                                    isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {draft.templateName || 'AI文案'}
                                  </span>
                                  {new Date(draft.updatedAt).toLocaleDateString('zh-CN')}
                                </div>
                              </button>

                              {/* 删除按钮 */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  await draftService.deleteDraft(draft.id)
                                  const drafts = await draftService.getAllDrafts()
                                  setRecentDrafts(drafts.slice(0, 5))
                                }}
                                className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                  isDark ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-200 text-gray-400'
                                }`}
                                title="删除草稿"
                              >
                                <i className="fas fa-trash-alt text-xs"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 底部操作 */}
                    <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      <button
                        onClick={() => {
                          navigate('/drafts')
                          setShowDraftDropdown(false)
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <i className="fas fa-external-link-alt"></i>
                        查看全部
                      </button>
                      <button
                        onClick={() => {
                          navigate('/create/ai-writer')
                          setShowDraftDropdown(false)
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <i className="fas fa-plus"></i>
                        新建草稿
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 历史记录入口 - 带下拉菜单 */}
              <div
                className="relative inline-block"
                onMouseEnter={() => {
                  setShowHistoryDropdown(true)
                  setShowFeedDropdown(false)
                  setShowMessageDropdown(false)
                  setShowCollectionDropdown(false)
                  setShowDraftDropdown(false)
                  setShowCreateDropdown(false)
                  setShowActivityDropdown(false)
                }}
              >
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

                {/* 历史记录下拉菜单 */}
                {showHistoryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onMouseEnter={() => setShowHistoryDropdown(true)}
                    onMouseLeave={() => setShowHistoryDropdown(false)}
                    className={`absolute top-full right-0 mt-2 w-[380px] rounded-xl shadow-2xl z-[100] overflow-hidden ${
                      isDark
                        ? 'bg-[#1a1a2e] border border-gray-700/50'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* 头部标题和数量 */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-history text-gray-400"></i>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>浏览历史</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        {totalCount} 条
                      </span>
                    </div>

                    {/* 筛选标签 - 排成一行 */}
                    <div className={`grid grid-cols-4 gap-2 px-4 py-3 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      {[
                        { id: 'all', label: '全部', count: totalCount, icon: 'fa-th-large' },
                        { id: 'work', label: '作品', count: workCount, icon: 'fa-image' },
                        { id: 'template', label: '模板', count: templateCount, icon: 'fa-layer-group' },
                        { id: 'post', label: '帖子', count: postCount, icon: 'fa-comment-alt' }
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setHistoryFilter(filter.id as 'all' | 'work' | 'template' | 'post')}
                          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                            historyFilter === filter.id
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                                : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                              : isDark
                                ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <i className={`fas ${filter.icon}`}></i>
                          <span>{filter.label}</span>
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${
                            historyFilter === filter.id
                              ? isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-600'
                              : isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {filter.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* 历史记录列表 */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {groupedHistory.length === 0 ? (
                        <div className={`px-4 py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <i className="fas fa-inbox text-3xl mb-2"></i>
                          <p className="text-sm">暂无浏览记录</p>
                        </div>
                      ) : (
                        groupedHistory.map((group) => {
                          // 根据筛选条件过滤
                          const filteredItems = historyFilter === 'all'
                            ? group.items
                            : group.items.filter(item => item.type === historyFilter)

                          if (filteredItems.length === 0) return null

                          return (
                            <div key={group.label}>
                              {/* 时间分组标题 */}
                              <div className={`px-4 py-2 flex items-center gap-2 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
                                <i className="fas fa-moon text-xs text-gray-400"></i>
                                <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {group.label}
                                </span>
                              </div>
                              <div className="py-1">
                                {filteredItems.slice(0, 3).map((item) => (
                                  <div
                                    key={item.id}
                                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors group ${
                                      isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    {/* 缩略图/视频播放器 - 视频直接播放 */}
                                    <div
                                      className="relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden"
                                    >
                                      {(() => {
                                        // 兼容新旧数据：优先使用 videoUrl，否则使用 thumbnail（旧数据可能把视频URL存在这里）
                                        const videoSrc = item.videoUrl || (item.mediaType === 'video' ? item.thumbnail : null)

                                        if (videoSrc) {
                                          /* 视频直接播放 */
                                          return (
                                            <video
                                              src={videoSrc}
                                              autoPlay
                                              muted
                                              loop
                                              playsInline
                                              className="w-full h-full object-cover cursor-pointer"
                                              onClick={() => {
                                                navigate(item.url)
                                                setShowHistoryDropdown(false)
                                              }}
                                            />
                                          )
                                        }
                                        /* 缩略图 */
                                        return (
                                          <button
                                            onClick={() => {
                                              navigate(item.url)
                                              setShowHistoryDropdown(false)
                                            }}
                                            className="w-full h-full"
                                          >
                                            <img
                                              src={item.thumbnail || '/default-thumbnail.png'}
                                              alt={item.title}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/default-thumbnail.png'
                                              }}
                                            />
                                          </button>
                                        )
                                      })()}
                                    </div>

                                    {/* 内容 */}
                                    <button
                                      onClick={() => {
                                        navigate(item.url)
                                        setShowHistoryDropdown(false)
                                      }}
                                      className="flex-1 min-w-0 text-left"
                                    >
                                      <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {item.title}
                                      </div>
                                      <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] mr-2 ${
                                          item.type === 'work'
                                            ? isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'
                                            : item.type === 'template'
                                              ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                                              : isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'
                                        }`}>
                                          {item.type === 'work' ? '作品' : item.type === 'template' ? '模板' : '帖子'}
                                        </span>
                                        <i className="fas fa-user-circle mr-1"></i>
                                        {item.creator?.name || '未知作者'}
                                        <span className="mx-1">·</span>
                                        {new Date(item.viewedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </button>

                                    {/* 删除按钮 */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeHistory(item.id)
                                      }}
                                      className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                        isDark ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-200 text-gray-400'
                                      }`}
                                      title="删除记录"
                                    >
                                      <i className="fas fa-trash-alt text-xs"></i>
                                    </button>
                                  </div>
                                ))}
                                {filteredItems.length > 3 && (
                                  <div className={`px-4 py-2 text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    还有 {filteredItems.length - 3} 条记录...
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* 底部操作 */}
                    <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      <button
                        onClick={() => {
                          navigate('/history')
                          setShowHistoryDropdown(false)
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <i className="fas fa-external-link-alt"></i>
                        查看全部
                      </button>
                      <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        保留最近200条记录
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 我的活动入口 - 带下拉菜单 */}
              <div
                className="relative inline-block"
                onMouseEnter={() => {
                  setShowActivityDropdown(true)
                  setShowFeedDropdown(false)
                  setShowMessageDropdown(false)
                  setShowCollectionDropdown(false)
                  setShowHistoryDropdown(false)
                  setShowDraftDropdown(false)
                  setShowCreateDropdown(false)
                }}
              >
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

                {/* 我的活动下拉菜单 */}
                {showActivityDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onMouseEnter={() => setShowActivityDropdown(true)}
                    onMouseLeave={() => setShowActivityDropdown(false)}
                    className={`absolute top-full right-0 mt-2 w-[380px] rounded-xl shadow-2xl z-[100] overflow-hidden ${
                      isDark
                        ? 'bg-[#1a1a2e] border border-gray-700/50'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* 头部标题和数量 */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-calendar-alt text-gray-400"></i>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>我的活动</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        {recentActivities.length} 条
                      </span>
                    </div>

                    {/* 筛选标签 - 排成一行 */}
                    <div className={`grid grid-cols-5 gap-2 px-4 py-3 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      {[
                        { id: 'all', label: '全部', icon: 'fa-th-large' },
                        { id: 'registered', label: '已报名', icon: 'fa-check-circle' },
                        { id: 'reviewing', label: '评审中', icon: 'fa-gavel' },
                        { id: 'completed', label: '已完成', icon: 'fa-flag-checkered' },
                        { id: 'awarded', label: '已获奖', icon: 'fa-trophy' }
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setActivityFilter(filter.id as ParticipationStatus | 'all')}
                          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                            activityFilter === filter.id
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                                : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                              : isDark
                                ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <i className={`fas ${filter.icon}`}></i>
                          <span>{filter.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* 活动列表 */}
                    <div className="max-h-[320px] overflow-y-auto">
                      {!isAuthenticated ? (
                        <div className={`px-4 py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <i className="fas fa-user-lock text-3xl mb-2"></i>
                          <p className="text-sm">请先登录查看活动</p>
                        </div>
                      ) : recentActivities.length === 0 ? (
                        <div className={`px-4 py-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <i className="fas fa-calendar-alt text-3xl mb-2"></i>
                          <p className="text-sm">暂无参与活动</p>
                          <button
                            onClick={() => {
                              navigate('/events')
                              setShowActivityDropdown(false)
                            }}
                            className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium ${
                              isDark
                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                          >
                            去发现活动
                          </button>
                        </div>
                      ) : (
                        <div className="py-1">
                          {recentActivities.map((activity) => (
                            <div
                              key={activity.id}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors group ${
                                isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                              }`}
                            >
                              {/* 活动缩略图 */}
                              {activity.event.thumbnailUrl && (
                                <div className="relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden">
                                  <img
                                    src={activity.event.thumbnailUrl}
                                    alt={activity.event.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                  />
                                </div>
                              )}

                              {/* 内容 */}
                              <button
                                onClick={() => {
                                  navigate(`/events/${activity.eventId}`)
                                  setShowActivityDropdown(false)
                                }}
                                className="flex-1 min-w-0 text-left"
                              >
                                <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {activity.event.title}
                                </div>
                                <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] mr-2 ${
                                    activity.participationStatus === 'registered'
                                      ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'
                                      : activity.participationStatus === 'reviewing'
                                        ? isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
                                        : activity.participationStatus === 'awarded'
                                          ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600'
                                          : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {activity.participationStatus === 'registered' ? '已报名'
                                      : activity.participationStatus === 'reviewing' ? '评审中'
                                        : activity.participationStatus === 'completed' ? '已完成'
                                          : activity.participationStatus === 'awarded' ? '已获奖'
                                            : '已取消'}
                                  </span>
                                  {activity.progress > 0 && (
                                    <span className="mr-2">
                                      <i className="fas fa-tasks mr-1"></i>
                                      进度 {activity.progress}%
                                    </span>
                                  )}
                                  {activity.ranking && (
                                    <span className={`${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                      <i className="fas fa-trophy mr-1"></i>
                                      第 {activity.ranking} 名
                                    </span>
                                  )}
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 底部操作 */}
                    <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                      <button
                        onClick={() => {
                          navigate('/my-activities')
                          setShowActivityDropdown(false)
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <i className="fas fa-external-link-alt"></i>
                        查看全部
                      </button>
                      <button
                        onClick={() => {
                          navigate('/events')
                          setShowActivityDropdown(false)
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <i className="fas fa-compass"></i>
                        发现活动
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 创作者仪表盘 - 已移除 */}

              {/* 创作按钮 - 模仿B站投稿按钮，带下拉菜单 */}
              {isAuthenticated && (
                <div
                  className="relative inline-block"
                  onMouseEnter={() => {
                    setShowCreateDropdown(true)
                    setShowFeedDropdown(false)
                    setShowMessageDropdown(false)
                    setShowCollectionDropdown(false)
                    setShowHistoryDropdown(false)
                    setShowDraftDropdown(false)
                    setShowActivityDropdown(false)
                  }}
                >
                  <motion.button
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#ff6699] hover:bg-[#ff4d88] text-white font-medium text-sm transition-colors duration-200"
                    aria-label="创作"
                    title="创作"
                    onClick={() => navigate('/create')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <i className="fas fa-upload text-sm"></i>
                    <span>创作</span>
                  </motion.button>

                  {/* 创作下拉菜单 */}
                  {showCreateDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      onMouseEnter={() => setShowCreateDropdown(true)}
                      onMouseLeave={() => setShowCreateDropdown(false)}
                      className={`absolute top-full right-0 mt-2 w-64 rounded-xl shadow-2xl z-[100] overflow-hidden ${
                        isDark
                          ? 'bg-[#1a1a2e] border border-gray-700/50'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {/* 创作中心 */}
                      <button
                        onClick={() => {
                          navigate('/creator-center')
                          setShowCreateDropdown(false)
                        }}
                        className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                          isDark
                            ? 'text-gray-200 hover:bg-gray-800/50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                          <i className="fas fa-pen-nib text-blue-500"></i>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium">创作中心</div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>管理您的作品</div>
                        </div>
                      </button>

                      {/* AI制作文案 */}
                      <button
                        onClick={() => {
                          navigate('/create/ai-writer')
                          setShowCreateDropdown(false)
                        }}
                        className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                          isDark
                            ? 'text-gray-200 hover:bg-gray-800/50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                          <i className="fas fa-robot text-purple-500"></i>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium">AI制作文案</div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>智能生成内容</div>
                        </div>
                      </button>

                      {/* 品牌向导 */}
                      <button
                        onClick={() => {
                          navigate('/wizard')
                          setShowCreateDropdown(false)
                        }}
                        className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                          isDark
                            ? 'text-gray-200 hover:bg-gray-800/50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                          <i className="fas fa-magic text-amber-500"></i>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium">品牌向导</div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>创作灵感引导</div>
                        </div>
                      </button>

                      {/* 分割线 */}
                      <div className={`mx-4 h-px ${isDark ? 'bg-gray-700/50' : 'bg-gray-200'}`} />

                      {/* 去创作 */}
                      <button
                        onClick={() => {
                          navigate('/create')
                          setShowCreateDropdown(false)
                        }}
                        className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                          isDark
                            ? 'text-pink-400 hover:bg-pink-500/10'
                            : 'text-pink-500 hover:bg-pink-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-pink-500/20' : 'bg-pink-50'}`}>
                          <i className="fas fa-plus-circle text-pink-500"></i>
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium">开始创作</div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>发布新作品</div>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </div>
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
