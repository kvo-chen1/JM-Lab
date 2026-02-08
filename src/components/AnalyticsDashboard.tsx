import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import analyticsService, { 
  MetricType, 
  TimeRange, 
  GroupBy,
  AnalyticsQueryParams,
  WorkPerformance,
  UserActivity,
  ThemeTrend,
  ExportFormat
} from '@/services/analyticsService';

// 图表类型
type ChartType = 'line' | 'bar' | 'pie' | 'area';

// 颜色配置
const COLORS = {
  primary: '#ef4444',
  secondary: '#8b5cf6',
  tertiary: '#06b6d4',
  quaternary: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

const CHART_COLORS = ['#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

interface AnalyticsDashboardProps {
  userId?: string;
  initialMetric?: MetricType;
  initialTimeRange?: TimeRange;
}

// 状态指示器组件
const StatusIndicator = () => {
  const { isOnline, pendingActions, lastSyncTime } = useAnalyticsStore();
  const { isDark } = useTheme();
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      <motion.div 
        layout
        className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur-sm ${
          isOnline 
            ? 'bg-green-100/90 text-green-700 ring-1 ring-green-200' 
            : 'bg-red-100/90 text-red-700 ring-1 ring-red-200'
        }`}
      >
        <motion.span 
          animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
        />
        {isOnline ? '实时连接 (Online)' : '离线模式 (Offline)'}
      </motion.div>
      
      <AnimatePresence>
        {pendingActions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100/90 text-yellow-700 flex items-center gap-2 shadow-lg backdrop-blur-sm ring-1 ring-yellow-200"
          >
            <i className="fas fa-sync fa-spin"></i>
            {pendingActions.length} 个操作待同步
          </motion.div>
        )}
      </AnimatePresence>
      
      {lastSyncTime > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`px-3 py-1 rounded-full text-xs shadow-sm backdrop-blur-sm ${
            isDark ? 'bg-gray-800/80 text-gray-400 ring-1 ring-gray-700' : 'bg-white/80 text-gray-500 ring-1 ring-gray-200'
          }`}
        >
          上次更新: {new Date(lastSyncTime).toLocaleTimeString()}
        </motion.div>
      )}
    </motion.div>
  );
};

// 骨架屏组件
const SkeletonCard = () => {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-xl p-4 shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className={`h-4 w-20 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className={`h-8 w-24 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className={`h-3 w-16 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
        </div>
        <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
      </div>
    </div>
  );
};

// 图表骨架屏
const SkeletonChart = () => {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-xl overflow-hidden shadow-md p-5 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      <div className="mb-4 space-y-2">
        <div className={`h-6 w-32 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
        <div className={`h-4 w-48 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
      </div>
      <div className={`h-80 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} animate-pulse`}></div>
    </div>
  );
};

// 图表卡片组件
const ChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, children, description, action }) => {
  const { isDark } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`rounded-xl overflow-hidden shadow-md p-5 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="h-80">
        {children}
      </div>
    </motion.div>
  );
};

// 格式化数字，添加千分位分隔符
const formatNumber = (num: number | string): string => {
  const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsedNum)) return '0';
  return parsedNum.toLocaleString('zh-CN');
};

// 格式化百分比，保留1位小数
const formatPercent = (num: number): string => {
  if (isNaN(num)) return '0.0';
  return num.toFixed(1);
};

// 数据卡片组件
const DataCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
  isPercent?: boolean;
  showTrend?: boolean;
  warning?: boolean;
  isLoading?: boolean;
}> = ({ title, value, change, icon, color = COLORS.primary, isPercent = false, showTrend = true, warning = false, isLoading = false }) => {
  const { isDark } = useTheme();
  
  if (isLoading) {
    return <SkeletonCard />;
  }
  
  // 格式化显示值
  const displayValue = isPercent 
    ? `${formatPercent(typeof value === 'number' ? value : parseFloat(value as string))}%` 
    : formatNumber(value);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)' }}
      className={`rounded-xl p-4 shadow-md ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} flex items-center justify-between transition-shadow`}
    >
      <div>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <h4 className="text-2xl font-bold" style={{ color }}>{displayValue}</h4>
          {warning && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 p-1 rounded-full"
            >
              <i className="fas fa-exclamation-triangle text-sm"></i>
            </motion.div>
          )}
        </div>
        {change !== undefined && showTrend && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-xs mt-1 flex items-center ${change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500'}`}
          >
            <motion.span
              animate={change !== 0 ? { y: [0, -2, 0] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {change > 0 ? '↑' : change < 0 ? '↓' : '→'}
            </motion.span>
            <span className="ml-1">{formatPercent(Math.abs(change))}%</span>
          </motion.p>
        )}
      </div>
      <motion.div 
        whileHover={{ rotate: 10, scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="p-3 rounded-full" 
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </motion.div>
    </motion.div>
  );
};

