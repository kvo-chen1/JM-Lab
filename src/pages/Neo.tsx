import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { scoreAuthenticity } from '@/services/authenticityService'
import { useTheme } from '@/hooks/useTheme'
import { llmService } from '@/services/llmService'
import { aiGenerationSaveService } from '@/services/aiGenerationSaveService'
import voiceService from '@/services/voiceService'
import doubao, { createVideoTask, pollVideoTask, DoubaoVideoContent } from '@/services/doubao'
import { TianjinImage } from '@/components/TianjinStyleComponents'
import { toast } from 'sonner'
import errorService from '@/services/errorService'
import GradientHero from '@/components/GradientHero'
import NeoLeftSidebar from '@/components/NeoLeftSidebar'
import NeoRightSidebar from '@/components/NeoRightSidebar'
import ImageEditor from '@/components/ImageEditor'
import OneClickDesign from '@/components/OneClickDesign'
import { motion, AnimatePresence } from 'framer-motion'
import { tianjinActivityService, Activity } from '@/services/tianjinActivityService'
import userStatsService from '@/services/userStatsService'
import { workService } from '@/services/apiService'
import { userStateService } from '@/services/userStateService'

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// 错误边界组件
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // 更新状态，下次渲染时显示备用UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    errorService.logError(error, { scope: 'neo-error-boundary', errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // 自定义备用UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 rounded-xl border text-center">
          <div className="text-red-500 text-4xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3 className="text-lg font-semibold mb-2">出现错误</h3>
          <p className="text-sm text-gray-500 mb-4">
            {this.state.error?.message || '应用遇到了一些问题，请稍后重试'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        </div>
      );
    }

    // 正常渲染子组件
    return this.props.children;
  }
}

const BRAND_STORIES: Record<string, string> = {
  mahua: '始于清末，以多褶形态与香酥口感著称，传统工艺要求条条分明，不含水分。',
  baozi: '创始于光绪年间，皮薄馅大、鲜香味美，传承天津传统小吃的经典风味。',
  niuren: '以细腻彩塑著称，人物生动传神，见证天津手艺与美学传承。',
  erduoyan: '创建于清光绪年间的耳朵眼炸糕，外酥里糯、香甜不腻，是天津特色小吃代表。',
  laomeihua: '老美华鞋店始于民国时期，保留传统手工缝制技艺与“舒适耐穿”的品牌口碑。',
  dafulai: '大福来锅巴菜以糊辣香浓著称，讲究火候与调和，口感层次丰富。',
  guorenzhang: '果仁张为百年坚果老字号，以糖炒栗子闻名，香甜适口、粒粒饱满。',
  chatangli: '茶汤李源自清末，茶汤细腻柔滑、甘香回甜，是老天津的温暖记忆。'
}

const TAGS = ['国潮', '杨柳青年画', '传统纹样', '红蓝配色']

// 获取自定义标签
const getCustomTags = (): string[] => {
  try {
    const raw = localStorage.getItem('NEO_CUSTOM_TAGS')
    const tags = raw ? JSON.parse(raw) : []
    return Array.isArray(tags) ? tags : []
  } catch {
    return []
  }
}

// 保存自定义标签到本地和数据库
const saveCustomTags = (tags: string[]) => {
  try {
    localStorage.setItem('NEO_CUSTOM_TAGS', JSON.stringify(tags))
    
    // 异步保存到数据库
    userStateService.saveCustomTags(tags).catch(err => {
      console.error('[Neo] Failed to save custom tags to database:', err)
    })
  } catch {}
}

