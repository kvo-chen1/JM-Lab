import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useCreatorCenter } from '@/hooks/useCreatorCenter';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import * as orderAuditService from '@/services/orderAuditService';
import * as orderExecutionService from '@/services/orderExecutionService';
import type { OrderAudit } from '@/services/orderAuditService';
import {
  Briefcase,
  Search,
  Users,
  Building2,
  CheckCircle2,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
  Target,
  Award,
  Zap,
  Crown,
  Gem,
  Send,
  BookOpen,
  RefreshCw,
  ChevronRight,
  MapPin,
  Clock3,
} from 'lucide-react';

// ============================================================================
// 类型定义
// ============================================================================

type TaskFilter = 'all' | 'available' | 'applied' | 'review';
type TaskType = 'design' | 'illustration' | 'video' | 'writing' | 'photography' | 'other';

interface Task {
  id: string;
  title: string;
  brandName: string;
  brandLogo?: string;
  type: TaskType;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  requirements: string[];
  status: 'open' | 'closed' | 'completed';
  applied: boolean;
  location?: string;
  duration?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  applicants: number;
  maxApplicants: number;
}

interface TaskStats {
  totalOrders: number;
  availableOrders: number;
  appliedOrders: number;
  completedOrders: number;
  totalEarnings: number;
}

// ============================================================================
// 辅助函数：将审核数据转换为任务数据
// ============================================================================

const convertOrderToTask = (order: OrderAudit): Task => ({
  id: order.id,
  title: order.title,
  brandName: order.brand_name,
  type: order.type as TaskType,
  budgetMin: order.budget_min,
  budgetMax: order.budget_max,
  deadline: order.deadline,
  requirements: order.requirements,
  status: 'open',
  applied: false,
  location: order.location,
  duration: order.duration,
  difficulty: order.difficulty as 'easy' | 'medium' | 'hard',
  applicants: 0,
  maxApplicants: order.max_applicants,
});

