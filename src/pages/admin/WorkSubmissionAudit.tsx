// IP孵化项目作品提交与审核管理后台页面
// 功能：IP资产审核、列表展示、审核状态标记、审核操作

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Star,
  Grid,
  List,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  Loader2,
  Layers,
  Palette,
  Box,
  Image as ImageIcon,
  Gem
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  getIPAssetAuditStatistics,
  getIPAssets,
  reviewIPAsset,
  batchReviewIPAssets,
  deleteIPAsset,
  type IPAsset,
  type IPAssetType,
  type IPAssetStatus,
  type IPAssetAuditStatistics
} from '@/services/ipAssetAuditService';

// ==================== 工具函数 ====================
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== 组件 ====================

// 状态徽章组件
const StatusBadge = ({ status, isDark }: { status: IPAssetStatus; isDark: boolean }) => {
  const config: Record<string, { label: string; className: string }> = {
    active: {
      label: '已通过',
      className: isDark
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        : 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    pending_review: {
      label: '待审核',
      className: isDark
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-amber-50 text-amber-600 border-amber-200'
    },
    rejected: {
      label: '已驳回',
      className: isDark
        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
        : 'bg-rose-50 text-rose-600 border-rose-200'
    },
    archived: {
      label: '已归档',
      className: isDark
        ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        : 'bg-gray-50 text-gray-600 border-gray-200'
    },
    deleted: {
      label: '已删除',
      className: isDark
        ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        : 'bg-gray-50 text-gray-600 border-gray-200'
    }
  };

  const { label, className } = config[status] || config.pending_review;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      className
    )}>
      {status === 'active' ? <CheckCircle className="w-3.5 h-3.5" /> :
       status === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> :
       <Clock className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
};

// IP类型标签
const IPTypeLabel = ({ type, isDark }: { type: IPAssetType; isDark: boolean }) => {
  const labels: Record<IPAssetType, { label: string; icon: React.ElementType }> = {
    illustration: { label: '插画', icon: ImageIcon },
    pattern: { label: '图案', icon: Palette },
    design: { label: '设计', icon: Layers },
    '3d_model': { label: '3D模型', icon: Box },
    digital_collectible: { label: '数字藏品', icon: Gem }
  };

  const { label, icon: Icon } = labels[type] || { label: '其他', icon: Layers };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
      isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
    )}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// 日期格式化
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