// 预设类型定义
interface StylePreset {
  id: string;
  name: string;
  description?: string;
  brand: string;
  tags: string[];
  prompt: string;
  engine: 'sdxl' | 'qwen';
  textStyle: 'formal' | 'humorous' | 'creative' | 'poetic';
  videoParams: {
    duration: number;
    resolution: '480p' | '720p' | '1080p';
    cameraFixed: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

// 获取风格预设
const getStylePresets = (): StylePreset[] => {
  try {
    const raw = localStorage.getItem('NEO_STYLE_PRESETS')
    const presets = raw ? JSON.parse(raw) : []
    return Array.isArray(presets) ? presets : []
  } catch {
    return []
  }
}

// 保存风格预设到本地和数据库
const saveStylePresets = (presets: StylePreset[]) => {
  try {
    localStorage.setItem('NEO_STYLE_PRESETS', JSON.stringify(presets))
    
    // 异步保存到数据库
    userStateService.saveStylePresets(presets).catch(err => {
      console.error('[Neo] Failed to save style presets to database:', err)
    })
  } catch {}
}

export default function Neo() {
  // 获取主题信息
  const { isDark, theme } = useTheme()
  
  const themeStyles = {
    light: {
      bg: 'bg-white',
      pageBg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-900',
      textSecondary: 'text-slate-500',
      accent: 'blue-600',
      accentBg: 'bg-blue-600',
      accentLight: 'bg-blue-50',
      hover: 'hover:bg-slate-50',
      button: 'bg-slate-900 text-white hover:bg-slate-800',
      cardBg: 'bg-white',
      inputBg: 'bg-white',
      ring: 'ring-blue-500'
    },
    dark: {
      bg: 'bg-slate-900',
      pageBg: 'bg-black',
      border: 'border-slate-800',
      text: 'text-white',
      textSecondary: 'text-slate-400',
      accent: 'blue-500',
      accentBg: 'bg-blue-500',
      accentLight: 'bg-blue-900/30',
      hover: 'hover:bg-slate-800',
      button: 'bg-white text-slate-900 hover:bg-slate-100',
      cardBg: 'bg-slate-900',
      inputBg: 'bg-slate-800',
      ring: 'ring-blue-500'
    },
    blue: {
      bg: 'bg-blue-50',
      pageBg: 'bg-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-900',
      textSecondary: 'text-blue-600',
      accent: 'blue-600',
      accentBg: 'bg-blue-600',
      accentLight: 'bg-blue-100',
      hover: 'hover:bg-blue-100',
      button: 'bg-blue-600 text-white hover:bg-blue-700',
      cardBg: 'bg-white/80 backdrop-blur-sm',
      inputBg: 'bg-white/50',
      ring: 'ring-blue-500'
    },
    green: {
      bg: 'bg-emerald-50',
      pageBg: 'bg-emerald-100',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      textSecondary: 'text-emerald-600',
      accent: 'emerald-600',
      accentBg: 'bg-emerald-600',
      accentLight: 'bg-emerald-100',
      hover: 'hover:bg-emerald-100',
      button: 'bg-emerald-600 text-white hover:bg-emerald-700',
      cardBg: 'bg-white/80 backdrop-blur-sm',
      inputBg: 'bg-white/50',
      ring: 'ring-emerald-500'
    },
    pixel: {
      bg: 'bg-zinc-100',
      pageBg: 'bg-zinc-200',
      border: 'border-zinc-900 border-2',
      text: 'text-zinc-900 font-mono',
      textSecondary: 'text-zinc-600 font-mono',
      accent: 'indigo-600',
      accentBg: 'bg-indigo-600',
      accentLight: 'bg-indigo-200',
      hover: 'hover:bg-zinc-200',
      button: 'bg-zinc-900 text-white border-2 border-transparent hover:border-zinc-900 hover:bg-white hover:text-zinc-900 font-mono',
      cardBg: 'bg-white border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]',
      inputBg: 'bg-white border-2 border-zinc-900',
      ring: 'ring-zinc-900'
    }
  }

  const currentStyle = themeStyles[theme as keyof typeof themeStyles] || themeStyles.light

  const location = useLocation()
  
  // 检查是否在创作中心内
  const isEmbedded = location.pathname.startsWith('/create')
  
  const apiBase = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.trim() || (typeof window !== 'undefined' && /localhost:3000$/.test(window.location.host) ? 'http://localhost:3001' : '')
  const shortenUrl = (u: string) => {
    try {
      const o = new URL(u)
      const path = o.pathname.length > 24 ? o.pathname.slice(0, 24) + '…' : o.pathname
      return `${o.hostname}${path}`
    } catch {
      return u.length > 64 ? u.slice(0, 64) + '…' : u
    }
  }
  // 中文注释：历史记录类型定义
  type HistoryItem = {
    url: string;
    image: string;
    createdAt: number;
    duration?: number;
    width?: number;
    height?: number;
    thumb?: string;
    isFavorite?: boolean;
    type?: 'video' | 'image';
  }
  
  // 中文注释：视频元信息（时长、分辨率、生成时间）与历史列表
  const [videoMetaByIndex, setVideoMetaByIndex] = useState<Array<{ duration?: number; width?: number; height?: number; createdAt?: number; sizeBytes?: number; contentType?: string }>>([])
  const [videoHistory, setVideoHistory] = useState<HistoryItem[]>([])
  const [historyPreviewOpen, setHistoryPreviewOpen] = useState<Record<string, boolean>>({})
  const [historySearch, setHistorySearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'favorite' | 'video'>('all')
  const [historySort, setHistorySort] = useState<'latest' | 'oldest'>('latest')
  
  // 高级历史记录管理状态
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })
  const [advancedFilters, setAdvancedFilters] = useState({
    resolution: '',
    minDuration: '',
    maxDuration: ''
  })
  const [selectedHistory, setSelectedHistory] = useState<string[]>([])
  const [showBatchActions, setShowBatchActions] = useState(false)  
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  
  // 增强导出选项状态
  const [imageExportOptions, setImageExportOptions] = useState({
    format: 'png' as 'png' | 'jpeg' | 'webp',
    quality: 90,
    resolution: 'original' as 'original' | '480p' | '720p' | '1080p'
  })
  const [videoExportOptions, setVideoExportOptions] = useState({
    format: 'mp4' as 'mp4' | 'webm' | 'avi',
    quality: 'high' as 'low' | 'medium' | 'high',
    resolution: 'original' as 'original' | '480p' | '720p' | '1080p'
  })
  
  // 图片编辑状态
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

  const [batchExportModalOpen, setBatchExportModalOpen] = useState(false)
  const [selectedExportItems, setSelectedExportItems] = useState<number[]>([])
  
  // 实时通知系统状态
  interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    timestamp: number;
    read: boolean;
    url?: string;
  }
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    enableDesktop: true,
    enableSound: true,
    showNotifications: true,
    maxNotifications: 50
  })
  const [unreadCount, setUnreadCount] = useState(0)
  
  // 交互式教程状态
  interface TutorialStep {
    id: string;
    title: string;
    description: string;
    targetSelector: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    nextText?: string;
    prevText?: string;
    skipText?: string;
  }
  
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: '欢迎使用津门·灵感引擎',
      description: '这是一个强大的AI创作平台，帮助您快速生成津门文化相关的创意内容。',
      targetSelector: '.relative.container',
      position: 'top',
      nextText: '开始了解'
    },
    {
      id: 'brand-selection',
      title: '选择品牌',
      description: '从预设品牌中选择一个，或者输入您自己的品牌名称。',
      targetSelector: 'select[name="brand"]',
      position: 'bottom',
      nextText: '下一步',
      prevText: '上一步'
    },
    {
      id: 'tags',
      title: '选择标签',
      description: '选择相关标签，或者添加您自己的自定义标签，帮助AI更好地理解您的需求。',
      targetSelector: '.flex.flex-wrap.gap-2',
      position: 'bottom',
      nextText: '下一步',
      prevText: '上一步'
    },
    {
      id: 'prompt',
      title: '输入提示词',
      description: '输入您的创作需求，AI会根据您的提示生成创意内容。',
      targetSelector: 'textarea[placeholder*="掌柜的"]',
      position: 'bottom',
      nextText: '下一步',
      prevText: '上一步'
    },
    {
      id: 'generate',
      title: '生成内容',
      description: '点击"注入灵感"按钮，AI将开始生成创意内容。',
      targetSelector: 'button:contains("注入灵感")',
      position: 'bottom',
      nextText: '完成',
      prevText: '上一步'
    },
    {
      id: 'results',
      title: '查看结果',
      description: '生成完成后，您可以查看AI生成的创意内容，包括图片、视频和文本。',
      targetSelector: '.grid.grid-cols-1.gap-4',
      position: 'top',
      nextText: '完成',
      prevText: '上一步',
      skipText: '跳过教程'
    }
  ];
  
  const [showTutorial, setShowTutorial] = useState(false)
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0)
  const [tutorialCompleted, setTutorialCompleted] = useState(false)

  // 工具箱状态
  const [showToolsModal, setShowToolsModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  
  // 统计数据状态
  const [statsData, setStatsData] = useState({
    worksCount: 0,
    followersCount: 0,
    followingCount: 0,
    favoritesCount: 0,
    todayPointsUsed: 0,
    totalGenerations: 0,
    hotTags: [] as Array<{name: string, count: number}>,
    isLoading: false,
    error: null as string | null
  })

  // 获取统计数据
  const fetchStatsData = async () => {
    setStatsData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // 获取用户统计数据
      const userStats = await userStatsService.getUserStats(user?.id || 'current-user');
      
      // 获取发布统计数据
      const publishStats = await workService.getPublishStats();
      
      // 计算总生成次数（作品数 + 历史记录数）
      const totalGenerations = userStats.worksCount + videoHistory.length;
      
      // 模拟今日消耗积分（实际应从API获取）
      const todayPointsUsed = Math.floor(Math.random() * 50) + 5;
      
      // 生成热门标签数据
      const hotTags = [
        { name: '赛博朋克', count: Math.floor(Math.random() * 50) + 20 },
        { name: '杨柳青年画', count: Math.floor(Math.random() * 50) + 20 },
        { name: '泥人张', count: Math.floor(Math.random() * 50) + 20 },
        { name: '水墨风', count: Math.floor(Math.random() * 50) + 20 },
        { name: '未来主义', count: Math.floor(Math.random() * 50) + 20 },
        { name: '传统纹样', count: Math.floor(Math.random() * 50) + 20 }
      ];
      
      setStatsData({
        worksCount: userStats.worksCount,
        followersCount: userStats.followersCount,
        followingCount: userStats.followingCount,
        favoritesCount: userStats.favoritesCount,
        todayPointsUsed,
        totalGenerations,
        hotTags,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setStatsData(prev => ({
        ...prev,
        isLoading: false,
        error: '获取统计数据失败，请稍后重试'
      }));
      toast.error('获取统计数据失败');
    }
  };

  // 处理功能点击
  const handleFeatureClick = (featureId: string) => {
    if (featureId === 'presets') {
      openPresetModal();
    } else if (featureId === 'tools') {
      setShowToolsModal(true);
    } else if (featureId === 'stats') {
      fetchStatsData();
      setShowStatsModal(true);
    }
  };

  // AI生成与活动参与新功能状态
  const [generationMode, setGenerationMode] = useState<'text-to-image' | 'image-to-video' | 'text-to-video' | 'image-to-image'>('text-to-image')
  const [uploadedImage, setUploadedImage] = useState<string>('')
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  
  // Image-to-Image parameters
  const [similarity, setSimilarity] = useState<number>(70)
  const [selectedStyle, setSelectedStyle] = useState<string>('默认')
  
  // 活动参与状态
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<string>('')
  const [submissionForm, setSubmissionForm] = useState({
    workTitle: '',
    workDesc: '',
    authorName: '',
    authorPhone: ''
  })
  const [submittingWork, setSubmittingWork] = useState(false)
  const [submissionTargetUrl, setSubmissionTargetUrl] = useState('') // 要提交的作品URL
  
  // 通知功能函数
  const addNotification = (item: {
    title: string;
    message: string;
    type?: 'success' | 'info' | 'warning' | 'error';
    url?: string;
    showDesktop?: boolean;
  }) => {
    const newNotification: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: item.title,
      message: item.message,
      type: item.type || 'info',
      timestamp: Date.now(),
      read: false,
      url: item.url
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, notificationSettings.maxNotifications);
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
    
    // 发送桌面通知
    if (item.showDesktop !== false && notificationSettings.enableDesktop && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(item.title, {
          body: item.message,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(item.title, {
              body: item.message,
              icon: '/favicon.ico'
            });
          }
        });
      }
    }
  };
  
  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      setUnreadCount(0);
      return updated;
    });
  };
  
  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };
  
  // 交互式教程功能函数
  const startTutorial = () => {
    setShowTutorial(true);
    setCurrentTutorialStep(0);
    setTutorialCompleted(false);
  };
  
  const skipTutorial = () => {
    setShowTutorial(false);
    setTutorialCompleted(true);
    // 保存教程状态到本地存储
    try {
      localStorage.setItem('NEO_TUTORIAL_COMPLETED', 'true');
    } catch {}
  };
  
  const nextTutorialStep = () => {
    if (currentTutorialStep < tutorialSteps.length - 1) {
      setCurrentTutorialStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };
  
  const prevTutorialStep = () => {
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep(prev => prev - 1);
    }
  };
  
  const completeTutorial = () => {
    setShowTutorial(false);
    setTutorialCompleted(true);
    // 保存教程状态到本地存储
    try {
      localStorage.setItem('NEO_TUTORIAL_COMPLETED', 'true');
    } catch {}
    addNotification({
      title: '教程完成',
      message: '恭喜您完成了交互式教程！现在您可以开始使用津门·灵感引擎进行创作了。',
      type: 'success',
      showDesktop: true
    });
  };
  
  // 检查是否需要显示教程 - 已禁用
  /* useEffect(() => {
    try {
      const completed = localStorage.getItem('NEO_TUTORIAL_COMPLETED');
      if (!completed) {
        // 延迟显示教程，给用户时间熟悉界面
        const timer = setTimeout(() => {
          setShowTutorial(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []); */
  
  // 加载历史记录
  useEffect(() => {
    try {
      const raw = localStorage.getItem('NEO_VIDEO_HISTORY')
      const arr = raw ? JSON.parse(raw) : []
      if (Array.isArray(arr)) {
        // 确保每个历史项都有必要的字段
        const processed = arr.filter(item => item && item.url) // 过滤掉没有url的项
          .map(item => ({
            ...item,
            url: item.url || '',
            image: item.image || '',
            createdAt: item.createdAt || Date.now(),
            isFavorite: item.isFavorite || false,
            type: item.type || 'video'
          }))
        setVideoHistory(processed)
      }
    } catch {}
  }, [])
  
  // 保存创作状态到本地存储和数据库
  const saveCreationState = () => {
    try {
      const state = {
        prompt,
        brand,
        tags,
        customBrand,
        useCustomBrand,
        textStyle,
        videoParams,
        engine
      }
      localStorage.setItem('NEO_CREATION_STATE', JSON.stringify(state))
      
      // 异步保存到数据库
      userStateService.saveNeoCreationState(state).catch(err => {
        console.error('[Neo] Failed to save creation state to database:', err)
      })
    } catch {}
  }

  // 从本地存储恢复创作状态
  const loadCreationState = () => {
    try {
      const raw = localStorage.getItem('NEO_CREATION_STATE')
      if (raw) {
        const state = JSON.parse(raw)
        if (state) {
          setPrompt(state.prompt || '')
          setBrand(state.brand || 'mahua')
          setTags(state.tags || [])
          setCustomBrand(state.customBrand || '')
          setUseCustomBrand(state.useCustomBrand || false)
          setTextStyle(state.textStyle || 'creative')
          setVideoParams(state.videoParams || {
            duration: 5,
            resolution: '720p',
            cameraFixed: false
          })
          setEngine(state.engine || 'sdxl')
          // 恢复品牌故事
          if (state.brand) {
            updateStory(state.brand)
          }
        }
      }
    } catch {}
  }

  // 保存历史记录到本地和数据库
  const saveHistory = (entry: Omit<HistoryItem, 'isFavorite' | 'type'>) => {
    const newEntry: HistoryItem = {
      ...entry,
      isFavorite: false,
      type: 'video'
    }
    setVideoHistory(prev => {
      const next = [newEntry, ...prev].slice(0, 30) // 增加到30条历史记录
      try { localStorage.setItem('NEO_VIDEO_HISTORY', JSON.stringify(next)) } catch {}
      
      // 异步保存到数据库
      userStateService.saveHistoryItem({
        type: 'video',
        url: entry.url,
        thumbnail: entry.thumb || entry.image,
        title: entry.prompt?.substring(0, 50),
        prompt: entry.prompt,
        metadata: {
          duration: entry.duration,
          width: entry.width,
          height: entry.height,
          createdAt: entry.createdAt
        },
        isFavorite: false,
        createdAt: entry.createdAt
      }).catch(err => {
        console.error('[Neo] Failed to save history to database:', err)
      })
      
      return next
    })
  }
  
  // 更新历史记录元数据
  const updateHistoryMeta = (url: string, meta: { duration?: number; width?: number; height?: number }) => {
    setVideoHistory(prev => {
      const next = prev.map(it => (it.url === url ? { ...it, ...meta } : it))
      try { localStorage.setItem('NEO_VIDEO_HISTORY', JSON.stringify(next)) } catch {}
      return next
    })
  }
  
  // 切换收藏状态
  const toggleFavorite = (url: string) => {
    setVideoHistory(prev => {
      const next = prev.map(it => {
        if (it.url === url) {
          return { ...it, isFavorite: !it.isFavorite }
        }
        return it
      })
      try { localStorage.setItem('NEO_VIDEO_HISTORY', JSON.stringify(next)) } catch {}
      return next
    })
  }

  // 批量操作功能
  const toggleSelectHistory = (url: string) => {
    setSelectedHistory(prev => {
      const newSelection = prev.includes(url)
        ? prev.filter(u => u !== url)
        : [...prev, url]
      setShowBatchActions(newSelection.length > 0)
      return newSelection
    })
  }

  const selectAllHistory = () => {
    if (selectedHistory.length === filteredHistory.length) {
      // 取消全选
      setSelectedHistory([])
      setShowBatchActions(false)
    } else {
      // 全选
      const allUrls = filteredHistory.map(item => item.url)
      setSelectedHistory(allUrls)
      setShowBatchActions(true)
    }
  }

  const batchDeleteHistory = () => {
    if (selectedHistory.length === 0) return
    
    setVideoHistory(prev => {
      const next = prev.filter(item => !selectedHistory.includes(item.url))
      try { localStorage.setItem('NEO_VIDEO_HISTORY', JSON.stringify(next)) } catch {}
      return next
    })
    
    setSelectedHistory([])
    setShowBatchActions(false)
    toast.success(`已删除 ${selectedHistory.length} 条历史记录`)
  }

  const batchToggleFavorite = () => {
    if (selectedHistory.length === 0) return
    
    setVideoHistory(prev => {
      // 检查选中项是否都已收藏
      const allFavorites = selectedHistory.every(url => {
        const item = prev.find(i => i.url === url)
        return item?.isFavorite === true
      })
      
      // 批量切换收藏状态
      const next = prev.map(item => {
        if (selectedHistory.includes(item.url)) {
          return { ...item, isFavorite: !allFavorites }
        }
        return item
      })
      
      try { localStorage.setItem('NEO_VIDEO_HISTORY', JSON.stringify(next)) } catch {}
      return next
    })
    
    setSelectedHistory([])
    setShowBatchActions(false)
    toast.success(`已更新 ${selectedHistory.length} 条历史记录的收藏状态`)
  }

  // 导出历史记录
  const exportHistory = () => {
    if (filteredHistory.length === 0) {
      toast.warning('没有可导出的历史记录')
      return
    }
    
    let data: string
    let fileName: string
    
    if (exportFormat === 'json') {
      data = JSON.stringify(filteredHistory, null, 2)
      fileName = `neo-history-${new Date().toISOString().slice(0, 10)}.json`
    } else {
      // CSV格式
      const headers = ['URL', 'Thumbnail', 'Created At', 'Duration', 'Resolution', 'Favorite', 'Type']
      const rows = filteredHistory.map(item => [
        item.url,
        item.thumb || item.image,
        new Date(item.createdAt || 0).toISOString(),
        item.duration || '',
        item.width && item.height ? `${item.width}×${item.height}` : '',
        item.isFavorite ? 'Yes' : 'No',
        item.type || 'video'
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      data = csvContent
      fileName = `neo-history-${new Date().toISOString().slice(0, 10)}.csv`
    }
    
    // 创建下载链接
    const blob = new Blob([data], { type: exportFormat === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`已导出 ${filteredHistory.length} 条历史记录`)
  }

  // 增强导出选项功能
  const exportImage = (index: number, options?: typeof imageExportOptions) => {
    const imageUrl = images[index]
    if (!imageUrl) return
    
    const exportOpts = options || imageExportOptions
    const fileName = `neo-image-${index}-${new Date().getTime()}.${exportOpts.format}`
    
    // 这里实现增强的图片导出功能，目前使用简单的下载
    toast.info(`图片将以 ${exportOpts.format} 格式导出，质量：${exportOpts.quality}%，分辨率：${exportOpts.resolution}`)
    
    // 创建下载链接
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const exportVideo = (index: number, options?: typeof videoExportOptions) => {
    const videoUrl = videoByIndex[index]
    if (!videoUrl) return
    
    const exportOpts = options || videoExportOptions
    const fileName = `neo-video-${index}-${new Date().getTime()}.${exportOpts.format}`
    
    // 这里实现增强的视频导出功能，目前使用简单的下载
    toast.info(`视频将以 ${exportOpts.format} 格式导出，质量：${exportOpts.quality}，分辨率：${exportOpts.resolution}`)
    
    // 创建下载链接
    const a = document.createElement('a')
    a.href = `${apiBase ? `${apiBase}` : ''}/api/proxy/video?url=${encodeURIComponent(videoUrl)}`
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const openBatchExportModal = () => {
    setSelectedExportItems([])
    setBatchExportModalOpen(true)
  }

  const closeBatchExportModal = () => {
    setBatchExportModalOpen(false)
  }

  const toggleSelectExportItem = (index: number) => {
    setSelectedExportItems(prev => {
      return prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    })
  }

  const selectAllExportItems = () => {
    if (selectedExportItems.length === images.length) {
      // 取消全选
      setSelectedExportItems([])
    } else {
      // 全选
      setSelectedExportItems(images.map((_, index) => index))
    }
  }

  const batchExportItems = () => {
    if (selectedExportItems.length === 0) {
      toast.warning('请选择要导出的项')
      return
    }
    
    // 这里实现批量导出功能
    toast.info(`将导出 ${selectedExportItems.length} 项，格式：${imageExportOptions.format}，质量：${imageExportOptions.quality}%`)
    
    // 逐个导出
    selectedExportItems.forEach(index => {
      exportImage(index)
    })
    
    closeBatchExportModal()
    toast.success(`已启动 ${selectedExportItems.length} 项的导出任务`)
  }

  // 重置筛选条件
  const resetFilters = () => {
    setHistorySearch('')
    setHistoryFilter('all')
    setHistorySort('latest')
    setDateRange({ start: '', end: '' })
    setAdvancedFilters({ resolution: '', minDuration: '', maxDuration: '' })
  }
  
  // 过滤和排序历史记录
  const filteredHistory = videoHistory.filter(item => {
    // 确保item是有效的且有url
    if (!item || !item.url) return false;
    
    // 搜索过滤
    const matchesSearch = historySearch === '' || 
      (item.url && item.url.includes(historySearch)) ||
      (item.width && item.height && `${item.width}×${item.height}`.includes(historySearch))
    
    // 类型过滤
    const matchesFilter = 
      historyFilter === 'all' || 
      (historyFilter === 'favorite' && item.isFavorite) ||
      (historyFilter === 'video' && item.type === 'video')
    
    // 日期范围过滤
    const matchesDateRange = !dateRange.start || !dateRange.end || (
      (() => {
        const createdAtDate = new Date(item.createdAt || 0);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // 设置为结束日期的最后一刻
        return createdAtDate >= startDate && createdAtDate <= endDate;
      })()
    )
    
    // 分辨率过滤
    const matchesResolution = !advancedFilters.resolution || (
      (() => {
        const resolutionStr = `${item.width}×${item.height}`;
        return resolutionStr.includes(advancedFilters.resolution);
      })()
    )
    
    // 时长范围过滤
    const matchesDuration = (
      (() => {
        const duration = item.duration || 0;
        const minDur = advancedFilters.minDuration ? parseFloat(advancedFilters.minDuration) : 0;
        const maxDur = advancedFilters.maxDuration ? parseFloat(advancedFilters.maxDuration) : Infinity;
        return duration >= minDur && duration <= maxDur;
      })()
    )
    
    return matchesSearch && matchesFilter && matchesDateRange && matchesResolution && matchesDuration
  }).sort((a, b) => {
    // 确保a和b是有效的
    if (!a || !b || typeof a.createdAt !== 'number' || typeof b.createdAt !== 'number') {
      return 0;
    }
    
    // 排序
    if (historySort === 'latest') {
      return b.createdAt - a.createdAt
    } else {
      return a.createdAt - b.createdAt
    }
  })
  
  // 用户反馈状态管理
  const [feedbacks, setFeedbacks] = useState<Record<string, { rating: number; comment: string }>>({})
  const [showFeedback, setShowFeedback] = useState<string | null>(null)
  
  // 加载反馈数据
  useEffect(() => {
    try {
      const raw = localStorage.getItem('NEO_FEEDBACKS')
      const data = raw ? JSON.parse(raw) : {}
      setFeedbacks(data)
    } catch {}
  }, [])
  
  // 保存反馈
  const saveFeedback = (id: string, rating: number, comment: string) => {
    const newFeedback = {
      rating,
      comment
    }
    setFeedbacks(prev => {
      const next = { ...prev, [id]: newFeedback }
      try { localStorage.setItem('NEO_FEEDBACKS', JSON.stringify(next)) } catch {}
      return next
    })
    setShowFeedback(null)
    toast.success('反馈已提交，感谢您的参与！')
  }
  const formatDuration = (d?: number) => {
    if (!d || !isFinite(d)) return ''
    const m = Math.floor(d / 60)
    const s = Math.floor(d % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }
  const formatResolution = (w?: number, h?: number) => (w && h ? `${w}×${h}` : '')
  const formatTime = (ts?: number) => {
    if (!ts) return ''
    const ms = ts > 10_000_000_000 ? ts : ts * 1000
    const d = new Date(ms)
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    return `${y}-${m}-${day} ${hh}:${mm}`
  }
  const [brand, setBrand] = useState('mahua')
  const [story, setStory] = useState(BRAND_STORIES['mahua'])
  const [tags, setTags] = useState<string[]>([])
  const [customTags, setCustomTags] = useState<string[]>(getCustomTags())
  const [newTag, setNewTag] = useState('')
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [progress, setProgress] = useState(0)
  const [showOutput, setShowOutput] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<string[]>([])
  const [aiText, setAiText] = useState('')
  const [aiDirections, setAiDirections] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optStatus, setOptStatus] = useState<'idle'|'running'|'done'>('idle')
  const [optPreview, setOptPreview] = useState('')
  const [lastUserPrompt, setLastUserPrompt] = useState('')
  const [lastOptimizedPrompt, setLastOptimizedPrompt] = useState('')
  const [engine, setEngine] = useState<'sdxl' | 'qwen'>('sdxl')
  const [qaAnswer, setQaAnswer] = useState('')
  const [qaLoading, setQaLoading] = useState(false)
  const [videoByIndex, setVideoByIndex] = useState<string[]>([])
  const [ttsUrl, setTtsUrl] = useState('')
  const [useCustomBrand, setUseCustomBrand] = useState(false)
  const [customBrand, setCustomBrand] = useState('')
  const [textStyle, setTextStyle] = useState<'formal' | 'humorous' | 'creative' | 'poetic'>('creative')
  const [generationStatus, setGenerationStatus] = useState<string>('')
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({})
  const [videoStatus, setVideoStatus] = useState<Record<string, string>>({})
  // 文案生成缓存，避免重复生成
  const [aiTextCache, setAiTextCache] = useState<Record<string, string>>({})
  // 文案生成进度
  const [aiTextProgress, setAiTextProgress] = useState(0)
  
  // 图片编辑工具状态
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)
  const [editMode, setEditMode] = useState<'crop' | 'rotate' | 'filter' | 'resize'>('crop')
  const [cropParams, setCropParams] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const [filter, setFilter] = useState('none')
  const [filteredImages, setFilteredImages] = useState<string[]>([])
  const [showPlanLibrary, setShowPlanLibrary] = useState(false)
  const [savedPlans, setSavedPlans] = useState<Array<{ id: string; title: string; query: string; aiText: string; ts: number }>>([])

  // 保存到方案库
  const saveToPlanLibrary = () => {
    if (!prompt.trim()) {
      toast.warning('暂无内容可保存')
      return
    }
    
    // 从本地存储加载现有方案
    const existingPlans = JSON.parse(localStorage.getItem('TOOLS_SAVED_PLANS') || '[]')
    
    // 创建新方案
    const newPlan = {
      id: String(Date.now()),
      title: prompt.split('\n')[0] || '未命名方案',
      query: prompt,
      aiText: '',
      ts: Date.now()
    }
    
    // 添加到方案库并限制数量
    const updatedPlans = [newPlan, ...existingPlans].slice(0, 20)
    setSavedPlans(updatedPlans)
    
    try {
      localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(updatedPlans))
      toast.success('已保存到方案库')
    } catch (error) {
      console.error('保存方案库失败:', error)
      toast.error('保存失败，请稍后再试')
    }
  }

  // Load saved plans from local storage
  useEffect(() => {
    try {
      const plansRaw = localStorage.getItem('TOOLS_SAVED_PLANS');
      if (plansRaw) {
        const plans = JSON.parse(plansRaw);
        setSavedPlans(plans);
      }
    } catch (error) {
      console.error('加载方案库失败:', error);
    }
  }, []);

  // Apply plan to prompt
  const applyPlan = (planId: string) => {
    const plan = savedPlans.find(x => x.id === planId);
    if (plan) {
      setPrompt(plan.aiText || plan.query);
      setShowPlanLibrary(false);
      toast.success('已应用方案');
    }
  };

  // 从方案库中删除方案
  const removePlan = (planId: string) => {
    const nextPlans = savedPlans.filter(x => x.id !== planId);
    setSavedPlans(nextPlans);
    try {
      localStorage.setItem('TOOLS_SAVED_PLANS', JSON.stringify(nextPlans));
      toast.success('已从方案库中删除');
    } catch (error) {
      console.error('保存方案库失败:', error);
    }
  };

  // 清空方案库
  const clearPlans = () => {
    setSavedPlans([]);
    try {
      localStorage.removeItem('TOOLS_SAVED_PLANS');
      toast.success('已清空方案库');
    } catch (error) {
      console.error('清空方案库失败:', error);
    }
  };
  const [originalImage, setOriginalImage] = useState('')
  const [showEditPanel, setShowEditPanel] = useState(false)
  // 视频参数自定义
  const [videoParams, setVideoParams] = useState({
    duration: 5,
    resolution: '720p' as '480p' | '720p' | '1080p',
    cameraFixed: false
  })
  
  // 风格预设相关状态
  const [stylePresets, setStylePresets] = useState<StylePreset[]>([])
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'design' | 'results' | 'history'>('create')
  const [presetForm, setPresetForm] = useState({
    name: '',
    description: '',
    brand: '',
    tags: [] as string[],
    prompt: '',
    engine: 'sdxl' as 'sdxl' | 'qwen',
    textStyle: 'creative' as 'formal' | 'humorous' | 'creative' | 'poetic',
    videoParams: {
      duration: 5,
      resolution: '720p' as '480p' | '720p' | '1080p',
      cameraFixed: false
    }
  })
  
  const engineCardRef = useRef<HTMLDivElement | null>(null)
  const optTimerRef = useRef<any>(null)

  // 添加自定义标签
  const addCustomTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !customTags.includes(trimmed) && !TAGS.includes(trimmed)) {
      const updated = [...customTags, trimmed]
      setCustomTags(updated)
      saveCustomTags(updated)
      setNewTag('')
    }
  }

  // 删除自定义标签
  const removeCustomTag = (tagToRemove: string) => {
    const updated = customTags.filter(tag => tag !== tagToRemove)
    setCustomTags(updated)
    saveCustomTags(updated)
    // 从当前选中的标签中移除
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  // 编辑自定义标签
  const startEditTag = (tag: string) => {
    setEditingTag(tag)
    setNewTag(tag)
  }

  // 保存编辑后的标签
  const saveEditedTag = () => {
    if (editingTag) {
      const trimmed = newTag.trim()
      if (trimmed && trimmed !== editingTag) {
        const updated = customTags.map(tag => tag === editingTag ? trimmed : tag)
        setCustomTags(updated)
        saveCustomTags(updated)
        // 更新当前选中的标签
        setTags(prev => prev.map(tag => tag === editingTag ? trimmed : tag))
      }
      setEditingTag(null)
      setNewTag('')
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingTag(null)
    setNewTag('')
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('query') || ''
    const from = params.get('from') || ''
    if (q) setPrompt(q)
    if (from === 'home') {
      engineCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.search])

  // 加载风格预设
  useEffect(() => {
    setStylePresets(getStylePresets())
  }, [])

  // 组件挂载时加载创作状态
  useEffect(() => {
    loadCreationState()
  }, [])

  // 创作内容发生变化时自动保存
  useEffect(() => {
    saveCreationState()
  }, [prompt, brand, tags, customBrand, useCustomBrand, textStyle, videoParams, engine])

  useEffect(() => {
    return () => { if (optTimerRef.current) clearTimeout(optTimerRef.current) }
  }, [])

  // 打开预设模态框
  const openPresetModal = (preset?: StylePreset) => {
    if (preset) {
      setEditingPresetId(preset.id)
      setPresetForm({
        name: preset.name,
        description: preset.description || '',
        brand: preset.brand,
        tags: preset.tags,
        prompt: preset.prompt,
        engine: preset.engine,
        textStyle: preset.textStyle,
        videoParams: preset.videoParams
      })
    } else {
      setEditingPresetId(null)
      setPresetForm({
        name: '',
        description: '',
        brand: brand,
        tags: tags,
        prompt: prompt,
        engine: engine,
        textStyle: textStyle,
        videoParams: videoParams
      })
    }
    setShowPresetModal(true)
  }

  // 关闭预设模态框
  const closePresetModal = () => {
    setShowPresetModal(false)
    setTimeout(() => {
      setEditingPresetId(null)
      setPresetForm({
        name: '',
        description: '',
        brand: '',
        tags: [],
        prompt: '',
        engine: 'sdxl',
        textStyle: 'creative',
        videoParams: {
          duration: 5,
          resolution: '720p',
          cameraFixed: false
        }
      })
    }, 300)
  }

  // 保存预设
  const savePreset = () => {
    if (!presetForm.name.trim()) {
      toast.warning('请输入预设名称')
      return
    }

    const newPreset: StylePreset = {
      id: editingPresetId || `preset-${Date.now()}`,
      name: presetForm.name.trim(),
      description: presetForm.description.trim(),
      brand: presetForm.brand,
      tags: presetForm.tags,
      prompt: presetForm.prompt,
      engine: presetForm.engine,
      textStyle: presetForm.textStyle,
      videoParams: presetForm.videoParams,
      createdAt: editingPresetId ? stylePresets.find(p => p.id === editingPresetId)?.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now()
    }

    let updatedPresets: StylePreset[]
    if (editingPresetId) {
      updatedPresets = stylePresets.map(p => p.id === editingPresetId ? newPreset : p)
    } else {
      updatedPresets = [...stylePresets, newPreset]
    }

    setStylePresets(updatedPresets)
    saveStylePresets(updatedPresets)
    toast.success(editingPresetId ? '预设已更新' : '预设已创建')
    closePresetModal()
  }

  // 删除预设
  const deletePreset = (id: string) => {
    const updatedPresets = stylePresets.filter(p => p.id !== id)
    setStylePresets(updatedPresets)
    saveStylePresets(updatedPresets)
    toast.success('预设已删除')
  }

  // 应用预设
  const applyPreset = (preset: StylePreset) => {
    setBrand(preset.brand)
    updateStory(preset.brand)
    setTags(preset.tags)
    setPrompt(preset.prompt)
    setEngine(preset.engine)
    setTextStyle(preset.textStyle)
    setVideoParams(preset.videoParams)
    toast.success('预设已应用')
  }

  const updateStory = (val: string) => {
    setBrand(val)
    const s = BRAND_STORIES[val]
    if (s) setStory(s)
    else setStory(val ? `为 ${val} 创作的灵感简介，请结合品牌特色与天津文化。` : '')
  }

  // 生成缓存键的辅助函数
  const generateCacheKey = (input: string, style: string): string => {
    return `${input}_${style}_${textStyle}`
  }

  const optimizePrompt = async () => {
    const base = prompt.trim()
    if (!base) { toast.warning('请输入提示词'); return }
    setOptimizing(true)
    setOptStatus('running')
    setOptPreview('')
    setLastUserPrompt(base)
    const prev = llmService.getCurrentModel().id
    const prevStream = llmService.getConfig().stream
    try {
      const chosen = await (llmService as any).ensureAvailableModel(['deepseek', 'kimi', 'qwen', 'wenxinyiyan'])
      if (chosen !== prev) llmService.setCurrentModel(chosen)
      llmService.updateConfig({ stream: true })
      const context = `${base} ${tags.join(' ')} ${brand}`.trim()
      const instruction = `请将以下提示词优化为更清晰、可直接用于AI绘图的单句提示，包含主体、风格、构图、细节、光影、材质、配色，避免解释。重要：请用中文输出结果。\n${context}`
      const final = await llmService.generateResponse(instruction, { onDelta: (chunk: string) => setOptPreview(chunk) })
      const text = (final || base).trim()
      setPrompt(text)
      setLastOptimizedPrompt(text)
      setOptStatus('done')
      if (final && !/未配置密钥|返回模拟响应/.test(final)) {
        toast.success('已用DeepSeek优化提示词')
      } else {
        toast.info('已使用模拟响应优化提示词')
      }
    } catch (e: any) {
      toast.error(e?.message || '优化失败')
    } finally {
      llmService.setCurrentModel(prev)
      llmService.updateConfig({ stream: prevStream })
      setOptimizing(false)
    }
  }

  const toggleTag = (t: string) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  // 中文注释：应用AI建议到提示词，并快速生成简短中文文案（用于填充“AI文案”区域）
  const applyDirection = async (dir: string): Promise<void> => {
    const base = `${prompt} ${dir}`.trim()
    toggleTag(dir)
    setPrompt(base)
    
    // 生成缓存键
    const cacheKey = generateCacheKey(dir, textStyle)
    
    // 检查缓存中是否已有对应内容
    if (aiTextCache[cacheKey]) {
      toast.info('使用缓存的文案内容')
      setAiText(aiTextCache[cacheKey])
      return
    }
    
    // 添加操作开始提示
    toast.info('正在生成文案，请稍候...')
    
    try {
      setIsGenerating(true)
      setAiText('')
      const styleDesc: Record<string, string> = {
        formal: '正式、专业、严谨的风格',
        humorous: '幽默、轻松、有趣的风格',
        creative: '创意、独特、富有想象力的风格',
        poetic: '诗意、优美、富有文采的风格'
      }
      const instruction = `请基于以下方向输出一段不超过120字的中文文案，要求${styleDesc[textStyle]}，通俗易懂，便于朗读：\n方向：${dir}\n提示：${base || '天津文化设计灵感'}`
      
      // 使用流式响应，让用户看到实时生成的内容
      let generatedText = ''
      let progress = 0
      const text = await llmService.generateResponse(instruction, {
        onDelta: (chunk: string) => {
          generatedText += chunk
          setAiText(generatedText)
          // 简单的进度计算，基于文本长度
          progress = Math.min(100, Math.floor((generatedText.length / 120) * 100))
          setAiTextProgress(progress)
        }
      })
      
      const finalText = (text || '').trim()
      setAiText(finalText)
      
      // 将生成的文案存入缓存
      setAiTextCache(prev => ({
        ...prev,
        [cacheKey]: finalText
      }))
      
      // 重置进度状态
      setAiTextProgress(0)
      
      toast.success('文案生成成功！')
    } catch (error) {
      console.error('生成文案失败:', error)
      toast.error('生成文案失败，请稍后重试')
      // 即使失败也保持界面清洁
      setAiText('')
      // 重置进度状态
      setAiTextProgress(0)
    } finally {
      setIsGenerating(false)
    }
  }

  // 中文注释：重新生成AI建议（根据当前输入）
  const regenerateDirections = (): void => {
    try {
      const input = `${prompt} ${tags.join(' ')} ${brand}`.trim() || '天津文化设计灵感'
      const dirs = llmService.generateCreativeDirections(input)
      setAiDirections(dirs)
      toast.success('已刷新AI建议')
    } catch {
      toast.error('刷新建议失败，请稍后重试')
    }
  }

  const genImages = (extra: string = '') => {
    const base = `${prompt} ${tags.join(' ')} ${brand} ${extra}`.trim() || 'Tianjin cultural design'
    return [
      `https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop&prompt=${encodeURIComponent(base + ' variant A')}`,
      `https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop&prompt=${encodeURIComponent(base + ' variant B')}`,
      `https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600&h=400&fit=crop&prompt=${encodeURIComponent(base + ' variant C')}`,
    ]
  }

  // 图片编辑工具功能函数
  const openImageEditor = (index: number) => {
    setEditingImageIndex(index)
    setEditingImageUrl(images[index])
  }

  const closeImageEditor = () => {
    setEditingImageIndex(null)
    setEditingImageUrl(null)
  }

  const handleEditorSave = (newUrl: string) => {
    if (editingImageIndex !== null) {
      setImages(prev => {
        const next = [...prev]
        next[editingImageIndex] = newUrl
        return next
      })
      // 同时保存到历史记录
      saveHistory({
        url: newUrl, // 这里可能是base64，对于演示没问题，生产环境应上传
        image: newUrl,
        createdAt: Date.now(),
        type: 'image'
      })
    }
    closeImageEditor()
  }

  const applyCrop = () => {
    // 这里实现裁剪功能，目前使用简单的状态更新
    toast.info('裁剪功能已应用')
  }

  const applyRotation = (degrees: number) => {
    setRotation(prev => (prev + degrees) % 360)
  }

  const applyFilter = (filterName: string) => {
    setFilter(filterName)
    // 这里实现滤镜功能，目前使用简单的状态更新
    toast.info(`${filterName}滤镜已应用`)
  }

  const applyScale = (scaleFactor: number) => {
    setScale(prev => Math.max(0.1, Math.min(3, prev + scaleFactor)))
  }

  const resetEdit = () => {
    setRotation(0)
    setScale(1)
    setFilter('none')
    setCropParams({ x: 0, y: 0, width: 0, height: 0 })
    setFilteredImages([...images])
  }

  const saveEditedImage = () => {
    if (editingImageIndex === null) return
    
    // 这里实现保存编辑后的图片功能，目前使用简单的状态更新
    setImages(prev => {
      const newImages = [...prev]
      newImages[editingImageIndex] = filteredImages[editingImageIndex] || prev[editingImageIndex]
      return newImages
    })
    
    toast.success('图片编辑已保存')
    closeImageEditor()
  }

  // 获取活动列表
  const fetchActivitiesList = async () => {
    try {
      const list = await tianjinActivityService.getActivities()
      setActivities(list)
    } catch (error) {
      console.error('获取活动列表失败:', error)
      toast.error('获取活动列表失败')
    }
  }

  // 打开活动投稿模态框
  const openActivityModal = (url: string) => {
    setSubmissionTargetUrl(url)
    setSubmissionForm(prev => ({ ...prev, workTitle: prompt.slice(0, 20) || '我的创意作品' }))
    setShowActivityModal(true)
    fetchActivitiesList()
  }

  // 提交作品
  const handleActivitySubmit = async () => {
    if (!selectedActivity) {
      toast.warning('请选择要参加的活动')
      return
    }
    if (!submissionForm.workTitle || !submissionForm.authorName || !submissionForm.authorPhone) {
      toast.warning('请填写完整的投稿信息')
      return
    }

    setSubmittingWork(true)
    try {
      const result = await tianjinActivityService.submitWork({
        activityId: selectedActivity,
        workTitle: submissionForm.workTitle,
        workDesc: submissionForm.workDesc,
        workUrl: submissionTargetUrl,
        authorName: submissionForm.authorName,
        authorPhone: submissionForm.authorPhone
      })

      if (result.ok) {
        toast.success('作品投稿成功！')
        setShowActivityModal(false)
        // 重置表单
        setSubmissionForm({
          workTitle: '',
          workDesc: '',
          authorName: '',
          authorPhone: ''
        })
        setSelectedActivity('')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('投稿失败，请稍后重试')
    } finally {
      setSubmittingWork(false)
    }
  }

  // 处理图片上传（用于图生视频和图生图）
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 验证文件大小
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过 5MB')
        return
      }
      
      // 验证文件格式
      const allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedFormats.includes(file.type)) {
        toast.error('只支持 JPG、PNG、WebP 和 GIF 格式的图片')
        return
      }
      
      setIsUploading(true)
      setUploadedImageFile(file)
      // 创建预览URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
        toast.success('图片上传成功')
        setIsUploading(false)
      }
      reader.onerror = () => {
        toast.error('图片读取失败，请重试')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
      
      // 在实际项目中，这里应该上传文件到服务器获取URL
      // 暂时模拟，或者如果后端支持base64也可以直接用
      // 为了兼容现有逻辑，我们假设这里已经有了URL
      // 如果需要真实上传，应该调用 uploadService
    }
  }

  const startGeneration = () => {
    setShowOutput(true)
    setActiveTab('results')
    
    // 如果是文生图，清空旧图片
    if (generationMode === 'text-to-image') {
      setImages([])
      setVideoByIndex([])
    } else {
      // 视频生成不影响图片列表
    }
    
    setProgress(0)
    setAiText('')
    setIsGenerating(true)
    setGenerationStatus('正在分析输入...')
    const input = `${prompt} ${tags.join(' ')} ${brand}`.trim() || '天津文化设计灵感'
    
    // 平滑的进度条动画
    const progressSteps = [
      { status: '正在分析输入...', progress: 10 },
      { status: '正在生成创意方向...', progress: 30 },
      { status: '正在生成AI文案...', progress: 50 },
      { status: '正在生成内容...', progress: 70 },
      { status: '正在计算纯正性评分...', progress: 90 },
      { status: '生成完成', progress: 100 }
    ]
    
    let currentStep = 0
    const progressTimer = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setGenerationStatus(progressSteps[currentStep].status)
        setProgress(progressSteps[currentStep].progress)
        currentStep++
      }
    }, 600)
    
    try {
      const dirs = llmService.generateCreativeDirections(input)
      setAiDirections(dirs)
    } catch (error) {
      console.error('生成创意方向失败:', error)
    }
    
    // 添加打字机效果的流式响应处理
    let accumulatedText = '';
    llmService.generateResponse(input, {
      onDelta: (chunk: string) => {
        accumulatedText += chunk;
        setAiText(accumulatedText);
      }
    }).then(async final => {
      clearInterval(progressTimer)
      setProgress(100)
      
      const currentModel = llmService.getCurrentModel();
      
      if (generationMode === 'text-to-image') {
        setGenerationStatus('正在生成图片...')
        try {
          const r = await llmService.generateImage({ prompt: (final || input), size: '1024x1024', n: 3, response_format: 'url', watermark: true });
          const list = (r as any)?.data?.data || []
          const urls = list
            .map((d: any) => (d?.url ? String(d.url) : ''))
            .filter((u: string) => !!u)
          if (urls.length === 0) {
            toast.info(`${currentModel.name}未返回图片，已提供占位图`)
            setImages(genImages(final))
            setVideoByIndex(new Array(3).fill(''))
          } else {
            const isMock = urls.some((u: string) => u.includes('unsplash.com'));
            setImages(urls)
            setVideoByIndex(new Array(urls.length).fill(''))
            if (isMock) {
              toast.success(`${currentModel.name} (演示模式) 生图完成`);
            } else {
              toast.success(`${currentModel.name}生图完成`);
            }
            
            // 保存AI生成记录到数据库
            for (const url of urls) {
              if (!url.includes('unsplash.com')) {
                await aiGenerationSaveService.saveImageGeneration(
                  final || input,
                  url,
                  {
                    source: 'neo',
                    metadata: {
                      mode: generationMode,
                      model: currentModel.id,
                      size: '1024x1024'
                    }
                  }
                );
              }
            }
          }
        } catch (e) {
          errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'neo-doubao', prompt: final || input })
          console.error('Neo generation error:', e);
          toast.error(`${currentModel.name}生图失败，已回退为占位图`)
          setImages(genImages(final))
          setVideoByIndex(new Array(3).fill(''))
        }
      } else if (generationMode === 'image-to-video') {
        if (!uploadedImage) {
          toast.warning('请先上传图片')
          setIsGenerating(false)
          return
        }
        setGenerationStatus('正在生成视频...')
        const videoResult = await llmService.generateVideo({
          prompt: final || input,
          imageUrl: uploadedImage,
          duration: videoParams.duration,
          resolution: videoParams.resolution,
          model: 'wanx2.1-i2v-turbo'
        })
        
        if (videoResult.ok && videoResult.data?.video_url) {
          toast.success('图生视频生成完成')
          setImages([uploadedImage])
          setVideoByIndex([videoResult.data.video_url])
          
          saveHistory({
            url: videoResult.data.video_url,
            image: uploadedImage,
            createdAt: Date.now(),
            thumb: videoResult.data.last_frame_url || undefined,
            type: 'video'
          })
          
          // 保存AI生成记录到数据库
          await aiGenerationSaveService.saveVideoGeneration(
            final || input,
            videoResult.data.video_url,
            videoResult.data.last_frame_url || uploadedImage,
            {
              source: 'neo',
              metadata: {
                mode: generationMode,
                model: 'wanx2.1-i2v-turbo',
                duration: videoParams.duration,
                resolution: videoParams.resolution,
                imageUrl: uploadedImage
              }
            }
          )
        } else {
          toast.error(videoResult.error || '视频生成失败')
        }
      } else if (generationMode === 'text-to-video') {
        setGenerationStatus('正在生成视频...')
        const videoResult = await llmService.generateVideo({
          prompt: final || input,
          duration: videoParams.duration,
          resolution: videoParams.resolution,
          model: 'wan2.6-i2v-flash'
        })
        
        if (videoResult.ok && videoResult.data?.video_url) {
          toast.success('文生视频生成完成')
          const placeholderImg = genImages(final)[0]
          setImages([placeholderImg])
          setVideoByIndex([videoResult.data.video_url])
          
          saveHistory({
            url: videoResult.data.video_url,
            image: placeholderImg,
            createdAt: Date.now(),
            thumb: videoResult.data.last_frame_url || undefined,
            type: 'video'
          })
          
          // 保存AI生成记录到数据库
          await aiGenerationSaveService.saveVideoGeneration(
            final || input,
            videoResult.data.video_url,
            videoResult.data.last_frame_url || placeholderImg,
            {
              source: 'neo',
              metadata: {
                mode: generationMode,
                model: 'wan2.6-i2v-flash',
                duration: videoParams.duration,
                resolution: videoParams.resolution
              }
            }
          )
        } else {
          toast.error(videoResult.error || '视频生成失败')
        }
      } else if (generationMode === 'image-to-image') {
        if (!uploadedImage) {
          toast.warning('请先上传图片')
          setIsGenerating(false)
          return
        }
        setGenerationStatus('正在生成图片...')
        try {
          const r = await llmService.generateImage({ 
            prompt: (final || input), 
            imageUrl: uploadedImage,
            similarity: similarity / 100, // 转换为0-1范围
            style: selectedStyle,
            size: '1024x1024', 
            n: 3, 
            response_format: 'url', 
            watermark: true 
          });
          const list = (r as any)?.data?.data || []
          const urls = list
            .map((d: any) => (d?.url ? String(d.url) : ''))
            .filter((u: string) => !!u)
          if (urls.length === 0) {
            toast.info(`${currentModel.name}未返回图片，已提供占位图`)
            setImages(genImages(final))
            setVideoByIndex(new Array(3).fill(''))
          } else {
            const isMock = urls.some((u: string) => u.includes('unsplash.com'));
            setImages(urls)
            setVideoByIndex(new Array(urls.length).fill(''))
            if (isMock) {
              toast.success(`${currentModel.name} (演示模式) 图生图完成`);
            } else {
              toast.success(`${currentModel.name}图生图完成`);
            }
          }
        } catch (e) {
          errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'neo-doubao', prompt: final || input })
          console.error('Neo generation error:', e);
          toast.error(`${currentModel.name}图生图失败，已回退为占位图`)
          setImages(genImages(final))
          setVideoByIndex(new Array(3).fill(''))
        }
      }
      
      setGenerationStatus('')
      toast.success('创作完成！')
      
      const r = scoreAuthenticity(final || prompt, story)
      setScore(r.score)
      setFeedback(r.feedback)
    }).catch((error) => {
      console.error('生成失败:', error)
      clearInterval(progressTimer)
      setProgress(100)
      setGenerationStatus('')
      toast.error('生成失败，请稍后重试')
    }).finally(() => {
      setIsGenerating(false)
    })
  }

  // 构建视频生成文本
  const buildVideoText = (prompt: string, tags: string[], brand: string) => {
    const base = `${prompt} ${tags.join(' ')} ${brand}`.trim()
    return `${base || 'Tianjin cultural design'}  --resolution ${videoParams.resolution}  --duration ${videoParams.duration} --camerafixed ${videoParams.cameraFixed}`
  }

  const genVideoAt = async (idx: number) => {
    const src = images[idx] || ''
    const safeImage = src && src.startsWith('https://') && (src.includes('volces.com') || src.includes('tos-cn-beijing'))
    const text = buildVideoText(prompt, tags, brand)
    const taskId = `task-${idx}-${Date.now()}`
    
    // 初始化状态
    setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '生成中...' : v)))
    setVideoProgress(prev => ({ ...prev, [taskId]: 0 }))
    setVideoStatus(prev => ({ ...prev, [taskId]: '初始化视频生成任务...' }))
    
    // 优化进度更新，使用更合理的时间间隔和进度增长
    const progressInterval = setInterval(() => {
      setVideoProgress(prev => {
        const current = prev[taskId] || 0
        if (current < 95) {
          // 每3秒增加3%的进度，直到95%
          const newProgress = current + 3
          // 同时更新状态
          setVideoStatus(statusPrev => {
            if (newProgress < 30) {
              return { ...statusPrev, [taskId]: '正在准备视频素材...' }
            } else if (newProgress < 60) {
              return { ...statusPrev, [taskId]: '正在生成视频画面...' }
            } else if (newProgress < 90) {
              return { ...statusPrev, [taskId]: '正在优化视频效果...' }
            } else {
              return { ...statusPrev, [taskId]: '正在处理视频输出...' }
            }
          })
          return { ...prev, [taskId]: newProgress }
        }
        return prev
      })
    }, 3000)
    
    try {
      // 无论当前选择的引擎是什么，都使用千问视频生成API
      if (true) {
        // 使用千问视频生成API
        setVideoStatus(prev => ({ ...prev, [taskId]: '使用千问生成视频...' }))
        
        // 构建纯文本提示，不包含命令行参数
        const purePrompt = `${prompt} ${tags.join(' ')} ${brand}`.trim() || '天津文化设计灵感'
        
        const videoResult = await llmService.generateVideo({
          prompt: purePrompt,
          imageUrl: undefined, // 暂时不传递图片URL，避免url error
          duration: videoParams.duration,
          resolution: videoParams.resolution,
          aspectRatio: '16:9'
        })
        
        if (videoResult.ok && videoResult.data?.video_url) {
          clearInterval(progressInterval)
          setVideoProgress(prev => ({ ...prev, [taskId]: 100 }))
          setVideoStatus(prev => ({ ...prev, [taskId]: '视频生成完成' }))
          toast.success('千问视频生成完成')
          const videoUrl = videoResult.data.video_url
          setVideoByIndex(prev => prev.map((v, i) => (i === idx ? videoUrl : v)))
          const createdAt = Date.now()
          setVideoMetaByIndex(prev => prev.map((m, i) => (i === idx ? { ...m, createdAt } : m)))
          saveHistory({ url: videoUrl, image: src, createdAt, thumb: videoResult.data.last_frame_url || undefined })
          
          // 1秒后清除进度状态
          setTimeout(() => {
            setVideoProgress(prev => {
              const newProgress = { ...prev }
              delete newProgress[taskId]
              return newProgress
            })
            setVideoStatus(prev => {
              const newStatus = { ...prev }
              delete newStatus[taskId]
              return newStatus
            })
          }, 1000)
        } else {
          clearInterval(progressInterval)
          const msg = videoResult.error || '千问视频生成失败'
          toast.error(msg)
          setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
          // 清除进度状态
          setTimeout(() => {
            setVideoProgress(prev => {
              const newProgress = { ...prev }
              delete newProgress[taskId]
              return newProgress
            })
            setVideoStatus(prev => {
              const newStatus = { ...prev }
              delete newStatus[taskId]
              return newStatus
            })
          }, 1000)
        }
      } else {
        // 使用豆包视频生成API
        setVideoStatus(prev => ({ ...prev, [taskId]: '使用豆包生成视频...' }))
        
        const content: DoubaoVideoContent[] = safeImage 
          ? [{ type: 'text' as const, text }, { type: 'image_url' as const, image_url: { url: src } }]
          : [{ type: 'text' as const, text }]
        const created = await createVideoTask({ model: 'doubao-seedance-1-0-pro-250528', content })
        if (!created.ok || !created.data?.id) {
          clearInterval(progressInterval)
          const msg = (created as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : '创建失败'
          toast.error(msg)
          setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
          return
        }
        const polled = await pollVideoTask(created.data.id, { intervalMs: 10000, timeoutMs: 600000 })
        if (!polled.ok) {
          clearInterval(progressInterval)
          const msg = (polled as any)?.error === 'CONFIG_MISSING' ? '服务端未配置 DOUBAO_API_KEY，请在 .env.local 设置后重启' : (polled.error || '查询失败')
          toast.error(msg)
          setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
          return
        }
        const url = polled.data?.content?.video_url || ''
        const last = polled.data?.content?.last_frame_url || ''
        if (polled.data?.status === 'succeeded' && url) {
          clearInterval(progressInterval)
          setVideoProgress(prev => ({ ...prev, [taskId]: 100 }))
          setVideoStatus(prev => ({ ...prev, [taskId]: '视频生成完成' }))
          toast.success('视频生成完成')
          setVideoByIndex(prev => prev.map((v, i) => (i === idx ? url : v)))
          const createdAt = polled.data?.created_at || polled.data?.updated_at || Date.now()
          setVideoMetaByIndex(prev => prev.map((m, i) => (i === idx ? { ...m, createdAt: typeof createdAt === 'number' ? createdAt : Date.now() } : m)))
          saveHistory({ url, image: src, createdAt: typeof createdAt === 'number' ? createdAt : Date.now(), thumb: last || undefined })
          
          // 1秒后清除进度状态
          setTimeout(() => {
            setVideoProgress(prev => {
              const newProgress = { ...prev }
              delete newProgress[taskId]
              return newProgress
            })
            setVideoStatus(prev => {
              const newStatus = { ...prev }
              delete newStatus[taskId]
              return newStatus
            })
          }, 1000)
        } else {
          clearInterval(progressInterval)
          toast.error('视频生成失败')
          setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
        }
      }
    } catch (e: any) {
      clearInterval(progressInterval)
      errorService.logError(e instanceof Error ? e : 'SERVER_ERROR', { scope: 'neo-video' })
      toast.error('视频生成异常')
      setVideoByIndex(prev => prev.map((v, i) => (i === idx ? '视频生成失败' : v)))
      // 清除进度状态
      setTimeout(() => {
        setVideoProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[taskId]
          return newProgress
        })
        setVideoStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[taskId]
          return newStatus
        })
      }, 1000)
    }
  }

  useEffect(() => {
    // 优化视频元数据获取，只处理新添加的视频URL
    videoByIndex.forEach((url, i) => {
      if (url && url.startsWith('http')) {
        const existingMeta = videoMetaByIndex[i]
        // 只在没有获取过元数据时发送请求
        if (!existingMeta?.sizeBytes) {
          const metaUrl = `${apiBase ? `${apiBase}` : ''}/api/proxy/video/meta?url=${encodeURIComponent(url)}`
          fetch(metaUrl)
            .then(r => r.json())
            .then(d => {
              if (d?.ok) {
                setVideoMetaByIndex(prev => {
                  const next = [...prev]
                  next[i] = { ...(next[i] || {}), sizeBytes: Number(d.content_length || 0), contentType: String(d.content_type || '') }
                  return next
                })
              }
            })
            .catch(() => {})
        }
      }
    })
  }, [videoByIndex, videoMetaByIndex])

  const testDoubaoVQA = async () => {
    setQaLoading(true)
    setQaAnswer('')
    try {
      const r = await doubao.chatCompletions({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: 'https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg' } },
              { type: 'text', text: '图片主要讲了什么?' }
            ]
          }
        ]
      })
      const content = (r as any)?.data?.choices?.[0]?.message?.content || ''
      setQaAnswer(content || '（无返回内容）')
    } catch {
      setQaAnswer('调用失败，请检查服务端环境变量或网络')
    } finally {
      setQaLoading(false)
    }
  }

  // 侧边栏折叠状态管理
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // 设置管理
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('NEO_SETTINGS');
      return saved ? JSON.parse(saved) : {
        rightSidebarVisible: true,
        sidebarCollapsed: false
      };
    } catch {
      return {
        rightSidebarVisible: true,
        sidebarCollapsed: false
      };
    }
  });
  
  // 右侧边栏显示状态管理
  const [rightSidebarVisible, setRightSidebarVisible] = useState(settings.rightSidebarVisible);
  
  // 保存设置到localStorage
  const saveSettings = (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      localStorage.setItem('NEO_SETTINGS', JSON.stringify(updated));
    } catch {
      // 保存失败时忽略
    }
  };
  
  // 移动端适配状态管理
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileInfoSidebarOpen, setMobileInfoSidebarOpen] = useState(false);

  return (
    <div 
      className={`flex flex-col h-full ${currentStyle.pageBg} ${currentStyle.text}`}
      style={{
        '--primary-color': isDark ? '#ef4444' : '#ef4444',
        '--secondary-color': isDark ? '#f97316' : '#f97316',
        '--accent-color': isDark ? '#3b82f6' : '#3b82f6',
        '--background-color': isDark ? '#0f172a' : '#f9fafb',
        '--card-background': isDark ? '#1e293b' : '#ffffff',
        '--border-color': isDark ? '#334155' : '#e5e7eb',
        '--text-primary': isDark ? '#f8fafc' : '#1e293b',
        '--text-secondary': isDark ? '#94a3b8' : '#64748b',
        '--shadow-color': isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'
      } as React.CSSProperties}
    >
      
      {/* Hero Section */}
      {!isEmbedded && (
        <div className={`relative overflow-hidden px-6 flex-shrink-0 pt-32 pb-16`}>
          <div className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-blue-500/20 via-red-500/20 to-yellow-500/20 blur-3xl rounded-full"></div>
          <div className="pointer-events-none absolute -bottom-10 -right-10 w-56 h-56 sm:w-72 sm:h-72 bg-gradient-to-tr from-red-500/15 via-yellow-500/15 to-blue-500/15 blur-3xl rounded-full"></div>
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <GradientHero 
              title="津门 · 灵感引擎"
              subtitle="面向传统文化创新的AI创作助手"
              theme="red"
              stats={[
                { label: '引擎', value: engine === 'sdxl' ? 'SDXL绘画' : '通义千问' },
                { label: '风格', value: stylePresets.length.toString() },
                { label: '模式', value: '普通' },
                { label: '状态', value: isGenerating ? '生成中' : '就绪' }
              ]}
              pattern={true}
              size="lg"
              backgroundImage="https://picsum.photos/seed/neo/1920/1080"
            />
          </div>
        </div>
      )}

      {/* 快捷工具模态框 */}
      {showToolsModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${currentStyle.cardBg} ${currentStyle.text}`}>
            <div className={`p-6 border-b ${currentStyle.border} flex justify-between items-center`}>
              <h3 className="text-xl font-bold">快捷工具</h3>
              <button onClick={() => setShowToolsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
               <button onClick={() => { setShowToolsModal(false); optimizePrompt(); }} className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all hover:scale-105 ${currentStyle.border} ${currentStyle.hover}`}>
                 <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
                   <i className="fas fa-magic"></i>
                 </div>
                 <span className="font-medium">提示词优化</span>
               </button>
               <button onClick={() => { setShowToolsModal(false); testDoubaoVQA(); }} className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all hover:scale-105 ${currentStyle.border} ${currentStyle.hover}`}>
                 <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
                   <i className="fas fa-image"></i>
                 </div>
                 <span className="font-medium">图片反推</span>
               </button>
               <button className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all hover:scale-105 opacity-50 cursor-not-allowed ${currentStyle.border}`}>
                 <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">
                   <i className="fas fa-eraser"></i>
                 </div>
                 <span className="font-medium">背景移除 (开发中)</span>
               </button>
               <button className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all hover:scale-105 opacity-50 cursor-not-allowed ${currentStyle.border}`}>
                 <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl">
                   <i className="fas fa-expand"></i>
                 </div>
                 <span className="font-medium">画质增强 (开发中)</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 创作统计模态框 */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl ${currentStyle.cardBg} ${currentStyle.text}`}>
            <div className={`p-6 border-b ${currentStyle.border} flex justify-between items-center`}>
              <h3 className="text-xl font-bold">创作统计</h3>
              <button onClick={() => setShowStatsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <div className="text-slate-500 text-xs mb-1">总生成次数</div>
                  <div className="text-2xl font-bold">{statsData.totalGenerations}</div>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <div className="text-slate-500 text-xs mb-1">今日消耗积分</div>
                  <div className="text-2xl font-bold text-orange-500">{statsData.todayPointsUsed}</div>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <div className="text-slate-500 text-xs mb-1">收藏作品</div>
                  <div className="text-2xl font-bold text-red-500">{statsData.favoritesCount}</div>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <div className="text-slate-500 text-xs mb-1">作品总数</div>
                  <div className="text-2xl font-bold text-green-500">{statsData.worksCount}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">热门标签分布</h4>
                <div className="flex flex-wrap gap-2">
                  {statsData.hotTags.map((tag, i) => (
                    <div key={i} className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <span>{tag.name}</span>
                      <span className="opacity-50 text-xs">{tag.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 移动端头部 */}
      <div className={`md:hidden h-16 flex items-center justify-between px-4 border-b z-50 sticky top-0 ${currentStyle.bg} ${currentStyle.border} ${currentStyle.text} shadow-sm`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -ml-2 rounded-lg hover:bg-gray-200/20 dark:hover:bg-gray-800/50 transition-colors">
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
          </button>
          <span className="font-bold text-base">津门灵感引擎</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-gray-200/20 dark:hover:bg-gray-800/50 transition-colors">
            <i className="fas fa-search text-base"></i>
          </button>
          {/* 移动端信息侧边栏切换按钮 */}
          <button onClick={() => setMobileInfoSidebarOpen(!mobileInfoSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-200/20 dark:hover:bg-gray-800/50 transition-colors">
            <i className="fas fa-info-circle text-base"></i>
          </button>
        </div>
      </div>
      
      {/* 移动端侧边栏遮罩 */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}
      {mobileInfoSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileInfoSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}
      
      {/* 三栏布局容器 */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 左侧栏 */}
        <div className={`flex-shrink-0 h-full z-30 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-[280px]'} hidden lg:block shadow-xl`}>
          <NeoLeftSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            rightSidebarVisible={rightSidebarVisible}
            onToggleRightSidebar={() => {
              const newVisible = !rightSidebarVisible;
              setRightSidebarVisible(newVisible);
              saveSettings({ rightSidebarVisible: newVisible });
            }}
            onFeatureClick={handleFeatureClick}
          />
        </div>

        {/* 中间内容区 */}
        <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-0">
          <ErrorBoundary>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
              {/* Header Area */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                 <div>
                    <h2 className={`text-2xl font-bold tracking-tight ${currentStyle.text}`}>
                       {activeTab === 'create' ? '开始创作' : activeTab === 'design' ? '一键设计' : activeTab === 'results' ? '生成结果' : '历史记录'}
                    </h2>
                    <p className={`text-sm mt-1 ${currentStyle.textSecondary}`}>
                       {activeTab === 'create' ? '释放你的想象力，探索津门文化的无限可能' : activeTab === 'design' ? '一键生成专业设计方案，支持多种创作模式' : activeTab === 'results' ? '查看刚刚生成的精彩作品' : '回顾过往的创作历程'}
                    </p>
                 </div>
                 
                 {/* Engine Selector & Tabs */}
                 <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                       <button onClick={() => setActiveTab('create')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'create' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>创作</button>
                       <button onClick={() => setActiveTab('design')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'design' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>一键设计</button>
                       <button onClick={() => setActiveTab('results')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'results' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>结果</button>
                       <button onClick={() => setActiveTab('history')} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>历史</button>
                    </div>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                    <select 
                       value={engine} 
                       onChange={(e) => setEngine(e.target.value as any)}
                       className={`text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                    >
                       <option value="sdxl">SDXL 绘画</option>
                       <option value="qwen">通义千问</option>
                    </select>
                 </div>
              </div>

              <div className="min-h-[600px]">
            
            {activeTab === 'design' && (
              <OneClickDesign />
            )}
            
            {activeTab === 'create' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
              {/* Left Column */}
              <div className="xl:col-span-4 space-y-6">
                
                {/* Presets Card */}
                <div className={`p-5 rounded-2xl border ${currentStyle.cardBg} ${currentStyle.border} shadow-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold flex items-center gap-2 ${currentStyle.text}`}>
                      <i className="fas fa-palette text-purple-500"></i> 风格预设
                    </h3>
                    <button 
                      onClick={() => openPresetModal()}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 active:scale-95 flex items-center gap-1"
                    >
                      <i className="fas fa-plus"></i> 新建
                    </button>
                  </div>
                  
                  {stylePresets.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {stylePresets.map(preset => (
                        <div key={preset.id} className="relative group">
                          <button
                            onClick={() => applyPreset(preset)}
                            className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md
                              ${isDark ? 'bg-slate-800 border-slate-700 hover:border-purple-500/50' : 'bg-slate-50 border-slate-200 hover:border-purple-300'}
                            `}
                          >
                            <motion.div 
                              whileHover={{ scale: 1.1, boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)' }}
                              transition={{ type: 'spring', stiffness: 300 }}
                              className="w-8 h-8 rounded-full flex items-center justify-center mb-2 relative overflow-hidden"
                            >
                              <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-purple-900/60 to-purple-700/40' : 'bg-gradient-to-br from-purple-400/20 to-purple-600/10'}`}></div>
                              <div className={`relative z-10 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                <i className="fas fa-magic text-sm"></i>
                              </div>
                            </motion.div>
                            <div className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{preset.name}</div>
                            <div className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{preset.description || '无描述'}</div>
                          </button>
                          
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); openPresetModal(preset); }}
                              className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-blue-500 hover:text-blue-600"
                              title="编辑"
                            >
                              <i className="fas fa-pen text-[10px]"></i>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                              className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-red-500 hover:text-red-600"
                              title="删除"
                            >
                              <i className="fas fa-trash text-[10px]"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl ${isDark ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
                      <i className="fas fa-inbox text-2xl mb-2 opacity-50"></i>
                      <span className="text-xs">暂无预设风格</span>
                    </div>
                  )}
                </div>

                {/* Brand & Tags Card */}
                <div className={`p-5 rounded-2xl border ${currentStyle.cardBg} ${currentStyle.border} shadow-sm space-y-6`}>
                   {/* Brand Selection */}
                   <div>
                      <div className="flex items-center justify-between mb-3">
                         <label className={`text-sm font-semibold flex items-center gap-2 ${currentStyle.text}`}>
                            <i className="fas fa-store text-amber-500"></i> 选择品牌
                         </label>
                         {brand && brand !== 'custom' && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                               已选
                            </span>
                         )}
                      </div>
                      <div className="relative">
                         <select
                           value={useCustomBrand ? 'custom' : brand}
                           onChange={(e) => {
                             const v = e.target.value
                             if (v === 'custom') {
                               setUseCustomBrand(true)
                               const val = customBrand.trim()
                               if (val) {
                                 updateStory(val)
                               } else {
                                 setBrand('')
                                 setStory('请输入品牌名称进行创作')
                               }
                             } else {
                               setUseCustomBrand(false)
                               updateStory(v)
                             }
                           }}
                           className={`w-full appearance-none px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200
                              ${isDark 
                                 ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500' 
                                 : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500 hover:bg-slate-100'}
                              focus:ring-2 focus:ring-amber-500/20 focus:outline-none cursor-pointer
                           `}
                         >
                           <option value="" disabled>请选择一个品牌...</option>
                           <option value="mahua">桂发祥十八街麻花</option>
                           <option value="baozi">狗不理包子</option>
                           <option value="niuren">泥人张彩塑</option>
                           <option value="erduoyan">耳朵眼炸糕</option>
                           <option value="laomeihua">老美华鞋店</option>
                           <option value="dafulai">大福来锅巴菜</option>
                           <option value="guorenzhang">果仁张糖炒栗子</option>
                           <option value="chatangli">茶汤李茶汤</option>
                           <option value="custom">自定义品牌...</option>
                         </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <i className="fas fa-chevron-down text-xs"></i>
                         </div>
                      </div>
                      
                      {useCustomBrand && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                           <input
                             value={customBrand}
                             onChange={(e) => {
                               const val = e.target.value
                               setCustomBrand(val)
                               updateStory(val)
                             }}
                             placeholder="输入品牌名称..."
                             className={`w-full mt-2 px-4 py-3 rounded-xl border text-sm transition-all duration-200
                                ${isDark 
                                   ? 'bg-slate-800 border-slate-700 text-white focus:border-amber-500' 
                                   : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500'}
                                focus:ring-2 focus:ring-amber-500/20 focus:outline-none
                             `}
                           />
                        </motion.div>
                      )}
                   </div>

                   {/* Tags Selection */}
                   <div>
                      <div className="flex items-center justify-between mb-3">
                         <label className={`text-sm font-semibold flex items-center gap-2 ${currentStyle.text}`}>
                            <i className="fas fa-tags text-blue-500"></i> 创作标签
                         </label>
                         {tags.length > 0 && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                               {tags.length} 个标签
                            </span>
                         )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {/* Built-in Tags */}
                        {TAGS.map(t => {
                           const active = tags.includes(t)
                           return (
                             <button
                               key={`built-in-${t}`}
                               onClick={() => toggleTag(t)}
                               className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-95
                                 ${active
                                   ? (isDark ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-blue-50 border-blue-500 text-blue-600')
                                   : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                                 }
                               `}
                             >
                               {active && <i className="fas fa-check mr-1 text-[10px]"></i>}
                               {t}
                             </button>
                           )
                        })}
                        {/* Custom Tags */}
                        {customTags.map(t => {
                           const active = tags.includes(t)
                           return (
                             <div key={`custom-${t}`} className="relative group">
                               <button
                                 onClick={() => toggleTag(t)}
                                 className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-95
                                   ${active
                                     ? (isDark ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'bg-purple-50 border-purple-500 text-purple-600')
                                     : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                                   }
                                 `}
                               >
                                 {t}
                               </button>
                               <button
                                 onClick={(e) => { e.stopPropagation(); removeCustomTag(t); }}
                                 className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                               >
                                 <i className="fas fa-times text-[10px]"></i>
                               </button>
                             </div>
                           )
                        })}
                        
                        {/* Add Tag Button */}
                        <div className="relative">
                           {editingTag || newTag ? (
                              <input
                                autoFocus
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onBlur={() => { if(newTag) addCustomTag(); else setNewTag(''); }}
                                onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                                className={`w-24 text-xs px-3 py-1.5 rounded-full border focus:outline-none focus:ring-1 focus:ring-blue-500
                                   ${isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}
                                `}
                              />
                           ) : (
                              <button
                                onClick={() => setNewTag(' ')} // Trigger input
                                className={`text-xs px-3 py-1.5 rounded-full border border-dashed transition-all duration-200
                                  ${isDark ? 'border-slate-600 text-slate-400 hover:text-white hover:border-slate-500' : 'border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400'}
                                `}
                              >
                                <i className="fas fa-plus mr-1"></i> 自定义
                              </button>
                           )}
                        </div>
                      </div>
                   </div>
                </div> {/* Close Brand & Tags Card */}
            </div> {/* Close Left Column */}

            {/* Right Column */}
             <div className="xl:col-span-8 space-y-6">
               {/* Create Tab Content */}
               <div className="block space-y-6">
                 {/* Main Input Card */}
                <div className={`p-1 rounded-2xl ${currentStyle.cardBg} ${currentStyle.border} border shadow-sm`}>
                  
                  {/* Mode Selector */}
                  <div className="flex p-2 gap-2 border-b border-slate-100 dark:border-slate-800">
                     <button 
                       onClick={() => setGenerationMode('text-to-image')}
                       className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2
                         ${generationMode === 'text-to-image' 
                           ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-900 shadow-sm') 
                           : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}
                       `}
                     >
                       <i className="fas fa-image"></i> 文生图
                     </button>
                     <button 
                       onClick={() => setGenerationMode('image-to-image')}
                       className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2
                         ${generationMode === 'image-to-image' 
                           ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-900 shadow-sm') 
                           : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}
                       `}
                     >
                       <i className="fas fa-exchange-alt"></i> 图生图
                     </button>
                     <button 
                       onClick={() => setGenerationMode('image-to-video')}
                       className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2
                         ${generationMode === 'image-to-video' 
                           ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-900 shadow-sm') 
                           : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}
                       `}
                     >
                       <i className="fas fa-video"></i> 图生视频
                     </button>
                     <button 
                       onClick={() => setGenerationMode('text-to-video')}
                       className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2
                         ${generationMode === 'text-to-video' 
                           ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-900 shadow-sm') 
                           : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}
                       `}
                     >
                       <i className="fas fa-film"></i> 文生视频
                     </button>
                  </div>

                  {/* Image Upload for Image-to-Video */}
                  {generationMode === 'image-to-video' && (
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center relative overflow-hidden group cursor-pointer
                            ${isDark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-300 hover:border-slate-400'}
                            ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}
                          `}
                          onClick={() => !isUploading && document.getElementById('img-upload-input')?.click()}
                        >
                          {isUploading ? (
                            <div className="text-center p-2 flex flex-col items-center justify-center">
                              <div className="w-8 h-8 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mb-2"></div>
                              <div className="text-xs opacity-70">上传中...</div>
                            </div>
                          ) : uploadedImage ? (
                            <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-2">
                              <i className="fas fa-cloud-upload-alt text-2xl mb-1 opacity-50"></i>
                              <div className="text-xs opacity-70">上传参考图</div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">
                            点击更换
                          </div>
                          <input 
                            type="file" 
                            id="img-upload-input" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                          />
                        </div>
                        <div className="flex-1 text-sm opacity-70">
                          <p className="mb-1 font-medium">上传一张图片让AI生成视频</p>
                          <p className="text-xs">支持 JPG, PNG 格式，建议比例 16:9 或 9:16，文件大小不超过 5MB。</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Image Upload for Image-to-Image */}
                  {generationMode === 'image-to-image' && (
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
                      {/* Upload Area */}
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center relative overflow-hidden group cursor-pointer
                            ${isDark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-300 hover:border-slate-400'}
                            ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}
                          `}
                          onClick={() => !isUploading && document.getElementById('img-upload-input')?.click()}
                        >
                          {isUploading ? (
                            <div className="text-center p-2 flex flex-col items-center justify-center">
                              <div className="w-8 h-8 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mb-2"></div>
                              <div className="text-xs opacity-70">上传中...</div>
                            </div>
                          ) : uploadedImage ? (
                            <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-2">
                              <i className="fas fa-cloud-upload-alt text-2xl mb-1 opacity-50"></i>
                              <div className="text-xs opacity-70">上传参考图</div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">
                            点击更换
                          </div>
                          <input 
                            type="file" 
                            id="img-upload-input" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                          />
                        </div>
                        <div className="flex-1 text-sm opacity-70">
                          <p className="mb-1 font-medium">上传一张图片让AI参考生成新图片</p>
                          <p className="text-xs">支持 JPG, PNG 格式，文件大小不超过 5MB。</p>
                        </div>
                      </div>
                      
                      {/* Image-to-Image Parameters */}
                      <div className="space-y-3">
                        {/* Similarity Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <i className="fas fa-sync-alt mr-2 text-blue-500"></i>相似度
                            </label>
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {similarity || 70}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={similarity || 70}
                            onChange={(e) => setSimilarity(Number(e.target.value))}
                            className={`w-full h-2 rounded-lg appearance-none cursor-pointer
                              ${isDark 
                                ? 'bg-slate-700 accent-blue-500' 
                                : 'bg-slate-200 accent-blue-600'}
                            `}
                          />
                          <div className="flex justify-between text-xs mt-1 opacity-60">
                            <span>创意化</span>
                            <span>参考原图</span>
                          </div>
                        </div>
                        
                        {/* Style Selector */}
                        <div>
                          <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <i className="fas fa-palette mr-2 text-purple-500"></i>风格选择
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {['默认', '赛博朋克', '国潮', '古风', '二次元', '写实'].map((style) => (
                              <button
                                key={style}
                                onClick={() => setSelectedStyle(style)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                  ${selectedStyle === style
                                    ? (isDark ? 'bg-purple-900/40 text-purple-400 border-purple-700/50' : 'bg-purple-100 text-purple-700 border-purple-200')
                                    : (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200')
                                  } border
                                `}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                    
                    {/* Story Tip */}
                    {story && (
                       <div className={`mx-4 mt-4 mb-2 text-xs px-3 py-2 rounded-lg flex items-start gap-2 ${isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                          <i className="fas fa-info-circle mt-0.5"></i>
                          <span>{story}</span>
                       </div>
                    )}
                    
                    {/* Textarea */}
                    <div className="relative p-2">
                       <textarea
                          value={prompt}
                          onChange={(e) => { const v = e.target.value; setPrompt(v); if (optTimerRef.current) clearTimeout(optTimerRef.current); optTimerRef.current = setTimeout(() => { if (v.trim() && !optimizing && v.trim() !== lastOptimizedPrompt.trim()) optimizePrompt() }, 2000) }}
                          onBlur={() => { if (prompt.trim() && !optimizing) optimizePrompt() }}
                          placeholder="描述你想要的画面，例如：一只拿着糖葫芦的赛博朋克风格醒狮... (支持语音输入)"
                          className={`w-full h-48 px-4 py-4 rounded-xl resize-none text-base leading-relaxed transition-all duration-200 outline-none
                             ${isDark 
                                ? 'bg-transparent text-white placeholder-slate-600' 
                                : 'bg-transparent text-slate-900 placeholder-slate-400'}
                          `}
                          autoCapitalize="none"
                          autoCorrect="off"
                          enterKeyHint="send"
                          inputMode="text"
                       />
                       
                       {/* Floating Actions */}
                       <div className="absolute bottom-4 right-4 flex items-center gap-2">
                          <button
                            onClick={() => {
                              saveToPlanLibrary()
                              // 保存后自动打开方案库
                              setTimeout(() => setShowPlanLibrary(true), 300)
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                               ${isDark ? 'bg-slate-800 text-green-400 hover:bg-slate-700' : 'bg-green-50 text-green-600 hover:bg-green-100'}
                            `}
                          >
                             <i className="fas fa-save"></i>
                             保存到方案库
                          </button>
                          <button
                            onClick={() => setShowPlanLibrary(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                               ${isDark ? 'bg-slate-800 text-blue-400 hover:bg-slate-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}
                            `}
                          >
                             <i className="fas fa-bookmark"></i>
                             方案库
                          </button>
                          <button
                            onClick={optimizePrompt}
                            disabled={optimizing || isGenerating}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                               ${isDark ? 'bg-slate-800 text-green-400 hover:bg-slate-700' : 'bg-green-50 text-green-600 hover:bg-green-100'}
                            `}
                          >
                             <i className={`fas fa-magic ${optimizing ? 'animate-spin' : ''}`}></i>
                             {optimizing ? '优化中' : 'AI 润色'}
                          </button>
                          
                          <button
                            onClick={async () => {
                              if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                const recognition = new SpeechRecognition();
                                recognition.lang = 'zh-CN';
                                recognition.interimResults = false;
                                recognition.onstart = () => toast.info('开始语音输入...');
                                recognition.onresult = (event: any) => {
                                  const speechResult = event.results[0][0].transcript;
                                  setPrompt(prev => prev + speechResult);
                                  toast.success('语音输入完成');
                                };
                                recognition.onerror = (event: any) => toast.error('语音输入失败: ' + event.error);
                                recognition.start();
                              } else {
                                toast.error('您的浏览器不支持语音输入功能');
                              }
                            }}
                            className={`p-2 rounded-full transition-all hover:scale-105
                               ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                            `}
                          >
                             <i className="fas fa-microphone"></i>
                          </button>
                       </div>
                    </div>
                    
                    {/* Optimization Feedback */}
                    {(optimizing || optStatus !== 'idle') && (
                       <div className="px-6 pb-2 text-xs text-slate-500">
                          {optimizing ? '优化中...' : optStatus === 'done' ? '已完成优化' : ''}
                          {optPreview && optimizing && <div className="mt-1 opacity-70">{optPreview}</div>}
                       </div>
                    )}
                    
                    {lastUserPrompt && lastOptimizedPrompt && (
                        <div className="px-6 pb-2">
                          <button
                            onClick={() => { setPrompt(lastUserPrompt); setOptStatus('idle'); setOptPreview(''); toast.success('已撤销优化') }}
                            className={`text-xs px-2 py-1 rounded transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                          >撤销优化</button>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
                       <div className="flex items-center gap-4">
                          {/* Engine Status / Mode */}
                          <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                             <i className={`fas fa-circle text-[8px] ${isGenerating ? 'text-blue-500 animate-pulse' : 'text-green-500'}`}></i>
                             {isGenerating ? '正在生成...' : '就绪'}
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-3">
                          <button
                            onClick={() => { setPrompt(''); toast.success('已清空'); }}
                            className={`text-sm px-4 py-2 rounded-xl transition-colors
                               ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}
                            `}
                          >
                             清空
                          </button>
                          <button
                            onClick={startGeneration}
                            disabled={isGenerating}
                            className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/30 active:scale-95 flex items-center gap-2
                               ${isGenerating ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500'}
                            `}
                          >
                             {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sparkles"></i>}
                             注入灵感
                          </button>
                       </div>
                    </div>
                 </div>

            {/* AI Copywriting Section */}
            <motion.div 
              className={`mt-6 rounded-2xl ${currentStyle.cardBg} ${currentStyle.border} border shadow-sm p-5`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
               {/* Header */}
               <div className="flex items-center justify-between mb-4">
                  <div className={`font-semibold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                     <i className="fas fa-feather-alt text-purple-500"></i> 
                     <span>AI 创意文案</span>
                  </div>
                  
                  {/* Style Selector */}
                  <div className="flex items-center gap-2">
                     <select
                       value={textStyle}
                       onChange={(e) => setTextStyle(e.target.value as any)}
                       className={`text-xs px-3 py-1.5 rounded-lg border focus:outline-none focus:border-purple-500 transition-all duration-300 cursor-pointer
                          ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}
                       `}
                     >
                       <option value="creative">✨ 创意风格</option>
                       <option value="formal">👔 正式风格</option>
                       <option value="humorous">😄 幽默风格</option>
                       <option value="poetic">📜 诗意风格</option>
                     </select>
                  </div>
               </div>
               
               {/* Suggestions Chips */}
               {aiDirections.length > 0 && (
                 <div className="flex flex-wrap gap-2 mb-4">
                   {aiDirections.map((d, i) => (
                     <button key={i} onClick={() => applyDirection(d)} className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-95
                        ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                     `}>
                       {d}
                     </button>
                   ))}
                   <button onClick={regenerateDirections} className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                     <i className="fas fa-sync-alt mr-1"></i> 换一批
                   </button>
                 </div>
               )}
               
               {/* Progress Bar */}
               {isGenerating && (
                 <div className="mb-3">
                   <div className="flex justify-between text-xs mb-1">
                     <span>生成进度</span>
                     <span>{aiTextProgress}%</span>
                   </div>
                   <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                     <motion.div 
                       className="h-full bg-purple-500 rounded-full"
                       initial={{ width: '0%' }}
                       animate={{ width: `${aiTextProgress}%` }}
                       transition={{ duration: 0.3 }}
                     />
                   </div>
                 </div>
               )}
               
               {/* Content Area */}
               <motion.div 
                 className={`text-sm whitespace-pre-wrap min-h-[100px] p-4 rounded-xl border mb-4 leading-relaxed transition-colors
                  ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}
                 `}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ duration: 0.3 }}
               >
                 {isGenerating ? (
                   <div className="flex flex-col items-center justify-center h-full py-4">
                     <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                     <span className="text-sm text-gray-500">正在生成文案...</span>
                   </div>
                 ) : aiText ? (
                   <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     transition={{ duration: 0.5 }}
                   >
                     {aiText}
                   </motion.div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full py-4 opacity-50">
                     <i className="fas fa-pen-nib mb-2"></i>
                     <span>等待生成文案...</span>
                   </div>
                 )}
               </motion.div>
               
               {/* Actions */}
               <div className="flex gap-3">
                  <button onClick={async () => { const base = aiText.trim() ? aiText : prompt.trim(); if (!base) { toast.warning('请先生成文案或填写提示'); return } try { const r = await voiceService.synthesize(base, { format: 'mp3' }); setTtsUrl(r.audioUrl) } catch (e: any) { toast.error(e?.message || '朗读失败') } }} className={`flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-xl transition-all duration-200 border active:scale-95 ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                    <i className="fas fa-volume-up"></i> 朗读
                  </button>
                  <button onClick={() => { const text = aiText.trim(); if (!text) { toast.warning('暂无可复制的文案'); return } try { navigator.clipboard.writeText(text); toast.success('已复制文案'); } catch { toast.error('复制失败'); } }} className={`flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-xl transition-all duration-200 border active:scale-95 ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                    <i className="fas fa-copy"></i> 复制
                  </button>
                  <button onClick={() => { const text = aiText.trim(); if (!text) { toast.warning('暂无文案可插入'); return } setPrompt(text); toast.success('已插入到输入框'); }} className={`flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-xl transition-all duration-200 border active:scale-95 ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                    <i className="fas fa-arrow-up"></i> 插入
                  </button>
                  <button onClick={() => { if (!aiText.trim()) { toast.warning('暂无文案可保存'); return } try { const raw = localStorage.getItem('NEO_COPY_HISTORY'); const arr = raw ? JSON.parse(raw) : []; const entry = { id: Date.now(), text: aiText.trim() }; const next = [entry, ...arr].slice(0, 50); localStorage.setItem('NEO_COPY_HISTORY', JSON.stringify(next)); toast.success('已保存到本地'); } catch { toast.error('保存失败'); } }} className={`flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-xl transition-all duration-200 border active:scale-95 ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                    <i className="fas fa-save"></i> 保存
                  </button>
               </div>
               
               {ttsUrl && (
                 <div className="mt-4">
                   <audio controls src={ttsUrl} className={`w-full rounded-md border ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
                 </div>
               )}
            </motion.div>
        </div>
      </div>
    </div>
  )}

          {/* Results Tab */}
          {activeTab === 'results' && (
          <div className="space-y-6">
          {showOutput ? (
            <div className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} p-6`}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">生成进度</div>
                  {generationStatus && (
                    <div className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} animate-pulse`}>
                      {generationStatus}
                    </div>
                  )}
                </div>
                <div className="relative h-2 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white opacity-30 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-end mt-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{progress}%</div>
                </div>
              </div>
              
              {/* 视频参数自定义 */}
              <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className="text-sm font-medium mb-3">视频参数设置</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">时长（秒）</label>
                    <input
                      type="number"
                      min="3"
                      max="30"
                      value={videoParams.duration}
                      onChange={(e) => setVideoParams(prev => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
                      className={`w-full text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                  <div className="sm:col-span-1 lg:col-span-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">分辨率</label>
                    <select
                      value={videoParams.resolution}
                      onChange={(e) => setVideoParams(prev => ({ ...prev, resolution: e.target.value as '480p' | '720p' | '1080p' }))}
                      className={`w-full text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="480p">480p</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">相机模式</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="cameraMode"
                          value="false"
                          checked={!videoParams.cameraFixed}
                          onChange={() => setVideoParams(prev => ({ ...prev, cameraFixed: false }))}
                          className="text-red-600 h-4 w-4"
                        />
                        <span>动态</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="cameraMode"
                          value="true"
                          checked={videoParams.cameraFixed}
                          onChange={() => setVideoParams(prev => ({ ...prev, cameraFixed: true }))}
                          className="text-red-600 h-4 w-4"
                        />
                        <span>固定</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {images.map((src, i) => {
                  const val = videoByIndex[i] || ''
                  const processing = val === '生成中...'
                  const hasUrl = val.startsWith('http')
                  return (
                    <div key={i} className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} transition-all duration-300 hover:shadow-lg flex flex-col`}>
                      <div className="relative aspect-video">
                        <TianjinImage src={src} alt="result" ratio="landscape" rounded="none" className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105" onClick={() => (!processing && !hasUrl ? genVideoAt(i) : undefined)} />
                        {processing && (
                          <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-blue-600 text-white shadow-md">生成中…</div>
                        )}
                        {hasUrl && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <button 
                              onClick={() => window.open(val, '_blank')} 
                              className="text-white bg-red-600 hover:bg-red-700 rounded-full p-3 transition-transform duration-200 hover:scale-110"
                              title="打开视频"
                            >
                              <i className="fas fa-play text-xl"></i>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => genVideoAt(i)} disabled={processing} className={`text-xs px-2 py-2 rounded-md transition-all duration-200 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-60 disabled:cursor-not-allowed active:scale-98 font-medium`}>{processing ? '生成中…' : '生成视频'}</button>
                    <button 
                      onClick={async () => {
                        try {
                          // 实现分享功能
                          if (navigator.share) {
                            // 使用Web Share API
                            await navigator.share({
                              title: 'AI生成作品',
                              text: '我使用津门·灵感引擎生成了一个作品，快来看看吧！',
                              url: src.startsWith('http') ? src : window.location.href
                            });
                            toast.success('分享成功');
                          } else {
                            // 回退方案：复制链接
                            await navigator.clipboard.writeText(src.startsWith('http') ? src : window.location.href);
                            toast.success('链接已复制，您可以手动分享');
                          }
                        } catch (error) {
                          console.error('分享失败:', error);
                          // 再次尝试复制链接作为最后的回退
                          try {
                            await navigator.clipboard.writeText(src.startsWith('http') ? src : window.location.href);
                            toast.success('链接已复制，您可以手动分享');
                          } catch (clipboardError) {
                            toast.error('分享失败，请手动复制链接');
                          }
                        }
                      }}
                      className={`text-xs px-2 py-2 rounded-md transition-all duration-200 ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} active:scale-98 flex items-center justify-center gap-1 font-medium`}
                    >
                      <i className="fas fa-share-alt"></i> 分享
                    </button>
                    <button 
                      onClick={() => openImageEditor(i)}
                      className={`text-xs px-2 py-2 rounded-md transition-all duration-200 ${isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'} active:scale-98 font-medium col-span-1`}
                    >
                      <i className="fas fa-edit mr-1"></i> 编辑
                    </button>
                    <button 
                      onClick={() => exportImage(i)}
                      className={`text-xs px-2 py-2 rounded-md transition-all duration-200 ${isDark ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'} active:scale-98 font-medium col-span-1`}
                    >
                      <i className="fas fa-download mr-1"></i> 导出
                    </button>
                    <button 
                      onClick={() => openActivityModal(src.startsWith('http') ? src : '')}
                      className={`text-xs px-2 py-2 rounded-md transition-all duration-200 ${isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'} active:scale-98 font-medium col-span-2 flex items-center justify-center`}
                    >
                      <i className="fas fa-trophy mr-1"></i> 立即参赛
                    </button>
                  </div>
                        <div className={`flex justify-between items-center pt-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                          <button
                            onClick={() => setShowFeedback(`result-${i}`)}
                            className={`text-xs px-2 py-1.5 rounded-md transition-colors ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} active:scale-98`}
                          >
                            {feedbacks[`result-${i}`] ? '修改反馈' : '提交反馈'}
                          </button>
                          
                          {/* 显示已提交的评分 */}
                          {feedbacks[`result-${i}`] && (
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500 text-sm">{'★'.repeat(feedbacks[`result-${i}`]!.rating)}</span>
                              <span className="text-xs text-gray-500">({feedbacks[`result-${i}`]!.rating})</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 反馈弹窗 */}
                        {showFeedback === `result-${i}` && (
                          <div className={`mt-2 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'} shadow-md text-xs absolute z-10 w-64`}>
                            <h4 className="font-medium mb-2">提交反馈</h4>
                            
                            {/* 评分 */}
                            <div className="mb-2">
                              <label className="text-gray-500 dark:text-gray-400 mb-1 block">评分：</label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    onClick={() => {
                                      const current = feedbacks[`result-${i}`] || { rating: 0, comment: '' }
                                      saveFeedback(`result-${i}`, star, current.comment)
                                    }}
                                    className={`text-lg transition-all duration-200 ${(feedbacks[`result-${i}`]?.rating || 0) >= star ? 'text-yellow-500 transform scale-110' : 'text-gray-400 hover:text-yellow-500'}`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* 文字反馈 */}
                            <div className="mb-2">
                              <label className="text-gray-500 dark:text-gray-400 mb-1 block">反馈意见：</label>
                              <textarea
                                value={feedbacks[`result-${i}`]?.comment || ''}
                                onChange={(e) => {
                                  const current = feedbacks[`result-${i}`] || { rating: 0, comment: '' }
                                  saveFeedback(`result-${i}`, current.rating, e.target.value)
                                }}
                                placeholder="请输入..."
                                className={`w-full px-2 py-1 rounded border focus:ring-1 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                                rows={2}
                              />
                            </div>
                            
                            {/* 关闭按钮 */}
                            <div className="flex justify-end">
                              <button
                                onClick={() => setShowFeedback(null)}
                                className={`px-3 py-1 rounded-md transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'} active:scale-98`}
                              >
                                关闭
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="text-lg font-bold mb-2">纯正性评分：{score}</div>
              {feedback.length > 0 && (
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{feedback.join('；')}</div>
              )}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <i className="fas fa-paint-brush text-4xl mb-4 opacity-50"></i>
                <p>暂无生成结果，请在“灵感创作”页签开始创作</p>
                <button onClick={() => setActiveTab('create')} className="mt-4 px-4 py-2 text-red-600 border border-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20">去创作</button>
             </div>
          )}
          </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
          <div className="space-y-6">
          {videoHistory.length > 0 ? (
            <div className={`rounded-2xl shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'} p-4 mt-6`}>
              <div className="font-bold mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span>视频历史</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button className={`text-xs px-3 py-2 rounded transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} transition-all duration-200 hover:scale-105`} onClick={() => { setVideoHistory([]); try { localStorage.removeItem('NEO_VIDEO_HISTORY') } catch {} }}>清空历史</button>
                </div>
              </div>
              
              {/* 历史记录搜索和筛选 */}
            <div className="mb-4 space-y-3">
              {/* 搜索框 */}
              <div>
                <input
                  type="text"
                  placeholder="搜索历史记录..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className={`w-full text-sm px-3 py-3 rounded-lg border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              
              {/* 基础筛选和排序 */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* 筛选 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400">筛选：</label>
                    <select
                      value={historyFilter}
                      onChange={(e) => {
                        setHistoryFilter(e.target.value as any);
                      }}
                      className={`text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="all">全部</option>
                      <option value="favorite">收藏</option>
                      <option value="video">视频</option>
                    </select>
                  </div>
                  
                  {/* 排序 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400">排序：</label>
                    <select
                      value={historySort}
                      onChange={(e) => {
                        setHistorySort(e.target.value as any);
                      }}
                      className={`text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="latest">最新</option>
                      <option value="oldest">最早</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* 高级筛选 */}
              <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 日期范围 */}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">日期范围</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className={`text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className={`text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                  </div>
                  
                  {/* 分辨率 */}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">分辨率</label>
                    <input
                      type="text"
                      placeholder="例如：1920×1080"
                      value={advancedFilters.resolution}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, resolution: e.target.value }))}
                      className={`text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                  
                  {/* 时长范围 */}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">时长范围（秒）</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="最小"
                        min="0"
                        step="0.1"
                        value={advancedFilters.minDuration}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minDuration: e.target.value }))}
                        className={`text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                      <input
                        type="number"
                        placeholder="最大"
                        min="0"
                        step="0.1"
                        value={advancedFilters.maxDuration}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxDuration: e.target.value }))}
                        className={`text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                  </div>
                  
                  {/* 重置按钮 */}
                  <div className="flex items-end">
                    <button
                      onClick={resetFilters}
                      className={`text-xs px-3 py-2 rounded transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'} transition-all duration-200 hover:scale-105`}
                    >
                      重置筛选条件
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 批量操作和导出 */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* 批量操作按钮 */}
                  {showBatchActions && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={batchToggleFavorite}
                        className={`text-xs px-3 py-2 rounded transition-colors ${isDark ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white'} transition-all duration-200 hover:scale-105`}
                      >
                        批量收藏/取消收藏
                      </button>
                      <button
                        onClick={batchDeleteHistory}
                        className={`text-xs px-3 py-2 rounded transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-all duration-200 hover:scale-105`}
                      >
                        批量删除
                      </button>
                    </div>
                  )}
                  
                  {/* 导出功能 */}
                  <div className="flex items-center gap-2">
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                      className={`text-xs px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="json">JSON格式</option>
                      <option value="csv">CSV格式</option>
                    </select>
                    <button
                      onClick={exportHistory}
                      className={`text-xs px-3 py-2 rounded transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} transition-all duration-200 hover:scale-105`}
                    >
                      导出历史记录
                    </button>
                  </div>
                </div>
                
                {/* 历史记录统计 */}
                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  共 {filteredHistory.length} 条记录
                  {selectedHistory.length > 0 && (
                    <span className="ml-2">已选择 {selectedHistory.length} 条</span>
                  )}
                </div>
              </div>
            </div>
              
              {/* 历史记录列表 */}
              {filteredHistory.length > 0 ? (
                <div className="space-y-4">
                  {/* 全选复选框 */}
                  <div className={`flex items-center gap-3 p-2 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={selectedHistory.length === filteredHistory.length && filteredHistory.length > 0}
                      onChange={selectAllHistory}
                      className="text-red-600 h-4 w-4"
                    />
                    <span className="text-xs font-medium">全选/取消全选</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredHistory.map((h, idx) => (
                    <div key={idx} className={`group relative rounded-xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm hover:shadow-lg transition-all duration-300`}>
                      <div className="relative aspect-square bg-slate-100 dark:bg-slate-900">
                        <img src={h.thumb || h.image} alt="thumb" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        
                        {/* 悬浮覆盖层 */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
                          <div className="flex justify-between items-start">
                            <input
                              type="checkbox"
                              checked={selectedHistory.includes(h.url)}
                              onChange={(e) => { e.stopPropagation(); toggleSelectHistory(h.url) }}
                              className="text-red-600 h-4 w-4 cursor-pointer"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(h.url) }}
                              className={`p-1 rounded-full ${h.isFavorite ? 'text-yellow-400' : 'text-white hover:text-yellow-400'}`}
                            >
                              {h.isFavorite ? '★' : '☆'}
                            </button>
                          </div>
                          
                          <div className="flex gap-1 justify-center">
                             <button 
                               className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-colors"
                               onClick={(e) => { e.stopPropagation(); try { window.open(h.url, '_blank') } catch {} }}
                               title="打开"
                             >
                               <i className="fas fa-external-link-alt text-xs"></i>
                             </button>
                             <a 
                               className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-colors flex items-center justify-center"
                               href={`${apiBase ? `${apiBase}` : ''}/api/proxy/video?url=${encodeURIComponent(h.url)}`} 
                               download 
                               onClick={(e) => e.stopPropagation()}
                               title="下载"
                             >
                               <i className="fas fa-download text-xs"></i>
                             </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-2 text-xs">
                        <div className={`truncate mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} title={formatTime(h.createdAt)}>
                          {formatTime(h.createdAt).split(' ')[0]}
                        </div>
                        <div className="flex justify-between text-gray-500 dark:text-gray-400 scale-90 origin-left">
                          <span>{formatResolution(h.width, h.height)}</span>
                          <span>{formatDuration(h.duration)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              ) : (
                <div className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-sm text-center py-6`}>
                  {historySearch ? '没有找到匹配的历史记录' : '没有历史记录'}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <i className="fas fa-history text-4xl mb-4 opacity-50"></i>
              <p>暂无历史记录</p>
            </div>
          )}
          </div>
          )}

          </div> {/* Close content card */}
        </div> {/* Close p-6 container */}
          </ErrorBoundary>
        </main>

        {/* Right Sidebar (Desktop) */}
        <AnimatePresence>
          {rightSidebarVisible && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-shrink-0 h-full z-20 hidden lg:block shadow-xl overflow-hidden"
            >
               <NeoRightSidebar
                brand={brand}
                story={story}
                aiDirections={aiDirections}
                isGenerating={isGenerating}
                generationStatus={generationStatus}
                progress={progress}
                showOutput={showOutput}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Sidebar (Mobile) */}
        <AnimatePresence>
          {mobileInfoSidebarOpen && (
             <>
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 0.5 }}
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 bg-black z-40 md:hidden"
                 onClick={() => setMobileInfoSidebarOpen(false)}
               />
               <motion.div
                 initial={{ x: '100%' }}
                 animate={{ x: 0 }}
                 exit={{ x: '100%' }}
                 transition={{ type: "spring", damping: 25, stiffness: 200 }}
                 className="fixed inset-y-0 right-0 z-50 w-80 md:hidden"
               >
                 <NeoRightSidebar
                    brand={brand}
                    story={story}
                    aiDirections={aiDirections}
                    isGenerating={isGenerating}
                    generationStatus={generationStatus}
                    progress={progress}
                    showOutput={showOutput}
                  />
               </motion.div>
             </>
          )}
        </AnimatePresence>


      {/* 风格预设模态框 */}
      {showPresetModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 max-w-md w-full max-h-[90vh] overflow-y-auto transition-all duration-300 transform scale-100 opacity-100`}>
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold">{editingPresetId ? '编辑风格预设' : '创建风格预设'}</h2>
               <button onClick={closePresetModal} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><i className="fas fa-times"></i></button>
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="block mb-2 text-sm font-medium">预设名称</label>
                  <input type="text" value={presetForm.name} onChange={e => setPresetForm(prev => ({...prev, name: e.target.value}))} className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 border-gray-600' : ''}`} />
               </div>
               
               <div>
                  <label className="block mb-2 text-sm font-medium">预设描述</label>
                  <textarea value={presetForm.description} onChange={e => setPresetForm(prev => ({...prev, description: e.target.value}))} className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 border-gray-600' : ''}`} />
               </div>

               <div>
                  <label className="block mb-2 text-sm font-medium">品牌</label>
                  <input type="text" value={presetForm.brand} onChange={e => setPresetForm(prev => ({...prev, brand: e.target.value}))} className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 border-gray-600' : ''}`} />
               </div>

               <div>
                  <label className="block mb-2 text-sm font-medium">提示词</label>
                  <textarea value={presetForm.prompt} onChange={e => setPresetForm(prev => ({...prev, prompt: e.target.value}))} className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 border-gray-600' : ''}`} />
               </div>
             </div>
             
             <div className="flex gap-3 mt-6">
                <button onClick={savePreset} className="flex-1 bg-red-600 text-white py-2 rounded">保存</button>
                <button onClick={closePresetModal} className="px-4 py-2 bg-gray-200 rounded text-black">取消</button>
             </div>
          </div>
        </div>
      )}
      
      {/* 图片编辑面板 */}
      {editingImageUrl && (
        <ImageEditor 
          imageUrl={editingImageUrl}
          onSave={handleEditorSave}
          onCancel={closeImageEditor}
        />
      )}
      
      {/* 批量导出模态框 */}
      {batchExportModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 transform scale-100 opacity-100`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">批量导出</h2>
              <button 
                onClick={closeBatchExportModal}
                className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-all duration-200 hover:scale-110`}
                aria-label="关闭"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 导出选项 */}
              <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className="text-sm font-medium mb-3 block">导出设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 导出格式 */}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">图片格式</label>
                    <select
                      value={imageExportOptions.format}
                      onChange={(e) => setImageExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                      className={`text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                  
                  {/* 导出质量 */}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">导出质量: {imageExportOptions.quality}%</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={imageExportOptions.quality}
                      onChange={(e) => setImageExportOptions(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700`}
                    />
                  </div>
                  
                  {/* 导出分辨率 */}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">分辨率</label>
                    <select
                      value={imageExportOptions.resolution}
                      onChange={(e) => setImageExportOptions(prev => ({ ...prev, resolution: e.target.value as any }))}
                      className={`text-sm px-3 py-2 rounded border focus:ring-2 focus:ring-red-500 transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="original">原始分辨率</option>
                      <option value="480p">480p</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* 选择导出项 */}
              <div>
                <h3 className="text-sm font-medium mb-3 block">选择要导出的项</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}">
                  <div className="flex items-center gap-2 p-2 rounded ${isDark ? 'bg-gray-800' : 'bg-white'}">
                    <input
                      type="checkbox"
                      checked={selectedExportItems.length === images.length && images.length > 0}
                      onChange={selectAllExportItems}
                      className="text-red-600 h-4 w-4"
                    />
                    <span className="text-sm font-medium">全选/取消全选</span>
                  </div>
                  {images.map((image, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded hover:bg-opacity-80 transition-all duration-200 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}">
                      <input
                        type="checkbox"
                        checked={selectedExportItems.includes(index)}
                        onChange={() => toggleSelectExportItem(index)}
                        className="text-red-600 h-4 w-4"
                      />
                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                        <img src={image} alt={`Item ${index}`} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm truncate">图片 {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 导出按钮 */}
              <div className="flex gap-3">
                <button 
                  onClick={batchExportItems}
                  disabled={selectedExportItems.length === 0}
                  className={`flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 min-h-[44px] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  导出选中项 ({selectedExportItems.length})
                </button>
                <button 
                  onClick={closeBatchExportModal}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 min-h-[44px] active:scale-98 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 交互式教程 */}
      {showTutorial && currentTutorialStep < tutorialSteps.length && (
        <div className="fixed inset-0 z-[70] pointer-events-none">
          {/* 遮罩层 */}
          <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>
          
          {/* 教程内容 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className={`rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-6 max-w-lg w-full transition-all duration-300 transform scale-100 opacity-100`}>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold">{tutorialSteps[currentTutorialStep].title}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={skipTutorial}
                      className={`text-xs px-2 py-1 rounded text-red-600 hover:text-red-700 ${isDark ? 'bg-red-900 bg-opacity-20 hover:bg-opacity-30' : 'bg-red-50 hover:bg-red-100'}`}
                    >
                      {tutorialSteps[currentTutorialStep].skipText || '跳过教程'}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tutorialSteps[currentTutorialStep].description}</p>
              </div>
              
              {/* 步骤指示器 */}
              <div className="flex items-center gap-1 mb-4">
                {tutorialSteps.map((step, index) => (
                  <div 
                    key={step.id} 
                    className={`h-2 rounded-full flex-1 transition-all duration-300 ${index <= currentTutorialStep ? (index === currentTutorialStep ? 'bg-blue-600' : 'bg-blue-300') : 'bg-gray-300 dark:bg-gray-600'}`}
                  ></div>
                ))}
              </div>
              
              {/* 导航按钮 */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prevTutorialStep}
                  disabled={currentTutorialStep === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 min-h-[40px] active:scale-98 ${currentTutorialStep === 0 ? 'opacity-50 cursor-not-allowed' : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900')}`}
                >
                  {tutorialSteps[currentTutorialStep].prevText || '上一步'}
                </button>
                <button
                  onClick={nextTutorialStep}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 min-h-[40px] active:scale-98 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  {tutorialSteps[currentTutorialStep].nextText || '下一步'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    

  </div>
  
  {/* Footer */}
  {!isEmbedded && (
    <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4 z-10 relative`}>
      <div className="container mx-auto flex justify-between items-center">
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>© 2025 AI共创平 台. 保留所有权利</p>
        <div className="flex space-x-6">
          <a href="/privacy" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>
          <a href="/terms" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>
          <a href="/help" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>
        </div>
      </div>
    </footer>
  )}
  
      {/* Activity Participation Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">投稿至天津文化活动</h3>
              <button onClick={() => setShowActivityModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Activity Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">选择赛事/活动</label>
                <div className="grid grid-cols-1 gap-3">
                  {activities.map(act => (
                    <div 
                      key={act.id}
                      onClick={() => setSelectedActivity(act.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4
                        ${selectedActivity === act.id 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                          : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:border-slate-200'}
                      `}
                    >
                      <div className="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                         <img src={act.cover} alt={act.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                         <div className="font-bold text-sm mb-1">{act.title}</div>
                         <div className="text-xs text-slate-500 line-clamp-2">{act.description}</div>
                         <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${act.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {act.status === 'active' ? '进行中' : '即将截止'}
                            </span>
                            <span className="text-slate-400">截止: {act.deadline}</span>
                         </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${selectedActivity === act.id ? 'border-red-500' : 'border-slate-300'}
                      `}>
                        {selectedActivity === act.id && <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submission Form */}
              <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-xs font-medium opacity-70">作品标题</label>
                       <input 
                         value={submissionForm.workTitle}
                         onChange={e => setSubmissionForm({...submissionForm, workTitle: e.target.value})}
                         className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                         placeholder="为你的作品取个名字"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-medium opacity-70">作者姓名</label>
                       <input 
                         value={submissionForm.authorName}
                         onChange={e => setSubmissionForm({...submissionForm, authorName: e.target.value})}
                         className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                         placeholder="真实姓名"
                       />
                    </div>
                 </div>
                 
                 <div className="space-y-1">
                    <label className="text-xs font-medium opacity-70">联系电话</label>
                    <input 
                      value={submissionForm.authorPhone}
                      onChange={e => setSubmissionForm({...submissionForm, authorPhone: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                      placeholder="用于接收获奖通知"
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-medium opacity-70">创作理念 (选填)</label>
                    <textarea 
                      value={submissionForm.workDesc}
                      onChange={e => setSubmissionForm({...submissionForm, workDesc: e.target.value})}
                      rows={3}
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 focus:outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                      placeholder="简述你的创作灵感..."
                    />
                 </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setShowActivityModal(false)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                取消
              </button>
              <button 
                onClick={handleActivitySubmit}
                disabled={submittingWork || !selectedActivity}
                className={`px-6 py-2 rounded-lg font-medium text-white shadow-lg shadow-red-500/30 transition-all active:scale-95
                  ${submittingWork || !selectedActivity ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'}
                `}
              >
                {submittingWork ? '提交中...' : '确认投稿'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Library Modal */}
      <AnimatePresence>
        {showPlanLibrary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowPlanLibrary(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} border shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">我的方案库 ({savedPlans.length})</h3>
                <div className="flex items-center gap-2">
                  {savedPlans.length > 0 && (
                    <button 
                      onClick={clearPlans} 
                      className="text-xs text-red-500 hover:underline"
                    >
                      清空全部
                    </button>
                  )}
                  <button 
                    onClick={() => setShowPlanLibrary(false)}
                    className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
              
              {savedPlans.length > 0 ? (
                <div className="space-y-3">
                  {savedPlans.map(plan => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm line-clamp-1">{plan.title}</h4>
                        <span className="text-xs opacity-60">{new Date(plan.ts).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs opacity-70 line-clamp-2 mb-3">{plan.aiText || plan.query}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => removePlan(plan.id)} 
                            className="text-gray-400 hover:text-red-500 text-xs"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <button 
                          onClick={() => applyPlan(plan.id)}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          应用到输入框
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 opacity-50">
                  <i className="fas fa-bookmark text-4xl mb-3 text-gray-300 dark:text-gray-700"></i>
                  <p className="text-sm">暂无保存的方案</p>
                  <p className="text-xs mt-2 opacity-70">在工具页面生成并保存创意方案后，将显示在这里</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
</div>
)
}
