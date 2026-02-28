import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { brandTaskService, BrandTask, BrandTaskParticipant, BrandTaskSubmission } from '@/services/brandTaskService';
import { useCreatorCenter } from '@/hooks/useCreatorCenter';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Search,
  Filter,
  Clock,
  DollarSign,
  Users,
  FileText,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  Heart,
  Wallet,
  History,
  Award,
  BarChart3,
  Calendar,
  TrendingDown,
  PieChart,
  Activity,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Briefcase,
  Zap,
  Crown,
  Gem,
  Star,
  ArrowUpRight,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';

// ============================================================================
// 类型定义
// ============================================================================

type TaskTab = 'available' | 'my-tasks' | 'earnings';

interface TaskStats {
  totalEarnings: number;
  pendingEarnings: number;
  withdrawnEarnings: number;
  activeTasks: number;
  completedTasks: number;
  totalSubmissions: number;
}

// ============================================================================
// 状态配置
// ============================================================================

const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  pending: { label: '审核中', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  published: { label: '进行中', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  paused: { label: '已暂停', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  completed: { label: '已完成', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const participationStatusConfig = {
  applied: { label: '已申请', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
  approved: { label: '已通过', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  active: { label: '进行中', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Activity },
  completed: { label: '已完成', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: XCircle },
};

// ============================================================================
// 主组件
// ============================================================================

const BrandTaskPage: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { revenue } = useCreatorCenter();
  
  // 状态管理
  const [activeTab, setActiveTab] = useState<TaskTab>('available');
  const [tasks, setTasks] = useState<BrandTask[]>([]);
  const [myParticipations, setMyParticipations] = useState<BrandTaskParticipant[]>([]);
  const [mySubmissions, setMySubmissions] = useState<BrandTaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<BrandTask | null>(null);

  // 计算统计数据
  const stats: TaskStats = {
    totalEarnings: revenue?.totalRevenue || 0,
    pendingEarnings: revenue?.pendingRevenue || 0,
    withdrawnEarnings: revenue?.totalWithdrawn || 0,
    activeTasks: myParticipations.filter(p => p.status === 'active' || p.status === 'approved').length,
    completedTasks: myParticipations.filter(p => p.status === 'completed').length,
    totalSubmissions: mySubmissions.length,
  };

  // 获取数据
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 并行获取所有数据
      const [publishedTasksResult, participations] = await Promise.all([
        brandTaskService.getPublishedTasks(),
        brandTaskService.getMyParticipations(),
      ]);

      // 获取我的提交记录（不传参数获取所有提交）
      const submissions = await brandTaskService.getMySubmissions();

      setTasks(publishedTasksResult.tasks || []);
      setMyParticipations(participations);
      setMySubmissions(submissions);
    } catch (error) {
      console.error('获取数据失败:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.brand_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 获取我参与的任务（从参与记录中提取任务信息）
  const myTasks = myParticipations
    .map(p => p.task)
    .filter((task): task is BrandTask => !!task);

  // 格式化金额
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen pb-8">
      {/* 顶部统计横幅 */}
      <StatsBanner stats={stats} isDark={isDark} formatCurrency={formatCurrency} />
      
      {/* 三栏式主布局 */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* 左侧栏 - 导航和筛选 */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <NavigationPanel 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            stats={stats}
            isDark={isDark}
          />
          
          <CategoryFilter 
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            isDark={isDark}
          />
          
          <QuickStatsPanel stats={stats} isDark={isDark} formatCurrency={formatCurrency} />
        </div>

        {/* 中间栏 - 任务列表 */}
        <div className="col-span-12 lg:col-span-6">
          <TaskListPanel
            activeTab={activeTab}
            tasks={activeTab === 'available' ? filteredTasks : myTasks}
            participations={myParticipations}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isDark={isDark}
            onTaskClick={setSelectedTask}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* 右侧栏 - 详情和推荐 */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <TaskDetailPanel 
            task={selectedTask}
            isDark={isDark}
            formatCurrency={formatCurrency}
          />
          
          <RecommendedTasks 
            tasks={tasks.slice(0, 3)}
            isDark={isDark}
            onTaskClick={setSelectedTask}
            formatCurrency={formatCurrency}
          />
          
          <EarningsPreview stats={stats} isDark={isDark} formatCurrency={formatCurrency} />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 子组件 - 统计横幅
// ============================================================================

const StatsBanner: React.FC<{
  stats: TaskStats;
  isDark: boolean;
  formatCurrency: (amount: number) => string;
}> = ({ stats, isDark, formatCurrency }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl p-6 ${
        isDark 
          ? 'bg-gradient-to-r from-violet-900/80 via-purple-900/80 to-fuchsia-900/80' 
          : 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600'
      }`}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">品牌任务中心</h1>
            <p className="text-white/70 text-sm">参与优质品牌任务，创作内容获取收益</p>
          </div>
          <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/20'} backdrop-blur-sm`}>
            <span className="text-white/80 text-sm">本月收益</span>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalEarnings)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCardSmall
            icon={Wallet}
            label="累计收益"
            value={formatCurrency(stats.totalEarnings)}
            trend="+12.5%"
            isDark={isDark}
          />
          <StatCardSmall
            icon={Clock}
            label="待结算"
            value={formatCurrency(stats.pendingEarnings)}
            isDark={isDark}
          />
          <StatCardSmall
            icon={Target}
            label="参与任务"
            value={`${stats.activeTasks} 个`}
            subtitle="进行中"
            isDark={isDark}
          />
          <StatCardSmall
            icon={FileText}
            label="提交作品"
            value={`${stats.totalSubmissions} 个`}
            subtitle="累计"
            isDark={isDark}
          />
        </div>
      </div>
    </motion.div>
  );
};

const StatCardSmall: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  trend?: string;
  isDark: boolean;
}> = ({ icon: Icon, label, value, subtitle, trend, isDark }) => (
  <div className={`p-4 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/20'} backdrop-blur-sm`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-white/70" />
      <span className="text-white/70 text-sm">{label}</span>
    </div>
    <p className="text-xl font-bold text-white">{value}</p>
    {(subtitle || trend) && (
      <p className={`text-xs mt-1 ${trend ? 'text-emerald-300' : 'text-white/50'}`}>
        {trend || subtitle}
      </p>
    )}
  </div>
);

// ============================================================================
// 子组件 - 导航面板
// ============================================================================

const NavigationPanel: React.FC<{
  activeTab: TaskTab;
  setActiveTab: (tab: TaskTab) => void;
  stats: TaskStats;
  isDark: boolean;
}> = ({ activeTab, setActiveTab, stats, isDark }) => {
  const tabs = [
    { id: 'available' as TaskTab, label: '可参与任务', icon: Target, count: null },
    { id: 'my-tasks' as TaskTab, label: '我的任务', icon: Briefcase, count: stats.activeTasks },
    { id: 'earnings' as TaskTab, label: '收益明细', icon: Wallet, count: null },
  ];

  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
        任务导航
      </h3>
      <nav className="space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? isDark
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                    : 'bg-violet-50 text-violet-600 border border-violet-200'
                  : isDark
                  ? 'text-gray-400 hover:bg-gray-700/50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </div>
              {tab.count !== null && tab.count > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  isActive 
                    ? 'bg-violet-500 text-white' 
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
};

// ============================================================================
// 子组件 - 分类筛选
// ============================================================================

const CategoryFilter: React.FC<{
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  isDark: boolean;
}> = ({ selectedCategory, setSelectedCategory, isDark }) => {
  const categories = [
    { id: 'all', label: '全部', icon: Sparkles },
    { id: 'food', label: '美食', icon: Target },
    { id: 'fashion', label: '时尚', icon: Star },
    { id: 'tech', label: '科技', icon: Zap },
    { id: 'travel', label: '旅游', icon: Crown },
    { id: 'lifestyle', label: '生活', icon: Gem },
  ];

  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
        任务分类
      </h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          
          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                isSelected
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : isDark
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 子组件 - 快速统计面板
// ============================================================================

const QuickStatsPanel: React.FC<{
  stats: TaskStats;
  isDark: boolean;
  formatCurrency: (amount: number) => string;
}> = ({ stats, isDark, formatCurrency }) => {
  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
        任务概览
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已完成任务</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.completedTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>审核中</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.totalSubmissions - stats.completedTasks}
              </p>
            </div>
          </div>
        </div>

        <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>成功率</span>
            <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {stats.totalSubmissions > 0 
                ? Math.round((stats.completedTasks / stats.totalSubmissions) * 100) 
                : 0}%
            </span>
          </div>
          <div className={`mt-2 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ 
                width: `${stats.totalSubmissions > 0 
                  ? (stats.completedTasks / stats.totalSubmissions) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 子组件 - 任务列表面板
// ============================================================================

const TaskListPanel: React.FC<{
  activeTab: TaskTab;
  tasks: BrandTask[];
  participations: BrandTaskParticipant[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDark: boolean;
  onTaskClick: (task: BrandTask) => void;
  formatCurrency: (amount: number) => string;
}> = ({ activeTab, tasks, participations, loading, searchQuery, setSearchQuery, isDark, onTaskClick, formatCurrency }) => {
  return (
    <div className={`rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden`}>
      {/* 头部 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {activeTab === 'available' ? '可参与任务' : activeTab === 'my-tasks' ? '我的任务' : '收益明细'}
          </h2>
          <button 
            onClick={() => window.location.reload()}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {/* 搜索栏 */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="搜索任务标题或品牌..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all ${
              isDark 
                ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-violet-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
            } focus:outline-none`}
          />
        </div>
      </div>

      {/* 任务列表 */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState isDark={isDark} activeTab={activeTab} />
        ) : (
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                participation={participations.find(p => p.task_id === task.id)}
                isDark={isDark}
                onClick={() => onTaskClick(task)}
                formatCurrency={formatCurrency}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 子组件 - 任务卡片
// ============================================================================

const TaskCard: React.FC<{
  task: BrandTask;
  participation?: BrandTaskParticipant;
  isDark: boolean;
  onClick: () => void;
  formatCurrency: (amount: number) => string;
  index: number;
}> = ({ task, participation, isDark, onClick, formatCurrency, index }) => {
  const status = statusConfig[task.status];
  const daysLeft = Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft < 0;
  const isEndingSoon = daysLeft >= 0 && daysLeft <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
        isDark 
          ? 'bg-gray-900/50 border-gray-700 hover:border-violet-500/50 hover:bg-gray-800' 
          : 'bg-gray-50 border-gray-200 hover:border-violet-300 hover:bg-white hover:shadow-lg'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* 品牌Logo */}
        {task.brand_logo ? (
          <img 
            src={task.brand_logo} 
            alt={task.brand_name}
            className="w-14 h-14 rounded-xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-md flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl
            bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md flex-shrink-0">
            {task.brand_name.charAt(0)}
          </div>
        )}

        {/* 任务信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {task.title}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{task.brand_name}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${status.color}`}>
              {status.label}
            </span>
          </div>

          <p className={`text-sm mt-2 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {task.description}
          </p>

          {/* 任务数据 */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <DollarSign className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                {formatCurrency(task.min_reward)} - {formatCurrency(task.max_reward)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {task.current_participants}/{task.max_participants} 人参与
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className={`w-4 h-4 ${isEndingSoon ? 'text-amber-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={`text-sm ${isEndingSoon ? 'text-amber-500 font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isExpired ? '已结束' : isEndingSoon ? `${daysLeft}天后截止` : `${daysLeft}天剩余`}
              </span>
            </div>
          </div>

          {/* 参与状态 */}
          {participation && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${participationStatusConfig[participation.status as keyof typeof participationStatusConfig]?.color}`}>
                  {participationStatusConfig[participation.status as keyof typeof participationStatusConfig]?.label || participation.status}
                </span>
                {participation.earned_reward > 0 && (
                  <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    已获得 {formatCurrency(participation.earned_reward)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 子组件 - 空状态
// ============================================================================

const EmptyState: React.FC<{
  isDark: boolean;
  activeTab: TaskTab;
}> = ({ isDark, activeTab }) => {
  const messages = {
    available: { title: '暂无可参与的任务', desc: '请稍后再来查看新任务' },
    'my-tasks': { title: '还没有参与任务', desc: '去可参与任务列表看看吧' },
    earnings: { title: '暂无收益记录', desc: '参与任务后即可获得收益' },
  };
  const message = messages[activeTab];

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
        isDark ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <Target className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
      <h3 className={`text-lg font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {message.title}
      </h3>
      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        {message.desc}
      </p>
    </div>
  );
};

// ============================================================================
// 子组件 - 任务详情面板
// ============================================================================

const TaskDetailPanel: React.FC<{
  task: BrandTask | null;
  isDark: boolean;
  formatCurrency: (amount: number) => string;
}> = ({ task, isDark, formatCurrency }) => {
  if (!task) {
    return (
      <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Eye className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            点击左侧任务查看详情
          </p>
        </div>
      </div>
    );
  }

  const status = statusConfig[task.status];
  const daysLeft = Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}
    >
      {/* 头部 */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-3">
          {task.brand_logo ? (
            <img src={task.brand_logo} alt={task.brand_name} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold">
              {task.brand_name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{task.brand_name}</p>
          </div>
        </div>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* 详情内容 */}
      <div className="p-5 space-y-4">
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>任务描述</h4>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>奖励范围</p>
            <p className={`font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
              {formatCurrency(task.min_reward)} - {formatCurrency(task.max_reward)}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>剩余时间</p>
            <p className={`font-bold ${daysLeft <= 3 ? 'text-amber-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
              {daysLeft > 0 ? `${daysLeft} 天` : '已结束'}
            </p>
          </div>
        </div>

        <div>
          <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>要求标签</h4>
          <div className="flex flex-wrap gap-2">
            {task.required_tags?.map((tag) => (
              <span 
                key={tag}
                className={`px-2 py-1 rounded-lg text-xs ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <button
          className={`w-full py-3 rounded-xl font-medium transition-all ${
            isDark 
              ? 'bg-violet-600 hover:bg-violet-700 text-white' 
              : 'bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/30'
          }`}
        >
          立即参与
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 子组件 - 推荐任务
// ============================================================================

const RecommendedTasks: React.FC<{
  tasks: BrandTask[];
  isDark: boolean;
  onTaskClick: (task: BrandTask) => void;
  formatCurrency: (amount: number) => string;
}> = ({ tasks, isDark, onTaskClick, formatCurrency }) => {
  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
          热门推荐
        </h3>
        <Sparkles className="w-4 h-4 text-amber-500" />
      </div>
      
      <div className="space-y-3">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 4 }}
            onClick={() => onTaskClick(task)}
            className={`p-3 rounded-xl cursor-pointer transition-all ${
              isDark 
                ? 'bg-gray-700/50 hover:bg-gray-700' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {task.brand_logo ? (
                <img src={task.brand_logo} alt={task.brand_name} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
                  {task.brand_name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {task.title}
                </h4>
                <p className={`text-xs ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                  最高 {formatCurrency(task.max_reward)}
                </p>
              </div>
              <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 子组件 - 收益预览
// ============================================================================

const EarningsPreview: React.FC<{
  stats: TaskStats;
  isDark: boolean;
  formatCurrency: (amount: number) => string;
}> = ({ stats, isDark, formatCurrency }) => {
  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
        收益概览
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>累计收益</span>
          </div>
          <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {formatCurrency(stats.totalEarnings)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>待结算</span>
          </div>
          <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            {formatCurrency(stats.pendingEarnings)}
          </span>
        </div>

        <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
            isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}>
            查看明细
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandTaskPage;