// 统计卡片组件
const StatCard = ({
  title,
  value,
  trend,
  trendValue,
  icon: Icon,
  color,
  isDark,
  loading = false
}: {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ElementType;
  color: string;
  isDark: boolean;
  loading?: boolean;
}) => {
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: {
      bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
      text: isDark ? 'text-blue-400' : 'text-blue-600',
      icon: isDark ? 'text-blue-400' : 'text-blue-500'
    },
    emerald: {
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      text: isDark ? 'text-emerald-400' : 'text-emerald-600',
      icon: isDark ? 'text-emerald-400' : 'text-emerald-500'
    },
    amber: {
      bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      text: isDark ? 'text-amber-400' : 'text-amber-600',
      icon: isDark ? 'text-amber-400' : 'text-amber-500'
    },
    purple: {
      bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
      text: isDark ? 'text-purple-400' : 'text-purple-600',
      icon: isDark ? 'text-purple-400' : 'text-purple-500'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-3 rounded-xl', colors.bg)}>
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
        {trend && trendValue && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            trend === 'up' ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600') :
            trend === 'down' ? (isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600') :
            (isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-50 text-gray-600')
          )}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
             trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
          {title}
        </p>
        <h3 className={cn('text-2xl font-bold mt-1', isDark ? 'text-white' : 'text-gray-900')}>
          {loading ? (
            <span className={cn('inline-block w-16 h-8 rounded animate-pulse', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
          ) : (
            value
          )}
        </h3>
      </div>
    </motion.div>
  );
};

// ==================== 主页面组件 ====================

export default function WorkSubmissionAudit() {
  const { isDark } = useTheme();
  const [assets, setAssets] = useState<IPAsset[]>([]);
  const [statistics, setStatistics] = useState<IPAssetAuditStatistics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    todaySubmitted: 0,
    todayReviewed: 0,
    avgReviewTime: 0,
    approvalRate: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // 筛选和搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<IPAssetStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<IPAssetType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 选中项状态
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // 详情弹窗状态
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<IPAsset | null>(null);

  // 审核弹窗状态
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    type: 'warning'
  });

  // 加载统计数据
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await getIPAssetAuditStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  }, []);

  // 加载IP资产列表
  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getIPAssets({
        status: statusFilter,
        type: typeFilter,
        searchQuery,
        sortBy,
        sortOrder,
        page: currentPage,
        limit: itemsPerPage
      });
      setAssets(result.data);
      setTotalCount(result.total);
    } catch (err) {
      console.error('加载IP资产列表失败:', err);
      setError('加载数据失败，请稍后重试');
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery, sortBy, sortOrder, currentPage]);

  // 初始加载
  useEffect(() => {
    loadStatistics();
    loadAssets();
  }, [loadStatistics, loadAssets]);

  // 分页数据
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // 处理全选
  const handleSelectAll = () => {
    if (selectedAssets.size === assets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(assets.map(a => a.id)));
    }
  };

  // 处理单个选择
  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedAssets);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAssets(newSet);
  };

  // 处理审核
  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedAsset) return;

    setIsLoading(true);

    try {
      const result = await reviewIPAsset(
        selectedAsset.id,
        action,
        reviewNotes,
        'current-admin-id'
      );

      if (result.success) {
        setAssets(prev => prev.map(a => {
          if (a.id === selectedAsset.id) {
            return {
              ...a,
              status: action === 'approve' ? 'active' : 'rejected'
            };
          }
          return a;
        }));

        await loadStatistics();

        toast.success(action === 'approve' ? 'IP资产已通过审核' : 'IP资产已驳回');
        setReviewModalOpen(false);
        setDetailModalOpen(false);
        setReviewNotes('');
        setSelectedAsset(null);
      } else {
        toast.error(result.error || '审核失败');
      }
    } catch (err) {
      console.error('审核失败:', err);
      toast.error('审核失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 批量审核
  const handleBatchReview = (action: 'approve' | 'reject') => {
    const count = selectedAssets.size;
    if (count === 0) {
      toast.error('请先选择要审核的IP资产');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: action === 'approve' ? '批量通过确认' : '批量驳回确认',
      description: `确定要${action === 'approve' ? '通过' : '驳回'}选中的 ${count} 个IP资产吗？`,
      type: action === 'approve' ? 'info' : 'warning',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const assetIds = Array.from(selectedAssets);
          const result = await batchReviewIPAssets(assetIds, action);

          if (result.success) {
            setAssets(prev => prev.map(a => {
              if (selectedAssets.has(a.id)) {
                return { ...a, status: action === 'approve' ? 'active' : 'rejected' };
              }
              return a;
            }));

            await loadStatistics();

            toast.success(`已成功${action === 'approve' ? '通过' : '驳回'} ${result.processed} 个IP资产`);
            setSelectedAssets(new Set());
          } else {
            toast.error(result.error || '批量审核失败');
          }
        } catch (err) {
          console.error('批量审核失败:', err);
          toast.error('批量审核失败，请稍后重试');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          setIsLoading(false);
        }
      }
    });
  };

  // 删除IP资产
  const handleDelete = (asset: IPAsset) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除确认',
      description: `确定要删除IP资产"${asset.name}"吗？此操作不可恢复。`,
      type: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const result = await deleteIPAsset(asset.id);

          if (result.success) {
            setAssets(prev => prev.filter(a => a.id !== asset.id));
            await loadStatistics();
            toast.success('IP资产已删除');
            setDetailModalOpen(false);
          } else {
            toast.error(result.error || '删除失败');
          }
        } catch (err) {
          console.error('删除失败:', err);
          toast.error('删除失败，请稍后重试');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          setIsLoading(false);
        }
      }
    });
  };

  // 刷新数据
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadStatistics(), loadAssets()]);
      toast.success('数据已刷新');
    } catch (err) {
      console.error('刷新失败:', err);
      toast.error('刷新失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('min-h-screen p-6', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            'p-2 rounded-xl',
            isDark ? 'bg-amber-500/20' : 'bg-amber-50'
          )}>
            <Lightbulb className={cn('w-6 h-6', isDark ? 'text-amber-400' : 'text-amber-600')} />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              IP孵化作品审核
            </h1>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
              管理IP孵化项目的IP资产审核流程
            </p>
          </div>
        </div>
      </motion.div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="待审核IP"
          value={statistics.pending}
          trend={statistics.pending > 0 ? 'up' : 'neutral'}
          trendValue={statistics.pending > 0 ? '待处理' : '无'}
          icon={Clock}
          color="amber"
          isDark={isDark}
          loading={isLoading}
        />
        <StatCard
          title="已通过IP"
          value={statistics.approved}
          trend={statistics.approved > 0 ? 'up' : 'neutral'}
          trendValue={statistics.approved > 0 ? '累计' : '无'}
          icon={CheckCircle}
          color="emerald"
          isDark={isDark}
          loading={isLoading}
        />
        <StatCard
          title="今日提交"
          value={statistics.todaySubmitted}
          trend={statistics.todaySubmitted > 0 ? 'up' : 'neutral'}
          trendValue={statistics.todaySubmitted > 0 ? '新增' : '暂无'}
          icon={Star}
          color="blue"
          isDark={isDark}
          loading={isLoading}
        />
        <StatCard
          title="审核通过率"
          value={`${statistics.approvalRate}%`}
          trend={statistics.approvalRate > 80 ? 'up' : statistics.approvalRate < 50 ? 'down' : 'neutral'}
          trendValue={statistics.approvalRate > 80 ? '优秀' : statistics.approvalRate < 50 ? '偏低' : '正常'}
          icon={BarChart3}
          color="purple"
          isDark={isDark}
          loading={isLoading}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-xl p-4 mb-6 flex items-center gap-3',
            isDark ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'bg-rose-50 border border-rose-200 text-rose-600'
          )}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={loadAssets}
            className={cn(
              'text-sm font-medium underline hover:no-underline',
              isDark ? 'text-rose-400' : 'text-rose-600'
            )}
          >
            重试
          </button>
        </motion.div>
      )}

      {/* 筛选和工具栏 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'rounded-2xl p-4 mb-6',
          isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
        )}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 搜索 */}
          <div className="flex-1 relative">
            <Search className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
              isDark ? 'text-gray-500' : 'text-gray-400'
            )} />
            <input
              type="text"
              placeholder="搜索IP资产名称、描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
                isDark
                  ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>

          {/* 筛选器 */}
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as IPAssetStatus | 'all')}
              className={cn(
                'px-3 py-2.5 rounded-xl text-sm transition-all',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
                isDark
                  ? 'bg-gray-700/50 border border-gray-600 text-white'
                  : 'bg-gray-50 border border-gray-200 text-gray-700'
              )}
            >
              <option value="all">全部状态</option>
              <option value="pending_review">待审核</option>
              <option value="active">已通过</option>
              <option value="rejected">已驳回</option>
              <option value="archived">已归档</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as IPAssetType | 'all')}
              className={cn(
                'px-3 py-2.5 rounded-xl text-sm transition-all',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
                isDark
                  ? 'bg-gray-700/50 border border-gray-600 text-white'
                  : 'bg-gray-50 border border-gray-200 text-gray-700'
              )}
            >
              <option value="all">全部类型</option>
              <option value="illustration">插画</option>
              <option value="pattern">图案</option>
              <option value="design">设计</option>
              <option value="3d_model">3D模型</option>
              <option value="digital_collectible">数字藏品</option>
            </select>

            {/* 排序 */}
            <button
              onClick={() => {
                if (sortBy === 'date') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy('date');
                  setSortOrder('desc');
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm transition-all',
                isDark
                  ? 'bg-gray-700/50 border border-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
              时间
              {sortBy === 'date' && (
                sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
              )}
            </button>

            {/* 视图切换 */}
            <div className={cn(
              'flex rounded-xl overflow-hidden border',
              isDark ? 'border-gray-600' : 'border-gray-200'
            )}>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2.5 transition-all',
                  viewMode === 'list'
                    ? (isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white')
                    : (isDark ? 'bg-gray-700/50 text-gray-400 hover:text-white' : 'bg-gray-50 text-gray-600 hover:text-gray-900')
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2.5 transition-all',
                  viewMode === 'grid'
                    ? (isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white')
                    : (isDark ? 'bg-gray-700/50 text-gray-400 hover:text-white' : 'bg-gray-50 text-gray-600 hover:text-gray-900')
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* 刷新按钮 */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={cn(
                'p-2.5 rounded-xl transition-all',
                isDark
                  ? 'bg-gray-700/50 border border-gray-600 text-gray-400 hover:text-white'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900'
              )}
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* 批量操作栏 */}
        {selectedAssets.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              'flex items-center justify-between mt-4 pt-4 border-t',
              isDark ? 'border-gray-700' : 'border-gray-200'
            )}
          >
            <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              已选择 <strong className={isDark ? 'text-white' : 'text-gray-900'}>{selectedAssets.size}</strong> 个IP资产
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAssets(new Set())}
              >
                取消选择
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleBatchReview('approve')}
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                批量通过
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
                onClick={() => handleBatchReview('reject')}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                批量驳回
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* IP资产列表 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {viewMode === 'list' ? (
          // 列表视图
          <div className={cn(
            'rounded-2xl overflow-hidden',
            isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
          )}>
            {/* 表头 */}
            <div className={cn(
              'grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium border-b',
              isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
            )}>
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={assets.length > 0 && assets.every(a => selectedAssets.has(a.id))}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-4">IP资产信息</div>
              <div className="col-span-2">创作者</div>
              <div className="col-span-2">状态</div>
              <div className="col-span-2">创建时间</div>
              <div className="col-span-1 text-right">操作</div>
            </div>

            {/* 表体 */}
            <AnimatePresence mode="popLayout">
              {assets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'grid grid-cols-12 gap-4 px-6 py-4 items-center group transition-colors',
                    isDark
                      ? 'hover:bg-gray-700/30 border-b border-gray-700/50'
                      : 'hover:bg-gray-50 border-b border-gray-100'
                  )}
                >
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedAssets.has(asset.id)}
                      onChange={() => handleSelectOne(asset.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-16 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          'font-medium truncate',
                          isDark ? 'text-white' : 'text-gray-900'
                        )}>
                          {asset.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <IPTypeLabel type={asset.type} isDark={isDark} />
                          {asset.commercialValue > 0 && (
                            <span className={cn('text-xs', isDark ? 'text-amber-400' : 'text-amber-600')}>
                              ¥{asset.commercialValue.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={asset.creator.avatar}
                        alt={asset.creator.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                          {asset.creator.name}
                        </p>
                        <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                          {asset.creator.level}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={asset.status} isDark={isDark} />
                  </div>
                  <div className="col-span-2">
                    <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {formatDate(asset.createdAt)}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {asset.status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setReviewAction('approve');
                              setReviewModalOpen(true);
                            }}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              isDark ? 'hover:bg-emerald-500/20 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-600'
                            )}
                            title="通过"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setReviewAction('reject');
                              setReviewModalOpen(true);
                            }}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              isDark ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-50 text-rose-600'
                            )}
                            title="驳回"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedAsset(asset);
                          setDetailModalOpen(true);
                        }}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                        )}
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 空状态 */}
            {assets.length === 0 && (
              <div className="py-16 text-center">
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
                  isDark ? 'bg-gray-700/50' : 'bg-gray-100'
                )}>
                  <Layers className={cn('w-10 h-10', isDark ? 'text-gray-600' : 'text-gray-400')} />
                </div>
                <h3 className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                  暂无IP资产
                </h3>
                <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  没有找到符合条件的IP资产
                </p>
              </div>
            )}
          </div>
        ) : (
          // 网格视图
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {assets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300',
                    isDark
                      ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                      : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
                  )}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setDetailModalOpen(true);
                  }}
                >
                  <div className="relative">
                    <img
                      src={asset.thumbnail}
                      alt={asset.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={asset.status} isDark={true} />
                    </div>
                    <div className="absolute bottom-3 left-3 right-16">
                      <h4 className="text-white font-medium truncate">{asset.name}</h4>
                      <p className="text-white/70 text-sm">{asset.creator.name}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <IPTypeLabel type={asset.type} isDark={isDark} />
                      <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        {formatDate(asset.createdAt)}
                      </span>
                    </div>
                    <p className={cn('text-sm line-clamp-2 mb-3', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {asset.description}
                    </p>
                    {asset.commercialValue > 0 && (
                      <div className={cn(
                        'text-lg font-bold',
                        isDark ? 'text-amber-400' : 'text-amber-600'
                      )}>
                        ¥{asset.commercialValue.toLocaleString()}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              共 {totalCount} 个IP资产
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : isDark
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-600'
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-600'
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* 详情弹窗 */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAsset(null);
        }}
        title="IP资产详情"
        size="xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2">
              {selectedAsset && (
                <button
                  onClick={() => handleDelete(selectedAsset)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors',
                    isDark
                      ? 'text-rose-400 hover:bg-rose-500/20'
                      : 'text-rose-600 hover:bg-rose-50'
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDetailModalOpen(false)}>
                关闭
              </Button>
              {selectedAsset?.status === 'pending_review' && (
                <>
                  <Button
                    className="bg-rose-600 hover:bg-rose-700"
                    onClick={() => {
                      setReviewAction('reject');
                      setReviewModalOpen(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    驳回
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setReviewAction('approve');
                      setReviewModalOpen(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    通过
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        {selectedAsset && (
          <div className="space-y-6">
            {/* IP资产预览 */}
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={selectedAsset.thumbnail}
                alt={selectedAsset.name}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 left-4">
                <StatusBadge status={selectedAsset.status} isDark={true} />
              </div>
            </div>

            {/* 基本信息 */}
            <div>
              <h2 className={cn('text-xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>
                {selectedAsset.name}
              </h2>
              <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>
                {selectedAsset.description}
              </p>
            </div>

            {/* 创作者信息 */}
            <div className={cn(
              'p-4 rounded-xl',
              isDark ? 'bg-gray-700/30' : 'bg-gray-50'
            )}>
              <h3 className={cn('text-sm font-medium mb-3', isDark ? 'text-gray-300' : 'text-gray-700')}>
                创作者信息
              </h3>
              <div className="flex items-center gap-3">
                <img
                  src={selectedAsset.creator.avatar}
                  alt={selectedAsset.creator.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                    {selectedAsset.creator.name}
                  </p>
                  <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    {selectedAsset.creator.level} · {selectedAsset.creator.email}
                  </p>
                </div>
              </div>
            </div>

            {/* IP资产属性 */}
            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                'p-4 rounded-xl',
                isDark ? 'bg-gray-700/30' : 'bg-gray-50'
              )}>
                <h3 className={cn('text-sm font-medium mb-3', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  IP类型
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>类型</span>
                    <IPTypeLabel type={selectedAsset.type} isDark={isDark} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>商业价值</span>
                    <span className={cn('text-sm font-medium', isDark ? 'text-amber-400' : 'text-amber-600')}>
                      ¥{selectedAsset.commercialValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className={cn(
                'p-4 rounded-xl',
                isDark ? 'bg-gray-700/30' : 'bg-gray-50'
              )}>
                <h3 className={cn('text-sm font-medium mb-3', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  孵化阶段
                </h3>
                <div className="space-y-2">
                  {selectedAsset.stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-center gap-2">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        stage.completed ? 'bg-emerald-500' : 'bg-gray-400'
                      )} />
                      <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                        {stage.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 审核弹窗 */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setReviewNotes('');
        }}
        title={reviewAction === 'approve' ? '通过审核' : '驳回IP资产'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => {
              setReviewModalOpen(false);
              setReviewNotes('');
            }}>
              取消
            </Button>
            <Button
              className={reviewAction === 'approve'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
              }
              onClick={() => handleReview(reviewAction!)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : reviewAction === 'approve' ? (
                <CheckCircle className="w-4 h-4 mr-1.5" />
              ) : (
                <XCircle className="w-4 h-4 mr-1.5" />
              )}
              {reviewAction === 'approve' ? '确认通过' : '确认驳回'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className={cn(
            'p-4 rounded-xl',
            isDark ? 'bg-gray-700/30' : 'bg-gray-50'
          )}>
            <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
              {reviewAction === 'approve'
                ? '您即将通过此IP资产的审核。通过后，该IP资产将在平台上展示。'
                : '您即将驳回此IP资产。请填写驳回原因，以便创作者了解并改进。'}
            </p>
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
              {reviewAction === 'approve' ? '审核备注（可选）' : '驳回原因'}
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={reviewAction === 'approve' ? '可选：填写审核备注...' : '请填写驳回原因...'}
              rows={4}
              className={cn(
                'w-full px-3 py-2 rounded-xl text-sm resize-none',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
                isDark
                  ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-500'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
              )}
            />
          </div>
        </div>
      </Modal>

      {/* 确认对话框 */}
      <Modal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        title={confirmDialog.title}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            >
              取消
            </Button>
            <Button
              className={confirmDialog.type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : confirmDialog.type === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }
              onClick={confirmDialog.onConfirm}
            >
              确认
            </Button>
          </div>
        }
      >
        <p className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
          {confirmDialog.description}
        </p>
      </Modal>
    </div>
  );
}
