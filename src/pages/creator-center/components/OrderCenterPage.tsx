import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  TrendingUp,
  DollarSign,
  MousePointer2,
  ShoppingCart,
  BarChart3,
  ExternalLink,
  Link as LinkIcon,
  X,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import * as orderExecutionService from '@/services/orderExecutionService';
import type { OrderExecution, OrderExecutionStats, ProductLink } from '@/services/orderExecutionService';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const OrderCenterPage: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState<OrderExecution[]>([]);
  const [stats, setStats] = useState<OrderExecutionStats>({
    totalOrders: 0,
    activeOrders: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
  });
  const [selectedExecution, setSelectedExecution] = useState<OrderExecution | null>(null);
  const [showAddLink, setShowAddLink] = useState(false);
  const [productLinks, setProductLinks] = useState<ProductLink[]>([]);

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [executionsData, statsData] = await Promise.all([
        orderExecutionService.getCreatorOrderExecutions(user.id),
        orderExecutionService.getOrderExecutionStats(user.id),
      ]);
      setExecutions(executionsData);
      setStats(statsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 实时更新
  useEffect(() => {
    const unsubscribe = orderExecutionService.subscribeToOrderExecutions(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  return (
    <div className="min-h-screen pb-8">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-8 ${isDark ? 'bg-gradient-to-r from-emerald-900/80 via-teal-900/80 to-cyan-900/80' : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600'} rounded-2xl p-6 relative overflow-hidden`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white mb-2">商单中心</h1>
          <p className="text-white/70">管理您的商单执行情况，追踪收益数据</p>
        </div>
      </motion.div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Package}
          label="进行中商单"
          value={stats.activeOrders}
          isDark={isDark}
          color="blue"
          trend="+2"
        />
        <StatCard
          icon={MousePointer2}
          label="总点击数"
          value={stats.totalClicks}
          isDark={isDark}
          color="purple"
          trend="+12.5%"
        />
        <StatCard
          icon={ShoppingCart}
          label="成交订单"
          value={stats.totalConversions}
          isDark={isDark}
          color="amber"
          trend="+8.3%"
        />
        <StatCard
          icon={DollarSign}
          label="累计收益"
          value={`¥${stats.totalEarnings.toLocaleString()}`}
          isDark={isDark}
          color="emerald"
          trend="+15.2%"
        />
      </div>

      {/* 主要内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 商单列表 */}
        <div className="lg:col-span-2">
          <div className={`rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>我的商单</h2>
              <button
                onClick={loadData}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <TrendingUp className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
              </div>
            ) : executions.length === 0 ? (
              <div className="p-12 text-center">
                <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>暂无商单数据</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {executions.map((execution, index) => (
                  <ExecutionCard
                    key={execution.id}
                    execution={execution}
                    isSelected={selectedExecution?.id === execution.id}
                    onSelect={() => setSelectedExecution(execution)}
                    index={index}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧 - 详情面板 */}
        <div className="lg:col-span-1">
          {selectedExecution ? (
            <ExecutionDetail
              execution={selectedExecution}
              isDark={isDark}
              onClose={() => setSelectedExecution(null)}
            />
          ) : (
            <div className={`rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border p-12`}>
              <div className="flex flex-col items-center justify-center text-center">
                <BarChart3 className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择商单查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 子组件 - 统计卡片
// ============================================================================

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number | string;
  isDark: boolean;
  color: 'blue' | 'purple' | 'amber' | 'emerald';
  trend?: string;
}> = ({ icon: Icon, label, value, isDark, color, trend }) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 rounded-bl-full -mr-4 -mt-4" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <span className="flex items-center text-xs font-medium text-emerald-500">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              {trend}
            </span>
          )}
        </div>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
        <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 子组件 - 商单卡片
// ============================================================================

const ExecutionCard: React.FC<{
  execution: OrderExecution;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  isDark: boolean;
}> = ({ execution, isSelected, onSelect, index, isDark }) => {
  const statusConfig = {
    active: { label: '进行中', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    paused: { label: '已暂停', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    ended: { label: '已结束', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  };

  const statusCfg = statusConfig[execution.status];

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
      <div className="flex items-start gap-4">
        {execution.product_image ? (
          <img
            src={execution.product_image}
            alt={execution.product_name}
            className="w-20 h-20 rounded-lg object-cover"
          />
        ) : (
          <div className={`w-20 h-20 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
            <Package className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusCfg.bgColor} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {new Date(execution.created_at).toLocaleDateString('zh-CN')}
            </span>
          </div>

          <h3 className={`font-bold text-base mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {execution.order_title}
          </h3>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            品牌：{execution.brand_name} | 产品：{execution.product_name}
          </p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <MousePointer2 className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{execution.click_count} 点击</span>
            </div>
            <div className="flex items-center gap-1">
              <ShoppingCart className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{execution.conversion_count} 成交</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-500 font-medium">¥{execution.total_earnings.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <ExternalLink className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>
    </motion.div>
  );
};

// ============================================================================
// 子组件 - 详情面板
// ============================================================================

const ExecutionDetail: React.FC<{
  execution: OrderExecution;
  isDark: boolean;
  onClose: () => void;
}> = ({ execution, isDark, onClose }) => {
  // 模拟图表数据
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
    clicks: Math.floor(Math.random() * 100) + 20,
    conversions: Math.floor(Math.random() * 20) + 5,
    earnings: Math.floor(Math.random() * 500) + 100,
  }));

  return (
    <div className={`rounded-2xl ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden`}>
      {/* 头部 */}
      <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>商单详情</h3>
        <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 内容 */}
      <div className="p-5 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* 产品信息 */}
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>产品信息</h4>
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{execution.product_name}</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>品牌：{execution.brand_name}</p>
            <a
              href={execution.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-500 mt-2 hover:underline"
            >
              <LinkIcon className="w-4 h-4" />
              查看产品链接
            </a>
          </div>
        </div>

        {/* 数据统计 */}
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>数据统计</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>点击数</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{execution.click_count}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>成交数</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{execution.conversion_count}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>销售额</p>
              <p className={`text-lg font-bold text-emerald-500`}>¥{execution.total_sales.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>佣金比例</p>
              <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{execution.commission_rate}%</p>
            </div>
          </div>
        </div>

        {/* 趋势图表 */}
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>近 7 日趋势</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="date" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
            编辑链接
          </button>
          <button className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors">
            分享推广
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCenterPage;
