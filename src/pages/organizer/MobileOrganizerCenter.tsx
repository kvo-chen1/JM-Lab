import { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { Event } from '@/types';
import { useEventService } from '@/hooks/useEventService';
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import { userStateService } from '@/services/userStateService';
import WorkScoring from './WorkScoring';
import AnalyticsDashboard from './AnalyticsDashboard';
import OrganizerSettings from './OrganizerSettings';
import {
  CalendarDays,
  Plus,
  Trophy,
  BarChart3,
  Settings,
  Building2,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  LayoutGrid,
  List,
  Search,
  Filter,
  Eye,
  Users,
  ArrowLeft,
  MoreHorizontal,
  Edit3,
  Trash2,
  Send,
  MapPin,
  Heart,
  Star,
  Upload,
  Calendar,
  TrendingUp,
  Award,
  Image as ImageIcon,
} from 'lucide-react';

// 状态配置
const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700', icon: FileText, bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  pending: { label: '审核中', color: 'bg-amber-100 text-amber-700', icon: Clock, bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  published: { label: '已发布', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700', icon: FileText, bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  completed: { label: '已结束', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  active: { label: '进行中', color: 'bg-green-100 text-green-700', icon: CheckCircle2, bgColor: 'bg-green-50', borderColor: 'border-green-200' }
};

type TabType = 'activities' | 'create' | 'works' | 'analytics' | 'settings';
type StatusFilter = 'all' | 'draft' | 'pending' | 'published' | 'rejected';
type ViewMode = 'list' | 'grid';

// 统计数据卡片组件
const StatCard = ({ title, value, icon, color, delay = 0 }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className={`${color} rounded-2xl p-4 flex flex-col justify-between min-h-[100px]`}
  >
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 font-medium">{title}</span>
      <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center">
        {icon}
      </div>
    </div>
    <span className="text-2xl font-bold text-gray-900 mt-2">{value}</span>
  </motion.div>
);

// 功能菜单项组件
const MenuItem = ({ 
  icon, 
  label, 
  isActive, 
  onClick, 
  badge,
  delay = 0 
}: { 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
  badge?: number;
  delay?: number;
}) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.2 }}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'
    }`}
  >
    <div className="relative">
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
    <span className="text-xs mt-1.5 font-medium">{label}</span>
  </motion.button>
);

// 活动列表项组件
const EventListItem = ({ 
  event, 
  onClick, 
  onEdit, 
  onDelete,
  delay = 0 
}: { 
  event: Event; 
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  delay?: number;
}) => {
  const statusCfg = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.draft;
  const StatusIcon = statusCfg.icon;
  
  const formatDate = (date: Date | string | number | undefined) => {
    if (!date) return '-';
    let d: Date;
    if (typeof date === 'number') {
      // 数字类型：假设是秒级时间戳，转换为毫秒
      d = new Date(date * 1000);
    } else if (typeof date === 'string') {
      // 检查是否是纯数字字符串（秒级时间戳）
      if (/^\d+$/.test(date)) {
        d = new Date(parseInt(date, 10) * 1000);
      } else {
        // ISO 字符串或其他格式
        d = new Date(date);
      }
    } else {
      d = date;
    }
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
    }).format(d);
  };

  const getEventStartTime = (event: Event): Date => {
    if (event.startTime) {
      return new Date(event.startTime);
    }
    return new Date();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
    >
      <div className="flex gap-3">
        {/* 封面图 */}
        <div 
          onClick={onClick}
          className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 cursor-pointer"
        >
          {event.coverUrl || event.thumbnailUrl || event.media?.[0]?.url ? (
            <img
              src={event.coverUrl || event.thumbnailUrl || event.media?.[0]?.url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CalendarDays className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 
              onClick={onClick}
              className="font-semibold text-gray-900 text-sm line-clamp-1 cursor-pointer"
            >
              {event.title}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCfg.color} flex-shrink-0`}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
          </div>
          
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{event.description}</p>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(getEventStartTime(event))}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {event.viewCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.participants || 0}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        {(event.status === 'draft' || event.status === 'rejected') && (
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium"
          >
            <Edit3 className="w-3.5 h-3.5" />
            编辑
          </button>
        )}
        {event.status === 'published' && (
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium"
          >
            <Edit3 className="w-3.5 h-3.5" />
            编辑
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

// 数据分析统计卡片
const AnalyticsStatCard = ({ 
  title, 
  value, 
  change,
  icon,
  color,
  delay = 0 
}: { 
  title: string; 
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className={`${color} rounded-2xl p-4`}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-gray-600 font-medium">{title}</span>
      <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="flex items-end justify-between">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      {change && (
        <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
          <TrendingUp className="w-3 h-3" />
          {change}
        </span>
      )}
    </div>
  </motion.div>
);

// 主组件
export default function MobileOrganizerCenter() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { getUserEvents, deleteEvent } = useEventService();
  const { isAuthenticated, user } = useContext(AuthContext);

  // 状态
  const [activeTab, setActiveTab] = useState<TabType>('activities');
  const [userBrands, setUserBrands] = useState<BrandPartnership[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandPartnership | null>(null);
  const [isCheckingBrand, setIsCheckingBrand] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // 检查品牌验证状态
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

        const approvedBrands = myPartnerships.filter(p => p.status === 'approved');
        setUserBrands(approvedBrands);

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

  // 获取活动列表
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const params: any = { refresh: true };
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (selectedBrand?.id) {
        params.brandId = selectedBrand.id;
      }
      
      const eventsData = await getUserEvents(user?.id || '', params) || [];
      
      if (searchQuery) {
        const filtered = eventsData.filter(e => 
          e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setEvents(filtered);
      } else {
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('获取活动列表失败:', error);
      toast.error('获取活动列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedBrand, searchQuery, statusFilter]);

  useEffect(() => {
    if (activeTab === 'activities') {
      fetchEvents();
    }
  }, [activeTab, selectedBrand, fetchEvents]);

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

  // 处理删除活动
  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('确定要删除这个活动吗？此操作不可恢复。')) {
      try {
        await deleteEvent(eventId);
        setEvents(prev => prev.filter(event => event.id !== eventId));
        toast.success('活动已删除');
      } catch (error) {
        toast.error('删除活动失败');
      }
    }
  };

  // 切换品牌
  const handleSwitchBrand = (brand: BrandPartnership) => {
    setSelectedBrand(brand);
    localStorage.setItem('selected_brand_id', brand.id);
    
    // 异步保存到数据库
    userStateService.savePreferences({
      customSettings: { selectedBrandId: brand.id }
    }).catch(err => {
      console.error('[MobileOrganizerCenter] Failed to save selected brand to database:', err);
    });
    
    toast.success(`已切换到: ${brand.brand_name}`);
    fetchEvents();
  };

  // 渲染头部
  const renderHeader = () => (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-lg font-semibold text-gray-900">主办方中心</span>
        </div>
        
        {selectedBrand && (
          <button
            onClick={() => {
              if (userBrands.length > 1) {
                const currentIndex = userBrands.findIndex(b => b.id === selectedBrand?.id);
                const nextBrand = userBrands[(currentIndex + 1) % userBrands.length];
                handleSwitchBrand(nextBrand);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="max-w-[80px] truncate">{selectedBrand.brand_name}</span>
            {userBrands.length > 1 && <ChevronRight className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );

  // 渲染功能菜单
  const renderMenu = () => (
    <div className="px-4 py-4">
      <div className="grid grid-cols-5 gap-2">
        <MenuItem
          icon={<CalendarDays className="w-5 h-5" />}
          label="活动管理"
          isActive={activeTab === 'activities'}
          onClick={() => setActiveTab('activities')}
          badge={stats.pending}
          delay={0}
        />
        <MenuItem
          icon={<Plus className="w-5 h-5" />}
          label="创建活动"
          isActive={false}
          onClick={() => {
            setActiveTab('create');
          }}
          delay={0.05}
        />
        <MenuItem
          icon={<Trophy className="w-5 h-5" />}
          label="作品评分"
          isActive={activeTab === 'works'}
          onClick={() => setActiveTab('works')}
          delay={0.1}
        />
        <MenuItem
          icon={<BarChart3 className="w-5 h-5" />}
          label="数据分析"
          isActive={activeTab === 'analytics'}
          onClick={() => setActiveTab('analytics')}
          delay={0.15}
        />
        <MenuItem
          icon={<Settings className="w-5 h-5" />}
          label="主办方设置"
          isActive={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          delay={0.2}
        />
      </div>
    </div>
  );

  // 渲染活动管理
  const renderActivities = () => (
    <div className="px-4 pb-24">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          title="总活动数"
          value={stats.total}
          icon={<CalendarDays className="w-4 h-4 text-blue-600" />}
          color="bg-blue-50"
          delay={0}
        />
        <StatCard
          title="已发布"
          value={stats.published}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          color="bg-emerald-50"
          delay={0.05}
        />
        <StatCard
          title="审核中"
          value={stats.pending}
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          color="bg-amber-50"
          delay={0.1}
        />
        <StatCard
          title="总浏览"
          value={stats.totalViews}
          icon={<Eye className="w-4 h-4 text-purple-600" />}
          color="bg-purple-50"
          delay={0.15}
        />
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索活动..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            showFilters 
              ? 'bg-blue-50 border-blue-200 text-blue-600' 
              : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600"
        >
          {viewMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </button>
      </div>

      {/* 状态筛选 */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl">
              {(['all', 'published', 'pending', 'draft', 'rejected'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {status === 'all' ? '全部' : statusConfig[status]?.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 活动列表 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-gray-500">加载中...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <CalendarDays className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900">暂无活动</h3>
          <p className="text-sm text-gray-500 mt-1">您还没有创建任何活动</p>
          <button
            onClick={() => navigate('/create-activity')}
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl"
          >
            创建第一个活动
          </button>
        </div>
      ) : (
        <div>
          {events.map((event, index) => (
            <EventListItem
              key={event.id}
              event={event}
              onClick={() => navigate(`/cultural-events?eventId=${event.id}&openModal=true`)}
              onEdit={() => navigate(`/edit-activity/${event.id}`)}
              onDelete={() => handleDeleteEvent(event.id)}
              delay={index * 0.05}
            />
          ))}
        </div>
      )}
    </div>
  );

  // 渲染数据分析
  const renderAnalytics = () => (
    <div className="px-4 pb-24">
      {/* 标题 */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">数据分析</h2>
        <p className="text-sm text-gray-500">实时查看活动数据、作品表现和用户参与度</p>
      </div>

      {/* 时间筛选 */}
      <div className="flex gap-2 mb-4">
        <select className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white">
          <option>近30天</option>
          <option>近7天</option>
          <option>近90天</option>
        </select>
        <select className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white">
          <option>全部活动</option>
        </select>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <AnalyticsStatCard
          title="作品总数"
          value={stats.total}
          change="+12%"
          icon={<Upload className="w-4 h-4 text-blue-600" />}
          color="bg-blue-50"
          delay={0}
        />
        <AnalyticsStatCard
          title="总投票数"
          value={stats.totalParticipants}
          change="+8%"
          icon={<Eye className="w-4 h-4 text-emerald-600" />}
          color="bg-emerald-50"
          delay={0.05}
        />
        <AnalyticsStatCard
          title="总点赞数"
          value={stats.totalViews}
          change="+15%"
          icon={<Heart className="w-4 h-4 text-rose-600" />}
          color="bg-rose-50"
          delay={0.1}
        />
        <AnalyticsStatCard
          title="平均评分"
          value="8.5"
          change="+0.3"
          icon={<Star className="w-4 h-4 text-amber-600" />}
          color="bg-amber-50"
          delay={0.15}
        />
      </div>

      {/* 更多数据分析 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">活动表现趋势</h3>
        <div className="h-40 flex items-center justify-center bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-400">图表数据加载中...</p>
        </div>
      </div>

      {/* 使用完整的 AnalyticsDashboard 组件 */}
      <div className="mt-4">
        <AnalyticsDashboard />
      </div>
    </div>
  );

  // 渲染内页头部（带返回按钮）
  const renderSubPageHeader = (title: string) => (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('activities')}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-lg font-semibold text-gray-900">{title}</span>
      </div>
    </div>
  );

  // 渲染作品评分
  const renderWorks = () => (
    <div className="min-h-screen bg-gray-50">
      {renderSubPageHeader('作品评分')}
      <div className="h-[calc(100vh-140px)]">
        <WorkScoring />
      </div>
    </div>
  );

  // 渲染设置
  const renderSettings = () => (
    <div className="min-h-screen bg-gray-50">
      {renderSubPageHeader('主办方设置')}
      <OrganizerSettings />
    </div>
  );

  // 处理创建活动跳转 - 必须在所有条件返回之前
  useEffect(() => {
    if (activeTab === 'create') {
      navigate('/create-activity');
    }
  }, [activeTab, navigate]);

  // 加载状态检查必须在所有 hooks 之后
  if (isCheckingBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">正在检查品牌验证状态...</p>
        </div>
      </div>
    );
  }

  // 未认证状态检查必须在所有 hooks 之后
  if (userBrands.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">需要品牌认证</h2>
          <p className="text-sm text-gray-500 mb-6">
            只有经过平台审核认证的品牌才能管理活动
          </p>
          <button
            onClick={() => navigate('/business')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
          >
            申请品牌入驻
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 只在非内页显示头部 */}
      {activeTab !== 'works' && activeTab !== 'settings' && renderHeader()}
      
      {/* 只在非内页显示功能菜单 */}
      {activeTab !== 'works' && activeTab !== 'settings' && renderMenu()}

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        {activeTab === 'activities' && (
          <motion.div
            key="activities"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderActivities()}
          </motion.div>
        )}
        
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderAnalytics()}
          </motion.div>
        )}
        
        {activeTab === 'works' && (
          <motion.div
            key="works"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderWorks()}
          </motion.div>
        )}
        
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderSettings()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