// 详情弹窗组件
const DetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  item: WorkPerformance | UserActivity | ThemeTrend | null;
  type: 'work' | 'user' | 'theme';
}> = ({ isOpen, onClose, item, type }) => {
  const { isDark } = useTheme();
  
  if (!isOpen || !item) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative max-w-lg w-full rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <i className="fas fa-times"></i>
          </button>
          
          {type === 'work' && (
            <WorkDetailContent work={item as WorkPerformance} />
          )}
          {type === 'user' && (
            <UserDetailContent user={item as UserActivity} />
          )}
          {type === 'theme' && (
            <ThemeDetailContent theme={item as ThemeTrend} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// 作品详情内容
const WorkDetailContent: React.FC<{ work: WorkPerformance }> = ({ work }) => {
  const { isDark } = useTheme();
  return (
    <>
      <div className="flex items-start gap-4 mb-6">
        <img src={work.thumbnail} alt={work.title} className="w-24 h-24 object-cover rounded-xl shadow-md" />
        <div>
          <h3 className="text-xl font-bold mb-1">{work.title}</h3>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {work.category}
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              work.trend === 'up' ? 'bg-green-100 text-green-600' : 
              work.trend === 'down' ? 'bg-red-100 text-red-600' : 
              'bg-gray-100 text-gray-600'
            }`}>
              {work.trend === 'up' ? '↑ 上升' : work.trend === 'down' ? '↓ 下降' : '→ 稳定'}
            </span>
            <span className="text-xs font-bold text-gray-500">#{work.ranking}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <MetricItem icon="fa-heart" label="点赞数" value={work.metrics.likes} color={COLORS.danger} />
        <MetricItem icon="fa-eye" label="浏览量" value={work.metrics.views} color={COLORS.info} />
        <MetricItem icon="fa-comment" label="评论数" value={work.metrics.comments} color={COLORS.secondary} />
        <MetricItem icon="fa-share" label="分享数" value={work.metrics.shares} color={COLORS.success} />
      </div>
      
      <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">参与率</span>
          <span className="text-lg font-bold" style={{ color: COLORS.primary }}>{work.metrics.engagementRate}%</span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(work.metrics.engagementRate, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: COLORS.primary }}
          />
        </div>
      </div>
    </>
  );
};

// 用户详情内容
const UserDetailContent: React.FC<{ user: UserActivity }> = ({ user }) => {
  const { isDark } = useTheme();
  return (
    <>
      <div className="flex items-center gap-4 mb-6">
          <img src={user.avatar} alt={user.username} className="w-20 h-20 object-cover rounded-full shadow-md ring-2 ring-offset-2 ring-blue-500" />
        <div>
          <h3 className="text-xl font-bold mb-1">{user.username}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">#{user.ranking}</span>
          </div>
        </div>
      </div>
      
      <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">活跃度评分</span>
          <span className="text-2xl font-bold" style={{ color: COLORS.primary }}>{user.engagementScore}</span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${user.engagementScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: COLORS.primary }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <MetricItem icon="fa-image" label="作品数" value={user.metrics.worksCreated} color={COLORS.secondary} />
        <MetricItem icon="fa-heart" label="获赞数" value={user.metrics.likesReceived} color={COLORS.danger} />
        <MetricItem icon="fa-eye" label="浏览量" value={user.metrics.viewsReceived} color={COLORS.info} />
        <MetricItem icon="fa-comment" label="评论数" value={user.metrics.commentsReceived} color={COLORS.tertiary} />
      </div>
    </>
  );
};

// 主题详情内容
const ThemeDetailContent: React.FC<{ theme: ThemeTrend }> = ({ theme }) => {
  const { isDark } = useTheme();
  return (
    <>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1">{theme.theme}</h3>
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
          {theme.category}
        </span>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs px-2 py-1 rounded-full ${theme.growth > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {theme.growth > 0 ? '↑' : '↓'} {Math.abs(theme.growth)}%
          </span>
          <span className="text-xs font-bold text-gray-500">#{theme.ranking}</span>
        </div>
      </div>
      
      <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">流行度</span>
          <span className="text-2xl font-bold" style={{ color: COLORS.primary }}>{theme.popularity}</span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${theme.popularity}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: COLORS.primary }}
          />
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">相关标签</p>
        <div className="flex flex-wrap gap-2">
          {theme.relatedTags.map((tag, idx) => (
            <span key={idx} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <i className="fas fa-image text-gray-400"></i>
        <span className="text-gray-500">作品数量:</span>
        <span className="font-bold">{theme.worksCount}</span>
      </div>
    </>
  );
};

// 指标项组件
const MetricItem: React.FC<{ icon: string; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
      <i className={`fas ${icon}`} style={{ color }}></i>
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold">{formatNumber(value)}</p>
    </div>
  </div>
);

// 表现卡片组件
const PerformanceCard: React.FC<{
  item: WorkPerformance | UserActivity | ThemeTrend;
  type: 'work' | 'user' | 'theme';
  onViewDetails?: () => void;
}> = ({ item, type, onViewDetails }) => {
  const { isDark } = useTheme();
  let content;

  if (type === 'work') {
    const work = item as WorkPerformance;
    content = (
      <>
        <img 
          src={work.thumbnail} 
          alt={work.title} 
          className="w-16 h-16 object-cover rounded-lg shadow-sm"
        />
        <div className="flex-1 ml-4 min-w-0">
          <h4 className="font-semibold truncate">{work.title}</h4>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {work.category}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-heart text-red-400"></i> {formatNumber(work.metrics.likes)}
            </span>
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-eye text-blue-400"></i> {formatNumber(work.metrics.views)}
            </span>
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-comment text-purple-400"></i> {formatNumber(work.metrics.comments)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${work.trend === 'up' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : work.trend === 'down' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            {work.trend === 'up' ? '↑ 上升' : work.trend === 'down' ? '↓ 下降' : '→ 稳定'}
          </span>
          <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            #{work.ranking}
          </span>
        </div>
      </>
    );
  } else if (type === 'user') {
    const user = item as UserActivity;
    content = (
      <>
        <img 
          src={user.avatar} 
          alt={user.username} 
          className="w-16 h-16 object-cover rounded-full shadow-sm ring-2 ring-offset-1" 
          style={{ ringColor: COLORS.primary + '40' }}
        />
        <div className="flex-1 ml-4 min-w-0">
          <h4 className="font-semibold truncate">{user.username}</h4>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-image text-purple-400"></i> {formatNumber(user.metrics.worksCreated)}
            </span>
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-heart text-red-400"></i> {formatNumber(user.metrics.likesReceived)}
            </span>
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-eye text-blue-400"></i> {formatNumber(user.metrics.viewsReceived)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            活跃度: {user.engagementScore}
          </span>
          <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            #{user.ranking}
          </span>
        </div>
      </>
    );
  } else {
    const theme = item as ThemeTrend;
    content = (
      <>
        <div className="w-16 h-16 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: COLORS.primary + '15' }}>
          <i className="fas fa-palette text-2xl" style={{ color: COLORS.primary }}></i>
        </div>
        <div className="flex-1 ml-4 min-w-0">
          <h4 className="font-semibold truncate">{theme.theme}</h4>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {theme.category}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-fire text-orange-400"></i> {theme.popularity}
            </span>
            <span className={`text-xs flex items-center gap-1 ${theme.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {theme.growth > 0 ? '↑' : '↓'} {Math.abs(theme.growth)}%
            </span>
            <span className="text-xs flex items-center gap-1">
              <i className="fas fa-image text-purple-400"></i> {formatNumber(theme.worksCount)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            #{theme.ranking}
          </span>
        </div>
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`flex items-center p-3 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} cursor-pointer hover:shadow-lg transition-all duration-300`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onViewDetails}
    >
      {content}
    </motion.div>
  );
};

// 空状态组件
const EmptyState: React.FC<{ icon: string; title: string; description?: string }> = ({ icon, title, description }) => {
  const { isDark } = useTheme();
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full text-gray-400 py-12"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <i className={`fas ${icon} text-5xl mb-4 opacity-30`}></i>
      </motion.div>
      <p className="text-lg font-medium mb-1">{title}</p>
      {description && <p className="text-sm opacity-70">{description}</p>}
    </motion.div>
  );
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  initialMetric = 'views',
  initialTimeRange = '30d',
}) => {
  const { isDark } = useTheme();
  const [activeMetric, setActiveMetric] = useState<MetricType>(initialMetric);
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  
  // 详情弹窗状态
  const [selectedItem, setSelectedItem] = useState<WorkPerformance | UserActivity | ThemeTrend | null>(null);
  const [modalType, setModalType] = useState<'work' | 'user' | 'theme'>('work');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 使用 Zustand Store
  const { 
    dataPoints: metricsData, 
    stats: metricsStats, 
    isLoading, 
    fetchData, 
    subscribeToRealtime, 
    unsubscribeFromRealtime 
  } = useAnalyticsStore();

  // 初始化与数据获取
  useEffect(() => {
    const queryParams: AnalyticsQueryParams = {
      metric: activeMetric,
      timeRange: timeRange,
      groupBy: groupBy,
      filters: {
        userId: userId,
      },
    };

    fetchData(queryParams);
    subscribeToRealtime();

    return () => {
      unsubscribeFromRealtime();
    };
  }, [activeMetric, timeRange, groupBy, userId, fetchData, subscribeToRealtime, unsubscribeFromRealtime]);
  
  // 获取排行榜数据
  const topWorks = analyticsService.getWorksPerformance(5);
  const topUsers = analyticsService.getUserActivity(5);
  const topThemes = analyticsService.getThemeTrends(5);

  // 处理导出
  const handleExport = useCallback(async (format: ExportFormat) => {
    const queryParams: AnalyticsQueryParams = {
      metric: activeMetric,
      timeRange: timeRange,
      groupBy: groupBy,
      filters: { userId },
    };
    await analyticsService.downloadExport(queryParams, format);
  }, [activeMetric, timeRange, groupBy, userId]);

  // 打开详情弹窗
  const openModal = (item: WorkPerformance | UserActivity | ThemeTrend, type: 'work' | 'user' | 'theme') => {
    setSelectedItem(item);
    setModalType(type);
    setIsModalOpen(true);
  };

  // 渲染图表
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <i className="fas fa-circle-notch text-4xl text-gray-300"></i>
          </motion.div>
          <p className="mt-4 text-gray-400">正在加载数据...</p>
        </div>
      );
    }
    
    if (metricsData.length === 0) {
       return (
         <EmptyState 
           icon="fa-chart-area" 
           title="暂无分析数据" 
           description="请尝试调整筛选条件或稍后再试"
         />
       );
    }

    const chartData = metricsData.map((item, index) => ({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    if (chartType === 'pie') {
      const pieData = chartData.map((item) => ({
        name: item.label,
        value: item.value,
        color: item.color,
      }));

      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? '#f3f4f6' : '#111827',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="label" stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? '#f3f4f6' : '#111827',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name={activeMetric} 
              fill={COLORS.primary} 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="label" stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? '#f3f4f6' : '#111827',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              name={activeMetric}
              stroke={COLORS.primary} 
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="label" stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                color: isDark ? '#f3f4f6' : '#111827',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={activeMetric} 
              stroke={COLORS.primary} 
              strokeWidth={2}
              dot={{ r: 4, fill: COLORS.primary }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="space-y-6">
      <StatusIndicator />
      
      {/* 数据概览卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard 
          title="总浏览量" 
          value={metricsStats.total} 
          change={metricsStats.growth} 
          icon={<i className="fas fa-eye text-lg" style={{ color: COLORS.primary }}></i>}
          color={COLORS.primary}
          isLoading={isLoading}
        />
        <DataCard 
          title="平均数据" 
          value={Math.round(metricsStats.average)} 
          change={metricsStats.growth} 
          icon={<i className="fas fa-chart-line text-lg" style={{ color: COLORS.secondary }}></i>}
          color={COLORS.secondary}
          isLoading={isLoading}
        />
        <DataCard 
          title="增长率" 
          value={metricsStats.growth} 
          icon={<i className="fas fa-arrow-trend-up text-lg" style={{ color: COLORS.success }}></i>}
          color={metricsStats.growth > 0 ? COLORS.success : metricsStats.growth < 0 ? COLORS.danger : COLORS.info}
          isPercent={true}
          showTrend={false}
          isLoading={isLoading}
        />
        <DataCard 
          title="峰值" 
          value={metricsStats.peak} 
          change={metricsStats.growth} 
          icon={<i className="fas fa-mountain text-lg" style={{ color: COLORS.warning }}></i>}
          color={COLORS.warning}
          warning={metricsStats.peak > metricsStats.average * 3}
          isLoading={isLoading}
        />
      </div>

      {/* 图表控制栏 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`rounded-xl p-4 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} flex flex-wrap gap-4 items-start`}
      >
        <div>
          <h3 className="font-semibold mb-2 text-sm">数据指标</h3>
          <div className="flex flex-wrap gap-2">
            {(['works', 'likes', 'views', 'comments', 'shares', 'followers', 'participation'] as MetricType[]).map((metric) => (
              <motion.button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${activeMetric === metric 
                  ? 'bg-red-600 text-white shadow-md' 
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}`}
              >
                {metric === 'works' && '作品数'}
                {metric === 'likes' && '点赞数'}
                {metric === 'views' && '浏览量'}
                {metric === 'comments' && '评论数'}
                {metric === 'shares' && '分享数'}
                {metric === 'followers' && '关注数'}
                {metric === 'participation' && '参与度'}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-sm">时间范围</h3>
          <div className="flex flex-wrap gap-2">
            {(['7d', '30d', '90d', '1y', 'all'] as TimeRange[]).map((range) => (
              <motion.button
                key={range}
                onClick={() => setTimeRange(range)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${timeRange === range 
                  ? 'bg-red-600 text-white shadow-md' 
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}`}
              >
                {range === '7d' && '最近7天'}
                {range === '30d' && '最近30天'}
                {range === '90d' && '最近90天'}
                {range === '1y' && '最近1年'}
                {range === 'all' && '全部时间'}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-sm">图表类型</h3>
          <div className="flex gap-2">
            {(['line', 'bar', 'pie', 'area'] as ChartType[]).map((type) => (
              <motion.button
                key={type}
                onClick={() => setChartType(type)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-lg transition-all ${chartType === type 
                  ? 'bg-red-600 text-white shadow-md' 
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}`}
                title={type === 'line' ? '折线图' : type === 'bar' ? '柱状图' : type === 'pie' ? '饼图' : '面积图'}
              >
                {type === 'line' && <i className="fas fa-chart-line"></i>}
                {type === 'bar' && <i className="fas fa-chart-bar"></i>}
                {type === 'pie' && <i className="fas fa-chart-pie"></i>}
                {type === 'area' && <i className="fas fa-chart-area"></i>}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-sm">分组方式</h3>
          <div className="flex flex-wrap gap-2">
            {(['day', 'week', 'month', 'year', 'category', 'theme'] as GroupBy[]).map((group) => (
              <motion.button
                key={group}
                onClick={() => setGroupBy(group)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${groupBy === group 
                  ? 'bg-red-600 text-white shadow-md' 
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}`}
              >
                {group === 'day' && '按日'}
                {group === 'week' && '按周'}
                {group === 'month' && '按月'}
                {group === 'year' && '按年'}
                {group === 'category' && '按分类'}
                {group === 'theme' && '按主题'}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 主图表 */}
      <div id="guide-step-analytics-chart">
        {isLoading ? (
          <SkeletonChart />
        ) : (
          <ChartCard 
            title="数据分析图表" 
            description={`显示${activeMetric}数据，按${timeRange}时间范围，以${groupBy}分组`}
            action={
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExport('json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-download mr-1"></i> JSON
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExport('csv')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="fas fa-file-csv mr-1"></i> CSV
                </motion.button>
              </div>
            }
          >
            {renderChart()}
          </ChartCard>
        )}
      </div>

      {/* 排行榜区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 作品表现 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-fire text-orange-500"></i>
            热门作品表现
          </h3>
          <div className="space-y-3">
            {topWorks.length > 0 ? (
              topWorks.map((work) => (
                <PerformanceCard 
                  key={work.workId} 
                  item={work} 
                  type="work"
                  onViewDetails={() => openModal(work, 'work')}
                />
              ))
            ) : (
              <EmptyState icon="fa-image" title="暂无作品数据" />
            )}
          </div>
        </motion.div>

        {/* 热门创作者 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-users text-blue-500"></i>
            热门创作者
          </h3>
          <div className="space-y-3">
            {topUsers.length > 0 ? (
              topUsers.map((user) => (
                <PerformanceCard 
                  key={user.userId} 
                  item={user} 
                  type="user"
                  onViewDetails={() => openModal(user, 'user')}
                />
              ))
            ) : (
              <EmptyState icon="fa-user" title="暂无用户数据" />
            )}
          </div>
        </motion.div>

        {/* 热门主题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-hashtag text-purple-500"></i>
            热门主题趋势
          </h3>
          <div className="space-y-3">
            {topThemes.length > 0 ? (
              topThemes.map((theme) => (
                <PerformanceCard 
                  key={theme.theme} 
                  item={theme} 
                  type="theme"
                  onViewDetails={() => openModal(theme, 'theme')}
                />
              ))
            ) : (
              <EmptyState icon="fa-tags" title="暂无主题数据" />
            )}
          </div>
        </motion.div>
      </div>

      {/* 详情弹窗 */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        type={modalType}
      />
    </div>
  );
};

export default AnalyticsDashboard;