const taskTypeConfig: Record<TaskType, { label: string; color: string; bgColor: string }> = {
  design: { label: '设计创作', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  illustration: { label: '插画创作', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  video: { label: '视频创作', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  writing: { label: '文案创作', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  photography: { label: '摄影创作', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  other: { label: '其他', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
};

const difficultyConfig = {
  easy: { label: '简单', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  medium: { label: '中等', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  hard: { label: '困难', color: 'text-red-500', bgColor: 'bg-red-500/10' },
};

// ============================================================================
// 主组件
// ============================================================================

const OrderSquarePage: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { stats: creatorStats } = useCreatorCenter();
  const followersCount = creatorStats?.followersCount || 0;
  
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const MIN_FOLLOWERS_FOR_TASKS = 0; // 测试：不需要粉丝限制
  const hasEnoughFollowers = true; // 测试：直接允许接单



  // 加载审核通过的商单
  const loadApprovedOrders = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // 获取所有审核通过的商单
      const approvedOrders = await orderAuditService.getApprovedOrders();
      
      // 获取用户已经接过的商单
      const myExecutions = await orderExecutionService.getCreatorOrderExecutions(user.id);
      const appliedOrderIds = new Set(myExecutions.map(e => e.order_id));
      
      // 转换并标记已申请的商单
      const convertedTasks = approvedOrders.map(order => ({
        ...convertOrderToTask(order),
        applied: appliedOrderIds.has(order.id),
      }));
      
      setTasks(convertedTasks);
    } catch (error) {
      console.error('加载商单数据失败:', error);
      toast.error('加载商单数据失败');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 初始加载
  useEffect(() => {
    loadApprovedOrders();
  }, [loadApprovedOrders]);

  // 实时更新监听
  useEffect(() => {
    const unsubscribe = orderAuditService.subscribeToOrderAudits((payload) => {
      console.log('商单数据更新:', payload);
      loadApprovedOrders();
    });

    return () => {
      unsubscribe();
    };
  }, [loadApprovedOrders]);

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.brandName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || task.type === selectedType;
    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'available' && !task.applied && task.status === 'open') ||
                         (activeFilter === 'applied' && task.applied) ||
                         (activeFilter === 'review' && task.type === 'review');
    return matchesSearch && matchesType && matchesFilter;
  });

  // 统计数据
  const taskStats: TaskStats = {
    totalOrders: tasks.length,
    availableOrders: tasks.filter(t => !t.applied && t.status === 'open').length,
    appliedOrders: tasks.filter(t => t.applied).length,
    completedOrders: tasks.filter(t => t.status === 'completed').length,
    totalEarnings: tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.budgetMax, 0),
  };

  // 处理申请任务
  const handleApplyTask = async (taskId: string) => {
    if (!hasEnoughFollowers) {
      toast.error('粉丝数不足，需要至少100粉丝才能接单');
      return;
    }

    if (!user?.id) {
      toast.error('请先登录');
      return;
    }

    // 找到对应的任务
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      toast.error('任务不存在');
      return;
    }

    // 检查是否已经申请过
    if (task.applied) {
      toast.error('您已经申请过这个任务了');
      return;
    }

    try {
      // 创建商单执行记录（接单）
      const executionId = await orderExecutionService.createOrderExecution({
        order_id: taskId,
        user_id: user.id,
        order_title: task.title,
        brand_name: task.brandName,
        product_name: task.title,
        product_url: '', // 后续由创作者添加
        commission_rate: 10, // 默认佣金比例
      });

      if (executionId) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, applied: true } : t));
        toast.success('接单成功，请在商单中心查看');
      } else {
        toast.error('接单失败，请重试');
      }
    } catch (error) {
      console.error('接单失败:', error);
      toast.error('接单失败，请重试');
    }
  };

  // 格式化金额
  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `¥${(amount / 1000).toFixed(1)}K`;
    }
    return `¥${amount}`;
  };

  // 计算剩余天数
  const getDaysLeft = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen pb-8">
      {/* 顶部横幅 */}
      <StatsBanner stats={taskStats} isDark={isDark} hasEnoughFollowers={hasEnoughFollowers} followersCount={followersCount} minFollowers={MIN_FOLLOWERS_FOR_TASKS} />
      
      {/* 三栏式主布局 */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* 左侧栏 - 筛选和统计 */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <FilterPanel 
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            stats={taskStats}
            isDark={isDark}
          />
          
          <TypeFilter 
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            isDark={isDark}
          />
          
          <QuickActions isDark={isDark} />
        </div>

        {/* 中间栏 - 任务列表 */}
        <div className="col-span-12 lg:col-span-6">
          <TaskListPanel
            tasks={filteredTasks}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isDark={isDark}
            onTaskClick={setSelectedTask}
            onApplyTask={handleApplyTask}
            formatCurrency={formatCurrency}
            getDaysLeft={getDaysLeft}
            hasEnoughFollowers={hasEnoughFollowers}
          />
        </div>

        {/* 右侧栏 - 详情和推荐 */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <TaskDetailPanel 
            task={selectedTask}
            isDark={isDark}
            formatCurrency={formatCurrency}
            getDaysLeft={getDaysLeft}
            onApply={handleApplyTask}
            hasEnoughFollowers={hasEnoughFollowers}
          />
          
          <HotTasks 
            tasks={tasks.slice(0, 3)}
            isDark={isDark}
            onTaskClick={setSelectedTask}
            formatCurrency={formatCurrency}
          />
          
          <CreatorTips isDark={isDark} />
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
  hasEnoughFollowers: boolean;
  followersCount: number;
  minFollowers: number;
}> = ({ stats, isDark, hasEnoughFollowers, followersCount, minFollowers }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl p-6 ${
        isDark 
          ? 'bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-violet-900/80' 
          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600'
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
            <h1 className="text-2xl font-bold text-white mb-1">商单广场</h1>
            <p className="text-white/70 text-sm">海量商单等你来接，发挥才华获取收益</p>
          </div>
          <div className={`px-4 py-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/20'} backdrop-blur-sm`}>
            <span className="text-white/80 text-sm">可接单</span>
            <p className="text-2xl font-bold text-white">{stats.availableOrders}</p>
          </div>
        </div>

        {!hasEnoughFollowers && (
          <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-amber-500/20' : 'bg-amber-400/30'} backdrop-blur-sm`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/30' : 'bg-amber-500/40'}`}>
                <Users className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">粉丝数不足，暂时无法接单</p>
                <p className="text-white/70 text-sm">需要至少 {minFollowers} 粉丝，当前 {followersCount} 粉丝</p>
                <div className="mt-2 h-2 rounded-full bg-white/20">
                  <div 
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.min((followersCount / minFollowers) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCardSmall icon={Briefcase} label="总订单" value={`${stats.totalOrders}`} isDark={isDark} />
          <StatCardSmall icon={Target} label="可接单" value={`${stats.availableOrders}`} isDark={isDark} />
          <StatCardSmall icon={CheckCircle2} label="已申请" value={`${stats.appliedOrders}`} isDark={isDark} />
          <StatCardSmall icon={Wallet} label="累计收益" value={formatCurrency(stats.totalEarnings)} isDark={isDark} />
        </div>
      </div>
    </motion.div>
  );
};

const StatCardSmall: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  isDark: boolean;
}> = ({ icon: Icon, label, value, isDark }) => (
  <div className={`p-4 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/20'} backdrop-blur-sm`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-white/70" />
      <span className="text-white/70 text-sm">{label}</span>
    </div>
    <p className="text-xl font-bold text-white">{value}</p>
  </div>
);

const formatCurrency = (amount: number) => {
  if (amount >= 1000) {
    return `¥${(amount / 1000).toFixed(1)}K`;
  }
  return `¥${amount}`;
};

// ============================================================================
// 子组件 - 筛选面板
// ============================================================================

const FilterPanel: React.FC<{
  activeFilter: TaskFilter;
  setActiveFilter: (filter: TaskFilter) => void;
  stats: TaskStats;
  isDark: boolean;
}> = ({ activeFilter, setActiveFilter, stats, isDark }) => {
  const filters = [
    { id: 'all' as TaskFilter, label: '全部任务', count: stats.totalOrders },
    { id: 'available' as TaskFilter, label: '可接单', count: stats.availableOrders },
    { id: 'applied' as TaskFilter, label: '已申请', count: stats.appliedOrders },
    { id: 'review' as TaskFilter, label: '好物测评', count: 0 },
  ];

  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
        任务筛选
      </h3>
      <nav className="space-y-2">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          
          return (
            <motion.button
              key={filter.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFilter(filter.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                  : isDark
                  ? 'text-gray-400 hover:bg-gray-700/50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{filter.label}</span>
              {filter.count > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {filter.count}
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
// 子组件 - 类型筛选
// ============================================================================

const TypeFilter: React.FC<{
  selectedType: string;
  setSelectedType: (type: string) => void;
  isDark: boolean;
}> = ({ selectedType, setSelectedType, isDark }) => {
  const types = [
    { id: 'all', label: '全部', icon: Sparkles },
    { id: 'design', label: '设计', icon: Target },
    { id: 'illustration', label: '插画', icon: Star },
    { id: 'video', label: '视频', icon: Zap },
    { id: 'writing', label: '文案', icon: Crown },
    { id: 'photography', label: '摄影', icon: Gem },
  ];

  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
        任务类型
      </h3>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedType(type.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                isSelected
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : isDark
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {type.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 子组件 - 快捷操作
// ============================================================================

const QuickActions: React.FC<{
  isDark: boolean;
}> = ({ isDark }) => {
  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
        快捷操作
      </h3>
      <div className="space-y-3">
        <Link to="/creator-center/submit">
          <motion.div
            whileHover={{ x: 4 }}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Send className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>发布作品</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>展示你的才华</p>
            </div>
          </motion.div>
        </Link>
        
        <motion.div
          whileHover={{ x: 4 }}
          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
            isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
            <BookOpen className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>学习课程</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>提升创作技能</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// 子组件 - 任务列表面板
// ============================================================================

const TaskListPanel: React.FC<{
  tasks: Task[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDark: boolean;
  onTaskClick: (task: Task) => void;
  onApplyTask: (taskId: string) => void;
  formatCurrency: (amount: number) => string;
  getDaysLeft: (deadline: string) => number;
  hasEnoughFollowers: boolean;
}> = ({ tasks, loading, searchQuery, setSearchQuery, isDark, onTaskClick, onApplyTask, formatCurrency, getDaysLeft, hasEnoughFollowers }) => {
  return (
    <div className={`rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden`}>
      {/* 头部 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            任务列表
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
                ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } focus:outline-none`}
          />
        </div>
      </div>

      {/* 任务列表 */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState isDark={isDark} />
        ) : (
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                isDark={isDark}
                onClick={() => onTaskClick(task)}
                onApply={() => onApplyTask(task.id)}
                formatCurrency={formatCurrency}
                getDaysLeft={getDaysLeft}
                hasEnoughFollowers={hasEnoughFollowers}
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
  task: Task;
  isDark: boolean;
  onClick: () => void;
  onApply: () => void;
  formatCurrency: (amount: number) => string;
  getDaysLeft: (deadline: string) => number;
  hasEnoughFollowers: boolean;
  index: number;
}> = ({ task, isDark, onClick, onApply, formatCurrency, getDaysLeft, hasEnoughFollowers, index }) => {
  const typeConfig = taskTypeConfig[task.type];
  const difficultyCfg = difficultyConfig[task.difficulty];
  const daysLeft = getDaysLeft(task.deadline);
  const isEndingSoon = daysLeft <= 3 && daysLeft > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
        isDark 
          ? 'bg-gray-900/50 border-gray-700 hover:border-blue-500/50 hover:bg-gray-800' 
          : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-white hover:shadow-lg'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* 品牌Logo */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${
          isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
        }`}>
          <Building2 className={`w-7 h-7 ${isDark ? 'text-gray-400' : 'text-blue-600'}`} />
        </div>

        {/* 任务信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${typeConfig.bgColor} ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${difficultyCfg.bgColor} ${difficultyCfg.color}`}>
                {difficultyCfg.label}
              </span>
              {task.applied && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-violet-500/10 text-violet-500">
                  已申请
                </span>
              )}
            </div>
          </div>

          <h3 className={`font-bold text-lg mt-2 mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            品牌方: {task.brandName}
          </p>

          {/* 任务标签 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {task.requirements.slice(0, 3).map((req, i) => (
              <span
                key={i}
                className={`text-xs px-2.5 py-1 rounded-lg ${
                  isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {req}
              </span>
            ))}
          </div>

          {/* 任务数据 */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{task.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock3 className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{task.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                {task.applicants}/{task.maxApplicants} 人
              </span>
            </div>
          </div>
        </div>

        {/* 右侧操作 */}
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-emerald-500">
            {formatCurrency(task.budgetMin)}-{formatCurrency(task.budgetMax)}
          </p>
          <p className={`text-sm mt-1 ${isEndingSoon ? 'text-amber-500 font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {daysLeft > 0 ? `剩余 ${daysLeft} 天` : '已截止'}
          </p>
          
          {!task.applied && task.status === 'open' && daysLeft > 0 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              disabled={!hasEnoughFollowers}
              className={`mt-3 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                hasEnoughFollowers
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              立即接单
            </motion.button>
          ) : task.applied ? (
            <span className="mt-3 inline-block px-4 py-2 text-sm font-medium text-violet-500">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              已申请
            </span>
          ) : null}
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
}> = ({ isDark }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
        isDark ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <Briefcase className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
      <h3 className={`text-lg font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        暂无匹配的任务
      </h3>
      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        试试其他筛选条件或搜索关键词
      </p>
    </div>
  );
};

// ============================================================================
// 子组件 - 任务详情面板
// ============================================================================

const TaskDetailPanel: React.FC<{
  task: Task | null;
  isDark: boolean;
  formatCurrency: (amount: number) => string;
  getDaysLeft: (deadline: string) => number;
  onApply: (taskId: string) => void;
  hasEnoughFollowers: boolean;
}> = ({ task, isDark, formatCurrency, getDaysLeft, onApply, hasEnoughFollowers }) => {
  if (!task) {
    return (
      <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Briefcase className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            点击左侧任务查看详情
          </p>
        </div>
      </div>
    );
  }

  const typeConfig = taskTypeConfig[task.type];
  const difficultyCfg = difficultyConfig[task.difficulty];
  const daysLeft = getDaysLeft(task.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}
    >
      {/* 头部 */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Building2 className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </div>
          <div>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{task.brandName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${typeConfig.bgColor} ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${difficultyCfg.bgColor} ${difficultyCfg.color}`}>
            {difficultyCfg.label}
          </span>
        </div>
      </div>

      {/* 详情内容 */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>预算范围</p>
            <p className={`font-bold text-emerald-500`}>
              {formatCurrency(task.budgetMin)} - {formatCurrency(task.budgetMax)}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>剩余时间</p>
            <p className={`font-bold ${daysLeft <= 3 ? 'text-amber-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
              {daysLeft > 0 ? `${daysLeft} 天` : '已截止'}
            </p>
          </div>
        </div>

        <div>
          <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>任务要求</h4>
          <div className="flex flex-wrap gap-2">
            {task.requirements.map((req, i) => (
              <span 
                key={i}
                className={`px-2 py-1 rounded-lg text-xs ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {req}
              </span>
            ))}
          </div>
        </div>

        <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>报名进度</span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {task.applicants}/{task.maxApplicants}
            </span>
          </div>
          <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
              style={{ width: `${(task.applicants / task.maxApplicants) * 100}%` }}
            />
          </div>
        </div>

        {!task.applied && task.status === 'open' && daysLeft > 0 ? (
          <button
            onClick={() => onApply(task.id)}
            disabled={!hasEnoughFollowers}
            className={`w-full py-3 rounded-xl font-medium transition-all ${
              hasEnoughFollowers
                ? isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {hasEnoughFollowers ? '立即接单' : '粉丝数不足'}
          </button>
        ) : task.applied ? (
          <div className={`w-full py-3 rounded-xl text-center font-medium text-violet-500 ${isDark ? 'bg-violet-500/20' : 'bg-violet-50'}`}>
            <CheckCircle2 className="w-5 h-5 inline mr-2" />
            已申请，等待审核
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

// ============================================================================
// 子组件 - 热门任务
// ============================================================================

const HotTasks: React.FC<{
  tasks: Task[];
  isDark: boolean;
  onTaskClick: (task: Task) => void;
  formatCurrency: (amount: number) => string;
}> = ({ tasks, isDark, onTaskClick, formatCurrency }) => {
  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
          热门推荐
        </h3>
        <TrendingUp className="w-4 h-4 text-amber-500" />
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
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <Building2 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {task.title}
                </h4>
                <p className={`text-xs text-emerald-500`}>
                  最高 {formatCurrency(task.budgetMax)}
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
// 子组件 - 创作者提示
// ============================================================================

const CreatorTips: React.FC<{
  isDark: boolean;
}> = ({ isDark }) => {
  const tips = [
    { icon: Star, text: '完善个人资料，提高接单成功率', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { icon: Award, text: '保持作品质量，获得更多好评', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { icon: Zap, text: '及时响应客户需求，建立良好口碑', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  ];

  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
        接单技巧
      </h3>
      <div className="space-y-3">
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tip.bgColor}`}>
                <Icon className={`w-4 h-4 ${tip.color}`} />
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {tip.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderSquarePage;
