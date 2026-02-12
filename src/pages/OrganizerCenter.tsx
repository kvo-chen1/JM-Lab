import { useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { Event, EventCreateRequest } from '@/types';
import { useEventService } from '@/hooks/useEventService';
// import { eventService } from '@/services/eventService'; // 使用 useEventService hook 替代
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import WorkScoring from './organizer/WorkScoring';
import AnalyticsDashboard from './organizer/AnalyticsDashboard';
import OrganizerSettings from './organizer/OrganizerSettings';
import { StepIndicator } from '@/components/StepIndicator';
import { InfoCard, StatCard } from '@/components/InfoCard';
import { EventPreview } from '@/components/EventPreview';
import eventBus from '@/services/enhancedEventBus';
import {
  CalendarDays,
  Users,
  Eye,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ChevronRight,
  LayoutGrid,
  List,
  Building2,
  Shield,
  ArrowLeft,
  Calendar,
  BarChart3,
  Settings,
  Save,
  MapPin,
  Tag,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Info,
  Sparkles,
  MoreHorizontal,
  RotateCcw,
  Heart,
  Trophy
} from 'lucide-react';

// 活动状态筛选类型
type StatusFilter = 'all' | 'draft' | 'pending' | 'published' | 'rejected';
type ViewMode = 'list' | 'grid';
type TabType = 'activities' | 'create' | 'works' | 'analytics' | 'settings';
type StepType = 'basic' | 'content' | 'media' | 'settings' | 'preview';

// 状态配置
const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: FileText },
  pending: { label: '审核中', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  published: { label: '已发布', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle }
};

// 创建活动步骤配置
const steps = [
  { id: 'basic' as StepType, name: '基本信息', description: '填写活动名称、时间地点' },
  { id: 'content' as StepType, name: '活动内容', description: '详细描述活动流程' },
  { id: 'media' as StepType, name: '多媒体', description: '上传图片和视频' },
  { id: 'settings' as StepType, name: '设置', description: '参与规则和标签' },
  { id: 'preview' as StepType, name: '预览发布', description: '检查并发布活动' },
];

// 预设标签列表
const presetTags = ['文化展览', '演出活动', '讲座论坛', '节日庆典', '亲子活动', '体育赛事', '公益活动', '艺术创作', '非遗传承', '文创设计', '历史文化', '民俗文化', '红色文化', '天津特色'];

