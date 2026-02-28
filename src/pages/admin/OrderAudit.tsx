import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Building2,
  User,
  Tag,
  Paperclip,
  ChevronRight,
  RefreshCw,
  CheckSquare,
  Square,
  Download,
  Eye,
  AlertCircle,
  TrendingUp,
  BarChart3,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import * as orderAuditService from '@/services/orderAuditService';
import type { OrderAudit, AuditStats, AuditFilter } from '@/services/orderAuditService';

// ============================================================================
// 主组件
// ============================================================================

const OrderAuditPage: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderAudit[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderAudit | null>(null);
  const [stats, setStats] = useState<AuditStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState<AuditFilter>({ status: 'pending' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [auditOpinion, setAuditOpinion] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        orderAuditService.getOrderAudits(filter),
        orderAuditService.getAuditStats(),
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 实时更新监听
  useEffect(() => {
    const unsubscribe = orderAuditService.subscribeToOrderAudits((payload) => {
      console.log('商单审核数据更新:', payload);
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // 搜索处理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setFilter(prev => ({ ...prev, keyword: searchQuery.trim() }));
      } else {
        setFilter(prev => {
          const { keyword, ...rest } = prev;
          return rest;
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 审核商单
  const handleAudit = async (status: 'approved' | 'rejected') => {
    if (!selectedOrder) return;

    setIsAuditing(true);
    try {
      const success = await orderAuditService.auditOrder(
        selectedOrder.id,
        status,
        auditOpinion,
        user?.id || 'system'
      );

      if (success) {
        toast.success(status === 'approved' ? '审核通过' : '已驳回');
        setSelectedOrder(null);
        setAuditOpinion('');
        loadData();
      } else {
        toast.error('审核失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      toast.error('审核失败，请重试');
    } finally {
      setIsAuditing(false);
    }
  };

  // 批量审核
  const handleBatchAudit = async (status: 'approved' | 'rejected') => {
    if (selectedOrders.size === 0) {
      toast.error('请选择要审核的商单');
      return;
    }

    setIsAuditing(true);
    try {
      const success = await orderAuditService.batchAuditOrders(
        Array.from(selectedOrders),
        status,
        auditOpinion,
        user?.id || 'system'
      );

      if (success) {
        toast.success(`批量${status === 'approved' ? '通过' : '驳回'}成功`);
        setSelectedOrders(new Set());
        setAuditOpinion('');
        loadData();
      } else {
        toast.error('批量审核失败');
      }
    } catch (error) {
      console.error('批量审核失败:', error);
      toast.error('批量审核失败');
    } finally {
      setIsAuditing(false);
    }
  };

  // 切换选择
  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 顶部标题栏 */}
      <Header stats={stats} isDark={isDark} onRefresh={loadData} loading={loading} />

      {/* 三栏式主布局 */}
      <div className="grid grid-cols-12 gap-6 p-6">
        {/* 左侧栏 - 筛选与操作 */}
        <LeftSidebar
          filter={filter}
          setFilter={setFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
          isDark={isDark}
          selectedOrders={selectedOrders}
          onBatchAudit={handleBatchAudit}
          isAuditing={isAuditing}
        />

        {/* 中间栏 - 商单列表 */}
        <OrderList
          orders={orders}
          loading={loading}
          selectedOrder={selectedOrder}
          selectedOrders={selectedOrders}
          onSelectOrder={setSelectedOrder}
          onToggleSelect={toggleSelectOrder}
          onSelectAll={toggleSelectAll}
          isDark={isDark}
        />

        {/* 右侧栏 - 详情与审核 */}
        <RightPanel
          selectedOrder={selectedOrder}
          auditOpinion={auditOpinion}
          setAuditOpinion={setAuditOpinion}
          onAudit={handleAudit}
          isAuditing={isAuditing}
          isDark={isDark}
        />
      </div>
    </div>
  );
};

// ============================================================================
// 子组件 - 头部统计
// ============================================================================

const Header: React.FC<{
  stats: AuditStats;
  isDark: boolean;
  onRefresh: () => void;
  loading: boolean;
}> = ({ stats, isDark, onRefresh, loading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-violet-900/80' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600'} p-6`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">商单审核管理</h1>
            <p className="text-white/70 text-sm">审核用户提交的商单，确保内容质量与合规性</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`p-3 rounded-xl transition-all ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/20 hover:bg-white/30'} backdrop-blur-sm`}
          >
            <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={FileText} label="总商单数" value={stats.total} isDark={isDark} color="blue" />
          <StatCard icon={Clock} label="待审核" value={stats.pending} isDark={isDark} color="amber" />
          <StatCard icon={CheckCircle2} label="已通过" value={stats.approved} isDark={isDark} color="emerald" />
          <StatCard icon={XCircle} label="已驳回" value={stats.rejected} isDark={isDark} color="red" />
        </div>
      </div>
    </motion.div>
  );
};

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  isDark: boolean;
  color: 'blue' | 'amber' | 'emerald' | 'red';
}> = ({ icon: Icon, label, value, isDark, color }) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/20'} backdrop-blur-sm`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white/70 text-xs">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 子组件 - 左侧筛选栏
// ============================================================================

const LeftSidebar: React.FC<{
  filter: AuditFilter;
  setFilter: (filter: AuditFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  isDark: boolean;
  selectedOrders: Set<string>;
  onBatchAudit: (status: 'approved' | 'rejected') => void;
  isAuditing: boolean;
}> = ({
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  isDark,
  selectedOrders,
  onBatchAudit,
  isAuditing,
}) => {
  const statusFilters = [
    { id: 'pending', label: '待审核', count: 0, icon: Clock },
    { id: 'approved', label: '已通过', count: 0, icon: CheckCircle2 },
    { id: 'rejected', label: '已驳回', count: 0, icon: XCircle },
    { id: 'all', label: '全部', count: 0, icon: FileText },
  ];

  return (
    <div className="col-span-12 lg:col-span-3 space-y-4">
      {/* 搜索框 */}
      <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="搜索商单标题或品牌..."
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

      {/* 状态筛选 */}
      <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
          审核状态
        </h3>
        <nav className="space-y-2">
          {statusFilters.map((item) => {
            const Icon = item.icon;
            const isActive = filter.status === item.id || (item.id === 'all' && !filter.status);

            return (
              <button
                key={item.id}
                onClick={() => setFilter({ ...filter, status: item.id === 'all' ? undefined : item.id as any })}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                    : isDark
                    ? 'text-gray-400 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 时间范围筛选 */}
      <div className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
          时间范围
        </h3>
        <div className="space-y-3">
          <div>
            <label className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>开始日期</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border transition-all ${
                isDark
                  ? 'bg-gray-900/50 border-gray-700 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>结束日期</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border transition-all ${
                isDark
                  ? 'bg-gray-900/50 border-gray-700 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 批量操作 */}
      {selectedOrders.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              已选择 {selectedOrders.size} 项
            </span>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => onBatchAudit('approved')}
              disabled={isAuditing}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              批量通过
            </button>
            <button
              onClick={() => onBatchAudit('rejected')}
              disabled={isAuditing}
              className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              批量驳回
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ============================================================================
// 子组件 - 商单列表
// ============================================================================

const OrderList: React.FC<{
  orders: OrderAudit[];
  loading: boolean;
  selectedOrder: OrderAudit | null;
  selectedOrders: Set<string>;
  onSelectOrder: (order: OrderAudit) => void;
  onToggleSelect: (orderId: string) => void;
  onSelectAll: () => void;
  isDark: boolean;
}> = ({ orders, loading, selectedOrder, selectedOrders, onSelectOrder, onToggleSelect, onSelectAll, isDark }) => {
  if (loading) {
    return (
      <div className={`col-span-12 lg:col-span-6 rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border p-12`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={`col-span-12 lg:col-span-6 rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden`}>
      {/* 列表头部 */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <button onClick={onSelectAll} className="hover:opacity-70">
            {selectedOrders.size === orders.length && orders.length > 0 ? (
              <CheckSquare className="w-5 h-5 text-blue-500" />
            ) : (
              <Square className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            )}
          </button>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>商单列表</h2>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({orders.length})</span>
        </div>
      </div>

      {/* 列表内容 */}
      <div className="p-4 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
        {orders.length === 0 ? (
          <EmptyState isDark={isDark} />
        ) : (
          orders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrder?.id === order.id}
              isCheckboxSelected={selectedOrders.has(order.id)}
              onSelect={() => onSelectOrder(order)}
              onToggleCheckbox={() => onToggleSelect(order.id)}
              index={index}
              isDark={isDark}
            />
          ))
        )}
      </div>
    </div>
  );
};

const OrderCard: React.FC<{
  order: OrderAudit;
  isSelected: boolean;
  isCheckboxSelected: boolean;
  onSelect: () => void;
  onToggleCheckbox: () => void;
  index: number;
  isDark: boolean;
}> = ({ order, isSelected, isCheckboxSelected, onSelect, onToggleCheckbox, index, isDark }) => {
  const statusConfig = {
    pending: { label: '待审核', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    approved: { label: '已通过', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    rejected: { label: '已驳回', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  };

  const statusCfg = statusConfig[order.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? isDark
            ? 'bg-blue-600/20 border-blue-500/50'
            : 'bg-blue-50 border-blue-300'
          : isDark
          ? 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheckbox();
          }}
          className="mt-1 hover:opacity-70"
        >
          {isCheckboxSelected ? (
            <CheckSquare className="w-5 h-5 text-blue-500" />
          ) : (
            <Square className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusCfg.bgColor} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date(order.created_at).toLocaleDateString('zh-CN')}
            </span>
          </div>

          <h3 className={`font-bold text-base mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {order.title}
          </h3>

          <div className="flex items-center gap-4 text-sm mb-2">
            <div className="flex items-center gap-1">
              <Building2 className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{order.brand_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                ¥{order.budget_min.toLocaleString()}-{order.budget_max.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tag className={`w-3 h-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <div className="flex gap-1">
              {order.tags?.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
    </motion.div>
  );
};

const EmptyState: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <FileText className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
    <h3 className={`text-lg font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>暂无商单</h3>
    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>当前筛选条件下没有商单数据</p>
  </div>
);

// ============================================================================
// 子组件 - 右侧详情与审核面板
// ============================================================================

const RightPanel: React.FC<{
  selectedOrder: OrderAudit | null;
  auditOpinion: string;
  setAuditOpinion: (opinion: string) => void;
  onAudit: (status: 'approved' | 'rejected') => void;
  isAuditing: boolean;
  isDark: boolean;
}> = ({ selectedOrder, auditOpinion, setAuditOpinion, onAudit, isAuditing, isDark }) => {
  if (!selectedOrder) {
    return (
      <div className={`col-span-12 lg:col-span-3 rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border p-12`}>
        <div className="flex flex-col items-center justify-center text-center">
          <Eye className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择商单查看详情</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    pending: { label: '待审核', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    approved: { label: '已通过', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    rejected: { label: '已驳回', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  };

  const statusCfg = statusConfig[selectedOrder.status];

  return (
    <div className={`col-span-12 lg:col-span-3 rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden`}>
      {/* 头部 */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2.5 py-1 text-xs font-medium rounded ${statusCfg.bgColor} ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>
        <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.title}</h3>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedOrder.brand_name}</p>
      </div>

      {/* 详情内容 */}
      <div className="p-5 space-y-4 max-h-[calc(100vh-500px)] overflow-y-auto">
        {/* 基本信息 */}
        <InfoSection title="基本信息" isDark={isDark}>
          <div className="space-y-2">
            <InfoRow label="类型" value={selectedOrder.type} isDark={isDark} />
            <InfoRow label="预算" value={`¥${selectedOrder.budget_min.toLocaleString()}-${selectedOrder.budget_max.toLocaleString()}`} isDark={isDark} />
            <InfoRow label="截止日期" value={new Date(selectedOrder.deadline).toLocaleDateString('zh-CN')} isDark={isDark} />
            <InfoRow label="工期" value={selectedOrder.duration} isDark={isDark} />
            <InfoRow label="地点" value={selectedOrder.location} isDark={isDark} />
            <InfoRow label="难度" value={selectedOrder.difficulty} isDark={isDark} />
            <InfoRow label="最大人数" value={`${selectedOrder.max_applicants}人`} isDark={isDark} />
          </div>
        </InfoSection>

        {/* 任务描述 */}
        <InfoSection title="任务描述" isDark={isDark}>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{selectedOrder.description}</p>
        </InfoSection>

        {/* 任务要求 */}
        <InfoSection title="任务要求" isDark={isDark}>
          <div className="flex flex-wrap gap-2">
            {selectedOrder.requirements.map((req, i) => (
              <span key={i} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {req}
              </span>
            ))}
          </div>
        </InfoSection>

        {/* 标签 */}
        <InfoSection title="标签" isDark={isDark}>
          <div className="flex flex-wrap gap-2">
            {selectedOrder.tags?.map((tag, i) => (
              <span key={i} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                {tag}
              </span>
            ))}
          </div>
        </InfoSection>

        {/* 附件 */}
        {selectedOrder.attachments && selectedOrder.attachments.length > 0 && (
          <InfoSection title="附件" isDark={isDark}>
            <div className="space-y-2">
              {selectedOrder.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  <Paperclip className="w-4 h-4" />
                  附件 {i + 1}
                </a>
              ))}
            </div>
          </InfoSection>
        )}

        {/* 审核意见 */}
        {selectedOrder.audit_opinion && (
          <InfoSection title="审核意见" isDark={isDark}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{selectedOrder.audit_opinion}</p>
          </InfoSection>
        )}
      </div>

      {/* 审核操作 */}
      {selectedOrder.status === 'pending' && (
        <div className={`p-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="space-y-3">
            <textarea
              value={auditOpinion}
              onChange={(e) => setAuditOpinion(e.target.value)}
              placeholder="填写审核意见（可选）..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border transition-all resize-none ${
                isDark
                  ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              }`}
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onAudit('rejected')}
                disabled={isAuditing}
                className="py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <XCircle className="w-5 h-5 inline mr-2" />
                驳回
              </button>
              <button
                onClick={() => onAudit('approved')}
                disabled={isAuditing}
                className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 inline mr-2" />
                通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoSection: React.FC<{ title: string; children: React.ReactNode; isDark: boolean }> = ({ title, children, isDark }) => (
  <div>
    <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{title}</h4>
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value: string; isDark: boolean }> = ({ label, value, isDark }) => (
  <div className="flex justify-between text-sm">
    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{label}</span>
    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{value}</span>
  </div>
);

export default OrderAuditPage;
