import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { brandTaskService, BrandTask, TaskStats, BrandTaskParticipant, BrandTaskSubmission } from '@/services/brandTaskService';
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronRight,
  BarChart3,
  Clock,
  AlertCircle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Wallet,
  CreditCard,
  Receipt,
  Target,
  Award,
  Sparkles,
  Zap,
  ArrowUpRight,
  PieChart,
  Activity,
  Layers,
  Briefcase,
  Percent,
  Hash,
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  Image as ImageIcon,
  Video,
  MapPin,
  User,
  Tag,
  ChevronLeft,
  FilterX,
  RefreshCw,
  MoreVertical,
  Copy,
  ExternalLink,
  TrendingDown,
  MousePointer,
  ThumbsUp,
  MessageCircle,
  Send,
  Inbox,
  CheckSquare,
  XSquare,
  RotateCcw,
  Settings,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// ============================================================================
// 类型定义
// ============================================================================

interface TaskWithStats extends BrandTask {
  stats?: TaskStats;
}

// ============================================================================
// 状态配置
// ============================================================================

const statusConfig = {
  draft: { 
    label: '草稿', 
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900/50',
    borderColor: 'border-slate-200 dark:border-slate-700',
    icon: FileText,
    gradient: 'from-slate-400 to-slate-500',
    description: '任务尚未发布'
  },
  pending: { 
    label: '审核中', 
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: Clock,
    gradient: 'from-amber-400 to-orange-500',
    description: '等待平台审核'
  },
  published: { 
    label: '进行中', 
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    icon: Play,
    gradient: 'from-emerald-400 to-teal-500',
    description: '任务正在招募创作者'
  },
  paused: { 
    label: '已暂停', 
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    icon: Pause,
    gradient: 'from-orange-400 to-red-500',
    description: '任务已暂停招募'
  },
  completed: { 
    label: '已完成', 
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: CheckCircle2,
    gradient: 'from-blue-400 to-indigo-500',
    description: '任务已结束'
  },
  cancelled: { 
    label: '已取消', 
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: XCircle,
    gradient: 'from-red-400 to-rose-500',
    description: '任务已取消'
  },
};

const submissionStatusConfig = {
  pending: { 
    label: '待审核', 
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    icon: Clock 
  },
  approved: { 
    label: '已通过', 
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: CheckCircle2 
  },
  rejected: { 
    label: '已拒绝', 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: XCircle 
  },
  needs_revision: { 
    label: '需修改', 
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    icon: RotateCcw 
  },
};