export default function OrganizerCenter() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { getEvents, getUserEvents, deleteEvent, createEvent, updateEvent } = useEventService();

  // 品牌验证状态 - 支持多品牌切换
  const [userBrands, setUserBrands] = useState<BrandPartnership[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandPartnership | null>(null);
  const [isCheckingBrand, setIsCheckingBrand] = useState(true);
  const [showBrandSwitch, setShowBrandSwitch] = useState(false);

  // 当前标签页
  const [activeTab, setActiveTab] = useState<TabType>('activities');

  // ========== 活动管理相关状态 ==========
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // ========== 创建活动相关状态 ==========
  const [currentStep, setCurrentStep] = useState<StepType>('basic');
  const [formData, setFormData] = useState<EventCreateRequest>({
    title: '',
    description: '',
    content: '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    location: '',
    type: 'offline',
    tags: [],
    media: [],
    isPublic: true,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    pushToCommunity: false,
    applyForRecommendation: false,
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);

  // 检查品牌验证状态 - 支持多品牌
  useEffect(() => {
    const checkBrandVerification = async () => {
      if (!isAuthenticated || !user) {
        navigate('/login');
        return;
      }

      setIsCheckingBrand(true);
      try {
        const myPartnerships = await brandPartnershipService.getMyPartnerships({
          id: user.id,
          email: user.email
        });
        
        // 获取所有已审核通过的品牌
        const approvedBrands = myPartnerships.filter(p => p.status === 'approved');
        setUserBrands(approvedBrands);
        
        // 优先从 localStorage 读取上次选中的品牌
        const savedBrandId = localStorage.getItem('selected_brand_id');
        if (savedBrandId) {
          const savedBrand = approvedBrands.find(b => b.id === savedBrandId);
          if (savedBrand) {
            setSelectedBrand(savedBrand);
          } else if (approvedBrands.length > 0) {
            setSelectedBrand(approvedBrands[0]);
          }
        } else if (approvedBrands.length > 0) {
          setSelectedBrand(approvedBrands[0]);
        }
      } catch (error) {
        console.error('检查品牌验证状态失败:', error);
      } finally {
        setIsCheckingBrand(false);
      }
    };

    checkBrandVerification();
  }, [isAuthenticated, user, navigate]);

  // 切换品牌
  const handleSwitchBrand = (brand: BrandPartnership) => {
    setSelectedBrand(brand);
    localStorage.setItem('selected_brand_id', brand.id);
    setShowBrandSwitch(false);
    toast.success(`已切换到品牌: ${brand.brand_name}`);
    // 刷新活动列表
    fetchEvents();
  };

  // 监听数据同步事件
  useEffect(() => {
    const handleEventCreated = (event: Event) => setEvents(prev => [event, ...prev]);
    const handleEventUpdated = (updatedEvent: { id: string, [key: string]: any }) => {
      setEvents(prev => prev.map(event => event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event));
    };
    const handleEventDeleted = (deletedEvent: { id: string }) => {
      setEvents(prev => prev.filter(event => event.id !== deletedEvent.id));
    };

    eventBus.on('event:created', handleEventCreated);
    eventBus.on('event:updated', handleEventUpdated);
    eventBus.on('event:deleted', handleEventDeleted);

    return () => {
      eventBus.off('event:created', handleEventCreated);
      eventBus.off('event:updated', handleEventUpdated);
      eventBus.off('event:deleted', handleEventDeleted);
    };
  }, []);

  // 获取活动列表
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    console.log('fetchEvents - 开始获取活动列表', {
      userId: user.id,
      isAdmin: user.isAdmin,
      statusFilter,
      selectedBrand: selectedBrand?.id
    });
    
    setIsLoading(true);
    try {
      let eventsData: Event[] = [];

      if (user?.isAdmin) {
        console.log('fetchEvents - 使用管理员权限获取所有活动');
        eventsData = await getEvents({
          status: statusFilter === 'all' ? undefined : statusFilter,
          page: currentPage,
          limit: pageSize,
        }) || [];
        console.log('fetchEvents - 管理员获取到活动数:', eventsData.length);
      } else {
        // 直接使用 getUserEvents 获取用户活动，传入选中的品牌ID
        console.log('fetchEvents - 使用用户ID获取活动:', user.id, '品牌:', selectedBrand?.id);
        eventsData = await getUserEvents(user?.id || '', {
          status: statusFilter === 'all' ? undefined : statusFilter,
          brandId: selectedBrand?.id,
        }) || [];
        console.log('fetchEvents - 获取到活动数:', eventsData.length, '活动列表:', eventsData);
      }

      // 前端搜索过滤
      if (searchQuery) {
        eventsData = eventsData.filter(e => 
          e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setEvents(eventsData);
    } catch (error: any) {
      console.error('[OrganizerCenter] 获取活动列表失败:', error);
      console.error('[OrganizerCenter] 错误详情:', error.message, error.stack);
      toast.error('获取活动列表失败: ' + (error.message || '请稍后重试'));
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedBrand, searchQuery, statusFilter, typeFilter, currentPage, pageSize]);

  // 初始加载活动数据
  useEffect(() => {
    if (activeTab === 'activities') {
      fetchEvents();
    }
  }, [activeTab, selectedBrand, fetchEvents]);

  // 筛选变化时重新获取数据
  useEffect(() => {
    if (activeTab === 'activities') {
      fetchEvents();
    }
  }, [statusFilter, typeFilter, currentPage, activeTab, selectedBrand, fetchEvents]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
  };

  // 处理删除活动
  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('确定要删除这个活动吗？此操作不可恢复。')) {
      try {
        await deleteEvent(eventId);
        setEvents(prev => prev.filter(event => event.id !== eventId));
        toast.success('活动已删除');
      } catch (error) {
        toast.error('删除活动失败，请稍后重试');
      }
    }
  };

  // 处理状态更新
  const handleStatusUpdate = (eventId: string, newStatus: Event['status']) => {
    setEvents(prev => prev.map(event =>
      event.id === eventId ? { ...event, status: newStatus } : event
    ));
    toast.success(`活动状态已更新为${statusConfig[newStatus].label}`);
  };

  // 统计数据
  const stats = useMemo(() => {
    const total = events.length;
    const published = events.filter(e => e.status === 'published').length;
    const pending = events.filter(e => e.status === 'pending').length;
    const draft = events.filter(e => e.status === 'draft').length;
    const totalViews = events.reduce((sum, e) => sum + (e.viewCount || 0), 0);
    const totalParticipants = events.reduce((sum, e) => sum + (e.participants || 0), 0);

    return { total, published, pending, draft, totalViews, totalParticipants };
  }, [events]);

  // 获取活动的开始时间（兼容不同字段格式）
  const getEventStartTime = (event: Event): Date => {
    if (event.start_time) {
      return new Date(event.start_time);
    }
    if (event.start_date) {
      return new Date(event.start_date * 1000); // Unix timestamp 转毫秒
    }
    return new Date();
  };

  // 即将开始的活动
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.status === 'published' && getEventStartTime(e) > new Date())
      .sort((a, b) => getEventStartTime(a).getTime() - getEventStartTime(b).getTime())
      .slice(0, 5);
  }, [events]);

  // 格式化日期
  const formatDate = (date: Date | string | number | undefined) => {
    if (!date) return '-';
    const d = typeof date === 'number' ? new Date(date * 1000) : new Date(date);
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  // ========== 创建活动相关方法 ==========
  const handleChange = (field: keyof EventCreateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (!touched[field]) setTouched(prev => ({ ...prev, [field]: true }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        if (field === 'startTime' || field === 'endTime') delete newErrors.time;
        return newErrors;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'basic':
        if (!formData.title.trim()) newErrors.title = '请输入活动名称';
        else if (formData.title.length < 2) newErrors.title = '活动名称至少需要2个字符';
        else if (formData.title.length > 50) newErrors.title = '活动名称不能超过50个字符';

        if (!formData.description.trim()) newErrors.description = '请输入活动描述';
        else if (formData.description.length < 5) newErrors.description = '活动描述至少需要5个字符';

        if (formData.startTime && formData.endTime) {
          if (formData.startTime >= formData.endTime) newErrors.time = '结束时间必须晚于开始时间';
          else if (formData.endTime.getTime() - formData.startTime.getTime() < 30 * 60 * 1000) {
            newErrors.time = '活动时长至少需要30分钟';
          }
        }

        if (formData.contactPhone && !/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
          newErrors.contactPhone = '请输入有效的11位手机号码';
        }
        if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
          newErrors.contactEmail = '请输入有效的邮箱地址';
        }
        break;

      case 'content':
        if (!formData.content.trim() || formData.content === '<p><br></p>') {
          newErrors.content = '请输入活动内容';
        } else if (formData.content.replace(/<[^>]*>/g, '').length < 10) {
          newErrors.content = '活动内容详情至少需要10个字符';
        }
        break;

      case 'media':
        if (formData.media.length === 0) newErrors.media = '请上传至少一张图片作为封面';
        break;

      case 'settings':
        if (formData.maxParticipants !== undefined && formData.maxParticipants <= 0) {
          newErrors.maxParticipants = '最大参与人数必须大于0';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStepChange = (step: StepType) => {
    if (!validateCurrentStep()) return;
    setCurrentStep(step);
  };

  const handleNext = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1].id as StepType;
      handleStepChange(nextStep);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1].id as StepType;
      handleStepChange(prevStep);
    }
  };

  const selectTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      handleChange('tags', [...(formData.tags || []), tag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    handleChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const handlePublish = async () => {
    try {
      for (const step of steps) {
        setCurrentStep(step.id as StepType);
        if (!validateCurrentStep()) {
          toast.error('请完善所有必填信息');
          return;
        }
      }

      setIsPublishing(true);

      const eventData = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        start_time: formData.startTime.toISOString(),
        end_time: formData.endTime.toISOString(),
        location: formData.location,
        type: formData.type,
        tags: formData.tags,
        media: formData.media,
        is_public: formData.isPublic,
        contact_name: formData.contactName,
        contact_phone: formData.contactPhone,
        contact_email: formData.contactEmail,
        max_participants: formData.maxParticipants,
        status: 'pending' as const,
        organizer_id: user?.id,
        brand_id: selectedBrand?.id,
        brand_name: selectedBrand?.brand_name,
      };

      let event;
      if (eventId) {
        event = await updateEvent(eventId, eventData);
      } else {
        event = await createEvent(eventData);
      }

      if (!event || !event.id) throw new Error('活动创建失败');

      toast.success('活动已提交审核，审核通过后将发布到津脉活动平台');
      
      // 重置表单并切换到活动管理
      setActiveTab('activities');
      setCurrentStep('basic');
      setFormData({
        title: '',
        description: '',
        content: '',
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        location: '',
        type: 'offline',
        tags: [],
        media: [],
        isPublic: true,
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        pushToCommunity: false,
        applyForRecommendation: false,
      });
      fetchEvents();
    } catch (error) {
      console.error('发布活动失败:', error);
      toast.error('发布失败：' + (error instanceof Error ? error.message : '请稍后重试'));
    } finally {
      setIsPublishing(false);
    }
  };

  // 标签页配置
  const tabs = [
    { id: 'activities' as TabType, label: '活动管理', icon: CalendarDays },
    { id: 'create' as TabType, label: '创建活动', icon: Plus },
    { id: 'works' as TabType, label: '作品评分', icon: Trophy },
    { id: 'analytics' as TabType, label: '数据分析', icon: BarChart3 },
    { id: 'settings' as TabType, label: '主办方设置', icon: Settings },
  ];

  // 如果正在检查品牌状态，显示加载中
  if (isCheckingBrand) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">正在检查品牌验证状态...</p>
        </div>
      </div>
    );
  }

  // 如果没有通过品牌验证，显示提示
  if (userBrands.length === 0) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Shield className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              需要品牌认证
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              只有经过平台审核认证的品牌才能管理活动。<br />
              请先申请品牌入驻，审核通过后即可使用主办方中心。
            </p>
            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/business')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                申请品牌入驻
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/activities')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                返回活动列表
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-3 relative z-[100]"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <span className="text-base font-medium text-gray-900 dark:text-white">主办方中心</span>
          
          {/* 品牌切换按钮 */}
          {selectedBrand && (
            <div className="relative z-[100]">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowBrandSwitch(!showBrandSwitch)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="font-medium">{selectedBrand.brand_name}</span>
                {userBrands.length > 1 && (
                  <ChevronRight className={`w-3 h-3 transition-transform ${showBrandSwitch ? 'rotate-90' : ''}`} />
                )}
              </motion.button>

              {/* 品牌切换下拉菜单 */}
              {showBrandSwitch && userBrands.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-full left-0 mt-2 w-56 rounded-xl shadow-lg border z-[9999] ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="p-2">
                    <p className={`px-3 py-2 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      切换品牌
                    </p>
                    {userBrands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => handleSwitchBrand(brand)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          selectedBrand?.id === brand.id
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                          {brand.brand_name?.charAt(0).toUpperCase() || 'B'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{brand.brand_name}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {brand.status === 'approved' ? '已认证' : brand.status}
                          </p>
                        </div>
                        {selectedBrand?.id === brand.id && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* 内部导航标签 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 -mt-2"
        >
          <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {/* 活动管理标签 - 完整的三栏布局 */}
          {activeTab === 'activities' && (
            <motion.div
              key="activities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="relative z-0"
            >
              {/* 三栏布局 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-0">
                {/* 左栏：统计概览 + 快捷筛选 (2列) */}
                <div className="lg:col-span-3 xl:col-span-2 space-y-6 relative z-0">
                  {/* 统计卡片 */}
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <StatCard
                      label="总活动数"
                      value={stats.total}
                      icon={<CalendarDays className="w-5 h-5" />}
                    />
                    <StatCard
                      label="已发布"
                      value={stats.published}
                      icon={<CheckCircle2 className="w-5 h-5" />}
                      trend="up"
                    />
                    <StatCard
                      label="审核中"
                      value={stats.pending}
                      icon={<Clock className="w-5 h-5" />}
                    />
                    <StatCard
                      label="总浏览"
                      value={(stats.totalViews || 0).toLocaleString()}
                      icon={<Eye className="w-5 h-5" />}
                    />
                  </div>

                  {/* 快捷筛选 */}
                  <InfoCard title="快速筛选" icon={<Filter className="w-5 h-5" />}>
                    <div className="space-y-3">
                      {(['all', 'published', 'pending', 'draft', 'rejected'] as StatusFilter[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                            statusFilter === status
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {status === 'all' ? (
                              <LayoutGrid className="w-4 h-4" />
                            ) : (
                              <span className={`w-2 h-2 rounded-full ${statusConfig[status]?.color.split(' ')[0] || 'bg-gray-300'}`} />
                            )}
                            {status === 'all' ? '全部活动' : statusConfig[status]?.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {status === 'all' ? stats.total : events.filter(e => e.status === status).length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </InfoCard>

                  {/* 即将开始的活动 */}
                  {upcomingEvents.length > 0 && (
                    <InfoCard title="即将开始" icon={<CalendarDays className="w-5 h-5" />} variant="primary">
                      <div className="space-y-3">
                        {upcomingEvents.map((event, index) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => navigate(`/activities/${event.id}`)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-bold">
                              {getEventStartTime(event).getDate()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{event.title}</p>
                              <p className="text-xs text-gray-500">{formatDate(getEventStartTime(event))}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </InfoCard>
                  )}
                </div>

                {/* 中栏：活动列表 (7列) */}
                <div className="lg:col-span-6 xl:col-span-7">
                  {/* 搜索和筛选 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`rounded-xl p-4 mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-card`}
                  >
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="搜索活动名称或描述..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-all duration-200 ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-primary-500'
                              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500'
                          } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'online' | 'offline')}
                          className={`px-4 py-2.5 rounded-lg border text-sm ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-gray-50 border-gray-200 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-primary-500/20`}
                        >
                          <option value="all">全部类型</option>
                          <option value="online">线上活动</option>
                          <option value="offline">线下活动</option>
                        </select>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </form>
                  </motion.div>

                  {/* 活动列表 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-card`}
                  >
                    {isLoading ? (
                      <div className="p-16 text-center">
                        <motion.div
                          className="inline-block"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full" />
                        </motion.div>
                        <p className="mt-4 text-gray-500">加载中...</p>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="p-16 text-center">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <CalendarDays className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">暂无活动</h3>
                        <p className="mt-2 text-gray-500">您还没有创建任何活动</p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActiveTab('create')}
                          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          创建第一个活动
                        </motion.button>
                      </div>
                    ) : (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 p-4' : 'divide-y divide-gray-100 dark:divide-gray-700'}>
                        <AnimatePresence>
                          {events.map((event, index) => {
                            const StatusIcon = statusConfig[event.status].icon;

                            if (viewMode === 'grid') {
                              return (
                                <motion.div
                                  key={event.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  transition={{ delay: index * 0.05 }}
                                  whileHover={{ y: -4 }}
                                  className={`rounded-xl overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-card hover:shadow-card-hover transition-all cursor-pointer`}
                                  onClick={() => navigate(`/activities/${event.id}`)}
                                >
                                  <div className="aspect-video relative">
                                    {event.thumbnailUrl ? (
                                      <img
                                        src={event.thumbnailUrl}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        <CalendarDays className="w-12 h-12 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[event.status].color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusConfig[event.status].label}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{event.title}</h3>
                                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{event.description}</p>
                                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        {formatDate(getEventStartTime(event))}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" />
                                        {event.participants || 0}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            }

                            return (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className="group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                {/* 封面 */}
                                <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                                  {event.thumbnailUrl ? (
                                    <img
                                      src={event.thumbnailUrl}
                                      alt={event.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <CalendarDays className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>

                                {/* 信息 */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{event.title}</h3>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[event.status].color}`}>
                                      <StatusIcon className="w-3 h-3" />
                                      {statusConfig[event.status].label}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-sm text-gray-500 truncate">{event.description}</p>
                                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                                    <span>{formatDate(getEventStartTime(event))}</span>
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3 h-3" /> {event.viewCount || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" /> {event.participants || 0}
                                    </span>
                                  </div>
                                </div>

                                {/* 操作 */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {/* 查看详情 */}
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/activities/${event.id}`); }}
                                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title="查看详情"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </motion.button>

                                  {/* 编辑按钮 - 根据状态显示不同提示 */}
                                  {(event.status === 'draft' || event.status === 'rejected' || event.status === 'pending') && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={(e) => { e.stopPropagation(); navigate(`/edit-activity/${event.id}`); }}
                                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                      title="编辑活动"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </motion.button>
                                  )}
                                  {event.status === 'published' && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={(e) => { e.stopPropagation(); navigate(`/edit-activity/${event.id}`); }}
                                      className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                      title="编辑并重新审核"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </motion.button>
                                  )}

                                  {/* 提交审核按钮 - 草稿和已拒绝状态显示 */}
                                  {(event.status === 'draft' || event.status === 'rejected') && (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={(e) => { e.stopPropagation(); handleStatusUpdate(event.id, 'pending'); }}
                                      className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                      title="提交审核"
                                    >
                                      <Send className="w-4 h-4" />
                                    </motion.button>
                                  )}

                                  {/* 删除按钮 */}
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="删除活动"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>

                  {/* 分页 */}
                  {!isLoading && events.length > 0 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        共 {events.length} 个活动
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          上一页
                        </button>
                        <span className="px-4 py-2 text-sm">第 {currentPage} 页</span>
                        <button
                          onClick={() => setCurrentPage(p => p + 1)}
                          disabled={events.length < pageSize}
                          className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          下一页
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 右栏：活动日历 + 快捷操作 (3列) */}
                <div className="lg:col-span-3 space-y-6">
                  {/* 快捷操作 */}
                  <InfoCard title="快捷操作" icon={<MoreHorizontal className="w-5 h-5" />}>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveTab('create')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-left"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">创建新活动</span>
                      </button>
                      <button
                        onClick={() => setStatusFilter('draft')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-left"
                      >
                        <FileText className="w-5 h-5" />
                        <span>查看草稿</span>
                      </button>
                      <button
                        onClick={() => setStatusFilter('pending')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-left"
                      >
                        <Clock className="w-5 h-5" />
                        <span>审核中的活动</span>
                      </button>
                    </div>
                  </InfoCard>

                  {/* 活动日历 */}
                  <InfoCard title="活动日历" icon={<CalendarDays className="w-5 h-5" />}>
                    <ActivityMiniCalendar events={events} />
                  </InfoCard>

                  {/* 帮助提示 */}
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-primary-900/10 border-primary-800' : 'bg-primary-50 border-primary-200'} border`}>
                    <h4 className="font-medium text-primary-700 dark:text-primary-300 mb-2">💡 小贴士</h4>
                    <p className="text-sm text-primary-600 dark:text-primary-400">
                      优质的活动封面和详细的描述能吸引更多参与者。记得添加活动标签，方便用户搜索发现。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 创建活动标签 - 完整的创建活动表单 */}
          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* 三栏布局 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 左栏：步骤导航 */}
                <div className="lg:col-span-3 xl:col-span-2">
                  <div className="sticky top-8">
                    <InfoCard title="创建步骤" icon={<Sparkles className="w-5 h-5" />} variant="primary">
                      <StepIndicator
                        steps={steps}
                        currentStep={currentStep}
                        onStepChange={(stepId) => handleStepChange(stepId as StepType)}
                        orientation="vertical"
                      />
                    </InfoCard>

                    <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-800 dark:text-amber-300 text-sm">创建提示</h4>
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                            带 <span className="text-red-500">*</span> 的字段为必填项。填写完成后可预览效果再发布。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 中栏：表单内容 */}
                <div className="lg:col-span-6 xl:col-span-6">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-card`}
                  >
                    {/* 步骤标题 */}
                    <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {steps.find(s => s.id === currentStep)?.name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {steps.find(s => s.id === currentStep)?.description}
                      </p>
                    </div>

                    {/* 基本信息步骤 */}
                    {currentStep === 'basic' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            活动名称 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="给你的活动起个吸引人的名字"
                            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all ${
                              errors.title ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                            } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-4`}
                          />
                          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                          <p className="mt-1 text-xs text-gray-400">{formData.title.length}/50 字符</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            活动描述 <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="简要描述活动内容和亮点"
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all resize-none ${
                              errors.description ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                            } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-4`}
                          />
                          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              开始时间 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="datetime-local"
                              value={formData.startTime ? new Date(formData.startTime.getTime() - formData.startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                              onChange={(e) => handleChange('startTime', new Date(e.target.value))}
                              className={`w-full px-4 py-3 rounded-xl border text-sm ${
                                isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                              } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              结束时间 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="datetime-local"
                              value={formData.endTime ? new Date(formData.endTime.getTime() - formData.endTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                              onChange={(e) => handleChange('endTime', new Date(e.target.value))}
                              className={`w-full px-4 py-3 rounded-xl border text-sm ${
                                isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                              } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20`}
                            />
                          </div>
                        </div>
                        {errors.time && <p className="text-sm text-red-500">{errors.time}</p>}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            活动地点
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={formData.location}
                              onChange={(e) => handleChange('location', e.target.value)}
                              placeholder="输入活动地点或线上链接"
                              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${
                                isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                              } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            活动类型
                          </label>
                          <div className="flex gap-3">
                            {['offline', 'online'].map((type) => (
                              <button
                                key={type}
                                onClick={() => handleChange('type', type)}
                                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                                  formData.type === type
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                                }`}
                              >
                                {type === 'offline' ? '📍 线下活动' : '💻 线上活动'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 活动内容步骤 */}
                    {currentStep === 'content' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            活动详情 <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={formData.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                            placeholder="详细描述活动流程、参与方式、注意事项等..."
                            rows={12}
                            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all resize-none ${
                              errors.content ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                            } ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} focus:outline-none focus:ring-4`}
                          />
                          {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
                          <p className="mt-2 text-xs text-gray-500">
                            提示：详细的描述有助于吸引更多参与者。建议包含活动流程、报名方式、注意事项等信息。
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 多媒体步骤 */}
                    {currentStep === 'media' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            活动封面 <span className="text-red-500">*</span>
                          </label>
                          <div
                            onClick={() => document.getElementById('media-upload')?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                              errors.media ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                            }`}
                          >
                            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">点击或拖拽上传图片</p>
                            <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式，建议尺寸 1200x630</p>
                            <input
                              id="media-upload"
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={() => toast.success('图片上传成功')}
                            />
                          </div>
                          {errors.media && <p className="mt-1 text-sm text-red-500">{errors.media}</p>}
                        </div>

                        {formData.media.length > 0 && (
                          <div className="grid grid-cols-3 gap-4">
                            {formData.media.map((media, index) => (
                              <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                                <img src={media.url} alt="" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => handleChange('media', formData.media.filter((_, i) => i !== index))}
                                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 设置步骤 */}
                    {currentStep === 'settings' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              最大参与人数
                            </label>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="number"
                                value={formData.maxParticipants || ''}
                                onChange={(e) => handleChange('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="不限制请留空"
                                min={1}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${
                                  isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                                } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.isPublic}
                                onChange={(e) => handleChange('isPublic', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">公开活动</span>
                                <p className="text-xs text-gray-500">所有人都可以查看和参与</p>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            活动标签
                          </label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => {
                                setTagInput(e.target.value);
                                if (e.target.value.trim()) {
                                  const suggestions = presetTags
                                    .filter(tag => tag.toLowerCase().includes(e.target.value.toLowerCase()) && !formData.tags?.includes(tag))
                                    .slice(0, 5);
                                  setTagSuggestions(suggestions);
                                  setShowTagSuggestions(suggestions.length > 0);
                                } else {
                                  setShowTagSuggestions(false);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && tagInput.trim()) {
                                  e.preventDefault();
                                  selectTag(tagInput.trim());
                                }
                              }}
                              placeholder="输入标签，按回车添加"
                              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm ${
                                isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'
                              } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20`}
                            />
                            {showTagSuggestions && (
                              <div className={`absolute z-10 mt-1 w-full rounded-xl shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                {tagSuggestions.map((tag) => (
                                  <button
                                    key={tag}
                                    onClick={() => selectTag(tag)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {formData.tags && formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {formData.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                >
                                  {tag}
                                  <button
                                    onClick={() => removeTag(tag)}
                                    className="hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-4">
                            <p className="text-xs text-gray-500 mb-2">推荐标签：</p>
                            <div className="flex flex-wrap gap-2">
                              {presetTags.filter(tag => !formData.tags?.includes(tag)).slice(0, 8).map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => selectTag(tag)}
                                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                                    isDark
                                      ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                                      : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600'
                                  }`}
                                >
                                  + {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 预览发布步骤 */}
                    {currentStep === 'preview' && (
                      <div className="space-y-6">
                        <InfoCard variant="success" icon={<CheckCircle2 className="w-5 h-5" />}>
                          <h3 className="font-medium text-emerald-800 dark:text-emerald-300 mb-3">发布前检查</h3>
                          <ul className="space-y-2">
                            {[
                              { condition: formData.title, text: '活动名称已填写' },
                              { condition: formData.description, text: '活动描述已填写' },
                              { condition: formData.content, text: '活动内容已填写' },
                              { condition: formData.media.length > 0, text: '多媒体资源已上传' },
                              { condition: formData.startTime < formData.endTime, text: '活动时间设置正确' },
                            ].map((item, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm">
                                {item.condition ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className={item.condition ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                  {item.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </InfoCard>

                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-900/10 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                          <p className="text-sm text-amber-800 dark:text-amber-300">
                            提交发布后，我们将对活动内容进行审核，审核通过后活动将自动发布。审核通常需要1-2个工作日。
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 步骤导航按钮 */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={handlePrevious}
                        disabled={currentStep === steps[0].id}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                          currentStep === steps[0].id
                            ? 'opacity-50 cursor-not-allowed text-gray-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                        上一步
                      </button>

                      {currentStep === steps[steps.length - 1].id ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handlePublish}
                          disabled={isPublishing}
                          className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70"
                        >
                          {isPublishing ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              发布中...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              提交发布
                            </>
                          )}
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleNext}
                          className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                        >
                          下一步
                          <ChevronRight className="w-5 h-5" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* 右栏：实时预览 */}
                <div className="lg:col-span-3 xl:col-span-4">
                  <div className="sticky top-8">
                    <InfoCard title="实时预览" icon={<Eye className="w-5 h-5" />}>
                      <div className="relative mx-auto border-8 border-gray-800 dark:border-gray-700 rounded-[2rem] overflow-hidden bg-white dark:bg-gray-900 shadow-2xl" style={{ maxWidth: '280px' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 dark:bg-gray-700 rounded-b-2xl z-10" />
                        <div className="h-8 bg-gray-100 dark:bg-gray-800 flex items-center justify-between px-4 text-xs">
                          <span>9:41</span>
                          <div className="flex gap-1">
                            <span>📶</span>
                            <span>🔋</span>
                          </div>
                        </div>
                        <div className="h-[480px] overflow-y-auto scrollbar-hide">
                          <EventPreview event={formData as any} />
                        </div>
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-4">手机端预览效果</p>
                    </InfoCard>

                    <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm mb-2">💡 创建小贴士</h4>
                      <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                        <li>• 吸引人的标题能增加点击率</li>
                        <li>• 详细的描述有助于用户了解活动</li>
                        <li>• 精美的封面图能提升视觉效果</li>
                        <li>• 合适的标签有助于搜索发现</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 数据分析标签 */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AnalyticsDashboard />
            </motion.div>
          )}

          {/* 作品评分标签 */}
          {activeTab === 'works' && (
            <motion.div
              key="works"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-[calc(100vh-200px)]"
            >
              <WorkScoring />
            </motion.div>
          )}

          {/* 设置标签 */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <OrganizerSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 迷你日历组件
function ActivityMiniCalendar({ events }: { events: Event[] }) {
  const { isDark } = useTheme();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const days = ['日', '一', '二', '三', '四', '五', '六'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const hasEventOnDay = (day: number) => {
    return events.some(event => {
      const eventDate = event.start_time 
        ? new Date(event.start_time) 
        : event.start_date 
          ? new Date(event.start_date * 1000) 
          : new Date();
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentMonth &&
             eventDate.getFullYear() === currentYear;
    });
  };

  const isToday = (day: number) => {
    return today.getDate() === day &&
           today.getMonth() === currentMonth &&
           today.getFullYear() === currentYear;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (currentMonth === 0) {
              setCurrentMonth(11);
              setCurrentYear(currentYear - 1);
            } else {
              setCurrentMonth(currentMonth - 1);
            }
          }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <span className="font-medium">{currentYear}年 {monthNames[currentMonth]}</span>
        <button
          onClick={() => {
            if (currentMonth === 11) {
              setCurrentMonth(0);
              setCurrentYear(currentYear + 1);
            } else {
              setCurrentMonth(currentMonth + 1);
            }
          }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map(day => (
          <div key={day} className="text-xs text-gray-500 py-1">{day}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hasEvent = hasEventOnDay(day);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all relative
                ${isTodayDate ? 'bg-primary-500 text-white font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                ${hasEvent && !isTodayDate ? 'font-semibold text-primary-600 dark:text-primary-400' : ''}
              `}
            >
              {day}
              {hasEvent && (
                <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isTodayDate ? 'bg-white' : 'bg-primary-500'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