const participantStatusConfig = {
  applied: { label: '已申请', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  approved: { label: '已通过', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  active: { label: '进行中', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  completed: { label: '已完成', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
};

// ============================================================================
// 激励模型预设
// ============================================================================

const incentivePresets = [
  {
    name: '标准模式',
    description: '基于浏览量、点赞、收藏的均衡激励',
    model: {
      type: 'performance_based' as const,
      metrics: {
        views: { weight: 0.3, rate_per_1000: 10 },
        likes: { weight: 0.3, rate_per: 2 },
        favorites: { weight: 0.2, rate_per: 5 },
        shares: { weight: 0.2, rate_per: 3 },
      },
      max_reward_per_work: 1000,
      min_reward_per_work: 50,
    },
  },
  {
    name: '浏览优先',
    description: '侧重作品曝光量',
    model: {
      type: 'performance_based' as const,
      metrics: {
        views: { weight: 0.5, rate_per_1000: 15 },
        likes: { weight: 0.2, rate_per: 1 },
        favorites: { weight: 0.15, rate_per: 3 },
        shares: { weight: 0.15, rate_per: 2 },
      },
      max_reward_per_work: 1500,
      min_reward_per_work: 30,
    },
  },
  {
    name: '互动优先',
    description: '侧重用户互动质量',
    model: {
      type: 'performance_based' as const,
      metrics: {
        views: { weight: 0.2, rate_per_1000: 5 },
        likes: { weight: 0.4, rate_per: 3 },
        favorites: { weight: 0.25, rate_per: 8 },
        shares: { weight: 0.15, rate_per: 5 },
      },
      max_reward_per_work: 800,
      min_reward_per_work: 80,
    },
  },
];

// ============================================================================
// 左侧导航组件
// ============================================================================

function Sidebar({ 
  activeFilter, 
  setActiveFilter, 
  taskCounts,
  isDark,
  totalBudget,
  totalSpent,
}: { 
  activeFilter: string; 
  setActiveFilter: (filter: string) => void;
  taskCounts: Record<string, number>;
  isDark: boolean;
  totalBudget: number;
  totalSpent: number;
}) {
  const menuItems = [
    { id: 'all', label: '全部任务', icon: Layers, count: taskCounts.all },
    { id: 'published', label: '进行中', icon: Play, count: taskCounts.published },
    { id: 'pending', label: '审核中', icon: Clock, count: taskCounts.pending },
    { id: 'draft', label: '草稿', icon: FileText, count: taskCounts.draft },
    { id: 'paused', label: '已暂停', icon: Pause, count: taskCounts.paused },
    { id: 'completed', label: '已完成', icon: CheckCircle2, count: taskCounts.completed },
  ];

  const usageRate = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className={`w-64 flex-shrink-0 ${isDark ? 'bg-gray-900/50' : 'bg-white'} rounded-2xl border ${isDark ? 'border-gray-800' : 'border-gray-200'} overflow-hidden`}>
      <div className={`p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>任务状态</h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>按状态筛选任务</p>
      </div>
      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeFilter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                  : isDark
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-current' : ''}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive
                    ? isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-200 text-blue-700'
                    : isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 预算概览 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Wallet className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>预算概览</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>总预算</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>¥{totalBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>已使用</span>
              <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>¥{totalSpent.toLocaleString()}</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div 
                className={`h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500`}
                style={{ width: `${Math.min(usageRate, 100)}%` }}
              />
            </div>
            <p className={`text-xs text-right ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>使用率 {usageRate}%</p>
          </div>
        </div>
      </div>

      {/* 快速统计 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>本月成就</span>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {taskCounts.completed}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>已完成任务</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 任务卡片组件
// ============================================================================

interface TaskCardProps {
  task: BrandTask;
  isSelected: boolean;
  onClick: () => void;
  isDark: boolean;
}

const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(function TaskCard({ task, isSelected, onClick, isDark }, ref) {
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  
  const progress = task.total_budget > 0
    ? Math.round(((task.total_budget - (task.remaining_budget || 0)) / task.total_budget) * 100)
    : 0;

  const daysLeft = Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft < 0;
  const isEndingSoon = daysLeft >= 0 && daysLeft <= 3;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`cursor-pointer group relative overflow-hidden rounded-xl border transition-all duration-300 ${
        isSelected
          ? isDark
            ? 'bg-gray-800 border-blue-500/50 shadow-lg shadow-blue-500/10'
            : 'bg-white border-blue-400 shadow-lg shadow-blue-500/10'
          : isDark
          ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* 选中指示器 */}
      {isSelected && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${status.gradient}`} />
      )}

      <div className="p-5">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {task.brand_logo ? (
              <img 
                src={task.brand_logo} 
                alt={task.brand_name} 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm" 
              />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${
                isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>
                {task.brand_name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h4 className={`font-semibold text-sm line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {task.title}
              </h4>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{task.brand_name}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`p-2.5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Users className="w-3 h-3" />
              参与
            </div>
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {task.current_participants}/{task.max_participants}
            </p>
          </div>
          <div className={`p-2.5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <FileText className="w-3 h-3" />
              作品
            </div>
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {task.total_works}
            </p>
          </div>
          <div className={`p-2.5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <DollarSign className="w-3 h-3" />
              预算
            </div>
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ¥{(task.total_budget / 1000).toFixed(0)}k
            </p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>预算使用</span>
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{progress}%</span>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`h-full rounded-full bg-gradient-to-r ${status.gradient}`}
            />
          </div>
        </div>

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-xs">
          <div className={`flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            <Calendar className="w-3 h-3" />
            {isExpired ? (
              <span className="text-red-500">已过期</span>
            ) : isEndingSoon ? (
              <span className="text-amber-500">还剩 {daysLeft} 天</span>
            ) : (
              <span>还剩 {daysLeft} 天</span>
            )}
          </div>
          <div className={`flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            <Clock className="w-3 h-3" />
            {new Date(task.end_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================================================
// 统计卡片组件
// ============================================================================

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendUp,
  isDark,
  color = 'blue'
}: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  isDark: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'pink';
}) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' },
    pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400', icon: 'text-pink-500' },
  };

  const colors = colorClasses[color];

  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{title}</p>
          <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {subtitle && <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 任务详情面板
// ============================================================================

interface TaskDetailPanelProps {
  task: BrandTask | null;
  isDark: boolean;
  onEdit: (task: BrandTask) => void;
  onDelete: (taskId: string) => void;
  onPause: (taskId: string) => void;
  onResume: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onRefresh: () => void;
}

function TaskDetailPanel({ 
  task, 
  isDark, 
  onEdit, 
  onDelete, 
  onPause, 
  onResume, 
  onComplete,
  onRefresh,
}: TaskDetailPanelProps) {
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [participants, setParticipants] = useState<BrandTaskParticipant[]>([]);
  const [submissions, setSubmissions] = useState<BrandTaskSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'submissions' | 'analytics'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  const loadTaskData = useCallback(async () => {
    if (!task) return;
    setIsLoading(true);
    try {
      const [statsData, participantsData, submissionsData] = await Promise.all([
        brandTaskService.getTaskStats(task.id),
        brandTaskService.getTaskParticipants(task.id),
        brandTaskService.getTaskSubmissions(task.id),
      ]);
      setStats(statsData);
      setParticipants(participantsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('加载任务数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [task]);

  useEffect(() => {
    loadTaskData();
  }, [loadTaskData]);

  if (!task) {
    return (
      <div className={`w-96 flex-shrink-0 rounded-2xl border ${isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-gray-50/50'} flex items-center justify-center`}>
        <div className="text-center p-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <Layers className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>选择一个任务查看详情</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const progress = task.total_budget > 0
    ? Math.round(((task.total_budget - (task.remaining_budget || 0)) / task.total_budget) * 100)
    : 0;

  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
  const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;

  return (
    <div className={`w-96 flex-shrink-0 rounded-2xl border ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'} overflow-hidden flex flex-col`}>
      {/* 头部 */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="flex items-start justify-between mb-4">
          {task.brand_logo ? (
            <img src={task.brand_logo} alt={task.brand_name} className="w-14 h-14 rounded-xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-md" />
          ) : (
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold shadow-md ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              {task.brand_name.charAt(0)}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={loadTaskData}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              title="刷新数据"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </div>
          </div>
        </div>
        <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{task.brand_name}</p>
        <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{status.description}</p>
      </div>

      {/* 标签页 */}
      <div className={`flex gap-1 p-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        {[
          { id: 'overview', label: '概览', icon: BarChart3 },
          { id: 'participants', label: `参与者 ${participants.length > 0 ? `(${participants.length})` : ''}`, icon: Users },
          { id: 'submissions', label: `作品 ${pendingSubmissions > 0 ? `(${pendingSubmissions}待审)` : ''}`, icon: FileText },
          { id: 'analytics', label: '数据', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* 快捷操作 */}
                <div className="grid grid-cols-2 gap-2">
                  {task.status === 'draft' && (
                    <button
                      onClick={() => onEdit(task)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isDark ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                      编辑任务
                    </button>
                  )}
                  {task.status === 'published' && (
                    <button
                      onClick={() => onPause(task.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isDark ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      <Pause className="w-4 h-4" />
                      暂停任务
                    </button>
                  )}
                  {task.status === 'paused' && (
                    <button
                      onClick={() => onResume(task.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isDark ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      恢复任务
                    </button>
                  )}
                  {(task.status === 'published' || task.status === 'paused') && (
                    <button
                      onClick={() => onComplete(task.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isDark ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      完成任务
                    </button>
                  )}
                  {task.status === 'draft' && (
                    <button
                      onClick={() => onDelete(task.id)}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      删除任务
                    </button>
                  )}
                </div>

                {/* 关键指标 */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    title="参与人数"
                    value={`${task.current_participants}/${task.max_participants}`}
                    subtitle={`${Math.round((task.current_participants / task.max_participants) * 100)}% 名额已满`}
                    icon={Users}
                    isDark={isDark}
                    color="blue"
                  />
                  <StatCard
                    title="作品数量"
                    value={task.total_works}
                    subtitle={`人均 ${(task.total_works / Math.max(task.current_participants, 1)).toFixed(1)} 个`}
                    icon={FileText}
                    isDark={isDark}
                    color="purple"
                  />
                </div>

                {/* 预算信息 */}
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>预算使用</span>
                    </div>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${status.gradient}`}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                      已用 ¥{(task.total_budget - (task.remaining_budget || 0)).toLocaleString()}
                    </span>
                    <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                      总计 ¥{task.total_budget.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 时间信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>时间安排</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>开始时间</span>
                      </div>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {new Date(task.start_date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>结束时间</span>
                      </div>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {new Date(task.end_date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 任务要求 */}
                <div>
                  <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>任务要求</h4>
                  <div className="flex flex-wrap gap-2">
                    {task.required_tags.map((tag, i) => (
                      <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {task.required_location && (
                    <div className={`flex items-center gap-2 mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <MapPin className="w-3.5 h-3.5" />
                      {task.required_location}
                    </div>
                  )}
                </div>

                {/* 激励说明 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-amber-600/10 to-orange-600/10 border border-amber-500/20' : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>激励说明</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    单个作品奖励范围: ¥{task.min_reward} - ¥{task.max_reward}
                  </p>
                  {task.incentive_model?.metrics && (
                    <div className="mt-2 space-y-1 text-xs">
                      {task.incentive_model.metrics.views && (
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>浏览量</span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>每1000次 ¥{task.incentive_model.metrics.views.rate_per_1000}</span>
                        </div>
                      )}
                      {task.incentive_model.metrics.likes && (
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>点赞</span>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>每个 ¥{task.incentive_model.metrics.likes.rate_per}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <TaskParticipantsPanel 
                participants={participants} 
                isDark={isDark} 
                task={task}
                onRefresh={loadTaskData}
              />
            )}

            {activeTab === 'submissions' && (
              <TaskSubmissionsPanel 
                submissions={submissions} 
                isDark={isDark}
                task={task}
                onRefresh={loadTaskData}
              />
            )}

            {activeTab === 'analytics' && (
              <TaskAnalyticsPanel 
                task={task}
                stats={stats}
                submissions={submissions}
                isDark={isDark}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 参与者面板
// ============================================================================

function TaskParticipantsPanel({ 
  participants, 
  isDark, 
  task,
  onRefresh 
}: { 
  participants: BrandTaskParticipant[];
  isDark: boolean;
  task: BrandTask;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'applied' | 'approved' | 'rejected'>('all');

  const filteredParticipants = participants.filter(p => 
    filter === 'all' || p.status === filter
  );

  const handleApprove = async (participantId: string) => {
    const success = await brandTaskService.approveParticipant(participantId);
    if (success) {
      toast.success('已通过申请');
      onRefresh();
    } else {
      toast.error('审核失败');
    }
  };

  const handleReject = async (participantId: string) => {
    const success = await brandTaskService.rejectParticipant(participantId);
    if (success) {
      toast.success('已拒绝申请');
      onRefresh();
    } else {
      toast.error('操作失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* 过滤器 */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: '全部' },
          { id: 'applied', label: '待审核' },
          { id: 'approved', label: '已通过' },
          { id: 'rejected', label: '已拒绝' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.id
                ? isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredParticipants.length === 0 ? (
        <div className="text-center py-8">
          <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>暂无申请者</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredParticipants.map((participant) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                {participant.creator?.avatar_url ? (
                  <img
                    src={participant.creator.avatar_url}
                    alt={participant.creator.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {participant.creator?.username || '未知用户'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    申请于 {new Date(participant.applied_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${participantStatusConfig[participant.status]?.color || 'bg-gray-100'}`}>
                  {participantStatusConfig[participant.status]?.label || participant.status}
                </span>
              </div>

              {/* 审核按钮 */}
              {participant.status === 'applied' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleApprove(participant.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    通过
                  </button>
                  <button
                    onClick={() => handleReject(participant.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    拒绝
                  </button>
                </div>
              )}

              {/* 统计信息 */}
              <div className="flex gap-4 mt-2 text-xs">
                <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                  提交作品: {participant.submitted_works}
                </span>
                <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                  已通过: {participant.approved_works}
                </span>
                {participant.total_earnings > 0 && (
                  <span className="text-emerald-500">
                    收益: ¥{participant.total_earnings}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 作品提交面板
// ============================================================================

function TaskSubmissionsPanel({ 
  submissions, 
  isDark,
  task,
  onRefresh
}: { 
  submissions: BrandTaskSubmission[];
  isDark: boolean;
  task: BrandTask;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredSubmissions = submissions.filter(s => 
    filter === 'all' || s.status === filter
  );

  const handleApprove = async (submissionId: string) => {
    const success = await brandTaskService.approveSubmission(submissionId);
    if (success) {
      toast.success('已通过作品');
      onRefresh();
    } else {
      toast.error('审核失败');
    }
  };

  const handleReject = async (submissionId: string) => {
    const success = await brandTaskService.rejectSubmission(submissionId, '作品不符合要求');
    if (success) {
      toast.success('已拒绝作品');
      onRefresh();
    } else {
      toast.error('操作失败');
    }
  };

  const handleCalculateReward = async (submission: BrandTaskSubmission) => {
    const reward = await brandTaskService.calculateReward(
      submission.id,
      submission.work?.view_count || 0,
      0,
      0,
      0
    );
    if (reward !== null) {
      const success = await brandTaskService.updateSubmissionReward(submission.id, reward);
      if (success) {
        toast.success(`已发放奖励 ¥${reward}`);
        onRefresh();
      } else {
        toast.error('奖励发放失败');
      }
    } else {
      toast.error('计算奖励失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* 过滤器 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: `全部 (${submissions.length})` },
          { id: 'pending', label: `待审核 (${submissions.filter(s => s.status === 'pending').length})` },
          { id: 'approved', label: `已通过 (${submissions.filter(s => s.status === 'approved').length})` },
          { id: 'rejected', label: `已拒绝 (${submissions.filter(s => s.status === 'rejected').length})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.id
                ? isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-8">
          <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>暂无作品提交</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((submission) => (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
            >
              <div className="flex items-start gap-3">
                {submission.work?.thumbnail ? (
                  <img
                    src={submission.work.thumbnail}
                    alt={submission.work.title}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <FileText className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {submission.work_title || '未命名作品'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    创作者: {submission.creator?.username || '未知用户'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    提交于 {new Date(submission.submitted_at).toLocaleDateString('zh-CN')}
                  </p>
                  {submission.final_reward !== null && (
                    <p className={`text-xs font-medium mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      奖励: ¥{submission.final_reward}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${submissionStatusConfig[submission.status]?.color || 'bg-gray-100'}`}>
                  {submissionStatusConfig[submission.status]?.label || submission.status}
                </span>
              </div>

              {/* 审核按钮 */}
              {submission.status === 'pending' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleApprove(submission.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    通过
                  </button>
                  <button
                    onClick={() => handleReject(submission.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    拒绝
                  </button>
                </div>
              )}

              {/* 奖励发放按钮 */}
              {submission.status === 'approved' && submission.final_reward === null && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleCalculateReward(submission)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    计算并发放奖励
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 数据分析面板
// ============================================================================

function TaskAnalyticsPanel({ 
  task, 
  stats, 
  submissions,
  isDark 
}: { 
  task: BrandTask;
  stats: TaskStats | null;
  submissions: BrandTaskSubmission[];
  isDark: boolean;
}) {
  const totalRewards = submissions.reduce((sum, s) => sum + (s.final_reward || 0), 0);
  const avgReward = submissions.filter(s => s.final_reward).length > 0
    ? totalRewards / submissions.filter(s => s.final_reward).length
    : 0;

  return (
    <div className="space-y-5">
      {/* 数据概览卡片 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20' : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100'}`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>数据概览</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats?.total_views?.toLocaleString() || 0}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>总浏览量</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ¥{totalRewards.toLocaleString()}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>已发放奖励</p>
          </div>
        </div>
      </div>

      {/* 互动数据 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '点赞', value: stats?.total_likes || 0, icon: Heart, color: 'text-pink-500' },
          { label: '收藏', value: stats?.total_favorites || 0, icon: Bookmark, color: 'text-yellow-500' },
          { label: '分享', value: stats?.total_shares || 0, icon: Share2, color: 'text-blue-500' },
        ].map((item, i) => (
          <div key={i} className={`p-3 rounded-xl text-center ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <item.icon className={`w-4 h-4 mx-auto mb-2 ${item.color}`} />
            <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* 详细统计 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <h4 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>详细统计</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>参与人数</span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {task.current_participants}/{task.max_participants}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>作品数量</span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {submissions.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>已审核作品</span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {submissions.filter(s => s.status === 'approved').length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>待审核作品</span>
            <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {submissions.filter(s => s.status === 'pending').length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>平均奖励</span>
            <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              ¥{avgReward.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>剩余预算</span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ¥{(task.remaining_budget || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 导出按钮 */}
      <button
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
          isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Download className="w-4 h-4" />
        导出数据报表
      </button>
    </div>
  );
}

// ============================================================================
// 创建任务模态框
// ============================================================================

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTask?: BrandTask | null;
  userBrands: BrandPartnership[];
}

function CreateTaskModal({ isOpen, onClose, onSuccess, editTask, userBrands }: CreateTaskModalProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    brand_id: '',
    brand_name: '',
    required_tags: [''],
    required_location: '商单广场',
    content_requirements: [''],
    participation_conditions: [''],
    start_date: '',
    end_date: '',
    total_budget: '',
    min_reward: '50',
    max_reward: '1000',
    max_participants: '100',
    max_works_per_user: '5',
    require_approval: true,
    auto_approval_threshold: '',
  });

  useEffect(() => {
    if (editTask) {
      const formatDateTimeLocal = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        title: editTask.title,
        description: editTask.description,
        content: editTask.content || '',
        brand_id: editTask.brand_id || '',
        brand_name: editTask.brand_name,
        required_tags: editTask.required_tags.length > 0 ? editTask.required_tags : [''],
        required_location: editTask.required_location,
        content_requirements: editTask.content_requirements.length > 0 ? editTask.content_requirements : [''],
        participation_conditions: editTask.participation_conditions.length > 0 ? editTask.participation_conditions : [''],
        start_date: formatDateTimeLocal(editTask.start_date),
        end_date: formatDateTimeLocal(editTask.end_date),
        total_budget: editTask.total_budget.toString(),
        min_reward: editTask.min_reward?.toString() || '50',
        max_reward: editTask.max_reward?.toString() || '1000',
        max_participants: editTask.max_participants.toString(),
        max_works_per_user: editTask.max_works_per_user.toString(),
        require_approval: editTask.require_approval,
        auto_approval_threshold: editTask.auto_approval_threshold?.toString() || '',
      });
    } else if (userBrands.length > 0) {
      setFormData(prev => ({
        ...prev,
        brand_id: userBrands[0].id,
        brand_name: userBrands[0].brand_name,
      }));
    }
  }, [editTask, userBrands]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入任务标题');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('请输入任务简介');
      return;
    }
    if (!formData.brand_name) {
      toast.error('请选择品牌');
      return;
    }
    if (!formData.start_date) {
      toast.error('请选择开始时间');
      return;
    }
    if (!formData.end_date) {
      toast.error('请选择结束时间');
      return;
    }
    if (!formData.total_budget || parseFloat(formData.total_budget) <= 0) {
      toast.error('请输入有效的总预算');
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content?.trim(),
        brand_id: formData.brand_id || undefined,
        brand_name: formData.brand_name,
        required_tags: formData.required_tags.filter(Boolean),
        required_location: formData.required_location,
        content_requirements: formData.content_requirements.filter(Boolean),
        participation_conditions: formData.participation_conditions.filter(Boolean),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        total_budget: parseFloat(formData.total_budget),
        min_reward: parseFloat(formData.min_reward) || 50,
        max_reward: parseFloat(formData.max_reward) || 1000,
        incentive_model: incentivePresets[selectedPreset].model,
        max_participants: parseInt(formData.max_participants) || 100,
        max_works_per_user: parseInt(formData.max_works_per_user) || 5,
        require_approval: formData.require_approval,
        auto_approval_threshold: formData.auto_approval_threshold ? parseInt(formData.auto_approval_threshold) : undefined,
      };

      if (editTask) {
        await brandTaskService.updateTask(editTask.id, taskData);
        toast.success('任务更新成功');
      } else {
        await brandTaskService.createTask(taskData);
        toast.success('任务创建成功');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('创建任务错误:', error);
      toast.error(editTask ? '更新任务失败' : '创建任务失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => setFormData(prev => ({ ...prev, required_tags: [...prev.required_tags, ''] }));
  const removeTag = (index: number) => setFormData(prev => ({ ...prev, required_tags: prev.required_tags.filter((_, i) => i !== index) }));
  const updateTag = (index: number, value: string) => {
    const newTags = [...formData.required_tags];
    newTags[index] = value;
    setFormData(prev => ({ ...prev, required_tags: newTags }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl`}
      >
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {editTask ? '编辑任务' : '创建品牌任务'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 步骤指示器 */}
          <div className="flex items-center gap-4 mb-8">
            {['基本信息', '任务要求', '激励设置', '确认发布'].map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step > index + 1
                      ? 'bg-emerald-500 text-white'
                      : step === index + 1
                      ? 'bg-blue-500 text-white'
                      : isDark
                      ? 'bg-gray-800 text-gray-500'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step > index + 1 ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>
                <span className={`text-sm ${step === index + 1 ? (isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {label}
                </span>
                {index < 3 && <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />}
              </div>
            ))}
          </div>

          {/* 步骤内容 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  任务标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：海河品牌推广任务"
                  className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  任务简介 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="简要描述任务内容和目标"
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    选择品牌 <span className="text-red-500">*</span>
                  </label>
                  {userBrands.length === 0 ? (
                    <div className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'border-amber-700/50 bg-amber-900/20 text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-700'} text-sm`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">暂无可用的品牌</span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600/80'} ml-6`}>
                        需要品牌状态为"审核通过"或"洽谈中"才能创建任务
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formData.brand_id}
                      onChange={e => {
                        const brand = userBrands.find(b => b.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          brand_id: e.target.value,
                          brand_name: brand?.brand_name || '',
                        }));
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="" disabled>请选择品牌</option>
                      {userBrands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.brand_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    发布位置
                  </label>
                  <input
                    type="text"
                    value={formData.required_location}
                    onChange={e => setFormData(prev => ({ ...prev, required_location: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    开始时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    结束时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  必须包含标签
                </label>
                <div className="space-y-2">
                  {formData.required_tags.map((tag, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={e => updateTag(index, e.target.value)}
                        placeholder="例如：海河"
                        className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                      {formData.required_tags.length > 1 && (
                        <button
                          onClick={() => removeTag(index)}
                          className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTag}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed ${isDark ? 'border-gray-700 text-gray-500 hover:border-gray-600' : 'border-gray-300 text-gray-600 hover:border-gray-400'} transition-colors`}
                  >
                    <Plus className="w-4 h-4" />
                    添加标签
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    最大参与人数
                  </label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={e => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    每人最多作品数
                  </label>
                  <input
                    type="number"
                    value={formData.max_works_per_user}
                    onChange={e => setFormData(prev => ({ ...prev, max_works_per_user: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  任务总预算 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={formData.total_budget}
                    onChange={e => setFormData(prev => ({ ...prev, total_budget: e.target.value }))}
                    placeholder="10000"
                    className={`w-full pl-8 pr-4 py-2.5 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    最低奖励
                  </label>
                  <input
                    type="number"
                    value={formData.min_reward}
                    onChange={e => setFormData(prev => ({ ...prev, min_reward: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    最高奖励
                  </label>
                  <input
                    type="number"
                    value={formData.max_reward}
                    onChange={e => setFormData(prev => ({ ...prev, max_reward: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  激励计算模型
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {incentivePresets.map((preset, index) => (
                    <button
                      key={preset.name}
                      onClick={() => setSelectedPreset(index)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedPreset === index
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : isDark
                          ? 'border-gray-700 hover:border-gray-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`font-medium mb-1 ${selectedPreset === index ? 'text-blue-600 dark:text-blue-400' : isDark ? 'text-white' : 'text-gray-900'}`}>
                        {preset.name}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>任务信息预览</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>任务标题</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>品牌</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{formData.brand_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>总预算</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">¥{parseFloat(formData.total_budget || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>奖励范围</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>¥{formData.min_reward} - ¥{formData.max_reward}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>参与名额</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{formData.max_participants} 人</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>激励模式</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{incentivePresets[selectedPreset].name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`sticky bottom-0 flex items-center justify-between p-6 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            上一步
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              取消
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editTask ? '保存修改' : '创建任务'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// 主组件
// ============================================================================

export default function BrandTaskManager() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<BrandTask[]>([]);
  const [userBrands, setUserBrands] = useState<BrandPartnership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<BrandTask | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<BrandTask | null>(null);

  // 加载任务列表
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { tasks: data } = await brandTaskService.getMyTasks({});
      setTasks(data);
      if (data.length > 0 && !selectedTask) {
        setSelectedTask(data[0]);
      }
    } catch (error) {
      toast.error('加载任务列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载用户的品牌
  const loadUserBrands = useCallback(async () => {
    try {
      const userInfo = user ? { id: user.id, email: user.email } : undefined;
      const brands = await brandPartnershipService.getMyPartnerships(userInfo);
      const allowedStatuses = ['approved', 'negotiating'];
      const approvedBrands = brands.filter(b => allowedStatuses.includes(b.status));
      setUserBrands(approvedBrands);
    } catch (error) {
      console.error('加载品牌列表失败:', error);
    }
  }, [user]);

  useEffect(() => {
    loadTasks();
    loadUserBrands();
  }, [loadTasks, loadUserBrands]);

  // 计算各状态任务数量
  const taskCounts = {
    all: tasks.length,
    draft: tasks.filter(t => t.status === 'draft').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    published: tasks.filter(t => t.status === 'published').length,
    paused: tasks.filter(t => t.status === 'paused').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
  };

  // 计算预算统计
  const totalBudget = tasks.reduce((sum, t) => sum + t.total_budget, 0);
  const totalSpent = tasks.reduce((sum, t) => sum + (t.total_budget - (t.remaining_budget || 0)), 0);

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = activeFilter === 'all' || task.status === activeFilter;
    const matchesSearch = (task.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (task.brand_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // 操作处理
  const handleDelete = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    const success = await brandTaskService.deleteTask(taskId);
    if (success) {
      toast.success('任务已删除');
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
      loadTasks();
    } else {
      toast.error('删除失败');
    }
  };

  const handlePause = async (taskId: string) => {
    const success = await brandTaskService.pauseTask(taskId);
    if (success) {
      toast.success('任务已暂停');
      loadTasks();
    } else {
      toast.error('操作失败');
    }
  };

  const handleResume = async (taskId: string) => {
    const success = await brandTaskService.publishTask(taskId);
    if (success) {
      toast.success('任务已恢复');
      loadTasks();
    } else {
      toast.error('操作失败');
    }
  };

  const handleComplete = async (taskId: string) => {
    if (!confirm('确定要完成这个任务吗？完成后将无法继续接收作品。')) return;
    const success = await brandTaskService.completeTask(taskId);
    if (success) {
      toast.success('任务已完成');
      loadTasks();
    } else {
      toast.error('操作失败');
    }
  };

  const handleEdit = (task: BrandTask) => {
    setEditTask(task);
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    loadTasks();
    setEditTask(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* 顶部标题栏 */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-4">
          <div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>品牌任务管理</h1>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>创建和管理品牌推广任务</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/organizer-center?tab=funds"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            资金管理
          </Link>
          <button
            onClick={() => {
              if (userBrands.length === 0) {
                toast.error(
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">暂无可用的品牌</span>
                    <span className="text-xs opacity-80">需要品牌状态为"审核通过"或"洽谈中"才能创建任务</span>
                  </div>,
                  { duration: 5000 }
                );
                return;
              }
              setEditTask(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            创建任务
          </button>
        </div>
      </div>

      {/* 三栏式主体内容 */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* 左侧栏 - 导航 */}
        <Sidebar 
          activeFilter={activeFilter} 
          setActiveFilter={setActiveFilter}
          taskCounts={taskCounts}
          isDark={isDark}
          totalBudget={totalBudget}
          totalSpent={totalSpent}
        />

        {/* 中间栏 - 任务列表 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 搜索栏 */}
          <div className={`flex items-center gap-4 mb-4 p-2 rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-white'}`}>
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索任务标题或品牌..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-0 ${isDark ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <FilterX className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={loadTasks}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* 任务列表 */}
          <div className={`flex-1 overflow-y-auto rounded-2xl border ${isDark ? 'border-gray-800 bg-gray-900/30' : 'border-gray-200 bg-white'} p-4`}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <Layers className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
                <h3 className={`text-base font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {searchQuery ? '没有找到匹配的任务' : '还没有创建任务'}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {searchQuery ? '请尝试其他搜索条件' : '创建您的第一个品牌任务，开始激励创作者'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    创建任务
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isSelected={selectedTask?.id === task.id}
                      onClick={() => setSelectedTask(task)}
                      isDark={isDark}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* 右侧栏 - 任务详情 */}
        <TaskDetailPanel
          task={selectedTask}
          isDark={isDark}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPause={handlePause}
          onResume={handleResume}
          onComplete={handleComplete}
          onRefresh={loadTasks}
        />
      </div>

      {/* 创建/编辑任务模态框 */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditTask(null);
        }}
        onSuccess={handleCreateSuccess}
        editTask={editTask}
        userBrands={userBrands}
      />
    </div>
  );
}
